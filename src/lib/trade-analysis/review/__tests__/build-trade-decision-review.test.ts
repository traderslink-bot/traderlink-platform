import { describe, expect, it } from "vitest";
import { PATTERN_DEFINITIONS } from "../../../pattern-detection/registry/pattern-definitions";
import type {
  DetectedPattern,
  PatternDetectionResult,
} from "../../../pattern-detection/types/pattern-detection-types";
import { getPatternMetadata } from "../../../pattern-normalization/pattern-metadata";
import type {
  NormalizedDetectedPattern,
  NormalizedPatternResult,
} from "../../../pattern-normalization/types/normalized-pattern-result";
import type { PatternInput } from "../../../pattern-input/types/pattern-input";
import type { AppTradeAnalysisResult } from "../../run-trade-analysis";
import { buildTradeDecisionReview } from "../build-trade-decision-review";

function normalizedPattern(patternId: string): NormalizedDetectedPattern {
  const definition = PATTERN_DEFINITIONS.find(
    (candidate) => candidate.id === patternId,
  );
  const metadata = getPatternMetadata(patternId);

  if (!definition || !metadata) {
    throw new Error(`Missing test pattern metadata for ${patternId}`);
  }

  return {
    evidence: {},
    family: definition.family,
    metadata,
    normalizedRole: "primary_candidate",
    patternId,
    patternName: definition.name,
    patternType: definition.patternType,
    structuralLevel: definition.structuralLevel,
    suppressionReasons: [],
    thresholdsUsed: {},
  };
}

function normalizedPatterns(
  patternIds: string[],
): NormalizedPatternResult {
  const patterns = patternIds.map(normalizedPattern);
  const patternsByFamily: Record<string, NormalizedDetectedPattern[]> = {};
  const primaryPatternsByFamily: Record<string, NormalizedDetectedPattern> = {};

  for (const pattern of patterns) {
    patternsByFamily[pattern.family] = [
      ...(patternsByFamily[pattern.family] ?? []),
      pattern,
    ];
    primaryPatternsByFamily[pattern.family] ??= pattern;
  }

  return {
    contextualPatterns: [],
    patternsByFamily,
    primaryPatterns: patterns,
    primaryPatternsByFamily,
    prioritizedPatterns: patterns,
    supportingPatterns: [],
    topOverallAnchorPattern: patterns[0] ?? null,
  };
}

function patternInput(
  exitOverrides: Partial<PatternInput["exitContext"]>,
  supportResistanceOverrides: Partial<PatternInput["supportResistanceContext"]> = {},
): PatternInput {
  return {
    sessionBucket: "market_open",
    symbol: "ABCD",
    tradeDirection: "long",
    entryContext: {
      firstEntryCapturedPercentOfTradeMfe: null,
      firstEntryRecentRunUpPctBeforeEntry: null,
    },
    exitContext: {
      favorableExcursionLeftOnTablePct: 0.02,
      finalExitToPeakDistancePct: 0.02,
      maxAdverseMovePctAfterExit: null,
      maxFavorableMovePctAfterExit: null,
      netMovePctAtEndOfPostExitWindow: null,
      postExitCandleCount: 0,
      realizedCapturePercentOfTradeMfe: 0.25,
      ...exitOverrides,
    },
    recoveryContext: {},
    scalingContext: {},
    supportResistanceContext: {
      firstEntryNearestResistanceAbovePrice: null,
      firstEntryNearestResistanceBelowPrice: null,
      firstEntryNearestSupportBelowPrice: null,
      firstEntryDistanceToNearestResistancePct: null,
      firstEntryDistanceToNearestSupportPct: null,
      finalExitDistanceToNearestResistancePct: null,
      finalExitDistanceToNearestSupportPct: null,
      finalExitOccurredNearResistance: false,
      finalExitOccurredNearSupport: false,
      firstEntryOccurredInOpenAir: false,
      reductionsNearResistanceCount: 0,
      hadSupportResistanceContextAvailable: false,
      ...supportResistanceOverrides,
    },
    timingContext: {},
    tradeStructure: {
      peakPriceDuringTrade: 1.3,
      tradeMaePct: 0.01,
      tradeMfePct: 0.08,
      worstPriceDuringTrade: 1.1,
    },
  } as unknown as PatternInput;
}

function appTradeAnalysisResult(args: {
  exitOverrides: Partial<PatternInput["exitContext"]>;
  patternIds: string[];
  supportResistanceOverrides?: Partial<PatternInput["supportResistanceContext"]>;
}): AppTradeAnalysisResult {
  const normalized = normalizedPatterns(args.patternIds);

  return {
    detectedPatterns: {
      detectedPatterns:
        normalized.prioritizedPatterns as unknown as DetectedPattern[],
    } satisfies PatternDetectionResult,
    normalizedPatterns: normalized,
    patternInput: patternInput(
      args.exitOverrides,
      args.supportResistanceOverrides,
    ),
    rawTradeTimeline: {
      timeline: {
        sessionContext: {
          sessionBucket: "market_open",
        },
      },
    } as AppTradeAnalysisResult["rawTradeTimeline"],
    supportResistanceMode: "provided_candles_only",
  };
}

describe("buildTradeDecisionReview exit evidence gates", () => {
  it("downgrades premature-exit patterns when after-exit candles are missing", () => {
    const review = buildTradeDecisionReview(
      appTradeAnalysisResult({
        exitOverrides: {
          maxFavorableMovePctAfterExit: null,
          postExitCandleCount: 0,
        },
        patternIds: ["missed_post_exit_continuation"],
      }),
    );
    const insightIds = review.insights.map((insight) => insight.id);

    expect(insightIds).toContain("exit_needs_post_exit_context");
    expect(insightIds).not.toContain("exit_left_continuation");
    expect(review.coaching.fixFirstBehaviorId).not.toBe("premature_exit");
  });

  it("certifies continuation only when after-exit candle evidence is safe", () => {
    const review = buildTradeDecisionReview(
      appTradeAnalysisResult({
        exitOverrides: {
          maxFavorableMovePctAfterExit: 0.03,
          netMovePctAtEndOfPostExitWindow: 0.02,
          postExitCandleCount: 2,
        },
        patternIds: ["missed_post_exit_continuation"],
      }),
    );
    const insightIds = review.insights.map((insight) => insight.id);

    expect(insightIds).toContain("exit_left_continuation");
    expect(insightIds).not.toContain("exit_needs_post_exit_context");
    expect(insightIds).not.toContain("exit_large_post_exit_move_needs_review");
  });

  it("keeps unusually large after-exit moves as review prompts until calibrated", () => {
    const review = buildTradeDecisionReview(
      appTradeAnalysisResult({
        exitOverrides: {
          maxFavorableMovePctAfterExit: 0.12,
          netMovePctAtEndOfPostExitWindow: 0.1,
          postExitCandleCount: 3,
        },
        patternIds: ["missed_post_exit_continuation"],
      }),
    );
    const insightIds = review.insights.map((insight) => insight.id);

    expect(insightIds).toContain("exit_large_post_exit_move_needs_review");
    expect(insightIds).not.toContain("exit_left_continuation");
  });

  it("surfaces resistance exits that protected profit before reversal", () => {
    const review = buildTradeDecisionReview(
      appTradeAnalysisResult({
        exitOverrides: {
          maxAdverseMovePctAfterExit: 0.03,
          maxFavorableMovePctAfterExit: 0.005,
          netMovePctAtEndOfPostExitWindow: -0.025,
          postExitCandleCount: 4,
          realizedCapturePercentOfTradeMfe: 0.7,
        },
        patternIds: ["exit_into_resistance_with_reversal_after_exit"],
        supportResistanceOverrides: {
          finalExitDistanceToNearestResistancePct: 0.4,
          finalExitOccurredNearResistance: true,
          hadSupportResistanceContextAvailable: true,
        },
      }),
    );
    const insight = review.insights.find(
      (candidate) =>
        candidate.id === "exit_into_resistance_with_reversal_after_exit",
    );

    expect(insight?.tone).toBe("strength");
    expect(insight?.title).toBe("Exit protected profit near resistance");
    expect(insight?.evidence).toContain("finalExitOccurredNearResistance=true");
    expect(review.coaching.headline).toContain("protected profit near resistance");
  });

  it("certifies protected profit before a later fade only when capture and after-exit candles agree", () => {
    const review = buildTradeDecisionReview(
      appTradeAnalysisResult({
        exitOverrides: {
          finalExitToPeakDistancePct: 0.012,
          maxAdverseMovePctAfterExit: 0.035,
          maxFavorableMovePctAfterExit: 0.004,
          netMovePctAtEndOfPostExitWindow: -0.025,
          postExitCandleCount: 4,
          realizedCapturePercentOfTradeMfe: 0.74,
        },
        patternIds: [
          "exit_avoided_adverse_followthrough",
          "high_capture_exit_structure",
        ],
      }),
    );
    const insightIds = review.insights.map((insight) => insight.id);
    const protectedProfit = review.insights.find(
      (insight) => insight.id === "protected_profit_before_fade",
    );

    expect(protectedProfit?.tone).toBe("strength");
    expect(protectedProfit?.title).toBe("Protected profit before the fade");
    expect(protectedProfit?.evidence).toContain("postExitCandleCount=4");
    expect(insightIds).toContain("protected_profit_before_fade");
    expect(insightIds).not.toContain("exit_avoided_adverse_followthrough");
    expect(review.coaching.headline).toContain("Profit was protected");
  });

  it("does not certify protected-profit fade language without after-exit candles", () => {
    const review = buildTradeDecisionReview(
      appTradeAnalysisResult({
        exitOverrides: {
          finalExitToPeakDistancePct: 0.012,
          maxAdverseMovePctAfterExit: null,
          maxFavorableMovePctAfterExit: null,
          netMovePctAtEndOfPostExitWindow: null,
          postExitCandleCount: 0,
          realizedCapturePercentOfTradeMfe: 0.74,
        },
        patternIds: ["high_capture_exit_structure"],
      }),
    );
    const insightIds = review.insights.map((insight) => insight.id);

    expect(insightIds).not.toContain("protected_profit_before_fade");
    expect(insightIds).toContain("exit_captured_trade_well");
  });

  it("does not call a well-captured exit protected before a fade when the chart continued", () => {
    const review = buildTradeDecisionReview(
      appTradeAnalysisResult({
        exitOverrides: {
          finalExitToPeakDistancePct: 0.012,
          maxAdverseMovePctAfterExit: 0.004,
          maxFavorableMovePctAfterExit: 0.035,
          netMovePctAtEndOfPostExitWindow: 0.025,
          postExitCandleCount: 4,
          realizedCapturePercentOfTradeMfe: 0.74,
        },
        patternIds: ["high_capture_exit_structure"],
      }),
    );
    const insightIds = review.insights.map((insight) => insight.id);

    expect(insightIds).not.toContain("protected_profit_before_fade");
    expect(insightIds).toContain("exit_captured_trade_well");
  });

  it("surfaces resistance exits that happened before a later break", () => {
    const review = buildTradeDecisionReview(
      appTradeAnalysisResult({
        exitOverrides: {
          maxFavorableMovePctAfterExit: 0.035,
          netMovePctAtEndOfPostExitWindow: 0.03,
          postExitCandleCount: 4,
        },
        patternIds: ["exit_into_resistance_before_breakout"],
        supportResistanceOverrides: {
          finalExitDistanceToNearestResistancePct: 0.35,
          finalExitOccurredNearResistance: true,
          hadSupportResistanceContextAvailable: true,
        },
      }),
    );
    const insight = review.insights.find(
      (candidate) => candidate.id === "exit_into_resistance_before_breakout",
    );

    expect(insight?.tone).toBe("risk");
    expect(insight?.title).toBe("Exit came before resistance broke");
    expect(review.coaching.headline).toContain("before resistance broke");
  });

  it("surfaces support exits that avoided a later breakdown", () => {
    const review = buildTradeDecisionReview(
      appTradeAnalysisResult({
        exitOverrides: {
          maxAdverseMovePctAfterExit: 0.04,
          maxFavorableMovePctAfterExit: 0.004,
          netMovePctAtEndOfPostExitWindow: -0.03,
          postExitCandleCount: 4,
        },
        patternIds: ["exit_into_support_before_breakdown"],
        supportResistanceOverrides: {
          finalExitDistanceToNearestSupportPct: 0.25,
          finalExitOccurredNearSupport: true,
          hadSupportResistanceContextAvailable: true,
        },
      }),
    );
    const insight = review.insights.find(
      (candidate) => candidate.id === "exit_into_support_before_breakdown",
    );

    expect(insight?.tone).toBe("strength");
    expect(insight?.title).toBe("Exit avoided a support break");
    expect(insight?.summary).toContain("broke lower");
  });

  it("keeps support exits before relief as review prompts", () => {
    const review = buildTradeDecisionReview(
      appTradeAnalysisResult({
        exitOverrides: {
          maxFavorableMovePctAfterExit: 0.025,
          netMovePctAtEndOfPostExitWindow: 0.02,
          postExitCandleCount: 4,
        },
        patternIds: ["exit_into_support_with_relief_after_exit"],
        supportResistanceOverrides: {
          finalExitDistanceToNearestSupportPct: 0.25,
          finalExitOccurredNearSupport: true,
          hadSupportResistanceContextAvailable: true,
        },
      }),
    );
    const insight = review.insights.find(
      (candidate) => candidate.id === "exit_into_support_with_relief_after_exit",
    );
    const mappedCopy = `${insight?.title} ${insight?.summary}`.toLowerCase();

    expect(insight?.tone).toBe("neutral");
    expect(insight?.title).toBe("Review the exit near support");
    expect(mappedCopy).not.toContain("should have held");
    expect(review.coaching.headline.toLowerCase()).not.toContain("wrong");
  });
});
