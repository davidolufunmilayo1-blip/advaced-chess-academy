const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../lib/chess-core.js'),T=require('../public/training.js');
const uci=m=>C.square(m.from)+C.square(m.to)+(m.promotion||'');
const moves=s=>C.allMoves(s).flatMap(m=>s.board[m.from].toLowerCase()==='p'&&(m.to<8||m.to>=56)?['q','r','b','n'].map(promotion=>({...m,promotion})):[m]);
function mates(s){return moves(s).filter(m=>{const n=C.apply(s,m);return C.check(n,n.turn)&&moves(n).length===0})}
test('every expert puzzle needs two moves and covers every legal defence',()=>{
 assert.equal(T.expert.length,16);
 for(const item of T.expert){const start=C.fromFEN(item.fen);assert.equal(C.check(start,'w'),false);assert.equal(C.check(start,'b'),false);assert.equal(mates(start).length,0,item.id+' must not have mate in one');
 const winning=[];
 for(const first of moves(start)){const next=C.apply(start,first),replies=moves(next);if(replies.length&&replies.every(reply=>mates(C.apply(next,reply)).length))winning.push(uci(first))}
 assert.deepEqual(Object.keys(item.plans).sort(),winning.sort(),item.id+' includes all correct first moves');
 for(const [first,branches] of Object.entries(item.plans)){const next=C.apply(start,C.moveFromUCI(start,first));assert.deepEqual(Object.keys(branches).sort(),moves(next).map(uci).sort());for(const [reply,solutions]of Object.entries(branches)){const finish=C.apply(next,C.moveFromUCI(next,reply));assert.deepEqual(solutions.slice().sort(),mates(finish).map(uci).sort())}}
 }
});
