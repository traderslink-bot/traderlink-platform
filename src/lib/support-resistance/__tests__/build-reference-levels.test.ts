import { describe, expect, it } from "vitest";
import { buildReferenceLevels } from "../reference-levels/build-reference-levels";
import { normalizeCandles } from "../../raw-trade-timeline/normalizers/normalize-candle";

describe("buildReferenceLevels", () => {
  it("builds previous-day and premarket reference levels from normalized candles", () => {
    const referenceLevels = buildReferenceLevels({
      allCandles: normalizeCandles([
        {
          symbol: "ABCD",
          timestamp: "2024-04-11T19:58:00.000Z",
          timeframe: "1m",
          open: 1.02,
          high: 1.08,
          low: 1.01,
          close: 1.06,
          volume: 12000,
        },
        {
          symbol: "ABCD",
          timestamp: "2024-04-11T19:59:00.000Z",
          timeframe: "1m",
          open: 1.06,
          high: 1.1,
          low: 1.05,
          close: 1.09,
          volume: 10000,
        },
        {
          symbol: "ABCD",
          timestamp: "2024-04-12T12:00:00.000Z",
          timeframe: "1m",
          open: 1.11,
          high: 1.14,
          low: 1.1,
          close: 1.13,
          volume: 9000,
          sessionBucket: "pre_market",
        },
        {
          symbol: "ABCD",
          timestamp: "2024-04-12T12:01:00.000Z",
          timeframe: "1m",
          open: 1.13,
          high: 1.16,
          low: 1.12,
          close: 1.15,
          volume: 9500,
          sessionBucket: "pre_market",
        },
      ]),
      sessionContext: {
        sessionBucket: "market_open",
        sessionDate: "2024-04-12",
      },
    });

    expect(referenceLevels).toEqual({
      previousDayHigh: 1.1,
      previousDayLow: 1.01,
      previousDayClose: 1.09,
      premarketHigh: 1.16,
      premarketLow: 1.1,
      premarketBase: 1.14,
    });
  });
});
