import { createHash } from "node:crypto";
import { ChartSessionCalendar, type ChartCalendar } from "./chart-calendar";
import { aggregateCandles, easternDayStart, type Candle } from "./candles";
import { ALPACA_NATIVE_DAILY_DATASET, ALPACA_REGULAR_FOUR_HOUR_DATASET, type AlpacaHistoryRequest, type AlpacaHistoryResult } from "./rest-data";
import { regularIntradayBucket } from "../../market-data/chart-evidence/completed-candles";
import type { AcceptedInputCandle, QualifiedInputSeries } from "../../market-data/accepted-series/publisher";
import { easternClock } from "../live/sessions";
import { verifyDailySplitAdjustment, type EffectiveDailySplit } from "./verified-daily-split";

type RegularHistoryComparison =
  | { state: "equal"; count: number; regularFourHour: readonly AcceptedInputCandle[] }
  | { state: "different"; count: number }
  | { state: "unavailable" };

type ObservedAlpacaWindow = {
  symbol: string;
  calendar: ChartCalendar | readonly ChartCalendar[];
  startMs: number;
  endMs: number;
  raw: AlpacaHistoryResult;
  split: AlpacaHistoryResult;
  /** Separately acquired native SIP 30Min series in the same stable observation. */
  nativeHalfHours?: AlpacaHistoryResult;
  nativeDailyProof?: Readonly<{
    effectiveSplits: readonly EffectiveDailySplit[];
    repeatedSplit?: AlpacaHistoryResult;
    emptyStarts?: readonly number[];
  }>;
};

function sourceMatches({ symbol, startMs, endMs, raw, split }: ObservedAlpacaWindow) {
  return Number.isSafeInteger(startMs) && Number.isSafeInteger(endMs) && startMs > 0 && startMs < endMs &&
    raw.symbol === symbol && split.symbol === symbol && raw.feed === "sip" && split.feed === "sip" &&
    raw.adjustment === "raw" && split.adjustment === "split" && raw.complete && split.complete &&
    raw.nextPageToken === null && split.nextPageToken === null && !!raw.basisDate && split.basisDate === raw.basisDate;
}

function validCandle(bar: Candle, allowZeroVolume = false) {
  return Number.isSafeInteger(bar.time) && bar.time % 60 === 0 &&
    [bar.open, bar.high, bar.low, bar.close].every(price => Number.isFinite(price) && price > 0) &&
    Number.isFinite(bar.volume) && (bar.volume > 0 || (allowZeroVolume && bar.volume === 0)) &&
    bar.low <= Math.min(bar.open, bar.close) && bar.high >= Math.max(bar.open, bar.close);
}

function sameCandle(a: Candle, b: Candle) {
  return a.time === b.time && a.open === b.open && a.high === b.high && a.low === b.low &&
    a.close === b.close && a.volume === b.volume;
}

const calendarsFor = (calendar: ObservedAlpacaWindow["calendar"]): ChartCalendar[] =>
  "available" in calendar ? [calendar] : [...calendar];

function observedCalendar({ calendar, startMs, endMs }: ObservedAlpacaWindow) {
  const index = new ChartSessionCalendar();
  for (const item of calendarsFor(calendar)) {
    if (!item.available) return;
    for (const session of item.sessions) {
      const before = index.session(session.date);
      if (before && (before.open !== session.open || before.close !== session.close)) return;
    }
    index.merge(item);
  }
  const start = Date.parse(easternClock(startMs).date + "T12:00:00Z");
  const end = Date.parse(easternClock(endMs - 1).date + "T12:00:00Z");
  for (let day = start; day <= end; day += 86_400_000) {
    if (!index.covers(day / 1_000)) return;
  }
  return index;
}

/** Exact financial equality across two independently read bounded windows. */
export function compareVerifiedAlpacaRegularHistory(input: ObservedAlpacaWindow): RegularHistoryComparison {
  const { startMs, endMs, raw, split } = input;
  const unavailable = { state: "unavailable" } as const;
  if (!sourceMatches(input) || startMs % 60_000 || endMs % 60_000 || endMs - startMs > 86_400_000) return unavailable;
  const interval = observedCalendar(input)?.sessionAt(startMs / 1_000);
  if (!interval || startMs !== (interval.start + 570 * 60) * 1_000 ||
    endMs !== (interval.start + interval.closeMinute * 60) * 1_000) return unavailable;
  const count = (endMs - startMs) / 60_000;
  const valid = (bars: readonly Candle[]) => bars.length === count && bars.every((bar, index) =>
    validCandle(bar) && bar.time * 1_000 === startMs + index * 60_000);
  if (!valid(raw.bars) || !valid(split.bars)) return unavailable;
  const equal = raw.bars.every((bar, index) => sameCandle(bar, split.bars[index]));
  if (!equal) return { state: "different", count };

  // Use the chart's actual session geometry, including the truncated closing bucket.
  const session = { start: startMs / 1_000, end: endMs / 1_000 };
  const regularFourHour: AcceptedInputCandle[] = [];
  let previousEnd = session.start;
  for (const bar of aggregateCandles(split.bars, "4h", true)) {
    const bucket = regularIntradayBucket(bar.time, "4h", session);
    if (!bucket || bucket.start !== bar.time || bucket.start !== previousEnd || !Number.isFinite(bar.volume)) return unavailable;
    regularFourHour.push([bucket.start * 1_000, bucket.end * 1_000, bar.open, bar.high, bar.low, bar.close, bar.volume]);
    previousEnd = bucket.end;
  }
  return previousEnd === session.end ? { state: "equal", count, regularFourHour } : unavailable;
}

const halfHourSeconds = 1_800;

type RegularCoverageBucket = Readonly<{
  startMs: number;
  endMs: number;
  scheduledMinutes: number;
  emittedMinutes: number;
}>;

function observedNativeHalfHours(input: ObservedAlpacaWindow): Map<number, Candle> | undefined {
  const { nativeHalfHours: native, startMs, endMs, symbol, split } = input;
  if (!native || native.symbol !== symbol || native.feed !== "sip" || (native.adjustment !== "raw" && native.adjustment !== "split") ||
    native.basisDate !== split.basisDate || !native.complete || native.nextPageToken !== null) return;
  if (native.bars.some((bar, index) => !validCandle(bar) || bar.time % halfHourSeconds !== 0 ||
    bar.time * 1_000 < startMs || bar.time * 1_000 >= endMs ||
    (index > 0 && bar.time <= native.bars[index - 1].time))) return;
  return new Map(native.bars.map(bar => [bar.time, bar]));
}

/** Aggregate only emitted rows after confirming every scheduled interval in a closed chart bucket. */
export function verifyAlpacaRegularFourHourCoverage(input: ObservedAlpacaWindow) {
  const { startMs, endMs, raw, split, nativeHalfHours } = input;
  if (!sourceMatches(input) || endMs - startMs > 180 * 86_400_000 ||
    raw.bars.length !== split.bars.length) return;
  if (raw.bars.some((bar, index) => !validCandle(bar) || !validCandle(split.bars[index]) ||
    bar.time * 1_000 < startMs || bar.time * 1_000 >= endMs ||
    (index > 0 && bar.time <= raw.bars[index - 1].time) || !sameCandle(bar, split.bars[index]))) return;

  const native = observedNativeHalfHours(input);
  if (nativeHalfHours && !native) return;
  const calendarIndex = observedCalendar(input);
  if (!calendarIndex) return;
  const minutes = new Map(split.bars.map(bar => [bar.time, bar]));
  const rows: AcceptedInputCandle[] = [];
  const coverage: RegularCoverageBucket[] = [];
  for (const { date, close } of calendarIndex.knownSessions()) {
    const day = easternDayStart(Date.parse(date + "T12:00:00Z") / 1_000);
    const [hour, minute] = close.split(":").map(Number);
    const session = { start: day + 570 * 60, end: day + hour * 3_600 + minute * 60 };
    if (session.end * 1_000 <= startMs || session.start * 1_000 >= endMs) continue;
    for (let time = session.start; time < session.end;) {
      const bucket = regularIntradayBucket(time, "4h", session);
      if (!bucket || bucket.start !== time) return;
      time = bucket.end;
      if (bucket.start * 1_000 < startMs || bucket.end * 1_000 > endMs) continue;
      if (bucket.start % halfHourSeconds !== 0 || bucket.end % halfHourSeconds !== 0) return;
      const eligible: Candle[] = [];
      for (let halfHour = bucket.start; halfHour < bucket.end; halfHour += halfHourSeconds) {
        const group: Candle[] = [];
        for (let minute = halfHour; minute < halfHour + halfHourSeconds; minute += 60) {
          const bar = minutes.get(minute);
          if (bar) group.push(bar);
        }
        if (native) {
          const [rolled] = aggregateCandles(group, "30m");
          const corroborated = native.get(halfHour);
          if (rolled ? !corroborated || !sameCandle(rolled, corroborated) : corroborated) return;
        } else if (group.length !== halfHourSeconds / 60) {
          return;
        }
        eligible.push(...group);
      }
      coverage.push({ startMs: bucket.start * 1_000, endMs: bucket.end * 1_000,
        scheduledMinutes: (bucket.end - bucket.start) / 60, emittedMinutes: eligible.length });
      if (!eligible.length) continue;
      const [bar] = aggregateCandles(eligible, "4h", true);
      if (!bar || bar.time !== bucket.start || !Number.isFinite(bar.volume)) return;
      rows.push([bucket.start * 1_000, bucket.end * 1_000, bar.open, bar.high, bar.low, bar.close, bar.volume]);
    }
  }
  return coverage.length ? { rows, coverage } : undefined;
}

export function verifyAlpacaRegularFourHourWindow(input: ObservedAlpacaWindow): readonly AcceptedInputCandle[] | undefined {
  return verifyAlpacaRegularFourHourCoverage(input)?.rows;
}

/** Provided by the private observer after instrument, price basis and calendar verification. */
type ObservedAlpacaBasis = Pick<QualifiedInputSeries,
  "instrumentId" | "symbol" | "venue" | "priceBasisId" | "calendarRevision" | "acceptedCutoffMs" | "availableAtMs"
>;

function observedExactRequest(request: AlpacaHistoryRequest, window: ObservedAlpacaWindow, basis: ObservedAlpacaBasis) {
  return request.acceptedEvidence && request.adjustment === undefined &&
    request.symbol === window.symbol && request.symbol === basis.symbol &&
    request.start === window.startMs && request.end === window.endMs &&
    Number.isSafeInteger(basis.acceptedCutoffMs) && Number.isSafeInteger(basis.availableAtMs) &&
    basis.availableAtMs >= request.end;
}

/** Bind the chart's minute-derived bars to the exact requested source window before gateway acceptance. */
export function prepareVerifiedAlpacaRegularHistory(
  request: AlpacaHistoryRequest,
  window: ObservedAlpacaWindow,
  basis: ObservedAlpacaBasis,
): { history: AlpacaHistoryResult; qualified: QualifiedInputSeries; coverage: RegularCoverageBucket[]; calendars: ChartCalendar[] } | undefined {
  if (request.timeframe !== "4Hour" || request.sessionMode !== "regular" || !observedExactRequest(request, window, basis)) return;
  const verified = verifyAlpacaRegularFourHourCoverage(window);
  if (!verified?.rows.length) return;
  const { rows, coverage } = verified;
  const coverageRevision = window.nativeHalfHours && createHash("sha256").update(JSON.stringify([
    "alpaca-sip-emitted-bars-coverage-v1", window.symbol, window.startMs, window.endMs,
    basis.priceBasisId, basis.calendarRevision,
    coverage, window.nativeHalfHours.adjustment, window.split.bars, window.nativeHalfHours.bars,
  ])).digest("hex");
  const completedThroughMs = rows[rows.length - 1][1];
  const coverageEndMs = coverage[coverage.length - 1].endMs;
  if (coverageEndMs > basis.acceptedCutoffMs) return;
  return {
    history: {
      symbol: request.symbol, feed: "sip", adjustment: "split", basisDate: window.split.basisDate,
      complete: true, nextPageToken: null,
      bars: rows.map(([start, , open, high, low, close, volume]) =>
        ({ time: start / 1_000, open, high, low, close, volume })),
    },
    qualified: {
      ...basis, frame: "4h", datasetId: ALPACA_REGULAR_FOUR_HOUR_DATASET, sessionMode: "regular",
      completedThroughMs, rows, ...(coverageRevision ? { emittedBarCoverage: {
        startMs: coverage[0].startMs, endMs: coverageEndMs, revision: coverageRevision,
      } } : {}),
    },
    coverage,
    calendars: calendarsFor(window.calendar),
  };
}

function dailyIntervals(input: ObservedAlpacaWindow) {
  const { startMs, endMs, raw, split } = input;
  if (!sourceMatches(input) || endMs - startMs > 3_650 * 86_400_000 ||
    !raw.bars.length || raw.bars.length !== split.bars.length) return;
  const sessions = observedCalendar(input);
  if (!sessions) return;
  return sessions.knownSessions().flatMap(({ date }) => {
    const noon = Date.parse(date + "T12:00:00Z");
    const start = easternDayStart(noon / 1_000) * 1_000;
    const end = easternDayStart((noon + 86_400_000) / 1_000) * 1_000;
    return start >= startMs && end <= endMs ? [{ date, start, end }] : [];
  });
}

export function missingAlpacaDailyIntervals(input: ObservedAlpacaWindow) {
  const intervals = dailyIntervals(input);
  if (!intervals) return;
  const starts = new Set(input.split.bars.map(bar => bar.time * 1_000));
  const missing: Array<{ start: number; end: number; starts: number[] }> = [];
  let current: (typeof missing)[number] | undefined;
  for (const interval of intervals) {
    if (starts.has(interval.start)) {
      current = undefined;
      continue;
    }
    if (current) {
      current.end = interval.end;
      current.starts.push(interval.start);
    } else {
      current = { start: interval.start, end: interval.end, starts: [interval.start] };
      missing.push(current);
    }
  }
  return missing;
}

/** Verify the exact native SIP rows with New York midnight bounds and corroborated empty dates. */
export function verifyAlpacaNativeDailyWindow(input: ObservedAlpacaWindow): readonly AcceptedInputCandle[] | undefined {
  const intervals = dailyIntervals(input);
  if (!intervals) return;
  const { symbol, split, raw, nativeDailyProof } = input;
  const { effectiveSplits = [], repeatedSplit, emptyStarts = [] } = nativeDailyProof ?? {};
  if (effectiveSplits.length > 32 || (effectiveSplits.length > 0 && !repeatedSplit)) return;
  if (repeatedSplit && (repeatedSplit.symbol !== symbol || repeatedSplit.feed !== "sip" ||
    repeatedSplit.adjustment !== "split" || repeatedSplit.basisDate !== split.basisDate ||
    !repeatedSplit.complete || repeatedSplit.nextPageToken !== null || repeatedSplit.bars.length !== split.bars.length ||
    !repeatedSplit.bars.every((bar, index) => sameCandle(bar, split.bars[index])))) return;

  const empty = new Set(emptyStarts);
  const rows: AcceptedInputCandle[] = [];
  for (const { date, start, end } of intervals) {
    if (empty.delete(start)) continue;
    const bar = split.bars[rows.length];
    const unadjusted = raw.bars[rows.length];
    // Daily can report an emitted zero-volume bar. Both reads must preserve the exact observation.
    if (!bar || !unadjusted || !validCandle(bar, true) || !validCandle(unadjusted, true) ||
      bar.time * 1_000 !== start || !verifyDailySplitAdjustment(unadjusted, bar, date, effectiveSplits)) return;
    rows.push([start, end, bar.open, bar.high, bar.low, bar.close, bar.volume]);
  }
  if (empty.size || rows.length !== split.bars.length) return;
  return rows;
}

/** Keep native Daily bars intact and provide only separately verified source metadata to the binder. */
export function qualifyAlpacaNativeDailyHistory(
  request: AlpacaHistoryRequest,
  window: ObservedAlpacaWindow,
  basis: ObservedAlpacaBasis,
): QualifiedInputSeries | undefined {
  if (request.timeframe !== "1Day" || request.sessionMode !== undefined || !observedExactRequest(request, window, basis)) return;
  const rows = verifyAlpacaNativeDailyWindow(window);
  if (!rows) return;
  const completedThroughMs = rows[rows.length - 1][1];
  if (completedThroughMs > basis.acceptedCutoffMs) return;
  return {
    ...basis, frame: "daily", datasetId: ALPACA_NATIVE_DAILY_DATASET, sessionMode: "extended",
    completedThroughMs, rows,
  };
}
