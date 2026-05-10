# Superseded

This May 5 handoff is historical context. Do not use it as the current resume
point. Start from root `plan.md`, then the plan index and latest project log.

It was previously superseded by:

`src/docs/trader-intelligence-next-chat-handoff-2026-05-06.md`

Keep this file only as older historical context.

# Trader Intelligence Next Chat Handoff

Date: 2026-05-05

## Start Here

Historical note: this file originally told the next chat to start here, but it
is no longer the current resume point.

Then read, only as needed:

- `src/docs/codex-project-log.md`
- `src/docs/trader-real-csv-calibration-guide.md`
- `src/docs/trader-functional-readiness-next-handoff.md`
- sibling project handoff:
  `C:\Users\jerac\Documents\TraderLink\levels-system\docs\77_TRADER_INTELLIGENCE_HISTORICAL_BACKFILL_AND_ASOF_PLAN_2026-05-05.md`

## Current Situation

This app, `trader-intelligence-v2`, can now import an IBKR monthly Activity
Statement CSV, group executions into completed trades, run decision review for
capped private calibration batches, and report market-data readiness.

The current blocker is not CSV parsing or decision-review wiring. The blocker is
historical market-data quality from the sibling `levels-system` project.

The sibling `levels-system` project is expected to implement/verify:

- historical as-of daily/4h support/resistance snapshots
- historical 1m trade-window candle backfill
- 5m fallback when 1m is unavailable
- cache/backfill behavior
- no future leakage
- historical execution price as the relevance anchor, not today's stock price
- diagnostics for missing, stale, partial, fallback, adjusted/split-mismatched,
  or incomplete data

## Product Boundary

Preserve this boundary:

- `levels-system` owns candle fetching, candle storage/cache,
  support/resistance, VWAP/EMA, market structure, and neutral market facts.
- `trader-intelligence-v2` owns broker CSV import, execution grouping, P/L,
  sizing, journal/review UI, behavior/coaching, calibration reports, and
  truthful display of market-data readiness.
- For now, `trader-intelligence-v2` must not use VWAP/EMA for trader-facing
  coaching, even if `levels-system` returns dynamic levels.
- Daily/4h support/resistance is the first market-context feedback source.
- 1m/5m candles are trade-window movement evidence only: MFE/MAE,
  high/low during hold, post-exit continuation, and related neutral facts.

## Current Private Baseline

Private IBKR April Activity Statement calibration is stored under:

`artifacts/real-csv-calibration/private`

Do not commit or expose the private CSV filename/account details.

Current first-100 baseline:

- requested trades: 208
- analyzable trades: 100
- completed reviews: 100
- market context: `levels_system_daily_4h=100`
- `trade_window_excursion_measured`: 100/100
- trade-window evidence:
  - `execution_only_fallback`: 66
  - `levels_system_trade_window`: 34
- weak/no daily/4h level evidence rows: 81
- candle-quality note rows: 67
- missing trade-window excursion insights: 0
- extreme excursion metrics: 0
- fallback/generic headlines: 0
- open skipped trades: 2
  - `ANNA`: one short sell execution left open
  - `SKYQ`: one 2-share buy execution left open

Interpretation:

- The review pipeline is stable enough for capped private calibration.
- The many execution-only fallback rows and weak-level rows are expected until
  `levels-system` historical backfill/as-of behavior improves.
- Do not tune trader coaching based on those weak-level counts until the
  provider/backfill work is rerun.

## Important Code Added Recently

Market-data readiness/counting:

- `src/lib/trader-analytics/server/decision-review-calibration-readiness.ts`
- `src/scripts/summarize-market-data-readiness.ts`
- `src/scripts/compare-decision-review-calibrations.ts`
- `src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts`

Decision review bridge and UI:

- `src/lib/trader-analytics/server/build-csv-dry-run-decision-review-bridge.ts`
- `app/api/import-dry-run/decision-review/route.ts`
- `app/import-dry-run/import-dry-run-client.tsx`
- `src/lib/trader-analytics/product/functional-readiness.ts`
- `tests/e2e/import-dry-run.spec.ts`

Trade-window safety:

- `src/lib/raw-trade-timeline/derived/build-trade-derived-signals.ts`
- `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline-with-levels-system-candles.ts`
- `src/lib/raw-trade-timeline/__tests__/build-trade-derived-signals.test.ts`
- `src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts`

Calibration reports:

- `src/scripts/run-decision-review-quality-dashboard.ts`
- `src/scripts/summarize-decision-review-calibration.ts`
- `src/scripts/run-ibkr-grouping-review-report.ts`

## Package Scripts Added

```bash
npm run summarize:market-data-readiness -- --json=<calibration.json> --out=<summary.md>
npm run compare:decision-review-calibrations -- --baseline=<before.json> --candidate=<after.json> --out=<comparison.md>
```

## Current Artifacts

Current private first-100 artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-summary.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-market-data-readiness.md`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-self-comparison.md`

Current private first-25 artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-25-calibration.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-25-summary.md`

## What To Do After `levels-system` Changes

If the sibling `levels-system` Codex says historical backfill/as-of work is
ready, run this in `trader-intelligence-v2`.

First, refresh the local file dependency if needed:

```bash
npm install
```

Then rerun first-100 calibration:

```bash
npm run calibrate:decision-review -- --csv=artifacts/real-csv-calibration/private/<private-ibkr-file>.csv --broker=ibkr_activity_statement --account-timezone=America/Toronto --max-trades=100 --generated-at=2026-05-05T12:00:00.000Z --json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system.json --no-history
```

Generate readiness summary:

```bash
npm run summarize:market-data-readiness -- --json=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system-readiness.md
```

Compare before/after:

```bash
npm run compare:decision-review-calibrations -- --baseline=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --candidate=artifacts/real-csv-calibration/private/ibkr-april-first-100-after-levels-system.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-before-after-comparison.md
```

Success criteria:

- `execution_only_fallback` should drop below 66
- `levels_system_trade_window` should rise above 34
- weak/no daily/4h level evidence should drop below 81
- missing trade-window excursion insights should remain 0
- extreme excursion metrics should remain 0
- fallback/generic headlines should remain 0

If numbers improve, increase cap to all 206 eligible completed trades and
inspect remaining bad/coarse headlines.

## If Working Locally Before `levels-system` Is Ready

Safe work in this app:

- improve report formatting
- add synthetic fixture coverage for known calibration states
- improve docs/handoff
- improve UI clarity around market-data readiness

Avoid:

- implementing support/resistance locally
- implementing candle fetching/storage locally
- tuning trader coaching against stub/incomplete market data
- committing private CSVs or private generated data

## Verification Commands From Latest Work

Recent passed commands:

```bash
npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot
npx vitest run src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-boundary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npm run summarize:market-data-readiness -- --json=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-market-data-readiness.md
npm run compare:decision-review-calibrations -- --baseline=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --candidate=artifacts/real-csv-calibration/private/ibkr-april-first-100-calibration.json --out=artifacts/real-csv-calibration/private/ibkr-april-first-100-self-comparison.md
npm run build
```

Also recently passed after fallback-honesty UI work:

```bash
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop
```

## Process Notes

Process checks after recent verification showed no leftover
`trader-intelligence-v2` Node/Vitest/Next/Playwright processes. Matching Node
processes belonged to the sibling `levels-system` project.

The workspace is dirty with many existing modified/untracked files from the
current branch and prior branches. Do not revert unrelated files.

## Best Next Step In A Fresh Chat

The first-100 historical warehouse/backfill branch is now mostly complete:

- completed reviews: `100/100`
- market context: `levels_system_daily_4h=100`
- trade-window evidence: `levels_system_trade_window=95`
- remaining execution-only fallback rows: `5`

The remaining five are not missing-candle rows. They are price-basis/corporate
action disconnects:

- `VEEE` x1
- `ISPC` x2
- `DGNX` x2

Latest artifacts:

- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-price-basis-diagnostic.json`
- `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-price-basis-diagnostic-readiness.md`

Best next step:

1. Continue in `levels-system`.
2. Investigate raw-vs-adjusted candle provenance for `VEEE`, `ISPC`, and
   `DGNX`.
3. Do not bulk-fetch more candles until the basis policy is clear.
4. Either align warehouse candles to broker execution prices or keep these rows
   as execution/P&L-only with the explicit price-basis diagnostic.
5. After the basis decision, increase calibration beyond the capped first 100.

Latest policy update:

- `levels-system` now emits `trade_window_price_basis_unverified` for
  split-like price-basis mismatches.
- The capped first-100 artifact
  `artifacts/real-csv-calibration/private/ibkr-april-first-100-after-price-basis-policy.json`
  confirms all five remaining fallbacks preserve that policy note.
- Treat these five as intentional execution/P&L-only reviews unless a matching
  raw IBKR candle basis can be proven.

## Latest All-Eligible Status

The calibration has now been expanded beyond the capped first 100.

Current all-eligible artifact:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-daily-4h-backfill.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-daily-4h-backfill-readiness.md`

Current result:

- requested trades: `208`
- analyzable completed trades: `206`
- completed reviews: `204`
- open skipped trades: `2`
- remaining analysis failures: `2`
- market context: `levels_system_daily_4h=204`
- trade-window evidence: `levels_system_trade_window=196`,
  `execution_only_fallback=8`
- missing trade-window excursion insights: `0`
- fallback/generic headlines: `0`

What was done:

- All-eligible `5m` IBKR warehouse backfill succeeded:
  `39` planned, `39` fetched, `0` failed.
- All-eligible daily/4h IBKR warehouse backfill succeeded:
  `54` planned, `54` fetched, `0` failed.
- Added `src/scripts/build-ibkr-daily-4h-backfill-manifest.ts` to create the
  targeted daily/4h priority report from calibration diagnostics.

Remaining two failures:

- `AVEX`
- `ELMT`

These are not normal missing-warehouse gaps. IBKR returned only tiny
higher-timeframe history for them:

- `AVEX`: `1` daily candle and `1` 4h candle stored
- `ELMT`: `1` daily candle and `2` 4h candles stored

Treat those as insufficient-history/provider-data cases. Do not add broad alias
discovery or ticker research for them unless one becomes a high-value blocking
replay.

Best next step:

- Improve/verify consumer-facing diagnostics for the two insufficient-history
  failures and the eight intentional execution-only fallback reviews. The right
  product behavior is truthful degradation, not more blind backfill.

Update after AVEX/ELMT diagnostic cleanup:

- Added `insufficient_market_context` failure classification.
- The decision-review bridge now emits `market_context_unavailable` for these
  cases instead of generic `analysis_failed`.
- Latest artifact:
  `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-avex-elmt-diagnostics.json`
- Readiness summary:
  `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-avex-elmt-diagnostics-readiness.md`
- Completed reviews remain `204/206`.
- `AVEX` and `ELMT` are now correctly labeled as unavailable/insufficient
  daily/4h market context under the historical no-future-leakage cutoff.

Next best step:

- Wire or verify the UI copy for `market_context_unavailable`: market data was
  unavailable or insufficient for daily/4h context, so market-structure
  conclusions are not shown for that trade; execution/P&L-only review can still
  be used where available.

Update after UI/API copy and policy design:

- `/api/import-dry-run/decision-review` advertises
  `market_context_unavailable` in its contract metadata.
- `/import-dry-run` now renders that diagnostic as a market-data limitation,
  not a generic analysis failure.
- Added browser coverage for the UI copy.
- Added design doc:
  `src/docs/candle-warehouse-basis-policy-design-2026-05-06.md`.

Verification:

- Focused API/bridge Vitest passed: `21/21`.
- TypeScript passed.
- `npm run build` passed.
- Desktop import-dry-run Playwright passed: `8/8`.

Best next step:

- Coordinate the candle-basis design with `levels-system`. Implement metadata
  and basis-validation status first; do not jump straight to a broad
  corporate-action engine.

Update after consuming the levels-system basis metadata hook:

- The other Codex landed provider/warehouse-side basis metadata in
  `levels-system`, including `trade_window_basis_validation_status`.
- Trader Intelligence refreshed the local `levels-system-phase1` dependency.
- The dry-run decision-review bridge now preserves
  `Trade-window candle basis status: ...` in `candleQualityNotes`.
- Focused bridge coverage passed for `basis_aligned` and
  `basis_adjustment_multiple_likely`.

Latest all-eligible artifact:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-basis-metadata-hook.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-basis-metadata-hook-readiness.md`

Latest result:

- requested trades: `208`
- analyzable completed trades: `206`
- completed reviews: `204`
- open skipped trades: `2`
- remaining diagnostics: `AVEX` and `ELMT` as
  `market_context_unavailable`
- trade-window evidence: `levels_system_trade_window=196`,
  `execution_only_fallback=8`
- basis statuses: `basis_aligned=199`,
  `basis_adjustment_multiple_likely=5`

Current interpretation:

- `VEEE`, `ISPC`, and `DGNX` are now explicitly confirmed as likely
  adjustment-multiple/basis-mismatch rows. Keep them execution/P&L-only unless
  raw IBKR candle basis can be proven aligned.
- `PBM` and `XTLB` are not price-basis cases anymore; they are basis-aligned but
  still missing post-trade candles.
- `AVEX` and `ELMT` remain insufficient daily/4h history cases, not alias or
  basis cases.

Best next step:

- Run full Trader verification, then productize the note presentation: aligned
  basis info should not read with the same urgency as warning-level
  basis-mismatch or unavailable-candle notes.

Update after candle-basis note UI polish:

- `/import-dry-run` now separates candle-quality notes by urgency:
  - `basis_aligned` is quiet verified-basis detail.
  - `basis_adjustment_multiple_likely` is a visible movement-review warning.
  - missing pre/post-trade candles, ignored trade-window candles, and 5m
    fallback notes remain visible warnings.
- Added Playwright coverage for both aligned-basis and adjustment-multiple
  presentation.

Verification:

- TypeScript passed.
- Focused bridge Vitest passed: `16/16`.
- Production build passed.
- Desktop import-dry-run Playwright passed: `10/10`.

Best next step:

- Move to `PBM` and `XTLB`: both are `basis_aligned`, so inspect whether their
  missing post-trade candles are a warehouse coverage issue, a no-bar period, or
  an as-of/window boundary issue.

Update after PBM/XTLB window fixes:

- `XTLB` was a stale partial 1m replay issue: the warehouse had usable 5m
  candles, but a tiny stale 1m file prevented fallback.
- `levels-system` now falls back from partial 1m to 5m when the newest 1m candle
  is more than 15 minutes before the requested trade-window end.
- `PBM` was a real 5m tail coverage gap on 2026-04-17, so one targeted IBKR 5m
  backfill was run. IBKR returned `91` 5m candles ending at
  `2026-04-17T15:30:00.000Z`.

Latest all-eligible artifact:

- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes.json`
- `artifacts/real-csv-calibration/private/ibkr-april-all-eligible-after-pbm-xtlb-window-fixes-readiness.md`

Latest result:

- requested trades: `208`
- analyzable completed trades: `206`
- completed reviews: `204`
- open skipped trades: `2`
- remaining diagnostics: `AVEX` and `ELMT` as
  `market_context_unavailable`
- trade-window evidence: `levels_system_trade_window=199`,
  `execution_only_fallback=5`
- execution-only fallback symbols: `VEEE=1`, `ISPC=2`, `DGNX=2`

Current interpretation:

- `PBM` and `XTLB` are resolved.
- The only remaining execution-only fallbacks are intentional price-basis /
  likely adjustment-multiple cases.
- Do not bulk-fetch more candles for this branch.

Verification so far:

- `levels-system` shared API tests passed: `27/27`.
- `levels-system` TypeScript passed.
- `levels-system` build passed.

Best next step:

- Run final Trader verification, then focus on product/policy presentation for
  the five price-basis rows and the AVEX/ELMT insufficient-history diagnostics.
