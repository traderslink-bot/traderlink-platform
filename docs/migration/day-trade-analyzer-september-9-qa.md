# Day Analyzer September 9 release QA

Scope: pending Day Analyzer presentation, recovery, zone pagination, missed
opportunity, per-zone comparison and bottom-pagination changes.

## Result

Source-based calculation review: no further blocker found after correcting the
Next move position-cycle boundary. Focused TypeScript, ESLint and whitespace
checks passed during the implementation slices. No test suite, app build,
live-account reconciliation or rendered verification was performed. Owner
explicitly deferred visual review until production.

## Source and arithmetic walkthroughs (not executed test fixtures)

- Partial exit: 100 shares bought at $1, 20 sold at $1.10, remaining 80 at
  $1.25 gives $2 realized plus $20 open = $22 scenario Gross P/L, not $25.
  The observation stores realizedGross + directionMove * positionQuantity.
- Prior realized losses remain signed in that same expression.
- Full exit and re-entry: the next-level search requires the original position
  cycle, and the first-move loop breaks at a new cycle. Partial sells and adds do
  not change that cycle. The closing execution remains eligible.
- Saved-trade scenario stops at the chosen observation, excluding later
  executions; actual final Gross P/L includes all saved-trade executions.
- Skipped bands: comparison requires a recorded return >= lower AND < upper.
  Exact 30% belongs to 30%-39.99%, not 20%-29.99%; 100%+ has no upper bound.
- Summary reconciliation: included records are selected once per zone.
  Potential, actual and signed difference use that same complete array.
  Detail pagination happens afterward and cannot alter summary totals.
- Decimal summation and currency conversion preserve signed monetary values.
  Scenario price is converted too; shares and timestamps are not.
- Missed dollars sum the same per-trade pre-drop field displayed in detail.
  Recovered / never-recovered groups partition that subset and dollar total.
- User-defined trade IDs remain the row identity. No ticker grouping or new
  round-trip trade count was introduced.
- Bottom pagination preserves current cursor/row-count/page-size handlers for
  Analyzed Trades, MFE/MAE and Scaling behavior.

## Release boundary

Coordinator must integrate only the feature commit diff onto verified current
production main, preserving intervening changes. Do not publish the historical
feature branch wholesale. Coordinator owns Railway source/parent verification,
release serialization, deployment status and health confirmation.
