'use strict';
const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const app=express();const server=http.createServer(app);
const io=new Server(server,{maxHttpBufferSize:100000,transports:['websocket','polling']});
const PORT=process.env.PORT||3000;
const STORE=process.env.DATA_FILE||path.join(__dirname,'rooms.json');
const MAX_PEOPLE=6, MAX_ROOMS=300;
const LANGS=['English','French','Spanish','Italian','Arabic','Malagasy','German','Japanese','Any Language'];
const LEVELS=['Any Level','Beginner','Intermediate','Advanced'];
const clean=(v,n)=>String(v||'').trim().slice(0,n).replace(/[<>\u0000-\u001f]/g,'');
let saved=[];try{saved=JSON.parse(fs.readFileSync(STORE,'utf8'));if(!Array.isArray(saved))saved=[]}catch{}
const rooms=new Map();
for(const x of saved){if(x&&typeof x.id==='string'&&/^[a-f0-9-]{36}$/.test(x.id)&&LANGS.includes(x.language)&&LEVELS.includes(x.level))rooms.set(x.id,{id:x.id,title:clean(x.title,55),language:x.language,level:x.level,created:x.created||Date.now(),members:new Map()})}
if(rooms.size===0){for(const [title,language,level] of [['English speaking practice','English','Any Level'],['Beginner English club','English','Beginner'],['French conversation','French','Any Level'],['Malagasy & English exchange','Malagasy','Any Level'],['Spanish conversation','Spanish','Intermediate'],['Any language welcome','Any Language','Any Level']]){const id=crypto.randomUUID();rooms.set(id,{id,title,language,level,created:Date.now(),members:new Map()})}}
const save=()=>{try{fs.writeFileSync(STORE,JSON.stringify([...rooms.values()].map(({members,...rest})=>rest),null,2))}catch(e){console.error('Could not save rooms:',e.message)}};
function publicRoom(r){return {id:r.id,title:r.title,language:r.language,level:r.level,count:r.members.size,capacity:MAX_PEOPLE,people:[...r.members].map(([id,p])=>({id,name:p.name}))}}
const broadcast=()=>io.emit('rooms', [...rooms.values()].sort((a,b)=>b.members.size-a.members.size||b.created-a.created).map(publicRoom));
app.disable('x-powered-by');
app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','DENY');
  next();
});
app.get('/api/ice', (req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const servers=[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}];
  if(process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL){
    servers.push({urls:process.env.TURN_URL,username:process.env.TURN_USERNAME,credential:process.env.TURN_CREDENTIAL});
  }
  res.json({iceServers:servers});
});
app.use(express.static(path.join(__dirname,'public')));
app.get('/health',(req,res)=>res.json({ok:true,rooms:rooms.size,online:io.engine.clientsCount}));
app.get('/api/rooms',(req,res)=>res.json([...rooms.values()].map(publicRoom)));
const rate=new Map();
io.on('connection',socket=>{
  let current=null;let name='';
  socket.emit('rooms',[...rooms.values()].map(publicRoom));
  function leave(){if(!current)return;const r=rooms.get(current);if(r){r.members.delete(socket.id);socket.to(current).emit('peer-left',{id:socket.id});socket.leave(current);if(r.members.size===0){/* Keep empty rooms discoverable */}}current=null;broadcast()}
  socket.on('create-room',(input,ack)=>{if(typeof ack!=='function')return;const now=Date.now(),last=rate.get(socket.handshake.address)||0;if(now-last<4000)return ack({error:'Please wait a few seconds.'});rate.set(socket.handshake.address,now);
    if(rooms.size>=MAX_ROOMS)return ack({error:'Room limit reached.'});const title=clean(input?.title,55),language=clean(input?.language,30),level=clean(input?.level,30);
    if(title.length<3||!LANGS.includes(language)||!LEVELS.includes(level))return ack({error:'Please enter valid room details.'});
    const r={id:crypto.randomUUID(),title,language,level,created:Date.now(),members:new Map()};rooms.set(r.id,r);save();broadcast();ack({room:publicRoom(r)})
  });
  socket.on('join-room',(input,ack)=>{if(typeof ack!=='function')return;const id=clean(input?.id,80),nick=clean(input?.name,24);const room=rooms.get(id);
    if(!room)return ack({error:'This room does not exist.'});if(nick.length<2)return ack({error:'Enter a name (2–24 characters).'});
    if(current===id)return ack({room:publicRoom(room),peers:[...room.members].filter(([sid])=>sid!==socket.id).map(([sid,p])=>({id:sid,name:p.name}))});
    if(room.members.size>=MAX_PEOPLE)return ack({error:'This room is full.'});leave();current=id;name=nick;
    const peers=[...room.members].map(([sid,p])=>({id:sid,name:p.name}));room.members.set(socket.id,{name:nick});socket.join(id);ack({room:publicRoom(room),peers,self:socket.id});socket.to(id).emit('peer-joined',{id:socket.id,name:nick});broadcast()
  });
  socket.on('signal',(message)=>{if(!current||!message||typeof message!=='object')return;const r=rooms.get(current);if(!r?.members.has(message.to))return;const data=message.data;
    if(!data||JSON.stringify(data).length>16000)return;io.to(message.to).emit('signal',{from:socket.id,data})
  });
  socket.on('leave-room',leave);socket.on('disconnect',leave);
});
setInterval(()=>{const cutoff=Date.now()-3600000;for(const [ip,t] of rate){if(t<cutoff)rate.delete(ip)}},600000).unref();
server.listen(PORT,'0.0.0.0',()=>console.log('SpeakTogether live at http://localhost:'+PORT));
