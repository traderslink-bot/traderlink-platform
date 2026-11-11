import type { Time } from "lightweight-charts";
import type { ChartTimeframe } from "./candles";
const date = new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",month:"short",day:"numeric"});
const clock = new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit"});
export function chartTickLabel(time: Time, timeframe: ChartTimeframe, dayBoundary: boolean, timezone="America/New_York"): string {
  const showDate = timeframe === "1D" || dayBoundary;
  if(typeof time!=="number")return String(time);
  return (timezone==="America/New_York"?(showDate?date:clock):new Intl.DateTimeFormat("en-US",{timeZone:timezone,...(showDate?{month:"short",day:"numeric"} as const:{hour:"numeric",minute:"2-digit"} as const)})).format(time*1000);
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
