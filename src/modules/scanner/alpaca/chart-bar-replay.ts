import { aggregateCandles, easternDayStart, type Candle, type ChartTimeframe } from "./candles";
import type { ChartPreferences } from "./chart-preferences";
import { calendarDate, type ChartSessionCalendar } from "./chart-calendar";
import { visibleSessionBars } from "./chart-indicators";

export const REPLAY_TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h"] as const;

export function replayDateWindow(date: string) {
  if (!calendarDate(date)) throw Error("invalid_replay_date");
  const noon = Date.parse(date + "T12:00:00Z");
  return { start: easternDayStart(noon / 1_000), end: easternDayStart(noon / 1_000 + 86_400) };
}

export function replayCandles(
  input: readonly Candle[], date: string, timeframe: ChartTimeframe, preferences: ChartPreferences,
  calendar: ChartSessionCalendar,
) {
  const { start, end } = replayDateWindow(date);
  if (!calendar.covers(start)) throw Error("replay_calendar_unavailable");
  const withinDay = input.filter(bar => bar.time >= start && bar.time < end);
  const regularOnly = preferences.regular && !preferences.premarket && !preferences.postmarket;
  return aggregateCandles(visibleSessionBars(withinDay, preferences, calendar), timeframe, regularOnly);
}
