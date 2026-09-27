# Potential gain card Discord posts

Owner approved the per-ticker action, image preview, optional message and explicit send. Progress: [implementation record](watchlist-potential-gain-discord-progress.md).

## Complete scope

1. Add **Post potential gain** to every ticker's Watchlist Admin controls, independent of AI generation/review mode.
2. Owner-only dialog **SYMBOL — Post potential gain** loads the published ticker and reuses its actual PotentialGainCard. Preserve values, formatting, styles and tracking note. Add ticker identification and traderslink.pro outside the card for image context.
3. Produce a fixed PNG in the browser from the rendered card, then show that exact image in the preview. No local/server browser process, AI request or live-price polling. The image freezes the values displayed when the preview is made.
4. **Message (optional)**, **Send to Discord**, **Close**. Editing the message does not change the image. Explicit send only; no automatic posts or member email/push. Display success only after Discord acknowledges a message.
5. Dedicated server-only webhook variable WATCHLIST_POTENTIAL_GAIN_DISCORD_WEBHOOK_URL, validate channel1433570741068234795. Never expose/commit/log credentials. Do not alter existing Watchlist or owner-review webhook configuration.
6. Authenticate owner on read/send; preserve existing origin/admin request checks. Validate symbol, PNG dimensions/size, message length and idempotency identity. No mentions automatically; owner text retained but allowed_mentions empty.
7. Durable receipt per send ID prevents double clicks/retries from posting twice. Explicit Discord429 can retry after the stated delay; transport timeout/5xx is uncertain and advises checking channel first, never blind automatic resend. Errors never affect analysis/listing approval.
8. Missing published ticker/gain shows a clear preview-unavailable state, not invented data. Public visibility toggle and public card remain unchanged. Hidden public gain cards may still be explicitly posted by owner.
9. Help updated; narrow commits/artifacts only. No schema application/config/deployment or live Discord test without coordinated release approval.

## QA review before implementation

- Snapshot remains frozen between preview and send; do not recapture a changed live price at send.
- Row button must precede AI-review-only early return so notes-only tickers also work.
- Close/change ticker cancels stale preview results; pending send disables duplicate actions.
- Server must not trust client ownership, webhook URL or destination channel.
- Reuse the visible component, not a second approximation of gain calculations.
- Preview is owner-visible acceptance surface; hosted visual acceptance remains pending until available.
