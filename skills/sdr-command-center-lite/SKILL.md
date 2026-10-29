---
name: sdr-command-center-lite
description: Sets up an SDR call desk ("SDR Command Center Lite", optimised for Team plans – one shared setup, a private desk per rep) and fills it automatically – it reads the person's past chats for messaging, their website and their competitors, then writes a cold-call playbook, competitor replies and per-lead call scripts while the page shows live progress. The desk has a lean lead list, one-click calling and logging, call blocks, follow-up e-mails and a report, and runs privately in the person's browser. Use this whenever someone wants an SDR command center, call desk, cold-calling workspace, call list or dialer list, call scripts or a call-script generator, power-hour or call-block tool, or wants to turn a CSV or HubSpot contacts into a call list with a script – even if they never say "command center". Also use it to update that desk's playbook, competitors or company setup, to re-run its setup, and to log the desk's call export back into HubSpot.
metadata:
  version: "1.8.0"
  author: "Csaba Fehér – https://www.linkedin.com/in/fehercsaba/"
---

# SDR Command Center Lite

Created by Csaba Fehér – https://www.linkedin.com/in/fehercsaba/. Version 1.8.0. Optimised for Team plans. Keep the credit line and version number that are in the page.

The page in `assets/page/` (readable parts, joined by `scripts/prepare_desk.py`) is finished and tested. You prepare it for one person and publish it. Never edit its code or styling: everything personal travels as a **seed** (company setup, playbook, competitors, call-script building blocks).

## How people reach you

The page's first screen offers **Set it up for me**, which hands the person this prompt to paste into a chat: "Set up my SDR call desk with the SDR Command Center Lite skill – my company website is … Read my past chats and website, research my competitors, and fill in … the desk." The same entry sits in the messaging step and in the Setup hub. When the prompt mentions a desk they "already have open", work on that existing desk (find it with the Artifact tool's `list`) instead of publishing a new one.

The page also has a **demo mode** (a separate fictional desk). It never mixes with the real desk, so ignore it: your seed always goes to the real desk, and the page applies it when the person leaves the demo.

## The experience to aim for

The person says something like "set up my call desk". You publish the page within the first minute, tell them to open it, and they watch a progress ring fill while you work: tech stack → past chats → website → competitors → playbook and call scripts. When it reaches 100 %, their desk is ready with everything pre-filled; they review it and import leads. Ask as little as possible – find it instead.

## Workflow

### 1. Start (one short message, then act)

Say in one or two sentences what you're about to do: publish their desk, look through their past chats for sales messaging, read their website, research competitors, and write the playbook – and that they can watch it on the page. Offer one opt-out ("say 'skip chats' if you'd rather I didn't look at past chats"). Don't wait for a reply unless something essential is missing.

Essential: company name and website. Take them from the conversation, memory, or a quick past-chat search. Ask only if you still can't find them – one question.

### 2. Check HubSpot (seconds)

If a HubSpot connector is among your tools, call its user-details tool once (read-only). Success means the page gets "Import → From HubSpot".

**Write-back is opt-in.** The page can log each call to HubSpot (and optionally create follow-up tasks), but only when (a) the person asks for it, and (b) the page was published with the write tool. Before declaring it, follow `references/hubspot-writeback.md`: check write access, then log **one** test call with the person's explicit approval on a contact they choose, and look at the real response. Only then add `manage_crm_objects` to the page's HubSpot tools. Even then the setting stays **Off** until the person switches it on in the page.

### 3. Publish the page now

If you already know name/company/website, write a small seed and run `python scripts/prepare_desk.py seed.json <outputs>/sdr-command-center-lite.html`; otherwise build the plain page with `python scripts/prepare_desk.py - <outputs>/sdr-command-center-lite.html`. Publish it (artifact) with these capabilities:

- Base: `{"downloads": true, "sample": {}, "user": {}, "db": {"rules": [{"path": "", "write": "admin"}]}}` – `user` gives every account its own private desk; the rule lets everyone the desk is shared with read the company setup while only the owner (and editors) can change it.
- Add when HubSpot answered in step 2: `"mcp": {"servers": [{"server": "HubSpot", "tools": ["get_user_details", "search_crm_objects"]}]}` (use the connector's exact display name). Add `"manage_crm_objects"` to that list only after the approved test write described in `references/hubspot-writeback.md`.

Tell them: "Open it – it updates as I go." A page with HubSpot can only be shared inside their organisation; without, by link.

If you can't publish pages or the page database isn't available, skip the live ring: do steps 5–8 first, build the page with the seed embedded (prepare_desk.py), and present or publish it at the end.

### 4. Report progress after every step

Follow `references/live-setup.md`: write the `setup/progress` document with the Artifact tool's `write_db` (one write per step, a short human `detail` for each). The ring moves with each write.

### 5. Past chats (if you have chat-history search)

Search for sales messaging and read the two or three most relevant chats – see `references/live-setup.md` for queries and privacy rules. Keep only selling context (value proposition, ICP, problems, proof, objections, competitors, scripts, e-mail templates). Name the chats you used, by title only.

### 6. Website

Read the home page plus one or two product, pricing or customer pages. Pull out what they sell (one line), the problem in the customer's words, proof (real named customers or results on the site), and what prospects use today instead.

### 7. Competitors

Find two to four real competitors (from chats, the website, then web search). For each: how they position themselves (their own site), where this company wins (only from the person's material or website – otherwise write "[add]"), and a question-based reply to "We already use [competitor]". Never criticise a competitor or claim facts you can't source.

### 8. Write and deliver

Write the playbook (11 sections) and the call-script building blocks per `references/playbook-guide.md`, then write the seed to the `setup/seed` document (format: `references/seed-format.md`, including `sources`: chat titles, website pages, competitors, files the person shared) and the final progress with `status: "done"` and a `summary`. A fresh desk applies the seed by itself; an existing desk offers "Apply the new setup" on the ring and saves its current version first.

### 9. Hand over in chat – briefly

Three or four lines: what was pre-filled and from where (chats by title, website, competitors by name), the opener, and one competitor reply. Ask if anything should change; if so, write an updated seed with a new `seedId`. Mention: data stays in their browser, "Back up now" weekly, and you can log calls back to HubSpot later.

## Team use (Team and Enterprise plans)

This is the setup the desk is built for: **one shared company setup, a private desk for every rep.**

1. **Share the skill** with the organisation (Customize → Skills → the skill → Share → Entire organisation), if the organisation's owner has turned skill sharing on. Otherwise each person uploads the ZIP.
2. **The team lead runs the setup once** (this workflow) and shares the desk from the share menu with the team or the whole organisation. Viewer access is enough.
3. **Each rep opens the same link from their own account.** They get the team's company setup, playbook, competitors and call scripts automatically, and an empty desk of their own: their leads, calls, notes, imported files and versions are stored per account in their own browser – nobody else sees them, not even in the same browser.
4. **Each rep's tools stay their own:** the HubSpot import uses their own HubSpot connection ("contacts I own" means theirs), and AI writing uses their own allowance.
5. **Updates:** when the lead re-runs the setup on the same desk, every rep sees the progress ring and an "Apply the new setup" button; their leads stay, and their previous version is saved.

What's shared vs private:

| Shared with everyone the desk is shared with | Private to each account |
|---|---|
| Company setup, playbook, competitors, call-script building blocks, the progress ring | Leads, lists, calls, notes, imported files, setup history, personal edits |

There is no shared lead list or manager dashboard in the Lite version. For team numbers, reps export their call log or you log it to HubSpot (`references/hubspot-logback.md`). A desk with HubSpot can only be shared inside the organisation; that's the normal Team case.

## Later requests

- **Re-run the setup** ("re-run my call desk setup", or the prompt the page's Setup hub gives them): find their existing desk with the Artifact tool's `list` (title "SDR Command Center Lite") – don't publish a new one unless they ask. Use a new `runId` and `seedId`, then follow steps 4–9 on that page. The ring appears again on their open page and ends with "Apply the new setup".
- **Update messaging/competitors:** new seed with a new `seedId` → `setup/seed` (or rebuild and republish when there's no page database). Leads and call history are never touched.
- **What the person can do alone:** the Setup hub (Setup button) shows every answer, the sources of the prepared setup, and their imported files (originals downloadable). It can re-apply the prepared setup, start setup from scratch, or reset everything. The small version number in the footer opens Versions: what's new and an automatic history of setup, playbook and call-script versions with restore. Point them there instead of redoing things by hand.
- **Log calls to HubSpot:** follow `references/hubspot-logback.md`.

## Guardrails

- Only the seed changes; keep the page code, styling and credit.
- Nothing invented: proof and "where we win" come from the person's material or website, or stay "[add]".
- From past chats, take only selling context. No personal topics, and no prospects' personal details in the playbook.
- HubSpot writes happen only with the person's approval: from the page when they switched write-back on, or by you in chat.
