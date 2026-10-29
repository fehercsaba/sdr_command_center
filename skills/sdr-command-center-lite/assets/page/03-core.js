
'use strict';
/* ====== SDR Command Center Lite ======
   Single-file call desk. All data lives in this browser (localStorage).
   Optional platform features (downloads, AI writing) light up when the viewer offers them. */
const VERSION='1.8.0';
const LSK='sdrlite_v1', THEMEK='sdrlite_theme';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-5);
const pad=n=>String(n).padStart(2,'0');
const dkey=d=>{d=new Date(d);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
const todayKey=()=>dkey(new Date());
const toInput=d=>{d=new Date(d);return dkey(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes());};
const endOfToday=()=>{const d=new Date();d.setHours(23,59,59,999);return d;};
function addBiz(d,n){d=new Date(d);let k=0;while(k<n){d.setDate(d.getDate()+1);const w=d.getDay();if(w!==0&&w!==6)k++;}return d;}
function atHour(d,h,m){d=new Date(d);d.setHours(h,m||0,0,0);return d;}
function weekStart(d){d=new Date(d);const w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);d.setHours(0,0,0,0);return d;}
const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtNext(s){ if(!s) return ''; const d=new Date(s); if(isNaN(d)) return ''; const t=new Date(); const k=dkey(d), tk=dkey(t), tm=dkey(new Date(t.getTime()+864e5));
  const hm=pad(d.getHours())+':'+pad(d.getMinutes());
  if(k===tk) return 'Today '+hm; if(k===tm) return 'Tomorrow '+hm;
  const diff=(atHour(d,0)-atHour(t,0))/864e5; if(diff>0&&diff<7) return WD[d.getDay()]+' '+hm;
  return d.getDate()+' '+MON[d.getMonth()]+(d.getFullYear()!==t.getFullYear()?' '+d.getFullYear():'')+' '+hm; }
function fmtWhen(iso){ const d=new Date(iso); const hm=pad(d.getHours())+':'+pad(d.getMinutes()); if(dkey(d)===todayKey()) return 'Today '+hm; return d.getDate()+' '+MON[d.getMonth()]+' '+hm; }
function fmtDay(k){ const d=new Date(k+'T12:00'); return WD[d.getDay()]+' '+d.getDate(); }

/* ---------- state ---------- */
function freshState(){ return {
  v:1, created:new Date().toISOString(),
  setup:{done:false, step:0, dismissed:false, seen:[]},
  settings:{ name:'', company:'', website:'', role:'SDR', dialTarget:60, meetTarget:8, callFrom:9, callTo:17,
    stack:{ crm:'', crmPortal:'', crmHost:'app', crmDomain:'', crmTpl:'', dialer:'tel', callMode:'tel', mail:'mailto', seq:'', data:'', booking:'', li:true },
    icp:{ sell:'', titles:'', industries:'', problem:'', proof:'', alt:'', competitors:'', ask:'a 20-minute intro call' } },
  playbook:null, script:null, sources:null, history:[], imports:[], lastBackup:null, hsw:{mode:'off',timing:'auto',tasks:false,match:true,since:null},
  lists:[{k:'main',label:'My leads'}],
  leads:[], dials:[], ui:{view:'today', sort:'smart', hideCalled:false, grp:'active', list:'', callable:false, pri:false}
};}
function migrate(s){ const f=freshState(); if(!s||typeof s!=='object') return f;
  s.setup=Object.assign(f.setup,s.setup||{}); s.settings=Object.assign(f.settings,s.settings||{});
  s.settings.stack=Object.assign(freshState().settings.stack,(s.settings||{}).stack||{});
  s.settings.icp=Object.assign(freshState().settings.icp,(s.settings||{}).icp||{});
  s.hsw=Object.assign({mode:'off',timing:'auto',tasks:false,match:true,since:null},s.hsw||{});
  s.history=Array.isArray(s.history)?s.history:[]; s.imports=Array.isArray(s.imports)?s.imports:[];
  s.lists=Array.isArray(s.lists)&&s.lists.length?s.lists:f.lists; s.leads=Array.isArray(s.leads)?s.leads:[]; s.dials=Array.isArray(s.dials)?s.dials:[];
  s.ui=Object.assign(f.ui,s.ui||{}); if(s.ui.grp==='all') s.ui.grp='active'; s.v=1; return s; }
let STORAGE_OK=true, STORAGE_FULL=false;
function loadState(key){ try{ const t=localStorage.getItem(key||LSK); return t?JSON.parse(t):null; }catch(e){ STORAGE_OK=false; return null; } }
/* Every account gets its own desk, even in the same browser: storage keys carry the viewer's id when the page knows it. */
let NS='', USER=null, IS_OWNER=true, DEMO=false;
const nsKey=()=>(NS||'')+(DEMO?(NS?':':'')+'demo':'');
const kState=()=>nsKey()?'state:'+nsKey():'state', kLocal=()=>nsKey()?LSK+':'+nsKey():LSK, kJournal=()=>nsKey()?'sdrlite_journal:'+nsKey():'sdrlite_journal', kFile=id=>'file:'+(nsKey()?nsKey()+':':'')+id;
const within=(p,ms,v)=>Promise.race([p,new Promise(r=>setTimeout(()=>r(v),ms))]);
async function resolveViewer(){ if(!RT||typeof RT.use!=='function') return; try{ const u=await within(RT.use('user'),5000,null); if(!u) return; USER=u;
  const id=await within(Promise.resolve(u.id()),3000,null); if(id) NS=String(id).replace(/[^A-Za-z0-9_-]/g,'').slice(0,64);
  IS_OWNER=!!(await within(Promise.resolve(u.isOwner()),3000,true)); }catch(e){} }
let S=freshState();
/* Big desks (10k+ leads) outgrow localStorage (~5 MB), so the desk lives in IndexedDB when the browser offers it. */
let IDB=null; const IDB_NAME='sdrlite', IDB_STORE='kv', JOURNAL='sdrlite_journal'; /* JOURNAL: the shared, pre-account key */
function idbOpen(){ return new Promise((res,rej)=>{ let r; try{ r=indexedDB.open(IDB_NAME,1); }catch(e){ rej(e); return; } r.onupgradeneeded=()=>{ r.result.createObjectStore(IDB_STORE); }; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); r.onblocked=()=>rej(new Error('blocked')); setTimeout(()=>rej(new Error('timeout')),4000); }); }
function idbGet(k){ return new Promise((res,rej)=>{ const q=IDB.transaction(IDB_STORE,'readonly').objectStore(IDB_STORE).get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); }
function idbDel(k){ return new Promise((res,rej)=>{ const tx=IDB.transaction(IDB_STORE,'readwrite'); tx.objectStore(IDB_STORE).delete(k); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); }); }
function idbPut(k,v){ return new Promise((res,rej)=>{ const tx=IDB.transaction(IDB_STORE,'readwrite'); tx.objectStore(IDB_STORE).put(v,k); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); tx.onabort=()=>rej(tx.error); }); }
/* Daily safety copies (last 3 days) live next to the desk in the browser database. */
let RECOVERY=null;
const kDaily=day=>'daily:'+(nsKey()||'-')+':'+day;
async function idbKeys(prefix){ return new Promise((res,rej)=>{ const q=IDB.transaction(IDB_STORE,'readonly').objectStore(IDB_STORE).getAllKeys(); q.onsuccess=()=>res(q.result.map(String).filter(k=>k.startsWith(prefix))); q.onerror=()=>rej(q.error); }); }
async function dailyCopies(){ if(!IDB) return []; try{ return (await idbKeys('daily:'+(nsKey()||'-')+':')).sort().reverse().map(k=>({key:k,day:k.split(':').pop()})); }catch(e){ return []; } }
async function readDaily(key){ try{ const raw=await idbGet(key); return raw?JSON.parse(raw):null; }catch(e){ return null; } }
async function keepDaily(json){ if(!IDB||DEMO) return; const day=todayKey(); if(S.dailyCopy===day) return; try{ await idbPut(kDaily(day),json); S.dailyCopy=day; const all=await dailyCopies(); for(const c of all.slice(3)) await idbDel(c.key); }catch(e){} }
async function askPersist(){ try{ if(navigator.storage&&navigator.storage.persist&&!(await navigator.storage.persisted())) await navigator.storage.persist(); }catch(e){} }
async function loadAll(){ await resolveViewer(); try{ DEMO=localStorage.getItem(kDemoFlag())==='1'; }catch(e){} let st=null, fromLocal=false, claimed=false;
  try{ IDB=await idbOpen(); }catch(e){ IDB=null; }
  if(IDB){ let raw=null; try{ raw=await idbGet(kState()); }catch(e){}
    if(raw){ try{ st=JSON.parse(raw); }catch(e){
        /* unreadable desk: keep it aside, fall back to the newest good daily copy, and say so */
        const bad='corrupt:'+(NS||'-')+':'+Date.now(); try{ await idbPut(bad,raw); }catch(_){}
        RECOVERY={bad,day:null}; for(const c of await dailyCopies()){ const d=await readDaily(c.key); if(d){ st=d; RECOVERY.day=c.day; break; } } } }
    /* a desk saved before accounts were told apart belongs to the page's owner – nobody else inherits it */
    if(!st&&!RECOVERY&&NS&&IS_OWNER&&!DEMO){ try{ const a=await idbGet('state'); if(a){ st=JSON.parse(a); claimed=true; } }catch(e){} } }
  if(!st){ st=loadState(kLocal()); fromLocal=!!st; if(!st&&NS&&IS_OWNER){ st=loadState(LSK); if(st){ fromLocal=true; claimed=true; } } }
  try{ for(const jk of (NS&&IS_OWNER?[kJournal(),JOURNAL]:[kJournal()])){ const j=localStorage.getItem(jk); if(j){ const js=JSON.parse(j); if(js&&(!st||(+js.savedAt||0)>=(+st.savedAt||0))){ st=js; fromLocal=true; } localStorage.removeItem(jk); } } }catch(e){}
  if(DEMO&&!st) st=buildDemo();
  S=migrate(st);
  if(IDB&&RECOVERY){ try{ await idbPut(kState(),JSON.stringify(S)); }catch(e){} }
  if(IDB&&(fromLocal||claimed)){ try{ await idbPut(kState(),JSON.stringify(S));
      if(claimed&&NS){ for(const m of S.imports||[]){ if(!m.stored) continue; const raw=await idbGet('file:'+m.id); if(raw){ await idbPut(kFile(m.id),raw); await idbDel('file:'+m.id); } } await idbDel('state'); }
      localStorage.removeItem(kLocal()); if(claimed) localStorage.removeItem(LSK); }catch(e){} }
  else if(claimed&&!IDB){ try{ localStorage.setItem(kLocal(),JSON.stringify(S)); localStorage.removeItem(LSK); }catch(e){} } }
let BC=null; try{ BC=new BroadcastChannel('sdrlite'); BC.onmessage=e=>{ if(e.data!==(nsKey()||'-')) return; if(!saveT) reloadFromStore(); }; }catch(e){}
async function reloadFromStore(){ try{ let v=null; if(IDB) v=await idbGet(kState()); else v=localStorage.getItem(kLocal()); if(v){ S=migrate(JSON.parse(v)); recomputeOrder(); renderAll(); } }catch(e){} }
function storeOk(){ if(!STORAGE_OK||STORAGE_FULL){ STORAGE_OK=true; STORAGE_FULL=false; renderBanner(); } try{ BC&&BC.postMessage(nsKey()||'-'); }catch(e){} }
function storeFail(e){ const full=!!(e&&(e.name==='QuotaExceededError'||e.code===22||e.code===1014)); if(STORAGE_OK||STORAGE_FULL!==full){ STORAGE_OK=false; STORAGE_FULL=full; renderBanner(); } }
let saveT=null;
function save(){ clearTimeout(saveT); saveT=setTimeout(saveNow,250); }
let PERSIST_ASKED=false;
function saveNow(exiting){ if(!PERSIST_ASKED&&S.leads.length){ PERSIST_ASKED=true; askPersist(); } const pending=!!saveT; clearTimeout(saveT); saveT=null; S.savedAt=Date.now(); const json=JSON.stringify(S);
  /* an IndexedDB write may not finish while the page unloads: keep a synchronous copy for the next open */
  if(exiting&&pending&&IDB&&json.length<4.5e6){ try{ localStorage.setItem(kJournal(),json); }catch(e){} }
  if(IDB){ return idbPut(kState(),json).then(()=>{ storeOk(); keepDaily(json); }).catch(e=>{ if(e&&e.name==='QuotaExceededError'){ storeFail(e); return; } IDB=null; saveLocal(json); }); }
  saveLocal(json); }
function saveLocal(json){ try{ localStorage.setItem(kLocal(),json); storeOk(); }catch(e){ storeFail(e); } }
window.addEventListener('pagehide',()=>{ if(saveT) saveNow(true); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&saveT) saveNow(true); });
window.addEventListener('storage',e=>{ if(!IDB&&e.key===kLocal()&&e.newValue&&!saveT){ try{ S=migrate(JSON.parse(e.newValue)); recomputeOrder(); renderAll(); }catch(_){} } });

/* ---------- platform runtime (optional features) ---------- */
const RT=window['cl'+'aude']; /* the platform's documented page-runtime object (window.<name>.use(...)); the name is written in two parts only because of the author's wording preference – nothing is hidden or decoded here */
let DL=null, AI=null, AI_KNOWN=false, MCP=null, PERMS=null;
function initRuntime(){ if(!RT||typeof RT.use!=='function'){ AI_KNOWN=true; return; }
  try{ RT.use('downloads').then(d=>{DL=d;}).catch(()=>{}); }catch(e){}
  try{ RT.use('db').then(d=>{ if(d){ DB=d; watchSetup(); } }).catch(()=>{}); }catch(e){}
  try{ RT.use('permissions').then(p=>{PERMS=p;}).catch(()=>{}); }catch(e){}
  try{ RT.use('mcp').then(m=>{ if(!m) return; Promise.resolve(m.listTools()).then(r=>{ const srv=((r&&r.servers)||[]).find(s=>s.server==='HubSpot'); if(srv){ MCP=m; HSW_TOOL=(srv.tools||[]).some(t=>t&&t.name==='manage_crm_objects'); onMcpKnown(); renderHsStatus(); } }).catch(()=>{}); }).catch(()=>{}); }catch(e){}
  try{ RT.use('sample').then(s=>{AI=s; AI_KNOWN=true; onAiKnown();}).catch(()=>{AI_KNOWN=true; onAiKnown();}); }catch(e){ AI_KNOWN=true; }
  setTimeout(()=>{ if(!AI_KNOWN){ AI_KNOWN=true; onAiKnown(); } },11000); }
function onMcpKnown(){ if(!$('#wizard').classList.contains('hidden')&&WZ.step===1) renderWizard(); if(!$('#modal').classList.contains('hidden')&&$('#impCards')) renderImportCards(); }
function onAiKnown(){ if(!$('#wizard').classList.contains('hidden')&&WZ.step===2) renderWizard(); }

/* ---------- UX variants: defaults are the winners of the A/B comparison; a hidden override ('sdrlite_ab') allows real A/B tests ---------- */
const AB=Object.assign({strip:'B',rowlog:'B',mcall:'B',quick:'B',imp:'B'},(()=>{ try{ return JSON.parse(localStorage.getItem('sdrlite_ab')||'{}'); }catch(e){ return {}; } })(),window.__AB||{});

/* ---------- statuses & outcomes ---------- */
const ST=[
  {k:'open', label:'Not called', nx:'Call on'},
  {k:'na',   label:'No answer / voicemail', nx:'Try again'},
  {k:'gk',   label:'Gatekeeper', nx:'Try again'},
  {k:'cb',   label:'Talked – callback set', nx:'Call back'},
  {k:'meet', label:'Meeting booked', nx:'Meeting'},
  {k:'later',label:'Nurture – later', nx:'Revisit'},
  {k:'lost', label:'Not interested', nx:''},
  {k:'bad',  label:'Wrong number', nx:''},
  {k:'nr',   label:'Not relevant', nx:''}];
const STL=Object.fromEntries(ST.map(s=>[s.k,s]));
const CLOSED=new Set(['lost','bad','nr']);
const OUT=[
  {k:'na',  st:'na',  label:'No answer / voicemail', key:'1', col:'var(--slate)'},
  {k:'gk',  st:'gk',  label:'Gatekeeper', key:'2', col:'var(--slate2)'},
  {k:'cb',  st:'cb',  label:'Talked – call back', key:'3', col:'var(--go)', conn:true},
  {k:'meet',st:'meet',label:'Meeting booked', key:'4', col:'var(--gold)', conn:true},
  {k:'lost',st:'lost',label:'Not interested', key:'5', col:'var(--go)', conn:true},
  {k:'bad', st:'bad', label:'Wrong number', key:'6', col:'var(--brick)'}];
const OUTL=Object.fromEntries(OUT.map(o=>[o.k,o])); OUTL.x={k:'x',label:'Dial (logged by hand)'};
const CONN=new Set(['cb','meet','lost']);
function stOf(l){ return STL[l.st]?l.st:'open'; }
function grpOf(l){ const s=stOf(l); if(s==='meet') return 'meet'; if(CLOSED.has(s)) return 'closed'; if(l.next&&new Date(l.next)<=endOfToday()) return 'due'; if(s==='open') return 'todo'; return 'prog'; }
function isOverdue(l){ return l.next&&!CLOSED.has(stOf(l))&&stOf(l)!=='meet'&&new Date(l.next)<new Date(); }
function defaultNext(st){ const n=new Date();
  if(st==='na') return toInput(atHour(addBiz(n,2),10)); if(st==='gk') return toInput(atHour(addBiz(n,1),10));
  if(st==='cb') return toInput(atHour(addBiz(n,1),10)); if(st==='later'){ const d=new Date(n); d.setDate(d.getDate()+30); return toInput(atHour(d,10)); }
  return null; }

/* ---------- leads ---------- */
const nameOf=l=>([l.first,l.last].filter(Boolean).join(' ')||l.name||l.email||'(no name)');
const firstOf=l=>(l.first||(l.name||'').split(' ')[0]||'');
const byId=id=>S.leads.find(l=>l.id===id);
const bestPhone=l=>l.mobile||l.phone||'';
const listLabel=k=>(S.lists.find(x=>x.k===k)||{}).label||'—';
function titleKeys(){ return (S.settings.icp.titles||'').split(/[,;\n]/).map(s=>s.trim().toLowerCase()).filter(s=>s.length>1); }
let TK_CACHE={src:null,keys:[]};
function isPri(l){ if(l.pri===true) return true; if(l.pri===false) return false; const src=S.settings.icp.titles||''; if(TK_CACHE.src!==src) TK_CACHE={src,keys:titleKeys()}; const t=(l.title||'').toLowerCase(); return !!t&&TK_CACHE.keys.some(k=>t.includes(k)); }
function lastTouch(l){ return l.st_at||l.created||''; }
function liUrl(l){ if(l.li){ const u=String(l.li).trim(); const full=/^https?:\/\//i.test(u)?u:'https://'+u.replace(/^\/+/,''); if(safeUrl(full)) return full; } return 'https://www.linkedin.com/search/results/people/?keywords='+encodeURIComponent((nameOf(l)+' '+(l.company||'')).trim()); }
function safeUrl(u){ u=String(u||'').trim(); return /^https?:\/\/[^\s"'<>]+$/i.test(u)?u:''; }
function crmUrl(l){ if(safeUrl(l.crm_url)) return safeUrl(l.crm_url); const st=S.settings.stack; if(!l.crm_id||!st.crm) return ''; const id=encodeURIComponent(l.crm_id);
  if(st.crm==='hubspot'&&st.crmPortal) return 'https://'+(st.crmHost==='app-eu1'?'app-eu1':'app')+'.hubspot.com/contacts/'+encodeURIComponent(st.crmPortal)+'/record/0-1/'+id;
  if(st.crm==='salesforce'&&st.crmDomain) return 'https://'+st.crmDomain.replace(/^https?:\/\//,'').replace(/\/.*$/,'')+'/lightning/r/'+(/^00Q/.test(l.crm_id)?'Lead':'Contact')+'/'+id+'/view';
  if(st.crm==='pipedrive'&&st.crmDomain) return 'https://'+st.crmDomain.replace(/^https?:\/\//,'').replace(/\..*$/,'')+'.pipedrive.com/person/'+id;
  if(st.crm==='close') return 'https://app.close.com/lead/'+id+'/';
  if(st.crmTpl&&/\{id\}/.test(st.crmTpl)) return safeUrl(st.crmTpl.replace(/\{id\}/g,id));
  return ''; }
const CRM_NAMES={hubspot:'HubSpot',salesforce:'Salesforce',pipedrive:'Pipedrive',close:'Close',other:'your CRM',none:''};

/* ---------- time zones ---------- */
const COUNTRY_TZ={"united states":"America/New_York","us":"America/New_York","usa":"America/New_York","united states of america":"America/New_York","canada":"America/Toronto","mexico":"America/Mexico_City","brazil":"America/Sao_Paulo","argentina":"America/Argentina/Buenos_Aires","chile":"America/Santiago","colombia":"America/Bogota","peru":"America/Lima","united kingdom":"Europe/London","uk":"Europe/London","great britain":"Europe/London","england":"Europe/London","scotland":"Europe/London","wales":"Europe/London","ireland":"Europe/Dublin","portugal":"Europe/Lisbon","germany":"Europe/Berlin","austria":"Europe/Vienna","switzerland":"Europe/Zurich","france":"Europe/Paris","netherlands":"Europe/Amsterdam","the netherlands":"Europe/Amsterdam","belgium":"Europe/Brussels","luxembourg":"Europe/Luxembourg","italy":"Europe/Rome","spain":"Europe/Madrid","poland":"Europe/Warsaw","czech republic":"Europe/Prague","czechia":"Europe/Prague","slovakia":"Europe/Bratislava","slovenia":"Europe/Ljubljana","croatia":"Europe/Zagreb","hungary":"Europe/Budapest","sweden":"Europe/Stockholm","norway":"Europe/Oslo","denmark":"Europe/Copenhagen","finland":"Europe/Helsinki","iceland":"Atlantic/Reykjavik","romania":"Europe/Bucharest","bulgaria":"Europe/Sofia","greece":"Europe/Athens","cyprus":"Asia/Nicosia","malta":"Europe/Malta","lithuania":"Europe/Vilnius","latvia":"Europe/Riga","estonia":"Europe/Tallinn","serbia":"Europe/Belgrade","bosnia and herzegovina":"Europe/Sarajevo","north macedonia":"Europe/Skopje","albania":"Europe/Tirane","turkey":"Europe/Istanbul","türkiye":"Europe/Istanbul","ukraine":"Europe/Kyiv","moldova":"Europe/Chisinau","united arab emirates":"Asia/Dubai","uae":"Asia/Dubai","saudi arabia":"Asia/Riyadh","qatar":"Asia/Qatar","kuwait":"Asia/Kuwait","bahrain":"Asia/Bahrain","oman":"Asia/Muscat","jordan":"Asia/Amman","lebanon":"Asia/Beirut","israel":"Asia/Jerusalem","egypt":"Africa/Cairo","south africa":"Africa/Johannesburg","nigeria":"Africa/Lagos","kenya":"Africa/Nairobi","ghana":"Africa/Accra","morocco":"Africa/Casablanca","tunisia":"Africa/Tunis","india":"Asia/Kolkata","pakistan":"Asia/Karachi","bangladesh":"Asia/Dhaka","sri lanka":"Asia/Colombo","singapore":"Asia/Singapore","malaysia":"Asia/Kuala_Lumpur","indonesia":"Asia/Jakarta","thailand":"Asia/Bangkok","vietnam":"Asia/Ho_Chi_Minh","philippines":"Asia/Manila","china":"Asia/Shanghai","hong kong":"Asia/Hong_Kong","taiwan":"Asia/Taipei","japan":"Asia/Tokyo","south korea":"Asia/Seoul","korea":"Asia/Seoul","australia":"Australia/Sydney","new zealand":"Pacific/Auckland"};
const ISO_TZ={US:"America/New_York",CA:"America/Toronto",MX:"America/Mexico_City",BR:"America/Sao_Paulo",AR:"America/Argentina/Buenos_Aires",CL:"America/Santiago",CO:"America/Bogota",PE:"America/Lima",GB:"Europe/London",UK:"Europe/London",IE:"Europe/Dublin",PT:"Europe/Lisbon",DE:"Europe/Berlin",AT:"Europe/Vienna",CH:"Europe/Zurich",FR:"Europe/Paris",NL:"Europe/Amsterdam",BE:"Europe/Brussels",LU:"Europe/Luxembourg",IT:"Europe/Rome",ES:"Europe/Madrid",PL:"Europe/Warsaw",CZ:"Europe/Prague",SK:"Europe/Bratislava",SI:"Europe/Ljubljana",HR:"Europe/Zagreb",HU:"Europe/Budapest",SE:"Europe/Stockholm",NO:"Europe/Oslo",DK:"Europe/Copenhagen",FI:"Europe/Helsinki",IS:"Atlantic/Reykjavik",RO:"Europe/Bucharest",BG:"Europe/Sofia",GR:"Europe/Athens",CY:"Asia/Nicosia",MT:"Europe/Malta",LT:"Europe/Vilnius",LV:"Europe/Riga",EE:"Europe/Tallinn",RS:"Europe/Belgrade",BA:"Europe/Sarajevo",MK:"Europe/Skopje",ME:"Europe/Podgorica",TR:"Europe/Istanbul",UA:"Europe/Kyiv",MD:"Europe/Chisinau",AE:"Asia/Dubai",SA:"Asia/Riyadh",QA:"Asia/Qatar",KW:"Asia/Kuwait",BH:"Asia/Bahrain",OM:"Asia/Muscat",JO:"Asia/Amman",LB:"Asia/Beirut",IL:"Asia/Jerusalem",EG:"Africa/Cairo",ZA:"Africa/Johannesburg",NG:"Africa/Lagos",KE:"Africa/Nairobi",GH:"Africa/Accra",MA:"Africa/Casablanca",TN:"Africa/Tunis",DZ:"Africa/Algiers",TZ:"Africa/Dar_es_Salaam",IN:"Asia/Kolkata",PK:"Asia/Karachi",BD:"Asia/Dhaka",LK:"Asia/Colombo",SG:"Asia/Singapore",MY:"Asia/Kuala_Lumpur",ID:"Asia/Jakarta",TH:"Asia/Bangkok",VN:"Asia/Ho_Chi_Minh",PH:"Asia/Manila",CN:"Asia/Shanghai",HK:"Asia/Hong_Kong",TW:"Asia/Taipei",JP:"Asia/Tokyo",KR:"Asia/Seoul",AU:"Australia/Sydney",NZ:"Pacific/Auckland"};
const CC={'1':'US','7':'RU','20':'EG','27':'ZA','30':'GR','31':'NL','32':'BE','33':'FR','34':'ES','36':'HU','39':'IT','40':'RO','41':'CH','43':'AT','44':'GB','45':'DK','46':'SE','47':'NO','48':'PL','49':'DE','51':'PE','52':'MX','54':'AR','55':'BR','56':'CL','57':'CO','60':'MY','61':'AU','62':'ID','63':'PH','64':'NZ','65':'SG','66':'TH','81':'JP','82':'KR','84':'VN','86':'CN','90':'TR','91':'IN','92':'PK','94':'LK','212':'MA','213':'DZ','216':'TN','233':'GH','234':'NG','254':'KE','255':'TZ','351':'PT','352':'LU','353':'IE','354':'IS','356':'MT','357':'CY','358':'FI','359':'BG','370':'LT','371':'LV','372':'EE','373':'MD','380':'UA','381':'RS','382':'ME','385':'HR','386':'SI','387':'BA','389':'MK','420':'CZ','421':'SK','852':'HK','880':'BD','886':'TW','961':'LB','962':'JO','965':'KW','966':'SA','968':'OM','971':'AE','972':'IL','973':'BH','974':'QA'};
const US_ST=(()=>{ const m={}; const add=(tz,list)=>list.split(',').forEach(x=>{m[x.trim().toLowerCase()]=tz;});
  add('America/New_York','ct,connecticut,de,delaware,dc,district of columbia,fl,florida,ga,georgia,in,indiana,ky,kentucky,me,maine,md,maryland,ma,massachusetts,mi,michigan,nh,new hampshire,nj,new jersey,ny,new york,nc,north carolina,oh,ohio,pa,pennsylvania,ri,rhode island,sc,south carolina,vt,vermont,va,virginia,wv,west virginia');
  add('America/Chicago','al,alabama,ar,arkansas,il,illinois,ia,iowa,ks,kansas,la,louisiana,mn,minnesota,ms,mississippi,mo,missouri,ne,nebraska,nd,north dakota,ok,oklahoma,sd,south dakota,tn,tennessee,tx,texas,wi,wisconsin');
  add('America/Denver','co,colorado,id,idaho,mt,montana,nm,new mexico,ut,utah,wy,wyoming'); add('America/Phoenix','az,arizona');
  add('America/Los_Angeles','ca,california,nv,nevada,or,oregon,wa,washington'); add('America/Anchorage','ak,alaska'); add('Pacific/Honolulu','hi,hawaii');
  add('America/Vancouver','bc,british columbia'); add('America/Edmonton','ab,alberta'); add('America/Winnipeg','mb,manitoba'); add('America/Halifax','ns,nova scotia');
  return m; })();
const CITY_TZ={"chicago":"America/Chicago","houston":"America/Chicago","dallas":"America/Chicago","austin":"America/Chicago","minneapolis":"America/Chicago","denver":"America/Denver","phoenix":"America/Phoenix","los angeles":"America/Los_Angeles","san francisco":"America/Los_Angeles","san jose":"America/Los_Angeles","san diego":"America/Los_Angeles","seattle":"America/Los_Angeles","portland":"America/Los_Angeles","vancouver":"America/Vancouver","calgary":"America/Edmonton","toronto":"America/Toronto","montreal":"America/Toronto","perth":"Australia/Perth","brisbane":"Australia/Brisbane","melbourne":"Australia/Melbourne","adelaide":"Australia/Adelaide","sydney":"Australia/Sydney"};
function phoneIso(n){ n=String(n||'').replace(/[^\d+]/g,''); if(n.startsWith('00')) n='+'+n.slice(2); if(!n.startsWith('+')) return null; const d=n.slice(1); for(const len of [3,2,1]){ if(CC[d.slice(0,len)]) return CC[d.slice(0,len)]; } return null; }
function tzOf(l){ const c=(l.country||'').trim().toLowerCase(), st=(l.state||'').trim().toLowerCase(), city=(l.city||'').trim().toLowerCase();
  const na=!c||/^(us|usa|united states|united states of america|canada|ca)$/.test(c);
  if(st&&na&&US_ST[st]) return US_ST[st];
  if(city&&CITY_TZ[city]&&(!c||/united states|^us|^usa|canada|australia|^ca$|^au$/.test(c))) return CITY_TZ[city];
  if(c){ if(COUNTRY_TZ[c]) return COUNTRY_TZ[c]; if(c.length===2&&ISO_TZ[c.toUpperCase()]) return ISO_TZ[c.toUpperCase()]; }
  const p=phoneIso(bestPhone(l)); if(p&&ISO_TZ[p]) return ISO_TZ[p]; return null; }
const LI_CACHE={};
function localInfo(l){ const tz=tzOf(l); if(!tz) return null; const mk=tz+'|'+Math.floor(Date.now()/60000)+'|'+S.settings.callFrom+'-'+S.settings.callTo; if(LI_CACHE[tz]&&LI_CACHE[tz].mk===mk) return LI_CACHE[tz].v;
  let v=null; try{ const parts=new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',weekday:'short',hourCycle:'h23'}).formatToParts(new Date()); const g=t=>(parts.find(p=>p.type===t)||{}).value;
    const h=+g('hour')%24, m=+g('minute'), wd=g('weekday'); const we=(wd==='Sat'||wd==='Sun'); const mins=h*60+m, from=(+S.settings.callFrom||9)*60, to=(+S.settings.callTo||17)*60;
    const open=!we&&mins>=from&&mins<to; const soon=!we&&!open&&mins<from&&from-mins<=120;
    v={tz,h,m,wd,we,open,soon,txt:pad(h)+':'+pad(m),city:tz.split('/').pop().replace(/_/g,' ')}; }catch(e){ v=null; }
  LI_CACHE[tz]={mk,v}; return v; }
function ltHtml(l){ const i=localInfo(l); if(!i) return '<span class="lt"><i></i><span class="muted">—</span></span>';
  const tip=(i.open?'Office hours now':i.soon?'Office opens within 2 hours':i.we?'Weekend there':'Outside office hours')+' · '+i.city+' time';
  return `<span class="lt ${i.open?'open':i.soon?'soon':''}" title="${esc(tip)}"><i></i>${esc(i.wd)} ${i.txt}</span>`; }
function callableNow(l){ const i=localInfo(l); return !!(i&&i.open); }

/* ---------- small UI helpers ---------- */
function toast(msg,opt){ opt=opt||{}; const w=$('#toasts'); const t=document.createElement('div'); t.className='toast'; t.innerHTML=`<span>${msg}</span>`;
  if(opt.undo){ const b=document.createElement('button'); b.className='sm'; b.textContent='Undo'; b.onclick=()=>{ opt.undo(); t.remove(); }; t.appendChild(b); }
  w.appendChild(t); while(w.children.length>3) w.firstChild.remove(); setTimeout(()=>t.remove(),opt.undo?7000:3800); }
function copyText(t){ try{ if(navigator.clipboard&&navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(()=>true).catch(()=>legacyCopy(t)); }catch(e){} return Promise.resolve(legacyCopy(t)); }
function legacyCopy(t){ try{ const ta=document.createElement('textarea'); ta.value=t; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); const ok=document.execCommand('copy'); ta.remove(); return ok; }catch(e){ return false; } }
function copyAndToast(t,what){ copyText(t).then(ok=>toast(ok?(what||'Copied')+' to the clipboard':'Select and copy it by hand – the browser blocked the clipboard')); }
function openLink(href){ const a=document.createElement('a'); a.href=href; a.target='_blank'; a.rel='noopener noreferrer'; document.body.appendChild(a); a.click(); a.remove(); }
function armDanger(btn,fn){ if(btn.classList.contains('armed')){ fn(); return; } const old=btn.textContent; btn.classList.add('armed'); btn.textContent='Click again to confirm'; setTimeout(()=>{ if(btn.isConnected){ btn.classList.remove('armed'); btn.textContent=old; } },3500); }
const PHONE_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';

/* modal */
function openModal(html,opt){ const m=$('#modal'); m.innerHTML=`<div class="modal" style="${opt&&opt.wide?'width:min(900px,100%)':''}">${html}</div>`; m.classList.remove('hidden'); m.setAttribute('aria-label',(opt&&opt.label)||'Dialog');
  m.onclick=e=>{ if(e.target===m) closeModal(); }; const f=m.querySelector('[autofocus]')||m.querySelector('input,select,textarea,button'); if(f) setTimeout(()=>f.focus(),30); return m.firstElementChild; }
function closeModal(){ const m=$('#modal'); m.classList.add('hidden'); m.innerHTML=''; }

/* files out: downloads capability, else a copy box */
async function saveFile(name,data,opt){ if(DEMO&&!/^demo-/.test(name)) name='demo-'+name;
  if(DL){ try{ await DL.save({filename:name,data:/\.csv$/i.test(name)&&!(opt&&opt.raw)?'\ufeff'+data:data}); toast('Saved '+esc(name)); return 'saved'; }
    catch(e){ const c=e&&e.code; if(c==='declined'){ toast('Download cancelled'); return 'declined'; } if(c==='rate_limited'){ toast('A download is already waiting for your OK – try again in a moment'); return 'busy'; } } }
  const box=openModal(`<div class="mh"><h3 style="margin:0">${esc(name)}</h3><button class="sm quiet" data-close>Close</button></div>
    <p class="small muted" style="margin-top:0">Downloads aren't available in this view. Copy the content below and save it as <b>${esc(name)}</b> (or paste a CSV straight into a spreadsheet).</p>
    <textarea readonly style="min-height:240px;font-size:12px">${esc(data)}</textarea><div class="actions"><button class="primary" data-cp>Copy</button></div>`,{label:name});
  box.querySelector('[data-close]').onclick=closeModal; box.querySelector('[data-cp]').onclick=()=>{ copyAndToast(data,'File content copied'); if(opt&&opt.onCopied) opt.onCopied(); }; return 'copybox'; }
function csvOf(rows){ return rows.map(r=>r.map(v=>{ v=v==null?'':String(v); if(/^[=@\t\r]/.test(v)||(/^[+\-]/.test(v)&&!/^[+\-][\d\s().\/-]*$/.test(v))) v="'"+v; return /[",\n;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }).join(',')).join('\n'); }
