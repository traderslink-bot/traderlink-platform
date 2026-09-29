# Free Chat analysis sharing

Owner-approved scope and copy:
- Unchecked `Also post to Free Chat` beside initial and refreshed analysis approval.
- `Post to Free Chat` on an already published ticker; Free Chat only, no duplicate Watchlist/email/push.
- Per-ticker/cycle `Automatically post analysis updates to Free Chat`, Off by default; only subsequently approved automatic publications, never draft generation or manual refresh alone.
- `Free $SYMBOL TradersLink Analysis` for original analysis; `Free $SYMBOL TradersLink Analysis — Updated` for later analyses. Always @everyone, approved image(s), existing ticker and Watchlist links. Original analysis time preserved.
- Show Free Chat send state and sent time. Distinct configured webhook WATCHLIST_FREE_CHAT_DISCORD_WEBHOOK_URL, expected channel1433570741068234795. Never use potential-gain webhook.

Implementation contract:
1. Platform migration0149 reserves cycle-scoped opt-in + version-bound intent/receipt tables. No history backfill, no auto-send on enable, no silent resends. Owner intent stored independently of normal publication.
2. Runtime authenticated export returns only website-acknowledged approved revision and its cached analysis images; never draft or editable current text. Explicit revision remains fixed during delivery.
3. Existing Platform worker checks selected approval intents and future automatic publications; bounded processing, no extra polling service. Per-destination durable claim and response acknowledgment. Confirmed429 observes retry time; unknown outcome stays uncertain to prevent duplicate @everyone.
4. Owner-only Free Chat endpoint controls opt-in, explicit delayed post, status and retry. UI approval checkbox passes a separate intent; failure cannot veto main approval. Row controls also remain available after publication.
5. Help and progress kept aligned. Focused fixtures at completed slice, no broad tests/local server or real Discord sends. Coordinator handles exact-parent integration and production release only after owner authority.

QA decisions: selection bound to cycle/draft so a later refresh cannot inherit one-time opt-in; automatic opt-in has enable time to avoid sending previous events. Off cancels queued automatic sends. Removed/re-added tickers do not inherit preferences. Dedicated endpoint authorizes owner and mutation CSRF; webhook channel verified before sending; secret never returned. Reject incomplete/mismatched approved export, not the owner's ordinary publication. Manual delayed sends require a published analysis, not just a listed ticker. No image generation by OpenAI; use existing renderer/cache.

Progress: [watchlist-free-chat-progress.md](watchlist-free-chat-progress.md).
