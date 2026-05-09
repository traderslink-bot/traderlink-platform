// 2026-04-12 01:50 PM America/Toronto
// PURPOSE:
// Validates the pattern input builder.
// Ensures correct aggregation from raw timeline result.

import { describe, expect, it } from "vitest";
import { createRawTradeTimeline } from "../../raw-trade-timeline/builders/create-raw-trade-timeline";
import { buildPatternInput } from "../../pattern-input/builders/build-pattern-input";
import { sampleCreateRawTradeTimelineInput } from "../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";

describe("buildPatternInput", () => {
  it("builds a clean pattern input object from raw trade timeline", () => {
    const rawResult = createRawTradeTimeline(
      sampleCreateRawTradeTimelineInput,
    );

    const patternInput = buildPatternInput(rawResult);

    expect(patternInput.symbol).toBe("ABCD");
    expect(patternInput.tradeDirection).toBe("long");
    expect(patternInput.sessionBucket).toBe("market_open");
    expect(patternInput.tradeStructure.executionCount).toBe(3);
    expect(patternInput.entryContext.firstEntryOccurredDuringMarketOpenSession).toBe(
      true,
    );
    expect(
      patternInput.supportResistanceContext.hadSupportResistanceContextAvailable,
    ).toBe(false);
    expect(patternInput.recoveryContext.hadPeakOpenProfitBeforeWorstDrawdown).toBe(
      false,
    );
    expect("executionCount" in patternInput).toBe(false);
    expect("hadSupportResistanceContextAvailable" in patternInput).toBe(false);

    expect(patternInput.tradeStructure.executionCount).toBe(3);
    expect(patternInput.tradeStructure.tradeDurationSeconds).toBe(340);
    expect(patternInput.tradeStructure.tradeCandleCount).toBe(6);

    expect(patternInput.tradeStructure.totalPositionIncreaseCount).toBe(2);
    expect(patternInput.tradeStructure.totalPositionDecreaseCount).toBe(1);

    expect(patternInput.tradeStructure.openedFromFlat).toBe(true);
    expect(patternInput.tradeStructure.closedToFlat).toBe(true);

    expect(patternInput.tradeStructure.entryPrice).toBe(1.185);
    expect(patternInput.tradeStructure.exitPrice).toBe(1.295);

    expect(patternInput.tradeStructure.tradeMfePct).toBe(0.147679);
    expect(patternInput.tradeStructure.tradeMaePct).toBe(0.012658);

    expect(patternInput.tradeStructure.maxExecutionMfePct).toBeGreaterThan(0);
    expect(patternInput.tradeStructure.averageExecutionMfePct).toBeGreaterThan(0);

    expect(patternInput.timingContext.averageTimeBetweenExecutionsSeconds).toBe(
      170,
    );
    expect(patternInput.timingContext.executionsPerMinute).toBeGreaterThan(0);

    expect(
      patternInput.entryContext.firstEntryRecentRunUpPctBeforeEntry,
    ).not.toBeNull();
    expect(
      patternInput.entryContext.firstEntryRecentReferenceLevelBeforeEntry,
    ).not.toBeNull();
    expect(
      patternInput.entryContext.firstEntryHadRecentReferenceReclaimBeforeEntry,
    ).toBe(true);
    expect(
      patternInput.entryContext.firstEntryRecentReferenceConfirmationCandlesCount,
    ).toBeGreaterThan(0);
    expect(patternInput.entryContext.firstEntryOccurredDuringMarketOpenSession).toBe(
      true,
    );
    expect(patternInput.entryContext.firstEntryOpeningRangeCandlesCountBeforeEntry).toBe(
      3,
    );
    expect(patternInput.entryContext.firstEntryOpeningRangeHighBeforeEntry).not.toBeNull();
    expect(patternInput.entryContext.firstEntryOpeningRangeLowBeforeEntry).not.toBeNull();
    expect(
      patternInput.entryContext.firstEntryOpeningRangeReferenceLevelBeforeEntry,
    ).not.toBeNull();
    expect(patternInput.entryContext.firstEntryHadOpeningRangeReclaimBeforeEntry).toBe(
      true,
    );
    expect(
      patternInput.supportResistanceContext.hadSupportResistanceContextAvailable,
    ).toBe(false);
    expect(
      patternInput.supportResistanceContext.hadInsufficientCandleDataForStructuralContext,
    ).toBe(true);
    expect(patternInput.supportResistanceContext.firstEntryOccurredInOpenAir).toBe(
      false,
    );
    expect(patternInput.supportResistanceContext.firstEntryDistanceFromVwapPct).toBeNull();
    expect(patternInput.supportResistanceContext.firstEntryDistanceFromEma9Pct).toBeNull();
    expect(patternInput.supportResistanceContext.firstEntryDistanceFromEma20Pct).toBeNull();
    expect(
      typeof patternInput.supportResistanceContext.firstEntryClearedNearestResistanceBelow,
    ).toBe("boolean");
    expect(
      typeof patternInput.supportResistanceContext.firstEntryHadRoomAboveAfterClearingResistance,
    ).toBe("boolean");
    expect(patternInput.supportResistanceContext.firstEntryHasNearbyStructureOnBothSides).toBe(
      false,
    );
    expect(patternInput.exitContext.postExitCandleCount).toBe(1);
    expect(patternInput.exitContext.maxFavorableMovePctAfterExit).toBe(0.011583);
    expect(patternInput.exitContext.maxAdverseMovePctAfterExit).toBe(0.027027);
    expect(patternInput.exitContext.netMovePctAtEndOfPostExitWindow).toBe(-0.019305);
    expect(patternInput.recoveryContext.maxGivebackFromPeakOpenProfitPct).not.toBeNull();
    expect(patternInput.recoveryContext.peakOpenProfitPctOfBasis).not.toBeNull();
    expect(patternInput.recoveryContext.worstDrawdownPctOfBasis).not.toBeNull();
    expect(patternInput.recoveryContext.hadPeakOpenProfitBeforeWorstDrawdown).toBe(false);
    expect(patternInput.exitContext.hadPartialExit).toBe(false);
    expect(patternInput.scalingContext.hadReaddAfterReduction).toBe(false);
    expect(patternInput.scalingContext.averageReaddPriceChangeFromPriorReductionPct).toBeNull();
    expect(
      patternInput.scalingContext.averageFavorableMovePctAfterPartialExitBeforeReadd,
    ).toBeNull();
    expect(
      patternInput.scalingContext.averageAdverseMovePctAfterPartialExitBeforeReadd,
    ).toBeNull();
    expect(
      patternInput.scalingContext.averageFavorableMovePctAfterReaddBeforeNextExecution,
    ).toBeNull();
    expect(
      patternInput.scalingContext.averageAdverseMovePctAfterReaddBeforeNextExecution,
    ).toBeNull();
    expect(
      patternInput.scalingContext.readdsWithStrongerFavorableFollowthroughCount,
    ).toBe(0);
    expect(
      patternInput.scalingContext.readdsWithStrongerAdverseFollowthroughCount,
    ).toBe(0);
    expect(patternInput.scalingContext.readdsAfterRecentRunUpCount).toBe(0);
    expect(patternInput.scalingContext.readdsAfterRecentDropCount).toBe(0);
    expect(patternInput.scalingContext.addCountAfterInitialEntry).toBe(1);
    expect(patternInput.exitContext.reductionAbovePreviousAverageEntryCount).toBe(1);
    expect(patternInput.exitContext.reductionBelowPreviousAverageEntryCount).toBe(0);
    expect(patternInput.scalingContext.averageAddRecentRunUpPctBeforeExecution).not.toBeNull();
    expect(patternInput.exitContext.averageReductionRecentRunUpPctBeforeExecution).not.toBeNull();
    expect(patternInput.supportResistanceContext.addsNearResistanceCount).toBe(0);
    expect(patternInput.supportResistanceContext.addsAboveResistanceWithRoomCount).toBe(0);
    expect(patternInput.supportResistanceContext.addsNearSupportCount).toBe(0);
    expect(patternInput.supportResistanceContext.reductionsNearSupportCount).toBe(0);
    expect(patternInput.supportResistanceContext.reductionsNearResistanceCount).toBe(0);
  });
});
