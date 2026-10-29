
/* ====== HubSpot write-back (optional, off by default) ======
   Each logged dial can become a HubSpot call on the contact, plus an optional follow-up task.
   Safety: a queue with one state per dial; nothing is ever sent twice; unclear outcomes are never resent automatically. */
let HSW_TOOL=false, HSW_DELAY=60000; const HSW={busy:false,err:''};
const HS_AMBIG=['server_unavailable','upstream_error','cancelled'];
const HS_BLOCK=['needs_reauth','server_not_connected','selection_required','server_not_found','not_in_manifest','approval_required','blocked_by_policy','not_granted','capability_disabled','capability_removed','rate_limited'];
function hswOn(){ return S.hsw.mode!=='off'; }
function hswUsable(){ return !!(MCP&&HSW_TOOL); }
function queueDial(d){ if(DEMO||!hswOn()||!d.id) return; d.k=d.k||uid(); d.hs={s:'q'}; }
function hsCounts(){ const c={q:0,send:0,ok:0,unk:0,err:0,skip:0}; S.dials.forEach(d=>{ if(d.hs&&c[d.hs.s]!=null) c[d.hs.s]++; }); return c; }
function hsLabelFor(d){ const h=d.hs; if(!h) return ''; return {q:'waiting for HubSpot',send:'sending to HubSpot…',ok:'in HubSpot ✓',unk:'HubSpot didn’t confirm – check',err:'not logged: '+(h.msg||'error'),skip:'not logged: '+(h.why||'skipped')}[h.s]||''; }
function extractIds(p){ const ids=[]; const visit=(x,depth)=>{ if(!x||depth>4) return; if(Array.isArray(x)){ x.forEach(o=>{ if(o&&typeof o==='object'&&(o.id!=null||o.objectId!=null||o.hs_object_id!=null)) ids.push(String(o.id!=null?o.id:o.objectId!=null?o.objectId:o.hs_object_id)); else visit(o,depth+1); }); return; }
    if(typeof x==='object') for(const k of Object.keys(x)) visit(x[k],depth+1); }; visit(p,0); return ids; }
function callObject(d,l,me){ const o=OUTL[d.o]||{label:d.o}; const nx=l.next?fmtNext(l.next):'';
  const body=[`Outcome: ${o.label}`,nx&&!CLOSED.has(stOf(l))?`Next step: ${(STL[stOf(l)]||{}).nx||'Next'} – ${nx}`:'',l.note?`Notes: ${String(l.note).slice(0,1500)}`:'',`Logged from SDR Command Center Lite (${d.k})`].filter(Boolean).join('\n');
  const props={hs_timestamp:d.at,hs_call_title:`Call – ${o.label}`,hs_call_body:body,hs_call_direction:'OUTBOUND',hs_call_status:'COMPLETED'}; const ph=bestPhone(l); if(ph) props.hs_call_to_number=telOf(ph); if(me&&me.ownerId) props.hubspot_owner_id=String(me.ownerId);
  return {objectType:'calls',properties:props,associations:[{targetObjectId:Number(l.crm_id),targetObjectType:'contacts'}]}; }
function taskObject(l,me){ const props={hs_timestamp:new Date(l.next).toISOString(),hs_task_subject:`${(STL[stOf(l)]||{}).nx||'Call'}: ${nameOf(l)}${l.company?' ('+l.company+')':''}`,hs_task_body:`Follow-up from SDR Command Center Lite. Status: ${STL[stOf(l)].label}.${l.note?' Notes: '+String(l.note).slice(0,500):''}`,hs_task_status:'NOT_STARTED',hs_task_type:'CALL'};
  if(me&&me.ownerId) props.hubspot_owner_id=String(me.ownerId); return {objectType:'tasks',properties:props,associations:[{targetObjectId:Number(l.crm_id),targetObjectType:'contacts'}]}; }
async function hsMatchByEmail(l){ if(!l.email) return; const p=await hsCall('search_crm_objects',{objectType:'CONTACT',filterGroups:[{filters:[{propertyName:'email',operator:'EQ',value:String(l.email).toLowerCase()}]}],properties:['email'],limit:2,chatInsights:{userIntent:'Match a call-list lead to its CRM contact',satisfaction:'NEUTRAL'}});
  const r=(p&&Array.isArray(p.results))?p.results:[]; if(r.length===1){ l.crm_id=String(r[0].id); if(!l.crm_url&&p.urlTemplate) l.crm_url=safeUrl(String(p.urlTemplate).replace('{id}',r[0].id).split('?')[0]); } }
async function hsSync(manual){ if(DEMO||!hswUsable()||HSW.busy) return; if(!manual&&(!hswOn()||S.hsw.timing!=='auto')) return;
  const due=S.dials.filter(d=>d.hs&&d.hs.s==='q'&&(manual||Date.now()-Date.parse(d.at)>=HSW_DELAY)); if(!due.length) return;
  /* follow-up tasks only accompany calls logged in this run – switching tasks on never back-fills old leads */
  const taskFor=()=>S.hsw.mode!=='calls+tasks'?[]:[...new Set(due.filter(d=>d.hs&&d.hs.s==='ok').map(d=>d.id))].map(byId).filter(l=>l&&l.crm_id&&l.next&&!CLOSED.has(stOf(l))&&stOf(l)!=='meet'&&new Date(l.next)>new Date()&&(!l.hsTask||l.hsTask.for!==l.next)); HSW.busy=true; HSW.err=''; renderHsStatus();
  try{ const me=await hsWhoAmI();
    for(const d of due){ const l=byId(d.id); if(!l){ d.hs={s:'skip',why:'lead deleted'}; continue; }
      if((!l.crm_id||!/^\d+$/.test(String(l.crm_id)))&&S.hsw.match&&l.email){ try{ await hsMatchByEmail(l); }catch(e){ if(HS_BLOCK.includes(e&&e.code)) throw e; } }
      if(!l.crm_id) d.hs={s:'skip',why:l.email?'no HubSpot contact with this e-mail':'no HubSpot contact linked'}; else if(!/^\d+$/.test(String(l.crm_id))) d.hs={s:'skip',why:'the record ID isn’t a HubSpot contact ID'}; }
    const ready=due.filter(d=>d.hs.s==='q');
    for(let i=0;i<ready.length;i+=10){ const chunk=ready.slice(i,i+10); chunk.forEach(d=>{ d.hs={s:'send',at:new Date().toISOString()}; }); saveNow();
      try{ const p=await hsCall('manage_crm_objects',{confirmationStatus:'CONFIRMED',createRequest:{objects:chunk.map(d=>callObject(d,byId(d.id),me))}}); const ids=extractIds(p);
        chunk.forEach((d,j)=>{ d.hs={s:'ok',id:ids[j]||null,at:new Date().toISOString()}; }); }
      catch(e){ const c=e&&e.code;
        if(HS_BLOCK.includes(c)){ chunk.forEach(d=>{ d.hs={s:'q'}; }); HSW.err=hsErrText(e); saveNow(); break; }
        const amb=!c||HS_AMBIG.includes(c); chunk.forEach(d=>{ d.hs={s:amb?'unk':'err',msg:String(hsErrText(e)).slice(0,160),code:c||''}; }); }
      saveNow(); }
    const taskLeads=taskFor(); for(let i=0;i<taskLeads.length&&!HSW.err;i+=10){ const chunk=taskLeads.slice(i,i+10); if(!chunk.length) continue;
      chunk.forEach(l=>{ l.hsTask={for:l.next,s:'send'}; }); saveNow();
      try{ const p=await hsCall('manage_crm_objects',{confirmationStatus:'CONFIRMED',createRequest:{objects:chunk.map(l=>taskObject(l,me))}}); const ids=extractIds(p); chunk.forEach((l,j)=>{ l.hsTask={for:l.next,s:'ok',id:ids[j]||null}; }); }
      catch(e){ const c=e&&e.code; if(HS_BLOCK.includes(c)){ chunk.forEach(l=>{ delete l.hsTask; }); HSW.err=hsErrText(e); break; } chunk.forEach(l=>{ l.hsTask={for:l.next,s:(!c||HS_AMBIG.includes(c))?'unk':'err'}; }); }
      saveNow(); } }
  catch(e){ HSW.err=hsErrText(e); }
  finally{ HSW.busy=false; saveNow(); renderHsStatus(); if(S.ui.view==='leads') renderLeads(); } }
async function hsCheckDial(d){ const l=byId(d.id); if(!l||!l.crm_id) return; try{
    const p=await hsCall('search_crm_objects',{objectType:'CALL',filterGroups:[{associatedWith:[{objectType:'contacts',operator:'EQUAL',objectIdValues:[Number(l.crm_id)]}],filters:[{propertyName:'hs_timestamp',operator:'EQ',value:String(Date.parse(d.at))}]}],properties:['hs_call_title','hs_timestamp'],limit:5,chatInsights:{userIntent:'Check whether a call was already logged',satisfaction:'NEUTRAL'}});
    const r=(p&&Array.isArray(p.results))?p.results:[]; if(r.length){ d.hs={s:'ok',id:String(r[0].id),at:new Date().toISOString(),checked:true}; toast('Found in HubSpot – marked as logged'); } else { d.hs={s:'q'}; toast('Not in HubSpot – it will be sent with the next sync'); }
    saveNow(); renderHsStatus(); }catch(e){ toast(esc(hsErrText(e))); } }
function renderHsStatus(){ const b=$('#hsChip'); if(!b) return; const c=hsCounts(); const attn=c.unk+c.err;
  if(!hswOn()&&!c.q&&!attn){ b.classList.add('hidden'); return; } b.classList.remove('hidden');
  b.textContent=HSW.busy?'HubSpot: sending…':HSW.err?'HubSpot: needs attention':attn?`HubSpot: ${attn} to check`:c.q?`HubSpot: ${c.q} waiting`:'HubSpot: all logged ✓';
  b.classList.toggle('warn',!!(HSW.err||attn)); }
function openHsPanel(){ const c=hsCounts(); const items=S.dials.filter(d=>d.hs&&['unk','err','skip'].includes(d.hs.s)).slice(-40).reverse();
  const box=openModal(`<div class="mh"><h3 style="margin:0">HubSpot write-back</h3><button class="sm quiet" data-close>Close</button></div>
   <p class="small muted" style="margin:0 0 8px">${hswOn()?`On: ${S.hsw.mode==='calls+tasks'?'calls and follow-up tasks':'calls'} are logged ${S.hsw.timing==='auto'?'automatically about a minute after each call (time to undo)':'when you click “Sync now”'}.`:'Off. Nothing is written to HubSpot.'} ${hswUsable()?'':'This page can only read from HubSpot.'}</p>
   ${HSW.err?`<div class="unlock" style="background:var(--brick-soft)">${esc(HSW.err)}</div>`:''}
   <div class="hgrid"><div class="hrow"><span>Logged</span><b>${c.ok}</b></div><div class="hrow"><span>Waiting</span><b>${c.q+c.send}</b></div><div class="hrow"><span>To check</span><b>${c.unk}</b></div><div class="hrow"><span>Not logged</span><b>${c.err+c.skip}</b></div></div>
   <div class="actions"><button class="primary sm" data-hw="sync" ${hswUsable()&&c.q?'':'disabled'}>Sync now</button><button class="sm" data-hw="settings">Settings</button>${c.q&&!hswOn()?'<button class="sm danger" data-hw="clear">Clear waiting items</button>':''}</div>
   ${items.length?`<h4 style="margin-top:12px">Needs a look</h4><div class="vlist">${items.map(d=>{ const l=byId(d.id); return `<div class="vrow"><div class="small"><b>${esc(l?nameOf(l):'Deleted lead')}</b> – ${esc((OUTL[d.o]||{}).label||'')}, ${esc(fmtWhen(d.at))}<div class="tiny muted">${esc(hsLabelFor(d))}</div></div><span class="actions" style="margin:0">${d.hs.s==='unk'?`<button class="sm" data-hw="check:${esc(d.k||'')}">Check HubSpot</button>`:''}${d.hs.s==='err'||d.hs.s==='skip'?`<button class="sm" data-hw="retry:${esc(d.k||'')}">Try again</button>`:''}<button class="sm quiet" data-hw="ignore:${esc(d.k||'')}">Ignore</button></span></div>`; }).join('')}</div>`:''}`,{label:'HubSpot write-back',wide:true});
  box.querySelector('[data-close]').onclick=closeModal;
  box.addEventListener('click',e=>{ const b=e.target.closest('[data-hw]'); if(!b) return; const a=b.dataset.hw; const find=k=>S.dials.find(d=>d.k===k);
    if(a==='sync'){ closeModal(); hsSync(true).then(()=>toast('HubSpot sync finished')); return; } if(a==='settings'){ closeModal(); openWizard(1); return; }
    if(a==='clear'){ S.dials.forEach(d=>{ if(d.hs&&d.hs.s==='q') delete d.hs; }); saveNow(); closeModal(); renderHsStatus(); return; }
    if(a.startsWith('check:')){ const d=find(a.slice(6)); if(d) hsCheckDial(d).then(()=>{ closeModal(); openHsPanel(); }); return; }
    if(a.startsWith('retry:')){ const d=find(a.slice(6)); if(d){ d.hs={s:'q'}; saveNow(); closeModal(); openHsPanel(); } return; }
    if(a.startsWith('ignore:')){ const d=find(a.slice(7)); if(d){ delete d.hs; saveNow(); closeModal(); openHsPanel(); renderHsStatus(); } return; } }); }
function hswSettingsHtml(){ const w=S.hsw, can=hswUsable();
  return `<div class="unlock" style="margin-top:8px"><b>Write back to HubSpot</b> <span class="tiny muted">(off unless you switch it on)</span>
    <div class="picks" style="margin-top:6px">${[['off','Off'],['calls','Log calls'],['calls+tasks','Log calls + follow-up tasks']].map(([k,lb])=>`<button data-hsw="${k}" class="${w.mode===k?'on':''}" ${!can&&k!=='off'?'disabled':''}>${lb}</button>`).join('')}</div>
    ${w.mode!=='off'?`<div class="extra"><label>When<select data-s="hsw.timing"><option value="auto" ${w.timing==='auto'?'selected':''}>About a minute after each call (time to undo)</option><option value="manual" ${w.timing==='manual'?'selected':''}>Only when I click “Sync now”</option></select></label>
      <label style="flex-direction:row;align-items:center;gap:6px;color:var(--ink);font-size:13px"><input type="checkbox" data-s="hsw.match" ${w.match?'checked':''}> Find the HubSpot contact by e-mail when a lead has no HubSpot ID</label></div>`:''}
    <div class="tiny muted" style="margin-top:6px">${can?'Each call becomes a HubSpot call on the contact (outcome, next step, your notes), owned by you. Follow-up tasks are created for callbacks and retries. Nothing is ever sent twice.':'This page can only read from HubSpot. Write-back needs the page to be published with HubSpot write access – your assistant asks you before doing that.'}</div></div>`; }
function confirmHswOn(mode){ const n=S.dials.filter(d=>d.id&&!d.hs).length;
  const box=openModal(`<div class="mh"><h3 style="margin:0">Turn on HubSpot write-back?</h3></div>
   <p class="small">From now on, each call you log here is created as a <b>call on the contact in HubSpot</b>, owned by you, with the outcome, next step and your notes${mode==='calls+tasks'?', plus a <b>follow-up task</b> for callbacks and retries':''}. Only leads linked to a HubSpot contact are logged. You can switch it off any time.</p>
   ${n?`<label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="hswBack"> Also log the ${n} call${n===1?'':'s'} you made before today’s switch-on</label>`:''}
   <div class="actions"><button class="primary" data-ok>Turn on</button><button data-no>Cancel</button></div>`,{label:'HubSpot write-back'});
  box.querySelector('[data-no]').onclick=closeModal;
  box.querySelector('[data-ok]').onclick=()=>{ const back=$('#hswBack')&&$('#hswBack').checked; S.hsw.mode=mode; S.hsw.since=new Date().toISOString(); if(back) S.dials.forEach(d=>{ if(d.id&&!d.hs){ d.k=d.k||uid(); d.hs={s:'q'}; } });
    saveNow(); closeModal(); if(!$('#wizard').classList.contains('hidden')) renderWizard(); renderHsStatus(); toast('HubSpot write-back is on'); }; }
setInterval(()=>{ if(hswOn()&&S.hsw.timing==='auto') hsSync(false); },20000);
