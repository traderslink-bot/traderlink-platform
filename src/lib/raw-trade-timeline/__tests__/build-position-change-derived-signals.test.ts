// 2026-04-12 01:05 PM America/Toronto
// PURPOSE:
// Position-change derived signal tests for the raw trade timeline system.
// These tests validate factual size and state transitions only.

import { describe, expect, it } from "vitest";
import { buildPositionChangeDerivedSignals } from "../derived/build-position-change-derived-signals";
import { normalizeExecutions } from "../normalizers/normalize-execution";
import type { TradeStateSnapshot } from "../types/trade-state-snapshot";

describe("buildPositionChangeDerivedSignals", () => {
  it("builds long position-change signals correctly", () => {
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

    const tradeStateSnapshots: TradeStateSnapshot[] = [
      {
        executionIndex: 0,
        timestamp: "2024-04-12T13:33:30.000Z",
        positionSize: 100,
        averageEntryPrice: 1.185,
        realizedPnl: 0,
        isFlat: false,
      },
      {
        executionIndex: 1,
        timestamp: "2024-04-12T13:36:15.000Z",
        positionSize: 150,
        averageEntryPrice: 1.208333,
        realizedPnl: 0,
        isFlat: false,
      },
      {
        executionIndex: 2,
        timestamp: "2024-04-12T13:39:10.000Z",
        positionSize: 0,
        averageEntryPrice: null,
        realizedPnl: 13.00005,
        isFlat: true,
      },
    ];

    const result = buildPositionChangeDerivedSignals({
      executions,
      tradeStateSnapshots,
      tradeDirection: "long",
    });

    expect(result).toHaveLength(3);

    expect(result[0]).toMatchObject({
      executionIndex: 0,
      previousPositionSize: 0,
      currentPositionSize: 100,
      positionSizeDelta: 100,
      wasFlatBeforeExecution: true,
      isFlatAfterExecution: false,
      openedPositionFromFlat: true,
      closedPositionToFlat: false,
      positionIncreased: true,
      positionDecreased: false,
      executionDirectionMatchesTradeDirection: true,
    });

    expect(result[1]).toMatchObject({
      executionIndex: 1,
      previousPositionSize: 100,
      currentPositionSize: 150,
      positionSizeDelta: 50,
      wasFlatBeforeExecution: false,
      isFlatAfterExecution: false,
      openedPositionFromFlat: false,
      closedPositionToFlat: false,
      positionIncreased: true,
      positionDecreased: false,
      sizeChangePctOfPreviousPosition: 0.5,
      sizeChangePctOfCurrentPosition: 0.333333,
      executionDirectionMatchesTradeDirection: true,
    });

    expect(result[2]).toMatchObject({
      executionIndex: 2,
      previousPositionSize: 150,
      currentPositionSize: 0,
      positionSizeDelta: -150,
      wasFlatBeforeExecution: false,
      isFlatAfterExecution: true,
      openedPositionFromFlat: false,
      closedPositionToFlat: true,
      positionIncreased: false,
      positionDecreased: true,
      realizedPnlDelta: 13.00005,
      executionDirectionMatchesTradeDirection: false,
    });
  });

  it("builds short position-change signals correctly", () => {
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

    const tradeStateSnapshots: TradeStateSnapshot[] = [
      {
        executionIndex: 0,
        timestamp: "2024-04-12T13:33:30.000Z",
        positionSize: 100,
        averageEntryPrice: 2,
        realizedPnl: 0,
        isFlat: false,
      },
      {
        executionIndex: 1,
        timestamp: "2024-04-12T13:39:30.000Z",
        positionSize: 0,
        averageEntryPrice: null,
        realizedPnl: 20,
        isFlat: true,
      },
    ];

    const result = buildPositionChangeDerivedSignals({
      executions,
      tradeStateSnapshots,
      tradeDirection: "short",
    });

    expect(result).toHaveLength(2);

    expect(result[0]).toMatchObject({
      executionIndex: 0,
      previousPositionSize: 0,
      currentPositionSize: 100,
      positionSizeDelta: 100,
      openedPositionFromFlat: true,
      closedPositionToFlat: false,
      executionDirectionMatchesTradeDirection: true,
    });

    expect(result[1]).toMatchObject({
      executionIndex: 1,
      previousPositionSize: 100,
      currentPositionSize: 0,
      positionSizeDelta: -100,
      openedPositionFromFlat: false,
      closedPositionToFlat: true,
      realizedPnlDelta: 20,
      executionDirectionMatchesTradeDirection: false,
    });
  });

  it("throws when executions and tradeStateSnapshots lengths do not match", () => {
    const executions = normalizeExecutions([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:33:30.000Z",
        side: "buy",
        shares: 100,
        price: 1.2,
      },
    ]);

    const tradeStateSnapshots: TradeStateSnapshot[] = [];

    expect(() =>
      buildPositionChangeDerivedSignals({
        executions,
        tradeStateSnapshots,
        tradeDirection: "long",
      }),
    ).toThrowError(/lengths do not match/i);
  });
});