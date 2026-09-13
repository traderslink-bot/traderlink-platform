import type { TradeExecutionIndicatorResult } from "./trend-momentum-executions";

/** A missing saved value becomes a whitespace point, never a legacy substitute. */
export function savedTradeIndicatorChart(result: TradeExecutionIndicatorResult | undefined,
  interval: string, candleTimes: readonly number[]) {
  if (!result) return null;
  const points = interval === "1m" ? result.chartSeries?.oneMinute : interval === "5m" ? result.chartSeries?.fiveMinute : [];
  const byTime = new Map((points ?? []).map((point) => [point.time, point]));
  const series = (name: "ema9" | "ema20" | "rsi14" | "vwap") => candleTimes.map((time) => {
    const value = byTime.get(time)?.[name];
    return value == null || !Number.isFinite(value) ? { time } : { time, value };
  });
  return { ema9: series("ema9"), ema20: series("ema20"), rsi14: series("rsi14"), vwap: series("vwap") };
}
