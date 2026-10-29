# Live setup: progress ring, chat scan, competitors

## Writing progress

The page listens to two documents in its own database. Write them with the Artifact tool, action `write_db`, `db_op: "set"`, on the published page's URL, collection `setup`:

- `doc_id: "progress"` – the ring. Write the whole document every time:

```json
{
  "runId": "setup-2026-10-23-1",
  "status": "running",
  "updatedAt": "2026-10-23T10:15:02Z",
  "message": "Reading your past chats…",
  "steps": [
    {"k": "stack", "label": "Your tech stack", "state": "done", "detail": "HubSpot connected (read-only import)"},
    {"k": "chats", "label": "Your past chats", "state": "running"},
    {"k": "website", "label": "Your website", "state": "pending"},
    {"k": "competitors", "label": "Competitors", "state": "pending"},
    {"k": "playbook", "label": "Playbook and call scripts", "state": "pending"}
  ]
}
```

  `state`: pending, running, done, skipped, error. `status`: running, done, error. Use the same `runId` for the whole run and a fresh `updatedAt` (UTC) on every write – after 20 minutes without an update the page shows "Setup paused". Optional `pct` (0–100) overrides the computed percentage.
  Final write: `status: "done"`, every step done or skipped, and `summary`: 3–5 short lines (e.g. "Messaging from 3 past chats", "Competitors: X, Y", "Playbook: 11 sections + call script").

- `doc_id: "seed"` – the result, in the format of `seed-format.md` (under 256 KB), with `sources` filled in. Write it just before the final progress.

Everyone the desk is shared with reads these two documents, so on a team desk every rep watches the same ring and receives the same seed. On a desk that already has leads or a finished setup, the page doesn't apply the seed silently: when the run is done, the ring offers "Apply the new setup" and saves the current version first (restorable from Versions).

One write at a time; wait for each to finish. Five to eight progress writes per run is right.

## Scanning past chats

Use the chat-history search if you have it. Good queries (a few words each): the company name, the product name, "messaging", "value proposition", "ICP", "persona", "cold call", "call script", "objection", "battlecard", "competitor", "sales playbook", "case study", "email sequence". Read the two or three best hits, around the matching part only.

Keep: value proposition, target roles and industries, problems in customer words, approved proof, objections and replies, competitor notes, scripts and templates that worked, words to avoid.
Leave out: personal topics, anything about colleagues, and prospects' personal details (names, numbers, e-mails). If two chats disagree, prefer the newer one, or the one labelled as a framework or source of truth.
In the progress detail, name chats by title only.

If there's no chat search, or the person said "skip chats", mark the step `skipped` with a short reason.

## Researching competitors

Sources in this order: the person's chats and documents, their website (comparison pages), then web search ("<company> competitors", "<category> alternatives", "<competitor> vs <company>"). Pick two to four that the person's prospects would really use. Open each competitor's home page.

Per competitor, write a block in the `competitors` playbook section:

```
CompetitorName (competitor.com)
- How they position: <their claim, paraphrased from their site>
- Where we win: <only from the person's material or website, else "[add]">
→ "<spoken, question-based reply to 'We already use CompetitorName'>"
```

Never criticise a competitor or state their weaknesses as fact on a call; the reply is a question.
