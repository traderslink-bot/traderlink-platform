// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { AlpacaRuntimeHistoricalProvider, AlpacaRuntimeLivePriceProvider, readAlpacaRuntimeReferencePrice } from "./runtime-providers";
afterEach(() => vi.useRealTimers());
describe("portable hosted runtime Alpaca adapters", () => {
  it("preserves the runtime historical response contract and actual provider identity", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ symbol: "NWGL", feed: "sip", adjustment: "split", complete: true, bars: [{ time: 1793975400, open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 }] }));
    const provider = new AlpacaRuntimeHistoricalProvider({ url: "https://gateway.example/", token: "private-gateway", fetcher });
    const response = await provider.fetchCandles({ symbol: "NWGL", timeframe: "4h", lookbackBars: 100 }, { plannedBarCount: 150, requestStartTimestamp: 1793975000000, requestEndTimestamp: 1793976000000 });
    expect(response.provider).toBe("alpaca"); expect(response.candles[0].timestamp).toBe(1793975400000);
    expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.get("timeframe")).toBe("4Hour");
    expect(JSON.stringify(response)).not.toContain("private-gateway");
  });
  it("polls the shared VPS cache with real trade times, suppresses duplicates and aborts on stop", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-06T15:01:00Z"));
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ feed: "sip", connected: true, snapshots: { NWGL: { latestTrade: { p: 2, t: "2026-11-06T15:00:59Z" }, latestQuote: { bp: 1.99, ap: 2.01 } } } }));
    const updates: unknown[] = [];
    const provider = new AlpacaRuntimeLivePriceProvider({ url: "https://gateway.example/", token: "private-gateway", fetcher });
    await provider.start([{ symbol: "NWGL", active: true }], update => updates.push(update));
    await vi.advanceTimersByTimeAsync(5001);
    expect(updates).toEqual([{ symbol: "NWGL", timestamp: Date.parse("2026-11-06T15:00:59Z"), lastPrice: 2, bid: 1.99, ask: 2.01 }]);
    await provider.stop(); const count = fetcher.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10000); expect(fetcher).toHaveBeenCalledTimes(count);
  });
  it("returns the actual reference time for the existing Stock Levels freshness validator", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json({ feed: "sip", snapshots: { NWGL: { latestTrade: { p: 2, t: "2026-11-06T15:00:59Z" } } } }));
    expect(await readAlpacaRuntimeReferencePrice("NWGL", { url: "https://gateway.example/", token: "private-gateway", fetcher })).toEqual({ price: 2, asOf: Date.parse("2026-11-06T15:00:59Z"), source: "alpaca" });
  });
});
