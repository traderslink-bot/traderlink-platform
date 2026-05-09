# End-User Workflow Productization Plan

Created: 2026-05-03

## Purpose

This plan turns the next useful ideas into working end-user product flows.

The previous passes built execution import contracts, analytics reports,
productization contracts, and product intelligence. This pass uses those pieces
to make the app feel less like a collection of reports and more like a trader
workflow.

## Boundary Decisions

- This pass does not choose a production database, auth provider, billing
  provider, or deployment storage adapter.
- It does build the storage model, entity checklist, product limits, routes,
  view models, and fixture-backed workflow needed to wire those choices later.
- End users still do not get export/download controls.
- Market structure remains owned by `levels-system` and does not affect scoring.
- Admin broker-mapping tools are treated as internal/admin product surfaces.

## Step 1: Real Import Review UI

Goal:
Create a production-style import review route that shows what will happen before
a CSV import is committed.

Implementation:
- Add `/imports`.
- Use fixture-backed broker CSV preview.
- Show:
  - import quality score
  - mapping confidence
  - repair items
  - column mapping summary
  - grouped trade reconstruction preview
  - P/L reconciliation
  - commit plan
- Keep the route in-app only with no export/download affordances.

Done when:
- The route renders from the same `BrokerCsvImportProductDiagnostics` contract
  used by tests.

## Step 2: Execution Replay Visual

Goal:
Make each saved trade review easier to understand visually.

Implementation:
- Add an execution replay view model:
  - execution number
  - timestamp
  - side
  - shares
  - price
  - position after execution
  - running cash flow / gross P/L progress
  - average open price estimate
  - behavior marker text
- Add the replay to `/trades/[tradeId]`.

Done when:
- Trade detail pages show a visual replay without requiring candle data.

## Step 3: Guided Review Session

Goal:
Create a workflow that turns analytics into action.

Implementation:
- Add `/review`.
- Build a guided session from:
  - top mistake cost driver
  - focus queue
  - recurrence alerts
  - related trade links
  - suggested rule
  - lesson capture prompt
- Keep it deterministic and sample-backed for now.

Done when:
- The user can open a route that says what to review first and why.

## Step 4: Rule Effectiveness Tracking

Goal:
Show whether personal trading rules appear to be helping.

Implementation:
- Add rule-effectiveness view model:
  - rule label
  - violations before
  - violations after
  - delta
  - direction
  - related current trade IDs
  - sample-size warning
- Use existing sample report history for before/after comparison.

Done when:
- Rule tracking appears on the progress/review workflow and is covered by tests.

## Step 5: Trader Progress Page

Goal:
Give users a dedicated progress route that shows improvement over time.

Implementation:
- Add `/progress`.
- Show:
  - execution scorecard
  - score trends
  - report snapshots
  - active focus
  - rule effectiveness
  - recurrence alerts
  - mistake-cost trend proxy

Done when:
- The route shows progress without exposing raw data or export controls.

## Step 6: Import Health Center

Goal:
Create a route for import reliability, broker support, and CSV health.

Implementation:
- Add `/import-health`.
- Show:
  - quality score
  - known supported brokers
  - options quarantine count
  - low-confidence mapping warnings
  - duplicate/import blocker status
  - broker fingerprint library summary

Done when:
- Import health is separated from trader performance analytics.

## Step 7: Broker Mapping Admin Console

Goal:
Give internal/admin users a place to inspect unknown CSV mappings.

Implementation:
- Add `/admin/broker-mappings`.
- Show:
  - header fingerprint
  - broker
  - confidence
  - promoted status
  - detected/missing fields
  - recommended action
- Keep it admin/internal in copy and route policy.

Done when:
- Unknown mapping learning can be reviewed without touching end-user routes.

## Step 8: In-App Notes And Lessons System

Goal:
Turn reviewed trades into reusable lessons.

Implementation:
- Add lesson view model:
  - lesson id
  - source trade ids
  - title
  - body
  - linked rule recommendation
  - status
  - created timestamp
- Use saved notes and guided review output as the first fixture-backed source.
- Show lesson capture prompts on `/review`.

Done when:
- The product can display saved notes and lesson prompts as in-app value.

## Step 9: Account/Plan Foundation

Goal:
Define product limits without implementing billing yet.

Implementation:
- Add `/account`.
- Add plan foundation view model:
  - plan id
  - imports per month
  - saved trade history depth
  - active rule limit
  - market-context availability
  - broker support level
  - upgrade reasons
- Keep billing provider choice deferred.

Done when:
- Product limits are explicit and test-covered.

## Step 10: Storage Implementation Boundary

Goal:
Prepare the app for real persistence without choosing the database silently.

Implementation:
- Add storage implementation blueprint:
  - required entity groups
  - repository capabilities
  - transaction boundaries
  - deletion behavior
  - current fixture-backed status
  - blockers for real persistent storage
- Surface this on `/account`.
- Keep no-export and deletion policy explicit.

Done when:
- The app has a concrete storage boundary that can be backed by a real database
  after auth/database choices are made.

## Planned Files

- `src/docs/end-user-workflow-productization-plan.md`
- `src/lib/trader-analytics/product/product-workflow.ts`
- `src/lib/trader-analytics/__tests__/end-user-workflow-productization.test.ts`
- `app/imports/page.tsx`
- `app/review/page.tsx`
- `app/progress/page.tsx`
- `app/import-health/page.tsx`
- `app/admin/broker-mappings/page.tsx`
- `app/account/page.tsx`
- `app/trades/[tradeId]/page.tsx`
- `app/page.tsx`
- `README.md`
- `src/docs/codex-project-log.md`

## Verification Plan

Focused:

```bash
npx vitest run src/lib/trader-analytics/__tests__/end-user-workflow-productization.test.ts
npx tsc --noEmit
```

Full:

```bash
npm run verify:all
npm run lint
npm run build
```

Production smoke:

```text
GET /
GET /analytics
GET /imports
GET /review
GET /progress
GET /import-health
GET /admin/broker-mappings
GET /account
GET /trades/trade-rapid-fire
```

## Progress Log

### 2026-05-03

- Created this plan.
- Added `src/lib/trader-analytics/product/product-workflow.ts`.
- Added fixture-backed workflow view models for:
  - import review UI
  - execution replay visual
  - guided review session
  - rule effectiveness tracking
  - trader progress
  - import health center
  - broker mapping admin console
  - in-app lesson draft
  - account/plan foundation
  - storage implementation boundary
- Added routes:
  - `/imports`
  - `/review`
  - `/progress`
  - `/import-health`
  - `/admin/broker-mappings`
  - `/account`
- Updated `/trades/[tradeId]` with execution replay.
- Updated `/` with links to the new product workflow routes.
- Exported the new workflow helpers and types from
  `src/lib/trader-analytics/index.ts`.
- Added focused workflow tests:
  `src/lib/trader-analytics/__tests__/end-user-workflow-productization.test.ts`.
- Focused verification passed:
  `npx vitest run src/lib/trader-analytics/__tests__/end-user-workflow-productization.test.ts`
  with 7 tests.
- TypeScript passed: `npx tsc --noEmit`.
- Full verification passed: `npm run verify:all` with 76 files / 713 tests,
  plus shared-engine, Layer 2, and Layer 3 checkpoints.
- Lint passed with 0 errors and the same 4 pre-existing unrelated warnings.
- Production build passed: `npm run build`.
- Production route smoke passed:
  - `GET /` -> 200
  - `GET /analytics` -> 200
  - `GET /imports` -> 200
  - `GET /review` -> 200
  - `GET /progress` -> 200
  - `GET /import-health` -> 200
  - `GET /admin/broker-mappings` -> 200
  - `GET /account` -> 200
  - `GET /trades/trade-rapid-fire` -> 200

Current implementation status:

- Steps 1-10 are complete for the fixture-backed product workflow prototype.
- Real database/auth/billing choices remain intentionally deferred.
- The storage boundary and account plan foundation now make those future choices
  explicit instead of implicit.
- No `levels-system` blocker was found, so the shared handoff file did not need
  an update for this pass.
