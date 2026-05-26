# End-User Productization Implementation Plan

Date: 2026-05-02

Status: Historical productization plan. Do not use as the current
implementation plan; start from root `plan.md` and the plan index.

## Purpose

This historical file was the working plan for turning the analytics prototype
into a real end-user product loop.

It follows the previous completed plans:

- `src/docs/end-user-trader-analytics-product-roadmap.md`
- `src/docs/end-user-analytics-product-expansion-plan.md`

The goal of this pass is to complete the app-side productization contracts,
sample-backed product surfaces, and verification for:

- authenticated storage readiness
- workspace/account model
- import reconciliation pipeline
- review workflow
- trade tags and setup labels
- action plan system
- end-user/admin permission split
- async analysis jobs
- visual QA checklist
- market-context calibration queue

## Critical Boundary

This plan must not fake real infrastructure.

Completed in this pass means:

- contracts exist
- product helper logic exists
- sample-backed UI surfaces exist
- tests prove the behavior
- docs record the remaining real backend/auth gate

Completed in this pass does not mean:

- production auth provider selected
- database migrations created
- real broker OAuth connected
- production file uploads enabled
- raw data export added

## Product Principles

- Users should return to the app to review analytics, notes, focus items,
  action plans, and historical snapshots.
- The app should not encourage users to export or remove their analytics data
  from the product.
- Debug/admin surfaces may inspect contracts and raw JSON; production end-user
  surfaces must not.
- Execution-only analytics are the stable first product lane.
- Market-context analytics stay separate and calibration-gated until real
  saved trades prove the structure reads are useful.

## Phase 0: Plan And Resume Tracking

Status: Completed

Tasks:

- [x] `PZ-000` Create this implementation plan.
- [x] `PZ-001` Link this plan from `src/docs/codex-project-log.md`.
- [x] `PZ-002` Define what completion means without real auth/database choices.

Definition of done:

- future Codex sessions can resume directly from this file
- the plan separates app-side completion from infrastructure choices

## Phase 1: Workspace And Account Model

Status: Completed

Detailed tasks:

- [x] `PZ-010` Add product user/workspace/account contracts.
- [x] `PZ-011` Add a sample workspace with one user and one trading account.
- [x] `PZ-012` Add workspace summary helper:
  - active workspace ID
  - active account ID
  - account count
  - sample/persistent mode
  - next storage/auth action
- [x] `PZ-013` Surface workspace summary on `/analytics`.
- [x] `PZ-014` Test workspace/account scoping values.

Definition of done:

- the app has a clear model for "which user/account/report is this?"
- sample mode is obvious
- no code implies real auth is already wired

## Phase 2: Import Reconciliation Pipeline

Status: Completed

Detailed tasks:

- [x] `PZ-020` Add reconciliation batch and item contracts.
- [x] `PZ-021` Detect duplicate trade requests against already saved trades.
- [x] `PZ-022` Preserve import validation states:
  - ready
  - needs review
  - duplicate
  - rejected
- [x] `PZ-023` Add recommended user action per row.
- [x] `PZ-024` Surface reconciliation on `/analytics`.
- [x] `PZ-025` Test duplicates, warnings, and rejected rows.

Definition of done:

- imports can be reviewed before they affect saved analytics
- duplicate detection exists at the app boundary
- raw import export is not added

## Phase 3: Review Workflow

Status: Completed

Detailed tasks:

- [x] `PZ-030` Add review workflow contracts.
- [x] `PZ-031` Convert focus queue, notes, and rules into workflow items.
- [x] `PZ-032` Support statuses:
  - needs review
  - reviewed
  - lesson captured
  - rule created
  - resolved
- [x] `PZ-033` Add workflow summary counts.
- [x] `PZ-034` Surface workflow on `/analytics`.
- [x] `PZ-035` Test count stability and linked trade IDs.

Definition of done:

- analytics becomes a review loop, not just a report
- review items stay in app

## Phase 4: Trade Tags And Setup Labels

Status: Completed

Detailed tasks:

- [x] `PZ-040` Add tag and tagged segment contracts.
- [x] `PZ-041` Add default tags:
  - long
  - short
  - scale-in
  - partial-exit
  - open-position
  - rapid-execution
- [x] `PZ-042` Assign tags from execution-only report rows and summaries.
- [x] `PZ-043` Summarize P/L, count, top risk, and top strength by tag.
- [x] `PZ-044` Surface tag segmentation on `/analytics`.
- [x] `PZ-045` Test segment counts and no candle dependency.

Definition of done:

- users can compare behavior by setup-like tags before candle calibration exists
- tags are generated from execution facts only in this pass

## Phase 5: Action Plan System

Status: Completed

Detailed tasks:

- [x] `PZ-050` Add action plan contracts.
- [x] `PZ-051` Create action items from:
  - primary focus queue
  - worst rule violation
  - strongest positive behavior
- [x] `PZ-052` Include measurable windows such as "next 10 trades."
- [x] `PZ-053` Keep action items inside the app.
- [x] `PZ-054` Surface action plan on `/analytics`.
- [x] `PZ-055` Test action plan priority and source links.

Definition of done:

- the app suggests what behavior to work on next
- action plans are generated from saved analytics, not freeform guesses

## Phase 6: End-User/Admin Permission Split

Status: Completed

Detailed tasks:

- [x] `PZ-060` Add route access policy contracts.
- [x] `PZ-061` Mark production routes as end-user safe.
- [x] `PZ-062` Mark debug routes as admin/debug only.
- [x] `PZ-063` Add route audit helper for:
  - raw JSON panels
  - export controls
  - debug copy
  - admin-only route labels
- [x] `PZ-064` Surface permission summary on `/analytics`.
- [x] `PZ-065` Test admin/debug split.

Definition of done:

- production and debug surfaces are explicitly separated
- no end-user route is treated as a raw contract explorer

## Phase 7: Async Analysis Jobs

Status: Completed

Detailed tasks:

- [x] `PZ-070` Add analysis job contracts.
- [x] `PZ-071` Build sample job queue from import reconciliation state.
- [x] `PZ-072` Support statuses:
  - queued
  - processing
  - completed
  - failed
  - needs user fix
- [x] `PZ-073` Add summary counts and next action.
- [x] `PZ-074` Surface jobs on `/analytics`.
- [x] `PZ-075` Test job states and blocked imports.

Definition of done:

- batch import/analysis has a product model before real background workers
- users can see whether analysis is waiting, complete, or blocked

## Phase 8: Visual QA Plan

Status: Completed

Detailed tasks:

- [x] `PZ-080` Add visual QA checklist contracts.
- [x] `PZ-081` Add route/device checks for:
  - `/analytics` desktop
  - `/analytics` mobile
  - `/trades/[tradeId]` desktop
  - `/trades/[tradeId]` mobile
- [x] `PZ-082` Add checks for no text overlap, no export controls, and product
  copy clarity.
- [x] `PZ-083` Surface visual QA status on `/analytics`.
- [x] `PZ-084` Smoke routes after build.

Definition of done:

- product UI has an explicit QA loop
- smoke checks prove core routes respond

## Phase 9: Market-Context Calibration Queue

Status: Completed

Detailed tasks:

- [x] `PZ-090` Add market-context calibration queue contracts.
- [x] `PZ-091` Build queue items from saved trades/reports.
- [x] `PZ-092` Mark sample trades as not eligible for production calibration.
- [x] `PZ-093` Preserve separation:
  - market context is observational
  - market context does not alter execution analytics
  - market context does not alter action plans yet
- [x] `PZ-094` Surface calibration queue on `/analytics`.
- [x] `PZ-095` Test sample-only gating and execution analytics isolation.

Definition of done:

- the path to future candle/structure feedback is visible
- market context remains calibration-gated

## Phase 10: Verification And Documentation

Status: Completed

Detailed tasks:

- [x] `PZ-100` Add focused productization tests.
- [x] `PZ-101` Run TypeScript.
- [x] `PZ-102` Run build.
- [x] `PZ-103` Run lint.
- [x] `PZ-104` Run full verification.
- [x] `PZ-105` Smoke production routes.
- [x] `PZ-106` Update this plan and `src/docs/codex-project-log.md`.
- [x] `PZ-107` Update README references.

Definition of done:

- focused and full verification pass
- route smoke passes
- docs reflect the actual current state

## Stop Conditions

Stop and update this file before proceeding if:

- a real auth provider choice is required
- a real database provider choice is required
- an implementation would expose raw user data or add export controls
- a route would make debug/admin tooling visible as end-user product UX
- market-context output would influence execution analytics before calibration
- `levels-system` changes are required

## Current Status Board

| Phase | Status | Current Pointer |
| --- | --- | --- |
| Phase 0: Plan and resume tracking | Completed | plan created |
| Phase 1: Workspace and account model | Completed | workspace scope on `/analytics` |
| Phase 2: Import reconciliation pipeline | Completed | reconciliation panel on `/analytics` |
| Phase 3: Review workflow | Completed | workflow panel on `/analytics` |
| Phase 4: Trade tags and setup labels | Completed | setup tags panel on `/analytics` |
| Phase 5: Action plan system | Completed | action plan panel on `/analytics` |
| Phase 6: Permission split | Completed | permission summary on `/analytics` |
| Phase 7: Async analysis jobs | Completed | job queue panel on `/analytics` |
| Phase 8: Visual QA plan | Completed | QA checklist on `/analytics` |
| Phase 9: Market-context calibration queue | Completed | calibration queue on `/analytics` |
| Phase 10: Verification and docs | Completed | verified and smoked |

## Verification Ladder

Focused checks:

```bash
npx vitest run src/lib/trader-analytics/__tests__/end-user-productization.test.ts
npx tsc --noEmit
```

Full checks:

```bash
npm run verify:all
npm run build
npm run lint
```

Smoke checks:

- `GET /analytics`
- `GET /trades/trade-rapid-fire`
- `GET /`

## Current Progress Log

### 2026-05-02

- Created this plan.
- Added productization contracts and helpers under
  `src/lib/trader-analytics/product/productization.ts`.
- Added productization view-model fields to
  `ProductTraderAnalyticsViewModel`.
- Added `/analytics` productization panels:
  - Workspace Scope
  - Permission Split
  - Import Reconciliation
  - Analysis Jobs
  - Review Workflow
  - Action Plan
  - Setup Tags
  - Calibration Queue
  - Visual QA
- Added focused productization tests:
  `src/lib/trader-analytics/__tests__/end-user-productization.test.ts`.
- Focused verification passed:
  `npx vitest run src/lib/trader-analytics/__tests__/end-user-productization.test.ts`
  with `8` tests and `npx tsc --noEmit`.
- `npm run build` passed and produced `/analytics` and `/trades/[tradeId]`.
- `npm run lint` passed with `0` errors and the same `4` pre-existing warnings.
- Full verification passed:
  `npm run verify:all` with `73` files / `672` tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints.
- Production route smoke passed against `next start` on a local test port:
  - `GET /analytics` returned `200` and rendered `Workspace Scope`,
    `Permission Split`, `Import Reconciliation`, `Analysis Jobs`,
    `Review Workflow`, `Action Plan`, `Setup Tags`, and `Calibration Queue`.
  - `GET /trades/trade-rapid-fire` returned `200` and rendered `Saved Notes`.
  - `GET /` returned `200` and linked to `/analytics`.
- Current implementation pointer: complete.

## Historical Best Next Step

The productization prototype is complete. The remaining real-product gate is
choosing authenticated storage and a database provider, then replacing the
sample/in-memory repository with a persistent implementation behind the
existing repository boundary.
