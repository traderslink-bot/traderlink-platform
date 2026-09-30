# Watchlist removal and support retirement

Owner-approved scope: removing a ticker, clearing a category, or clearing all lists deletes the associated original and updated Discord Watchlist messages. A default-on setting, **Delete Discord posts when removing tickers**, lives in Discord notifications. Off retains messages. Free Chat, potential-gain, X, other channels' messages and other tickers are unchanged. Never clear a whole channel to implement ticker removal.

Use acknowledged review receipts with exact channel/message identities. Persist pending deletions, process sequentially with bounded requests, and expose pending/failure status in Discord notifications. Removal remains independent of Discord availability. Do not invent receipts for old untracked messages. Settings read failure must not trigger deletion. No real deletion during tests.

Remove the dashboard Crisp button, launcher and SDK dependency, without changing Help, notifications or Account controls. No external Crisp account deletion.

QA: setting On/Off and unreadable settings; exact receipt deduplication; updates and moved categories; missing receipts; deleted-message idempotency; network/permission/rate-limit failures; restart; independent removal; absence of Crisp imports/dependency. Focused offline checks only; no local server or broad build. Coordinator owns deployment and hosted compilation.

Progress: [implementation](watchlist-discord-removal-progress.md).
