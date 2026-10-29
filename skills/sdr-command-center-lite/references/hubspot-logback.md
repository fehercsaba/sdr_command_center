# Logging the desk's calls back to HubSpot

The page never writes to HubSpot. You do it in chat, carefully, when the person asks.

1. Get the page's call log: More → Export call log (columns: Date, Time, Outcome, Conversation, First name, Last name, Company, E-mail, Phone, CRM record ID, Next step). Use only the rows for the dates they name.
2. Check write access with the HubSpot connector's user-details tool before proposing anything. If writing isn't available, say so and stop.
3. Match each row to a contact: by CRM record ID first, else by e-mail. List rows you can't match; don't guess.
4. Before proposing a write, look for an existing call or note on that contact at the same date and time with the same outcome. If one exists, skip that row – duplicates are the main risk here.
5. Show the planned changes in one table (contact, what will be logged, follow-up task date) and wait for explicit approval. Follow the connector's own confirmation rules and batch limits.
6. Write in small batches. If a write times out or returns an unclear error, re-read the contact's activity before trying again – never retry blindly.
7. Report what was written, what was skipped and why.
