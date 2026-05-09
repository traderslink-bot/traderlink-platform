# Trader CSV Dry-Run Import UI Plan

## Summary

This branch turns the import trust work into a rough but usable end-user
workflow UI. The goal is not final website styling. The goal is to prove the
product flow a real user will need before imported execution data becomes
trader feedback.

The app should let a user paste or choose representative CSV text, select or
map broker columns, preview grouped trades, see a confidence gate, understand
repair steps, and know what will happen next. No production persistence, auth,
billing, file storage, export/download feature, or market-data fetch will be
added in this branch.

Market candles, support/resistance, VWAP/EMA, and market structure remain owned
by `levels-system`. This UI works entirely from execution CSV data and existing
fixture/sample product data.

## Product Design Position

- Build rough product workflow UI now.
- Defer final brand, typography, paid-plan layout, and website dashboard style.
- Keep components easy to move into the future larger website.
- Keep user-facing copy direct and short.
- Do not expose raw JSON or create data ownership/export affordances.
- Make confidence and limitations visible so the app does not overclaim.

## Implementation Steps

### 1. Actual CSV Dry-Run Import UI

Status: complete

Goal:

Create an in-app screen where a user can paste CSV text or choose a synthetic
representative sample, run the existing parser, and see what the app would do.

Detailed tasks:

- Add a new route `/import-dry-run`.
- Add a client component for interactive parsing.
- Provide broker selector values:
  - auto
  - IBKR activity statement
  - Moomoo trade history
  - Webull order history
  - Robinhood transaction history
  - Schwab transactions
  - generic execution CSV
- Provide synthetic sample presets for the supported/relevant broker shapes.
- Let the user paste CSV text into a textarea.
- Let the user set account timezone.
- Re-run preview when CSV/broker/timezone/mapping changes.
- Use `previewBrokerExecutionCsvImport`, not a new parser.
- Show:
  - detected/resolved broker
  - row count
  - accepted executions
  - grouped trades
  - rejected/skipped rows
  - mapping confidence
  - quality score
  - commit/analysis readiness

Acceptance criteria:

- The UI works with pasted CSV.
- The UI works with sample presets.
- No data is saved.
- No export/download button exists.
- The preview uses existing import diagnostics.

### 2. Column Mapping Assistant

Status: complete

Goal:

Help users recover from unknown broker headers or low-confidence mapping.

Detailed tasks:

- Detect CSV headers in the pasted text.
- Display required fields:
  - symbol
  - timestamp or date/time
  - side
  - quantity
  - price
- Show detected fields from the parser.
- Show missing required fields.
- Provide simple text inputs for explicit mappings.
- Re-run preview with `columnMapping`.
- Show whether mapping is:
  - ready
  - needs review
  - blocked
- Keep mapping labels user-facing.

Acceptance criteria:

- Unknown headers can be mapped without code changes.
- Missing required fields are clear.
- Explicit mappings feed the parser.

### 3. Import Confidence Gate

Status: complete

Goal:

Prevent low-quality data from silently becoming trader feedback.

Detailed tasks:

- Build a confidence gate view model with:
  - `ready`
  - `needs_review`
  - `blocked`
- Use import diagnostics to decide the gate.
- Include:
  - score
  - reasons
  - blocked reasons
  - review reasons
  - whether analysis can start later
  - next action
- Surface this prominently in `/import-dry-run`.

Acceptance criteria:

- Blocked imports cannot be described as ready.
- Needs-review imports tell the user exactly what to inspect.

### 4. First Trade Review Walkthrough

Status: complete

Goal:

After a successful dry run, show the first review path the user would take.

Detailed tasks:

- Build a walkthrough model from the first grouped trade.
- Include steps:
  - confirm grouped executions
  - inspect replay
  - check repairs/warnings
  - review top execution fact
  - continue to guided review after saving later
- Link to existing routes where useful.
- Make it clear saving/analysis is deferred in this rough UI.

Acceptance criteria:

- The user sees what happens after import.
- The app does not imply that the pasted CSV was stored.

### 5. Saved Import Session State

Status: complete

Goal:

Model the future state machine without implementing storage.

Detailed tasks:

- Add a deterministic session state view model with stages:
  - selected
  - parsed
  - mapped
  - repaired
  - grouped
  - ready for analysis
- Mark each stage as:
  - complete
  - current
  - blocked
  - upcoming
- Use current preview and confidence gate to set statuses.
- Surface it in `/import-dry-run`.

Acceptance criteria:

- Product flow is clear before persistence exists.
- The state machine can later become persisted import batch state.

### 6. Trade Grouping Review UI

Status: complete

Goal:

Show how individual executions become trades before analysis runs.

Detailed tasks:

- Build grouping review rows from `groupingDiagnostics` and reconstruction
  preview.
- Show:
  - symbol
  - direction
  - lifecycle open/closed
  - grouping reason
  - execution count
  - row indexes
  - final position
  - warnings
- Show an execution timeline for each grouped trade.
- Highlight open positions, over-reductions, time-gap splits, and session
  splits.

Acceptance criteria:

- A user can understand why the app created one trade or multiple trades.
- Open-position imports are clearly not final closed-trade analysis.

### 7. Broker Coverage Confidence Page/Panel

Status: complete

Goal:

Show broker support honestly and prepare for future real sample collection.

Detailed tasks:

- Add broker coverage summary to `/import-dry-run`.
- Reuse the fixture library from `importTrialExperience`.
- Show:
  - representative fixtures
  - generic mapper support
  - official/observed/best-effort header confidence
  - missing future coverage
- Avoid saying “certified” or “guaranteed.”

Acceptance criteria:

- Broker support claims are honest.
- Generic support is positioned as a fallback, not a full broker promise.

### 8. Mistake Evidence Drill-In

Status: complete

Goal:

Make import/review explanations traceable to exact facts.

Detailed tasks:

- Add evidence records for:
  - import repair items
  - confidence gate reasons
  - grouping warnings
  - existing sample trader mistakes
- For execution mistakes, show:
  - label
  - related trade IDs
  - evidence labels
  - source facts
  - limitation
- Surface these in `/import-dry-run` and/or route-adjacent panels.

Acceptance criteria:

- The app explains why it says something.
- Evidence does not reveal raw JSON or require market context.

### 9. End-User Copy Tightening Pass

Status: complete

Goal:

Make the rough UI sound like a product and not a debug dashboard.

Detailed tasks:

- Add a dry-run copy audit.
- Check for:
  - raw/debug wording
  - export/download wording
  - guaranteed outcome claims
  - fake broker certification claims
  - market-context overclaims
- Add safe copy examples for:
  - dry run
  - mapping
  - confidence gate
  - grouping
  - calibration
- Keep route copy concise.

Acceptance criteria:

- Copy audit passes.
- Tests prove unsafe copy is caught.

### 10. Real Import Calibration Queue

Status: complete

Goal:

Define what the app should learn later from real imports without collecting it
yet.

Detailed tasks:

- Build queue items for future calibration:
  - real broker header examples
  - real repair outcomes
  - parse success/failure rate
  - column-mapping corrections
  - grouping correction rate
  - open-position rate
  - P/L mismatch rate
  - first review completion
  - rule draft conversion
  - market context observation after saved trades exist
- Mark all as waiting for real imports.
- Surface the queue in `/import-dry-run` or `/calibration`.

Acceptance criteria:

- Calibration is clear and honest.
- No real data collection is implied yet.
- Market context remains observational.

## Files To Add Or Update

- Add `src/docs/trader-csv-dry-run-import-ui-plan.md`.
- Add or extend a product module for dry-run import workflow builders.
- Add public types for the dry-run workflow.
- Add `/import-dry-run`.
- Add route policy/navigation for `/import-dry-run`.
- Add focused Vitest coverage.
- Update project log and README after verification.

## Verification Plan

- `npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts`
- `npx vitest run src/lib/trader-analytics/__tests__`
- `npx tsc --noEmit`
- `npm run verify:all`
- `npm run lint`
- `npm run build`
- Smoke-test `/import-dry-run` plus the core routes on the dev server.

## Completion Log

- 2026-05-03: Plan created.
- 2026-05-03: Added dry-run workflow model and public types for sample
  presets, column mapping assistant, confidence gate, session state, grouping
  review, first-trade walkthrough, broker coverage, evidence drill-in, copy
  audit, and real-import calibration queue.
- 2026-05-03: Added `/import-dry-run` with rough workflow UI for sample
  selection, local CSV opening, pasted CSV text, broker/timezone controls,
  explicit column mapping, confidence gate, grouped trades, evidence, and
  calibration queue.
- 2026-05-03: Wired `/import-dry-run` into home navigation, import review, route
  registry, no-export policy, public exports, and mobile QA route contracts.
- 2026-05-03: Added focused tests in
  `src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts`.
- 2026-05-03: Verification passed:
  - `npx vitest run src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts`
  - `npx vitest run src/lib/trader-analytics/__tests__`
  - `npx tsc --noEmit`
  - `npm run verify:all`
  - `npm run lint`
  - `npm run build`
  - route smoke at `http://localhost:3000` for `/`, `/import-dry-run`,
    `/imports`, `/import-trials`, `/repair-wizard`, `/review-cockpit`,
    `/calibration`, `/analytics`, and `/trades/trade-rapid-fire`
