import type { IndicatorResult, IndicatorTimeframe } from "./indicator-engine";
export type IndicatorDisplayRow = Readonly<{ label: string; value: string; explanation: string;
  state?: string; tone?: "bullish" | "bearish" | "neutral" | "activity"; calculation?: string }>;
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
  let volumeValue = finite(r?.volume) ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(r.volume) : "Unavailable";
  let volumeExplanation = finite(r?.volume) ? `Shares traded in the latest completed ${timeframe} candle.` : "";
  let volumeState: string | undefined;
  let volumeCalculation: string | undefined;
  if (finite(r?.volume) && finite(r?.volumeRatio)) {
    volumeValue += ` · ${r.volumeRatio.toFixed(2)}× baseline`;
    volumeCalculation = `Compared with the average of the preceding ${r.volumeBaselineBars} ${baselineLabel}. Elevated: at least 1.4×; quiet: at most 0.75×; typical: between those values.`;
    volumeState = r.volumeState === "above_baseline" ? "Elevated activity" : r.volumeState === "below_baseline" ? "Quiet activity" : r.volumeState === "near_baseline" ? "Typical activity" : undefined;
    volumeExplanation = r.volumeState === "above_baseline" ? "More shares are changing hands than recently: trading activity is stronger. This alone does not show whether buyers or sellers are in control."
      : r.volumeState === "below_baseline" ? "Fewer shares are changing hands than recently: participation is lighter. This alone does not establish price direction."
      : "Trading activity is close to its recent average, with no unusual increase or decrease in participation.";
  } else if (finite(r?.volume) && finite(r?.volumeChangePercent)) {
    volumeValue += ` · ${r.volumeChangePercent >= 0 ? "+" : ""}${r.volumeChangePercent.toFixed(1)}%`;
    volumeState = "Early comparison";
    volumeExplanation = `${r.volumeChangePercent > 0 ? "More" : r.volumeChangePercent < 0 ? "Fewer" : "The same number of"} shares traded than in the previous candle. More history is needed to judge whether activity is unusually strong or quiet.`;
    volumeCalculation = `Compared only with the previous completed ${timeframe} candle; a recent-average comparison is not available yet.`;
  }
  if (input.timeframe === "1d" && r && new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23" }).format(r.dataThrough) === "13") {
    volumeExplanation += " This was a shortened trading session.";
  }
  const averagesReady = finite(r?.ema9) && finite(r?.ema20);
  const gap = averagesReady ? r!.ema9! - r!.ema20! : null;
  const mixed = gap !== null && (finite(r?.atr14) && r.atr14 > 0 ? Math.abs(gap) <= r.atr14 * 0.05 : gap === 0);
  const averageState = !averagesReady ? undefined : mixed ? "Mixed alignment" : gap! > 0 ? "Bullish alignment" : "Bearish alignment";
  const averageExplanation = !averagesReady ? "" : mixed ? "The averages are together or very close, with no clear directional advantage."
    : gap! > 0 ? "EMA9 is above EMA20, suggesting short-term price strength. The Trend reading shows whether both averages and price support an uptrend."
    : "EMA9 is below EMA20, suggesting short-term price weakness. The Trend reading shows whether both averages and price support a downtrend.";
  const atrState = !finite(r?.atr14) ? undefined : r.volatility === "expanding" ? "Widening swings" : r.volatility === "contracting" ? "Narrowing swings" : r.volatility === "steady" ? "Steady swings" : "Price swing size";
  const atrExplanation = !finite(r?.atr14) ? "" : `${r.volatility === "expanding" ? "Price swings are getting larger than recently; allow for wider fluctuations." : r.volatility === "contracting" ? "Price swings are getting smaller than recently; current movement is more contained." : r.volatility === "steady" ? "Price swings are similar in size to recent conditions." : "Shows the recent typical size of price swings; a comparison with earlier volatility is not available yet."} ATR measures movement size, not whether price will rise or fall.`;
  return [
    { label: "Trend", value: trend, explanation: trendExplanation },
    { label: "Momentum", value: momentum, explanation: momentumExplanation },
    { label: "RSI", value: finite(r?.rsi14) ? `${r.rsi14.toFixed(1)}${condition ? ` · ${condition}` : ""}` : "—", explanation: rsiExplanation },
    { label: "VWAP", value: finite(input.vwap) ? indicatorPrice(input.vwap) : "Unavailable", explanation: finite(input.vwap)
      ? `${vwapPosition ? `Live price is ${vwapPosition} today's` : "Today's"} VWAP (including extended hours).` : "" },
    { label: "Moving averages", value: `EMA9 ${indicatorPrice(r?.ema9)} · EMA20 ${indicatorPrice(r?.ema20)}`,
      state: averageState, tone: !averagesReady ? undefined : mixed ? "neutral" : gap! > 0 ? "bullish" : "bearish",
      explanation: averageExplanation, calculation: "EMA9 is a 9-period exponential moving average and reacts faster than the 20-period EMA20. Both weight recent prices more heavily. Mixed means their separation is within 5% of ATR, matching the Trend calculation's alignment tolerance. Without ATR, only equal averages are labeled mixed." },
    { label: "Volume", value: volumeValue, explanation: volumeExplanation, state: volumeState, tone: "activity", calculation: volumeCalculation },
    { label: "ATR", value: finite(r?.atr14) ? `${indicatorPrice(r.atr14)}${finite(r.atrPercent) ? ` · ${r.atrPercent.toFixed(1)}%` : ""}` : "—",
      state: atrState, tone: "activity", explanation: atrExplanation,
      calculation: finite(r?.atr14) ? `Wilder average true range over 14 ${timeframe} candles, including gaps. Widening/narrowing compares it with the preceding 20 ATR readings: at least 10% higher/lower. The percentage shown is ATR divided by price, not a forecast.` : undefined },
  ];
}
