import { describe, expect, it } from "vitest";
import { buildDynamicLevels } from "../dynamic-levels/build-dynamic-levels";
import { normalizeCandles } from "../../raw-trade-timeline/normalizers/normalize-candle";

describe("buildDynamicLevels", () => {
  it("builds factual dynamic levels from available candle data", () => {
    const dynamicLevels = buildDynamicLevels({
      candles: normalizeCandles([
        {
          symbol: "ABCD",
          timestamp: "2024-04-12T13:30:00.000Z",
          timeframe: "1m",
          open: 1,
          high: 1.04,
          low: 0.99,
          close: 1.03,
          volume: 12000,
        },
        {
          symbol: "ABCD",
          timestamp: "2024-04-12T13:31:00.000Z",
          timeframe: "1m",
          open: 1.03,
          high: 1.08,
          low: 1.02,
          close: 1.07,
          volume: 18000,
        },
        {
          symbol: "ABCD",
          timestamp: "2024-04-12T13:32:00.000Z",
          timeframe: "1m",
          open: 1.07,
          high: 1.13,
          low: 1.06,
          close: 1.12,
          volume: 24000,
        },
      ]),
    });

    expect(dynamicLevels.vwap).toBe(1.069259);
    expect(dynamicLevels.ema9).toBe(1.0544);
    expect(dynamicLevels.ema20).toBe(1.042018);
  });
});
