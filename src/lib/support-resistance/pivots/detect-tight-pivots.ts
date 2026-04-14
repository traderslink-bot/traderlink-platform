// 2026-04-14
// PURPOSE:
// Detects the first actionable pivot candidates for the support/resistance lane
// using the repo's "tight pivot" definition.

import { SUPPORT_RESISTANCE_CONFIG } from "../config/support-resistance-config";
import type { Candle } from "../../raw-trade-timeline/types/candle";

export interface DetectedPivot {
  candleIndex: number;
  timestamp: string;
  price: number;
  side: "support" | "resistance";
  pivotSource: "tight_pivot" | "strict_pivot";
}

function isPivotHigh(candles: Candle[], index: number, window: number): boolean {
  const candidate = candles[index];

  for (let offset = 1; offset <= window; offset += 1) {
    if (
      candidate.high <= candles[index - offset].high ||
      candidate.high <= candles[index + offset].high
    ) {
      return false;
    }
  }

  return true;
}

function isPivotLow(candles: Candle[], index: number, window: number): boolean {
  const candidate = candles[index];

  for (let offset = 1; offset <= window; offset += 1) {
    if (
      candidate.low >= candles[index - offset].low ||
      candidate.low >= candles[index + offset].low
    ) {
      return false;
    }
  }

  return true;
}

export function detectTightPivots(candles: Candle[]): DetectedPivot[] {
  const window = SUPPORT_RESISTANCE_CONFIG.tightPivotWindow;
  const pivots: DetectedPivot[] = [];

  for (let index = window; index < candles.length - window; index += 1) {
    if (isPivotHigh(candles, index, window)) {
      pivots.push({
        candleIndex: index,
        timestamp: candles[index].timestamp,
        price: candles[index].high,
        side: "resistance",
        pivotSource: "tight_pivot",
      });
    }

    if (isPivotLow(candles, index, window)) {
      pivots.push({
        candleIndex: index,
        timestamp: candles[index].timestamp,
        price: candles[index].low,
        side: "support",
        pivotSource: "tight_pivot",
      });
    }
  }

  return pivots;
}
