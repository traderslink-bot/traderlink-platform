import type { AcceptedInputCandle, AcceptedScannerDailyContext, ClosedScannerReturn, QualifiedInputSeries } from "../../market-data/accepted-series/publisher";
import { easternClock } from "../live/sessions";
import { ALPACA_NATIVE_DAILY_DATASET } from "./rest-data";
import { ChartSessionCalendar, type ChartCalendar } from "./chart-calendar";

const dayMs = 86_400_000;
const noon = (date: string) => Date.parse(date + "T12:00:00Z");

function weekStart(date: string) {
  const stamp = noon(date);
  return stamp - ((new Date(stamp).getUTCDay() + 6) % 7) * dayMs;
}

function closedReturn(previous: AcceptedInputCandle | undefined, current: AcceptedInputCandle | undefined): ClosedScannerReturn | undefined {
  if (!previous || !current) return;
  const previousClose = previous[5], close = current[5];
  if (previousClose <= 0 || close <= 0) return;
  const changePercent = (close / previousClose - 1) * 100;
  if (Number.isFinite(changePercent)) return { previousClose, close, changePercent, closedAtMs: current[1] };
}

/** Derive close-to-close facts only from the verified native Daily input already bound by the issuer. */
export function nativeDailyScannerContext(series: QualifiedInputSeries, calendars: readonly ChartCalendar[]): AcceptedScannerDailyContext | undefined {
  if (series.frame !== "daily" || series.datasetId !== ALPACA_NATIVE_DAILY_DATASET || series.sessionMode !== "extended") return;
  const index = new ChartSessionCalendar();
  for (const calendar of calendars) index.merge(calendar);
  const rows = series.rows.filter(row => row[1] <= series.completedThroughMs && row[1] <= series.acceptedCutoffMs);
  const byDate = new Map(rows.map(row => [easternClock(row[0]).date, row]));
  const weeks = new Map<number, string[]>();
  for (const session of index.knownSessions()) {
    const key = weekStart(session.date);
    const week = weeks.get(key) ?? [];
    week.push(session.date);
    weeks.set(key, week);
  }
  const completedWeeks = [...weeks].flatMap(([monday, dates]) => {
    for (let offset = 0; offset < 7; offset++) {
      if (!index.covers((monday + offset * dayMs) / 1_000)) return [];
    }
    if (dates.some(date => !byDate.has(date))) return [];
    return [{ monday, final: byDate.get(dates[dates.length - 1]) }];
  });
  const first = completedWeeks.at(-2), last = completedWeeks.at(-1);
  return {
    daily: closedReturn(rows.at(-2), rows.at(-1)),
    weekly: first && last && last.monday - first.monday === 7 * dayMs
      ? closedReturn(first.final, last.final) : undefined,
  };
}
