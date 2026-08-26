# Watchlist Runtime Dashboard Admin Progress

**Status:** In progress

**Controlling plan:** [Watchlist Runtime Dashboard Admin Plan](watchlist-runtime-dashboard-admin-plan.md)

## Completed

- [x] Confirmed the existing Watchlist runtime has the required status,
  provider, AI Read, live-website and deterministic Day Trade Adapter endpoints.
- [x] Confirmed the member-facing Watchlist route family is out of scope.
- [x] Confirmed the existing two-owner stable Discord-subject access predicate
  is the correct authorization boundary.

## In progress

- [x] Add the protected Dashboard route, navigation entry and private Platform
  runtime bridge.
- [x] Add the approved sections and live summaries, including publishing state
  and market-data freshness.
- [x] Run focused ESLint for the new route, client, bridge and navigation
  record, plus `git diff --check`.
- [ ] Prepare the Railway staging-review handoff after the private runtime URL
  and token are configured in that environment.

## Release boundary

No runtime restart, hosted configuration update, deployment, migration, or
publisher change is part of implementation. Before staging review, configure
the private runtime URL and token only in the relevant Railway environment.
They must never be committed or exposed to the browser.
