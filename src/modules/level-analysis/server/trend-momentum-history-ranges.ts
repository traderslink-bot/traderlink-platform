import type { IndicatorHistoryRange } from "@/src/lib/trade-candle-analysis/trend-momentum-history";
import { newYorkExtendedSession } from "./daily-trade-analyzer-session";

/** Bounded weekday windows, not a claim that each date had a trading session. */
export function priorIndicatorHistoryRanges(tradingDate: string): readonly IndicatorHistoryRange[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tradingDate)) throw new Error("indicator_history_date_invalid");
  const anchor = new Date(`${tradingDate}T12:00:00.000Z`);
  if (!Number.isFinite(anchor.getTime()) || anchor.toISOString().slice(0, 10) !== tradingDate) {
    throw new Error("indicator_history_date_invalid");
  }
  const ranges: IndicatorHistoryRange[] = [];
  for (let offset = 1; offset <= 16 && ranges.length < 10; offset++) {
    const day = new Date(anchor);
    day.setUTCDate(day.getUTCDate() - offset);
    if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
    const session = newYorkExtendedSession(day.toISOString().slice(0, 10));
    if (!session) throw new Error("indicator_history_session_invalid");
    ranges.push(Object.freeze({ start: session.startTime, endExclusive: session.endTime }));
  }
  // Holidays may return complete empty history. Retain that evidence, do not retry it.
  return Object.freeze(ranges);
}
