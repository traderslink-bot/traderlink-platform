import "server-only";

import { createHash } from "node:crypto";

import { completedRegularIntradayCandle } from "@/src/modules/market-data/chart-evidence/completed-candles";
import type { ChartEvidenceBasis, ChartEvidenceInterval } from "@/src/modules/market-data/chart-evidence/contracts";
import type { Candle } from "@/src/modules/scanner/alpaca/candles";
import type { ChartSessionCalendar } from "@/src/modules/scanner/alpaca/chart-calendar";
import { easternClock } from "@/src/modules/scanner/live/sessions";

type AcceptedRead = Readonly<{
  feed: unknown;
  adjustment: unknown;
  frame: unknown;
  basisDate: unknown;
  end: unknown;
  bars: unknown;
  coverage: unknown;
}>;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function minuteBar(value: unknown, coverage: ChartEvidenceInterval): Candle | null {
  if (!record(value)) return null;
  const { time, open, high, low, close, volume } = value;
  if (typeof time !== "number" || !Number.isSafeInteger(time) || time % 60 ||
    time < coverage.start || time >= coverage.end ||
    typeof open !== "number" || typeof high !== "number" ||
    typeof low !== "number" || typeof close !== "number" ||
    typeof volume !== "number" || ![open, high, low, close, volume].every(v => Number.isFinite(v) && v > 0) ||
    low > Math.min(open, close) || high < Math.max(open, close)) return null;
  return { time, open, high, low, close, volume };
}

/** Accept a complete, bound neutral cache reply using the originating request window and the verified chart calendar. */
export function acceptFourHourCandle({
  reply, window, calendar, basis, receivedAt, acceptedAt, cutoff,
}: {
  reply: AcceptedRead;
  window: ChartEvidenceInterval;
  calendar: ChartSessionCalendar;
  basis: ChartEvidenceBasis;
  receivedAt: number;
  acceptedAt: number;
  cutoff: number;
}) {
  const unavailable = { state: "unavailable" } as const;
  if (basis.sessionMode !== "regular" ||
    !Number.isSafeInteger(window.start) || !Number.isSafeInteger(window.end) ||
    window.end - window.start !== 14_400 ||
    reply.feed !== "sip" || reply.adjustment !== "split" || reply.frame !== "1m" ||
    reply.end !== window.end * 1000 ||
    reply.basisDate !== easternClock(window.start * 1000).date ||
    !record(reply.bars) || !record(reply.coverage)) return unavailable;

  const day = calendar.sessionAt(window.start);
  if (!day || !calendar.covers(window.start)) return unavailable;
  const session = { start: day.start + 570 * 60, end: day.start + day.closeMinute * 60 };
  if (window.start < session.start || window.end > session.end) return unavailable;

  const completion = reply.coverage[basis.symbol];
  const rawBars = reply.bars[basis.symbol];
  if (!record(completion) || completion.status !== "complete" ||
    completion.completedThroughMs !== window.end * 1000 || !Array.isArray(rawBars) || rawBars.length > 240) return unavailable;

  const bars: Candle[] = [];
  for (const raw of rawBars) {
    const bar = minuteBar(raw, window);
    if (!bar || (bars.length && bar.time <= bars[bars.length - 1].time)) return unavailable;
    bars.push(bar);
  }
  const revision = createHash("sha256").update(JSON.stringify([
    basis.instrumentId, basis.venue, basis.symbol, basis.seriesId, basis.priceBasisId,
    basis.sessionMode, basis.calendarRevision, basis.aggregationVersion, window.start, window.end, bars,
  ])).digest("hex");
  const result = completedRegularIntradayCandle({
    snapshot: { basis, revision, receivedAt, acceptedAt, coverage: window, bars },
    session, frame: "4h", time: window.start, cutoff,
  });
  if (result.state === "ready" && (result.candle.shortened || result.candle.interval.start !== window.start)) return unavailable;
  return result;
}
