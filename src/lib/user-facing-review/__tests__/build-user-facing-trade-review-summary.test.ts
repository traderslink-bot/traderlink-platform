import { describe, expect, it } from "vitest";
import type { TradeCoachingOutput } from "../../coaching/types/trade-coaching-types";
import { buildUserFacingTradeReviewSummary } from "../mappers/build-user-facing-trade-review-summary";

function behavior(
  behaviorId: string,
  label: string,
): TradeCoachingOutput["mostImportantMistake"] {
  return {
    behaviorId,
    label,
  } as TradeCoachingOutput["mostImportantMistake"];
}

function coachingOutput(args: {
  behaviorId?: string;
  behaviorLabel?: string;
  confidence?: TradeCoachingOutput["confidence"];
  patternIds?: string[];
  strength?: boolean;
}): Pick<
  TradeCoachingOutput,
  | "alignment"
  | "confidence"
  | "fixFirst"
  | "mostImportantMistake"
  | "mostImportantStrength"
  | "supportingEvidence"
  | "suppressedBehaviorIds"
> {
  const primary =
    args.behaviorId && args.behaviorLabel
      ? behavior(args.behaviorId, args.behaviorLabel)
      : null;

  return {
    confidence: args.confidence ?? "high",
    fixFirst:
      args.strength || !args.behaviorId
        ? null
        : ({
            behaviorId: args.behaviorId,
          } as TradeCoachingOutput["fixFirst"]),
    mostImportantMistake: args.strength ? null : primary,
    mostImportantStrength: args.strength ? primary : null,
    supportingEvidence: (args.patternIds ?? []).map((patternId) => ({
      contributionScore: 80,
      family: "entry_quality",
      patternId,
    })),
    suppressedBehaviorIds: ["secondary_internal_behavior"],
    alignment: {
      dominantBehaviorIds: args.behaviorId ? [args.behaviorId] : [],
      dominantFamily: "entry_quality",
      scoreBand: args.strength ? "positive" : "negative",
    },
  };
}

function visibleText(summary: ReturnType<typeof buildUserFacingTradeReviewSummary>) {
  return [
    summary.reviewTitle,
    summary.primaryInsight.title,
    summary.primaryInsight.plainEnglishSummary,
    summary.primaryInsight.whyItMatters,
    summary.primaryInsight.fixFirst,
    summary.primaryInsight.confidenceExplanation,
    ...summary.timelineEvidence.map((item) => `${item.label} ${item.explanation}`),
    ...summary.educationLinks.map((item) => `${item.term} ${item.shortDefinition}`),
  ].join(" ");
}

describe("buildUserFacingTradeReviewSummary", () => {
  it("translates chase-entry coaching into beginner-safe review copy", () => {
    const summary = buildUserFacingTradeReviewSummary({
      tradeId: "trade-1",
      symbol: "ALTX",
      sessionLabel: "Market open",
      grossPnlLabel: "-$184",
      coachingOutput: coachingOutput({
        behaviorId: "chasing",
        behaviorLabel: "Chasing",
        patternIds: ["overextended_chase_entry_structure"],
      }),
    });

    expect(summary.primaryInsight.title).toBe("Main issue: You chased the entry.");
    expect(summary.primaryInsight.fixFirst).toContain("wait for a pullback");
    expect(summary.primaryInsight.confidenceLabel).toBe("High");
    expect(summary.timelineEvidence[0]?.explanation).toContain(
      "reduced the margin for error",
    );

    const beginnerCopy = visibleText(summary);
    for (const internalTerm of [
      "patternId",
      "suppressedBehaviorIds",
      "normalizedPatterns",
      "dominantFamily",
      "behaviorPriorityScore",
      "structural_composite",
      "scoreBand",
      "conflictResolutionReason",
      "overextended_chase_entry_structure",
    ]) {
      expect(beginnerCopy).not.toContain(internalTerm);
    }
    expect(summary.advancedDetails.patternIds).toContain(
      "overextended_chase_entry_structure",
    );
  });

  it("uses reinforcement language for strength-first trades", () => {
    const summary = buildUserFacingTradeReviewSummary({
      tradeId: "trade-2",
      symbol: "META",
      sessionLabel: "Afternoon",
      grossPnlLabel: "+$428",
      coachingOutput: coachingOutput({
        behaviorId: "strong_profit_protection",
        behaviorLabel: "Strong Profit Protection",
        patternIds: ["profit_protection_present"],
        strength: true,
      }),
    });

    expect(summary.outcomeLabel).toBe("Strong");
    expect(summary.gradeLabel).toBe("A");
    expect(summary.primaryInsight.type).toBe("strength");
    expect(summary.primaryInsight.title).toContain("protected profit well");
    expect(summary.primaryInsight.fixFirst).toContain("Keep using");
  });

  it("does not overstate needs-more-data reviews", () => {
    const summary = buildUserFacingTradeReviewSummary({
      tradeId: "trade-3",
      symbol: "ABCD",
      sessionLabel: "Unknown",
      coachingOutput: coachingOutput({
        confidence: "low",
      }),
      mode: "needs_more_data",
    });

    expect(summary.outcomeLabel).toBe("Inconclusive");
    expect(summary.gradeLabel).toBe("Needs more data");
    expect(summary.primaryInsight.confidenceLabel).toBe("Needs more data");
    expect(summary.primaryInsight.whyItMatters).toContain(
      "should not pretend to know more",
    );
    expect(summary.primaryInsight.fixFirst).toContain("review the trade manually");
  });

  it("keeps mixed cases to one primary action with moderate confidence wording", () => {
    const summary = buildUserFacingTradeReviewSummary({
      tradeId: "trade-4",
      symbol: "MARA",
      sessionLabel: "Market open",
      coachingOutput: coachingOutput({
        behaviorId: "premature_exit",
        behaviorLabel: "Premature Exit",
        confidence: "moderate",
        patternIds: ["balanced_management_with_premature_final_exit"],
      }),
      mode: "mixed",
    });

    expect(summary.primaryInsight.type).toBe("mixed");
    expect(summary.primaryInsight.confidenceLabel).toBe("Moderate");
    expect(summary.primaryInsight.confidenceExplanation).toContain("mixed evidence");
    expect(summary.primaryInsight.fixFirst).toBe(
      "Keep a final piece until structure fails or a planned target is reached.",
    );
  });
});
