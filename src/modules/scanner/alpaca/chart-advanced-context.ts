import { CHART_FRAME_SECONDS, chartCalendarPeriodStart, easternDayStart, isCalendarChartTimeframe, nextChartCalendarPeriod, usesDailyCandles, type Candle, type ChartTimeframe, type DisplayCandle } from "./candles";
import { calculationInterval } from "./chart-calculation-intervals";
import type { ChartSessionCalendar } from "./chart-calendar";
import type { ChartPreferences } from "./chart-preferences";
import { CHART_HISTORY_FLOOR } from "./chart-history";

type Sessions = Pick<ChartPreferences, "regular" | "premarket" | "postmarket">;
type TimeRange = { from: number; to: number };
export type ProfileWindow = { start: number; end: number; firstTime: number; lastTime: number };
type PivotLevel = Pick<Candle, "time" | "high" | "low" | "close">;

/** Read only from a provider page accepted for this history and price basis. */
export function chartPageCoverageStart(nextBefore: unknown): number {
  if (nextBefore === null) return CHART_HISTORY_FLOOR / 1000;
  if (typeof nextBefore !== "number" || !Number.isSafeInteger(nextBefore) || nextBefore < CHART_HISTORY_FLOOR) return Infinity;
  return (nextBefore + 1) / 1000;
}

export function profileWindowsWithinCoverage(windows: readonly ProfileWindow[], coveredFrom: number): ProfileWindow[] {
  return windows.filter(window => coveredFrom <= window.start);
}

function nextEasternDay(time: number) {
  return easternDayStart(easternDayStart(time) + 36 * 3600);
}

function chartBucketEnd(time: number, frame: ChartTimeframe) {
  if (isCalendarChartTimeframe(frame)) return nextChartCalendarPeriod(time, frame);
  if (frame === "1D") return nextEasternDay(time);
  return time + CHART_FRAME_SECONDS[frame];
}

/** A forming right-leg candle cannot confirm a Zig Zag pivot. */
export function completedSwingBars(
  bars: readonly Candle[], frame: ChartTimeframe, sessions: Sessions, calendar: ChartSessionCalendar, now: number,
): readonly Candle[] {
  const last = bars.at(-1);
  if (!last) return bars;
  let end = chartBucketEnd(last.time, frame);
  if (frame === "1D") {
    const session = calendar.sessionAt(last.time);
    if (session) end = session.start + session.closeMinute * 60;
  } else if (!usesDailyCandles(frame)) {
    try { end = calculationInterval(last.time, frame, sessions, calendar).close; } catch { /* Use the bucket end without a session record. */ }
  }
  return end > now ? bars.slice(0, -1) : bars;
}

export function visibleProfileWindow(axis: readonly DisplayCandle[], range: TimeRange | null, frame: ChartTimeframe): ProfileWindow | undefined {
  if (!range || range.to < 0 || range.from > axis.length - 1) return;
  const first = axis[Math.max(0, Math.ceil(range.from))];
  const last = axis[Math.min(axis.length - 1, Math.floor(range.to))];
  if (!first || !last || first.time > last.time) return;
  return { start: first.time, end: chartBucketEnd(last.time, frame), firstTime: first.time, lastTime: last.time };
}

export function sessionProfileWindows(
  axis: readonly DisplayCandle[], visible: ProfileWindow, frame: ChartTimeframe,
  sessions: Sessions, calendar: ChartSessionCalendar,
): ProfileWindow[] {
  const groupFrame = frame === "1D" ? "1M" : isCalendarChartTimeframe(frame) ? frame : "1D";
  const results: ProfileWindow[] = [];
  let current: ProfileWindow | undefined;
  let groupStart = 0;
  let groupEnd = 0;
  for (const bar of axis) {
    if (bar.time < groupStart || bar.time >= groupEnd) {
      if (groupFrame === "1D") {
        const session = calendar.sessionAt(bar.time);
        if (!session) continue;
        groupStart = session.start;
        groupEnd = session.end;
        const from = sessions.premarket ? 240 : sessions.regular ? 570 : session.closeMinute;
        const through = sessions.postmarket ? session.closeMinute + 240 : sessions.regular ? session.closeMinute : 570;
        current = { start: groupStart + from * 60, end: groupStart + through * 60, firstTime: bar.time, lastTime: bar.time };
      } else {
        groupStart = chartCalendarPeriodStart(bar.time, groupFrame);
        groupEnd = nextChartCalendarPeriod(groupStart, groupFrame);
        current = { start: groupStart, end: groupEnd, firstTime: bar.time, lastTime: bar.time };
      }
      if (groupStart >= visible.end) break;
      if (groupEnd > visible.start) results.push(current);
    } else if (current) {
      current.lastTime = bar.time;
    }
  }
  return results;
}

const exchangeDay = (date: string) => easternDayStart(Date.parse(date + "T12:00:00Z") / 1000);

export function pivotHistoryStart(time: number, frame: ChartTimeframe, calendar: ChartSessionCalendar): number {
  if (!usesDailyCandles(frame)) {
    const previous = calendar.knownSessions().findLast(session => exchangeDay(session.date) < easternDayStart(time));
    return previous ? exchangeDay(previous.date) : time - 10 * 86_400;
  }
  return chartCalendarPeriodStart(time, frame === "1D" || frame === "1W" ? "1M" : "1Y", -1);
}

export function standardPivotLevels(
  axis: readonly DisplayCandle[], daily: readonly Candle[], frame: ChartTimeframe, calendar: ChartSessionCalendar,
): PivotLevel[] {
  const results: PivotLevel[] = [];
  if (!axis.length || !daily.length) return results;

  if (!usesDailyCandles(frame)) {
    const sessions = calendar.knownSessions().map(row => exchangeDay(row.date));
    const days = new Map(daily.map(bar => [bar.time, bar]));
    const previous = new Map(sessions.slice(1).map((start, i) => [start, sessions[i]]));
    const datedLevels = new Map<number, Candle | null>();
    for (const bar of axis) {
      const session = calendar.sessionAt(bar.time);
      if (!session) continue;
      if (!datedLevels.has(session.start)) {
        const prior = previous.get(session.start);
        const source = prior === undefined ? undefined : days.get(prior);
        let complete = source !== undefined;
        if (source) {
          // A calendar gap leaves the previous session unknown.
          for (let time = nextEasternDay(source.time); time <= session.start; time = nextEasternDay(time)) {
            if (!calendar.covers(time)) { complete = false; break; }
          }
        }
        datedLevels.set(session.start, complete && source ? source : null);
      }
      const source = datedLevels.get(session.start);
      if (source) results.push({ time: bar.time, high: source.high, low: source.low, close: source.close });
    }
    return results;
  }

  const period = frame === "1D" || frame === "1W" ? "1M" : "1Y";
  const periods = new Map<number, PivotLevel>();
  for (const bar of daily) {
    const start = chartCalendarPeriodStart(bar.time, period);
    const previous = periods.get(start);
    periods.set(start, { time: start, high: Math.max(previous?.high ?? bar.high, bar.high),
      low: Math.min(previous?.low ?? bar.low, bar.low), close: bar.close });
  }
  const verifiedStart = daily[0].time;
  const sessions = calendar.knownSessions().map(row => exchangeDay(row.date));
  const confirmed = new Map<number, PivotLevel>();
  for (const [start, source] of periods) {
    const end = nextChartCalendarPeriod(start, period);
    const firstSession = sessions.find(time => time >= start);
    if (firstSession === undefined || firstSession >= end || verifiedStart > firstSession) continue;
    // Know the source period before considering it complete, including holidays.
    let covered = true;
    for (let time = start; time < end; time = nextEasternDay(time)) {
      if (!calendar.covers(time)) { covered = false; break; }
    }
    if (covered) confirmed.set(start, source);
  }
  for (const bar of axis) {
    const source = confirmed.get(chartCalendarPeriodStart(bar.time, period, -1));
    if (source) results.push({ ...source, time: bar.time });
  }
  return results;
}
