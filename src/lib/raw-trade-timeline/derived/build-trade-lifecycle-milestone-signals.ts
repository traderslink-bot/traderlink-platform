// 2026-04-13 12:31 AM America/Toronto
// PURPOSE:
// Builds factual lifecycle milestone signals across the full trade.
// This file stays strictly factual and interpretation free.
// It captures when the trade first showed open profit or open loss and when
// peak open profit and worst drawdown occurred.

import type { RawTradeTimelineBuildResult } from "../types/raw-trade-timeline-build-result";
import type { Candle } from "../types/candle";
import type { TradeDirection } from "../types/trade-timeline-input";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function getOpenProfitFromPrice(args: {
  tradeDirection: TradeDirection;
  averageEntryPrice: number;
  marketPrice: number;
  positionSize: number;
}): number {
  const { tradeDirection, averageEntryPrice, marketPrice, positionSize } = args;

  if (tradeDirection === "long") {
    return round((marketPrice - averageEntryPrice) * positionSize);
  }

  return round((averageEntryPrice - marketPrice) * positionSize);
}

function getMostRecentActiveSnapshotIndexAtOrBeforeTimestamp(
  snapshots: RawTradeTimelineBuildResult["timeline"]["tradeStateSeries"]["snapshots"],
  timestamp: string,
): number | null {
  const targetMs = Date.parse(timestamp);
  let matchIndex: number | null = null;

  for (let index = 0; index < snapshots.length; index += 1) {
    const snapshot = snapshots[index];

    if (Date.parse(snapshot.timestamp) <= targetMs) {
      matchIndex = index;
      continue;
    }

    break;
  }

  return matchIndex;
}

export interface TradeLifecycleMilestoneSignals {
  firstTimestampTradeHadOpenProfit: string | null;
  firstTimestampTradeHadOpenLoss: string | null;

  timestampOfPeakPriceDuringTrade: string | null;
  timestampOfWorstPriceDuringTrade: string | null;

  timestampOfPeakOpenProfit: string | null;
  timestampOfWorstDrawdown: string | null;

  peakOpenProfit: number | null;
  worstDrawdown: number | null;

  peakOpenProfitPctOfBasis: number | null;
  worstDrawdownPctOfBasis: number | null;
}

export function buildTradeLifecycleMilestoneSignals(
  result: RawTradeTimelineBuildResult,
): TradeLifecycleMilestoneSignals {
  const { timeline, tradeDerivedSignals } = result;

  if (!tradeDerivedSignals) {
    throw new Error(
      "buildTradeLifecycleMilestoneSignals requires tradeDerivedSignals.",
    );
  }

  const tradeCandles = timeline.tradeCandles;
  const snapshots = timeline.tradeStateSeries.snapshots;

  let firstTimestampTradeHadOpenProfit: string | null = null;
  let firstTimestampTradeHadOpenLoss: string | null = null;

  let timestampOfPeakPriceDuringTrade: string | null = null;
  let timestampOfWorstPriceDuringTrade: string | null = null;

  let timestampOfPeakOpenProfit: string | null = null;
  let timestampOfWorstDrawdown: string | null = null;

  let peakOpenProfit: number | null = null;
  let worstDrawdown: number | null = null;

  let peakOpenProfitPctOfBasis: number | null = null;
  let worstDrawdownPctOfBasis: number | null = null;

  tradeCandles.forEach((candle) => {
    if (
      timestampOfPeakPriceDuringTrade === null &&
      tradeDerivedSignals.peakPriceDuringTrade !== null &&
      ((timeline.tradeDirection === "long" &&
        candle.high === tradeDerivedSignals.peakPriceDuringTrade) ||
        (timeline.tradeDirection === "short" &&
          candle.low === tradeDerivedSignals.peakPriceDuringTrade))
    ) {
      timestampOfPeakPriceDuringTrade = candle.timestamp;
    }

    if (
      timestampOfWorstPriceDuringTrade === null &&
      tradeDerivedSignals.worstPriceDuringTrade !== null &&
      ((timeline.tradeDirection === "long" &&
        candle.low === tradeDerivedSignals.worstPriceDuringTrade) ||
        (timeline.tradeDirection === "short" &&
          candle.high === tradeDerivedSignals.worstPriceDuringTrade))
    ) {
      timestampOfWorstPriceDuringTrade = candle.timestamp;
    }

    const snapshotIndex = getMostRecentActiveSnapshotIndexAtOrBeforeTimestamp(
      snapshots,
      candle.timestamp,
    );

    if (snapshotIndex === null) {
      return;
    }

    const snapshot = snapshots[snapshotIndex];

    if (snapshot.isFlat || snapshot.averageEntryPrice === null || snapshot.positionSize <= 0) {
      return;
    }

    const basisValue = snapshot.averageEntryPrice * snapshot.positionSize;

    const favorablePrice =
      timeline.tradeDirection === "long" ? candle.high : candle.low;
    const adversePrice =
      timeline.tradeDirection === "long" ? candle.low : candle.high;

    const favorableOpenProfit = getOpenProfitFromPrice({
      tradeDirection: timeline.tradeDirection,
      averageEntryPrice: snapshot.averageEntryPrice,
      marketPrice: favorablePrice,
      positionSize: snapshot.positionSize,
    });

    const adverseOpenProfit = getOpenProfitFromPrice({
      tradeDirection: timeline.tradeDirection,
      averageEntryPrice: snapshot.averageEntryPrice,
      marketPrice: adversePrice,
      positionSize: snapshot.positionSize,
    });

    if (firstTimestampTradeHadOpenProfit === null && favorableOpenProfit > 0) {
      firstTimestampTradeHadOpenProfit = candle.timestamp;
    }

    if (firstTimestampTradeHadOpenLoss === null && adverseOpenProfit < 0) {
      firstTimestampTradeHadOpenLoss = candle.timestamp;
    }

    if (peakOpenProfit === null || favorableOpenProfit > peakOpenProfit) {
      peakOpenProfit = favorableOpenProfit;
      timestampOfPeakOpenProfit = candle.timestamp;
      peakOpenProfitPctOfBasis =
        basisValue > 0 ? round(favorableOpenProfit / basisValue) : null;
    }

    if (worstDrawdown === null || adverseOpenProfit < worstDrawdown) {
      worstDrawdown = adverseOpenProfit;
      timestampOfWorstDrawdown = candle.timestamp;
      worstDrawdownPctOfBasis =
        basisValue > 0 ? round(adverseOpenProfit / basisValue) : null;
    }
  });

  return {
    firstTimestampTradeHadOpenProfit,
    firstTimestampTradeHadOpenLoss,
    timestampOfPeakPriceDuringTrade,
    timestampOfWorstPriceDuringTrade,
    timestampOfPeakOpenProfit,
    timestampOfWorstDrawdown,
    peakOpenProfit,
    worstDrawdown,
    peakOpenProfitPctOfBasis,
    worstDrawdownPctOfBasis,
  };
}
