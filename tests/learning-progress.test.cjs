const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../public/training.js').LearningProgress;
const format=data=>({format:'advaced-chess-academy-progress',version:1,data});
test('opening reviews space clean repetitions, reset after assistance, and do not advance before due',()=>{
 const now=1700000000000,a=P.scheduleReview(null,true,now);assert.equal(a.due,now+86400000);assert.equal(a.streak,1);
 const early=P.scheduleReview(a,true,now+1000);assert.equal(early.due,a.due);assert.equal(early.streak,1);
 const b=P.scheduleReview(a,true,a.due);assert.equal(b.streak,2);assert.equal(b.due,a.due+3*86400000);
 const missed=P.scheduleReview(b,false,b.due);assert.equal(missed.streak,0);assert.equal(missed.due,b.due+86400000);
});
test('backup schema rejects unsupported keys and malformed data',()=>{
 assert.throws(()=>P.validateBackup(format({'chess-club-online':{token:'secret'}})),/unsupported/);
 assert.throws(()=>P.validateBackup(format({'chess-club-profile':{name:'x',avatar:'unknown'}})),/profile/);
 assert.throws(()=>P.validateBackup({...format({}),version:2}),/version 1/);
 assert.throws(()=>P.validateBackup(format({'chess-club-opening-schedule':{'other:white':{}}})),/Unknown/);
 assert.throws(()=>P.validateBackup(JSON.parse('{"format":"advaced-chess-academy-progress","version":1,"data":{"__proto__":{}}}')),/unsupported/);
});
test('backup merge unions real completions, keeps higher totals and existing preferences',()=>{
 const a={puzzles:['back-rank'],lessons:['rook'],attempts:3,streak:1,lastDay:'Mon Jan 01 2024'},b={puzzles:['queen-close'],lessons:['rook','bishop'],attempts:2,streak:2,lastDay:'Tue Jan 02 2024'};
 const merged=P.mergeRecord('chess-club-progress',a,b);assert.deepEqual(merged.puzzles,['back-rank','queen-close']);assert.deepEqual(merged.lessons,['rook','bishop']);assert.equal(merged.attempts,3);assert.equal(merged.streak,2);
 assert.equal(P.mergeRecord('chess-club-endless',{solved:50,recent:[]},{solved:12,recent:[]}).solved,50);
 assert.equal(P.mergeRecord('chess-club-profile',{name:'Current',avatar:'♛'},{name:'Imported',avatar:'♞'}).name,'Current');
 const future={streak:1,reviews:1,at:10,due:20,clean:true},old={...future,at:5};assert.equal(P.mergeRecord('chess-club-opening-schedule',{'italian:white':future},{'italian:white':old})['italian:white'].at,10);
});
test('restore is validated before writes and rolls back a partial storage failure',()=>{
 const map=new Map([['chess-club-opening-learned','["italian"]']]);let writes=0,fail=true;
 const storage={getItem:k=>map.get(k)??null,setItem(k,v){writes++;if(k==='chess-club-endgames'&&fail){fail=false;throw Error('quota')}map.set(k,v)},removeItem:k=>map.delete(k)};
 assert.throws(()=>P.restore(storage,{'unknown':1}));assert.equal(writes,0);
 assert.throws(()=>P.restore(storage,{'chess-club-opening-learned':['sicilian'],'chess-club-endgames':['ladder']}),/existing data was kept/);assert.equal(map.get('chess-club-opening-learned'),'["italian"]');assert.equal(map.has('chess-club-endgames'),false);
 assert.equal(P.restore(storage,{'chess-club-opening-learned':['sicilian'],'chess-club-endgames':['ladder']}),2);assert.deepEqual(JSON.parse(map.get('chess-club-opening-learned')),['italian','sicilian']);
});
test('daily dates follow local calendar boundaries',()=>{assert.equal(P.dayKey(new Date(2026,0,2,0,1)),'2026-01-02');assert.equal(P.dayKey(new Date(2026,11,31,23,59)),'2026-12-31')});
test('mistake backups validate legal solutions and merge attempts without duplicate positions',()=>{
 const key='chess-club-mistakes',item={fen:'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',solutions:['e2e4'],label:'Mistake',played:'a3',explanation:'Control the centre.',depth:2,at:100,attempts:1,solved:false};
 const a=P.clean(key,[item]);assert.equal(a[0].id,item.fen);
 assert.throws(()=>P.clean(key,[{...item,solutions:['e2e5']}]),/solution/);
 assert.throws(()=>P.clean(key,[{...item,fen:'invalid'}]));
 const b=P.clean(key,[{...item,at:200,attempts:3,solved:true}]),merged=P.mergeRecord(key,a,b);assert.equal(merged.length,1);assert.equal(merged[0].attempts,3);assert.equal(merged[0].solved,true);
 assert.deepEqual(P.validateBackup(format({[key]:a}))[key],a);
});
