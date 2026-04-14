// 2026-04-13 12:15 AM America/Toronto
// PURPOSE:
// Builds factual market-context signals for the first entry of the trade.
// This file stays strictly factual and interpretation free.
// It captures what the chart looked like leading into the initial entry.

import type { Candle } from "../types/candle";
import type { RawTradeTimelineBuildResult } from "../types/raw-trade-timeline-build-result";
import type { SessionBucket } from "../types/session-context";
import type { TradeDirection } from "../types/trade-timeline-input";
import { isMarketOpenSessionBucket } from "../session/normalize-session-bucket";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function getMaxHigh(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  return Math.max(...candles.map((candle) => candle.high));
}

function getMinLow(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  return Math.min(...candles.map((candle) => candle.low));
}

function getAverageRange(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  const totalRange = candles.reduce((sum, candle) => {
    return sum + (candle.high - candle.low);
  }, 0);

  return round(totalRange / candles.length);
}

function countBullishCandles(candles: Candle[]): number {
  return candles.filter((candle) => candle.close > candle.open).length;
}

function countBearishCandles(candles: Candle[]): number {
  return candles.filter((candle) => candle.close < candle.open).length;
}

function calculatePricePositionInRangePct(args: {
  price: number;
  localHigh: number | null;
  localLow: number | null;
  tradeDirection: TradeDirection;
}): number | null {
  const { price, localHigh, localLow, tradeDirection } = args;

  if (localHigh === null || localLow === null) {
    return null;
  }

  const range = localHigh - localLow;

  if (range <= 0) {
    return null;
  }

  if (tradeDirection === "long") {
    return round((price - localLow) / range);
  }

  return round((localHigh - price) / range);
}

function calculateDistanceFromFavorableExtremePct(args: {
  price: number;
  localHigh: number | null;
  localLow: number | null;
  tradeDirection: TradeDirection;
}): number | null {
  const { price, localHigh, localLow, tradeDirection } = args;

  if (tradeDirection === "long") {
    if (localLow === null || price <= 0) {
      return null;
    }

    return round((price - localLow) / price);
  }

  if (localHigh === null || localHigh <= 0) {
    return null;
  }

  return round((localHigh - price) / localHigh);
}

function calculateDistanceFromUnfavorableExtremePct(args: {
  price: number;
  localHigh: number | null;
  localLow: number | null;
  tradeDirection: TradeDirection;
}): number | null {
  const { price, localHigh, localLow, tradeDirection } = args;

  if (tradeDirection === "long") {
    if (localHigh === null || localHigh <= 0) {
      return null;
    }

    return round((localHigh - price) / localHigh);
  }

  if (localLow === null || price <= 0) {
    return null;
  }

  return round((price - localLow) / price);
}

function getRecentRunUpPct(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  const firstOpen = candles[0].open;
  const highestHigh = getMaxHigh(candles);

  if (highestHigh === null || firstOpen <= 0) {
    return null;
  }

  return round((highestHigh - firstOpen) / firstOpen);
}

function getRecentDropPct(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  const firstOpen = candles[0].open;
  const lowestLow = getMinLow(candles);

  if (lowestLow === null || firstOpen <= 0) {
    return null;
  }

  return round((firstOpen - lowestLow) / firstOpen);
}

function getRecentNetMovePct(candles: Candle[]): number | null {
  if (candles.length === 0) {
    return null;
  }

  const firstOpen = candles[0].open;
  const lastClose = candles[candles.length - 1].close;

  if (firstOpen <= 0) {
    return null;
  }

  return round((lastClose - firstOpen) / firstOpen);
}

function closesOnFavorableSideOfReference(args: {
  candle: Candle;
  referenceLevel: number;
  tradeDirection: TradeDirection;
}): boolean {
  const { candle, referenceLevel, tradeDirection } = args;

  return tradeDirection === "long"
    ? candle.close > referenceLevel
    : candle.close < referenceLevel;
}

function getRecentReferenceReclaimSignals(args: {
  candles: Candle[];
  tradeDirection: TradeDirection;
}) {
  const { candles, tradeDirection } = args;

  if (candles.length === 0) {
    return {
      recentReferenceLevelBeforeEntry: null,
      recentReferenceBreakDepthPctBeforeEntry: null,
      hadRecentReferenceReclaimBeforeEntry: false,
      recentReferenceReclaimHeldIntoEntry: false,
      recentReferenceConfirmationCandlesCount: 0,
    };
  }

  const recentReferenceLevelBeforeEntry = candles[0].open;

  if (recentReferenceLevelBeforeEntry <= 0) {
    return {
      recentReferenceLevelBeforeEntry: null,
      recentReferenceBreakDepthPctBeforeEntry: null,
      hadRecentReferenceReclaimBeforeEntry: false,
      recentReferenceReclaimHeldIntoEntry: false,
      recentReferenceConfirmationCandlesCount: 0,
    };
  }

  let sawBreakOfReference = false;
  let reclaimIndex: number | null = null;
  let maxBreakDepthPct = 0;

  candles.forEach((candle, index) => {
    const brokeReference =
      tradeDirection === "long"
        ? candle.low < recentReferenceLevelBeforeEntry
        : candle.high > recentReferenceLevelBeforeEntry;

    if (brokeReference) {
      sawBreakOfReference = true;

      const breakDepthPct =
        tradeDirection === "long"
          ? (recentReferenceLevelBeforeEntry - candle.low) /
            recentReferenceLevelBeforeEntry
          : (candle.high - recentReferenceLevelBeforeEntry) /
            recentReferenceLevelBeforeEntry;

      maxBreakDepthPct = Math.max(maxBreakDepthPct, breakDepthPct);
    }

    if (reclaimIndex !== null || !sawBreakOfReference) {
      return;
    }

    if (
      closesOnFavorableSideOfReference({
        candle,
        referenceLevel: recentReferenceLevelBeforeEntry,
        tradeDirection,
      })
    ) {
      reclaimIndex = index;
    }
  });

  if (reclaimIndex === null) {
    return {
      recentReferenceLevelBeforeEntry,
      recentReferenceBreakDepthPctBeforeEntry:
        maxBreakDepthPct > 0 ? round(maxBreakDepthPct) : null,
      hadRecentReferenceReclaimBeforeEntry: false,
      recentReferenceReclaimHeldIntoEntry: false,
      recentReferenceConfirmationCandlesCount: 0,
    };
  }

  const candlesAfterReclaim = candles.slice(reclaimIndex);
  const recentReferenceReclaimHeldIntoEntry = candlesAfterReclaim.every(
    (candle) =>
      closesOnFavorableSideOfReference({
        candle,
        referenceLevel: recentReferenceLevelBeforeEntry,
        tradeDirection,
      }),
  );

  const recentReferenceConfirmationCandlesCount = candlesAfterReclaim.filter(
    (candle) =>
      closesOnFavorableSideOfReference({
        candle,
        referenceLevel: recentReferenceLevelBeforeEntry,
        tradeDirection,
      }),
  ).length;

  return {
    recentReferenceLevelBeforeEntry,
    recentReferenceBreakDepthPctBeforeEntry:
      maxBreakDepthPct > 0 ? round(maxBreakDepthPct) : null,
    hadRecentReferenceReclaimBeforeEntry: true,
    recentReferenceReclaimHeldIntoEntry,
    recentReferenceConfirmationCandlesCount,
  };
}

function calculateEntryDistanceFromRecentReferenceLevelPct(args: {
  price: number;
  recentReferenceLevelBeforeEntry: number | null;
  tradeDirection: TradeDirection;
}): number | null {
  const { price, recentReferenceLevelBeforeEntry, tradeDirection } = args;

  if (recentReferenceLevelBeforeEntry === null || recentReferenceLevelBeforeEntry <= 0) {
    return null;
  }

  if (tradeDirection === "long") {
    return round(
      Math.abs(price - recentReferenceLevelBeforeEntry) /
        recentReferenceLevelBeforeEntry,
    );
  }

  return round(
    Math.abs(recentReferenceLevelBeforeEntry - price) /
      recentReferenceLevelBeforeEntry,
  );
}

export interface EntryContextDerivedSignals {
  entryExecutionIndex: number;
  entryTimestamp: string;
  entryPrice: number;
  sessionBucketAtEntry: SessionBucket;
  entryOccurredDuringMarketOpenSession: boolean;
  openingRangeCandlesCountBeforeEntry: number;
  openingRangeHighBeforeEntry: number | null;
  openingRangeLowBeforeEntry: number | null;
  entryOccurredBeyondOpeningRangeInTradeDirection: boolean;
  entryDistanceBeyondOpeningRangePct: number | null;
  openingRangeReferenceLevelBeforeEntry: number | null;
  openingRangeReferenceBreakDepthPctBeforeEntry: number | null;
  hadOpeningRangeReclaimBeforeEntry: boolean;
  openingRangeReclaimHeldIntoEntry: boolean;
  openingRangeConfirmationCandlesCount: number;
  entryDistanceFromOpeningRangeReferenceLevelPct: number | null;

  preTradeCandlesCount: number;

  recentHighBeforeEntry: number | null;
  recentLowBeforeEntry: number | null;
  recentRangeBeforeEntry: number | null;
  averageCandleRangeBeforeEntry: number | null;

  entryPricePositionInRecentRangePct: number | null;
  entryDistanceFromFavorableExtremePct: number | null;
  entryDistanceFromUnfavorableExtremePct: number | null;
  entryOccurredBeyondPreEntryRangeInTradeDirection: boolean;
  entryDistanceBeyondPreEntryRangePct: number | null;

  recentRunUpPctBeforeEntry: number | null;
  recentDropPctBeforeEntry: number | null;
  recentNetMovePctBeforeEntry: number | null;
  recentReferenceLevelBeforeEntry: number | null;
  recentReferenceBreakDepthPctBeforeEntry: number | null;
  hadRecentReferenceReclaimBeforeEntry: boolean;
  recentReferenceReclaimHeldIntoEntry: boolean;
  recentReferenceConfirmationCandlesCount: number;
  entryDistanceFromRecentReferenceLevelPct: number | null;

  bullishCandlesBeforeEntryCount: number;
  bearishCandlesBeforeEntryCount: number;
}

function getOpeningRangeSignals(args: {
  candles: Candle[];
  tradeDirection: TradeDirection;
  entryPrice: number;
  sessionBucket: SessionBucket;
}) {
  const { candles, tradeDirection, entryPrice, sessionBucket } = args;
  const inOpeningSession = isMarketOpenSessionBucket(sessionBucket);
  const openingRangeCandles = inOpeningSession ? candles.slice(0, 3) : [];
  const openingRangeHighBeforeEntry = getMaxHigh(openingRangeCandles);
  const openingRangeLowBeforeEntry = getMinLow(openingRangeCandles);

  const entryOccurredBeyondOpeningRangeInTradeDirection =
    tradeDirection === "long"
      ? openingRangeHighBeforeEntry !== null && entryPrice > openingRangeHighBeforeEntry
      : openingRangeLowBeforeEntry !== null && entryPrice < openingRangeLowBeforeEntry;

  const entryDistanceBeyondOpeningRangePct =
    tradeDirection === "long"
      ? openingRangeHighBeforeEntry !== null &&
        entryPrice > openingRangeHighBeforeEntry &&
        openingRangeHighBeforeEntry > 0
        ? round((entryPrice - openingRangeHighBeforeEntry) / openingRangeHighBeforeEntry)
        : null
      : openingRangeLowBeforeEntry !== null &&
          entryPrice < openingRangeLowBeforeEntry &&
          openingRangeLowBeforeEntry > 0
        ? round((openingRangeLowBeforeEntry - entryPrice) / openingRangeLowBeforeEntry)
        : null;

  return {
    openingRangeCandlesCountBeforeEntry: openingRangeCandles.length,
    openingRangeHighBeforeEntry,
    openingRangeLowBeforeEntry,
    entryOccurredBeyondOpeningRangeInTradeDirection,
    entryDistanceBeyondOpeningRangePct,
  };
}

function getOpeningRangeReferenceLevel(args: {
  tradeDirection: TradeDirection;
  openingRangeHighBeforeEntry: number | null;
  openingRangeLowBeforeEntry: number | null;
}): number | null {
  const { tradeDirection, openingRangeHighBeforeEntry, openingRangeLowBeforeEntry } =
    args;

  return tradeDirection === "long"
    ? openingRangeHighBeforeEntry
    : openingRangeLowBeforeEntry;
}

function getOpeningRangeReclaimSignals(args: {
  candles: Candle[];
  tradeDirection: TradeDirection;
  sessionBucket: SessionBucket;
  openingRangeCandlesCountBeforeEntry: number;
  openingRangeHighBeforeEntry: number | null;
  openingRangeLowBeforeEntry: number | null;
}) {
  const {
    candles,
    tradeDirection,
    sessionBucket,
    openingRangeCandlesCountBeforeEntry,
    openingRangeHighBeforeEntry,
    openingRangeLowBeforeEntry,
  } = args;

  if (
    !isMarketOpenSessionBucket(sessionBucket) ||
    openingRangeCandlesCountBeforeEntry < 3
  ) {
    return {
      openingRangeReferenceLevelBeforeEntry: null,
      openingRangeReferenceBreakDepthPctBeforeEntry: null,
      hadOpeningRangeReclaimBeforeEntry: false,
      openingRangeReclaimHeldIntoEntry: false,
      openingRangeConfirmationCandlesCount: 0,
    };
  }

  const openingRangeReferenceLevelBeforeEntry = getOpeningRangeReferenceLevel({
    tradeDirection,
    openingRangeHighBeforeEntry,
    openingRangeLowBeforeEntry,
  });

  if (
    openingRangeReferenceLevelBeforeEntry === null ||
    openingRangeReferenceLevelBeforeEntry <= 0
  ) {
    return {
      openingRangeReferenceLevelBeforeEntry: null,
      openingRangeReferenceBreakDepthPctBeforeEntry: null,
      hadOpeningRangeReclaimBeforeEntry: false,
      openingRangeReclaimHeldIntoEntry: false,
      openingRangeConfirmationCandlesCount: 0,
    };
  }

  const candlesAfterOpeningRange = candles.slice(openingRangeCandlesCountBeforeEntry);
  let sawBreakOfReference = false;
  let reclaimIndex: number | null = null;
  let maxBreakDepthPct = 0;

  candlesAfterOpeningRange.forEach((candle, index) => {
    const brokeReference =
      tradeDirection === "long"
        ? candle.low < openingRangeReferenceLevelBeforeEntry
        : candle.high > openingRangeReferenceLevelBeforeEntry;

    if (brokeReference) {
      sawBreakOfReference = true;

      const breakDepthPct =
        tradeDirection === "long"
          ? (openingRangeReferenceLevelBeforeEntry - candle.low) /
            openingRangeReferenceLevelBeforeEntry
          : (candle.high - openingRangeReferenceLevelBeforeEntry) /
            openingRangeReferenceLevelBeforeEntry;

      maxBreakDepthPct = Math.max(maxBreakDepthPct, breakDepthPct);
    }

    if (reclaimIndex !== null || !sawBreakOfReference) {
      return;
    }

    if (
      closesOnFavorableSideOfReference({
        candle,
        referenceLevel: openingRangeReferenceLevelBeforeEntry,
        tradeDirection,
      })
    ) {
      reclaimIndex = index;
    }
  });

  if (reclaimIndex === null) {
    return {
      openingRangeReferenceLevelBeforeEntry,
      openingRangeReferenceBreakDepthPctBeforeEntry:
        maxBreakDepthPct > 0 ? round(maxBreakDepthPct) : null,
      hadOpeningRangeReclaimBeforeEntry: false,
      openingRangeReclaimHeldIntoEntry: false,
      openingRangeConfirmationCandlesCount: 0,
    };
  }

  const candlesAfterReclaim = candlesAfterOpeningRange.slice(reclaimIndex);
  const openingRangeReclaimHeldIntoEntry = candlesAfterReclaim.every((candle) =>
    closesOnFavorableSideOfReference({
      candle,
      referenceLevel: openingRangeReferenceLevelBeforeEntry,
      tradeDirection,
    }),
  );
  const openingRangeConfirmationCandlesCount = candlesAfterReclaim.filter((candle) =>
    closesOnFavorableSideOfReference({
      candle,
      referenceLevel: openingRangeReferenceLevelBeforeEntry,
      tradeDirection,
    }),
  ).length;

  return {
    openingRangeReferenceLevelBeforeEntry,
    openingRangeReferenceBreakDepthPctBeforeEntry:
      maxBreakDepthPct > 0 ? round(maxBreakDepthPct) : null,
    hadOpeningRangeReclaimBeforeEntry: true,
    openingRangeReclaimHeldIntoEntry,
    openingRangeConfirmationCandlesCount,
  };
}

function calculateEntryDistanceFromOpeningRangeReferenceLevelPct(args: {
  price: number;
  openingRangeReferenceLevelBeforeEntry: number | null;
}): number | null {
  const { price, openingRangeReferenceLevelBeforeEntry } = args;

  if (
    openingRangeReferenceLevelBeforeEntry === null ||
    openingRangeReferenceLevelBeforeEntry <= 0
  ) {
    return null;
  }

  return round(
    Math.abs(price - openingRangeReferenceLevelBeforeEntry) /
      openingRangeReferenceLevelBeforeEntry,
  );
}

export function buildEntryContextDerivedSignals(
  result: RawTradeTimelineBuildResult,
): EntryContextDerivedSignals {
  const { timeline } = result;
  const executions = timeline.executions;

  if (executions.length === 0) {
    throw new Error("Cannot build entry context without executions.");
  }

  const firstExecution = executions[0];
  const preTradeCandles = timeline.preTradeCandles ?? [];

  const recentHighBeforeEntry = getMaxHigh(preTradeCandles);
  const recentLowBeforeEntry = getMinLow(preTradeCandles);
  const recentRangeBeforeEntry =
    recentHighBeforeEntry !== null && recentLowBeforeEntry !== null
      ? round(recentHighBeforeEntry - recentLowBeforeEntry)
      : null;
  const recentReferenceReclaimSignals = getRecentReferenceReclaimSignals({
    candles: preTradeCandles,
    tradeDirection: timeline.tradeDirection,
  });
  const openingRangeSignals = getOpeningRangeSignals({
    candles: preTradeCandles,
    tradeDirection: timeline.tradeDirection,
    entryPrice: firstExecution.price,
    sessionBucket: timeline.sessionContext.sessionBucket,
  });
  const openingRangeReclaimSignals = getOpeningRangeReclaimSignals({
    candles: preTradeCandles,
    tradeDirection: timeline.tradeDirection,
    sessionBucket: timeline.sessionContext.sessionBucket,
    openingRangeCandlesCountBeforeEntry:
      openingRangeSignals.openingRangeCandlesCountBeforeEntry,
    openingRangeHighBeforeEntry: openingRangeSignals.openingRangeHighBeforeEntry,
    openingRangeLowBeforeEntry: openingRangeSignals.openingRangeLowBeforeEntry,
  });

  return {
    entryExecutionIndex: firstExecution.executionIndex,
    entryTimestamp: firstExecution.timestamp,
    entryPrice: firstExecution.price,
    sessionBucketAtEntry: timeline.sessionContext.sessionBucket,
    entryOccurredDuringMarketOpenSession: isMarketOpenSessionBucket(
      timeline.sessionContext.sessionBucket,
    ),
    openingRangeCandlesCountBeforeEntry:
      openingRangeSignals.openingRangeCandlesCountBeforeEntry,
    openingRangeHighBeforeEntry: openingRangeSignals.openingRangeHighBeforeEntry,
    openingRangeLowBeforeEntry: openingRangeSignals.openingRangeLowBeforeEntry,
    entryOccurredBeyondOpeningRangeInTradeDirection:
      openingRangeSignals.entryOccurredBeyondOpeningRangeInTradeDirection,
    entryDistanceBeyondOpeningRangePct:
      openingRangeSignals.entryDistanceBeyondOpeningRangePct,
    openingRangeReferenceLevelBeforeEntry:
      openingRangeReclaimSignals.openingRangeReferenceLevelBeforeEntry,
    openingRangeReferenceBreakDepthPctBeforeEntry:
      openingRangeReclaimSignals.openingRangeReferenceBreakDepthPctBeforeEntry,
    hadOpeningRangeReclaimBeforeEntry:
      openingRangeReclaimSignals.hadOpeningRangeReclaimBeforeEntry,
    openingRangeReclaimHeldIntoEntry:
      openingRangeReclaimSignals.openingRangeReclaimHeldIntoEntry,
    openingRangeConfirmationCandlesCount:
      openingRangeReclaimSignals.openingRangeConfirmationCandlesCount,
    entryDistanceFromOpeningRangeReferenceLevelPct:
      calculateEntryDistanceFromOpeningRangeReferenceLevelPct({
        price: firstExecution.price,
        openingRangeReferenceLevelBeforeEntry:
          openingRangeReclaimSignals.openingRangeReferenceLevelBeforeEntry,
      }),

    preTradeCandlesCount: preTradeCandles.length,

    recentHighBeforeEntry,
    recentLowBeforeEntry,
    recentRangeBeforeEntry,
    averageCandleRangeBeforeEntry: getAverageRange(preTradeCandles),

    entryPricePositionInRecentRangePct: calculatePricePositionInRangePct({
      price: firstExecution.price,
      localHigh: recentHighBeforeEntry,
      localLow: recentLowBeforeEntry,
      tradeDirection: timeline.tradeDirection,
    }),
    entryDistanceFromFavorableExtremePct:
      calculateDistanceFromFavorableExtremePct({
        price: firstExecution.price,
        localHigh: recentHighBeforeEntry,
        localLow: recentLowBeforeEntry,
        tradeDirection: timeline.tradeDirection,
      }),
    entryDistanceFromUnfavorableExtremePct:
      calculateDistanceFromUnfavorableExtremePct({
        price: firstExecution.price,
        localHigh: recentHighBeforeEntry,
        localLow: recentLowBeforeEntry,
        tradeDirection: timeline.tradeDirection,
      }),
    entryOccurredBeyondPreEntryRangeInTradeDirection:
      timeline.tradeDirection === "long"
        ? recentHighBeforeEntry !== null &&
          firstExecution.price > recentHighBeforeEntry
        : recentLowBeforeEntry !== null &&
          firstExecution.price < recentLowBeforeEntry,
    entryDistanceBeyondPreEntryRangePct:
      timeline.tradeDirection === "long"
        ? recentHighBeforeEntry !== null &&
          firstExecution.price > recentHighBeforeEntry &&
          recentHighBeforeEntry > 0
          ? round(
              (firstExecution.price - recentHighBeforeEntry) /
                recentHighBeforeEntry,
            )
          : null
        : recentLowBeforeEntry !== null &&
            firstExecution.price < recentLowBeforeEntry &&
            recentLowBeforeEntry > 0
          ? round(
              (recentLowBeforeEntry - firstExecution.price) /
                recentLowBeforeEntry,
            )
          : null,

    recentRunUpPctBeforeEntry: getRecentRunUpPct(preTradeCandles),
    recentDropPctBeforeEntry: getRecentDropPct(preTradeCandles),
    recentNetMovePctBeforeEntry: getRecentNetMovePct(preTradeCandles),
    recentReferenceLevelBeforeEntry:
      recentReferenceReclaimSignals.recentReferenceLevelBeforeEntry,
    recentReferenceBreakDepthPctBeforeEntry:
      recentReferenceReclaimSignals.recentReferenceBreakDepthPctBeforeEntry,
    hadRecentReferenceReclaimBeforeEntry:
      recentReferenceReclaimSignals.hadRecentReferenceReclaimBeforeEntry,
    recentReferenceReclaimHeldIntoEntry:
      recentReferenceReclaimSignals.recentReferenceReclaimHeldIntoEntry,
    recentReferenceConfirmationCandlesCount:
      recentReferenceReclaimSignals.recentReferenceConfirmationCandlesCount,
    entryDistanceFromRecentReferenceLevelPct:
      calculateEntryDistanceFromRecentReferenceLevelPct({
        price: firstExecution.price,
        recentReferenceLevelBeforeEntry:
          recentReferenceReclaimSignals.recentReferenceLevelBeforeEntry,
        tradeDirection: timeline.tradeDirection,
      }),

    bullishCandlesBeforeEntryCount: countBullishCandles(preTradeCandles),
    bearishCandlesBeforeEntryCount: countBearishCandles(preTradeCandles),
  };
}
