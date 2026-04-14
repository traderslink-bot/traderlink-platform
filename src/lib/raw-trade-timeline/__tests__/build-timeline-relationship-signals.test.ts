// 2026-04-12 01:18 PM America/Toronto
// PURPOSE:
// Timeline relationship derived signal tests for the raw trade timeline system.
// These tests validate factual timing and spacing relationships only.

import { describe, expect, it } from "vitest";
import { buildTimelineRelationshipSignals } from "../derived/build-timeline-relationship-signals";
import { normalizeCandles } from "../normalizers/normalize-candle";
import { normalizeExecutions } from "../normalizers/normalize-execution";

describe("buildTimelineRelationshipSignals", () => {
  it("builds timeline relationship signals correctly for a multi-execution trade", () => {
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

    const result = buildTimelineRelationshipSignals({
      executions,
      tradeCandles,
    });

    expect(result.executionCount).toBe(3);
    expect(result.executionGapCount).toBe(2);

    expect(result.firstExecutionTimestamp).toBe("2024-04-12T13:33:30.000Z");
    expect(result.lastExecutionTimestamp).toBe("2024-04-12T13:39:10.000Z");

    expect(result.totalTradeDurationMs).toBe(340000);
    expect(result.totalTradeDurationSeconds).toBe(340);
    expect(result.totalTradeDurationMinutes).toBe(5.666667);

    expect(result.averageTimeBetweenExecutionsMs).toBe(170000);
    expect(result.averageTimeBetweenExecutionsSeconds).toBe(170);
    expect(result.averageTimeBetweenExecutionsMinutes).toBe(2.833333);

    expect(result.minimumTimeBetweenExecutionsMs).toBe(165000);
    expect(result.maximumTimeBetweenExecutionsMs).toBe(175000);

    expect(result.averageCandlesBetweenExecutions).toBe(3);
    expect(result.minimumCandlesBetweenExecutions).toBe(3);
    expect(result.maximumCandlesBetweenExecutions).toBe(3);

    expect(result.executionsPerMinute).toBe(0.529412);

    expect(result.executionGapSignals).toHaveLength(2);

    expect(result.executionGapSignals[0]).toMatchObject({
      fromExecutionIndex: 0,
      toExecutionIndex: 1,
      timeBetweenExecutionsMs: 165000,
      timeBetweenExecutionsSeconds: 165,
      timeBetweenExecutionsMinutes: 2.75,
      candlesBetweenExecutions: 3,
      hadNoCandlesBetweenExecutions: false,
      hadOneCandleBetweenExecutions: false,
      hadMultipleCandlesBetweenExecutions: true,
    });

    expect(result.executionGapSignals[1]).toMatchObject({
      fromExecutionIndex: 1,
      toExecutionIndex: 2,
      timeBetweenExecutionsMs: 175000,
      timeBetweenExecutionsSeconds: 175,
      timeBetweenExecutionsMinutes: 2.916667,
      candlesBetweenExecutions: 3,
      hadNoCandlesBetweenExecutions: false,
      hadOneCandleBetweenExecutions: false,
      hadMultipleCandlesBetweenExecutions: true,
    });
  });

  it("returns null aggregate values when there is only one execution", () => {
    const executions = normalizeExecutions([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:33:30.000Z",
        side: "buy",
        shares: 100,
        price: 1.2,
      },
    ]);

    const tradeCandles = normalizeCandles([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:34:00.000Z",
        timeframe: "1m",
        open: 1.2,
        high: 1.25,
        low: 1.19,
        close: 1.23,
        volume: 20000,
      },
    ]);

    const result = buildTimelineRelationshipSignals({
      executions,
      tradeCandles,
    });

    expect(result.executionCount).toBe(1);
    expect(result.executionGapCount).toBe(0);
    expect(result.executionGapSignals).toHaveLength(0);

    expect(result.totalTradeDurationMs).toBe(0);
    expect(result.totalTradeDurationSeconds).toBe(0);
    expect(result.totalTradeDurationMinutes).toBe(0);

    expect(result.averageTimeBetweenExecutionsMs).toBeNull();
    expect(result.averageTimeBetweenExecutionsSeconds).toBeNull();
    expect(result.averageTimeBetweenExecutionsMinutes).toBeNull();

    expect(result.averageCandlesBetweenExecutions).toBeNull();
    expect(result.executionsPerMinute).toBeNull();
  });

  it("returns null aggregate values when there are no executions", () => {
    const tradeCandles = normalizeCandles([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:34:00.000Z",
        timeframe: "1m",
        open: 1.2,
        high: 1.25,
        low: 1.19,
        close: 1.23,
        volume: 20000,
      },
    ]);

    const result = buildTimelineRelationshipSignals({
      executions: [],
      tradeCandles,
    });

    expect(result.executionCount).toBe(0);
    expect(result.executionGapCount).toBe(0);
    expect(result.executionGapSignals).toHaveLength(0);

    expect(result.firstExecutionTimestamp).toBeNull();
    expect(result.lastExecutionTimestamp).toBeNull();

    expect(result.totalTradeDurationMs).toBeNull();
    expect(result.totalTradeDurationSeconds).toBeNull();
    expect(result.totalTradeDurationMinutes).toBeNull();

    expect(result.averageTimeBetweenExecutionsMs).toBeNull();
    expect(result.averageCandlesBetweenExecutions).toBeNull();
    expect(result.executionsPerMinute).toBeNull();
  });
});