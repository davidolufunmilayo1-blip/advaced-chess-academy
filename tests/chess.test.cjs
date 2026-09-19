const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const scripts = [...fs.readFileSync('david.html', 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
function environment(saved) {
  const elements = new Map();
  class Element {
    constructor(){this.children=[];this.value='';this.classList={add(){}};this.open=false;}
    set innerHTML(v){this.html=v;this.children=[];}
    get innerHTML(){return this.html;}
    append(e){this.children.push(e)}
    setAttribute(){} insertAdjacentHTML(){} addEventListener(){} focus(){}
    showModal(){this.open=true} close(){this.open=false} click(){if(!this.disabled)this.onclick?.()}
  }
  function $(s){if(s==='dialog[open]')return null;if(!elements.has(s))elements.set(s,new Element());return elements.get(s)}
  for(const [id,value] of Object.entries({opponent:'local',human:'w',difficulty:'2','time-control':'0',theme:'garden',sound:'off'}))$('#'+id).value=value;
  const storage = new Map(saved?[['chess-club-v2',saved]]:[]);
  const ctx=vm.createContext({ChessCore:require('../lib/chess-core'),document:{querySelector:$,getElementById:id=>$('#'+id),createElement:()=>new Element(),addEventListener(){},documentElement:{style:{setProperty(){}}}},window:{addEventListener(){}},localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null},performance:{now:()=>Date.now()},setTimeout:()=>1,clearTimeout(){},setInterval(){},Blob,URL,console});
  for(const s of scripts)vm.runInContext(s,ctx);
  return {ctx,storage,run:s=>vm.runInContext(s,ctx),$};
}
const env=environment(),run=env.run;
run(`
function expect(test,message){if(!test)throw Error(message)}
function play(from,to,promotion){const m=legal(state,from).find(m=>m.to===to);expect(m,'Missing move '+from+' '+to);commit({...m,promotion})}
function perft(s,d){return d?allMoves(s).reduce((n,m)=>n+perft(apply(s,m),d-1),0):1}
expect(perft(initial(),3)===8902,'Opening perft');
play(53,45);play(12,28);play(54,38);play(3,39);expect(finished.title==='Black wins','Checkmate');expect(pgn().includes('Qh4# 0-1'),'PGN result');
reset();play(52,36);play(8,16);play(36,28);play(11,27);play(28,19);expect(!state.board[27]&&state.board[19]==='P','En passant');
reset();state={board:Array(64).fill(null),turn:'w',rights:'KQ',ep:null,half:0};state.board[60]='K';state.board[63]='R';state.board[56]='R';state.board[4]='k';play(60,62);expect(state.board[61]==='R'&&!state.board[63],'Castling');
reset();state={board:Array(64).fill(null),turn:'w',rights:'',ep:null,half:0};state.board[60]='K';state.board[7]='k';state.board[8]='P';expect(movesForSearch(state).filter(m=>m.from===8).length===4,'AI promotion options');play(8,0,'n');expect(state.board[0]==='N','Underpromotion');
reset();for(const level of [1,2,3]){const m=bestMove(state,level);expect(allMoves(state).some(x=>x.from===m.from&&x.to===m.to),'Legal AI move')}
$('#opponent').value='computer';reset();play(52,36);const reply=bestMove(state,1);commit(reply);$('#undo').onclick();expect(past.length===0&&state.turn==='w','Computer full-turn undo');
$('#opponent').value='local';$('#time-control').value='180';reset();play(52,36);remaining.b=1;lastTick=performance.now()-100;tick();expect(finished.title==='White wins on time','Flag');expect(gameResult()==='1-0','Time result');$('#undo').onclick();expect(!finished&&state.turn==='w'&&!started,'Undo timeout');
reset();play(52,36);save();
`);
const restored=environment(env.storage.get('chess-club-v2'));
assert.equal(restored.run('notation[0]'),'e4');
assert.equal(restored.run('state.turn'),'b');
assert.equal(restored.run('remaining.w'),180000);
restored.run("$('#confirm-resign').onclick()");
assert.equal(restored.run('gameResult()'),'1-0');
const invalid=environment('{broken');
assert.equal(invalid.run('past.length'),0);
console.log('PASS: startup, 8,902 opening positions, checkmate, en passant, castling, all promotion options, AI levels, computer undo, clock expiry, saved-game recovery, resignation, PGN, malformed save.');
