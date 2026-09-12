import type { IndicatorResult, IndicatorTimeframe } from "./indicator-engine";
export type WatchlistMemberIndicatorSnapshot = Readonly<{
  version: "indicators-v1"; symbol: string; activationId: string;
  timeframes: Readonly<Partial<Record<IndicatorTimeframe, IndicatorResult>>>;
  vwap: Readonly<{ value: number | null; dataThrough: number | null }>;
}>;
const numbers = ["dataThrough", "bars", "close", "ema9", "ema20", "rsi14", "rsiChange", "atr14", "atrPercent", "atrRatio",
  "ema9SlopeAtr", "ema20SlopeAtr", "volume", "volumeChangePercent", "volumeBaselineBars", "volumeRatio"] as const;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
function allowed<T extends string>(value: T | null, values: readonly T[]): T | null { return values.includes(value as T) ? value : null; }

/** Positive field allowlist, including nested results: future internal fields cannot leak to members. */
export function memberIndicatorSnapshot(input: WatchlistMemberIndicatorSnapshot | null): WatchlistMemberIndicatorSnapshot | null {
  if (!input || input.version !== "indicators-v1") return null;
  const timeframes: Partial<Record<IndicatorTimeframe, IndicatorResult>> = {};
  for (const frame of ["1m", "5m", "15m", "1d"] as const) {
    const result = input.timeframes[frame];
    if (!result || result.version !== "indicators-v1" || result.timeframe !== frame || !Number.isSafeInteger(result.dataThrough)
      || result.dataThrough <= 0 || !finite(result.close) || result.close <= 0) continue;
    const values = Object.fromEntries(numbers.map(key => [key, finite(result[key]) ? result[key] : null]));
    timeframes[frame] = { ...values, version: "indicators-v1", timeframe: frame,
      trend: allowed(result.trend, ["uptrend", "downtrend", "sideways", "mixed"]),
      rsiCondition: allowed(result.rsiCondition, ["oversold", "overbought", "below_midpoint", "above_midpoint", "at_midpoint"]),
      rsiDirection: allowed(result.rsiDirection, ["rising", "falling", "little_changed", "recovered_above_oversold"]),
      volatility: allowed(result.volatility, ["expanding", "contracting", "steady"]),
      volumeState: allowed(result.volumeState, ["above_baseline", "below_baseline", "near_baseline"]),
    } as IndicatorResult;
  }
  return { version: "indicators-v1", symbol: input.symbol, activationId: input.activationId, timeframes,
    vwap: { value: finite(input.vwap.value) ? input.vwap.value : null,
      dataThrough: Number.isSafeInteger(input.vwap.dataThrough) && input.vwap.dataThrough! > 0 ? input.vwap.dataThrough : null } };
}
