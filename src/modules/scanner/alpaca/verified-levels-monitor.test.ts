// @vitest-environment node
import { randomUUID } from "node:crypto";
import { expect, it, vi } from "vitest";
import { AcceptedSeriesPublisher, type QualifiedInputSeries } from "../../market-data/accepted-series/publisher";
import { decodeGatewayWire, encodeGatewayWire } from "../../market-data/transport/gateway-wire";
import type { ChartCalendar } from "./chart-calendar";
import { ALPACA_NATIVE_DAILY_DATASET, ALPACA_REGULAR_FOUR_HOUR_DATASET } from "./rest-data";
import { createVerifiedScannerLevelsMonitor, type ScannerLevelsObserveInterval } from "./verified-levels-monitor";

const at = (day: number, time: string) => Date.parse(`2026-11-${day}T${time}Z`);
const binding = (map: { mapId: string; revision: string }) => ({ mapId: map.mapId, mapRevision: map.revision });
const calendar: ChartCalendar = {
  available: true, start: "2026-11-20", end: "2026-11-30",
  sessions: [20, 23, 24, 25].map(day => ({ date: "2026-11-" + day, open: "09:30", close: "16:00" })),
};

function fixture() {
  let now = at(21, "05:00:00");
  const publisher = new AcceptedSeriesPublisher(() => now);
  const startMs = at(20, "14:30:00"), endMs = at(20, "18:30:00");
  const common = {
    instrumentId: "instrument", symbol: "QA", venue: "NASDAQ", priceBasisId: "split-basis", calendarRevision: "calendar",
    completedThroughMs: endMs, availableAtMs: at(20, "21:00:00"), acceptedCutoffMs: at(20, "21:00:00"),
    rows: [[startMs, endMs, 9.9, 10.1, 9.8, 10, 240]],
  } as const;
  const regular = publisher.publish({ ...common, frame: "4h", sessionMode: "regular", datasetId: ALPACA_REGULAR_FOUR_HOUR_DATASET });
  const daily = publisher.publish({ ...common, frame: "daily", sessionMode: "extended", datasetId: ALPACA_NATIVE_DAILY_DATASET });
  if (!regular || !daily) throw Error("fixture receipts unavailable");
  const map = { userId: randomUUID(), workspaceId: randomUUID(), mapId: randomUUID(), revision: "a".repeat(64),
    dailyId: daily.id, regularId: regular.id, savedAfterMs: now, expiresAtMs: now + 72 * 3_600_000 };
  const ready: ScannerLevelsObserveInterval = async ({ basis, interval, operationId }) => {
    const { startMs } = interval;
    const rows = Array.from({ length: 240 }, (_, index) =>
      ({ time: startMs / 1_000 + 60 * index, open: 9.9, high: 10.1, low: 9.8, close: 10, volume: 100 }));
    const history = { symbol: basis.symbol, basisDate: "2026-11-23", feed: "sip", complete: true, nextPageToken: null, bars: rows } as const;
    return {
      basis: { ...basis, acceptedCutoffMs: now, availableAtMs: now },
      request: { ...interval, operationId, requestId: randomUUID(), kind: "4h", symbol: basis.symbol, wire: false },
      window: { ...interval, symbol: basis.symbol, calendar,
        raw: { ...history, adjustment: "raw" }, split: { ...history, adjustment: "split" } },
    };
  };
  return { map, publisher, now: () => now, time: (at: number) => { now = at; }, ready, common };
}

it("enrolls a committed map before the next window and retains exact current and predecessor receipts", async () => {
  const source = fixture();
  const observer = vi.fn(source.ready);
  const monitor = createVerifiedScannerLevelsMonitor(source.publisher, observer, source.now);
  expect(monitor.admit(source.map, [calendar])).toBe(true);
  expect(monitor.admit(source.map, [calendar])).toBe(true);
  expect(monitor.admit({ ...source.map, expiresAtMs: source.map.expiresAtMs - 1 }, [calendar])).toBe(false);
  source.time(at(23, "18:29:59"));
  await monitor.poll();
  expect(observer).not.toHaveBeenCalled();
  source.time(at(23, "18:30:01"));
  await monitor.poll();
  expect(observer).toHaveBeenCalledTimes(1);
  const opportunities = source.publisher.readRegularOpportunities(source.map.dailyId, source.map.regularId, binding(source.map));
  expect(opportunities).toMatchObject([{ previousId: source.map.regularId, startMs: at(23, "14:30:00") }]);
  source.time(at(23, "18:31:01"));
  await monitor.poll();
  expect(observer).toHaveBeenCalledTimes(2);
  expect(source.publisher.readRegularOpportunities(source.map.dailyId, source.map.regularId, binding(source.map)))
    .toEqual(opportunities);
  const { common } = source;
  const corrected: QualifiedInputSeries = { ...common, frame: "4h", sessionMode: "regular",
    datasetId: ALPACA_REGULAR_FOUR_HOUR_DATASET, upstreamRevision: "fixture-provider-correction" };
  source.publisher.publish(corrected);
  expect(source.publisher.readRegularOpportunities(source.map.dailyId, source.map.regularId, binding(source.map))).toEqual([]);
  monitor.stop();
});

it("fails closed on late enrollment, after restart and on repeated gaps in the earliest interval", async () => {
  const source = fixture();
  const observer = vi.fn<ScannerLevelsObserveInterval>(async () => undefined);
  const monitor = createVerifiedScannerLevelsMonitor(source.publisher, observer, source.now);
  expect(monitor.admit(source.map, [calendar])).toBe(true);
  const restarted = createVerifiedScannerLevelsMonitor(new AcceptedSeriesPublisher(source.now), observer, source.now);
  expect(restarted.admit(source.map, [calendar])).toBe(false);
  source.time(at(23, "18:30:01"));
  expect(monitor.admit({ ...source.map, mapId: randomUUID() }, [calendar])).toBe(false);
  await monitor.poll();
  source.time(at(23, "18:31:01"));
  await monitor.poll();
  source.time(at(23, "18:32:01"));
  await monitor.poll();
  source.time(at(24, "18:30:01"));
  await monitor.poll();
  expect(observer).toHaveBeenCalledTimes(3);
  expect(observer.mock.calls.map(([input]) => input.interval.startMs)).toEqual(Array(3).fill(at(23, "14:30:00")));
  expect(source.publisher.readRegularOpportunities(source.map.dailyId, source.map.regularId, binding(source.map))).toEqual([]);
  monitor.stop();
});

it("accepts a candle already forming at save only as the next completed window's predecessor", async () => {
  const source = fixture();
  source.time(at(23, "16:00:00"));
  const map = { ...source.map, savedAfterMs: source.now(), expiresAtMs: source.now() + 72 * 3_600_000 };
  const observer = vi.fn(source.ready);
  const monitor = createVerifiedScannerLevelsMonitor(source.publisher, observer, source.now);
  expect(monitor.admit(map, [calendar])).toBe(true);
  source.time(at(23, "18:30:01"));
  await monitor.poll();
  expect(source.publisher.readRegularOpportunities(map.dailyId, map.regularId, binding(map))).toEqual([]);
  source.time(at(24, "18:30:01"));
  await monitor.poll();
  expect(observer.mock.calls.map(([input]) => input.interval.startMs)).toEqual([
    at(23, "14:30:00"), at(24, "14:30:00"),
  ]);
  const [opportunity] = source.publisher.readRegularOpportunities(map.dailyId, map.regularId, binding(map));
  expect(opportunity?.startMs).toBe(at(24, "14:30:00"));
  expect(source.publisher.latestFullCandle(opportunity?.previousId ?? "")?.row[0]).toBe(at(23, "14:30:00"));
  monitor.stop();
});

it.each(["empty", "corrected to empty"] as const)("advances past a corroborated interval that is %s", async state => {
  const source = fixture();
  source.time(at(21, "21:00:00"));
  const map = { ...source.map, savedAfterMs: source.now(), expiresAtMs: source.now() + 72 * 3_600_000 };
  const first = at(23, "14:30:00");
  const observer = vi.fn<ScannerLevelsObserveInterval>(async input => {
    const captured = await source.ready(input);
    if (!captured || input.interval.startMs !== first ||
      (state === "corrected to empty" && source.now() < at(23, "18:31:00"))) return captured;
    const split = { ...captured.window.split, bars: [] };
    const raw = { ...captured.window.raw, bars: [] };
    return { ...captured, window: { ...captured.window, split, raw, nativeHalfHours: raw } };
  });
  const monitor = createVerifiedScannerLevelsMonitor(source.publisher, observer, source.now);
  expect(monitor.admit(map, [calendar])).toBe(true);
  const opportunities = () => source.publisher.readRegularOpportunities(map.dailyId, map.regularId, binding(map));
  source.time(at(23, "18:30:01"));
  await monitor.poll();
  const firstId = opportunities()[0]?.triggerId;
  expect(Boolean(firstId)).toBe(state === "corrected to empty");
  source.time(at(23, "18:31:01"));
  await monitor.poll();
  expect(opportunities()).toEqual([]);
  if (firstId) expect(source.publisher.latestFullCandle(firstId)).toBeUndefined();
  source.time(at(24, "18:30:01"));
  await monitor.poll();
  expect(opportunities()).toMatchObject([{ previousId: map.regularId,
    startMs: at(24, "14:30:00"), verifiedEmptyStarts: [first] }]);
  expect(decodeGatewayWire("accepted-regular-opportunities", encodeGatewayWire("accepted-regular-opportunities", opportunities())))
    .toEqual(opportunities());
  monitor.stop();
});
