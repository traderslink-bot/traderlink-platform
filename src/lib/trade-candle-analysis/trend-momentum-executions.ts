import type { IndicatorHistoryInput, IndicatorHistoryRange } from "./trend-momentum-history";
import { hasCompletedIndicatorCoverage } from "./trend-momentum-history";
import { tradeIndicatorContextAt, type TradeIndicatorContextPolicy } from "./trend-momentum-context";
import { calculateTradeIndicatorSeries, calculateTradeSessionVwap, tradeSessionVwapValues, TRADE_INDICATOR_CALCULATION_VERSION } from "./trend-momentum-indicators";
import { analyzeIndicatorEpisodes, type IndicatorPositionCycle } from "./trend-momentum-episodes";

export type TradeIndicatorLandmark = Readonly<{ key: string; at: number; contextAt: number; precision: "execution" | "candle_range" }>;
export type TradeExecutionIndicatorInput = Readonly<{
  landmarks?: readonly TradeIndicatorLandmark[];
  historyOutcome?: string;
  direction?: "long" | "short";
  positionCycles?: readonly IndicatorPositionCycle[];
  timingUnavailable?: boolean;
  history: IndicatorHistoryInput;
  session: IndicatorHistoryRange;
  resetTimes: readonly number[];
  policies: Readonly<Record<"1m" | "5m", TradeIndicatorContextPolicy>>;
}>;

/** Additive evidence: never changes executions, grouping or financial calculations. */
export function analyzeTradeExecutionIndicators(
  input: TradeExecutionIndicatorInput,
  events: readonly Readonly<{ eventId: string; executedAtUtc: string }>[],
) {
  const one = calculateTradeIndicatorSeries(input.history, "1m");
  const five = calculateTradeIndicatorSeries(input.history, "5m");
  const seen = new Set<string>();
  const executions = events.map((event) => {
    const at = Date.parse(event.executedAtUtc) / 1000;
    if (!event.eventId || seen.has(event.eventId) || !Number.isFinite(at)) {
      throw new Error("trade_indicator_execution_invalid");
    }
    seen.add(event.eventId);
    // Never present the latest history as if it were known at a later execution.
    const coveredThroughExecution = at <= input.history.asOf;
    const context = (interval: "1m" | "5m") => coveredThroughExecution
      ? tradeIndicatorContextAt({ series: interval === "1m" ? one : five, at, interval,
          completedRanges: input.history.completedRanges, resetTimes: input.resetTimes,
          policy: input.policies[interval] }) : null;
    return Object.freeze({ eventId: event.eventId, executedAtUtc: event.executedAtUtc,
      oneMinute: context("1m"), fiveMinute: context("5m"),
      sessionVwap: coveredThroughExecution ? calculateTradeSessionVwap({ ...input.history,
        asOf: Math.floor(at) }, input.session) : null });
  });
  const vwap = tradeSessionVwapValues(input.history, input.session);
  const vwapEntries = [...vwap.entries()];
  const vwapAt = (at: number) => {
    if (!hasCompletedIndicatorCoverage(input.history.completedRanges, input.session.start, at)) return null;
    let low = 0, high = vwapEntries.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (vwapEntries[middle][0] <= at) low = middle + 1; else high = middle;
    }
    return vwapEntries[low - 1]?.[1] ?? null;
  };
  const chart = (interval: "1m" | "5m") => {
    const series = interval === "1m" ? one : five;
    return series.filter((point) => point.time >= input.session.start && point.availableAt <= input.session.endExclusive).map((point) => {
      const context = tradeIndicatorContextAt({ series, at: point.availableAt, interval,
        completedRanges: input.history.completedRanges, resetTimes: input.resetTimes, policy: input.policies[interval] })!;
      return { time: point.time, at: point.availableAt, close: point.close, ema9: context.ema9, ema20: context.ema20,
        rsi14: context.rsi14, vwap: vwapAt(point.availableAt) };
    });
  };
  const chartSeries = Object.freeze({ oneMinute: Object.freeze(chart("1m")), fiveMinute: Object.freeze(chart("5m")) });
  const during = (interval: "1m" | "5m") => {
    if (!input.positionCycles || input.timingUnavailable || !input.direction) return null;
    const observations = interval === "1m" ? chartSeries.oneMinute : chartSeries.fiveMinute;
    return analyzeIndicatorEpisodes({ observations, oneMinuteCloses: one.map((p) => ({ at: p.availableAt, close: p.close })),
      cycles: input.positionCycles, completedRanges: input.history.completedRanges,
      resetTimes: input.resetTimes, direction: input.direction });
  };
  return Object.freeze({ calculationVersion: TRADE_INDICATOR_CALCULATION_VERSION,
    ...(input.landmarks ? { landmarks: input.landmarks.map((landmark) => {
      if (!Number.isFinite(landmark.at) || !Number.isFinite(landmark.contextAt) || landmark.contextAt > landmark.at) throw new Error("indicator_landmark_time_invalid");
      const at = landmark.contextAt;
      const covered = at <= input.history.asOf && at >= input.session.start;
      const context = (interval: "1m" | "5m") => covered ? tradeIndicatorContextAt({
        series: interval === "1m" ? one : five, at, interval, completedRanges: input.history.completedRanges,
        resetTimes: input.resetTimes, policy: input.policies[interval] }) : null;
      return { ...landmark, oneMinute: context("1m"), fiveMinute: context("5m"),
        sessionVwap: covered ? calculateTradeSessionVwap({ ...input.history, asOf: Math.floor(at) }, input.session) : null };
    }) } : {}),
    chartSeries,
    historyOutcome: input.historyOutcome ?? "complete",
    timingUnavailable: input.timingUnavailable ?? false,
    duringTrade: Object.freeze({ oneMinute: during("1m"), fiveMinute: during("5m") }),
    executions: Object.freeze(executions) });
}

export type TradeExecutionIndicatorResult = ReturnType<typeof analyzeTradeExecutionIndicators>;
