
/* ====== call-script generator: one click per lead ====== */
const SENIOR=/\b(chief|ceo|coo|cfo|cto|cio|cmo|cro|vp|vice president|head|director|founder|co-founder|owner|president|partner|managing|general manager)\b/i;
const NEVER_DEFAULT=['“I hope you’re well” / “How are you?”','“Is this a bad time?”','“I wanted to reach out”','Prices on a first call','Criticising a competitor','Promises you can’t prove'];
const QUALIFY_DEFAULT=['Who else is involved in the decision?','How do they handle it today, and what does that cost them?','What would have to be true to change it this year?','Timing: is there a trigger or a deadline?'];
function scriptBase(){ const v=icpVals(); const sc=S.script||{};
  return { reason:sc.reason||`Most ${v.roleP} we speak to tell us that ${v.problem}.`,
    problem:sc.problem||`How do you handle ${v.problemShort} today?`,
    value:sc.value||(v.sell+'.'+(v.proof?` For example, ${v.proof}.`:'')),
    ask:sc.ask||`Worth ${v.ask} to see if it’s relevant? I can do {slot1} or {slot2}.`,
    qualify:(sc.qualify&&sc.qualify.length)?sc.qualify:QUALIFY_DEFAULT,
    never:(sc.never&&sc.never.length)?sc.never:NEVER_DEFAULT }; }
function quotedLines(text){ return String(text||'').split('\n').map(s=>s.trim()).filter(s=>/^["“]/.test(s)).map(s=>s.replace(/^["“]\s*/,'').replace(/\s*["”]\s*$/,'')); }
function parseObjections(text){ const out=[]; let cur=null;
  String(text||'').split('\n').map(s=>s.trim()).filter(Boolean).forEach(ln=>{ if(/^(→|->)/.test(ln)){ if(cur) cur.a=(cur.a?cur.a+' ':'')+ln.replace(/^(→|->)\s*/,''); }
    else if(!cur||cur.a||/^["“]/.test(ln)){ cur={q:ln,a:''}; out.push(cur); } else cur.q+=' '+ln; });
  return out.filter(o=>o.a); }
function parseCompetitors(text){ const out=[]; let cur=null;
  String(text||'').split('\n').map(s=>s.trim()).filter(Boolean).forEach(ln=>{ if(/^[-•*]\s+/.test(ln)){ if(cur) cur.lines.push(ln.replace(/^[-•*]\s+/,'')); }
    else if(/^(→|->)/.test(ln)){ if(cur) cur.reply=ln.replace(/^(→|->)\s*/,''); }
    else { cur={name:ln.replace(/\s*\([^)]*\)\s*$/,'').replace(/[:–-]\s*$/,'').trim(),lines:[],reply:''}; out.push(cur); } });
  return out.filter(c=>c.name&&c.name.length<60); }
function tzOffsetMin(tz,date){ const p=new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).formatToParts(date); const g=t=>+((p.find(x=>x.type===t)||{}).value);
  return (Date.UTC(g('year'),g('month')-1,g('day'),g('hour')%24,g('minute'),g('second'))-date.getTime())/60000; }
function slotsFor(l){ let tz=tzOf(l); try{ if(!tz) tz=Intl.DateTimeFormat().resolvedOptions().timeZone; }catch(e){ tz='UTC'; }
  const out=[]; let probe=Date.now(); let tries=0;
  try{ while(out.length<2&&tries<14){ probe+=864e5; tries++; const parts=new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'numeric',day:'numeric',weekday:'short'}).formatToParts(new Date(probe)); const g=t=>(parts.find(x=>x.type===t)||{}).value;
      if(g('weekday')==='Sat'||g('weekday')==='Sun') continue; const h=out.length?14:10;
      const guess=Date.UTC(+g('year'),+g('month')-1,+g('day'),h,0,0); const at=new Date(guess-tzOffsetMin(tz,new Date(guess))*60000);
      out.push({their:new Intl.DateTimeFormat('en-GB',{timeZone:tz,weekday:'long',day:'numeric',month:'short'}).format(at)+' at '+h+':00', mine:pad(at.getHours())+':'+pad(at.getMinutes()), same:pad(at.getHours())===pad(h)}); } }catch(e){}
  return out; }
function scriptData(l){ const b=scriptBase(); const ops=quotedLines(pbSec('opener')&&pbSec('opener').body);
  const slots=slotsFor(l); const sl=i=>slots[i]?slots[i].their:'[day] at [time]';
  const comps=parseCompetitors(pbSec('competitors')&&pbSec('competitors').body); const hay=[l.note,l.notes].join(' ').toLowerCase();
  const hit=comps.find(c=>c.name&&c.name.length>2&&new RegExp('\\b'+c.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b').test(hay));
  let objs=parseObjections(pbSec('objections')&&pbSec('objections').body).map(o=>({q:fill(o.q,l),a:fill(o.a,l)}));
  if(hit&&hit.reply) objs.unshift({q:`“We already use ${hit.name}.”`,a:fill(hit.reply,l),comp:true});
  const ds=S.dials.filter(d=>d.id===l.id); const last=ds[ds.length-1]; const hist=[];
  hist.push(ds.length?`${ds.length} dial${ds.length===1?'':'s'} from this desk, last ${fmtWhen(last.at)} – ${((OUTL[last.o]||{}).label||'').toLowerCase()}`:'Never called from this desk');
  if(l.note) hist.push('Your notes: '+l.note.slice(0,180)); if(l.notes) hist.push(l.notes.slice(0,180));
  return {senior:SENIOR.test(l.title||''),prio:isPri(l),op:ops[0]?fill(ops[0],l):openerFor(l),alt:ops[1]?fill(ops[1],l):'',reason:fill(b.reason,l),problem:fill(b.problem,l),value:fill(b.value,l),
    ask:fill(b.ask,l).replace('{slot1}',sl(0)).replace('{slot2}',sl(1)),slots,qualify:b.qualify.map(x=>fill(x,l)),never:b.never,objs:objs.slice(0,hit?4:3),hit,hist}; }
function scriptHtml(l,opt){ opt=opt||{}; const d=scriptData(l); const li=localInfo(l); const q=s=>`<span class="say">“${esc(String(s).replace(/^["“]|["”]$/g,''))}”</span>`;
  const loc=[li?`${li.wd} ${li.txt} their time`:'',(phoneIso(bestPhone(l))||'')?phoneIso(bestPhone(l))+' number':''].filter(Boolean).join(' · ');
  const quick=`<h4>Quick look</h4><ul class="cs-list">
     <li><b>Who:</b> ${esc(nameOf(l))}${l.title?' – '+esc(l.title):''}${l.company?', '+esc(l.company):''}${loc?' · '+esc(loc):''}</li>
     <li><b>Why them:</b> ${d.senior?'Decision-maker level':'Likely user or influencer – ask who decides'}${d.prio?' · ★ matches your target titles':''}</li>
     <li><b>History:</b> ${d.hist.map(esc).join(' · ')}</li>
     ${d.hit?`<li class="hl"><b>Uses ${esc(d.hit.name)}:</b> ${d.hit.lines.map(esc).join(' · ')||'see Competitors in your playbook'}</li>`:''}
     <li><b>Goal:</b> ${esc(icpVals().ask)} – book it while you’re on the call</li></ul>`;
  const objs=d.objs.length?`<h4>Likely objections</h4>${d.objs.map(o=>`<div class="objp ${o.comp?'comp':''}"><b>${esc(o.q)}</b>→ ${esc(o.a)}</div>`).join('')}`:'';
  const never=`<h4>Never on a call</h4><div class="never">${d.never.map(n=>`<span>${esc(n)}</span>`).join('')}</div>`;
  const gaps=/\[[^\]\n]{3,40}\]/.test([d.op,d.reason,d.problem,d.value,d.ask].join(' '));
  const flow=`${gaps?`<div class="unlock" style="margin:0 0 8px;background:var(--gold-soft)">Words in [brackets] are still to fill in – <a href="#" data-gosetup="2">add your messaging in Setup</a> and they’re replaced everywhere.</div>`:''}<h4>Call flow – say it in your own words</h4><ol class="cs-flow">
     <li><b>Opener</b>${d.op?q(d.op):'<span class="muted"> – set up your playbook first</span>'}<span class="tiny muted">Wait for the yes.</span>${d.alt?`<div class="tiny">Alternative: “${esc(d.alt)}”</div>`:''}</li>
     <li><b>One reason</b>${q(d.reason)}</li>
     <li><b>Problem question</b>${q(d.problem)}<span class="tiny muted">Listen. Write down their words.</span></li>
     <li><b>Value line</b>${q(d.value)}</li>
     <li><b>Ask</b>${q(d.ask)}${d.slots.length&&!d.slots[0].same?`<span class="tiny muted">Their local time – for you that’s ${esc(d.slots[0].mine)} and ${esc(d.slots[1]?d.slots[1].mine:'')}.</span>`:''}</li>
     <li><b>Qualify after the yes</b><ul class="cs-list" style="margin-top:3px">${d.qualify.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></li></ol>
     ${AI?`<div class="cs-ai" data-aifor="${esc(l.id)}"><button class="sm" data-tailor="${esc(l.id)}">✨ Tailor the opener to ${esc(firstOf(l)||'this person')}</button></div>`:''}`;
  if(opt.compact) return `<div class="cs compact">${flow}${objs}<details class="fold"><summary>Quick look and never-say list</summary>${quick}${never}</details></div>`;
  return `<div class="cs"><div class="cs-head"><b>Call script · ${esc(nameOf(l))}</b><span class="actions" style="margin:0"><button class="sm" data-copyscript="${esc(l.id)}">Copy script</button><button class="sm quiet" data-script="${esc(l.id)}">Close</button></span></div>
    <div class="cs-grid"><div>${quick}${objs}${never}</div><div>${flow}</div></div></div>`; }
function scriptText(l){ const d=scriptData(l); const L=[];
  L.push(`CALL SCRIPT – ${nameOf(l)}${l.title?', '+l.title:''}${l.company?', '+l.company:''}`,'');
  L.push('Why them: '+(d.senior?'decision-maker level':'likely user or influencer – ask who decides'),'History: '+d.hist.join(' | '));
  if(d.hit) L.push(`Uses ${d.hit.name}: ${d.hit.lines.join(' | ')}`);
  L.push('','1. Opener: "'+d.op+'"'+(d.alt?'\n   Alternative: "'+d.alt+'"':''),'2. One reason: "'+d.reason+'"','3. Problem question: "'+d.problem+'"','4. Value line: "'+d.value+'"','5. Ask: "'+d.ask+'"','6. Qualify after the yes: '+d.qualify.join(' | '));
  if(d.objs.length){ L.push('','Likely objections:'); d.objs.forEach(o=>L.push('- '+o.q+' → '+o.a)); }
  L.push('','Never on a call: '+d.never.join(' | ')); return L.join('\n'); }
async function tailorOpener(l,host){ if(!AI||!host) return; host.innerHTML='<span class="tiny muted">✨ Writing an opener for this person…</span>';
  const v=icpVals(), st=S.settings, d=scriptData(l);
  const facts={first_name:firstOf(l),title:l.title||'',company:l.company||'',country:l.country||'',role_level:d.senior?'decision-maker':'user or influencer',history:d.hist,uses_competitor:d.hit?d.hit.name:null};
  const prompt=`You write ONE cold-call opener for a B2B sales development rep.
Caller: ${st.name||'the rep'} from ${st.company||'our company'}. We sell: ${v.sell}. The problem we solve: ${v.problem}. ${v.proof?'Proof you may mention: '+v.proof+'.':'Do not mention any customer or result.'} Prospects often use instead: ${v.alt}.
STRUCTURE (strict): "Hi [first name], it's [caller] from [company]." then ONE reason in plain words, then ONE short open question about how they handle the problem today. You may ask for "30 seconds, then you decide".
STYLE: spoken, at most 35 words, short words, no adjectives, no jargon. Same language as this brief.
RULES: use only the facts given; never invent news, numbers, customers or names; never criticise a competitor (ask questions instead). Never use: prices, "I hope you're well", "how are you", "is this a bad time", "I wanted to reach out", "quick question", "solution", "leverage", "streamline", "seamless", "cutting-edge", "innovative", "game-changer".
GOOD: "Hi Anna, it's Alex from Acme. Teams we speak to lose hours every week rescheduling technicians by phone. How does Northwind handle reschedules today?"
BAD: "Hi Anna, I hope you're doing well! I wanted to reach out because Acme offers a cutting-edge, seamless scheduling solution."
LEAD: ${JSON.stringify(facts)}
Reply in exactly this format, nothing else:
OPENER: <the opener>
WHY THIS ONE: <at most 10 words>`;
  try{ const res=await AI(prompt,{modelTier:'default'}); const t=String((res&&res.text)||'').trim(); let op=((t.match(/OPENER:\s*([\s\S]*?)(?:\n|$)/)||[])[1]||t).trim().replace(/^["“]|["”]$/g,''); const why=(t.match(/WHY THIS ONE:\s*(.*)/)||[])[1]||'';
    host.innerHTML=`<div class="script"><b>✨ Tailored:</b> “${esc(op)}”${why?` <span class="tiny muted">– ${esc(why)}</span>`:''}</div><div class="actions"><button class="sm" data-tailor="${esc(l.id)}">↻ Another</button><button class="sm quiet" data-copy="${esc(op)}">Copy</button></div>`; }
  catch(e){ const c=e&&e.code; host.innerHTML=`<span class="tiny muted">${c==='not_granted'?'AI wasn’t allowed for this page.':c==='rate_limited'?'Too many AI requests – try again in a minute.':'A tailored opener isn’t available right now.'} Use the opener above.</span>`; if(['not_granted','sampling_disabled','capability_disabled'].includes(c)) AI=null; } }

/* ====== live setup: the skill fills the desk while you watch ====== */
let DB=null; const SETUP={prog:null,ready:false};
const SETUP_STEPS=[['stack','Your tech stack'],['chats','Your past chats'],['website','Your website'],['competitors','Competitors'],['playbook','Playbook and call scripts']];
function watchSetup(){ if(!DB) return; try{
  DB.doc('setup/progress').onSnapshot(s=>{ SETUP.prog=s.exists?s.data():null; renderSetupLive(); },()=>{});
  DB.doc('setup/seed').onSnapshot(s=>{ if(s.exists){ const sd=s.data(); if(sd&&typeof sd==='object'){ SETUP.seed=sd; considerSeed(sd,true); } renderSetupLive(); } },()=>{}); }catch(e){} }
function setupPct(p){ if(isFinite(+p.pct)&&p.pct!==''&&p.pct!=null) return Math.max(0,Math.min(100,+p.pct)); const st=Array.isArray(p.steps)?p.steps:[]; if(!st.length) return p.status==='done'?100:0;
  const v=st.reduce((a,s)=>a+(s.state==='done'||s.state==='skipped'?1:s.state==='running'?0.45:0),0); return Math.round(v/st.length*100); }
function renderSetupLive(){ const host=$('#setupLive'); const p=SETUP.prog;
  if(DEMO){ host.classList.add('hidden'); host.innerHTML=''; return; }
  const offer=()=>{ if(SETUP.pending){ const sd=SETUP.pending; SETUP.pending=null; showSeedBanner(sd); } };
  if(!p||!p.runId||S.setupSeen===String(p.runId)){ host.classList.add('hidden'); host.innerHTML=''; offer(); return; }
  const age=Date.now()-(Date.parse(p.updatedAt||'')||Date.now()); const status=p.status==='done'?'done':p.status==='error'?'error':age>20*60000?'stale':'running';
  if(status!=='running'&&!host.innerHTML&&age>6*3600000){ offer(); return; }
  const pend=SETUP.pending&&S.seedId!==seedIdOf(SETUP.pending)?SETUP.pending:null;
  if(!$('#wizard').classList.contains('hidden')){ $('#wizard').classList.add('hidden'); document.body.style.overflow=''; }
  const pct=status==='done'?100:setupPct(p); const C=2*Math.PI*54;
  const steps=(Array.isArray(p.steps)&&p.steps.length?p.steps:SETUP_STEPS.map(([k,label])=>({k,label,state:'pending'}))).slice(0,8);
  const icon=s=>s.state==='done'?'<i class="si ok">✓</i>':s.state==='running'?'<i class="si run"></i>':s.state==='skipped'?'<i class="si skip">–</i>':s.state==='error'?'<i class="si err">!</i>':'<i class="si"></i>';
  const title=status==='done'?'Your desk is ready':status==='error'?'Setup stopped':status==='stale'?'Setup paused':'Preparing your desk';
  const lede=status==='done'?(pend?'A new setup and playbook are ready. Apply them? Your leads and call history stay, and the current version is saved first.':'Everything below is filled in. Review it in the setup guide, then import your leads.'):status==='error'?String(p.message||'Something went wrong. Continue in the chat, or set up by hand.'):status==='stale'?'Nothing new for 20 minutes. Continue in the chat, or set up by hand.':(p.message?String(p.message):'Your assistant is reading your chats, website and competitors. This page updates by itself.');
  host.classList.remove('hidden');
  host.innerHTML=`<div class="live" role="status" aria-live="polite"><div class="ltop">
     <div class="ring ${status}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="trk" cx="60" cy="60" r="54" fill="none" stroke-width="9"/><circle class="bar" cx="60" cy="60" r="54" fill="none" stroke-width="9" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C*(1-pct/100)).toFixed(1)}"/>${status==='running'?`<g class="spin"><circle cx="60" cy="60" r="54" fill="none" stroke-width="9" class="comet" stroke-dasharray="14 ${(C-14).toFixed(1)}"/></g>`:''}</svg><div class="pct"><span>${status==='done'?'✓':pct+'<small>%</small>'}</span></div></div>
     <div><h2>${esc(title)}</h2><p class="muted" style="margin:4px 0 0">${esc(lede)}</p></div></div>
   <ul class="lsteps">${steps.map(s=>`<li class="${esc(s.state||'pending')}">${icon(s)}<div><b>${esc(String(s.label||(SETUP_STEPS.find(x=>x[0]===s.k)||[])[1]||s.k||''))}</b>${s.detail?`<div class="small muted">${esc(String(s.detail).slice(0,220))}</div>`:''}</div></li>`).join('')}</ul>
   ${status==='done'&&Array.isArray(p.summary)&&p.summary.length?`<div class="unlock">${p.summary.slice(0,6).map(x=>'• '+esc(String(x).slice(0,160))).join('<br>')}</div>`:''}
   <div class="actions" style="justify-content:flex-end;margin-top:14px">${status==='done'?(pend?`<button class="sm quiet" data-live="later">Not now</button><button class="primary" data-live="apply">Apply the new setup</button>`:`<button class="sm quiet" data-live="desk">Go to my desk</button><button class="primary" data-live="review">Review my desk</button>`):`<button class="sm quiet" data-live="manual">Set up by hand instead</button>`}</div>
   <div class="tiny muted" style="margin-top:10px">SDR Command Center Lite · built by Csaba Fehér</div></div>`;
  host.onclick=e=>{ const b=e.target.closest('[data-live]'); if(!b) return; S.setupSeen=String(p.runId); save(); host.classList.add('hidden'); host.innerHTML='';
    const a=b.dataset.live; if(a==='apply'&&pend){ SETUP.pending=null; applySeed(pend); recomputeOrder(); renderAll(); toast('New setup applied – the previous version is in Version history'); return; }
    if(a==='later'&&pend){ SETUP.pending=null; S.seedSkip=seedIdOf(pend); save(); renderAll(); return; }
    if(a==='review') openWizard(0); else if(a==='manual') openWizard(S.setup.step||0); else { renderAll(); } }; }
