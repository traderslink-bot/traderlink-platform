// 2026-04-14
// PURPOSE:
// Counts candle-level touches and touch clusters for structural levels.

import { SUPPORT_RESISTANCE_CONFIG } from "../config/support-resistance-config";
import type { Candle } from "../../raw-trade-timeline/types/candle";
import type { StructuralLevel } from "../../raw-trade-timeline/types/structural-level";

function touchesLevel(candle: Candle, levelPrice: number): boolean {
  const tolerance = levelPrice * SUPPORT_RESISTANCE_CONFIG.touchTolerancePct / 100;
  return candle.low - tolerance <= levelPrice && candle.high + tolerance >= levelPrice;
}

export function countLevelTouchClusters(
  levels: StructuralLevel[],
  candles: Candle[],
): StructuralLevel[] {
  return levels.map((level) => {
    let touchCount = 0;
    let touchClusterCount = 0;
    let previousTouched = false;
    let previousTouchTimestamp: string | null = null;

    candles.forEach((candle) => {
      const touched = touchesLevel(candle, level.price);
      if (touched) {
        touchCount += 1;
        if (
          !previousTouched ||
          previousTouchTimestamp === null ||
          Date.parse(candle.timestamp) - Date.parse(previousTouchTimestamp) > 60_000
        ) {
          touchClusterCount += 1;
        }
        previousTouchTimestamp = candle.timestamp;
      }
      previousTouched = touched;
    });

    return {
      ...level,
      touchCount,
      touchClusterCount,
    };
  });
}
