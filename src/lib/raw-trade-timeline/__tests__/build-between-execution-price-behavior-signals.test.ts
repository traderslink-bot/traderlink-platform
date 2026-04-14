import { describe, expect, it } from "vitest";
import { buildBetweenExecutionPriceBehaviorSignals } from "../derived/build-between-execution-price-behavior-signals";
import { normalizeCandles } from "../normalizers/normalize-candle";
import { normalizeExecutions } from "../normalizers/normalize-execution";

describe("buildBetweenExecutionPriceBehaviorSignals", () => {
  it("builds factual long-trade price behavior for each execution gap", () => {
    const executions = normalizeExecutions([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:33:30.000Z",
        side: "buy",
        shares: 100,
        price: 1.185,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:36:15.000Z",
        side: "buy",
        shares: 50,
        price: 1.255,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:39:10.000Z",
        side: "sell",
        shares: 150,
        price: 1.295,
      },
    ]);

    const tradeCandles = normalizeCandles([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:34:00.000Z",
        timeframe: "1m",
        open: 1.18,
        high: 1.24,
        low: 1.17,
        close: 1.22,
        volume: 27000,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:35:00.000Z",
        timeframe: "1m",
        open: 1.22,
        high: 1.3,
        low: 1.21,
        close: 1.28,
        volume: 30000,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:36:00.000Z",
        timeframe: "1m",
        open: 1.28,
        high: 1.33,
        low: 1.23,
        close: 1.24,
        volume: 28000,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:37:00.000Z",
        timeframe: "1m",
        open: 1.24,
        high: 1.32,
        low: 1.22,
        close: 1.31,
        volume: 26000,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:38:00.000Z",
        timeframe: "1m",
        open: 1.31,
        high: 1.36,
        low: 1.3,
        close: 1.34,
        volume: 25000,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:39:00.000Z",
        timeframe: "1m",
        open: 1.34,
        high: 1.35,
        low: 1.27,
        close: 1.29,
        volume: 21000,
      },
    ]);

    const result = buildBetweenExecutionPriceBehaviorSignals({
      executions,
      tradeCandles,
      tradeDirection: "long",
    });

    expect(result).toHaveLength(2);

    expect(result[0]).toMatchObject({
      fromExecutionIndex: 0,
      toExecutionIndex: 1,
      candlesBetweenExecutionsCount: 3,
      highestPriceBetweenExecutions: 1.33,
      lowestPriceBetweenExecutions: 1.17,
      netMoveBetweenExecutions: 0.07,
      netMovePctBetweenExecutions: 0.059072,
      maxFavorableMoveBetweenExecutions: 0.145,
      maxAdverseMoveBetweenExecutions: 0.015,
      maxFavorableMovePctBetweenExecutions: 0.122363,
      maxAdverseMovePctBetweenExecutions: 0.012658,
    });

    expect(result[1]).toMatchObject({
      fromExecutionIndex: 1,
      toExecutionIndex: 2,
      candlesBetweenExecutionsCount: 3,
      highestPriceBetweenExecutions: 1.36,
      lowestPriceBetweenExecutions: 1.22,
      netMoveBetweenExecutions: 0.04,
      netMovePctBetweenExecutions: 0.031873,
      maxFavorableMoveBetweenExecutions: 0.105,
      maxAdverseMoveBetweenExecutions: 0.035,
      maxFavorableMovePctBetweenExecutions: 0.083665,
      maxAdverseMovePctBetweenExecutions: 0.027888,
    });
  });

  it("returns an empty array when fewer than two executions exist", () => {
    const executions = normalizeExecutions([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:33:30.000Z",
        side: "buy",
        shares: 100,
        price: 1.185,
      },
    ]);

    const tradeCandles = normalizeCandles([]);

    const result = buildBetweenExecutionPriceBehaviorSignals({
      executions,
      tradeCandles,
      tradeDirection: "long",
    });

    expect(result).toEqual([]);
  });
});
