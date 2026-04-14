// 2026-04-14
// PURPOSE:
// Builds the first factual dynamic levels for the support/resistance lane from
// available normalized candles.

import { SUPPORT_RESISTANCE_CONFIG } from "../config/support-resistance-config";
import type { Candle } from "../../raw-trade-timeline/types/candle";
import type { DynamicLevels } from "../../raw-trade-timeline/types/dynamic-levels";

export interface BuildDynamicLevelsArgs {
  candles: Candle[];
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

function calculateEma(candles: Candle[], length: number): number | null {
  if (candles.length === 0) {
    return null;
  }

  const multiplier = 2 / (length + 1);
  let ema = candles[0].close;

  for (let index = 1; index < candles.length; index += 1) {
    ema = candles[index].close * multiplier + ema * (1 - multiplier);
  }

  return round(ema);
}

function calculateAvailableVwap(candles: Candle[]): number | null {
  const candlesWithVolume = candles.filter((candle) => candle.volume > 0);

  if (candlesWithVolume.length === 0) {
    return null;
  }

  const { numerator, denominator } = candlesWithVolume.reduce(
    (accumulator, candle) => {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;

      return {
        numerator: accumulator.numerator + typicalPrice * candle.volume,
        denominator: accumulator.denominator + candle.volume,
      };
    },
    { numerator: 0, denominator: 0 },
  );

  if (denominator <= 0) {
    return null;
  }

  return round(numerator / denominator);
}

export function buildDynamicLevels(
  args: BuildDynamicLevelsArgs,
): DynamicLevels {
  const { candles } = args;

  return {
    vwap: calculateAvailableVwap(candles),
    ema9: calculateEma(candles, SUPPORT_RESISTANCE_CONFIG.ema9Length),
    ema20: calculateEma(candles, SUPPORT_RESISTANCE_CONFIG.ema20Length),
  };
}
