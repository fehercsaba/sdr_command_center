
/* ====== header, strip, nav ====== */
function renderHeader(){ const st=S.settings; $('#deskTitle').textContent=st.name?(st.name.split(' ')[0]+'’s call desk'):'Your call desk';
  $('#deskSub').textContent=(st.company?st.company+' · ':'')+'SDR Command Center Lite';
  const done=S.setup.done; $('#setupDot').classList.toggle('hidden',done); $('#setupLbl').textContent=done?'Setup':'Finish setup'; }
function dialsOn(day){ return S.dials.filter(d=>dkey(d.at)===day); }
function renderStrip(popKind){ const t=todayKey(); const slim=AB.strip==='B'&&S.ui.view!=='today'; $('#strip').classList.toggle('slim',slim); const ds=dialsOn(t).sort((a,b)=>a.at.localeCompare(b.at)); const target=Math.max(1,+S.settings.dialTarget||60);
  const conv=ds.filter(d=>CONN.has(d.o)).length, meetT=ds.filter(d=>d.o==='meet').length;
  const mk=t.slice(0,7); const meetM=S.leads.filter(l=>l.meet_at&&dkey(l.meet_at).slice(0,7)===mk).length;
  const due=S.leads.filter(l=>grpOf(l)==='due').length;
  const n=Math.max(target,ds.length); let ticks='';
  for(let i=0;i<n;i++){ const d=ds[i]; const cls=(d?(OUTL[d.o]?d.o:'x'):'')+((i+1)%10===0?' g10':'')+(i>=target?' over':'')+(d&&popKind&&i===ds.length-1?' pop':''); ticks+=`<i class="${cls}" ${d?`title="${esc(fmtWhen(d.at))} · ${esc((OUTL[d.o]||{}).label||'')}"`:''}></i>`; }
  const left=Math.max(0,target-ds.length);
  if(slim){ $('#strip').innerHTML=`<div class="sl"><b class="sn">${ds.length}</b><span class="small muted">/ ${target} dials</span><div class="ticks mini" style="--tw:4px;--tg:2px" aria-hidden="true">${ticks}</div><span class="ss"><b>${conv}</b> conv.</span><span class="ss"><b>${meetT}</b> meet.</span><span class="ss"><b>${meetM}/${+S.settings.meetTarget||0}</b> month</span><span class="ss ${due?'due':''}"><b>${due}</b> due</span><button class="sm quiet" id="plusDial" title="Count a dial you made outside this page">+1</button></div>`; $('#plusDial').onclick=logManualDial; return; }
  $('#strip').innerHTML=`<div class="tally"><div class="big">${ds.length}<small> / ${target} dials</small></div><div class="cap">${ds.length>=target?'Daily goal reached. Every extra dial is a bonus.':left+' to go today'}</div>
      <div class="actions" style="margin-top:10px"><button class="sm" id="plusDial" title="Count a dial you made outside this page">+1 dial</button></div></div>
    <div><div class="ticks" style="--tw:${n<=60?9:n<=90?7:n<=130?5:4}px;--tg:${n<=60?4:3}px" aria-label="${ds.length} dials today out of ${target}">${ticks}</div>
      <div class="legend"><span><i style="background:var(--slate)"></i>No answer</span><span><i style="background:var(--slate2)"></i>Gatekeeper</span><span><i style="background:var(--go)"></i>Conversation</span><span><i style="background:var(--gold)"></i>Meeting</span><span><i style="background:var(--brick)"></i>Wrong number</span></div>
      <div class="stats"><div class="stat"><b>${conv}</b><span>conversations today</span></div><div class="stat"><b>${meetT}</b><span>meetings today</span></div><div class="stat"><b>${meetM} / ${+S.settings.meetTarget||0}</b><span>meetings this month</span></div><div class="stat ${due?'due':''}"><b>${due}</b><span>callbacks due</span></div></div></div>`;
  $('#plusDial').onclick=logManualDial; }
function renderNav(){ const due=S.leads.filter(l=>grpOf(l)==='due').length;
  const v=[['today','Today',due?due+' due':''],['leads','Leads',S.leads.length||''],['playbook','Playbook',''],['report','Report','']];
  $('#nav').innerHTML=v.map(([k,lb,n])=>`<button data-view="${k}" class="${S.ui.view===k?'on':''}">${lb}${n!==''?`<span class="n">${n}</span>`:''}</button>`).join(''); }
function go(view){ if(S.ui.view!==view){ S.ui.view=view; save(); } renderStrip(); $$('.view').forEach(s=>s.classList.toggle('on',s.id==='v-'+view)); renderNav(); if(view==='today') renderToday(); if(view==='leads'){ renderChips(); renderLeads(); } if(view==='playbook') renderPlaybook(); if(view==='report') renderReport(); }

/* ====== Today ====== */
function callQueue(){ const due=S.leads.filter(l=>grpOf(l)==='due'&&bestPhone(l)).sort((a,b)=>new Date(a.next)-new Date(b.next));
  const fresh=S.leads.filter(l=>grpOf(l)==='todo'&&bestPhone(l)).map(l=>({l,k:smartKey(l)})).sort((a,b)=>cmpArr(a.k,b.k)).map(x=>x.l);
  return due.concat(fresh); }
function renderToday(){ const el=$('#v-today'); const st=S.settings; const now=new Date(); const h=now.getHours();
  const hi=h<12?'Good morning':h<18?'Good afternoon':'Good evening';
  if(!S.leads.length){ el.innerHTML=`<div class="card empty"><h2>${hi}${st.name?', '+esc(st.name.split(' ')[0]):''}.</h2><p>Your desk is ready but empty. Bring in the people you want to call: a CSV from your CRM or data tool works, and so does a copy-paste from a spreadsheet. Want to see it in action first? Open the demo desk.</p><div class="actions" style="justify-content:center"><button class="primary" data-act="import">Import leads</button><button data-act="add">Add one lead</button><button data-act="demo">Explore the demo desk</button>${S.setup.done?'':'<button data-act="setup">Finish setup</button>'}</div></div>`; return; }
  const q=callQueue(); const due=S.leads.filter(l=>grpOf(l)==='due').sort((a,b)=>new Date(a.next)-new Date(b.next));
  const up=q.filter(l=>grpOf(l)==='todo').slice(0,8); const mk=todayKey().slice(0,7);
  const meets=S.leads.filter(l=>stOf(l)==='meet'&&l.meet_at&&dkey(l.meet_at).slice(0,7)===mk);
  const zones={}; S.leads.filter(l=>!CLOSED.has(stOf(l))&&stOf(l)!=='meet'&&bestPhone(l)).forEach(l=>{ const i=localInfo(l); if(!i) return; const k=i.city; zones[k]=zones[k]||{n:0,open:i.open,soon:i.soon,txt:i.txt}; zones[k].n++; });
  const zl=Object.entries(zones).sort((a,b)=>(b[1].open-a[1].open)||(b[1].soon-a[1].soon)||(b[1].n-a[1].n)).slice(0,10);
  const li=l=>`<li><span class="lamp st-${stOf(l)}"></span><div class="nm" style="min-width:0"><a href="#" data-goto="${esc(l.id)}">${esc(nameOf(l))}</a><div class="s2 small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc([l.title,l.company].filter(Boolean).join(', '))}${l.next&&grpOf(l)==='due'?' · <b style="color:var(--brick)">'+esc(fmtNext(l.next))+'</b>':''}</div></div><span>${ltHtml(l)}</span></li>`;
  el.innerHTML=`<div class="dayhead"><div><h2>${hi}${st.name?', '+esc(st.name.split(' ')[0]):''}.</h2><div class="muted">${(()=>{ const dp=due.filter(l=>bestPhone(l)).length, dn=due.length-dp; const head=q.length?`${q.length} lead${q.length===1?'':'s'} in your call queue${dp?`: ${dp} due first, then fresh leads by local time and priority`:', in order of local time and priority'}.`:'Your call queue is empty: every lead with a phone has a next step in the future.'; return head+(dn?` ${dn} due lead${dn===1?' has':'s have'} no phone – e-mail ${dn===1?'them':'them'} from the lead card.`:''); })()}</div></div>
     <button class="primary startbtn" id="startBlock" ${q.length?'':'disabled'}>${PHONE_SVG}Start a call block</button></div>
   <div class="daygrid">
     <div class="card"><h3>Due now <span class="muted" style="font-weight:500">${due.length}</span></h3>${due.length?`<ul class="daylist">${due.slice(0,10).map(li).join('')}</ul>${due.length>10?`<div class="actions"><button class="sm" data-act="showdue">See all ${due.length}</button></div>`:''}`:'<p class="muted small" style="margin:0">Nothing due. Callbacks and retries land here on the day you set.</p>'}</div>
     <div class="card"><h3>Up next</h3>${up.length?`<ul class="daylist">${up.map(li).join('')}</ul>`:'<p class="muted small" style="margin:0">No fresh leads with a phone number. Import more, or find numbers in your data tool.</p>'}</div>
     <div class="card"><h3>Where it's office hours</h3>${zl.length?`<div class="zones">${zl.map(([k,z])=>`<span class="chip" title="${z.open?'Inside':'Outside'} your ${st.callFrom}:00–${st.callTo}:00 call window"><span class="lt ${z.open?'open':z.soon?'soon':''}"><i></i></span>${esc(k)} ${z.txt} <span class="c">${z.n}</span></span>`).join('')}</div><p class="tiny muted" style="margin:10px 0 0">Local time comes from country, state, city or the phone's country code.</p>`:'<p class="muted small" style="margin:0">Add a country to your leads to see their local time.</p>'}</div>
     <div class="card"><h3>Meetings booked this month <span class="muted" style="font-weight:500">${meets.length} / ${+st.meetTarget||0}</span></h3>${meets.length?`<ul class="daylist">${meets.map(l=>`<li><span class="lamp st-meet"></span><div class="nm"><a href="#" data-goto="${esc(l.id)}">${esc(nameOf(l))}</a><div class="small muted">${esc(l.company||'')}</div></div><span class="small muted">${l.next?esc(fmtNext(l.next)):'set date'}</span></li>`).join('')}</ul>`:'<p class="muted small" style="margin:0">None yet this month. The first one is the hardest.</p>'}</div>
   </div>`;
  $('#startBlock').onclick=startBlock; }
function wireToday(){ $('#v-today').addEventListener('click',e=>{ const g=e.target.closest('[data-goto]'); if(g){ e.preventDefault(); gotoLead(g.dataset.goto); return; }
  const a=e.target.closest('[data-act]'); if(a){ if(a.dataset.act==='setup') openWizard(S.setup.step||0); else if(a.dataset.act==='showdue'){ S.ui.grp='due'; $('#q').value=''; save(); recomputeOrder(); go('leads'); } else doAct(a.dataset.act); } }); }
function gotoLead(id){ const l=byId(id); if(!l) return; Object.assign(S.ui,{grp:'active',list:'',callable:false,pri:false}); $('#q').value=nameOf(l); EXP.add(id); recomputeOrder(); go('leads'); setTimeout(()=>{ const el=document.querySelector(`[data-row="${CSS.escape(id)}"]`); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}); },60); }

/* ====== focused call block ====== */
let FB=null;
function startBlock(){ const q=callQueue(); if(!q.length) return; FB={ids:q.map(l=>l.id),i:0,dials:0,conv:0,meet:0,cb:false}; $('#focus').classList.remove('hidden'); renderFocus(); }
function endBlock(){ $('#focus').classList.add('hidden'); $('#focus').innerHTML=''; if(FB&&FB.dials) toast(`Call block done: ${FB.dials} dial${FB.dials===1?'':'s'}, ${FB.conv} conversation${FB.conv===1?'':'s'}, ${FB.meet} meeting${FB.meet===1?'':'s'}`); FB=null; renderAll(); }
function renderFocus(){ const f=$('#focus'); if(!FB) return; if(FB.i>=FB.ids.length){ f.innerHTML=`<div class="focus"><h2>Queue finished</h2><p class="muted">${FB.dials} dials, ${FB.conv} conversations, ${FB.meet} meetings in this block. Nice work.</p><div class="actions"><button class="primary" data-f="end">Back to my desk</button></div></div>`; f.querySelector('[data-f="end"]').onclick=endBlock; return; }
  const l=byId(FB.ids[FB.i]); if(!l){ FB.i++; renderFocus(); return; }
  const op=openerFor(l); const ob=pbSec('objections'); const crm=crmUrl(l);
  f.innerHTML=`<div class="focus ${AB.mcall==='B'?'stickyout':''}">
   <div class="fh"><span>Lead ${FB.i+1} of ${FB.ids.length} · ${grpOf(l)==='due'?'<b style="color:var(--brick)">due '+esc(fmtNext(l.next))+'</b>':'fresh lead'} · this block: ${FB.dials} dials, ${FB.conv} conversations, ${FB.meet} meetings</span><span><button class="sm quiet" data-f="skip" title="Skip (S)">Skip</button> <button class="sm" data-f="end" title="End (Esc)">End block</button></span></div>
   <div class="who2"><div><div class="n">${esc(nameOf(l))} ${isPri(l)?'<span style="color:var(--gold);font-size:18px" title="Priority">★</span>':''}</div><div class="r">${esc([l.title,l.company].filter(Boolean).join(' at '))}</div><div class="small muted" style="margin-top:4px">${esc([l.city,l.state,l.country].filter(Boolean).join(', '))} ${ltHtml(l)} ${stOf(l)!=='open'?' · '+esc(STL[stOf(l)].label):''}</div></div>
     <div class="actions" style="margin:0">${S.settings.stack.li?`<a class="small" href="${esc(liUrl(l))}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`:''}${crm?` <a class="small" href="${esc(crm)}" target="_blank" rel="noopener noreferrer">CRM</a>`:''}${l.email?` <span class="small muted">${esc(l.email)}</span>`:''}</div></div>
   <div class="callrow">${l.mobile?callBtn(l,l.mobile)+`<button class="iconb" data-copy="${esc(l.mobile)}" data-what="Number copied" title="Copy number" aria-label="Copy number">⧉</button>`:''}${l.phone?callBtn(l,l.phone,!!l.mobile)+`<button class="iconb" data-copy="${esc(l.phone)}" data-what="Number copied" title="Copy number" aria-label="Copy number">⧉</button>`:''}</div>
   <div class="cols"><div>${S.playbook?scriptHtml(l,{compact:true}):'<h4>Opener</h4><div class="script muted">Your call script appears here once your playbook is set up (Setup → Your messaging).</div>'}
       <h4 style="margin-top:12px">Notes</h4><textarea data-fnote placeholder="Notes for this lead">${esc(l.note||'')}</textarea></div>
     <div class="fo-out"><h4>How did it go?</h4><div class="outs" style="grid-template-columns:1fr">${OUT.map(o=>`<button data-fo="${o.k}"><i style="background:${o.col}"></i>${esc(o.label)}<kbd>${o.key}</kbd></button>`).join('')}</div>
       <div id="cbPick" class="${FB.cb?'':'hidden'}"><div class="cbpick"><span class="small" style="width:100%">When do you call back?</span>${cbOptions().map(([lb,v])=>`<button class="sm" data-cbv="${v}">${lb}</button>`).join('')}<input type="datetime-local" id="cbDt" value="${toInput(atHour(addBiz(new Date(),1),10))}"><button class="sm primary" data-cbv="__dt">Set</button></div></div>
       <p class="tiny muted" style="margin-top:8px">Keys: 1–6 log the outcome and move on · S skip · Esc end.</p></div></div></div>`;
  f.querySelector('[data-fnote]').addEventListener('input',e=>{ l.note=e.target.value; save(); });
  f.onclick=e=>{ const b=e.target.closest('[data-f]'); if(b){ if(b.dataset.f==='end') endBlock(); if(b.dataset.f==='skip'){ FB.cb=false; FB.i++; renderFocus(); } return; }
    const c=e.target.closest('[data-call]'); if(c){ startCall(l,c.dataset.num,e); return; }
    const tl=e.target.closest('[data-tailor]'); if(tl){ tailorOpener(l,tl.closest('.cs-ai')); return; }
    const gs=e.target.closest('[data-gosetup]'); if(gs){ e.preventDefault(); endBlock(); openWizard(+gs.dataset.gosetup); return; }
    const cp=e.target.closest('[data-copy]'); if(cp){ copyAndToast(cp.dataset.copy,cp.dataset.what); return; }
    const o=e.target.closest('[data-fo]'); if(o){ focusOutcome(l,o.dataset.fo); return; }
    const v=e.target.closest('[data-cbv]'); if(v){ let val=v.dataset.cbv; if(val==='__dt') val=$('#cbDt').value; FB.cb=false; logOutcome(l,'cb',val||defaultNext('cb')); FB.dials++; FB.conv++; FB.i++; renderFocus(); } }; }
function cbOptions(){ const n=new Date(); const o=[]; if(n.getHours()<15) o.push(['Today 16:00',toInput(atHour(n,16))]); o.push(['Tomorrow 10:00',toInput(atHour(addBiz(n,1),10))]); o.push(['In 2 working days',toInput(atHour(addBiz(n,2),10))]); const w=new Date(n); w.setDate(n.getDate()+7); o.push(['Next week',toInput(atHour(w,10))]); return o; }
function focusOutcome(l,k){ if(k==='cb'){ FB.cb=true; $('#cbPick').classList.remove('hidden'); return; } logOutcome(l,k); FB.dials++; if(CONN.has(k)) FB.conv++; if(k==='meet') FB.meet++; FB.i++; renderFocus(); }
document.addEventListener('keydown',e=>{ if(!FB||$('#focus').classList.contains('hidden')) return; if(/textarea|input/i.test(document.activeElement.tagName)){ if(e.key==='Escape') document.activeElement.blur(); return; }
  const l=byId(FB.ids[FB.i]); if(e.key==='Escape'){ endBlock(); return; } if(!l) return; if(e.key==='s'||e.key==='S'){ FB.cb=false; FB.i++; renderFocus(); return; }
  const o=OUT.find(x=>x.key===e.key); if(o){ e.preventDefault(); focusOutcome(l,o.k); } });
