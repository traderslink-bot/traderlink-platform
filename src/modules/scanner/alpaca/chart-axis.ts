import type { Time } from "lightweight-charts";
import { usesDailyCandles, type ChartTimeframe } from "./candles";
const date = new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",month:"short",day:"numeric"});
const clock = new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit"});
const periodFormats = {
  "1M": new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", year: "numeric" }),
  "1Y": new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric" }),
};

export function createChartTickFormatter(timeframe: ChartTimeframe, timezone="America/New_York") {
  const period = timeframe === "1M" || timeframe === "1Y" ? periodFormats[timeframe] : undefined;
  const dayFormat = timezone === "America/New_York" ? date
    : new Intl.DateTimeFormat("en-US", { timeZone: timezone, month: "short", day: "numeric" });
  const timeFormat = timezone === "America/New_York" ? clock
    : new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", minute: "2-digit" });
  const daily = usesDailyCandles(timeframe);
  return (time: Time | number, dayBoundary: boolean): string => {
    if (typeof time !== "number") return String(time);
    return (period ?? (daily || dayBoundary ? dayFormat : timeFormat)).format(time * 1000);
  };
}
export function firstVisibleChartTime(points: readonly { time: number }[], range: { from: number; to: number } | null) {
  if (!range || range.to < 0) return undefined;
  const first = Math.max(0, Math.ceil(range.from));
  return first <= range.to ? points[first]?.time : undefined;
}


export function isChartDateStart(points: readonly { time: number }[], time: number, dayKey: (time: number) => string): boolean {
  let low = 0, high = points.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (points[middle].time < time) low = middle + 1;
    else high = middle;
  }
  return low === 0 || points[low]?.time !== time || dayKey(points[low - 1].time) !== dayKey(time);
}
