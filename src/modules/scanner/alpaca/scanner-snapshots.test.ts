import { describe, expect, it } from "vitest";
import { normalizeAlpacaScannerBatch } from "./scanner-snapshots";
import type { AlpacaSessionState } from "./session-book";

describe("Alpaca scanner field mapping", () => {
  it("uses post-market totals, yesterday's daily baseline and today's regular close independently", () => {
    const book: AlpacaSessionState = { date: "2026-11-06", regularClose: 960, complete: true, sessions: {
      premarket: { volume: 100, dollarVolume: 100, price: 1, high: 1.5, low: 0.8, providerAt: Date.parse("2026-11-06T12:00:00Z") },
      regular: { volume: 1000, dollarVolume: 2000, price: 2, high: 3, low: 1, providerAt: Date.parse("2026-11-06T20:59:59Z") },
      after_hours: { volume: 400, dollarVolume: 1000, price: 2.5, high: 2.6, low: 2, providerAt: Date.parse("2026-11-06T21:30:00Z") },
    } };
    const payload = { feed: "sip", connected: true, snapshots: { TEST: { prevDailyBar: { t: "2026-11-05T05:00:00Z", c: 0.18 }, adjustedPreviousClose: { symbol: "TEST", price: 1.8, barAt: Date.parse("2026-11-05T05:00:00Z"), adjustment: "split" as const, basisDate: "2026-11-06", fetchedAt: Date.parse("2026-11-06T21:30:00Z") }, dailyBar: { t: "2026-11-06T05:00:00Z", c: 2 }, latestQuote: { bp: 2.49, ap: 2.51 } } }, sessionTotals: { TEST: book } };
    const input = { payload, requestedSymbols: ["TEST"], session: "after_hours" as const, tradingDate: "2026-11-06", receivedAt: Date.parse("2026-11-06T21:30:01Z") };
    const result = normalizeAlpacaScannerBatch(input);
    expect(result.snapshots[0]).toMatchObject({ provider: "alpaca", volume: 400, dollarVolume: 1000, price: 2.5, baseline: 1.8, regularClosePrice: 2, premarketVolume: 100, dayHigh: 3, dayLow: 0.8 });
    book.complete = false;
    expect(normalizeAlpacaScannerBatch(input).snapshots).toHaveLength(0);
    book.complete = true; payload.connected = false;
    expect(() => normalizeAlpacaScannerBatch(input)).toThrow("alpaca_stream_unavailable");
  });
});
