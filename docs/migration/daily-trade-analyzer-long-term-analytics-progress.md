# Daily Trade Analyzer Long-Term Analytics Progress

**Plan:** [Daily Trade Analyzer Long-Term Analytics Plan](daily-trade-analyzer-long-term-analytics-plan.md)

**Revised page architecture:** [Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md)

## Current checkpoint - 2026-08-09

- [x] Audited the existing Analytics architecture, Daily Trade Analyzer v2
  snapshots and `daily_trade_path_v1` materialization.
- [x] Confirmed the first page requires no migration, market-data request or
  new analyzer write.
- [x] Proved the combined prototype at `/analytics/trade-analysis`, then moved
  the accepted results into the dedicated Trade Analyzer route family while
  keeping the existing Journal-only Execution page unchanged.
- [x] Defined the complete page inventory, exact source ownership, currency
  boundary, coverage denominator and unavailable states.
- [x] Owner expanded the accepted inventory to include actual-versus-opportunity
  totals, capture/giveback statistics, return percentages, green-to-red damage
  and recovery, add/scale-out cohorts, MFE/MAE, entry-time and total-holding-time
  comparisons. Long-versus-short comparison is deliberately excluded.
- [x] Locked the minimal paid-eligibility contract: coverage uses analyzed
  eligible trades over all eligible trades; active payment is required only to
  create new analysis; completed paid-period analysis remains readable after
  cancellation. The initial Moomoo historical lookback remains a later test
  decision and is not hardcoded.
- [x] Owner approved replacing the combined prototype with a Trade Analyzer
  navigation group, Day Trade Analysis landing and four capability pages. The
  split implementation is tracked in the revised page-architecture progress
  record.
- [x] Implemented the account-scoped current-version read model and exact
  aggregation service.
- [x] Completed the expanded responsive presentation, filters and Tracker
  links: actual-versus-potential totals, missed opportunity, capture/giveback,
  green-to-red damage/recovery, add/scale-out cohorts, per-share MFE/MAE,
  entry-time, total-holding-time, execution context and pattern results.
- [x] Completed focused lint, a scoped TypeScript compilation and the read-only
  local reconciliation verifier: 14 analyzed trades, 53 execution snapshots,
  350 historical gross-basis day-trade candidates, one currency partition and
  zero malformed snapshots. Those 350 candidates are not displayed as paid
  Analyzer eligibility. Account isolation, current-version matching, subset filtering,
  Journal P/L reconciliation and nonnegative additional opportunity passed.
- [x] Re-ran focused lint and the expanded read-only reconciliation. Exact
  actual/potential/missed-opportunity totals, Journal return percentages,
  holding populations, green-to-red ended-red totals and scaling-out
  populations reconcile. Desktop and 390px mobile browser checks show no error
  overlay, console warning/error or page-level horizontal overflow.
- [x] Implemented the Day Trade Analysis landing, Entry & Exit, Green-to-Red,
  Candle Patterns and Analyzed Trades pages with dedicated navigation,
  contextual Help and growing-result pagination.
- [ ] Obtain final owner desktop/mobile visual approval.
- [x] Created narrow local source checkpoint `91579840`
  (`feat(trade-analyzer): split day analysis capabilities`).

## Coordination

- The page reads existing migrations 0036, 0040 and 0042. It does not reserve
  a migration number or edit the shared migration manifest.
- Port 3010 remains closed until the visual review checkpoint.
- The initial exact Trade Analysis dependency slice compiled cleanly. After the
  expanded page was added, a repeat scoped TypeScript process exceeded the
  deliberate 1 GB Node heap cap before producing diagnostics. Focused ESLint,
  live Next route compilation, the read-only reconciliation and desktop/mobile
  browser checks all pass; no broader resource-heavy check or Vitest was run.
- Preserve concurrent Trade Tracker note, AI Reviews, language-inventory,
  historical-Kline-provider and local-support working-tree files.
