// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { aggregateCandles, easternDayStart } from "../scanner/alpaca/candles";
import type { TradeRevisionRequest, TradeRevisions } from "../scanner/alpaca/trade-revisions";
import type { ChartMarketSession } from "../scanner/alpaca/chart-calendar";
import type { TraderLinkPlatformRequestIdentity } from "../platform/server/authentication/require-platform-request-scope";
import { DEFAULT_DEFINITION, type Listing } from "./contracts";
import { collectMarketPack, type BarCache } from "./collect-market";
import { publishScreenerPack } from "./provider-pack-store";
import { createRun } from "./service";
import { correctedMinutes, repairScreenerBars, screenerCorrections, type CorrectionHistoryRequest, type ScreenerBars, type ScreenerCorrections, type ScreenerCorrectionState, type ScreenerRevisionManifest } from "./trade-corrections";
import { readCorrectedScreenerVwapSeeds } from "./candle-cache-reader";
import { LiveScreenerVwapWorker } from "./live-vwap-worker";
import { encodeGatewayWire } from "../market-data/transport/gateway-wire";
import { ScreenerSnapshotCollector } from "./provider-snapshot-collector";
import type { MoomooScreenerOperation, ScreenerProviderTransport } from "./provider-transport";
import replay from "./fixtures/pom-trade-corrections.json";

const MINUTE = 60_000, start = Date.parse("2026-11-27T09:00:00Z"), end = Date.parse("2026-11-27T14:30:00Z");
const basisDate = "2026-11-27", hash = "a".repeat(64), nextHash = "b".repeat(64);
const minutes = [1795780920, 1795780980, 1795781040];
const corrected = { feed: "sip", symbols: { POM: { minutes, pending: false, revision: hash } } } satisfies TradeRevisions;
const empty = { feed: "sip", symbols: {} } satisfies TradeRevisions;
const partial = { status: "partial", completedThroughMs: null, seed: null };
const rows = () => new Map(aggregateCandles(replay.before, "5m").map(bar => [bar.time, bar]));
function bars(): ScreenerBars { return { grouped: new Map([["POM", rows()], ["PEER", rows()]]), rejected: new Set() }; }
function history(request: CorrectionHistoryRequest, weighted = false) {
  const source = request.timeframe && request.timeframe !== "1Min"
    ? aggregateCandles(replay.after, request.timeframe === "15Min" ? "15m" : "5m") : replay.after;
  return { symbol: request.symbol, feed: "sip", adjustment: "split", basisDate, complete: true, nextPageToken: null,
    bars: source.filter(bar => bar.time * 1000 >= request.start && bar.time * 1000 <= request.end)
      .map(bar => ({ ...bar, ...(weighted ? { vwap: 4 } : {}) })) };
}
function reader() {
  return { revisions: vi.fn<(request: TradeRevisionRequest) => Promise<TradeRevisions>>(async () => structuredClone(corrected)),
    history: vi.fn(async (request: CorrectionHistoryRequest) => history(request)) };
}
function repair(read: ScreenerCorrections, state: ScreenerCorrectionState = new Map(), input = bars()) {
  return repairScreenerBars({ reader: read, state, bars: input, symbols: ["POM", "PEER"], start, end, basisDate });
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Screeners trade correction cache", () => {
  it("replaces only the affected POM bucket and keeps the repair over stale raw tails and empty/unavailable metadata", async () => {
    const read = reader(), state: ScreenerCorrectionState = new Map();
    const repaired = await repair(read, state);
    const values = [...repaired.grouped.get("POM")!.values()];
    expect(Math.max(...values.map(bar => bar.high))).toBe(7.41);
    expect(values.reduce((sum, bar) => sum + bar.volume, 0)).toBe(30_566_502);
    expect(Math.max(...repaired.grouped.get("PEER")!.values().map(bar => bar.high))).toBe(38);
    expect(read.history).toHaveBeenCalledTimes(1);
    expect(read.history.mock.calls[0][0]).toEqual({ symbol: "POM", timeframe: "5Min", start: Date.parse("2026-11-27T12:00:00Z"), end: Date.parse("2026-11-27T12:05:00Z") - 1 });
    const again = await repair(read, state);
    expect(Math.max(...again.grouped.get("POM")!.values().map(bar => bar.high))).toBe(7.41);
    expect(read.history).toHaveBeenCalledTimes(1);
    read.revisions.mockResolvedValue(empty);
    expect((await repair(read, state)).grouped.get("POM")).toEqual(repaired.grouped.get("POM"));
    read.revisions.mockRejectedValue(Error("offline"));
    expect((await repair(read, state)).grouped.get("POM")).toEqual(repaired.grouped.get("POM"));
  });

  it("removes cancelled-only buckets on complete empty history without requiring five printed bars", async () => {
    const read = reader();
    read.history.mockImplementation(async request => ({ ...history(request), bars: [] }));
    const result = await repair(read);
    expect(result.rejected.size).toBe(0);
    expect(result.grouped.get("POM")!.has(1795780800)).toBe(false);
    expect(result.grouped.get("PEER")!.has(1795780800)).toBe(true);
  });

  it.each(["pending", "race", "incomplete", "foreign", "basis", "duplicate", "old-day", "failed"])("isolates %s correction while preserving valid peers", async kind => {
    const read = reader();
    if (kind === "pending") read.revisions.mockResolvedValue({ feed: "sip", symbols: { POM: { minutes: [], pending: true, revision: null } } });
    if (kind === "race") read.revisions.mockResolvedValueOnce(corrected).mockResolvedValue({ feed: "sip", symbols: { POM: { ...corrected.symbols.POM, revision: nextHash } } });
    if (kind === "incomplete") read.history.mockImplementation(async request => ({ ...history(request), complete: false }));
    if (kind === "foreign") read.history.mockImplementation(async request => ({ ...history(request), symbol: "PEER" }));
    if (kind === "basis") read.history.mockImplementation(async request => ({ ...history(request), basisDate: "2026-11-26" }));
    if (kind === "duplicate") read.history.mockImplementation(async request => { const result = history(request); result.bars.push(result.bars[0]); return result; });
    if (kind === "failed") read.history.mockRejectedValue(Error("gateway busy"));
    const state: ScreenerCorrectionState = new Map();
    const result = kind === "old-day" ? await repairScreenerBars({ reader: read, state, bars: bars(), symbols: ["POM", "PEER"], start, end, basisDate: "2026-11-28" }) : await repair(read, state);
    expect([...result.rejected]).toEqual(["POM"]);
    expect(result.grouped.get("PEER")).toEqual(rows());
    read.revisions.mockResolvedValue(empty);
    expect((await repair(read, state)).rejected.has("POM")).toBe(true);
  });

  it("retries a known failed correction without persisting the superseded result", async () => {
    const read = reader(), state: ScreenerCorrectionState = new Map();
    read.history.mockRejectedValueOnce(Error("busy"));
    expect((await repair(read, state)).rejected.has("POM")).toBe(true);
    expect((await repair(read, state)).rejected.size).toBe(0);
    expect(read.history).toHaveBeenCalledTimes(2);
  });

  it("keeps peers usable when one ticker's revision coverage cannot be returned", async () => {
    const read = reader();
    read.revisions.mockResolvedValue({ feed: "sip", symbols: {}, unavailableSymbols: ["POM"] } as ScreenerRevisionManifest);
    const result = await repair(read);
    expect([...result.rejected]).toEqual(["POM"]);
    expect(result.grouped.get("PEER")).toEqual(rows());
    expect(read.history).not.toHaveBeenCalled();
  });

  it("keeps optional weighted VWAP separate from corrected OHLCV", async () => {
    const read = reader();
    let repaired = await repair(read);
    expect(repaired.grouped.get("POM")!.get(1795780800)?.vwap).toBeUndefined();
    read.history.mockImplementation(async request => history(request, true));
    repaired = await repair(read);
    expect(repaired.grouped.get("POM")!.get(1795780800)?.vwap).toBe(4);
    expect(() => correctedMinutes({ ...history({ symbol: "POM", start, end }), nextPageToken: "more" }, { symbol: "POM", start, end }, basisDate)).toThrow();
  });
});

describe("Screeners corrected VWAP reconnect", () => {
  it.each([false, true])("qualifies corrected history, weighted values present=%s", async weighted => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(end + MINUTE);
    const read = reader(); read.history.mockImplementation(async request => history(request, weighted));
    const seeds = async function* () { yield* readCorrectedScreenerVwapSeeds(["POM"], { startMs: start, endMs: end }, {}, undefined, read); };
    const worker = new LiveScreenerVwapWorker(["POM"], start, end, end + 10 * MINUTE, {}, seeds);
    await worker.warm(() => {}, new AbortController().signal);
    expect(worker.reading("POM")).toEqual(weighted ? { vwap: 4, vwapAt: end } : null);
    worker.observe("POM", end, 6, 10);
    if (weighted) expect(worker.reading("POM")!.vwap).toBeGreaterThan(4);
    worker.invalidate("POM"); expect(worker.reading("POM")).toBeNull();
  });

  it.each(["pending", "race"])("preserves complete unaffected cached peers during %s corrections", async kind => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(end + MINUTE);
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ feed: "sip", adjustment: "split", frame: "1m", basisDate, end,
      bars: { PEER: [{ time: start / 1000, volume: 10, vwap: 2 }] }, coverage: { PEER: { status: "complete", completedThroughMs: end } } })));
    const read = reader();
    if (kind === "pending") read.revisions.mockResolvedValue({ feed: "sip", symbols: { POM: { minutes: [], pending: true, revision: null } } });
    else {
      read.history.mockImplementation(async request => history(request, true));
      read.revisions.mockResolvedValueOnce(corrected).mockResolvedValue({ feed: "sip", symbols: { POM: { ...corrected.symbols.POM, revision: nextHash } } });
    }
    const batches = [];
    for await (const batch of readCorrectedScreenerVwapSeeds(["POM", "PEER"], { startMs: start, endMs: end }, {
      NODE_ENV: "test", TRADERLINK_ALPACA_GATEWAY_URL: "http://127.0.0.1:12345", TRADERLINK_ALPACA_GATEWAY_TOKEN: "fixture",
    }, undefined, read)) batches.push(batch);
    expect(batches[0].get("POM")).toEqual(partial);
    expect(batches[0].get("PEER")?.seed?.notional).toBe(20);
    expect(read.history).toHaveBeenCalledTimes(kind === "pending" ? 0 : 1);
  });
});

describe("Screeners correction publication", () => {
  it.each([false, true])("repairs POM cache and both account runs, closed=%s", async closed => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(closed ? end + MINUTE : end - 10 * MINUTE);
    const folder = mkdtempSync(join(tmpdir(), "screeners-pom-"));
    vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", join(folder, "fixture.sqlite"));
    vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER", "0");
    const days: ChartMarketSession[] = [];
    for (let at = Date.parse("2025-05-01T12:00:00Z"); at <= Date.parse("2026-11-30T12:00:00Z"); at += 86_400_000) {
      const date = new Date(at);
      if (date.getUTCDay() % 6) days.push({ date: date.toISOString().slice(0, 10), open: "09:30", close: "16:00" });
    }
    const cache: BarCache = { key: "", daily: new Map(), intraday: new Map() };
    const read = reader(); read.revisions.mockResolvedValue(empty);
    const get = vi.fn(async (_path: string, params: URLSearchParams) => {
      const frame = params.get("timeframe"), from = Date.parse(params.get("start")!), until = Date.parse(params.get("end")!);
      const source = frame === "1Day" ? days.map(day => ({ time: easternDayStart(Date.parse(day.date + "T12:00:00Z") / 1000), open: 2, high: 2, low: 2, close: 2, volume: 100 }))
        : frame === "5Min" ? [...aggregateCandles(replay.before, "5m"), { time: Date.parse("2026-11-26T14:30:00Z") / 1000, open: 2, high: 2, low: 2, close: 2, volume: 100 }] : [];
      return { bars: Object.fromEntries(params.get("symbols")!.split(",").map(symbol => [symbol, source.filter(bar => bar.time * 1000 >= from && bar.time * 1000 <= until)
        .map(bar => ({ t: new Date(bar.time * 1000).toISOString(), o: bar.open, h: bar.high, l: bar.low, c: bar.close, v: bar.volume }))])), next_page_token: null };
    });
    const stocks: Listing[] = ["POM", "PEER"].map(symbol => ({ symbol, name: symbol, exchange: "NASDAQ", marketCap: 20_000_000 }));
    const selection = { provider: "alpaca", revision: 0 } as const;
    const collect = () => collectMarketPack({ data: { get }, calendar: days, calendarRange: { start: "2025-05-01", end: "2026-11-30" },
      stocks, universeDate: basisDate, now: Date.now(), cache, corrections: read });
    const owner = (userId: string) => ({ mode: "platform_session", scope: { userId } }) as TraderLinkPlatformRequestIdentity;
    const rule = { ...DEFAULT_DEFINITION, session: "premarket" as const };
    try {
      const first = await collect();
      expect(first.snapshots.premarket.rows.find(row => row.symbol === "POM")!.values.high).toBe(38);
      await publishScreenerPack(join(folder, "stock-screeners-v1"), first, selection);
      for (const user of ["one", "two"]) expect((await createRun(owner(user), rule)).rows.find(row => row.symbol === "POM")!.values.high).toBe(38);
      read.revisions.mockResolvedValue(corrected);
      const fixed = await collect();
      expect(fixed.snapshots.premarket.closed).toBe(closed);
      const expectedVolume = replay.after.filter(bar => bar.time * 1000 < fixed.snapshots.premarket.asOf).reduce((sum, bar) => sum + bar.volume, 0);
      if (closed) expect(expectedVolume).toBe(30_566_502);
      expect(fixed.snapshots.premarket.rows.find(row => row.symbol === "POM")!.values).toMatchObject({ high: 7.41, volume: expectedVolume });
      await publishScreenerPack(join(folder, "stock-screeners-v1"), fixed, selection);
      vi.setSystemTime(Date.now() + 6_000);
      for (const user of ["one", "two"]) expect((await createRun(owner(user), rule)).rows.find(row => row.symbol === "POM")!.values).toMatchObject({ high: 7.41, volume: expectedVolume });
      const count = read.history.mock.calls.length;
      vi.setSystemTime(end + 16 * MINUTE);
      expect((await collect()).snapshots.premarket.rows.find(row => row.symbol === "POM")!.values.high).toBe(7.41);
      expect(read.history).toHaveBeenCalledTimes(count);
    } finally { rmSync(folder, { recursive: true, force: true }); }
  });
});

it("refreshes only the revised ticker from Moomoo's own history and ignores older broker snapshots", async () => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(end + MINUTE);
  const moomoo = vi.fn(async (_selection: unknown, operation: MoomooScreenerOperation) => {
    if (operation.operation === "calendar") {
      const trading_days = [];
      for (let at = Date.parse(operation.start + "T12:00:00Z"); at <= Date.parse(operation.end + "T12:00:00Z"); at += 86_400_000) {
        const date = new Date(at);
        if (date.getUTCDay() % 6) trading_days.push({ time: date.toISOString().slice(0, 10), trade_date_type: "WHOLE" });
      }
      return { ret_code: 0, data: { trading_days } };
    }
    if (operation.operation === "rehab") return { ret_code: 0, data: { rehabs: [] } };
    if (operation.operation !== "history") throw Error("unexpected broker operation");
    const current = replaced && operation.symbol === "POM" ? replay.after.map((bar, index) => ({ ...bar, high: index ? bar.high : 8.25 })) : replay.before;
    const candles = operation.timeframe === "5Min" ? aggregateCandles(current, "5m")
      : operation.timeframe === "1Day" ? [{ time: easternDayStart(Date.parse("2026-11-26T12:00:00Z") / 1000), open: 2, high: 2, low: 2, close: 2, volume: 100 }] : [];
    return { ret_code: 0, data: { kline_list: candles.filter(bar => bar.time * 1000 >= operation.start && bar.time * 1000 <= operation.end)
      .map(bar => ({ time_key: bar.time * 1000 + (operation.timeframe === "1Day" ? 0 : operation.timeframe === "15Min" ? 900_000 : 300_000),
        open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: bar.volume, turnover: 3 * bar.volume })) } };
  });
  let replaced = false;
  const universe = async () => ({ listingDate: basisDate, partialCaps: false, spacingMs: 1500,
    stocks: ["POM", "PEER"].map(symbol => ({ symbol, name: symbol, exchange: "NASDAQ", marketCap: 20_000_000 })) });
  const collector = new ScreenerSnapshotCollector({ universe, moomoo } as unknown as ScreenerProviderTransport,
    { provider: "moomoo", revision: 1 }, new AbortController().signal);
  const observe = (high: number, timestamp = Date.now()) => collector.observeMoomooSnapshots({ ret_code: 0, data: { snapshot_list: [{
    code: "US.POM", data_date: basisDate, update_time: timestamp, pre_high_price: high, pre_price: 3,
  }] } }, ["POM"]);
  observe(38);
  expect((await collector.collect()).snapshots.premarket.rows.find(row => row.symbol === "POM")!.values.high).toBe(38);
  moomoo.mockClear(); vi.setSystemTime(Date.now() + 2_000); observe(8.25);
  const pending = await collector.collect();
  expect(pending.snapshots.premarket.rows.find(row => row.symbol === "POM")!.values.high).toBeUndefined();
  expect(pending.snapshots.premarket.rows.find(row => row.symbol === "PEER")!.values.high).toBe(38);
  replaced = true;
  const result = await collector.collect();
  expect(result.snapshots.premarket.source).toBe("Moomoo");
  expect(result.snapshots.premarket.rows.find(row => row.symbol === "POM")!.values.high).toBe(8.25);
  expect(result.snapshots.premarket.rows.find(row => row.symbol === "PEER")!.values.high).toBe(38);
  expect(moomoo.mock.calls.filter(([, operation]) => operation.operation === "history").every(([, operation]) => operation.operation === "history" && operation.symbol === "POM")).toBe(true);
  observe(38, Date.now() - 1_000);
  expect((await collector.initialMoomooPack()).snapshots.premarket.rows.find(row => row.symbol === "POM")!.values.high).toBe(8.25);
});

describe("Screeners worker revision transport", () => {
  it("splits an overflowing symbol batch, keeps covered peers and marks a still-oversized ticker unqualified without truncating facts", async () => {
    const fetch = vi.fn(async (url: URL) => {
      const symbols = url.searchParams.get("symbols"), from = Number(url.searchParams.get("start")), until = Number(url.searchParams.get("end"));
      if (symbols?.includes(",") || (symbols === "TOOLARGE" && until - from > MINUTE)) return new Response(null, { status: 413 });
      return Response.json({ feed: "sip", generation: 10, symbols: {} });
    });
    vi.stubGlobal("fetch", fetch);
    const transport = screenerCorrections({ NODE_ENV: "test", TRADERLINK_ALPACA_GATEWAY_URL: "http://127.0.0.1:12345", TRADERLINK_ALPACA_GATEWAY_TOKEN: "fixture" })!;
    const result = await transport.revisions({ symbols: ["PEER", "TOOLARGE"], start, end });
    expect(result).toEqual({ feed: "sip", generation: 10, symbols: {}, unavailableSymbols: ["TOOLARGE"] });
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(fetch.mock.calls.every(([url]) => url.pathname === "/trade-revisions")).toBe(true);
  });
  it.each([false, true])("uses shared legacy/neutral contract, neutral=%s", async neutral => {
    vi.stubGlobal("fetch", vi.fn(async (url: URL, init: RequestInit) => {
      expect(url.pathname).toBe(neutral ? "/traderslink/v1/market/trade-revisions" : "/trade-revisions");
      expect(init.cache).toBe("no-store"); expect(init.redirect).toBe("error");
      return Response.json(neutral ? encodeGatewayWire("trade-revisions", corrected) : corrected);
    }));
    const transport = screenerCorrections({ NODE_ENV: "test", TRADERLINK_ALPACA_GATEWAY_URL: "http://127.0.0.1:12345", TRADERLINK_ALPACA_GATEWAY_TOKEN: "fixture",
      ...(neutral ? { TRADERLINK_GATEWAY_CONTRACT: "traderslink.market.1" } : {}) })!;
    expect(await transport.revisions({ symbols: ["POM"], start, end })).toEqual(corrected);
  });
});
