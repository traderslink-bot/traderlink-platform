import Decimal from "decimal.js";

import type {
  DailyTradeAnalyzerDirection,
  DailyTradeAnalyzerEvent,
  DailyTradeGreenToRedAnalysis,
  DailyTradeGreenToRedStatus,
} from "../contracts/daily-trade-analyzer-contracts";

type GreenToRedCandle = Readonly<{
  closeDecimal: string;
  time: number;
}>;

type PathPoint = Readonly<{
  pnl: Decimal;
  positionQuantity: Decimal;
  source: "candle_close" | "execution";
  time: number;
}>;

type MutableProfitOpportunity = {
  points: PathPoint[];
};

function eventTimeSeconds(event: DailyTradeAnalyzerEvent): number | null {
  const milliseconds = Date.parse(event.executedAtUtc);
  return Number.isFinite(milliseconds) ? milliseconds / 1000 : null;
}

function realizedMove(
  direction: DailyTradeAnalyzerDirection,
  averageEntryPrice: Decimal,
  executionPrice: Decimal,
  quantity: Decimal,
): Decimal {
  const perShare = direction === "long"
    ? executionPrice.minus(averageEntryPrice)
    : averageEntryPrice.minus(executionPrice);
  return perShare.times(quantity);
}

function markedPnl(
  direction: DailyTradeAnalyzerDirection,
  realizedPnl: Decimal,
  averageEntryPrice: Decimal | null,
  quantity: Decimal,
  markPrice: Decimal,
): Decimal {
  if (!averageEntryPrice || quantity.isZero()) return realizedPnl;
  return realizedPnl.plus(realizedMove(direction, averageEntryPrice, markPrice, quantity));
}

function decimalOrNull(value: Decimal | null): string | null {
  return value ? value.toFixed() : null;
}

function isDisplayedPositive(value: Decimal): boolean {
  return value.toDecimalPlaces(2).greaterThan(0);
}

function isDisplayedNegative(value: Decimal): boolean {
  return value.toDecimalPlaces(2).lessThan(0);
}

function profitOpportunityResult(
  points: readonly PathPoint[],
  finalPnl: Decimal | null,
): Pick<
  DailyTradeGreenToRedAnalysis,
  | "bestProfitOpportunityIndex"
  | "completedClosePeakAtUtcSeconds"
  | "completedClosePeakPnlDecimal"
  | "profitOpportunities"
  | "profitOpportunityThresholdDecimal"
  | "strongOpportunityThresholdDecimal"
> {
  const completedClosePoints = points.filter((point) => point.source === "candle_close");
  const positiveCompletedClosePoints = completedClosePoints.filter((point) =>
    isDisplayedPositive(point.pnl));
  if (positiveCompletedClosePoints.length === 0 || finalPnl === null) {
    return {
      bestProfitOpportunityIndex: null,
      completedClosePeakAtUtcSeconds: null,
      completedClosePeakPnlDecimal: null,
      profitOpportunities: Object.freeze([]),
      profitOpportunityThresholdDecimal: null,
      strongOpportunityThresholdDecimal: null,
    };
  }

  const completedClosePeak = positiveCompletedClosePoints.reduce((current, candidate) =>
    candidate.pnl.greaterThan(current.pnl) ? candidate : current, positiveCompletedClosePoints[0]!);
  const threshold = completedClosePeak.pnl.times(0.5);
  const strongThreshold = completedClosePeak.pnl.times(0.75);
  const windows: MutableProfitOpportunity[] = [];
  let currentWindow: MutableProfitOpportunity | null = null;
  for (const point of completedClosePoints) {
    if (point.pnl.lessThan(threshold)) {
      currentWindow = null;
      continue;
    }
    const previousPoint = currentWindow?.points.at(-1) ?? null;
    if (!previousPoint || point.time - previousPoint.time !== 60) {
      currentWindow = { points: [] };
      windows.push(currentWindow);
    }
    currentWindow.points.push(point);
  }

  const profitOpportunities = Object.freeze(windows.map((window) => {
    const first = window.points[0]!;
    const last = window.points.at(-1)!;
    const peak = window.points.reduce((current, candidate) =>
      candidate.pnl.greaterThan(current.pnl) ? candidate : current, first);
    const lowest = window.points.reduce((current, candidate) =>
      candidate.pnl.lessThan(current.pnl) ? candidate : current, first);
    return Object.freeze({
      closesAtOrAboveStrongThresholdCount: window.points.filter((point) =>
        point.pnl.greaterThanOrEqualTo(strongThreshold)).length,
      completedCloseCount: window.points.length,
      durationMinutes: Math.max(0, Math.round((last.time - first.time) / 60)),
      endedAtUtcSeconds: last.time,
      lowestPnlDecimal: lowest.pnl.toFixed(),
      peakAtUtcSeconds: peak.time,
      peakPnlDecimal: peak.pnl.toFixed(),
      peakToFinalReversalDecimal: Decimal.max(0, peak.pnl.minus(finalPnl)).toFixed(),
      startedAtUtcSeconds: first.time,
    });
  }));
  const bestProfitOpportunityIndex = profitOpportunities.reduce((bestIndex, candidate, index) => {
    if (bestIndex === null) return index;
    const best = profitOpportunities[bestIndex]!;
    if (candidate.durationMinutes !== best.durationMinutes) {
      return candidate.durationMinutes > best.durationMinutes ? index : bestIndex;
    }
    if (candidate.completedCloseCount !== best.completedCloseCount) {
      return candidate.completedCloseCount > best.completedCloseCount ? index : bestIndex;
    }
    return new Decimal(candidate.peakPnlDecimal).greaterThan(best.peakPnlDecimal) ? index : bestIndex;
  }, null as number | null);

  return {
    bestProfitOpportunityIndex,
    completedClosePeakAtUtcSeconds: completedClosePeak.time,
    completedClosePeakPnlDecimal: completedClosePeak.pnl.toFixed(),
    profitOpportunities,
    profitOpportunityThresholdDecimal: threshold.toFixed(),
    strongOpportunityThresholdDecimal: strongThreshold.toFixed(),
  };
}

/**
 * Rebuilds the complete trade P/L path from exact fills and completed
 * one-minute closes. Candle highs/lows are intentionally excluded because
 * their order inside a minute is unknown.
 */
export function analyzeDailyTradeGreenToRed(input: Readonly<{
  candles: readonly GreenToRedCandle[];
  direction: DailyTradeAnalyzerDirection;
  events: readonly DailyTradeAnalyzerEvent[];
}>): DailyTradeGreenToRedAnalysis {
  const events = [...input.events]
    .filter((event) => eventTimeSeconds(event) !== null)
    .sort((left, right) => {
      const timeDifference = eventTimeSeconds(left)! - eventTimeSeconds(right)!;
      return timeDifference === 0 ? left.sequence - right.sequence : timeDifference;
    });
  const candles = [...input.candles]
    .filter((candle) => Number.isFinite(candle.time))
    .sort((left, right) => left.time - right.time);
  if (events.length === 0 || candles.length === 0 || events.at(-1)?.kind !== "final_exit") {
    return Object.freeze({
      addedAfterPeakCount: 0,
      bestProfitOpportunityIndex: null,
      completedClosePeakAtUtcSeconds: null,
      completedClosePeakPnlDecimal: null,
      feesComplete: false,
      finalPnlDecimal: null,
      firstGreenAtUtcSeconds: null,
      firstRedAtUtcSeconds: null,
      firstRedPnlDecimal: null,
      firstRecoveryAtUtcSeconds: null,
      minutesFromPeakToRed: null,
      partialExitBeforeRedCount: 0,
      peakAtUtcSeconds: null,
      peakPnlDecimal: null,
      peakToFinalReversalDecimal: null,
      peakToRedReversalDecimal: null,
      positionQuantityAtPeakDecimal: null,
      positionQuantityAtRedDecimal: null,
      profitOpportunities: Object.freeze([]),
      profitOpportunityThresholdDecimal: null,
      status: "unavailable",
      strongOpportunityThresholdDecimal: null,
    });
  }

  const points: PathPoint[] = [];
  let averageEntryPrice: Decimal | null = null;
  let positionQuantity = new Decimal(0);
  let realizedPnl = new Decimal(0);
  let candleIndex = 0;
  const appendCandlePointsBefore = (eventTime: number) => {
    while (candleIndex < candles.length) {
      const candle = candles[candleIndex]!;
      const closeTime = candle.time + 60;
      if (closeTime > eventTime) break;
      if (averageEntryPrice && positionQuantity.isPositive()) {
        points.push(Object.freeze({
          pnl: markedPnl(
            input.direction,
            realizedPnl,
            averageEntryPrice,
            positionQuantity,
            new Decimal(candle.closeDecimal),
          ),
          positionQuantity,
          source: "candle_close",
          time: closeTime,
        }));
      }
      candleIndex += 1;
    }
  };

  for (const event of events) {
    const time = eventTimeSeconds(event)!;
    appendCandlePointsBefore(time);
    const executionPrice = new Decimal(event.priceDecimal);
    const executionQuantity = new Decimal(event.quantityDecimal);
    const opening = event.kind === "entry" || event.kind === "add";
    if (opening) {
      const quantityAfter = positionQuantity.plus(executionQuantity);
      averageEntryPrice = quantityAfter.isZero()
        ? null
        : (averageEntryPrice ?? executionPrice).times(positionQuantity)
            .plus(executionPrice.times(executionQuantity))
            .dividedBy(quantityAfter);
      positionQuantity = quantityAfter;
    } else if (averageEntryPrice) {
      const closingQuantity = Decimal.min(positionQuantity, executionQuantity);
      realizedPnl = realizedPnl.plus(realizedMove(
        input.direction,
        averageEntryPrice,
        executionPrice,
        closingQuantity,
      ));
      positionQuantity = Decimal.max(0, positionQuantity.minus(executionQuantity));
      if (positionQuantity.isZero()) averageEntryPrice = null;
    }
    if (event.feesDecimal !== null && event.feesDecimal !== undefined) {
      realizedPnl = realizedPnl.plus(event.feesDecimal);
    }
    points.push(Object.freeze({
      pnl: markedPnl(input.direction, realizedPnl, averageEntryPrice, positionQuantity, executionPrice),
      positionQuantity,
      source: "execution",
      time,
    }));
  }

  const firstGreenIndex = points.findIndex((point) => isDisplayedPositive(point.pnl));
  const finalPoint = points.at(-1) ?? null;
  if (firstGreenIndex < 0 || !finalPoint) {
    const opportunityResult = profitOpportunityResult(points, finalPoint?.pnl ?? null);
    return Object.freeze({
      addedAfterPeakCount: 0,
      ...opportunityResult,
      feesComplete: events.every((event) => event.feesDecimal !== null && event.feesDecimal !== undefined),
      finalPnlDecimal: finalPoint?.pnl.toFixed() ?? null,
      firstGreenAtUtcSeconds: null,
      firstRedAtUtcSeconds: null,
      firstRedPnlDecimal: null,
      firstRecoveryAtUtcSeconds: null,
      minutesFromPeakToRed: null,
      partialExitBeforeRedCount: 0,
      peakAtUtcSeconds: null,
      peakPnlDecimal: null,
      peakToFinalReversalDecimal: null,
      peakToRedReversalDecimal: null,
      positionQuantityAtPeakDecimal: null,
      positionQuantityAtRedDecimal: null,
      status: "never_green",
    });
  }

  const afterGreen = points.slice(firstGreenIndex);
  const firstRedIndex = afterGreen.findIndex((point) => isDisplayedNegative(point.pnl));
  const firstRed = firstRedIndex < 0 ? null : afterGreen[firstRedIndex]!;
  const pointsThroughFirstRed = firstRedIndex < 0
    ? afterGreen
    : afterGreen.slice(0, firstRedIndex);
  const peak = pointsThroughFirstRed.reduce((current, candidate) =>
    candidate.pnl.greaterThan(current.pnl) ? candidate : current, pointsThroughFirstRed[0]!);
  const firstRecovery = firstRed
    ? afterGreen.find((point) => point.time > firstRed.time && isDisplayedPositive(point.pnl)) ?? null
    : null;
  let status: DailyTradeGreenToRedStatus = "green_no_red";
  if (firstRed) {
    status = isDisplayedNegative(finalPoint.pnl)
      ? "green_to_red_ended_red"
      : isDisplayedPositive(finalPoint.pnl)
        ? "green_to_red_recovered"
        : "green_to_red_ended_flat";
  }
  const peakToRed = firstRed ? peak.pnl.minus(firstRed.pnl) : null;
  const peakToFinal = peak.pnl.minus(finalPoint.pnl);
  const eventsAfterPeak = events.filter((event) => eventTimeSeconds(event)! > peak.time);
  const opportunityResult = profitOpportunityResult(points, finalPoint.pnl);
  return Object.freeze({
    addedAfterPeakCount: eventsAfterPeak.filter((event) => event.kind === "add").length,
    ...opportunityResult,
    feesComplete: events.every((event) => event.feesDecimal !== null && event.feesDecimal !== undefined),
    finalPnlDecimal: finalPoint.pnl.toFixed(),
    firstGreenAtUtcSeconds: points[firstGreenIndex]!.time,
    firstRedAtUtcSeconds: firstRed?.time ?? null,
    firstRedPnlDecimal: decimalOrNull(firstRed?.pnl ?? null),
    firstRecoveryAtUtcSeconds: firstRecovery?.time ?? null,
    minutesFromPeakToRed: firstRed ? Math.max(0, Math.round((firstRed.time - peak.time) / 60)) : null,
    partialExitBeforeRedCount: firstRed
      ? events.filter((event) => event.kind === "partial_exit" &&
          eventTimeSeconds(event)! > peak.time && eventTimeSeconds(event)! < firstRed.time).length
      : 0,
    peakAtUtcSeconds: peak.time,
    peakPnlDecimal: peak.pnl.toFixed(),
    peakToFinalReversalDecimal: Decimal.max(0, peakToFinal).toFixed(),
    peakToRedReversalDecimal: decimalOrNull(peakToRed),
    positionQuantityAtPeakDecimal: peak.positionQuantity.toFixed(),
    positionQuantityAtRedDecimal: firstRed?.positionQuantity.toFixed() ?? null,
    status,
  });
}
