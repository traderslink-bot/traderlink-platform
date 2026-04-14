import { describe, expect, it } from "vitest";
import { buildStructuralContextWindow } from "../windowing/build-structural-context-window";
import { normalizeCandles } from "../../raw-trade-timeline/normalizers/normalize-candle";
import { normalizeExecutions } from "../../raw-trade-timeline/normalizers/normalize-execution";

describe("buildStructuralContextWindow", () => {
  it("builds a factual structural context window from trade candles and executions", () => {
    const window = buildStructuralContextWindow({
      timeframe: "1m",
      executions: normalizeExecutions([
        {
          symbol: "ABCD",
          timestamp: "2024-04-12T13:33:30.000Z",
          side: "buy",
          shares: 100,
          price: 1.18,
        },
        {
          symbol: "ABCD",
          timestamp: "2024-04-12T13:39:10.000Z",
          side: "sell",
          shares: 100,
          price: 1.29,
        },
      ]),
      preTradeCandles: normalizeCandles([
        {
          symbol: "ABCD",
          timestamp: "2024-04-12T13:30:00.000Z",
          timeframe: "1m",
          open: 1.1,
          high: 1.12,
          low: 1.09,
          close: 1.11,
          volume: 10000,
        },
      ]),
      postTradeCandles: normalizeCandles([
        {
          symbol: "ABCD",
          timestamp: "2024-04-12T13:40:00.000Z",
          timeframe: "1m",
          open: 1.28,
          high: 1.29,
          low: 1.26,
          close: 1.27,
          volume: 9000,
        },
      ]),
    });

    expect(window).toEqual({
      firstExecutionTimestamp: "2024-04-12T13:33:30.000Z",
      lastExecutionTimestamp: "2024-04-12T13:39:10.000Z",
      preEntryContextStartTimestamp: "2024-04-12T13:30:00.000Z",
      postExitContextEndTimestamp: "2024-04-12T13:40:00.000Z",
      includedTimeframes: ["1m"],
    });
  });
});
