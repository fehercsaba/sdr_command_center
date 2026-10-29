# Seed format

One JSON object. It reaches the page either live (written to `setup/seed`, see `live-setup.md`) or embedded in the HTML by `scripts/prepare_desk.py`. A fresh desk applies it automatically; an existing desk shows "An updated company setup and playbook is available – Apply" when `seedId` is new. Unknown keys are ignored; every key is optional.

```json
{
  "seedId": "acme-2026-10-23",
  "note": "Prepared from 3 past chats, acme.com and competitor research",
  "settings": {"name": "Alex Morgan", "company": "Acme Analytics", "website": "https://acme.com", "role": "SDR",
               "dialTarget": 60, "meetTarget": 8, "callFrom": 9, "callTo": 17},
  "stack": {"crm": "hubspot", "crmPortal": "", "crmHost": "app", "crmDomain": "", "dialer": "aircall", "callMode": "tel",
            "mail": "gmail", "seq": "instantly", "data": "apollo", "booking": "https://calendly.com/alex/20min", "li": true},
  "icp": {"sell": "Software that books field-service visits automatically",
          "titles": "Head of Operations, COO, Service Manager",
          "industries": "Facility services, 200–2,000 employees",
          "problem": "technicians lose hours a week to rescheduling by phone",
          "proof": "Northgate cut no-shows by a third in 8 weeks",
          "alt": "Excel and a shared inbox",
          "competitors": "RivalSoft, PlanCo",
          "ask": "a 20-minute intro call"},
  "script": {"reason": "Operations leaders tell us reschedules eat hours every week.",
             "problem": "How do you handle reschedules today?",
             "value": "We book visits automatically. Northgate cut no-shows by a third in 8 weeks.",
             "ask": "Worth a 20-minute intro call to see if it's relevant? I can do {slot1} or {slot2}.",
             "qualify": ["Who else signs off?", "How many technicians?", "What triggers a change this year?"],
             "never": ["Prices", "Criticising a competitor", "\"I hope you're well\""]},
  "sources": {"at": "2026-10-23T10:20:00Z",
              "chats": ["Messaging framework v1.5", "Battlecards Q3"],
              "website": ["https://acme.com", "https://acme.com/customers"],
              "competitors": [{"name": "RivalSoft", "url": "https://rivalsoft.com"}],
              "files": ["ICP one-pager.pdf"]},
  "playbook": {"who": "…", "opener": "…", "pitch": "…", "discovery": "…", "objections": "…", "competitors": "…",
               "close": "…", "voicemail": "…", "email": "Subject: …\n\nHi {first_name},\n…", "linkedin": "…", "rules": "…"}
}
```

Allowed values:
- `role`: SDR, BDR, AE, Founder, Other
- `crm`: hubspot, salesforce, pipedrive, close, other, none (`crmPortal` = HubSpot account ID, `crmHost` = app or app-eu1; `crmDomain` = Salesforce address like acme.lightning.force.com, or the Pipedrive subdomain)
- `dialer`: tel, aircall, ringcentral, dialpad, zoom, teams, other; `callMode`: tel (open dialer), web (copy number and open the dialer's web app – Aircall, RingCentral, Dialpad, Teams only), copy
- `mail`: mailto, gmail, outlook
- `seq`: instantly, apollo, lemlist, outreach, salesloft, hubspot, none
- `data`: apollo, lusha, cognism, zoominfo, salesnav, clay, other
- `titles`: comma-separated; leads whose title contains one of these words get a ★
- `script.ask`: `{slot1}` and `{slot2}` become the next two working days at 10:00 and 14:00 in each lead's local time
- `sources`: shown in the page's Setup hub so the person can see what the setup was built from; chats by title only, at most 12 items per list
- `playbook`: the object above (keys exactly as shown) or `{"sections": [{"k": "opener", "title": "…", "body": "…"}]}`
