import { buildTradeFeedbackFromScoring } from "../../coaching/builders/build-trade-feedback-from-scoring";
import { buildPatternScoringInput } from "../../pattern-scoring/builders/build-pattern-scoring-input";
import { buildPatternScoringResult } from "../../pattern-scoring/builders/build-pattern-scoring-result";
import type { AppTradeAnalysisResult } from "../run-trade-analysis";

export type TradeDecisionReviewInsightCategory =
  | "entry"
  | "scaling"
  | "exit"
  | "market_context"
  | "trade_window";

export type TradeDecisionReviewInsightTone =
  | "strength"
  | "risk"
  | "neutral";

export interface TradeDecisionReviewInsight {
  id: string;
  category: TradeDecisionReviewInsightCategory;
  tone: TradeDecisionReviewInsightTone;
  title: string;
  summary: string;
  evidence: string[];
}

export interface TradeDecisionReview {
  contractVersion: "trade_decision_review_v1";
  generatedFrom: {
    normalizedPatterns: true;
    patternScoring: true;
    behaviorCoaching: true;
    dailyFourHourLevelsOnly: true;
    vwapEmaFeedbackUsed: false;
  };
  score: {
    overallScore: number;
    scoreBand: string;
    confidence: string;
    dominantFamily: string | null;
  };
  coaching: {
    headline: string;
    coreIssue: string;
    whatWentWrongOrRight: string;
    whatToChangeNextTime: string;
    fixFirstBehaviorId: string | null;
    fixNextBehaviorId: string | null;
    mostImportantMistakeId: string | null;
    mostImportantStrengthId: string | null;
  };
  marketContext: {
    usedForReview: boolean;
    source: "levels_system_daily_4h" | "none";
    nearestSupportPrice: number | null;
    nearestResistancePrice: number | null;
    nearestSupportStrengthBucket: string | null;
    nearestResistanceStrengthBucket: string | null;
    nearestSupportSourceStrengthLabel: string | null;
    nearestResistanceSourceStrengthLabel: string | null;
    nearestSupportScore: number | null;
    nearestResistanceScore: number | null;
    distanceToNearestSupportPct: number | null;
    distanceToNearestResistancePct: number | null;
    roomToNearestResistancePct: number | null;
    occurredInOpenAir: boolean;
    hadSupportResistanceContextAvailable: boolean;
  };
  tradeWindow: {
    tradeMfePct: number | null;
    tradeMaePct: number | null;
    peakPriceDuringTrade: number | null;
    worstPriceDuringTrade: number | null;
    maxFavorableMovePctAfterExit: number | null;
    maxAdverseMovePctAfterExit: number | null;
  };
  insights: TradeDecisionReviewInsight[];
}

function hasPattern(result: AppTradeAnalysisResult, patternId: string): boolean {
  return result.normalizedPatterns.prioritizedPatterns.some(
    (pattern) => pattern.patternId === patternId,
  );
}

function hasAnyPattern(
  result: AppTradeAnalysisResult,
  patternIds: string[],
): boolean {
  return patternIds.some((patternId) => hasPattern(result, patternId));
}

function pct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function pctPoints(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${value < 1 ? value.toFixed(2) : value.toFixed(1)}%`;
}

function price(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "n/a";
  }

  return value.toFixed(4);
}

function levelStrengthLabel(args: {
  bucket: string | null;
  sourceStrengthLabel?: string | null;
}): string | null {
  if (args.sourceStrengthLabel) {
    return args.sourceStrengthLabel;
  }

  switch (args.bucket) {
    case "strong":
      return "strong";
    case "medium":
      return "moderate";
    case "weak":
      return "weak";
    default:
      return null;
  }
}

function levelPhrase(
  side: "support" | "resistance",
  bucket: string | null,
  sourceStrengthLabel?: string | null,
): string {
  const label = levelStrengthLabel({ bucket, sourceStrengthLabel });

  return label ? `${label} daily/4h ${side}` : `daily/4h ${side}`;
}

function levelStrengthEvidence(args: {
  prefix: string;
  bucket: string | null;
  sourceStrengthLabel?: string | null;
  score: number | null;
  reactionStrength: string | null;
}): string[] {
  const evidence: string[] = [];

  const label = levelStrengthLabel(args);

  if (label !== null) {
    evidence.push(`${args.prefix}Strength=${label}`);
  } else if (args.bucket !== null) {
    evidence.push(`${args.prefix}Strength=${args.bucket}`);
  }

  if (args.score !== null) {
    evidence.push(`${args.prefix}Score=${args.score.toFixed(2)}`);
  }

  if (args.reactionStrength !== null) {
    evidence.push(`${args.prefix}Reaction=${args.reactionStrength}`);
  }

  return evidence;
}

function pushUniqueInsight(
  insights: TradeDecisionReviewInsight[],
  insight: TradeDecisionReviewInsight,
): void {
  if (!insights.some((existing) => existing.id === insight.id)) {
    insights.push(insight);
  }
}

function buildMarketContextInsights(
  result: AppTradeAnalysisResult,
): TradeDecisionReviewInsight[] {
  const input = result.patternInput;
  const context = input.supportResistanceContext;
  const insights: TradeDecisionReviewInsight[] = [];
  const isShort = input.tradeDirection === "short";

  if (!context.hadSupportResistanceContextAvailable) {
    return [
      {
        id: "market_context_unavailable",
        category: "market_context",
        tone: "neutral",
        title: "Daily/4h level context was unavailable",
        summary:
          "The review can still use execution behavior, but it should not make level-based entry or exit claims for this trade.",
        evidence: [
          `hadSupportResistanceContextAvailable=${context.hadSupportResistanceContextAvailable}`,
        ],
      },
    ];
  }

  if (!isShort && context.firstEntryOccurredNearResistance) {
    pushUniqueInsight(insights, {
      id: "entry_near_daily_4h_resistance",
      category: "market_context",
      tone: "risk",
      title: `Entry was close to ${levelPhrase(
        "resistance",
        context.firstEntryNearestResistanceStrengthBucket ?? null,
        context.firstEntryNearestResistanceSourceStrengthLabel ?? null,
      )}`,
      summary:
        "The first entry started near a graded higher-timeframe resistance area, so the trade needed cleaner continuation to justify risk.",
      evidence: [
        `nearestResistance=${price(context.firstEntryNearestResistanceAbovePrice)}`,
        `distanceToResistance=${pctPoints(context.firstEntryDistanceToNearestResistancePct)}`,
        ...levelStrengthEvidence({
          prefix: "nearestResistance",
          bucket: context.firstEntryNearestResistanceStrengthBucket ?? null,
          sourceStrengthLabel:
            context.firstEntryNearestResistanceSourceStrengthLabel ?? null,
          score: context.firstEntryNearestResistanceScore ?? null,
          reactionStrength:
            context.firstEntryNearestResistanceReactionStrength ?? null,
        }),
      ],
    });
  }

  if (
    !isShort &&
    context.firstEntryDistanceToNearestResistancePct !== null &&
    context.firstEntryDistanceToNearestResistancePct <= 0.03
  ) {
    pushUniqueInsight(insights, {
      id: "entry_limited_clean_room_to_resistance",
      category: "market_context",
      tone: "risk",
      title: "Entry had limited clean room",
      summary:
        `The nearest ${levelPhrase(
          "resistance",
          context.firstEntryNearestResistanceStrengthBucket ?? null,
          context.firstEntryNearestResistanceSourceStrengthLabel ?? null,
        )} was close enough that upside was not especially clean from the first fill.`,
      evidence: [
        `nearestResistance=${price(context.firstEntryNearestResistanceAbovePrice)}`,
        `distanceToResistance=${pctPoints(context.firstEntryDistanceToNearestResistancePct)}`,
        ...levelStrengthEvidence({
          prefix: "nearestResistance",
          bucket: context.firstEntryNearestResistanceStrengthBucket ?? null,
          sourceStrengthLabel:
            context.firstEntryNearestResistanceSourceStrengthLabel ?? null,
          score: context.firstEntryNearestResistanceScore ?? null,
          reactionStrength:
            context.firstEntryNearestResistanceReactionStrength ?? null,
        }),
      ],
    });
  }

  if (isShort && context.firstEntryOccurredNearResistance) {
    pushUniqueInsight(insights, {
      id: "short_entry_had_nearby_daily_4h_resistance",
      category: "market_context",
      tone: "strength",
      title: `Short entry had nearby ${levelPhrase(
        "resistance",
        context.firstEntryNearestResistanceStrengthBucket ?? null,
        context.firstEntryNearestResistanceSourceStrengthLabel ?? null,
      )}`,
      summary:
        "For a short, nearby higher-timeframe resistance can provide structural cover above the entry, while the trade still needs clean downside follow-through.",
      evidence: [
        "tradeDirection=short",
        `nearestResistance=${price(context.firstEntryNearestResistanceAbovePrice)}`,
        `distanceToResistance=${pctPoints(context.firstEntryDistanceToNearestResistancePct)}`,
        ...levelStrengthEvidence({
          prefix: "nearestResistance",
          bucket: context.firstEntryNearestResistanceStrengthBucket ?? null,
          sourceStrengthLabel:
            context.firstEntryNearestResistanceSourceStrengthLabel ?? null,
          score: context.firstEntryNearestResistanceScore ?? null,
          reactionStrength:
            context.firstEntryNearestResistanceReactionStrength ?? null,
        }),
      ],
    });
  }

  const shortEntryNearSupport =
    context.firstEntryOccurredNearSupport ||
    (context.firstEntryDistanceToNearestSupportPct !== null &&
      context.firstEntryDistanceToNearestSupportPct <= 0.03);

  if (!isShort && context.firstEntryOccurredNearSupport) {
    pushUniqueInsight(insights, {
      id: "entry_near_daily_4h_support",
      category: "market_context",
      tone: "strength",
      title: `Entry had nearby ${levelPhrase(
        "support",
        context.firstEntryNearestSupportStrengthBucket ?? null,
        context.firstEntryNearestSupportSourceStrengthLabel ?? null,
      )}`,
      summary:
        "The first entry had nearby graded higher-timeframe support context instead of floating without obvious structure below.",
      evidence: [
        `nearestSupport=${price(context.firstEntryNearestSupportBelowPrice)}`,
        `distanceToSupport=${pctPoints(context.firstEntryDistanceToNearestSupportPct)}`,
        ...levelStrengthEvidence({
          prefix: "nearestSupport",
          bucket: context.firstEntryNearestSupportStrengthBucket ?? null,
          sourceStrengthLabel:
            context.firstEntryNearestSupportSourceStrengthLabel ?? null,
          score: context.firstEntryNearestSupportScore ?? null,
          reactionStrength:
            context.firstEntryNearestSupportReactionStrength ?? null,
        }),
      ],
    });
  }

  if (isShort && shortEntryNearSupport) {
    pushUniqueInsight(insights, {
      id: "short_entry_near_daily_4h_support",
      category: "market_context",
      tone: "risk",
      title: `Short entry was close to ${levelPhrase(
        "support",
        context.firstEntryNearestSupportStrengthBucket ?? null,
        context.firstEntryNearestSupportSourceStrengthLabel ?? null,
      )}`,
      summary:
        "For a short, nearby higher-timeframe support can limit clean downside room from the first fill.",
      evidence: [
        "tradeDirection=short",
        `nearestSupport=${price(context.firstEntryNearestSupportBelowPrice)}`,
        `distanceToSupport=${pctPoints(context.firstEntryDistanceToNearestSupportPct)}`,
        ...levelStrengthEvidence({
          prefix: "nearestSupport",
          bucket: context.firstEntryNearestSupportStrengthBucket ?? null,
          sourceStrengthLabel:
            context.firstEntryNearestSupportSourceStrengthLabel ?? null,
          score: context.firstEntryNearestSupportScore ?? null,
          reactionStrength:
            context.firstEntryNearestSupportReactionStrength ?? null,
        }),
      ],
    });
  }

  if (
    !isShort &&
    !context.firstEntryOccurredNearSupport &&
    (context.firstEntryOccurredInOpenAir ||
      (context.firstEntryDistanceToNearestSupportPct !== null &&
        context.firstEntryDistanceToNearestSupportPct >= 2))
  ) {
    pushUniqueInsight(insights, {
      id: "entry_far_from_daily_4h_support",
      category: "market_context",
      tone: "risk",
      title: "Entry was not close to support",
      summary:
        "Daily/4h context was present, but the first fill was not sitting on nearby support, so the entry had less structural cushion underneath it.",
      evidence: [
        `nearestSupport=${price(context.firstEntryNearestSupportBelowPrice)}`,
        `distanceToSupport=${pctPoints(context.firstEntryDistanceToNearestSupportPct)}`,
        `occurredInOpenAir=${context.firstEntryOccurredInOpenAir}`,
        ...levelStrengthEvidence({
          prefix: "nearestSupport",
          bucket: context.firstEntryNearestSupportStrengthBucket ?? null,
          sourceStrengthLabel:
            context.firstEntryNearestSupportSourceStrengthLabel ?? null,
          score: context.firstEntryNearestSupportScore ?? null,
          reactionStrength:
            context.firstEntryNearestSupportReactionStrength ?? null,
        }),
      ],
    });
  }

  if (
    isShort &&
    !shortEntryNearSupport &&
    (context.firstEntryOccurredInOpenAir ||
      (context.firstEntryDistanceToNearestSupportPct !== null &&
        context.firstEntryDistanceToNearestSupportPct >= 2))
  ) {
    pushUniqueInsight(insights, {
      id: "short_entry_had_room_to_support",
      category: "market_context",
      tone: "strength",
      title: "Short entry had room to daily/4h support",
      summary:
        "The first short entry had cleaner downside room before the nearest higher-timeframe support.",
      evidence: [
        "tradeDirection=short",
        `nearestSupport=${price(context.firstEntryNearestSupportBelowPrice)}`,
        `distanceToSupport=${pctPoints(context.firstEntryDistanceToNearestSupportPct)}`,
        `occurredInOpenAir=${context.firstEntryOccurredInOpenAir}`,
        ...levelStrengthEvidence({
          prefix: "nearestSupport",
          bucket: context.firstEntryNearestSupportStrengthBucket ?? null,
          sourceStrengthLabel:
            context.firstEntryNearestSupportSourceStrengthLabel ?? null,
          score: context.firstEntryNearestSupportScore ?? null,
          reactionStrength:
            context.firstEntryNearestSupportReactionStrength ?? null,
        }),
      ],
    });
  }

  if (!isShort && context.firstEntryHasStackedResistanceAbove) {
    pushUniqueInsight(insights, {
      id: "stacked_daily_4h_resistance_above_entry",
      category: "market_context",
      tone: "risk",
      title: "Resistance was stacked above the entry",
      summary:
        "Multiple higher-timeframe resistance levels were overhead, so continuation had more structure to work through.",
      evidence: [
        `resistanceLevelsAboveWithinClusterCount=${context.firstEntryResistanceLevelsAboveWithinClusterCount}`,
      ],
    });
  }

  if (!isShort && context.firstEntryHadRoomAboveAfterClearingResistance) {
    pushUniqueInsight(insights, {
      id: "breakout_had_room_above",
      category: "market_context",
      tone: "strength",
      title: "Breakout had room above",
      summary:
        "After clearing nearby resistance, the trade had enough higher-timeframe room to justify continuation risk.",
      evidence: [
        `roomToNearestResistance=${pctPoints(context.firstEntryDistanceToNearestResistancePct)}`,
      ],
    });
  }

  return insights;
}

function hasInsight(
  insights: TradeDecisionReviewInsight[],
  insightId: string,
): boolean {
  return insights.some((insight) => insight.id === insightId);
}

function getInsight(
  insights: TradeDecisionReviewInsight[],
  insightId: string,
): TradeDecisionReviewInsight | null {
  return insights.find((insight) => insight.id === insightId) ?? null;
}

function isGenericNoPrimaryBehaviorHeadline(headline: string): boolean {
  return headline
    .toLowerCase()
    .includes("did not produce a strong enough destructive behavior signal");
}

function isAddsAlignedHeadline(headline: string): boolean {
  return headline
    .toLowerCase()
    .includes("adds were aligned with strength rather than weakness");
}

function isExitLeftContinuationHeadline(headline: string): boolean {
  return headline
    .toLowerCase()
    .includes("exited winner potential too early");
}

function isProfitProtectionHeadline(headline: string): boolean {
  const lowerHeadline = headline.toLowerCase();

  return lowerHeadline.includes("profit protection failed") ||
    lowerHeadline.includes("profit protection was the main review issue");
}

function sentenceFromInsightTitle(title: string): string {
  const trimmed = title.trim();

  if (trimmed === "") {
    return "";
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function buildMarketAwareFallbackHeadline(
  insights: TradeDecisionReviewInsight[],
): string | null {
  const resistance = getInsight(insights, "entry_near_daily_4h_resistance");
  const shortSupport = getInsight(insights, "short_entry_near_daily_4h_support");
  const limitedRoom = hasInsight(
    insights,
    "entry_limited_clean_room_to_resistance",
  );
  const lateAdd = hasInsight(insights, "adds_after_trade_already_used_range");
  const weakAdd = hasInsight(insights, "adds_increased_risk_into_weakness");
  const failedProtection = hasInsight(insights, "profit_protection_failed");
  const continuationLeft = hasInsight(insights, "exit_left_continuation");

  if (resistance && limitedRoom && lateAdd) {
    return `${resistance.title}, the trade had limited clean room, and later adds increased size after much of the move was already used.`;
  }

  if (resistance && limitedRoom) {
    return `${resistance.title} with limited clean room.`;
  }

  if (shortSupport) {
    return `${shortSupport.title}, so downside room was limited.`;
  }

  if (lateAdd) {
    return "Adds increased size after much of the move was already used.";
  }

  if (weakAdd) {
    return "Adds increased risk into weakness.";
  }

  if (failedProtection) {
    return "Profit protection was the main review issue.";
  }

  if (continuationLeft) {
    return "The exit left useful continuation behind.";
  }

  const firstRisk = insights.find((insight) => insight.tone === "risk");

  if (firstRisk?.id === "entry_far_from_daily_4h_support") {
    return "Entry was not close to daily/4h support.";
  }

  if (firstRisk) {
    return sentenceFromInsightTitle(firstRisk.title);
  }

  return insights.some((insight) => insight.tone === "strength")
    ? "Execution was structured and disciplined through the trade."
    : null;
}

function selectReviewFixFirstBehaviorId(args: {
  defaultFixFirstBehaviorId: string | null;
  insights: TradeDecisionReviewInsight[];
}): string | null {
  if (
    args.defaultFixFirstBehaviorId === "poor_profit_protection" &&
    !hasInsight(args.insights, "profit_protection_failed")
  ) {
    if (hasInsight(args.insights, "adds_increased_risk_into_weakness")) {
      return "adding_into_weakness";
    }

    return null;
  }

  if (
    args.defaultFixFirstBehaviorId !== "premature_exit" ||
    hasInsight(args.insights, "exit_left_continuation")
  ) {
    return args.defaultFixFirstBehaviorId;
  }

  if (hasInsight(args.insights, "profit_protection_failed")) {
    return "poor_profit_protection";
  }

  if (hasInsight(args.insights, "adds_increased_risk_into_weakness")) {
    return "adding_into_weakness";
  }

  return null;
}

function selectCoachingHeadline(args: {
  defaultHeadline: string;
  insights: TradeDecisionReviewInsight[];
}): string {
  const fallback = buildMarketAwareFallbackHeadline(args.insights);
  const hasResistanceLimitedRoomRisk =
    hasInsight(args.insights, "entry_near_daily_4h_resistance") &&
    hasInsight(args.insights, "entry_limited_clean_room_to_resistance");
  const hasCombinedMarketAndScalingRisk =
    hasResistanceLimitedRoomRisk &&
    hasInsight(args.insights, "adds_after_trade_already_used_range");

  if (fallback && (hasCombinedMarketAndScalingRisk || hasResistanceLimitedRoomRisk)) {
    return fallback;
  }

  if (
    fallback &&
    isAddsAlignedHeadline(args.defaultHeadline) &&
    !hasInsight(args.insights, "adds_aligned_with_strength")
  ) {
    return fallback;
  }

  if (
    fallback &&
    isExitLeftContinuationHeadline(args.defaultHeadline) &&
    !hasInsight(args.insights, "exit_left_continuation")
  ) {
    return fallback;
  }

  if (
    fallback &&
    isProfitProtectionHeadline(args.defaultHeadline) &&
    !hasInsight(args.insights, "profit_protection_failed")
  ) {
    return fallback;
  }

  if (
    fallback &&
    (args.defaultHeadline.trim().length === 0 ||
      isGenericNoPrimaryBehaviorHeadline(args.defaultHeadline))
  ) {
    return fallback;
  }

  return args.defaultHeadline;
}

function shouldSuppressInsight(
  insight: TradeDecisionReviewInsight,
  insightIds: Set<string>,
): boolean {
  if (
    insight.id === "adds_aligned_with_strength" &&
    (insightIds.has("adds_increased_risk_into_weakness") ||
      insightIds.has("adds_after_trade_already_used_range") ||
      insightIds.has("adds_near_daily_4h_resistance") ||
      insightIds.has("short_adds_near_daily_4h_support"))
  ) {
    return true;
  }

  return false;
}

function insightPriority(insight: TradeDecisionReviewInsight): number {
  const explicitPriority: Record<string, number> = {
    entry_near_daily_4h_resistance: 10,
    short_entry_near_daily_4h_support: 10,
    entry_limited_clean_room_to_resistance: 11,
    stacked_daily_4h_resistance_above_entry: 12,
    entry_far_from_daily_4h_support: 13,
    adds_after_trade_already_used_range: 20,
    adds_increased_risk_into_weakness: 21,
    adds_near_daily_4h_resistance: 22,
    short_adds_near_daily_4h_support: 22,
    profit_protection_failed: 30,
    exit_left_continuation: 31,
    entry_chase_or_late_extension: 40,
    entry_breakout_failed: 41,
    entry_near_daily_4h_support: 60,
    breakout_had_room_above: 61,
    short_entry_had_room_to_support: 61,
    short_entry_had_nearby_daily_4h_resistance: 62,
    adds_above_resistance_with_room: 62,
    entry_had_constructive_location: 70,
    exit_captured_trade_well: 71,
    trade_window_excursion_measured: 90,
  };

  return explicitPriority[insight.id] ?? (insight.tone === "risk" ? 50 : 80);
}

function prioritizeDecisionReviewInsights(
  insights: TradeDecisionReviewInsight[],
): TradeDecisionReviewInsight[] {
  const insightIds = new Set(insights.map((insight) => insight.id));

  return insights
    .filter((insight) => !shouldSuppressInsight(insight, insightIds))
    .sort((left, right) => insightPriority(left) - insightPriority(right));
}

function buildEntryInsights(
  result: AppTradeAnalysisResult,
): TradeDecisionReviewInsight[] {
  const insights: TradeDecisionReviewInsight[] = [];
  const entry = result.patternInput.entryContext;

  if (
    hasAnyPattern(result, [
      "overextended_chase_entry_structure",
      "breakout_chase_entry_structure",
      "market_open_breakout_chase_entry_structure",
      "opening_range_breakout_chase_entry_structure",
      "late_favorable_extension_entry_structure",
    ])
  ) {
    insights.push({
      id: "entry_chase_or_late_extension",
      category: "entry",
      tone: "risk",
      title: "Entry had chase/late-extension risk",
      summary:
        "The entry evidence points to participation after extension rather than from a clearly advantaged location.",
      evidence: [
        `firstEntryRecentRunUpPctBeforeEntry=${pct(entry.firstEntryRecentRunUpPctBeforeEntry)}`,
        `firstEntryCapturedPercentOfTradeMfe=${pct(entry.firstEntryCapturedPercentOfTradeMfe)}`,
      ],
    });
  }

  if (
    hasAnyPattern(result, [
      "advantaged_entry_structure",
      "constructive_pullback_entry_structure",
      "disciplined_favorable_extension_entry_structure",
      "entry_with_favorable_remaining_upside",
    ])
  ) {
    insights.push({
      id: "entry_had_constructive_location",
      category: "entry",
      tone: "strength",
      title: "Entry had constructive location evidence",
      summary:
        "The entry left meaningful room for the trade to work and did not rely only on chasing the end of the move.",
      evidence: [
        `firstEntryToPeakMovePct=${pct(entry.firstEntryToPeakMovePct)}`,
        `firstEntryCapturedPercentOfTradeMfe=${pct(entry.firstEntryCapturedPercentOfTradeMfe)}`,
      ],
    });
  }

  if (hasAnyPattern(result, ["failed_breakout_entry_structure"])) {
    insights.push({
      id: "entry_breakout_failed",
      category: "entry",
      tone: "risk",
      title: "Breakout attempt failed",
      summary:
        "The trade had breakout-style participation, but the follow-through did not hold after entry.",
      evidence: ["matchedPattern=failed_breakout_entry_structure"],
    });
  }

  return insights;
}

function buildScalingInsights(
  result: AppTradeAnalysisResult,
): TradeDecisionReviewInsight[] {
  const input = result.patternInput;
  const scaling = input.scalingContext;
  const supportResistance = input.supportResistanceContext;
  const insights: TradeDecisionReviewInsight[] = [];
  const isShort = input.tradeDirection === "short";

  if (
    hasAnyPattern(result, [
      "underutilized_position_building",
      "underutilized_winner_with_premature_final_exit",
      "recovery_to_underutilized_winner_with_premature_final_exit",
      "underutilized_winner_with_missed_final_continuation",
      "recovery_to_underutilized_winner_with_missed_final_continuation",
    ])
  ) {
    insights.push({
      id: "winner_stayed_undersized",
      category: "scaling",
      tone: "risk",
      title: "Winner stayed undersized",
      summary:
        "The trade produced meaningful favorable movement, but position building stayed limited relative to the opportunity.",
      evidence: [
        `totalPositionIncreaseCount=${input.tradeStructure.totalPositionIncreaseCount}`,
        `winnerOpportunityMovePct=${pct(input.tradeStructure.tradeMfePct)}`,
      ],
    });
  }

  if (scaling.addCountAfterInitialEntry <= 0) {
    return insights;
  }

  if (
    hasAnyPattern(result, [
      "add_into_weakness",
      "add_after_recent_drop",
      "revenge_adding_after_weakness",
      "aggressive_adding_with_failed_profit_protection",
    ])
  ) {
    insights.push({
      id: "adds_increased_risk_into_weakness",
      category: "scaling",
      tone: "risk",
      title: "Adds increased risk into weakness",
      summary:
        "The trade added size after adverse movement instead of waiting for the trade to repair first.",
      evidence: [
        `addCountAfterInitialEntry=${scaling.addCountAfterInitialEntry}`,
        `addsWithRecentDropCount=${scaling.addsWithRecentDropCount}`,
        `averageAddRecentDropPctBeforeExecution=${pct(scaling.averageAddRecentDropPctBeforeExecution)}`,
      ],
    });
  }

  if (
    hasAnyPattern(result, [
      "add_into_strength",
      "add_after_recent_run_up",
      "adding_above_prior_basis",
    ])
  ) {
    insights.push({
      id: "adds_aligned_with_strength",
      category: "scaling",
      tone: "strength",
      title: "Adds aligned with strength",
      summary:
        "The add evidence shows size increases happening after constructive movement instead of only after weakness.",
      evidence: [
        `addCountAfterInitialEntry=${scaling.addCountAfterInitialEntry}`,
        `addsWithRecentRunUpCount=${scaling.addsWithRecentRunUpCount}`,
        `averageAddRecentRunUpPctBeforeExecution=${pct(scaling.averageAddRecentRunUpPctBeforeExecution)}`,
      ],
    });
  }

  if (
    scaling.averageAddPricePositionInRecentRangePct !== null &&
    scaling.averageAddPricePositionInRecentRangePct >= 0.7
  ) {
    insights.push({
      id: "adds_after_trade_already_used_range",
      category: "scaling",
      tone: "risk",
      title: "Adds came after much of the move was already used",
      summary:
        "The later add price sat high in the recent range, so extra size was added after the trade had already consumed a large part of its available move.",
      evidence: [
        `averageAddPricePositionInRecentRangePct=${pct(scaling.averageAddPricePositionInRecentRangePct)}`,
        `tradeMfePct=${pct(input.tradeStructure.tradeMfePct)}`,
      ],
    });
  }

  if (!isShort && supportResistance.addsNearResistanceCount > 0) {
    insights.push({
      id: "adds_near_daily_4h_resistance",
      category: "scaling",
      tone: "risk",
      title: "Adds happened near daily/4h resistance",
      summary:
        "One or more adds increased size while price was near higher-timeframe resistance.",
      evidence: [
        `addsNearResistanceCount=${supportResistance.addsNearResistanceCount}`,
        `averageAddDistanceToNearestResistancePct=${pctPoints(supportResistance.averageAddDistanceToNearestResistancePct)}`,
      ],
    });
  }

  if (isShort && supportResistance.addsNearSupportCount > 0) {
    insights.push({
      id: "short_adds_near_daily_4h_support",
      category: "scaling",
      tone: "risk",
      title: "Short adds happened near daily/4h support",
      summary:
        "One or more adds increased short size while price was near higher-timeframe support.",
      evidence: [
        "tradeDirection=short",
        `addsNearSupportCount=${supportResistance.addsNearSupportCount}`,
        `averageAddDistanceToNearestSupportPct=${pctPoints(supportResistance.averageAddDistanceToNearestSupportPct)}`,
      ],
    });
  }

  if (!isShort && supportResistance.addsAboveResistanceWithRoomCount > 0) {
    insights.push({
      id: "adds_above_resistance_with_room",
      category: "scaling",
      tone: "strength",
      title: "Some adds cleared resistance with room",
      summary:
        "At least one add happened after resistance was cleared and still had room to the next higher-timeframe level.",
      evidence: [
        `addsAboveResistanceWithRoomCount=${supportResistance.addsAboveResistanceWithRoomCount}`,
        `averageAddRoomToNextResistancePct=${pctPoints(supportResistance.averageAddRoomToNextResistancePct)}`,
      ],
    });
  }

  return insights;
}

function buildExitInsights(
  result: AppTradeAnalysisResult,
): TradeDecisionReviewInsight[] {
  const exit = result.patternInput.exitContext;
  const insights: TradeDecisionReviewInsight[] = [];
  const maxNormalPostExitContinuationRatio = 0.05;
  const hasPlausiblePostExitContinuation =
    exit.maxFavorableMovePctAfterExit === null ||
    Math.abs(exit.maxFavorableMovePctAfterExit) <=
      maxNormalPostExitContinuationRatio;

  if (
    hasPlausiblePostExitContinuation &&
    hasAnyPattern(result, [
      "premature_final_exit_after_constructive_management",
      "missed_post_exit_continuation",
      "balanced_management_with_premature_final_exit",
      "underutilized_winner_with_premature_final_exit",
      "underutilized_winner_with_missed_final_continuation",
    ])
  ) {
    insights.push({
      id: "exit_left_continuation",
      category: "exit",
      tone: "risk",
      title: "Exit left continuation behind",
      summary:
        "The exit evidence shows useful trade potential remained after the final exit.",
      evidence: [
        `maxFavorableMovePctAfterExit=${pct(exit.maxFavorableMovePctAfterExit)}`,
        `favorableExcursionLeftOnTablePct=${pct(exit.favorableExcursionLeftOnTablePct)}`,
      ],
    });
  }

  const exitHadPositiveCapture =
    exit.realizedCapturePercentOfTradeMfe !== null &&
    exit.realizedCapturePercentOfTradeMfe >= 0.6;

  if (
    exitHadPositiveCapture &&
    hasAnyPattern(result, [
      "high_capture_exit_structure",
      "exit_near_favorable_extreme",
      "exit_with_limited_giveback",
      "timely_profit_protection_with_constructive_final_exit",
      "balanced_management_with_constructive_exit",
    ])
  ) {
    insights.push({
      id: "exit_captured_trade_well",
      category: "exit",
      tone: "strength",
      title: "Exit captured the trade well",
      summary:
        "The exit evidence shows strong capture and limited giveback relative to the trade's available move.",
      evidence: [
        `realizedCapturePercentOfTradeMfe=${pct(exit.realizedCapturePercentOfTradeMfe)}`,
        `finalExitToPeakDistancePct=${pct(exit.finalExitToPeakDistancePct)}`,
      ],
    });
  }

  if (
    !exitHadPositiveCapture &&
    hasAnyPattern(result, [
      "failed_profit_protection_structure",
      "peak_profit_giveback_structure",
      "delayed_risk_response_with_failed_profit_protection",
    ])
  ) {
    insights.push({
      id: "profit_protection_failed",
      category: "exit",
      tone: "risk",
      title: "Profit protection failed",
      summary:
        "The trade gave back too much available open profit before risk was reduced or closed.",
      evidence: [
        `realizedCapturePercentOfTradeMfe=${pct(exit.realizedCapturePercentOfTradeMfe)}`,
      ],
    });
  }

  return insights;
}

function buildTradeWindowInsights(
  result: AppTradeAnalysisResult,
): TradeDecisionReviewInsight[] {
  const input = result.patternInput;
  const insights: TradeDecisionReviewInsight[] = [];

  if (
    input.tradeStructure.tradeMfePct !== null ||
    input.tradeStructure.tradeMaePct !== null
  ) {
    insights.push({
      id: "trade_window_excursion_measured",
      category: "trade_window",
      tone: "neutral",
      title: "Trade-window movement was measured",
      summary:
        "The review has bounded trade-window evidence for favorable and adverse movement during the hold.",
      evidence: [
        `tradeMfePct=${pct(input.tradeStructure.tradeMfePct)}`,
        `tradeMaePct=${pct(input.tradeStructure.tradeMaePct)}`,
      ],
    });
  }

  return insights;
}

export function buildTradeDecisionReview(
  result: AppTradeAnalysisResult,
): TradeDecisionReview {
  const scoringInput = buildPatternScoringInput(result.normalizedPatterns);
  const scoringResult = buildPatternScoringResult(scoringInput);
  const feedback = buildTradeFeedbackFromScoring(
    scoringInput,
    scoringResult,
    undefined,
    {
      tradeIndex: 0,
      sessionBucket: result.rawTradeTimeline.timeline.sessionContext.sessionBucket,
    },
  );
  const input = result.patternInput;
  const supportResistance = input.supportResistanceContext;
  const insights = prioritizeDecisionReviewInsights([
    ...buildMarketContextInsights(result),
    ...buildEntryInsights(result),
    ...buildScalingInsights(result),
    ...buildExitInsights(result),
    ...buildTradeWindowInsights(result),
  ]);
  const coachingHeadline = selectCoachingHeadline({
    defaultHeadline: feedback.coachingOutput.headline,
    insights,
  });
  const fixFirstBehaviorId = selectReviewFixFirstBehaviorId({
    defaultFixFirstBehaviorId:
      feedback.coachingOutput.fixFirst?.behaviorId ?? null,
    insights,
  });

  return {
    contractVersion: "trade_decision_review_v1",
    generatedFrom: {
      normalizedPatterns: true,
      patternScoring: true,
      behaviorCoaching: true,
      dailyFourHourLevelsOnly: true,
      vwapEmaFeedbackUsed: false,
    },
    score: {
      overallScore: scoringResult.overallScore,
      scoreBand: scoringResult.scoreBand,
      confidence: scoringResult.summary.confidence,
      dominantFamily: scoringResult.summary.dominantFamily,
    },
    coaching: {
      headline: coachingHeadline,
      coreIssue: feedback.coachingOutput.coreIssue,
      whatWentWrongOrRight: feedback.coachingOutput.whatWentWrongOrRight,
      whatToChangeNextTime: feedback.coachingOutput.whatToChangeNextTime,
      fixFirstBehaviorId,
      fixNextBehaviorId: feedback.coachingOutput.fixNext?.behaviorId ?? null,
      mostImportantMistakeId:
        feedback.coachingOutput.mostImportantMistake?.behaviorId ?? null,
      mostImportantStrengthId:
        feedback.coachingOutput.mostImportantStrength?.behaviorId ?? null,
    },
    marketContext: {
      usedForReview: supportResistance.hadSupportResistanceContextAvailable,
      source: supportResistance.hadSupportResistanceContextAvailable
        ? "levels_system_daily_4h"
        : "none",
      nearestSupportPrice:
        supportResistance.firstEntryNearestSupportBelowPrice,
      nearestResistancePrice:
        supportResistance.firstEntryNearestResistanceAbovePrice ??
        supportResistance.firstEntryNearestResistanceBelowPrice,
      nearestSupportStrengthBucket:
        supportResistance.firstEntryNearestSupportStrengthBucket ?? null,
      nearestResistanceStrengthBucket:
        supportResistance.firstEntryNearestResistanceStrengthBucket ?? null,
      nearestSupportSourceStrengthLabel:
        supportResistance.firstEntryNearestSupportSourceStrengthLabel ?? null,
      nearestResistanceSourceStrengthLabel:
        supportResistance.firstEntryNearestResistanceSourceStrengthLabel ?? null,
      nearestSupportScore:
        supportResistance.firstEntryNearestSupportScore ?? null,
      nearestResistanceScore:
        supportResistance.firstEntryNearestResistanceScore ?? null,
      distanceToNearestSupportPct:
        supportResistance.firstEntryDistanceToNearestSupportPct,
      distanceToNearestResistancePct:
        supportResistance.firstEntryDistanceToNearestResistancePct,
      roomToNearestResistancePct:
        supportResistance.firstEntryDistanceToNearestResistancePct,
      occurredInOpenAir: supportResistance.firstEntryOccurredInOpenAir,
      hadSupportResistanceContextAvailable:
        supportResistance.hadSupportResistanceContextAvailable,
    },
    tradeWindow: {
      tradeMfePct: input.tradeStructure.tradeMfePct,
      tradeMaePct: input.tradeStructure.tradeMaePct,
      peakPriceDuringTrade: input.tradeStructure.peakPriceDuringTrade,
      worstPriceDuringTrade: input.tradeStructure.worstPriceDuringTrade,
      maxFavorableMovePctAfterExit:
        input.exitContext.maxFavorableMovePctAfterExit,
      maxAdverseMovePctAfterExit:
        input.exitContext.maxAdverseMovePctAfterExit,
    },
    insights,
  };
}
