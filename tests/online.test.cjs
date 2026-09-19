const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createChessServer } = require('../server.cjs');
const chess = require('../lib/chess-core');
const training = require('../public/training');

test('every authored training solution is legal, and every promised mate is checkmate', () => {
  for (const item of [...training.puzzles, ...training.lessons]) {
    let state = chess.fromFEN(item.fen);
    assert.equal(chess.check(state, chess.other(state.turn)), false, item.id + ': opponent must not start in check');
    for (const uci of item.line || item.moves) {
      const move = chess.moveFromUCI(state, uci);
      assert.ok(move, item.id + ': ' + uci);
      state = chess.apply(state, move);
    }
    if (item.theme === 'Checkmate' || item.id === 'promotion') {
      assert.ok(chess.check(state, state.turn), item.id);
      assert.equal(chess.allMoves(state).length, 0, item.id);
    }
  }
});

test('two clients: join, authentication, authoritative moves, chat, draw, restart recovery, queue, and timeout', async t => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chess-test-'));
  let time = Date.now();
  let server = createChessServer({ dataDir, now: () => time });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let base = 'http://127.0.0.1:' + server.address().port;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); fs.rmSync(dataDir, { recursive: true, force: true }); });
  async function request(url, body, token, status = 200, headers = {}) {
    const response = await fetch(base + url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json();
    assert.equal(response.status, status, JSON.stringify(data));
    return data;
  }
  const white = await request('/api/rooms', { name: 'White guest', time: 180 }, null, 201);
  assert.ok(white.token);
  assert.equal(JSON.stringify(white).includes('"key"'), false);
  await request('/api/rooms/'+white.id+'/move', { from:52,to:36,version:0 }, white.token, 409);
  const black = await request('/api/rooms/'+white.id+'/join', { name: 'Black guest' });
  assert.equal(black.side, 'b');
  await request('/api/rooms/'+white.id+'/join', { name: 'Third guest' }, null, 409);
  await request('/api/rooms/'+white.id, undefined, 'wrong-token', 401);
  await request('/api/rooms/'+white.id+'/move', { from:12,to:28,version:black.version }, black.token, 409);
  await request('/api/rooms/'+white.id+'/move', { from:52,to:20,version:black.version }, white.token, 400);
  await request('/api/rooms/'+white.id+'/move', { from:52,to:36,version:-1 }, white.token, 409);
  const move1 = await request('/api/rooms/'+white.id+'/move', { from:52,to:36,version:black.version }, white.token);
  assert.equal(move1.state.board[36], 'P'); assert.equal(move1.notation[0], 'e4');
  time += 1000;
  const move2 = await request('/api/rooms/'+white.id+'/move', { from:12,to:28,version:move1.version }, black.token);
  assert.equal(move2.remaining.b, 179000);
  const observed = await request('/api/rooms/'+white.id, undefined, white.token);
  assert.deepEqual(observed.state, move2.state);
  const chat = await request('/api/rooms/'+white.id+'/chat', { text: '<img src=x onerror=alert(1)>' }, black.token);
  assert.equal(chat.messages[0].text, '<img src=x onerror=alert(1)>');
  await request('/api/rooms/'+white.id+'/draw', {}, white.token);
  const drawn = await request('/api/rooms/'+white.id+'/draw', { accept: true }, black.token);
  assert.equal(drawn.result.title, 'Draw by agreement');
  await request('/api/rooms/'+white.id+'/move', { from:62,to:45,version:drawn.version }, white.token, 409);
  await request('/api/rooms', {}, null, 403, { Origin: 'https://unrelated.example' });
  const privateFile = await fetch(base+'/.data/rooms.json'); assert.equal(privateFile.status, 404);
  for (const asset of ['/', '/public/app.js', '/public/app.css', '/lib/chess-core.js', '/public/training.js']) assert.equal((await fetch(base+asset)).status, 200, asset);
  await new Promise(resolve => server.close(resolve));
  server = createChessServer({ dataDir, now: () => time });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
  const recovered = await request('/api/rooms/'+white.id, undefined, white.token);
  assert.equal(recovered.result.title, 'Draw by agreement');
  const first = await request('/api/queue', { name: 'Queued A', time: 300 }, null, 201);
  const second = await request('/api/queue', { name: 'Queued B', time: 300 });
  assert.equal(first.id, second.id);
  const started = await request('/api/rooms/'+first.id+'/move', { from:52,to:36,version:second.version }, first.token);
  assert.equal(started.started, true);
  time += 300001;
  const flagged = await request('/api/rooms/'+first.id, undefined, second.token);
  assert.equal(flagged.result.title, 'White wins on time');
  const waiting = await request('/api/queue', { name: 'Cancel', time: 300 }, null, 201);
  await request('/api/rooms/'+waiting.id+'/cancel', {}, waiting.token);
  await request('/api/rooms/'+waiting.id+'/join', {}, null, 409);
});
