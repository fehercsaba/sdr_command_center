# HubSpot write-back from the page

What the page does when write-back is on (Setup → Your tech stack → HubSpot):
- Each logged call becomes a HubSpot **call** on the contact: title "Call – <outcome>", notes with outcome, next step and the rep's notes, outbound, completed, owned by the rep. The outcome field itself isn't set, because its values differ per HubSpot account.
- Optional: a **follow-up task** for callbacks and retries, due at the next step. Tasks only accompany calls logged after the switch; old leads are never back-filled.
- Only leads linked to a HubSpot contact are logged: the record ID from a HubSpot import, or a match by e-mail (exactly one contact) when that option is on.
- Timing: about a minute after each call (so Undo still works) or only on "Sync now".
- Safety: one state per call (waiting → sending → logged / to check / not logged). Nothing is sent twice. Timeouts are never resent automatically; "Check HubSpot" searches for the call first. A send interrupted by closing the page becomes "to check". Approval or connection problems keep calls waiting.

## Before you declare the write tool

1. With the HubSpot user-details tool (include tool information), check that **calls** (and **tasks**, if they want tasks) are writable. If not, stop and explain.
2. Ask the person which contact to use for one test call, and show exactly what will be created (object, contact, title, notes, time). Wait for a clear yes.
3. Create that one call with `manage_crm_objects` (`createRequest`, `objectType: "calls"`, properties `hs_timestamp`, `hs_call_title`, `hs_call_body`, `hs_call_direction: "OUTBOUND"`, `hs_call_status: "COMPLETED"`, `hubspot_owner_id`, association to the contact with `targetObjectType: "contacts"`). Look at the real response.
4. Then publish with `manage_crm_objects` in the page's HubSpot tools. Tell the person the setting is still Off and where to switch it on.

Never switch write-back on for them, and never declare the write tool on a public hand-out.
