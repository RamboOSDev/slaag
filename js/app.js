'use strict';
/* Slaag v1 — vanilla JS, no build step */
const $=s=>document.querySelector(s), app=$('#app');
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem('slaag.'+k))??d}catch(e){return d}},set:(k,v)=>localStorage.setItem('slaag.'+k,JSON.stringify(v))};
const P=new URLSearchParams(location.search), STREAM=P.get('stream')==='1';
let T={}, LANGS=[], Q=[], L=[], st={ui:LS.get('ui',null),ex:LS.get('ex','nl'),delay:LS.get('delay',1.5),tr:LS.get('tr',true),auto:LS.get('auto',false),shuf:LS.get('shuf',false),read:LS.get('read',false)};
const SESSION=sessionStorage.getItem('slaag.s')||String(Date.now()); sessionStorage.setItem('slaag.s',SESSION);
const t=k=>T[k]||k, esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ib=(ic,label,attrs='')=>`<button ${attrs}>${ICON[ic]}<span>${esc(label)}</span></button>`;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const QI=new Map();const byId=id=>QI.get(id);
/* text helpers: content has nl + ar; other languages fall back */
const tx=(o,l)=>o?(o[l]??o.nl??o.ar??''):'';const ux=o=>tx(o,st.ui==='en'?'nl':st.ui);
const nrm=v=>String(v??'').trim().replace(',','.').replace(/\s+/g,'').toLowerCase();
const isOk=(q,k)=>q.num!=null?k!=null&&nrm(k)===nrm(q.num):k===q.answer;
const ansTxt=(q,k,ex)=>q.num!=null?String(k):tx(q.opts,ex)[k];
let LR=null,AMR=[];
/* Amr questions carry no grave-error tag: infer zware fout from classic topics (overtaking, rail crossings, red light/police, wrong-way, solid line, stop, pedestrian crossing). */
const ZF=/rood licht|overweg|spoorweg|tegen de rijrichting|doorlopende (witte )?lijn|stopbord|oversteekplaats|zebrapad|spookrij|inhalen|haaientanden|agent/i;

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
 [Q,L,LANGS,LR]=await Promise.all([j('data/questions.json'),j('data/lessons.json'),j('i18n/index.json').then(x=>x.languages),j('data/learn.json')]);Q.forEach(q=>QI.set(q.id,q));AMR=await j('data/amr.json').catch(()=>[]);AMR.forEach(q=>{QI.set(q.id,q);if(ZF.test(q.q.nl||''))q.zf=1});st.ex='nl';
 if(!st.ui){await loadLang(navigator.language.startsWith('ar')?'ar':'en');return firstRun()}
 await loadLang(st.ui);start();
}
async function loadLang(c){T=await fetch(`i18n/${c}.json`).then(r=>r.json());st.ui=c;document.documentElement.lang=c;document.documentElement.dir=T._dir||'ltr'}
async function firstRun(){
 const names=await Promise.all(LANGS.map(c=>fetch(`i18n/${c}.json`).then(r=>r.json()).then(x=>[c,x._name])));
 app.innerHTML=`<section class="pick"><img src="img/logo-full.svg" width="130" alt="Slaag"><p class="big">${ICON.globe}</p><p class="lbl">اللغة · Language</p>
  <div class="grid2">${names.map(([c,n])=>`<button class="lang" data-c="${c}">${esc(n)}</button>`).join('')}</div>
  <p class="big">📝 ${ICON.exam}</p><p class="lbl">لغة الامتحان · Exam language</p><div class="grid2"><button class="lang ex" data-e="nl">🇧🇪 Nederlands</button></div>
  <button id="go" class="primary">${ICON.play}<span>ابدأ · Start</span></button></section>`;
 let pc=st.ui;const mark=()=>app.querySelectorAll('.lang').forEach(b=>b.classList.toggle('sel',b.dataset.c===pc||b.dataset.e===st.ex));mark();
 app.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.c)pc=b.dataset.c;if(b.dataset.e)st.ex=b.dataset.e;mark();
  if(b.id==='go'){app.onclick=null;LS.set('ui',pc);LS.set('ex',st.ex);loadLang(pc).then(start)}};
}
function start(){
 $('#menuBtn').innerHTML=ICON.menu;$('#menuBtn').onclick=toggleMenu;$('#menuBtn').setAttribute('aria-expanded','false');
 if(STREAM){document.body.classList.add('stream');return stream()}
 window.onhashchange=route;route();updCount();
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
}
function go(h){location.hash=h}
let examLive=null,skipRoute=false;
function route(){if(skipRoute){skipRoute=false;return}
 if(examLive&&location.hash!==examLive){if(!confirm(t('leaveExam'))){skipRoute=true;location.hash=examLive;return}examLive=null}
 stopSound();menuHist=false;closeMenu(true);clearTimers();const [v,a]=(location.hash.slice(1)||'home').split('/');
 ({home,lessons,signs:()=>signs(a),lesson:()=>lesson(a),practice:()=>quiz('practice',a),amr:()=>amrQuiz(),mistakes:()=>quiz('mistakes'),exam:()=>examIntro(),amrexam:()=>examIntro(1)}[v]||home)()}

/* ---------- Menu (everything non-essential lives here) ---------- */
function toggleMenu(){const m=$('#menu');m.hidden?openMenu():closeMenu()}
let menuHist=false;
function closeMenu(fromPop){const m=$('#menu');if(m.hidden)return;m.hidden=true;$('#backdrop').hidden=true;document.body.classList.remove('noscroll');
 if(menuHist&&!fromPop){menuHist=false;history.back()}menuHist=false;$('#menuBtn').setAttribute('aria-expanded','false');$('#menuBtn').focus({preventScroll:true})}
window.addEventListener('popstate',()=>{if(menuHist){menuHist=false;closeMenu(true)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#menu').hidden){e.stopPropagation();closeMenu()}},true);
function openMenu(){const m=$('#menu');m.hidden=false;$('#backdrop').hidden=false;document.body.classList.add('noscroll');
 $('#backdrop').onclick=()=>closeMenu();if(!menuHist){history.pushState({menu:1},'');menuHist=true}$('#menuBtn').setAttribute('aria-expanded','true');
 let x0=null;m.ontouchstart=e=>{x0=e.touches[0].clientX};m.ontouchend=e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>60&&((dx>0)===(document.dir!=='rtl')))closeMenu()};
 m.innerHTML=`<button class="icon-btn close" id="mx">${ICON.x}</button>
 <a href="#home">${ICON.home}${t('home')}</a><a href="#lessons">${ICON.book}${t('lessons')}</a><a href="#signs">${ICON.danger||ICON.eye}${t('signs')}</a><a href="#practice">${ICON.play}${t('practice')}</a><a href="#amr">${ICON.star||ICON.book}${t('amr')}</a>
 <a href="#mistakes">${ICON.repeat}${t('mistakes')}</a><a href="#exam">${ICON.exam}${t('exam')}</a><a href="#amrexam">${ICON.exam}${t('amrExam')}</a><a href="?stream=1" target="_blank">${ICON.tv}${t('stream')}</a>
 <label>${ICON.globe}${t('uiLang')}<select id="sUi">${LANGS.map(c=>`<option value="${c}" ${c===st.ui?'selected':''}>${c.toUpperCase()}</option>`).join('')}</select></label>
 <label>${ICON.exam}${t('examLang')}<select id="sEx"><option value="nl">Nederlands</option></select></label>
 <label>${ICON.next}${t('autoDelay')}<select id="sDl">${[0,1,1.5,2,3].map(v=>`<option value="${v}" ${v==st.delay?'selected':''}>${v||t('off')}</option>`).join('')}</select></label>
 <label>${ICON.repeat}${t('shuffle')}<select id="sSh"><option value="0">${t('off')}</option><option value="1" ${st.shuf?'selected':''}>${t('on')}</option></select></label>
 <button id="rst" class="ghost">${ICON.x}${t('reset')}</button><p class="note">⚠ ${t('sample')}</p>`;
 $('#mx').onclick=()=>closeMenu();m.querySelectorAll('a').forEach(a=>a.onclick=()=>{if(a.target)closeMenu();else{menuHist=false;}});setTimeout(()=>$('#mx').focus(),0);
 $('#sUi').onchange=e=>{LS.set('ui',e.target.value);loadLang(e.target.value).then(()=>{route();updCount()})};
 $('#sEx').onchange=e=>{st.ex=e.target.value;LS.set('ex',st.ex);route()};
 $('#sSh').onchange=e=>{st.shuf=e.target.value==='1';LS.set('shuf',st.shuf);const p=LS.get('pos',{});delete p.practice;delete p.amr;LS.set('pos',p);route()};
 $('#sDl').onchange=e=>{st.delay=+e.target.value;LS.set('delay',st.delay)};
 $('#rst').onclick=()=>{if(confirm(t('reset')+'?')){Object.keys(localStorage).filter(k=>k.startsWith('slaag.')).forEach(k=>localStorage.removeItem(k));location.reload()}};
}

/* ---------- Screens ---------- */
function home(){const n=M.list().length,pos=LS.get('pos',{}).practice;
 app.innerHTML=`<section class="home"><img class="home-logo" src="img/logo-full.svg" alt="Slaag"><h1 class="tag">${esc(t('tagline'))}</h1><p class="lic">${esc(t('licence'))}</p>
 <div class="tiles">
  <a class="tile" href="#lessons">${ICON.book}<span>${t('lessons')}</span></a>
  <a class="tile" href="#signs">${ICON.danger||ICON.eye}<span>${t('signs')}</span><small>${LR.signs.length}</small></a>
  <a class="tile" href="#practice">${ICON.play}<span>${t('practice')}</span>${pos?`<small>${ICON.next}${pos+1}/${Q.length}</small>`:''}</a>
  <a class="tile" href="#amr">${ICON.star||ICON.book}<span>${t('amr')}</span><small>${AMR.length}</small></a>
  <a class="tile ${n?'warn':''}" href="#mistakes">${ICON.repeat}<span>${t('mistakes')}</span><small>${n?`${n} ${t('left')}`:'✔'}</small></a>
  <a class="tile dark" href="#exam">${ICON.exam}<span>${t('exam')}</span><small>${ICON.timer}15s</small></a>
  <a class="tile dark" href="#amrexam">${ICON.exam}<span>${t('amrExam')}</span><small>${ICON.timer}15s</small></a>
 </div><p class="note">⚠ ${t('sample')}</p></section>`}
function inL(q,id){if(q.lesson===id)return true;const l=L.find(x=>x.id===id);return !!(l&&l.qids&&l.qids.includes(q.id))}
function lessons(){app.innerHTML=`<section><h2>${ICON.book}${t('lessons')}</h2><div class="list">${L.map((l,i)=>`<a class="row" href="#lesson/${l.id}"><b>${i+1}</b><span>${esc(l.title[st.ui]||l.title.en)}${l.n?` <small class="mut">(${l.n})</small>`:''}</span>${ICON.next}</a>`).join('')}</div></section>`}
function lesson(id){const l=L.find(x=>x.id===id);if(!l)return lessons();const ui=st.ui in l.body?st.ui:'nl';
 const li=(Q.find(q=>inL(q,l.id)&&q.img)||{}).img;
 app.innerHTML=`<section class="lesson"><h2>${ICON.book}${esc(l.title[st.ui]||l.title.en)}</h2>${li?`<div class="qimg sm"><img src="${li}" alt=""></div>`:''}<ul>${l.body[ui].map((x,k)=>x||l.body.ar[k]).map((x,k)=>`<li>${esc(x)}${ui!=='nl'&&l.body.nl[k]&&l.body.nl[k]!==x?`<small class="nl" dir="ltr">${esc(l.body.nl[k])}</small>`:''}</li>`).join('')}</ul>
 ${l.terms.length?`<h3>${ICON.tr}${t('terms')}</h3><div class="terms">${l.terms.map(w=>`<button class="term" data-w="${esc(w[st.ex])}">${ICON.audio}<b>${esc(w[st.ex])}</b><span>${esc(w[ui]||w.en)}</span></button>`).join('')}</div>`:''}
 ${l.n?`<a class="primary" href="#practice/${l.id}">${ICON.play}${t('quiz')} (${l.n})</a>`:''}</section>`;
 app.querySelectorAll('.term').forEach(b=>b.onclick=()=>say(b.dataset.w,b))}

/* ---------- Signs & key facts (learning) ---------- */
function signs(tab){tab=tab||'all';const cats=[...new Set(LR.signs.map(s=>s.cat))];
 const tabs=[['all',t('signs')],['pairs',t('traps')],['facts',t('facts')]];
 let body='';
 if(tab==='pairs')body=LR.pairs.map(([a,b])=>`<div class="pair">${[a,b].map(i=>{const s=LR.signs[i];return `<button class="sg" data-w="${esc(s.nl)}"><img src="${s.img}" alt="${esc(s.c)}" loading="lazy"><b>${esc(s.ar)}</b><small dir="ltr">${esc(s.c)} · ${esc(s.nl)}</small></button>`}).join('<span class="vs">⇄</span>')}</div>`).join('');
 else if(tab==='facts')body=Object.entries(LR.factCats).map(([k,v])=>`<h3>${esc(v)}</h3><ul class="facts">${LR.facts.filter(x=>x.k===k).map(x=>`<li><button class="term" data-w="${esc(x.nl)}">${ICON.audio}</button>${esc(st.ui==='ar'?x.ar:x.nl)}<small class="nl" dir="ltr">${st.ui==='ar'?esc(x.nl)+' · ':''}Les ${x.l}</small></li>`).join('')}</ul>`).join('');
 else body=cats.map(c=>`<h3>${esc(c)}</h3><div class="sgrid">${LR.signs.filter(s=>s.cat===c).map(s=>`<button class="sg" data-w="${esc(s.nl)}"><img src="${s.img}" alt="${esc(s.c)}" loading="lazy"><b>${esc(st.ui==='ar'?s.ar:s.nl)}</b><small dir="ltr">${esc(s.c)}${st.ui==='ar'?' · '+esc(s.nl):''}</small></button>`).join('')}</div>`).join('');
 app.innerHTML=`<section class="learn"><h2>${ICON.danger||ICON.eye}${t('signs')}</h2><div class="chips">${tabs.map(([k,v])=>`<a class="chip ${k===tab?'on':''}" href="#signs/${k}">${esc(v)}</a>`).join('')}</div>${body}</section>`;
 app.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>say(b.dataset.w,b))}

/* ---------- Speech ---------- */
/* Sound: one player for MP3 + browser voice, with a visible state on the button that started it */
const STOPI='<svg class="ic" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>';
let AU=null,SB=null,SBH='';
/* iOS: one persistent <audio> element, unlocked inside the first user gesture; TTS unlocked the same way */
const AEL=new Audio();AEL.preload='auto';AEL.setAttribute('playsinline','');let UNL=false;
function unlock(){if(UNL)return;UNL=true;
 try{if(!AU){AEL.muted=true;AEL.src='audio/silence.mp3';const pr=AEL.play();if(pr)pr.then(()=>{if(!AU){AEL.pause()}AEL.muted=false}).catch(()=>{AEL.muted=false})}}catch(e){}
 try{if(!speechSynthesis.speaking){const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}}catch(e){}}
['touchend','pointerdown','click','keydown'].forEach(ev=>document.addEventListener(ev,unlock,{capture:true,passive:true}));
let VO=null;function pickVoice(){try{const v=speechSynthesis.getVoices(),l=st.ex==='fr'?'fr':'nl';VO=v.find(x=>x.lang.replace('_','-')===(l==='fr'?'fr-BE':'nl-BE'))||v.find(x=>x.lang.toLowerCase().startsWith(l))||null}catch(e){}}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function sndReset(err){if(SB){SB.classList.remove('playing');SB.innerHTML=SBH;SB.setAttribute('aria-pressed','false');if(err){SB.classList.add('err');SB.title=t('noAudio')}}SB=null}
function stopSound(){if(AU){AU.onended=AU.onerror=null;AU.pause();AU=null}try{speechSynthesis.cancel()}catch(e){}sndReset()}
function sndOn(b){if(!b)return;SB=b;SBH=b.innerHTML;b.classList.remove('err');b.classList.add('playing');b.setAttribute('aria-pressed','true');
 const ic=b.querySelector('.ic,svg');if(ic)ic.outerHTML=STOPI;else b.insertAdjacentHTML('afterbegin',STOPI)}
function say(txt,b){const was=b&&b===SB;stopSound();if(was)return;
 if(!('speechSynthesis' in window)||!txt){if(b){SB=b;SBH=b.innerHTML;sndReset(true)}return}
 const u=new SpeechSynthesisUtterance(txt);if(!VO)pickVoice();if(VO){u.voice=VO;u.lang=VO.lang}else u.lang=st.ex==='fr'?'fr-BE':'nl-BE';try{speechSynthesis.resume()}catch(e){}sndOn(b);const me=SB;
 u.onend=()=>{if(SB===me)sndReset()};u.onerror=e=>{if(SB!==me)return;if(e.error==='not-allowed')return sndBlocked();sndReset(e.error!=='interrupted'&&e.error!=='canceled')};speechSynthesis.speak(u)}
function sndBlocked(){const b=SB;sndReset();if(b){b.classList.add('blocked');b.title=t('tapResume')}}
function play(q,fb,b){if(b&&b===SB){stopSound();return}stopSound();if(!q.aud)return say(fb,b);
 const a=AU=AEL;a.onended=a.onerror=null;a.muted=false;a.src=q.aud;sndOn(b);const me=SB;
 a.onended=()=>{if(AU===a){AU=null;if(SB===me)sndReset()}};
 a.onerror=()=>{if(AU===a){AU=null;if(SB===me){SB.classList.remove('playing');SB.innerHTML=SBH;SB=null}say(fb,b)}};
 a.play().catch(e=>{if(e&&e.name==='NotAllowedError'&&AU===a){AU=null;sndBlocked()}else if(a.onerror)a.onerror()})}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSound()});

/* ---------- Question card ---------- */
function card(q,i,n,opt={}){const ex=st.ex,ui=st.ui in q.q?st.ui:'nl';
 return `<div class="card">
  <div class="qtop"><span class="pill">${i+1}/${n}</span>${q.weight>1?`<span class="pill red" title="${t('serious')}">⚠ ×5</span>`:''}
   ${opt.timer?`<span class="pill timer">${ICON.timer}<b id="tm">15</b></span>`:''}<span class="sp"></span>
   ${opt.tools===false?'':`<button class="icon-btn ${st.tr?'on':''}" id="bTr" title="${t('translate')}">${ICON.tr}</button><button class="icon-btn snd ${q.aud?'':'tts'}" id="bAu" aria-pressed="${st.read}" title="${t('listen')}${q.aud?'':' · '+t('ttsOnly')}">${ICON.audio}</button>`}</div>
  ${q.img?`<div class="qimg${/img\/s\/|img\/amr\/s_/.test(q.img)?' sgn':''}"><img src="${q.img}" alt="" width="600" height="340" decoding="async"></div>`:q.sign?`<div class="signbox">${SIGN[q.sign]||''}</div>`:''}
  <p class="qt" dir="ltr" lang="${ex}">${esc(tx(q.q,ex))}</p>${st.tr&&ui!==ex?`<p class="qtr">${esc(tx(q.q,ui))}</p>`:''}
  ${q.num!=null?`<form class="numf" id="nf"><input id="ni" inputmode="decimal" autocomplete="off" dir="ltr" placeholder="…"><button class="primary" type="submit">${ICON.okc}</button></form>`:
  `<div class="opts">${tx(q.opts,ex).map((o,k)=>`<button class="opt" dir="ltr" data-k="${k}"><i>${'ABC'[k]}</i><span dir="ltr" lang="${ex}">${esc(o)}</span>${st.tr&&ui!==ex?`<small>${esc(tx(q.opts,ui)[k])}</small>`:''}<em class="mk"></em></button>`).join('')}</div>`}
  <div id="fb"></div></div>`}
const readTxt=q=>tx(q.q,st.ex)+'. '+(q.num!=null?'':tx(q.opts,st.ex).map((o,k)=>'ABC'[k]+': '+o).join('. '));
function readBtn(a,q){if(!a)return;const set=()=>{a.classList.toggle('on',st.read);a.setAttribute('aria-pressed',st.read);a.title=t(st.read?'readOn':'readOff')};set();
 a.onclick=()=>{if(a.classList.contains('blocked')){a.classList.remove('blocked');set();return play(q,readTxt(q),a)}
  st.read=!st.read;LS.set('read',st.read);set();if(st.read)play(q,readTxt(q),a);else stopSound()};
 if(st.read&&!SB)play(q,readTxt(q),a)}
function bindTools(q,rerender){const a=$('#bAu'),b=$('#bTr');
 readBtn(a,q);
 if(b)b.onclick=()=>{st.tr=!st.tr;LS.set('tr',st.tr);rerender()}}


/* ---------- Amr adaptive spaced repetition ----------
   State is keyed by question id (never by position), on a global answer counter "step":
   S.c = consecutive correct, S.l = lapses, S.e = ease (interval multiplier), S.d = due step, S.n = times seen.
   Wrong → due again 3-5 answers later (gap shrinks with each lapse). Correct → after a mistake 6, 20, then 120+ answers; never-missed 30, 80, 200+ (×ease).
   3 correct in a row = mastered (shown rarely). Recent ids/texts are excluded so nothing repeats back-to-back. */
const SR={
 MAST:3,
 get(){return LS.get('srs',{step:0,q:{},cur:null,hist:[]})},
 put(s){LS.set('srs',s)},
 reset(){localStorage.removeItem('slaag.srs')},
 stats(s=SR.get()){let m=0,w=0,n=0;AMR.forEach(q=>{const e=s.q[q.id];if(!e)return;n++;if(e.c>=SR.MAST)m++;else if(e.l>0)w++});return{m,w,seen:n,tot:AMR.length}},
 answer(id,ok){const s=SR.get(),e=s.q[id]||(s.q[id]={c:0,l:0,e:2.5,d:0,n:0});s.step++;e.n++;
  if(ok){e.c++;e.e=Math.min(3,e.e+.1);e.d=s.step+Math.round((e.l?[0,6,20,120]:[0,30,80,200])[Math.min(e.c,3)]*e.e/2.5*(e.c>=SR.MAST?1+Math.random():1))}
  else{e.l++;e.c=0;e.e=Math.max(1.3,e.e-.2);e.d=s.step+Math.max(2,5-e.l)}
  s.hist=[id,...s.hist.filter(x=>x!==id)].slice(0,6);s.cur=null;SR.put(s)},
 pick(){const s=SR.get();if(s.cur&&byId(s.cur))return byId(s.cur);
  const rec=new Set(s.hist.slice(0,2)),recT=new Set(s.hist.slice(0,3).map(id=>{const q=byId(id);return q?tx(q.q,'nl').trim().toLowerCase():''}));
  const ok=q=>!rec.has(q.id)&&!recT.has(tx(q.q,'nl').trim().toLowerCase());
  const due=[],weak=[],fresh=[],rest=[];
  for(const q of AMR){if(!ok(q))continue;const e=s.q[q.id];
   if(!e)fresh.push(q);else if(e.d<=s.step)(e.c===0?weak:due).push(q);else rest.push(q)}
  const R=a=>a[Math.random()*a.length|0];let q;
  if(weak.length)q=weak.sort((a,b)=>s.q[a.id].d-s.q[b.id].d)[0];           /* overdue mistakes first */
  else{const r=Math.random();
   const late=due.filter(x=>s.q[x.id].c<SR.MAST&&s.step-s.q[x.id].d>=4);
   if(late.length)q=late.sort((a,b)=>s.q[a.id].d-s.q[b.id].d)[0];
   else if(due.length&&(!fresh.length||r<.4))q=R(due.filter(x=>s.q[x.id].c<SR.MAST).length?due.filter(x=>s.q[x.id].c<SR.MAST):due);
   else if(fresh.length)q=R(fresh);
   else q=rest.sort((a,b)=>s.q[a.id].d-s.q[b.id].d)[0]||R(AMR)}            /* everything scheduled: earliest due */
  s.cur=q.id;SR.put(s);return q},
 weight(q,s){const e=s.q[q.id];return !e?1.5:e.c>=SR.MAST?.5:1+e.l}
};
function amrQuiz(){
 let hist=[],back=0;
 const head=()=>{const x=SR.stats();return `<p class="hint srs">${ICON.ok}${t('mastered')} <b>${x.m}/${x.tot}</b> · ${ICON.no}${t('weak')} <b>${x.w}</b> · ${t('seen')} <b>${x.seen}</b>
   <button id="bR" class="ghost sm">${ICON.repeat}<span>${t('reset')}</span></button></p>`};
 function render(){clearTimers();const h=back?hist[hist.length-back]:null,q=h?h.q:SR.pick(),x=SR.stats();
  app.innerHTML=`<section class="quiz">${head()}${card(q,x.seen,x.tot)}</section>
   <div class="navbar">${ib('back',t('back'),`id="bB" ${back<hist.length?'':'disabled'}`)}${ib('bulb',t('explain'),'id="bE" class="ghost" hidden')}${ib('next',t('next'),'id="bN" class="primary"')}</div>`;
  bindTools(q,render);
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>pick(+b.dataset.k));
  const nf=$('#nf');if(nf)nf.onsubmit=e=>{e.preventDefault();const v=$('#ni').value.trim();if(v)pick(v)};
  $('#bB').onclick=prev;$('#bN').onclick=next;$('#bE').onclick=()=>explain(q);
  $('#bR').onclick=()=>{if(confirm(t('resetQ'))){SR.reset();hist=[];back=0;render()}};
  if(h)show(q,h.a,false);
  document.onkeydown=e=>{if(e.target.tagName==='SELECT'||e.target.tagName==='INPUT')return;const rtl=document.dir==='rtl';
   if(e.key>='1'&&e.key<='3')pick(+e.key-1);else if(e.key==='Enter')next();
   else if(e.key==='ArrowRight')rtl?prev():next();else if(e.key==='ArrowLeft')rtl?next():prev()};
  swipe(app,dir=>{const rtl=document.dir==='rtl';(dir>0)!==rtl?prev():next()});
  cur=q}
 let cur=null,done=false;
 function pick(k){if(back||done)return;done=true;const q=cur,ok=isOk(q,k);M.record(q.id,ok);SR.answer(q.id,ok);hist.push({q,a:k});if(hist.length>30)hist.shift();
  show(q,k,true);const hd=app.querySelector('.srs');if(hd){hd.outerHTML=head();$('#bR').onclick=()=>{if(confirm(t('resetQ'))){SR.reset();hist=[];back=0;done=false;render()}}}}
 function show(q,k,fresh){const ok=isOk(q,k);
  if(q.num!=null){const ni=$('#ni');if(ni){ni.value=k;ni.disabled=true;ni.classList.add(ok?'right':'wrong')}const nb=app.querySelector('#nf button');if(nb)nb.disabled=true}
  app.querySelectorAll('.opt').forEach((b,j)=>{b.disabled=true;if(j===q.answer){b.classList.add('right');b.querySelector('.mk').innerHTML=ICON.ok}else if(j===k){b.classList.add('wrong');b.querySelector('.mk').innerHTML=ICON.no}});
  $('#fb').innerHTML=`<p class="fb ${ok?'ok':'bad'}">${ok?ICON.ok+t('correct'):ICON.no+t('wrong')+(q.num!=null?` — <b dir="ltr">${esc(q.num)}</b>`:'')}</p>`;$('#bE').hidden=false;
  if(ok&&fresh&&st.delay>0)timers.push(setTimeout(next,st.delay*1000))}
 function next(){if(back){back--;done=!!back;return render()}if(!done)return;done=false;render()}
 function prev(){if(back<hist.length){back++;render()}}
 render();
}
/* ---------- Practice / lesson quiz / mistakes ---------- */
let timers=[];const clearTimers=()=>{stopSound();timers.forEach(clearTimeout);timers.forEach(clearInterval);timers=[];document.onkeydown=null};
function quiz(mode,lessonId){
 let pool;
 if(mode==='mistakes'){pool=M.list().map(byId);if(!pool.length){app.innerHTML=`<section class="empty">${ICON.ok}<h2>${t('none')}</h2><a class="primary" href="#practice">${ICON.play}${t('practice')}</a></section>`;return}}
 else{const base=mode==='amr'?AMR:Q;pool=lessonId?Q.filter(q=>inL(q,lessonId)):base.slice();
  if(st.shuf&&!lessonId){const O=LS.get('ord',{});let o=O[mode];if(!o||o.length!==pool.length){o=shuffle(pool.map(q=>q.id));O[mode]=o;LS.set('ord',O)}pool=o.map(byId).filter(Boolean)}}
 /* Due mistakes are shown as a separate review card after every 4th answer, each id at most once per browser session,
    and never inside the position-indexed pool (inserting them shifted the saved position and replayed questions). */
 const revSeen=new Set(JSON.parse(sessionStorage.getItem('slaag.rev')||'[]'));let rev=null,cnt=0;
 const nextRev=()=>mode==='mistakes'?null:M.due().map(byId).find(q=>q&&!revSeen.has(q.id)&&(mode==='amr')===q.id.startsWith('AMR-')&&(!lessonId||inL(q,lessonId))&&q.id!==pool[i].id);
 const key=mode+(lessonId||'');const pos=LS.get('pos',{});let i=Math.min(pos[key]||0,pool.length-1),answered={};
 const savePos=()=>{const p=LS.get('pos',{});p[key]=i;LS.set('pos',p)};
 const cq=()=>rev?rev.q:pool[i];
 function render(){clearTimers();const q=cq();
  app.innerHTML=`<section class="quiz">${mode==='mistakes'?`<p class="hint">${ICON.repeat}${t('streak')} · <b>${(M.all()[q.id]||{}).streak||0}/${NEED}</b></p>`:rev?`<p class="hint">${ICON.repeat}${t('mistakes')}</p>`:''}
   ${card(q,i,pool.length)}</section>
   <div class="navbar">${ib('back',t('back'),`id="bB" ${i?'':'disabled'}`)}${ib('bulb',t('explain'),'id="bE" class="ghost" hidden')}${ib('next',t('next'),'id="bN" class="primary"')}</div>`;
  bindTools(q,render);
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>pick(+b.dataset.k));
  const nf=$('#nf');if(nf)nf.onsubmit=e=>{e.preventDefault();const v=$('#ni').value.trim();if(v)pick(v)};
  $('#bB').onclick=prev;$('#bN').onclick=next;$('#bE').onclick=()=>explain(q);
  {const a=rev?rev.a:answered[i];if(a!=null)show(a,false)}
  document.onkeydown=e=>{if(e.target.tagName==='SELECT'||e.target.tagName==='INPUT')return;const rtl=document.dir==='rtl';
   if(e.key>='1'&&e.key<='3')pick(+e.key-1);else if(e.key==='Enter')next();
   else if(e.key==='ArrowRight')rtl?prev():next();else if(e.key==='ArrowLeft')rtl?next():prev()};
  swipe(app,dir=>{const rtl=document.dir==='rtl';(dir>0)!==rtl?prev():next()});
 }
 function pick(k){const q=cq();if(rev){if(rev.a!=null)return;rev.a=k}else{if(answered[i]!=null)return;answered[i]=k;cnt++}const ok=isOk(q,k);M.record(q.id,ok);show(k,true)}
 function show(k,fresh){const q=cq(),ok=isOk(q,k);
  if(q.num!=null){const ni=$('#ni');if(ni){ni.value=k;ni.disabled=true;ni.classList.add(ok?'right':'wrong')}const nb=app.querySelector('#nf button');if(nb)nb.disabled=true}
  app.querySelectorAll('.opt').forEach((b,j)=>{b.disabled=true;if(j===q.answer){b.classList.add('right');b.querySelector('.mk').innerHTML=ICON.ok}else if(j===k){b.classList.add('wrong');b.querySelector('.mk').innerHTML=ICON.no}});
  $('#fb').innerHTML=`<p class="fb ${ok?'ok':'bad'}">${ok?ICON.ok+t('correct'):ICON.no+t('wrong')+(q.num!=null?` — <b dir="ltr">${esc(q.num)}</b>`:'')}</p>`;$('#bE').hidden=false;
  if(ok&&fresh&&st.delay>0&&i<pool.length-1)timers.push(setTimeout(next,st.delay*1000));}
 function next(){if(rev){rev=null}else if(answered[i]!=null&&cnt&&cnt%4===0){const r=nextRev();if(r){revSeen.add(r.id);sessionStorage.setItem('slaag.rev',JSON.stringify([...revSeen]));rev={q:r,a:null};cnt++;return render()}}
  if(i<pool.length-1){i++;savePos();render()}else{const p=LS.get('pos',{});delete p[key];LS.set('pos',p);go('home')}}
 function prev(){if(rev){rev=null;return render()}if(i>0){i--;savePos();render()}}
 render();
}
function exHTML(q){const ui=st.ui==='ar'?'ar':'nl',a=q.explain[ui]||q.explain.nl||q.explain.ar||'';
 return `<div class="ex">${ICON.bulb}<div><p>${esc(a)}</p>${ui!=='nl'&&q.explain.nl?`<details><summary>NL</summary><p dir="ltr">${esc(q.explain.nl)}</p></details>`:''}</div></div>`}
function explain(q){const fb=$('#fb');if(fb.querySelector('.ex'))return;fb.insertAdjacentHTML('beforeend',exHTML(q))}
function swipe(el,cb){let x0=null;el.ontouchstart=e=>{x0=e.touches[0].clientX};el.ontouchend=e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>60)cb(dx)}}

/* ---------- Mock exam ---------- */
function examIntro(az){const P=az?AMR:Q,n=Math.min(50,P.length),need=Math.ceil(41*n/50);
 const r=(ic,l,v,c='')=>`<div class="srow ${c}"><span class="sic">${ic}</span><span class="sl">${esc(l)}</span><b>${v}</b></div>`;
 app.innerHTML=`<section class="intro"><p class="lic">${esc(t('licence'))}</p><h2>${ICON.exam}${t(az?'amrExam':'exam')}</h2>
 <div class="scard">${r(ICON.exam,t('nQ'),n)}${r(ICON.timer,t('tQ'),`15 ${esc(t('sec'))}`)}${r(ICON.ok,t('need'),`${need}/${n}`,'g')}${r('⚠',t('sf'),'<span dir="ltr">−5</span>','o')}</div>
 <p class="note">${esc(t('real'))}</p><button class="primary bigbtn" id="go"><span>${t('start')}</span>${ICON.play}</button></section>`;$('#go').onclick=()=>exam(P)}
function exam(P){const seen=new Set(),S0=SR.get(),qs=(P===AMR?P.map(q=>[Math.pow(Math.random(),1/SR.weight(q,S0)),q]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]):shuffle(P)).filter(q=>{const k=tx(q.q,'nl').trim().toLowerCase();if(seen.has(k))return false;seen.add(k);return true}).slice(0,50),n=qs.length,ans=[];let i=0,left,cur=null,done=false;
 /* Real-exam rules: pick → confirm → next. No feedback, no going back, 15s → counts as unanswered. */
 function render(){clearTimers();const q=qs[i];left=15;cur=null;done=false;
  app.innerHTML=`<section class="quiz">${card(q,i,n,{timer:true,tools:true})}</section><div class="navbar"><button id="bA" class="auto ${st.auto?'on':''}" aria-pressed="${st.auto}">${ICON.bolt}<span>${t('auto')}</span></button>${ib('okc',t('confirm'),'id="bC" class="primary" disabled')}</div>`;
  $('#bA').onclick=()=>{st.auto=!st.auto;LS.set('auto',st.auto);const b=$('#bA');b.classList.toggle('on',st.auto);b.setAttribute('aria-pressed',st.auto)};
  bindTools(q,()=>{const c=cur,l=left;render();left=l;$('#tm').textContent=l;if(c!=null)sel(c)});
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>sel(+b.dataset.k));
  const nf=$('#nf');if(nf){nf.onsubmit=e=>{e.preventDefault();const v=$('#ni').value.trim();if(v){cur=v;commit(v)}};$('#ni').oninput=e=>{cur=e.target.value.trim()||null;$('#bC').disabled=!cur};setTimeout(()=>$('#ni').focus(),0)}
  $('#bC').onclick=confirmA;
  document.onkeydown=e=>{if(e.target.tagName==='SELECT'||e.target.tagName==='INPUT')return;if(e.key>='1'&&e.key<='3')sel(+e.key-1);else if(e.key==='Enter'){e.preventDefault();confirmA()}};
  timers.push(setInterval(()=>{left--;const el=$('#tm');if(el){el.textContent=Math.max(0,left);if(left<=5)el.parentNode.classList.add('red')}if(left<=0)commit(null)},1000));}
 function sel(k){if(done)return;cur=k;app.querySelectorAll('.opt').forEach((b,j)=>b.classList.toggle('sel',j===k));const bn=$('#bC');if(bn)bn.disabled=false;if(st.auto)commit(k)}
 function confirmA(){if(cur!=null)commit(cur)}
 function commit(k){if(done)return;done=true;ans[i]=k;M.record(qs[i].id,isOk(qs[i],k));if(i<n-1){i++;render()}else finish()}
 function finish(){examLive=null;clearTimers();let score=n;const wrong=[];
  qs.forEach((q,j)=>{if(!isOk(q,ans[j])){score-=(q.weight>1||q.zf)?5:1;wrong.push(j)}});
  score=Math.max(0,score);const need=Math.ceil(41*n/50),pass=score>=need,ex=st.ex;
  app.innerHTML=`<section class="result ${pass?'ok':'bad'}"><div class="big">${pass?ICON.ok:ICON.no}</div><h2>${pass?t('pass'):t('fail')}</h2>
   <p class="score">${score}/${n} <small>(${ICON.ok}${need})</small></p>
   <p class="hint">${ICON.no}<b>${wrong.length}</b> · ${ICON.repeat}${t('mistakes')}</p>
   <div class="list review">${wrong.map(j=>{const q=qs[j],a=ans[j];return `<div class="rv card">
     <div class="qtop"><span class="pill">${j+1}</span>${(q.weight>1||q.zf)?'<span class="pill red">⚠ ×5</span>':''}</div>
     ${q.img?`<div class="qimg sm"><img src="${q.img}" alt="" loading="lazy"></div>`:''}<p class="qt" dir="ltr">${esc(tx(q.q,ex))}</p>
     <p class="fb bad" dir="ltr">${ICON.no}${a==null?'⏱ '+esc(t('noAns')):esc(ansTxt(q,a,ex))}</p>
     <p class="fb ok" dir="ltr">${ICON.ok}${esc(q.num!=null?q.num:tx(q.opts,ex)[q.answer])}</p>
     <button class="ghost bE" data-j="${j}">${ICON.bulb}<span>${t('explain')}</span></button><div class="exw"></div></div>`}).join('')}</div>
   <div class="navbar static">${ib('repeat',t('mistakes'),'id="bM" class="primary"')}${ib('home',t('home'),'id="bH"')}</div></section>`;
  app.querySelectorAll('.bE').forEach(b=>b.onclick=()=>{const q=qs[+b.dataset.j],w=b.nextElementSibling;if(!w.innerHTML)w.innerHTML=exHTML(q)});
  $('#bM').onclick=()=>go('mistakes');$('#bH').onclick=()=>go('home');}
 examLive=location.hash||'#exam';render();
}

/* ---------- Stream mode (?stream=1) — no personal data ---------- */
function stream(){let layout=P.get('layout')||(innerWidth<innerHeight?'v':'h'),qs=shuffle(Q),i=0,left,shown=false;$('#top').hidden=true;
 function render(){clearTimers();shown=false;left=15;const q=qs[i];document.body.dataset.layout=layout;
  app.innerHTML=`<section class="stage ${layout}"><div class="sbar"><img src="img/logo.svg" alt=""><b>Slaag</b><span class="pill timer">${ICON.timer}<b id="tm">15</b></span></div>
   ${q.img?`<div class="qimg"><img src="${q.img}" alt=""></div>`:q.sign?`<div class="signbox">${SIGN[q.sign]}</div>`:''}<p class="qt" dir="ltr">${esc(tx(q.q,st.ex))}</p>
   ${q.num!=null?`<div class="opts"><div class="opt num" dir="ltr"><i>#</i><span>${esc(q.num)}</span><em class="mk"></em></div></div>`:''}<div class="opts">${(q.num!=null?[]:tx(q.opts,st.ex)).map((o,k)=>`<div class="opt" dir="ltr"><i>${'ABC'[k]}</i><span dir="ltr">${esc(o)}</span><em class="mk"></em></div>`).join('')}</div>
   <div id="fb"></div><div class="wm"><img class="wl" src="img/logo.svg" alt="Slaag"><img src="img/qr.svg" alt="QR"><span>ramboosdev.github.io/slaag<br>${esc(t('tagline'))}</span></div></section>
   <div class="ctrl">${ib('eye',t('reveal'),'id="bR" class="primary"')}${ib('bulb',t('explain'),'id="bE"')}${ib('next',t('next'),'id="bN"')}
    <button id="bL" class="icon-btn">${layout==='h'?ICON.portrait:ICON.landscape}</button><button id="bX" class="icon-btn">${ICON.globe}</button><button id="bAu" class="icon-btn snd">${ICON.audio}</button></div>`;readBtn($('#bAu'),q);
  $('#bR').onclick=reveal;$('#bN').onclick=()=>{i=(i+1)%qs.length;render()};$('#bE').onclick=()=>{reveal();explain(q)};
  $('#bL').onclick=()=>{layout=layout==='h'?'v':'h';render()};$('#bX').onclick=()=>{st.tr=!st.tr;render()};
  document.onkeydown=e=>{if(e.key===' '||e.key==='r')reveal();if(e.key==='Enter'||e.key==='ArrowRight')$('#bN').click()};
  timers.push(setInterval(()=>{if(shown)return;left=Math.max(0,left-1);$('#tm').textContent=left},1000));}
 function reveal(){if(shown)return;shown=true;const q=qs[i];app.querySelectorAll('.stage .opt').forEach((b,j)=>{const r=q.num!=null||j===q.answer;b.classList.add(r?'right':'dim');if(r)b.querySelector('.mk').innerHTML=ICON.ok})}
 render();
}
boot().catch(e=>{app.innerHTML='<p class="note">Error loading. '+esc(e.message)+'</p>';console.error(e)});
