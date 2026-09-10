# Entry & Exit — saved-trade correction and deeper QA

## Outcome

The identified saved-trade discrepancy is corrected locally. Entry & Exit now has a route-specific projection over current, account-scoped saved-trade membership and analysis. Other Day pages retain their existing calculations. Nothing has been deployed.

## Defects corrected

1. Snapshot and context tables counted round trips separately. They now count each saved trade once; multiple executions in one group do not multiply its final P/L. Trades sharing a ticker stay separate.
2. Exact execution rows repeated individual round-trip results. They now repeat the complete saved-trade result and percentage return. Return uses the combined entry notional, not an average of member returns.
3. A profitable earlier close could qualify a later-losing re-entry trade as 'Exited while green'. Only the saved trade's last exit qualifies. Logical Analyzer `temporary_flat` records remain visible as position-closing executions, not partial scale-outs or the trade's last exit.
4. Giveback used a reconstructed legacy opportunity that could mix money bases. It now uses the saved trade's complete price/execution path: realized profit plus potential profit on remaining shares, with Gross/Net applied consistently. Exact execution prices and interior candle extremes are used; execution-candle ranges are excluded. Missing required candles make that peak unavailable. Nonpositive peaks are excluded. Losses after green can give back more than 100%.
5. Exit price paths inherited the extra endpoint candle and weak coverage check. The Entry & Exit projection now rederives all four windows, excludes execution/endpoint candles and requires each interior minute. Existing saved prices are used without reanalysis or provider calls.
6. Date filters could remove an earlier member of a selected saved trade. This route loads the scoped Journal rows and selects by the saved trade's final local closing date, retaining all members. Other routes keep their existing date-query behavior.
7. Holding-duration groups could include flat gaps between round trips. They now sum actual member holding durations.
8. Current single-member analysis must match the current round-trip version; stale analyses cannot fill the table. Combined trades require their combined ready analysis.
9. Missing financial data no longer changes which Long/Short view is available. Direction and analyzed counts come from analyzed saved trades. Incomplete financial or mixed-conversion records have an explicit coverage message and are excluded from financial comparisons, never represented by partial totals.

## Focused QA

`node scripts/verify-entry-exit-qa.cjs` runs the actual calculation/projection functions in memory with synthetic repository adapters. It does not read a Journal database or contact providers.

- 38 numeric/identity checks pass: same ticker across separate trades; multi-member trade totals; repeated execution P/L; per-group deduplication; trade counts versus execution counts; partials, adds, temporary flat and final exit; zero profit; long/short peaks; missing candles; exact window endpoint; Net fees; losses exceeding prior opportunity; reporting-currency conversion; equivalent rate strings; date selection; missing financials; stale versions; no input mutation; and direction preservation when financial rows are absent.
- Focused ESLint passed on the changed application/calculation files. TypeScript syntax checks and an isolated strict semantic check of the new pure math module pass. Diff whitespace check passes.
- Table sorting, filters, scroll regions, collapsed states, tooltips and pagination rendering are retained at source level. Offline Entry & Exit cache key advanced to v3; offline trade-reference remapping remains intact.

## Remaining verification / limitations

- No full build, broad regression suite, production access, provider requests or database writes. This does not claim a full-project semantic type check.
- Integrated desktop/mobile Light/Dark rendering, tooltip interaction and live saved-account reconciliation must be verified on the authorized release. The local candidate is not visible on production yet; rendered acceptance is not claimed.
- Trades whose member reporting-currency multipliers differ are explicitly excluded from this projection's financial comparisons, rather than mixing execution-price bases. The analyzed count retains them. Missing selected P/L or malformed execution context is likewise disclosed through the coverage count.
- The generic Analyzer snapshot engine is unchanged; the corrected after-exit windows belong to this page's projection. The MFE page's prior correction remains separate.
- Help articles remain deferred until the owner accepts the pages.

## Release boundary

Local correction and focused QA complete. No coordinator handoff, push or deployment in this slice.
