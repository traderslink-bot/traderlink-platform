# Import And Coaching Audit Plan - 2026-05-06

## Purpose

Move the project forward by auditing the real user loop from broker CSV import
to grouped executions to decision-review coaching.

This branch should prioritize correctness and truthfulness over new behavior
families. If buy/sell execution math, grouping, or evidence alignment is wrong,
coaching output is not trustworthy.

## Scope

### Step 1: Import Workflow Audit

Trace and verify:

- CSV broker detection and preset handling.
- IBKR activity statement parsing.
- Generic buy/sell CSV parsing.
- Buy/sell side normalization, including signed quantities when applicable.
- Long and short trade grouping.
- Adds, reductions, partial exits, full exits, and open-position handling.
- Same-symbol multiple trade separation.
- Duplicate fills, reversed timestamps, missing fields, and rejected rows.
- Fees, commissions, and broker net amount handling where supported.
- Timezone handling, especially IBKR account-timezone inputs.

### Step 2: Decision Review / Coaching Truth Audit

Trace and verify:

- Grouped trades produce decision reviews only when enough factual data exists.
- Execution/P&L-only rows do not make candle-backed movement or level claims.
- Candle-basis mismatch rows remain execution/P&L-only.
- `fixFirstBehaviorId` is backed by visible review evidence.
- No stale `premature_exit` without `exit_left_continuation`.
- No stale `poor_profit_protection` without `profit_protection_failed`.
- No `profit_protection_failed` shown beside `exit_captured_trade_well`.
- No stale `adding_into_weakness` without `adds_increased_risk_into_weakness`.
- No stale `undersized_winner` without `winner_stayed_undersized`.
- Generic/fallback headlines stay at zero in calibration-style paths.

## Initial Files To Inspect

- `src/lib/execution-sources/csv`
- `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`
- `src/lib/trader-analytics/server/csv-dry-run-decision-review-bridge.ts`
- `src/lib/trader-analytics/server/decision-review-calibration-readiness.ts`
- `src/lib/trade-analysis/review/build-trade-decision-review.ts`
- `app/import-dry-run`
- `app/api/import-dry-run`
- `tests/e2e/import-dry-run.spec.ts`
- focused trader-analytics tests under `src/lib/trader-analytics/__tests__`

## Guardrails

- Do not broaden provider/backfill work.
- Do not add new behavior families during this audit.
- Do not tune coaching against missing, stubbed, or price-basis-mismatched
  candles.
- Preserve private IBKR CSV/artifact confidentiality.
- Keep changes narrow and evidence-backed.
- Treat short executions as defensive import/math coverage only for the current
  beta. Do not expand short-specific coaching, analytics promises, or
  short-trader product language during this launch path.

## Verification Targets

Minimum after code changes:

```bash
npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot
npx tsc --noEmit --pretty false
```

Add focused parser/grouping tests when import behavior changes.

Run `/import-dry-run` Playwright coverage if UI or route behavior changes.

## Working Notes

- 2026-05-06: Plan created. Next action is to trace CSV parsing/grouping and
  compare existing coverage against the import audit checklist.
- 2026-05-06: Import pipeline trace completed. Existing coverage already
  includes IBKR activity statement preambles, signed IBKR quantities, stocks-only
  filtering, broker-local timezone conversion, fees/commissions/net amount,
  options quarantine, generic shorts, over-reduction splits, open-position
  diagnostics, session/time-gap grouping splits, duplicate import fingerprints,
  incomplete rows, and representative generic broker fixtures.
- 2026-05-06: Decision-review truth trace completed. Existing coverage already
  protects execution-only fallback rows, unsafe candle-basis notes,
  market-context-unavailable diagnostics, short-side wording, required
  daily/4h headline/evidence fragments, forbidden VWAP/EMA wording, and stale
  behavior invariant buckets.
- 2026-05-06: Small hardening patch added:
  - `/api/import-dry-run/decision-review` now validates `columnMapping` values
    before calling the workflow, returning a 400 contract error for malformed
    payloads instead of allowing a downstream 500.
  - Direct bridge scenario tests now enforce scenario
    `requiredHeadlineFragments` and `forbiddenTextFragments`, not only insight
    and evidence expectations.
- 2026-05-06 verification:
  - `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot`
    passed with `55/55` tests.
  - `npx tsc --noEmit --pretty false` passed.
- 2026-05-06: `/import-dry-run` UI surface pass completed. Added a visible
  Behavior Evidence Alignment summary to the prototype-analysis panel so
  attached decision reviews show whether fix-first behavior labels are backed
  by visible insights before users drill into individual trade evidence.
- 2026-05-06: Tightened import dry-run E2E coverage for the new alignment
  summary and repaired a premature-exit fixture so its fix-first label is
  backed by visible `exit_left_continuation` evidence.
- 2026-05-06 UI verification:
  - `npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-api-route.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts --reporter=dot`
    passed with `31/31` tests.
  - `npx tsc --noEmit --pretty false` passed.
  - `npm run build` passed.
  - `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
    passed with `13/13` tests after rebuilding the production bundle served by
    the Playwright config.
- 2026-05-06: Execution-readiness UI pass completed. Added a top-level
  Execution Readiness summary to `/import-dry-run` so the ready/blocked/review
  state for buy/sell executions is visible alongside grouped-trade count, open
  positions, gross-only cost policy, and dry-run-only write safety.
- 2026-05-06: Tightened `/import-dry-run` E2E coverage for ready, blocked, and
  open-position states:
  - ready imports show `Execution ready`, `write safety: dry-run only`, and
    `gross-only`.
  - blocked imports show `Execution blocked` and rejected-row count.
  - open-position imports show `Execution review needed` and the open-position
    count.
- 2026-05-06 execution-readiness verification:
  - `npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/trader-analytics/__tests__/trader-functional-product-readiness.test.ts --reporter=dot`
    passed with `22/22` tests.
  - `npx tsc --noEmit --pretty false` passed.
  - `npm run build` passed.
  - `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
    passed with `13/13` tests.
- 2026-05-06: Import-health/reporting clarity pass completed. Added safety
  policy bands to `/imports`, `/import-health`, and `/import-trials` so these
  reporting surfaces repeat the same key facts as `/import-dry-run`:
  review-only/no production broker-row writes, gross-only feedback scoring, and
  fees/broker net amounts as reconciliation context.
- 2026-05-06 reporting verification:
  - `npx tsc --noEmit --pretty false` passed.
  - `npm run build` passed.
  - `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --grep "keeps import reporting surfaces explicit"`
    passed with `1/1` focused browser test.
- 2026-05-08 scope correction after saved-import hardening:
  - Generic broker import coverage was expanded for odd headers, mixed timestamp
    formats, BOT/SLD side aliases, repeated partial exits, fee/cost visibility,
    duplicate-like fills, zero/blank quantity repair, and defensive short
    parsing.
  - Short parsing/math coverage should not be interpreted as a decision to ship
    short-trader coaching in the current beta.
  - Future work should keep shorts conservative unless a dedicated
    short-feedback plan is created.

## Forward Work Plan

### Step 3: End-To-End Import Contract Hardening

- Add a shared route/product contract that asserts every import-facing surface
  exposes write-safety, gross-only policy, broker support scope, and
  production/no-export boundaries.
- Extend route smoke coverage for `/imports`, `/import-health`,
  `/import-trials`, `/repair-wizard`, `/review-cockpit`, and `/calibration`.
- Keep this focused on copy/contract safety, not new import behavior.

Status: completed 2026-05-06.

- Added `buildImportFacingRouteContract()` with policy surfaces for
  `/import-dry-run`, `/imports`, `/import-health`, `/import-trials`,
  `/repair-wizard`, `/review-cockpit`, and `/calibration`.
- Added safety-policy bands to `/repair-wizard`, `/review-cockpit`, and
  `/calibration` so every import-facing contract route has visible
  write-safety and gross-only policy copy.
- Rewired the focused Playwright route policy test to iterate the shared
  contract instead of hard-coded route assertions.
- Verification:
  - `npx vitest run src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts --reporter=dot`
    passed with `18/18` tests.
  - `npx tsc --noEmit --pretty false` passed.
  - `npm run build` passed.
  - `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --grep "keeps import reporting surfaces explicit"`
    passed with `1/1` focused browser test.

### Step 4: Buy/Sell Execution Fixture Matrix

- Promote the highest-risk broker CSV cases into a small named fixture matrix:
  long win, long loss, short win, short loss, partial exit, over-reduction,
  same-symbol split trades, open position, rejected row, and fees/net amount.
- Assert accepted execution count, grouped trade count, lifecycle status,
  final position, gross P/L, and warnings for each case.
- Use this to protect buy/sell execution math before touching coaching logic.

Status: completed 2026-05-06.

- Added `buildBuySellExecutionFixtureMatrix()` and
  `runBuySellExecutionFixtureMatrix()`.
- The matrix covers:
  - long winner and long loser
  - short winner and short loser
  - partial exit
  - over-reduction split into a short remainder
  - same-symbol separate flat trades
  - open position with realized partial P/L visible but review-gated
  - rejected row with blocked confidence
  - fees/net amount reconciliation with gross-only feedback P/L preserved
- Verification:
  - `npx vitest run src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts --reporter=dot`
    passed with `39/39` tests.
  - `npx tsc --noEmit --pretty false` passed.

### Step 5: Coaching Regression Matrix

- Build a compact matrix of decision-review cases that confirms each visible
  behavior label has matching visible insight evidence.
- Keep invariant counters at zero for stale labels and contradictory exit
  evidence.
- Add one negative fixture per protected behavior family so future copy changes
  cannot silently reintroduce stale coaching.

Status: completed 2026-05-06.

- Added `buildCoachingBehaviorEvidenceMatrix()` and
  `runCoachingBehaviorEvidenceMatrix()`.
- The matrix covers backed and stale cases for:
  - `poor_profit_protection`
  - `premature_exit`
  - `adding_into_weakness`
  - `undersized_winner`
  - contradictory `profit_protection_failed` plus `exit_captured_trade_well`
- Verification:
  - `npx vitest run src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts src/lib/trader-analytics/__tests__/coaching-behavior-evidence-matrix.test.ts src/lib/trader-analytics/__tests__/decision-review-calibration-readiness.test.ts --reporter=dot`
    passed with `9/9` tests.
  - `npx vitest run src/lib/trader-analytics/__tests__/buy-sell-execution-fixture-matrix.test.ts src/lib/trader-analytics/__tests__/coaching-behavior-evidence-matrix.test.ts src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts --reporter=dot`
    passed with `26/26` tests.
  - `npx tsc --noEmit --pretty false` passed.
  - `npm run build` passed.

### Step 6: First-User Workflow QA

- Run and tighten the existing first-user/browser flows from onboarding into
  import dry run, repair, grouping review, coaching, and reporting.
- Fix only concrete UX gaps: missing state, unclear action, hidden limitation,
  or broken mobile layout.
- Capture screenshots or Playwright evidence for the critical desktop/mobile
  path.

Status: completed 2026-05-06 for the desktop first-user hardening path.

- Ran the existing first-user/hardening suite on `chromium-desktop`.
- Tightened the onboarding-to-import dry-run journey so it now asserts the
  Execution Readiness summary after row repair, including `Execution ready`,
  `write safety: dry-run only`, and `gross-only`.
- Verification:
  - `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop`
    passed with `7/7` applicable tests and `1` Firefox-only skip.
  - `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop --grep "guides a first user"`
    passed with `1/1` focused browser test after tightening the assertion.

### Step 7: Real-Data Readiness Report Without Private Artifacts

- Produce a public-safe readiness summary that reports aggregate counts only:
  imports parsed, grouped trades, completed decision reviews, fallback rows,
  unsafe candle-basis rows, stale invariant counters, and remaining data gaps.
- Keep private IBKR CSV paths and private artifact contents out of docs.
- Use this as the go/no-go summary before any broader productionization pass.
