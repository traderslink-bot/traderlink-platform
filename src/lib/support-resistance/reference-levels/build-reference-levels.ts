// 2026-04-14
// PURPOSE:
// Builds the first factual named reference levels for the support/resistance
// lane from available normalized candles.

import type { Candle } from "../../raw-trade-timeline/types/candle";
import type { ReferenceLevels } from "../../raw-trade-timeline/types/reference-levels";
import type { SessionContext } from "../../raw-trade-timeline/types/session-context";

export interface BuildReferenceLevelsArgs {
  allCandles: Candle[];
  sessionContext: SessionContext;
}

function getSessionDatePart(timestamp: string): string {
  return timestamp.slice(0, 10);
}

function getMaxHigh(candles: Candle[]): number | null {
  return candles.length > 0 ? Math.max(...candles.map((candle) => candle.high)) : null;
}

function getMinLow(candles: Candle[]): number | null {
  return candles.length > 0 ? Math.min(...candles.map((candle) => candle.low)) : null;
}

function getLastClose(candles: Candle[]): number | null {
  return candles.length > 0 ? candles[candles.length - 1].close : null;
}

function getPremarketBase(candles: Candle[]): number | null {
  if (candles.length < 2) {
    return null;
  }

  const totalClose = candles.reduce((sum, candle) => sum + candle.close, 0);
  return Number((totalClose / candles.length).toFixed(6));
}

export function buildReferenceLevels(
  args: BuildReferenceLevelsArgs,
): ReferenceLevels {
  const { allCandles, sessionContext } = args;

  const previousDayCandles = allCandles.filter((candle) => {
    return getSessionDatePart(candle.timestamp) < sessionContext.sessionDate;
  });

  const premarketCandles = allCandles.filter(
    (candle) => candle.sessionBucket === "pre_market",
  );

  return {
    previousDayHigh: getMaxHigh(previousDayCandles),
    previousDayLow: getMinLow(previousDayCandles),
    previousDayClose: getLastClose(previousDayCandles),
    premarketHigh: getMaxHigh(premarketCandles),
    premarketLow: getMinLow(premarketCandles),
    premarketBase: getPremarketBase(premarketCandles),
  };
}
