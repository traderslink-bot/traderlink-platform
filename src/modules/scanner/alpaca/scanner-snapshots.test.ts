import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CandleSplitEventStore } from "../../market-data/candle-history/split-event-store";
import { describe, expect, it, vi } from "vitest";
import { normalizeAlpacaScannerBatch } from "./scanner-snapshots";
import { ScannerSplitReference } from "./scanner-split-reference";
import type { AlpacaSplitEvent } from "./chart-vwap-events";
import type { AlpacaHistoryRequest } from "./rest-data";
import type { AlpacaTradingStatus } from "./trading-status";
import type { AlpacaSessionState } from "./session-book";
import { scanRowFromSnapshot } from "../custom/market-facts";
import { CustomScanMarket } from "../custom/market";
import { scannerVolumeBreakdown } from "../live/volume";
import { activeSession, type MarketDay } from "../live/sessions";

describe("Alpaca scanner field mapping", () => {
  it("carries Day Vol through the open and leaves it unchanged once after-hours trading begins on an early close", () => {
    const date = "2026-11-27";
    const early: MarketDay = { date, verified: true, open: true, regularCloseEastern: "13:00", extendedCloseEastern: "17:00" };
    const observations = [
      ["14:29:59", 143_699_952, null, null, 143_699_952],
      ["14:30:00", 143_699_952, 0, null, 143_699_952],
      ["17:59:59", 143_699_952, 120_709_317, null, 264_409_269],
      ["18:00:00", 143_699_952, 120_709_317, 0, 264_409_269],
      ["18:20:00", 143_699_952, 120_709_317, 9_000, 264_409_269],
    ] as const;
    for (const [time, premarketVolume, regularVolume, postMarketVolume, dayVolume] of observations) {
      const session = activeSession(early, Date.parse(date + "T" + time + "Z"));
      if (!session) throw Error("Expected an open session");
      expect(scannerVolumeBreakdown({ session, premarketVolume, regularVolume, postMarketVolume }))
        .toEqual({ dayVolume, premarketVolume, regularVolume, postMarketVolume });
    }
    expect(scannerVolumeBreakdown({ session: "regular", regularVolume: 7 }).dayVolume).toBeNull();
    expect(scannerVolumeBreakdown({ session: "regular", premarketVolume: 0, regularVolume: 7 }).dayVolume).toBe(7);
  });

  it("uses post-market totals, yesterday's daily baseline and today's regular close independently", () => {
    const book: AlpacaSessionState = { date: "2026-11-06", regularClose: 960, complete: true, openingRanges: { 5: {high:2,low:1} }, sessions: {
      premarket: { volume: 100, dollarVolume: 100, price: 1, high: 1.5, low: 0.8, providerAt: Date.parse("2026-11-06T12:00:00Z") },
      regular: { volume: 1000, dollarVolume: 2000, price: 2, high: 3, low: 1, providerAt: Date.parse("2026-11-06T20:59:59Z") },
      after_hours: { open: 2.3, volume: 400, dollarVolume: 1000, price: 2.5, high: 2.6, low: 2, providerAt: Date.parse("2026-11-06T21:30:00Z") },
    } };
    const payload = { feed: "sip", connected: true, snapshots: { TEST: { prevDailyBar: { t: "2026-11-05T05:00:00Z", c: 0.18 }, adjustedPreviousClose: { symbol: "TEST", price: 1.8, high: 3, low: 1, barAt: Date.parse("2026-11-05T05:00:00Z"), adjustment: "split" as const, basisDate: "2026-11-06", fetchedAt: Date.parse("2026-11-06T21:30:00Z") }, dailyBar: { t: "2026-11-06T05:00:00Z", c: 2 }, latestQuote: { bp: 2.49, ap: 2.51, t: "2026-11-06T21:30:00Z" } } }, sessionTotals: { TEST: book } };
    const input = { payload, requestedSymbols: ["TEST"], session: "after_hours" as const, tradingDate: "2026-11-06", receivedAt: Date.parse("2026-11-06T21:30:01Z") };
    const result = normalizeAlpacaScannerBatch(input);
    expect(result.snapshots[0]).toMatchObject({ provider: "alpaca", volume: 400, dollarVolume: 1000, price: 2.5, baseline: 1.8, regularClosePrice: 2, premarketVolume: 100, regularHigh: 3, postMarketHigh: 2.6, dayHigh: 3, dayLow: 0.8 });
    const market = new CustomScanMarket();
    const asRow = (receivedAt: number) => scanRowFromSnapshot(
      normalizeAlpacaScannerBatch({ ...input, receivedAt }).snapshots[0], { exchange: "NASDAQ" },
    );
    const fresh = asRow(input.receivedAt);
    expect(fresh).toMatchObject({ dayVolume: 1100, premarketVolume: 100, regularVolume: 1000, postMarketVolume: 400, volume: 400 });
    expect(fresh.facts).toMatchObject({
      bidAskSpread: 0.02, bidAskSpreadPercent: 0.8,
      premarketLow: 0.8, previousDayHigh: 3, previousDayLow: 1, previousDayClose: 1.8, regularLow: 1, regularVolume: 1000,
      postMarketLow: 2, postMarketVolume: 400, fromPostMarketLow: 25,
    });
    expect(fresh.facts?.sessionOpen).toBe(2.3);
    expect(fresh.facts?.sessionGap).toBeCloseTo(15);
    expect(fresh.facts?.fromRegularHigh).toBeCloseTo(-100 / 6);
    expect(fresh.facts?.fromPostMarketHigh).toBeCloseTo(-100 / 26);
    const query = { key: "main", page: 1, definition: {
      rules: [{ metric: "bidAskSpread" as const, minimum: null, maximum: 0.02 }],
      sort: { metric: "bidAskSpread" as const, direction: "asc" as const },
    } };
    market.set("open", input.receivedAt, "after_hours", [fresh]);
    expect(market.query(query)).toMatchObject({ total: 1, rows: [{ matches: [0.02] }] });
    const openingRangeQuery = { key:"opening",page:1,definition:{
      rules:[{metric:"fromOpeningRangeHigh" as const,minimum:25,maximum:null,minutes:5}],
      sort:{metric:"openingRangeHigh" as const,direction:"desc" as const,minutes:5},
    }};
    expect(market.query(openingRangeQuery)).toMatchObject({total:1,rows:[{matches:[25],sortValue:2}]});
    const later = input.receivedAt + 30_000;
    market.set("open", later, "after_hours", [asRow(later)]);
    expect(market.query(query)).toMatchObject({ total: 0, incomplete: 1 });
    book.complete = false;
    expect(normalizeAlpacaScannerBatch(input).snapshots).toHaveLength(0);
    book.complete = true; payload.connected = false;
    expect(() => normalizeAlpacaScannerBatch(input)).toThrow("alpaca_stream_unavailable");
  });
});


it("holds a cross-session corporate-action gap until Alpaca confirms the split and the adjusted bar", async () => {
  const date = "2026-11-23";
  let now = Date.parse(date + "T14:00:01Z");
  const barAt = Date.parse("2026-11-20T05:00:00Z");
  const raw = { time: barAt / 1000, open: 0.19, high: 0.21, low: 0.18, close: 0.2, volume: 10_000 };
  const split = { ...raw, open: 1.9, high: 2.1, low: 1.8, close: 2, volume: 1_000 };
  const reference = { symbol: "TEST", basisDate: date, adjustment: "split" as const, barAt, price: raw.close, fetchedAt: now };
  const status: AlpacaTradingStatus = { symbol: "TEST", halted: false, haltedAt: "2026-11-21T00:50:00Z",
    observedAt: date + "T14:00:00Z", tradeResumedAt: date + "T14:00:00Z",
    statusCode: "T", reasonCode: "M1", reason: "Corporate action", tape: "C" };

  let events: AlpacaSplitEvent[] = [];
  let adjusted = raw;
  const history = vi.fn(async (request: AlpacaHistoryRequest, background?: boolean) => {
    expect(background).toBe(true);
    expect([request.symbol, request.start, request.timeframe]).toEqual(["TEST", barAt, "1Day"]);
    return { symbol: request.symbol, basisDate: date, feed: "sip" as const, adjustment: request.adjustment ?? ("split" as const),
      bars: [request.adjustment === "raw" ? raw : adjusted], complete: true, nextPageToken: null };
  });
  const splitHistory = vi.fn(async () => ({ symbol: "TEST", basisDate: date, revision: "fixture", events }));
  const notify = vi.fn();
  const guard = new ScannerSplitReference({ history }, splitHistory, notify, () => now);
  const normalize = (price: number, status: AlpacaTradingStatus | null) => {
    const empty = { volume: 0, dollarVolume: null, price: null, high: null, low: null, providerAt: null };
    const result = normalizeAlpacaScannerBatch({
      requestedSymbols: ["TEST"], session: "premarket", tradingDate: date, receivedAt: now,
      payload: { feed: "sip", connected: true, snapshots: { TEST: { tradingStatus: status,
        adjustedPreviousClose: guard.read(reference, status) } },
        sessionTotals: { TEST: { date, regularClose: 960, complete: true, sessions: {
          premarket: { price, open: price, volume: 12_000, dollarVolume: price * 12_000, high: price, low: price, providerAt: now },
          regular: empty, after_hours: empty,
        } } } },
    });
    return scanRowFromSnapshot(result.snapshots[0], { exchange: "NASDAQ" });
  };
  const pending = normalize(2.1, status);
  expect(pending).toMatchObject({ price: 2.1, volume: 12_000, dayChange: null });
  expect(pending.facts?.sessionGap ?? null).toBeNull();
  await new Promise(resolve => setImmediate(resolve));
  expect(history).not.toHaveBeenCalled();

  events = [{ providerEventId: "split", effectiveDate: date, processedDate: date, kind: "reverse",
    reportedSymbol: "TEST", successorSymbol: null, oldShares: 10, newShares: 1 }];
  now += 31_000;
  expect(normalize(2.1, status).dayChange).toBeNull();
  await new Promise(resolve => setImmediate(resolve));
  expect(history).toHaveBeenCalledTimes(2);
  expect(notify).not.toHaveBeenCalled();

  adjusted = split;
  now += 31_000;
  expect(normalize(2.1, status).dayChange).toBeNull();
  await vi.waitFor(() => expect(notify).toHaveBeenCalledWith("TEST"));
  const confirmed = normalize(2.1, status);
  expect(confirmed.dayChange).toBeCloseTo(5);
  expect(confirmed.facts?.previousDayClose).toBe(2);
  expect(confirmed.facts?.sessionGap).toBeCloseTo(5);

  for (const [price, change] of [[0.26, 30], [0.3, 50], [0.36, 80]]) {
    expect(normalize(price, null).dayChange).toBeCloseTo(change);
  }
  expect(normalize(0.36, { ...status, reasonCode: "T1" }).dayChange).toBeCloseTo(80);
  expect(splitHistory).toHaveBeenCalledTimes(3);
});

it("protects an Alpaca-confirmed split after restart before a halt code arrives", async () => {
  const directory = mkdtempSync(join(tmpdir(), "scanner-effective-split-"));
  const path = join(directory, "split-events.sqlite");
  const date = "2026-11-24";
  let now = Date.parse(date + "T11:00:01Z");
  const effective = { symbol: "TEST", basisDate: date, revision: "current-split", events: [{
    providerEventId: "new", effectiveDate: date, processedDate: date, kind: "reverse" as const,
    reportedSymbol: "TEST", successorSymbol: null, oldShares: 20, newShares: 1,
  }] };
  const old = { ...effective, symbol: "OLD", basisDate: "2026-11-23", revision: "old-day",
    events: [{ ...effective.events[0], reportedSymbol: "OLD", effectiveDate: "2026-11-23", processedDate: "2026-11-23" }] };
  const unrelated = { ...old, basisDate: date };
  try {
    expect(CandleSplitEventStore.readEffectiveFile(path, date)).toEqual([]);
    const store = new CandleSplitEventStore(path);
    try {
      store.save(effective);
      store.save(unrelated);
    } finally { store.close(); }
    const events = CandleSplitEventStore.readEffectiveFile(path, date);
    expect(events).toEqual([effective]);
    expect(CandleSplitEventStore.readEffectiveFile(path, "2026-11-25")).toEqual([]);

    const barAt = Date.parse("2026-11-23T05:00:00Z");
    const raw = { time: barAt / 1000, open: 0.2, high: 0.2, low: 0.2, close: 0.2, volume: 20_000 };
    const adjusted = { ...raw, open: 4, high: 4, low: 4, close: 4, volume: 1_000 };
    let splitBar = raw;
    const history = vi.fn(async (request: AlpacaHistoryRequest) => ({
      symbol: request.symbol, adjustment: request.adjustment ?? ("split" as const),
      basisDate: date, feed: "sip" as const, complete: true, nextPageToken: null,
      bars: [request.adjustment === "raw" ? raw : splitBar],
    }));
    const corporateActions = vi.fn(async () => { throw Error("unexpected_corporate_action_read"); });
    const notify = vi.fn();
    const guard = new ScannerSplitReference({ history }, corporateActions, notify, () => now);
    const reference = { symbol:"TEST", basisDate: date, barAt, price: raw.close, adjustment: "split" as const, fetchedAt: now };
    for (const notice of events) guard.remember(notice);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(guard.read(reference, null)).toBeNull();
    await new Promise(resolve => setImmediate(resolve));
    expect(notify).toHaveBeenCalledTimes(1);

    splitBar = adjusted;
    now += 31_000;
    expect(guard.read(reference, null)).toBeNull();
    await vi.waitFor(() => expect(notify).toHaveBeenCalledTimes(2));
    expect(guard.read(reference, null)).toMatchObject({ price: 4, barAt });
    expect(corporateActions).not.toHaveBeenCalled();
    const control = { ...reference, symbol: "OLD" };
    expect(guard.read(control, null)).toBe(control);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
