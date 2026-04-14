import { describe, expect, it } from "vitest";
import { buildReductionReaddSequenceSignals } from "../derived/build-reduction-readd-sequence-signals";
import { buildPositionChangeDerivedSignals } from "../derived/build-position-change-derived-signals";
import { normalizeCandles } from "../normalizers/normalize-candle";
import { normalizeExecutions } from "../normalizers/normalize-execution";
import { buildTradeStateSeries } from "../state/build-trade-state-series";

describe("buildReductionReaddSequenceSignals", () => {
  it("builds factual reduction and re-add sequence signals", () => {
    const executions = normalizeExecutions([
      {
        symbol: "LUNR",
        timestamp: "2024-04-12T13:30:30.000Z",
        side: "buy",
        shares: 500,
        price: 5,
      },
      {
        symbol: "LUNR",
        timestamp: "2024-04-12T13:32:10.000Z",
        side: "sell",
        shares: 250,
        price: 5.3,
      },
      {
        symbol: "LUNR",
        timestamp: "2024-04-12T13:34:20.000Z",
        side: "buy",
        shares: 200,
        price: 5.15,
      },
      {
        symbol: "LUNR",
        timestamp: "2024-04-12T13:36:10.000Z",
        side: "sell",
        shares: 450,
        price: 5.4,
      },
    ]);

    const tradeCandles = normalizeCandles([
      {
        symbol: "LUNR",
        timestamp: "2024-04-12T13:31:00.000Z",
        timeframe: "1m",
        open: 5,
        high: 5.1,
        low: 4.98,
        close: 5.08,
        volume: 20000,
      },
      {
        symbol: "LUNR",
        timestamp: "2024-04-12T13:32:00.000Z",
        timeframe: "1m",
        open: 5.08,
        high: 5.35,
        low: 5.04,
        close: 5.27,
        volume: 26000,
      },
      {
        symbol: "LUNR",
        timestamp: "2024-04-12T13:33:00.000Z",
        timeframe: "1m",
        open: 5.27,
        high: 5.28,
        low: 5.1,
        close: 5.12,
        volume: 23000,
      },
      {
        symbol: "LUNR",
        timestamp: "2024-04-12T13:34:00.000Z",
        timeframe: "1m",
        open: 5.12,
        high: 5.18,
        low: 5.08,
        close: 5.16,
        volume: 18000,
      },
      {
        symbol: "LUNR",
        timestamp: "2024-04-12T13:35:00.000Z",
        timeframe: "1m",
        open: 5.16,
        high: 5.29,
        low: 5.14,
        close: 5.24,
        volume: 19500,
      },
      {
        symbol: "LUNR",
        timestamp: "2024-04-12T13:36:00.000Z",
        timeframe: "1m",
        open: 5.24,
        high: 5.42,
        low: 5.22,
        close: 5.38,
        volume: 24000,
      },
    ]);

    const tradeStateSeries = buildTradeStateSeries({
      executions,
      tradeDirection: "long",
    });

    const positionChangeDerivedSignals = buildPositionChangeDerivedSignals({
      executions,
      tradeStateSnapshots: tradeStateSeries.snapshots,
      tradeDirection: "long",
    });

    const result = buildReductionReaddSequenceSignals({
      positionChangeDerivedSignals,
      tradeCandles,
    });

    expect(result).toHaveLength(4);

    expect(result[0]).toMatchObject({
      executionIndex: 0,
      hadPriorReductionBeforeExecution: false,
      executionIsReaddAfterReduction: false,
    });

    expect(result[1]).toMatchObject({
      executionIndex: 1,
      hadPriorReductionBeforeExecution: false,
      executionIsReaddAfterReduction: false,
    });

    expect(result[2]).toMatchObject({
      executionIndex: 2,
      hadPriorReductionBeforeExecution: true,
      mostRecentReductionExecutionIndex: 1,
      executionsSinceMostRecentReduction: 1,
      timeSinceMostRecentReductionSeconds: 130,
      candlesSinceMostRecentReduction: 2,
      priceChangeSinceMostRecentReduction: 0.15,
      priceChangeSinceMostRecentReductionPct: 0.028302,
      mostRecentReductionPositionSizeAfterExecution: 250,
      currentPositionSizeAfterExecution: 450,
      executionIsReaddAfterReduction: true,
      executionRestoredSizeAboveMostRecentReduction: true,
    });

    expect(result[3]).toMatchObject({
      executionIndex: 3,
      hadPriorReductionBeforeExecution: true,
      mostRecentReductionExecutionIndex: 1,
      executionsSinceMostRecentReduction: 2,
      timeSinceMostRecentReductionSeconds: 240,
      candlesSinceMostRecentReduction: 4,
      executionIsReaddAfterReduction: false,
      executionRestoredSizeAboveMostRecentReduction: null,
    });
  });
});
