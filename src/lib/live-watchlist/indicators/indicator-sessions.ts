import type { IndicatorCandle, IndicatorTimeframe } from "./indicator-engine";
import type { IndicatorHistoryBar } from "./indicator-history-provider";

/** Consumes the existing verified exchange-calendar snapshot, without a Coach runtime dependency. */
export type IndicatorCalendar = Readonly<{
  calendarId: string;
  timezone: "America/New_York";
  coverage: Readonly<{ startDate: string; endDate: string; verificationStatus: string }>;
  closedDates: readonly string[];
  earlyCloseSessions: readonly Readonly<{ date: string; postMarketEndEastern: string }>[];
  normalWeekdaySession: Readonly<{ postMarketEndEastern: string }>;
}>;
export type IndicatorTradingDay = Readonly<{
  date: string; calendarId: string; earlyClose: boolean;
  preOpen: number; regularOpen: number; regularClose: number; postClose: number;
}>;
const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" });
export function indicatorMarketDate(time: number): string {
  const parts = Object.fromEntries(dateFormatter.formatToParts(time).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function wallTime(date: string, time: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/u.test(time)) throw Error("indicator_calendar_invalid_time");
  const midday = Date.parse(`${date}T12:00:00Z`);
  if (!Number.isFinite(midday) || new Date(midday).toISOString().slice(0, 10) !== date) throw Error("indicator_calendar_invalid_date");
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" })
    .formatToParts(midday).find(part => part.type === "timeZoneName")?.value;
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/u.exec(offset ?? "");
  if (!match) throw Error("indicator_calendar_offset_unavailable");
  const offsetMinutes = (Number(match[2]) * 60 + Number(match[3] ?? 0)) * (match[1] === "+" ? 1 : -1);
  return Date.parse(`${date}T${time}:00Z`) - offsetMinutes * 60_000;
}

/** null = closed; undefined = calendar does not establish this date. No guessed future holidays. */
export function indicatorTradingDay(calendar: IndicatorCalendar, date: string): IndicatorTradingDay | null | undefined {
  let dates = dayCache.get(calendar);
  if (!dates) { dates = new Map(); dayCache.set(calendar, dates); }
  if (dates.has(date)) return dates.get(date);
  const result = calculateTradingDay(calendar, date);
  if (dates.size >= 1024) dates.delete(dates.keys().next().value!);
  dates.set(date, result);
  return result;
}
// Calendar snapshots are immutable/versioned. Replacing the snapshot also replaces its cache.
const dayCache = new WeakMap<IndicatorCalendar, Map<string, IndicatorTradingDay | null | undefined>>();
function calculateTradingDay(calendar: IndicatorCalendar, date: string): IndicatorTradingDay | null | undefined {
  if (calendar.timezone !== "America/New_York" || calendar.coverage.verificationStatus !== "verified"
    || date < calendar.coverage.startDate || date > calendar.coverage.endDate) return undefined;
  const noon = wallTime(date, "12:00"), weekday = new Date(noon).getUTCDay();
  if (weekday === 0 || weekday === 6 || calendar.closedDates.includes(date)) return null;
  const early = calendar.earlyCloseSessions.find(day => day.date === date);
  const result = { date, calendarId: calendar.calendarId, earlyClose: Boolean(early),
    preOpen: wallTime(date, "04:00"), regularOpen: wallTime(date, "09:30"),
    regularClose: wallTime(date, early ? "13:00" : "16:00"),
    postClose: wallTime(date, early?.postMarketEndEastern ?? calendar.normalWeekdaySession.postMarketEndEastern) };
  if (!(result.preOpen < result.regularOpen && result.regularOpen < result.regularClose && result.regularClose < result.postClose)) {
    throw Error("indicator_calendar_session_invalid");
  }
  return result;
}
export function indicatorSessionWindow(day: IndicatorTradingDay, time: number): Readonly<{ key: string; start: number; end: number }> | null {
  if (time >= day.preOpen && time < day.regularOpen) return { key: `${day.date}:pre`, start: day.preOpen, end: day.regularOpen };
  if (time >= day.regularOpen && time < day.regularClose) return { key: `${day.date}:regular`, start: day.regularOpen, end: day.regularClose };
  if (time >= day.regularClose && time < day.postClose) return { key: `${day.date}:post`, start: day.regularClose, end: day.postClose };
  return null;
}

export type IndicatorSessionNormalization = Readonly<{
  candles: readonly IndicatorCandle[];
  excluded: Readonly<{ calendarUnavailable: number; closedSession: number; incomplete: number; alignment: number }>;
}>;
export function normalizeIndicatorSessions(input: Readonly<{
  bars: readonly IndicatorHistoryBar[]; timeframe: IndicatorTimeframe; calendar: IndicatorCalendar; completedThrough: number;
}>): IndicatorSessionNormalization {
  const excluded = { calendarUnavailable: 0, closedSession: 0, incomplete: 0, alignment: 0 };
  const candles: IndicatorCandle[] = [];
  const duration = { "1m": 60_000, "5m": 300_000, "15m": 900_000, "1d": 0 }[input.timeframe];
  for (const bar of input.bars) {
    const day = indicatorTradingDay(input.calendar, indicatorMarketDate(bar.start));
    if (day === undefined) { excluded.calendarUnavailable++; continue; }
    if (day === null) { excluded.closedSession++; continue; }
    if (input.timeframe === "1d") {
      if (day.regularClose > input.completedThrough) { excluded.incomplete++; continue; }
      candles.push({ ...bar, start: day.regularOpen, end: day.regularClose, sessionKey: `${day.date}:daily` });
      continue;
    }
    const session = indicatorSessionWindow(day, bar.start);
    if (!session) { excluded.closedSession++; continue; }
    if ((bar.start - session.start) % duration !== 0) { excluded.alignment++; continue; }
    const end = bar.start + duration;
    if (end > session.end || end > input.completedThrough) { excluded.incomplete++; continue; }
    candles.push({ ...bar, end, sessionKey: session.key });
  }
  // Provider parsers already deduplicate raw timestamps. Daily normalization can create a new collision.
  candles.sort((a, b) => a.start - b.start);
  for (let i = 1; i < candles.length; i++) if (candles[i].start < candles[i - 1].end) throw Error("indicator_session_candle_overlap");
  return { candles, excluded };
}

/** VWAP completeness is checked minute by minute; pagination success alone is insufficient. */
export function indicatorVwapCoverage(input: Readonly<{
  candles: readonly IndicatorCandle[]; day: IndicatorTradingDay; completedThrough: number;
  confirmedNoTradeMinutes?: ReadonlySet<number>;
}>): Readonly<{ complete: boolean; expectedMinutes: number; missingMinutes: number; through: number }> {
  const through = Math.min(input.day.postClose, Math.floor(input.completedThrough / 60_000) * 60_000);
  if (through <= input.day.preOpen) return { complete: false, expectedMinutes: 0, missingMinutes: 0, through };
  const bars = new Set(input.candles.filter(c => c.end - c.start === 60_000 && c.start >= input.day.preOpen && c.end <= through).map(c => c.start));
  let missingMinutes = 0;
  for (let time = input.day.preOpen; time < through; time += 60_000) {
    if (!bars.has(time) && !input.confirmedNoTradeMinutes?.has(time)) missingMinutes++;
  }
  return { complete: missingMinutes === 0, expectedMinutes: (through - input.day.preOpen) / 60_000, missingMinutes, through };
}
