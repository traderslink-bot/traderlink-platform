# Watchlist AI News Source Policy Progress

**Status:** In progress

**Controlling plan:** [Watchlist AI News Source Policy Plan](watchlist-ai-news-source-policy-plan.md)

## Confirmed cause

- The authenticated News publisher persists canonical processed articles but
  did not hand a selected article to the separate Watchlist AI runtime.
- The Watchlist ingest route only receives completed runtime cards; it cannot
  choose AI article inputs.

## Current checkpoint

- [x] Define the owner-approved authenticated Platform article-selection
  contract and exact authenticated fallback boundary.
- [x] Add Platform's bounded canonical lookup and protected route.
- [x] Add focused current-day and older-within-window source-selection
  coverage without executing Vitest during this checkpoint.
- [x] Suppress Stock Titan display text, links and source rows in the
  member-facing Watchlist renderer.
- [x] Complete the matching runtime selector locally: each AI Read now asks
  Platform for the canonical processed article, sends its full processed text
  to the AI packet, and permits the external title-only fallback only after
  Platform returns `404 no_eligible_article`.
- [ ] Perform the coordinated local integration/release review. No Platform
  push, deployment, migration or hosted configuration action is requested by
  this record.
