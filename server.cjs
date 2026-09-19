const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const chess = require('./lib/chess-core.js');
const { createDiscovery } = require('./lib/discovery.cjs');
const { createCommunity } = require('./lib/community.cjs');
const { createTournaments } = require('./lib/tournaments.cjs');

function createChessServer({ dataDir = process.env.DATA_DIR || path.join(__dirname, '.data'), now = Date.now, moderatorKey = process.env.COMMUNITY_MODERATOR_KEY || '', publicSiteURL = process.env.PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || '' } = {}) {
  fs.mkdirSync(dataDir, { recursive: true });
  const discovery = createDiscovery(publicSiteURL);
  const community = createCommunity({ dataDir, now, moderatorKey });
  const file = path.join(dataDir, 'rooms.json');
  let rooms = new Map();
  try { rooms = new Map(JSON.parse(fs.readFileSync(file, 'utf8'))); } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Cannot read saved rooms: ' + error.message);
  }
  const rates = new Map();
  const random = () => crypto.randomBytes(24).toString('hex');
  const hash = value => crypto.createHash('sha256').update(value).digest('hex');
  const cleanName = name => String(name || 'Guest').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 24) || 'Guest';
  let dirty = false;
  function persist() {
    if (!dirty) return;
    fs.writeFileSync(file + '.tmp', JSON.stringify([...rooms]), { mode: 0o600 });
    fs.renameSync(file + '.tmp', file);
    dirty = false;
  }
  function changed(room) { room.version++; room.updatedAt = now(); dirty = true; persist(); }
  function expireClock(room) {
    if (room.result || !room.players.b || !room.started) { room.lastTick = now(); return; }
    const side = room.state.turn;
    room.remaining[side] = Math.max(0, room.remaining[side] - (now() - room.lastTick));
    room.lastTick = now();
    dirty = true;
    if (!room.remaining[side]) {
      const winner = chess.other(side);
      const material = room.state.board.some(p => chess.color(p) === winner && p.toLowerCase() !== 'k');
      room.result = material ? { title: (winner === 'w' ? 'White' : 'Black') + ' wins on time', detail: 'The clock ran out.' } : { title: 'Draw on time', detail: 'The opponent has only a king.' };
      changed(room);
    }
  }
  function player(room, req) {
    const token = req.headers.authorization?.replace(/^Bearer /, '') || '';
    return ['w', 'b'].find(side => room.players[side]?.key === hash(token));
  }
  function snapshot(room, side) {
    expireClock(room);
    return { id: room.id, version: room.version, state: room.state, past: room.past, notation: room.notation,
      remaining: room.remaining, time: room.time, result: room.result, started: room.started, side,
      waiting: !room.players.b, queue: room.queue, drawOffer: room.drawOffer,
      players: Object.fromEntries(Object.entries(room.players).map(([s, p]) => [s, { name: p.name, connected: now() - p.seen < 15000 }])),
      messages: room.messages };
  }
  function createRoom(name, minutes, queue = false) {
    if (rooms.size >= 1000) throw Object.assign(new Error('The server is full. Try again later.'), { status: 503 });
    const token = random(), id = crypto.randomBytes(6).toString('hex');
    const room = { id, state: chess.initial(), past: [], notation: [], players: { w: { name: cleanName(name), key: hash(token), seen: now() } },
      time: minutes, remaining: { w: minutes * 1000, b: minutes * 1000 }, version: 0, result: null, started: false,
      lastTick: now(), updatedAt: now(), queue, drawOffer: null, messages: [] };
    rooms.set(id, room); changed(room);
    return { token, ...snapshot(room, 'w') };
  }
  function join(room, name) {
    if (room.players.b || room.result) throw Object.assign(new Error('This game already has two players or has ended.'), { status: 409 });
    const token = random();
    room.players.b = { name: cleanName(name), key: hash(token), seen: now() };
    room.lastTick = now(); changed(room);
    return { token, ...snapshot(room, 'b') };
  }
  function json(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(body));
  }
  async function readBody(req) {
    let body = '';
    for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 8192) throw Object.assign(new Error('Request too large'), { status: 413 }); }
    try { return JSON.parse(body || '{}'); } catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
  }
  const assets = { '/': ['david.html', 'text/html'], '/david.html': ['david.html', 'text/html'], '/app.js': ['public/app.js', 'text/javascript'], '/app.css': ['public/app.css', 'text/css'], '/chess-core.js': ['lib/chess-core.js', 'text/javascript'], '/training.js': ['public/training.js', 'text/javascript'] };
  for (const [name,type] of [['index.html','text/html'],['study.css','text/css'],['study.js','text/javascript'],['study-core.js','text/javascript'],['openings.js','text/javascript'],['watch.html','text/html'],['watch.css','text/css'],['watch.js','text/javascript'],['live-board.js','text/javascript'],['community.html','text/html'],['community.css','text/css'],['community.js','text/javascript']]) assets['/chess-extras/'+name]=['chess-extras/'+name,type];
  const tournaments = createTournaments({dataDir,now,ensureCapacity(count){if(rooms.size+count>1000)throw Object.assign(Error('Not enough room for this tournament. Try again later.'),{status:503})},createGame(white,black,time){const a=createRoom(white,time),room=rooms.get(a.id),b=join(room,black);room.tournament=true;changed(room);return {id:a.id,whiteToken:a.token,blackToken:b.token}},getGame(id){const room=rooms.get(id);if(!room)return null;expireClock(room);return room.result}});
  assets['/club-features.js'] = ['public/club-features.js', 'text/javascript'];
  assets['/practice-clock.js'] = ['lib/practice-clock.js', 'text/javascript'];
  assets['/about.html'] = ['public/about.html', 'text/html'];
  assets['/club-tools.js'] = ['public/club-tools.js', 'text/javascript'];
  assets['/queen.svg'] = ['public/queen.svg', 'image/svg+xml'];
  assets['/favicon.ico'] = ['public/queen.svg', 'image/svg+xml'];
  assets['/club-theme.css'] = ['public/club-theme.css', 'text/css'];
  assets['/academy-lab.js'] = ['public/academy-lab.js', 'text/javascript'];
  assets['/club-shell.js'] = ['public/club-shell.js', 'text/javascript'];
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (['/robots.txt','/sitemap.xml'].includes(url.pathname) && ['GET','HEAD'].includes(req.method)) {
        const body=url.pathname==='/robots.txt'?discovery.robots():discovery.sitemap();
        if(!body)return json(res,404,{error:'Set PUBLIC_SITE_URL to enable the public sitemap.'});
        res.writeHead(200,{'Content-Type':url.pathname==='/robots.txt'?'text/plain; charset=utf-8':'application/xml; charset=utf-8','Cache-Control':'no-cache'});return res.end(req.method==='HEAD'?undefined:body);
      }
      if (!url.pathname.startsWith('/api/')) {
        const asset = assets[url.pathname.replace(/^\/public\//, '/').replace(/^\/lib\//, '/')];
        if (!asset || !['GET', 'HEAD'].includes(req.method)) return json(res, 404, { error: 'Not found' });
        res.writeHead(200, { 'Content-Type': asset[1] + '; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'Cache-Control': 'no-cache' });
        const content=req.method==='HEAD'?undefined:fs.readFileSync(path.join(__dirname,asset[0]));
        return res.end(asset[1]==='text/html'&&content?discovery.html(content.toString(),url.pathname):content);
      }
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return json(res, 403, { error: 'Cross-origin requests are not allowed.' });
      const ip = req.socket.remoteAddress;
      const rate = rates.get(ip) || { at: now(), count: 0 };
      if (now() - rate.at > 60000) { rate.at = now(); rate.count = 0; }
      rate.count++; rates.set(ip, rate);
      if (rate.count > 400) return json(res, 429, { error: 'Too many requests. Wait a moment.' });
      if (url.pathname === '/api/health' && req.method === 'GET') return json(res, 200, { ok: true });
      const body = req.method === 'POST' ? await readBody(req) : {};
      if (url.pathname.startsWith('/api/community/')) {
        const result = community.handle(req, url, body);
        return json(res, result.status, result.body);
      }
      if (url.pathname.startsWith('/api/tournaments')) {
        const result = tournaments.handle(req,url,body);
        return json(res,result.status,result.body);
      }
      if (['/api/rooms', '/api/queue'].includes(url.pathname) && req.method === 'POST') {
        const time = Number(body.time || 600);
        if (![180, 300, 600, 900].includes(time)) return json(res, 400, { error: 'Choose a supported time control.' });
        if (url.pathname === '/api/queue') {
          const match = [...rooms.values()].find(r => r.queue && !r.players.b && !r.result && r.time === time && now() - r.players.w.seen < 15000);
          if (match) return json(res, 200, join(match, body.name));
        }
        return json(res, 201, createRoom(body.name, time, url.pathname === '/api/queue'));
      }
      const route = url.pathname.match(/^\/api\/rooms\/([a-f0-9]{12})(?:\/(join|move|resign|draw|chat|cancel))?$/);
      if (!route) return json(res, 404, { error: 'Not found' });
      const room = rooms.get(route[1]), action = route[2];
      if (!room) return json(res, 404, { error: 'Game not found or expired.' });
      expireClock(room);
      if (action === 'join' && req.method === 'POST') return json(res, 200, join(room, body.name));
      const side = player(room, req);
      if (!side) return json(res, 401, { error: 'Your player session is not valid for this game.' });
      room.players[side].seen = now();
      if (!action && req.method === 'GET') return json(res, 200, snapshot(room, side));
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
      if (action === 'chat') {
        const text = String(body.text || '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 200);
        if (!text) return json(res, 400, { error: 'Write a message first.' });
        if (room.messages.some(m => m.side === side && now() - m.at < 1000)) return json(res, 429, { error: 'Wait a second before sending another message.' });
        room.messages.push({ side, text, at: now() }); room.messages = room.messages.slice(-50); changed(room);
      } else if (action === 'cancel' && !room.players.b) {
        room.result = { title: 'Game cancelled', detail: 'The waiting room was closed.' }; changed(room);
      } else {
        if (room.result || !room.players.b) return json(res, 409, { error: room.result ? 'This game has ended.' : 'Waiting for your opponent.' });
        if (action === 'move') {
          if (side !== room.state.turn) return json(res, 409, { error: 'It is not your turn.' });
          if (body.version !== room.version) return json(res, 409, { error: 'The game changed. Your board will refresh.' });
          const move = chess.resolveMove(room.state, body);
          if (!move) return json(res, 400, { error: 'That move is not legal.' });
          const next = chess.apply(room.state, move);
          room.notation.push(chess.completeNotation(room.state, move, next)); room.past.push(room.state); room.state = next;
          room.started = true; room.lastTick = now();
          if (room.drawOffer === side) room.drawOffer = null;
          room.result = chess.getOutcome(room.state, room.past); changed(room);
        } else if (action === 'resign') {
          room.result = { title: (side === 'w' ? 'Black' : 'White') + ' wins', detail: 'Game ended by resignation.' }; changed(room);
        } else if (action === 'draw') {
          if (body.accept && room.drawOffer === chess.other(side)) room.result = { title: 'Draw by agreement', detail: 'Both players agreed to a draw.' };
          else if (body.decline) room.drawOffer = null;
          else room.drawOffer = side;
          changed(room);
        } else return json(res, 400, { error: 'Unknown game action.' });
      }
      return json(res, 200, snapshot(room, side));
    } catch (error) { json(res, error.status || 500, { error: error.status ? error.message : 'The server could not complete that request.' }); }
  });
  const timer = setInterval(() => {
    for (const [id, room] of rooms) {
      expireClock(room);
      if (!room.tournament && now() - room.updatedAt > 86400000) { rooms.delete(id); dirty = true; }
    }
    for (const [ip, rate] of rates) if (now() - rate.at > 60000) rates.delete(ip);
    persist();
  }, 1000);
  timer.unref();
  server.on('close', () => { clearInterval(timer); persist(); });
  return server;
}
if (require.main === module) {
  const port = Number(process.env.PORT || 8001);
  const server = createChessServer();
  server.listen(port, process.env.HOST || '0.0.0.0', () => console.log(`Advaced Chess Academy ♛ is running at http://localhost:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
module.exports = { createChessServer };
