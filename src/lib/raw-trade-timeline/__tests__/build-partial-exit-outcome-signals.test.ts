import { describe, expect, it } from "vitest";
import { buildPartialExitOutcomeSignals } from "../derived/build-partial-exit-outcome-signals";
import { buildPositionChangeDerivedSignals } from "../derived/build-position-change-derived-signals";
import { normalizeCandles } from "../normalizers/normalize-candle";
import { normalizeExecutions } from "../normalizers/normalize-execution";
import { buildTradeStateSeries } from "../state/build-trade-state-series";

describe("buildPartialExitOutcomeSignals", () => {
  it("builds factual post-reduction outcome signals until the next execution", () => {
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

    const result = buildPartialExitOutcomeSignals({
      executions,
      positionChangeDerivedSignals,
      tradeCandles,
      tradeDirection: "long",
    });

    expect(result).toHaveLength(4);

    expect(result[0]).toMatchObject({
      executionIndex: 0,
      executionWasReduction: false,
      executionWasPartialExit: false,
    });

    expect(result[1]).toMatchObject({
      executionIndex: 1,
      executionWasReduction: true,
      executionWasPartialExit: true,
      currentPositionSizeAfterExecution: 250,
      nextExecutionIndex: 2,
      candlesUntilNextExecution: 2,
      maxFavorablePriceAfterReductionBeforeNextExecution: 5.28,
      maxAdversePriceAfterReductionBeforeNextExecution: 5.08,
      maxFavorableMoveAfterReductionBeforeNextExecution: 0.02,
      maxAdverseMoveAfterReductionBeforeNextExecution: 0.22,
      maxFavorableMovePctAfterReductionBeforeNextExecution: 0.003774,
      maxAdverseMovePctAfterReductionBeforeNextExecution: 0.041509,
      priceAtNextExecutionVsReduction: 0.15,
      priceAtNextExecutionVsReductionPct: 0.028302,
    });

    expect(result[2]).toMatchObject({
      executionIndex: 2,
      executionWasReduction: false,
      executionWasPartialExit: false,
    });

    expect(result[3]).toMatchObject({
      executionIndex: 3,
      executionWasReduction: true,
      executionWasPartialExit: false,
      nextExecutionIndex: null,
    });
  });
});
