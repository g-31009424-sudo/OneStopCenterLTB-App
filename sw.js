'use strict';
const CACHE='osc-launcher-v8.7.1';
const ASSETS=['./','./index.html','./style.css','./config.js','./app.js','./manifest.webmanifest','./icons/icon-32.png','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png','./icons/favicon.ico'];
const ALLOWED=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('osc-launcher-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  // Never intercept or cache Apps Script, Drive, Google login, API calls or posts.
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  if(request.mode==='navigate'&&url.pathname.startsWith(new URL(self.registration.scope).pathname)){
    event.respondWith(fetch(request).catch(()=>caches.match(new URL('./index.html',self.registration.scope).href)));return;
  }
  if(!ALLOWED.has(url.href))return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok&&response.type==='basic'){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}
    return response;
  }).catch(()=>caches.match(request)));
});
