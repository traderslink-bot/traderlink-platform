# Trader Import Trial And Repair Experience Plan

## Summary

This branch hardens Trader Intelligence around the first end-user moment that
matters before coaching can be trusted: importing broker execution history and
turning it into reviewable trades.

The user does not have real CSV exports from every broker. The app will use
synthetic representative broker fixtures for compatibility testing only. These
fixtures are not customer data, are not exported to end users, and are used to
prove parser behavior, repair guidance, UI readiness, and product copy.

Market candles, support/resistance, and market structure remain owned by
`levels-system`. This app may show later market context as observational
support, but import repair, execution scoring, review priority, and coaching
must remain useful without live market data.

## Product Decisions

- Keep all new work deterministic and fixture/in-memory only.
- Do not add auth, billing, production persistence, upload endpoints, exports,
  downloads, or raw JSON user panels.
- Use synthetic CSV fixtures for broker compatibility tests.
- Label fixture coverage as representative, not official certification.
- Preserve the larger-platform direction by keeping route policy, feature
  gates, and no-export checks current.
- Keep market context out of scoring, rule lifecycle, repair, copy audit, and
  calibration conclusions.

## Existing Inputs To Reuse

- `src/lib/execution-sources/csv/broker-execution-csv-import.ts`
- `src/lib/trader-analytics/product/import-preview.ts`
- `src/lib/trader-analytics/product/import-diagnostics.ts`
- `src/lib/trader-analytics/product/product-workflow.ts`
- `src/lib/trader-analytics/product/review-habit-loop.ts`
- `src/lib/trader-analytics/product/product-polish.ts`
- `src/lib/trader-analytics/product/platform-module.ts`
- `src/docs/trade-execution-import-fixtures/*.csv`

## Implementation Checklist

### 1. Working Plan File

Status: complete

Tasks:

- Add this plan file.
- Track implementation status as the branch moves.
- Record verification commands and doc updates before final handoff.

Acceptance criteria:

- The plan names the fixture strategy clearly.
- Deferred platform work is marked as deferred.
- No instruction asks this app to fetch candles or own market structure.

### 2. Real Import Trial Harness

Status: complete

Goal:

Create a product-facing model that runs representative broker CSV samples
through the existing parser/preview stack and summarizes readiness.

Tasks:

- Add a new nearby product module for import trial and repair experience.
- Define a synthetic fixture catalog covering:
  - IBKR
  - Moomoo
  - Webull
  - Robinhood
  - Schwab
  - Generic CSV
  - extra generic-compatible brokers already represented by docs fixtures
- For each fixture, expose:
  - broker format
  - fixture file name or synthetic source id
  - representative status
  - expected behavior
  - whether fees/commissions are present
  - whether options rows are included
  - whether open-position behavior is included
  - parser result summary
  - user-facing next action
- Add edge-case trial rows for:
  - missing symbol
  - missing/invalid timestamp
  - non-filled order skip
  - open-position leftover
  - over-reduction split
  - P/L reconciliation mismatch
- Keep all fixture strings inside code or existing docs fixtures, not user data.

Acceptance criteria:

- Harness returns passing and repair-needed results.
- Harness uses `previewBrokerExecutionCsvImport`, not a parallel parser.
- Results are stable and testable without external files.

### 3. Guided Data Repair Wizard

Status: complete

Goal:

Turn parser diagnostics into a plain-English repair path an end user can follow
inside the app.

Tasks:

- Build a wizard view model from trial results and import diagnostics.
- Include repair steps for:
  - required column missing
  - row field missing
  - invalid timestamp/timezone
  - duplicate file/import
  - skipped non-trade row
  - skipped/rejected options row
  - open position left after import
  - P/L mismatch
- For each step expose:
  - label
  - severity
  - issue code
  - affected broker/fixture
  - affected rows/trades when available
  - repair action
  - whether the user can proceed after review
- Avoid raw parser jargon in UI copy.

Acceptance criteria:

- Wizard prioritizes blockers before warnings.
- Wizard never tells the user to export/download data.
- Wizard distinguishes synthetic fixture issues from real-user import issues.

### 4. Review Session Cockpit

Status: complete

Goal:

Create a single review cockpit that tells the user what to do next after import
and analytics are available.

Tasks:

- Build a cockpit from:
  - import trial readiness
  - repair wizard
  - review habit loop
  - coach action loop
  - product polish queue
- Include:
  - readiness score
  - first review action
  - next import repair action
  - rule draft action
  - trade comparison action
  - replay action
  - progress action
- Keep market context out of priority ranking.

Acceptance criteria:

- Cockpit produces an ordered action list.
- Actions link only to in-app routes.
- Output remains useful with sample data only.

### 5. Rule Lifecycle Simulation

Status: complete

Goal:

Show the lifecycle a personal rule would pass through later, without saving
rules yet.

Tasks:

- Build deterministic lifecycle items from existing mistake-to-rule drafts.
- Show stages:
  - draft
  - review
  - simulated active
  - measured
  - promoted later
- Include:
  - current stage
  - evidence count
  - related trades
  - expected success metric
  - limitation
- Do not estimate alternate P/L.

Acceptance criteria:

- Simulation is clear that no persistence exists yet.
- Simulation never claims a rule would have made money.

### 6. Trade Replay Visual Upgrade Contract

Status: complete

Goal:

Prepare richer replay visuals without introducing a new chart library.

Tasks:

- Build a replay visual contract from existing replay steps.
- Include marker colors/tones for:
  - entry
  - add
  - trim
  - exit
  - re-add
  - open leftover
- Include lane summaries for:
  - position size
  - realized P/L
  - risk direction
  - warnings
- Add route copy guidance for trade replay UI.

Acceptance criteria:

- Contract can render with simple CSS bars/markers.
- No market context is required for replay visual meaning.

### 7. Product Copy Quality System

Status: complete

Goal:

Keep end-user copy direct, safe, and product-ready.

Tasks:

- Build a copy audit over the new experience text.
- Check for:
  - export/download language
  - raw/debug language on end-user surfaces
  - guaranteed outcome claims
  - alternate P/L certainty claims
  - market-context overclaims
  - fake certification claims for synthetic fixtures
- Reuse the safety copy approach from the review habit loop where practical.

Acceptance criteria:

- Copy audit passes for generated product text.
- Tests prove unsafe sample copy is flagged.

### 8. Broker Import Fixture Library

Status: complete

Goal:

Expose broker fixture coverage as a product/internal readiness model.

Tasks:

- Build a fixture library summary grouped by broker.
- Mark official/observed/best-effort header confidence.
- Track which scenarios each broker has coverage for:
  - closed stock trade
  - short trade
  - fees/commissions
  - cancelled/non-trade skip
  - open trade
  - row repair
  - P/L mismatch
- Keep unsupported brokers represented through generic mapping only.

Acceptance criteria:

- Fixture library does not claim exhaustive broker support.
- Tests confirm required broker names are represented.

### 9. Mobile Product QA Pass

Status: complete

Goal:

Add deterministic mobile QA contracts for the growing product surfaces.

Tasks:

- Build route-level QA items for:
  - `/analytics`
  - `/coach`
  - `/imports`
  - `/import-trials`
  - `/repair-wizard`
  - `/review-cockpit`
  - `/review`
  - `/progress`
  - `/trades/[tradeId]`
  - `/compare-trades`
  - `/onboarding`
  - `/calibration`
- Include checks for:
  - text fit
  - no export controls
  - no raw JSON
  - primary action visible
  - mobile stacking

Acceptance criteria:

- New routes appear in route registry.
- No-export policy covers all new end-user routes.

### 10. In-App Why Layer

Status: complete

Goal:

Give users an explanation chain for why they are seeing a repair, rule,
review, or calibration item.

Tasks:

- Build explanation records for:
  - import trial result
  - repair wizard step
  - cockpit action
  - rule lifecycle item
  - calibration item
- Include:
  - title
  - reason
  - evidence labels
  - related trades/fixtures
  - source model
  - limitation
- Keep explanations user-facing.

Acceptance criteria:

- Every top-level experience has at least one explanation.
- Explanations do not reveal raw CSV rows or debug JSON.

### 11. Calibration Dashboard For Later Real Trades

Status: complete

Goal:

Create a dashboard for future calibration once real imports exist, while being
honest that calibration is not available yet.

Tasks:

- Build calibration metrics for:
  - imports tested
  - real import count
  - broker coverage breadth
  - repair rate
  - open trade rate
  - P/L reconciliation mismatch rate
  - review completion rate
  - rule draft conversion rate
  - market context readiness
- Mark current state as sample/fixture only.
- Include what must be collected from real users later.

Acceptance criteria:

- Dashboard says calibration is waiting for real imports.
- Market context remains observational and unused for execution conclusions.

## UI Checklist

Status: complete

Routes to add or enhance:

- Add `/import-trials`.
- Add `/repair-wizard`.
- Add `/review-cockpit`.
- Add `/calibration`.
- Add home navigation tiles for those routes.
- Register routes in `platform-module.ts`.
- Preserve existing route styling and no-export posture.

## Test Checklist

Status: complete

Focused Vitest coverage:

- fixture catalog includes required brokers
- import trial harness creates passing and repair-needed trial results
- repair wizard prioritizes blockers
- review cockpit action list is ordered and in-app only
- rule lifecycle simulation keeps alternate P/L out
- replay visual contract includes role/risk lanes
- copy audit flags unsafe copy
- fixture library marks synthetic coverage honestly
- mobile QA includes new routes and no-export checks
- why layer includes evidence and limitations
- calibration dashboard waits for real imports
- product view model exposes the new experience
- route registry/no-export audit covers new routes

Verification commands:

- `npx vitest run src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts`
- `npx vitest run src/lib/trader-analytics/__tests__`
- `npx tsc --noEmit`
- `npm run verify:all`
- `npm run lint`
- `npm run build`

## Completion Log

- 2026-05-03: Plan created.
- 2026-05-03: Implemented synthetic import trial harness, guided repair wizard,
  review cockpit, rule lifecycle simulation, replay visual contract, copy
  quality audit, broker fixture library, mobile QA contract, why layer, and
  calibration dashboard.
- 2026-05-03: Added `/import-trials`, `/repair-wizard`, `/review-cockpit`, and
  `/calibration`, then wired them into home navigation and platform route
  policy.
- 2026-05-03: Added focused Vitest coverage in
  `src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts`.
- 2026-05-03: Verification passed:
  - `npx vitest run src/lib/trader-analytics/__tests__/trader-import-trial-experience.test.ts`
  - `npx vitest run src/lib/trader-analytics/__tests__`
  - `npx tsc --noEmit`
  - `npm run verify:all`
  - `npm run lint`
  - `npm run build`
  - route smoke at `http://localhost:3000` for `/`, `/analytics`,
    `/import-trials`, `/repair-wizard`, `/review-cockpit`, `/calibration`,
    `/imports`, `/review`, `/progress`, and `/trades/trade-rapid-fire`
