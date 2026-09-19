const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createChessServer}=require('../server.cjs');
test('friend tournaments authenticate, pair odd players once each, score games, advance rounds and survive restart',async t=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'club-tournament-'));let server=createChessServer({dataDir});await new Promise(r=>server.listen(0,'127.0.0.1',r));let base='http://127.0.0.1:'+server.address().port;
 t.after(async()=>{await new Promise(r=>server.close(r));fs.rmSync(dataDir,{recursive:true,force:true})});
 async function request(route,body,token,status=200){const r=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data}
 const host=await request('/api/tournaments',{name:'Host',title:'Friends cup',time:180},null,201),route='/api/tournaments/'+host.id;
 await request(route+'/start',{},host.token,400);
 const a=await request(route+'/join',{name:'Alice'}),b=await request(route+'/join',{name:'Bob'}),members=[host,a,b];
 await request(route,undefined,'wrong',401);await request(route+'/start',{},a.token,403);
 let current=await request(route+'/start',{},host.token);assert.equal(current.rounds.length,3);assert.equal(current.status,'running');
 await request(route+'/join',{name:'Late guest'},null,409);await request(route+'/start',{},host.token,409);
 const pairs=new Set();
 for(let i=0;i<3;i++){
  const match=current.rounds[i].find(m=>m.b);pairs.add([match.w,match.b].sort().join(':'));
  const white=members.find(p=>p.me===match.w),black=members.find(p=>p.me===match.b),other=members.find(p=>p.me!==match.w&&p.me!==match.b);
  const w=await request(route,undefined,white.token),bt=await request(route,undefined,black.token),o=await request(route,undefined,other.token);
  const wm=w.rounds[i].find(m=>m.b),bm=bt.rounds[i].find(m=>m.b);assert.ok(wm.token);assert.ok(bm.token);assert.notEqual(wm.token,bm.token);assert.equal(o.rounds[i].find(m=>m.b).token,undefined);assert.equal(JSON.stringify(w).includes('whiteToken'),false);assert.equal(JSON.stringify(w).includes('"key"'),false);
  const game=await request('/api/rooms/'+wm.id,undefined,wm.token);assert.equal(game.side,'w');
  if(i===0){await request('/api/rooms/'+wm.id+'/draw',{},wm.token);await request('/api/rooms/'+wm.id+'/draw',{accept:true},bm.token)}else await request('/api/rooms/'+wm.id+'/resign',{},bm.token);
  current=await request(route,undefined,host.token);assert.equal(current.round,i+1);
 }
 assert.equal(pairs.size,3);assert.equal(current.status,'finished');assert.equal(current.standings.reduce((s,p)=>s+p.points,0),3);assert.ok(current.standings.every(p=>p.played===2));
 await new Promise(r=>server.close(r));server=createChessServer({dataDir});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 assert.deepEqual((await request(route,undefined,host.token)).standings,current.standings);
});
