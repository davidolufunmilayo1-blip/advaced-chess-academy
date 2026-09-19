const {test}=require('node:test'),assert=require('node:assert/strict');
const core=require('../lib/chess-core.js'),generator=require('../public/training.js').EndlessPuzzles;
function seeded(n){return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
for(const level of ['easiest','easy','medium','hard'])test('endless '+level+': fresh positions and verified mating solutions',async()=>{
  const random=seeded(946),seen=[];
  for(let n=0;n<25;n++){
    const item=await generator.generate(core,level,seen,()=>false,random);
    assert.ok(!seen.includes(item.fen));seen.push(item.fen);
    const state=core.fromFEN(item.fen);assert.equal(core.check(state,'w'),false);assert.equal(core.check(state,'b'),false);
    const move=core.moveFromUCI(state,item.line[0]);assert.ok(move);const result=core.apply(state,move);
    assert.equal(core.check(result,result.turn),true);assert.equal(core.allMoves(result).length,0);
    if(level==='hard'){
      let mates=0;for(const m of core.allMoves(state)){const promotion=state.board[m.from].toLowerCase()==='p'&&(m.to<8||m.to>=56);for(const candidate of promotion?['q','r','b','n'].map(promotion=>({...m,promotion})):[m]){const next=core.apply(state,candidate);if(core.check(next,next.turn)&&!core.allMoves(next).length)mates++}}
      assert.equal(mates,1);
    }
  }
});
test('endless cancellation and invalid difficulty',async()=>{
  assert.equal(await generator.generate(core,'easy',[],()=>true),null);
  await assert.rejects(generator.generate(core,'impossible'),/Choose Easiest/);
});
