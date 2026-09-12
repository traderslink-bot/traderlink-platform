import {
  aggregateIndicatorHistory,
  hasCompletedIndicatorCoverage,
  type IndicatorHistoryInput,
  type IndicatorHistoryRange,
} from "./trend-momentum-history";

export const TRADE_INDICATOR_CALCULATION_VERSION = "trade_indicator_context_v1" as const;

export type TradeIndicatorPoint = Readonly<{
  time: number;
  availableAt: number;
  close: number;
  historyBars: number;
  unchangedCloseBars: number;
  ema9: number | null;
  ema20: number | null;
  rsi14: number | null;
}>;

/** Numerical initialization only; calibrated warm-up/freshness gates are separate. */
export function calculateTradeIndicatorSeries(
  input: IndicatorHistoryInput,
  interval: "1m" | "5m",
): readonly TradeIndicatorPoint[] {
  const bars = aggregateIndicatorHistory(input, interval);
  let seed = 0;
  let ema9: number | null = null;
  let ema20: number | null = null;
  let gains = 0;
  let losses = 0;
  let unchangedCloseBars = 0;
  return Object.freeze(bars.map((bar, index) => {
    unchangedCloseBars = index > 0 && bar.close === bars[index - 1].close ? unchangedCloseBars + 1 : 1;
    seed += bar.close;
    if (index === 8) ema9 = seed / 9;
    else if (index > 8 && ema9 !== null) ema9 += (bar.close - ema9) * (2 / 10);
    if (index === 19) ema20 = seed / 20;
    else if (index > 19 && ema20 !== null) ema20 += (bar.close - ema20) * (2 / 21);
    if (index > 0) {
      const change = bar.close - bars[index - 1].close;
      if (index <= 14) {
        gains += Math.max(change, 0) / 14;
        losses += Math.max(-change, 0) / 14;
      } else {
        gains = (gains * 13 + Math.max(change, 0)) / 14;
        losses = (losses * 13 + Math.max(-change, 0)) / 14;
      }
    }
    const rsi14 = index < 14 ? null
      : gains === 0 && losses === 0 ? 50
      : losses === 0 ? 100
      : gains === 0 ? 0
      : 100 - 100 / (1 + gains / losses);
    if (![seed, gains, losses, ema9 ?? 0, ema20 ?? 0, rsi14 ?? 0].every(Number.isFinite)) {
      throw new Error("trade_indicator_numeric_overflow");
    }
    return Object.freeze({ time: bar.time, availableAt: bar.time + (interval === "1m" ? 60 : 300),
      close: bar.close, historyBars: index + 1, unchangedCloseBars, ema9, ema20, rsi14 });
  }));
}

export type TradeSessionVwap = Readonly<{
  value: number | null;
  method: "turnover" | "typical_price";
  unavailableReason: "session_not_started" | "coverage_incomplete" | "no_traded_volume" | "turnover_incomplete" | null;
  bars: number;
  lastBarClosedAt: number | null;
}>;

/** Linear pass for chart/event observations; same turnover method as snapshots. */
export function tradeSessionVwapValues(input: IndicatorHistoryInput, session: IndicatorHistoryRange): ReadonlyMap<number, number | null> {
  const values = new Map<number, number | null>();
  let volume = 0, turnover = 0, valid = true;
  for (const bar of aggregateIndicatorHistory(input, "1m")) {
    if (bar.time < session.start || bar.time + 60 > session.endExclusive) continue;
    volume += bar.volume;
    if (bar.turnover == null) valid = false;
    else turnover += bar.turnover;
    const covered = hasCompletedIndicatorCoverage(input.completedRanges, session.start, bar.time + 60);
    values.set(bar.time + 60, valid && covered && volume > 0 && Number.isFinite(turnover) && Number.isFinite(volume)
      ? turnover / volume : null);
  }
  return values;
}

/** One-minute session calculation, independent of rolling-indicator warm-up. */
export function calculateTradeSessionVwap(
  input: IndicatorHistoryInput,
  session: IndicatorHistoryRange,
  method: TradeSessionVwap["method"] = "turnover",
): TradeSessionVwap {
  if (!Number.isSafeInteger(session.start) || session.start <= 0 || session.start % 60 !== 0 ||
      !Number.isSafeInteger(session.endExclusive) || session.endExclusive <= session.start ||
      session.endExclusive % 60 !== 0 || !Number.isSafeInteger(input.asOf) || input.asOf <= 0) {
    throw new Error("trade_indicator_session_invalid");
  }
  const end = Math.min(Math.floor(input.asOf / 60) * 60, session.endExclusive);
  const unavailable = (reason: TradeSessionVwap["unavailableReason"], bars = 0, lastBarClosedAt: number | null = null): TradeSessionVwap =>
    Object.freeze({ value: null, method, unavailableReason: reason, bars, lastBarClosedAt });
  if (end <= session.start) return unavailable("session_not_started");
  if (!hasCompletedIndicatorCoverage(input.completedRanges, session.start, end)) {
    return unavailable("coverage_incomplete");
  }
  const bars = aggregateIndicatorHistory({ ...input, asOf: end }, "1m")
    .filter((bar) => bar.time >= session.start && bar.time + 60 <= end);
  const last = bars.at(-1);
  const lastClosedAt = last ? last.time + 60 : null;
  let volume = 0;
  let amount = 0;
  for (const bar of bars) {
    if (method === "turnover" && bar.turnover == null) {
      return unavailable("turnover_incomplete", bars.length, lastClosedAt);
    }
    volume += bar.volume;
    amount += method === "turnover" ? bar.turnover! : ((bar.high + bar.low + bar.close) / 3) * bar.volume;
  }
  if (!Number.isFinite(volume) || !Number.isFinite(amount)) throw new Error("trade_indicator_numeric_overflow");
  if (volume <= 0) return unavailable("no_traded_volume", bars.length, lastClosedAt);
  const value = amount / volume;
  if (!Number.isFinite(value) || value <= 0) return unavailable("turnover_incomplete", bars.length, lastClosedAt);
  return Object.freeze({ value, method, unavailableReason: null, bars: bars.length, lastBarClosedAt: lastClosedAt });
}
