# Routing/cancellation progress

Local implementation and focused offline verification complete. Hosted release and browser acceptance pending; no test notification or paid generation performed.

## Changes

- Approved analysis and listing-only Discord posts snapshot Watchlist group at approval. Main/Top Regular/legacy unknown stay on existing destination; Post-Market and dated Overnight groups use WATCHLIST_POSTMARKET_DISCORD_WEBHOOK_URL; Swings and General use WATCHLIST_SWINGS_DISCORD_WEBHOOK_URL and WATCHLIST_GENERAL_DISCORD_WEBHOOK_URL respectively. No webhook values stored in source or approval records.
- Gateway validates the webhook origin and server, discovers destination channel from webhook metadata, caches a channel-specific gateway, and retains existing images, mentions and durable receipts. Old approvals without a routing group retain original destination. Missing or invalid destination fails before posting; it never silently posts to the old channel. Separate Free Chat/potential-gain/email/push paths untouched.
- Active generation exposes exact run identity and elapsed time; owner-authorized Cancel analysis aborts transport, suppresses fallback, guards late publication, preserves previous publication and allows manual retry. Same published boundary is suppressed in memory after cancellation until manual/activation or a new published read. This suppression is not persisted across a runtime restart. Cancellation cannot refund provider work or guarantee provider-side processing stops.
- Free Chat dialog positions inside the parent viewport intersection and tracks scroll/resize. Opening dialog never sends a post.
- Local High-effort timeout commit remains the Runtime parent: High/Extra High ten minutes; lower efforts and explicit overrides unchanged.

## Verification

`node src/scripts/verify-watchlist-routing-cancel.cjs` passes scoped TS/TSX syntax, all routing categories and legacy default, gateway reuse, missing/untrusted URLs without transport, cancellation before dispatch and during transport, stale run rejection, no fallback/publication after cancellation, generated browser-script syntax, and retained owner authorization. All transport calls are mocks. Isolated-index diff checks passed.

No full build, full TypeScript check, real paid request, live send, or browser visual acceptance claimed. Watchlist Help now documents cancellation, provider charging limitations and category routing. Release requires Platform cancellation proxy before Runtime UI, and all three pending Runtime webhook variables. Coordinator reports owner lifted release hold; Railway incident hold still applies.
