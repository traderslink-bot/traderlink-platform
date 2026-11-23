import type { IndicatorResult, IndicatorTimeframe } from "@/src/lib/live-watchlist/indicators/indicator-engine";
import type { WatchlistMemberIndicatorSnapshot } from "@/src/lib/live-watchlist/indicators/indicator-member-snapshot";

// Fixed illustrative readings, with no ticker, live price, fetch or activation dependency.
export const SAMPLE_INDICATOR_PRICE = 2.4;
const sample = (timeframe: IndicatorTimeframe, trend: IndicatorResult["trend"], rsi14: number): IndicatorResult => ({
  version: "indicators-v1", timeframe, dataThrough: 1_700_000_000_000, bars: 100,
  close: 2.4, ema9: 2.36, ema20: 2.3, rsi14, rsiCondition: rsi14 > 70 ? "overbought" : rsi14 < 30 ? "oversold" : "above_midpoint",
  rsiChange: 3.2, rsiDirection: "rising", atr14: 0.08, atrPercent: 3.3, atrRatio: 1.2,
  volatility: "expanding", ema9SlopeAtr: 0.2, ema20SlopeAtr: trend === "mixed" ? -0.03 : 0.12, trend,
  volume: 125_000, volumeChangePercent: 20, volumeBaselineBars: 20, volumeRatio: 1.5, volumeState: "above_baseline",
});
export const SAMPLE_INDICATORS: WatchlistMemberIndicatorSnapshot = {
  version: "indicators-v1", symbol: "SAMPLE", activationId: "illustrative-only",
  timeframes: { "1m": sample("1m", "uptrend", 72), "5m": sample("5m", "uptrend", 62), "15m": sample("15m", "mixed", 55), "1d": sample("1d", "mixed", 58) },
  vwap: { value: 2.32, dataThrough: 1_700_000_000_000 },
};
