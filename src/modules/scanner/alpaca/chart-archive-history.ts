import { CHART_CALCULATION_TIMEFRAMES, CHART_FRAME_SECONDS, candleBucket, easternDayStart, type Candle, type ChartCalculationTimeframe, type ChartTimeframe } from "./candles";
import { calendarDate } from "./chart-calendar";
import { CHART_HISTORY_FLOOR, chartHistoryWindow } from "./chart-history";
import type { ChartPreferences } from "./chart-preferences";

type ArchiveSession = "regular" | "extended" | "daily";
export type ChartArchiveWindow = {
  frame: ChartCalculationTimeframe;
  session: ArchiveSession;
  start: number;
  end: number;
};
export type ChartArchivePage = {
  state: "ready";
  start: number;
  end: number;
  basisDate: string;
  bars: Candle[];
};

const maxWindowSeconds = 22 * 86_400;

export function parseChartArchiveWindow(query: URLSearchParams, now = Date.now()): ChartArchiveWindow | null {
  const frame = CHART_CALCULATION_TIMEFRAMES.find(value => value === query.get("frame"));
  const session = query.get("session");
  const start = Number(query.get("start"));
  const end = Number(query.get("end"));
  if (!frame) return null;
  if (session !== "regular" && session !== "extended" && session !== "daily") return null;
  if ((frame === "1D") !== (session === "daily") ||
      !Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start < CHART_HISTORY_FLOOR / 1000 || end > Math.floor(now / 1000) ||
      end <= start || end - start > maxWindowSeconds ||
      start % 60 !== 0 || end % 60 !== 0 ||
      candleBucket(start, frame, session === "regular") !== start ||
      candleBucket(end, frame, session === "regular") !== end) return null;
  return { frame, session, start, end };
}

export function chartArchiveWindow(
  before: number,
  frame: ChartTimeframe,
  preferences: Pick<ChartPreferences, "premarket" | "regular" | "postmarket">,
  now = Date.now(),
): ChartArchiveWindow | null {
  const session = frame === "1D" ? "daily" : preferences.regular
    ? !preferences.premarket && !preferences.postmarket ? "regular"
      : preferences.premarket && preferences.postmarket ? "extended" : null
    : null;
  if (!session || frame === "1W" || frame === "1M" || frame === "1Y") return null;
  const boundary = (before + 1) / 1000;
  if (!Number.isSafeInteger(boundary)) return null;
  const end = candleBucket(boundary, frame, session === "regular");
  // Legacy pages can end at Eastern midnight, inside an inactive regular-session bucket.
  const beforeRegularOpen = session === "regular" && boundary < easternDayStart(boundary) + (9 * 60 + 30) * 60;
  if (end !== boundary && !beforeRegularOpen) return null;
  const { start } = chartHistoryWindow(String(before), false, now);
  const bucketStart = candleBucket(start / 1000, frame, session === "regular");
  // A regular-hours bucket can start before midnight. Round the lower bound forward.
  const first = bucketStart < start / 1000 ? candleBucket(start / 1000 + CHART_FRAME_SECONDS[frame], frame, session === "regular") : bucketStart;
  return parseChartArchiveWindow(new URLSearchParams({
    frame, session, start: String(first), end: String(end),
  }), now);
}

export function readChartArchivePage(value: unknown, window: ChartArchiveWindow): ChartArchivePage | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Record<string, unknown>;
  const { state, start, end, basisDate } = payload;
  if (state !== "ready" || start !== window.start || end !== window.end ||
      !calendarDate(basisDate) || !Array.isArray(payload.bars)) return null;
  const bars: Candle[] = [];
  let previous = window.start - 1;
  for (const value of payload.bars) {
    if (!value || typeof value !== "object") return null;
    const { time, open, high, low, close, volume } = value as Record<string, unknown>;
    if (typeof time !== "number" || !Number.isSafeInteger(time) ||
        time <= previous || time >= window.end || candleBucket(time, window.frame, window.session === "regular") !== time ||
        typeof open !== "number" || typeof high !== "number" || typeof low !== "number" ||
        typeof close !== "number" || typeof volume !== "number" ||
        ![open, high, low, close, volume].every(Number.isFinite) ||
        low <= 0 || low > Math.min(open, close) || high < Math.max(open, close) || volume <= 0) return null;
    bars.push({ time, open, high, low, close, volume });
    previous = time;
  }
  return { state, start, end, basisDate, bars };
}

export function mergeChartArchivePages(base: readonly Candle[], pages: readonly ChartArchivePage[]): Candle[] {
  if (!pages.length) return [...base];
  const candles = base.filter(bar => !pages.some(page => bar.time >= page.start && bar.time < page.end));
  return candles.concat(pages.flatMap(page => page.bars)).sort((a, b) => a.time - b.time);
}
