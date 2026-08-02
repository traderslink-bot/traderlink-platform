import { createHash } from "node:crypto";

import { YahooChartMarketDataProvider } from "./yahoo-chart-market-data-provider";

describe("YahooChartMarketDataProvider", () => {
  it("requests only bounded market coordinates with extended hours and normalizes provider candles", async () => {
    let requestedUrl = "";
    const provider = new YahooChartMarketDataProvider(async (input) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify({
        chart: {
          error: null,
          result: [{
            meta: { exchangeTimezoneName: "America/New_York", gmtoffset: -14400 },
            timestamp: [100, 160, 220],
            indicators: { quote: [{
              open: [10, 11, null],
              high: [11, 12, null],
              low: [9, 10, null],
              close: [10.5, 11.5, null],
              volume: [100, 200, null],
            }] },
          }],
        },
      }), { status: 200 });
    });
    const result = await provider.fetch({
      symbol: "TEST",
      interval: "1m",
      startTime: 100,
      endTime: 400,
      includeExtendedHours: true,
    });
    expect(requestedUrl).toContain("includePrePost=true");
    expect(requestedUrl).toContain("interval=1m");
    expect(requestedUrl).toContain("period1=100");
    expect(requestedUrl).toContain("period2=400");
    expect(requestedUrl).not.toContain("account");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.candles).toEqual([
      {
        time: 100,
        openDecimal: "10",
        highDecimal: "11",
        lowDecimal: "9",
        closeDecimal: "10.5",
        volumeDecimal: "100",
      },
      {
        time: 160,
        openDecimal: "11",
        highDecimal: "12",
        lowDecimal: "10",
        closeDecimal: "11.5",
        volumeDecimal: "200",
      },
    ]);
    expect(result.normalizedCandleSha256).toBe(
      createHash("sha256").update(`${JSON.stringify(result.candles)}\n`, "utf8").digest("hex"),
    );
  });

  it("returns an honest failure for invalid, empty, and unavailable provider responses", async () => {
    const invalid = new YahooChartMarketDataProvider(async () =>
      new Response("not-json", { status: 200 }));
    await expect(invalid.fetch({
      symbol: "TEST",
      interval: "1m",
      startTime: 100,
      endTime: 400,
      includeExtendedHours: true,
    })).resolves.toMatchObject({ ok: false, code: "invalid_payload" });

    const unavailable = new YahooChartMarketDataProvider(async () => {
      throw new Error("offline");
    });
    await expect(unavailable.fetch({
      symbol: "TEST",
      interval: "1m",
      startTime: 100,
      endTime: 400,
      includeExtendedHours: true,
    })).resolves.toMatchObject({ ok: false, code: "provider_unavailable" });
  });

  it.each([
    {
      label: "duplicate timestamps",
      timestamp: [100, 100],
      quote: {
        open: [10, 10], high: [11, 11], low: [9, 9], close: [10.5, 10.5], volume: [100, 100],
      },
      reason: "provider_timestamps_not_strictly_increasing",
    },
    {
      label: "out-of-order timestamps",
      timestamp: [160, 100],
      quote: {
        open: [10, 10], high: [11, 11], low: [9, 9], close: [10.5, 10.5], volume: [100, 100],
      },
      reason: "provider_timestamps_not_strictly_increasing",
    },
    {
      label: "impossible OHLC values",
      timestamp: [100],
      quote: {
        open: [12], high: [11], low: [10], close: [11.5], volume: [100],
      },
      reason: "provider_candle_ohlcv_invalid",
    },
  ])("rejects the entire provider set for $label", async ({ timestamp, quote, reason }) => {
    const provider = new YahooChartMarketDataProvider(async () =>
      new Response(JSON.stringify({
        chart: {
          error: null,
          result: [{ timestamp, indicators: { quote: [quote] } }],
        },
      }), { status: 200 }));

    await expect(provider.fetch({
      symbol: "TEST",
      interval: "1m",
      startTime: 100,
      endTime: 400,
      includeExtendedHours: true,
    })).resolves.toMatchObject({
      ok: false,
      code: "invalid_payload",
      failureReasonCode: reason,
    });
  });
});
