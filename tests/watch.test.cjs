const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseStreamLink,embedURL,channels}=require('../chess-extras/watch');
test('YouTube video links produce a fixed, safe embed origin',()=>{
  for(const url of ['https://www.youtube.com/watch?v=abcdefghijk&t=30','https://youtu.be/abcdefghijk','https://www.youtube.com/live/abcdefghijk','https://m.youtube.com/shorts/abcdefghijk']){
    const source=parseStreamLink(url);assert.equal(new URL(source.embed).origin,'https://www.youtube-nocookie.com');assert.equal(new URL(source.embed).pathname,'/embed/abcdefghijk');
  }
});
test('Twitch channel URLs set the required parent and disable autoplay',()=>{
  const source=parseStreamLink('https://www.twitch.tv/Chess');const embed=new URL(embedURL(source,'localhost'));assert.equal(embed.hostname,'player.twitch.tv');assert.equal(embed.searchParams.get('channel'),'chess');assert.equal(embed.searchParams.get('parent'),'localhost');assert.equal(embed.searchParams.get('autoplay'),'false');assert.equal(embedURL(source,''),null);
});
test('invalid, unsupported, and lookalike stream URLs are rejected',()=>{
  for(const url of ['javascript:alert(1)','https://youtube.com.evil.example/watch?v=abcdefghijk','https://youtube.com@evil.example/watch?v=abcdefghijk','https://evil.example/live/abcdefghijk','https://youtube.com/watch?v=short','https://youtube.com/@chess','https://twitch.tv/directory','https://twitch.tv/chess/clip/example','https://user:pass@twitch.tv/chess'])assert.throws(()=>parseStreamLink(url),url);
});
test('the live-board source links to Lichess TV',()=>{const board=channels.find(c=>c.kind==='boards');assert.equal(board.url,'https://lichess.org/tv')});

const {reduceTV}=require('../chess-extras/live-board');
test('live board transitions from a featured game to move and clock updates',()=>{
 const first=reduceTV(null,{t:'featured',d:{id:'abcdefgh',fen:'7k/8/8/8/8/8/8/K7 w - - 0 1',orientation:'black',players:[{color:'white',user:{name:'White'}}]}});
 assert.equal(first.orientation,'black');assert.equal(first.clocks,null);
 const next=reduceTV(first,{t:'fen',d:{fen:'7k/8/8/8/8/8/K7/8 b - - 1 1',lm:'a1a2',wc:50,bc:60}});
 assert.equal(next.lastMove,'a1a2');assert.deepEqual(next.clocks,{white:50,black:60});assert.equal(next.players[0].user.name,'White');assert.equal(reduceTV(next,{t:'other'}),next);
 assert.equal(reduceTV(next,{t:'featured',d:{id:'bad/path',fen:'',players:[]}}),next);
});
