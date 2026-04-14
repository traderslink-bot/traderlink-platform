// 2026-04-13 12:48 AM America/Toronto
// PURPOSE:
// Builds factual danger-window signals between peak open profit and worst
// drawdown. This stays strictly factual and interpretation free.

import type { PositionChangeDerivedSignal } from "./build-position-change-derived-signals";
import type { TradeLifecycleMilestoneSignals } from "./build-trade-lifecycle-milestone-signals";

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function getSecondsBetweenTimestamps(
  fromTimestamp: string,
  toTimestamp: string,
): number {
  return round(
    (Date.parse(toTimestamp) - Date.parse(fromTimestamp)) / 1000,
  );
}

export interface DangerWindowDerivedSignals {
  hadPeakOpenProfitBeforeWorstDrawdown: boolean;
  secondsFromPeakOpenProfitToWorstDrawdown: number | null;
  drawdownFromPeakOpenProfitPctOfBasis: number | null;

  hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: boolean;
  reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: number;
  firstReductionTimestampAfterPeakOpenProfitBeforeWorstDrawdown: string | null;
  secondsFromPeakOpenProfitToFirstReduction: number | null;
}

export function buildDangerWindowDerivedSignals(args: {
  tradeLifecycleMilestoneSignals: TradeLifecycleMilestoneSignals;
  positionChangeDerivedSignals: PositionChangeDerivedSignal[];
}): DangerWindowDerivedSignals {
  const { tradeLifecycleMilestoneSignals, positionChangeDerivedSignals } = args;

  const peakTimestamp =
    tradeLifecycleMilestoneSignals.timestampOfPeakOpenProfit;
  const worstDrawdownTimestamp =
    tradeLifecycleMilestoneSignals.timestampOfWorstDrawdown;

  const hadPeakOpenProfitBeforeWorstDrawdown =
    peakTimestamp !== null &&
    worstDrawdownTimestamp !== null &&
    Date.parse(peakTimestamp) < Date.parse(worstDrawdownTimestamp);

  if (!hadPeakOpenProfitBeforeWorstDrawdown) {
    return {
      hadPeakOpenProfitBeforeWorstDrawdown: false,
      secondsFromPeakOpenProfitToWorstDrawdown: null,
      drawdownFromPeakOpenProfitPctOfBasis: null,
      hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: false,
      reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: 0,
      firstReductionTimestampAfterPeakOpenProfitBeforeWorstDrawdown: null,
      secondsFromPeakOpenProfitToFirstReduction: null,
    };
  }

  const peakOpenProfitPctOfBasis =
    tradeLifecycleMilestoneSignals.peakOpenProfitPctOfBasis;
  const worstDrawdownPctOfBasis =
    tradeLifecycleMilestoneSignals.worstDrawdownPctOfBasis;

  const drawdownFromPeakOpenProfitPctOfBasis =
    peakOpenProfitPctOfBasis !== null &&
    worstDrawdownPctOfBasis !== null
      ? round(peakOpenProfitPctOfBasis - worstDrawdownPctOfBasis)
      : null;

  const reductionsInDangerWindow = positionChangeDerivedSignals.filter(
    (signal) =>
      signal.positionDecreased &&
      Date.parse(signal.timestamp) > Date.parse(peakTimestamp) &&
      Date.parse(signal.timestamp) <= Date.parse(worstDrawdownTimestamp),
  );

  const firstReductionTimestampAfterPeakOpenProfitBeforeWorstDrawdown =
    reductionsInDangerWindow[0]?.timestamp ?? null;

  return {
    hadPeakOpenProfitBeforeWorstDrawdown: true,
    secondsFromPeakOpenProfitToWorstDrawdown: getSecondsBetweenTimestamps(
      peakTimestamp,
      worstDrawdownTimestamp,
    ),
    drawdownFromPeakOpenProfitPctOfBasis,
    hadReductionAfterPeakOpenProfitBeforeWorstDrawdown:
      reductionsInDangerWindow.length > 0,
    reductionCountAfterPeakOpenProfitBeforeWorstDrawdown:
      reductionsInDangerWindow.length,
    firstReductionTimestampAfterPeakOpenProfitBeforeWorstDrawdown,
    secondsFromPeakOpenProfitToFirstReduction:
      firstReductionTimestampAfterPeakOpenProfitBeforeWorstDrawdown !== null
        ? getSecondsBetweenTimestamps(
            peakTimestamp,
            firstReductionTimestampAfterPeakOpenProfitBeforeWorstDrawdown,
          )
        : null,
  };
}
