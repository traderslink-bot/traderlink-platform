// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const read = vi.hoisted(() => vi.fn());
vi.mock("./client", () => ({ readAlpacaHistory: read }));
import { fetchAlpacaIndicatorHistory, fetchAlpacaWatchlistCandles } from "./watchlist-adapter";
import { IndicatorRequestCoordinator } from "@/src/lib/live-watchlist/indicators/indicator-request-coordinator";
beforeEach(() => { read.mockReset(); read.mockResolvedValue({ symbol: "TEST", feed: "sip", adjustment: "split", complete: true, bars: [{ time: 1793975400, open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 }] }); });
describe("Alpaca Watchlist bridges", () => {
  it("preserves the AI candle contract in seconds and does not invent exact turnover", async () => {
    const result = await fetchAlpacaWatchlistCandles({ symbol: "TEST", interval: "1m", startTime: 1793975400, endTime: 1793976000, includeExtendedHours: true });
    expect(read.mock.calls[0][0]).toMatchObject({ start: 1793975400000, end: 1793976000000, timeframe: "1Min" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.candles[0]).toMatchObject({ time: 1793975400, closeDecimal: "1.5", volumeDecimal: "100", turnoverDecimal: null });
  });
  it("uses the existing indicator coordinator with truthful Alpaca identity and millisecond starts", async () => {
    const audit: string[] = [];
    const coordinator = new IndicatorRequestCoordinator({ audit: event => audit.push(event.provider) });
    const result = await fetchAlpacaIndicatorHistory({ request: { symbol: "TEST", timeframe: "5m", start: 1793975400000, end: 1793976000000 }, coordinator, consumer: "owner-test", budget: { attemptsRemaining: 10, retriesRemaining: 1 }, isCurrent: async () => true });
    expect(result.provider).toBe("alpaca"); expect(result.adjustment).toBe("alpaca-split"); expect(result.outcome).toBe("complete");
    expect(result.bars[0].start).toBe(1793975400000); expect(audit.every(provider => provider === "alpaca")).toBe(true);
  });
});
