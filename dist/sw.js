const BASE=new URL('./',self.location.href);
const PREFIX='outside15:'+BASE.pathname+':';
const CACHE=PREFIX+'v3';
const ASSETS=['./','index.html','styles.css','app.js','data.js','map.js','icon.svg','manifest.webmanifest','recorded-example.json','fonts/fonts.css',...Array.from({length:9},(_,i)=>'fonts/font-'+i+'.woff2')].map(p=>new URL(p,BASE).href);
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith(PREFIX)||k==='outside15-v2-'+BASE.pathname||BASE.pathname==='/'&&k==='outside15-v1')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||url.pathname.startsWith(BASE.pathname+'api/')||e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match(new URL('index.html',BASE).href):Response.error()))))});
