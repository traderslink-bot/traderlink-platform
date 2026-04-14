// 2026-04-14
// PURPOSE:
// Detects the nearest simple candle-to-candle price gaps around the final
// execution price.

import type { Candle } from "../../raw-trade-timeline/types/candle";
import type { GapStructure } from "../../raw-trade-timeline/types/gap-structure";

function wasGapFilled(
  candles: Candle[],
  startIndex: number,
  lowerBound: number,
  upperBound: number,
): boolean {
  return candles.slice(startIndex + 1).some((candle) => candle.low <= upperBound && candle.high >= lowerBound);
}

export function buildGapStructure(
  candles: Candle[],
  referencePrice: number,
): GapStructure {
  let gapAbove: GapStructure["gapAbove"] = null;
  let gapBelow: GapStructure["gapBelow"] = null;

  for (let index = 1; index < candles.length; index += 1) {
    const previous = candles[index - 1];
    const current = candles[index];

    if (current.low > previous.high) {
      const lowerBound = previous.high;
      const upperBound = current.low;
      if (lowerBound >= referencePrice && gapAbove === null) {
        gapAbove = {
          start: lowerBound,
          end: upperBound,
          direction: "up",
          filled: wasGapFilled(candles, index, lowerBound, upperBound),
        };
      }
    }

    if (current.high < previous.low) {
      const lowerBound = current.high;
      const upperBound = previous.low;
      if (upperBound <= referencePrice && gapBelow === null) {
        gapBelow = {
          start: lowerBound,
          end: upperBound,
          direction: "down",
          filled: wasGapFilled(candles, index, lowerBound, upperBound),
        };
      }
    }
  }

  return {
    gapAbove,
    gapBelow,
  };
}
