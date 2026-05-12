import { describe, expect, it } from "vitest";
import {
  mapDecisionReviewInsightForUser,
  mapUserFacingBehavior,
} from "..";

function visibleCopy(input: ReturnType<typeof mapUserFacingBehavior>): string {
  return [
    input.label,
    input.plainExplanation,
    input.fixFirstAction,
    input.evidenceSentence,
    input.missingDataSentence,
    input.unsupportedFallback,
  ].join(" ");
}

describe("mapUserFacingBehavior", () => {
  const executionFeedbackBehaviorCases = [
    {
      behaviorId: "multiple_adds_before_first_reduction",
      rawLabel: "Multiple Adds Before First Reduction",
      expectedState: "certified_detection",
      expectedLabel: "Added several times before reducing size",
    },
    {
      behaviorId: "size_expansion_after_adverse_price",
      rawLabel: "Size Expansion After Adverse Price",
      expectedState: "review_prompt",
      expectedLabel: "Review adds that need chart data",
    },
    {
      behaviorId: "adverse_price_adds",
      rawLabel: "Adds After Price Moved Against You",
      expectedState: "review_prompt",
      expectedLabel: "Review adds that need chart data",
    },
    {
      behaviorId: "overbuilt_position",
      rawLabel: "Overbuilt Position",
      expectedState: "certified_detection",
      expectedLabel: "Built too much size in a losing trade",
    },
    {
      behaviorId: "small_first_risk_reduction",
      rawLabel: "Small First Risk Reduction",
      expectedState: "certified_detection",
      expectedLabel: "First reduction did not take much risk off",
    },
    {
      behaviorId: "open_position_leftover",
      rawLabel: "Open Position Leftover",
      expectedState: "certified_detection",
      expectedLabel: "Trade was left open",
    },
    {
      behaviorId: "all_or_nothing_exit_after_many_adds",
      rawLabel: "All Or Nothing Exit After Many Adds",
      expectedState: "certified_detection",
      expectedLabel: "Many adds before one large exit",
    },
    {
      behaviorId: "large_late_add",
      rawLabel: "Large Late Add",
      expectedState: "certified_detection",
      expectedLabel: "Added meaningful size late in the trade",
    },
    {
      behaviorId: "losing_reduction_sequence",
      rawLabel: "Losing Reduction Sequence",
      expectedState: "certified_detection",
      expectedLabel: "Reduced after price was against the entry",
    },
    {
      behaviorId: "inconsistent_share_sizing",
      rawLabel: "Inconsistent Share Sizing",
      expectedState: "certified_detection",
      expectedLabel: "Inconsistent position sizing",
    },
    {
      behaviorId: "rapid_fire_execution_cluster",
      rawLabel: "Rapid Fire Execution Cluster",
      expectedState: "review_prompt",
      expectedLabel: "Review fast execution clusters",
    },
    {
      behaviorId: "clean_single_entry_full_exit",
      rawLabel: "Clean Single Entry Full Exit",
      expectedState: "certified_detection",
      expectedLabel: "Clean entry and full exit",
    },
    {
      behaviorId: "controlled_scale_in",
      rawLabel: "Controlled Scale In",
      expectedState: "certified_detection",
      expectedLabel: "Controlled scale-in",
    },
    {
      behaviorId: "structured_partial_exit_sequence",
      rawLabel: "Structured Partial Exit Sequence",
      expectedState: "certified_detection",
      expectedLabel: "Structured partial exits",
    },
    {
      behaviorId: "early_position_risk_reduction",
      rawLabel: "Early Position Risk Reduction",
      expectedState: "certified_detection",
      expectedLabel: "Reduced risk early",
    },
    {
      behaviorId: "decisive_full_exit",
      rawLabel: "Decisive Full Exit",
      expectedState: "certified_detection",
      expectedLabel: "Closed the trade cleanly",
    },
    {
      behaviorId: "consistent_share_sizing",
      rawLabel: "Consistent Share Sizing",
      expectedState: "certified_detection",
      expectedLabel: "Consistent position sizing",
    },
    {
      behaviorId: "profitable_reduction_sequence",
      rawLabel: "Profitable Reduction Sequence",
      expectedState: "certified_detection",
      expectedLabel: "Reduced at favorable prices",
    },
  ] as const;

  const marketContextBehaviorCases = [
    {
      behaviorId: "entry_near_daily_4h_resistance",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Entry was close to resistance",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "entry_limited_clean_room_to_resistance",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Entry had limited room before resistance",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "entry_near_daily_4h_support",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Entry was close to support",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "entry_far_from_daily_4h_support",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Entry had little nearby support",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "exit_left_continuation",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Exit came before more continuation",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "exit_needs_post_exit_context",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Exit needs after-exit chart check",
      expectedOpportunityType: "review_prompt",
      expectedState: "review_prompt",
    },
    {
      behaviorId: "exit_large_post_exit_move_needs_review",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Large after-exit move needs review",
      expectedOpportunityType: "review_prompt",
      expectedState: "review_prompt",
    },
    {
      behaviorId: "adds_increased_risk_into_weakness",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Added before the trade repaired",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "stacked_daily_4h_resistance_above_entry",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Resistance was stacked above the entry",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "breakout_had_room_above",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Breakout had room above",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "entry_chase_or_late_extension",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Entry came after extension",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "entry_had_constructive_location",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Entry location was constructive",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "entry_breakout_failed",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Breakout did not hold",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "winner_stayed_undersized",
      expectedEvidenceChannel: "combined",
      expectedLabel: "Winner was not pressed much",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "adds_aligned_with_strength",
      expectedEvidenceChannel: "combined",
      expectedLabel: "Adds followed strength",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "adds_after_trade_already_used_range",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Added after much of the move was used",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "adds_near_daily_4h_resistance",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Adds were near resistance",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "adds_above_resistance_with_room",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Adds cleared resistance with room",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "reductions_near_resistance",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Reduced size near resistance",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "protected_profit_before_fade",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Protected profit before the fade",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "exit_captured_trade_well",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Exit captured the trade well",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "balanced_management_with_constructive_exit",
      expectedEvidenceChannel: "combined",
      expectedLabel: "Managed the full trade constructively",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "add_into_strength_with_constructive_final_exit",
      expectedEvidenceChannel: "combined",
      expectedLabel: "Added into strength and exited constructively",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "exit_avoided_adverse_followthrough",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Exit avoided a later fade",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "exit_into_resistance_with_reversal_after_exit",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Exit protected profit near resistance",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "exit_into_resistance_before_breakout",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Exit came before resistance broke",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "exit_into_support_before_breakdown",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Exit avoided a support break",
      expectedOpportunityType: "strength_to_repeat",
    },
    {
      behaviorId: "exit_into_support_with_relief_after_exit",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Review the exit near support",
      expectedOpportunityType: "review_prompt",
      expectedState: "review_prompt",
    },
    {
      behaviorId: "profit_protection_failed",
      expectedEvidenceChannel: "combined",
      expectedLabel: "Open profit was not protected",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "reentry_volume_faded",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Re-entry had lower volume",
      expectedOpportunityType: "risk_to_reduce",
    },
    {
      behaviorId: "reentry_volume_confirmed",
      expectedEvidenceChannel: "market_context",
      expectedLabel: "Re-entry kept strong volume",
      expectedOpportunityType: "strength_to_repeat",
    },
  ] as const;

  it("maps failed-premise engine language to trader-readable add sequence copy", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "added_after_failed_premise",
      rawLabel: "Added After Failed Premise",
      route: "/coach",
    });

    expect(behavior.contractFound).toBe(true);
    expect(behavior.state).toBe("certified_detection");
    expect(behavior.opportunityType).toBe("risk_to_reduce");
    expect(behavior.evidenceChannel).toBe("execution_only");
    expect(behavior.canDrivePrimaryConclusion).toBe(true);
    expect(behavior.label).toBe("Added several times before reducing size");
    expect(behavior.fixFirstAction).toContain("size had to stop increasing");
    expect(visibleCopy(behavior).toLowerCase()).not.toContain("premise");
  });

  it.each(executionFeedbackBehaviorCases)(
    "maps execution-feedback behavior $behaviorId to product-safe user copy",
    ({ behaviorId, rawLabel, expectedState, expectedLabel }) => {
      const behavior = mapUserFacingBehavior({
        behaviorId,
        rawLabel,
        route: "/analytics",
      });
      const copy = visibleCopy(behavior).toLowerCase();

      expect(behavior.contractFound).toBe(true);
      expect(behavior.state).toBe(expectedState);
      expect(behavior.label).toBe(expectedLabel);
      expect(copy).not.toContain("failed premise");
      expect(copy).not.toContain("size expansion after adverse price");
      expect(copy).not.toContain("open position leftover");
      expect(copy).not.toContain("rapid fire execution cluster");
    },
  );

  it("keeps emotional re-entry language as a review prompt, not a conclusion", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "revenge_reentry_cluster",
      rawLabel: "Revenge-Like Re-Entry Cluster",
      route: "/coach",
    });

    expect(behavior.contractFound).toBe(true);
    expect(behavior.state).toBe("review_prompt");
    expect(behavior.opportunityType).toBe("review_prompt");
    expect(behavior.canDrivePrimaryConclusion).toBe(false);
    expect(behavior.label).toBe("Review quick re-entry pressure");
    expect(visibleCopy(behavior).toLowerCase()).not.toContain("revenge");
  });

  it("does not certify chase-entry language without chart evidence", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "chased_entry",
      rawLabel: "Chased Entry",
      route: "/coach",
    });

    expect(behavior.state).toBe("review_prompt");
    expect(behavior.evidenceChannel).toBe("market_context");
    expect(behavior.canDrivePrimaryConclusion).toBe(false);
    expect(behavior.label).toBe("Review whether the entry was rushed");
    expect(behavior.missingDataSentence).toContain("candle");
  });

  it("preserves safe symbol context for same-ticker overtrading labels", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "overtraded_same_ticker",
      rawLabel: "Repeated risky ABCD trades",
      route: "/coach",
    });

    expect(behavior.state).toBe("certified_detection");
    expect(behavior.canDrivePrimaryConclusion).toBe(true);
    expect(behavior.label).toBe("Repeated risky ABCD trades");
    expect(visibleCopy(behavior).toLowerCase()).not.toContain("revenge");
  });

  it("keeps execution-only adverse adds as review prompts until chart evidence proves quality", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "size_expansion_after_adverse_price",
      rawLabel: "Size Expansion After Adverse Price",
      route: "/analytics",
    });

    expect(behavior.contractFound).toBe(true);
    expect(behavior.canDrivePrimaryConclusion).toBe(false);
    expect(behavior.state).toBe("review_prompt");
    expect(behavior.opportunityType).toBe("review_prompt");
    expect(behavior.evidenceChannel).toBe("execution_only");
    expect(behavior.label).toBe("Review adds that need chart data");
    const copy = visibleCopy(behavior).toLowerCase();
    expect(copy).toContain("planned dip buy");
    expect(copy).toContain("repair");
    expect(copy).not.toContain("size expansion after adverse price");
    expect(copy).not.toContain("bad add");
  });

  it("keeps chart-confirmed add weakness as a certified market-context risk", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "adds_increased_risk_into_weakness",
      rawLabel: "Adds increased risk into weakness",
      route: "/trades/[tradeId]",
    });

    expect(behavior.contractFound).toBe(true);
    expect(behavior.canDrivePrimaryConclusion).toBe(true);
    expect(behavior.state).toBe("certified_detection");
    expect(behavior.opportunityType).toBe("risk_to_reduce");
    expect(behavior.evidenceChannel).toBe("market_context");
    expect(behavior.label).toBe("Added before the trade repaired");
    expect(visibleCopy(behavior).toLowerCase()).toContain("repair");
  });

  it("maps certified strengths as repeatable behaviors", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "profitable_reduction_sequence",
      rawLabel: "Profitable Reduction Sequence",
      route: "/analytics",
    });

    expect(behavior.contractFound).toBe(true);
    expect(behavior.state).toBe("certified_detection");
    expect(behavior.canDrivePrimaryConclusion).toBe(true);
    expect(behavior.opportunityType).toBe("strength_to_repeat");
    expect(behavior.tone).toBe("strength");
    expect(visibleCopy(behavior).toLowerCase()).toMatch(
      /repeat|keep|favorable|reduced/,
    );
  });

  it.each(marketContextBehaviorCases)(
    "maps market-context behavior $behaviorId to product-safe chart copy",
    (scenario) => {
      const {
        behaviorId,
        expectedEvidenceChannel,
        expectedLabel,
        expectedOpportunityType,
      } = scenario;
      const expectedState =
        "expectedState" in scenario
          ? scenario.expectedState
          : "certified_detection";
      const behavior = mapUserFacingBehavior({
        behaviorId,
        rawLabel: behaviorId,
        route: "/trades/[tradeId]",
      });
      const copy = visibleCopy(behavior).toLowerCase();

      expect(behavior.contractFound).toBe(true);
      expect(behavior.state).toBe(expectedState);
      expect(behavior.canDrivePrimaryConclusion).toBe(
        expectedState === "certified_detection",
      );
      expect(behavior.evidenceChannel).toBe(expectedEvidenceChannel);
      expect(behavior.opportunityType).toBe(expectedOpportunityType);
      expect(behavior.label).toBe(expectedLabel);
      expect(copy).not.toContain("clean room");
      expect(copy).not.toContain("trade-window movement");
      expect(copy).not.toContain("signal");
      expect(copy).not.toContain("guaranteed");
      expect(copy).not.toContain("failed premise");
      expect(copy).not.toContain("money was left on the table");
    },
  );

  it("keeps during-trade movement as supporting context, not a primary conclusion", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "trade_window_excursion_measured",
      rawLabel: "Trade-window movement was measured",
      route: "/trades/[tradeId]",
    });

    expect(behavior.contractFound).toBe(true);
    expect(behavior.state).toBe("review_prompt");
    expect(behavior.opportunityType).toBe("review_prompt");
    expect(behavior.canDrivePrimaryConclusion).toBe(false);
    expect(behavior.label).toBe("During-trade movement was measured");
    expect(visibleCopy(behavior).toLowerCase()).not.toContain("trade-window");
  });

  it("keeps incomplete after-exit continuation as a prompt, not a conclusion", () => {
    const finding = mapDecisionReviewInsightForUser(
      {
        category: "exit",
        evidence: ["postExitCandleCount=0"],
        id: "exit_needs_post_exit_context",
        summary: "Exit needs after-exit chart check.",
        title: "Exit needs after-exit chart check",
        tone: "neutral",
      },
      "/coach",
    );

    expect(finding.canShowPrimary).toBe(true);
    expect(finding.canDrivePrimaryConclusion).toBe(false);
    expect(finding.opportunityType).toBe("review_prompt");
    expect(finding.label).toBe("Exit needs after-exit chart check");
    expect(finding.reviewAction.toLowerCase()).toContain("after-exit chart evidence");
    expect(`${finding.detail} ${finding.reviewAction}`.toLowerCase()).not.toContain(
      "money left behind",
    );
  });

  it("keeps unusually large after-exit moves prompt-only until calibrated", () => {
    const finding = mapDecisionReviewInsightForUser(
      {
        category: "exit",
        evidence: ["maxFavorableMovePctAfterExit=12.0%"],
        id: "exit_large_post_exit_move_needs_review",
        summary: "Large after-exit move needs review.",
        title: "Large after-exit move needs review",
        tone: "neutral",
      },
      "/trades/[tradeId]",
    );

    expect(finding.canShowPrimary).toBe(true);
    expect(finding.canDrivePrimaryConclusion).toBe(false);
    expect(finding.opportunityType).toBe("review_prompt");
    expect(finding.label).toBe("Large after-exit move needs review");
    expect(finding.reviewAction.toLowerCase()).toContain("manually");
    expect(`${finding.detail} ${finding.reviewAction}`.toLowerCase()).not.toContain(
      "guaranteed",
    );
  });

  it("keeps short-side market-context insights out of normal user routes", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "short_entry_near_daily_4h_support",
      rawLabel: "Short entry was close to support",
      route: "/trades/[tradeId]",
    });

    expect(behavior.contractFound).toBe(false);
    expect(behavior.state).toBe("internal_only");
    expect(behavior.canDrivePrimaryConclusion).toBe(false);
    expect(behavior.label).toBe("Review behavior in advanced details");
  });

  it("translates decision-review insights into route-safe finding cards", () => {
    const finding = mapDecisionReviewInsightForUser(
      {
        category: "exit",
        evidence: ["realizedCapturePercentOfTradeMfe=18.0%"],
        id: "profit_protection_failed",
        summary: "Open profit was not protected.",
        title: "Open profit was not protected",
        tone: "risk",
      },
      "/trades/[tradeId]",
    );

    expect(finding.canShowPrimary).toBe(true);
    expect(finding.canDrivePrimaryConclusion).toBe(true);
    expect(finding.label).toBe("Open profit was not protected");
    expect(finding.reviewAction).toContain("open profit");
    expect(finding.tone).toBe("danger");
  });

  it("translates protected-profit fade findings as strengths to repeat", () => {
    const finding = mapDecisionReviewInsightForUser(
      {
        category: "exit",
        evidence: [
          "realizedCapturePercentOfTradeMfe=74.0%",
          "postExitCandleCount=4",
        ],
        id: "protected_profit_before_fade",
        summary: "Protected profit before the fade.",
        title: "Protected profit before the fade",
        tone: "strength",
      },
      "/coach",
    );

    expect(finding.canShowPrimary).toBe(true);
    expect(finding.canDrivePrimaryConclusion).toBe(true);
    expect(finding.opportunityType).toBe("strength_to_repeat");
    expect(finding.label).toBe("Protected profit before the fade");
    expect(finding.reviewAction.toLowerCase()).toContain("exit cue");
    expect(`${finding.detail} ${finding.reviewAction}`.toLowerCase()).not.toContain(
      "top tick",
    );
  });

  it("translates balanced full-trade management without perfect-exit or signal claims", () => {
    const finding = mapDecisionReviewInsightForUser(
      {
        category: "management",
        evidence: [
          "addCountAfterInitialEntry=1",
          "totalPositionDecreaseCount=1",
          "postExitCandleCount=4",
        ],
        id: "balanced_management_with_constructive_exit",
        summary: "The full trade was managed constructively.",
        title: "Managed the full trade constructively",
        tone: "strength",
      },
      "/analytics",
    );
    const copy = `${finding.label} ${finding.detail} ${finding.reviewAction}`.toLowerCase();

    expect(finding.canShowPrimary).toBe(true);
    expect(finding.canDrivePrimaryConclusion).toBe(true);
    expect(finding.evidenceChannel).toBe("combined");
    expect(finding.opportunityType).toBe("strength_to_repeat");
    expect(finding.label).toBe("Managed the full trade constructively");
    expect(finding.reviewAction).toContain("management sequence");
    expect(copy).not.toContain("perfect");
    expect(copy).not.toContain("top tick");
    expect(copy).not.toContain("buy signal");
    expect(copy).not.toContain("sell signal");
  });

  it("translates constructive add-into-strength management without instruction or perfect-exit claims", () => {
    const finding = mapDecisionReviewInsightForUser(
      {
        category: "exit",
        evidence: [
          "addCountAfterInitialEntry=1",
          "averageAddPriceVsPreviousAverageEntryPct=4.0%",
          "postExitCandleCount=4",
        ],
        id: "add_into_strength_with_constructive_final_exit",
        summary: "The add and final exit were constructive.",
        title: "Added into strength and exited constructively",
        tone: "strength",
      },
      "/coach",
    );
    const copy = `${finding.label} ${finding.detail} ${finding.reviewAction}`.toLowerCase();

    expect(finding.canShowPrimary).toBe(true);
    expect(finding.canDrivePrimaryConclusion).toBe(true);
    expect(finding.evidenceChannel).toBe("combined");
    expect(finding.opportunityType).toBe("strength_to_repeat");
    expect(finding.label).toBe("Added into strength and exited constructively");
    expect(finding.reviewAction.toLowerCase()).toContain("confirmed strength");
    expect(copy).not.toContain("always correct");
    expect(copy).not.toContain("buy signal");
    expect(copy).not.toContain("perfect");
    expect(copy).not.toContain("top tick");
  });

  it("translates decision-review support notes without letting them drive conclusions", () => {
    const finding = mapDecisionReviewInsightForUser(
      {
        category: "trade_window",
        evidence: ["tradeMfePct=12.0%"],
        id: "trade_window_excursion_measured",
        summary: "The movement window was measured.",
        title: "Trade-window movement was measured",
        tone: "neutral",
      },
      "/analytics",
    );

    expect(finding.canShowPrimary).toBe(true);
    expect(finding.canDrivePrimaryConclusion).toBe(false);
    expect(finding.label).toBe("During-trade movement was measured");
    expect(finding.detail.toLowerCase()).not.toContain("trade-window");
    expect(finding.tone).toBe("warning");
  });

  it("hides unmapped decision-review insights from primary route cards", () => {
    const finding = mapDecisionReviewInsightForUser(
      {
        category: "market_context",
        evidence: ["tradeDirection=short"],
        id: "short_entry_near_daily_4h_support",
        summary: "Short-specific support note.",
        title: "Short entry was close to support",
        tone: "risk",
      },
      "/trades/[tradeId]",
    );

    expect(finding.canShowPrimary).toBe(false);
    expect(finding.canDrivePrimaryConclusion).toBe(false);
    expect(finding.state).toBe("internal_only");
    expect(finding.label).toBe("Review behavior in advanced details");
  });

  it("keeps rapid execution clusters as review prompts", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "rapid_fire_execution_cluster",
      rawLabel: "Rapid Fire Execution Cluster",
      route: "/coach",
    });

    expect(behavior.contractFound).toBe(true);
    expect(behavior.state).toBe("review_prompt");
    expect(behavior.canDrivePrimaryConclusion).toBe(false);
    expect(behavior.label).toBe("Review fast execution clusters");
    expect(visibleCopy(behavior).toLowerCase()).not.toContain("revenge");
  });

  it("fails closed for unknown route-visible behavior labels", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "dominant_internal_pattern_42",
      rawLabel: "Dominant Internal Pattern 42",
      route: "/coach",
    });

    expect(behavior.contractFound).toBe(false);
    expect(behavior.state).toBe("internal_only");
    expect(behavior.opportunityType).toBe("internal_only");
    expect(behavior.canDrivePrimaryConclusion).toBe(false);
    expect(behavior.label).toBe("Review behavior in advanced details");
    expect(visibleCopy(behavior)).not.toContain("Dominant Internal Pattern 42");
    expect(behavior.advancedHowDetected).toContain("dominant_internal_pattern_42");
  });

  it("blocks a known behavior from a route where it is not allowed", () => {
    const behavior = mapUserFacingBehavior({
      behaviorId: "all_or_nothing_exit_after_many_adds",
      rawLabel: "All-Or-Nothing Exit After Many Adds",
      route: "/progress",
    });

    expect(behavior.contractFound).toBe(false);
    expect(behavior.canDrivePrimaryConclusion).toBe(false);
    expect(behavior.label).toBe("Review behavior in advanced details");
  });
});
