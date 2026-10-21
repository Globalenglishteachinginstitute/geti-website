'use strict';
const $=id=>document.getElementById(id);
const socket=io({reconnection:true});
const nickKey='speaktogether_nick';
let allRooms=[],name=localStorage.getItem(nickKey)||'',active=null,stream=null,muted=false;
const pcs=new Map(),users=new Map(),pendingIce=new Map();
const escapeHTML=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function modal(html){$('modal-content').innerHTML=html;$('overlay').classList.remove('hidden')}
function closeModal(){$('overlay').classList.add('hidden')}
$('close').onclick=closeModal;$('overlay').onclick=e=>{if(e.target===$('overlay'))closeModal()};
const initials=s=>(String(s).trim().charAt(0)||'?').toUpperCase();
function render(){
 const query=$('search').value.toLowerCase(),lang=$('language').value;
 const rooms=allRooms.filter(r=>(!lang||r.language===lang)&&(`${r.title} ${r.language} ${r.level}`).toLowerCase().includes(query));
 $('online').textContent=`${allRooms.reduce((t,r)=>t+r.count,0)} speakers in ${allRooms.length} rooms`;
 $('rooms').innerHTML=rooms.length?rooms.map(r=>`<article class="room"><div class="roomtop"><span class="speech">❞</span><span class="room-title">${escapeHTML(r.language)}</span><span class="level">${escapeHTML(r.level)}</span></div><div class="roomtop" style="padding-top:0;color:#b6c5cf;min-height:25px">${escapeHTML(r.title)}</div><div class="avatars">${r.people.length?r.people.slice(0,4).map(p=>`<span class="avatar" title="${escapeHTML(p.name)}">${escapeHTML(initials(p.name))}</span>`).join(''):'<span class="none">Be the first speaker!</span>'}</div><div class="roomfoot"><button class="join" data-join="${r.id}" ${r.count>=r.capacity?'disabled':''}>${r.count>=r.capacity?'Room is full':'♧ Join and talk now!'}</button><span class="count">${r.count}/${r.capacity} online</span></div></article>`).join(''):'<div class="empty">No rooms found. Create a group and invite someone to talk!</div>';
 if(active){let r=allRooms.find(r=>r.id===active);if(r){$('call-meta').textContent=`${r.language} • ${r.level} • ${r.count}/${r.capacity} connected`;updateSpeakers()}}
}
socket.on('rooms',r=>{allRooms=r;render()});socket.on('connect',()=>{$('online').textContent='Connected';if(active){stopCall();modal('<h2>Disconnected from room</h2><p>Your network connection restarted. Please join the room again.</p>')}});
socket.on('disconnect',()=>{if(active){stopCall();modal('<h2>Connection lost</h2><p>Reconnect to the internet, then join the room again.</p>')}else $('online').textContent='Offline — reconnecting…'});
$('search').oninput=render;$('language').onchange=render;
$('login').onclick=()=>modal(`<h2>Your display name</h2><p>Choose a public nickname. No password or account is required.</p><form id="name-form"><label class="field">Your name<input name="name" maxlength="24" minlength="2" required value="${escapeHTML(name)}" placeholder="Your name"></label><button type="submit" class="blue">Continue</button></form>`);
$('rules').onclick=()=>modal('<h2>Rules and Guidelines</h2><ul><li>Respect every speaker and language learner.</li><li>No harassment, hate speech, threats, or spam.</li><li>Do not share private details or record others without consent.</li><li>Leave the room if you are uncomfortable.</li></ul>');
$('create').onclick=()=>modal(`<h2>Create a new group</h2><form id="create-form"><label class="field">Room title<input name="title" maxlength="55" minlength="3" required placeholder="English conversation for beginners"></label><label class="field">Language<select name="language">${['English','French','Spanish','Italian','Arabic','Malagasy','German','Japanese','Any Language'].map(x=>`<option>${x}</option>`).join('')}</select></label><label class="field">Level<select name="level">${['Any Level','Beginner','Intermediate','Advanced'].map(x=>`<option>${x}</option>`).join('')}</select></label><button type="submit" class="blue">Create group</button><p id="form-error" class="error"></p></form>`);
$('modal-content').addEventListener('submit',e=>{
 e.preventDefault();const form=e.target,data=Object.fromEntries(new FormData(form));
 if(form.id==='name-form'){name=data.name.trim().slice(0,24);if(name.length<2)return;localStorage.setItem(nickKey,name);$('login').textContent=name;closeModal();if(pendingRoom){const id=pendingRoom;pendingRoom=null;joinRoom(id)}return}
 if(form.id==='create-form')socket.emit('create-room',data,res=>{if(res?.error){$('form-error').textContent=res.error;return}closeModal();render();joinRoom(res.room.id)});
});
if(name)$('login').textContent=name;
let pendingRoom=null;
$('rooms').addEventListener('click',e=>{let btn=e.target.closest('[data-join]');if(btn)joinRoom(btn.dataset.join)});
async function joinRoom(id){
 if(active===id)return;if(active){modal('<h2>Leave current room first</h2><p>Leave your active voice room before joining another.</p>');return}if(!name){pendingRoom=id;$('login').click();return}
 if(!socket.connected){modal('<h2>Connection unavailable</h2><p>Wait for the server to reconnect and try again.</p>');return}
 let media;
 try{media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false})}
 catch(e){modal('<h2>Microphone access required</h2><p>Allow microphone permission in your browser and use HTTPS (or localhost). Then try again.</p>');return}
 socket.emit('join-room',{id,name},res=>{
  if(res?.error){media.getTracks().forEach(t=>t.stop());modal(`<h2>Could not join</h2><p>${escapeHTML(res.error)}</p>`);return}
  stream=media;active=id;muted=false;users.clear();for(const p of res.peers)users.set(p.id,p.name);
  $('call-title').textContent=res.room.title;$('call').classList.remove('hidden');$('mute').textContent='🎙 Mute microphone';closeModal();history.replaceState(null,'',`#room=${encodeURIComponent(id)}`);updateSpeakers();setStatus('Microphone connected. Waiting for others to speak…');
 });
}
let ICE=[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}];
fetch('/api/ice',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(v=>{if(Array.isArray(v?.iceServers))ICE=v.iceServers}).catch(()=>{});
function createPeer(id){if(pcs.has(id))return pcs.get(id);
 const pc=new RTCPeerConnection({iceServers:ICE});pcs.set(id,pc);
 for(const track of stream.getTracks())pc.addTrack(track,stream);
 pc.onicecandidate=e=>{if(e.candidate)socket.emit('signal',{to:id,data:{candidate:e.candidate.toJSON()}})};
 pc.ontrack=e=>{const audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;audio.dataset.peer=id;audio.srcObject=e.streams[0];$('remote-audios').querySelector(`[data-peer="${CSS.escape(id)}"]`)?.remove();$('remote-audios').append(audio);audio.play().catch(()=>setStatus('Tap the page to allow speaker audio.'))};
 pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed')setStatus('A peer connection failed. A TURN server may be needed for this network.');updateSpeakers()};
 return pc;
}
async function sendOffer(id){if(!active||!stream)return;try{const pc=createPeer(id);const offer=await pc.createOffer();await pc.setLocalDescription(offer);socket.emit('signal',{to:id,data:{description:pc.localDescription}})}catch(e){setStatus('Could not start audio connection: '+e.message)}}
socket.on('peer-joined',p=>{if(!active)return;users.set(p.id,p.name);updateSpeakers();sendOffer(p.id)});
socket.on('signal',async({from,data})=>{if(!active||!stream||!users.has(from))return;
 try{const pc=createPeer(from);if(data.description){await pc.setRemoteDescription(new RTCSessionDescription(data.description));
  for(const item of pendingIce.get(from)||[])await pc.addIceCandidate(item);pendingIce.delete(from);
  if(data.description.type==='offer'){const answer=await pc.createAnswer();await pc.setLocalDescription(answer);socket.emit('signal',{to:from,data:{description:pc.localDescription}})}
 }else if(data.candidate){if(pc.remoteDescription)await pc.addIceCandidate(new RTCIceCandidate(data.candidate));else{const queue=pendingIce.get(from)||[];queue.push(new RTCIceCandidate(data.candidate));pendingIce.set(from,queue)}}
 }catch(e){setStatus('Audio negotiation issue: '+e.message)}
});
socket.on('peer-left',({id})=>{pcs.get(id)?.close();pcs.delete(id);users.delete(id);pendingIce.delete(id);$('remote-audios').querySelector(`[data-peer="${CSS.escape(id)}"]`)?.remove();updateSpeakers()});
function updateSpeakers(){if(!active)return;const r=allRooms.find(x=>x.id===active);const people=[{id:'self',name:name,me:true},...[...users].map(([id,n])=>({id,name:n}))];$('speakers').innerHTML=people.map(p=>`<div class="speaker"><span class="avatar">${escapeHTML(initials(p.name))}</span><strong>${escapeHTML(p.name)}</strong><small>${p.me?(muted?'You • muted':'You • microphone on'):(pcs.get(p.id)?.connectionState==='connected'?'Audio connected':'Connecting…')}</small></div>`).join('');if(r)$('call-meta').textContent=`${r.language} • ${r.level} • ${r.count}/${r.capacity} connected`}
function setStatus(s){$('call-status').textContent=s}
$('mute').onclick=()=>{if(!stream)return;muted=!muted;for(const t of stream.getAudioTracks())t.enabled=!muted;$('mute').textContent=muted?'🔇 Unmute microphone':'🎙 Mute microphone';updateSpeakers()};
$('invite').onclick=async()=>{const url=location.origin+location.pathname+'#room='+encodeURIComponent(active);try{await navigator.clipboard.writeText(url);setStatus('Invitation link copied! Share it with someone.')}catch{window.prompt('Copy this invitation link:',url)}};
function stopCall(){if(active&&socket.connected)socket.emit('leave-room');for(const pc of pcs.values())pc.close();pcs.clear();users.clear();pendingIce.clear();stream?.getTracks().forEach(t=>t.stop());stream=null;active=null;$('remote-audios').replaceChildren();$('call').classList.add('hidden');history.replaceState(null,'',location.pathname)}
$('leave').onclick=stopCall;
window.addEventListener('pagehide',()=>{if(active)stopCall()});
$('call').addEventListener('click',()=>{for(const audio of $('remote-audios').querySelectorAll('audio'))audio.play().catch(()=>{})});
const deepLink=location.hash.match(/^#room=([a-z0-9-]+)$/i);if(deepLink){window.addEventListener('load',()=>setTimeout(()=>joinRoom(deepLink[1]),350))}
