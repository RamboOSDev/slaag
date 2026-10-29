const C='slaag-v5';const F=['./','index.html','css/style.css','js/app.js','js/icons.js','data/questions.json','data/lessons.json','i18n/index.json','i18n/ar.json','i18n/en.json','img/logo.svg','img/logo-full.svg','img/icon-192.png','img/icon-512.png','img/qr.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).then(r=>{const cl=r.clone();caches.open(C).then(c=>c.put(e.request,cl));return r}).catch(()=>caches.match(e.request))));
