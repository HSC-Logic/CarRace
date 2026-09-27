import{Client}from'@colyseus/sdk';
const endpoint=process.env.SERVER_URL||'https://carrace.hsclogic.com';
const code=`CI${Math.random().toString(36).slice(2,5).toUpperCase()}`;
const room=await new Client(endpoint).create('race',{code,name:'Health Check',color:'#ff5b75'});
room.onMessage('state',()=>{});
if(!room.sessionId)throw new Error('Room handshake failed');
await room.leave();
console.log('Public matchmaking and WSS healthy');
