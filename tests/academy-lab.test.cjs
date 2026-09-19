const {test}=require('node:test'),assert=require('node:assert/strict'),Lab=require('../public/academy-lab.js'),C=require('../lib/chess-core.js');
let seed=123456789;const rng=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
test('all eight lab activities generate answerable questions across three levels',()=>{
 for(const [mode] of Lab.modes)for(const level of [1,2,3])for(let n=0;n<100;n++){
  const q=Lab.generate(mode,level,rng);assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options.length>=2&&q.options.length<=4);assert.ok(q.explanation);assert.ok(q.hint);
  if(q.board)assert.equal(q.board.length,64);
  if(mode==='colours'){const square=q.prompt.match(/\b[a-h][1-8]\b/)[0];const dark=((square.charCodeAt(0)-97)+Number(square[1])-1)%2===0;assert.equal(q.answer,dark?'Dark':'Light')}
  if(mode==='knight'||mode==='paths'){const from=C.indexOfSquare(q.prompt.match(/\b[a-h][1-8]\b/)[0]),board=q.board||Array(64).fill(null);if(!q.board)board[from]='N';const targets=C.pseudo({board,turn:'w',rights:'',ep:null,half:0},from).map(m=>C.square(m.to));assert.ok(targets.includes(q.answer));for(const option of q.options.filter(o=>o!==q.answer))assert.ok(!targets.includes(option),'Distractor is also reachable')}
  if(mode==='memory'){const piece=q.board[C.indexOfSquare(q.answer)],names={K:'king',Q:'queen',R:'rook',B:'bishop',N:'knight',P:'pawn'};assert.equal(q.prompt,'Where was the '+names[piece]+'?');assert.equal(q.board.filter(p=>p===piece).length,1)}
 }
 assert.throws(()=>Lab.generate('unknown'),/activity/);assert.throws(()=>Lab.generate('rules',9),/difficulty/);
});
test('material maths uses signed conventional values',()=>{
 for(let i=0;i<100;i++){const q=Lab.generate('material',3,rng),[white,black]=q.prompt.split(' • '),values={pawn:1,knight:3,bishop:3,rook:5,queen:9},sum=text=>[...text.matchAll(/\b(pawn|knight|bishop|rook|queen)\b/g)].reduce((n,m)=>n+values[m[0]],0);assert.equal(Number(q.answer),sum(white)-sum(black))}
});
