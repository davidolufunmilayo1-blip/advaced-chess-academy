const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../lib/chess-core'),S=require('../chess-extras/study-core'),openings=require('../chess-extras/openings');
test('FEN round trips and validates move rights and king safety',()=>{
  const standard='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  assert.equal(S.toFEN(S.parseFEN(standard).state),standard);
  assert.equal(S.parseFEN('7k/8/8/3pP3/8/8/8/6K1 w - d6 0 27').fullmove,27);
  for(const fen of ['7k/8/8/8/8/8/8/6K1 w K - 0 1','7k/8/8/8/8/8/8/6K1 w - d6 0 1','7k/6K1/8/8/8/8/8/8 w - - 0 1','P6k/8/8/8/8/8/8/6K1 w - - 0 1','7k/8/8/8/8/8/8/6K1 w - - NaN 1'])assert.throws(()=>S.parseFEN(fen),fen);
});
test('every opening is legal and survives SAN PGN round trip',()=>{
  for(const opening of openings){const states=[C.initial()],notation=[],uci=[];for(const text of opening.line){const state=states.at(-1),move=C.moveFromUCI(state,text);assert.ok(move,opening.name+' '+text);const next=C.apply(state,move);notation.push(C.completeNotation(state,move,next));states.push(next);uci.push(text)}const parsed=S.parsePGN(S.exportPGN({states,notation,uci,fullmove:1,result:'*'},opening.name));assert.deepEqual(parsed.uci,opening.line);assert.deepEqual(parsed.states.at(-1),states.at(-1));}
});
test('PGN handles comments, variations, annotations, castling and mate',()=>{
  const parsed=S.parsePGN('[Event "Test"]\n1. e4 {a note} e5 2. Nf3 (2. Bc4 Nf6 (2... Bc5)) Nc6 $1 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 *');
  assert.equal(parsed.notation[8],'O-O');
  assert.equal(parsed.title,'Test');
  const mate=S.parsePGN('1. f3 e5 2. g4 Qh4# 0-1');assert.equal(mate.result,'0-1');assert.equal(C.getOutcome(mate.states.at(-1)).title,'Black wins');
  assert.throws(()=>S.parsePGN('1. e4 e4 *'),/Cannot read move/);
  assert.throws(()=>S.parsePGN('1. e4 (1. d4'),/Unbalanced/);
  assert.throws(()=>S.parsePGN('1. e4 * 1. d4 *'),/one game/);
});
test('PGN preserves a custom starting position, black move number, and underpromotion',()=>{
  const imported=S.parsePGN('[SetUp "1"]\n[FEN "7k/8/8/8/8/8/p7/7K b - - 0 42"]\n42... a1=N *');
  assert.equal(imported.uci[0],'a2a1n');assert.equal(imported.fullmove,42);
  const exported=S.exportPGN(imported,'Custom study');assert.match(exported,/42\.\.\. a1=N/);assert.deepEqual(S.parsePGN(exported).uci,imported.uci);
});
test('candidate search returns legal moves and finds mate in one',()=>{
  for(const candidate of S.suggestions(C.initial()))assert.ok(C.resolveMove(C.initial(),candidate.move));
  const position=S.parseFEN('6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1').state;
  const best=S.suggestions(position)[0];assert.equal(best.san,'Re8#');assert.equal(best.score,100000);
});
