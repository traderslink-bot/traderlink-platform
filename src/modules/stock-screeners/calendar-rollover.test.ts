// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { easternDayStart } from "../scanner/alpaca/candles";
import { parseCalendarSessions, type ChartMarketSession } from "../scanner/alpaca/chart-calendar";
import type { TraderLinkPlatformRequestIdentity } from "../platform/server/authentication/require-platform-request-scope";
import { DEFAULT_DEFINITION } from "./contracts";
import { sessionBounds } from "./market-metrics";
import { publishScreenerPack } from "./provider-pack-store";
import { ScreenerSnapshotCollector } from "./provider-snapshot-collector";
import type { ScreenerProviderTransport } from "./provider-transport";
import { createRun } from "./service";

const listing = vi.hoisted(() => ({ date: "2026-11-20", calls: 0 }));
vi.mock("./listings", () => ({ collectListings: async () => {
  listing.calls++;
  return { listingDate: listing.date, partialCaps: false,
    stocks: [{ symbol: "AAA", name: "Calendar fixture", exchange: "NASDAQ", marketCap: 50_000_000 }] };
} }));
// Preserve request ordering/counts without spending real time on the worker's
// unchanged provider pacing. Every fetch below is an in-process fixture.
vi.mock("node:timers/promises", () => ({ setTimeout: async () => {} }));

const DAY = 86_400_000, MINUTE = 60_000;
const selection = { provider: "alpaca", revision: 0 } as const;
let directory: string;
let calendarRows: ChartMarketSession[];
let calendarCalls: { start: string; end: string }[];
let dataCalls: { path: string; frame: string | null }[];
let changeCalendar: (rows: ChartMarketSession[]) => ChartMarketSession[];
let earlyClose: string | undefined;
const owner = (userId: string) => ({ mode: "platform_session", scope: { userId } }) as TraderLinkPlatformRequestIdentity;
const time = (iso: string) => vi.setSystemTime(Date.parse(iso));
const candle = (at: number, price: number, volume = 100) => ({
  t: new Date(at).toISOString(), o: price, h: price, l: price, c: price, v: volume, vw: price,
});

function fixtureCalendar(start: string, end: string) {
  const rows: ChartMarketSession[] = [];
  for (let at = Date.parse(start + "T12:00:00Z"); at <= Date.parse(end + "T12:00:00Z"); at += DAY) {
    const date = new Date(at);
    if (date.getUTCDay() > 0 && date.getUTCDay() < 6) {
      const key = date.toISOString().slice(0, 10);
      rows.push({ date: key, open: "09:30", close: key === earlyClose ? "13:00" : "16:00" });
    }
  }
  return rows;
}

function fixtureBars(frame: string) {
  if (frame === "1Day") return calendarRows.map(day => candle(
    easternDayStart(Date.parse(day.date + "T12:00:00Z") / 1000) * 1000, 11, 10_000));
  if (frame === "15Min") return calendarRows.map(day => candle(sessionBounds(day, "regular").from, 10));
  return calendarRows.filter(day => day.date <= listing.date).slice(-2).flatMap(day => {
    const morning = sessionBounds(day, "premarket").from;
    const regular = sessionBounds(day, "regular");
    const after = sessionBounds(day, "after_hours");
    return [candle(morning, 8), candle(regular.from, 10), candle(regular.until - 5 * MINUTE, 11),
      candle(after.from, 12, 300), candle(after.until - 70 * MINUTE, 13, 400),
      candle(after.until - 60 * MINUTE, 13.5, 450), candle(after.until - 55 * MINUTE, 13.75, 475),
      candle(after.until - 10 * MINUTE, 14, 500), candle(after.until - 5 * MINUTE, 15, 600),
      // A new-session candle must never leak into the completed after-hours slice.
      candle(after.until, 99, 99_999)];
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  time("2026-11-20T23:56:00Z");
  listing.date = "2026-11-20";
  listing.calls = 0;
  calendarCalls = [];
  dataCalls = [];
  calendarRows = [];
  earlyClose = undefined;
  changeCalendar = rows => rows;
  directory = mkdtempSync(join(tmpdir(), "screeners-calendar-"));
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(directory, "fixture.sqlite"));
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER", "0");
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.origin === "https://paper-api.alpaca.markets" && url.pathname === "/v2/calendar") {
      const range = { start: url.searchParams.get("start")!, end: url.searchParams.get("end")! };
      calendarCalls.push(range);
      calendarRows = changeCalendar(fixtureCalendar(range.start, range.end));
      return Response.json(calendarRows);
    }
    if (url.origin !== "https://data.alpaca.markets") throw Error("unexpected_fixture_request");
    const frame = url.searchParams.get("timeframe");
    dataCalls.push({ path: url.pathname, frame });
    if (url.pathname === "/v2/stocks/snapshots") return Response.json({});
    if (url.pathname !== "/v2/stocks/bars" || !frame) throw Error("unexpected_fixture_request");
    expect(url.searchParams.get("feed")).toBe("sip");
    expect(url.searchParams.get("adjustment")).toBe("split");
    const start = Date.parse(url.searchParams.get("start")!), end = Date.parse(url.searchParams.get("end")!);
    return Response.json({ bars: { AAA: fixtureBars(frame).filter(row => {
      const at = Date.parse(row.t);
      return at >= start && at <= end;
    }) }, next_page_token: null });
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  rmSync(directory, { recursive: true, force: true });
});

function collector() {
  return new ScreenerSnapshotCollector({} as ScreenerProviderTransport, selection, new AbortController().signal,
    { keyId: "isolated-fixture-key", secretKey: "isolated-fixture-secret" });
}

describe("Screeners calendar provenance and closing snapshot", () => {
  it.each([
    ["2026-11-20", "2026-11-20T23:56:00Z", "2026-11-21T00:11:00Z", false],
    ["2026-07-17", "2026-07-17T23:56:00Z", "2026-07-18T00:06:00Z", true],
  ] as const)("reuses the actual fetched calendar through UTC midnight on %s", async (date, before, after, closed) => {
    listing.date = date;
    time(before);
    const worker = collector();
    const reference = await worker.referenceData();
    const first = await worker.collect();
    time(after);
    const updated = await worker.collect();
    expect(updated.snapshots.after_hours.asOf).toBeGreaterThan(first.snapshots.after_hours.asOf);
    expect(updated.snapshots.after_hours).toMatchObject({ date, closed });
    expect(updated.snapshots.after_hours.rows[0].values.price).toBeGreaterThan(first.snapshots.after_hours.rows[0].values.price!);
    expect(await worker.referenceData()).toBe(reference);
    expect(reference.calendarRange).toEqual(calendarCalls[0]);
    expect(calendarCalls).toHaveLength(1);
    expect(listing.calls).toBe(1);
    // This is the actual former failure: reinterpreting the saved payload using
    // a newly shifted lower bound rejects a valid row from the original request.
    const shiftedStart = new Date(Date.now() - 540 * DAY).toISOString().slice(0, 10);
    const shiftedEnd = new Date(Date.now() + 3 * DAY).toISOString().slice(0, 10);
    expect(() => parseCalendarSessions(reference.calendar, shiftedStart, shiftedEnd)).toThrow("invalid_chart_calendar");
    expect(parseCalendarSessions(reference.calendar, reference.calendarRange.start, reference.calendarRange.end)).toHaveLength(calendarRows.length);
  });

  it("captures the final 8 p.m. bar after settling and keeps it for both accounts overnight and through the weekend", async () => {
    const worker = collector();
    await worker.referenceData();
    time("2026-11-21T01:00:59Z");
    const settling = await worker.collect();
    expect(settling.snapshots.after_hours.asOf).toBe(Date.parse("2026-11-21T00:55:00Z"));
    expect(settling.snapshots.after_hours.rows[0].values.price).toBe(14);
    time("2026-11-21T01:01:00Z");
    const final = await worker.collect();
    expect(final.latest).toBe("last_regular");
    expect(final.snapshots.after_hours).toMatchObject({ closed: true, date: "2026-11-20", asOf: Date.parse("2026-11-21T01:00:00Z") });
    expect(final.snapshots.after_hours.rows[0]).toMatchObject({ priceAt: Date.parse("2026-11-21T01:00:00Z"), values: { price: 15 } });
    expect(calendarCalls).toHaveLength(1);
    const store = join(directory, "stock-screeners-v1");
    await publishScreenerPack(store, final, selection);
    for (const when of ["2026-11-21T01:02:00Z", "2026-11-21T06:01:00Z", "2026-11-22T17:00:00Z", "2026-11-23T08:59:00Z"]) {
      time(when);
      for (const user of [owner("fixture-one"), owner("fixture-two")]) {
        const run = await createRun(user, DEFAULT_DEFINITION);
        expect(run).toMatchObject({ session: "after_hours", closed: true, asOf: Date.parse("2026-11-21T01:00:00Z"), total: 1 });
        expect(run.rows[0].values.price).toBe(15);
      }
    }
    // When a new premarket snapshot is published, Latest must stop selecting
    // Friday's retained close and use the new actual trading session.
    listing.date = "2026-11-23";
    time("2026-11-23T09:06:00Z");
    await publishScreenerPack(store, await worker.collect(), selection);
    for (const user of [owner("fixture-one"), owner("fixture-two")]) {
      const next = await createRun(user, DEFAULT_DEFINITION);
      expect(next).toMatchObject({ session: "premarket", date: "2026-11-23" });
      expect(next.rows[0].values.price).toBe(8);
    }
    expect(calendarCalls).toHaveLength(2);
    expect(listing.calls).toBe(2);
  });

  it("honors the calendar's early close rather than extending that session to 8 p.m.", async () => {
    listing.date = earlyClose = "2026-11-27";
    time("2026-11-27T21:56:00Z");
    const worker = collector();
    const open = await worker.collect();
    expect(open.snapshots.after_hours.closed).toBe(false);
    time("2026-11-27T22:01:00Z");
    const final = await worker.collect();
    expect(final.snapshots.after_hours).toMatchObject({ closed: true, asOf: Date.parse("2026-11-27T22:00:00Z") });
    expect(final.snapshots.after_hours.rows[0].values.price).toBe(15);
    expect(calendarCalls).toHaveLength(1);
  });

  it("keeps Moomoo's cached calendar range while refreshing its roster across UTC midnight", async () => {
    const universe = vi.fn(async () => ({ listingDate: listing.date, partialCaps: false, spacingMs: 1_500,
      stocks: [{ symbol: "AAA", name: "Calendar fixture", exchange: "NASDAQ", marketCap: 50_000_000 }] }));
    const moomoo = vi.fn(async (_selection: unknown, operation: { operation: string; start?: string; end?: string }) => {
      if (operation.operation !== "calendar") throw Error("unexpected_fixture_operation");
      const range = { start: operation.start!, end: operation.end! };
      calendarCalls.push(range);
      return { ret_code: 0, data: { trading_days: fixtureCalendar(range.start, range.end)
        .map(day => ({ time: day.date, trade_date_type: "WHOLE", trade_second: 23_400 })) } };
    });
    const worker = new ScreenerSnapshotCollector({ universe, moomoo } as unknown as ScreenerProviderTransport,
      { provider: "moomoo", revision: 1 }, new AbortController().signal);
    const observe = (price: number) => worker.observeMoomooSnapshots({ ret_code: 0, data: { snapshot_list: [{
      code: "US.AAA", data_date: listing.date, update_time: Date.now(), last_price: 11,
      after_price: price, after_volume: 100, after_turnover: price * 100,
    }] } }, ["AAA"]);
    observe(13);
    await worker.initialMoomooPack();
    time("2026-11-21T00:11:00Z");
    observe(15);
    const updated = await worker.initialMoomooPack();
    expect(updated.snapshots.after_hours.rows[0].values).toMatchObject({ price: 15, sessionVwap: 15 });
    expect((await worker.referenceData()).calendarRange).toEqual(calendarCalls[0]);
    expect(universe).toHaveBeenCalledTimes(2);
    expect(calendarCalls).toHaveLength(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["outside", "duplicate", "bad-close"])("still rejects %s calendar rows instead of filtering them away", async failure => {
    changeCalendar = rows => failure === "outside" ? [{ ...rows[0], date: "2025-01-02" }, ...rows]
      : failure === "duplicate" ? [rows[0], ...rows] : [{ ...rows[0], close: "14:00" }, ...rows.slice(1)];
    await expect(collector().collect()).rejects.toThrow("invalid_chart_calendar");
    expect(dataCalls).toHaveLength(0);
  });
});
