import { describe, expect, it } from "vitest";
import { buildDangerWindowDerivedSignals } from "../derived/build-danger-window-derived-signals";

describe("buildDangerWindowDerivedSignals", () => {
  it("builds factual danger-window signals between peak open profit and worst drawdown", () => {
    const signals = buildDangerWindowDerivedSignals({
      tradeLifecycleMilestoneSignals: {
        firstTimestampTradeHadOpenProfit: "2024-04-12T13:34:00.000Z",
        firstTimestampTradeHadOpenLoss: "2024-04-12T13:33:00.000Z",
        timestampOfPeakPriceDuringTrade: "2024-04-12T13:37:00.000Z",
        timestampOfWorstPriceDuringTrade: "2024-04-12T13:40:00.000Z",
        timestampOfPeakOpenProfit: "2024-04-12T13:37:00.000Z",
        timestampOfWorstDrawdown: "2024-04-12T13:40:00.000Z",
        peakOpenProfit: 120,
        worstDrawdown: -30,
        peakOpenProfitPctOfBasis: 0.08,
        worstDrawdownPctOfBasis: -0.03,
      },
      positionChangeDerivedSignals: [
        {
          executionIndex: 0,
          timestamp: "2024-04-12T13:33:30.000Z",
          side: "buy",
          shares: 100,
          executionPrice: 1.1,
          previousPositionSize: 0,
          currentPositionSize: 100,
          positionSizeDelta: 100,
          previousAverageEntryPrice: null,
          currentAverageEntryPrice: 1.1,
          previousRealizedPnl: 0,
          currentRealizedPnl: 0,
          realizedPnlDelta: 0,
          wasFlatBeforeExecution: true,
          isFlatAfterExecution: false,
          positionIncreased: true,
          positionDecreased: false,
          positionUnchanged: false,
          openedPositionFromFlat: true,
          closedPositionToFlat: false,
          isBuyExecution: true,
          isSellExecution: false,
          sizeChangePctOfPreviousPosition: null,
          sizeChangePctOfCurrentPosition: 1,
          executionDirectionMatchesTradeDirection: true,
        },
        {
          executionIndex: 1,
          timestamp: "2024-04-12T13:38:30.000Z",
          side: "sell",
          shares: 50,
          executionPrice: 1.2,
          previousPositionSize: 100,
          currentPositionSize: 50,
          positionSizeDelta: -50,
          previousAverageEntryPrice: 1.1,
          currentAverageEntryPrice: 1.1,
          previousRealizedPnl: 0,
          currentRealizedPnl: 5,
          realizedPnlDelta: 5,
          wasFlatBeforeExecution: false,
          isFlatAfterExecution: false,
          positionIncreased: false,
          positionDecreased: true,
          positionUnchanged: false,
          openedPositionFromFlat: false,
          closedPositionToFlat: false,
          isBuyExecution: false,
          isSellExecution: true,
          sizeChangePctOfPreviousPosition: 0.5,
          sizeChangePctOfCurrentPosition: 1,
          executionDirectionMatchesTradeDirection: false,
        },
      ],
    });

    expect(signals.hadPeakOpenProfitBeforeWorstDrawdown).toBe(true);
    expect(signals.secondsFromPeakOpenProfitToWorstDrawdown).toBe(180);
    expect(signals.drawdownFromPeakOpenProfitPctOfBasis).toBe(0.11);
    expect(signals.hadReductionAfterPeakOpenProfitBeforeWorstDrawdown).toBe(
      true,
    );
    expect(signals.reductionCountAfterPeakOpenProfitBeforeWorstDrawdown).toBe(
      1,
    );
    expect(signals.secondsFromPeakOpenProfitToFirstReduction).toBe(90);
  });
});
