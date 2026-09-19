const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../lib/chess-core.js'),S=require('../chess-extras/study-core.js');
test('full game review rates every legal move and spots a mating blunder',()=>{
 const game=S.parsePGN('1. f3 e5 2. g4 Qh4#'),results=[];
 for(let i=0;i<game.notation.length;i++){const result=S.analyseMove(game.states[i],game.states[i+1],{depth:2,nodeLimit:8000});results.push(result);assert.ok(result.depth>=1);assert.ok(C.moveFromUCI(game.states[i],result.best));assert.ok(result.accuracy>=0&&result.accuracy<=100);assert.equal(result.side,game.states[i].turn);assert.ok(result.loss>=0)}
 assert.equal(results[2].label,'Blunder');assert.ok(results[2].score<-29900);assert.equal(results[3].label,'Best');assert.equal(results[3].loss,0);assert.equal(results[3].accuracy,100);
});
test('review finds played castling, en passant and underpromotion moves',()=>{
 for(const [fen,uci] of [['4k3/8/8/8/8/8/8/4K2R w K - 0 1','e1g1'],['7k/8/8/3pP3/8/8/8/6K1 w - d6 0 1','e5d6'],['7k/P7/6K1/8/8/8/8/8 w - - 0 1','a7a8n']]){
 const before=C.fromFEN(fen),after=C.apply(before,C.moveFromUCI(before,uci)),original=JSON.stringify(before);const result=S.analyseMove(before,after,{depth:1,nodeLimit:2000});assert.equal(result.played,uci);assert.equal(JSON.stringify(before),original);
 }
 assert.throws(()=>S.analyseMove(C.initial(),C.initial()),/legal move/);
});
test('review labels have explicit loss thresholds and forced moves',()=>{
 assert.equal(S.classifyMove(0,100,100),'Best');assert.equal(S.classifyMove(15,100,85),'Excellent');assert.equal(S.classifyMove(50,100,50),'Good');assert.equal(S.classifyMove(100,100,0),'Inaccuracy');assert.equal(S.classifyMove(200,100,-100),'Mistake');assert.equal(S.classifyMove(300,100,-200),'Blunder');assert.equal(S.classifyMove(0,-29999,-29999,true),'Forced');assert.equal(S.classifyMove(29000,29999,999),'Missed mate');
});
