# End-User Trader Analytics Product Roadmap

## Purpose

This document is the continuous work plan for turning the current trader
analytics debug/reporting foundation into an end-user product.

The current app already has:

- execution-only feedback for single trades
- batch trader analytics reports
- deterministic chart data
- `/api/trader-analytics/debug`
- `/debug/trader-analytics`
- a no-export product policy for production end-user analytics

This roadmap describes the next product layers:

- production analytics route
- saved in-app report history
- metric drill-down
- trader focus queue
- rule tracker
- behavior trend cards
- trade review detail pages
- in-app comparison reports
- onboarding sample report
- import and sync plan
- additional product, privacy, and retention work

The goal is to make users return to the app to review progress, understand
their trading behavior, and act on focused feedback.

## Product Stance

This is an end-user product, not a local personal tool.

The app should help a trader answer:

- What keeps showing up in my trades?
- Which execution behaviors are improving?
- Which behaviors are getting worse?
- Which exact trades caused a warning?
- What should I focus on next?
- Did my rule or intervention actually change my behavior?

The product should not give users raw data export as a default feature.

Production user value should stay inside the app:

- saved reports
- drill-down views
- comparison reports
- focus queues
- rule tracking
- in-app notes
- review history
- trend views
- controlled product navigation

## No-Export Policy

Do not build production end-user:

- JSON export
- CSV export
- spreadsheet export
- raw report download
- one-click data dump

Allowed:

- raw JSON on `/debug/` routes for development and QA
- internal/admin diagnostics
- test snapshots
- server-side saved report records
- controlled in-app report views

If sharing is ever added later, it should be permissioned, revocable, and
view-only inside the app. It should not be a raw data download.

## Relationship To Existing Docs

Read these before working from this roadmap:

- `src/docs/codex-project-log.md`
- `src/docs/trader-analytics-reports-plan.md`
- `src/docs/trader-analytics-real-data-bridge.md`
- `src/docs/execution-data-feedback-plan.md`

Important boundary:

- `trader-intelligence-v2` owns execution-feedback, app UX, report contracts,
  report history, comparisons, focus queues, and user-facing workflows.
- `levels-system` owns candle fetching, support/resistance, candle market
  structure, VWAP/EMA, and chart-reading logic.
- Production trader analytics v1 remains execution-only.
- Market context can be added later as a separate calibrated section.

## Continuous Work Protocol

When the user says to continue this roadmap:

1. Read this file.
2. Read `src/docs/codex-project-log.md`.
3. Continue the current task pointer.
4. Implement the next unchecked task.
5. Run the verification listed for that phase.
6. Update this file after every material phase or pointer change.
7. Update `src/docs/codex-project-log.md` when a phase completes or the best
   next step changes.
8. Continue without waiting unless a stop condition is hit.

## Stop Conditions

Pause and ask the user before continuing if the work requires:

- choosing a real production database or hosted backend
- choosing an authentication provider
- changing the no-export policy
- exposing raw user data to production end-user screens
- adding payment, billing, or account entitlement logic
- adding a new chart/UI dependency
- moving candle, support/resistance, or market-structure ownership out of
  `levels-system`
- using market context to change execution-only analytics
- destructive filesystem or git operations

Otherwise keep going.

## Default Implementation Assumptions

Until a real backend is chosen:

- create domain contracts and storage interfaces first
- use in-memory or fixture-backed repository adapters for tests
- keep UI/API contracts stable enough for a future database adapter
- do not hard-code a final persistence technology too early
- do not build local-file persistence for production users

Until auth is chosen:

- model `userId` / `accountId` / `workspaceId` fields in contracts where useful
- use deterministic test IDs in fixtures
- do not pretend a real multi-user security boundary exists

Until real saved trades exist:

- use fixture-backed saved trades and synthetic saved report snapshots
- keep wording conservative
- do not claim statistical proof or trader identity

## Verification Ladder

After contract or pure library work:

```bash
npx vitest run <new-or-touched-test-files>
npx tsc --noEmit
```

After API route or UI work:

```bash
npm run build
npm run lint
```

After a full phase:

```bash
npm run verify:all
```

After production route UI work:

- smoke `GET` route/page locally
- inspect desktop and mobile layouts
- confirm no production route exposes raw JSON or export controls

## Current Status Board

| Phase | Status | Output |
| --- | --- | --- |
| Phase 0: Product guardrails | Completed | no-export production policy hardening |
| Phase 1: Saved analytics domain | Completed | saved report/trade contracts and repo interfaces |
| Phase 2: Production analytics route | Completed | `/analytics` production route |
| Phase 3: Saved report history | Completed | in-app report list and detail snapshots |
| Phase 4: Filters and segmentation | Completed | symbol/session/direction/outcome filters |
| Phase 5: Metric drill-down | Completed | chart metrics open source trade lists |
| Phase 6: Trade review detail page | Completed | per-trade execution review view |
| Phase 7: In-app comparisons | Completed | latest vs prior period comparison |
| Phase 8: Behavior trends | Completed | improving/worsening behavior cards |
| Phase 9: Trader focus queue | Completed | prioritized review/action queue |
| Phase 10: Rule tracker | Completed | user-defined execution behavior rule templates |
| Phase 11: Onboarding and empty states | Completed | sample report for users with no data |
| Phase 12: Import and sync plan | Completed | execution-data ingestion workflow |
| Phase 13: Product safety and privacy | Completed | retention, permissions, admin/debug split |
| Phase 14: Calibrated market-context add-on | Completed | separate market-context analytics section plan |

## Current Task Pointer

Current task: complete.

Current phase: complete.

Next action: use `/analytics` as the fixture-backed production product surface
and replace the in-memory/sample repository with a real authenticated storage
adapter when the backend/auth decisions are ready.

## Product Ideas And Detailed Plans

### 1. Production Analytics Page

Build a polished production route separate from `/debug/trader-analytics`.

Candidate route:

```text
/analytics
```

Purpose:

- show trader analytics as a real product surface
- hide raw JSON
- hide debug language
- keep users inside the app
- present saved reports and trends, not one-off debug runs

Expected sections:

- latest report summary
- data quality strip
- KPI band
- top recurring risks
- top recurring strengths
- primary focus
- behavior trend cards
- recent reports list
- drill-down links
- focus queue

Do not include:

- raw JSON panel
- export buttons
- debug route contract copy
- provider/candle internals

Acceptance criteria:

- route renders without a pasted request JSON editor
- route has no raw JSON
- route has no export affordance
- route can render from fixture-backed saved report data
- route is responsive on desktop and mobile

### 2. Saved In-App Report History

Create a saved-report model so users can return to prior reports.

Purpose:

- make reports persistent inside the app
- let users compare behavior over time
- avoid export as the history mechanism

Possible contract:

```ts
interface SavedTraderAnalyticsReport {
  id: string;
  userId: string;
  generatedAt: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
    label: string;
  };
  sourceTradeIds: string[];
  report: TraderAnalyticsReport;
  reviewStatus: "new" | "reviewed" | "in_progress";
  notes: SavedReportNote[];
}
```

Storage pattern:

- define repository interface first
- test with in-memory adapter
- later swap in real DB adapter

Views:

- latest report
- report history list
- report detail page
- comparison entry points

Acceptance criteria:

- saved reports can be listed, fetched by ID, and rendered
- saved reports do not expose download/export
- saved reports preserve enough metadata for comparisons

### 3. Metric Drill-Down

Make every major chart actionable.

Examples:

- click "Adverse Adds" and see trades where adverse adds appeared
- click "Rapid Fire" and see trades with rapid-fire clusters
- click a P/L bar and open that trade review
- click "Open Position Leftover" and see open-position rows

Report contract needs:

- metric ID
- related point IDs
- related trade indexes/request indexes
- display label
- severity/tone

Possible drill-down contract:

```ts
interface TraderAnalyticsDrillDown {
  id: string;
  label: string;
  sourceMetricId: string;
  tradeIndexes: number[];
  rows: TraderAnalyticsTradeRow[];
}
```

Acceptance criteria:

- drill-down is generated by the report layer or a pure selector
- UI does not re-detect behavior
- every top risk/strength/focus chart can show source trades
- clicking a row can open the trade detail view

### 4. Trader Focus Queue

Convert analytics into a short review queue.

Purpose:

- reduce overwhelm
- tell the trader what to review first
- show example trades
- connect repeated behaviors to action items

Focus item examples:

- "Review adverse-price adds"
- "Review open-position leftovers"
- "Review rapid-fire execution clusters"
- "Review inconsistent share sizing"
- "Reinforce decisive full exits"

Possible contract:

```ts
interface TraderFocusQueueItem {
  id: string;
  rank: number;
  kind: "risk" | "strength" | "maintenance";
  title: string;
  summary: string;
  whyItMatters: string;
  relatedTradeIndexes: number[];
  suggestedReviewAction: string;
  status: "new" | "acknowledged" | "in_progress" | "resolved";
}
```

Rules:

- use factual wording
- avoid identity claims
- prioritize repeated high-severity risks
- include strengths so the product is not only negative

Acceptance criteria:

- queue is deterministic from report data
- each item links to source trades
- user can mark review status in app later

### 5. Rule Tracker

Let users define trading rules and track execution-only violations.

Example user rules:

- no adding after price moves against entry
- no more than 3 executions inside 60 seconds
- reduce some risk before adding a third time
- close all day trades by end of session
- do not increase size after first reduction
- keep add sizes within a defined range

Rule tracker should start with templates, not free-form logic.

Possible contract:

```ts
interface TraderRuleTemplate {
  id: string;
  label: string;
  description: string;
  supportedParameters: TraderRuleParameter[];
  evaluate: "server_template";
}

interface TraderRuleInstance {
  id: string;
  userId: string;
  templateId: string;
  enabled: boolean;
  parameters: Record<string, number | string | boolean>;
}

interface TraderRuleEvaluation {
  ruleId: string;
  reportId: string;
  passedTradeCount: number;
  violatedTradeCount: number;
  violationTradeIndexes: number[];
}
```

Acceptance criteria:

- first rule templates use existing execution-feedback facts
- evaluations are deterministic and tested
- rule results link back to source trades
- no candle/market-context rule until calibrated separately

### 6. Behavior Trend Cards

Show whether behaviors are improving or worsening across saved reports.

Examples:

- adverse adds: down from 44% to 25%
- open-position leftovers: unchanged
- rapid-fire clusters: worse
- decisive exits: improving

Possible contract:

```ts
interface BehaviorTrendCard {
  behaviorId: string;
  label: string;
  previousRate: number | null;
  currentRate: number | null;
  delta: number | null;
  direction: "improving" | "worsening" | "flat" | "insufficient_data";
  sampleSizeWarning: boolean;
}
```

Rules:

- only compare like-for-like periods
- show sample size
- say "appeared less often" instead of "fixed"
- avoid strong claims until enough data exists

Acceptance criteria:

- trend logic is pure and tested
- UI shows sample sizes beside deltas
- no statistical-proof language

### 7. Trade Review Detail Page

Give each trade its own review page.

Candidate route:

```text
/trades/[tradeId]
```

Sections:

- execution timeline
- position size over time
- gross realized P/L from fills
- execution-feedback risks
- execution-feedback strengths
- related report appearances
- notes/action status
- later candle/level context from `levels-system`

Visuals:

- fill timeline
- position-size step chart
- gross realized P/L by reduction
- entry/add/reduction/exit markers

Acceptance criteria:

- route can render fixture-backed saved trade
- no candle context required for v1
- links from analytics drill-down rows work
- later market context is separated and labeled

### 8. In-App Comparison Reports

Replace export-style workflows with app-native comparisons.

Comparison types:

- latest 20 trades vs prior 20 trades
- this week vs last week
- this month vs prior month
- long trades vs short trades
- winners vs losers
- morning vs afternoon
- symbol vs symbol

Possible contract:

```ts
interface TraderAnalyticsComparison {
  id: string;
  left: TraderAnalyticsReport;
  right: TraderAnalyticsReport;
  metricDeltas: TraderAnalyticsMetricDelta[];
  behaviorDeltas: BehaviorTrendCard[];
  sampleSizeWarning: boolean;
}
```

Acceptance criteria:

- comparisons are generated inside app
- both sides show sample sizes
- no export/download needed
- chart deltas link to drill-down trades

### 9. Onboarding Sample Report

When a new user has no data, show a sample product experience.

Purpose:

- show what the product will do
- avoid empty dashboards
- teach the user what data is needed

Sections:

- sample analytics report
- sample drill-down
- sample focus queue
- import/sync call to action
- clear "sample data" label

Acceptance criteria:

- sample data cannot be mistaken for user data
- no raw JSON
- clear next action to connect/import trades

### 10. Import And Sync Plan

Define how user execution data enters the app.

Possible ingestion paths:

- broker sync later
- manual paste during early testing
- saved trade batches from internal tools
- integration with the existing `levels-system` provider path for market data
  only when candle context is needed

Important boundary:

- execution trade import/sync is different from candle fetching
- `levels-system` owns candle data and chart structure
- this app owns saved user execution records and feedback/report workflows

Recommended staged approach:

1. Define saved execution-trade contract.
2. Add validation/import preview screen.
3. Store accepted trades in app storage.
4. Run execution feedback.
5. Generate saved reports.
6. Later attach market-context summaries separately.

Acceptance criteria:

- invalid trades are rejected or quarantined
- imported trades can be traced to report rows
- import does not expose export/download

### 11. In-App Notes And Review Status

Let users write notes and mark items as reviewed.

Possible objects:

- trade note
- report note
- focus item note
- rule review note

Statuses:

- new
- reviewed
- in progress
- resolved
- ignored

Acceptance criteria:

- notes stay in app
- notes attach to saved objects by ID
- notes do not alter factual analytics

### 12. Practice And Intervention Tracking

Track whether a user is working on a specific behavior.

Examples:

- intervention: "No adverse adds for next 20 trades"
- intervention: "Reduce at least 25% before third add"
- intervention: "No rapid-fire clusters this week"

Possible contract:

```ts
interface TraderIntervention {
  id: string;
  userId: string;
  targetBehaviorId: string;
  startDate: string;
  endDate: string | null;
  goal: string;
  status: "planned" | "active" | "completed" | "paused";
}
```

Acceptance criteria:

- intervention results use saved report/trade data
- before/during/after comparisons are in app
- language remains factual

### 13. Account And Workspace Model

Future product needs a user/account boundary.

Objects to model before real storage:

- user
- account/workspace
- trade source
- saved trade
- saved report
- report note
- focus item
- rule instance

Acceptance criteria:

- contracts include ownership IDs where needed
- tests use deterministic fixture IDs
- no false security claims before auth exists

### 14. Privacy, Retention, And Admin Debug Split

Product must separate debug/admin surfaces from user surfaces.

Rules:

- `/debug/` remains internal
- production analytics routes do not show raw JSON
- admin diagnostics are separate from end-user views
- user-facing routes show summaries and drill-downs only
- data retention policy should be explicit before launch

Acceptance criteria:

- production route has no raw report dump
- debug route remains useful for development
- docs clearly identify what is internal

### 15. Mobile And Accessibility Pass

End users may review reports on laptops, tablets, or phones.

Needs:

- charts readable on mobile
- tables collapse into cards or scroll predictably
- buttons have clear labels
- color is not the only signal
- focus states are visible
- no text overlap

Acceptance criteria:

- browser screenshots checked at desktop and mobile widths
- chart labels remain readable
- keyboard navigation works for major controls

### 16. Notification And Return Loop

Later, create reasons to return to the app without exporting data.

Examples:

- "Your weekly report is ready"
- "You have 3 trades to review"
- "Rapid-fire clusters increased in your latest report"
- "Your focus item has improved over the last 20 trades"

This should be in-app first. Email/push can come later.

Acceptance criteria:

- notifications link back into app views
- no raw data included in notifications
- no alarmist language

### 17. Calibrated Market-Context Add-On

After real saved data exists, add candle context as a separate section.

Possible sections:

- support/resistance interaction summary
- VWAP/EMA context summary
- market-structure observation summary
- market-context availability/quality gates

Rules:

- do not modify execution-only metrics
- do not use market context for final conclusions until calibrated
- do not import random internals from `levels-system`

Acceptance criteria:

- market-context section can be removed without changing execution-only report
- tests prove isolation
- low-confidence market structure stays observational

## Phase Work Plan

### Phase 0: Product Guardrails

Status: Completed

Goal:

Lock the production direction before adding routes.

Tasks:

- [x] `EU-001` Add product-roadmap links to existing analytics docs.
- [x] `EU-002` Add a production-route no-export checklist.
- [x] `EU-003` Add a reusable copy block for debug-only raw JSON warnings.
- [x] `EU-004` Audit `/debug/trader-analytics` for labels that should not
  appear in production.
- [x] `EU-005` Update project log and set pointer to `EU-010`.

Definition of done:

- future work has an explicit no-export checklist
- production route requirements are clear
- debug/admin behavior is separated from product behavior

### Phase 1: Saved Analytics Domain

Status: Completed

Goal:

Create contracts and repository interfaces for saved trades and saved reports.

Tasks:

- [x] `EU-010` Define saved trade ID and saved report ID types.
- [x] `EU-011` Define `SavedExecutionTrade`.
- [x] `EU-012` Define `SavedTraderAnalyticsReport`.
- [x] `EU-013` Define report period and source-trade metadata.
- [x] `EU-014` Define in-memory saved report repository for tests.
- [x] `EU-015` Add tests for list/fetch/save report behavior.
- [x] `EU-016` Update docs and set pointer to `EU-020`.

Definition of done:

- saved report domain exists without choosing a real DB
- analytics reports can be stored and fetched through an interface
- no production persistence technology has been prematurely locked in

### Phase 2: Production Analytics Route

Status: Completed

Goal:

Build the first non-debug end-user analytics route.

Tasks:

- [x] `EU-020` Add `/analytics` page shell.
- [x] `EU-021` Use fixture-backed saved reports initially.
- [x] `EU-022` Render latest report KPI band.
- [x] `EU-023` Render top risks/strengths without raw JSON.
- [x] `EU-024` Render report history entry points.
- [x] `EU-025` Confirm no export controls and no raw JSON.
- [x] `EU-026` Run build/lint and visual smoke.
- [x] `EU-027` Update docs and set pointer to `EU-030`.

Definition of done:

- production route exists
- no debug affordances are present
- route can later swap fixture repository for real saved reports

### Phase 3: Saved Report History

Status: Completed

Goal:

Let users browse saved reports in-app.

Tasks:

- [x] `EU-030` Add report history list model/selectors.
- [x] `EU-031` Add report history UI.
- [x] `EU-032` Add report detail view.
- [x] `EU-033` Add review status display.
- [x] `EU-034` Add tests for report-history selectors.
- [x] `EU-035` Run verification and update docs.

Definition of done:

- user can navigate in app from latest report to older reports
- history replaces export as the main recall mechanism

### Phase 4: Filters And Segmentation

Status: Completed

Goal:

Let users slice analytics inside the app.

Tasks:

- [x] `EU-040` Add report filter contract.
- [x] `EU-041` Add symbol filter.
- [x] `EU-042` Add direction filter.
- [x] `EU-043` Add session filter.
- [x] `EU-044` Add date/report-period filter through saved report periods.
- [x] `EU-045` Add winner/loser/open/closed filter.
- [x] `EU-046` Add tests proving filters preserve sample-size visibility.
- [x] `EU-047` Update docs.

Definition of done:

- filters alter visible analytics in app
- no export/download workflow is needed for segmentation

### Phase 5: Metric Drill-Down

Status: Completed

Goal:

Make charts actionable by linking metrics to trades.

Tasks:

- [x] `EU-050` Add drill-down selector contract.
- [x] `EU-051` Map risk point IDs to source trade rows.
- [x] `EU-052` Map strength point IDs to source trade rows.
- [x] `EU-053` Map lifecycle metrics to source trade rows.
- [x] `EU-054` Add drill-down panel/modal/page.
- [x] `EU-055` Add tests for risk/strength/lifecycle drill-downs.
- [x] `EU-056` Update docs.

Definition of done:

- major charts answer "which trades caused this?"
- UI does not reimplement behavior detection

### Phase 6: Trade Review Detail Page

Status: Completed

Goal:

Create a per-trade review page connected to analytics drill-downs.

Tasks:

- [x] `EU-060` Define saved trade detail view model.
- [x] `EU-061` Add execution timeline visualization.
- [x] `EU-062` Add position-size visualization.
- [x] `EU-063` Add execution risk/strength sections.
- [x] `EU-064` Link drill-down rows to trade detail.
- [x] `EU-065` Add tests and visual smoke.

Definition of done:

- users can move from a report metric to exact trade evidence

### Phase 7: In-App Comparisons

Status: Completed

Goal:

Compare report periods inside the app.

Tasks:

- [x] `EU-070` Define comparison input contract.
- [x] `EU-071` Build pure comparison helper.
- [x] `EU-072` Add latest vs prior period comparison.
- [x] `EU-073` Add winners vs losers comparison path through filters.
- [x] `EU-074` Add long vs short comparison path through filters.
- [x] `EU-075` Add tests for delta calculations.
- [x] `EU-076` Add UI comparison cards.

Definition of done:

- users can compare behavior without exporting data
- sample sizes remain visible

### Phase 8: Behavior Trends

Status: Completed

Goal:

Show improving/worsening behavior over saved reports.

Tasks:

- [x] `EU-080` Define behavior trend card contract.
- [x] `EU-081` Add trend helpers for risk rates.
- [x] `EU-082` Add trend helpers for strength rates.
- [x] `EU-083` Add sample-size warning logic.
- [x] `EU-084` Add trend cards to production analytics page.
- [x] `EU-085` Add tests.

Definition of done:

- trend language is factual and sample-aware
- users can see what is changing over time

### Phase 9: Trader Focus Queue

Status: Completed

Goal:

Turn analytics into a short prioritized review queue.

Tasks:

- [x] `EU-090` Define focus queue item contract.
- [x] `EU-091` Add deterministic queue builder.
- [x] `EU-092` Link focus items to drill-down trades.
- [x] `EU-093` Add focus queue UI.
- [x] `EU-094` Add status model for focus items.
- [x] `EU-095` Add tests.

Definition of done:

- users get a clear "review this first" queue
- queue is evidence-linked and not identity-judgmental

### Phase 10: Rule Tracker

Status: Completed

Goal:

Let users track execution behavior rules inside the app.

Tasks:

- [x] `EU-100` Define rule template contract.
- [x] `EU-101` Add first rule templates from existing execution-feedback facts.
- [x] `EU-102` Define user rule instance contract.
- [x] `EU-103` Build rule evaluation helper.
- [x] `EU-104` Add rule tracker UI.
- [x] `EU-105` Add tests for pass/violation counts.

Definition of done:

- users can enable rule templates
- violations link back to trades
- rule results remain execution-only

### Phase 11: Onboarding And Empty States

Status: Completed

Goal:

Make the product useful before a user has imported data.

Tasks:

- [x] `EU-110` Add sample analytics report state.
- [x] `EU-111` Add clear sample-data labeling.
- [x] `EU-112` Add import/sync call to action.
- [x] `EU-113` Add first-run route state.
- [x] `EU-114` Add tests/visual smoke.

Definition of done:

- new users understand the product before they have data
- sample report cannot be mistaken for real user data

### Phase 12: Import And Sync Plan

Status: Completed

Goal:

Prepare execution-data ingestion for end users.

Tasks:

- [x] `EU-120` Define saved execution import contract.
- [x] `EU-121` Add import preview/validation model.
- [x] `EU-122` Add invalid trade quarantine model.
- [x] `EU-123` Define broker sync boundary.
- [x] `EU-124` Document how this differs from `levels-system` candle fetching.
- [x] `EU-125` Add fixture-backed import tests.

Definition of done:

- ingestion path is documented and testable
- candle fetching remains owned by `levels-system`

### Phase 13: Product Safety And Privacy

Status: Completed

Goal:

Separate user product screens from debug/admin screens.

Tasks:

- [x] `EU-130` Add production/debug route checklist.
- [x] `EU-131` Add admin diagnostics boundary doc.
- [x] `EU-132` Add retention policy draft.
- [x] `EU-133` Add permissions/auth assumptions doc.
- [x] `EU-134` Audit production routes for raw JSON/export leakage.

Definition of done:

- launch-facing routes have clear data-safety guardrails

### Phase 14: Calibrated Market-Context Add-On

Status: Completed

Goal:

Later, add candle/structure context without changing execution-only analytics.

Tasks:

- [x] `EU-140` Define separate market-context analytics section.
- [x] `EU-141` Document calibrated full trade-analysis summary consumption.
- [x] `EU-142` Document support/resistance interaction summaries.
- [x] `EU-143` Document market-structure observation summaries.
- [x] `EU-144` Prove execution-only metrics are unchanged.
- [x] `EU-145` Update `levels-system` handoff only if blockers are found.

Definition of done:

- market context is additive
- execution-only report remains reproducible without candles

## Continuous Work Queue

Use this queue when continuing without interruption.

### Phase 0 Queue

- [x] `EU-001` Link this roadmap from existing docs.
- [x] `EU-002` Add production no-export checklist.
- [x] `EU-003` Audit debug-only labels.
- [x] `EU-004` Update docs and project log.

### Phase 1 Queue

- [x] `EU-010` Add saved analytics contracts.
- [x] `EU-011` Add repository interfaces and in-memory adapter.
- [x] `EU-012` Add tests.
- [x] `EU-013` Update docs.

### Phase 2 Queue

- [x] `EU-020` Build `/analytics` production route shell.
- [x] `EU-021` Render fixture-backed saved report.
- [x] `EU-022` Remove raw JSON/export/debug affordances.
- [x] `EU-023` Build/lint/visual smoke.
- [x] `EU-024` Update docs.

### Phase 3 Queue

- [x] `EU-030` Build saved report history selectors.
- [x] `EU-031` Build saved report history UI.
- [x] `EU-032` Add report detail route/state.
- [x] `EU-033` Test and update docs.

### Phase 4 Queue

- [x] `EU-040` Add filters and segmentation helpers.
- [x] `EU-041` Add filter UI.
- [x] `EU-042` Test sample-size behavior.
- [x] `EU-043` Update docs.

### Phase 5 Queue

- [x] `EU-050` Add metric drill-down selectors.
- [x] `EU-051` Add drill-down UI.
- [x] `EU-052` Link to trade detail route.
- [x] `EU-053` Test and update docs.

### Phase 6 Queue

- [x] `EU-060` Add trade detail view model.
- [x] `EU-061` Add trade detail route.
- [x] `EU-062` Add execution timeline visuals.
- [x] `EU-063` Test and update docs.

### Phase 7 Queue

- [x] `EU-070` Add comparison helpers.
- [x] `EU-071` Add comparison UI.
- [x] `EU-072` Test and update docs.

### Phase 8 Queue

- [x] `EU-080` Add behavior trend helpers.
- [x] `EU-081` Add trend cards.
- [x] `EU-082` Test and update docs.

### Phase 9 Queue

- [x] `EU-090` Add focus queue builder.
- [x] `EU-091` Add focus queue UI.
- [x] `EU-092` Test and update docs.

### Phase 10 Queue

- [x] `EU-100` Add rule tracker contracts.
- [x] `EU-101` Add first templates/evaluator.
- [x] `EU-102` Add rule tracker UI.
- [x] `EU-103` Test and update docs.

### Phase 11 Queue

- [x] `EU-110` Add onboarding sample state.
- [x] `EU-111` Add empty-state route behavior.
- [x] `EU-112` Test and update docs.

### Phase 12 Queue

- [x] `EU-120` Add import/sync contracts.
- [x] `EU-121` Add validation preview plan.
- [x] `EU-122` Test and update docs.

### Phase 13 Queue

- [x] `EU-130` Add safety/privacy docs.
- [x] `EU-131` Audit production routes.
- [x] `EU-132` Update docs.

### Phase 14 Queue

- [x] `EU-140` Add market-context add-on design.
- [x] `EU-141` Add isolation tests.
- [x] `EU-142` Update docs and handoff if needed.

## Completion Rules

This roadmap branch is complete when:

- production analytics exists without debug/export affordances
- saved in-app reports exist
- report history exists
- filters and segmenting exist
- chart drill-down exists
- trade detail views exist
- in-app comparisons exist
- behavior trend cards exist
- focus queue exists
- rule tracker exists
- onboarding sample state exists
- import/sync boundary is documented and testable
- product safety/privacy boundaries are documented
- market-context add-on remains separate and calibrated

## Current Progress Log

### 2026-05-02

- Created this roadmap.
- Linked it from `README.md`, `src/docs/codex-project-log.md`,
  `src/docs/trader-analytics-reports-plan.md`, and
  `src/docs/trader-analytics-real-data-bridge.md`.
- Added saved analytics product contracts, in-memory repository, fixture-backed
  saved trades/reports, production no-export guardrails, filters, drill-downs,
  comparisons, trend cards, focus queue, rule tracker, import preview, and
  trade-review view models.
- Added production routes:
  - `/analytics`
  - `/trades/[tradeId]`
- Added supporting docs:
  - `src/docs/trader-analytics-production-safety-checklist.md`
  - `src/docs/trader-analytics-import-sync-plan.md`
  - `src/docs/trader-analytics-market-context-add-on-plan.md`
- Focused product verification passed:
  `npx vitest run src/lib/trader-analytics/__tests__/end-user-product-roadmap.test.ts`
  and `npx tsc --noEmit`.
- `npm run build` passed and produced `/analytics` and `/trades/[tradeId]`.
- `npm run lint` passed with `0` errors and the same `4` pre-existing warnings.
- Full verification passed:
  `npm run verify:all` with `71` files / `656` tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints.
- Production-route smoke passed against `next start` on a local test port:
  - `GET /analytics` returned `200` and rendered `Analytics`, `Focus Queue`,
    and `Completed Trades`.
  - `GET /trades/trade-rapid-fire` returned `200` and rendered `Trade Review`.
  - `GET /` returned `200` and linked to `/analytics`.
- Current pointer is complete.

## Current Best Next Step

Replace the fixture/in-memory repository with a real authenticated storage
adapter when backend and auth decisions are ready. Until then, use `/analytics`
as the production UX prototype and `/debug/trader-analytics` for internal
contract inspection.
