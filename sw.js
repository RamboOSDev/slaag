const C='slaag-v24';const F=['./','index.html','css/style.css','js/app.js','js/icons.js','data/questions.json','data/lessons.json','data/learn.json','data/amr.json','i18n/index.json','i18n/ar.json','i18n/en.json','img/logo.svg','img/logo-full.svg','img/icon-192.png','img/icon-512.png','img/qr.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 // never touch media/range requests (iOS Safari needs real 206 responses) or other origins
 if(r.method!=='GET'||r.headers.has('range')||u.origin!==location.origin||/\/audio\/|\.mp3$/.test(u.pathname))return;
 e.respondWith(fetch(r).then(res=>{if(res.ok&&res.status===200){const cl=res.clone();caches.open(C).then(c=>c.put(r,cl))}return res}).catch(()=>caches.match(r)))});
