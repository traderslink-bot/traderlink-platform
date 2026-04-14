// 2026-04-12 12:50 PM America/Toronto
// PURPOSE:
// Trade-level derived signal tests for the raw trade timeline system.
// These tests validate factual whole-trade measurements only.

import { describe, expect, it } from "vitest";
import { buildTradeDerivedSignals } from "../derived/build-trade-derived-signals";
import { normalizeCandles } from "../normalizers/normalize-candle";
import { normalizeExecutions } from "../normalizers/normalize-execution";

describe("buildTradeDerivedSignals", () => {
  it("builds long trade-level derived signals correctly", () => {
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

    const result = buildTradeDerivedSignals({
      symbol: "ABCD",
      tradeDirection: "long",
      executions,
      tradeCandles,
    });

    expect(result.symbol).toBe("ABCD");
    expect(result.tradeDirection).toBe("long");
    expect(result.firstExecutionPrice).toBe(1.185);
    expect(result.lastExecutionPrice).toBe(1.295);
    expect(result.peakPriceDuringTrade).toBe(1.36);
    expect(result.worstPriceDuringTrade).toBe(1.17);
    expect(result.tradeMfe).toBe(0.175);
    expect(result.tradeMae).toBe(0.015);
    expect(result.tradeMfePct).toBe(0.147679);
    expect(result.tradeMaePct).toBe(0.012658);
    expect(result.tradeCandleCount).toBe(6);
    expect(result.executionCount).toBe(3);
    expect(result.tradeDurationMs).toBe(340000);
    expect(result.tradeDurationSeconds).toBe(340);
  });

  it("builds short trade-level derived signals correctly", () => {
    const executions = normalizeExecutions([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:33:30.000Z",
        side: "sell",
        shares: 100,
        price: 2.0,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:39:30.000Z",
        side: "buy",
        shares: 100,
        price: 1.8,
      },
    ]);

    const tradeCandles = normalizeCandles([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:34:00.000Z",
        timeframe: "1m",
        open: 1.99,
        high: 2.02,
        low: 1.94,
        close: 1.96,
        volume: 15000,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:35:00.000Z",
        timeframe: "1m",
        open: 1.96,
        high: 1.98,
        low: 1.88,
        close: 1.9,
        volume: 18000,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:36:00.000Z",
        timeframe: "1m",
        open: 1.9,
        high: 1.93,
        low: 1.82,
        close: 1.85,
        volume: 19000,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:37:00.000Z",
        timeframe: "1m",
        open: 1.85,
        high: 1.88,
        low: 1.79,
        close: 1.83,
        volume: 21000,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:38:00.000Z",
        timeframe: "1m",
        open: 1.83,
        high: 1.89,
        low: 1.8,
        close: 1.87,
        volume: 16000,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:39:00.000Z",
        timeframe: "1m",
        open: 1.87,
        high: 1.9,
        low: 1.81,
        close: 1.84,
        volume: 15500,
      },
    ]);

    const result = buildTradeDerivedSignals({
      symbol: "ABCD",
      tradeDirection: "short",
      executions,
      tradeCandles,
    });

    expect(result.symbol).toBe("ABCD");
    expect(result.tradeDirection).toBe("short");
    expect(result.firstExecutionPrice).toBe(2);
    expect(result.lastExecutionPrice).toBe(1.8);
    expect(result.peakPriceDuringTrade).toBe(1.79);
    expect(result.worstPriceDuringTrade).toBe(2.02);
    expect(result.tradeMfe).toBe(0.21);
    expect(result.tradeMae).toBe(0.02);
    expect(result.tradeMfePct).toBe(0.105);
    expect(result.tradeMaePct).toBe(0.01);
    expect(result.tradeCandleCount).toBe(6);
    expect(result.executionCount).toBe(2);
    expect(result.tradeDurationMs).toBe(360000);
    expect(result.tradeDurationSeconds).toBe(360);
  });

  it("throws when trade-level derived signals are requested without executions", () => {
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
    ]);

    expect(() =>
      buildTradeDerivedSignals({
        symbol: "ABCD",
        tradeDirection: "long",
        executions: [],
        tradeCandles,
      }),
    ).toThrowError(/without executions/i);
  });
});