# Private Watchlist progress

Plan: [owner-approved contract](watchlist-private-category-plan.md).

## October 4, 2026 — scope and integration trace

- Owner requested combining with the undeployed Premium controls where safe; no new deployment instruction.
- Confirmed existing category implementation spans Runtime monitoring types/store/persistence/session parsing, Runtime admin page/server, Runtime publisher, and Platform session/store/types/UI contracts.
- Confirmed publication and category moves live in Runtime and already have pending editable-post work. A Platform-only category or blur would not satisfy owner-only privacy or outbound suppression.
- Read pending Premium checkpoint packaging and existing category/post packaging. Preserved all unrelated dirty files and checkpoint commits.
- Sent coordinator the exact pending Premium SHA and requested current Runtime parent/overlap status before constructing a combined source package.
- Implementation not yet complete. No source behavior changed, no tests run, no AI requests, notifications, migration application, push or deployment.

## Remaining

- Resolve coordinated parents; implement complete category/publication/access slice.
- Focused verification, Help changes and narrow source checkpoint.
- Integrated release acceptance and deployment remain separate.

## Coordinator confirmation and publication trace

- Coordinator independently confirmed the pending Premium checkpoint, exact38-file cumulative allowlist, clean diff, broader0155 registration after0154, and no hosted application/deployment. It can be the Platform source parent for the extension.
- Runtime deployed parent remains692251c850abb8b7f9cf95dfc497523cfd5664c4. Preserve pending editable-text childd10aeb996219fca02d4e607ede2eb696b79595be as the Runtime source parent; it overlaps category move service/state, manager, review API and row/page UI. No live deployment lane granted.
- Runtime already has `preparePrivateActivation`, but this means an unpublished approval draft, not an owner-only category. Reuse its review storage/analysis preparation, never mistake that helper alone for complete Private support.
- Runtime's publication authorizer is used by website publishing and the Discord router, but explicit approved-delivery/free/X/gain/retry paths still require a full trace. Moving an existing public ticker currently emits a live status patch and retains the public review cycle; Private transitions cannot simply reuse that path unchanged.
- Work remains IN PROGRESS: plan/integration trace only, no Private feature behavior implemented or tested yet. Next.js skill reviewed for server-side route/access boundaries.

## Source implementation checkpoint

- Implemented exact-parent overlays in `src/scripts/package-watchlist-private.cjs`, preserving the pending Premium and Runtime editable-post parents rather than modifying their mixed checkouts.
- Private add/move/clear controls, persisted category contracts, private draft preparation, and hidden member-post controls. Notes and analysis editing remain available.
- Platform filters Private tickers from free/Premium list and stream payloads, blocks detail/history/indicator reads, and excludes private archives. Private access uses actual Journal owner authorization, not Premium entitlement.
- Runtime blocks explicit website/Discord approval and analysis export while Private. X, free-channel, gain, email/push and queued category-notification paths also check Private state. Publication authorizers prevent queued ordinary runtime patches from publishing Private entries.
- Private-to-public owner moves use the ordinary analysis approval or notes-only listing path, normal first-add notifications, and public publication time. Notify off is respected. No private-origin text or edited move caption is forwarded.
- Moving an already public ticker into Private starts a fresh unpublished review with its saved draft and retains the previous review ancestry for eventual configured post deletion. Existing external posts are not automatically recalled.
- No additional SQL migration: category uses existing persisted JSON. The pending Premium0155 migration remains unchanged.
- Focused checks PASS: all candidate TS/TSX syntax; evaluated owner/Premium/free/fail-closed projections; actual Runtime publication authorization method; actual Platform promotion route for analysis/no-analysis and notify on/off; embedded admin JavaScript syntax; bounded strict category-contract TypeScript check for both repositories.
- Help updated in the candidate. Next.js guidance informed server-side rather than CSS-only privacy.
- Status: SOURCE IMPLEMENTED / INTEGRATED ACCEPTANCE PENDING. No full build, rendered browser/device acceptance, hosted data changes, provider calls, notifications, push or deployment performed. Coordinator must run integrated build and hosted acceptance before release; focused checks do not establish live end-to-end delivery.
- Deployment order: Platform before Runtime. Older Runtime does not recognize `private`; do not roll back category parsing with persisted Private entries without a deliberate compatibility plan. In-flight external requests already sent before a move cannot be recalled.

## Pre-release QA corrections — October 4, 2026

- Coordinator confirmed the original Private checkpoints remain undeployed and authorized correction of the two reproduced transition defects only.
- Public-to-Private now awaits the website concealment acknowledgement before creating or attaching a new review cycle or persisting the Private category. A failed publication preserves the original category and review. A timeout can still mean the website accepted concealment without returning its acknowledgement; in that case the website stays hidden and a retry safely repeats concealment. No automatic public rollback is attempted.
- A temporary per-symbol transition guard permits only the exact concealment marker, blocks concurrent category moves and ordinary publication while awaiting acknowledgement, and prevents a failed queued marker from replaying later against a public entry.
- Existing-active activation requests involving Private use the same deliberate move path. Re-selecting Private is a no-op. Leaving Private retains the unapproved review until normal owner publication.
- Regression command: `node --max-old-space-size=384 src/scripts/verify-watchlist-private-transition-fix.cjs`. PASS actual extracted move/activation/authorization methods for success, publication rejection, unchanged old review on failure, copied draft after acknowledgement, stale/reloaded marker denial, repeated Private selection, public transition remaining unapproved, and concurrent move exclusion.
- No new migration, changed UI, provider calls, posts or deployment. Platform application source is unchanged; its child checkpoint records this correction and reproducible scripts. Runtime child changes only the manager. Integrated build and hosted acceptance remain coordinator responsibilities.
