# Zone exit comparison

Owner approved adapting the section below the profit-zone chart. On September 9
the owner waived the preview approval pause and requested later production review.
Production publication requires separate authorization.

## Calculation contract

- Each selected analyzed user trade is counted once per zone.
- First recorded price inside the exact band; upper bound exclusive, 100%+
  unbounded. A skipped band has no fabricated scenario price.
- Potential Gross P/L is prior realized gains AND losses plus liquidation of
  the then-open shares at that recorded price. No later buys, sells or re-entries
  are included in this hypothetical stopping point.
- Actual Gross P/L is the full final result of these same saved trades.
- Difference is potential minus actual, signed. Zone scenarios overlap and are
  not additive. No assertion about an optimal trading strategy.
- Uses completed candle closes or exact exit prices. Reporting-currency scaling
  includes scenario P/L and price, but never share quantity.

## Implementation

- [x] Compact zone summary inside existing Scaling behavior section.
- [x] First-band details open initially; selected-zone trade details with drawer.
- [x] Counts subordinate to percentages; date, direction and hold filters reused.
- [x] Detail pagination at bottom, default 20 with 50/100 options.
- [x] Existing scaling-behavior table retained; pagination moved to its bottom.
- [x] Missing old offline scenario fields show reconnect, not false zero totals.
- [x] Focused TypeScript / ESLint / whitespace review passed. Corrected pagination
  argument ordering and unsupported Typography system props during review.
- [ ] Integrated rendered verification and owner production review.

No tests, build, server, help-file changes or deployment are authorized by this
slice. Existing sustained-level comparison columns remain distinct from the new
per-zone first-price scenarios.

React/Next.js skill review: plain serialized decimal-string props, direct component
imports, memoized totals, no new data fetches or effects, semantic tables, keyboard
zone buttons with expansion state, tooltip icons, shared horizontal scrolling,
and the existing drawer. No integrated rendered pass has been claimed.

## Follow-up: bottom pagination

- Owner requested Results per page and Previous/Next below both MFE/MAE tables
  (Price path after entry and Measured executions) and the Day Analyzed Trades table.
- Moved existing controls without changing filters, row slicing, cursor handling,
  page-size choices or offline visibility. Other EventPathTable callers preserve
  their current placement through an optional presentation prop.
- Rendered review and release remain pending.
- Focused TypeScript, ESLint and whitespace checks pass for the pagination move.

## Release-review correction: Next move position boundary

- Owner authorized fixing continuation across a later re-entry.
- The next-level search now requires the same open-position cycle as the first
  zone reach. The first-move scan stops at a new cycle, retaining the closed-in-zone
  outcome rather than treating the re-entry as a later drop or rise.
- Partial sells and adds within the still-open position remain part of its path.
  The closing execution itself remains included. Trade IDs, trade counts, final
  P/L, and whole-trade profit-taking records are unchanged.
- Recovery already used this boundary; next-level flags, next-move rates and
  next-level timing now use it consistently.
- Focused TypeScript, ESLint and whitespace checks pass. Source review confirms
  partial exits remain in the cycle, the closing execution is included, and
  later re-entry cannot set either the first-move outcome or next-level flag.
  No tests, rendered verification or deployment run.
