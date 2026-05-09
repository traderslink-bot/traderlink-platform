# Trader Import Intelligence Workflow Expansion Plan

## Summary

This branch deepens `/import-dry-run` again, but keeps the same product rules:
the route is still a rough workflow surface, not the final website UI; nothing
is saved; no export/download controls are added; and candle/support-resistance
or market-structure work remains owned by `levels-system`.

The goal is to make the dry-run import loop feel more complete for an end user:
they should understand what changed after a repair, why the file is or is not
ready, what review items would be created later, how P/L reconciliation looks,
which import anomalies need attention, and how trades could be tagged for
future playbook analysis.

## Product Decisions

- Use deterministic view-model data only.
- Keep all new state local to `/import-dry-run`.
- Treat setup/playbook tags as user labels, not market-validated setups.
- Do not let market context affect any import readiness, queue, anomaly, or
  feedback conclusion.
- Prefer useful rough UI over final visual polish.
- Keep future persistence events explicit but unsaved.

## Step 1. Import Before vs After Repair Diff

Status: complete

Goal:

Show the impact of row repairs so the user can see whether edits improved the
import.

Detailed tasks:

- Build a `CsvDryRunRepairImpactDiff` model from the current parser state.
- Compare current counts against an initial baseline when available later; for
  now expose the current accepted/rejected/skipped/trade count and the
  improvement opportunities that remain.
- Add local UI state to remember the previous parser snapshot after a row edit.
- Show:
  - accepted executions gained
  - rejected rows fixed
  - skipped rows changed
  - grouped trades changed
  - confidence score changed
  - rows still needing repair
- Keep this as client state only.

Acceptance criteria:

- Editing a missing-symbol sample can show a before/after repair impact.
- The model is still useful with no prior snapshot.
- No saved repair history is implied.

## Step 2. P/L Reconciliation Assistant

Status: complete

Goal:

Explain broker net amount, gross execution P/L, fees, commissions, and mismatch
status in product language.

Detailed tasks:

- Build a `CsvDryRunPnlReconciliationAssistant` model from existing
  `pnlReconciliation` and `netPnlPreview` diagnostics.
- For each grouped trade, show:
  - broker net amount when available
  - app gross-minus-known-costs when available
  - difference
  - status
  - explanation
  - suggested review action
- Add an overall summary and worst mismatch item.
- Keep open-position items clearly limited.

Acceptance criteria:

- Closed trades with broker net data show reconciliation copy.
- Open or insufficient trades are marked as not final.
- No market data is used.

## Step 3. Import Readiness Score Breakdown

Status: complete

Goal:

Split the confidence gate into understandable sub-scores.

Detailed tasks:

- Add a `CsvDryRunReadinessScoreBreakdown` model with dimensions:
  - column mapping readiness
  - row validity
  - grouping confidence
  - P/L confidence
  - duplicate risk
  - broker support confidence
- Each dimension includes:
  - score from 0-100
  - status
  - detail
  - next action
- Show a weighted overall score and blocker/review counts.

Acceptance criteria:

- Blocked imports explain exactly which dimension is blocking.
- Ready imports show all dimensions as ready or review.
- Scores are deterministic and bounded 0-100.

## Step 4. Post-Import Review Queue Preview

Status: complete

Goal:

Show what the app would ask the user to review after a future saved import.

Detailed tasks:

- Build a `CsvDryRunPostImportReviewQueuePreview` model.
- Create queue items from:
  - rejected repair rows
  - open positions
  - grouping warnings
  - P/L mismatches
  - execution feedback risks
  - anomalies
  - ready trades
- Each item includes priority, lane, title, reason, related rows/trades, and
  suggested next action.
- Keep output as preview-only.

Acceptance criteria:

- Open-position dry runs create an open-position review item.
- Ready closed trades create a ready-for-feedback item.
- Queue priority is stable.

## Step 5. Trade Feedback Preview Comparison

Status: complete

Goal:

Summarize multiple feedback preview trades in a way that feels like a coach
preview.

Detailed tasks:

- Build a `CsvDryRunFeedbackComparison` model from feedback preview items.
- Identify:
  - best preview trade
  - worst preview trade
  - most risky execution behavior
  - most repeatable strength
  - highest-priority review item
- Use execution-only feedback labels and P/L.
- Mark sample-size limitations.

Acceptance criteria:

- One-trade imports still show a useful comparison summary.
- Multi-trade imports rank by available execution-only facts.
- Market context remains unused.

## Step 6. Broker Mapping Learning Console

Status: complete

Goal:

Prepare an internal/admin-style view for learning from unknown headers and
manual mapping corrections later.

Detailed tasks:

- Build a `CsvDryRunBrokerMappingLearningConsole` model.
- Show:
  - selected broker
  - mapping confidence level/score
  - detected headers
  - mapped fields
  - missing required fields
  - explicit user mappings
  - promoted/known vs unknown header signals
  - learning recommendation
- Keep it in-app and deterministic with no persistence.

Acceptance criteria:

- Unknown-header sample produces learning recommendations.
- Known broker samples show lower urgency.
- No admin persistence is implemented.

## Step 7. Import Session Summary

Status: complete

Goal:

Give the dry-run flow a clear “where we landed” summary.

Detailed tasks:

- Build a `CsvDryRunSessionSummary` model.
- Include:
  - rows parsed
  - accepted executions
  - rejected rows
  - skipped rows
  - grouped trades
  - trades ready
  - trades needing review
  - feedback previews produced
  - highest-priority next action
  - readiness status
- Surface it near the top and again near the end.

Acceptance criteria:

- A user can tell whether the dry run is blocked, review-needed, or ready.
- The summary does not imply the import was saved.

## Step 8. Execution Anomaly Detector

Status: complete

Goal:

Catch suspicious execution/import shapes before feedback is trusted.

Detailed tasks:

- Build a `CsvDryRunExecutionAnomalyDetector` model.
- Detect:
  - duplicate-like same-row/same-timestamp fills
  - impossible or confusing reversal / over-reduction split signals
  - missing closing side / open leftover
  - huge size jumps relative to first fill
  - zero/negative price through existing parser issues
  - same timestamp execution clusters
  - fees larger than trade value
  - rejected option rows
- Each anomaly includes severity, confidence, evidence, and suggested action.
- Keep detection execution/import-only.

Acceptance criteria:

- Open-position sample produces an open-leftover anomaly.
- Cancelled/skipped rows and rejected rows produce import-quality anomalies.
- No candle or market context is used.

## Step 9. Setup / Playbook Tagging During Import

Status: complete

Goal:

Let the user label trades during import so future analytics can learn their
playbook language.

Detailed tasks:

- Add setup tag options:
  - scalp
  - breakout
  - reversal
  - dip buy
  - momentum
  - unknown
- Build a `CsvDryRunSetupTaggingModel` with default suggestions.
- Add local UI state so each grouped trade can be tagged.
- Show that tags are user labels only and not chart-validated.
- Do not change scoring, feedback, or market conclusions.

Acceptance criteria:

- Grouped trades can be tagged locally.
- Tags appear in the decision summary.
- The copy does not claim setup quality.

## Files To Update

- Add this plan file:
  `src/docs/trader-import-intelligence-workflow-expansion-plan.md`
- Extend:
  `src/lib/trader-analytics/product/types.ts`
- Extend:
  `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`
- Extend:
  `src/lib/trader-analytics/index.ts`
- Update:
  `app/import-dry-run/import-dry-run-client.tsx`
- Add focused tests under:
  `src/lib/trader-analytics/__tests__`
- Update `README.md` and `src/docs/codex-project-log.md` after verification.

## Verification Plan

- `npx vitest run src/lib/trader-analytics/__tests__/trader-import-intelligence-workflow-expansion.test.ts`
- `npx vitest run src/lib/trader-analytics/__tests__`
- `npx tsc --noEmit`
- `npm run verify:all`
- `npm run lint`
- `npm run build`
- Smoke-test `/import-dry-run`.

## Completion Log

- 2026-05-03: Plan created. Implementation in progress.
- 2026-05-03: Completed the full nine-step import intelligence workflow
  expansion.
  - Added repair impact before/after diff snapshots, including support for a
    client-provided previous parser state after local row edits.
  - Added a P/L reconciliation assistant that explains broker net amount,
    app gross-minus-known-costs, differences, statuses, and suggested review
    actions.
  - Added readiness score breakdown dimensions for column mapping, row validity,
    grouping confidence, P/L confidence, duplicate risk, and broker support.
  - Added post-import review queue preview from repair items, grouping warnings,
    P/L mismatches, feedback risks, anomalies, and ready trades.
  - Added trade feedback preview comparison for best/worst preview trade, top
    risk, repeatable strength, highest-priority queue item, and sample-size
    limits.
  - Added broker mapping learning console for detected headers, missing fields,
    explicit mappings, unknown headers, and learning urgency.
  - Added import session summary for rows, repairs, grouped trades, feedback
    previews, readiness status, and highest-priority next action.
  - Added execution anomaly detector for open leftovers, invalid price/size
    signals, skipped non-filled orders, rejected options rows, over-reduction
    splits, large size jumps, duplicate-like fills, timestamp clusters, and
    fee/value anomalies.
  - Added setup/playbook tagging as client-state-only user labels with no chart
    validation and no scoring impact.
  - Updated `/import-dry-run` to display all new workflow panels.
  - Added focused regression coverage in
    `src/lib/trader-analytics/__tests__/trader-import-intelligence-workflow-expansion.test.ts`.
  - Verification passed:
    - focused dry-run intelligence tests passed with 3 files / 22 tests.
    - `npx vitest run src/lib/trader-analytics/__tests__` passed with 17
      files / 118 tests.
    - `npx tsc --noEmit` passed.
    - `npm run verify:all` passed with 85 files / 779 tests plus shared-engine,
      Layer 2, and Layer 3 checkpoints.
    - `npm run lint` passed with 0 errors and 4 pre-existing warnings.
    - `npm run build` passed and produced `/import-dry-run`.
    - Existing dev server smoke at `http://localhost:3000/import-dry-run`
      returned 200 and included all nine new panels.
