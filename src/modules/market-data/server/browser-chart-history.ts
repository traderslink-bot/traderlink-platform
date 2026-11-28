import "server-only";
import { calendarDate, parseCalendarSessions } from "@/src/modules/scanner/alpaca/chart-calendar";
import type { Candle } from "@/src/modules/scanner/alpaca/candles";
import { chartSymbol } from "@/src/modules/scanner/alpaca/candles";

type RecordValue = Record<string, unknown>;
const object = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};

export function browserCandle(value: unknown): Candle {
  const row = object(value), fields = ["time", "open", "high", "low", "close", "volume"] as const;
  if (!fields.every(key => typeof row[key] === "number" && Number.isFinite(row[key]))) throw Error("invalid_chart_bar");
  return Object.fromEntries(fields.map(key => [key, row[key]])) as Candle;
}

/** Calendar metadata is not part of session facts, including inside each row. */
export function browserChartCalendar(value: unknown): RecordValue {
  const row = object(value);
  if (row.available !== true) return { available: false };
  if (!calendarDate(row.start) || !calendarDate(row.end)) return { available: false };
  try { return { available: true, start: row.start, end: row.end, sessions: parseCalendarSessions(row.sessions, row.start, row.end) }; }
  catch { return { available: false }; }
}

/** Public history is a chart contract, never an upstream response envelope. */
export function browserChartHistory(payload: RecordValue): RecordValue {
  const result: RecordValue = { feed: "traderslink", bars: Array.isArray(payload.bars) ? payload.bars.map(browserCandle) : [] };
  const checks: Record<string, (value: unknown) => boolean> = {
    symbol: value => typeof value === "string" && chartSymbol(value) === value,
    baseTimeframe: value => value === "1m" || value === "1D",
    adjustment: value => value === "split" || value === "raw",
    basisDate: calendarDate,
    complete: value => typeof value === "boolean",
    nextBefore: value => value === null || typeof value === "number" && Number.isFinite(value),
    catchUpFrom: value => typeof value === "number" && Number.isFinite(value),
  };
  for (const [field, valid] of Object.entries(checks)) if (payload[field] !== undefined) {
    if (!valid(payload[field])) throw Error("invalid_chart_history");
    result[field] = payload[field];
  }
  if (payload.corrections !== undefined) {
    const corrected = object(payload.corrections);
    const timestamps = (values: unknown): number[] => {
      if (!Array.isArray(values) || values.length > 4_096 || values.some((time, index) =>
        !Number.isSafeInteger(time) || time <= 0 || time % 60 || index > 0 && values[index - 1] >= time))
        throw Error("invalid_chart_history");
      return [...values];
    };
    if (corrected.source !== "alpaca-sip") throw Error("invalid_chart_history");
    result.corrections = { source: "alpaca-sip", times: timestamps(corrected.times), pending: timestamps(corrected.pending) };
  }
  if ("calendar" in payload) result.calendar = browserChartCalendar(payload.calendar);
  if ("calendars" in payload) result.calendars = Array.isArray(payload.calendars) ? payload.calendars.map(browserChartCalendar) : [];
  return result;
}
