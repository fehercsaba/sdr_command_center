
/* ====== version tracking (kept out of the way: footer version number → Versions) ====== */
const CHANGELOG=[
  ['1.8.0','Leads: “Hide called” (due callbacks and retries stay visible). Every person in the list gets a copy-number button and a Script button that opens their call script right under the row.'],
  ['1.7.0','Demo mode: a separate, fully populated fictional desk you can switch on and off – offered on first open. Auto-setup is now easy to find: “Set it up for me” on first open, in the messaging step and in Setup.'],
  ['1.6.0','Safer storage: recovery when saved data can’t be read, daily automatic copies, protected browser storage, backup reminders. Optional HubSpot write-back (calls and follow-up tasks), off by default. Faster daily use: slim counter outside Today, log right after you call, outcome buttons always in reach on phones, quick start, one-click import when the columns match.'],
  ['1.5.0','Optimised for Team plans: every account gets its own private desk, even in the same browser. A shared company setup reaches everyone the desk is shared with; each person keeps their own leads, calls, HubSpot access and AI allowance.'],
  ['1.4.0','Setup hub: see every answer, where the prepared setup came from and your imported files (download the originals); restart or re-run setup; version history with restore.'],
  ['1.3.0','Auto-setup with a live progress ring (past chats, website, competitors). Call-script generator per lead. Competitors in the playbook.'],
  ['1.2.0','Room for 20,000+ contacts. “Active” view hides closed leads. More sort options. Move leads between lists on import. Company website. Column names in more languages.'],
  ['1.1.0','Read-only HubSpot import. Safer exports and imports. Many small fixes.'],
  ['1.0.0','First release: setup guide, lean lead list, call blocks, playbook, report.']];
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return (h>>>0).toString(36)+':'+s.length; }
function cfgOf(){ return {settings:S.settings,playbook:S.playbook,script:S.script,sources:S.sources}; }
function snapshot(reason,force,quiet){ try{ const json=JSON.stringify(cfgOf()); const h=hashStr(json); const hist=S.history=Array.isArray(S.history)?S.history:[];
    if(hist.length&&hist[0].h===h&&!force) return false;
    hist.unshift({id:uid(),at:new Date().toISOString(),reason:String(reason||'Change').slice(0,140),h,v:VERSION,cfg:JSON.parse(json)}); if(hist.length>25) hist.length=25; if(!quiet) save(); return true; }catch(e){ return false; } }
function hasConfig(){ return !!(S.playbook||S.script||S.settings.name||S.settings.company||S.settings.icp.sell); }
function restoreSnapshot(id){ const sn=(S.history||[]).find(x=>x.id===id); if(!sn) return; snapshot('Before restoring the version from '+fmtWhen(sn.at),true);
  const c=JSON.parse(JSON.stringify(sn.cfg||{})); const f=freshState().settings;
  S.settings=Object.assign(f,c.settings||{}); S.settings.stack=Object.assign(freshState().settings.stack,(c.settings||{}).stack||{}); S.settings.icp=Object.assign(freshState().settings.icp,(c.settings||{}).icp||{});
  S.playbook=c.playbook||null; S.script=c.script||null; S.sources=c.sources||null; snapshot('Restored the version from '+fmtWhen(sn.at)); saveNow(); renderAll(); toast('Version from '+esc(fmtWhen(sn.at))+' restored'); }
function openVersions(){ S.appVersion=VERSION; save(); $('#verBtn').classList.remove('new'); const hist=S.history||[]; const curH=hashStr(JSON.stringify(cfgOf()));
  const box=openModal(`<div class="mh"><h3 style="margin:0">Versions</h3><button class="sm quiet" data-close>Close</button></div>
   <p class="small" style="margin:0 0 4px"><b>SDR Command Center Lite ${esc(VERSION)}</b> · built by Csaba Fehér</p>
   <details class="fold" style="margin-top:4px;border:0;padding-top:0"><summary class="small">What’s new</summary><ul class="cs-list" style="margin-top:6px">${CHANGELOG.map(([v,t])=>`<li><b>${esc(v)}</b> – ${esc(t)}</li>`).join('')}</ul></details>
   <h4 style="margin-top:14px">Setup history</h4>
   <p class="tiny muted" style="margin:0 0 8px">A version is saved automatically whenever your setup answers, playbook or call script change. Restoring is safe: the current state is saved first. Leads and call history aren’t part of these versions – use “Back up now” for those.</p>
   ${hist.length?`<div class="vlist">${hist.map((h,i)=>{ const c=h.cfg||{}; const st=c.settings||{}; const n=c.playbook&&c.playbook.sections?c.playbook.sections.length:0;
     return `<div class="vrow"><div><b>${esc(fmtWhen(h.at))}</b>${h.h===curH?' <span class="tiny chipv">same as now</span>':''}<div class="small">${esc(h.reason)}</div><div class="tiny muted">${esc([st.company,n?n+' playbook sections':'no playbook',c.script?'custom call script':'',h.v?'v'+h.v:''].filter(Boolean).join(' · '))}</div></div>
       <span class="actions" style="margin:0">${h.h!==curH?`<button class="sm" data-vrestore="${esc(h.id)}">Restore</button>`:''}<button class="sm quiet" data-vdl="${esc(h.id)}">Download</button></span></div>`; }).join('')}</div>`:'<p class="small muted">No versions yet – they appear once you set up your desk.</p>'}`,{label:'Versions',wide:true});
  box.querySelector('[data-close]').onclick=closeModal;
  box.addEventListener('click',e=>{ const r=e.target.closest('[data-vrestore]'); if(r){ armDanger(r,()=>{ closeModal(); restoreSnapshot(r.dataset.vrestore); }); return; }
    const d=e.target.closest('[data-vdl]'); if(d){ const h=hist.find(x=>x.id===d.dataset.vdl); if(h) saveFile('call-desk-setup-'+h.at.slice(0,16).replace(/[:T]/g,'-')+'.json',JSON.stringify({app:'sdr-command-center-lite',version:h.v||VERSION,saved:h.at,reason:h.reason,setup:h.cfg},null,2)); } }); }

/* ====== imported files: history + original copies (in the browser database) ====== */
const RAW_KEEP=10, RAW_MAX=3e6;
async function recordImport(meta,raw){ const m=Object.assign({id:'f'+uid(),at:new Date().toISOString()},meta); m.stored=false;
  if(IDB&&raw&&raw.length<=RAW_MAX){ try{ await idbPut(kFile(m.id),raw); m.stored=true; m.size=raw.length; }catch(e){} }
  S.imports=[m].concat(Array.isArray(S.imports)?S.imports:[]).slice(0,50);
  const keep=S.imports.filter(x=>x.stored); for(const old of keep.slice(RAW_KEEP)){ old.stored=false; try{ await idbDel(kFile(old.id)); }catch(e){} }
  save(); }
async function downloadImport(id){ const m=(S.imports||[]).find(x=>x.id===id); if(!m||!m.stored||!IDB) return; try{ const raw=await idbGet(kFile(id)); if(!raw){ toast('The original copy is no longer stored'); return; }
  const ext=m.kind==='paste'?(raw.includes('\t')?'.tsv':'.csv'):m.kind==='hubspot'?'.csv':''; saveFile((m.file||m.name||'import').replace(/[\\/:*?"<>|]+/g,'-')+(ext&&!/\.(csv|tsv|txt)$/i.test(m.file||'')?ext:''),raw,{raw:true}); }catch(e){ toast('Couldn’t read the stored copy'); } }
async function forgetImport(id){ const m=(S.imports||[]).find(x=>x.id===id); if(!m) return; m.stored=false; try{ if(IDB) await idbDel(kFile(id)); }catch(e){} save(); }

/* ====== setup hub: what you entered, where it came from, restart ====== */
function availableSeed(){ return SETUP.seed||readSeed(); }
function openHub(){ const st=S.settings, sk=st.stack, ic=st.icp; const nm=(c,k)=>k?(optName(c,k)||k):'—';
  const row=(lb,v)=>`<div class="hrow"><span>${lb}</span><b>${v?esc(v):'<span class="muted">—</span>'}</b></div>`;
  const sec=(t,step,body)=>`<div class="tool"><div class="th"><b>${t}</b><button class="sm quiet" data-hub="step:${step}">Edit</button></div><div class="hgrid">${body}</div></div>`;
  const src=S.sources; const seed=availableSeed(); const imps=Array.isArray(S.imports)?S.imports:[];
  const pb=S.playbook; const pbSrc=pb?({ai:'written with AI',basic:'basic guidelines',pasted:'pasted in',prepared:'prepared for you'}[pb.src]||pb.src):'';
  const box=openModal(`<div class="mh"><h3 style="margin:0">Your setup</h3><button class="sm quiet" data-close>Close</button></div>
   <p class="small muted" style="margin:0 0 10px">Everything you entered, where it came from, and ways to start again. Your leads and call history are never touched here unless you reset everything. Everything here belongs to your account only.</p>
   <div class="stack">
    ${sec('You and your goals',0,row('Name',st.name)+row('Company',st.company)+row('Website',st.website)+row('Role',st.role)+row('Dials per day',String(st.dialTarget||''))+row('Meetings per month',String(st.meetTarget||''))+row('Call window',`${st.callFrom}:00–${st.callTo}:00 their time`))}
    ${sec('Tech stack',1,row('CRM',sk.crm?nm('crm',sk.crm):'')+row('Dialer',sk.dialer?nm('dialer',sk.dialer)+' · '+({tel:'opens the dialer',web:'copy + web dialer',copy:'copies the number'}[sk.callMode]||''):'')+row('E-mail',nm('mail',sk.mail))+row('Sequences',sk.seq?nm('seq',sk.seq):'')+row('Data tool',sk.data?nm('data',sk.data):'')+row('Booking link',sk.booking)+row('HubSpot import',MCP?'available on this page':'not on this page')+row('HubSpot write-back',!MCP?'not on this page':S.hsw.mode==='off'?'off':(S.hsw.mode==='calls+tasks'?'calls + tasks':'calls')+(S.hsw.timing==='auto'?', automatic':', on “Sync now”')))}
    ${sec('Messaging inputs',2,row('What you sell',ic.sell)+row('Who you call',ic.titles)+row('Industries',ic.industries)+row('Problem',ic.problem)+row('Proof',ic.proof)+row('Used instead today',ic.alt)+row('Competitors',ic.competitors)+row('Meeting you ask for',ic.ask))}
    <div class="tool"><div class="th"><b>Playbook and call script</b><button class="sm quiet" data-hub="playbook">Open</button></div><div class="hgrid">${row('Playbook',pb?`${pb.sections.length} sections, ${pbSrc}${pb.at?', '+fmtWhen(pb.at):''}`:'')}${row('Call script',S.script?'your own building blocks':'defaults from your messaging')}</div></div>
    ${!IS_OWNER?`<div class="unlock" style="background:var(--go-soft)"><b>Team desk.</b> The company setup and playbook are shared by the person who set up this desk; updates arrive with an “Apply” button. Your leads, calls, notes and versions are private to your account – nobody else sees them.</div>`:''}
    ${src||S.seedId?`<div class="tool"><div class="th"><b>${IS_OWNER?'Where the prepared setup came from':'Where the team setup came from'}</b><span class="tiny muted">${esc(src&&src.at?fmtWhen(src.at):'')}</span></div><div class="hgrid">
       ${src&&Array.isArray(src.chats)&&src.chats.length?row('Past chats',src.chats.join(' · ')):''}${src&&Array.isArray(src.website)&&src.website.length?row('Website pages',src.website.join(' · ')):''}
       ${src&&Array.isArray(src.competitors)&&src.competitors.length?row('Competitors researched',src.competitors.map(c=>typeof c==='string'?c:[c.name,c.url].filter(Boolean).join(' – ')).join(' · ')):''}${src&&Array.isArray(src.files)&&src.files.length?row('Files you shared',src.files.join(' · ')):''}
       ${row('Note',(src&&src.note)||(pb&&pb.note)||'')}</div></div>`:''}
    <div class="tool"><div class="th"><b>Imported files</b><span class="tiny muted">The last ${RAW_KEEP} originals are kept in this browser</span></div>
     ${imps.length?`<div class="vlist">${imps.slice(0,15).map(m=>`<div class="vrow"><div><b>${esc(m.name||'Import')}</b> <span class="tiny muted">${esc({file:'file',paste:'pasted rows',hubspot:'HubSpot'}[m.kind]||'')}</span><div class="tiny muted">${esc(fmtWhen(m.at))} · ${m.rows||0} rows · ${m.add||0} new${m.upd?', '+m.upd+' updated':''}${m.moved?', '+m.moved+' moved':''} · list “${esc(m.list||'')}”</div></div>
        <span class="actions" style="margin:0">${m.stored?`<button class="sm" data-hub="dl:${esc(m.id)}">Download original</button><button class="sm quiet" data-hub="forget:${esc(m.id)}" title="Delete the stored copy (the leads stay)">Delete copy</button>`:'<span class="tiny muted">original not kept</span>'}</span></div>`).join('')}</div>`:'<p class="small muted" style="margin:6px 0 0">No imports yet.</p>'}</div>
    <div class="tool"><div class="th"><b>Safety</b><span class="tiny muted" id="hubStore"></span></div>
     <div class="hgrid">${row('Last backup',S.lastBackup?fmtWhen(S.lastBackup):'never')}${row('Kept in',IDB?'this browser’s database (room for 20,000+ leads)':'this browser’s basic storage (about 5 MB)')}</div>
     <div class="small muted" style="margin-top:8px">Automatic copies from the last 3 days, inside this browser:</div><div class="vlist" id="hubDaily"><span class="tiny muted">Loading…</span></div>
     <div class="actions"><button class="sm primary" data-hub="backup2">Back up now</button><button class="sm" data-hub="restorebk">Restore a backup…</button></div></div>
    <div class="tool"><div class="th"><b>Start again</b></div>
     <div class="restart">
      <div><button data-hub="demo">${DEMO?'Leave demo mode':'Explore the demo desk'}</button><span class="tiny muted">${DEMO?'Back to your own desk – the demo stays as it is.':'A separate fictional desk with two weeks of calls. Your own desk is untouched.'}</span></div>
      <div><button data-hub="guide">Open the setup guide</button><span class="tiny muted">Walk through all five steps with your current answers.</span></div>
      ${seed?`<div><button data-hub="reapply">Re-apply the prepared setup</button><span class="tiny muted">${esc(seed.note?String(seed.note).slice(0,120):'Brings back the setup your assistant prepared.')} Your current version is saved first.</span></div>`:''}
      ${IS_OWNER&&!DEMO?`<div><button data-hub="rerun">${S.sources?'Re-run auto-setup':'Auto-setup from my chats and website'}</button><span class="tiny muted">${DB?'Ask your assistant – it reads your chats, website and competitors again and updates this page live for everyone you shared it with.':'Needs the SDR Command Center Lite skill in your assistant.'}</span></div>`:`<div><span class="tiny muted">Re-running the auto-setup is up to the person who shared this desk – you’ll get an “Apply” button when they do.</span></div>`}
      <div><button class="danger" data-hub="scratch">Start setup from scratch</button><span class="tiny muted">Clears your answers, playbook and call script. Leads, lists and call history stay. Undo via Version history.</span></div>
      <div><button class="danger" data-hub="reset">Reset everything</button><span class="tiny muted">Deletes the whole desk in this browser, leads included. <a href="#" data-hub="backup">Back up first</a>.</span></div>
     </div></div>
   </div>
   <div class="tiny muted" style="margin-top:12px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span><a href="#" data-hub="setupjson">Download your setup (.json)</a></span><span><a href="#" data-hub="versions">Version history</a> · v${esc(VERSION)}</span></div>`,{label:'Your setup',wide:true});
  box.querySelector('[data-close]').onclick=closeModal;
  (async()=>{ const host=box.querySelector('#hubDaily'); const cs=await dailyCopies(); let bad=[]; try{ if(IDB) bad=await idbKeys('corrupt:'+(NS||'-')+':'); }catch(e){}
    host.innerHTML=(cs.length?cs.map(c=>`<div class="vrow"><div class="small"><b>${esc(c.day)}</b> – the whole desk as it was that day</div><button class="sm" data-hub="daily:${esc(c.key)}">Restore</button></div>`).join(''):'<span class="tiny muted">None yet – the first one is made after your first change today.</span>')+bad.map(k=>`<div class="vrow"><div class="small">Unreadable data kept aside</div><button class="sm quiet" data-hub="bad:${esc(k)}">Download</button></div>`).join('');
    try{ const st=box.querySelector('#hubStore'); const p=navigator.storage&&navigator.storage.persisted?await navigator.storage.persisted():null; const est=navigator.storage&&navigator.storage.estimate?await navigator.storage.estimate():null;
      st.textContent=[p===true?'protected from automatic clean-up':p===false?'may be cleaned up by the browser when space runs low':'',est&&est.usage?Math.round(est.usage/1e5)/10+' MB used':''].filter(Boolean).join(' · '); }catch(e){} })();
  box.addEventListener('click',e=>{ const b=e.target.closest('[data-hub]'); if(!b) return; e.preventDefault(); const a=b.dataset.hub;
    if(a.startsWith('step:')){ closeModal(); openWizard(+a.slice(5)); return; }
    if(a==='playbook'){ closeModal(); go('playbook'); return; } if(a==='guide'){ closeModal(); openWizard(0); return; }
    if(a.startsWith('dl:')){ downloadImport(a.slice(3)); return; }
    if(a.startsWith('forget:')){ armDanger(b,()=>{ forgetImport(a.slice(7)).then(()=>{ toast('Stored copy deleted – your leads stay'); openHub(); }); }); return; }
    if(a==='reapply'){ const sd=availableSeed(); if(!sd) return; closeModal(); applySeed(sd,{force:true}); recomputeOrder(); renderAll(); toast('Prepared setup applied – the previous version is in Version history'); return; }
    if(a==='demo'){ closeModal(); setDemo(!DEMO); return; }
    if(a==='rerun'){ closeModal(); openAutoSetup(); return; } if(a==='rerun_old'){ const p=`Re-run the auto-setup for my SDR Command Center Lite desk: check my past chats, website and competitors again, then update the playbook and call scripts on the page.`;
      const bx=openModal(`<div class="mh"><h3 style="margin:0">Re-run auto-setup</h3><button class="sm quiet" data-close>Close</button></div><p class="small">${DB?'Paste this into a chat with your assistant. This page shows the progress ring again and offers the result with an “Apply” button – your leads stay.':'This needs the SDR Command Center Lite skill. Once it’s installed, paste this into a chat:'}</p><div class="prompt">${esc(p)}</div><div class="actions"><button class="primary" data-cp>Copy</button></div>`,{label:'Re-run auto-setup'});
      bx.querySelector('[data-close]').onclick=closeModal; bx.querySelector('[data-cp]').onclick=()=>copyAndToast(p,'Prompt copied'); return; }
    if(a==='scratch'){ armDanger(b,()=>{ snapshot('Before starting setup from scratch',true); const keep=S.settings.stack; S.settings=freshState().settings; S.settings.stack=Object.assign(S.settings.stack,{li:keep.li}); S.playbook=null; S.script=null; S.sources=null; S.setup={done:false,step:0,dismissed:false,seen:[]}; saveNow(); closeModal(); renderAll(); openWizard(0); toast('Setup cleared – your leads stay. Undo it in Version history.'); }); return; }
    if(a==='reset'){ armDanger(b,()=>resetEverything()); return; }
    if(a==='backup'||a==='backup2'){ backup(); return; } if(a==='restorebk'){ closeModal(); restore(); return; }
    if(a.startsWith('daily:')){ armDanger(b,async()=>{ const key=a.slice(6); const d=await readDaily(key); if(!d){ toast('That copy can’t be read'); return; } snapshot('Before restoring the automatic copy',true); S=migrate(d); S.dailyCopy=null; saveNow(); closeModal(); recomputeOrder(); renderAll(); toast('Desk restored from the automatic copy of '+esc(key.split(':').pop())); }); return; }
    if(a.startsWith('bad:')){ idbGet(a.slice(4)).then(raw=>{ if(raw) saveFile('unreadable-desk-data.json',raw,{raw:true}); }); return; }
    if(a==='setupjson'){ saveFile('call-desk-setup-'+todayKey()+'.json',JSON.stringify({app:'sdr-command-center-lite',version:VERSION,exported:new Date().toISOString(),setup:cfgOf()},null,2)); return; }
    if(a==='versions'){ closeModal(); openVersions(); return; } }); }
async function resetEverything(){ const ids=(S.imports||[]).map(m=>m.id); try{ if(IDB) for(const id of ids) await idbDel(kFile(id)); }catch(e){}
  const theme=(()=>{ try{ return localStorage.getItem(THEMEK); }catch(e){ return null; } })(); S=freshState(); S.appVersion=VERSION; if(theme){ try{ localStorage.setItem(THEMEK,theme); }catch(e){} }
  SEL.clear(); EXP.clear(); EDIT.clear(); saveNow(); closeModal(); recomputeOrder(); renderAll(); openWizard(0); toast('Your desk was reset'); }
