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
- [ ] Receive the matching runtime selector commit and perform the coordinated
  local integration/release review. No Platform push, deployment, migration or
  hosted configuration action is requested by this record.
