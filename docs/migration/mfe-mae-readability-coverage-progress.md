# Room after entry: readability and coverage

## Owner-approved scope implemented locally

- Retain per-execution, per-share MFE/MAE measurements, with median percentage MFE/MAE promoted near the top alongside existing average and median dollar metrics.
- Add compact Initial entries / Adds comparison with measured counts and median MFE/MAE percentages. Every execution carries equal weight; empty groups show unavailable, not zero.
- Explain headline metrics, page sections and all columns in both tables with plain-language tooltips. Shorten detailed headings and use Trade P/L instead of Actual P/L. Its tooltip identifies the final whole-trade result, Gross/Net basis, repeated values across execution rows, and warns against summing them.
- Distinguish while-held excursions from fixed post-entry 5/15/30/60-minute price paths, which may continue after exit. Describe saved one-minute boundaries and exact final-exit-price fallback without claiming tick precision.
- Require every expected saved minute for excursion/path windows. Interior excursion gaps exclude that execution from measured summaries; entry/add timed-window gaps return unavailable. No zero-filled missing minutes. The QA correction rederives entry/add paths from saved candles and excludes the candle beginning at the window endpoint.
- Coverage reads existing candles once into a per-analysis Set and checks bounded minute ranges. It does not download data, reanalyze, mutate saved snapshots, change provider requests or change post-exit execution paths.
- MFE/MAE offline key advanced to v3 so older unchecked cached results are not silently presented as coverage-checked results.

## Verification and boundaries

- Follow-up [focused QA](mfe-mae-focused-qa-report.md) found three issues, now corrected with owner authorization: no-match search keeps its control; timed paths and their coverage checks use the corrected endpoint; whole-trade P/L uses current saved-trade membership. Missing member amounts show unavailable. Corrections are local, not deployed or visually accepted.

- Focused ESLint and diff whitespace checks passed. Source checks cover preserved pagination, direction filtering, Gross/Net Trade P/L, per-share units, and empty-group unavailable results.
- TypeScript transpilation reported zero syntax errors for all three changed source files; this is not a full semantic type check or a rendered acceptance result.
- Entry/add paths are rederived before reporting-currency scaling, without rewriting Analyzer snapshots. Interior MFE/MAE boundaries and exit-event paths remain unchanged; no unknown within-minute ordering is invented.
- No test suites, app build, provider calls or deployment. Rendered desktop/mobile Light/Dark verification remains pending the next authorized release; the production browser cannot display this local candidate.
- Source slice complete; release and owner visual acceptance pending. Help articles remain deferred per owner request.
