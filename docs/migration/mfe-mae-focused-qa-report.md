# MFE/MAE focused QA — 8a16ce848

Status: Three findings corrected locally following owner authorization. Focused lint, syntax and source review pass. Integrated rendering and live numeric validation remain pending; this is not production acceptance.

## Findings

1. No-match ticker search hides its own control. EventPathTable returns before rendering the ticker field when filtered grouped.length is zero. A typo therefore removes the field required to clear it. Keep the controls visible and render the empty result below them.
2. Timed path endpoint includes the candle that starts at the endpoint. postEventPath selects candle.time <= eventMinute + minutes*60; candle time is minute-start in the Analyzer (scenario consumption uses candle.time+60 for completed close). This can include the next minute's range. The new coverage guard intentionally mirrors this older convention, so it does not repair the endpoint. Resolve the minute-boundary contract and update the derived path and coverage together; do not relabel it as exact elapsed-minute coverage.
3. Trade P/L tooltip overstates saved-trade identity for grouped trades. MFE rows come from joined Journal round-trip rows and copy trade.actualPnl; their keys and links use roundTripId. They do not use the logical scenarioTrades pipeline that the Green-to-red/Scaling Out views use. For user-defined trades containing multiple round trips, the claim 'whole trade' needs reconciliation against the logical trade membership/P-L contract before release. Do not silently relabel a round-trip amount as the complete user-defined trade amount.

## Checks passed at source level

- Focused ESLint passed for all three changed source files. Prior TypeScript transpilation had no syntax errors; no full semantic type check claimed.
- Medians handle odd/even populations and empty groups without converting unavailable to zero. Initial entries and adds partition the measured execution rows.
- Long/short MFE and MAE use the intended directional per-share differences; percentages divide by execution price. Gross/Net does not change per-share moves.
- Coverage guards check each expected minute, with a bounded scan and exact-exit fallback when no interior minute exists. Endpoint semantics remain Finding 2.
- New metrics operate on the whole selected measured population, not a table page. Pagination remains below both tables. The new Trade P/L explanation warns against summing repeated results, but Finding 3 must be resolved.
- MFE offline key advanced to v3, preserving the shared component path while rejecting old unchecked snapshots.

## Corrections and follow-up checks

- Empty ticker results render below the still-visible search field. Table and pagination are hidden only for the empty result, not the control needed to recover.
- Entry/add timed paths are recalculated read-only from existing candles before currency scaling. For a 09:30 execution and five-minute window, included minute-start candles are 09:31 through 09:34; the 09:35 candle is excluded. Both the derived extrema and coverage guard use that boundary. Missing any included minute returns unavailable. The execution minute remains excluded because fill ordering is unknown. Long and short use opposite directional differences; missing minutes are never zero-filled.
- Trade P/L sums the selected Gross/Net member amounts using current saved-trade membership and exact round-trip IDs. Every execution row for that trade receives the same complete amount. Separate trades sharing a ticker remain separate. If any member or required selected P/L is absent, the result is unavailable, not a partial total. Tooltip explains that case.
- No provider calls, database writes, reanalysis, engine snapshot rewrites, cancelled caption changes or deployment. Existing exit-event timed-path calculations are unchanged.
- Focused ESLint passed for both changed source files. TypeScript transpile checks found zero syntax errors in both. This does not claim full semantic type checking or runtime tests. Diff whitespace check passed.

## Pending

- Integrated desktop/mobile Light/Dark rendering, tooltip focus/touch, empty-search recovery, and representative grouped-trade numeric validation after corrections.
