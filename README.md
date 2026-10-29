# SDR Command Center Lite

A private call desk for sales development reps, set up for you. Say **"Set up my SDR call desk"** and the assistant builds a one-page desk with your company's cold-call playbook, per-lead call scripts and competitor replies – written from your past chats, your website and your competitors – and publishes it as your own private page. A progress ring on the page shows each step as it happens.

Built by [Csaba Fehér](https://www.linkedin.com/in/fehercsaba/). Optimised for Team plans: one shared company setup and playbook for the team, a private desk for every rep.

## What you get

- **Setup guide or auto-setup** – or explore a full demo desk first.
- **Lean lead list** – search, filters (including "Hide called"), lists per import, bulk actions, room for 20,000+ contacts.
- **One-click calling and logging** – outcome buttons, automatic next steps, call blocks with keyboard shortcuts.
- **Call script per person** – opener, reason, problem question, value line, two meeting slots in their local time, likely objections, competitor reply, "never say" list.
- **Playbook** – opener, pitch, discovery, objections, competitors, voicemail, follow-up e-mail, LinkedIn note.
- **Report, exports, backups, version history.**
- **HubSpot (optional)** – read-only import; call logging back to HubSpot only if you switch it on.

## How to use it

1. Add the plugin.
2. In a new chat, say: "Set up my SDR call desk – my company website is example.com."
3. Open the page link and watch it fill in. Review the setup guide, then import your leads (CSV, pasted rows or HubSpot).

Works best in the chat app, where the desk is published as a page. Where pages can't be published, the skill writes the same desk as an HTML file to open in a browser.

## What it reads, runs and sends

- **Reads, during setup:** your past chats (only if chat search is available; it says so first and you can say "skip chats"), your company website and competitor websites (web search and fetch), and – if connected – HubSpot user details and contact search (read-only).
- **Runs:** `scripts/prepare_desk.py`, a local Python script that joins the page parts and inserts your prepared setup. It has no network access.
- **Writes:** one page in your account, plus the setup progress and prepared setup in that page's own database. Nothing else.
- **The page:** stores leads, calls and notes only in your browser; loads its font from Google Fonts; opens your dialer, mail app, Gmail/Outlook, LinkedIn or booking links only when you click them. HubSpot write-back (calls and follow-up tasks) is off by default and needs your explicit consent; it is only enabled after one approved test call.
- **Never:** invents customers, numbers or claims; copies personal or unrelated details from chats; sends data to any other service.

## Privacy

The author collects no data – see `PRIVACY.md`.

## License

PolyForm Shield 1.0.0 – free to use, change and share, including inside your company; not for building a competing product. See `LICENSE`. Changes are listed in `CHANGELOG.md`.
