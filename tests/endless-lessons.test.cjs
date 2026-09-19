const {test}=require('node:test'),assert=require('node:assert/strict');
const core=require('../lib/chess-core.js'),generator=require('../public/training.js').EndlessLessons;
function seeded(n){return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
for(const level of ['easy','medium','hard'])test('endless lessons '+level+': all six pieces have legal, fresh exercises',async()=>{
  const random=seeded(481),seen=[];
  for(const topic of ['r','b','n','p','q','k'])for(let n=0;n<12;n++){
    const item=await generator.generate(core,level,topic,seen,()=>false,random);assert.ok(!seen.includes(item.fen));seen.push(item.fen);
    const state=core.fromFEN(item.fen),move=core.moveFromUCI(state,item.moves[0]);assert.ok(move);assert.equal(core.check(state,'w'),false);assert.equal(core.check(state,'b'),false);assert.equal(state.board[move.from].toLowerCase(),topic);assert.equal(core.color(state.board[move.to]),'b');
    const next=core.apply(state,move);assert.equal(core.check(next,'w'),false);assert.ok(item.text.length>40);assert.ok(item.hint.includes(core.square(move.to)));
    if(level==='hard'){assert.equal(core.allMoves(next).some(reply=>reply.to===move.to),false);const safe=core.legal(state,move.from).filter(m=>core.color(state.board[m.to])==='b').filter(m=>{if(topic==='p'&&m.to<8)m={...m,promotion:'q'};return !core.allMoves(core.apply(state,m)).some(reply=>reply.to===m.to)});assert.equal(safe.length,1)}
  }
});
test('endless lessons mixed topics, cancellation, and invalid options',async()=>{
 const random=seeded(47),topics=new Set();for(let n=0;n<30;n++)topics.add((await generator.generate(core,'easy','mixed',[],()=>false,random)).topic);assert.equal(topics.size,6);
 assert.equal(await generator.generate(core,'easy','mixed',[],()=>true),null);
 await assert.rejects(generator.generate(core,'bad','mixed'),/valid lesson/);await assert.rejects(generator.generate(core,'easy','bad'),/valid lesson/);
});
