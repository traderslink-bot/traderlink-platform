import { describe, expect, it } from "vitest";
import { buildExecutionFeedbackFacts } from "../build-execution-feedback-facts";
import type { BuildExecutionFeedbackFactsArgs } from "../build-execution-feedback-facts";

function baseRequest(
  overrides: Partial<BuildExecutionFeedbackFactsArgs> = {},
): BuildExecutionFeedbackFactsArgs {
  return {
    symbol: "ABCD",
    tradeDirection: "long",
    sessionContext: {
      sessionDate: "2026-05-01",
      sessionBucket: "market_open",
    },
    executions: [
      {
        symbol: "ABCD",
        timestamp: "2026-05-01T13:30:00.000Z",
        side: "buy",
        shares: 100,
        price: 10,
        orderId: "entry-1",
        brokerExecutionId: "broker-entry-1",
        source: "test",
      },
      {
        symbol: "ABCD",
        timestamp: "2026-05-01T13:35:00.000Z",
        side: "buy",
        shares: 100,
        price: 8,
      },
      {
        symbol: "ABCD",
        timestamp: "2026-05-01T13:45:00.000Z",
        side: "sell",
        shares: 100,
        price: 11,
      },
      {
        symbol: "ABCD",
        timestamp: "2026-05-01T13:50:00.000Z",
        side: "sell",
        shares: 100,
        price: 12,
      },
    ],
    ...overrides,
  };
}

describe("buildExecutionFeedbackFacts", () => {
  it("builds lifecycle, sizing, sequencing, risk, and gross P/L facts for a long scale-in full exit", () => {
    const facts = buildExecutionFeedbackFacts(baseRequest());

    expect(facts).toMatchObject({
      contractVersion: "execution_feedback_facts_v1",
      dataSource: "executions_only",
      symbol: "ABCD",
      tradeDirection: "long",
      sessionDate: "2026-05-01",
      sessionBucket: "market_open",
      lifecycle: {
        executionCount: 4,
        openedFromFlat: true,
        closedToFlat: true,
        isOpenPosition: false,
        finalPositionSize: 0,
        maxPositionSize: 200,
        initialEntrySize: 100,
        initialEntryPrice: 10,
        positionIncreaseCount: 2,
        positionDecreaseCount: 2,
        addCountAfterInitialEntry: 1,
        reductionCount: 2,
        partialReductionCount: 1,
        fullExitCount: 1,
        readdAfterReductionCount: 0,
      },
      sizing: {
        totalPositionIncreaseShares: 200,
        totalPositionReductionShares: 200,
        largestPositionIncreaseShares: 100,
        largestReductionShares: 100,
        averagePositionIncreaseShares: 100,
        averageReductionShares: 100,
        largestAddShares: 100,
        averageAddShares: 100,
        sizeExpansionRatioFromInitialToMax: 2,
        largestAddPctOfMaxPosition: 0.5,
        increaseShareSizeRangePctOfAverage: 0,
        reductionShareSizeRangePctOfAverage: 0,
      },
      sequencing: {
        firstActionSide: "buy",
        firstReductionExecutionIndex: 2,
        secondsFromEntryToFirstReduction: 900,
        addsBeforeFirstReductionCount: 1,
        addsAfterFirstReductionCount: 0,
        reductionsAfterMaxSizeCount: 2,
        executionGapCount: 3,
        averageTimeBetweenExecutionsSeconds: 400,
        minTimeBetweenExecutionsSeconds: 300,
        maxTimeBetweenExecutionsSeconds: 600,
        executionsPerMinute: 0.2,
        rapidFireGapCount: 0,
      },
      price: {
        averageEntryExecutionPrice: 9,
        averageReductionExecutionPrice: 11.5,
        averageEntryPriceAtMaxSize: 9,
        finalAverageEntryPriceIfOpen: null,
        grossRealizedPnl: 500,
        grossRealizedPnlPctOfEntryNotional: 0.277778,
        commissionsAndFeesIncluded: false,
        totalEntryNotional: 1800,
        totalReductionNotional: 2300,
      },
      risk: {
        adversePriceAddCount: 1,
        favorablePriceAddCount: 0,
        flatPriceAddCount: 0,
        adversePriceAddShares: 100,
        largestAdversePriceAddShares: 100,
        adversePriceAddExecutionIndexes: [1],
        profitableReductionCount: 2,
        losingReductionCount: 0,
        flatReductionCount: 0,
        firstReductionShares: 100,
        firstReductionPctOfPreviousPosition: 0.5,
        firstReductionRealizedPnl: 200,
        firstReductionWasProfitable: true,
        openPositionShares: 0,
      },
    });

    expect(facts.executions.map((execution) => execution.action)).toEqual([
      "entry",
      "add",
      "partial_reduction",
      "full_exit",
    ]);
    expect(facts.executions[0]).toMatchObject({
      orderId: "entry-1",
      brokerExecutionId: "broker-entry-1",
      source: "test",
    });
    expect(facts.executions[1]).toMatchObject({
      directionNormalizedPriceVsPreviousAverageEntryPct: -0.2,
      priceWasAdverseVsPreviousAverageEntry: true,
      priceWasFavorableVsPreviousAverageEntry: false,
    });
  });

  it("uses direction-aware adverse-price logic for short scale-ins", () => {
    const facts = buildExecutionFeedbackFacts(
      baseRequest({
        tradeDirection: "short",
        executions: [
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:30:00.000Z",
            side: "sell",
            shares: 100,
            price: 20,
          },
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:36:00.000Z",
            side: "sell",
            shares: 100,
            price: 22,
          },
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:48:00.000Z",
            side: "buy",
            shares: 200,
            price: 19,
          },
        ],
      }),
    );

    expect(facts.lifecycle).toMatchObject({
      closedToFlat: true,
      maxPositionSize: 200,
      addCountAfterInitialEntry: 1,
      fullExitCount: 1,
    });
    expect(facts.executions[1]).toMatchObject({
      action: "add",
      directionNormalizedPriceVsPreviousAverageEntryPct: -0.1,
      priceWasAdverseVsPreviousAverageEntry: true,
    });
    expect(facts.risk).toMatchObject({
      adversePriceAddCount: 1,
      profitableReductionCount: 1,
      firstReductionWasProfitable: true,
    });
    expect(facts.price).toMatchObject({
      averageEntryExecutionPrice: 21,
      averageReductionExecutionPrice: 19,
      grossRealizedPnl: 400,
      grossRealizedPnlPctOfEntryNotional: 0.095238,
    });
  });

  it("keeps open positions factual instead of forcing a full-exit read", () => {
    const facts = buildExecutionFeedbackFacts(
      baseRequest({
        executions: [
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:30:00.000Z",
            side: "buy",
            shares: 100,
            price: 10,
          },
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:45:00.000Z",
            side: "sell",
            shares: 25,
            price: 10.5,
          },
        ],
      }),
    );

    expect(facts.lifecycle).toMatchObject({
      closedToFlat: false,
      isOpenPosition: true,
      finalPositionSize: 75,
      partialReductionCount: 1,
      fullExitCount: 0,
    });
    expect(facts.price).toMatchObject({
      grossRealizedPnl: 12.5,
      finalAverageEntryPriceIfOpen: 10,
    });
    expect(facts.risk).toMatchObject({
      firstReductionPctOfPreviousPosition: 0.25,
      openPositionShares: 75,
    });
  });

  it("sorts executions by timestamp before building facts", () => {
    const facts = buildExecutionFeedbackFacts(
      baseRequest({
        executions: [
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:45:00.000Z",
            side: "sell",
            shares: 100,
            price: 11,
          },
          {
            symbol: "ABCD",
            timestamp: "2026-05-01T13:30:00.000Z",
            side: "buy",
            shares: "100",
            price: "10",
          },
        ],
      }),
    );

    expect(facts.executions.map((execution) => execution.timestamp)).toEqual([
      "2026-05-01T13:30:00.000Z",
      "2026-05-01T13:45:00.000Z",
    ]);
    expect(facts.executions.map((execution) => execution.executionIndex)).toEqual([
      0,
      1,
    ]);
  });

  it("throws when execution flow exits before a position is open", () => {
    expect(() =>
      buildExecutionFeedbackFacts(
        baseRequest({
          executions: [
            {
              symbol: "ABCD",
              timestamp: "2026-05-01T13:30:00.000Z",
              side: "sell",
              shares: 100,
              price: 10,
            },
          ],
        }),
      ),
    ).toThrow(/sell encountered while flat/i);
  });
});
