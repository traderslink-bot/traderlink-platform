// 2026-04-12 10:18 AM America/Toronto
// PURPOSE:
// Deterministic trade state series tests for the raw trade timeline system.
// These tests validate raw state progression only.

import { describe, expect, it } from "vitest";
import { normalizeExecutions } from "../normalizers/normalize-execution";
import { buildTradeStateSeries } from "../state/build-trade-state-series";

describe("buildTradeStateSeries", () => {
  it("builds long trade snapshots correctly across buys and sells", () => {
    const executions = normalizeExecutions([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:33:30.000Z",
        side: "buy",
        shares: 100,
        price: 1.2,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:35:00.000Z",
        side: "buy",
        shares: 100,
        price: 1.4,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:37:00.000Z",
        side: "sell",
        shares: 50,
        price: 1.5,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:39:00.000Z",
        side: "sell",
        shares: 150,
        price: 1.3,
      },
    ]);

    const result = buildTradeStateSeries({
      executions,
      tradeDirection: "long",
    });

    expect(result.snapshots).toHaveLength(4);

    expect(result.snapshots[0]).toMatchObject({
      executionIndex: 0,
      positionSize: 100,
      averageEntryPrice: 1.2,
      realizedPnl: 0,
      isFlat: false,
    });

    expect(result.snapshots[1].positionSize).toBe(200);
    expect(result.snapshots[1].averageEntryPrice).toBe(1.3);
    expect(result.snapshots[1].realizedPnl).toBe(0);
    expect(result.snapshots[1].isFlat).toBe(false);

    expect(result.snapshots[2].positionSize).toBe(150);
    expect(result.snapshots[2].averageEntryPrice).toBe(1.3);
    expect(result.snapshots[2].realizedPnl).toBe(10);
    expect(result.snapshots[2].isFlat).toBe(false);

    expect(result.snapshots[3].positionSize).toBe(0);
    expect(result.snapshots[3].averageEntryPrice).toBeNull();
    expect(result.snapshots[3].realizedPnl).toBe(10);
    expect(result.snapshots[3].isFlat).toBe(true);
  });

  it("builds short trade snapshots correctly across sells and buys", () => {
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
        timestamp: "2024-04-12T13:35:00.000Z",
        side: "sell",
        shares: 100,
        price: 1.8,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:37:00.000Z",
        side: "buy",
        shares: 50,
        price: 1.7,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:39:00.000Z",
        side: "buy",
        shares: 150,
        price: 1.9,
      },
    ]);

    const result = buildTradeStateSeries({
      executions,
      tradeDirection: "short",
    });

    expect(result.snapshots).toHaveLength(4);

    expect(result.snapshots[0]).toMatchObject({
      executionIndex: 0,
      positionSize: 100,
      averageEntryPrice: 2,
      realizedPnl: 0,
      isFlat: false,
    });

    expect(result.snapshots[1].positionSize).toBe(200);
    expect(result.snapshots[1].averageEntryPrice).toBe(1.9);
    expect(result.snapshots[1].realizedPnl).toBe(0);
    expect(result.snapshots[1].isFlat).toBe(false);

    expect(result.snapshots[2].positionSize).toBe(150);
    expect(result.snapshots[2].averageEntryPrice).toBe(1.9);
    expect(result.snapshots[2].realizedPnl).toBe(10);
    expect(result.snapshots[2].isFlat).toBe(false);

    expect(result.snapshots[3].positionSize).toBe(0);
    expect(result.snapshots[3].averageEntryPrice).toBeNull();
    expect(result.snapshots[3].realizedPnl).toBe(10);
    expect(result.snapshots[3].isFlat).toBe(true);
  });

  it("throws when a long trade tries to sell while flat", () => {
    const executions = normalizeExecutions([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:33:30.000Z",
        side: "sell",
        shares: 100,
        price: 1.2,
      },
    ]);

    expect(() =>
      buildTradeStateSeries({
        executions,
        tradeDirection: "long",
      }),
    ).toThrowError(/sell encountered while flat/i);
  });

  it("throws when a short trade tries to buy while flat", () => {
    const executions = normalizeExecutions([
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:33:30.000Z",
        side: "buy",
        shares: 100,
        price: 1.2,
      },
    ]);

    expect(() =>
      buildTradeStateSeries({
        executions,
        tradeDirection: "short",
      }),
    ).toThrowError(/buy encountered while flat/i);
  });
});