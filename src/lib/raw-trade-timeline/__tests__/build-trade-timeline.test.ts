import { describe, expect, it } from "vitest";
import { buildTradeTimeline } from "../builders/build-trade-timeline";
import { normalizeCandles } from "../normalizers/normalize-candle";
import { normalizeExecutions } from "../normalizers/normalize-execution";

describe("buildTradeTimeline", () => {
  it("normalizes direct session-context aliases into canonical internal labels", () => {
    const result = buildTradeTimeline({
      input: {
        symbol: "ABCD",
        timeframe: "1m",
        tradeDirection: "long",
        executions: normalizeExecutions([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:33:30.000Z",
            side: "buy",
            shares: 100,
            price: 1.185,
          },
        ]),
        preTradeCandles: normalizeCandles([
          {
            symbol: "ABCD",
            timestamp: "2024-04-12T13:30:00.000Z",
            timeframe: "1m",
            open: 1.1,
            high: 1.14,
            low: 1.09,
            close: 1.13,
            volume: 10000,
            sessionBucket: "open",
          },
        ]),
        tradeCandles: [],
        postTradeCandles: [],
        sessionContext: {
          sessionBucket: "open",
          sessionDate: "2024-04-12",
        },
      },
    });

    expect(result.input.sessionContext.sessionBucket).toBe("market_open");
    expect(result.timeline.sessionContext.sessionBucket).toBe("market_open");
  });
});
