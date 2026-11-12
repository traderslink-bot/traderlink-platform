import { calculateIndicatorHistory, calculateSessionVwap } from "@/src/lib/live-watchlist/indicators/indicator-engine";
import { aggregateCandles, type Candle } from "@/src/modules/scanner/alpaca/candles";
import { indicatorMarketDate, indicatorSessionWindow, indicatorTradingDay, normalizeIndicatorSessions, type IndicatorCalendar } from "@/src/lib/live-watchlist/indicators/indicator-sessions";
import exchangeCalendar from "@/src/modules/coach/server/market-calendar/us-equities-review-calendar.v1.json";
import { calendarDate, parseCalendarSessions, type ChartCalendar } from "@/src/modules/scanner/alpaca/chart-calendar";
import type { ScannerIndicatorFrame } from "./scanner-indicator-read";

const fallbackCalendar = exchangeCalendar as IndicatorCalendar;

export function historyCalendar(payload: ChartCalendar | undefined): IndicatorCalendar {
  if (!payload?.available || !calendarDate(payload.start) || !calendarDate(payload.end)) return fallbackCalendar;
  const start = Date.parse(payload.start), end = Date.parse(payload.end);
  if (end < start || end - start > 31 * 86_400_000) return fallbackCalendar;
  try {
    const sessions = parseCalendarSessions(payload.sessions, payload.start, payload.end);
    const active = new Set(sessions.map(session => session.date));
    const closedDates: string[] = [];
    for (let day = start; day <= end; day += 86_400_000) {
      const date = new Date(day).toISOString().slice(0, 10);
      if (!active.has(date)) closedDates.push(date);
    }
    return { ...fallbackCalendar, calendarId:"alpaca-chart-calendar", closedDates,
      coverage: { ...fallbackCalendar.coverage, startDate:payload.start, endDate:payload.end },
      earlyCloseSessions:sessions.filter(session=>session.close==="13:00")
        .map(session=>({date:session.date,postMarketEndEastern:"17:00"})) };
  } catch { return fallbackCalendar; }
}
const asHistoryBar = (bar: Candle) => ({ ...bar, start: bar.time * 1000 });

export function scannerIndicatorResults(bars: readonly Candle[], frame: ScannerIndicatorFrame, through: number, calendar = fallbackCalendar) {
  const duration = Number.parseInt(frame, 10) * 60_000;
  const complete = bars.filter(bar => bar.time * 1000 + 60_000 <= through);
  const frameBars = aggregateCandles(complete, frame)
    .filter(bar => bar.time * 1000 + duration <= through).slice(-250);
  const { candles } = normalizeIndicatorSessions({ bars: frameBars.map(asHistoryBar), timeframe: frame, calendar, completedThrough: through });
  const result = calculateIndicatorHistory(candles, frame, `scanner-${frame}`, through).results.at(-1);

  let day;
  for (let i = complete.length - 1; i >= 0; i--) {
    const time = complete[i].time * 1000;
    const candidate = indicatorTradingDay(calendar, indicatorMarketDate(time));
    if (candidate && indicatorSessionWindow(candidate, time)) { day = candidate; break; }
  }
  if (!day) return { result, vwap: null };
  const minuteBars = complete.filter(bar => bar.time * 1000 >= day.preOpen && bar.time * 1000 < day.postClose);
  const minutes = normalizeIndicatorSessions({ bars: minuteBars.map(asHistoryBar), timeframe: "1m", calendar, completedThrough: through });
  const vwap = calculateSessionVwap({ candles: minutes.candles, sessionStart: day.preOpen, sessionEnd: day.postClose,
    completedThrough: through, coverageComplete: true });
  return { result, vwap };
}
