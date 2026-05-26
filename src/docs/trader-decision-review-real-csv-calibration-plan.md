# Trader Decision Review Real CSV Calibration Plan

Created: 2026-05-05

Purpose:

Move the decision-review bridge from "it runs" to "the coaching feels right on
realistic imported trades." This plan should be worked from top to bottom until
the branch is complete or a real blocker is documented here.

Important note about support/resistance grading:

`levels-system` grades level zones as `weak`, `moderate`, `strong`, or `major`.
This repo already maps those grades into local structural levels:

- `major` and `strong` become `strengthBucket: "strong"`
- `moderate` becomes `strengthBucket: "medium"`
- `weak` stays `strengthBucket: "weak"`
- the exact upstream label is preserved as `sourceStrengthLabel`

That grading should be used to sharpen trader-facing review language. A trade
entered near a major or strong daily/4h resistance level deserves different
wording than a trade entered near a weak or moderate level. This app should
consume those graded facts only; it must not compute support/resistance locally.

## Product Boundary

`levels-system` owns:

- candle fetching and storage
- support/resistance detection
- support/resistance level grading
- VWAP and EMA calculation
- market structure
- neutral trade-window candle facts

`trader-intelligence-v2` owns:

- completed-trade CSV import and grouping
- P/L, sizing, lifecycle, fees, commissions, and user review metadata
- decision-review wording and behavior coaching
- calibration harnesses that compare expected trader feedback against returned
  neutral facts

Current feedback direction:

- Daily/4h support/resistance can drive market-context coaching.
- Support/resistance grade should influence wording and evidence.
- Market-context wording must be trade-direction aware. For longs, resistance
  above can limit clean upside room and support below can provide structural
  cushion. For shorts, nearby support below can limit clean downside room, and
  room to support is the cleaner continuation fact.
- VWAP/EMA should not drive trader-facing feedback.
- Lower-timeframe support/resistance coaching remains deferred.
- 1m/5m candles can still support bounded trade-window movement facts.

## Step 1. Run Real CSV Calibration Through `/import-dry-run`

Status: completed for synthetic/infrastructure; awaiting anonymized real CSVs

Goal:

Make sure the product can accept anonymized broker CSV text and route it through
the same dry-run decision-review bridge that the browser uses.

Implementation tasks:

- Keep `/import-dry-run` as the first calibration surface.
- Keep calibration CSVs anonymized and uncommitted unless they are synthetic.
- Support realistic examples for:
  - clean winner
  - bad entry near resistance
  - add after extension
  - open or awkward partial trade
- Record whether each import is:
  - blocked
  - needs review
  - ready for analysis
- Record whether decision review was attached or skipped.

Acceptance criteria:

- The code has a repeatable path for calibration batches.
- The plan documents that true real CSV calibration is still pending until the
  user supplies anonymized examples.
- Synthetic fixtures can run through the same bridge without live broker calls.

Completed:

- The existing `/import-dry-run` route remains the browser calibration surface.
- Added deterministic synthetic CSV scenarios that run through the same
  server-side decision-review bridge as real anonymized CSV text.
- Added a quality dashboard result field:
  `realCsvCalibrationStatus = "waiting_for_anonymized_real_csvs"`.
- `npm run calibrate:decision-review` can now take a real anonymized CSV file
  with `--csv`, `--broker`, `--max-trades`, and `--account-timezone`, then run
  completed grouped trades through the same server-only bridge.
- No real broker CSVs were committed or invented.

## Step 2. Inspect Generated Coaching

Status: completed

Goal:

Evaluate whether the returned coaching reads like useful trade review, not raw
diagnostic output.

Implementation tasks:

- Build a small quality report over decision-review scenarios.
- For each scenario, capture:
  - expected insight IDs
  - actual insight IDs
  - missing insights
  - unexpected market-context source
  - first coaching headline
  - level-grade evidence when support/resistance is used
- Flag VWAP/EMA wording as a failure.
- Flag support/resistance claims without `levels_system_daily_4h` as a failure.

Acceptance criteria:

- A deterministic dashboard/report can show pass/fail/review per scenario.
- The report can be run without starting a dev server.

Completed:

- Added server/internal dashboard builder:
  `src/lib/trader-analytics/server/build-decision-review-quality-dashboard.ts`
- The dashboard records expected vs actual insight IDs, missing insights,
  market-context source, coaching headline, forbidden wording, diagnostics,
  required headline/title/evidence fragments, and stale headline fragments
  where the headline no longer matches the surviving insight set.

## Step 3. Add Missing Deterministic Fixtures

Status: completed

Goal:

Lock in the most important coaching cases so the wording and insight IDs do not
drift silently.

Target fixture cases:

- entry near daily/4h resistance
- entry near daily/4h support
- entry with limited clean room
- add after extension
- add into weakness
- add after most favorable move was already used
- premature exit
- failed profit protection

Implementation tasks:

- Prefer CSV-style scenarios for import-path coverage.
- Use deterministic `levels-system` stub/fetch-service data.
- Keep all fixture data synthetic.
- Add expected insight IDs and any required wording/evidence fragments.
- Include at least one fixture that proves level strength/grade is surfaced.

Acceptance criteria:

- Fixture expectations run through the server bridge.
- Fixtures do not require live providers.
- The fixture catalog explains what each scenario proves.

Completed:

- Expanded `src/lib/trader-analytics/__fixtures__/decision-review-csv-scenarios.ts`
  with scenarios for:
  - sample daily/4h context
  - realistic IBKR activity statement shape with preamble rows, signed
    quantities, `Comm/Fee`, gross `Proceeds`, and decision review
  - entry near major daily/4h resistance with limited room
  - failed entry near major daily/4h resistance
  - entry near major daily/4h resistance, limited room, and a later add after
    the trade had already used much of the move
  - entry near support with premature-exit/failed-protection evidence
  - partial exit from nearby support entry
  - completed short-trade smoke coverage
  - open-position skip diagnostics
  - repeated adds after extension
- Added expected insight IDs and required grade/evidence fragments.

## Step 4. Improve Trader-Facing Wording

Status: completed

Goal:

Make the top decision-review messages closer to:

> Your first entry was close to major 4h resistance, the trade had limited
> clean room, and your add increased size after the trade had already used most
> of its favorable move.

Implementation tasks:

- Add support/resistance grade to the facts consumed by decision review.
- Mention stronger/moderate level context when available.
- Keep evidence compact:
  - nearest level price
  - level strength bucket
  - distance to level
  - trade MFE/MAE facts when relevant
- Use "major" wording only when the exact upstream `sourceStrengthLabel` is
  available.
- Preserve existing insight IDs unless a new insight is truly needed.

Acceptance criteria:

- Decision-review insights show level-grade evidence.
- VWAP/EMA wording remains absent.
- Existing import panel continues to render the improved insight text.

Completed:

- `PatternInputSupportResistanceContext` now carries nearest first-entry
  support/resistance strength bucket, exact source strength label, score, and
  reaction strength.
- `TradeDecisionReview.marketContext` now exposes nearest support/resistance
  strength bucket, exact source strength label, and score.
- Market-context insight titles/evidence now include graded level context, for
  example `Entry was close to major daily/4h resistance`.
- Coaching headlines can now combine the key market and scaling facts, for
  example: first entry near major daily/4h resistance, limited clean room, and
  a later add after much of the move was already used.
- Stale "adds aligned with strength" headlines are replaced when the matching
  strength insight was suppressed by stronger add-risk evidence.
- Short-trade market-context wording now avoids long-only support-cushion,
  room-above, and upside-room phrasing. The current short calibration path can
  surface room to daily/4h support, nearby support as downside-room risk, and
  short adds near support as scaling risk.
- VWAP/EMA trader-facing feedback remains disabled.

## Step 5. Expand Decision-Review Scenario Coverage

Status: completed

Goal:

Make tests prove the review engine covers the high-value coaching set rather
than only smoke-testing that some insight exists.

Implementation tasks:

- Add focused tests for deterministic scenario expectations.
- Add tests for level-grade evidence in market-context insights.
- Add tests for the quality dashboard/report.
- Keep route/browser tests lightweight; deeper scenario coverage belongs in
  Vitest.

Acceptance criteria:

- Focused scenario tests pass.
- The dashboard marks deterministic scenarios as passing.
- Boundary tests continue proving this app does not compute levels locally.

Completed:

- Added scenario expectation checks to the bridge tests.
- Added dashboard tests covering passing scenarios, missing expected insights,
  and forbidden wording.
- Added tests proving level grades reach `PatternInput` and
  `TradeAnalysisSummary.decisionReview`.
- Added a short-trade calibration expectation proving the review can use
  direction-aware room-to-support facts without emitting long-biased
  support-cushion or room-above wording.

## Step 6. Verify `levels-system` Integration Contract

Status: completed

Goal:

Confirm this project consumes the sibling project's neutral facts correctly.

Implementation tasks:

- Verify the mapping from `levels-system` level labels into local structural
  level buckets.
- Verify daily/4h filtering remains in place for trader-facing feedback.
- Verify `PatternInput` receives strength/grade facts from mapped levels, not
  from local calculation.
- Verify `generatedFrom.vwapEmaFeedbackUsed` remains false.

Acceptance criteria:

- Tests cover `major`/`strong`/`moderate` mapping where practical.
- Tests prove market-context feedback source is `levels_system_daily_4h`.
- Tests prove browser code still does not import `levels-system`.

Completed:

- Added adapter coverage proving:
  - `major` maps to local `strong`
  - `strong` maps to local `strong`
  - `moderate` maps to local `medium`
  - `weak` maps to local `weak`
- Existing boundary tests continue to keep `levels-system` out of browser code.
- Daily/4h filtering remains in the levels-system adapter.

## Step 7. Create A Review Quality Dashboard

Status: completed

Goal:

Give future sessions a quick way to evaluate whether the decision-review output
is improving or regressing.

Implementation tasks:

- Add a server-side/internal quality dashboard builder.
- Return:
  - scenario count
  - pass/review/fail counts
  - per-scenario expected vs actual insight IDs
  - missing required wording/evidence fragments
  - diagnostics
  - recommended next action
- Add a markdown formatter or script-friendly output for easy inspection.

Acceptance criteria:

- The dashboard runs from deterministic fixtures.
- Tests prove it catches missing insights or forbidden VWAP/EMA wording.
- The dashboard does not start a server or watch process.

Completed:

- Added `buildDecisionReviewQualityDashboard(...)`.
- Added `formatDecisionReviewQualityDashboardMarkdown(...)`.
- Added bounded npm runner: `npm run calibrate:decision-review`.
- The runner writes a latest report artifact by default:
  `artifacts/decision-review-quality/latest.md` or `.json`.
- The runner also writes a timestamped history artifact by default so repeated
  calibration runs can be compared over time.
- The runner can inspect a real anonymized CSV without starting the app:
  `npm run calibrate:decision-review -- --csv=<path> --broker=generic_execution_csv`.
- The runner can inspect a folder of anonymized CSVs:
  `npm run calibrate:decision-review -- --csv-dir=<folder> --broker=generic_execution_csv`.
- Directory mode writes `latest-batch.md`, a timestamped `index.md`, and one
  report per CSV inside the timestamped batch folder.
- The dashboard runs entirely through bounded Vitest/server-side calls and does
  not start a dev server or watcher.

## Step 8. Set The Promotion Gate For Saved Workflow

Status: completed

Goal:

Make the next product move explicit without prematurely promoting the prototype
bridge into saved-trade workflow before calibration quality is good enough.

Implementation tasks:

- Document the criteria required before promotion:
  - real anonymized CSV sample set reviewed
  - deterministic dashboard passing
  - no VWAP/EMA feedback leakage
  - daily/4h level source confirmed
  - user-facing wording reviewed
- Keep current implementation attached to dry-run.
- Add a handoff note for later authenticated/persisted import work.

Acceptance criteria:

- The branch ends with a clear "promote later" gate.
- No production persistence/auth/billing/export behavior is added accidentally.

Completed:

- Promotion remains gated behind anonymized real CSV calibration.
- Current implementation remains attached to dry-run only.
- No production persistence, auth, billing, or export behavior was added.

## Verification Commands

Use bounded non-watch commands only:

```bash
npx tsc --noEmit --pretty false
npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-pattern-input.integration.test.ts --reporter=dot
npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-boundary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot
npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z
npm run calibrate:decision-review -- --csv=path/to/anonymized.csv --broker=generic_execution_csv --max-trades=5
npm run calibrate:decision-review -- --csv-dir=path/to/anonymized-csv-folder --broker=generic_execution_csv --max-trades=5
npm run build
npm test -- --reporter=dot
```

Completed verification:

```bash
npx tsc --noEmit --pretty false
npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts src/lib/trade-analysis/__tests__/build-trade-analysis-summary.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-pattern-input.integration.test.ts src/lib/support-resistance/__tests__/levels-system-adapter.test.ts --reporter=dot
npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-boundary.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot
npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z
npm run build
npm test -- --reporter=dot
```

Results:

- focused grade/dashboard Vitest: 5 files passed, 19 tests passed
- focused decision-review Vitest: 4 files passed, 17 tests passed
- decision-review dashboard runner: 5 scenarios passed, 0 review, 0 fail
- real CSV runner smoke: passed with `--csv`, `--broker`, `--max-trades`, and
  custom `--out`
- build: passed
- full Vitest: 91 files passed, 823 tests passed

Process note:

- A post-verification process check did not show leftover `vitest`, `next
  build`, or Playwright runner commands from this branch.
- Existing unrelated Node processes from sibling `levels-system` scripts and
  manual watchlist runtime were still present.

## Progress Log

- 2026-05-05: Plan created.
- 2026-05-05: Steps 1-8 completed for the current branch. Real CSV
  calibration remains correctly gated until anonymized user examples are
  available.
- 2026-05-05: Verification passed and final results were recorded.
- 2026-05-05: Exact upstream level labels are now preserved for review wording,
  and `npm run calibrate:decision-review` prints a passing deterministic
  dashboard.
- 2026-05-05: Review quality tightened. Near-support and far-from-support can
  no longer appear together for the same first entry, level-distance evidence
  now formats percent-point distances correctly, and generic no-primary-behavior
  headlines are replaced by clearer market-context headlines when available.
- 2026-05-05: The dashboard now has a combined major-resistance/limited-room/
  late-add fixture, required headline fragments, stale headline detection, and
  artifact output. The runner also accepts real anonymized CSV input when safe
  files are available.
- 2026-05-05: `/import-dry-run` now shows attached decision reviews as
  per-trade review cards grouped by market context, entry, adds/scaling, exit,
  and trade-window evidence, with diagnostics surfaced directly in the
  Prototype Analysis panel.
- 2026-05-05: Calibration report history is now written automatically alongside
  `latest.md` / `latest.json`.
- 2026-05-05: Batch CSV calibration is now available with `--csv-dir`. It
  writes a batch index plus one report per CSV and includes a miss-to-fixture
  template for turning real calibration misses into deterministic synthetic
  tests.
- 2026-05-05: Synthetic calibration coverage expanded to 9 scenarios,
  including failed major-resistance entry, partial exits, short-trade smoke,
  and open-position skip diagnostics. The dashboard can now represent expected
  no-review/skipped-trade scenarios without marking them as failures.
- 2026-05-05: Short-trade decision-review wording is now direction-aware for
  daily/4h market context. The short smoke scenario expects
  `short_entry_had_room_to_support` and forbids long-only "room above",
  "structural cushion underneath", and "upside was not especially clean"
  wording.
- 2026-05-05: Synthetic calibration coverage expanded to 10 scenarios with an
  IBKR activity statement decision-review fixture. Plain IBKR `Proceeds` is
  treated as gross proceeds rather than broker net P/L; `Comm/Fee` is parsed as
  cost visibility.
