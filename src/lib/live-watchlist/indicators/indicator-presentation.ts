import type { IndicatorResult, IndicatorTimeframe } from "./indicator-engine";
export type IndicatorDisplayRow = Readonly<{ label: string; value: string; explanation: string }>;
const finite = (n: number | null | undefined): n is number => typeof n === "number" && Number.isFinite(n);
export const indicatorPrice = (n: number | null | undefined): string => finite(n) ? `$${n.toFixed(n < 1 ? 4 : 2)}` : "—";
export const indicatorFrameLabel = (frame: IndicatorTimeframe): string => frame === "1d" ? "Daily" : frame;
const trendNames = { uptrend: "Uptrend", downtrend: "Downtrend", sideways: "Sideways", mixed: "Mixed trend" };
export function indicatorSummary(result: IndicatorResult | undefined): string {
  if (!result) return "—";
  const trend = result.trend ? trendNames[result.trend] : null;
  const momentum = result.rsiDirection === "falling" ? "RSI falling" : result.rsiDirection === "rising" ? "RSI rising"
    : result.rsiDirection === "recovered_above_oversold" ? "RSI recovering" : null;
  return [trend, momentum].filter(Boolean).join(" · ") || "—";
}
export function indicatorDisplayRows(input: Readonly<{
  result?: IndicatorResult; timeframe: IndicatorTimeframe; livePrice: number | null;
  vwap: number | null;
}>): readonly IndicatorDisplayRow[] {
  const r = input.result, timeframe = input.timeframe === "1d" ? "daily" : input.timeframe;
  const trend = r?.trend ? trendNames[r.trend] : "—";
  const trendExplanation = r?.trend === "uptrend" ? "EMA9 is above EMA20, both are rising, and price remains above EMA20."
    : r?.trend === "downtrend" ? "EMA9 is below EMA20, both are falling, and price remains below EMA20."
    : r?.trend === "sideways" ? "Both moving averages are relatively flat compared with the recent true range."
    : r?.trend === "mixed" ? "Moving-average direction, alignment and price position do not agree on one trend." : "";
  const momentum = r?.rsiDirection === "falling" ? "Momentum easing" : r?.rsiDirection === "rising" ? "Momentum increasing"
    : r?.rsiDirection === "recovered_above_oversold" ? "Recovering from oversold" : r?.rsiDirection === "little_changed" ? "Little momentum change" : "—";
  const condition = r?.rsiCondition === "oversold" ? "Oversold" : r?.rsiCondition === "overbought" ? "Overbought"
    : r?.rsiCondition === "below_midpoint" ? "Below 50" : r?.rsiCondition === "above_midpoint" ? "Above 50" : r?.rsiCondition === "at_midpoint" ? "At 50" : "";
  const momentumExplanation = finite(r?.rsiChange) ? `RSI ${r.rsiChange > 0 ? "rose" : r.rsiChange < 0 ? "fell" : "changed"} ${Math.abs(r.rsiChange).toFixed(1)} points over three completed candles${condition ? `; currently ${condition.toLowerCase()}` : ""}.` : "";
  const rsiExplanation = r?.rsiCondition === "oversold" ? "Below 30; recent losses outweigh gains. Oversold alone does not establish a reversal."
    : r?.rsiCondition === "overbought" ? "Above 70; buying pressure is elevated and can remain elevated during a strong run."
    : r?.rsiCondition === "below_midpoint" ? "Recent losses outweigh gains over the RSI lookback."
    : r?.rsiCondition === "above_midpoint" ? "Recent gains outweigh losses over the RSI lookback."
    : r?.rsiCondition === "at_midpoint" ? "Recent gains and losses are balanced." : "";
  const vwapPosition = finite(input.vwap) && finite(input.livePrice) ? input.livePrice > input.vwap ? "above" : input.livePrice < input.vwap ? "below" : "at" : null;
  const baselineLabel = input.timeframe === "1d" ? "completed trading days" : `completed ${timeframe} candles in the same session`;
  let volumeValue = finite(r?.volume) ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(r.volume) : "—";
  let volumeExplanation = finite(r?.volume) ? `Shares traded in the latest completed ${timeframe} candle.` : "";
  if (finite(r?.volumeRatio)) {
    volumeValue += ` · ${r.volumeRatio.toFixed(2)}× baseline`;
    volumeExplanation = `${r.volumeState === "above_baseline" ? "Above" : r.volumeState === "below_baseline" ? "Below" : "Near"} the average of the preceding ${r.volumeBaselineBars} ${baselineLabel}.`;
  } else if (finite(r?.volumeChangePercent)) {
    volumeValue += ` · ${r.volumeChangePercent >= 0 ? "+" : ""}${r.volumeChangePercent.toFixed(1)}%`;
    volumeExplanation = `Compared with the previous completed ${timeframe} candle; not a mature volume baseline.`;
  }
  if (input.timeframe === "1d" && r && new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23" }).format(r.dataThrough) === "13") {
    volumeExplanation += " This was a shortened trading session.";
  }
  return [
    { label: "Trend", value: trend, explanation: trendExplanation },
    { label: "Momentum", value: momentum, explanation: momentumExplanation },
    { label: "RSI", value: finite(r?.rsi14) ? `${r.rsi14.toFixed(1)}${condition ? ` · ${condition}` : ""}` : "—", explanation: rsiExplanation },
    { label: "VWAP", value: indicatorPrice(input.vwap), explanation: finite(input.vwap)
      ? `${vwapPosition ? `Live price is ${vwapPosition} today's` : "Today's"} VWAP (including extended hours).` : "" },
    { label: "Moving averages", value: `EMA9 ${indicatorPrice(r?.ema9)} · EMA20 ${indicatorPrice(r?.ema20)}`,
      explanation: finite(r?.ema9) && finite(r?.ema20) ? `The faster average is ${r.ema9 > r.ema20 ? "above" : r.ema9 < r.ema20 ? "below" : "equal to"} the slower average.` : "" },
    { label: "Volume", value: volumeValue, explanation: volumeExplanation },
    { label: "ATR", value: finite(r?.atr14) ? `${indicatorPrice(r.atr14)}${finite(r.atrPercent) ? ` · ${r.atrPercent.toFixed(1)}%` : ""}` : "—",
      explanation: finite(r?.atr14) ? `Wilder average true range over 14 ${timeframe} candles${r.volatility ? `; ${r.volatility === "expanding" ? "expanding" : r.volatility === "contracting" ? "contracting" : "steady"} versus recent ATR` : ""}.` : "" },
  ];
}
