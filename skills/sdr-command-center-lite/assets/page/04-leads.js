
/* ====== lead actions ====== */
function touch(l){ l.st_at=new Date().toISOString(); }
function setStatus(l,st,opt){ opt=opt||{}; const prev={st:l.st,st_at:l.st_at,next:l.next,meet_at:l.meet_at};
  l.st=st; touch(l);
  if(CLOSED.has(st)) l.next=null;
  else if(st==='open') {}
  else if(st==='meet'){ if(!l.meet_at) l.meet_at=l.st_at; }
  else { const dn=defaultNext(st); if(dn&&(!l.next||new Date(l.next)<new Date()||['na','gk','later','cb'].includes(prev.st))) l.next=dn; }
  (l.log=l.log||[]).push({at:l.st_at,t:'st',v:st}); if(l.log.length>60) l.log=l.log.slice(-60);
  save(); afterLeadChange(l);
  if(!opt.silent) toast(`${esc(nameOf(l))}: ${esc(STL[st].label)}`,{undo:()=>{ Object.assign(l,prev); l.log.pop(); save(); afterLeadChange(l); }});
  if(st==='meet'&&prev.st!=='meet') celebrate(l); }
function logOutcome(l,oKey,nextVal){ const o=OUTL[oKey]; const prev={st:l.st,st_at:l.st_at,next:l.next,meet_at:l.meet_at};
  const d={at:new Date().toISOString(),id:l.id,o:o.k,k:uid()}; queueDial(d); S.dials.push(d);
  l.st=o.st; l.st_at=d.at; l.next=nextVal!==undefined?nextVal:defaultNext(o.st); if(CLOSED.has(o.st)) l.next=null;
  if(o.st==='meet'&&!l.meet_at) l.meet_at=d.at;
  save(); afterLeadChange(l); renderStrip(o.k);
  toast(`${o.k==='meet'?'Meeting booked with':'Logged'} ${esc(nameOf(l))}${o.k==='meet'?'':': '+esc(o.label.toLowerCase())}${l.next&&o.k!=='meet'?' · next '+esc(fmtNext(l.next)):''}`,
    {undo:()=>{ const i=S.dials.lastIndexOf(d); if(i>=0) S.dials.splice(i,1); Object.assign(l,prev); save(); afterLeadChange(l); renderStrip(); }});
  if(o.k==='meet'&&prev.st!=='meet') celebrate(l); }
function setNext(l,val){ l.next=val||null; save(); afterLeadChange(l); if(val) toast(`${esc(STL[stOf(l)].nx||'Next step')}: ${esc(fmtNext(val))} · ${esc(nameOf(l))}`); }
function logManualDial(){ const d={at:new Date().toISOString(),id:null,o:'x'}; S.dials.push(d); save(); renderStrip('x');
  toast('Dial logged',{undo:()=>{ const i=S.dials.lastIndexOf(d); if(i>=0) S.dials.splice(i,1); save(); renderStrip(); }}); }
function celebrate(l){ const s=$('#strip'); if(!s) return; s.animate?s.animate([{boxShadow:'0 0 0 0 rgba(217,154,0,.0)'},{boxShadow:'0 0 0 6px rgba(217,154,0,.35)'},{boxShadow:'0 0 0 0 rgba(217,154,0,0)'}],{duration:1100}):0; }
function afterLeadChange(l){ renderRow(l.id); renderStrip(); renderChips(); renderNav(); renderHsStatus(); if(S.ui.view==='today') renderToday(); }
function deleteLeads(ids,opt){ opt=opt||{}; const set=new Set(ids); const removed=S.leads.filter(l=>set.has(l.id)); const lists0=S.lists.slice(); const dials0=S.dials.slice(); if(opt.dials) S.dials=S.dials.filter(d=>!set.has(d.id)); S.leads=S.leads.filter(l=>!set.has(l.id)); ids.forEach(id=>{SEL.delete(id);EXP.delete(id);}); tidyLists();
  save(); recomputeOrder(); renderAll();
  toast(`${removed.length} lead${removed.length===1?'':'s'} deleted`,{undo:()=>{ S.leads=S.leads.concat(removed); S.lists=lists0; S.dials=dials0; save(); recomputeOrder(); renderAll(); }}); }

/* ====== calling & e-mail ====== */
const WEB_DIALER={aircall:'https://workspace.aircall.io/',ringcentral:'https://app.ringcentral.com/',dialpad:'https://dialpad.com/app',teams:'https://teams.microsoft.com/'};
function telOf(n){ n=String(n||'').trim(); let s=n.replace(/[^\d+]/g,''); if(s.startsWith('00')) s='+'+s.slice(2); return s; }
function callBtn(l,num,alt){ if(!num) return ''; return `<a class="callb ${alt?'alt':''}" href="${DEMO?'#':'tel:'+esc(telOf(num))}" target="_blank" rel="noopener" data-call="${esc(l.id)}" data-num="${esc(telOf(num))}" title="Call ${esc(num)}">${PHONE_SVG}${esc(num)}</a>`; }
function startCall(l,num,ev){ const mode=S.settings.stack.callMode||'tel'; const n=telOf(num); if(!n) return;
  if(DEMO){ if(ev) ev.preventDefault(); toast('Demo mode – no call is placed. Log how it went.'); if(S.ui.view==='leads'&&$('#focus').classList.contains('hidden')&&!EXP.has(l.id)){ CALLED.add(l.id); setTimeout(()=>renderRow(l.id),0); } return; }
  if(AB.rowlog==='B'&&S.ui.view==='leads'&&$('#focus').classList.contains('hidden')&&!EXP.has(l.id)){ CALLED.add(l.id); setTimeout(()=>renderRow(l.id),0); }
  if(mode==='tel'){ copyText(n); return; /* the tel: link itself opens the dialer */ }
  if(ev) ev.preventDefault();
  copyText(n).then(ok=>{ const web=WEB_DIALER[S.settings.stack.dialer];
    if(mode==='web'&&web){ openLink(web); toast(`${ok?'Number copied':'Copy '+esc(n)} – paste it into your dialer and press call`); }
    else toast(ok?`${esc(n)} copied – paste it into your dialer`:`Copy ${esc(n)} by hand`); });
  if(AB.rowlog!=='B'&&!EXP.has(l.id)&&S.ui.view==='leads'){ EXP.add(l.id); renderRow(l.id); } }
function fill(text,l){ const st=S.settings; const m={first_name:firstOf(l)||'there',last_name:l.last||'',company:l.company||'your team',title:l.title||'',my_name:st.name||'[your name]',my_company:st.company||'[your company]',my_website:String(st.website||'').replace(/^https?:\/\//,'').replace(/\/$/,''),booking_link:st.stack.booking||'[your booking link]'};
  return String(text||'').replace(/\{(first_name|last_name|company|title|my_name|my_company|my_website|booking_link)\}/g,(_,k)=>m[k]).replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trimEnd(); }
function pbSec(k){ return S.playbook&&(S.playbook.sections||[]).find(s=>s.k===k); }
function splitEmail(t){ const lines=String(t||'').split('\n'); let subject='', i=0; while(i<lines.length&&!lines[i].trim()) i++; if(/^subject\s*:/i.test(lines[i]||'')){ subject=lines[i].replace(/^subject\s*:\s*/i,'').trim(); i++; } return {subject,body:lines.slice(i).join('\n').replace(/^\n+/,'')}; }
function emailFor(l){ const s=pbSec('email'); if(!s) return {subject:'',body:''}; return splitEmail(fill(s.body,l)); }
function composeUrl(l){ const e=emailFor(l); const to=l.email||''; const mode=S.settings.stack.mail;
  if(mode==='gmail') return 'https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(to)+'&su='+encodeURIComponent(e.subject)+'&body='+encodeURIComponent(e.body);
  if(mode==='outlook') return 'https://outlook.office.com/mail/deeplink/compose?to='+encodeURIComponent(to)+'&subject='+encodeURIComponent(e.subject)+'&body='+encodeURIComponent(e.body);
  return 'mailto:'+encodeURIComponent(to).replace(/%40/g,'@')+'?subject='+encodeURIComponent(e.subject)+'&body='+encodeURIComponent(e.body); }
function openerFor(l){ const s=pbSec('opener'); if(!s) return ''; const t=fill(s.body,l); const q=t.match(/["“]([^"”]{20,})["”]/); return q?q[1]:t.split('\n').filter(x=>x.trim()&&!/^[-•]/.test(x.trim()))[0]||t; }

/* ====== list state ====== */
const SEL=new Set(), EXP=new Set(), EDIT=new Set(), SCRIPT=new Set(), CALLED=new Set();
let ORDER=[], SHOWN=60; const PAGE=60;
let CALLED_CACHE={n:-1,set:new Set()};
function dialledIds(){ if(CALLED_CACHE.n!==S.dials.length) CALLED_CACHE={n:S.dials.length,set:new Set(S.dials.map(d=>d.id))}; return CALLED_CACHE.set; }
function wasCalled(l){ return stOf(l)!=='open'||dialledIds().has(l.id); }
function matchesFilters(l,ignoreGrp,ignoreHide){ const u=S.ui;
  if(u.hideCalled&&!ignoreHide&&wasCalled(l)&&grpOf(l)!=='due') return false;
  if(u.list&&l.list!==u.list) return false;
  const q=($('#q').value||'').trim().toLowerCase();
  if(!ignoreGrp){ const g=grpOf(l); if(u.grp==='active'){ if(g==='closed'&&!q) return false; } else if(u.grp!=='all'&&g!==u.grp) return false; }
  if(u.callable&&!callableNow(l)) return false;
  if(u.pri&&!isPri(l)) return false;
  if(q){ const hay=[nameOf(l),l.company,l.title,l.email,l.country,l.city,l.note,l.notes,listLabel(l.list)].join(' ').toLowerCase(); if(!q.split(/\s+/).every(w=>hay.includes(w))) return false; }
  return true; }
const GRP_RANK={due:0,todo:1,prog:2,meet:3,closed:4};
function smartKey(l){ const g=grpOf(l); const ph=bestPhone(l)?0:1; const i=localInfo(l); const cal=i?(i.open?0:i.soon?1:2):2;
  return [GRP_RANK[g], g==='due'?new Date(l.next).getTime():0, g==='todo'?cal:0, isPri(l)?0:1, ph, g==='prog'?(l.next?new Date(l.next).getTime():9e15):0, (l.company||'').toLowerCase()]; }
function cmpArr(a,b){ for(let i=0;i<a.length;i++){ if(a[i]<b[i]) return -1; if(a[i]>b[i]) return 1; } return 0; }
function recomputeOrder(){ const ls=S.leads.filter(l=>matchesFilters(l)); const s=S.ui.sort;
  if(s==='company') ls.sort((a,b)=>(a.company||'').localeCompare(b.company||'')||nameOf(a).localeCompare(nameOf(b)));
  else if(s==='name') ls.sort((a,b)=>nameOf(a).localeCompare(nameOf(b)));
  else if(s==='country') ls.sort((a,b)=>(a.country||'~').localeCompare(b.country||'~')||(a.company||'').localeCompare(b.company||''));
  else if(s==='next') ls.sort((a,b)=>(a.next?new Date(a.next).getTime():9e15)-(b.next?new Date(b.next).getTime():9e15)||(a.company||'').localeCompare(b.company||''));
  else if(s==='touched') ls.sort((a,b)=>lastTouch(b).localeCompare(lastTouch(a)));
  else if(s==='added') ls.sort((a,b)=>(b.created||'').localeCompare(a.created||''));
  else { const k=new Map(ls.map(l=>[l.id,smartKey(l)])); ls.sort((a,b)=>cmpArr(k.get(a.id),k.get(b.id))); }
  ORDER=ls.map(l=>l.id); SHOWN=PAGE; }

/* ====== chips (the whole filter bar) ====== */
const GRPS=[['active','Active'],['todo','To call'],['due','Due today'],['prog','In progress'],['meet','Meetings'],['closed','Closed']];
function renderChips(){ const base=S.leads.filter(l=>matchesFilters(l,true)); const cnt={active:0,todo:0,due:0,prog:0,meet:0,closed:0}; base.forEach(l=>{ const g=grpOf(l); cnt[g]++; if(g!=='closed') cnt.active++; });
  const callN=S.leads.filter(l=>(!S.ui.list||l.list===S.ui.list)&&callableNow(l)&&!CLOSED.has(stOf(l))).length;
  $('#chips').innerHTML=GRPS.map(([k,lb])=>`<button class="chip ${S.ui.grp===k?'on':''}" data-grp="${k}" ${k==='active'?'title="Everything except closed leads"':k==='todo'?'title="Never called"':''}>${lb} <span class="c">${cnt[k]}</span></button>`).join('')+
    `<span class="sep"></span><button class="chip tog ${S.ui.callable?'on':''}" data-tog="callable" title="Only leads whose local time is inside your call window (${S.settings.callFrom}:00–${S.settings.callTo}:00 their time)">Callable now <span class="c">${callN}</span></button>`+
    `<button class="chip tog ${S.ui.pri?'on':''}" data-tog="pri" title="★ = title matches your target titles, or starred by you">★ Priority</button>`+
    (()=>{ const hid=S.leads.filter(l=>matchesFilters(l,true,true)&&wasCalled(l)&&grpOf(l)!=='due').length; return `<button class="chip tog ${S.ui.hideCalled?'on':''}" data-tog="hideCalled" title="Hide leads you’ve already called – due callbacks and retries stay visible">${S.ui.hideCalled?`🙈 Hiding ${hid} called`:`🙈 Hide called <span class="c">${hid}</span>`}</button>`; })();
  const fl=$('#fList'); if(S.lists.length>1){ fl.classList.remove('hidden'); fl.innerHTML=`<option value="">All lists</option>`+S.lists.map(x=>`<option value="${esc(x.k)}" ${S.ui.list===x.k?'selected':''}>${esc(x.label)} (${S.leads.filter(l=>l.list===x.k).length})</option>`).join(''); } else { fl.classList.add('hidden'); if(S.ui.list){ S.ui.list=''; } }
  $('#fSort').value=S.ui.sort; }

/* ====== rows ====== */
function rowHtml(l){ const st=stOf(l), g=grpOf(l), pri=isPri(l), ph=bestPhone(l); const stale=!matchesFilters(l); const exp=EXP.has(l.id);
  const nx=l.next?fmtNext(l.next):''; const od=isOverdue(l)||(g==='due');
  return `<div class="row ${exp?'exp':''} ${stale?'stale':''}" data-row="${esc(l.id)}">
  <span class="c-sel"><input type="checkbox" data-sel="${esc(l.id)}" ${SEL.has(l.id)?'checked':''} aria-label="Select ${esc(nameOf(l))}"></span>
  <span class="c-lamp"><span class="lamp st-${st}" title="${esc(STL[st].label)}"></span></span>
  <div class="c-who" style="min-width:0"><div class="nm"><span class="t" data-x="${esc(l.id)}">${esc(nameOf(l))}</span><button class="star ${pri?'on':''}" data-star="${esc(l.id)}" title="${pri?(l.pri===true?'Starred by you':'Title matches your target titles')+' – click to unstar':'Mark as priority'}" aria-label="Priority">★</button></div><div class="s2" title="${esc(l.title||'')}">${esc(l.title||'—')}</div></div>
  <div class="c-co" style="min-width:0"><div class="co" title="${esc(l.company||'')}">${esc(l.company||'—')}</div><div class="s2">${esc([l.city,l.country].filter(Boolean).join(', ')||(S.lists.length>1?listLabel(l.list):''))}</div></div>
  <span class="c-lt">${ltHtml(l)}</span>
  <span class="c-call">${ph?callBtn(l,ph)+`<button class="iconb" data-copy="${esc(ph)}" data-what="Number copied" title="Copy number" aria-label="Copy number ${esc(ph)}">⧉</button>`:'<span class="nophone">No phone</span>'}<button class="sm scb ${SCRIPT.has(l.id)?'on':''}" data-script="${esc(l.id)}" title="Call script for ${esc(nameOf(l))}" aria-pressed="${SCRIPT.has(l.id)}">Script</button></span>
  <span class="c-st"><select class="stsel" data-st="${esc(l.id)}" aria-label="Status">${ST.map(s=>`<option value="${s.k}" ${s.k===st?'selected':''}>${esc(s.label)}</option>`).join('')}</select></span>
  <span class="c-nx">${CLOSED.has(st)?'<span class="tiny muted">Closed</span>':`<button class="nextb ${nx?'set':''} ${od&&nx?'due':''}" data-next="${esc(l.id)}" title="${esc(STL[st].nx||'Next step')}">${nx?esc(nx):'+ Next step'}</button>`}</span>
  <button class="chev" data-x="${esc(l.id)}" aria-expanded="${exp}" title="${exp?'Close':'Open'} details">${exp?'▾':'▸'}</button>
  ${exp?panelHtml(l):(CALLED.has(l.id)?`<div class="qlog"><b class="small">How did it go?</b>${OUT.map(o=>`<button data-out="${o.k}" data-id="${esc(l.id)}"><i style="background:${o.col}"></i>${esc(o.label)}</button>`).join('')}<button class="sm quiet" data-x="${esc(l.id)}">Notes and script</button><button class="sm quiet" data-qx="${esc(l.id)}" aria-label="Close">✕</button></div>`:'')+(SCRIPT.has(l.id)?`<div class="panel solo">${scriptHtml(l)}</div>`:'')}
</div>`; }
function renderRow(id){ const el=document.querySelector(`[data-row="${CSS.escape(id)}"]`); const l=byId(id); if(!el) return; if(!l){ el.remove(); return; } const tmp=document.createElement('div'); tmp.innerHTML=rowHtml(l); el.replaceWith(tmp.firstElementChild); }
function panelHtml(l){ const ph=l.phone, mo=l.mobile; const st=stOf(l); const crm=crmUrl(l); const op=openerFor(l);
  const hist=S.dials.filter(d=>d.id===l.id).map(d=>({at:d.at,txt:'☎ '+(OUTL[d.o]||{}).label+(d.hs?' · '+hsLabelFor(d):'')})).concat((l.log||[]).filter(x=>x.t==='st').map(x=>({at:x.at,txt:'Status → '+(STL[x.v]||{}).label}))).sort((a,b)=>b.at.localeCompare(a.at));
  const contact=EDIT.has(l.id)?editHtml(l):`<h4>Contact</h4><dl class="kv">
      ${ph?`<dt>Phone</dt><dd>${callBtn(l,ph,!!mo)} <button class="sm quiet" data-copy="${esc(ph)}" title="Copy">Copy</button></dd>`:''}
      ${mo?`<dt>Mobile</dt><dd>${callBtn(l,mo)} <button class="sm quiet" data-copy="${esc(mo)}" title="Copy">Copy</button></dd>`:''}
      ${!ph&&!mo?`<dt>Phone</dt><dd class="muted">None yet – find one in your data tool, then Edit.</dd>`:''}
      <dt>E-mail</dt><dd>${l.email?`${esc(l.email)} <button class="sm quiet" data-copy="${esc(l.email)}">Copy</button>`:'<span class="muted">—</span>'}</dd>
      ${S.settings.stack.li?`<dt>LinkedIn</dt><dd><a href="${esc(liUrl(l))}" target="_blank" rel="noopener noreferrer">${l.li?'Open profile':'Search on LinkedIn'}</a></dd>`:''}
      <dt>Local time</dt><dd>${ltHtml(l)}</dd>
      ${l.domain?`<dt>Website</dt><dd><a href="https://${esc(String(l.domain).replace(/^https?:\/\//,''))}" target="_blank" rel="noopener noreferrer">${esc(String(l.domain).replace(/^https?:\/\//,''))}</a></dd>`:''}
      <dt>List</dt><dd>${esc(listLabel(l.list))}</dd>
      ${crm?`<dt>CRM</dt><dd><a href="${esc(crm)}" target="_blank" rel="noopener noreferrer">Open in ${esc(CRM_NAMES[S.settings.stack.crm]||'CRM')}</a></dd>`:''}
      ${l.notes?`<dt>From import</dt><dd class="small">${esc(l.notes)}</dd>`:''}
    </dl><div class="actions"><button class="sm" data-edit="${esc(l.id)}">Edit details</button><button class="sm danger" data-del="${esc(l.id)}">Delete lead</button></div>`;
  return `<div class="panel">
    <div>${contact}</div>
    <div><h4>Log this call</h4><div class="outs">${OUT.map(o=>`<button data-out="${o.k}" data-id="${esc(l.id)}"><i style="background:${o.col}"></i>${esc(o.label)}</button>`).join('')}</div>
      <h4 style="margin-top:12px">Notes</h4><textarea data-note="${esc(l.id)}" placeholder="What did you learn? Who else is involved? When to call back?">${esc(l.note||'')}</textarea>
      ${hist.length?`<h4 style="margin-top:10px">History</h4><ul class="hist">${hist.slice(0,25).map(h=>`<li><span>${esc(fmtWhen(h.at))}</span>${esc(h.txt)}</li>`).join('')}</ul>`:''}</div>
    <div><h4>Your opener</h4>${op?`<div class="script">${esc(op)}</div>`:`<div class="script muted">No messaging yet. <a href="#" data-gosetup="2">Set up your playbook</a> and your opener appears here, filled in for each lead.</div>`}
      <div class="actions"><button class="sm primary" data-script="${esc(l.id)}">${SCRIPT.has(l.id)?'Hide call script':'Call script'}</button>${op?`<button class="sm" data-copyop="${esc(l.id)}">Copy opener</button>`:''}${pbSec('email')?`<button class="sm" data-mail="${esc(l.id)}" ${l.email?'':'disabled title="No e-mail address"'}>Write follow-up e-mail</button><button class="sm quiet" data-copymail="${esc(l.id)}">Copy e-mail</button>`:''}${pbSec('linkedin')&&S.settings.stack.li?`<button class="sm quiet" data-copyli="${esc(l.id)}">Copy LinkedIn note</button>`:''}</div>
      ${pbSec('voicemail')?`<details class="fold"><summary>Voicemail</summary><div class="small" style="margin-top:6px">${pbBodyHtml(fill(pbSec('voicemail').body,l))}</div></details>`:''}
    </div>${SCRIPT.has(l.id)?scriptHtml(l):''}</div>`; }
function editHtml(l){ const f=(k,lb,type,full)=>`<label class="${full?'full':''}">${lb}<input type="${type||'text'}" data-ef="${k}" value="${esc(l[k]||'')}"></label>`;
  return `<h4>Edit details</h4><div class="ef" data-editbox="${esc(l.id)}">${f('first','First name')}${f('last','Last name')}${f('title','Job title','text',true)}${f('company','Company')}${f('domain','Website')}${f('phone','Phone','tel')}${f('mobile','Mobile','tel')}${f('email','E-mail','email',true)}${f('li','LinkedIn URL','url',true)}${f('city','City')}${f('state','State / region')}${f('country','Country')}${f('crm_id','CRM record ID')}
    <label class="full">List<select data-ef="list">${S.lists.map(x=>`<option value="${esc(x.k)}" ${x.k===l.list?'selected':''}>${esc(x.label)}</option>`).join('')}</select></label></div>
    <div class="actions"><button class="sm primary" data-saveedit="${esc(l.id)}">Save</button><button class="sm" data-canceledit="${esc(l.id)}">Cancel</button></div>`; }

function renderLeads(){ const host=$('#leadList');
  if(!S.leads.length){ host.innerHTML=`<div class="empty"><h3>No leads yet</h3><p>Import a CSV from your CRM or data tool, paste rows from a spreadsheet, or add one lead by hand. Want to look around first? Open the demo desk – a full fictional setup – and switch back any time.</p><div class="actions" style="justify-content:center"><button class="primary" data-act="import">Import leads</button><button data-act="add">Add one lead</button><button data-act="demo">Explore the demo desk</button></div></div>`; $('#showMore').classList.add('hidden'); renderBulk(); renderSampleNote(); return; }
  const ids=ORDER.slice(0,SHOWN); const all=ids.length&&ids.every(id=>SEL.has(id));
  if(!ids.length){ host.innerHTML=`<div class="empty"><h3>Nothing matches</h3><p>No lead fits this search and these filters.</p><div class="actions" style="justify-content:center"><button data-act="clearf">Show all leads</button></div></div>`; }
  else host.innerHTML=`<div class="lhead"><span><input type="checkbox" data-selall ${all?'checked':''} aria-label="Select all shown"></span><span></span><span>Person</span><span>Company</span><span>Their time</span><span>Call</span><span>Status</span><span>Next step</span><span></span></div>`+ids.map(id=>{const l=byId(id);return l?rowHtml(l):'';}).join('');
  const more=ORDER.length-SHOWN; const mb=$('#showMore'); mb.classList.toggle('hidden',more<=0); mb.textContent=`Show ${Math.min(PAGE,more)} more of ${more}`;
  renderBulk(); renderSampleNote(); }
function renderSampleNote(){ const n=S.leads.filter(l=>l.sample).length; const el=$('#sampleNote'); if(!n){ el.classList.add('hidden'); return; }
  el.classList.remove('hidden'); el.innerHTML=`<span>You're looking at ${n} fictional sample lead${n===1?'':'s'}. Try the buttons, then remove them before you import your own.</span><button class="sm" data-act="rmsamples">Remove sample leads</button>`; }
function renderBulk(){ const b=$('#bulk'); const n=SEL.size; if(!n){ b.classList.add('hidden'); b.innerHTML=''; return; } b.classList.remove('hidden');
  b.innerHTML=`<b>${n} selected</b>
   <select data-bulk="status" aria-label="Set status"><option value="">Set status…</option>${ST.map(s=>`<option value="${s.k}">${esc(s.label)}</option>`).join('')}</select>
   <select data-bulk="list" aria-label="Move to list"><option value="">Move to list…</option>${S.lists.map(x=>`<option value="${esc(x.k)}">${esc(x.label)}</option>`).join('')}<option value="__new">New list…</option></select>
   <button class="sm" data-bulkact="star">★ Star</button><button class="sm" data-bulkact="unstar">Unstar</button>
   <button class="sm" data-bulkact="export">Export for sequence</button>
   <button class="sm danger" data-bulkact="delete" style="color:#fff">Delete</button>
   ${ORDER.length>n&&ORDER.slice(0,SHOWN).every(id=>SEL.has(id))?`<button class="sm" data-bulkact="selall">Select all ${ORDER.length} matching</button>`:''}
   <button class="sm quiet" data-bulkact="clear" style="margin-left:auto">Clear selection</button>`; }

/* ====== next-step popover ====== */
let POP_ID=null;
function openNextPop(btn,id,afterPick){ const l=byId(id); if(!l) return; POP_ID=id; const p=$('#pop'); const n=new Date();
  const opts=[]; if(n.getHours()<15) opts.push(['Today 16:00',toInput(atHour(n,16))]);
  opts.push(['Tomorrow 10:00',toInput(atHour(addBiz(n,1),10))]); opts.push(['In 2 working days',toInput(atHour(addBiz(n,2),10))]);
  const mon=new Date(n); mon.setDate(n.getDate()+((8-n.getDay())%7||7)); opts.push(['Next Monday 10:00',toInput(atHour(mon,10))]);
  const w2=new Date(n); w2.setDate(n.getDate()+14); opts.push(['In 2 weeks',toInput(atHour(w2,10))]);
  p.innerHTML=`<div class="tiny muted" style="padding:2px 6px 6px">${esc(STL[stOf(l)].nx||'Next step')} · ${esc(nameOf(l))}</div>`+opts.map(([lb,v])=>`<button data-pick="${v}">${lb}<span class="tiny muted" style="float:right">${esc(fmtNext(v).replace(/^(Today|Tomorrow) /,''))}</span></button>`).join('')+
    `<div class="pk"><input type="datetime-local" id="popDt" value="${esc(l.next||toInput(atHour(addBiz(n,1),10)))}"><button class="sm primary" data-pick="__dt" style="width:auto">Set</button></div>${l.next?'<button data-pick="" class="danger">Clear next step</button>':''}`;
  p.classList.remove('hidden'); const r=btn.getBoundingClientRect(); const top=window.scrollY+r.bottom+6; let left=window.scrollX+r.left; left=Math.min(left,window.scrollX+document.documentElement.clientWidth-262); p.style.top=top+'px'; p.style.left=Math.max(8,left)+'px';
  p.onclick=e=>{ const b=e.target.closest('[data-pick]'); if(!b) return; let v=b.dataset.pick; if(v==='__dt') v=$('#popDt').value; closePop(); setNext(l,v||null); if(afterPick) afterPick(v); };
}
function closePop(){ $('#pop').classList.add('hidden'); POP_ID=null; }
document.addEventListener('click',e=>{ if(POP_ID&&!e.target.closest('#pop')&&!e.target.closest('[data-next]')) closePop(); if(!e.target.closest('.menuwrap')) $('#moreMenu').classList.add('hidden'); });

/* ====== list events (delegated) ====== */
function wireLeads(){
  const host=$('#leadList');
  host.addEventListener('click',e=>{ const t=e.target;
    const call=t.closest('[data-call]'); if(call){ const l=byId(call.dataset.call); if(l) startCall(l,call.dataset.num,e); return; }
    const x=t.closest('[data-x]'); if(x){ const id=x.dataset.x; CALLED.delete(id); EXP.has(id)?EXP.delete(id):EXP.add(id); renderRow(id); return; }
    const sb=t.closest('[data-star]'); if(sb){ const l=byId(sb.dataset.star); l.pri=isPri(l)?false:true; save(); renderRow(l.id); renderChips(); return; }
    const nb=t.closest('[data-next]'); if(nb){ e.stopPropagation(); if(POP_ID===nb.dataset.next){ closePop(); return; } openNextPop(nb,nb.dataset.next); return; }
    const qx=t.closest('[data-qx]'); if(qx){ CALLED.delete(qx.dataset.qx); renderRow(qx.dataset.qx); return; }
    const ob=t.closest('[data-out]'); if(ob){ const l=byId(ob.dataset.id); CALLED.delete(l.id); logOutcome(l,ob.dataset.out); if(ob.dataset.out==='cb'){ const nbb=document.querySelector(`[data-row="${CSS.escape(l.id)}"] [data-next]`); if(nbb) openNextPop(nbb,l.id); } return; }
    const cp=t.closest('[data-copy]'); if(cp){ copyAndToast(cp.dataset.copy,cp.dataset.what); return; }
    const ed=t.closest('[data-edit]'); if(ed){ EDIT.add(ed.dataset.edit); renderRow(ed.dataset.edit); return; }
    const ce=t.closest('[data-canceledit]'); if(ce){ EDIT.delete(ce.dataset.canceledit); renderRow(ce.dataset.canceledit); return; }
    const se=t.closest('[data-saveedit]'); if(se){ const l=byId(se.dataset.saveedit); host.querySelectorAll(`[data-editbox="${CSS.escape(l.id)}"] [data-ef]`).forEach(i=>{ l[i.dataset.ef]=i.value.trim(); }); l.name=''; EDIT.delete(l.id); save(); renderRow(l.id); renderChips(); toast('Details saved'); return; }
    const dl=t.closest('[data-del]'); if(dl){ armDanger(dl,()=>deleteLeads([dl.dataset.del])); return; }
    const scb=t.closest('[data-script]'); if(scb){ const id=scb.dataset.script; SCRIPT.has(id)?SCRIPT.delete(id):SCRIPT.add(id); renderRow(id); return; }
    const csb=t.closest('[data-copyscript]'); if(csb){ copyAndToast(scriptText(byId(csb.dataset.copyscript)),'Call script copied'); return; }
    const tl=t.closest('[data-tailor]'); if(tl){ const l=byId(tl.dataset.tailor); tailorOpener(l,tl.closest('.cs-ai')||document.querySelector(`[data-aifor="${CSS.escape(l.id)}"]`)); return; }
    const co=t.closest('[data-copyop]'); if(co){ copyAndToast(openerFor(byId(co.dataset.copyop)),'Opener copied'); return; }
    const ml=t.closest('[data-mail]'); if(ml){ const l=byId(ml.dataset.mail); openLink(composeUrl(l)); return; }
    const cm=t.closest('[data-copymail]'); if(cm){ const em=emailFor(byId(cm.dataset.copymail)); copyAndToast((em.subject?'Subject: '+em.subject+'\n\n':'')+em.body,'E-mail copied'); return; }
    const cl=t.closest('[data-copyli]'); if(cl){ copyAndToast(fill(pbSec('linkedin').body,byId(cl.dataset.copyli)),'LinkedIn note copied'); return; }
    const gs=t.closest('[data-gosetup]'); if(gs){ e.preventDefault(); openWizard(+gs.dataset.gosetup); return; }
    const a=t.closest('[data-act]'); if(a) doAct(a.dataset.act);
  });
  host.addEventListener('change',e=>{ const t=e.target;
    if(t.matches('[data-st]')){ const l=byId(t.dataset.st); setStatus(l,t.value); return; }
    if(t.matches('[data-sel]')){ t.checked?SEL.add(t.dataset.sel):SEL.delete(t.dataset.sel); renderBulk(); const sa=host.querySelector('[data-selall]'); if(sa) sa.checked=ORDER.slice(0,SHOWN).every(id=>SEL.has(id)); return; }
    if(t.matches('[data-selall]')){ ORDER.slice(0,SHOWN).forEach(id=>t.checked?SEL.add(id):SEL.delete(id)); renderLeads(); return; }
  });
  let noteT=null; host.addEventListener('input',e=>{ const t=e.target; if(t.matches('[data-note]')){ const l=byId(t.dataset.note); l.note=t.value; clearTimeout(noteT); noteT=setTimeout(save,400); } });
  $('#bulk').addEventListener('change',e=>{ const t=e.target; const ids=[...SEL]; if(!ids.length) return;
    if(t.dataset.bulk==='status'&&t.value){ const st=t.value; ids.forEach(id=>{ const l=byId(id); if(l){ l.st=st; touch(l); if(CLOSED.has(st)) l.next=null; else if(st==='meet'){ if(!l.meet_at) l.meet_at=l.st_at; } else if(!l.next){ const dn=defaultNext(st); if(dn) l.next=dn; } (l.log=l.log||[]).push({at:l.st_at,t:'st',v:st}); } }); save(); toast(`${ids.length} leads set to “${esc(STL[st].label)}”`); renderAll(); }
    if(t.dataset.bulk==='list'&&t.value){ const mv=k=>{ ids.forEach(id=>{ const l=byId(id); if(l) l.list=k; }); save(); toast(`${ids.length} leads moved to ${esc(listLabel(k))}`); recomputeOrder(); renderAll(); };
      if(t.value==='__new'){ t.value=''; askText('Name of the new list','',nm=>{ if(nm) mv(addList(nm)); }); } else mv(t.value); }
  });
  $('#bulk').addEventListener('click',e=>{ const b=e.target.closest('[data-bulkact]'); if(!b) return; const ids=[...SEL]; const a=b.dataset.bulkact;
    if(a==='clear'){ SEL.clear(); renderLeads(); return; }
    if(a==='selall'){ ORDER.forEach(id=>SEL.add(id)); renderBulk(); return; }
    if(a==='star'||a==='unstar'){ ids.forEach(id=>{ const l=byId(id); if(l) l.pri=(a==='star'); }); save(); renderAll(); return; }
    if(a==='export'){ exportSequence(ids.map(byId).filter(Boolean)); return; }
    if(a==='delete'){ armDanger(b,()=>deleteLeads(ids)); }
  });
  $('#chips').addEventListener('click',e=>{ const c=e.target.closest('[data-grp]'); if(c){ S.ui.grp=c.dataset.grp; } const tg=e.target.closest('[data-tog]'); if(tg){ S.ui[tg.dataset.tog]=!S.ui[tg.dataset.tog]; if(tg.dataset.tog==='hideCalled') toast(S.ui.hideCalled?'Called leads hidden – due callbacks and retries stay visible':'Showing called leads again'); } if(c||tg){ save(); recomputeOrder(); renderChips(); renderLeads(); } });
  let qT=null; $('#q').addEventListener('input',()=>{ clearTimeout(qT); qT=setTimeout(()=>{ recomputeOrder(); renderChips(); renderLeads(); },160); });
  $('#fSort').addEventListener('change',e=>{ S.ui.sort=e.target.value; save(); recomputeOrder(); renderLeads(); });
  $('#fList').addEventListener('change',e=>{ S.ui.list=e.target.value; save(); recomputeOrder(); renderChips(); renderLeads(); });
  $('#showMore').addEventListener('click',()=>{ SHOWN+=PAGE; renderLeads(); });
  $('#addBtn').addEventListener('click',()=>toggleAdd(true));
  $('#importBtn').addEventListener('click',()=>openImport());
  $('#moreBtn').addEventListener('click',e=>{ e.stopPropagation(); renderMoreMenu(); $('#moreMenu').classList.toggle('hidden'); });
  $('#sampleNote').addEventListener('click',e=>{ const a=e.target.closest('[data-act]'); if(a) doAct(a.dataset.act); });
  document.addEventListener('keydown',e=>{ if(e.key==='/'&&S.ui.view==='leads'&&!/input|textarea|select/i.test(document.activeElement.tagName)&&$('#focus').classList.contains('hidden')){ e.preventDefault(); $('#q').focus(); } });
}
function clearFilters(){ $('#q').value=''; Object.assign(S.ui,{grp:'active',list:'',callable:false,pri:false}); save(); recomputeOrder(); renderChips(); renderLeads(); }
function tidyLists(){ S.lists=S.lists.filter(x=>!((x.k==='main'||x.auto)&&!S.leads.some(l=>l.list===x.k))); if(!S.lists.length) S.lists=[{k:'main',label:'My leads'}]; if(S.ui.list&&!S.lists.some(x=>x.k===S.ui.list)) S.ui.list=''; S.leads.forEach(l=>{ if(!S.lists.some(x=>x.k===l.list)) l.list=S.lists[0].k; }); }
function addList(label){ const k='l'+uid(); S.lists.push({k,label:String(label).trim().slice(0,60)||'New list'}); save(); return k; }

/* add lead */
function toggleAdd(on){ const b=$('#addBox'); if(!on){ b.classList.add('hidden'); b.innerHTML=''; return; }
  b.classList.remove('hidden'); const tgt=S.ui.list||S.lists[0].k;
  b.innerHTML=`<div class="mh" style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">Add a lead</h3><button class="sm quiet" data-addx>Close</button></div>
   <div class="ef" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-top:8px">
   ${[['first','First name'],['last','Last name'],['title','Job title'],['company','Company'],['phone','Phone'],['mobile','Mobile'],['email','E-mail'],['country','Country']].map(([k,lb])=>`<label>${lb}<input data-af="${k}" type="text"></label>`).join('')}
   <label class="full">LinkedIn URL<input data-af="li" type="url" placeholder="optional"></label>
   <label>List<select data-af="list">${S.lists.map(x=>`<option value="${esc(x.k)}" ${x.k===tgt?'selected':''}>${esc(x.label)}</option>`).join('')}</select></label></div>
   <div class="actions"><button class="primary" data-addgo>Add lead</button><span class="tiny muted" style="align-self:center">Name or company plus a phone or e-mail is enough.</span></div>`;
  b.querySelector('[data-addx]').onclick=()=>toggleAdd(false);
  b.querySelector('[data-addgo]').onclick=()=>{ const v={}; b.querySelectorAll('[data-af]').forEach(i=>v[i.dataset.af]=i.value.trim()); if(!(v.first||v.last||v.company)){ toast('Add at least a name or a company'); return; }
    const l=Object.assign({id:'m'+uid(),created:new Date().toISOString(),st:'open'},v); S.leads.push(l); save(); recomputeOrder(); if(!ORDER.includes(l.id)) ORDER.unshift(l.id); renderAll(); toast(`${esc(nameOf(l))} added`);
    b.querySelectorAll('input[data-af]').forEach(i=>i.value=''); b.querySelector('[data-af="first"]').focus(); };
  b.querySelector('[data-af="first"]').focus(); }

function renderMoreMenu(){ const m=$('#moreMenu'); const n=ORDER.length;
  m.innerHTML=`<button data-mm="seq">Export ${n} shown leads for an e-mail sequence (.csv)</button>
   <button data-mm="all">Export all leads with status and notes (.csv)</button>
   <button data-mm="activity">Export call log (.csv)</button>
   <hr><button data-mm="lists">Manage lists…</button>
   <button data-mm="backup">Back up everything (.json)</button><button data-mm="restore">Restore a backup…</button>
   ${S.leads.some(l=>l.sample)?'<hr><button data-mm="rmsamples">Remove sample leads</button>':''}`;
  m.onclick=e=>{ const b=e.target.closest('[data-mm]'); if(!b) return; m.classList.add('hidden'); const a=b.dataset.mm;
    if(a==='seq') exportSequence(ORDER.map(byId).filter(Boolean)); if(a==='all') exportAll(); if(a==='activity') exportActivity();
    if(a==='lists') manageLists(); if(a==='backup') backup(); if(a==='restore') restore(); if(a==='rmsamples') doAct('rmsamples'); }; }
function doAct(a){
  if(a==='import') openImport(); if(a==='add'){ go('leads'); toggleAdd(true); } if(a==='samples') loadSamples(); if(a==='demo') setDemo(true); if(a==='clearf') clearFilters();
  if(a==='rmsamples'){ deleteLeads(S.leads.filter(l=>l.sample).map(l=>l.id),{dials:true}); }
}
function manageLists(){ const rows=()=>S.lists.map((x,i)=>{ const n=S.leads.filter(l=>l.list===x.k).length; return `<tr><td><input type="text" data-ln="${esc(x.k)}" value="${esc(x.label)}" style="width:100%"></td><td style="text-align:right">${n}</td><td style="text-align:right">${S.lists.length>1?`<button class="sm danger" data-ldel="${esc(x.k)}">Delete list${n?' and '+n+' leads':''}</button>`:''}</td></tr>`; }).join('');
  const box=openModal(`<div class="mh"><h3 style="margin:0">Lists</h3><button class="sm quiet" data-close>Done</button></div><p class="small muted" style="margin-top:0">Each import becomes a list, so you can work it, export it or delete it in one go. Rename a list by typing over its name.</p><table class="t"><thead><tr><th>Name</th><th>Leads</th><th></th></tr></thead><tbody id="lrows">${rows()}</tbody></table><div class="actions"><button class="sm" data-lnew>New list</button></div>`,{label:'Lists'});
  box.querySelector('[data-close]').onclick=()=>{ closeModal(); renderAll(); };
  box.addEventListener('input',e=>{ const i=e.target.closest('[data-ln]'); if(i){ const x=S.lists.find(z=>z.k===i.dataset.ln); if(x){ x.label=i.value.slice(0,60)||'Untitled'; save(); } } });
  box.addEventListener('click',e=>{ const d=e.target.closest('[data-ldel]'); if(d){ armDanger(d,()=>{ const k=d.dataset.ldel; const ids=S.leads.filter(l=>l.list===k).map(l=>l.id); S.lists=S.lists.filter(z=>z.k!==k); if(S.ui.list===k) S.ui.list=''; S.leads=S.leads.filter(l=>l.list!==k); ids.forEach(id=>{SEL.delete(id);EXP.delete(id);}); save(); recomputeOrder(); box.querySelector('#lrows').innerHTML=rows(); toast('List deleted'); }); }
    if(e.target.closest('[data-lnew]')){ addList('New list'); box.querySelector('#lrows').innerHTML=rows(); } }); }
