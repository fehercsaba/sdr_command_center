
/* ====== demo mode: a separate, fully populated fictional desk ====== */
const SKILL_URL=''; /* set to a download link for the skill to show a "Download the skill" button */
function demoRand(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function buildDemo(){ const R=demoRand(20261023); const pick=a=>a[Math.floor(R()*a.length)]; const now=Date.now();
  const st=freshState(); st.demo=true; st.created=new Date(now-21*864e5).toISOString(); st.lastBackup=new Date(now-2*864e5).toISOString(); st.appVersion=VERSION;
  Object.assign(st.settings,{name:'Alex Morgan',company:'Northpeak',website:'https://northpeak.example',role:'SDR',dialTarget:60,meetTarget:8,callFrom:9,callTo:17});
  Object.assign(st.settings.stack,{crm:'hubspot',dialer:'aircall',callMode:'tel',mail:'gmail',seq:'instantly',data:'apollo',booking:'https://calendly.example/alex/20min',li:true});
  Object.assign(st.settings.icp,{sell:'Scheduling software that books and reschedules field-service visits automatically',titles:'Head of Operations, COO, Service Manager, Field Service Director',industries:'Facility services and installers, 100–2,000 employees',
    problem:'technicians lose hours every week to rescheduling by phone',proof:'Brightwell Facilities cut no-shows by a third in eight weeks',alt:'spreadsheets and a shared inbox',competitors:'RouteMaster, PlanPilot',ask:'a 20-minute intro call'});
  const keep=S; S=st; let secs; try{ secs=basicPlaybook(); }finally{ S=keep; }
  const comp=secs.find(s=>s.k==='competitors'); if(comp) comp.body=`RouteMaster (routemaster.example)
- How they position: an all-in-one field-service suite
- Where we win: live in a week, no consultants; customers rebook themselves by text
→ "Makes sense, many teams start with RouteMaster. How do reschedules work for you today – who picks up the phone?"

PlanPilot (planpilot.example)
- How they position: a low-cost visit planner
- Where we win: fewer calls for the office, because customers rebook themselves
→ "Lots of teams like PlanPilot for planning. What happens when a technician runs late?"`;
  st.playbook={src:'prepared',note:'Demo – a fictional company',at:new Date(now-20*864e5).toISOString(),sections:secs};
  st.script={reason:'Operations leaders tell us reschedules eat hours of their team’s week.',problem:'How do you handle reschedules today – who picks up the phone?',value:'Northpeak lets customers rebook themselves by text. Brightwell Facilities cut no-shows by a third in eight weeks.',ask:'Worth a 20-minute intro call to see if it’s relevant? I can do {slot1} or {slot2}.',
    qualify:['How many technicians and visits a week?','Who else is involved in choosing tools like this?','What do reschedules cost you today – overtime, lost visits?','Is anything changing this year – new contracts, growth, a renewal?'],
    never:['Prices on a first call','Criticising RouteMaster or PlanPilot','“I hope you’re well”','Promises about savings we can’t show']};
  st.sources={at:new Date(now-20*864e5).toISOString(),chats:['Messaging framework v2 (demo)','Competitor notes (demo)'],website:['https://northpeak.example','https://northpeak.example/customers'],competitors:[{name:'RouteMaster',url:'https://routemaster.example'},{name:'PlanPilot',url:'https://planpilot.example'}],files:[],note:'Demo data – everything here is fictional'};
  st.lists=[{k:'d1',label:'Facility services – UK'},{k:'d2',label:'Webinar attendees – October'},{k:'d3',label:'Ops Summit 2026 – met at the booth'}];
  const FN=['Maya','Daniel','Sofia','Ravi','Lena','Tom','Aisha','Lukas','Chloé','Oliver','Priya','Jonas','Emma','Mateo','Hannah','Kenji','Zoe','Marek','Nora','Samuel','Ines','Felix','Grace','Bence','Leah','Arjun','Mila','Henrik','Julia','Owen'];
  const LN=['Okafor','Brooks','Lindqvist','Menon','Hoffmann','Akers','Rahman','Becker','Martin','Hughes','Patel','Vogel','Clarke','Silva','Wright','Tanaka','Evans','Novák','Byrne','Adeyemi','Costa','Wagner','Kelly','Nagy','Fischer','Shah','Jansen','Larsen','Kovács','Doyle'];
  const CA=['Brightwell','Northgate','Kestrel','Halden','Copperleaf','Orbit','Riverside','Summit','Ashford','Bluefield','Crestline','Evergreen','Foxley','Granite','Harbor','Ironwood','Juniper','Lakeside','Meridian','Oakridge','Pinecrest','Redstone','Silverline','Thornbury'];
  const CB=['Facilities','Services','Installations','Maintenance','Technical Services','Property Care','Building Services','Field Services'];
  const TI=['Head of Operations','COO','Service Manager','Field Service Director','Operations Manager','Facilities Director','Head of Service Delivery','Office Manager','Scheduling Lead','Managing Director'];
  const PL=[['United Kingdom',.42],['United States',.22],['Germany',.1],['Netherlands',.08],['Ireland',.07],['Hungary',.06],['Australia',.05]];
  const US=[['New York','NY'],['Chicago','IL'],['Austin','TX'],['San Diego','CA'],['Seattle','WA']];
  const CITY={'United Kingdom':['London','Manchester','Leeds','Bristol'],'Germany':['Berlin','Hamburg','Munich'],'Netherlands':['Amsterdam','Utrecht','Rotterdam'],'Ireland':['Dublin','Cork'],'Hungary':['Budapest','Debrecen'],'Australia':['Sydney','Melbourne']};
  const country=()=>{ let r=R(),a=0; for(const [c,w] of PL){ a+=w; if(r<a) return c; } return 'United Kingdom'; };
  const n3=()=>String(Math.floor(R()*900)+100);
  const phone=c=>({'United Kingdom':pick(['+44 20 7946 0','+44 161 496 0','+44 113 496 0'])+n3(),'United States':pick(['+1 202 555 01','+1 312 555 01'])+String(Math.floor(R()*90)+10),'Australia':'+61 2 5550 '+n3()+'0','Germany':'+49 30 555 0'+n3(),'Netherlands':'+31 20 555 0'+n3(),'Ireland':'+353 1 555 0'+n3(),'Hungary':'+36 1 555 0'+n3()}[c]);
  const NOTES=['Assistant says she’s in the field on Mondays – try Tuesday 8:30','Uses RouteMaster, contract renews in March','On PlanPilot today, frustrated with late technicians','Asked us to call back after their budget meeting','Gatekeeper: send info to the ops@ address first','New COO since September – good timing','Interested, wants their ops lead on the next call','Runs 40 technicians across two regions'];
  const leads=[]; const used=new Set();
  for(let i=0;i<180;i++){ let first,last; do{ first=pick(FN); last=pick(LN); }while(used.has(first+last)&&used.size<800); used.add(first+last);
    const c=country(); const co=pick(CA)+' '+pick(CB); const dom=co.toLowerCase().replace(/[^a-z]+/g,'')+'.example'; const l={id:'demo'+i,list:'d2',created:new Date(now-(20-Math.floor(R()*18))*864e5).toISOString(),st:'open',first,last,title:pick(TI),company:co,domain:dom,email:(first+'.'+last).toLowerCase().normalize('NFD').replace(/[^a-z.]/g,'')+'@'+dom,country:c};
    if(c==='United States'){ const u=pick(US); l.city=u[0]; l.state=u[1]; } else l.city=pick(CITY[c]);
    if(R()>.14) l.phone=phone(c); if(R()<.3) l.mobile=phone(c);
    l.list=c==='United Kingdom'&&R()<.7?'d1':R()<.18?'d3':'d2'; if(l.list==='d3') l.notes='Met at the Ops Summit booth – asked about rebooking by text';
    leads.push(l); }
  /* two weeks of calling: weekdays, office hours, realistic outcome mix */
  const days=[]; for(let i=14;i>=0;i--){ const d=new Date(now); d.setDate(d.getDate()-i); if(d.getDay()===0||d.getDay()===6) continue; days.push(d); }
  const OUTS=[['na',.5],['gk',.17],['cb',.13],['lost',.08],['bad',.03],['meet',.012]]; const outcome=()=>{ let r=R()*OUTS.reduce((a,o)=>a+o[1],0),a=0; for(const [k,w] of OUTS){ a+=w; if(r<a) return k; } return 'na'; };
  /* simulate call by call: only leads that are still open can be dialled, due follow-ups first */
  const byid=Object.fromEntries(leads.map(l=>[l.id,l])); const kept=[]; const phoned=leads.filter(l=>l.phone||l.mobile);
  const apply=(l,o,t)=>{ l.st=OUTL[o].st; l.st_at=t.toISOString();
    if(o==='na') l.next=toInput(atHour(addBiz(t,2),10)); else if(o==='gk') l.next=toInput(atHour(addBiz(t,1),10)); else if(o==='cb') l.next=toInput(atHour(addBiz(t,1),R()<.5?10:14));
    else if(o==='meet'){ l.meet_at=t.toISOString(); l.next=toInput(atHour(addBiz(t,2+Math.floor(R()*4)),R()<.5?10:14)); } else l.next=null; };
  for(const day of days){ const isToday=dkey(day)===todayKey(); const hNow=new Date().getHours()+new Date().getMinutes()/60;
    let count=isToday?(hNow<9?0:Math.round(Math.min(Math.min(hNow,17.5)-9,8.5)*6.5)):Math.floor(38+R()*28);
    const times=[]; for(let j=0;j<count;j++){ const t=new Date(day); const end=isToday?Math.min(hNow,17.5):17.5; const mins=9*60+Math.floor(R()*Math.max(1,(end-9)*60)); t.setHours(Math.floor(mins/60),mins%60,Math.floor(R()*60),0); if(t.getTime()<=now) times.push(t); }
    times.sort((x,y)=>x-y);
    for(const t of times){ const eligible=phoned.filter(l=>!CLOSED.has(l.st)&&l.st!=='meet'); if(!eligible.length) break;
      const due=eligible.filter(l=>l.next&&new Date(l.next)<=t); const pool=due.length&&R()<.6?due:eligible.filter(l=>l.st==='open').length&&R()<.7?eligible.filter(l=>l.st==='open'):eligible;
      const l=pool[Math.floor(R()*pool.length)]; const o=outcome(); kept.push({at:t.toISOString(),id:l.id,o,k:'dk'+kept.length}); apply(l,o,t); } }
  /* what's left overdue was handled off-desk: spread it over the coming days; keep a few due today */
  const dueNow=leads.filter(l=>l.next&&!CLOSED.has(l.st)&&l.st!=='meet'&&new Date(l.next)<=endOfToday());
  dueNow.forEach((l,i)=>{ if(i<6) l.next=toInput(new Date(now+(i-2)*2700e3)); else l.next=toInput(atHour(addBiz(new Date(now),1+(i%4)),i%2?14:10)); });
  leads.filter(l=>l.st!=='open').slice(0,26).forEach((l,i)=>{ l.note=NOTES[i%NOTES.length]; });
  st.leads=leads; st.dials=kept;
  st.imports=[{id:'demoimp1',at:new Date(now-20*864e5).toISOString(),name:'Facility services – UK',kind:'file',file:'facility-services-uk.csv',rows:leads.filter(l=>l.list==='d1').length,add:leads.filter(l=>l.list==='d1').length,upd:0,list:'Facility services – UK',stored:false},
    {id:'demoimp2',at:new Date(now-12*864e5).toISOString(),name:'HubSpot – webinar attendees',kind:'hubspot',rows:leads.filter(l=>l.list==='d2').length,add:leads.filter(l=>l.list==='d2').length,upd:4,list:'Webinar attendees – October',stored:false},
    {id:'demoimp3',at:new Date(now-6*864e5).toISOString(),name:'Ops Summit booth list',kind:'paste',rows:leads.filter(l=>l.list==='d3').length,add:leads.filter(l=>l.list==='d3').length,upd:0,list:'Ops Summit 2026 – met at the booth',stored:false}];
  st.setup={done:true,step:0,dismissed:false,seen:[]}; st.ui=Object.assign(st.ui,{view:'today'});
  const keep2=S; S=st; try{ snapshot('Demo desk created',false,true); }finally{ S=keep2; }
  return st; }
const kDemoFlag=()=>'sdrlite_demo:'+(NS||'-');
async function setDemo(on){ on=!!on; if(on===DEMO) return; if(on&&!DEMO) S.setup.welcomed=true; await saveNow();
  DEMO=on; try{ on?localStorage.setItem(kDemoFlag(),'1'):localStorage.removeItem(kDemoFlag()); }catch(e){}
  let st=null; try{ if(IDB){ const raw=await idbGet(kState()); if(raw) st=JSON.parse(raw); } else st=loadState(kLocal()); }catch(e){ st=null; }
  if(on&&!st) st=buildDemo(); S=migrate(st); if(on) saveNow();
  SEL.clear(); EXP.clear(); EDIT.clear(); SCRIPT.clear(); CALLED.clear(); closeModal(); $('#wizard').classList.add('hidden'); $('#wizard').innerHTML=''; document.body.style.overflow=''; if(FB){ FB=null; $('#focus').classList.add('hidden'); }
  $('#q').value=''; recomputeOrder(); renderAll(); renderDemoBar();
  if(on) toast('Demo mode is on – a fictional desk. Your own desk is untouched.');
  else { toast('Back to your own desk'); checkSeed(); if(SETUP.seed) considerSeed(SETUP.seed,true); renderSetupLive(); if(!S.setup.done&&!S.setup.dismissed) openWizard(S.setup.step||0); } }
async function resetDemo(){ if(!DEMO) return; S=migrate(buildDemo()); saveNow(); SEL.clear(); EXP.clear(); recomputeOrder(); renderAll(); toast('Demo desk reset'); }
function renderDemoBar(){ const b=$('#demoBar'); if(!b) return; if(!DEMO){ b.classList.add('hidden'); b.innerHTML=''; $('#demoBtn')&&($('#demoBtn').textContent='Demo mode'); return; }
  b.classList.remove('hidden'); b.innerHTML=`<span><b>Demo mode</b> – a fictional company, leads and two weeks of calls. Calls aren’t placed and nothing goes to HubSpot. Your own desk is untouched.</span><span class="actions" style="margin:0"><button class="sm" data-demo="reset">Reset demo</button><button class="sm primary" data-demo="off">Switch to my desk</button></span>`;
  b.onclick=e=>{ const x=e.target.closest('[data-demo]'); if(!x) return; if(x.dataset.demo==='off') setDemo(false); else armDanger(x,()=>resetDemo()); };
  $('#demoBtn')&&($('#demoBtn').textContent='Leave demo'); }

/* ====== auto-setup: how to start it (the work happens in a chat with the skill) ====== */
function autoPrompt(){ const w=S.settings.website; return `Set up my SDR call desk with the SDR Command Center Lite skill${w?` – my company website is ${w}`:''}. Read my past chats and website, research my competitors, and fill in ${DB?'the SDR Command Center Lite desk I already have open':'a desk for me'}.`; }
function openAutoSetup(){ if(DEMO){ toast('Switch to your own desk first – auto-setup fills in your real desk'); return; }
  if(!IS_OWNER){ toast('This desk’s setup is managed by the person who shared it'); return; } const p=autoPrompt();
  const box=openModal(`<div class="mh"><h3 style="margin:0">Auto-setup: let your AI assistant fill in this desk</h3><button class="sm quiet" data-close>Close</button></div>
   <p class="small" style="margin-top:0">Your assistant reads your <b>past chats</b> for messaging, your <b>website</b> and your <b>competitors</b>, then writes your playbook, competitor replies and call scripts. ${DB?'You watch a progress ring fill up on this page.':'It publishes your own copy of this desk, already filled in.'} Nothing is invented: claims come from your material or stay as “[add]”.</p>
   <ol class="cs-list" style="font-size:13.5px">
    <li><b>Add the SDR Command Center Lite skill</b> to your assistant (skills need a plan with skills and code execution turned on).${SKILL_URL?` <a href="${esc(SKILL_URL)}" target="_blank" rel="noopener noreferrer">Download the skill</a>.`:' Get the skill file from whoever shared this page.'}</li>
    <li><b>Start a new chat and paste this:</b><div class="prompt" style="margin-top:6px">${esc(p)}</div></li>
    <li>${DB?'Keep this page open – the ring appears here and the desk fills in by itself.':'Open the link your assistant gives you – the ring fills up there.'} Say “skip chats” if you’d rather it didn’t look at past chats.</li></ol>
   <div class="actions"><button class="primary" data-cp>Copy the prompt</button></div>`,{label:'Auto-setup'});
  box.querySelector('[data-close]').onclick=closeModal; box.querySelector('[data-cp]').onclick=()=>copyAndToast(p,'Prompt copied – paste it into a new chat'); }
function welcomeHtml(){ if(S.setup.done||DEMO) return '';
  return `<div class="welcome"><div class="wh"><b>How do you want to start?</b><span class="tiny muted">You can switch any time.</span></div>
   <div class="wopts">
    <button class="wopt" data-start="auto"><span class="wi">✨</span><b>Set it up for me</b><span>Your AI assistant reads your chats, website and competitors and fills in the desk.</span></button>
    <button class="wopt" data-start="demo"><span class="wi">▶</span><b>Explore with demo data</b><span>A full fictional desk with two weeks of calls. Your own desk stays separate.</span></button>
    <button class="wopt" data-start="quick"><span class="wi">⚡</span><b>Quick start</b><span>Add your name and company below, then start calling with basic guidelines.</span></button>
   </div><div class="tiny muted" style="margin-top:8px">Or set it up step by step below.</div></div>`; }
