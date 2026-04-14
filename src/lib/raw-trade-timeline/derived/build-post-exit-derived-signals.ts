// =========================
// 2026-04-12 07:15 PM America/Toronto
// POST-EXIT DERIVED SIGNALS
// file name: build-post-exit-derived-signals.ts
// =========================
//
// PURPOSE:
// Computes factual price behavior AFTER the final exit.
//
// This is a pure Layer 1 derived signal builder.
// It extracts what happened after the trader was out of the position.
//
// NO interpretation
// NO scoring
// NO pattern labeling
//
// OUTPUT:
// - max favorable move after exit
// - max adverse move after exit
// - % versions
// - candles to best/worst points
// - timestamps of best/worst points
//
// =========================

import type { RawTradeTimelineBuildResult } from "../types/raw-trade-timeline-build-result";
import type { Candle } from "../types/candle";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

export interface PostExitDerivedSignals {
  exitPrice: number;
  exitTimestamp: string;
  postExitCandleCount: number;

  maxFavorablePriceAfterExit: number | null;
  maxAdversePriceAfterExit: number | null;

  maxFavorableMoveAfterExit: number | null;
  maxAdverseMoveAfterExit: number | null;

  maxFavorableMovePctAfterExit: number | null;
  maxAdverseMovePctAfterExit: number | null;

  candlesToMaxFavorableAfterExit: number | null;
  candlesToMaxAdverseAfterExit: number | null;

  timestampOfMaxFavorableAfterExit: string | null;
  timestampOfMaxAdverseAfterExit: string | null;

  closePriceAtEndOfPostExitWindow: number | null;
  netMoveAtEndOfPostExitWindow: number | null;
  netMovePctAtEndOfPostExitWindow: number | null;
}

function getMaxHigh(candles: Candle[]): { price: number; index: number } | null {
  if (candles.length === 0) return null;

  let max = candles[0].high;
  let index = 0;

  for (let i = 1; i < candles.length; i++) {
    if (candles[i].high > max) {
      max = candles[i].high;
      index = i;
    }
  }

  return { price: max, index };
}

function getMinLow(candles: Candle[]): { price: number; index: number } | null {
  if (candles.length === 0) return null;

  let min = candles[0].low;
  let index = 0;

  for (let i = 1; i < candles.length; i++) {
    if (candles[i].low < min) {
      min = candles[i].low;
      index = i;
    }
  }

  return { price: min, index };
}

export function buildPostExitDerivedSignals(
  result: RawTradeTimelineBuildResult,
): PostExitDerivedSignals {
  const { timeline } = result;

  const executions = timeline.executions;
  const postTradeCandles = timeline.postTradeCandles;

  if (executions.length === 0) {
    throw new Error("Cannot compute post-exit signals without executions.");
  }

  const lastExecution = executions[executions.length - 1];

  const exitPrice = lastExecution.price;
  const exitTimestamp = lastExecution.timestamp;

  if (!postTradeCandles || postTradeCandles.length === 0) {
    return {
      exitPrice,
      exitTimestamp,
      postExitCandleCount: 0,
      maxFavorablePriceAfterExit: null,
      maxAdversePriceAfterExit: null,
      maxFavorableMoveAfterExit: null,
      maxAdverseMoveAfterExit: null,
      maxFavorableMovePctAfterExit: null,
      maxAdverseMovePctAfterExit: null,
      candlesToMaxFavorableAfterExit: null,
      candlesToMaxAdverseAfterExit: null,
      timestampOfMaxFavorableAfterExit: null,
      timestampOfMaxAdverseAfterExit: null,
      closePriceAtEndOfPostExitWindow: null,
      netMoveAtEndOfPostExitWindow: null,
      netMovePctAtEndOfPostExitWindow: null,
    };
  }

  const maxHigh = getMaxHigh(postTradeCandles);
  const minLow = getMinLow(postTradeCandles);

  const maxFavorablePriceAfterExit = maxHigh?.price ?? null;
  const maxAdversePriceAfterExit = minLow?.price ?? null;

  let maxFavorableMoveAfterExit: number | null = null;
  let maxAdverseMoveAfterExit: number | null = null;

  let maxFavorableMovePctAfterExit: number | null = null;
  let maxAdverseMovePctAfterExit: number | null = null;

  if (maxFavorablePriceAfterExit !== null) {
    maxFavorableMoveAfterExit = round(
      Math.abs(maxFavorablePriceAfterExit - exitPrice),
    );
    maxFavorableMovePctAfterExit = round(
      maxFavorableMoveAfterExit / exitPrice,
    );
  }

  if (maxAdversePriceAfterExit !== null) {
    maxAdverseMoveAfterExit = round(
      Math.abs(maxAdversePriceAfterExit - exitPrice),
    );
    maxAdverseMovePctAfterExit = round(
      maxAdverseMoveAfterExit / exitPrice,
    );
  }

  const finalPostExitCandle = postTradeCandles[postTradeCandles.length - 1];
  const closePriceAtEndOfPostExitWindow = finalPostExitCandle.close;
  const netMoveAtEndOfPostExitWindow = round(
    closePriceAtEndOfPostExitWindow - exitPrice,
  );
  const netMovePctAtEndOfPostExitWindow =
    exitPrice > 0
      ? round(netMoveAtEndOfPostExitWindow / exitPrice)
      : null;

  return {
    exitPrice,
    exitTimestamp,
    postExitCandleCount: postTradeCandles.length,

    maxFavorablePriceAfterExit,
    maxAdversePriceAfterExit,

    maxFavorableMoveAfterExit,
    maxAdverseMoveAfterExit,

    maxFavorableMovePctAfterExit,
    maxAdverseMovePctAfterExit,

    candlesToMaxFavorableAfterExit:
      maxHigh !== null ? maxHigh.index + 1 : null,

    candlesToMaxAdverseAfterExit:
      minLow !== null ? minLow.index + 1 : null,

    timestampOfMaxFavorableAfterExit:
      maxHigh !== null
        ? postTradeCandles[maxHigh.index].timestamp
        : null,

    timestampOfMaxAdverseAfterExit:
      minLow !== null
        ? postTradeCandles[minLow.index].timestamp
        : null,
    closePriceAtEndOfPostExitWindow,
    netMoveAtEndOfPostExitWindow,
    netMovePctAtEndOfPostExitWindow,
  };
}
