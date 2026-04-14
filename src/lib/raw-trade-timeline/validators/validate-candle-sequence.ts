// 2026-04-12 09:22 AM America/Toronto
// PURPOSE:
// Validates a candle sequence used by the raw trade timeline system.
// This file stays strictly factual and interpretation free.
// It validates structure and sequence only. It does not assign meaning.

import type { Candle } from "../types/candle";

export interface ValidateCandleSequenceArgs {
  candles: Candle[];
  expectedSymbol?: string;
  expectedTimeframe?: string;
  sequenceLabel: string;
}

export function validateCandleSequence(
  args: ValidateCandleSequenceArgs,
): string[] {
  const { candles, expectedSymbol, expectedTimeframe, sequenceLabel } = args;
  const warnings: string[] = [];

  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index];
    const parsedTimestamp = Date.parse(candle.timestamp);

    if (!candle.symbol.trim()) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: symbol is empty.`,
      );
    }

    if (!candle.timeframe.trim()) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: timeframe is empty.`,
      );
    }

    if (Number.isNaN(parsedTimestamp)) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: timestamp "${candle.timestamp}" is invalid.`,
      );
    }

    if (!Number.isFinite(candle.open)) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: open is not finite.`,
      );
    }

    if (!Number.isFinite(candle.high)) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: high is not finite.`,
      );
    }

    if (!Number.isFinite(candle.low)) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: low is not finite.`,
      );
    }

    if (!Number.isFinite(candle.close)) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: close is not finite.`,
      );
    }

    if (!Number.isFinite(candle.volume)) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: volume is not finite.`,
      );
    }

    if (candle.high < candle.low) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: high is below low.`,
      );
    }

    if (candle.open < candle.low || candle.open > candle.high) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: open is outside the candle range.`,
      );
    }

    if (candle.close < candle.low || candle.close > candle.high) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: close is outside the candle range.`,
      );
    }

    if (candle.volume < 0) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: volume cannot be negative.`,
      );
    }

    if (expectedSymbol && candle.symbol !== expectedSymbol) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: symbol "${candle.symbol}" does not match expected symbol "${expectedSymbol}".`,
      );
    }

    if (expectedTimeframe && candle.timeframe !== expectedTimeframe) {
      throw new Error(
        `Invalid ${sequenceLabel} candle at index ${index}: timeframe "${candle.timeframe}" does not match expected timeframe "${expectedTimeframe}".`,
      );
    }

    if (index > 0) {
      const previousCandle = candles[index - 1];
      const previousTimestamp = Date.parse(previousCandle.timestamp);

      if (parsedTimestamp < previousTimestamp) {
        throw new Error(
          `Invalid ${sequenceLabel} candle sequence: candles are not sorted in ascending timestamp order at index ${index}.`,
        );
      }

      if (parsedTimestamp === previousTimestamp) {
        throw new Error(
          `Invalid ${sequenceLabel} candle sequence: duplicate timestamp "${candle.timestamp}" found at index ${index}.`,
        );
      }
    }
  }

  if (candles.length === 0) {
    warnings.push(`${sequenceLabel} candle sequence is empty.`);
  }

  return warnings;
}