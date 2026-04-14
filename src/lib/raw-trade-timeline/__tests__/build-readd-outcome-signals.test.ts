import { describe, expect, it } from "vitest";
import { buildReaddOutcomeSignals } from "../derived/build-readd-outcome-signals";
import type { Execution } from "../types/execution";
import type { Candle } from "../types/candle";
import type { ReductionReaddSequenceSignal } from "../derived/build-reduction-readd-sequence-signals";

describe("buildReaddOutcomeSignals", () => {
  it("builds factual post-readd outcome signals until the next execution", () => {
    const executions: Execution[] = [
      {
        symbol: "ABCD",
        executionIndex: 0,
        side: "buy",
        shares: 100,
        price: 10,
        timestamp: "2024-04-12T13:30:00.000Z",
      },
      {
        symbol: "ABCD",
        executionIndex: 1,
        side: "sell",
        shares: 50,
        price: 10.4,
        timestamp: "2024-04-12T13:32:00.000Z",
      },
      {
        symbol: "ABCD",
        executionIndex: 2,
        side: "buy",
        shares: 25,
        price: 10.5,
        timestamp: "2024-04-12T13:34:00.000Z",
      },
      {
        symbol: "ABCD",
        executionIndex: 3,
        side: "sell",
        shares: 75,
        price: 10.62,
        timestamp: "2024-04-12T13:36:00.000Z",
      },
    ];

    const tradeCandles: Candle[] = [
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:34:30.000Z",
        timeframe: "1m",
        open: 10.5,
        high: 10.72,
        low: 10.46,
        close: 10.68,
        volume: 1000,
      },
      {
        symbol: "ABCD",
        timestamp: "2024-04-12T13:35:30.000Z",
        timeframe: "1m",
        open: 10.68,
        high: 10.7,
        low: 10.44,
        close: 10.5,
        volume: 900,
      },
    ];

    const reductionReaddSequenceSignals: ReductionReaddSequenceSignal[] = [
      {
        executionIndex: 0,
        timestamp: "2024-04-12T13:30:00.000Z",
        hadPriorReductionBeforeExecution: false,
        mostRecentReductionExecutionIndex: null,
        mostRecentReductionTimestamp: null,
        mostRecentReductionPrice: null,
        executionsSinceMostRecentReduction: null,
        timeSinceMostRecentReductionSeconds: null,
        candlesSinceMostRecentReduction: null,
        priceChangeSinceMostRecentReduction: null,
        priceChangeSinceMostRecentReductionPct: null,
        mostRecentReductionPositionSizeAfterExecution: null,
        currentPositionSizeAfterExecution: 100,
        executionIsReaddAfterReduction: false,
        executionRestoredSizeAboveMostRecentReduction: null,
      },
      {
        executionIndex: 1,
        timestamp: "2024-04-12T13:32:00.000Z",
        hadPriorReductionBeforeExecution: false,
        mostRecentReductionExecutionIndex: null,
        mostRecentReductionTimestamp: null,
        mostRecentReductionPrice: null,
        executionsSinceMostRecentReduction: null,
        timeSinceMostRecentReductionSeconds: null,
        candlesSinceMostRecentReduction: null,
        priceChangeSinceMostRecentReduction: null,
        priceChangeSinceMostRecentReductionPct: null,
        mostRecentReductionPositionSizeAfterExecution: null,
        currentPositionSizeAfterExecution: 50,
        executionIsReaddAfterReduction: false,
        executionRestoredSizeAboveMostRecentReduction: null,
      },
      {
        executionIndex: 2,
        timestamp: "2024-04-12T13:34:00.000Z",
        hadPriorReductionBeforeExecution: true,
        mostRecentReductionExecutionIndex: 1,
        mostRecentReductionTimestamp: "2024-04-12T13:32:00.000Z",
        mostRecentReductionPrice: 10.4,
        executionsSinceMostRecentReduction: 1,
        timeSinceMostRecentReductionSeconds: 120,
        candlesSinceMostRecentReduction: 1,
        priceChangeSinceMostRecentReduction: 0.1,
        priceChangeSinceMostRecentReductionPct: 0.009615,
        mostRecentReductionPositionSizeAfterExecution: 50,
        currentPositionSizeAfterExecution: 75,
        executionIsReaddAfterReduction: true,
        executionRestoredSizeAboveMostRecentReduction: true,
      },
      {
        executionIndex: 3,
        timestamp: "2024-04-12T13:36:00.000Z",
        hadPriorReductionBeforeExecution: true,
        mostRecentReductionExecutionIndex: 1,
        mostRecentReductionTimestamp: "2024-04-12T13:32:00.000Z",
        mostRecentReductionPrice: 10.4,
        executionsSinceMostRecentReduction: 2,
        timeSinceMostRecentReductionSeconds: 240,
        candlesSinceMostRecentReduction: 3,
        priceChangeSinceMostRecentReduction: 0.22,
        priceChangeSinceMostRecentReductionPct: 0.021154,
        mostRecentReductionPositionSizeAfterExecution: 50,
        currentPositionSizeAfterExecution: 0,
        executionIsReaddAfterReduction: false,
        executionRestoredSizeAboveMostRecentReduction: null,
      },
    ];

    const signals = buildReaddOutcomeSignals({
      executions,
      reductionReaddSequenceSignals,
      tradeCandles,
      tradeDirection: "long",
    });

    expect(signals).toHaveLength(4);
    expect(signals[2]).toMatchObject({
      executionIndex: 2,
      executionWasReaddAfterReduction: true,
      nextExecutionIndex: 3,
      candlesUntilNextExecution: 2,
      maxFavorablePriceAfterReaddBeforeNextExecution: 10.72,
      maxAdversePriceAfterReaddBeforeNextExecution: 10.44,
      maxFavorableMovePctAfterReaddBeforeNextExecution: 0.020952,
      maxAdverseMovePctAfterReaddBeforeNextExecution: 0.005714,
      priceAtNextExecutionVsReaddPct: 0.011429,
    });
    expect(signals[1].maxFavorableMovePctAfterReaddBeforeNextExecution).toBeNull();
  });
});
