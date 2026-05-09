# Trader Decision Review Bridge Implementation Plan

Created: 2026-05-05

Purpose:

Turn the current CSV dry-run workflow into a tested path that can import
completed trades, request server-side decision-review intelligence, and surface
that intelligence without breaking the ownership boundary with `levels-system`.

The plan is intentionally executable. Codex should work from this file until
all steps are complete or a real blocker is documented here.

## Product Boundary

`trader-intelligence-v2` owns:

- CSV execution import
- trade grouping
- P/L, sizing, lifecycle, fees, commissions, and review metadata
- behavior/coaching presentation
- combining execution results with neutral market-context facts

`levels-system` owns:

- candle fetching and storage
- support/resistance
- VWAP and EMA calculation
- market structure
- trade-window candle facts

Current feedback direction:

- Daily/4h support/resistance may be used for market-context review.
- 1m/5m candles may be used for bounded trade-window movement facts.
- VWAP/EMA should not drive trader-facing feedback for now.
- Lower-timeframe support/resistance coaching remains deferred.

## Step 1. Harden Existing Import Dry-Run UI

Status: completed

Goal:

Make the visible `/import-dry-run` workflow hard to regress before adding the
decision-review bridge.

Implementation tasks:

- Add/extend Playwright coverage for:
  - ready import
  - blocked import
  - open-position review import
  - fee/commission import
  - desktop and mobile layout
- Assert these panels remain visible:
  - `Prototype Analysis`
  - `Fee / Commission Visibility`
  - `Execution Feedback Preview`
  - `Post-Import Review Queue Preview`
- Assert unsafe surfaces stay absent:
  - export/download controls
  - raw/debug JSON
  - saved-account language
  - market-validated setup claims

Acceptance criteria:

- Desktop and mobile Playwright route tests pass.
- Blocked/open-position states are explicitly tested.
- No route test requires watch/dev commands.

Completed:

- Added Playwright tests for blocked imports and open-position review imports.
- Verified desktop route suite with:
  `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`

## Step 2. Build The Server-Side Decision Review Bridge

Status: completed

Goal:

Create a server-only helper that converts a `CsvDryRunImportExperience` into
lightweight `CsvDryRunPrototypeDecisionReviewInput` snapshots.

Recommended files:

- new helper under `src/lib/trader-analytics/server/`
- new tests under `src/lib/trader-analytics/__tests__/`

Implementation tasks:

- Accept CSV text, broker, account timezone, optional column mapping, and
  optional limits.
- Build `CsvDryRunImportExperience` server-side.
- Only analyze valid, grouped, completed trades.
- Convert each grouped request into the trade-analysis request shape.
- Call `runTradeAnalysisFromLevelsSystemCandles(...)`.
- Build `TradeAnalysisSummary` and extract `decisionReview`.
- Convert `decisionReview` into `CsvDryRunPrototypeDecisionReviewInput`.
- Keep the returned snapshot serializable and client-safe.
- Return diagnostics for skipped trades and failed analyses.
- Do not import this helper into client components.

Acceptance criteria:

- Unit tests prove completed trades produce decision-review snapshots.
- Unit tests prove blocked imports do not run analysis.
- Unit tests prove open-position trades are skipped or diagnosed safely.
- The helper does not expose raw candles or raw levels-system internals.

Completed:

- Added server-only helper:
  `src/lib/trader-analytics/server/build-csv-dry-run-decision-review-bridge.ts`
- Added focused tests:
  `src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts`
- The helper returns `CsvDryRunPrototypeDecisionReviewInput` snapshots and
  diagnostics for blocked/open/failed trades.
- Verified with:
  `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`

## Step 3. Attach Decision Review To `/import-dry-run`

Status: completed

Goal:

Let the browser route request decision-review snapshots from a server route and
feed them into the existing `Prototype Analysis` panel.

Recommended files:

- new route under `app/api/import-dry-run/decision-review/route.ts`
- `app/import-dry-run/import-dry-run-client.tsx`
- API route tests under `src/lib/trader-analytics/__tests__/`
- Playwright tests under `tests/e2e/import-dry-run.spec.ts`

Implementation tasks:

- Add a Node route handler with `runtime = "nodejs"` and dynamic behavior.
- POST body should include current dry-run inputs.
- Route should call the server helper from Step 2.
- Client should request snapshots for valid dry-run imports only.
- Add loading, success, skipped, and failure states.
- Feed returned `decisionReviews` into
  `buildCsvDryRunPrototypeAnalysisPanel({ experience, decisionReviews })`.
- Keep the UI honest if decision review is unavailable.

Acceptance criteria:

- The browser bundle does not import trade-analysis or levels-system modules.
- The panel can show real decision-review insights when the server route
  succeeds.
- The panel still works with no decision-review snapshots.
- Route tests cover invalid JSON, blocked import, and successful review.

Completed:

- Added route:
  `app/api/import-dry-run/decision-review/route.ts`
- Added route tests:
  `src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts`
- Added button-driven client fetch in `/import-dry-run`.
- Existing `Prototype Analysis` panel now receives returned decision-review
  snapshots.
- Verified with focused API/helper tests, `npx tsc --noEmit --pretty false`,
  `npm run build`, and desktop Playwright.

## Step 4. Add Simulation Fixtures For Coaching Cases

Status: completed

Goal:

Create deterministic CSV/import fixtures for the specific coaching cases this
branch is meant to support.

Target scenarios:

- entry near daily/4h resistance
- entry near daily/4h support
- entry with limited clean room
- add after extension
- add into weakness
- add after most MFE is already used
- premature exit
- failed profit protection

Implementation tasks:

- Prefer existing trade-analysis request fixtures where possible.
- Add CSV-style fixtures only when the import path needs them.
- Keep fixtures synthetic and deterministic.
- Use stub/fixture levels-system data, not live providers.
- Label each fixture with the behavior it is intended to prove.

Acceptance criteria:

- Fixtures produce stable decision-review insight IDs.
- Fixtures do not require live broker or candle calls.
- Fixture intent is documented.

Completed:

- Added deterministic CSV scenarios:
  `src/lib/trader-analytics/__fixtures__/decision-review-csv-scenarios.ts`
- Scenarios cover sample daily/4h market context and repeated-add behavior
  through the import bridge.

## Step 5. Run End-To-End Prototype Simulations

Status: completed

Goal:

Prove that import -> server decision review -> UI panel produces the intended
coaching facts.

Implementation tasks:

- Add unit/integration tests for import-to-decision-review helper output.
- Add Playwright route tests for at least one positive market-context scenario.
- Assert expected insight IDs when fixtures support them:
  - `entry_near_daily_4h_resistance`
  - `entry_limited_clean_room_to_resistance`
  - `adds_after_trade_already_used_range`
  - `trade_window_excursion_measured`
- Assert VWAP/EMA feedback remains disabled.

Acceptance criteria:

- Tests prove the path produces trader-readable decision-review facts.
- Tests prove missing market context degrades gracefully.

Completed:

- Bridge tests assert stable insight IDs from CSV scenarios.
- Playwright now intercepts the server route and proves the client can attach
  decision-review snapshots to the `Prototype Analysis` panel.

## Step 6. Improve The Review Surface

Status: completed

Goal:

Make the UI read like trader coaching instead of diagnostic plumbing.

Implementation tasks:

- Show:
  - coaching headline
  - fix-first behavior
  - top entry issue
  - top scaling issue
  - top exit issue
  - top market-context issue
  - top trade-window movement fact
- Keep text compact and evidence-backed.
- Keep market-context facts visually separated from execution-only facts.
- Avoid generic advice without evidence.

Acceptance criteria:

- A user can see what mattered in the trade without opening raw debug output.
- The panel remains readable on mobile.

Completed:

- Decision-review insights now show category and evidence when attached.
- The panel keeps execution autopsy and daily/4h decision-review signals
  separated.

## Step 7. Keep The Boundary Clean

Status: completed

Goal:

Add regression tests that prevent local market-intelligence duplication.

Implementation tasks:

- Add tests or static assertions proving client dry-run code does not import:
  - `levels-system-phase1`
  - trade-analysis server modules
  - support/resistance builders
- Add tests proving:
  - `generatedFrom.vwapEmaFeedbackUsed` is false
  - no local support/resistance/VWAP/EMA computation appears in
    trader-analytics client workflow code
  - market-context claims require `marketContextSource =
    "levels_system_daily_4h"`

Acceptance criteria:

- The app consumes neutral facts; it does not rebuild them locally.

Completed:

- Added boundary tests:
  `src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-boundary.test.ts`
- Tests prove the client does not import server market-analysis modules and
  market context only counts as used when a precomputed daily/4h source is
  supplied.

## Step 8. Update Docs And Handoff

Status: completed

Goal:

Keep future sessions aligned with the actual implementation.

Docs to update:

- this file
- `src/docs/codex-project-log.md`
- `src/docs/trader-functional-readiness-next-handoff.md`
- `src/docs/trader-feedback-capabilities.md`
- any API/contract docs introduced during this branch

Acceptance criteria:

- Completed statuses are current.
- Remaining next step is explicit.
- Verification commands and results are recorded.

Completed:

- Updated this plan.
- Updated `src/docs/codex-project-log.md`.
- Updated `src/docs/trader-functional-readiness-next-handoff.md`.
- Updated `src/docs/trader-feedback-capabilities.md`.

## Step 9. Full Verification

Status: completed

Goal:

Close the branch with bounded, non-watch verification.

Required commands:

```bash
npx tsc --noEmit --pretty false
npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts
npx vitest run src/lib/trader-analytics/__tests__/*decision-review*.test.ts
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-mobile
npm run build
npm test -- --reporter=dot
```

Acceptance criteria:

- Focused tests pass.
- Desktop/mobile route tests pass.
- Build passes.
- Full Vitest passes.
- Any remaining process caveat is documented.

Completed verification:

```bash
npx tsc --noEmit --pretty false
npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-boundary.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts --reporter=dot
npm run build
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-mobile
npm test -- --reporter=dot
```

Results:

- focused Vitest: 5 files passed, 33 tests passed
- desktop Playwright: 7 tests passed
- mobile Playwright: 7 tests passed
- full Vitest: 90 files passed, 816 tests passed

Note:

- Desktop and mobile Playwright must run sequentially because both use the
  configured `127.0.0.1:3100` web server.
- A post-verification process check did not show leftover `vitest`, `next
  build`, or Playwright server commands from this branch. Existing unrelated
  Node processes from sibling `levels-system` scripts were still present.

## Progress Log

- 2026-05-05: Plan created.
- 2026-05-05: Step 1 completed. Desktop Playwright now covers ready, blocked,
  open-position review, fee/commission, and visual smoke states.
- 2026-05-05: Step 2 completed. Added server-only dry-run decision-review
  bridge with tests for completed, blocked, and open-position inputs.
- 2026-05-05: Step 3 completed. Added decision-review API route and
  button-driven client attachment path for `/import-dry-run`.
- 2026-05-05: Steps 4 and 5 completed. Added deterministic CSV scenarios and
  route/UI simulation coverage for attached decision-review snapshots.
- 2026-05-05: Steps 6 and 7 completed. Improved visible decision-review signal
  evidence and added boundary regression tests.
- 2026-05-05: Steps 8 and 9 completed. Docs updated, verification passed, and
  the final process check found no leftover bounded test/build runner commands
  from this branch.
