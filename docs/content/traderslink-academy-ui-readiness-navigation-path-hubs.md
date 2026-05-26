# TradersLink Academy UI Readiness Review: Academy Navigation Path Hubs

Date: 2026-05-18

Audit pass: Pass 5 - UI Readiness Review

Group: Academy Navigation Path Hubs

Status: complete

## Scope

Reviewed the 4 Academy Navigation Path Hubs for future `/academy` UI planning. This pass did not implement routes, schemas, React components, JSX, CSS, or production website files.

Path hubs reviewed:

- `academy/chart-reading-path.md`
- `academy/news-and-filings-path.md`
- `academy/trade-review-path.md`
- `academy/risk-discipline-path.md`

## Overall Verdict

Academy Navigation Path Hubs are ready for UI planning, but they should not be treated as numbered courses.

These hubs should act as optional guided routes, resume-learning helpers, and homepage/course-page navigation aids. They should not lock users into a path or imply that one path is required before another.

## UI Readiness Decision

| Area | Result | Notes |
|---|---|---|
| Path structure | Ready | Four useful route maps exist. |
| Metadata | Ready enough for planning | Future UI may need a `path_hub` content type or registry. |
| Progress tracking | Needs product decision | Hubs should aggregate lesson progress from underlying courses. |
| Visual readiness | Ready | Pass 4 verified all 4 path-map SVGs. |
| App bridge | Ready with restraint | Hubs can point toward review habits, not product promises. |

## Recommended UI Model

Use these as navigation panels:

| Hub | UI Role |
|---|---|
| Chart Reading Path | Route for users focused on charts, levels, candles, patterns, and volume context. |
| News And Filings Path | Route for users focused on catalysts, source documents, filings, and news review. |
| Trade Review Path | Route for users focused on improving through completed-trade review. |
| Risk Discipline Path | Route for users focused on plans, risk, behavior, and practice. |

## Product Decision Needed

Before production implementation, decide whether path hubs are:

- Standalone `/academy/...` pages.
- Homepage panels.
- Course sidebar shortcuts.
- Generated guided-route pages from course membership data.

Recommended: treat them as guided-route pages and homepage panels, not numbered courses.

## Progress Model

Path progress should aggregate underlying lesson completion by slug. Completing a lesson through a path should also count in the lesson's canonical course.

## Result

Pass 5 UI Readiness Review is complete for Academy Navigation Path Hubs.

The hubs are ready for UI planning as optional navigation support.

## Recommended Next Action

Next recommended audit:

```text
Pass 6: Restrained App Bridge Review for Trading Foundations
```
