import { aggregateCandles, easternDayStart, type Candle } from "../../scanner/alpaca/candles";
import { ChartSessionCalendar } from "../../scanner/alpaca/chart-calendar";
import type { AlpacaHistoryRequest, AlpacaHistoryResult } from "../../scanner/alpaca/rest-data";
import { easternClock } from "../../scanner/live/sessions";
import { CANDLE_HISTORY_FRAMES, type CandleHistorySettings, type HistoryFrame, type HistoryLimit } from "./settings";
import { CandleHistoryStore, type CandleHistorySeries, type HistoryRange } from "./store";

type SeriesWindow = CandleHistorySeries & HistoryRange;
type ArchiveRead = (request: AlpacaHistoryRequest) => Promise<AlpacaHistoryResult>;
export type BackfillWindowDays = 30 | 120;
const day = 86_400;
const dayStart = (date: string) => easternDayStart(Date.parse(date + "T12:00:00Z") / 1_000);

export function retentionCutoff(date: string, limit: HistoryLimit, calendar: ChartSessionCalendar): number | undefined {
  const todayUtc = Date.parse(date + "T12:00:00Z");
  if (limit.unit === "sessions") {
    const sessions = calendar.knownSessions().filter(session => session.date <= date);
    const first = sessions.at(-limit.amount);
    return first && dayStart(first.date);
  }
  let from = new Date(todayUtc);
  if (limit.unit === "days") from = new Date(todayUtc - limit.amount * day * 1_000);
  else {
    const ordinal = from.getUTCDate();
    from.setUTCDate(1);
    from.setUTCMonth(from.getUTCMonth() - limit.amount);
    const monthEnd = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0)).getUTCDate();
    from.setUTCDate(Math.min(ordinal, monthEnd));
  }
  return dayStart(from.toISOString().slice(0, 10));
}

export function historyWindows(symbol: string, basis: string, frame: HistoryFrame, start: number, end: number): SeriesWindow[] {
  if (start >= end) return [];
  if (frame === "1D") return [{ symbol, basis, frame, session: "daily", start, end }];
  return [
    { symbol, basis, frame, session: "extended", start, end },
    { symbol, basis, frame, session: "regular", start, end },
  ];
}

export function candleHistoryTargets(input: {
  symbol: string; basis: string; date: string; calendar: ChartSessionCalendar; settings: CandleHistorySettings;
}): SeriesWindow[] {
  const { symbol, basis, date, calendar, settings } = input;
  const end = dayStart(date);
  return CANDLE_HISTORY_FRAMES.flatMap(frame => {
    const cutoff = retentionCutoff(date, settings.retention[frame], calendar);
    if (cutoff === undefined || !calendar.covers(cutoff) || !calendar.covers(end - 1)) throw Error("history_calendar_unavailable");
    return historyWindows(symbol, basis, frame, cutoff, end);
  });
}

/** Start with the newest missing sessions. Read whole days so aggregations start at their normal boundaries. */
export function nextCandleHistoryGap(store: CandleHistoryStore, targets: readonly SeriesWindow[],
  olderWindowDays: BackfillWindowDays = 30): HistoryRange | undefined {
  let latest: HistoryRange | undefined;
  for (const target of targets) for (const gap of store.missing(target)) {
    if (!latest || gap.end > latest.end || (gap.end === latest.end && gap.start < latest.start)) latest = gap;
  }
  if (!latest) return;
  const dayStartAtEnd = easternDayStart(latest.end);
  const end = dayStartAtEnd === latest.end ? latest.end : easternDayStart(dayStartAtEnd + 36 * 3_600);
  const retainsShortFrames = targets.some(target => (target.frame === "1m" || target.frame === "5m") && target.start < end);
  const days = retainsShortFrames ? 30 : olderWindowDays;
  const start = Math.max(easternDayStart(latest.start), easternDayStart(end - days * day + 12 * 3_600));
  return { start, end };
}

function eligibleMinutes(bars: readonly Candle[], calendar: ChartSessionCalendar, regular: boolean): Candle[] {
  return bars.filter(bar => {
    const interval = calendar.sessionAt(bar.time);
    if (!interval) return false;
    const minute = Math.floor((bar.time - interval.start) / 60);
    return regular ? minute >= 570 && minute < interval.closeMinute : minute >= 240 && minute < 1_200;
  });
}

function aggregateThirtyMinutes(bars: readonly Candle[]) {
  const groups = new Map<number, Candle>();
  for (const bar of bars) {
    const time = Math.floor(bar.time / 1_800) * 1_800;
    const old = groups.get(time);
    groups.set(time, old ? { ...old, high: Math.max(old.high, bar.high), low: Math.min(old.low, bar.low),
      close: bar.close, volume: old.volume + bar.volume } : { ...bar, time });
  }
  return [...groups.values()];
}

/** Backfill one completed, day-aligned span. Use verified empty intervals to avoid retrying quiet symbols. */
export async function fillCandleHistoryWindow(input: {
  store: CandleHistoryStore; read: ArchiveRead; calendar: ChartSessionCalendar; settings: CandleHistorySettings;
  symbol: string; basis: string; window: HistoryRange; now: number; refresh?: boolean; canSave?: () => boolean;
  olderWindowDays?: BackfillWindowDays;
}) {
  const { store, read, calendar, settings, symbol, basis, window, now } = input;
  const today = easternClock(now).date;
  const maxSpan = input.olderWindowDays === 120 ? 120 * day + 3_600 : 35 * day;
  if (easternDayStart(window.start) !== window.start || easternDayStart(window.end) !== window.end ||
    window.end > dayStart(today) || window.start >= window.end || window.end - window.start > maxSpan)
    throw Error("invalid_backfill_window");
  let hasMarketSession = false;
  for (let boundary = window.start; boundary < window.end; boundary = easternDayStart(boundary + 36 * 3_600)) {
    if (!calendar.covers(boundary)) throw Error("history_calendar_unavailable");
    hasMarketSession ||= calendar.sessionAt(boundary) !== null;
  }
  const windows = CANDLE_HISTORY_FRAMES.flatMap(frame => {
    const cutoff = retentionCutoff(today, settings.retention[frame], calendar);
    return cutoff === undefined ? [] : historyWindows(symbol, basis, frame, Math.max(cutoff, window.start), window.end);
  });
  const outstanding = windows.filter(window => input.refresh || store.missing(window).length);
  if (!outstanding.length) return { calls: 0, updatedSeries: 0 };
  if (!hasMarketSession) {
    if (input.canSave && !input.canSave()) throw Error("candle_history_target_changed");
    store.saveVerified(outstanding.map(window => ({ ...window, bars: [] })));
    return { calls: 0, updatedSeries: outstanding.length };
  }
  let calls = 0;
  for (const timeframe of ["1Min", "1Day"] as const) {
    const wanted = outstanding.filter(window => (window.frame === "1D") === (timeframe === "1Day"));
    if (!wanted.length) continue;
    const start = Math.min(...wanted.map(window => window.start));
    const reply = await read({ symbol, timeframe, start: start * 1_000, end: window.end * 1_000 - 1 });
    calls++;
    if (reply.symbol !== symbol || reply.feed !== "sip" || reply.adjustment !== "split" || reply.basisDate !== today ||
        !reply.complete || reply.nextPageToken !== null) throw Error("unqualified_candle_history");
    const bars = [...reply.bars].filter(bar => bar.time >= start && bar.time < window.end).sort((a, b) => a.time - b.time);
    const completed = wanted.map(window => {
      const visible = bars.filter(bar => bar.time >= window.start);
      if (window.frame === "1D") return { ...window, bars: visible };
      const regular = window.session === "regular";
      const eligible = eligibleMinutes(visible, calendar, regular);
      return { ...window, bars: window.frame === "30m" ? aggregateThirtyMinutes(eligible)
        : aggregateCandles(eligible, window.frame, regular) };
    });
    if (input.canSave && !input.canSave()) throw Error("candle_history_target_changed");
    store.saveVerified(completed);
  }
  return { calls, updatedSeries: outstanding.length };
}
