# Trader Analytics Real Data Bridge

## Purpose

This document defines how trader analytics reports should move from fixture
batches to real saved trades without mixing execution-only evidence with
candle/market-context evidence.

The current implemented report contract is:

```text
trader_analytics_report_v1
```

It is built from:

```text
execution_feedback_summary_v1
```

That means v1 reports are about execution behavior only:

- side, shares, price, timestamp
- position lifecycle
- adds, reductions, exits
- gross realized P/L
- execution-feedback risk and strength point IDs
- validation failures and warnings

They do not read candles, support/resistance, VWAP/EMA, or market structure.

## Implemented Entry Points

Library:

```ts
import {
  buildTraderAnalyticsReport,
  runTraderAnalyticsReport,
} from "@/src/lib/trader-analytics";
```

API and page:

```text
POST /api/trader-analytics/debug
GET  /api/trader-analytics/debug
/debug/trader-analytics
```

Accepted raw request shapes:

```text
single trade request
{ request }
{ trade }
{ requests: [...] }
{ trades: [...] }
array of trade requests
```

Accepted prebuilt summary shapes:

```text
{ summaries: [...] }
execution_feedback_summary_v1[]
{ requestIndex, summary }[]
```

The prebuilt summary path exists so a future saved-trade store can cache
execution-feedback summaries and rebuild reports without replaying every trade
request.

## Real Saved Trade Workflow

Recommended v1 workflow:

1. Save or import the user's execution-only trade requests.
2. Validate the batch with the existing trade-analysis request contract.
3. Run the batch through `runTraderAnalyticsReport(...)`.
4. Store the returned `trader_analytics_report_v1` as an in-app review
   snapshot.
5. Keep raw requests and report snapshots separate internally.
6. Present report history, comparisons, and drill-downs inside the app rather
   than as downloadable raw data.

Recommended saved request fields:

- `symbol`
- `tradeDirection`
- `sessionContext.sessionDate`
- `sessionContext.sessionBucket`
- `executions[].symbol`
- `executions[].timestamp`
- `executions[].side`
- `executions[].shares`
- `executions[].price`

Optional fields:

- `provider`
- `tradeWindow`
- execution-window candle counts

Those optional fields may exist on the saved request, but the trader analytics
v1 report ignores candle/provider work because it delegates only to
execution-feedback.

## End-User Data Access Policy

Trader analytics is intended for an end-user product.

End users should return to the app to view report history, progress, and
comparisons. The product should not add end-user JSON, CSV, spreadsheet, or raw
report export unless the product strategy changes explicitly.

Use in-app alternatives instead:

- saved report history
- report comparison across date ranges
- rolling windows, such as last 20 trades vs prior 20 trades
- symbol, session, direction, winner/loser, and open/closed filters
- chart-bar drill-down into source trades
- in-app notes, review status, and action items

Raw report JSON is allowed on `/debug/` routes and admin-only diagnostics for
development, QA, and support. It should not appear on production end-user
screens.

## Future Full Analysis Boundary

Later reports can add a separate market-context section after real saved data
proves the shared candle context is useful.

Future contract direction:

```ts
interface TraderAnalyticsReportV2 {
  executionOnly: TraderAnalyticsReport;
  marketContext?: {
    dataSource: "trade_analysis_summaries";
    supportResistanceInteractions: unknown;
    dynamicLevelInteractions: unknown;
    marketStructureObservations: unknown;
    calibrationStatus: "debug_only" | "review" | "ready";
    usedForExecutionMetrics: false;
  };
}
```

Required rule:

Execution-only metrics must not change when market context is present.

That means the following sections must remain reproducible from executions
alone:

- `sampleSize`
- `pnl`
- `lifecycle`
- `executionBehavior`
- `strengths`
- `topRisks`
- `topStrengths`
- `primaryFocusCounts`
- `trades`
- execution-only chart data

Market context should be additive and clearly labeled.

It may say:

- support/resistance was observed near an execution
- VWAP/EMA context was available
- experimental market structure was present or missing
- calibration status is PASS / REVIEW / BLOCKER

It should not yet say:

- the trader ignored support
- the setup was bad
- market structure confirms the trader's behavior
- chart context changes execution-only grading

Those claims require real saved-trade calibration and product-language review.

## Calibration Requirements Before Market Context Promotion

Before any market-context section becomes end-user-facing, collect real saved
trades and run:

```bash
npm run calibrate:market-structure -- path/to/saved-trades.json
```

Promotion requirements:

- enough real saved trades reviewed
- clean PatternInput isolation
- low provider/shared-engine error rate
- market structure present often enough to be useful
- confidence distribution understood
- unknown/insufficient structure reads explained
- examples reviewed manually against charts

Until those gates pass, `experimentalMarketStructure` stays debug-only.

## Testing Rules

Current tests prove:

- fixture batches produce `trader_analytics_report_v1`
- invalid requests are counted as failures and excluded from aggregate metrics
- validate-only mode returns an empty analytics report with validation counts
- already-built execution-feedback summaries can be aggregated
- adding extra market-context fields to summaries does not change execution-only
  metrics
- chart data is generated by the report builder, not by UI aggregation

Future tests should add:

- saved-report snapshot tests once real samples exist
- filtering tests by symbol, direction, session, and date
- market-context section tests that prove execution-only metrics stay unchanged
- API tests for cached summary input if the app stores summaries separately

## UI Notes

The current dashboard is intentionally under:

```text
/debug/trader-analytics
```

It is useful for development and product review. A future end-user route should
reuse the same report contract but may change layout, copy, filtering, and
permissions.

Useful future dashboard additions:

- date/session filters
- symbol filters
- direction filters
- report comparison across date ranges
- saved report snapshots
- saved in-app report history
- rolling period comparisons
- in-app review notes and action-item tracking
- drill-down from a risk chart into the source trades
- later, separate market-context panels after calibration

Do not add end-user export controls to the production analytics dashboard.

## Current Recommendation

Use trader analytics v1 now for fixture batches and future saved execution
batches.

Use `src/docs/end-user-trader-analytics-product-roadmap.md` as the next
source-of-truth for turning this debug/report foundation into a production
end-user product with saved in-app history, comparisons, drill-down, focus
queue, and rule tracking.

Do not ask `levels-system` for additional analytics fields until the app has
real saved trades and can show exactly which candle-derived observations are
missing from the separate market-context section.
