# Writing the playbook

Eleven sections plus the call-script building blocks. Sections, keyed exactly like this:

| key | title in the page | length |
|---|---|---|
| who | Who to call and when | 3–5 lines |
| opener | Opener – the first 20 seconds | one spoken line + 1–2 tips |
| pitch | Why you are calling | ≤ 30 seconds spoken + 2–3 tips |
| discovery | Discovery questions | 4–6 questions |
| objections | Objection handling | 4–6 pairs |
| competitors | Competitors | one block per competitor (2–4) |
| close | Asking for the meeting | one spoken line + 2–3 tips |
| voicemail | Voicemail | ≤ 20 seconds spoken + 1 tip |
| email | Follow-up e-mail | `Subject:` line, then ≤ 90 words |
| linkedin | LinkedIn note | ≤ 280 characters |
| rules | House rules | 4–6 bullets |

## Call-script building blocks (`script` in the seed)

Every lead's "Call script" button combines these with the opener, objections and competitors, plus the lead's history and two meeting slots in their local time:
- `reason`: one sentence, why you call, in the customer's words
- `problem`: one open question about how they handle it today
- `value`: what you do, plus one proof point only if it's real
- `ask`: the meeting ask with `{slot1}` and `{slot2}`
- `qualify`: 3–5 questions to ask after the yes
- `never`: 4–6 things never to say on a call (from the person's material if any)

## Format the page understands

- Spoken lines in double quotes: `"Hi {first_name}, this is {my_name} from {my_company} …"`
- Tips as bullets starting with `- `
- Objections: the objection in quotes on one line, the reply on the next line starting with `→ `
- Competitors: the competitor name on its own line (website in brackets is fine), then `- How they position: …`, `- Where we win: …`, then `→ "…"` – the reply to "We already use …". The script matches the name against each lead's notes.
- Opener: put a second quoted line in the opener section to offer an alternative opener.
- Placeholders, filled in per lead: `{first_name}`, `{company}`, `{title}`, `{my_name}`, `{my_company}`, `{my_website}`, `{booking_link}`
- Plain text otherwise; no Markdown headings inside a section.

## Style

- Spoken, short sentences. No buzzwords, no hype, no exclamation marks.
- Permission-based opener, then problem first: name the problem in the customer's words, product second.
- Every spoken pitch ends with a question.
- Ask for the meeting with two concrete times.
- Use only proof from the website or the person. No invented customers or numbers.
- Write in the language the person calls in (ask if unclear).

## Example (generic)

opener:
```
"Hi {first_name}, this is {my_name} from {my_company}. I know I'm calling out of the blue – can I take 30 seconds to tell you why, and you decide if we keep talking?"
- Pause and let them answer. A "yes" earns you 30 seconds.
- "I'm busy right now": "Totally fair. Is tomorrow morning or afternoon better for two minutes?" Then set the callback.
```

objections:
```
"Just send me an e-mail."
→ "Happy to. So I send something useful: is rescheduling on your radar this year, or not really?"
"We already use Excel and a shared inbox."
→ "Makes sense, most teams we talk to do. What would you change about it if you could?"
```

email:
```
Subject: Rescheduling at {company}

Hi {first_name},

I tried to reach you by phone just now. I work with heads of operations on technicians losing hours to rescheduling by phone. For example, Northgate cut no-shows by a third in 8 weeks.

Worth a 20-minute intro call to see if it's relevant for {company}? You can pick a time here: {booking_link}

Best,
{my_name}
{my_company}
{my_website}
```
