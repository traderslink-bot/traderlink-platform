import { randomUUID } from "node:crypto";
import type { AcceptedInput, AcceptedSeriesPublisher } from "../../market-data/accepted-series/publisher";
import { easternClock } from "../live/sessions";
import { easternDayStart } from "./candles";
import { ChartSessionCalendar, type ChartCalendar } from "./chart-calendar";
import { ALPACA_NATIVE_DAILY_DATASET, ALPACA_REGULAR_FOUR_HOUR_DATASET } from "./rest-data";
import { createVerifiedLevelsReceiptBroker, type ObservedScannerLevelsHistory,
  type SavedScannerLevelsReceiptWindow } from "./verified-levels-receipt-broker";

export type SavedScannerMapAdmission = Readonly<Omit<SavedScannerLevelsReceiptWindow, "previousId"> & {
  userId: string;
  workspaceId: string;
  mapId: string;
  revision: string;
  expiresAtMs: number;
}>;

type Interval = Readonly<{ startMs: number; endMs: number }>;
export type ScannerLevelsObserveInterval = (input: {
  basis: AcceptedInput;
  interval: Interval;
  operationId: string;
  signal: AbortSignal;
}) => Promise<ObservedScannerLevelsHistory | undefined>;

const millisecondsPerDay = 86_400_000;
const fullWidthMs = 14_400_000;
const maxSavedMapMs = 72 * 3_600_000;
const retryWaitMs = 60_000;
const reviewWindowMs = 5 * 60_000;
const operationBudgetMs = 25_000;
const maxConcurrentMaps = 8;
const maxAttemptsPerInterval = 3;
const id = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/u;
const digest = /^[a-f0-9]{64}$/u;

type Watch = {
  readonly map: SavedScannerMapAdmission;
  readonly basis: AcceptedInput;
  readonly calendar: ChartSessionCalendar;
  readonly operationId: string;
  previousId: string;
  observedStartMs: number;
  verifiedEmptyStarts: readonly number[];
  nextReadAtMs: number;
  attempts: number;
  lastObservation?: {
    interval: Interval;
    previousId: string;
    verifiedEmptyStarts: readonly number[];
    receiptId?: string;
    reviewAtMs: number;
  };
};

function nextRegularInterval(calendar: ChartSessionCalendar, previousStartMs: number): Interval | undefined {
  const day = Date.parse(easternClock(previousStartMs).date + "T12:00:00Z");
  for (let cursor = day + millisecondsPerDay; cursor <= day + 10 * millisecondsPerDay; cursor += millisecondsPerDay) {
    if (!calendar.covers(cursor / 1_000)) return;
    const session = calendar.session(new Date(cursor).toISOString().slice(0, 10));
    if (session?.close !== "16:00") continue;
    const startMs = (easternDayStart(cursor / 1_000) + 570 * 60) * 1_000;
    return { startMs, endMs: startMs + fullWidthMs };
  }
}

/** One gateway process watches a bounded set of committed maps and never skips an unqualified interval. */
export function createVerifiedScannerLevelsMonitor(
  publisher: AcceptedSeriesPublisher,
  observe: ScannerLevelsObserveInterval,
  now = Date.now,
) {
  const watches = new Map<string, Watch>();
  const broker = createVerifiedLevelsReceiptBroker(publisher);
  const stopping = new AbortController();
  let busy = false;

  function admit(map: SavedScannerMapAdmission, calendars: readonly ChartCalendar[]): boolean {
    const current = now();
    if (stopping.signal.aborted ||
      ![map.userId, map.workspaceId, map.mapId, map.dailyId, map.regularId].every(value => id.test(value)) ||
      !digest.test(map.revision) || !Number.isSafeInteger(map.savedAfterMs) || map.savedAfterMs <= 0 || map.savedAfterMs > current ||
      !Number.isSafeInteger(map.expiresAtMs) || map.expiresAtMs <= current || map.expiresAtMs > map.savedAfterMs + maxSavedMapMs) return false;
    const key = JSON.stringify([map.userId, map.workspaceId, map.mapId, map.revision]);
    const existing = watches.get(key)?.map;
    if (existing) return existing.dailyId === map.dailyId && existing.regularId === map.regularId &&
      existing.savedAfterMs === map.savedAfterMs && existing.expiresAtMs === map.expiresAtMs;
    if (watches.size >= maxConcurrentMaps || !calendars.length || calendars.length > 4) return false;
    const daily = publisher.read(map.dailyId);
    const regular = publisher.latestFullCandle(map.regularId);
    if (daily?.datasetId !== ALPACA_NATIVE_DAILY_DATASET || regular?.input.datasetId !== ALPACA_REGULAR_FOUR_HOUR_DATASET ||
      Math.max(daily.acceptedAtMs, regular.input.acceptedAtMs) > map.savedAfterMs ||
      daily.instrumentId !== regular.input.instrumentId || daily.symbol !== regular.input.symbol || daily.venue !== regular.input.venue ||
      daily.priceBasisId !== regular.input.priceBasisId || daily.calendarRevision !== regular.input.calendarRevision) return false;

    const calendar = new ChartSessionCalendar();
    for (const part of calendars) calendar.merge(part);
    const following = nextRegularInterval(calendar, regular.row[0]);
    if (!following) return false;
    // A candle already forming when Levels saved may be needed as the next window's predecessor.
    const firstEligible = following.startMs <= map.savedAfterMs ? nextRegularInterval(calendar, following.startMs) : following;
    if (!firstEligible || firstEligible.startMs <= current || firstEligible.endMs >= map.expiresAtMs) return false;
    watches.set(key, {
      map: Object.freeze({ ...map }), basis: regular.input, calendar, operationId: randomUUID(),
      previousId: regular.input.id, observedStartMs: regular.row[0], verifiedEmptyStarts: [],
      nextReadAtMs: following.endMs, attempts: 0,
    });
    return true;
  }

  async function poll() {
    if (stopping.signal.aborted || busy) return;
    const current = now();
    for (const [key, watch] of watches) {
      if (watch.map.expiresAtMs <= current || !publisher.read(watch.map.dailyId) ||
        !publisher.read(watch.map.regularId) || !publisher.latestFullCandle(watch.previousId)) watches.delete(key);
    }
    const enrolled = [...watches.values()];
    const due = enrolled.find(watch => watch.nextReadAtMs <= current);
    const next = due ?? enrolled.find(watch => watch.lastObservation &&
      watch.lastObservation.reviewAtMs <= current && current < watch.lastObservation.interval.endMs + reviewWindowMs);
    if (!next) return;
    const reviewing = due ? undefined : next.lastObservation;
    const interval = reviewing?.interval ?? nextRegularInterval(next.calendar, next.observedStartMs);
    if (!interval || interval.endMs >= next.map.expiresAtMs || (!reviewing && next.attempts >= maxAttemptsPerInterval)) {
      next.nextReadAtMs = next.map.expiresAtMs;
      return;
    }
    const following = interval.startMs <= next.map.savedAfterMs ? nextRegularInterval(next.calendar, interval.startMs) : undefined;
    if (interval.startMs <= next.map.savedAfterMs && (!following || following.startMs <= current)) {
      next.nextReadAtMs = next.map.expiresAtMs;
      return;
    }
    busy = true;
    if (reviewing) reviewing.reviewAtMs = Infinity;
    else {
      next.attempts++;
      next.nextReadAtMs = current + retryWaitMs;
    }
    const signal = AbortSignal.any([stopping.signal, AbortSignal.timeout(operationBudgetMs)]);
    try {
      const observed = await observe({ basis: next.basis, interval, operationId: next.operationId, signal });
      if (!observed || signal.aborted || now() >= next.map.expiresAtMs || observed.request.operationId !== next.operationId ||
        observed.request.startMs !== interval.startMs || observed.request.endMs !== interval.endMs ||
        (following && now() >= following.startMs)) return;
      const previousId = reviewing?.previousId ?? next.previousId;
      const verifiedEmptyStarts = reviewing?.verifiedEmptyStarts ?? next.verifiedEmptyStarts;
      const saved = { ...next.map, previousId };
      const issued = broker.observeRegularHistory(observed, saved, signal, !following,
        { mapId: next.map.mapId, mapRevision: next.map.revision }, verifiedEmptyStarts);
      if (!issued) return;
      const receiptId = issued.state === "candle" ? issued.input.id : undefined;
      if (issued.state === "empty" && reviewing?.receiptId) publisher.withdraw(reviewing.receiptId);
      next.previousId = receiptId ?? previousId;
      next.verifiedEmptyStarts = receiptId ? [] : [...verifiedEmptyStarts, interval.startMs];
      next.observedStartMs = interval.startMs;
      next.attempts = 0;
      next.nextReadAtMs = nextRegularInterval(next.calendar, interval.startMs)?.endMs ?? next.map.expiresAtMs;
      next.lastObservation = { interval, previousId, verifiedEmptyStarts, receiptId,
        reviewAtMs: reviewing ? Infinity : now() + retryWaitMs };
    } catch {
      // Leave the same interval pending. A failed read can never qualify a later interval.
    } finally {
      busy = false;
    }
  }

  return { admit, poll, stop: () => stopping.abort() };
}
