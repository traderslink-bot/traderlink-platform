# Daily Watchlist Recaps Implementation Progress

**Status:** Implementation started 2026-09-08

**Plan:** [Daily Watchlist Recaps Plan](watchlist-daily-recaps-plan.md)

## Completed discovery

- [x] Recovered the owner-approved product contract and its factual-evidence,
  editing, retention, idempotency, and Discord boundaries.
- [x] Confirmed the existing Platform `/api/live-watchlist/recap` source only
  returns a top-three, greater-than-5% summary and cannot power the approved
  workflow.
- [x] Confirmed the current runtime `DailyWatchlistRecapService` automatically
  posts through a server-only webhook in a 3:55 PM ET window. It remains
  unchanged until the reviewed replacement is active and verified.
- [x] Confirmed Admin Watchlist is Platform-owned around an authenticated
  runtime iframe; Daily Recaps belongs beside Usage in the parent Platform UI.
- [x] Recorded the owner-provided private Discord channel as a server-side test
  destination only. Its identifier is not stored in source, browser state, or
  this document.
- [x] Added the first pure deterministic draft generator. It uses only the
  Watchlist posted price/time and later accepted prices supplied as immutable
  evidence, rejects observations that predate the post, and never implies a
  member trade or exit.
- [x] Focused deterministic-draft check: 3 passed, 0 failed.

## Current implementation gate

- [x] Prepared `0122_platform_watchlist_daily_recaps` against the verified
  current-main high-water mark of `0121`. It is intentionally not yet added to
  this stale worktree's manifest; reconciliation onto the current release
  parent must register it before any migration can apply.
- [ ] Add durable candidate/evidence/revision/composition storage to the
  current Platform manifest and repository service layer.
- [ ] Capture activation, price, AI Read, Potential Path, and removal-freeze
  evidence without modifying member-facing Watchlist behavior.
- [ ] Add deterministic generation and the protected owner API surface.
- [ ] Present the approved Daily Recaps Admin section for owner visual review.
- [ ] Add the runtime's reviewed-post/idempotency boundary and verify it only
  against the private test destination.
- [ ] Retire the old automatic recap service in the coordinated replacement
  release after end-to-end verification.

## Non-negotiable release boundary

No current change sends a Discord message, changes a webhook or destination,
starts a scheduler, disables the existing scheduler, applies a migration,
pushes, or deploys.
