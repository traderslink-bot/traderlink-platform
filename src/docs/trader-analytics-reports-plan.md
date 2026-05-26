# Trader Analytics Reports Plan

Status: Historical reports-lane plan. Do not use as the current implementation
plan; start from root `plan.md` and the plan index.

## Purpose

This document tracks the trader analytics report lane.

The goal is to turn many trade-level feedback summaries into end-user reports
that help a trader see behavior patterns across trades.

This can be built before real trade calibration exists by using:

- execution-feedback request fixtures
- synthetic saved-trade batches
- future user/imported trade requests
- later real saved execution data
- later candle/market-context summaries from `levels-system`

Market hours do not block this work. The first useful version can run entirely
from saved request JSON and execution-only feedback summaries.

## Product Goal

Given a group of trades, the app should answer:

- How many trades were reviewed?
- How many were gross winners vs gross losers?
- What was total and average gross execution-only P/L?
- How often did the trader leave positions open?
- How often did the trader add at adverse execution prices?
- How often did the trader add multiple times before reducing risk?
- How often did rapid-fire execution clusters appear?
- What were the most common execution risks?
- What were the most common execution strengths?
- What was the most common primary focus?
- Are the trader's problems mostly sizing, sequencing, risk reduction, exit
  structure, timing, or P/L?
- What should the trader review first?

Later, when candle/market context is available, reports can also answer:

- How often did execution issues happen near support/resistance?
- How often did market context confirm or soften an execution warning?
- Which symbols, sessions, or market-structure states produced the same
  behavior?
- Which behaviors appear only in certain market conditions?

## Product Boundaries

The first report version should be conservative.

It can say:

- "Across these 12 trades, adverse-price adds appeared in 5 trades."
- "Open-position leftovers appeared in 2 trades."
- "Your most common primary execution focus was size expansion after adverse
  price."
- "Gross realized P/L excludes commissions, fees, borrow costs, and slippage."

It should not say yet:

- "This trader is objectively undisciplined."
- "This is statistically proven."
- "This is your permanent trader identity."
- "The setup quality was bad."
- "You ignored support/resistance."
- "You traded against market structure."

Those stronger conclusions require real saved data, calibration, and
market-context validation.

## Relationship To Existing Work

This lane should consume the execution-feedback contracts already built:

- `src/lib/execution-feedback/build-execution-feedback-facts.ts`
- `src/lib/execution-feedback/execution-behavior-patterns.ts`
- `src/lib/execution-feedback/summary/build-execution-feedback-summary.ts`
- `src/lib/execution-feedback/run-execution-feedback.ts`
- `src/lib/execution-feedback/batch/run-execution-feedback-batch.ts`

It should not duplicate execution-feedback logic.

It should aggregate summaries and point IDs.

It should not require candle data, provider calls, or `levels-system` for the
first version.

Full trade-analysis summaries can be added later as an optional input source.

## End-User Product Data Policy

This app is intended to become an end-user product, not a personal local tool.

For end users, trader analytics data should stay inside the app.

Do not build end-user JSON, CSV, spreadsheet, or raw-data export as a product
feature unless the product strategy changes explicitly.

The product should give users reasons to return to the app:

- saved in-app report history
- in-app progress views
- in-app before/after comparisons
- drill-down from chart bars into the source trades
- report notes and review status inside the app
- controlled, permissioned views if sharing is ever needed later

Allowed internal/debug behavior:

- `/debug/` routes may show raw JSON for development and QA
- admin-only diagnostics may inspect raw report contracts
- tests may snapshot report JSON

Production end-user routes should not expose raw JSON panels, CSV downloads, or
one-click data export.

The production end-user roadmap that builds on this completed report foundation
lives in:

```text
src/docs/end-user-trader-analytics-product-roadmap.md
```

## Continuous Work Protocol

This file is the source of truth for trader analytics report work.

When the user says to continue, take the next unchecked item in the work queue,
complete it, update this file, run relevant verification, and continue to the
next item unless a stop condition is hit.

Do not wait for a new prompt between normal implementation steps.

### Working Rules

- Build report contracts before UI.
- Use execution-feedback summaries as the primary input source for v1.
- Keep raw trades, execution-feedback summaries, and report aggregates visibly
  separated.
- Keep report language factual and evidence-bound.
- Include visual chart data in the report contract so UI rendering is
  deterministic and testable.
- Prefer small native SVG/CSS charts first instead of adding a chart dependency
  immediately.
- Add a chart library later only if native charts become too limiting.
- Avoid user-facing claims that require market/candle context unless the report
  explicitly consumes full trade-analysis summaries.
- Use fixture-backed reports until real saved trades are available.
- Update this file whenever phase status, current task, open questions, or the
  best next step changes.
- Update `src/docs/codex-project-log.md` when a phase completes or the resume
  point materially changes.

### Stop Conditions

Pause and ask the user only if:

- a choice would permanently change the public report contract
- a chart or metric would imply calibrated long-term trader identity without
  enough data
- a metric would mix execution-only facts with candle-derived conclusions in a
  misleading way
- a new dependency is required
- an implementation would require moving ownership into `levels-system`
- a destructive filesystem or git operation is required

Otherwise keep going.

### Default Verification Ladder

After a narrow implementation step:

```bash
npx vitest run <new-or-touched-test-files>
npx tsc --noEmit
```

After adding an API route or debug page:

```bash
npm run build
npm run lint
```

After completing a phase:

```bash
npm run verify:all
```

Existing lint warnings can be left alone if the command exits successfully, but
new lint errors must be fixed.

## Current Status Board

| Phase | Status | Output |
| --- | --- | --- |
| Phase 1: Report inventory and contract | Completed | `trader_analytics_report_v1` design |
| Phase 2: Report aggregation engine | Completed | `src/lib/trader-analytics/build-trader-analytics-report.ts` |
| Phase 3: Chart data and visual model | Completed | `src/lib/trader-analytics/charts/` |
| Phase 4: API and debug report route | Completed | `/api/trader-analytics/debug` |
| Phase 5: Visual dashboard UI | Completed | `/debug/trader-analytics` |
| Phase 6: Full analysis and future real-data bridge | Completed | optional full-analysis aggregation |

## Current Task Pointer

Current task: complete.

Current phase: complete.

Next action: use `/debug/trader-analytics` with real saved execution batches
when those trades are available; future enhancements can add filters,
drill-downs, saved in-app report history, in-app comparisons, and a separately
calibrated market-context section.

## Recommended First Build

Build the first report from execution-feedback summaries only.

Input:

```ts
unknown[]
```

where each item is one public trade request using the same shape accepted by:

```text
POST /api/execution-feedback/debug
```

Process:

1. Parse one request, `{ request }`, `{ trade }`, `{ requests }`, `{ trades }`,
   or an array.
2. Run each request through `runBatchExecutionFeedback(...)`.
3. Aggregate completed summaries.
4. Preserve validation failures separately.
5. Return a stable report contract with chart-ready data.

Output:

```ts
interface TraderAnalyticsReport {
  contractVersion: "trader_analytics_report_v1";
  dataSource: "execution_feedback_summaries";
  generatedAt: string;
  sampleSize: {...};
  pnl: {...};
  executionBehavior: {...};
  distributions: {...};
  topRisks: [...];
  topStrengths: [...];
  primaryFocusCounts: [...];
  charts: {...};
  warnings: string[];
  limitations: string[];
}
```

## Report Metrics

### Sample Size

Fields:

- `requestCount`
- `completedTradeCount`
- `failedTradeCount`
- `validatedOnlyCount`
- `warningCount`
- `symbols`
- `sessionBuckets`
- `tradeDirections`

Why it matters:

The user needs to know how much evidence the report is based on.

### P/L Metrics

Execution-only fields:

- `grossTotalRealizedPnl`
- `grossAverageRealizedPnl`
- `grossMedianRealizedPnl`
- `grossWinnerCount`
- `grossLoserCount`
- `grossFlatCount`
- `grossWinRate`
- `bestGrossTrade`
- `worstGrossTrade`

Important wording:

- Always say gross.
- Always say commissions/fees excluded.
- Do not imply account-level net performance.

### Lifecycle Metrics

Fields:

- `openPositionTradeCount`
- `closedToFlatTradeCount`
- `openPositionRate`
- `averageMaxPositionSize`
- `averageFinalPositionSize`
- `averageDurationSeconds`
- `medianDurationSeconds`

Visuals:

- closed vs open donut
- duration histogram
- gross P/L by trade bar chart

### Execution Behavior Metrics

Fields:

- `adversePriceAddTradeCount`
- `adversePriceAddRate`
- `multipleAddsBeforeReductionTradeCount`
- `multipleAddsBeforeReductionRate`
- `overbuiltPositionTradeCount`
- `openPositionLeftoverTradeCount`
- `rapidFireExecutionTradeCount`
- `inconsistentShareSizingTradeCount`
- `smallFirstRiskReductionTradeCount`
- `allOrNothingExitAfterManyAddsTradeCount`

Visuals:

- top risks horizontal bar chart
- risk family distribution stacked bar or grouped bars
- primary focus distribution

### Strength Metrics

Fields:

- `cleanSingleEntryFullExitCount`
- `controlledScaleInCount`
- `structuredPartialExitSequenceCount`
- `earlyPositionRiskReductionCount`
- `decisiveFullExitCount`
- `consistentShareSizingCount`
- `profitableReductionSequenceCount`

Visuals:

- top strengths horizontal bar chart
- strength vs risk count comparison

### Category Metrics

Report point categories:

- `position_construction`
- `size_discipline`
- `risk_reduction`
- `exit_structure`
- `timing`
- `pnl`

Fields:

- counts by category
- risk counts by category
- strength counts by category
- primary focus category counts

Visuals:

- category heatmap
- category stacked bars

## Visual Dashboard Plan

The first end-user dashboard should show usable analytics immediately, not a
marketing page.

Route:

```text
/debug/trader-analytics
```

API:

```text
POST /api/trader-analytics/debug
GET  /api/trader-analytics/debug
```

### Dashboard Sections

1. Header and data quality strip
   - report generated time
   - request count
   - completed count
   - failed count
   - limitations visible but not dominant

2. KPI band
   - total gross P/L
   - gross win rate
   - completed trades
   - most common primary focus
   - adverse-add rate
   - open-position rate

3. P/L visuals
   - gross P/L by trade bar chart
   - winner/loser/flat donut
   - best/worst trade callouts

4. Behavior risk visuals
   - top risks horizontal bars
   - primary focus distribution
   - risk category distribution

5. Strength visuals
   - top strengths horizontal bars
   - strength category distribution

6. Timing and lifecycle visuals
   - trade duration histogram
   - open vs closed donut
   - rapid-fire cluster rate

7. Trade table
   - symbol
   - direction
   - session
   - gross P/L
   - primary focus
   - top risk
   - top strength
   - warnings

8. Raw JSON panel
   - debug-only collapsible raw `trader_analytics_report_v1`
   - do not carry this panel into production end-user routes

### Visual Components

Initial native components:

- `KpiCard`
- `HorizontalBarChart`
- `DonutChart`
- `SparkBarSeries`
- `DistributionBar`
- `CategoryHeatmap`
- `TradeAnalyticsTable`

Use native SVG or CSS for first implementation.

Avoid:

- installing a chart dependency before the visual needs prove it
- decorative charts that do not answer a trader question
- single-hue dashboards
- tiny illegible labels
- charts that hide sample size

## Proposed File Structure

Core:

```text
src/lib/trader-analytics/types/trader-analytics-report.ts
src/lib/trader-analytics/build-trader-analytics-report.ts
src/lib/trader-analytics/run-trader-analytics-report.ts
src/lib/trader-analytics/batch/run-trader-analytics-report-batch.ts
```

Chart data:

```text
src/lib/trader-analytics/charts/build-trader-analytics-chart-data.ts
src/lib/trader-analytics/types/trader-analytics-chart.ts
```

Tests:

```text
src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts
src/lib/trader-analytics/__tests__/run-trader-analytics-report.test.ts
src/lib/trader-analytics/__tests__/trader-analytics-fixtures.test.ts
src/lib/trader-analytics/__tests__/trader-analytics-api-route.test.ts
```

App:

```text
app/api/trader-analytics/debug/route.ts
app/debug/trader-analytics/page.tsx
app/debug/trader-analytics/trader-analytics-debug-client.tsx
app/debug/trader-analytics/components/
```

Docs:

```text
src/docs/trader-analytics-reports-plan.md
src/docs/trader-analytics-report-fixtures/
```

## Fixture Strategy

Use existing fixtures first:

```text
src/docs/trade-analysis-request-fixtures/
```

Initial report fixture batch:

- `long-winner.json`
- `long-loser.json`
- `short-winner.json`
- `short-loser.json`
- `open-position.json`
- `partial-exits.json`
- `repeated-adds-before-reduction.json`
- `inconsistent-share-sizing.json`
- `rapid-fire-execution-cluster.json`

Optional batch wrapper:

```text
src/docs/trader-analytics-report-fixtures/sample-execution-feedback-report-batch.json
```

This wrapper can reference or copy the public request objects. Prefer copy-free
test helpers when possible; prefer JSON fixtures when useful for UI/API manual
testing.

## Limitations To Include In Reports

Every v1 report should include:

- "This report aggregates execution-feedback summaries only."
- "Gross P/L excludes commissions, fees, borrow costs, and slippage."
- "Market context, support/resistance, VWAP/EMA, and candle structure were not
  used unless explicitly shown in a market-context section."
- "Small sample sizes should be treated as review prompts, not statistical
  proof."
- "Trader identity and long-term behavior conclusions require more reviewed
  trades."

## Open Questions

- [ ] `TA-OQ-001` Should report inputs accept already-built
  `ExecutionFeedbackSummary` objects, raw trade requests, or both?
- [ ] `TA-OQ-002` Should the first dashboard live under `/debug/` only, or also
  have a future end-user route?
- [ ] `TA-OQ-003` Should chart components remain native SVG/CSS, or should a
  chart dependency be added later?
- [ ] `TA-OQ-004` What minimum trade count should unlock stronger language?
- [ ] `TA-OQ-005` Should gross P/L charts show currency formatting or plain
  numbers until account currency is known?
- [ ] `TA-OQ-006` Should grouped reports support filters by symbol, date,
  direction, and session in v1 or v2?
- [ ] `TA-OQ-007` Should production end-user routes hide all raw JSON and
  export affordances by default?

Default assumptions:

- `TA-OQ-001`: Accept raw trade requests first; optionally support already-built
  summaries later.
- `TA-OQ-002`: Start under `/debug/trader-analytics`; end-user route comes
  after product copy and visual design are validated.
- `TA-OQ-003`: Start with native SVG/CSS charts.
- `TA-OQ-004`: Use neutral wording for all sample sizes; add stronger language
  only after a future calibration threshold exists.
- `TA-OQ-005`: Use plain signed numbers with "gross" labels until currency is
  known.
- `TA-OQ-006`: Include basic report-level filters later; v1 can aggregate all
  supplied requests.
- `TA-OQ-007`: Yes. Keep raw JSON and raw report contracts on `/debug/` or
  admin-only surfaces. End users should view analytics inside the product.

## Phased Work Plan

### Phase 1: Report Inventory And Contract

Status: Completed

Goal:

Define a stable analytics report contract and decide exactly which metrics are
safe from execution-feedback summaries.

Tasks:

- [x] `TA-001` Inventory execution-feedback summary fields.
- [x] `TA-002` Map summary fields to report metrics.
- [x] `TA-003` Define `trader_analytics_report_v1`.
- [x] `TA-004` Define chart data contracts.
- [x] `TA-005` Define limitations and sample-size warning rules.
- [x] `TA-006` Update this file and mark Phase 2 ready.

Definition of done:

- report contract is documented
- metric formulas are listed
- chart data model is documented
- no implementation behavior changed yet unless small type scaffolding is added

### Phase 2: Report Aggregation Engine

Status: Completed

Goal:

Build the pure report engine that aggregates many execution-feedback summaries.

Tasks:

- [x] `TA-010` Create `src/lib/trader-analytics/` module structure.
- [x] `TA-011` Add report and chart types.
- [x] `TA-012` Build helpers for counts, rates, averages, medians, and top-N.
- [x] `TA-013` Aggregate sample size metrics.
- [x] `TA-014` Aggregate gross P/L metrics.
- [x] `TA-015` Aggregate lifecycle metrics.
- [x] `TA-016` Aggregate behavior-risk metrics.
- [x] `TA-017` Aggregate strength metrics.
- [x] `TA-018` Aggregate category metrics.
- [x] `TA-019` Add unit tests with execution-feedback fixtures.
- [x] `TA-020` Run focused tests and `npx tsc --noEmit`.
- [x] `TA-021` Update this file and mark Phase 3 ready.

Definition of done:

- report can be built from completed execution-feedback summaries
- tests cover mixed winner/loser/open-position/risk fixtures
- report limitations are always included

### Phase 3: Chart Data And Visual Model

Status: Completed

Goal:

Generate chart-ready data from the report contract so the UI has no hidden
aggregation logic.

Tasks:

- [x] `TA-030` Build gross P/L by trade chart data.
- [x] `TA-031` Build win/loss/flat donut data.
- [x] `TA-032` Build top risks bar chart data.
- [x] `TA-033` Build top strengths bar chart data.
- [x] `TA-034` Build primary focus distribution data.
- [x] `TA-035` Build category distribution data.
- [x] `TA-036` Build duration histogram data.
- [x] `TA-037` Add chart-data tests.
- [x] `TA-038` Run focused tests and `npx tsc --noEmit`.
- [x] `TA-039` Update this file and mark Phase 4 ready.

Definition of done:

- every planned chart reads deterministic chart data
- chart data includes labels, values, totals, and empty-state information
- no UI chart performs its own metric aggregation

### Phase 4: API And Debug Route

Status: Completed

Goal:

Expose analytics reports through an app-facing API.

Tasks:

- [x] `TA-040` Add `runTraderAnalyticsReport(...)`.
- [x] `TA-041` Add batch/request document parsing.
- [x] `TA-042` Add `POST /api/trader-analytics/debug`.
- [x] `TA-043` Add `GET /api/trader-analytics/debug`.
- [x] `TA-044` Add API route tests.
- [x] `TA-045` Run focused tests and `npx tsc --noEmit`.
- [x] `TA-046` Update this file and mark Phase 5 ready.

Definition of done:

- API accepts one request, arrays, `{ request }`, `{ trade }`, `{ requests }`,
  or `{ trades }`
- API returns `trader_analytics_report_v1`
- API does not call candle providers or `levels-system`

### Phase 5: Visual Dashboard UI

Status: Completed

Goal:

Build an end-user-useful visual dashboard for report review.

Tasks:

- [x] `TA-050` Add `/debug/trader-analytics` page.
- [x] `TA-051` Add request JSON input and fixture-loaded sample batch.
- [x] `TA-052` Add KPI cards.
- [x] `TA-053` Add gross P/L by trade bar chart.
- [x] `TA-054` Add win/loss donut.
- [x] `TA-055` Add top risks horizontal bar chart.
- [x] `TA-056` Add top strengths horizontal bar chart.
- [x] `TA-057` Add primary focus distribution chart.
- [x] `TA-058` Add duration histogram.
- [x] `TA-059` Add trade table.
- [x] `TA-060` Add raw JSON panel.
- [x] `TA-061` Link from `app/page.tsx`.
- [x] `TA-062` Run `npm run build` and `npm run lint`.
- [x] `TA-063` Update this file and mark Phase 6 ready.

Definition of done:

- dashboard loads sample fixture batch
- dashboard can paste request batches
- visuals are readable on desktop and mobile
- empty/error states are clear
- build and lint pass

### Phase 6: Full Analysis And Real Data Bridge

Status: Completed

Goal:

Prepare the report lane to consume real saved trades and later full
market-context summaries without mixing evidence types.

Tasks:

- [x] `TA-070` Add optional input support for existing execution-feedback
  summary objects if useful.
- [x] `TA-071` Design future full trade-analysis summary aggregation.
- [x] `TA-072` Keep market context in a separate report section.
- [x] `TA-073` Add tests proving execution-only report metrics do not change
  when market context is present.
- [x] `TA-074` Add real-data calibration notes and recommended workflow.
- [x] `TA-075` Run full verification.
- [x] `TA-076` Update docs and mark this roadmap branch complete.

Definition of done:

- report lane is ready for real saved execution batches
- future market-context aggregation has a documented boundary
- execution-only metrics remain reproducible without candles

## Continuous Work Queue

Use this queue when continuing work without interruption.

### Phase 1 Queue

- [x] `TA-001` Inventory report-ready execution-feedback summary fields.
- [x] `TA-002` Define report metric formulas.
- [x] `TA-003` Define `trader_analytics_report_v1` and chart contracts.
- [x] `TA-004` Update this plan and set pointer to `TA-010`.

### Phase 2 Queue

- [x] `TA-010` Create module structure and types.
- [x] `TA-011` Implement aggregation helpers.
- [x] `TA-012` Implement report builder.
- [x] `TA-013` Add report tests.
- [x] `TA-014` Run focused tests and `npx tsc --noEmit`.
- [x] `TA-015` Update this plan and set pointer to `TA-030`.

### Phase 3 Queue

- [x] `TA-030` Implement chart data builders.
- [x] `TA-031` Add chart data tests.
- [x] `TA-032` Run focused tests and `npx tsc --noEmit`.
- [x] `TA-033` Update this plan and set pointer to `TA-040`.

### Phase 4 Queue

- [x] `TA-040` Implement runner and debug API route.
- [x] `TA-041` Add API tests.
- [x] `TA-042` Run focused tests and `npx tsc --noEmit`.
- [x] `TA-043` Update this plan and set pointer to `TA-050`.

### Phase 5 Queue

- [x] `TA-050` Implement dashboard page and visual components.
- [x] `TA-051` Add homepage link.
- [x] `TA-052` Run build and lint.
- [x] `TA-053` Update this plan and set pointer to `TA-070`.

### Phase 6 Queue

- [x] `TA-070` Add real-data/full-analysis bridge docs and tests.
- [x] `TA-071` Run full verification.
- [x] `TA-072` Update project log and mark complete.

## Completion Rules

The trader analytics report lane is complete when:

- a stable `trader_analytics_report_v1` contract exists
- reports can be built from execution-feedback fixture batches
- chart data is deterministic and tested
- API route returns the report contract
- dashboard displays KPI cards, charts, table, limitations, errors, and
  debug-only raw JSON
- report language avoids unsupported identity/statistical claims
- execution-only aggregation does not require candles or `levels-system`
- full verification passes

## Current Progress Log

### 2026-05-02

- Created this roadmap/tracker.
- Built `trader_analytics_report_v1`, the pure report aggregation engine,
  deterministic chart data, `runTraderAnalyticsReport(...)`, and
  `POST /api/trader-analytics/debug`.
- Focused verification passed:
  `npx vitest run src/lib/trader-analytics/__tests__` and
  `npx tsc --noEmit`.
- Built `/debug/trader-analytics` with fixture batch input, KPI cards, native
  SVG/CSS charts, trade rows, warnings, limitations, raw JSON, and a homepage
  link.
- `npm run build` passed and produced `/api/trader-analytics/debug` and
  `/debug/trader-analytics`.
- `npm run lint` passed with `0` errors and the same `4` pre-existing warnings.
- Added `src/docs/trader-analytics-real-data-bridge.md`.
- `npm run verify:all` passed with `70` files / `647` tests, plus the
  focused `verify:levels-system`, `verify:layer2`, and `verify:layer3`
  checkpoints.
- Local smoke checks passed for:
  `GET /api/trader-analytics/debug`,
  `POST /api/trader-analytics/debug`, and
  `GET /debug/trader-analytics`.
- The trader analytics roadmap branch is complete.

## Historical Best Next Step

Use `/debug/trader-analytics` and `POST /api/trader-analytics/debug` with
future saved execution batches. Next useful product additions are filters,
saved in-app report history, in-app period comparisons, and drill-down from
chart bars into source trades. Do not add end-user export unless the product
strategy changes.
