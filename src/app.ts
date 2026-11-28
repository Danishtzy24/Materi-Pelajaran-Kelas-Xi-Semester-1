import { $, $$, esc } from './dom';
import { SUBJECTS } from './data';
import { icon, ART } from './art';
import type { Subject } from './types';
/* Native motion, local assets, and six subjects. No external runtime dependencies. */
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const easing='cubic-bezier(.22,1,.36,1)';
const indexes=new Map(SUBJECTS.map(s=>[s.id,[s.name,s.label,s.major||'',s.description,...s.topics].join(' ').toLocaleLowerCase('id')]));
let category='all',query='',searchTimer,dialogBusy=false,previewButton=null;
const filterNames={all:'Semua kategori',numerasi:'Numerasi',bahasa:'Bahasa',sosial:'Sosial',kewarganegaraan:'Kewarganegaraan',agama:'Agama',jurusan:'Jurusan BDP'};
const running=new WeakMap();
function fillIcons(root=document){root.querySelectorAll('[data-icon]').forEach((n: HTMLElement)=>n.outerHTML=icon(n.dataset.icon!))}
function animate(el,frames,duration=340,delay=0){if(reduced.matches||!el?.animate)return Promise.resolve();running.get(el)?.cancel();const a=el.animate(frames,{duration,delay,easing,fill:'backwards'});running.set(el,a);return a.finished.catch(()=>{}).finally(()=>{if(running.get(el)===a)running.delete(el)})}
function card(s: Subject): string {
 const available=!!s.url,linkOnly=s.delivery==='link',n=String(SUBJECTS.indexOf(s)+1).padStart(2,'0'),ci={numerasi:'math',bahasa:'language',sosial:'history',kewarganegaraan:'shield',agama:'moon',jurusan:'briefcase'}[s.category];
 const action=available?`<a class="card-action" href="${esc(s.url)}" target="_blank" rel="noopener" aria-label="Buka materi ${esc(s.name)} di tab baru">Buka materi <span>${icon('external')}</span></a>`:linkOnly?`<button class="card-action" disabled aria-label="Link ${esc(s.name)} belum diisi">Buka materi <span>${icon('external')}</span></button>`:`<button class="card-action" data-preview="${s.id}" aria-label="Lihat topik ${esc(s.name)}" aria-haspopup="dialog">Lihat topik <span>${icon('arrow')}</span></button>`;
 return `<article class="subject-card reveal-stagger tone-${s.tone} ${available?'available':''}" data-subject="${s.id}" data-reveal aria-labelledby="title-${s.id}"><div class="card-art"><div class="art-grid"></div><span class="art-code">${s.code}</span><span class="art-corner">${icon(ci)}</span><span class="card-number" aria-hidden="true">${n}</span>${ART[s.art]}<span class="art-bottom-line"></span></div><div class="card-body"><div class="card-meta-row"><span class="card-category ${s.category==='jurusan'?'major-chip':''}">${icon(s.category==='jurusan'?'briefcase':ci)}${esc(s.label)}</span>${s.day?`<span class="exam-chip" title="Ulangan ${dayInfo(s.day).longDate}">${icon('calendar')}${dayInfo(s.day).short}</span>`:''}</div><h3 id="title-${s.id}">${esc(s.name)}</h3><p class="card-description">${esc(s.description)}</p><div class="topic-tags" aria-label="Topik utama">${s.topics.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="card-footer"><span class="card-status">${available?'<i></i>Tersedia':icon('lock')+(linkOnly?'Link belum diisi':'Segera tersedia')}</span>${action}</div></div></article>`;
}
const DAY_SECTIONS=[{id:'senin',name:'Senin',longDate:'30 November 2026',short:'Sen · 30 Nov',iso:'2026-11-30'},{id:'selasa',name:'Selasa',longDate:'1 Desember 2026',short:'Sel · 1 Des',iso:'2026-12-01'},{id:'rabu',name:'Rabu',longDate:'2 Desember 2026',short:'Rab · 2 Des',iso:'2026-12-02'},{id:'kamis',name:'Kamis',longDate:'3 Desember 2026',short:'Kam · 3 Des',iso:'2026-12-03'}];
const dayInfo=id=>DAY_SECTIONS.find(d=>d.id===id);
const DAY_MAJOR={selasa:true,kamis:true};
function countdownLabel(iso){const n=new Date(),today=new Date(n.getFullYear(),n.getMonth(),n.getDate()),d=Math.round((new Date(iso+'T00:00:00').getTime()-today.getTime())/864e5);if(d>1)return d+' hari lagi';if(d===1)return 'Besok';if(d===0)return 'Hari ini!';return 'Selesai'}
function countdownState(iso){const n=new Date(),today=new Date(n.getFullYear(),n.getMonth(),n.getDate()),d=Math.round((new Date(iso+'T00:00:00').getTime()-today.getTime())/864e5);return d<0?'past':d===0?'today':'upcoming'}
const nextDayId=(DAY_SECTIONS.find(d=>countdownState(d.iso)!=='past')||{}).id;
function dayAreaHTML(sec,isNext,idx){const items=SUBJECTS.filter(s=>s.day===sec.id),major=DAY_MAJOR[sec.id];return `<div class="day-area ${major?'has-major':''} ${countdownState(sec.iso)}${isNext?' is-next':''}" data-day-area="${sec.id}" data-reveal><span class="day-rail" aria-hidden="true"><b>${idx+1}</b></span><header class="day-area-head"><span class="day-title"><b>${sec.name}</b><span class="day-date">${icon('calendar')}${sec.longDate}</span></span><span class="chip chip-count">${icon('book')}${items.length} ulangan</span><span class="chip chip-countdown">${icon('clock')}${countdownLabel(sec.iso)}</span>${major?'<span class="chip chip-major">Jurusan BDP</span>':''}${isNext?`<span class="chip chip-next">${icon('star')}Fokus berikutnya</span>`:''}</header><div class="day-area-grid">${items.map(card).join('')}</div></div>`}
$('#subject-grid').innerHTML=DAY_SECTIONS.map((sec,i)=>dayAreaHTML(sec,sec.id===nextDayId,i)).join('');$('.collection-count strong').textContent=String(SUBJECTS.filter(s=>s.url).length);fillIcons();
const cards=[...document.querySelectorAll<HTMLElement>('[data-subject]')];
function matching(s){return(category==='all'||s.category===category)&&(!query.trim()||indexes.get(s.id).includes(query.trim().toLocaleLowerCase('id')))}
function moveIndicator(){const b=document.querySelector<HTMLButtonElement>(`.filter[data-filter="${category}"]`),i=$('.filter-indicator');if(!b)return;i.style.width=b.offsetWidth+'px';i.style.height=b.offsetHeight+'px';i.style.transform=`translate(${b.offsetLeft}px,${b.offsetTop}px)`}
// Filter changes commit the final layout synchronously. Exiting visuals are inert
// overlay copies, so an outgoing real card can never flash back into the grid.
const filterMotions=new Map(),exitVisuals=new Map();let stageMotion=null;
function layoutMotion(el,frames,duration=330){
 const a=el.animate(frames,{duration,easing,fill:'both'});filterMotions.set(el,a);
 a.finished.then(()=>{if(filterMotions.get(el)===a){a.cancel();filterMotions.delete(el)}}).catch(()=>{});return a;
}
function render(animated=true){
 const stage=$('.grid-stage'),grid=$('#subject-grid');
 const useMotion=animated&&!reduced.matches;
 const before=new Map();
 for(const c of cards)if(!c.hidden)before.set(c.dataset.subject,{rect:c.getBoundingClientRect(),opacity:Number(getComputedStyle(c).opacity)});
 for(const [id,g]of exitVisuals)if(!before.has(id))before.set(id,{rect:g.node.getBoundingClientRect(),opacity:Number(getComputedStyle(g.node).opacity)});
 const stageBefore=stage.getBoundingClientRect();
 stageMotion?.cancel();stageMotion=null;
 // Freeze the currently displayed stage height before changing its children.
 stage.style.height=useMotion?stageBefore.height+'px':'';
 for(const c of cards){filterMotions.get(c)?.cancel();filterMotions.delete(c);running.get(c)?.cancel()}
 for(const g of exitVisuals.values()){g.animation.cancel();g.node.remove()}exitVisuals.clear();
 const match=new Set(SUBJECTS.filter(matching).map(s=>s.id));
 document.querySelectorAll<HTMLButtonElement>('.filter').forEach(b=>{const active=b.dataset.filter===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 $<HTMLButtonElement>('#clear-search').hidden=!query;$('#filter-label').textContent=filterNames[category];moveIndicator();
 cards.forEach(c=>c.hidden=!match.has(c.dataset.subject));document.querySelectorAll<HTMLElement>('[data-day-area]').forEach(a=>{a.hidden=!SUBJECTS.filter(x=>x.day===a.dataset.dayArea).some(x=>match.has(x.id))});$('#empty-state').hidden=match.size!==0;
 $('#result-status').textContent=`Menampilkan ${match.size} dari ${SUBJECTS.length} mata pelajaran`;
 if(!useMotion){stage.style.height='';return}
 const origin=stage.getBoundingClientRect();
 for(const c of cards){const id=c.dataset.subject,previous=before.get(id);
  if(c.hidden){if(!previous||previous.opacity<.015)continue;
   const ghost=c.cloneNode(true) as HTMLElement;ghost.hidden=false;ghost.removeAttribute('data-subject');ghost.removeAttribute('aria-labelledby');ghost.classList.add('exit-visual');ghost.setAttribute('aria-hidden','true');ghost.inert=true;
   ghost.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));ghost.querySelectorAll('[data-preview]').forEach(n=>n.removeAttribute('data-preview'));
   Object.assign(ghost.style,{left:previous.rect.left-origin.left+'px',top:previous.rect.top-origin.top+'px',width:previous.rect.width+'px',height:previous.rect.height+'px',opacity:String(previous.opacity)});
   stage.append(ghost);
   const a=ghost.animate([{opacity:previous.opacity,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(7px) scale(.985)'}],{duration:165,easing,fill:'both'});
   exitVisuals.set(id,{node:ghost,animation:a});
   a.finished.then(()=>{ghost.remove();a.cancel();if(exitVisuals.get(id)?.node===ghost)exitVisuals.delete(id)}).catch(()=>{});
  }else{
   const next=c.getBoundingClientRect(),dx=previous?previous.rect.left-next.left:0,dy=previous?previous.rect.top-next.top:12;
   if(previous&&(Math.abs(dx)+Math.abs(dy)<.5)&&previous.opacity>.995)continue;
   layoutMotion(c,[{opacity:previous?previous.opacity:0,transform:`translate(${dx}px,${dy}px)`},{opacity:1,transform:'translate(0,0)'}],previous?350:290);
  }
 }
 const target=match.size?grid.getBoundingClientRect().height:$('#empty-state').getBoundingClientRect().height;
 stage.style.height=target+'px';
 if(Math.abs(stageBefore.height-target)>1){const a=stage.animate([{height:stageBefore.height+'px'},{height:target+'px'}],{duration:350,easing,fill:'none'});stageMotion=a;a.finished.then(()=>{if(stageMotion===a){stage.style.height='';stageMotion=null}}).catch(()=>{})}else stage.style.height='';
 if(!match.size)animate($('#empty-state'),[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],230);
}
function reset(){clearTimeout(searchTimer);category='all';query='';$<HTMLInputElement>('#search-input').value='';return render()}
$<HTMLFormElement>('#search-form').onsubmit=e=>e.preventDefault();$<HTMLInputElement>('#search-input').addEventListener('input',e=>{query=(e.target as HTMLInputElement).value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>render(),120)});
$<HTMLButtonElement>('#clear-search').onclick=()=>{clearTimeout(searchTimer);query='';$<HTMLInputElement>('#search-input').value='';render();$<HTMLInputElement>('#search-input').focus()};$<HTMLButtonElement>('#reset-filters').onclick=()=>{reset();$<HTMLInputElement>('#search-input').focus()};
function setFilter(value){clearTimeout(searchTimer);category=value;render();const b=document.querySelector<HTMLButtonElement>(`.filter[data-filter="${category}"]`),shell=$('.filters-shell');shell.scrollTo({left:Math.max(0,b.offsetLeft-(shell.clientWidth-b.clientWidth)/2),behavior:reduced.matches?'instant':'smooth'})}
document.querySelectorAll<HTMLButtonElement>('.filter').forEach(b=>b.onclick=()=>setFilter(b.dataset.filter));
function menu(open,restore=false){document.body.classList.toggle('menu-open',open);$<HTMLButtonElement>('#menu-toggle').setAttribute('aria-expanded',String(open));$<HTMLButtonElement>('#menu-toggle').setAttribute('aria-label',open?'Tutup navigasi':'Buka navigasi');$('#mobile-nav').inert=!open;if(restore)$<HTMLButtonElement>('#menu-toggle').focus({preventScroll:true})}
$<HTMLButtonElement>('#menu-toggle').onclick=()=>menu(!document.body.classList.contains('menu-open'));$('#mobile-nav').querySelectorAll('a').forEach(a=>a.onclick=()=>menu(false));
let resizeFrame=0;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{moveIndicator();if(innerWidth>640)menu(false)})},{passive:true});
function openPreview(id,button){const s=SUBJECTS.find(s=>s.id===id);if(!s||s.delivery==='link')return;previewButton=button;const d=$<HTMLDialogElement>('#subject-dialog');$('#dialog-content').innerHTML=`<div class="dialog-layout tone-${s.tone}"><div class="dialog-visual"><div class="art-grid"></div>${ART[s.art]}<span class="dialog-code">${s.code} · KELAS XI</span></div><div class="dialog-copy"><span class="eyebrow">${esc(s.label).toUpperCase()} / KELAS XI</span><h2 id="dialog-title">${esc(s.name)}</h2><p class="dialog-description">${esc(s.description)}</p>${s.day?`<span class="dialog-exam">${icon('calendar')}Ulangan <b>${dayInfo(s.day).name}</b> · ${dayInfo(s.day).longDate}</span>`:''}<span class="dialog-topic-label">TOPIK UTAMA</span><ul class="dialog-topics">${s.topics.map((t,i)=>`<li><span class="topic-number">0${i+1}</span>${esc(t)}${icon('book')}</li>`).join('')}</ul><p class="dialog-notice">${icon('lock')}Rangkuman lengkap belum tersedia.</p></div></div>`;d.classList.remove('is-closing');d.showModal();document.body.classList.add('dialog-open');animate(d,[{opacity:0,transform:'translateY(22px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1)'}],420);animate(d.querySelector('.dialog-visual>svg'),[{opacity:0,transform:'translateY(18px) rotate(-4deg)'},{opacity:1,transform:'translateY(0) rotate(0)'}],520,40);d.querySelectorAll('.dialog-topics li').forEach((e,i)=>animate(e,[{opacity:0,transform:'translateX(12px)'},{opacity:1,transform:'translateX(0)'}],360,70+i*45))}
async function closePreview(){const d=$<HTMLDialogElement>('#subject-dialog');if(!d.open||dialogBusy)return;dialogBusy=true;const frame=getComputedStyle(d);const opacity=frame.opacity,transform=frame.transform;d.style.setProperty('--backdrop-start',getComputedStyle(d,'::backdrop').opacity);d.classList.add('is-closing');await animate(d,[{opacity,transform},{opacity:0,transform:'translateY(14px) scale(.97)'}],190);d.close();d.classList.remove('is-closing');document.body.classList.remove('dialog-open');dialogBusy=false;previewButton?.focus({preventScroll:true})}
$<HTMLButtonElement>('#dialog-close').onclick=closePreview;$<HTMLDialogElement>('#subject-dialog').addEventListener('cancel',e=>{e.preventDefault();closePreview()});$<HTMLDialogElement>('#subject-dialog').addEventListener('click',e=>{if(e.target===$<HTMLDialogElement>('#subject-dialog'))closePreview()});
document.addEventListener('click',e=>{const home=(e.target as HTMLElement).closest<HTMLElement>('a[href="#main-content"]');if(home){e.preventDefault();window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});menu(false)}const b=(e.target as HTMLElement).closest<HTMLElement>('[data-preview]');if(b)openPreview(b.dataset.preview,b);const quick=(e.target as HTMLElement).closest<HTMLElement>('[data-quick-filter]');if(quick){setFilter(quick.dataset.quickFilter);$('#subjects').scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'})}if(document.body.classList.contains('menu-open')&&!(e.target as HTMLElement).closest<HTMLElement>('#mobile-nav,#menu-toggle'))menu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(document.body.classList.contains('menu-open'))menu(false,true);else if(document.activeElement===$<HTMLInputElement>('#search-input')&&query){clearTimeout(searchTimer);query='';$<HTMLInputElement>('#search-input').value='';render()}}if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$<HTMLDialogElement>('#subject-dialog').open){e.preventDefault();menu(false);$<HTMLInputElement>('#search-input').focus();$<HTMLInputElement>('#search-input').scrollIntoView({block:'center',behavior:reduced.matches?'instant':'smooth'})}});
render(false);document.fonts.ready.then(()=>{moveIndicator();requestAnimationFrame(()=>$('.filters').classList.add('ready'))});
const toTop=$<HTMLButtonElement>('#to-top');if(toTop){toTop.onclick=()=>window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});let ttFrame=0;addEventListener('scroll',()=>{cancelAnimationFrame(ttFrame);ttFrame=requestAnimationFrame(()=>toTop.classList.toggle('show',scrollY>620))},{passive:true})}
if(!reduced.matches){
 document.querySelectorAll('.hero-copy>*').forEach((e,i)=>animate(e,[{opacity:0,transform:'translateY(17px)'},{opacity:1,transform:'translateY(0)'}],480,i*55));animate($('.hero-image'),[{opacity:0,transform:'translateY(20px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1)'}],620,40);document.querySelectorAll('.subject-float').forEach((e,i)=>animate(e,[{opacity:0,translate:'0 18px',scale:'.93'},{opacity:1,translate:'0 0',scale:'1'}],460,150+i*65));

}
const navs=[...document.querySelectorAll('.desktop-nav a')];const navObserver=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){const target=e.target.id==='subjects'?'#subjects':e.target.id==='jadwal'?'#jadwal':'#main-content';navs.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===target))}},{rootMargin:'-15% 0px -60% 0px',threshold:0});[$('.hero'),$('#subjects')].forEach(e=>e&&navObserver.observe(e));

/* ===== Material deluxe: tilt 3D, scroll reveal, count-up ===== */
document.documentElement.classList.add('js-reveal');
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
if(finePointer.matches&&!reduced.matches){
 for(const c of cards){
  c.classList.add('tilt');let tRaf=0;
  c.addEventListener('pointermove',(e: PointerEvent)=>{
   if(tRaf)return;tRaf=requestAnimationFrame(()=>{tRaf=0;
    const r=c.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
    c.style.setProperty('--ry',(px*6.5).toFixed(2)+'deg');
    c.style.setProperty('--rx',(-py*6.5).toFixed(2)+'deg');
    c.style.setProperty('--gx',((px+.5)*100).toFixed(1)+'%');
    c.style.setProperty('--gy',((py+.5)*100).toFixed(1)+'%');
   });
  });
  c.addEventListener('pointerleave',()=>{c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg')});
 }
}
const revealEls=[...document.querySelectorAll<HTMLElement>('[data-reveal]')];
if(reduced.matches||!('IntersectionObserver' in window)){revealEls.forEach(e=>e.classList.add('is-in'))}
else{
 const ro=new IntersectionObserver(entries=>{for(const en of entries)if(en.isIntersecting){en.target.classList.add('is-in');ro.unobserve(en.target)}},{threshold:.15,rootMargin:'0px 0px -7% 0px'});
 let i=0;for(const el of revealEls){if(el.classList.contains('reveal-stagger'))el.style.setProperty('--d',(i%7)*.07+'s');i++;ro.observe(el)}
}
const counters=document.querySelectorAll<HTMLElement>('[data-count-to]');
if(counters.length){
 const runCount=(el: HTMLElement)=>{
  const target=Number(el.dataset.countTo)||0;
  if(reduced.matches){el.textContent=String(target);return}
  const t0=performance.now(),dur=1100;
  const step=(t: number)=>{const p=Math.min(1,(t-t0)/dur);el.textContent=String(Math.round(target*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(step)};
  requestAnimationFrame(step);
 };
 if(reduced.matches||!('IntersectionObserver' in window)){counters.forEach(runCount)}
 else{const co=new IntersectionObserver(entries=>{for(const en of entries)if(en.isIntersecting){runCount(en.target as HTMLElement);co.unobserve(en.target)}},{threshold:.4});counters.forEach(c=>co.observe(c))}
}
