# Potential gain Discord progress

Plan: [approved scope and QA](watchlist-potential-gain-discord-plan.md).

- Traced public PotentialGainCard, authenticated runtime iframe messaging and existing owner authorization.
- Existing analysis images are independently rendered; this feature instead captures the actual card in the browser to preserve appearance without adding a server screenshot process.
- Local implementation complete. No messages sent, no secrets stored in source, no live settings/deployment changed.
- Separate from the automatic-refresh/owner-attribution release already handed to Coordinator.
- Per-ticker button precedes the AI-review-only return, so notes-only tickers have the action. Owner dialog reuses actual PotentialGainCard and Academy theme, captures frozen PNG, and posts exact preview bytes with optional message.
- Owner-only GET/POST, existing mutation-origin check, bounded body/image/message input, dedicated channel verification, durable per-send receipt and explicit Discord retry-after handling. No automatic retry after uncertain delivery; no AI, live market-data requests or existing notification changes.
- Coordinator reserved0147_watchlist_potential_gain_posts, portable147, unapplied. One new table stores receipts only, not image blobs or webhook credentials.
- Focused offline verifier PASS: persistence/dedupe, message/image binding,429 wait/retry, transport/502 uncertain non-resend, wrong channel, credential URL allowlist, input bounds, owner/mutation rejection, missing ticker, migration SQL and changed TSX transpilation. No real network calls or Discord posts.
- Packaged four existing-file edits against immutable a741710f53503339b7df1882b472b00f8c0f56cb. Patch SHA256 FEF902D16BA759AE90A33D76E6C2C654B570D88ACD685149B589A74BADC9EB0F. Apply with deliberate reconciliation after0146; do not copy mixed existing local source files.
- Remaining acceptance: integrated semantic TypeScript/build; actual desktop/mobile PNG rendering and owner visual review; final guarded migration/configuration/release; controlled Discord receipt. Do not call this deployed or visually accepted. No local app server or browser was launched.
- Next.js/React guidance applied to owner-only routes, lazy-loaded dialog, direct component imports, stale-request handling and image object-URL cleanup. Help text included in patch.
- Owner addition: every potential gain Discord post tags @everyone. Sender appends it after the optional message, or sends it alone with the image when no message is entered; Discord allowed_mentions explicitly enables everyone. Focused fixtures cover both cases. Other notifications and webhook destinations are unchanged. No real mention/test post sent.
