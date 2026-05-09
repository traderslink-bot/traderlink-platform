# End-User Product Intelligence Hardening Plan

Created: 2026-05-03

## Purpose

This plan turns the next useful product ideas into concrete app-side contracts,
helpers, tests, and documentation.

The work stays inside `trader-intelligence-v2` and does not ask
`levels-system` to fetch candles or build market structure. `levels-system`
continues to own candle, support/resistance, dynamic level, and market
structure generation. This app uses execution data as the durable product
foundation and attaches market context only through explicit readiness gates.

## Product Principles

- Keep execution-only analysis useful without market hours, live candle data,
  or provider access.
- Do not add end-user export/download flows.
- Keep raw JSON and raw CSV handling out of production user surfaces.
- Treat market structure as observational until calibration proves it can affect
  scoring.
- Prefer deterministic contracts and tests now, with storage/UI implementation
  later when auth and database choices are ready.
- Make every new signal explainable so a trader can understand why the app is
  asking for review.

## Implementation Checklist

### Step 1: Import Quality Score

Goal:
Summarize CSV import health as a simple product-facing score.

Implementation:
- Add typed score contract with:
  - score from 0 to 100
  - status: `high_confidence`, `needs_review`, or `blocked`
  - blocker count
  - review count
  - warning count
  - positive signal count
  - reasons
  - next action
- Build the score from existing import diagnostics:
  - rejected rows
  - fix-required repair items
  - review repair items
  - mapping confidence
  - P/L reconciliation mismatch count
  - options quarantine rows
  - trade grouping review items
  - duplicate file/import state
- Add the score to `BrokerCsvImportProductDiagnostics`.
- Ensure blocked imports cannot produce a high-confidence score.

Tests:
- Clean imports score as high confidence.
- Low confidence or review-heavy imports score as needs review.
- Rejected rows or duplicate files score as blocked.

### Step 2: Trade Reconstruction Preview

Goal:
Show how executions were grouped into trades before saving.

Implementation:
- Add a preview contract with:
  - request index
  - symbol
  - direction
  - lifecycle
  - grouping reason
  - execution count
  - row indexes
  - gross cash flow
  - estimated/net P/L fields
  - timeline steps with timestamp, side, shares, price, and position after each
    execution
  - warnings
  - needs review flag
- Build from existing grouped requests, grouping diagnostics, and net P/L
  preview.
- Keep it preview-only; do not save or mutate trades here.

Tests:
- Preview preserves the execution sequence.
- Preview marks open, split, or warning-heavy grouped trades as needing review.

### Step 3: Execution Mistake Taxonomy

Goal:
Create stable product categories for repeat trader behavior.

Implementation:
- Add a deterministic mistake taxonomy:
  - chased_entry
  - scaled_loser
  - early_winner_exit
  - held_loser_too_long
  - overtraded_same_ticker
  - impulsive_reversal
  - partialed_without_plan
  - added_after_failed_premise
  - left_open_position
  - inconsistent_sizing
- Map existing execution-feedback risk IDs and report row facts into taxonomy
  buckets.
- Include:
  - category id
  - label
  - description
  - severity
  - source kind
  - related risk IDs
- Do not require candle/market-structure data.

Tests:
- Taxonomy is stable and non-empty.
- Saved reports produce taxonomy observations from existing execution-only
  risk facts.

### Step 4: Trader Score Trend

Goal:
Create directional trend signals without presenting a fake all-knowing score.

Implementation:
- Add an explainable scorecard:
  - discipline
  - exit quality
  - risk control
  - consistency
  - P/L quality
  - overall
- Score from saved report metrics only.
- Add trend comparison when prior report exists:
  - previous score
  - current score
  - delta
  - direction
  - explanation
- Label scores as execution-only.

Tests:
- Scorecard is bounded from 0 to 100.
- Trend direction reflects current vs prior report.
- Sample-size warning appears when report samples are small.

### Step 5: Mistake Cost Estimate

Goal:
Estimate approximate gross execution-only cost of repeated behaviors.

Implementation:
- Add a cost estimate contract with:
  - taxonomy id
  - label
  - affected trade count
  - related trade IDs
  - estimated gross cost
  - average cost per affected trade
  - confidence
  - calculation note
- Use conservative execution-only heuristics:
  - negative P/L trades with a matching risk count as cost candidates
  - open positions and ambiguous trades have lower confidence
  - do not claim exact avoidable loss
- Add total estimated cost and top cost driver.

Tests:
- Cost estimates are deterministic.
- Estimates do not produce negative costs.
- Estimates include calculation notes that describe the limitation.

### Step 6: Personal Rule Builder

Goal:
Move rule tracking closer to a product workflow.

Implementation:
- Add rule builder recommendations from:
  - top focus queue
  - worst rule violation
  - top taxonomy cost driver
  - behavior recurrence alerts
- Existing `TraderRuleTemplate` and `TraderRuleInstance` remain the core rule
  contracts.
- Recommendations include:
  - suggested template id
  - label
  - reason
  - default parameters
  - related trade IDs
  - priority
- Do not add real user-editing storage yet.

Tests:
- Recommendations include related trades and map to known templates when
  possible.
- Recommendations stay empty or low priority when there is not enough data.

### Step 7: Behavior Recurrence Alerts

Goal:
Tell the user when behavior repeats enough to matter.

Implementation:
- Add recurrence alerts from saved report rows and source summaries:
  - same risk on multiple trades
  - same ticker with repeated losing or risky behavior
  - repeated rule violations
  - improving streaks where applicable
- Include:
  - alert id
  - severity
  - title
  - detail
  - related trade IDs
  - occurrence count
  - next action
- Keep alerts execution-only unless explicitly labeled otherwise.

Tests:
- Repeated sample behaviors produce alerts.
- Alerts preserve related trade IDs.

### Step 8: Unified Review Queue

Goal:
Create one in-app queue that can combine import review, behavior review, rule
review, cost review, and market-context readiness.

Implementation:
- Add unified queue contract with:
  - id
  - lane
  - priority
  - title
  - detail
  - related trade IDs
  - source IDs
  - status
  - next action
- Build from:
  - existing focus queue
  - rule compliance
  - recurrence alerts
  - mistake cost estimates
  - market-context readiness gate
  - import quality/reconstruction items when available
- This is product workflow data only; no database persistence yet.

Tests:
- Queue sorts by priority.
- Queue includes behavior and rule items from sample data.

### Step 9: Broker Import Fingerprint Library

Goal:
Prepare the app to learn unknown broker CSV formats over time.

Implementation:
- Add a library entry contract from mapping learning signals:
  - fingerprint
  - broker
  - confidence level
  - promoted status
  - header count
  - detected fields
  - missing fields
  - first seen / last seen timestamps
  - sample count
  - recommended action
- Add a pure builder that deduplicates multiple learning signals.
- Keep this as admin/internal product data, not end-user export.

Tests:
- Duplicate header fingerprints merge into one entry.
- Problematic mappings stay unpromoted.

### Step 10: Market Context Readiness Gate

Goal:
Make it clear when a trade has execution-only, levels, observational market
structure, or calibrated market-context analysis.

Implementation:
- Add readiness gate contract:
  - trade id
  - symbol
  - execution analysis status
  - levels status
  - market structure status
  - calibrated market context status
  - user visible badge
  - used for scoring boolean
  - next action
- Build from saved trades, analysis confidence badges, and calibration queue.
- Market structure remains not used for scoring by default.

Tests:
- Sample trades are execution-ready but not market-calibrated.
- Observational market structure does not become scoring input.

## Planned Files

- `src/docs/end-user-product-intelligence-hardening-plan.md`
- `src/lib/trader-analytics/product/types.ts`
- `src/lib/trader-analytics/product/import-diagnostics.ts`
- `src/lib/trader-analytics/product/product-intelligence.ts`
- `src/lib/trader-analytics/product/view-model.ts`
- `src/lib/trader-analytics/index.ts`
- `src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts`
- `src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts`
- `src/docs/codex-project-log.md`

## Verification Plan

Focused checks:

```bash
npx vitest run src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts
npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts
npx tsc --noEmit
```

Full checks after implementation:

```bash
npm run verify:all
npm run build
npm run lint
```

Production smoke after build:

```text
GET /
GET /analytics
GET /trades/trade-rapid-fire
```

## Progress Log

### 2026-05-03

- Created this plan.
- Added import quality score contract and builder.
- Added trade reconstruction preview contract and builder.
- Added execution-only mistake taxonomy and report observation builder.
- Added execution-only trader scorecard and trend builder.
- Added conservative mistake cost estimate builder.
- Added rule-builder recommendation helper.
- Added behavior recurrence alerts.
- Added unified review queue.
- Added broker import fingerprint library builder.
- Added market-context readiness gate.
- Added `TraderProductIntelligenceViewModel`.
- Wired product intelligence into `buildProductTraderAnalyticsViewModel(...)`.
- Added product-intelligence panels to `/analytics`:
  - execution score trend
  - mistake cost estimate
  - recurrence alerts
  - rule builder recommendations
  - unified review queue
- Exported the new helpers and types from `src/lib/trader-analytics/index.ts`.
- Focused product-intelligence verification passed:
  `npx vitest run src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts`
  with 6 tests.
- Focused CSV import verification passed:
  `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts`
  with 25 tests.
- TypeScript passed: `npx tsc --noEmit`.
- Full verification passed: `npm run verify:all` with 75 files / 706 tests,
  plus shared-engine, Layer 2, and Layer 3 checkpoints.
- Lint passed with 0 errors and the same 4 pre-existing unrelated warnings.
- Production build passed: `npm run build`.
- Production route smoke passed:
  - `GET /` -> 200
  - `GET /analytics` -> 200
  - `GET /trades/trade-rapid-fire` -> 200

Current implementation status:

- Steps 1-10 are complete for the fixture-backed product prototype.
- Real persistence, real import UI commit actions, and editable saved user rules
  remain future storage/UI work.
- Market structure remains observational and is not used for scoring.
- No `levels-system` blocker was found, so the shared handoff file did not need
  an update for this pass.
