# Reverse-split implementation progress

Controlling [plan](reverse-split-discord-plan.md). Status: implementation active, not deployed.

- Owner approved nightly 19:00 Eastern posts, Sunday weekly overview, shareholder approvals, float (not shares outstanding), ratio, effective date and regular-session close.
- Coordinator assigned existing `release-workspace-boundary-4e22`, branch `codex/reverse-split-discord-20260924`, clean parent `e938e82a86a7305e33fae45c812cebd212f5d50e`. Paused Welcome in cdb0 is untouched.
- Coordinator reserved News migration 0142; exclude paused 0141 from this branch.
- Direct source/data preflight succeeded. No production operation, migration, message, test runner, server or installation performed.
- Channel ID and EODHD commercial data-use confirmation outstanding.
- Source/parser, storage, scheduler, delivery and verification are not yet complete.
- Owner expanded the intended product to a dedicated paginated dashboard containing the full tracked list and shareholder-approved unscheduled splits. Discord, Push and email will summarize upcoming splits and link back to the page. Dashboard layout approval and shared-path coordination are required before that new implementation scope.
- Automatic shareholder-approval processing must not depend on owner filing review. Current conservative parsing is not yet accepted as sufficient for that requirement.
- Reverse splits remain first priority. Dilution alerts are deferred until a separate planning discussion with the owner.
- Owner added Watchlist integration: show known approval/announced split status when a ticker is posted and expose the full available reverse-split information on its detailed ticker page. Both consume the same current event records; no independent scraper or extra posting-triggered alert. Scope recorded only; Watchlist code and UI remain unchanged pending shared-path coordination and owner layout review.
- Owner clarified Watchlist copy: show only "Reverse split approved" or "Reverse split announced" when verified; never display "not scheduled". Approval can be shown without a scheduled date. Show no label if neither approval nor announcement is verified. This supersedes the earlier proposed approved/unscheduled label; implementation is still pending.

## Local source checkpoint after owner Proceed

- Added shareholder-approval extraction separate from selected ratios and split-adjusted trading dates; retained unknown approval dates as unknown, added announced-without-trading-date state, authorization expiry extraction and deferred conflict outcomes. These conservative rules still require representative filing validation and automated related-document fallback; they are not a claim of complete approval coverage.
- Added shared ticker resolution, positive-only Watchlist status projection and deterministic pagination/filter primitives. Repeated old approvals do not intentionally downgrade confirmed terms; conflicting same-day terms are surfaced separately. No actual Watchlist or dashboard component changed.
- Nightly selection now excludes approval-only records; message construction links to the configured dashboard and removes not-scheduled wording. The final dashboard route and message layout remain unapproved/unwired.
- Authored reserved migration 0142 and a source repository with compressed documents, source/version deduplication, fenced leases, delayed retries, current observations, coverage counts and durable runtime checkpoints. Migration not registered or executed. Discord delivery table exists only in migration source; its sender is not implemented.
- Added bounded acquisition methods for Nasdaq, rolling recent SEC discovery, seven-day-window one-year backfill, and one-source processing, with a persisted request budget. No hosted worker registration and no runtime ingestion performed.
- Split ingestion enablement from Discord delivery configuration. No environment variables were changed. EODHD float/close acquisition retains the previously verified endpoint strategy.
- Authored focused parsing, status, conflict, date/ratio and pagination cases. Did not execute Vitest or any test suite, per owner policy. A narrowly scoped TypeScript compiler check covered 12 local TypeScript files including the authored cases and migration, with zero diagnostics; no emit, build, dependency install, database operation or local server.
- Owner layout approval requested: ticker search, paginated table, All / Approved / Announced / History filters, factual columns and positive-only Watchlist status. Next work: approval/correction coverage proof, complete event/history/freshness contract, scheduler/delivery and expanded UI/shared-service allowlist after review. Push/email preferences and delivery integration are not implemented.
