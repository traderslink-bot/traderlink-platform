// @vitest-environment node
import { expect, it } from "vitest";
import { normalizeAlpacaScannerBatch, type AlpacaQuoteReply } from "./scanner-snapshots";
import { LiveScannerEngine } from "../live/engine";
import { initialConfiguration } from "../live/settings";
import type { DailyUniverse, ScannerSession } from "../live/contracts";

const now = Date.parse("2026-11-09T15:00:00Z"), date = "2026-11-09";
const samples = [
  { symbol: "REVERSE", raw: .05, adjusted: 5, price: 5.5 },
  { symbol: "FORWARD", raw: 400, adjusted: 100, price: 110 },
  { symbol: "FRACTION", raw: 1.76, adjusted: 4.928, price: 5.78 },
  { symbol: "REAL", raw: 1, adjusted: 1, price: 2 },
  { symbol: "MISSING", raw: .01, adjusted: null, price: 10 },
];
function fixture(session: ScannerSession = "regular") {
  const snapshots: AlpacaQuoteReply["snapshots"] = {}, sessionTotals: AlpacaQuoteReply["sessionTotals"] = {};
  for (const sample of samples) {
    snapshots[sample.symbol] = { prevDailyBar: { t: "2026-11-06T05:00:00Z", c: sample.raw },
      adjustedPreviousClose: sample.adjusted === null ? null : { symbol: sample.symbol, price: sample.adjusted,
        barAt: Date.parse("2026-11-06T05:00:00Z"), adjustment: "split", basisDate: date, fetchedAt: now } };
    const total = { price: sample.price, volume: 1_000_000, dollarVolume: sample.price * 1_000_000,
      high: sample.price, low: sample.price, providerAt: now };
    sessionTotals[sample.symbol] = { date, regularClose: 960, complete: true, sessions: {
      premarket: total, regular: { ...total, price: 10 }, after_hours: total,
      ...(session === "regular" ? { regular: total } : {}),
    } };
  }
  const payload: AlpacaQuoteReply = { feed: "sip", connected: true, snapshots, sessionTotals };
  return normalizeAlpacaScannerBatch({ payload, requestedSymbols: samples.map(row => row.symbol), session, tradingDate: date, receivedAt: now });
}
function evaluate(session: ScannerSession = "regular") {
  const configuration = initialConfiguration();
  const filters = { minimumPrice: 0, maximumPrice: null, maximumMarketCap: 100_000_000,
    maximumFloat: null, minimumVolume: 0, minimumDollarVolume: 0, minimumSessionGain: null, maximumSpreadPercent: null };
  const universe: DailyUniverse = { version: 1, tradingDate: date, acceptedAtUtc: new Date(now).toISOString(),
    lastCollectionAtUtc: new Date(now).toISOString(), latestUploadCount: samples.length, sourceHashes: [],
    stocks: samples.map(row => ({ symbol: row.symbol, exchange: "NASDAQ", marketCapAtCollection: 10_000_000 })) };
  return new LiveScannerEngine().evaluate({ universe, tradingDate: date, session,
    configuration: { ...configuration, enabled: true, gainers: { ...configuration.gainers, filters: {
      premarket: filters, regular: filters, after_hours: filters } } },
    snapshots: fixture(session).snapshots, floats: new Map(), news: new Map(), now });
}

it("ranks actual moves above reverse-split artifacts, preserving forward and fractional split changes", () => {
  const result = evaluate();
  expect(result.gainers.rows.map(row => row.symbol)).toEqual(["REAL", "FRACTION", "FORWARD", "REVERSE"]);
  expect(result.gainers.rows.find(row => row.symbol === "REVERSE")?.sessionGain).toBeCloseTo(10);
  expect(result.gainers.rows.find(row => row.symbol === "FORWARD")?.sessionGain).toBeCloseTo(10);
  expect(result.gainers.rows[0].sessionGain).toBe(100);
  const reverse = fixture().snapshots.find(row => row.symbol === "REVERSE")!;
  expect(reverse).toMatchObject({ price: 5.5, volume: 1_000_000, dollarVolume: 5_500_000, baseline: 5 });
});

it("never ranks an unknown adjustment against a raw close even with no gain threshold", () => {
  const result = evaluate();
  expect(result.gainers.rows.some(row => row.symbol === "MISSING")).toBe(false);
  expect(result.dayGainers.rows.some(row => row.symbol === "MISSING")).toBe(false);
  expect(fixture().snapshots.find(row => row.symbol === "MISSING")?.baseline).toBeNull();
});

it("keeps after-hours gain against today's actual regular close independent of adjusted prior-day history", () => {
  const row = evaluate("after_hours").gainers.rows.find(row => row.symbol === "MISSING")!;
  expect(row.comparisonPrice).toBe(10); expect(row.sessionGain).toBe(0); expect(row.gainBasis).toBe("today_regular_close");
});
