# Trader Analytics Market-Context Add-On Plan

## Purpose

This document defines the later market-context add-on for trader analytics.

It must remain separate from execution-only analytics until real saved trades
prove the candle-derived reads are useful.

## Boundary

Execution-only sections must remain reproducible without candles:

- sample size
- gross P/L
- lifecycle
- execution behavior
- strengths
- top risks
- top strengths
- primary focus
- trade rows
- execution-only charts
- rule evaluations based on execution facts

Market context may be added beside those sections. It must not rewrite them.

## Future Section Shape

Possible future contract:

```ts
interface TraderAnalyticsMarketContextSection {
  dataSource: "trade_analysis_summaries";
  calibrationStatus: "debug_only" | "review" | "ready";
  supportResistanceInteractions: unknown;
  dynamicLevelInteractions: unknown;
  marketStructureObservations: unknown;
  usedForExecutionMetrics: false;
}
```

## Allowed Future Claims

After calibration, the app may show:

- support/resistance was available or unavailable
- a level interaction was observed near an execution
- VWAP/EMA context was available
- experimental market structure was present or missing
- market-context quality gates passed, reviewed, or blocked promotion

## Not Allowed Without Calibration

Do not claim:

- the trader ignored support
- the setup was bad
- market structure confirms a trade mistake
- candle context changes execution-only scoring
- chart context proves a trader identity

## Verification Required

Before any market-context add-on becomes production-facing:

- run real saved-trade calibration
- prove PatternInput isolation
- prove execution-only metrics are unchanged
- prove low-confidence market structure remains observational
- update the `levels-system` handoff file only if this app finds a real shared
  engine blocker

## Current Status

No `levels-system` blocker was found while building the production analytics
fixture path.

The add-on remains future work.
