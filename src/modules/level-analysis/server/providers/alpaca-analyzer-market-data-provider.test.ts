// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { analyzeDailyTrade } from "../daily-trade-analyzer";
import { validateDailyTradeExecutionCandles } from "../daily-trade-execution-candle-validation";
import { AlpacaAnalyzerMarketDataProvider } from "./alpaca-analyzer-market-data-provider";

const startTime = Date.parse("2026-10-09T08:00:00Z") / 1000;
const request = { symbol: "TEST", interval: "1m", includeExtendedHours: true, startTime, endTime: startTime + 180 } as const;
const bar = { time: startTime, open: 3.8, high: 4.25, low: 3.79, close: 4, volume: 12345 };
const receipt = { symbol: "TEST", feed: "sip", adjustment: "raw", complete: true, nextPageToken: null, bars: [bar] };

describe("Trade Analyzer Alpaca gateway", () => {
  it.each([
    ["REV", 10, 200], ["FWD", 0.25, 8000], ["CTRL", 1, 2000],
  ] as const)("preserves native prices and shares on both sessions for %s", async (symbol, priceRatio, afterShares) => {
    const afterTime = startTime + 86400;
    const send = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ ...receipt, symbol }))
      .mockResolvedValueOnce(Response.json({ ...receipt, symbol, bars: [{
        time: afterTime, open: 4 * priceRatio, high: 4.25 * priceRatio,
        low: 3.75 * priceRatio, close: 4 * priceRatio, volume: afterShares,
      }] }));
    const provider = new AlpacaAnalyzerMarketDataProvider("https://gateway.example", "test-token", send);
    const before = await provider.fetch({ ...request, symbol });
    const after = await provider.fetch({ ...request, symbol, startTime: afterTime, endTime: afterTime + 180 });
    if (!before.ok || !after.ok) throw new Error("Expected raw evidence for both sessions");
    const events = Object.freeze([
      Object.freeze({ eventId: "entry", kind: "entry" as const, feesDecimal: null, sequence: 0,
        executedAtUtc: new Date(startTime * 1000).toISOString(), priceDecimal: "4", quantityDecimal: "2000" }),
      Object.freeze({ eventId: "exit", kind: "final_exit" as const, feesDecimal: null, sequence: 1,
        executedAtUtc: new Date(afterTime * 1000).toISOString(), priceDecimal: String(4 * priceRatio),
        quantityDecimal: String(afterShares) }),
    ]);
    expect(validateDailyTradeExecutionCandles({
      candles: [...before.candles, ...after.candles], direction: "long", events,
    })).toEqual([]);
    expect(before.candles[0]).toMatchObject({ time: startTime, closeDecimal: "4", volumeDecimal: "12345" });
    expect(after.candles[0]).toMatchObject({ time: afterTime, closeDecimal: String(4 * priceRatio), volumeDecimal: String(afterShares) });
    // Separate day trades on either side of the split use the original share
    // count and price of their own session.
    for (const [bar, opening] of [[before.candles[0], events[0]], [after.candles[0], events[1]]] as const) {
      const exitPrice = Number(opening.priceDecimal) * 1.05;
      const fills = [
        { ...opening, kind: "entry" as const, sequence: 0, feesDecimal: "0" },
        { ...opening, kind: "final_exit" as const, sequence: 1, eventId: "final",
          executedAtUtc: new Date((bar.time + 60) * 1000).toISOString(),
          priceDecimal: String(exitPrice), feesDecimal: "0" },
      ];
      const candles = [bar, { ...bar, time: bar.time + 60 }];
      expect(validateDailyTradeExecutionCandles({ candles, direction: "long", events: fills })).toEqual([]);
      const result = analyzeDailyTrade({ candles, direction: "long", events: fills, dailyRanges: [] });
      expect(result.eventSnapshots.map(({ event }) => event)).toEqual(fills);
      expect(Number(result.greenToRed.finalPnlDecimal)).toBeCloseTo(400, 8);
    }
  });

  it("matches an original fill from before a 1-for-10 reverse split against the raw candle", async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(Response.json(receipt));
    const result = await new AlpacaAnalyzerMarketDataProvider("https://gateway.example", "test-token", send).fetch(request);
    if (!result.ok) throw new Error("Expected raw candle evidence");
    const execution = {
      eventId: "pre-split-fill", executedAtUtc: new Date((startTime + 35) * 1000).toISOString(),
      feesDecimal: null, kind: "entry", priceDecimal: "3.80", quantityDecimal: "2000", sequence: 0,
    } as const;
    expect(validateDailyTradeExecutionCandles({
      candles: result.candles, direction: "long", events: [execution],
    })).toEqual([]);
    expect(validateDailyTradeExecutionCandles({
      candles: [{ ...result.candles[0], lowDecimal: "37.90", highDecimal: "42.50" }],
      direction: "long", events: [execution],
    })).toMatchObject([{ kind: "execution_price_outside_candle" }]);
  });

  it("requests an end-exclusive raw SIP window and preserves open-time bars, volume and gaps", async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ...receipt, bars: [{ ...bar, time: startTime + 120 }, bar] }));
    const result = await new AlpacaAnalyzerMarketDataProvider("https://gateway.example", "test-token", send).fetch(request);
    expect(send.mock.calls[0]?.[0]).toEqual(new URL(
      `https://gateway.example/history?symbol=TEST&timeframe=1Min&adjustment=raw&start=${startTime * 1000}&end=${request.endTime * 1000 - 1}`,
    ));
    expect(result).toMatchObject({ ok: true, candles: [
      { time: startTime, openDecimal: "3.8", highDecimal: "4.25", volumeDecimal: "12345", turnoverDecimal: null },
      { time: startTime + 120 },
    ] });
  });

  it.each([
    { adjustment: "split" }, { feed: "iex" }, { complete: false }, { nextPageToken: "next" },
    { bars: [bar, bar] }, { bars: [{ ...bar, time: request.endTime }] },
  ])("rejects incompatible or incomplete evidence", async (override) => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ...receipt, ...override }));
    expect(await new AlpacaAnalyzerMarketDataProvider("https://gateway.example", "test-token", send).fetch(request))
      .toMatchObject({ ok: false, code: "provider_unavailable" });
  });

  it("distinguishes an empty response from a retryable gateway failure", async () => {
    const send = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ ...receipt, bars: [] }))
      .mockResolvedValueOnce(new Response(null, { status: 429 }));
    const provider = new AlpacaAnalyzerMarketDataProvider("https://gateway.example", "test-token", send);
    expect(await provider.fetch(request)).toMatchObject({ code: "coverage_unavailable" });
    expect(await provider.fetch(request)).toMatchObject({ code: "provider_unavailable", failureReasonCode: "alpaca_gateway_busy" });
  });
});
