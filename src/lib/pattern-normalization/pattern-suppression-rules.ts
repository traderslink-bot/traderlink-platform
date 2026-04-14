// =========================
// 2026-04-12 08:02 PM America/Toronto
// PATTERN SUPPRESSION RULES
// =========================
//
// PURPOSE:
// Central suppression and dominance definitions for Layer 3 pattern
// normalization.
//
// IMPORTANT:
// This file does NOT execute normalization by itself.
// It defines the rule data Layer 3 will use when deciding:
//
// 1. which overlapping patterns compete with each other
// 2. which richer patterns dominate broader patterns
// 3. which patterns should be demoted when stronger patterns are present
//
// CURRENT DESIGN:
// - same-family overlap handling first
// - simple deterministic dominance relationships
// - soft suppression only
//
// FUTURE EXPANSION MAY INCLUDE:
// - cross-family suppression groups
// - score-aware suppression
// - conditional suppression rules
// - dependency metadata between atomic and composite patterns
//

export type SuppressionOutcome =
  | "demote_to_supporting"
  | "demote_to_contextual";

export interface PatternDominanceRule {
  dominantPatternId: string;
  suppressedPatternId: string;
  outcome: SuppressionOutcome;
  reason: string;
}

export interface PatternSuppressionGroup {
  groupId: string;
  description: string;
  patternIds: string[];
}

function defineDominanceRule(
  rule: PatternDominanceRule,
): PatternDominanceRule {
  return rule;
}

function defineSuppressionGroup(
  group: PatternSuppressionGroup,
): PatternSuppressionGroup {
  return group;
}

// =========================
// SUPPRESSION GROUPS
// 2026-04-12 08:02 PM America/Toronto
// These groups identify known overlap zones that Layer 3 should consider
// during normalization.
// =========================

export const PATTERN_SUPPRESSION_GROUPS: PatternSuppressionGroup[] = [
  defineSuppressionGroup({
    groupId: "entry_low_location_overlap",
    description:
      "Low-side entry location overlap between broad and more specific entry patterns.",
      patternIds: [
        "low_range_entry",
        "entry_near_trade_low",
        "entry_near_support_structure",
        "entry_far_from_support_structure",
        "advantaged_entry_structure",
      ],
  }),

  defineSuppressionGroup({
    groupId: "entry_high_location_overlap",
    description:
      "High-side entry location overlap between broad and more specific entry patterns.",
      patternIds: [
        "high_range_entry",
        "entry_near_trade_high",
        "entry_under_resistance_structure",
        "breakout_with_room_above_structure",
        "breakout_into_overhead_resistance_structure",
        "breakout_with_room_above_and_constructive_final_exit",
        "breakout_with_room_above_and_failed_profit_protection",
        "breakout_into_overhead_resistance_with_defensive_final_exit",
        "breakout_into_overhead_resistance_with_failed_profit_protection",
        "disadvantaged_entry_structure",
      ],
  }),

  defineSuppressionGroup({
    groupId: "entry_quality_positive_overlap",
    description:
      "Positive entry-quality overlap between broad efficiency and richer advantaged structure.",
    patternIds: [
      "entry_with_favorable_remaining_upside",
      "efficient_entry_structure",
      "advantaged_entry_structure",
    ],
  }),

  defineSuppressionGroup({
    groupId: "entry_quality_negative_overlap",
    description:
      "Negative entry-quality overlap between limited-upside facts and richer disadvantaged structure.",
    patternIds: [
      "entry_with_limited_remaining_upside",
      "inefficient_entry_structure",
      "disadvantaged_entry_structure",
    ],
  }),

  defineSuppressionGroup({
    groupId: "entry_context_directional_overlap",
    description:
      "Directional pre-entry context overlaps with richer positive and negative entry-quality structures.",
    patternIds: [
      "entry_after_recent_run_up",
      "entry_after_recent_drop",
      "advantaged_entry_structure",
      "disadvantaged_entry_structure",
      "late_favorable_extension_entry_structure",
      "constructive_pullback_entry_structure",
      "disciplined_favorable_extension_entry_structure",
      "breakout_entry_structure",
      "measured_favorable_extension_entry_structure",
      "overextended_chase_entry_structure",
      "breakout_chase_entry_structure",
      "failed_breakout_entry_structure",
      "reclaim_entry_structure",
      "failed_reclaim_entry_structure",
      "mean_reversion_entry_structure",
      "failed_mean_reversion_entry_structure",
      "opening_range_breakout_entry_structure",
      "opening_range_breakout_chase_entry_structure",
      "failed_opening_range_breakout_entry_structure",
      "opening_range_reclaim_entry_structure",
      "failed_opening_range_reclaim_entry_structure",
      "market_open_breakout_entry_structure",
      "market_open_breakout_chase_entry_structure",
      "failed_market_open_breakout_entry_structure",
      "market_open_reclaim_entry_structure",
      "failed_market_open_reclaim_entry_structure",
      "weak_pullback_entry_structure",
      "deep_constructive_pullback_entry_structure",
      "deep_weak_pullback_entry_structure",
    ],
  }),

  defineSuppressionGroup({
    groupId: "position_build_vs_structure_overlap",
    description:
      "Overlap between raw position-building facts and richer lifecycle structure patterns.",
    patternIds: [
      "scaled_into_position",
      "single_build_position",
      "single_build_full_exit",
      "multi_build_full_exit",
      "multi_build_partial_exit",
      "scale_in_then_reduce",
      "one_and_done_round_trip",
    ],
  }),

  defineSuppressionGroup({
    groupId: "position_build_vs_scaling_quality_overlap",
    description:
      "Overlap between raw build facts and richer scaling-quality patterns.",
    patternIds: [
      "scaled_into_position",
      "single_build_position",
      "structured_position_building",
      "balanced_position_management",
      "one_sided_aggressive_building",
      "underutilized_position_building",
    ],
  }),

  defineSuppressionGroup({
    groupId: "scaling_quality_internal_overlap",
    description:
      "Internal overlap between broad and richer scaling-quality patterns.",
    patternIds: [
      "structured_position_building",
      "balanced_position_management",
      "one_sided_aggressive_building",
      "underutilized_position_building",
      "adding_above_prior_basis",
      "add_into_strength",
      "add_into_weakness",
      "add_after_recent_run_up",
      "add_after_recent_drop",
      "readd_after_reduction",
      "balanced_scaling_with_profit_protection",
      "constructive_readd_after_reduction",
      "balanced_management_with_constructive_exit",
      "recovery_with_balanced_management_and_constructive_final_exit",
      "balanced_management_with_missed_final_continuation",
      "recovery_with_balanced_management_and_missed_final_continuation",
      "timely_profit_protection_with_constructive_final_exit",
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
      "trim_readd_with_constructive_final_exit",
      "trim_readd_with_missed_final_continuation",
      "constructive_recovery_after_early_adversity",
      "recovery_after_early_adversity_with_failed_protection",
      "recovery_after_early_adversity_with_stabilized_management",
      "repeated_trim_readd_with_constructive_management",
      "repeated_trim_readd_with_unstable_management",
      "repeated_rescue_attempts_with_renewed_deterioration",
      "late_chase_reentry_after_constructive_trim",
      "good_pullback_reentry_after_constructive_trim",
      "constructive_reentry_followthrough_after_trim",
      "constructive_reentry_with_constructive_final_exit",
      "recovery_with_constructive_final_exit_after_constructive_reentry",
      "deteriorating_reentry_after_trim",
      "repeated_trim_readd_with_constructive_reentry_followthrough",
      "repeated_trim_readd_with_deteriorating_reentry",
      "repeated_balanced_management_with_missed_final_continuation",
      "repeated_balanced_management_with_constructive_final_exit",
      "repeated_constructive_reentry_with_premature_final_exit",
      "repeated_balanced_management_with_premature_final_exit",
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
      "repeated_constructive_reentry_with_constructive_final_exit",
      "repeated_deteriorating_reentry_with_defensive_final_exit",
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
      "repeated_trim_readd_with_constructive_final_exit",
      "repeated_trim_readd_with_fearful_final_exit",
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
      "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
      "repeated_trim_readd_with_premature_final_exit",
      "repeated_trim_readd_with_missed_final_continuation",
        "aggressive_adding_with_failed_profit_protection",
        "add_into_resistance_structure",
        "add_above_resistance_structure",
        "add_above_resistance_with_constructive_final_exit",
        "add_above_resistance_with_failed_profit_protection",
        "recovery_with_add_above_resistance_and_constructive_final_exit",
        "recovery_with_add_above_resistance_and_failed_profit_protection",
        "repeated_adds_above_resistance_with_constructive_final_exit",
        "repeated_adds_above_resistance_with_failed_profit_protection",
        "revenge_adding_after_weakness",
        "revenge_adding_with_failed_profit_protection",
        "readd_after_delayed_risk_response",
    ],
  }),

  defineSuppressionGroup({
    groupId: "reduction_management_overlap",
    description:
      "Overlap between broad reduction facts and richer reduction/profit-protection structures.",
    patternIds: [
      "scaled_out_of_position",
      "reduction_into_strength",
      "reduction_into_weakness",
      "profit_protection_present",
      "failed_profit_protection_structure",
      "reduction_after_recent_run_up",
      "reduction_after_recent_drop",
      "held_through_danger_after_peak_profit",
      "delayed_risk_response_after_peak_profit",
      "timely_risk_response_after_peak_profit",
      "timely_risk_response_with_profit_protection",
      "delayed_risk_response_with_failed_profit_protection",
    ],
  }),

  defineSuppressionGroup({
    groupId: "exit_capture_band_overlap",
    description:
      "Capture-band patterns represent alternative bands of the same exit capture concept.",
    patternIds: [
      "high_capture_exit_structure",
      "moderate_capture_exit_structure",
      "low_capture_exit_structure",
    ],
  }),
  defineSuppressionGroup({
    groupId: "exit_post_exit_outcome_overlap",
    description:
      "Overlap between broad exit descriptors and richer post-exit continuation or relief patterns.",
      patternIds: [
        "exit_with_limited_giveback",
        "exit_with_meaningful_giveback",
        "exit_into_support_structure",
        "exit_into_support_with_relief_after_exit",
        "exit_into_support_before_breakdown",
        "exit_into_stacked_support_with_relief_after_exit",
        "exit_into_thin_support_before_breakdown",
        "stabilized_recovery_with_exit_into_stacked_support_and_relief",
        "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
        "missed_post_exit_continuation",
        "exit_avoided_adverse_followthrough",
        "defensive_exit_after_deterioration",
      "premature_final_exit_after_constructive_management",
      "fearful_exit_after_weakening",
      "disciplined_defensive_exit",
      "stabilized_recovery_with_constructive_final_exit",
      "stabilized_recovery_with_premature_final_exit",
    ],
  }),
];

// =========================
// DOMINANCE RULES
// 2026-04-12 08:02 PM America/Toronto
// These are explicit richer-over-broader relationships for Layer 3 v1.
// They are intentionally simple and same-family focused.
// =========================

export const PATTERN_DOMINANCE_RULES: PatternDominanceRule[] = [
  // =========================
  // ENTRY LOCATION
  // =========================
  defineDominanceRule({
    dominantPatternId: "entry_near_trade_low",
    suppressedPatternId: "low_range_entry",
    outcome: "demote_to_contextual",
    reason:
      "Entry near trade low is a stricter and more specific version of low range entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "entry_near_trade_high",
    suppressedPatternId: "high_range_entry",
    outcome: "demote_to_contextual",
    reason:
      "Entry near trade high is a stricter and more specific version of high range entry.",
  }),

  // =========================
  // ENTRY QUALITY
  // =========================
  defineDominanceRule({
    dominantPatternId: "entry_near_support_structure",
    suppressedPatternId: "low_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Entry near support structure is a richer level-aware entry-location pattern than broad low-range entry alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "entry_under_resistance_structure",
    suppressedPatternId: "high_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Entry under resistance structure is a richer level-aware entry-location pattern than broad high-range entry alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "entry_far_from_support_structure",
    suppressedPatternId: "low_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Entry far from support structure is a richer distance-aware entry-location pattern than broad low-range entry alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_with_room_above_structure",
    suppressedPatternId: "breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout with room above structure is a richer breakout-entry storyline because it adds explicit structural clearance and room-above context.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_with_room_above_and_constructive_final_exit",
    suppressedPatternId: "breakout_with_room_above_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout with room above and constructive final exit is a richer whole-trade breakout storyline than the broad room-above breakout fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_with_room_above_and_constructive_final_exit",
    suppressedPatternId: "breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout with room above and constructive final exit is a richer whole-trade breakout storyline than the broad breakout-entry family.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_with_room_above_and_failed_profit_protection",
    suppressedPatternId: "breakout_with_room_above_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout with room above and failed profit protection is a richer whole-trade breakout storyline than the broad room-above breakout fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_with_room_above_and_failed_profit_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout with room above and failed profit protection is a richer breakout-specific failure storyline than broad failed profit protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_structure",
    suppressedPatternId: "breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance structure is a richer weak breakout-entry storyline because it adds explicit structural clearance directly into stacked overhead resistance.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_structure",
    suppressedPatternId: "entry_under_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance structure is a richer level-aware weak breakout pattern than broad entry-under-resistance alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_structure",
    suppressedPatternId: "failed_breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance structure is a richer weak breakout storyline because it adds explicit structural clearance directly into stacked overhead resistance.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_with_defensive_final_exit",
    suppressedPatternId: "breakout_into_overhead_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance with defensive final exit is a richer whole-trade weak breakout storyline than the broad overhead-resistance breakout fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_with_defensive_final_exit",
    suppressedPatternId: "disciplined_defensive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance with defensive final exit is a richer breakout-specific defensive-save storyline than broad disciplined defensive exit alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_with_failed_profit_protection",
    suppressedPatternId: "breakout_into_overhead_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance with failed profit protection is a richer whole-trade weak breakout storyline than the broad overhead-resistance breakout fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_into_overhead_resistance_with_failed_profit_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout into overhead resistance with failed profit protection is a richer breakout-specific failure storyline than broad failed profit protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "advantaged_entry_structure",
    suppressedPatternId: "efficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Advantaged entry structure includes richer entry-location context than efficient entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "disadvantaged_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Disadvantaged entry structure includes richer entry-location context than inefficient entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "advantaged_entry_structure",
    suppressedPatternId: "entry_near_trade_low",
    outcome: "demote_to_supporting",
    reason:
      "Advantaged entry structure is a higher-order entry pattern that subsumes low-side location context.",
  }),
  defineDominanceRule({
    dominantPatternId: "advantaged_entry_structure",
    suppressedPatternId: "entry_with_favorable_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Advantaged entry structure includes favorable remaining upside plus additional structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "disadvantaged_entry_structure",
    suppressedPatternId: "entry_near_trade_high",
    outcome: "demote_to_supporting",
    reason:
      "Disadvantaged entry structure is a higher-order entry pattern that subsumes high-side location context.",
  }),
  defineDominanceRule({
    dominantPatternId: "disadvantaged_entry_structure",
    suppressedPatternId: "entry_with_limited_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Disadvantaged entry structure includes limited remaining upside plus additional structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "advantaged_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Advantaged entry structure already carries the stronger directional entry context and broader entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "disadvantaged_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Disadvantaged entry structure already carries the stronger directional entry context and broader entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "disadvantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure is a richer late-entry storyline than broad disadvantaged entry structure because it adds direction-aware pre-entry extension context.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure is a richer inefficient-entry storyline because it adds direction-aware favorable-extension context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure includes the favorable-extension context plus richer late-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure includes the direction-aware favorable-extension context plus richer late-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "entry_with_limited_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure includes limited remaining opportunity plus richer direction-aware late-entry context.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_favorable_extension_entry_structure",
    suppressedPatternId: "high_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Late favorable extension entry structure includes high-side entry location plus richer direction-aware late-entry context.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "advantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure is a richer constructive-entry storyline than broad advantaged entry structure because it adds direction-aware pullback context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "efficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure is a richer efficient-entry storyline because it adds direction-aware pullback context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure includes the pullback context plus richer constructive entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure includes the direction-aware pullback context plus richer constructive entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "entry_with_favorable_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure includes favorable remaining opportunity plus richer direction-aware pullback context.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_pullback_entry_structure",
    suppressedPatternId: "low_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Constructive pullback entry structure includes low-side entry location plus richer direction-aware pullback context.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_favorable_extension_entry_structure",
    suppressedPatternId: "advantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined favorable extension entry structure is a richer constructive continuation-entry storyline than broad advantaged entry structure because it adds direction-aware favorable-extension context.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_favorable_extension_entry_structure",
    suppressedPatternId: "efficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined favorable extension entry structure is a richer efficient-entry storyline because it adds direction-aware favorable-extension context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined favorable extension entry structure includes the favorable-extension context plus richer constructive continuation-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined favorable extension entry structure includes the direction-aware favorable-extension context plus richer constructive continuation-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_favorable_extension_entry_structure",
    suppressedPatternId: "entry_with_favorable_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined favorable extension entry structure includes favorable remaining opportunity plus richer direction-aware continuation context.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_entry_structure",
    suppressedPatternId: "measured_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout entry structure is a richer named continuation-entry storyline than the broad measured favorable extension subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_entry_structure",
    suppressedPatternId: "disciplined_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout entry structure is a richer named continuation-entry storyline than the broad disciplined favorable extension subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "measured_favorable_extension_entry_structure",
    suppressedPatternId: "disciplined_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Measured favorable extension entry structure is a richer constructive continuation storyline because it adds a tighter measured-extension constraint above the broad disciplined favorable extension subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "measured_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Measured favorable extension entry structure includes the favorable-extension context plus richer measured continuation-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "measured_favorable_extension_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Measured favorable extension entry structure includes the direction-aware favorable-extension context plus richer measured continuation-entry quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_chase_entry_structure",
    suppressedPatternId: "overextended_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout chase entry structure is a richer named chase-entry storyline than the broad overextended chase subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "breakout_chase_entry_structure",
    suppressedPatternId: "late_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Breakout chase entry structure is a richer named chase-entry storyline than the broad late favorable extension subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "overextended_chase_entry_structure",
    suppressedPatternId: "late_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Overextended chase entry structure is a richer chase-style entry storyline because it adds a more stretched pre-entry extension and more extreme late-entry position than the broad late favorable extension subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "overextended_chase_entry_structure",
    suppressedPatternId: "high_range_entry",
    outcome: "demote_to_supporting",
    reason:
      "Overextended chase entry structure includes very high-side entry location plus richer chase-style extension context.",
  }),
  defineDominanceRule({
    dominantPatternId: "overextended_chase_entry_structure",
    suppressedPatternId: "entry_with_limited_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Overextended chase entry structure includes limited remaining opportunity plus richer stretched-extension context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_breakout_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed breakout entry structure is a richer weak breakout-attempt storyline than broad inefficient entry structure because it adds measured breakout context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_breakout_entry_structure",
    suppressedPatternId: "disadvantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed breakout entry structure is a richer weak breakout-attempt storyline than broad disadvantaged entry structure because it adds measured breakout context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_breakout_entry_structure",
    suppressedPatternId: "measured_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed breakout entry structure is a richer named failed-breakout storyline because it adds the weak post-entry outcome to the measured breakout-attempt context.",
  }),
  defineDominanceRule({
    dominantPatternId: "reclaim_entry_structure",
    suppressedPatternId: "constructive_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Reclaim entry structure is a richer named recovery-entry storyline than the broad constructive pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "reclaim_entry_structure",
    suppressedPatternId: "deep_constructive_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Reclaim entry structure is a richer named recovery-entry storyline than the deep constructive pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "reclaim_entry_structure",
    suppressedPatternId: "advantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Reclaim entry structure is a richer constructive entry storyline than broad advantaged entry structure because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "reclaim_entry_structure",
    suppressedPatternId: "efficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Reclaim entry structure is a richer efficient-entry storyline because it adds explicit recent reference reclaim context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "reclaim_entry_structure",
    suppressedPatternId: "entry_with_favorable_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Reclaim entry structure includes favorable remaining opportunity plus richer recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_reclaim_entry_structure",
    suppressedPatternId: "weak_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed reclaim entry structure is a richer weak recovery-entry storyline than the broad weak pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_reclaim_entry_structure",
    suppressedPatternId: "deep_weak_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed reclaim entry structure is a richer weak recovery-entry storyline than the deep weak pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_reclaim_entry_structure",
    suppressedPatternId: "disadvantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed reclaim entry structure is a richer weak entry storyline than broad disadvantaged entry structure because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_reclaim_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed reclaim entry structure is a richer inefficient-entry storyline because it adds explicit recent reference reclaim context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_reclaim_entry_structure",
    suppressedPatternId: "entry_with_limited_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Failed reclaim entry structure includes limited remaining opportunity plus richer recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "mean_reversion_entry_structure",
    suppressedPatternId: "reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Mean reversion entry structure is a richer reclaim-entry storyline because it adds a deeper countertrend move before the recent reference reclaim.",
  }),
  defineDominanceRule({
    dominantPatternId: "mean_reversion_entry_structure",
    suppressedPatternId: "deep_constructive_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Mean reversion entry structure is a richer constructive reversal-entry storyline because it adds explicit recent reference reclaim context to the deeper pullback setup.",
  }),
  defineDominanceRule({
    dominantPatternId: "mean_reversion_entry_structure",
    suppressedPatternId: "constructive_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Mean reversion entry structure is a richer constructive reversal-entry storyline than the broad constructive pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_mean_reversion_entry_structure",
    suppressedPatternId: "failed_reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed mean reversion entry structure is a richer failed reversal-entry storyline because it adds a deeper countertrend move before the recent reference reclaim.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_mean_reversion_entry_structure",
    suppressedPatternId: "deep_weak_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed mean reversion entry structure is a richer weak reversal-entry storyline because it adds explicit recent reference reclaim context to the deeper pullback setup.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_mean_reversion_entry_structure",
    suppressedPatternId: "weak_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed mean reversion entry structure is a richer weak reversal-entry storyline than the broad weak pullback subtype because it adds explicit recent reference reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_entry_structure",
    suppressedPatternId: "market_open_breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout entry structure is a richer breakout-entry storyline because it uses a true opening-range window instead of the broader market-open pre-entry range.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_entry_structure",
    suppressedPatternId: "breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout entry structure is a richer breakout-entry storyline because it adds explicit opening-range context above the generic breakout family.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_entry_structure",
    suppressedPatternId: "measured_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout entry structure is a richer measured continuation-entry storyline because it adds explicit opening-range context above the broader continuation subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_chase_entry_structure",
    suppressedPatternId: "market_open_breakout_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout chase entry structure is a richer chase-entry storyline because it uses a true opening-range window instead of the broader market-open pre-entry range.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_chase_entry_structure",
    suppressedPatternId: "breakout_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout chase entry structure is a richer breakout-chase storyline because it adds explicit opening-range context above the generic breakout-chase family.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_breakout_chase_entry_structure",
    suppressedPatternId: "overextended_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range breakout chase entry structure is a richer chase-entry storyline because it adds explicit opening-range context above the broad overextended chase subtype.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_breakout_entry_structure",
    suppressedPatternId: "failed_market_open_breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range breakout entry structure is a richer failed-breakout storyline because it uses a true opening-range window instead of the broader market-open pre-entry range.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_breakout_entry_structure",
    suppressedPatternId: "failed_breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range breakout entry structure is a richer failed-breakout storyline because it adds explicit opening-range context above the generic breakout family.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_breakout_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range breakout entry structure is a richer weak entry storyline because it adds explicit opening-range context above broad inefficient entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_reclaim_entry_structure",
    suppressedPatternId: "market_open_reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range reclaim entry structure is a richer reclaim-entry storyline because it uses the opening-range boundary itself as the reclaimed reference instead of the broader market-open reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_reclaim_entry_structure",
    suppressedPatternId: "reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range reclaim entry structure is a richer reclaim-entry storyline because it adds explicit opening-range context above the generic reclaim family.",
  }),
  defineDominanceRule({
    dominantPatternId: "opening_range_reclaim_entry_structure",
    suppressedPatternId: "advantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Opening range reclaim entry structure is a richer constructive entry storyline because it adds explicit opening-range reclaim context above broad advantaged entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_reclaim_entry_structure",
    suppressedPatternId: "failed_market_open_reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range reclaim entry structure is a richer failed reclaim storyline because it uses the opening-range boundary itself as the reclaimed reference instead of the broader market-open reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_reclaim_entry_structure",
    suppressedPatternId: "failed_reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range reclaim entry structure is a richer failed reclaim storyline because it adds explicit opening-range context above the generic reclaim family.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_opening_range_reclaim_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed opening range reclaim entry structure is a richer weak entry storyline because it adds explicit opening-range reclaim context above broad inefficient entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_breakout_entry_structure",
    suppressedPatternId: "breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open breakout entry structure is a richer breakout-entry storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_breakout_entry_structure",
    suppressedPatternId: "measured_favorable_extension_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open breakout entry structure is a richer measured continuation-entry storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_breakout_chase_entry_structure",
    suppressedPatternId: "breakout_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open breakout chase entry structure is a richer breakout-chase storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_breakout_chase_entry_structure",
    suppressedPatternId: "overextended_chase_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open breakout chase entry structure is a richer chase-entry storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_market_open_breakout_entry_structure",
    suppressedPatternId: "failed_breakout_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed market open breakout entry structure is a richer failed-breakout storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_market_open_breakout_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed market open breakout entry structure is a richer weak entry storyline because it adds explicit market-open opening-range context.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_reclaim_entry_structure",
    suppressedPatternId: "reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open reclaim entry structure is a richer reclaim-entry storyline because it adds explicit market-open session context.",
  }),
  defineDominanceRule({
    dominantPatternId: "market_open_reclaim_entry_structure",
    suppressedPatternId: "advantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Market open reclaim entry structure is a richer constructive entry storyline because it adds explicit market-open reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_market_open_reclaim_entry_structure",
    suppressedPatternId: "failed_reclaim_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed market open reclaim entry structure is a richer failed reclaim storyline because it adds explicit market-open session context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_market_open_reclaim_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed market open reclaim entry structure is a richer weak entry storyline because it adds explicit market-open reclaim context.",
  }),
  defineDominanceRule({
    dominantPatternId: "weak_pullback_entry_structure",
    suppressedPatternId: "disadvantaged_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Weak pullback entry structure is a richer weak-entry storyline than broad disadvantaged entry structure because it adds direction-aware pullback context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "weak_pullback_entry_structure",
    suppressedPatternId: "inefficient_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Weak pullback entry structure is a richer inefficient-entry storyline because it adds direction-aware pullback context before entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "weak_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Weak pullback entry structure includes the pullback context plus richer weak entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "weak_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Weak pullback entry structure includes the direction-aware pullback context plus richer weak entry-quality structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "weak_pullback_entry_structure",
    suppressedPatternId: "entry_with_limited_remaining_upside",
    outcome: "demote_to_supporting",
    reason:
      "Weak pullback entry structure includes limited remaining opportunity plus richer direction-aware pullback context.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_constructive_pullback_entry_structure",
    suppressedPatternId: "constructive_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Deep constructive pullback entry structure is a richer constructive pullback storyline because it adds a larger countertrend pullback before the already strong eventual entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_constructive_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Deep constructive pullback entry structure includes the pullback context plus richer deep-pullback constructive-entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_constructive_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Deep constructive pullback entry structure includes the direction-aware pullback context plus richer deep-pullback constructive-entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_weak_pullback_entry_structure",
    suppressedPatternId: "weak_pullback_entry_structure",
    outcome: "demote_to_supporting",
    reason:
      "Deep weak pullback entry structure is a richer weak pullback storyline because it adds a larger countertrend pullback before the already weak eventual entry.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_weak_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Deep weak pullback entry structure includes the pullback context plus richer deep-pullback weak-entry structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "deep_weak_pullback_entry_structure",
    suppressedPatternId: "entry_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Deep weak pullback entry structure includes the direction-aware pullback context plus richer deep-pullback weak-entry structure.",
  }),

  // =========================
  // POSITION STRUCTURE
  // =========================
  defineDominanceRule({
    dominantPatternId: "multi_build_full_exit",
    suppressedPatternId: "scaled_into_position",
    outcome: "demote_to_contextual",
    reason:
      "Multi build full exit is a richer lifecycle pattern than the raw build fact scaled into position.",
  }),
  defineDominanceRule({
    dominantPatternId: "multi_build_partial_exit",
    suppressedPatternId: "scaled_into_position",
    outcome: "demote_to_contextual",
    reason:
      "Multi build partial exit is a richer lifecycle pattern than the raw build fact scaled into position.",
  }),
  defineDominanceRule({
    dominantPatternId: "single_build_full_exit",
    suppressedPatternId: "single_build_position",
    outcome: "demote_to_contextual",
    reason:
      "Single build full exit is a richer lifecycle pattern than the raw single-build fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "scale_in_then_reduce",
    suppressedPatternId: "scaled_into_position",
    outcome: "demote_to_contextual",
    reason:
      "Scale in then reduce is a richer lifecycle pattern than the raw build fact scaled into position.",
  }),
  defineDominanceRule({
    dominantPatternId: "scale_in_then_reduce",
    suppressedPatternId: "scaled_out_of_position",
    outcome: "demote_to_contextual",
    reason:
      "Scale in then reduce is a richer lifecycle pattern than the raw reduction fact scaled out of position.",
  }),
  defineDominanceRule({
    dominantPatternId: "one_and_done_round_trip",
    suppressedPatternId: "single_build_position",
    outcome: "demote_to_contextual",
    reason:
      "One and done round trip is a richer lifecycle pattern than the raw single-build fact.",
  }),

  // =========================
  // SCALING QUALITY
  // =========================
  defineDominanceRule({
    dominantPatternId: "structured_position_building",
    suppressedPatternId: "scaled_into_position",
    outcome: "demote_to_contextual",
    reason:
      "Structured position building is a richer middle-trade sizing pattern than the raw build fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_position_management",
    suppressedPatternId: "structured_position_building",
    outcome: "demote_to_supporting",
    reason:
      "Balanced position management is richer than structured position building because it includes reduction behavior.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_position_management",
    suppressedPatternId: "scaled_into_position",
    outcome: "demote_to_contextual",
    reason:
      "Balanced position management is a richer middle-trade pattern than the raw build fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_scaling_with_profit_protection",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced scaling with profit protection is a richer management pattern than broad balanced position management.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_scaling_with_profit_protection",
    suppressedPatternId: "profit_protection_present",
    outcome: "demote_to_supporting",
    reason:
      "Balanced scaling with profit protection includes the constructive profit-protection element plus add/reduction structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_constructive_final_exit",
    suppressedPatternId: "add_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with constructive final exit is a richer whole-trade storyline than broad add into strength alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_constructive_final_exit",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with constructive final exit is a richer constructive storyline than broad balanced constructive management alone because it adds explicit pressing-winners context.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_constructive_final_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with constructive final exit includes the constructive final-exit outcome plus explicit pressing-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_premature_final_exit",
    suppressedPatternId: "add_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with premature final exit is a richer whole-trade storyline than broad add into strength alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds explicit pressing-winners context.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    suppressedPatternId: "add_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the constructive add-into-strength sequence.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and constructive final exit is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and constructive final exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and constructive final exit is a richer recovery-aware storyline than recovery with balanced management and constructive final exit because it adds explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_premature_final_exit",
    suppressedPatternId: "add_into_strength_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and premature final exit is a richer storyline because it adds the early-adversity recovery path to the pressing-and-premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_premature_final_exit",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and premature final exit is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and premature final exit is a richer storyline than broad premature final exit after constructive management because it adds both the recovery path and the explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_premature_final_exit",
    suppressedPatternId: "add_into_strength_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with premature final exit is a richer whole-trade storyline than the broader add-into-strength missed-continuation branch because it adds the explicit premature-final-exit interpretation on top of the missed continuation outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_premature_final_exit",
    suppressedPatternId: "recovery_with_add_into_strength_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and premature final exit is a richer recovery-aware storyline than the broader recovery-aware pressing missed-continuation branch because it adds the explicit premature-final-exit interpretation.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "add_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with timely profit protection and constructive final exit is a richer whole-trade storyline because it adds explicit timely protection to the constructive pressing path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "timely_profit_protection_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with timely profit protection and constructive final exit is a richer whole-trade storyline because it adds explicit pressing-into-strength context to the timely protection and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and timely profit protection and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the timely constructive pressing sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and timely profit protection and constructive final exit is a richer recovery-aware storyline because it adds explicit timely protection to the constructive pressing path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and timely profit protection and constructive final exit is a richer recovery-aware storyline because it adds explicit pressing-into-strength context to the recovery-aware timely protection and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_missed_final_continuation",
    suppressedPatternId: "add_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with missed final continuation is a richer storyline than broad add into strength alone because it adds the missed-opportunity final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_missed_final_continuation",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with missed final continuation includes the missed post-exit continuation outcome plus explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_missed_final_continuation",
    suppressedPatternId: "add_into_strength_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and missed final continuation is a richer storyline because it adds the early-adversity recovery path to the pressing-and-missed-continuation outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_missed_final_continuation",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and missed final continuation is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_readd_after_reduction",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-add after reduction is a richer sequence pattern than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_readd_after_reduction",
    suppressedPatternId: "add_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-add after reduction includes strong add-context plus the re-add sequence and retained profit protection.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_constructive_exit",
    suppressedPatternId: "balanced_scaling_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with constructive exit is a richer storyline pattern than balanced scaling with profit protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_constructive_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with constructive exit includes the constructive final-exit outcome plus broader active-management structure.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the broad balanced-management constructive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and constructive final exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds balanced management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and constructive final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the constructive final-exit outcome to the balanced-management path.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_missed_final_continuation",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with missed final continuation is a richer whole-trade storyline than the broad missed-post-exit continuation pattern because it adds active management structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_missed_final_continuation",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with missed final continuation is a richer storyline than broad balanced position management because it adds the missed-continuation final outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_fearful_final_exit",
    suppressedPatternId: "fearful_exit_after_weakening",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with fearful final exit is a richer whole-trade storyline than broad fearful exit after weakening because it adds active management structure before the fearful exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_fearful_final_exit",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with fearful final exit is a richer storyline than broad balanced position management because it adds the later fearful-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_fearful_final_exit",
    suppressedPatternId: "balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with fearful final exit is a stricter missed-continuation storyline because it specifies a weak fearful exit before the later rebound.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId: "balanced_management_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and fearful final exit is a richer storyline because it adds the early-adversity recovery path to the balanced-management fearful-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and fearful final exit is a stricter recovery-aware missed-continuation storyline because it adds the weak fearful-exit detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and fearful final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the fearful final-exit outcome to the balanced-management path.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_premature_final_exit",
    suppressedPatternId: "balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with premature final exit is a stricter missed-continuation storyline because it also requires retained profit and limited giveback into the exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId: "balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and missed final continuation is a richer storyline because it adds the early-adversity recovery path to the broad balanced-management missed-continuation sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and missed final continuation is a richer storyline than broad recovery after early adversity with stabilized management because it adds the missed-continuation final outcome to the balanced-management path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and premature final exit is a stricter missed-continuation storyline because it also requires retained profit and limited giveback into the exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds balanced scaling and reduction structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_premature_final_exit",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with premature final exit is a richer storyline than broad balanced position management because it adds the final early-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    suppressedPatternId: "balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and premature final exit is a richer storyline because it adds the early-adversity recovery path to the balanced-management premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    suppressedPatternId: "stabilized_recovery_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and premature final exit is a richer recovery-aware storyline than the broad stabilized-recovery premature-final-exit pattern because it adds balanced management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and premature final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the final premature-exit outcome to the balanced-management path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit after breakdown is a richer whole-trade storyline than the broad stop-like breakdown exit because it adds active management structure before the later forced exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit after breakdown is a richer storyline than broad balanced position management because it adds the later stop-like breakdown-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit before rebound is a richer whole-trade storyline than the broad stop-like rebound exit because it adds active management structure before the later forced exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit before rebound is a richer storyline than broad balanced position management because it adds the later stop-like rebound-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "balanced_management_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit after breakdown is a richer storyline because it adds the early-adversity recovery path to the balanced-management stop-like breakdown sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit after breakdown is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone because it adds balanced management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "balanced_management_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit before rebound is a richer storyline because it adds the early-adversity recovery path to the balanced-management stop-like rebound sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit before rebound is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone because it adds balanced management context.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_constructive_final_exit",
    suppressedPatternId: "timely_risk_response_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with constructive final exit is a richer whole-trade storyline because it adds the constructive final-exit outcome to the timely protection path.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_constructive_final_exit",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with constructive final exit is a richer whole-trade storyline than broad balanced management with constructive exit because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_constructive_final_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with constructive final exit includes the constructive final-exit outcome plus the timely profit-protection path.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_premature_final_exit",
    suppressedPatternId: "timely_risk_response_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with premature final exit is a richer whole-trade storyline because it adds the premature final-exit outcome to the timely protection path.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_profit_protection_with_premature_final_exit",
    suppressedPatternId: "balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Timely profit protection with premature final exit is a richer whole-trade storyline than broad balanced management with premature final exit because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "timely_risk_response_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with defensive final exit after deterioration is a richer whole-trade storyline because it adds the later defensive final-exit outcome to the timely danger-window response path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "defensive_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with defensive final exit after deterioration is a richer whole-trade storyline than broad defensive exit after deterioration because it adds explicit timely danger-window response after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "partial_exit_with_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with defensive final exit after deterioration is a richer whole-trade storyline than broad partial exit with adverse followthrough because it includes the later defensive final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with defensive final exit after deterioration is a richer whole-trade storyline than broad balanced management with defensive final exit after deterioration because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit after breakdown is a stricter whole-trade storyline than timely risk response with defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit before rebound is a stricter whole-trade storyline than timely risk response with defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength_with_premature_final_exit",
    suppressedPatternId: "balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength with premature final exit is a richer whole-trade storyline than broad balanced management with premature final exit because it adds explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "timely_risk_response_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit after breakdown is a richer whole-trade storyline because it adds the later breakdown-driven stop-like exit outcome to the timely danger-window response path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit after breakdown is a richer whole-trade storyline than the broad stop-like breakdown exit because it adds the earlier timely danger-window response path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "balanced_management_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit after breakdown is a richer whole-trade storyline than broad balanced management with stop-like forced exit after breakdown because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "timely_risk_response_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit before rebound is a richer whole-trade storyline because it adds the later stop-like weak-side exit before rebound to the timely danger-window response path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit before rebound is a richer whole-trade storyline than the broad stop-like rebound exit because it adds the earlier timely danger-window response path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "balanced_management_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit before rebound is a richer whole-trade storyline than broad balanced management with stop-like forced exit before rebound because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "balanced_position_management",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with defensive final exit after deterioration is a richer whole-trade storyline than broad balanced position management because it adds the later defensive-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "defensive_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with defensive final exit after deterioration is a richer whole-trade storyline than broad defensive exit after deterioration because it adds balanced management context before the later defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "partial_exit_with_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with defensive final exit after deterioration is a richer whole-trade storyline than broad partial exit with adverse followthrough because it includes the later defensive final exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit after breakdown is a stricter whole-trade storyline than balanced management with defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "balanced_management_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit before rebound is a stricter whole-trade storyline than balanced management with fearful final exit because it distinguishes a stop-like weak-side exit from a broader fearful one.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "recovery_with_balanced_management_and_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit before rebound is a stricter recovery-aware storyline than recovery with balanced management and fearful final exit because it distinguishes a stop-like weak-side exit from a broader fearful one.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "balanced_management_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with stop-like forced exit before rebound is a richer whole-trade storyline than broad balanced management with fearful final exit because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Balanced management with stop-like forced exit before rebound is a stricter whole-trade storyline than balanced management with defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_constructive_final_exit",
    suppressedPatternId: "constructive_readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with constructive final exit is a richer storyline pattern than constructive re-add after reduction alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_constructive_final_exit",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with constructive final exit includes the balanced constructive-management storyline plus explicit trim and re-add sequence detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_constructive_final_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with constructive final exit includes the constructive final-exit outcome plus richer sequence-level trade management structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_missed_final_continuation",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with missed final continuation is a richer storyline pattern than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_missed_final_continuation",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with missed final continuation includes the missed post-exit continuation outcome plus richer trim and re-add sequence structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_recovery_after_early_adversity",
    suppressedPatternId: "timely_risk_response_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Constructive recovery after early adversity is a richer full-trade storyline than constructive danger-window response alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_recovery_after_early_adversity",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Constructive recovery after early adversity is a richer full-trade storyline than broad balanced constructive management alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_after_early_adversity_with_failed_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Recovery after early adversity with failed protection is a richer full-trade storyline than broad failed profit protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_after_early_adversity_with_failed_protection",
    suppressedPatternId: "peak_profit_giveback_structure",
    outcome: "demote_to_supporting",
    reason:
      "Recovery after early adversity with failed protection includes the recovery path plus the later giveback failure.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_after_early_adversity_with_stabilized_management",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery after early adversity with stabilized management is a richer constructive rescue storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_after_early_adversity_with_stabilized_management",
    suppressedPatternId: "timely_risk_response_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery after early adversity with stabilized management includes the timely protective response plus the fuller recovery storyline.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_constructive_final_exit",
    suppressedPatternId: "balanced_management_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with constructive final exit is a richer constructive storyline than broad balanced constructive management alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_constructive_final_exit",
    suppressedPatternId: "reduction_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with constructive final exit includes the directional trim context plus the fuller constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_constructive_final_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with constructive final exit includes the constructive post-exit outcome plus the stronger trim-into-strength management path.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_premature_final_exit",
    suppressedPatternId: "reduction_into_strength",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with premature final exit includes the directional trim context plus the later premature final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds explicit trim-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_into_strength_with_premature_final_exit",
    suppressedPatternId: "balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim into strength with premature final exit is a richer whole-trade storyline than broad balanced management with premature final exit because it adds explicit trim-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "timely_profit_protection_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the timely protection and constructive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and constructive final exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and constructive final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the final constructive-exit outcome to the timely protection path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and constructive final exit is a richer recovery-aware storyline than recovery with balanced management and constructive final exit because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_premature_final_exit",
    suppressedPatternId: "timely_profit_protection_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and premature final exit is a richer storyline because it adds the early-adversity recovery path to the timely protection and premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_premature_final_exit",
    suppressedPatternId: "stabilized_recovery_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and premature final exit is a richer recovery-aware storyline than the broad stabilized-recovery premature-final-exit pattern because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_premature_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and premature final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the final premature-exit outcome to the timely protection path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_profit_protection_and_premature_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely profit protection and premature final exit is a richer recovery-aware storyline than recovery with balanced management and premature final exit because it adds explicit timely protection after peak open profit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "timely_risk_response_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and defensive final exit after deterioration is a richer storyline because it adds the early-adversity recovery path to the timely-response and defensive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and defensive final exit after deterioration is a richer recovery-failure storyline because it adds both the timely-response path and the later defensive exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    suppressedPatternId: "stabilized_recovery_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and defensive final exit after deterioration is a richer recovery-aware storyline than the broad stabilized-recovery premature-exit pattern because it adds explicit timely response and a later defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and defensive final exit after deterioration is a richer recovery-aware storyline than recovery with balanced management and defensive final exit after deterioration because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit after breakdown is a stricter recovery-aware storyline than recovery with timely risk response and defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "recovery_with_timely_risk_response_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit before rebound is a stricter recovery-aware storyline than recovery with timely risk response and defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_with_add_into_strength_and_premature_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add into strength and premature final exit is a richer recovery-aware storyline than recovery with balanced management and premature final exit because it adds explicit pressing-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "timely_risk_response_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit after breakdown is a richer storyline because it adds the early-adversity recovery path to the timely-response stop-like breakdown sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit after breakdown is a richer recovery-aware storyline than the broad stabilized-recovery stop-like breakdown pattern because it adds explicit timely danger-window response before the later breakdown exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit after breakdown is a richer recovery-failure storyline because it adds both the timely danger-window response path and the later stop-like breakdown exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit after breakdown is a richer recovery-aware storyline than recovery with balanced management and stop-like forced exit after breakdown because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "timely_risk_response_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit before rebound is a richer storyline because it adds the early-adversity recovery path to the timely-response stop-like rebound sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit before rebound is a richer recovery-aware storyline than the broad stabilized-recovery stop-like rebound pattern because it adds explicit timely danger-window response before the later stop-like exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit before rebound is a richer recovery-failure storyline because it adds both the timely danger-window response path and the later stop-like weak-side exit before rebound.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_risk_response_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely risk response and stop-like forced exit before rebound is a richer recovery-aware storyline than recovery with balanced management and stop-like forced exit before rebound because it adds explicit danger-window timing detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and defensive final exit after deterioration is a richer storyline because it adds the early-adversity recovery path to the balanced-management defensive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and defensive final exit after deterioration is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone because it adds balanced management context and the later defensive final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit after breakdown is a stricter recovery-aware storyline than recovery with balanced management and defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "recovery_with_balanced_management_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with balanced management and stop-like forced exit before rebound is a stricter recovery-aware storyline than recovery with balanced management and defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId: "trim_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the constructive trim-and-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and constructive final exit is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and constructive final exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds explicit trim-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and constructive final exit is a richer recovery-aware storyline than recovery with balanced management and constructive final exit because it adds explicit trim-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_premature_final_exit",
    suppressedPatternId: "trim_into_strength_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and premature final exit is a richer storyline because it adds the early-adversity recovery path to the trim-into-strength premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_premature_final_exit",
    suppressedPatternId: "stabilized_recovery_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and premature final exit is a richer recovery-aware storyline than the broad stabilized-recovery premature-final-exit pattern because it adds explicit trim-into-strength management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_premature_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and premature final exit is a richer storyline than broad recovery after early adversity with stabilized management because it adds the final premature-exit outcome to the trim-into-strength path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_trim_into_strength_and_premature_final_exit",
    suppressedPatternId:
      "recovery_with_balanced_management_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with trim into strength and premature final exit is a richer recovery-aware storyline than recovery with balanced management and premature final exit because it adds explicit trim-into-strength context.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_trim_into_strength_with_constructive_final_exit",
    suppressedPatternId: "trim_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Timely trim into strength with constructive final exit is a richer whole-trade storyline because it adds explicit timely risk-response timing to the trim-into-strength constructive path.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_trim_into_strength_with_constructive_final_exit",
    suppressedPatternId: "timely_profit_protection_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Timely trim into strength with constructive final exit is a richer whole-trade storyline because it adds explicit trim-into-strength context to the timely protective response and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId: "timely_trim_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely trim into strength and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the timely trim-into-strength constructive sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_trim_into_strength_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely trim into strength and constructive final exit is a richer storyline because it adds explicit timely risk-response timing to the recovery-aware trim-into-strength constructive path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_timely_trim_into_strength_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with timely trim into strength and constructive final exit is a richer storyline because it adds explicit trim-into-strength context to the recovery-aware timely protection and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_constructive_management",
    suppressedPatternId: "trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive management is a richer multi-cycle storyline than the one-cycle constructive trim/re-add exit pattern.",
  }),
  defineDominanceRule({
    dominantPatternId: "trim_readd_with_constructive_final_exit",
    suppressedPatternId: "trim_into_strength_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Trim re-add with constructive final exit is a richer one-cycle storyline than broad trim into strength with constructive final exit because it includes the later re-entry sequence.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_constructive_management",
    suppressedPatternId: "constructive_readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive management is a richer repeated-cycle storyline than broad constructive re-add after reduction.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_unstable_management",
    suppressedPatternId: "trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with unstable management is a richer multi-cycle storyline than the one-cycle missed-final-continuation variant.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_unstable_management",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with unstable management is a richer repeated-cycle storyline than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_rescue_attempts_with_renewed_deterioration",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with renewed deterioration is a richer repeated-cycle failure storyline because it includes the earlier recovery attempt before the trade deteriorated again.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_rescue_attempts_with_renewed_deterioration",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with renewed deterioration is a richer rescue-failure storyline than broad recovery after early adversity with failed protection.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_rescue_attempts_with_renewed_deterioration",
    suppressedPatternId: "readd_after_delayed_risk_response",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with renewed deterioration includes delayed rescue behavior plus the repeated-cycle deterioration outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_chase_reentry_after_constructive_trim",
    suppressedPatternId: "add_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Late chase re-entry after constructive trim is a richer re-entry storyline than the broad add-after-recent-run-up fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "late_chase_reentry_after_constructive_trim",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Late chase re-entry after constructive trim is a richer re-entry storyline than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "good_pullback_reentry_after_constructive_trim",
    suppressedPatternId: "add_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Good pullback re-entry after constructive trim is a richer re-entry storyline than the broad add-after-recent-drop fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "good_pullback_reentry_after_constructive_trim",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Good pullback re-entry after constructive trim is a richer re-entry storyline than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_followthrough_after_trim",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry followthrough after trim is a richer re-entry storyline than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_followthrough_after_trim",
    suppressedPatternId: "good_pullback_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry followthrough after trim is a richer storyline because it includes what happened after the re-entry, not just the pullback setup before it.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_followthrough_after_trim",
    suppressedPatternId: "late_chase_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry followthrough after trim is a richer storyline because it includes what happened after the re-entry, not just the chase-style setup before it.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_followthrough_after_trim",
    suppressedPatternId: "constructive_readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry followthrough after trim is a richer sequence pattern because it includes trim context plus favorable post-reentry followthrough.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with constructive final exit is a richer one-cycle storyline because it adds the constructive final-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with constructive final exit is a richer one-cycle storyline because it includes both constructive re-entry quality and the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "constructive_readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with constructive final exit is a richer one-cycle storyline than broad constructive re-add after reduction because it includes trim context, favorable post-reentry followthrough, and the constructive exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with premature final exit is a richer one-cycle storyline because it adds the premature final-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with premature final exit is a richer one-cycle storyline because it includes both constructive re-entry quality and the premature final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds explicit trim and constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with stop-like forced exit after breakdown is a richer one-cycle storyline because it adds the later stop-like breakdown exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with stop-like forced exit after breakdown is a richer whole-trade storyline than the broad stop-like breakdown exit because it adds explicit constructive trim-and-reentry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with stop-like forced exit before rebound is a richer one-cycle storyline because it adds the later stop-like weak-side exit before rebound to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with stop-like forced exit before rebound is a richer whole-trade storyline than the broad stop-like rebound exit because it adds explicit constructive trim-and-reentry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "constructive_reentry_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Constructive re-entry with stop-like forced exit before rebound is a richer one-cycle storyline than constructive re-entry with premature final exit because it distinguishes a stop-like weak-side exit from a broader early exit before continuation.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_constructive_final_exit_after_constructive_reentry",
    suppressedPatternId: "constructive_reentry_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with constructive final exit after constructive re-entry is a richer storyline because it adds the early-adversity recovery path to the constructive re-entry and constructive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_constructive_final_exit_after_constructive_reentry",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with constructive final exit after constructive re-entry is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds explicit trim and re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_constructive_final_exit_after_constructive_reentry",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with constructive final exit after constructive re-entry is a richer storyline than broad recovery after early adversity with stabilized management because it adds the constructive re-entry and final-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_constructive_final_exit_after_constructive_reentry",
    suppressedPatternId:
      "recovery_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with constructive final exit after constructive re-entry is a richer recovery-aware storyline than recovery with balanced management and constructive final exit because it adds explicit trim-and-reentry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_premature_final_exit_after_constructive_reentry",
    suppressedPatternId: "constructive_reentry_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with premature final exit after constructive re-entry is a richer storyline because it adds the early-adversity recovery path to the constructive re-entry and premature-final-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_premature_final_exit_after_constructive_reentry",
    suppressedPatternId: "stabilized_recovery_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with premature final exit after constructive re-entry is a richer recovery-aware storyline than the broad stabilized-recovery premature-final-exit pattern because it adds explicit trim and constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_premature_final_exit_after_constructive_reentry",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with premature final exit after constructive re-entry is a richer storyline than broad recovery after early adversity with stabilized management because it adds the constructive re-entry and final premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    suppressedPatternId:
      "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit after constructive re-entry is a richer storyline because it adds the early-adversity recovery path to the constructive re-entry and stop-like breakdown-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    suppressedPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit after constructive re-entry is a richer recovery-aware storyline than the broad stabilized-recovery stop-like breakdown pattern because it adds explicit trim and constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit after constructive re-entry is a richer recovery-failure storyline because it adds the constructive re-entry sequence to the later failed-protection stop-like breakdown outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    suppressedPatternId:
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit before rebound after constructive re-entry is a richer storyline because it adds the early-adversity recovery path to the constructive re-entry and stop-like rebound-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    suppressedPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit before rebound after constructive re-entry is a richer recovery-aware storyline than the broad stabilized-recovery stop-like rebound pattern because it adds explicit trim and constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    suppressedPatternId: "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit before rebound after constructive re-entry is a richer recovery-failure storyline because it adds the constructive re-entry sequence to the later failed-protection stop-like rebound outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    suppressedPatternId:
      "recovery_with_premature_final_exit_after_constructive_reentry",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with stop-like forced exit before rebound after constructive re-entry is a richer recovery-aware storyline than recovery with premature final exit after constructive re-entry because it distinguishes a stop-like weak-side exit from a broader early exit before continuation.",
  }),
  defineDominanceRule({
    dominantPatternId: "deteriorating_reentry_after_trim",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Deteriorating re-entry after trim is a richer re-entry storyline than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "deteriorating_reentry_after_trim",
    suppressedPatternId: "good_pullback_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Deteriorating re-entry after trim is a richer storyline because it includes what happened after the re-entry, not just the pullback setup before it.",
  }),
  defineDominanceRule({
    dominantPatternId: "deteriorating_reentry_after_trim",
    suppressedPatternId: "late_chase_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Deteriorating re-entry after trim is a richer storyline because it includes what happened after the re-entry, not just the chase-style setup before it.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive re-entry followthrough is a richer repeated-cycle storyline than the one-cycle constructive re-entry followthrough pattern.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    suppressedPatternId: "good_pullback_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive re-entry followthrough includes the repeated-cycle re-entry setup plus stronger favorable followthrough after the reloads.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "constructive_reentry_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer repeated-cycle storyline than the one-cycle constructive re-entry and constructive-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "constructive_reentry_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer repeated-cycle storyline than the one-cycle constructive re-entry and premature-final-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit after breakdown is a richer repeated-cycle storyline than the one-cycle constructive re-entry and stop-like breakdown-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "constructive_reentry_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer repeated-cycle storyline than the one-cycle constructive re-entry and stop-like rebound-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive re-entry followthrough is a richer repeated-cycle storyline than broad constructive repeated trim/re-add management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_deteriorating_reentry",
    suppressedPatternId: "deteriorating_reentry_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with deteriorating re-entry is a richer repeated-cycle storyline than the one-cycle deteriorating re-entry pattern.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_deteriorating_reentry",
    suppressedPatternId: "late_chase_reentry_after_constructive_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with deteriorating re-entry includes the repeated-cycle chase-style reload context plus stronger adverse followthrough after the reloads.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_trim_readd_with_deteriorating_reentry",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with deteriorating re-entry is a richer repeated-cycle failure storyline than broad unstable repeated trim/re-add management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer repeated-cycle storyline because it adds the premature final-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer repeated-cycle storyline than broad repeated balanced management with constructive final exit because it includes explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with constructive final exit is a richer repeated-cycle storyline than the broad repeated constructive-final-exit pattern because it captures active trim-and-readd management before the constructive finish.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with constructive final exit is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer repeated-cycle storyline because it adds the constructive final-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer repeated-cycle storyline because it includes both constructive re-entry quality and the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit after breakdown is a richer repeated-cycle storyline than broad repeated balanced management with stop-like breakdown exit because it includes explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit after breakdown is a richer repeated-cycle storyline than the broad repeated defensive-exit path because it distinguishes a stop-like breakdown exit after active repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit after breakdown is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the later stop-like breakdown-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit after breakdown is a richer repeated-cycle storyline because it adds the stop-like breakdown-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "held_through_danger_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit after breakdown is a richer whole-trade storyline because it includes repeated constructive re-entry quality before the later stop-like breakdown exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit after breakdown is a richer repeated-cycle storyline than broad constructive repeated trim/re-add management because it includes both re-entry quality and the later stop-like breakdown-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer repeated-cycle storyline than broad repeated balanced management with stop-like rebound exit because it includes explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_trim_readd_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit before rebound is a richer repeated-cycle storyline than the broad repeated fearful-exit path because it distinguishes a stop-like rebound exit after active repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit before rebound is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the later stop-like rebound-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_trim_readd_with_constructive_reentry_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer repeated-cycle storyline because it adds the stop-like rebound-exit outcome to the constructive re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "held_through_danger_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer whole-trade storyline because it includes repeated constructive re-entry quality before the later stop-like rebound exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer repeated-cycle storyline than broad constructive repeated trim/re-add management because it includes both re-entry quality and the later stop-like rebound-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with stop-like forced exit before rebound is a richer repeated-cycle storyline than repeated constructive re-entry with premature final exit because it distinguishes a stop-like weak-side exit from a broader early exit before continuation.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer storyline than the one-cycle constructive re-entry followthrough pattern.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with constructive final exit is a richer repeated-cycle storyline than broad constructive repeated trim/re-add management because it includes both re-entry quality and the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_missed_final_continuation",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with missed final continuation is a richer repeated-cycle storyline than broad missed post-exit continuation alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_missed_final_continuation",
    suppressedPatternId: "repeated_trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with missed final continuation is a richer repeated-cycle storyline than the broad repeated missed-continuation pattern because it captures active trim-and-readd management before the final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_missed_final_continuation",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with missed final continuation is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the missed-final-continuation outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_balanced_management_with_fearful_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with fearful final exit is a richer repeated-cycle storyline than the broad repeated fearful-exit path because it captures active trim-and-readd management before the later fearful exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_balanced_management_with_fearful_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with fearful final exit is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the fearful final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_balanced_management_with_fearful_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with fearful final exit is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it specifies the weak fearful exit path before rebound.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it adds explicit constructive re-entry quality and a stronger early-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_balanced_management_with_premature_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with premature final exit is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it captures an earlier and cleaner early-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit before rebound is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it distinguishes a weak-side stop-like exit from a broad continuation miss.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_fearful_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with fearful final exit is a stricter repeated-cycle storyline than broad repeated balanced management with missed final continuation because it specifies the weak-side fearful exit path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer repeated-cycle storyline than broad repeated balanced management with premature final exit because it includes both the repeated management path and explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with premature final exit is a richer repeated-cycle storyline than the broad repeated premature-final-exit pattern because it captures active trim-and-readd management before the early final exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with premature final exit is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the premature final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer repeated-cycle storyline because it includes both constructive re-entry quality and the premature final exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "constructive_reentry_followthrough_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer storyline than the one-cycle constructive re-entry followthrough pattern.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated constructive re-entry with premature final exit is a richer repeated-cycle storyline than broad constructive repeated trim/re-add management because it includes both re-entry quality and the final premature-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated deteriorating re-entry with defensive final exit is a richer repeated-cycle storyline than the broad repeated balanced-management defensive-save summary because it includes explicit re-entry-deterioration detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    suppressedPatternId:
      "repeated_trim_readd_with_deteriorating_reentry",
    outcome: "demote_to_supporting",
    reason:
      "Repeated deteriorating re-entry with defensive final exit is a richer repeated-cycle storyline because it adds the defensive final-exit outcome to the deteriorating re-entry path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated deteriorating re-entry with defensive final exit is a richer repeated-cycle storyline because it includes both deteriorating re-entry quality and the defensive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    suppressedPatternId: "deteriorating_reentry_after_trim",
    outcome: "demote_to_supporting",
    reason:
      "Repeated deteriorating re-entry with defensive final exit is a richer storyline than the one-cycle deteriorating re-entry pattern.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated deteriorating re-entry with defensive final exit is a richer repeated-cycle failure storyline than broad unstable repeated trim/re-add management because it includes both re-entry deterioration and the final defensive-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId:
      "repeated_balanced_management_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and missed final continuation is a richer storyline than the broad repeated balanced-management missed-continuation summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and missed final continuation is a richer recovery-aware storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId: "repeated_trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and missed final continuation is a richer recovery-aware storyline than the broad repeated missed-final-continuation pattern because it adds both repeated rescue context and balanced repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and missed final continuation is a richer recovery-aware storyline than broad constructive repeated trim-readd management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with defensive final exit after deterioration is a richer repeated-cycle storyline than the broad repeated defensive-exit path because it captures active trim-and-readd management before the later defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with defensive final exit after deterioration is a richer repeated-cycle storyline than broad constructive repeated trim-readd management because it adds the later defensive-save outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit after breakdown is a stricter repeated-cycle storyline than repeated balanced management with defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit before rebound is a stricter repeated-cycle storyline than repeated balanced management with defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a stricter recovery-aware repeated-cycle storyline than the broad repeated balanced-management missed-continuation summary because it adds explicit constructive re-entry quality and a stronger early-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and premature final exit is a stricter recovery-aware storyline than the broad repeated balanced-management missed-continuation summary because it captures an earlier and cleaner early-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a stricter recovery-aware storyline than the broad repeated balanced-management missed-continuation summary because it distinguishes a weak-side stop-like exit from a broad continuation miss.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a richer recovery-aware repeated-cycle storyline than the broad repeated balanced-management premature-exit summary because it adds explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and premature final exit is a richer storyline than the broad repeated balanced-management premature-exit summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and premature final exit is a richer recovery-aware storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and premature final exit is a richer recovery-aware storyline than the broad repeated premature-final-exit pattern because it adds both repeated rescue context and balanced repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_premature_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and premature final exit is a richer recovery-aware storyline than broad constructive repeated trim-readd management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "repeated_balanced_management_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated balanced management with stop-like forced exit before rebound is a stricter repeated-cycle storyline than repeated balanced management with fearful final exit because it distinguishes a stop-like weak-side exit from a broader fearful one.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId: "repeated_balanced_management_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and fearful final exit is a richer storyline than the broad repeated balanced-management fearful-exit summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and fearful final exit is a richer recovery-aware storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and fearful final exit is a richer recovery-aware storyline than the broad repeated fearful-exit path because it adds rescue context before the later fearful exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a stricter recovery-aware storyline than repeated rescue attempts with balanced management and fearful final exit because it distinguishes a stop-like weak-side exit from a broader fearful one.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "repeated_balanced_management_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and defensive final exit after deterioration is a richer storyline than the broad repeated balanced-management defensive-save summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and defensive final exit after deterioration is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and defensive final exit after deterioration is a richer recovery-aware storyline than the broad repeated defensive-exit pattern because it adds both rescue context and balanced repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and defensive final exit after deterioration is a richer recovery-aware storyline than broad constructive repeated trim-readd management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit after breakdown is a stricter recovery-aware storyline than repeated rescue attempts with balanced management and defensive final exit after deterioration because it distinguishes a stop-like breakdown exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a stricter recovery-aware storyline than repeated rescue attempts with balanced management and defensive final exit after deterioration because it distinguishes a stop-like weak-side exit from a broader defensive save.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_constructive_reentry_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a richer storyline because it adds the early-adversity recovery path to the repeated constructive re-entry and premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a richer storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer recovery-aware repeated-cycle storyline than the broad repeated balanced-management constructive summary because it adds explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId:
      "repeated_balanced_management_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and constructive final exit is a richer storyline than the broad repeated balanced-management constructive summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId:
      "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and constructive final exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds repeated rescue and management context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and constructive final exit is a richer storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and constructive final exit is a richer recovery-aware storyline than the broad repeated constructive-final-exit pattern because it adds both rescue context and balanced repeated management.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and constructive final exit is a richer recovery-aware storyline than broad constructive repeated trim-readd management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_constructive_reentry_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer storyline because it adds the early-adversity recovery path to the repeated constructive re-entry and constructive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit after constructive re-entries is a richer recovery-aware repeated-cycle storyline than the broad repeated balanced-management stop-like breakdown summary because it adds explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit after breakdown is a richer storyline than the broad repeated balanced-management stop-like breakdown summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit after breakdown is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit after breakdown is a richer recovery-aware storyline than the broad repeated defensive-exit path because it adds both rescue context and a stop-like breakdown outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    suppressedPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit after constructive re-entries is a richer storyline because it adds the early-adversity recovery path to the repeated constructive re-entry and stop-like breakdown-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit after constructive re-entries is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_after_constructive_reentries",
    suppressedPatternId:
      "recovery_with_stop_like_forced_exit_after_constructive_reentry",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit after constructive re-entries is a richer repeated-cycle storyline than the one-cycle recovery-aware constructive re-entry and stop-like breakdown-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer storyline than broad recovery after early adversity with stabilized management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit before rebound after constructive re-entries is a richer recovery-aware repeated-cycle storyline than the broad repeated balanced-management stop-like rebound summary because it adds explicit constructive re-entry quality.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_balanced_management_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a richer storyline than the broad repeated balanced-management stop-like rebound summary because it adds the early-adversity recovery path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_balanced_management_and_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "repeated_trim_readd_with_fearful_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with balanced management and stop-like forced exit before rebound is a richer recovery-aware storyline than the broad repeated fearful-exit path because it adds both rescue context and a stop-like rebound outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    suppressedPatternId:
      "repeated_constructive_reentry_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit before rebound after constructive re-entries is a richer storyline because it adds the early-adversity recovery path to the repeated constructive re-entry and stop-like rebound-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit before rebound after constructive re-entries is a richer recovery-failure storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    suppressedPatternId:
      "recovery_with_stop_like_forced_exit_before_rebound_after_constructive_reentry",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit before rebound after constructive re-entries is a richer repeated-cycle storyline than the one-cycle recovery-aware constructive re-entry and stop-like rebound-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_stop_like_forced_exit_before_rebound_after_constructive_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with stop-like forced exit before rebound after constructive re-entries is a richer recovery-aware repeated-cycle storyline than repeated rescue attempts with premature final exit after constructive re-entries because it distinguishes a stop-like weak-side exit from a broader early exit before continuation.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId:
      "recovery_with_constructive_final_exit_after_constructive_reentry",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer repeated-cycle storyline than the one-cycle recovery-aware constructive re-entry and constructive-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_constructive_final_exit_after_constructive_reentries",
    suppressedPatternId: "repeated_trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with constructive final exit after constructive re-entries is a richer recovery-aware storyline than the broad repeated constructive-final-exit pattern because it adds both the rescue path and re-entry-quality detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a richer recovery-aware storyline than broad constructive repeated trim/re-add management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_premature_final_exit_after_constructive_reentries",
    suppressedPatternId: "repeated_trim_readd_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with premature final exit after constructive re-entries is a richer recovery-aware storyline than the broad repeated premature-final-exit pattern because it adds both the rescue path and re-entry-quality detail.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    suppressedPatternId:
      "repeated_deteriorating_reentry_with_defensive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deteriorating re-entries is a richer storyline because it adds the early-adversity recovery path to the repeated deteriorating re-entry and defensive-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    suppressedPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deteriorating re-entries is a richer storyline because it includes both deteriorating re-entry quality and the recovery-aware defensive final exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deteriorating re-entries is a richer storyline than broad recovery after early adversity with failed protection alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deteriorating re-entries is a richer recovery-aware failure storyline than broad unstable repeated trim/re-add management alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "repeated_rescue_attempts_with_defensive_final_exit_after_deteriorating_reentries",
    suppressedPatternId:
      "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deteriorating re-entries is a richer recovery-aware storyline than the broad repeated defensive-final-exit-after-deterioration pattern because it adds both the rescue path and re-entry-deterioration detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_constructive_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive final exit is a richer repeated-cycle storyline because it includes the constructive final-outcome detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_constructive_final_exit",
    suppressedPatternId: "trim_readd_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with constructive final exit is a richer repeated-cycle storyline than the one-cycle constructive final-exit variant.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_fearful_final_exit",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with fearful final exit is a richer repeated-cycle failure storyline because it includes the weak final-exit outcome detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_fearful_final_exit",
    suppressedPatternId: "fearful_exit_after_weakening",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with fearful final exit is a richer repeated-cycle storyline than broad fearful exit after weakening alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "repeated_trim_readd_with_unstable_management",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with defensive final exit after deterioration is a richer repeated-cycle storyline because it includes the final defensive-save outcome detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "defensive_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with defensive final exit after deterioration is a richer repeated-cycle storyline than broad defensive exit after deterioration alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "repeated_trim_readd_with_defensive_final_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deterioration is a richer storyline because it includes the early recovery and rescue-attempt path before the final defensive exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_rescue_attempts_with_defensive_final_exit_after_deterioration",
    suppressedPatternId: "repeated_rescue_attempts_with_renewed_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Repeated rescue attempts with defensive final exit after deterioration is a richer rescue storyline than broad renewed deterioration alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_premature_final_exit",
    suppressedPatternId: "trim_readd_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with premature final exit is a richer repeated-cycle storyline than the one-cycle missed-final-continuation pattern.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_trim_readd_with_premature_final_exit",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Repeated trim re-add with premature final exit includes the premature post-exit continuation outcome plus richer repeated-cycle structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "one_sided_aggressive_building",
    suppressedPatternId: "structured_position_building",
    outcome: "demote_to_supporting",
    reason:
      "One-sided aggressive building is a more specific middle-trade sizing pattern than broad structured building.",
  }),
  defineDominanceRule({
    dominantPatternId: "revenge_adding_after_weakness",
    suppressedPatternId: "add_into_weakness",
    outcome: "demote_to_supporting",
    reason:
      "Revenge adding after weakness is a richer named averaging-down storyline than broad add into weakness because it adds repeated below-basis adds without meaningful reduction.",
  }),
  defineDominanceRule({
    dominantPatternId: "revenge_adding_after_weakness",
    suppressedPatternId: "one_sided_aggressive_building",
    outcome: "demote_to_supporting",
    reason:
      "Revenge adding after weakness is a richer named averaging-down storyline than broad one-sided aggressive building because it adds explicit add-into-weakness context.",
  }),
  defineDominanceRule({
    dominantPatternId: "revenge_adding_after_weakness",
    suppressedPatternId: "add_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Revenge adding after weakness includes the adverse directional add context plus richer repeated below-basis averaging-down structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "aggressive_adding_with_failed_profit_protection",
    suppressedPatternId: "one_sided_aggressive_building",
    outcome: "demote_to_supporting",
    reason:
      "Aggressive adding with failed profit protection is a richer management-failure pattern than broad one-sided aggressive building.",
  }),
  defineDominanceRule({
    dominantPatternId: "revenge_adding_with_failed_profit_protection",
    suppressedPatternId: "aggressive_adding_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Revenge adding with failed profit protection is a richer named failure storyline than broad aggressive adding with failed protection because it adds explicit averaging-down-into-weakness structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "revenge_adding_with_failed_profit_protection",
    suppressedPatternId: "revenge_adding_after_weakness",
    outcome: "demote_to_supporting",
    reason:
      "Revenge adding with failed profit protection is a richer named storyline because it adds the failed protection outcome to the repeated averaging-down structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "aggressive_adding_with_failed_profit_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Aggressive adding with failed profit protection includes the failed profit-protection structure plus aggressive add context.",
  }),
  defineDominanceRule({
    dominantPatternId: "readd_after_delayed_risk_response",
    suppressedPatternId: "readd_after_reduction",
    outcome: "demote_to_supporting",
    reason:
      "Re-add after delayed risk response is a richer sequence-level pattern than the broad re-add-after-reduction fact.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength",
    suppressedPatternId: "adding_above_prior_basis",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength is a richer add-context pattern than simply adding above prior basis.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_strength",
    suppressedPatternId: "add_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Add into strength already captures favorable directional add context plus stronger range-position structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_into_weakness",
    suppressedPatternId: "add_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Add into weakness already captures adverse directional add context plus weaker range-position structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_position_building",
    suppressedPatternId: "single_build_position",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized position building is a richer interpretation of limited size building on a meaningful opportunity trade.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_constructive_exit",
    suppressedPatternId: "underutilized_position_building",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with constructive exit is a richer storyline than broad underutilized position building because it adds the disciplined final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_constructive_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with constructive exit includes the constructive post-exit outcome plus the under-pressed winner context.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_constructive_exit",
    suppressedPatternId: "underutilized_winner_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with constructive exit is a richer storyline because it adds the early-adversity recovery path to the under-pressed winner outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_constructive_exit",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with constructive exit is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_constructive_exit",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with constructive exit is a richer recovery-aware storyline than the broad stabilized-recovery constructive-final-exit pattern because it adds explicit under-pressed winner context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "underutilized_winner_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with timely profit protection and constructive final exit is a richer storyline because it adds explicit timely protection to the under-pressed winner constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId: "timely_profit_protection_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with timely profit protection and constructive final exit is a richer whole-trade storyline because it adds explicit under-pressed winner context to the timely protection and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "underutilized_position_building",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with premature final exit is a richer storyline than broad underutilized position building because it adds the premature-final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds explicit under-pressed winner context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with timely profit protection and constructive final exit is a richer storyline because it adds the early-adversity recovery path to the under-pressed timely-protection constructive sequence.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_to_underutilized_winner_with_constructive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with timely profit protection and constructive final exit is a richer recovery-aware storyline because it adds explicit timely protection to the under-pressed winner constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_to_underutilized_winner_with_timely_profit_protection_and_constructive_final_exit",
    suppressedPatternId:
      "recovery_with_timely_profit_protection_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with timely profit protection and constructive final exit is a richer recovery-aware storyline because it adds explicit under-pressed winner context to the recovery-aware timely protection and constructive-exit path.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "underutilized_winner_with_premature_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with premature final exit is a richer storyline because it adds the early-adversity recovery path to the under-pressed premature-exit sequence.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with premature final exit is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with premature final exit is a richer whole-trade storyline than broad premature final exit after constructive management because it adds both the recovery path and the explicit under-pressed winner context.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "underutilized_winner_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with premature final exit is a richer whole-trade storyline than the broader underutilized missed-continuation branch because it adds the explicit premature-final-exit interpretation on top of the missed continuation outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "recovery_to_underutilized_winner_with_premature_final_exit",
    suppressedPatternId: "recovery_to_underutilized_winner_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with premature final exit is a richer recovery-aware storyline than the broader recovery-aware underutilized missed-continuation branch because it adds the explicit premature-final-exit interpretation.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_missed_final_continuation",
    suppressedPatternId: "underutilized_position_building",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with missed final continuation is a richer storyline than broad underutilized position building because it adds the missed-opportunity final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "underutilized_winner_with_missed_final_continuation",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Underutilized winner with missed final continuation includes the missed post-exit continuation outcome plus explicit under-pressed winner context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_to_underutilized_winner_with_missed_final_continuation",
    suppressedPatternId: "underutilized_winner_with_missed_final_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with missed final continuation is a richer storyline because it adds the early-adversity recovery path to the under-pressed missed-continuation outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_to_underutilized_winner_with_missed_final_continuation",
    suppressedPatternId: "constructive_recovery_after_early_adversity",
    outcome: "demote_to_supporting",
    reason:
      "Recovery to underutilized winner with missed final continuation is a richer recovery-aware storyline than broad constructive recovery alone.",
  }),

  // =========================
  // EXIT QUALITY
  // =========================
  defineDominanceRule({
    dominantPatternId: "high_capture_exit_structure",
    suppressedPatternId: "exit_near_favorable_extreme",
    outcome: "demote_to_supporting",
    reason:
      "High capture exit structure is the stronger primary exit-quality pattern; near-favorable-extreme is usually supporting detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "moderate_capture_exit_structure",
    suppressedPatternId: "exit_near_favorable_extreme",
    outcome: "demote_to_supporting",
    reason:
      "Moderate capture exit structure is the stronger primary exit-quality pattern; near-favorable-extreme is usually supporting detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "low_capture_exit_structure",
    suppressedPatternId: "exit_near_favorable_extreme",
    outcome: "demote_to_supporting",
    reason:
      "Low capture exit structure is the stronger primary exit-quality pattern; near-favorable-extreme is usually supporting detail.",
  }),
  defineDominanceRule({
    dominantPatternId: "missed_post_exit_continuation",
    suppressedPatternId: "exit_with_meaningful_giveback",
    outcome: "demote_to_supporting",
    reason:
      "Missed post-exit continuation is a richer post-exit outcome pattern than the broader meaningful giveback descriptor.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_into_support_with_relief_after_exit",
    suppressedPatternId: "exit_into_support_structure",
    outcome: "demote_to_supporting",
    reason:
      "Exit into support with relief after exit is a richer support-aware exit storyline than broad exit into support alone because it also includes the post-exit relief outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_into_support_before_breakdown",
    suppressedPatternId: "exit_into_support_structure",
    outcome: "demote_to_supporting",
    reason:
      "Exit into support before breakdown is a richer support-aware exit storyline than broad exit into support alone because it also includes the post-exit breakdown outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_into_stacked_support_with_relief_after_exit",
    suppressedPatternId: "exit_into_support_with_relief_after_exit",
    outcome: "demote_to_supporting",
    reason:
      "Exit into stacked support with relief after exit is a richer support-aware exit storyline because it adds support-density context to the post-exit relief outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_into_thin_support_before_breakdown",
    suppressedPatternId: "exit_into_support_before_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Exit into thin support before breakdown is a richer support-aware exit storyline because it adds thin-support context to the post-exit breakdown outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_exit_into_stacked_support_and_relief",
    suppressedPatternId: "exit_into_stacked_support_with_relief_after_exit",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into stacked support and relief is a richer support-aware exit storyline because it adds the prior recovery-stabilization path to the stacked-support relief outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_exit_into_stacked_support_and_relief",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into stacked support and relief is a richer recovery-exit storyline because it adds explicit support-density context to the constructive stabilized-recovery exit.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
    suppressedPatternId: "exit_into_thin_support_before_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into thin support before breakdown is a richer support-aware exit storyline because it adds the prior recovery-stabilization path to the thin-support breakdown outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
    suppressedPatternId: "stabilized_recovery_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with exit into thin support before breakdown is a richer recovery-exit storyline because it adds explicit thin-support breakdown context to the broader stabilized-recovery exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_above_resistance_structure",
    suppressedPatternId: "add_into_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Add above resistance structure is a richer support-aware scaling storyline because it distinguishes true clearance above broken resistance from crowding directly into nearby resistance.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_above_resistance_with_constructive_final_exit",
    suppressedPatternId: "add_above_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Add above resistance with constructive final exit is a richer whole-trade storyline than the broad add-above-resistance structural fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_above_resistance_with_constructive_final_exit",
    suppressedPatternId: "balanced_scaling_with_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Add above resistance with constructive final exit is a richer support/resistance-aware constructive-management storyline than broad balanced scaling with profit protection.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_above_resistance_with_failed_profit_protection",
    suppressedPatternId: "add_above_resistance_structure",
    outcome: "demote_to_supporting",
    reason:
      "Add above resistance with failed profit protection is a richer whole-trade storyline than the broad add-above-resistance structural fact alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "add_above_resistance_with_failed_profit_protection",
    suppressedPatternId: "aggressive_adding_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Add above resistance with failed profit protection is a richer support/resistance-aware failure storyline than broad aggressive adding with failed profit protection.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_above_resistance_and_constructive_final_exit",
    suppressedPatternId: "add_above_resistance_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add above resistance and constructive final exit is a richer whole-trade support/resistance storyline than the non-recovery add-above-resistance constructive branch alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_above_resistance_and_constructive_final_exit",
    suppressedPatternId: "recovery_with_add_into_strength_and_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add above resistance and constructive final exit is a richer recovery add-into-strength storyline because it adds explicit support/resistance clearance context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_above_resistance_and_failed_profit_protection",
    suppressedPatternId: "add_above_resistance_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add above resistance and failed profit protection is a richer whole-trade support/resistance storyline than the non-recovery add-above-resistance failure branch alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "recovery_with_add_above_resistance_and_failed_profit_protection",
    suppressedPatternId: "aggressive_adding_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Recovery with add above resistance and failed profit protection is a richer recovery-aware support/resistance failure storyline than broad aggressive adding with failed profit protection.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_adds_above_resistance_with_constructive_final_exit",
    suppressedPatternId: "add_above_resistance_with_constructive_final_exit",
    outcome: "demote_to_supporting",
    reason:
      "Repeated adds above resistance with constructive final exit is a richer support/resistance storyline than the one-cycle add-above-resistance constructive branch alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "repeated_adds_above_resistance_with_failed_profit_protection",
    suppressedPatternId: "add_above_resistance_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Repeated adds above resistance with failed profit protection is a richer support/resistance storyline than the one-cycle add-above-resistance failure branch alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "premature_final_exit_after_constructive_management",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Premature final exit after constructive management is a richer early-exit storyline than broad missed post-exit continuation alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_premature_final_exit",
    suppressedPatternId: "premature_final_exit_after_constructive_management",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with premature final exit is a richer combined recovery-and-exit storyline than broad premature final exit after constructive management alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_premature_final_exit",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with premature final exit is a richer combined recovery-and-exit storyline than the broad missed post-exit continuation descriptor because it includes both the stabilized recovery path and the premature final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_premature_final_exit",
    suppressedPatternId: "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with premature final exit includes the stabilized recovery path plus the premature final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "fearful_exit_after_weakening",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Fearful exit after weakening is a richer weak-exit storyline than broad missed post-exit continuation alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "fearful_exit_after_weakening",
    suppressedPatternId: "low_capture_exit_structure",
    outcome: "demote_to_supporting",
    reason:
      "Fearful exit after weakening includes weak capture plus the richer weak-exit and recovery-after-exit storyline.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_before_rebound",
    suppressedPatternId: "fearful_exit_after_weakening",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit before rebound is a richer breakdown-driven exit storyline than broad fearful exit after weakening alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_before_rebound",
    suppressedPatternId: "missed_post_exit_continuation",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit before rebound includes the rebound-after-exit outcome plus the stronger breakdown context that led into the stop-like final exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_before_rebound",
    suppressedPatternId: "low_capture_exit_structure",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit before rebound includes the weak capture plus the richer breakdown-driven stop-like exit context.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_before_rebound",
    suppressedPatternId: "peak_profit_giveback_structure",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit before rebound includes the large giveback context plus the richer breakdown-driven stop-like final exit storyline.",
  }),
  defineDominanceRule({
    dominantPatternId: "exit_avoided_adverse_followthrough",
    suppressedPatternId: "exit_with_limited_giveback",
    outcome: "demote_to_supporting",
    reason:
      "Exit avoided adverse followthrough is a richer post-exit relief pattern than the broader limited giveback descriptor.",
  }),
  defineDominanceRule({
    dominantPatternId: "disciplined_defensive_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Disciplined defensive exit is a richer relief-exit storyline than broad exit avoided adverse followthrough alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_constructive_final_exit",
    suppressedPatternId: "disciplined_defensive_exit",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with constructive final exit is a richer combined recovery-and-exit storyline than broad disciplined defensive exit alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_constructive_final_exit",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with constructive final exit is a richer combined recovery-and-exit storyline than the broad exit-avoided-adverse-followthrough descriptor because it includes both the stabilized recovery path and the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "stabilized_recovery_with_constructive_final_exit",
    suppressedPatternId: "recovery_after_early_adversity_with_stabilized_management",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with constructive final exit includes the stabilized recovery path plus the constructive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "defensive_exit_after_deterioration",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Defensive exit after deterioration is a richer relief-exit storyline than broad exit avoided adverse followthrough alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "defensive_exit_after_deterioration",
    suppressedPatternId: "peak_profit_giveback_structure",
    outcome: "demote_to_supporting",
    reason:
      "Defensive exit after deterioration includes the deterioration context plus the defensive final-exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "defensive_exit_after_deterioration",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit after breakdown is a richer breakdown-driven exit storyline than broad defensive exit after deterioration alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "exit_avoided_adverse_followthrough",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit after breakdown includes the adverse-followthrough relief outcome plus the stronger breakdown context that pushed the final exit to the weak side.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "low_capture_exit_structure",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit after breakdown includes the weak capture plus the richer breakdown-driven stop-like exit context.",
  }),
  defineDominanceRule({
    dominantPatternId: "stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "peak_profit_giveback_structure",
    outcome: "demote_to_supporting",
    reason:
      "Stop-like forced exit after breakdown includes the large giveback context plus the richer breakdown-driven stop-like final exit storyline.",
  }),
  defineDominanceRule({
    dominantPatternId: "held_through_danger_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Held through danger with stop-like forced exit after breakdown is a richer cross-family storyline because it adds the prior held-through-danger path to the breakdown-driven stop-like exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "held_through_danger_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "held_through_danger_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Held through danger with stop-like forced exit after breakdown is a richer cross-family storyline because it adds the stop-like exit outcome to the earlier held-through-danger pattern.",
  }),
  defineDominanceRule({
    dominantPatternId: "held_through_danger_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Held through danger with stop-like forced exit before rebound is a richer cross-family storyline because it adds the prior held-through-danger path to the stop-like exit and rebound outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "held_through_danger_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "held_through_danger_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Held through danger with stop-like forced exit before rebound is a richer cross-family storyline because it adds the stop-like rebound outcome to the earlier held-through-danger pattern.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with stop-like forced exit after breakdown is a richer cross-family storyline because it adds the prior delayed-response path to the breakdown-driven stop-like exit.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "delayed_risk_response_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with stop-like forced exit after breakdown is a richer cross-family storyline because it adds the final stop-like exit outcome to the delayed failed-protection path.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with stop-like forced exit before rebound is a richer cross-family storyline because it adds the prior delayed-response path to the stop-like exit and rebound outcome.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "delayed_risk_response_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with stop-like forced exit before rebound is a richer cross-family storyline because it adds the final stop-like rebound outcome to the delayed failed-protection path.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit after breakdown is a richer combined recovery-and-exit storyline than the broader stop-like breakdown exit alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit after breakdown is a richer recovery-failure storyline than the broader recovered-then-failed-protection pattern because it also includes the final breakdown-driven stop-like exit outcome.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_after_breakdown",
    suppressedPatternId: "delayed_risk_response_with_stop_like_forced_exit_after_breakdown",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit after breakdown is a richer storyline than the delayed-response stop-like breakdown branch because it also includes the earlier recovery-from-adversity context.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit before rebound is a richer combined recovery-and-exit storyline than the broader stop-like rebound exit alone.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId:
      "recovery_after_early_adversity_with_failed_protection",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit before rebound is a richer recovery-failure storyline than the broader recovered-then-failed-protection pattern because it also includes the final stop-like weak-side exit before rebound.",
  }),
  defineDominanceRule({
    dominantPatternId:
      "stabilized_recovery_with_stop_like_forced_exit_before_rebound",
    suppressedPatternId: "delayed_risk_response_with_stop_like_forced_exit_before_rebound",
    outcome: "demote_to_supporting",
    reason:
      "Stabilized recovery with stop-like forced exit before rebound is a richer storyline than the delayed-response stop-like rebound branch because it also includes the earlier recovery-from-adversity context.",
  }),
  defineDominanceRule({
    dominantPatternId: "failed_profit_protection_structure",
    suppressedPatternId: "peak_profit_giveback_structure",
    outcome: "demote_to_supporting",
    reason:
      "Failed profit protection structure is a richer management pattern than the narrower giveback descriptor.",
  }),
  defineDominanceRule({
    dominantPatternId: "reduction_into_strength",
    suppressedPatternId: "reduction_after_recent_run_up",
    outcome: "demote_to_supporting",
    reason:
      "Reduction into strength combines directional context with stronger reduction location and basis structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "reduction_into_weakness",
    suppressedPatternId: "reduction_after_recent_drop",
    outcome: "demote_to_supporting",
    reason:
      "Reduction into weakness combines directional context with weaker reduction location and basis structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "held_through_danger_after_peak_profit",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Held through danger after peak profit is a richer risk-management failure pattern than broad failed profit protection structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_after_peak_profit",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response after peak profit is a richer risk-management delay pattern than broad failed profit protection structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_risk_response_with_profit_protection",
    suppressedPatternId: "timely_risk_response_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with profit protection is a richer constructive sequence pattern than timely risk response alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "timely_risk_response_with_profit_protection",
    suppressedPatternId: "profit_protection_present",
    outcome: "demote_to_supporting",
    reason:
      "Timely risk response with profit protection includes retained open-profit protection plus explicit danger-window response timing.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_failed_profit_protection",
    suppressedPatternId: "delayed_risk_response_after_peak_profit",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with failed profit protection is a richer sequence-level risk-management pattern than delayed risk response alone.",
  }),
  defineDominanceRule({
    dominantPatternId: "delayed_risk_response_with_failed_profit_protection",
    suppressedPatternId: "failed_profit_protection_structure",
    outcome: "demote_to_supporting",
    reason:
      "Delayed risk response with failed profit protection is a richer sequence-level risk-management pattern than broad failed profit protection structure.",
  }),
  defineDominanceRule({
    dominantPatternId: "readd_after_delayed_risk_response",
    suppressedPatternId: "delayed_risk_response_with_failed_profit_protection",
    outcome: "demote_to_supporting",
    reason:
      "Re-add after delayed risk response is a richer management-sequence pattern because it includes the later re-add behavior.",
  }),
];

// =========================
// LOOKUP HELPERS
// =========================

export const PATTERN_DOMINANCE_RULES_BY_DOMINANT_ID: Record<
  string,
  PatternDominanceRule[]
> = PATTERN_DOMINANCE_RULES.reduce<Record<string, PatternDominanceRule[]>>(
  (accumulator, rule) => {
    if (!accumulator[rule.dominantPatternId]) {
      accumulator[rule.dominantPatternId] = [];
    }

    accumulator[rule.dominantPatternId].push(rule);
    return accumulator;
  },
  {},
);

export const PATTERN_DOMINANCE_RULES_BY_SUPPRESSED_ID: Record<
  string,
  PatternDominanceRule[]
> = PATTERN_DOMINANCE_RULES.reduce<Record<string, PatternDominanceRule[]>>(
  (accumulator, rule) => {
    if (!accumulator[rule.suppressedPatternId]) {
      accumulator[rule.suppressedPatternId] = [];
    }

    accumulator[rule.suppressedPatternId].push(rule);
    return accumulator;
  },
  {},
);

export function getDominanceRulesForDominantPattern(
  patternId: string,
): PatternDominanceRule[] {
  return PATTERN_DOMINANCE_RULES_BY_DOMINANT_ID[patternId] ?? [];
}

export function getDominanceRulesForSuppressedPattern(
  patternId: string,
): PatternDominanceRule[] {
  return PATTERN_DOMINANCE_RULES_BY_SUPPRESSED_ID[patternId] ?? [];
}

export function getSuppressionGroupsForPattern(
  patternId: string,
): PatternSuppressionGroup[] {
  return PATTERN_SUPPRESSION_GROUPS.filter((group) =>
    group.patternIds.includes(patternId),
  );
}
