# Stock Levels Admin Activity Progress

**Status:** Source implementation ready for owner visual review; migration not executed

**Controlling plan:** [Stock Levels Admin Activity Plan](stock-levels-admin-activity-plan.md)

## Scope boundary

- [x] Owner approved a private `/admin/journal/levels` view for today's
  successful Levels generations and user totals.
- [x] Owner chose three-day activity retention and declined map-history,
  ticker-history and all-time reporting for this checkpoint.
- [x] Existing Journal Administration authorization is the only access
  boundary; the future `/admin/dashboard` rename is deferred.
- [x] Register, but do not execute, migration `0091_platform_stock_levels_activity`.
- [x] Record a successful map generation and prune expired activity rows.
- [x] Add the private owner read model, navigation item and page.
- [ ] Complete source/diff-only checks and request owner visual review.

## Constraints

Only a successful `/levels` map response is counted. Fresh and cache-served
maps are both counted once. Unavailable results are never counted. Existing
quota receipts remain quota-only, and no activity record stores a ticker, map,
level, quote, provider result or user content.
