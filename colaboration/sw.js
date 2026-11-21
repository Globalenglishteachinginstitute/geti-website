// GETI Collaboration PWA service worker. Never cache user/private API data.
const STATIC_CACHE='geti-collaboration-shell-github-v2';
const STATIC_FILES=['./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(STATIC_FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('geti-collaboration-shell-')&&k!==STATIC_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith('/index.html')||url.pathname.endsWith('/')){
    event.respondWith(fetch(req).then(resp=>resp).catch(()=>caches.match('./index.html')));
    return;
  }
  if(/\/(manifest\.webmanifest|icons\/)/.test(url.pathname))
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});
