# Official watchlist render correction — October 2

Status: source corrected; staging verification pending.

Full QA found that a published official watchlist detail page crashed for its
owner. Coordinator confirmed the staging RSC serialization error. The server page
passed Next Link as the MUI Button component prop. Replace that function prop with
the native anchor string and retain the same href, icon, label and styling. No
data, permission, publishing or layout changes are included.

Allowlist: this record and
`app/(dashboard)/communities/[communitySlug]/server-watchlists/[watchlistId]/page.tsx`.
Targeted ESLint and git diff --check pass. No resource-heavy local build was run.
Help documentation needs no change: this restores an existing navigation behavior.
Coordinator owns clean integration on staging parent 9d5d1be839e624377c960b7d0a64f725ac0879ad.
Production is not in scope. After deployment, verify owner detail/edit/back-link
and member permission handling against the already published synthetic watchlist.

## Delivery blockers found in the same QA run

The existing sender ignored publishing mode and had no hosted automatic caller.
Add a bounded five-message, 15-second worker using the existing hosted startup,
shared overlap guard with authenticated cron, persistent atomic row claims and
database close in finally. Only active communities/destinations are eligible.
Tracked pages send title/link, never their private body. Full Discord posts carry
alert content or official watchlist notes/symbols without requiring a web visit.
All messages continue suppressing mentions. A configurable
`TRADERLINK_COMMUNITY_DELIVERY_NOT_BEFORE_UTC` cutoff leaves historical rows intact.
Coordinator must set that cutoff to activation time before deploying staging, so
the previously queued synthetic records are not replayed. Fresh synthetic records
after activation will prove automatic delivery. No public/production activation.

Focused in-memory delivery verifier passes both modes for both content types,
channel/link correctness, persisted receipts, no replay and historical cutoff.
Targeted ESLint passes (canonical config/dependencies used from feature worktree).
Full runtime build and post-deploy browser/message proof remain pending.

Additional allowlist: delivery service, new community-discord-delivery-runtime,
hosted-background-workers, community-discord-delivery cron route, delivery verifier.
