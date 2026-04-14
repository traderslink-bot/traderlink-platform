// 2026-04-12 09:22 AM America/Toronto
// PURPOSE:
// Validates the assembled raw trade timeline after timeline construction.
// This file stays strictly factual and interpretation free.
// It validates structural consistency only.

import type { TradeTimeline } from "../types/trade-timeline";
import { validateCandleSequence } from "./validate-candle-sequence";
import { validateExecutionSequence } from "./validate-execution-sequence";

export interface ValidateTradeTimelineArgs {
  timeline: TradeTimeline;
}

export function validateTradeTimeline(
  args: ValidateTradeTimelineArgs,
): string[] {
  const { timeline } = args;
  const warnings: string[] = [];

  const symbol = timeline.symbol.trim().toUpperCase();
  const timeframe = timeline.timeframe.trim();

  if (!symbol) {
    throw new Error("Trade timeline symbol cannot be empty.");
  }

  if (!timeframe) {
    throw new Error("Trade timeline timeframe cannot be empty.");
  }

  if (timeline.tradeDirection !== "long" && timeline.tradeDirection !== "short") {
    throw new Error(
      `Trade timeline tradeDirection "${timeline.tradeDirection}" is invalid.`,
    );
  }

  warnings.push(
    ...validateExecutionSequence({
      executions: timeline.executions,
      expectedSymbol: symbol,
      sequenceLabel: "Trade timeline executions",
      requireAtLeastOneExecution: true,
    }),
  );

  warnings.push(
    ...validateCandleSequence({
      candles: timeline.preTradeCandles,
      expectedSymbol: symbol,
      expectedTimeframe: timeframe,
      sequenceLabel: "Trade timeline pre trade candles",
    }),
  );

  warnings.push(
    ...validateCandleSequence({
      candles: timeline.tradeCandles,
      expectedSymbol: symbol,
      expectedTimeframe: timeframe,
      sequenceLabel: "Trade timeline trade candles",
    }),
  );

  warnings.push(
    ...validateCandleSequence({
      candles: timeline.postTradeCandles,
      expectedSymbol: symbol,
      expectedTimeframe: timeframe,
      sequenceLabel: "Trade timeline post trade candles",
    }),
  );

  warnings.push(
    ...validateCandleSequence({
      candles: timeline.allCandles,
      expectedSymbol: symbol,
      expectedTimeframe: timeframe,
      sequenceLabel: "Trade timeline all candles",
    }),
  );

  if (timeline.executionContextWindows.length !== timeline.executions.length) {
    throw new Error(
      "Trade timeline executionContextWindows length must match executions length.",
    );
  }

  if (timeline.tradeStateSeries.snapshots.length !== timeline.executions.length) {
    throw new Error(
      "Trade timeline tradeStateSeries length must match executions length.",
    );
  }

  const expectedSegmentCount =
    timeline.executions.length >= 2 ? timeline.executions.length + 1 : 2;

  if (timeline.timelineSegments.length !== expectedSegmentCount) {
    throw new Error(
      `Trade timeline segment count is invalid. Expected ${expectedSegmentCount}, received ${timeline.timelineSegments.length}.`,
    );
  }

  if (timeline.timelineSegments.length > 0) {
    const firstSegment = timeline.timelineSegments[0];
    const lastSegment = timeline.timelineSegments[timeline.timelineSegments.length - 1];

    if (firstSegment.segmentType !== "pre_trade") {
      throw new Error("Trade timeline first segment must be pre_trade.");
    }

    if (lastSegment.segmentType !== "post_trade") {
      throw new Error("Trade timeline last segment must be post_trade.");
    }
  }

  timeline.executionContextWindows.forEach((window, index) => {
    const matchingExecution = timeline.executions[index];

    if (window.execution.executionIndex !== matchingExecution.executionIndex) {
      throw new Error(
        `Trade timeline executionContextWindow at index ${index} does not match execution index.`,
      );
    }
  });

  timeline.tradeStateSeries.snapshots.forEach((snapshot, index) => {
    const matchingExecution = timeline.executions[index];

    if (snapshot.executionIndex !== matchingExecution.executionIndex) {
      throw new Error(
        `Trade timeline tradeStateSnapshot at index ${index} does not match execution index.`,
      );
    }

    if (snapshot.timestamp !== matchingExecution.timestamp) {
      throw new Error(
        `Trade timeline tradeStateSnapshot at index ${index} does not match execution timestamp.`,
      );
    }

    if (snapshot.positionSize < 0) {
      throw new Error(
        `Trade timeline tradeStateSnapshot at index ${index} has negative positionSize.`,
      );
    }

    if (!snapshot.isFlat && snapshot.positionSize === 0) {
      throw new Error(
        `Trade timeline tradeStateSnapshot at index ${index} is inconsistent: isFlat is false while positionSize is zero.`,
      );
    }

    if (snapshot.isFlat && snapshot.averageEntryPrice !== null) {
      throw new Error(
        `Trade timeline tradeStateSnapshot at index ${index} is inconsistent: averageEntryPrice must be null when flat.`,
      );
    }

    if (
      snapshot.averageEntryPrice !== null &&
      (!Number.isFinite(snapshot.averageEntryPrice) || snapshot.averageEntryPrice <= 0)
    ) {
      throw new Error(
        `Trade timeline tradeStateSnapshot at index ${index} has invalid averageEntryPrice.`,
      );
    }

    if (!Number.isFinite(snapshot.realizedPnl)) {
      throw new Error(
        `Trade timeline tradeStateSnapshot at index ${index} has invalid realizedPnl.`,
      );
    }
  });

  const reconstructedAllCandles = [
    ...timeline.preTradeCandles,
    ...timeline.tradeCandles,
    ...timeline.postTradeCandles,
  ];

  if (reconstructedAllCandles.length !== timeline.allCandles.length) {
    throw new Error(
      "Trade timeline allCandles length does not match reconstructed candle count.",
    );
  }

  for (let index = 0; index < reconstructedAllCandles.length; index += 1) {
    const reconstructedCandle = reconstructedAllCandles[index];
    const actualCandle = timeline.allCandles[index];

    if (reconstructedCandle.timestamp !== actualCandle.timestamp) {
      throw new Error(
        `Trade timeline allCandles sequence mismatch at index ${index}.`,
      );
    }
  }

  return warnings;
}