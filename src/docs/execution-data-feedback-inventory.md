# Execution Data Feedback Inventory

## Purpose

This inventory supports `src/docs/execution-data-feedback-plan.md`.

It documents what this app can already derive from order/execution data, what
requires candle or shared market context, and the safest boundary for the new
execution-only feedback lane.

## Boundary Decision

Use a dedicated execution-only fact builder for Phase 2.

The new execution-feedback lane should reuse:

- the existing public request validation in
  `src/lib/trade-analysis/request/trade-analysis-request-contract.ts`
- normalized execution shape from
  `src/lib/raw-trade-timeline/types/execution.ts`
- execution normalization from
  `src/lib/raw-trade-timeline/normalizers/normalize-execution.ts`
- deterministic position state math from
  `src/lib/raw-trade-timeline/state/build-trade-state-series.ts`

It should not require:

- candle arrays
- support/resistance levels
- VWAP/EMA
- market structure
- `levels-system`

Rationale:

- The full raw timeline path accepts empty candle arrays, but many downstream
  derived builders and PatternInput fields become mixed or candle-empty
  defaults. That is useful for the chart-aware pipeline, but not ideal as a
  public execution-only contract.
- A smaller fact builder can be truthful by construction: if a field needs
  candles, it simply does not belong in the execution-only summary.
- The existing Layer 2/Layer 3 pattern system remains available for full
  analysis. The new lane can later bridge into that system after
  `execution_feedback_summary_v1` is stable.

## Files Inspected

Execution intake and validation:

- `src/lib/trade-analysis/request/trade-analysis-request-contract.ts`
- `src/lib/raw-trade-timeline/types/execution.ts`
- `src/lib/raw-trade-timeline/normalizers/normalize-execution.ts`
- `src/lib/raw-trade-timeline/types/trade-timeline-input.ts`

Raw timeline and execution state:

- `src/lib/raw-trade-timeline/builders/build-trade-timeline.ts`
- `src/lib/raw-trade-timeline/builders/create-raw-trade-timeline.ts`
- `src/lib/raw-trade-timeline/state/build-trade-state-series.ts`
- `src/lib/raw-trade-timeline/types/trade-state-series.ts`
- `src/lib/raw-trade-timeline/types/trade-state-snapshot.ts`
- `src/lib/raw-trade-timeline/types/raw-trade-timeline-build-result.ts`
- `src/lib/raw-trade-timeline/validators/validate-trade-timeline-input.ts`
- `src/lib/raw-trade-timeline/validators/validate-trade-timeline.ts`

Derived signal builders:

- `src/lib/raw-trade-timeline/derived/build-position-change-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-timeline-relationship-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-trade-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-execution-derived-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-between-execution-price-behavior-signals.ts`
- `src/lib/raw-trade-timeline/derived/build-reduction-readd-sequence-signals.ts`

Pattern and feedback layers:

- `src/lib/pattern-input/types/pattern-input.ts`
- `src/lib/pattern-input/builders/build-pattern-input.ts`
- `src/lib/pattern-detection/detect-patterns.ts`
- `src/lib/pattern-detection/registry/pattern-definitions.ts`
- `src/lib/pattern-detection/patterns/execution-frequency-patterns.ts`
- `src/lib/pattern-detection/patterns/position-building-patterns.ts`
- `src/lib/pattern-detection/patterns/position-reduction-patterns.ts`
- `src/lib/pattern-detection/patterns/position-structure-patterns.ts`
- `src/lib/pattern-detection/patterns/trade-closure-patterns.ts`
- `src/lib/pattern-detection/patterns/trade-duration-patterns.ts`
- `src/lib/pattern-detection/patterns/trade-excursion-patterns.ts`
- `src/lib/pattern-detection/patterns/entry-context-patterns.ts`
- `src/lib/pattern-detection/patterns/entry-quality-patterns.ts`
- `src/lib/pattern-detection/patterns/exit-quality-patterns.ts`
- `src/lib/behavior-analysis/builders/build-behavior-analysis.ts`
- `src/lib/coaching/builders/build-trade-feedback-from-scoring.ts`

## Existing Execution Input Shape

Canonical normalized execution:

```ts
interface Execution {
  symbol: string;
  timestamp: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
  executionIndex: number;
  orderId?: string;
  brokerExecutionId?: string;
  notes?: string;
  source?: string;
}
```

The validator accepts provider executions through the user trade-analysis
request contract:

```ts
interface UserTradeAnalysisRequest {
  symbol: string;
  tradeDirection: "long" | "short" | string;
  executions: ProviderExecution[];
  sessionContext: SessionContextInput;
  provider?: TradeAnalysisProviderRequestOptions;
  tradeWindow?: TradeAnalysisCandleWindowOptions;
  executionWindowCandlesBeforeCount?: number;
  executionWindowCandlesAfterCount?: number;
}
```

Execution-only feedback should use only:

- `symbol`
- `tradeDirection`
- `executions`
- `sessionContext`

It should preserve but not require:

- `orderId`
- `brokerExecutionId`
- `source`
- `notes`

## Timestamp And Ordering Rules

The existing validator and normalizer convert timestamps to UTC ISO strings.

Supported inputs:

- string parseable by `Date.parse`
- number epoch-like timestamp
- `Date`

Execution ordering:

- normalized executions are sorted by timestamp
- ties are sorted by execution index
- execution indexes are rewritten to sequential zero-based values
- a warning is emitted if request order will be normalized

Execution-only feedback should use the same ordering behavior and include
request validation warnings in its debug/batch output.

## Existing Execution-Only Facts

The app already computes these facts from executions and trade direction only:

Position lifecycle:

- position size after each execution
- average entry after each execution
- realized gross P/L after each execution
- flat/not-flat state after each execution
- opened from flat
- closed to flat
- final position size
- max position size

Execution structure:

- execution count
- first execution timestamp
- last execution timestamp
- trade duration
- average/min/max time between executions
- executions per minute
- side and shares per execution
- buy/sell direction relative to long/short trade direction

Position-change structure:

- previous/current position size
- position size delta
- position increased/decreased/unchanged
- increase count
- decrease count
- unchanged count
- add count after initial entry
- reduction count
- re-add after reduction count
- reductions above/below previous average entry
- adds above/below previous average entry
- average add price versus previous average entry
- average reduction price versus previous average entry

Execution-only gross P/L:

- realized P/L is gross, based only on execution price, share quantity, and
  trade direction
- commissions, borrow fees, slippage, routing fees, and account-level fees are
  not included

## Candle-Required Facts

These facts require candles and must not appear as execution-only claims:

- MFE/MAE from high/low candles
- peak/worst price during trade
- execution MFE/MAE after each fill
- post-exit favorable/adverse follow-through
- partial-exit follow-through before next execution
- first entry location in the eventual trade candle range
- exit location in the eventual trade candle range
- opening-range context
- recent run-up/drop before entry/add/reduction
- candle counts between executions as market bars
- support/resistance proximity
- VWAP/EMA relationship
- gap structure
- market structure
- setup quality
- breakout/reclaim/pullback labels

## PatternInput Field Classification

Execution-only safe:

- `symbol`
- `tradeDirection`
- `sessionBucket`
- `tradeStructure.executionCount`
- `tradeStructure.executionTimestamps`
- `tradeStructure.firstExecutionTimestamp`
- `tradeStructure.lastExecutionTimestamp`
- `tradeStructure.tradeDurationSeconds`
- `tradeStructure.tradeDurationMinutes`
- `tradeStructure.totalPositionIncreaseCount`
- `tradeStructure.totalPositionDecreaseCount`
- `tradeStructure.totalPositionUnchangedCount`
- `tradeStructure.openedFromFlat`
- `tradeStructure.closedToFlat`
- `tradeStructure.hadMultipleIncreases`
- `tradeStructure.hadMultipleDecreases`
- `tradeStructure.maxPositionSize`
- `tradeStructure.finalPositionSize`
- `tradeStructure.entryPrice`
- `tradeStructure.exitPrice`
- `exitContext.partialExitCount`
- `exitContext.hadPartialExit`
- `exitContext.reductionAbovePreviousAverageEntryCount`
- `exitContext.reductionBelowPreviousAverageEntryCount`
- `exitContext.averageReductionPriceVsPreviousAverageEntryPct`
- `scalingContext.readdAfterReductionCount`
- `scalingContext.hadReaddAfterReduction`
- `scalingContext.averageReaddPriceChangeFromPriorReductionPct`
- `scalingContext.addCountAfterInitialEntry`
- `scalingContext.addAbovePreviousAverageEntryCount`
- `scalingContext.addBelowPreviousAverageEntryCount`
- `scalingContext.averageAddPriceVsPreviousAverageEntryPct`
- `timingContext.averageTimeBetweenExecutionsSeconds`
- `timingContext.minTimeBetweenExecutionsSeconds`
- `timingContext.maxTimeBetweenExecutionsSeconds`
- `timingContext.executionsPerMinute`

Mixed or candle-dependent:

- `tradeStructure.tradeCandleCount`
- `tradeStructure.tradeMfe`
- `tradeStructure.tradeMae`
- `tradeStructure.tradeMfePct`
- `tradeStructure.tradeMaePct`
- `tradeStructure.peakPriceDuringTrade`
- `tradeStructure.worstPriceDuringTrade`
- `tradeStructure.maxExecutionMfePct`
- `tradeStructure.maxExecutionMaePct`
- `tradeStructure.averageExecutionMfePct`
- `tradeStructure.averageExecutionMaePct`
- all `entryContext` fields except raw first entry price references
- most `exitContext` fields involving realized capture, trade range, post-exit
  candles, recent range, recent run-up, or recent drop
- most `scalingContext` fields involving post-readd follow-through, recent
  run-up, recent drop, or recent range
- `timingContext.averageCandlesBetweenExecutions`
- all `supportResistanceContext` fields
- all `recoveryContext` fields

## Existing Pattern Classification

Execution-only safe pattern IDs:

- `high_frequency_execution`
- `low_frequency_execution`
- `scaled_into_position`
- `single_build_position`
- `scaled_out_of_position`
- `aggressive_scale_in`
- `passive_scale_in`
- `single_build_full_exit`
- `multi_build_full_exit`
- `multi_build_partial_exit`
- `scale_in_then_reduce`
- `one_and_done_round_trip`
- `quick_trade`
- `extended_trade`
- `fully_closed_trade`
- `partial_position_left`

Mostly execution-only but should be revalidated before reuse:

- `reduction_into_strength`
- `reduction_into_weakness`

Reason: these currently require reduction price versus previous average entry,
which is execution-only, but their names imply market strength/weakness. The new
execution lane should use more neutral wording such as profitable reduction or
adverse reduction unless candle context confirms market location.

Candle-required or mixed pattern families:

- `trade_excursion`
- `entry_context`
- `entry_quality`
- `exit_quality`
- most of `position_reduction` beyond the basic scale-out fact
- most of `scaling_quality`
- support/resistance overlays
- recovery/giveback overlays
- repeated-cycle outcome overlays

Reason: these use candle range, MFE/MAE, support/resistance, recent run-up/drop,
post-exit follow-through, or recovery context.

## Downstream Consumers

Current full trade analysis flow:

1. `runTradeAnalysis(...)`
2. `analyzeTradeWithLevelsSystemCandles(...)`
3. `createRawTradeTimelineWithLevelsSystemCandles(...)`
4. `buildPatternInput(...)`
5. `detectPatterns(...)`
6. `normalizeDetectedPatterns(...)`
7. `buildTradeAnalysisSummary(...)`

Current behavior/coaching flow:

1. normalized patterns become scoring input
2. scoring result becomes behavior analysis
3. behavior analysis becomes coaching output

Execution-only feedback can eventually feed those layers, but Phase 2-4 should
not modify them. The first stable output should be its own summary contract.

## Implementation Recommendation

Phase 2 should create:

```text
src/lib/execution-feedback/build-execution-feedback-facts.ts
src/lib/execution-feedback/types/execution-feedback-facts.ts
```

Inputs:

- validated request from the current trade-analysis request contract, or
- direct normalized execution facts for focused unit tests

Outputs:

- lifecycle facts
- sizing facts
- sequencing facts
- execution-price facts
- risk facts
- warnings/limitations

The builder should call:

- `normalizeExecutions(...)`
- `buildTradeStateSeries(...)`
- `buildPositionChangeDerivedSignals(...)` where useful
- `buildTimelineRelationshipSignals(...)` with an empty candle array only for
  time gap fields, not candle-gap claims

The builder should not call:

- `createRawTradeTimeline(...)`
- `buildPatternInput(...)`
- `detectPatterns(...)`
- any support/resistance adapter
- any shared `levels-system` API

## Phase 2 Contract Notes

Use neutral naming for adverse price behavior:

- for long trades, adding below previous average entry is adverse-price size
  expansion
- for short trades, adding above previous average entry is adverse-price size
  expansion

Use gross P/L labels:

- `grossRealizedPnl`
- `grossAverageExitPrice`
- `commissionsAndFeesIncluded: false`

Preserve IDs in evidence:

- `executionIndex`
- `timestamp`
- `side`
- `shares`
- `price`
- `orderId`
- `brokerExecutionId`
- `source`

## No levels-system Blocker

No update is needed in the shared handoff doc right now.

The execution-feedback lane belongs in this repo and does not need new shared
engine exports.
