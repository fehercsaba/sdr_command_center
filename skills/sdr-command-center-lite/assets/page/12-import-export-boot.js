
/* ====== import ====== */
function detectDelim(line){ let c={',':0,';':0,'\t':0}, q=false; for(const ch of line){ if(ch==='"') q=!q; else if(!q&&c[ch]!=null) c[ch]++; } return Object.entries(c).sort((a,b)=>b[1]-a[1])[0][1]?Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0]:','; }
function parseCsv(text){ text=String(text||'').replace(/^\ufeff/,''); const first=text.split(/\r?\n/).find(l=>l.trim())||''; const D=detectDelim(first);
  const rows=[]; let row=[],cur='',q=false;
  for(let i=0;i<text.length;i++){ const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=c; }
    else if(c==='"') q=true; else if(c===D){ row.push(cur); cur=''; }
    else if(c==='\n'||c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(cur); rows.push(row); row=[]; cur=''; }
    else cur+=c; }
  if(cur||row.length){ row.push(cur); rows.push(row); }
  return rows.filter(r=>r.some(x=>x&&x.trim())); }
const FIELDS=[
 ['first','First name',['first name','firstname','first_name','given name','vorname','prénom','keresztnév','utónév','nombre','=nome']],
 ['last','Last name',['last name','lastname','last_name','surname','family name','nachname','vezetéknév','családnév','apellido','apellidos','cognome']],
 ['name','Full name',['=full name','=name','=contact name','=person name','=contact','=lead name','=név','=teljes név','=kapcsolattartó','=nombre completo']],
 ['title','Job title',['title','job title','jobtitle','position','=role','headline','job_title','beosztás','pozíció','munkakör','titulus','funktion','jobtitel','cargo','=ruolo','poste']],
 ['company','Company',['company','company name','company_name','account name','organization','organisation','employer','=account','cég','cégnév','vállalat','szervezet','firma','unternehmen','empresa','azienda','entreprise','société']],
 ['domain','Website',['website','domain','company website','company domain','company url','=url','weboldal','honlap','webseite','sitio web','sito web']],
 ['email','E-mail',['email','e-mail','work email','email address','business email','primary email','e-mail cím','email cím','correo','mail']],
 ['phone','Phone',['direct phone','work direct phone','direct dial','work phone','phone','phone number','corporate phone','telephone','business phone','company phone','telefonszám','telefon','teléfono','telefono','téléphone','festnetz','tel']],
 ['mobile','Mobile',['mobile','mobile phone','cell','cell phone','mobile number','mobiltelefon','mobilszám','mobil','handy','móvil','cellulare','portable']],
 ['li','LinkedIn URL',['linkedin','linkedin url','person linkedin url','linkedin profile','profile url','li url']],
 ['country','Country',['country','person country','contact country','=land','ország','país','paese','pays']],
 ['state','State / region',['state','province','person state','=region','state/region','megye','bundesland']],
 ['city','City',['city','person city','=location','town','város','település','stadt','ciudad','città','ville']],
 ['crm_id','CRM record ID',['=record id','=contact id','=lead id','=person id','=hubspot id','=salesforce id','=crm id','=hubspot record id','=contact record id']],
 ['crm_url','CRM link',['crm link','record url','hubspot url','salesforce url','crm url','record link']],
 ['notes','Notes',['notes','note','comment','comments','description','=remarks','megjegyzés','notiz','bemerkung','notas','note']]];
function autoMap(H){ const h=H.map(x=>String(x||'').toLowerCase().replace(/[_\-]+/g,' ').replace(/\s+/g,' ').trim()); const used=new Set(), map={};
  for(const [k,,syn] of FIELDS){ for(const s0 of syn){ const s=s0.replace(/^=/,'').replace(/[_\-]+/g,' '); const i=h.findIndex((x,ix)=>x===s&&!used.has(ix)); if(i>=0){ map[k]=i; used.add(i); break; } } }
  for(const [k,,syn] of FIELDS){ if(map[k]!=null) continue; for(const s0 of syn){ if(s0.startsWith('=')) continue; const s=s0.replace(/[_\-]+/g,' '); const i=h.findIndex((x,ix)=>!used.has(ix)&&x.includes(s)&&!(k==='phone'&&/mobil|cell|handy|móvil|portable/.test(x))&&!(k==='title'&&/company|account/.test(x))&&!(k==='company'&&/(phone|url|website|domain|linkedin|address|city|country|size|industry|revenue|employees|id)\b/.test(x))&&!(k==='li'&&/company/.test(x))&&!(k==='country'&&/company/.test(x))&&!(k==='city'&&/company/.test(x))&&!(k==='state'&&/company/.test(x))&&!(k==='email'&&/status|domain|sent|opened/.test(x))); if(i>=0){ map[k]=i; used.add(i); break; } } }
  return map; }
const FREEMAIL=/^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|me|aol|gmx|web|proton|protonmail|mail)\./i;
function rowToLead(r,map){ const v={}; for(const [k] of FIELDS){ if(map[k]!=null&&map[k]>=0){ let x=String(r[map[k]]==null?'':r[map[k]]).trim(); if(k==='phone'||k==='mobile') x=x.replace(/^'+/,''); if(x) v[k]=x; } }
  if(v.name&&!v.first&&!v.last){ const p=v.name.split(/\s+/); v.first=p.shift(); v.last=p.join(' '); } delete v.name;
  if(v.email) v.email=v.email.toLowerCase();
  if(!v.domain&&v.email&&v.email.includes('@')){ const d=v.email.split('@')[1]; if(d&&!FREEMAIL.test(d)) v.domain=d; }
  if(v.domain) v.domain=v.domain.replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/.*$/,'');
  return v; }
const liSlug=u=>{ const m=String(u||'').toLowerCase().match(/linkedin\.com\/in\/([^/?#]+)/); return m?decodeURIComponent(m[1]):''; };
function matchIndex(){ const em=new Map(), li=new Map(), nc=new Map(); S.leads.forEach(l=>{ if(l.email) em.set(l.email.toLowerCase(),l); const s=liSlug(l.li); if(s) li.set(s,l); const k=(nameOf(l)+'|'+(l.company||'')).toLowerCase(); if(l.company) nc.set(k,l); }); return {em,li,nc}; }
function findExisting(v,ix){ if(v.email&&ix.em.has(v.email)) return ix.em.get(v.email); const s=liSlug(v.li); if(s&&ix.li.has(s)) return ix.li.get(s); if(v.company&&(v.first||v.last)){ const k=([v.first,v.last].filter(Boolean).join(' ')+'|'+v.company).toLowerCase(); if(ix.nc.has(k)) return ix.nc.get(k); } return null; }
function planImport(rows,map){ const ix=matchIndex(); let add=0,upd=0,skip=0; const seen=new Set();
  rows.slice(1).forEach(r=>{ const v=rowToLead(r,map); if(!(v.first||v.last||v.company||v.email)){ skip++; return; } const k=v.email||liSlug(v.li)||([v.first,v.last].join(' ')+'|'+(v.company||'')).toLowerCase(); if(seen.has(k)){ skip++; return; } seen.add(k); findExisting(v,ix)?upd++:add++; });
  return {add,upd,skip}; }
let IMP=null;
function openImport(){ IMP=null; HS.rows=null; const box=openModal(`<div class="mh"><h3 style="margin:0">Import leads</h3><button class="sm quiet" data-close>Close</button></div>
  <p class="small muted" style="margin-top:0">Use a CSV export from your CRM, data tool or Sales Navigator scraper – or copy rows from Excel or Google Sheets, header row included.</p>
  <div id="impCards"></div><div id="impMap"></div>`,{label:'Import leads',wide:true});
  renderImportCards();
  box.querySelector('[data-close]').onclick=closeModal;
  box.addEventListener('click',e=>{ const b=e.target.closest('[data-imp]'); if(!b) return; const a=b.dataset.imp;
    if(a==='file'){ $('#fileIn').value=''; $('#fileIn').click(); }
    if(a==='paste'){ const rows=parseCsv($('#impPaste').value); if(rows.length<2){ toast('Paste a header row plus at least one lead'); return; } showMapping(rows,'Pasted '+fmtWhen(new Date().toISOString()),{kind:'paste',raw:$('#impPaste').value}); }
    if(a==='hs') hsFind(false); if(a==='hsmore') hsFind(true); if(a==='perms') openPerms();
    if(a==='go') runImport(); }); }
function renderImportCards(){ const host=$('#impCards'); if(!host) return; const hs=!!MCP&&!DEMO; const keep=$('#impPaste')?$('#impPaste').value:'';
  host.innerHTML=`<div class="opt3" style="grid-template-columns:${hs?'1fr 1.2fr 1.4fr':'1fr 1.4fr'}"><div class="opt" id="dropZone"><b>Upload a CSV file</b><p>Or drop it on this box.</p><button class="primary" data-imp="file">Choose file</button></div>
   <div class="opt"><b>Paste rows</b><textarea id="impPaste" rows="5" placeholder="First name&#9;Last name&#9;Company&#9;Phone…"></textarea><button data-imp="paste">Read pasted rows</button></div>
   ${hs?`<div class="opt"><b>From HubSpot</b><p>Pull contacts straight from your connected HubSpot. Read-only: nothing is written back.</p>
     <div class="ef" style="grid-template-columns:1fr 1fr">
       <label class="full" style="flex-direction:row;align-items:center;gap:6px;color:var(--ink)"><input type="checkbox" id="hsMine" checked> Only contacts I own</label>
       <label>Lifecycle stage<select id="hsStage"><option value="">Any</option><option value="subscriber">Subscriber</option><option value="lead">Lead</option><option value="marketingqualifiedlead">Marketing qualified</option><option value="salesqualifiedlead">Sales qualified</option><option value="opportunity">Opportunity</option><option value="customer">Customer</option><option value="other">Other</option></select></label>
       <label>Not contacted for<select id="hsQuiet"><option value="">Any time</option><option value="14">14+ days</option><option value="30" selected>30+ days</option><option value="90">90+ days</option></select></label>
       <label class="full">Job title contains<input type="text" id="hsTitle" placeholder="e.g. operations"></label>
       <label class="full" style="flex-direction:row;align-items:center;gap:6px;color:var(--ink)"><input type="checkbox" id="hsPhone" checked> Only people with a phone number</label></div>
     <button class="primary" data-imp="hs">Find contacts</button><div class="small muted" id="hsOut" aria-live="polite"></div></div>`:''}</div>`;
  if(keep) $('#impPaste').value=keep;
  const dz=host.querySelector('#dropZone'); dz.addEventListener('dragover',e=>{ e.preventDefault(); dz.style.borderColor='var(--go)'; }); dz.addEventListener('dragleave',()=>dz.style.borderColor='');
  dz.addEventListener('drop',e=>{ e.preventDefault(); dz.style.borderColor=''; const f=e.dataTransfer.files&&e.dataTransfer.files[0]; if(f) readImportFile(f); }); }

/* ====== HubSpot (optional, read-only; only when the page can reach the viewer's HubSpot connector) ====== */
const HS_SERVER='HubSpot';
const HS={me:null,busy:false,rows:null,offset:null,total:0,opts:null};
const HS_PROPS=['firstname','lastname','jobtitle','company','email','phone','mobilephone','hs_linkedin_url','country','state','city','website','lifecyclestage','notes_last_contacted'];
const HS_HEAD=['First name','Last name','Job title','Company','Website','E-mail','Phone','Mobile','LinkedIn URL','Country','State','City','Record ID','CRM link','Notes'];
const HS_STAGE={subscriber:'Subscriber',lead:'Lead',marketingqualifiedlead:'Marketing qualified',salesqualifiedlead:'Sales qualified',opportunity:'Opportunity',customer:'Customer',evangelist:'Evangelist',other:'Other'};
function hsErrText(e){ const c=e&&e.code; const m={
  server_not_connected:'HubSpot isn’t connected to your account. Add it under Settings → Connectors, then reload this page.',
  needs_reauth:'Your HubSpot connection has expired. Reconnect it under Settings → Connectors, then try again.',
  selection_required:'You have more than one HubSpot connection. Pick one when asked, then try again.',
  server_not_found:'That HubSpot connection no longer exists. Add it again under Settings → Connectors.',
  not_in_manifest:'HubSpot isn’t allowed for this page. Allow it in the page’s permissions, then try again.',
  approval_required:'HubSpot needs your approval for this page. Click “Find contacts” again and allow it when asked.',
  blocked_by_policy:'Your organisation’s settings block this HubSpot request.',
  server_unavailable:'HubSpot didn’t answer in time. Try again in a moment.',
  rate_limited:'Too many HubSpot requests just now. Wait a few seconds and try again.',
  tool_error:'HubSpot reported a problem: '+String((e&&e.message)||'unknown error').slice(0,200),
  cancelled:'Stopped.'}[c];
  if(m) return m; if(['not_granted','capability_disabled','capability_removed'].includes(c)) return 'Connectors aren’t available in this view – use a CSV export from HubSpot instead.';
  return 'The HubSpot request failed'+(e&&e.message?': '+String(e.message).slice(0,160):'.')+' Try again, or import a CSV export.'; }
function hsPayload(r){ let p=r&&r.payload!==undefined?r.payload:r; if(typeof p==='string'){ try{ p=JSON.parse(p); }catch(e){} } return p; }
async function hsCall(tool,input){ return hsPayload(await MCP.callTool(HS_SERVER,tool,input)); }
async function hsWhoAmI(){ if(HS.me) return HS.me; const p=await hsCall('get_user_details',{include:['USER_INFORMATION']});
  const ui=(p&&p.userInformation)||{}; HS.me={ownerId:ui.ownerId!=null?String(ui.ownerId):'',portal:p&&p.accountId!=null?String(p.accountId):'',first:ui.firstName||''};
  const st=S.settings.stack; if(!st.crm) st.crm='hubspot'; if(st.crm==='hubspot'&&!st.crmPortal&&HS.me.portal) st.crmPortal=HS.me.portal; save(); return HS.me; }
function hsGroups(o){ const base=[]; if(o.mine&&HS.me&&HS.me.ownerId) base.push({propertyName:'hubspot_owner_id',operator:'EQ',value:HS.me.ownerId});
  if(o.stage) base.push({propertyName:'lifecyclestage',operator:'EQ',value:o.stage});
  o.title.split(/\s+/).filter(w=>w.length>1).slice(0,3).forEach(w=>base.push({propertyName:'jobtitle',operator:'CONTAINS_TOKEN',value:w}));
  if(o.quiet){ const cut=String(Date.now()-o.quiet*864e5); return [{filters:base.concat([{propertyName:'notes_last_contacted',operator:'LT',value:cut}])},{filters:base.concat([{propertyName:'notes_last_contacted',operator:'NOT_HAS_PROPERTY'}])}]; }
  return base.length?[{filters:base}]:[]; }
function hsRow(r,tpl){ const p=r.properties||{}; const id=String(r.id!=null?r.id:(p.hs_object_id||''));
  const link=tpl&&id?safeUrl(String(tpl).replace('{id}',encodeURIComponent(id)).split('?')[0]):'';
  const note=[p.lifecyclestage?'HubSpot stage: '+(HS_STAGE[p.lifecyclestage]||p.lifecyclestage):'',p.notes_last_contacted?'last contacted '+String(p.notes_last_contacted).slice(0,10):'never contacted in HubSpot'].filter(Boolean).join(' · ');
  return [p.firstname||'',p.lastname||'',p.jobtitle||'',p.company||'',p.website||'',p.email||'',p.phone||'',p.mobilephone||'',p.hs_linkedin_url||'',p.country||'',p.state||'',p.city||'',id,link,note]; }
async function hsFind(more){ const out=$('#hsOut'); if(!MCP||HS.busy) return; HS.busy=true; const btn=document.querySelector('[data-imp="hs"]'); if(btn) btn.disabled=true;
  if(!more){ HS.opts={mine:$('#hsMine').checked,stage:$('#hsStage').value,quiet:+$('#hsQuiet').value||0,title:$('#hsTitle').value.trim(),phone:$('#hsPhone').checked}; HS.rows=null; HS.offset=null; }
  out.textContent=more?'Loading the next 200…':'Asking HubSpot… (you may be asked to allow HubSpot for this page)';
  try{ if(HS.opts.mine) await hsWhoAmI(); else hsWhoAmI().catch(()=>{});
    const input={objectType:'CONTACT',filterGroups:hsGroups(HS.opts),properties:HS_PROPS,limit:200,sorts:[{propertyName:'createdate',direction:'DESCENDING'}],chatInsights:{userIntent:'Import contacts into a personal call list',satisfaction:'NEUTRAL'}};
    if(more&&HS.offset!=null) input.offset=HS.offset;
    const p=await hsCall('search_crm_objects',input); const res=(p&&Array.isArray(p.results))?p.results:[];
    if(p&&p.urlTemplate&&/app-eu1\./.test(p.urlTemplate)&&!S.settings.stack.crmHost.includes('eu1')){ S.settings.stack.crmHost='app-eu1'; save(); }
    let rows=res.map(r=>hsRow(r,p&&p.urlTemplate)); const all=rows.length; if(HS.opts.phone) rows=rows.filter(r=>r[6]||r[7]);
    HS.total=(p&&+p.total)||all; HS.offset=(p&&p.offset!=null)?p.offset:null; HS.rows=(more&&HS.rows?HS.rows:[HS_HEAD]).concat(rows);
    const got=HS.rows.length-1; const moreLeft=HS.offset!=null&&HS.offset<HS.total;
    out.innerHTML=`${HS.total.toLocaleString('en')} contact${HS.total===1?'':'s'} match in HubSpot. ${got} ready to import${HS.opts.phone?' (with a phone number)':''}.${moreLeft?` <button class="sm" data-imp="hsmore">Load next 200</button>`:''}`;
    if(got) showMapping(HS.rows,'HubSpot '+fmtWhen(new Date().toISOString()),{kind:'hubspot'}); else { const m=$('#impMap'); if(m) m.innerHTML=''; IMP=null; }
  }catch(e){ const c=e&&e.code; out.innerHTML=esc(hsErrText(e))+(['not_in_manifest','approval_required'].includes(c)&&PERMS?' <button class="sm" data-imp="perms">Open permissions</button>':'');
    if(['not_granted','capability_disabled','capability_removed'].includes(c)){ MCP=null; setTimeout(renderImportCards,2500); } }
  finally{ HS.busy=false; const b2=document.querySelector('[data-imp="hs"]'); if(b2) b2.disabled=false; } }
async function hsTest(btnEl){ const out=$('#hsTestOut'); if(!MCP||!out) return; btnEl.disabled=true; out.textContent='Checking…';
  try{ const me=await hsWhoAmI(); out.textContent=`Connected${me.first?' as '+me.first:''}. Record links will use HubSpot account ${me.portal||'(unknown)'}.`; const inp=document.querySelector('[data-s="settings.stack.crmPortal"]'); if(inp&&!inp.value) inp.value=S.settings.stack.crmPortal; }
  catch(e){ out.textContent=hsErrText(e); } finally{ btnEl.disabled=false; } }
function openPerms(){ if(!PERMS) return; PERMS.manage().then(()=>toast('Permissions updated – try again')).catch(()=>toast('Open the page’s Permissions menu to allow HubSpot')); }
function decodeBuf(buf){ const b=new Uint8Array(buf); if(b[0]===0xFF&&b[1]===0xFE) return new TextDecoder('utf-16le').decode(b); if(b[0]===0xFE&&b[1]===0xFF) return new TextDecoder('utf-16be').decode(b);
  try{ return new TextDecoder('utf-8',{fatal:true}).decode(b); }catch(e){ const cp=/^(hu|pl|cs|sk|sl|hr|ro|sr|bs)/i.test(navigator.language||'')?'windows-1250':'windows-1252'; try{ return new TextDecoder(cp).decode(b); }catch(_){ return new TextDecoder('utf-8').decode(b); } } }
function readImportFile(f){ const r=new FileReader(); r.onload=()=>{ const text=decodeBuf(r.result); const rows=parseCsv(text); if(rows.length<2){ toast('That file has no rows to import'); return; } showMapping(rows,f.name.replace(/\.(csv|tsv|txt)$/i,''),{kind:'file',raw:text,file:f.name}); }; r.onerror=()=>toast('Could not read that file'); r.readAsArrayBuffer(f); }
function showMapping(rows,source,info){ IMP=Object.assign({rows,map:autoMap(rows[0]),source},info||{}); renderMapping(); }
function renderMapping(){ const host=$('#impMap'); if(!host||!IMP) return; const H=IMP.rows[0]; const p=planImport(IMP.rows,IMP.map);
  const prev=IMP.rows.slice(1,4).map(r=>rowToLead(r,IMP.map));
  const m=IMP.map, ok=k=>m[k]!=null&&m[k]>=0; const sure=AB.imp==='B'&&(ok('first')||ok('name'))&&ok('company')&&(ok('phone')||ok('mobile')||ok('email')); const nMatched=FIELDS.filter(([k])=>ok(k)).length;
  const goBar=`<div class="extra" style="margin-top:10px;align-items:center"><label>Put new leads in<select id="impList"><option value="__new" selected>New list: ${esc(IMP.source.slice(0,40))}</option>${S.lists.map(x=>`<option value="${esc(x.k)}">${esc(x.label)}</option>`).join('')}</select></label>${p.upd?`<label style="flex-direction:row;align-items:center;gap:6px;color:var(--ink);font-size:13px"><input type="checkbox" id="impMove"> Also move the ${p.upd} lead${p.upd===1?'':'s'} already on your desk into this list</label>`:''}</div>
   <div class="actions" style="margin-top:10px;align-items:center"><button class="primary" data-imp="go" ${p.add+p.upd?'':'disabled'}>Import ${p.add} new${p.upd?' and update '+p.upd:''}</button><span class="small muted">${p.upd?p.upd+' already on your desk get empty fields filled. ':''}${p.skip?p.skip+' rows skipped (empty or duplicate).':''}</span></div>`;
  const grid=`<div class="ef" style="grid-template-columns:repeat(3,minmax(0,1fr))">${FIELDS.map(([k,lb])=>`<label>${lb}<select data-map="${k}"><option value="-1">— not in file —</option>${H.map((h,i)=>`<option value="${i}" ${IMP.map[k]===i?'selected':''}>${esc(h||'(column '+(i+1)+')')}</option>`).join('')}</select></label>`).join('')}</div>`;
  host.innerHTML=(sure?`<h3 style="margin:16px 0 4px">Ready to import</h3><p class="small muted" style="margin:0">${IMP.rows.length-1} rows in “${esc(IMP.source)}”. We matched ${nMatched} columns, including name, company and ${ok('phone')||ok('mobile')?'phone':'e-mail'}.</p>${goBar}<details class="fold"><summary class="small">Check or change the columns</summary><div style="margin-top:8px">${grid}</div></details><h4 style="margin-top:12px">Preview</h4>`:
  `<h3 style="margin:16px 0 4px">Check the columns</h3><p class="small muted" style="margin:0 0 8px">${IMP.rows.length-1} rows found in “${esc(IMP.source)}”. ${AB.imp==='B'?'Some key columns weren’t recognised – pick them below. ':''}Fix any field that was matched wrongly.</p>${grid}
   <h4 style="margin-top:14px">Preview</h4>`)+`<div style="overflow-x:auto"><table class="t"><thead><tr><th>Name</th><th style="text-align:left">Title</th><th style="text-align:left">Company</th><th style="text-align:left">Phone</th><th style="text-align:left">E-mail</th><th style="text-align:left">Country</th></tr></thead><tbody>${prev.map(v=>`<tr><td>${esc([v.first,v.last].filter(Boolean).join(' ')||'—')}</td><td style="text-align:left">${esc(v.title||'')}</td><td style="text-align:left">${esc(v.company||'')}</td><td style="text-align:left">${esc(v.mobile||v.phone||'')}</td><td style="text-align:left">${esc(v.email||'')}</td><td style="text-align:left">${esc(v.country||'')}</td></tr>`).join('')}</tbody></table></div>`+(sure?'':goBar);
  host.onchange=e=>{ const s=e.target.closest('[data-map]'); if(!s) return; const i=+s.value; for(const k in IMP.map){ if(IMP.map[k]===i&&k!==s.dataset.map&&i>=0) IMP.map[k]=-1; } IMP.map[s.dataset.map]=i; renderMapping(); };
  host.scrollIntoView({behavior:'smooth',block:'start'}); }
function runImport(){ if(!IMP) return; const sel=$('#impList').value; const move=!!($('#impMove')&&$('#impMove').checked); let moved=0; const listK=sel==='__new'?addList(IMP.source||'Import'):sel; const ix=matchIndex(); let add=0,upd=0; const seen=new Set(); const now=new Date().toISOString();
  IMP.rows.slice(1).forEach(r=>{ const v=rowToLead(r,IMP.map); if(!(v.first||v.last||v.company||v.email)) return; const k=v.email||liSlug(v.li)||([v.first,v.last].join(' ')+'|'+(v.company||'')).toLowerCase(); if(seen.has(k)) return; seen.add(k);
    const ex=findExisting(v,ix); if(ex){ for(const f in v){ if(!ex[f]) ex[f]=v[f]; } if(move&&ex.list!==listK){ ex.list=listK; moved++; } upd++; }
    else { const l=Object.assign({id:'i'+uid(),list:listK,created:now,st:'open'},v); S.leads.push(l); if(l.email) ix.em.set(l.email,l); add++; } });
  if(!add&&!moved&&sel==='__new') S.lists=S.lists.filter(x=>x.k!==listK);
  tidyLists();
  const imp=IMP; recordImport({name:imp.source,kind:imp.kind||'file',file:imp.file||'',rows:imp.rows.length-1,add,upd,moved,list:listLabel(listK)},imp.raw||(imp.kind==='hubspot'?csvOf(imp.rows):''));
  save(); closeModal(); if(add||moved){ S.ui.list=listK; S.ui.grp='active'; } recomputeOrder(); if(!$('#wizard').classList.contains('hidden')) renderWizard(); else go('leads'); renderAll();
  toast(`Imported ${add} new lead${add===1?'':'s'}${upd?', updated '+upd:''}${moved?', moved '+moved+' into this list':''}`); IMP=null; HS.rows=null; }

/* ====== exports & backup ====== */
function exportSequence(leads){ const ls=leads.filter(l=>l.email); if(!ls.length){ toast('None of these leads has an e-mail address'); return; }
  saveFile('sequence-'+todayKey()+'.csv',csvOf([['email','first_name','last_name','company_name','title','phone','linkedin_url','website','country']].concat(ls.map(l=>[l.email,l.first||'',l.last||'',l.company||'',l.title||'',bestPhone(l),l.li||'',l.domain||'',l.country||''])))); }
function exportAll(){ const cnt={}; S.dials.forEach(d=>{ if(d.id){ cnt[d.id]=cnt[d.id]||{n:0,last:null}; cnt[d.id].n++; cnt[d.id].last=d; } });
  saveFile('call-desk-leads-'+todayKey()+'.csv',csvOf([['First name','Last name','Job title','Company','Website','E-mail','Phone','Mobile','LinkedIn URL','City','State','Country','List','Status','Next step','Last status change','Dials','Last dial outcome','Notes','Notes from import','CRM record ID','Priority']].concat(S.leads.map(l=>{ const c=cnt[l.id]||{n:0,last:null}; return [l.first||'',l.last||'',l.title||'',l.company||'',l.domain||'',l.email||'',l.phone||'',l.mobile||'',l.li||'',l.city||'',l.state||'',l.country||'',listLabel(l.list),STL[stOf(l)].label,l.next?l.next.replace('T',' '):'',l.st_at?l.st_at.slice(0,16).replace('T',' '):'',c.n,c.last?(OUTL[c.last.o]||{}).label:'',l.note||'',l.notes||'',l.crm_id||'',isPri(l)?'yes':'']; })))); }
function exportActivity(){ if(!S.dials.length){ toast('No calls logged yet'); return; }
  saveFile('call-log-'+todayKey()+'.csv',csvOf([['Date','Time','Outcome','Conversation','First name','Last name','Company','E-mail','Phone','CRM record ID','Next step','HubSpot']].concat(S.dials.map(d=>{ const l=d.id?byId(d.id):null; const t=new Date(d.at); return [dkey(t),pad(t.getHours())+':'+pad(t.getMinutes()),(OUTL[d.o]||{}).label||d.o,CONN.has(d.o)?'yes':'no',l?l.first||'':'',l?l.last||'':'',l?l.company||'':'',l?l.email||'':'',l?bestPhone(l):'',l?l.crm_id||'':'',l&&l.next?l.next.replace('T',' '):'',d.hs?({ok:'logged',q:'waiting',send:'sending',unk:'unconfirmed',err:'error',skip:'not linked'}[d.hs.s]||''):'']; })))); }
function markBackup(){ S.lastBackup=new Date().toISOString(); save(); renderFootBackup(); renderBanner(); }
function backup(){ saveFile('call-desk-backup-'+todayKey()+'.json',JSON.stringify({app:'sdr-command-center-lite',version:VERSION,exported:new Date().toISOString(),state:S}),{onCopied:markBackup}).then(r=>{ if(r==='saved') markBackup(); }); }
function daysSince(iso){ return iso?Math.floor((Date.now()-Date.parse(iso))/864e5):null; }
function renderFootBackup(){ const el=$('#lastBackup'); if(!el) return; const d=daysSince(S.lastBackup); el.textContent=S.lastBackup?(d===0?'last backup today':d===1?'last backup yesterday':'last backup '+d+' days ago'):'no backup yet'; el.style.color=(d===null||d>7)&&S.leads.filter(l=>!l.sample).length>=20?'var(--brick)':''; }
function restore(){ const box=openModal(`<div class="mh"><h3 style="margin:0">Restore a backup</h3><button class="sm quiet" data-close>Close</button></div><p class="small muted" style="margin-top:0">This replaces everything on this desk with the backup: leads, call log, playbook and settings.</p>
  <div class="actions"><button data-rs="file">Choose backup file</button></div><textarea id="rsPaste" rows="5" placeholder="…or paste the backup text here" style="margin-top:8px"></textarea><div class="actions"><button class="danger" data-rs="go">Replace my desk with this backup</button></div>`,{label:'Restore'});
  box.querySelector('[data-close]').onclick=closeModal;
  box.addEventListener('click',e=>{ const b=e.target.closest('[data-rs]'); if(!b) return; if(b.dataset.rs==='file'){ $('#jsonIn').value=''; $('#jsonIn').click(); } if(b.dataset.rs==='go') armDanger(b,()=>applyRestore($('#rsPaste').value)); }); }
function applyRestore(text){ let o; try{ o=JSON.parse(text); }catch(e){ toast('That is not a backup file from this desk'); return; } const st=o&&o.state?o.state:o; if(!st||!Array.isArray(st.leads)||!st.settings){ toast('That is not a backup file from this desk'); return; }
  S=migrate(st); SEL.clear(); EXP.clear(); saveNow(); closeModal(); recomputeOrder(); renderAll(); toast(`Backup restored: ${S.leads.length} leads`); }
function askText(title,def,cb){ const box=openModal(`<div class="mh"><h3 style="margin:0">${esc(title)}</h3></div><input type="text" id="askIn" value="${esc(def||'')}" style="width:100%" autofocus><div class="actions"><button class="primary" data-ask="ok">OK</button><button data-ask="no">Cancel</button></div>`,{label:title});
  const done=ok=>{ const v=$('#askIn').value.trim(); closeModal(); if(ok&&v) cb(v); else cb(null); };
  box.querySelector('[data-ask="ok"]').onclick=()=>done(true); box.querySelector('[data-ask="no"]').onclick=()=>done(false); box.querySelector('#askIn').onkeydown=e=>{ if(e.key==='Enter') done(true); }; }

/* ====== samples ====== */
function loadSamples(){ if(S.leads.some(l=>l.sample)){ toast('Sample leads are already loaded'); return; } const k=addList('Sample leads'); S.lists.find(x=>x.k===k).auto=true; const now=new Date().toISOString();
  const L=[['Maya','Okafor','Head of Operations','Northwind Logistics','northwind.example','+44 20 7946 0123','','United Kingdom','London'],
   ['Daniel','Brooks','VP Customer Success','Brightline Foods','brightline.example','+1 202 555 0143','+1 202 555 0178','United States','Chicago','IL'],
   ['Sofia','Lindqvist','COO','Halden Manufacturing','halden.example','+44 161 496 0456','','Sweden','Gothenburg'],
   ['Ravi','Menon','Operations Manager','Copperleaf Health','copperleaf.example','+1 415 555 0102','','United States','San Francisco','CA'],
   ['Lena','Hoffmann','Head of Service','Orbit Freight','orbitfreight.example','','','Germany','Hamburg'],
   ['Tom','Akers','Facilities Director','Kestrel Energy','kestrel.example','+44 113 496 0789','','United Kingdom','Leeds']];
  L.forEach(([first,last,title,company,domain,phone,mobile,country,city,state])=>S.leads.push({id:'s'+uid(),list:k,created:now,st:'open',sample:true,first,last,title,company,domain,phone,mobile,country,city,state:state||'',email:(first+'.'+last).toLowerCase()+'@'+domain}));
  tidyLists(); save(); recomputeOrder(); renderAll(); toast('Six fictional sample leads added'); }

/* ====== report ====== */
function renderReport(){ const el=$('#v-report'); const now=new Date(); const tk=todayKey();
  if(!S.dials.length&&!S.leads.length){ el.innerHTML=`<div class="card empty"><h2>No numbers yet</h2><p>Log your first calls and this page shows dials, conversations and meetings per day and week, plus which hours connect best.</p></div>`; return; }
  const days=[]; for(let i=13;i>=0;i--){ const d=new Date(now); d.setDate(d.getDate()-i); days.push(dkey(d)); }
  const by={}; S.dials.forEach(d=>{ const k=dkey(d.at); (by[k]=by[k]||[]).push(d); });
  const max=Math.max(+S.settings.dialTarget||1,...days.map(k=>(by[k]||[]).length));
  const seg=(arr,ks)=>arr.filter(d=>ks.includes(d.o)).length;
  const bars=days.map(k=>{ const a=by[k]||[]; const parts=[['var(--slate)',seg(a,['na','x'])],['var(--slate2)',seg(a,['gk'])],['var(--brick)',seg(a,['bad'])],['var(--go)',seg(a,['cb','lost'])],['var(--gold)',seg(a,['meet'])]];
    return `<div class="b" title="${esc(fmtDay(k))}: ${a.length} dials, ${a.filter(d=>CONN.has(d.o)).length} conversations"><div class="vv">${a.length||''}</div><div class="stk" style="height:${Math.round(a.length/max*140)}px">${parts.map(([c,n])=>n?`<i style="background:${c};height:${n/Math.max(1,a.length)*100}%"></i>`:'').join('')}</div><div class="lb" style="${k===tk?'color:var(--ink);font-weight:700':''}">${esc(fmtDay(k))}</div></div>`; }).join('');
  const ws=weekStart(now), ms=new Date(now.getFullYear(),now.getMonth(),1);
  const per=(from)=>{ const a=S.dials.filter(d=>!from||new Date(d.at)>=from); const conv=a.filter(d=>CONN.has(d.o)).length; const mt=S.leads.filter(l=>l.meet_at&&(!from||new Date(l.meet_at)>=from)).length; return {d:a.length,c:conv,m:mt}; };
  const rows=[['Today',per(atHour(now,0))],['This week',per(ws)],['This month',per(ms)],['All time',per(null)]];
  const pct=(a,b)=>b?Math.round(a/b*100)+'%':'–';
  const stc={}; S.leads.forEach(l=>{ const s=stOf(l); stc[s]=(stc[s]||0)+1; }); const tot=S.leads.length||1;
  const stCol={open:'var(--tick)',na:'var(--slate)',gk:'var(--slate2)',cb:'var(--sky)',meet:'var(--gold)',later:'var(--violet)',lost:'var(--brick)',bad:'var(--brick)',nr:'var(--brick)'};
  const hrs={}; S.dials.filter(d=>d.o!=='x').forEach(d=>{ const h=new Date(d.at).getHours(); hrs[h]=hrs[h]||{n:0,c:0}; hrs[h].n++; if(CONN.has(d.o)) hrs[h].c++; });
  const hk=Object.keys(hrs).map(Number).sort((a,b)=>a-b);
  el.innerHTML=`<div class="dayhead"><div><h2>Report</h2><div class="muted small">From the calls you logged on this desk.</div></div><div class="actions" style="margin:0"><button class="sm" data-rep="activity">Export call log</button><button class="sm" data-rep="all">Export all leads</button></div></div>
   <div class="rgrid"><div class="card"><h3>Dials, last 14 days</h3><div class="bars"><div class="goal" style="bottom:${Math.round((+S.settings.dialTarget||0)/max*140)+31}px"><span>goal ${+S.settings.dialTarget||0}</span></div>${bars}</div><div class="legend"><span><i style="background:var(--slate)"></i>No answer</span><span><i style="background:var(--slate2)"></i>Gatekeeper</span><span><i style="background:var(--go)"></i>Conversation</span><span><i style="background:var(--gold)"></i>Meeting</span><span><i style="background:var(--brick)"></i>Wrong number</span></div></div>
     <div class="card"><h3>Totals</h3><table class="t"><thead><tr><th></th><th>Dials</th><th>Conversations</th><th>Connect rate</th><th>Meetings</th></tr></thead><tbody>${rows.map(([lb,r])=>`<tr><td>${lb}</td><td>${r.d}</td><td>${r.c}</td><td>${pct(r.c,r.d)}</td><td>${r.m}</td></tr>`).join('')}</tbody></table>
       <p class="small muted" style="margin:10px 0 0">${(()=>{ const a=per(null); return a.m?`Roughly ${Math.round(a.d/a.m)} dials per meeting so far.`:'Dials per meeting appears after your first meeting.'; })()}</p></div>
     <div class="card"><h3>Pipeline by status</h3><div class="funnel">${ST.map(s=>`<div><span>${esc(s.label)}</span><span class="fb"><i style="width:${(stc[s.k]||0)/tot*100}%;background:${stCol[s.k]}"></i></span><b style="text-align:right">${stc[s.k]||0}</b></div>`).join('')}</div></div>
     <div class="card"><h3>When you connect</h3>${hk.length?`<p class="small muted" style="margin:0 0 6px">Connect rate by the hour you dialled (your time). Trust it after a few hundred dials.</p><div class="funnel">${hk.map(h=>`<div><span>${pad(h)}:00–${pad(h+1)}:00 <span class="muted">(${hrs[h].n})</span></span><span class="fb"><i style="width:${hrs[h].c/hrs[h].n*100}%;background:var(--go)"></i></span><b style="text-align:right">${pct(hrs[h].c,hrs[h].n)}</b></div>`).join('')}</div>`:'<p class="muted small" style="margin:0">Appears once you log calls.</p>'}</div></div>`;
  el.onclick=e=>{ const b=e.target.closest('[data-rep]'); if(!b) return; if(b.dataset.rep==='activity') exportActivity(); else exportAll(); }; }

/* ====== prepared setup (seed) – filled in by the skill before publishing ====== */
function readSeed(){ try{ const el=document.getElementById('sdr-seed'); const o=JSON.parse((el&&el.textContent)||'{}'); return o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length?o:null; }catch(e){ return null; } }
const seedIdOf=sd=>String(sd.seedId||'seed').slice(0,80);
function applySeed(sd,opt){ opt=opt||{}; if(hasConfig()) snapshot('Before applying a prepared setup',true); const str=(v,n)=>String(v==null?'':v).trim().slice(0,n||400); const st=S.settings;
  const s=sd.settings||{}; ['name','company','role'].forEach(k=>{ if(s[k]) st[k]=str(s[k],120); }); if(s.website) st.website=str(s.website,200);
  [['dialTarget',1,500],['meetTarget',0,200],['callFrom',0,23],['callTo',1,24]].forEach(([k,a,b])=>{ if(s[k]!=null&&s[k]!==''&&isFinite(+s[k])) st[k]=Math.max(a,Math.min(b,+s[k])); }); if(+st.callTo<=+st.callFrom) st.callTo=Math.min(24,+st.callFrom+8);
  const sk=sd.stack||{}; ['crm','dialer','mail','seq','data'].forEach(c=>{ if(sk[c]&&STACK[c].opts.some(o=>o[0]===sk[c])) st.stack[c]=sk[c]; });
  ['crmPortal','crmDomain'].forEach(k=>{ if(sk[k]) st.stack[k]=str(sk[k],120); }); if(sk.crmHost==='app-eu1') st.stack.crmHost='app-eu1'; if(safeUrl(sk.booking)) st.stack.booking=safeUrl(sk.booking); if(typeof sk.li==='boolean') st.stack.li=sk.li;
  if(['tel','web','copy'].includes(sk.callMode)) st.stack.callMode=sk.callMode;
  const ic=sd.icp||{}; ['sell','titles','industries','problem','proof','alt','competitors','ask'].forEach(k=>{ if(ic[k]) st.icp[k]=str(ic[k],400); });
  const sc=sd.script||{}; const scr={}; ['reason','problem','value','ask'].forEach(k=>{ if(sc[k]) scr[k]=str(sc[k],600); }); ['qualify','never'].forEach(k=>{ if(Array.isArray(sc[k])) scr[k]=sc[k].slice(0,10).map(x=>str(x,200)).filter(Boolean); }); if(Object.keys(scr).length) S.script=scr;
  if(sd.playbook){ const secs=normalizeAi(sd.playbook); if(secs.length) S.playbook={src:'prepared',note:str(sd.note,160),at:new Date().toISOString(),sections:secs.map(x=>({k:str(x.k,40),title:str(x.title,90),body:str(x.body,5000)}))}; }
  const so=sd.sources; if(so&&typeof so==='object'){ const arr=(a,n)=>Array.isArray(a)?a.slice(0,12).map(x=>typeof x==='string'?str(x,n):(x&&typeof x==='object'?{name:str(x.name,80),url:safeUrl(x.url)?str(x.url,200):''}:'')).filter(x=>x&&(typeof x==='string'||x.name)):[];
    S.sources={at:str(so.at||new Date().toISOString(),40),chats:arr(so.chats,120),website:arr(so.website,200),competitors:arr(so.competitors,120),files:arr(so.files,120),note:str(so.note||sd.note,200)}; }
  S.seedId=seedIdOf(sd); S.seedSkip=null; snapshot('Prepared setup applied'+(sd.note?' – '+str(sd.note,80):'')); saveNow(); }
function checkSeed(){ if(DEMO) return; const sd=readSeed(); if(sd) considerSeed(sd); }
let SEED_BANNER=null;
function considerSeed(sd,live){ if(DEMO) return; const id=seedIdOf(sd); if(S.seedId===id||S.seedSkip===id||SEED_BANNER===id) return;
  const fresh=!S.leads.length&&!S.setup.done&&(!S.playbook||S.playbook.src==='prepared'); if(fresh){ applySeed(sd); recomputeOrder(); renderAll(); return; }
  if(live&&SETUP.prog&&SETUP.prog.runId&&S.setupSeen!==String(SETUP.prog.runId)){ SETUP.pending=sd; return; }
  showSeedBanner(sd); }
function showSeedBanner(sd){ const id=seedIdOf(sd); if(S.seedId===id||S.seedSkip===id||SEED_BANNER===id) return;
  SEED_BANNER=id;
  const b=$('#banner'); const el=document.createElement('div'); el.className='banner'; el.style.marginTop='12px';
  el.innerHTML=`<span><b>An updated company setup and playbook is available</b>${sd.note?' ('+esc(String(sd.note).slice(0,120))+')':''}. Apply it? Your leads and call history stay as they are.</span><button class="sm primary" data-seed="apply">Apply</button><button class="sm quiet" data-seed="skip">Not now</button>`;
  b.after(el); el.onclick=e=>{ SEED_BANNER=null; const a=e.target.closest('[data-seed]'); if(!a) return; if(a.dataset.seed==='apply'){ applySeed(sd); toast('Company setup and playbook updated'); renderAll(); } else { S.seedSkip=id; save(); } el.remove(); }; }

/* ====== render all & boot ====== */
function renderBanner(){ const b=$('#banner');
  if(RECOVERY){ b.innerHTML=`<span><b>Your saved desk couldn’t be read.</b> ${RECOVERY.day?'We restored the automatic copy from '+esc(RECOVERY.day)+'.':'No earlier copy was found, so the desk starts empty – restore your last backup if you have one.'} The unreadable data is kept aside in Setup → Safety.</span><button class="sm" data-rb="restore">Restore a backup</button><button class="sm quiet" data-rb="ok">OK</button>`;
    b.onclick=e=>{ const x=e.target.closest('[data-rb]'); if(!x) return; if(x.dataset.rb==='restore') restore(); RECOVERY=Object.assign({},RECOVERY,{seen:true}); b.innerHTML=''; RECOVERY=null; renderBanner(); }; return; }
  const d=daysSince(S.lastBackup); const real=S.leads.filter(l=>!l.sample).length, realDials=S.dials.filter(x=>{ const l=x.id&&byId(x.id); return !l||!l.sample; }).length; const age=daysSince(S.created)||0;
  const nag=!DEMO&&STORAGE_OK&&(real>=20||realDials>=10)&&(S.lastBackup?d>7:age>=2)&&S.backupNag!==todayKey();
  if(nag){ b.innerHTML=`<span>${S.lastBackup?'Your last backup was '+d+' days ago.':'You haven’t backed up this desk yet.'} Everything lives in this browser – clearing browser data would delete it.</span><button class="sm primary" data-rb="backup">Back up now</button><button class="sm quiet" data-rb="later">Later</button>`;
    b.onclick=e=>{ const x=e.target.closest('[data-rb]'); if(!x) return; if(x.dataset.rb==='backup') backup(); else { S.backupNag=todayKey(); save(); renderBanner(); } }; return; }
  b.innerHTML=STORAGE_OK?'':(STORAGE_FULL?`<span>Browser storage for this page is full, so your latest changes aren’t saved. Click <b>Back up now</b>, then delete lists you no longer need (More → Manage lists).</span>`:`<span>This browser is blocking storage for this page, so your work disappears when you close it. Use <b>Back up now</b> before you leave, or open the page in a normal (not private) window.</span>`); }
function renderAll(){ renderHeader(); renderStrip(); renderNav(); renderBanner(); const v=S.ui.view; if(v==='today') renderToday(); if(v==='leads'){ renderChips(); renderLeads(); } if(v==='playbook') renderPlaybook(); if(v==='report') renderReport(); }
function applyTheme(){ let t=null; try{ t=localStorage.getItem(THEMEK); }catch(e){} const r=document.documentElement; if(t==='light'||t==='dark'){ r.setAttribute('data-theme',t); $('#meta-cs').setAttribute('content','only '+t); } else { r.removeAttribute('data-theme'); $('#meta-cs').setAttribute('content','light dark'); }
  $('#themeBtn').title='Colour theme: '+(t||'follows your system')+' (click to change)'; }
function cycleTheme(){ let t=null; try{ t=localStorage.getItem(THEMEK); }catch(e){} const n=t===null?'light':t==='light'?'dark':null; try{ if(n) localStorage.setItem(THEMEK,n); else localStorage.removeItem(THEMEK); }catch(e){} applyTheme(); toast('Theme: '+(n||'follows your system')); }
async function boot(){
  applyTheme(); await loadAll(); checkSeed(); wireLeads(); wireToday();
  $('#nav').addEventListener('click',e=>{ const b=e.target.closest('[data-view]'); if(b){ if(b.dataset.view==='leads'&&S.ui.view!=='leads') recomputeOrder(); go(b.dataset.view); } });
  $('#setupBtn').onclick=()=>{ if(S.setup.done) openHub(); else openWizard(S.setup.step||0); };
  $('#hsChip').onclick=openHsPanel; S.dials.forEach(d=>{ if(d.hs&&d.hs.s==='send') d.hs={s:'unk',msg:'the page closed while sending'}; }); S.leads.forEach(l=>{ if(l.hsTask&&l.hsTask.s==='send') l.hsTask.s='unk'; });
  renderDemoBar(); $('#demoBtn').onclick=()=>setDemo(!DEMO);
  $('#verBtn').textContent='v'+VERSION; $('#verBtn').onclick=openVersions; if(S.appVersion!==VERSION&&(S.leads.length||S.setup.done)) $('#verBtn').classList.add('new'); else if(!S.appVersion){ S.appVersion=VERSION; }
  if(!S.history.length&&hasConfig()) snapshot('Version tracking started',false,true); /* saved with the next real change – no write on page load */
  $('#themeBtn').onclick=cycleTheme; $('#backupBtn').onclick=backup;
  $('#fileIn').addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; if(f) readImportFile(f); });
  $('#jsonIn').addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ const ta=$('#rsPaste'); if(ta){ ta.value=r.result; toast('Backup loaded – click “Replace my desk” twice to restore'); } }; r.readAsText(f); });
  document.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; if(POP_ID){ closePop(); return; } if(!$('#modal').classList.contains('hidden')){ closeModal(); return; } if(!$('#moreMenu').classList.contains('hidden')){ $('#moreMenu').classList.add('hidden'); return; } if(!$('#focus').classList.contains('hidden')) return; if(!$('#wizard').classList.contains('hidden')) closeWizard(); });
  recomputeOrder(); go(S.ui.view||'today'); renderHeader(); renderStrip(); renderBanner(); renderFootBackup(); initRuntime();
  if(!DEMO&&!S.setup.done&&!S.setup.dismissed) openWizard(S.setup.step||0);
  let lastDay=todayKey();
  setInterval(()=>{ const busy=/input|textarea|select/i.test((document.activeElement||{}).tagName||'')||POP_ID||!$('#modal').classList.contains('hidden')||!$('#focus').classList.contains('hidden');
    if(todayKey()!==lastDay){ lastDay=todayKey(); renderStrip(); }
    if(busy||document.hidden||EDIT.size||!$('#addBox').classList.contains('hidden')||!$('#wizard').classList.contains('hidden')) return; if(S.ui.view==='today'&&$('#wizard').classList.contains('hidden')) renderToday(); if(S.ui.view==='leads'){ renderChips(); renderLeads(); } },60000);
  document.documentElement.setAttribute('data-ready','1'); }
boot();
