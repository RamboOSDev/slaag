'use strict';
/* Slaag v1 — vanilla JS, no build step */
const $=s=>document.querySelector(s), app=$('#app');
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem('slaag.'+k))??d}catch(e){return d}},set:(k,v)=>localStorage.setItem('slaag.'+k,JSON.stringify(v))};
const P=new URLSearchParams(location.search), STREAM=P.get('stream')==='1';
let T={}, LANGS=[], Q=[], L=[], st={ui:LS.get('ui',null),ex:LS.get('ex','nl'),delay:LS.get('delay',1.5),tr:LS.get('tr',false),auto:LS.get('auto',true)};
const SESSION=sessionStorage.getItem('slaag.s')||String(Date.now()); sessionStorage.setItem('slaag.s',SESSION);
const t=k=>T[k]||k, esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ib=(ic,label,attrs='')=>`<button ${attrs}>${ICON[ic]}<span>${esc(label)}</span></button>`;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const byId=id=>Q.find(q=>q.id===id);

/* ---------- Shared mistakes memory (all modes) ---------- */
const NEED=3;
const M={
 all(){return LS.get('mist',{})},
 save(m){LS.set('mist',m);updCount()},
 wrong(id){const m=this.all();m[id]={streak:0,last:SESSION,due:Date.now(),n:((m[id]||{}).n||0)+1};this.save(m)},
 right(id){const m=this.all(),e=m[id];if(!e)return;
  if(e.last!==SESSION){e.streak++;e.last=SESSION}
  e.due=Date.now()+[0,10*60e3,24*3600e3,72*3600e3][Math.min(e.streak,3)];
  if(e.streak>=NEED)delete m[id];this.save(m)},
 record(id,ok){ok?this.right(id):this.wrong(id)},
 due(){const m=this.all(),now=Date.now();return Object.keys(m).filter(k=>byId(k)&&m[k].due<=now).sort((a,b)=>m[a].due-m[b].due)},
 list(){const m=this.all();return Object.keys(m).filter(byId).sort((a,b)=>m[a].due-m[b].due)}
};
function updCount(){const n=M.list().length,el=$('#mcount');if(!el)return;el.hidden=STREAM||!n;el.innerHTML=`${ICON.repeat}<b>${n}</b>`;el.title=`${n} ${t('left')}`;el.onclick=()=>go('mistakes')}

/* ---------- Boot ---------- */
async function boot(){
 const j=u=>fetch(u).then(r=>r.json());
 [Q,L,LANGS]=await Promise.all([j('data/questions.json'),j('data/lessons.json'),j('i18n/index.json').then(x=>x.languages)]);
 if(!st.ui){await loadLang(navigator.language.startsWith('ar')?'ar':'en');return firstRun()}
 await loadLang(st.ui);start();
}
async function loadLang(c){T=await fetch(`i18n/${c}.json`).then(r=>r.json());st.ui=c;document.documentElement.lang=c;document.documentElement.dir=T._dir||'ltr'}
async function firstRun(){
 const names=await Promise.all(LANGS.map(c=>fetch(`i18n/${c}.json`).then(r=>r.json()).then(x=>[c,x._name])));
 app.innerHTML=`<section class="pick"><img src="img/logo-full.svg" width="130" alt="Slaag"><p class="big">${ICON.globe}</p>
  <div class="grid2">${names.map(([c,n])=>`<button class="lang" data-c="${c}">${esc(n)}</button>`).join('')}</div>
  <p class="big">📝 ${ICON.exam}</p><div class="grid2"><button class="lang ex" data-e="nl">🇧🇪 Nederlands</button><button class="lang ex" data-e="fr">🇧🇪 Français</button></div>
  <button id="go" class="primary">${ICON.play}</button></section>`;
 let pc=st.ui;const mark=()=>app.querySelectorAll('.lang').forEach(b=>b.classList.toggle('sel',b.dataset.c===pc||b.dataset.e===st.ex));mark();
 app.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.c)pc=b.dataset.c;if(b.dataset.e)st.ex=b.dataset.e;mark();
  if(b.id==='go'){app.onclick=null;LS.set('ui',pc);LS.set('ex',st.ex);loadLang(pc).then(start)}};
}
function start(){
 $('#menuBtn').innerHTML=ICON.menu;$('#menuBtn').onclick=toggleMenu;
 if(STREAM){document.body.classList.add('stream');return stream()}
 window.onhashchange=route;route();updCount();
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
}
function go(h){location.hash=h}
function route(){closeMenu();clearTimers();const [v,a]=(location.hash.slice(1)||'home').split('/');
 ({home,lessons,lesson:()=>lesson(a),practice:()=>quiz('practice',a),mistakes:()=>quiz('mistakes'),exam:examIntro}[v]||home)()}

/* ---------- Menu (everything non-essential lives here) ---------- */
function toggleMenu(){const m=$('#menu');m.hidden?openMenu():closeMenu()}
function closeMenu(){$('#menu').hidden=true}
function openMenu(){const m=$('#menu');m.hidden=false;
 m.innerHTML=`<button class="icon-btn close" id="mx">${ICON.x}</button>
 <a href="#home">${ICON.home}${t('home')}</a><a href="#lessons">${ICON.book}${t('lessons')}</a><a href="#practice">${ICON.play}${t('practice')}</a>
 <a href="#mistakes">${ICON.repeat}${t('mistakes')}</a><a href="#exam">${ICON.exam}${t('exam')}</a><a href="?stream=1" target="_blank">${ICON.tv}${t('stream')}</a>
 <label>${ICON.globe}${t('uiLang')}<select id="sUi">${LANGS.map(c=>`<option value="${c}" ${c===st.ui?'selected':''}>${c.toUpperCase()}</option>`).join('')}</select></label>
 <label>${ICON.exam}${t('examLang')}<select id="sEx"><option value="nl">Nederlands</option><option value="fr" ${st.ex==='fr'?'selected':''}>Français</option></select></label>
 <label>${ICON.next}${t('autoDelay')}<select id="sDl">${[0,1,1.5,2,3].map(v=>`<option value="${v}" ${v==st.delay?'selected':''}>${v||t('off')}</option>`).join('')}</select></label>
 <button id="rst" class="ghost">${ICON.x}${t('reset')}</button><p class="note">⚠ ${t('sample')}</p>`;
 $('#mx').onclick=closeMenu;
 $('#sUi').onchange=e=>{LS.set('ui',e.target.value);loadLang(e.target.value).then(()=>{route();updCount()})};
 $('#sEx').onchange=e=>{st.ex=e.target.value;LS.set('ex',st.ex);route()};
 $('#sDl').onchange=e=>{st.delay=+e.target.value;LS.set('delay',st.delay)};
 $('#rst').onclick=()=>{if(confirm(t('reset')+'?')){Object.keys(localStorage).filter(k=>k.startsWith('slaag.')).forEach(k=>localStorage.removeItem(k));location.reload()}};
}

/* ---------- Screens ---------- */
function home(){const n=M.list().length,pos=LS.get('pos',{}).practice;
 app.innerHTML=`<section class="home"><img class="home-logo" src="img/logo-full.svg" alt="Slaag"><h1 class="tag">${esc(t('tagline'))}</h1><p class="lic">${esc(t('licence'))}</p>
 <div class="tiles">
  <a class="tile" href="#lessons">${ICON.book}<span>${t('lessons')}</span></a>
  <a class="tile" href="#practice">${ICON.play}<span>${t('practice')}</span>${pos?`<small>${ICON.next}${pos+1}/${Q.length}</small>`:''}</a>
  <a class="tile ${n?'warn':''}" href="#mistakes">${ICON.repeat}<span>${t('mistakes')}</span><small>${n?`${n} ${t('left')}`:'✔'}</small></a>
  <a class="tile dark" href="#exam">${ICON.exam}<span>${t('exam')}</span><small>${ICON.timer}15s</small></a>
 </div><p class="note">⚠ ${t('sample')}</p></section>`}
function lessons(){app.innerHTML=`<section><h2>${ICON.book}${t('lessons')}</h2><div class="list">${L.map((l,i)=>`<a class="row" href="#lesson/${l.id}"><b>${i+1}</b>${esc(l.title[st.ui]||l.title.en)}${ICON.next}</a>`).join('')}</div></section>`}
function lesson(id){const l=L.find(x=>x.id===id);if(!l)return lessons();const ui=st.ui in l.body?st.ui:'en';
 app.innerHTML=`<section class="lesson"><h2>${ICON.book}${esc(l.title[ui])}</h2><ul>${l.body[ui].map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
 <h3>${ICON.tr}${t('terms')}</h3><div class="terms">${l.terms.map(w=>`<button class="term" data-w="${esc(w[st.ex])}">${ICON.audio}<b>${esc(w[st.ex])}</b><span>${esc(w[ui]||w.en)}</span></button>`).join('')}</div>
 <a class="primary" href="#practice/${l.id}">${ICON.play}${t('quiz')}</a></section>`;
 app.querySelectorAll('.term').forEach(b=>b.onclick=()=>say(b.dataset.w))}

/* ---------- Speech ---------- */
function say(txt){if(!('speechSynthesis' in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang=st.ex==='fr'?'fr-BE':'nl-BE';speechSynthesis.speak(u)}

/* ---------- Question card ---------- */
function card(q,i,n,opt={}){const ex=st.ex,ui=st.ui in q.q?st.ui:'en';
 return `<div class="card">
  <div class="qtop"><span class="pill">${i+1}/${n}</span>${q.weight>1?`<span class="pill red" title="${t('serious')}">⚠ ×5</span>`:''}
   ${opt.timer?`<span class="pill timer">${ICON.timer}<b id="tm">15</b></span>`:''}<span class="sp"></span>
   ${opt.tools===false?'':`<button class="icon-btn ${st.tr?'on':''}" id="bTr" title="${t('translate')}">${ICON.tr}</button><button class="icon-btn" id="bAu" title="${t('listen')}">${ICON.audio}</button>`}</div>
  ${q.sign?`<div class="signbox">${SIGN[q.sign]||''}</div>`:''}
  <p class="qt" dir="ltr" lang="${ex}">${esc(q.q[ex])}</p>${st.tr&&ui!==ex?`<p class="qtr">${esc(q.q[ui])}</p>`:''}
  <div class="opts">${q.opts[ex].map((o,k)=>`<button class="opt" dir="ltr" data-k="${k}"><i>${'ABC'[k]}</i><span dir="ltr" lang="${ex}">${esc(o)}</span>${st.tr&&ui!==ex?`<small>${esc(q.opts[ui][k])}</small>`:''}<em class="mk"></em></button>`).join('')}</div>
  <div id="fb"></div></div>`}
function bindTools(q,rerender){const a=$('#bAu'),b=$('#bTr');
 if(a)a.onclick=()=>say(q.q[st.ex]+'. '+q.opts[st.ex].map((o,k)=>'ABC'[k]+': '+o).join('. '));
 if(b)b.onclick=()=>{st.tr=!st.tr;LS.set('tr',st.tr);rerender()}}

/* ---------- Practice / lesson quiz / mistakes ---------- */
let timers=[];const clearTimers=()=>{timers.forEach(clearTimeout);timers.forEach(clearInterval);timers=[];document.onkeydown=null};
function quiz(mode,lessonId){
 let pool;
 if(mode==='mistakes'){pool=M.list().map(byId);if(!pool.length){app.innerHTML=`<section class="empty">${ICON.ok}<h2>${t('none')}</h2><a class="primary" href="#practice">${ICON.play}${t('practice')}</a></section>`;return}}
 else{pool=lessonId?Q.filter(q=>q.lesson===lessonId):Q.slice();
  // mix due mistakes into practice: one every 4 questions
  const due=M.due().map(byId).filter(q=>!lessonId||q.lesson===lessonId);const mixed=[];let d=0;
  pool.forEach((q,i)=>{mixed.push(q);if(i%4===3&&d<due.length)mixed.push(Object.assign({},due[d++],{_rev:1}))});pool=mixed}
 const key=mode+(lessonId||'');const pos=LS.get('pos',{});let i=Math.min(pos[key]||0,pool.length-1),answered={};
 const savePos=()=>{const p=LS.get('pos',{});p[key]=i;LS.set('pos',p)};
 function render(){clearTimers();const q=pool[i];
  app.innerHTML=`<section class="quiz">${mode==='mistakes'?`<p class="hint">${ICON.repeat}${t('streak')} · <b>${(M.all()[q.id]||{}).streak||0}/${NEED}</b></p>`:q._rev?`<p class="hint">${ICON.repeat}${t('mistakes')}</p>`:''}
   ${card(q,i,pool.length)}</section>
   <div class="navbar">${ib('back',t('back'),`id="bB" ${i?'':'disabled'}`)}${ib('bulb',t('explain'),'id="bE" class="ghost" hidden')}${ib('next',t('next'),'id="bN" class="primary"')}</div>`;
  bindTools(q,render);
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>pick(+b.dataset.k));
  $('#bB').onclick=prev;$('#bN').onclick=next;$('#bE').onclick=()=>explain(q);
  if(answered[i]!=null)show(answered[i],false);
  document.onkeydown=e=>{if(e.target.tagName==='SELECT')return;const rtl=document.dir==='rtl';
   if(e.key>='1'&&e.key<='3')pick(+e.key-1);else if(e.key==='Enter')next();
   else if(e.key==='ArrowRight')rtl?prev():next();else if(e.key==='ArrowLeft')rtl?next():prev()};
  swipe(app,dir=>{const rtl=document.dir==='rtl';(dir>0)!==rtl?prev():next()});
 }
 function pick(k){if(answered[i]!=null)return;const q=pool[i];answered[i]=k;const ok=k===q.answer;M.record(q.id,ok);show(k,true)}
 function show(k,fresh){const q=pool[i],ok=k===q.answer;
  app.querySelectorAll('.opt').forEach((b,j)=>{b.disabled=true;if(j===q.answer){b.classList.add('right');b.querySelector('.mk').innerHTML=ICON.ok}else if(j===k){b.classList.add('wrong');b.querySelector('.mk').innerHTML=ICON.no}});
  $('#fb').innerHTML=`<p class="fb ${ok?'ok':'bad'}">${ok?ICON.ok+t('correct'):ICON.no+t('wrong')}</p>`;$('#bE').hidden=false;
  if(ok&&fresh&&st.delay>0&&i<pool.length-1)timers.push(setTimeout(next,st.delay*1000));}
 function next(){if(i<pool.length-1){i++;savePos();render()}else{const p=LS.get('pos',{});delete p[key];LS.set('pos',p);go('home')}}
 function prev(){if(i>0){i--;savePos();render()}}
 render();
}
function explain(q){const ui=st.ui in q.explain?st.ui:'en';const fb=$('#fb');if(fb.querySelector('.ex'))return;
 fb.insertAdjacentHTML('beforeend',`<div class="ex">${ICON.bulb}<p>${esc(q.explain[ui])}</p></div>`)}
function swipe(el,cb){let x0=null;el.ontouchstart=e=>{x0=e.touches[0].clientX};el.ontouchend=e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>60)cb(dx)}}

/* ---------- Mock exam ---------- */
function examIntro(){const n=Math.min(50,Q.length),need=Math.ceil(41*n/50);
 const r=(ic,l,v,c='')=>`<div class="srow ${c}"><span class="sic">${ic}</span><span class="sl">${esc(l)}</span><b>${v}</b></div>`;
 app.innerHTML=`<section class="intro"><p class="lic">${esc(t('licence'))}</p><h2>${ICON.exam}${t('exam')}</h2>
 <div class="scard">${r(ICON.exam,t('nQ'),n)}${r(ICON.timer,t('tQ'),`15 ${esc(t('sec'))}`)}${r(ICON.ok,t('need'),`${need}/${n}`,'g')}${r('⚠',t('sf'),'<span dir="ltr">−5</span>','o')}</div>
 <p class="note">${esc(t('real'))}</p><button class="primary bigbtn" id="go"><span>${t('start')}</span>${ICON.play}</button></section>`;$('#go').onclick=exam}
function exam(){const qs=shuffle(Q).slice(0,50),n=qs.length,ans=[];let i=0,left,cur=null,done=false;
 /* Real-exam rules: pick → confirm → next. No feedback, no going back, 15s → counts as unanswered. */
 function render(){clearTimers();const q=qs[i];left=15;cur=null;done=false;
  app.innerHTML=`<section class="quiz">${card(q,i,n,{timer:true,tools:true})}</section><div class="navbar"><button id="bA" class="auto ${st.auto?'on':''}" aria-pressed="${st.auto}">${ICON.bolt}<span>${t('auto')}</span></button>${ib('okc',t('confirm'),'id="bC" class="primary" disabled')}</div>`;
  $('#bA').onclick=()=>{st.auto=!st.auto;LS.set('auto',st.auto);const b=$('#bA');b.classList.toggle('on',st.auto);b.setAttribute('aria-pressed',st.auto)};
  bindTools(q,()=>{const c=cur,l=left;render();left=l;$('#tm').textContent=l;if(c!=null)sel(c)});
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>sel(+b.dataset.k));
  $('#bC').onclick=confirmA;
  document.onkeydown=e=>{if(e.target.tagName==='SELECT')return;if(e.key>='1'&&e.key<='3')sel(+e.key-1);else if(e.key==='Enter'){e.preventDefault();confirmA()}};
  timers.push(setInterval(()=>{left--;const el=$('#tm');if(el){el.textContent=Math.max(0,left);if(left<=5)el.parentNode.classList.add('red')}if(left<=0)commit(null)},1000));}
 function sel(k){if(done)return;cur=k;app.querySelectorAll('.opt').forEach((b,j)=>b.classList.toggle('sel',j===k));const bn=$('#bC');if(bn)bn.disabled=false;if(st.auto)commit(k)}
 function confirmA(){if(cur!=null)commit(cur)}
 function commit(k){if(done)return;done=true;ans[i]=k;M.record(qs[i].id,k===qs[i].answer);if(i<n-1){i++;render()}else finish()}
 function finish(){clearTimers();let score=n;const wrong=[];
  qs.forEach((q,j)=>{if(ans[j]!==q.answer){score-=q.weight>1?5:1;wrong.push(j)}});
  score=Math.max(0,score);const need=Math.ceil(41*n/50),pass=score>=need,ex=st.ex;
  app.innerHTML=`<section class="result ${pass?'ok':'bad'}"><div class="big">${pass?ICON.ok:ICON.no}</div><h2>${pass?t('pass'):t('fail')}</h2>
   <p class="score">${score}/${n} <small>(${ICON.ok}${need})</small></p>
   <p class="hint">${ICON.no}<b>${wrong.length}</b> · ${ICON.repeat}${t('mistakes')}</p>
   <div class="list review">${wrong.map(j=>{const q=qs[j],a=ans[j];return `<div class="rv card">
     <div class="qtop"><span class="pill">${j+1}</span>${q.weight>1?'<span class="pill red">⚠ ×5</span>':''}</div>
     ${q.sign?`<div class="signbox">${SIGN[q.sign]||''}</div>`:''}<p class="qt" dir="ltr">${esc(q.q[ex])}</p>
     <p class="fb bad" dir="ltr">${ICON.no}${a==null?'⏱ '+esc(t('noAns')):esc(q.opts[ex][a])}</p>
     <p class="fb ok" dir="ltr">${ICON.ok}${esc(q.opts[ex][q.answer])}</p>
     <button class="ghost bE" data-j="${j}">${ICON.bulb}<span>${t('explain')}</span></button><div class="exw"></div></div>`}).join('')}</div>
   <div class="navbar static">${ib('repeat',t('mistakes'),'id="bM" class="primary"')}${ib('home',t('home'),'id="bH"')}</div></section>`;
  app.querySelectorAll('.bE').forEach(b=>b.onclick=()=>{const q=qs[+b.dataset.j],ui=st.ui in q.explain?st.ui:'en',w=b.nextElementSibling;if(!w.innerHTML)w.innerHTML=`<div class="ex">${ICON.bulb}<p>${esc(q.explain[ui])}</p></div>`});
  $('#bM').onclick=()=>go('mistakes');$('#bH').onclick=()=>go('home');}
 render();
}

/* ---------- Stream mode (?stream=1) — no personal data ---------- */
function stream(){let layout=P.get('layout')||'h',qs=shuffle(Q),i=0,left,shown=false;$('#top').hidden=true;
 function render(){clearTimers();shown=false;left=15;const q=qs[i];document.body.dataset.layout=layout;
  app.innerHTML=`<section class="stage ${layout}"><div class="sbar"><img src="img/logo.svg" alt=""><b>Slaag</b><span class="pill timer">${ICON.timer}<b id="tm">15</b></span></div>
   ${q.sign?`<div class="signbox">${SIGN[q.sign]}</div>`:''}<p class="qt" dir="ltr">${esc(q.q[st.ex])}</p>
   <div class="opts">${q.opts[st.ex].map((o,k)=>`<div class="opt" dir="ltr"><i>${'ABC'[k]}</i><span dir="ltr">${esc(o)}</span><em class="mk"></em></div>`).join('')}</div>
   <div id="fb"></div><div class="wm"><img class="wl" src="img/logo.svg" alt="Slaag"><img src="img/qr.svg" alt="QR"><span>ramboosdev.github.io/slaag<br>${esc(t('tagline'))}</span></div></section>
   <div class="ctrl">${ib('eye',t('reveal'),'id="bR" class="primary"')}${ib('bulb',t('explain'),'id="bE"')}${ib('next',t('next'),'id="bN"')}
    <button id="bL" class="icon-btn">${layout==='h'?ICON.portrait:ICON.landscape}</button><button id="bX" class="icon-btn">${ICON.globe}</button></div>`;
  $('#bR').onclick=reveal;$('#bN').onclick=()=>{i=(i+1)%qs.length;render()};$('#bE').onclick=()=>{reveal();explain(q)};
  $('#bL').onclick=()=>{layout=layout==='h'?'v':'h';render()};$('#bX').onclick=()=>{st.ex=st.ex==='nl'?'fr':'nl';render()};
  document.onkeydown=e=>{if(e.key===' '||e.key==='r')reveal();if(e.key==='Enter'||e.key==='ArrowRight')$('#bN').click()};
  timers.push(setInterval(()=>{if(shown)return;left=Math.max(0,left-1);$('#tm').textContent=left},1000));}
 function reveal(){if(shown)return;shown=true;const q=qs[i];app.querySelectorAll('.stage .opt').forEach((b,j)=>{b.classList.add(j===q.answer?'right':'dim');if(j===q.answer)b.querySelector('.mk').innerHTML=ICON.ok})}
 render();
}
boot().catch(e=>{app.innerHTML='<p class="note">Error loading. '+esc(e.message)+'</p>';console.error(e)});
