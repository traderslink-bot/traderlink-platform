# Entry Price Results Progress

**Status:** Ready for owner visual review

**Controlling records:** [Analytics Page Architecture Plan](analytics-pages-architecture-plan.md), [Trade Breakdown Progress](analytics-execution-progress.md)

## Owner-approved scope

- [x] Keep the work limited to `/analytics/execution`.
- [x] Place Entry Price Results in the left column of the page's primary
  analysis area.
- [x] Stack Maximum Position, Entry Size and Hold Time in the right column, in
  that order.
- [x] Show direct factual highest-win-rate and most-profitable entry-price
  statements in the left column, with lowest-win-rate and largest-loss
  statements in the right column above the complete price-band table.
- [x] Use exact weighted average entry price for one completed-trade band per
  trade: Under $0.50; $0.50 to under $1.00; $1.00 to under $2.00; $2.00 to
  under $3.00; $3.00 to under $5.00; $5.00 to under $10.00; $10.00 to under
  $20.00; and $20.00+.
- [x] Keep the page's current account/date scope, selected-basis fee coverage,
  exact calculations and offline saved view aligned.
- [x] Mark bands with fewer than 10 included closed trades as limited history.

## Guardrails

- No chart is added for this first Entry Price Results slice.
- Do not duplicate the result in Trade Explorer, change routes, modify
  migrations or add a market-data dependency.
- The table must show Net P/L, trades, wins, losses, win rate and average P/L
  without inventing unavailable values. Return on entry value is deliberately
  omitted because its percentage presentation can overstate a small band's
  apparent difference from the dollar results.
- Keep the seven-column table compact and left-aligned on desktop, while
  retaining horizontal scrolling when a smaller viewport needs it.
- Make the price band the larger bold line in every finding; show the dollar
  result or win rate underneath in regular weight. Apply Limited history only
  to a finding based on fewer than 10 included closed trades.
- [x] Keep Core Analytics Help aligned with the weighted-entry-price,
  highest/lowest win-rate, largest-loss, most-profitable and limited-history
  meanings.

## Verification and owner review

- [x] Correct the staging-only validation failure: `entry_price_bucket` is now
  included in the analytics service's explicit supported-grouping allowlist.
  This preserves validation and permits only the new typed grouping.
- [x] Remove the misleading generic dashboard error suggestion about reporting
  currency or temporary services. The fallback now only states that the page
  could not load when no application-specific error is available.
- [x] Run permitted focused checks: `git diff --check` passes. Project ESLint
  cannot run in this clean worktree because dependencies are not installed;
  the fallback ESLint package cannot load the repository configuration.
  Vitest, a local server and broad checks were not run.
- [x] Inspect the narrow diff and commit only the assigned slice.
- [ ] Obtain owner visual/product approval before acceptance or release work.
