const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function createCommunity({ dataDir, now = Date.now, moderatorKey = '' }) {
  if (moderatorKey && moderatorKey.length < 24) throw Error('COMMUNITY_MODERATOR_KEY must contain at least 24 characters.');
  if (!moderatorKey) {
    const keyFile = path.join(dataDir, 'community-moderator-key');
    try { moderatorKey = fs.readFileSync(keyFile, 'utf8').trim(); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      moderatorKey = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(keyFile, moderatorKey + '\n', { mode: 0o600, flag: 'wx' });
    }
    if (moderatorKey.length < 24) throw Error('The saved community moderator key is invalid.');
  }
  const file = path.join(dataDir, 'community.json');
  let data = { members: {}, posts: [] };
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const categories = ['questions', 'ideas', 'celebrations'];
  const hash = value => crypto.createHash('sha256').update(value).digest('hex');
  const id = () => crypto.randomBytes(8).toString('hex');
  const failure = (status, message) => { throw Object.assign(new Error(message), { status }); };
  function text(value, max, label, min = 1) {
    if (typeof value !== 'string') failure(400, label + ' is required.');
    const clean = value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '').trim();
    if (clean.length < min || clean.length > max) failure(400, `${label} must have ${min}–${max} characters.`);
    return clean;
  }
  function save() { fs.writeFileSync(file + '.tmp', JSON.stringify(data), { mode: 0o600 }); fs.renameSync(file + '.tmp', file); }
  function viewer(req, required = false) {
    const token = req.headers.authorization?.replace(/^Bearer /, '') || '';
    const member = data.members[hash(token)];
    if (required && !member) failure(401, 'Choose a nickname to join the conversation.');
    return member || null;
  }
  function throttle(member) { if (member.lastWrite && now() - member.lastWrite < 3000) failure(429, 'Give everyone a moment. Try again in a few seconds.'); member.lastWrite = now(); }
  function isModerator(req) {
    const supplied = req.headers['x-community-moderator'];
    return moderatorKey.length >= 24 && typeof supplied === 'string' && crypto.timingSafeEqual(Buffer.from(hash(supplied)), Buffer.from(hash(moderatorKey)));
  }
  function replyView(reply, member) { return { id: reply.id, name: reply.name, text: reply.text, createdAt: reply.createdAt, own: reply.author === member?.id }; }
  function postView(post, member, detailed = false) {
    return { id: post.id, category: post.category, title: post.title, text: post.text, name: post.name, createdAt: post.createdAt, updatedAt: post.updatedAt,
      own: post.author === member?.id, likes: post.likes.length, liked: post.likes.includes(member?.id), replyCount: post.replies.length,
      ...(detailed ? { replies: post.replies.map(r => replyView(r, member)) } : {}) };
  }
  const sessionRates = new Map();
  function handle(req, url, body) {
    const route = url.pathname.slice('/api/community'.length), method = req.method;
    const member = viewer(req);
    if (route === '/session' && method === 'POST') {
      const name = text(body.name, 24, 'Nickname', 2);
      if (member) { member.name = name; save(); return { status: 200, body: { name } }; }
      if (Object.keys(data.members).length >= 5000) failure(503, 'The community is full. Please contact the site owner.');
      const ip = req.socket.remoteAddress || 'local', rate = sessionRates.get(ip) || { count: 0, at: now() };
      if (now() - rate.at > 60000) { rate.count = 0; rate.at = now(); }
      if (++rate.count > 10) failure(429, 'Too many new nicknames. Try again in a minute.');
      sessionRates.set(ip, rate);
      for (const [key, entry] of sessionRates) if (now() - entry.at > 60000) sessionRates.delete(key);
      const token = crypto.randomBytes(24).toString('hex');
      data.members[hash(token)] = { id: id(), name, createdAt: now(), lastWrite: 0 }; save();
      return { status: 201, body: { token, name } };
    }
    if (route === '/me' && method === 'GET') return { status: 200, body: member ? { name: member.name } : { name: null } };
    if (route === '/posts' && method === 'GET') {
      const category = url.searchParams.get('category') || 'all', search = (url.searchParams.get('q') || '').toLowerCase().slice(0, 100), sort = url.searchParams.get('sort') || 'newest';
      let posts = data.posts.filter(p => !p.hidden);
      const stats = { posts: posts.length, replies: posts.reduce((n, p) => n + p.replies.length, 0) };
      posts = posts.filter(p => (category === 'all' || p.category === category) && (!search || (p.title + ' ' + p.text + ' ' + p.name).toLowerCase().includes(search)) && (sort !== 'mine' || p.author === member?.id) && (sort !== 'unanswered' || p.replies.length === 0));
      posts.sort((a, b) => sort === 'popular' ? b.likes.length - a.likes.length || b.createdAt - a.createdAt : b.createdAt - a.createdAt);
      const page = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get('page'), 10) || 1));
      return { status: 200, body: { posts: posts.slice((page - 1) * 20, page * 20).map(p => postView(p, member)), total: posts.length, page, pages: Math.max(1, Math.ceil(posts.length / 20)), stats } };
    }
    if (route === '/posts' && method === 'POST') {
      const author = viewer(req, true);
      if (!categories.includes(body.category)) failure(400, 'Choose a community category.');
      const title = text(body.title, 100, 'Title', 4), content = text(body.text, 1500, 'Post', 4);
      if (data.posts.length >= 500) failure(503, 'The community board is full. Please contact the site owner.');
      throttle(author);
      const post = { id: id(), author: author.id, name: author.name, category: body.category, title, text: content, createdAt: now(), updatedAt: now(), likes: [], replies: [], reports: [], hidden: false };
      data.posts.unshift(post); save(); return { status: 201, body: postView(post, author, true) };
    }
    if (route === '/moderation') {
      if (!isModerator(req)) failure(403, 'Moderator access is not available with this key.');
      if (method === 'GET') return { status: 200, body: { posts: data.posts.filter(p => p.hidden).map(p => ({ ...postView(p, null, true), reports: p.reports.map(r => ({ reason: r.reason, at: r.at })) })) } };
      if (method === 'POST') {
        const post = data.posts.find(p => p.id === body.id);
        if (!post) failure(404, 'Post not found.');
        if (body.action === 'restore') { post.hidden = false; post.reports = []; }
        else if (body.action === 'remove') data.posts = data.posts.filter(p => p.id !== body.id);
        else failure(400, 'Choose restore or remove.');
        save(); return { status: 200, body: { ok: true } };
      }
      failure(405, 'Method not allowed.');
    }
    const match = route.match(/^\/posts\/([a-f0-9]{16})(?:\/(reply|like|report|delete)(?:\/([a-f0-9]{16}))?)?$/);
    if (!match) failure(404, 'Community page not found.');
    const post = data.posts.find(p => p.id === match[1]), action = match[2], replyId = match[3];
    if (!post || (post.hidden && !(action === 'delete' && post.author === member?.id))) failure(404, 'This conversation is no longer available.');
    if (!action && method === 'GET') return { status: 200, body: postView(post, member, true) };
    if (method !== 'POST') failure(405, 'Method not allowed.');
    const author = viewer(req, true);
    if (action === 'reply' && !replyId) {
      const content = text(body.text, 700, 'Reply');
      if (post.replies.length >= 50) failure(409, 'This conversation has reached its reply limit. Start a new discussion.');
      throttle(author); post.replies.push({ id: id(), author: author.id, name: author.name, text: content, createdAt: now() }); post.updatedAt = now();
    } else if (action === 'like' && !replyId) {
      if (typeof body.liked !== 'boolean') failure(400, 'Choose whether to like this post.');
      post.likes = post.likes.filter(id => id !== author.id); if (body.liked) post.likes.push(author.id);
    } else if (action === 'report' && !replyId) {
      const reason = text(body.reason, 300, 'Report reason', 4);
      post.reports.push({ author: author.id, reason, at: now() }); post.hidden = true;
      save(); return { status: 200, body: { hidden: true } };
    } else if (action === 'delete') {
      if (replyId) { const reply = post.replies.find(r => r.id === replyId); if (!reply) failure(404, 'Reply not found.'); if (reply.author !== author.id) failure(403, 'You can only delete your own replies.'); post.replies = post.replies.filter(r => r.id !== replyId); }
      else { if (post.author !== author.id) failure(403, 'You can only delete your own posts.'); data.posts = data.posts.filter(p => p.id !== post.id); save(); return { status: 200, body: { deleted: true } }; }
    } else failure(400, 'Unknown community action.');
    save(); return { status: 200, body: postView(post, author, true) };
  }
  return { handle };
}
module.exports = { createCommunity };
