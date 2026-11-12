import {easternDayStart} from "./candles";
import type { Candle } from "./candles";

export const CHART_HISTORY_FLOOR = Date.UTC(2016, 0, 1);
const day = 86_400_000;
const easternDate = new Intl.DateTimeFormat("en-CA", {timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});
export function chartHistoryWindow(before: string | null, daily: boolean, now = Date.now(), recent = false) {
  const end = before === null ? Math.floor(now/60_000)*60_000-1 : Number(before);
  if (!Number.isSafeInteger(end) || end < CHART_HISTORY_FLOOR || end > now + 60_000) throw Error("invalid_history_range");
  const earliest=end-(daily ? 3650 : recent && before === null ? 7 : 21) * day;
  // Include whole market dates so an older page cannot begin inside a 1h/4h candle.
  return {start:Math.max(CHART_HISTORY_FLOOR,daily?earliest:easternDayStart(earliest/1000)*1000),end,initial:before===null};
}
export function chartHistoryPage(bars: Candle[], window: ReturnType<typeof chartHistoryWindow>, daily: boolean) {
  const ordered=[...new Map(bars.map(bar=>[bar.time,bar])).values()].sort((a,b)=>a.time-b.time);
  const dates=[...new Set(ordered.map(bar=>easternDate.format(bar.time*1000)))];
  const retained=window.initial&&!daily&&dates.length>10?new Set(dates.slice(-10)):null;
  const result=retained?ordered.filter(bar=>retained.has(easternDate.format(bar.time*1000))):ordered;
  const nextBefore=(retained&&result.length?result[0].time*1000:window.start)-1;
  return {bars:result,nextBefore:nextBefore>=CHART_HISTORY_FLOOR?nextBefore:null,adjustment:"split"};
}
