
/* ====== playbook ====== */
const PB=[
  {k:'who',title:'Who to call and when'},
  {k:'opener',title:'Opener – the first 20 seconds'},
  {k:'pitch',title:'Why you are calling'},
  {k:'discovery',title:'Discovery questions'},
  {k:'objections',title:'Objection handling'},
  {k:'competitors',title:'Competitors'},
  {k:'close',title:'Asking for the meeting'},
  {k:'voicemail',title:'Voicemail'},
  {k:'email',title:'Follow-up e-mail'},
  {k:'linkedin',title:'LinkedIn note'},
  {k:'rules',title:'House rules'}];
const TOKENS=['first_name','company','title','my_name','my_company','my_website','booking_link'];
function icpVals(){ const i=S.settings.icp, st=S.settings; const titles=(i.titles||'').split(/[,;\n]/).map(s=>s.trim()).filter(Boolean);
  const role=titles.length?titles.slice(0,2).join(' and ').replace(/\b(VP|Head|Director|Manager|Chief|Lead)\b/g,m=>m):'the people who own this problem';
  const prob=(i.problem||'').trim().replace(/[.\s]+$/,''); const sell=(i.sell||'').trim().replace(/[.\s]+$/,'');
  return { titles:titles.length?titles.join(', '):'[your target titles]', role:titles.length?titles[0]:'[target title]', roleP:role,
    industries:(i.industries||'').trim()||'[your target industries]', problem:prob||'[the problem you solve]', problemShort:(prob||'[the problem]').split(/[,;–—-]| and /)[0].trim(),
    proof:(i.proof||'').trim().replace(/[.\s]+$/,''), alt:(i.alt||'').trim()||'spreadsheets and the way it has always been done', ask:(i.ask||'a 20-minute intro call').trim(), sell:sell||'[what you sell]',
    dials:+st.dialTarget||60, from:st.callFrom, to:st.callTo }; }
function basicPlaybook(){ const v=icpVals(); const proof=v.proof?`For example, ${v.proof}.`:'We help teams fix that without adding work for them.';
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const b={
who:`Call ${v.titles} at ${v.industries}.
- ★ Priority leads first: their title matches your target titles (or you starred them).
- Call in their office hours, ${v.from}:00–${v.to}:00 their time. The dot next to each lead turns green when it's a good moment.
- Work callbacks and retries first, then fresh leads. "Start a call block" on Today does the ordering for you.
- Aim for ${v.dials} dials a day. Every lead you touch ends with a next step or a closed status.`,
opener:`"Hi {first_name}, this is {my_name} from {my_company}. I know I'm calling out of the blue – can I take 30 seconds to tell you why I'm calling, and you decide if we keep talking?"
- Pause and let them answer. A "yes" earns you 30 seconds.
- "I'm busy right now": "Totally fair. Is tomorrow morning or afternoon better for two minutes?" Then set the callback.`,
pitch:`"I speak with ${v.roleP} at companies like {company}, and what I keep hearing is ${v.problem}. ${proof} So I thought it was worth a quick call – how are you handling that today?"
- Problem first, product second: ${v.sell} only comes up once they've told you how they work today.
- Keep it under 30 seconds and end with a question.
- If they handle it with ${v.alt}: ask what works well and what they would change.`,
discovery:`- How do you handle ${v.problemShort} today?
- What happens when it goes wrong – who feels it first?
- What have you tried already? What did you like, what was missing?
- If you could fix one thing about it this quarter, what would it be?
- Who else would care about solving this?`,
objections:`"Just send me an e-mail."
→ "Happy to. So I send something useful: is ${v.problemShort} on your radar this year, or not really?"
"Not interested."
→ "Fair enough. Is that because it's handled already, or because it's not a priority right now?"
"We already use ${v.alt}."
→ "Makes sense, most teams we talk to do. What would you change about it if you could?"
"No budget."
→ "Understood, I'm not asking for budget today. Is it worth ${v.ask} to see if it's something to plan for?"
"Call me later."
→ "Sure. What's better, tomorrow at 10 or Thursday afternoon?" Then set the callback on the lead.`,
competitors:(()=>{ const names=(S.settings.icp.competitors||'').split(/[,;\n]/).map(s=>s.trim()).filter(Boolean).slice(0,6);
  if(!names.length) return `If they already use a tool or provider
- Don't criticise it. Ask what works well and what they would change.
→ "Makes sense, most teams we talk to have something in place. What would you change about it if you could?"`;
  return names.map(n=>`${n}
- How they position: [add from their website]
- Where we win: [add]
→ "Makes sense, many teams use ${n}. What would you change about it if you could?"`).join('\n\n'); })(),
close:`"From what you've said, it's worth ${v.ask}. How does Tuesday at 10 or Wednesday at 3 look?"
- Offer two concrete times instead of an open question.
- Confirm their e-mail and send the invite while you're still on the phone.
- If they want to pick a time later: {booking_link}`,
voicemail:`"Hi {first_name}, it's {my_name} from {my_company}. I'm calling about ${v.problemShort} at {company}. I'll send you a short e-mail as well. Again, {my_name} from {my_company}."
- Under 20 seconds: one reason, your name twice, no pitch.`,
email:`Subject: ${cap(v.problemShort)} at {company}

Hi {first_name},

I tried to reach you by phone just now. I work with ${v.roleP} on ${v.problem}. ${proof}

Worth ${v.ask} to see if it's relevant for {company}? You can pick a time here: {booking_link}

Best,
{my_name}
{my_company}
{my_website}`,
linkedin:`Hi {first_name}, I work with ${v.roleP} on ${v.problemShort}. I tried to reach you by phone today – happy to connect here.`,
rules:`- One goal per call: a meeting, or a clear no.
- Ask before you pitch: permission first, then a question within 30 seconds.
- Log every dial straight away. The outcome sets the next step for you.
- Never leave a lead without a next step or a closed status.
- Respect "don't call me again" at once, and follow your country's calling rules (do-not-call registers, recording consent).`};
  return PB.map(s=>({k:s.k,title:s.title,body:b[s.k]})); }
function aiBrief(){ const st=S.settings, i=st.icp; return `About me and my offer:
- My name: ${st.name||'(not given)'} · my company: ${st.company||'(not given)'} · my role: ${st.role||'SDR'}
- Company website: ${st.website||'(not given)'}
- What we sell: ${i.sell||'(not given)'}
- Who I call (titles): ${i.titles||'(not given)'}
- Industries / company type: ${i.industries||'(not given)'}
- Main competitors: ${i.competitors||'(not given)'}
- The problem we solve: ${i.problem||'(not given)'}
- Proof (a customer or a result): ${i.proof||'(none – do not invent one; write [add a customer result])'}
- What they use today instead: ${i.alt||'(not given)'}
- The meeting I ask for: ${i.ask||'a 20-minute intro call'}
- Call window: ${st.callFrom}:00–${st.callTo}:00 the prospect's local time; daily dial goal ${st.dialTarget}.`; }
function aiRules(){ return `Rules:
- Plain, spoken language; short sentences; no hype, no buzzwords, no exclamation marks.
- Problem first, product second. Never invent customers, numbers or claims that are not in the brief.
- Use these placeholders exactly where the lead's or my details belong: {first_name}, {company}, {title}, {my_name}, {my_company}, {my_website}, {booking_link}.
- Lines that are spoken go in double quotes. Tips start with "- ". In objection handling, write the objection in quotes on one line and the reply on the next line starting with "→ ".
- The follow-up e-mail starts with a line "Subject: …", then the body, under 90 words.
- The LinkedIn note is under 280 characters. The voicemail is under 20 seconds when spoken.
- Competitors: one block per competitor named in the brief – the name on its own line, then "- How they position: …" and "- Where we win: …" (only what the brief supports; otherwise "[add]"), then a line starting with "→ " with the spoken reply to "We already use [competitor]". If none are named, write one block called "If they already use a tool or provider".
- Write in the language of the brief.`; }
function aiPromptJson(){ return `You write cold-calling playbooks for B2B sales development reps. Write a playbook for the rep below.

${aiBrief()}

${aiRules()}

Reply with only a JSON object whose keys are exactly: ${PB.map(s=>s.k).join(', ')}. Each value is the section text as a string (use \\n for line breaks). Also add a key "script" whose value is an object with three one-sentence strings: "reason" (why you call, in the customer's words), "problem" (one open question about how they handle it today), "value" (what you do plus proof only if given). The sections are:
${PB.map(s=>'- '+s.k+': '+s.title).join('\n')}`; }
function aiPromptMd(){ const w=S.settings.website; return `You write cold-calling playbooks for B2B sales development reps. Write a playbook for me.
${w?`\nIf you can open web pages, read ${w} first (home page, product and customer pages) and use only claims you find there or in the brief below.\n`:''}
${aiBrief()}

${aiRules()}

Reply in Markdown with exactly these headings, in this order, and nothing before the first heading:
${PB.map(s=>'## '+s.title).join('\n')}`; }
function normalizeAi(obj){ if(!obj||typeof obj!=='object') return []; if(obj.sections&&typeof obj.sections==='object') obj=obj.sections;
  if(Array.isArray(obj)) return obj.filter(x=>x&&x.body).map((x,i)=>({k:x.k||('x'+i),title:x.title||(PB.find(p=>p.k===x.k)||{}).title||'Section',body:String(x.body)}));
  return PB.filter(s=>typeof obj[s.k]==='string'&&obj[s.k].trim()).map(s=>({k:s.k,title:s.title,body:obj[s.k].trim()})); }
function keyForTitle(t){ t=t.toLowerCase(); const map=[['who',/who|when|target|icp/],['opener',/open/],['pitch',/why|pitch|value|reason/],['discovery',/discover|question/],['objections',/objection/],['close',/meeting|close|ask/],['voicemail',/voicemail|voice mail/],['email',/e-?mail/],['linkedin',/linkedin/],['rules',/rule/]];
  for(const [k,re] of map) if(re.test(t)) return k; return null; }
function parsePasted(text){ text=String(text||'').replace(/\r/g,'').trim(); if(!text) return [];
  if(/^[{\[]/.test(text)){ try{ const j=normalizeAi(JSON.parse(text)); if(j.length) return j; }catch(e){} }
  const parts=text.split(/^\s{0,3}#{1,4}\s+(.+?)\s*#*\s*$/m); const out=[]; const used=new Set();
  if(parts.length<3) return [{k:'notes',title:'My messaging',body:text}];
  if(parts[0].trim()) out.push({k:'intro',title:'Notes',body:parts[0].trim()});
  for(let i=1;i<parts.length;i+=2){ const title=parts[i].replace(/[*_`]/g,'').trim(); const body=(parts[i+1]||'').trim(); let k=keyForTitle(title); if(!k||used.has(k)) k='x'+i; used.add(k);
    const pbt=PB.find(p=>p.k===k); out.push({k,title:pbt?pbt.title:title,body}); }
  return out.filter(s=>s.body); }
function pbBodyHtml(text,tok){ const lines=String(text||'').replace(/\r/g,'').split('\n'); let html='', inList=false;
  const fmt=s=>{ let h=esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>'); if(tok) h=h.replace(/\{(first_name|last_name|company|title|my_name|my_company|my_website|booking_link|slot1|slot2)\}/g,'<span class="tok">{$1}</span>'); return h; };
  let para=[]; const flush=()=>{ if(para.length){ html+='<p>'+para.map(fmt).join('<br>')+'</p>'; para=[]; } };
  for(const raw of lines){ const ln=raw.trimEnd(); if(/^\s*[-•*]\s+/.test(ln)){ flush(); if(!inList){ html+='<ul>'; inList=true; } html+='<li>'+fmt(ln.replace(/^\s*[-•*]\s+/,''))+'</li>'; continue; }
    if(inList){ html+='</ul>'; inList=false; }
    if(!ln.trim()){ flush(); continue; } if(/^\s*(→|->)/.test(ln)){ flush(); html+='<p class="rep">'+fmt(ln.replace(/^\s*(→|->)\s*/,'→ '))+'</p>'; continue; }
    if(/^\s*["“]/.test(ln)) flush(); para.push(ln); }
  flush(); if(inList) html+='</ul>'; return html; }

let PB_EDIT=null, SC_EDIT=false;
function scriptCardHtml(){ const b=scriptBase();
  if(SC_EDIT) return `<div class="card pbsec" style="margin-top:14px"><div class="hd"><h3 style="margin:0">Call script building blocks</h3></div>
    <div class="ef" style="grid-template-columns:1fr 1fr">${[['reason','One reason (why you call)'],['problem','Problem question'],['value','Value line'],['ask','The ask – {slot1} and {slot2} become two times in their local time']].map(([k,lb])=>`<label class="${k==='ask'?'full':''}">${lb}<textarea data-sc="${k}" rows="2">${esc(b[k])}</textarea></label>`).join('')}
    <label>Qualify after the yes (one per line)<textarea data-sc="qualify" rows="4">${esc(b.qualify.join('\n'))}</textarea></label><label>Never on a call (one per line)<textarea data-sc="never" rows="4">${esc(b.never.join('\n'))}</textarea></label></div>
    <div class="actions"><button class="sm primary" data-scsave>Save</button><button class="sm" data-sccancel>Cancel</button><button class="sm quiet" data-screset style="margin-left:auto">Reset to defaults</button></div></div>`;
  return `<div class="card pbsec" style="margin-top:14px"><div class="hd"><h3 style="margin:0">Call script building blocks</h3><span><button class="sm quiet" data-scedit>Edit</button></span></div>
    <p class="small muted" style="margin:0 0 8px">Every lead’s “Call script” button combines these with your opener, objections and competitors, plus the lead’s history and two meeting times in their local time.</p>
    <div class="body small"><p><b>Reason:</b> ${pbBodyHtml(b.reason,true).replace(/^<p>|<\/p>$/g,'')}</p><p><b>Problem question:</b> ${pbBodyHtml(b.problem,true).replace(/^<p>|<\/p>$/g,'')}</p><p><b>Value line:</b> ${pbBodyHtml(b.value,true).replace(/^<p>|<\/p>$/g,'')}</p><p><b>Ask:</b> ${pbBodyHtml(b.ask,true).replace(/^<p>|<\/p>$/g,'')}</p></div></div>`; }
function renderPlaybook(){ const el=$('#v-playbook'); const p=S.playbook;
  if(!p||!(p.sections||[]).length){ el.innerHTML=`<div class="card empty"><h2>No playbook yet</h2><p>Your playbook holds your opener, objection replies, voicemail and follow-up e-mail. Each lead card shows them with the lead's name and company filled in.</p><div class="actions" style="justify-content:center"><button class="primary" data-pb="setup">Set up my messaging</button><button data-pb="basic">Start from basic guidelines</button></div></div>`; wirePlaybook(); return; }
  const src={live:'Prepared for you',ai:'Written with AI from your setup answers',basic:'Basic guidelines, filled in with your setup answers',pasted:'Pasted in by you',prepared:'Prepared for you'+(p.note?' – '+p.note:'')}[p.src]||'';
  el.innerHTML=`<div class="dayhead"><div><h2>Playbook</h2><div class="muted small">${esc(src)}${p.at?' · '+esc(fmtWhen(p.at)):''}. Edit any section; placeholders like <span class="tok">{first_name}</span> are filled in on each lead. Company and website come from Setup.</div></div>
    <div class="actions" style="margin:0"><button class="sm" data-pb="setup">Rebuild from setup</button><button class="sm" data-pb="copyall">Copy all</button><button class="sm" data-pb="add">Add section</button></div></div>
    ${scriptCardHtml()}
    <div class="pbgrid">${p.sections.map((s,i)=>`<div class="card pbsec"><div class="hd"><h3 style="margin:0">${esc(s.title)}</h3><span>${PB_EDIT===i?'':`<button class="sm quiet" data-pbcopy="${i}">Copy</button><button class="sm quiet" data-pbedit="${i}">Edit</button>`}</span></div>
      ${PB_EDIT===i?`<input type="text" data-pbtitle value="${esc(s.title)}" style="width:100%;margin-bottom:6px"><textarea data-pbbody>${esc(s.body)}</textarea><div class="actions"><button class="sm primary" data-pbsave="${i}">Save</button><button class="sm" data-pbcancel>Cancel</button><button class="sm danger" data-pbdel="${i}" style="margin-left:auto">Delete section</button></div>`:`<div class="body">${pbBodyHtml(s.body,true)}</div>`}</div>`).join('')}</div>`;
  wirePlaybook(); }
function wirePlaybook(){ const el=$('#v-playbook'); el.onclick=e=>{ const t=e.target; const p=S.playbook;
  const a=t.closest('[data-pb]'); if(a){ const k=a.dataset.pb; if(k==='setup') openWizard(2); if(k==='basic'){ S.playbook={src:'basic',at:new Date().toISOString(),sections:basicPlaybook()}; snapshot('Playbook from basic guidelines'); save(); renderPlaybook(); toast('Basic guidelines added – make them yours with Edit'); }
    if(k==='copyall') copyAndToast(p.sections.map(s=>'## '+s.title+'\n'+s.body).join('\n\n'),'Playbook copied');
    if(k==='add'){ p.sections.push({k:'x'+uid(),title:'New section',body:''}); PB_EDIT=p.sections.length-1; save(); renderPlaybook(); } return; }
  if(t.closest('[data-scedit]')){ SC_EDIT=true; renderPlaybook(); return; } if(t.closest('[data-sccancel]')){ SC_EDIT=false; renderPlaybook(); return; }
  if(t.closest('[data-screset]')){ S.script=null; SC_EDIT=false; snapshot('Call script reset to defaults'); save(); renderPlaybook(); toast('Call script reset to defaults'); return; }
  if(t.closest('[data-scsave]')){ const sc={}; el.querySelectorAll('[data-sc]').forEach(x=>{ const k=x.dataset.sc; sc[k]=(k==='qualify'||k==='never')?x.value.split('\n').map(s=>s.trim()).filter(Boolean):x.value.trim(); }); S.script=sc; SC_EDIT=false; snapshot('Call script edited'); save(); renderPlaybook(); toast('Call script saved'); return; }
  const ed=t.closest('[data-pbedit]'); if(ed){ PB_EDIT=+ed.dataset.pbedit; renderPlaybook(); const ta=el.querySelector('[data-pbbody]'); if(ta) ta.focus(); return; }
  const cp=t.closest('[data-pbcopy]'); if(cp){ const s=p.sections[+cp.dataset.pbcopy]; copyAndToast(s.body,'Section copied'); return; }
  if(t.closest('[data-pbcancel]')){ PB_EDIT=null; renderPlaybook(); return; }
  const sv=t.closest('[data-pbsave]'); if(sv){ const s=p.sections[+sv.dataset.pbsave]; s.title=el.querySelector('[data-pbtitle]').value.trim()||s.title; s.body=el.querySelector('[data-pbbody]').value; PB_EDIT=null; snapshot('Playbook edited: '+s.title); save(); renderPlaybook(); toast('Section saved'); return; }
  const dl=t.closest('[data-pbdel]'); if(dl){ armDanger(dl,()=>{ const gone=p.sections.splice(+dl.dataset.pbdel,1)[0]; PB_EDIT=null; snapshot('Playbook section deleted: '+(gone?gone.title:'')); save(); renderPlaybook(); }); } }; }
