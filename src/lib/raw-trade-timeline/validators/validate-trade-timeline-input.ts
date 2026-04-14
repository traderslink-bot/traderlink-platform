// 2026-04-12 09:22 AM America/Toronto
// PURPOSE:
// Validates the raw trade timeline input before timeline assembly.
// This file stays strictly factual and interpretation free.
// It validates input structure, ordering, and consistency only.

import type { TradeTimelineInput } from "../types/trade-timeline-input";
import { validateCandleSequence } from "./validate-candle-sequence";
import { validateExecutionSequence } from "./validate-execution-sequence";

export interface ValidateTradeTimelineInputArgs {
  input: TradeTimelineInput;
}

export function validateTradeTimelineInput(
  args: ValidateTradeTimelineInputArgs,
): string[] {
  const { input } = args;
  const warnings: string[] = [];

  const symbol = input.symbol.trim().toUpperCase();
  const timeframe = input.timeframe.trim();
  const sessionBucket = input.sessionContext.sessionBucket.trim();
  const sessionDate = input.sessionContext.sessionDate.trim();

  if (!symbol) {
    throw new Error("Trade timeline input symbol cannot be empty.");
  }

  if (!timeframe) {
    throw new Error("Trade timeline input timeframe cannot be empty.");
  }

  if (input.tradeDirection !== "long" && input.tradeDirection !== "short") {
    throw new Error(
      `Trade timeline input tradeDirection "${input.tradeDirection}" is invalid.`,
    );
  }

  if (!sessionBucket) {
    throw new Error("Trade timeline input session bucket cannot be empty.");
  }

  if (!sessionDate) {
    throw new Error("Trade timeline input session date cannot be empty.");
  }

  warnings.push(
    ...validateExecutionSequence({
      executions: input.executions,
      expectedSymbol: symbol,
      sequenceLabel: "Trade timeline executions",
      requireAtLeastOneExecution: true,
    }),
  );

  warnings.push(
    ...validateCandleSequence({
      candles: input.preTradeCandles,
      expectedSymbol: symbol,
      expectedTimeframe: timeframe,
      sequenceLabel: "Pre trade candles",
    }),
  );

  warnings.push(
    ...validateCandleSequence({
      candles: input.tradeCandles,
      expectedSymbol: symbol,
      expectedTimeframe: timeframe,
      sequenceLabel: "Trade candles",
    }),
  );

  warnings.push(
    ...validateCandleSequence({
      candles: input.postTradeCandles,
      expectedSymbol: symbol,
      expectedTimeframe: timeframe,
      sequenceLabel: "Post trade candles",
    }),
  );

  const firstExecutionTime = Date.parse(input.executions[0].timestamp);
  const lastExecutionTime = Date.parse(
    input.executions[input.executions.length - 1].timestamp,
  );

  const latestPreTradeCandle =
    input.preTradeCandles.length > 0
      ? input.preTradeCandles[input.preTradeCandles.length - 1]
      : null;

  const earliestPostTradeCandle =
    input.postTradeCandles.length > 0 ? input.postTradeCandles[0] : null;

  if (latestPreTradeCandle) {
    const latestPreTradeTime = Date.parse(latestPreTradeCandle.timestamp);

    if (latestPreTradeTime >= firstExecutionTime) {
      throw new Error(
        "Invalid trade timeline input: preTradeCandles must occur strictly before the first execution.",
      );
    }
  }

  if (earliestPostTradeCandle) {
    const earliestPostTradeTime = Date.parse(earliestPostTradeCandle.timestamp);

    if (earliestPostTradeTime <= lastExecutionTime) {
      throw new Error(
        "Invalid trade timeline input: postTradeCandles must occur strictly after the final execution.",
      );
    }
  }

  for (let index = 0; index < input.tradeCandles.length; index += 1) {
    const candle = input.tradeCandles[index];
    const candleTime = Date.parse(candle.timestamp);

    if (candleTime < firstExecutionTime || candleTime > lastExecutionTime) {
      warnings.push(
        `Trade candle at index ${index} falls outside the first to last execution window.`,
      );
    }
  }

  return warnings;
}