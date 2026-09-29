# Watchlist routing and cancellation

Owner approved implementation and coordinator release. Hosted action remains held during the Railway incident.

## Controlling scope

- Main/Premarket/Top Regular use existing webhook. Post-Market and dated Overnight groups use WATCHLIST_POSTMARKET_DISCORD_WEBHOOK_URL; Swings uses WATCHLIST_SWINGS_DISCORD_WEBHOOK_URL; General uses WATCHLIST_GENERAL_DISCORD_WEBHOOK_URL.
- Freeze group at publication approval; preserve images, mentions, owner/automatic wording and durable delivery identities. Old approvals retain original destination. No changes to Free Chat, gain posts, email/push or legacy price-update transport.
- Cancel analysis aborts the running request, prevents fallback and late publication, retains previous approved read and permits manual retry. Identify exact run to avoid cancelling a newer request from a stale button. Prevent automatic recreation of the cancelled request for the same published read.
- Show Cancel analysis and elapsed time for active generation. Cancellation does not promise provider refund.
- Free Chat dialog must appear in the visible parent viewport, not the middle of a tall embedded console. No automatic Free Chat send.
- Preserve the local High timeout correction. No live generation, notifications, configuration mutation or deployment during this slice.

## QA

Targeted syntax/type checks and offline tests for routing all groups, old approval default, missing webhook, no secret disclosure, duplicate/uncertain delivery behavior, cancellation before/during/after response, fallback suppression, stale-run rejection and publication preservation. Review source allowlists before local commits. Hosted acceptance remains pending deployment approval.

Progress: local implementation and focused offline verification complete; see [progress](watchlist-routing-cancellation-progress.md). Hosted acceptance remains pending. Coordinator reports owner authorized release, but hosted action is held during the Railway incident.
