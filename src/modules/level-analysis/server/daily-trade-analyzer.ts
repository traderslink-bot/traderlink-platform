import Decimal from "decimal.js";

import type { TradeCandle } from "@/src/lib/trade-candle-analysis/candle-analysis";
import {
  calculateAdr20,
  calculateIndicatorPoints,
} from "@/src/lib/trade-candle-analysis/indicator-context";
import {
  aggregateCompleteExecutionTimeframeCandles,
  detectExecutionPatternContexts,
  executionTimeframeBucketTime,
} from "@/src/lib/trade-candle-analysis/execution-pattern-context";

import {
  DAILY_TRADE_ANALYZER_POST_EXIT_MINUTES,
  type DailyTradeAnalyzerEvent,
  type DailyTradeAnalyzerFiveMinuteContext,
  type DailyTradeAnalyzerEventMetrics,
  type DailyTradeAnalyzerEventPath,
  type DailyTradeAnalyzerEventSnapshot,
  type DailyTradeAnalyzerInput,
  type DailyTradeAnalyzerPattern,
  type DailyTradeAnalyzerPostExitPath,
  type DailyTradeAnalyzerReferenceDistance,
  type DailyTradeAnalyzerResult,
} from "../contracts/daily-trade-analyzer-contracts";
import type { NormalizedMarketCandle } from "../contracts/candle-review-contracts";
import { analyzeDailyTradeGreenToRed } from "./daily-trade-green-to-red-analyzer";

function numericCandles(candles: readonly NormalizedMarketCandle[]): readonly TradeCandle[] {
  return Object.freeze(candles.map((candle) => Object.freeze({
    time: candle.time,
    open: Number(candle.openDecimal),
    high: Number(candle.highDecimal),
    low: Number(candle.lowDecimal),
    close: Number(candle.closeDecimal),
    volume: Number(candle.volumeDecimal),
    turnover: candle.turnoverDecimal === null || candle.turnoverDecimal === undefined
      ? null
      : Number(candle.turnoverDecimal),
  })));
}

function containingMinute(executedAtUtc: string): number | null {
  const milliseconds = Date.parse(executedAtUtc);
  return Number.isFinite(milliseconds) ? Math.floor(milliseconds / 60_000) * 60 : null;
}

function decimal(value: number): string | null {
  if (!Number.isFinite(value)) return null;
  const result = new Decimal(value);
  return result.isZero() ? "0" : result.toFixed();
}

function relativeVolume(candles: readonly TradeCandle[], index: number): number | null {
  const candidate = candles[index];
  if (!candidate || index < 1 || !Number.isFinite(candidate.volume) || candidate.volume <= 0) {
    return null;
  }
  const earlier = candles.slice(Math.max(0, index - 20), index)
    .map((candle) => candle.volume)
    .filter((volume) => Number.isFinite(volume) && volume > 0);
  if (earlier.length < 5) return null;
  const average = earlier.reduce((total, volume) => total + volume, 0) / earlier.length;
  return average > 0 ? candidate.volume / average : null;
}

function summedActivity(candles: readonly TradeCandle[]): Readonly<{
  turnoverDecimal: string | null;
  volumeDecimal: string;
}> {
  const volumeDecimal = candles.reduce(
    (total, candle) => total.plus(candle.volume),
    new Decimal(0),
  ).toFixed();
  const turnoverDecimal = candles.every((candle) => candle.turnover !== null)
    ? candles.reduce(
        (total, candle) => total.plus(candle.turnover ?? 0),
        new Decimal(0),
      ).toFixed()
    : null;
  return Object.freeze({ turnoverDecimal, volumeDecimal });
}

function fiveMinuteExecutionContext(
  event: DailyTradeAnalyzerEvent,
  oneMinuteCandles: readonly TradeCandle[],
  fiveMinuteCandles: readonly TradeCandle[],
  fiveMinuteIndicatorPoints: ReturnType<typeof calculateIndicatorPoints>,
  direction: DailyTradeAnalyzerInput["direction"],
): DailyTradeAnalyzerFiveMinuteContext {
  const executedAtSeconds = Date.parse(event.executedAtUtc) / 1000;
  if (!Number.isFinite(executedAtSeconds)) {
    return Object.freeze({ completedBeforeExecution: null, containingCandle: null, preExecutionPartial: null });
  }
  const eventMinute = Math.floor(executedAtSeconds / 60) * 60;
  const containingTime = executionTimeframeBucketTime(eventMinute, "5m");
  const containingIndex = fiveMinuteCandles.findIndex((candle) => candle.time === containingTime);
  const containingCandle = containingIndex >= 0 ? fiveMinuteCandles[containingIndex]! : null;
  const priorIndex = fiveMinuteCandles.findLastIndex((candle) => candle.time < containingTime);
  const priorCandle = priorIndex >= 0 ? fiveMinuteCandles[priorIndex]! : null;
  const executionPrice = new Decimal(event.priceDecimal);

  let candleLocationRatio: number | null = null;
  let executionEdgeDistanceDecimal: string | null = null;
  if (containingCandle) {
    const low = new Decimal(containingCandle.low);
    const high = new Decimal(containingCandle.high);
    const range = high.minus(low);
    if (range.isPositive()) {
      candleLocationRatio = executionPrice.minus(low).dividedBy(range).toNumber();
      const favorableEdgeIsHigh = direction === "long" ? !isOpeningEvent(event) : isOpeningEvent(event);
      const edgeDistance = favorableEdgeIsHigh
        ? high.minus(executionPrice)
        : executionPrice.minus(low);
      executionEdgeDistanceDecimal = Decimal.max(0, edgeDistance).toFixed();
    }
  }

  const partialCandles = oneMinuteCandles.filter((candle) =>
    candle.time >= containingTime && candle.time < eventMinute);
  const partialActivity = partialCandles.length > 0 ? summedActivity(partialCandles) : null;
  const containingPoint = containingIndex >= 0 ? fiveMinuteIndicatorPoints[containingIndex] ?? null : null;
  const priorPoint = priorIndex >= 0 ? fiveMinuteIndicatorPoints[priorIndex] ?? null : null;

  return Object.freeze({
    completedBeforeExecution: priorCandle
      ? Object.freeze({
          candleTime: priorCandle.time,
          ema9Distance: referenceDistance(executionPrice, priorPoint?.ema9 ?? null),
          relativeVolume: relativeVolume(fiveMinuteCandles, priorIndex),
          turnoverDecimal: priorCandle.turnover == null ? null : new Decimal(priorCandle.turnover).toFixed(),
          volumeDecimal: new Decimal(priorCandle.volume).toFixed(),
        })
      : null,
    containingCandle: containingCandle
      ? Object.freeze({
          candleLocationRatio,
          candleTime: containingCandle.time,
          ema9Distance: referenceDistance(executionPrice, containingPoint?.ema9 ?? null),
          executionEdgeDistanceDecimal,
          relativeVolume: relativeVolume(fiveMinuteCandles, containingIndex),
          turnoverDecimal: containingCandle.turnover == null
            ? null
            : new Decimal(containingCandle.turnover).toFixed(),
          volumeDecimal: new Decimal(containingCandle.volume).toFixed(),
        })
      : null,
    preExecutionPartial: partialActivity
      ? Object.freeze({
          completedMinuteCount: partialCandles.length,
          ...partialActivity,
        })
      : null,
  });
}

function isOpeningEvent(event: DailyTradeAnalyzerEvent): boolean {
  return event.kind === "entry" || event.kind === "add";
}

function referenceDistance(
  executionPrice: Decimal,
  anchor: number | null,
): DailyTradeAnalyzerReferenceDistance | null {
  if (anchor === null || !Number.isFinite(anchor) || anchor === 0) return null;
  const anchorDecimal = new Decimal(anchor);
  const signedDistance = executionPrice.minus(anchorDecimal);
  return Object.freeze({
    anchorDecimal: anchorDecimal.toFixed(),
    signedDistanceDecimal: signedDistance.isZero() ? "0" : signedDistance.toFixed(),
    signedDistancePercent: signedDistance.dividedBy(anchorDecimal).times(100).toNumber(),
  });
}

function directionalMoves(
  executionPrice: Decimal,
  direction: DailyTradeAnalyzerInput["direction"],
  candles: readonly TradeCandle[],
  terminalPrice?: Decimal,
): Readonly<{ adverse: Decimal; favorable: Decimal }> {
  let favorable = new Decimal(0);
  let adverse = new Decimal(0);
  for (const candle of candles) {
    const high = new Decimal(candle.high);
    const low = new Decimal(candle.low);
    const favorableCandidate = direction === "long"
      ? high.minus(executionPrice)
      : executionPrice.minus(low);
    const adverseCandidate = direction === "long"
      ? executionPrice.minus(low)
      : high.minus(executionPrice);
    if (favorableCandidate.greaterThan(favorable)) favorable = favorableCandidate;
    if (adverseCandidate.greaterThan(adverse)) adverse = adverseCandidate;
  }
  if (terminalPrice) {
    const directional = direction === "long"
      ? terminalPrice.minus(executionPrice)
      : executionPrice.minus(terminalPrice);
    if (directional.greaterThan(favorable)) favorable = directional;
    const opposite = directional.negated();
    if (opposite.greaterThan(adverse)) adverse = opposite;
  }
  return Object.freeze({ adverse, favorable });
}

function postEventPath(
  event: DailyTradeAnalyzerEvent,
  direction: DailyTradeAnalyzerInput["direction"],
  candles: readonly TradeCandle[],
  minutesAfterEvent: DailyTradeAnalyzerEventPath["minutesAfterEvent"],
): DailyTradeAnalyzerEventPath {
  const eventMinute = containingMinute(event.executedAtUtc);
  const executionPrice = new Decimal(event.priceDecimal);
  if (eventMinute === null || !executionPrice.isFinite()) {
    return Object.freeze({
      minutesAfterEvent,
      observedAtCandleTime: null,
      oppositeDirectionMoveDecimal: null,
      tradeDirectionMoveDecimal: null,
    });
  }
  const target = eventMinute + minutesAfterEvent * 60;
  const observed = candles.filter((candle) => candle.time > eventMinute && candle.time <= target);
  const latestObserved = observed.at(-1) ?? null;
  if (!latestObserved || latestObserved.time < target - 60) {
    return Object.freeze({
      minutesAfterEvent,
      observedAtCandleTime: null,
      oppositeDirectionMoveDecimal: null,
      tradeDirectionMoveDecimal: null,
    });
  }
  const moves = directionalMoves(executionPrice, direction, observed);
  return Object.freeze({
    minutesAfterEvent,
    observedAtCandleTime: latestObserved.time,
    oppositeDirectionMoveDecimal: moves.adverse.toFixed(),
    tradeDirectionMoveDecimal: moves.favorable.toFixed(),
  });
}

type PositionState = Readonly<{
  averageEntryPriceAfter: Decimal | null;
  quantityAfter: Decimal;
  quantityBefore: Decimal;
}>;

function positionStates(events: readonly DailyTradeAnalyzerEvent[]): ReadonlyMap<string, PositionState> {
  const result = new Map<string, PositionState>();
  let quantity = new Decimal(0);
  let averageEntryPrice: Decimal | null = null;
  for (const event of events) {
    const quantityBefore = quantity;
    const eventQuantity = new Decimal(event.quantityDecimal);
    const eventPrice = new Decimal(event.priceDecimal);
    if (isOpeningEvent(event)) {
      const quantityAfter = quantityBefore.plus(eventQuantity);
      averageEntryPrice = quantityAfter.isZero()
        ? null
        : (averageEntryPrice ?? eventPrice).times(quantityBefore)
            .plus(eventPrice.times(eventQuantity))
            .dividedBy(quantityAfter);
      quantity = quantityAfter;
    } else {
      const remaining = quantityBefore.minus(eventQuantity);
      quantity = remaining.isNegative() ? new Decimal(0) : remaining;
      if (quantity.isZero()) averageEntryPrice = null;
    }
    result.set(event.eventId, Object.freeze({
      averageEntryPriceAfter: averageEntryPrice,
      quantityAfter: quantity,
      quantityBefore,
    }));
  }
  return result;
}

function eventMetrics(
  event: DailyTradeAnalyzerEvent,
  events: readonly DailyTradeAnalyzerEvent[],
  candles: readonly TradeCandle[],
  indicatorPoints: ReturnType<typeof calculateIndicatorPoints>,
  direction: DailyTradeAnalyzerInput["direction"],
  positionState: PositionState,
): DailyTradeAnalyzerEventMetrics {
  const eventMinute = containingMinute(event.executedAtUtc);
  const candleIndex = eventMinute === null ? -1 : candles.findIndex((candle) => candle.time === eventMinute);
  const candle = candleIndex >= 0 ? candles[candleIndex]! : null;
  const indicator = candleIndex >= 0 ? indicatorPoints[candleIndex] ?? null : null;
  const executionPrice = new Decimal(event.priceDecimal);
  let candleLocationRatio: number | null = null;
  let executionEdgeDistanceDecimal: string | null = null;
  let cumulativeSessionVolumeDecimal: string | null = null;
  let cumulativeSessionTurnoverDecimal: string | null = null;
  if (candle) {
    const low = new Decimal(candle.low);
    const high = new Decimal(candle.high);
    const range = high.minus(low);
    if (range.isPositive()) {
      candleLocationRatio = executionPrice.minus(low).dividedBy(range).toNumber();
      const opening = isOpeningEvent(event);
      const favorableEdgeIsHigh = direction === "long" ? !opening : opening;
      const edgeDistance = favorableEdgeIsHigh
        ? high.minus(executionPrice)
        : executionPrice.minus(low);
      executionEdgeDistanceDecimal = Decimal.max(0, edgeDistance).toFixed();
    }
    cumulativeSessionVolumeDecimal = candles.slice(0, candleIndex + 1)
      .reduce((total, candidate) => total.plus(candidate.volume), new Decimal(0)).toFixed();
    const turnoverWindow = candles.slice(0, candleIndex + 1);
    if (turnoverWindow.every((candidate) => candidate.turnover !== null)) {
      cumulativeSessionTurnoverDecimal = turnoverWindow
        .reduce((total, candidate) => total.plus(candidate.turnover ?? 0), new Decimal(0)).toFixed();
    }
  }

  const finalExit = [...events].reverse().find((candidate) => candidate.kind === "final_exit") ?? null;
  const finalExitMinute = finalExit ? containingMinute(finalExit.executedAtUtc) : null;
  let excursionUntilFlat: DailyTradeAnalyzerEventMetrics["excursionUntilFlat"] = null;
  if (finalExit && event.eventId !== finalExit.eventId && eventMinute !== null && finalExitMinute !== null) {
    const observed = candles.filter((candidate) =>
      candidate.time > eventMinute && candidate.time < finalExitMinute);
    const moves = directionalMoves(executionPrice, direction, observed, new Decimal(finalExit.priceDecimal));
    excursionUntilFlat = Object.freeze({
      adverseMoveDecimal: moves.adverse.toFixed(),
      favorableMoveDecimal: moves.favorable.toFixed(),
      minutesUntilFlat: Math.max(0, Math.round(
        (Date.parse(finalExit.executedAtUtc) - Date.parse(event.executedAtUtc)) / 60_000,
      )),
      observedThroughCandleTime: observed.at(-1)?.time ?? null,
    });
  }

  let priorFavorableExtremePriceDecimal: string | null = null;
  let givebackFromPriorFavorableExtremeDecimal: string | null = null;
  if (!isOpeningEvent(event) && eventMinute !== null) {
    const firstEntry = events.find((candidate) => candidate.kind === "entry") ?? null;
    const firstEntryMinute = firstEntry ? containingMinute(firstEntry.executedAtUtc) : null;
    if (firstEntry && firstEntryMinute !== null) {
      const priorCandles = candles.filter((candidate) =>
        candidate.time > firstEntryMinute && candidate.time < eventMinute);
      const openingPrices = events
        .filter((candidate) => isOpeningEvent(candidate) && candidate.sequence < event.sequence)
        .map((candidate) => new Decimal(candidate.priceDecimal));
      const candidates = [executionPrice, ...openingPrices, ...priorCandles.map((candidate) =>
        new Decimal(direction === "long" ? candidate.high : candidate.low))];
      const extreme = direction === "long" ? Decimal.max(...candidates) : Decimal.min(...candidates);
      const giveback = direction === "long"
        ? extreme.minus(executionPrice)
        : executionPrice.minus(extreme);
      priorFavorableExtremePriceDecimal = extreme.toFixed();
      givebackFromPriorFavorableExtremeDecimal = Decimal.max(0, giveback).toFixed();
    }
  }

  return Object.freeze({
    averageEntryPriceAfterDecimal: positionState.averageEntryPriceAfter?.toFixed() ?? null,
    candleLocationRatio,
    candleTurnoverDecimal: candle?.turnover === null || candle?.turnover === undefined
      ? null
      : new Decimal(candle.turnover).toFixed(),
    candleVolumeDecimal: candle ? new Decimal(candle.volume).toFixed() : null,
    cumulativeSessionTurnoverDecimal,
    cumulativeSessionVolumeDecimal,
    ema9Distance: referenceDistance(executionPrice, indicator?.ema9 ?? null),
    executionEdgeDistanceDecimal,
    excursionUntilFlat,
    positionQuantityAfterDecimal: positionState.quantityAfter.toFixed(),
    positionQuantityBeforeDecimal: positionState.quantityBefore.toFixed(),
    postEventPaths: Object.freeze(DAILY_TRADE_ANALYZER_POST_EXIT_MINUTES.map((minutes) =>
      postEventPath(event, direction, candles, minutes))),
    priorFavorableExtremePriceDecimal,
    givebackFromPriorFavorableExtremeDecimal,
    vwapDistance: referenceDistance(executionPrice, indicator?.vwap ?? null),
  });
}

function eventSnapshot(
  event: DailyTradeAnalyzerEvent,
  candles: readonly TradeCandle[],
  indicatorPoints: ReturnType<typeof calculateIndicatorPoints>,
  adr20: number | null,
  fiveMinuteContext: DailyTradeAnalyzerFiveMinuteContext,
  patterns: readonly DailyTradeAnalyzerPattern[],
  metrics: DailyTradeAnalyzerEventMetrics,
): DailyTradeAnalyzerEventSnapshot {
  const candleTime = containingMinute(event.executedAtUtc);
  if (candleTime === null) {
    return Object.freeze({
      candleTime: null,
      event,
      fiveMinuteContext,
      indicators: null,
      metrics,
      patterns: Object.freeze([]),
    });
  }
  const index = candles.findIndex((candle) => candle.time === candleTime);
  const point = index >= 0 ? indicatorPoints[index] : null;
  if (!point) {
    return Object.freeze({ candleTime, event, fiveMinuteContext, indicators: null, metrics, patterns: Object.freeze([]) });
  }
  return Object.freeze({
    candleTime,
    event,
    fiveMinuteContext,
    indicators: Object.freeze({
      adr20,
      atr14: point.atr14,
      ema9: point.ema9,
      ema20: point.ema20,
      macd: point.macd,
      macdHistogram: point.macdHistogram,
      macdSignal: point.macdSignal,
      relativeVolume: relativeVolume(candles, index),
      rsi14: point.rsi14,
      vwap: point.vwap,
    }),
    metrics,
    patterns,
  });
}

function postExitPath(
  event: DailyTradeAnalyzerEvent,
  direction: DailyTradeAnalyzerInput["direction"],
  candles: readonly TradeCandle[],
  minutesAfterExit: DailyTradeAnalyzerPostExitPath["minutesAfterExit"],
): DailyTradeAnalyzerPostExitPath {
  const exitMinute = containingMinute(event.executedAtUtc);
  const exitPrice = new Decimal(event.priceDecimal);
  if (exitMinute === null || !exitPrice.isFinite()) {
    return Object.freeze({ minutesAfterExit, favorableMoveDecimal: null, observedAtCandleTime: null });
  }
  const target = exitMinute + minutesAfterExit * 60;
  const observed = candles.filter((candle) => candle.time > exitMinute && candle.time <= target);
  const latestObserved = observed.at(-1) ?? null;
  if (!latestObserved || latestObserved.time < target - 60) {
    return Object.freeze({ minutesAfterExit, favorableMoveDecimal: null, observedAtCandleTime: null });
  }
  const favorable = direction === "long"
    ? Math.max(...observed.map((candle) => candle.high))
    : Math.min(...observed.map((candle) => candle.low));
  const move = direction === "long"
    ? new Decimal(favorable).minus(exitPrice).toNumber()
    : exitPrice.minus(favorable).toNumber();
  return Object.freeze({
    minutesAfterExit,
    favorableMoveDecimal: decimal(move),
    observedAtCandleTime: latestObserved.time,
  });
}

/**
 * Produces only derived market facts. It never changes a Journal execution,
 * round trip, rule, tag, note, or trading-day review.
 */
export function analyzeDailyTrade(input: DailyTradeAnalyzerInput): DailyTradeAnalyzerResult {
  const events = Object.freeze([...input.events].sort((left, right) => left.sequence - right.sequence));
  const candles = numericCandles(input.candles);
  const adr20 = calculateAdr20(input.dailyRanges);
  const indicatorPoints = calculateIndicatorPoints(candles, { vwapSource: "turnover" });
  const fiveMinuteCandles = aggregateCompleteExecutionTimeframeCandles(candles, "5m");
  const fiveMinuteIndicatorPoints = calculateIndicatorPoints(fiveMinuteCandles, { vwapSource: "turnover" });
  const states = positionStates(events);
  const eventSnapshots = Object.freeze(events.map((event) => {
    const state = states.get(event.eventId);
    if (!state) throw new Error("daily_trade_event_position_state_missing");
    return eventSnapshot(
      event,
      candles,
      indicatorPoints,
      adr20,
      fiveMinuteExecutionContext(
        event,
        candles,
        fiveMinuteCandles,
        fiveMinuteIndicatorPoints,
        input.direction,
      ),
      detectExecutionPatternContexts(candles, Date.parse(event.executedAtUtc) / 1000),
      eventMetrics(event, events, candles, indicatorPoints, input.direction, state),
    );
  }));
  const finalExit = [...events].reverse().find((event) => event.kind === "final_exit") ?? null;
  const finalExitPaths = Object.freeze(DAILY_TRADE_ANALYZER_POST_EXIT_MINUTES.map((minutesAfterExit) =>
    finalExit
      ? postExitPath(finalExit, input.direction, candles, minutesAfterExit)
      : Object.freeze({ minutesAfterExit, favorableMoveDecimal: null, observedAtCandleTime: null }),
  ));
  const greenToRed = analyzeDailyTradeGreenToRed({
    candles: input.candles.map((candle) => ({
      closeDecimal: candle.closeDecimal,
      time: candle.time,
    })),
    direction: input.direction,
    events,
  });
  return Object.freeze({ eventSnapshots, finalExitPaths, greenToRed });
}
