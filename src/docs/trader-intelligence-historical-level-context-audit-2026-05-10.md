# Trader Intelligence Historical Level Context Audit

**Date:** 2026-05-10
**Status:** Active guardrail for support/resistance market-context work

## Purpose

Trader Intelligence reviews imported trades from past sessions. The levels
system was originally built around current watchlist/chart use, so this audit
records how historical support/resistance context must work for old trades.

The product rule is simple:

> A trade from April 1 must be reviewed with levels, candles, and market context
> as they existed around April 1, not with today's chart context.

Using current support/resistance levels for old executions would create
lookahead bias and could make coaching wrong.

## Current Answer

Historical support/resistance is accounted for in the shared `levels-system`
boundary and is now tightened in Trader Intelligence's app-facing handoff.

The correct path is:

1. Trader Intelligence reconstructs the trade from broker executions.
2. Trader Intelligence passes the symbol, session date, executions,
   trade-start timestamp, trade-end timestamp, and an `asOfTimestamp` into
   `levels-system`.
3. `levels-system` fetches historical daily, 4h, and intraday candles through
   its candle warehouse/provider layer.
4. `levels-system` builds:
   - a bounded trade-window candle context,
   - execution-time support/resistance relation facts,
   - market facts for levels and indicators,
   - diagnostics when candles or levels are missing.
5. Trader Intelligence consumes those historical facts for pattern input,
   coaching, analytics, review, and trade-detail summaries.

## Where The Responsibility Lives

### `levels-system`

`levels-system` owns:

- historical candle fetching,
- durable candle warehouse replay/backfill,
- daily/4h/5m support and resistance calculation,
- execution-time level relation facts,
- candle/price-basis diagnostics,
- no-lookahead rules.

Important files:

- `../levels-system/src/lib/support-resistance/symbol-context.ts`
- `../levels-system/src/lib/support-resistance/trade-analysis-context.ts`
- `../levels-system/src/tests/support-resistance-shared-api.test.ts`

The shared engine supports:

- `asOfTimestamp`,
- `asOfTimestampByTimeframe`,
- trade-window bounds,
- per-execution support/resistance contexts,
- diagnostics such as historical as-of snapshots and trade-window truncation.

The levels-system test suite includes coverage that future candles are excluded
and that execution-time support/resistance contexts are fetched at each fill
timestamp.

### Trader Intelligence

Trader Intelligence owns:

- passing the historical trade timestamps to `levels-system`,
- choosing a bounded analysis `asOfTimestamp`,
- refusing to make chart/level claims when historical context is missing,
- mapping shared market facts into beginner-readable review language.

Important files:

- `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline-with-levels-system-candles.ts`
- `src/lib/support-resistance/levels-system-adapter.ts`
- `src/lib/pattern-input/builders/build-pattern-input.ts`
- `src/lib/trade-analysis/summary/build-trade-analysis-summary.ts`
- `src/lib/trade-analysis/review/build-trade-decision-review.ts`

The modern app-facing path derives a bounded `asOfTimestamp` from:

- an explicit provider/runtime `asOfTimestamp`, or
- trade end time plus the requested post-trade review window and padding.

That lets the app review what happened after the exit without using today's
levels for an old trade.

## 2026-05-10 Handoff Fix

The code already stored the safe shared facts as:

- `levelsSystemExecutionRelations`
- `levelsSystemMarketFacts`
- `levelsSystemTradeWindowFacts`

The weak spot was that the local `executionLevelRelations` field, which feeds
PatternInput and several summaries, was still rebuilt from the broader mapped
support/resistance snapshot.

That is now fixed.

Trader Intelligence now maps `executionLevelRelations` from the shared
`levelsSystemExecutionRelations`, so normal pattern input and coaching consume
the per-execution historical support/resistance facts supplied by
`levels-system`.

Changed files:

- `src/lib/support-resistance/levels-system-adapter.ts`
- `src/lib/support-resistance/build-support-resistance-context.ts`
- `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline-with-levels-system-candles.ts`
- `src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts`

## Legacy Path To Avoid For New App Work

`buildLevelsSystemSupportResistanceContext(...)` is still useful for older
adapter tests and comparison work. It builds one support/resistance context for
a timeline.

For imported-trade review, prefer the trade-analysis candle context path:

- `createRawTradeTimelineWithLevelsSystemCandles(...)`
- `buildDefaultTradeAnalysisCandleContext(...)`
- `buildTradeAnalysisCandleContext(...)`

Do not build new coaching claims from a single current/live level snapshot.

## Product Guardrails

- Never review an old trade with today's support/resistance levels.
- Never certify "bought near resistance," "bought near support," "sold near the
  top," "missed continuation," "added into weakness," or volume/context claims
  unless historical market context is attached.
- If candle/level context is missing, show "Chart context waiting" or a review
  prompt.
- Execution-only evidence can still support execution-sequence coaching, but it
  cannot become a chart-specific conclusion.
- Advanced diagnostics may mention provider/warehouse issues, but normal UI
  must stay trader-readable.

## Operational Notes

Historical context still depends on data availability.

For real imported trades, make sure the app has access to the levels-system
candle warehouse or on-demand historical provider settings, such as:

- `LEVELS_SYSTEM_WAREHOUSE_DIRECTORY`
- `LEVELS_SYSTEM_ON_DEMAND_HYDRATION`
- `LEVELS_SYSTEM_WAREHOUSE_MODE`
- IBKR connection settings when IBKR is the provider

If another app is using IBKR at the same time, there can be provider pacing,
connection, or client-session conflicts. That is an operational data-fetching
issue, not a reason to fall back to current levels.

## Verification

Ran on 2026-05-10:

- `npx vitest run src/lib/raw-trade-timeline/__tests__/levels-system-trade-candle-context.integration.test.ts src/lib/raw-trade-timeline/__tests__/levels-system-pattern-input.integration.test.ts --reporter=dot`
  - passed: 2 files / 6 tests
- `npx tsc --noEmit --pretty false`
  - passed
- In `../levels-system`:
  `npx tsx --test src/tests/support-resistance-shared-api.test.ts`
  - passed: 28 tests

## Next Work

Future support/resistance behavior families should start by checking this audit
and then proving:

1. the claim uses historical execution-time level facts,
2. the saved trade has enough candle/level evidence,
3. the UI language stays beginner-readable,
4. the route tests prevent current/live context from leaking into old trade
   reviews.
