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

export type TradeDecisionReviewInsightTone = "strength" | "risk" | "neutral";

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

function hasPattern(
  result: AppTradeAnalysisResult,
  patternId: string,
): boolean {
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
      title: `Entry started just below ${levelPhrase(
        "resistance",
        context.firstEntryNearestResistanceStrengthBucket ?? null,
        context.firstEntryNearestResistanceSourceStrengthLabel ?? null,
      )}`,
      summary:
        "The first entry started just below a graded higher-timeframe resistance area, so the trade needed proof it had enough room to continue.",
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
      title: "Entry had limited room before overhead resistance",
      summary: `The nearest ${levelPhrase(
        "resistance",
        context.firstEntryNearestResistanceStrengthBucket ?? null,
        context.firstEntryNearestResistanceSourceStrengthLabel ?? null,
      )} was close above the first fill, so upside space was limited unless price could clear that area.`,
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
      title: `Entry started near ${levelPhrase(
        "support",
        context.firstEntryNearestSupportStrengthBucket ?? null,
        context.firstEntryNearestSupportSourceStrengthLabel ?? null,
      )} below`,
      summary:
        "The first entry had graded higher-timeframe support underneath instead of floating without obvious structure below.",
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
      title: "Entry had little support underneath",
      summary:
        "Daily/4h context was present, but the first fill was not sitting near support below, so the entry had less structural cushion underneath it.",
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
      title: "Resistance was stacked overhead",
      summary:
        "Multiple higher-timeframe resistance levels were above the entry, so continuation had more structure to work through than a single nearby level.",
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
  return headline.toLowerCase().includes("exited winner potential too early");
}

function isProfitProtectionHeadline(headline: string): boolean {
  const lowerHeadline = headline.toLowerCase();

  return (
    lowerHeadline.includes("profit protection failed") ||
    lowerHeadline.includes("profit protection was the main review issue") ||
    lowerHeadline.includes("open profit was not protected")
  );
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
  const shortSupport = getInsight(
    insights,
    "short_entry_near_daily_4h_support",
  );
  const limitedRoom = hasInsight(
    insights,
    "entry_limited_clean_room_to_resistance",
  );
  const lateAdd = hasInsight(insights, "adds_after_trade_already_used_range");
  const weakAdd = hasInsight(insights, "adds_increased_risk_into_weakness");
  const failedProtection = hasInsight(insights, "profit_protection_failed");
  const protectedBeforeFade = hasInsight(
    insights,
    "protected_profit_before_fade",
  );
  const continuationLeft = hasInsight(insights, "exit_left_continuation");
  const avoidedFade = hasInsight(
    insights,
    "exit_avoided_adverse_followthrough",
  );
  const resistanceReversal = hasInsight(
    insights,
    "exit_into_resistance_with_reversal_after_exit",
  );
  const resistanceBreakout = hasInsight(
    insights,
    "exit_into_resistance_before_breakout",
  );
  const supportBreakdown = hasInsight(
    insights,
    "exit_into_support_before_breakdown",
  );

  if (resistance && limitedRoom && lateAdd) {
    return `${resistance.title}, the trade had limited room before overhead resistance, and later adds increased size after much of the move was already used.`;
  }

  if (resistance && limitedRoom) {
    return `${resistance.title} with limited room before overhead resistance.`;
  }

  if (shortSupport) {
    return `${shortSupport.title}, so downside room was limited.`;
  }

  if (lateAdd) {
    return "Adds increased size after much of the move was already used.";
  }

  if (weakAdd) {
    return "Adds happened before the trade repaired.";
  }

  if (failedProtection) {
    return "Open profit was not protected.";
  }

  if (protectedBeforeFade) {
    return "Profit was protected before the later fade.";
  }

  if (resistanceBreakout) {
    return "The exit came before resistance broke.";
  }

  if (continuationLeft) {
    return "The exit left useful continuation behind.";
  }

  if (resistanceReversal) {
    return "The exit protected profit near resistance.";
  }

  if (supportBreakdown || avoidedFade) {
    return "The exit avoided a later fade.";
  }

  const firstRisk = insights.find((insight) => insight.tone === "risk");

  if (firstRisk?.id === "entry_far_from_daily_4h_support") {
    return "Entry had little daily/4h support underneath.";
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
    hasInsight(args.insights, "exit_left_continuation") ||
    hasInsight(args.insights, "exit_into_resistance_before_breakout")
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

  if (
    fallback &&
    (hasCombinedMarketAndScalingRisk || hasResistanceLimitedRoomRisk)
  ) {
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
    insight.id === "exit_avoided_adverse_followthrough" &&
    insightIds.has("protected_profit_before_fade")
  ) {
    return true;
  }

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
    exit_into_resistance_before_breakout: 32,
    exit_needs_post_exit_context: 33,
    exit_large_post_exit_move_needs_review: 34,
    exit_into_support_with_relief_after_exit: 35,
    protected_profit_before_fade: 70,
    balanced_management_with_constructive_exit: 75,
    add_into_strength_with_constructive_final_exit: 76,
    entry_chase_or_late_extension: 40,
    entry_breakout_failed: 41,
    entry_near_daily_4h_support: 60,
    breakout_had_room_above: 61,
    short_entry_had_room_to_support: 61,
    short_entry_had_nearby_daily_4h_resistance: 62,
    adds_above_resistance_with_room: 62,
    reductions_near_resistance: 63,
    entry_had_constructive_location: 70,
    exit_captured_trade_well: 71,
    exit_avoided_adverse_followthrough: 72,
    exit_into_resistance_with_reversal_after_exit: 73,
    exit_into_support_before_breakdown: 74,
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
      title: "Entry came after the move was extended",
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
      title: "Breakout did not hold",
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
      title: "Winner stayed too small",
      summary:
        "The trade produced meaningful favorable movement, but position building stayed limited relative to the opportunity.",
      evidence: [
        `totalPositionIncreaseCount=${input.tradeStructure.totalPositionIncreaseCount}`,
        `winnerOpportunityMovePct=${pct(input.tradeStructure.tradeMfePct)}`,
      ],
    });
  }

  if (!isShort && supportResistance.reductionsNearResistanceCount > 0) {
    insights.push({
      id: "reductions_near_resistance",
      category: "scaling",
      tone: "strength",
      title: "Reduced size near daily/4h resistance",
      summary:
        "One or more reductions took size off while price was near higher-timeframe resistance.",
      evidence: [
        `reductionsNearResistanceCount=${supportResistance.reductionsNearResistanceCount}`,
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
      title: "Added before the trade repaired",
      summary:
        "The trade added size after adverse movement, and the chart evidence did not show a clear repair before size increased.",
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
  const input = result.patternInput;
  const exit = input.exitContext;
  const supportResistance = input.supportResistanceContext;
  const insights: TradeDecisionReviewInsight[] = [];
  const isShort = input.tradeDirection === "short";
  const maxNormalPostExitContinuationRatio = 0.05;
  const maxFavorableMoveAfterExit = exit.maxFavorableMovePctAfterExit;
  const hasPrematureExitPattern = hasAnyPattern(result, [
    "premature_final_exit_after_constructive_management",
    "missed_post_exit_continuation",
    "balanced_management_with_premature_final_exit",
    "underutilized_winner_with_premature_final_exit",
    "underutilized_winner_with_missed_final_continuation",
  ]);
  const hasPostExitContinuationEvidence =
    exit.postExitCandleCount > 0 &&
    maxFavorableMoveAfterExit !== null &&
    Number.isFinite(maxFavorableMoveAfterExit);
  const hasPlausiblePostExitContinuation =
    hasPostExitContinuationEvidence &&
    Math.abs(maxFavorableMoveAfterExit ?? Number.POSITIVE_INFINITY) <=
      maxNormalPostExitContinuationRatio;

  if (hasPrematureExitPattern && hasPlausiblePostExitContinuation) {
    insights.push({
      id: "exit_left_continuation",
      category: "exit",
      tone: "risk",
      title: "Exit came before more continuation",
      summary:
        "The exit evidence shows useful trade potential remained after the final exit.",
      evidence: [
        `maxFavorableMovePctAfterExit=${pct(exit.maxFavorableMovePctAfterExit)}`,
        `favorableExcursionLeftOnTablePct=${pct(exit.favorableExcursionLeftOnTablePct)}`,
        `postExitCandleCount=${exit.postExitCandleCount}`,
        `netMovePctAtEndOfPostExitWindow=${pct(exit.netMovePctAtEndOfPostExitWindow)}`,
      ],
    });
  } else if (hasPrematureExitPattern && !hasPostExitContinuationEvidence) {
    insights.push({
      id: "exit_needs_post_exit_context",
      category: "exit",
      tone: "neutral",
      title: "Exit needs after-exit chart check",
      summary:
        "The execution pattern makes the exit worth reviewing, but after-exit candles are not available enough to prove continuation.",
      evidence: [
        `postExitCandleCount=${exit.postExitCandleCount}`,
        `maxFavorableMovePctAfterExit=${pct(exit.maxFavorableMovePctAfterExit)}`,
        `favorableExcursionLeftOnTablePct=${pct(exit.favorableExcursionLeftOnTablePct)}`,
      ],
    });
  } else if (hasPrematureExitPattern) {
    insights.push({
      id: "exit_large_post_exit_move_needs_review",
      category: "exit",
      tone: "neutral",
      title: "Large after-exit move needs review",
      summary:
        "The after-exit move was larger than the current calibrated safe range, so the app should prompt review instead of making a confident continuation claim.",
      evidence: [
        `postExitCandleCount=${exit.postExitCandleCount}`,
        `maxFavorableMovePctAfterExit=${pct(exit.maxFavorableMovePctAfterExit)}`,
        `netMovePctAtEndOfPostExitWindow=${pct(exit.netMovePctAtEndOfPostExitWindow)}`,
        `calibratedSafePostExitMovePct=${pct(maxNormalPostExitContinuationRatio)}`,
      ],
    });
  }

  if (
    !isShort &&
    hasAnyPattern(result, [
      "exit_avoided_adverse_followthrough",
      "disciplined_defensive_exit",
    ])
  ) {
    pushUniqueInsight(insights, {
      id: "exit_avoided_adverse_followthrough",
      category: "exit",
      tone: "strength",
      title: "Exit avoided a later fade",
      summary:
        "After the final exit, the after-exit chart moved against the trade more than it continued.",
      evidence: [
        `maxAdverseMovePctAfterExit=${pct(exit.maxAdverseMovePctAfterExit)}`,
        `maxFavorableMovePctAfterExit=${pct(exit.maxFavorableMovePctAfterExit)}`,
        `netMovePctAtEndOfPostExitWindow=${pct(exit.netMovePctAtEndOfPostExitWindow)}`,
        `postExitCandleCount=${exit.postExitCandleCount}`,
      ],
    });
  }

  if (
    !isShort &&
    hasAnyPattern(result, [
      "exit_into_resistance_with_reversal_after_exit",
      "stabilized_recovery_with_exit_into_resistance_and_reversal",
    ])
  ) {
    pushUniqueInsight(insights, {
      id: "exit_into_resistance_with_reversal_after_exit",
      category: "exit",
      tone: "strength",
      title: "Exit protected profit near resistance",
      summary:
        "The final exit happened near higher-timeframe resistance and the after-exit chart reversed instead of continuing cleanly.",
      evidence: [
        `finalExitOccurredNearResistance=${supportResistance.finalExitOccurredNearResistance}`,
        `finalExitDistanceToNearestResistancePct=${pctPoints(supportResistance.finalExitDistanceToNearestResistancePct)}`,
        `maxAdverseMovePctAfterExit=${pct(exit.maxAdverseMovePctAfterExit)}`,
        `netMovePctAtEndOfPostExitWindow=${pct(exit.netMovePctAtEndOfPostExitWindow)}`,
      ],
    });
  }

  if (
    !isShort &&
    hasAnyPattern(result, [
      "exit_into_resistance_before_breakout",
      "stabilized_recovery_with_exit_into_resistance_before_breakout",
    ])
  ) {
    pushUniqueInsight(insights, {
      id: "exit_into_resistance_before_breakout",
      category: "exit",
      tone: "risk",
      title: "Exit came before resistance broke",
      summary:
        "The final exit happened near resistance, then the after-exit chart cleared or continued through that area.",
      evidence: [
        `finalExitOccurredNearResistance=${supportResistance.finalExitOccurredNearResistance}`,
        `finalExitDistanceToNearestResistancePct=${pctPoints(supportResistance.finalExitDistanceToNearestResistancePct)}`,
        `maxFavorableMovePctAfterExit=${pct(exit.maxFavorableMovePctAfterExit)}`,
        `netMovePctAtEndOfPostExitWindow=${pct(exit.netMovePctAtEndOfPostExitWindow)}`,
      ],
    });
  }

  if (
    !isShort &&
    hasAnyPattern(result, [
      "exit_into_support_before_breakdown",
      "exit_into_thin_support_before_breakdown",
      "stabilized_recovery_with_exit_into_thin_support_before_breakdown",
    ])
  ) {
    pushUniqueInsight(insights, {
      id: "exit_into_support_before_breakdown",
      category: "exit",
      tone: "strength",
      title: "Exit avoided a support break",
      summary:
        "The final exit happened near support before the after-exit chart broke lower.",
      evidence: [
        `finalExitOccurredNearSupport=${supportResistance.finalExitOccurredNearSupport}`,
        `finalExitDistanceToNearestSupportPct=${pctPoints(supportResistance.finalExitDistanceToNearestSupportPct)}`,
        `maxAdverseMovePctAfterExit=${pct(exit.maxAdverseMovePctAfterExit)}`,
        `netMovePctAtEndOfPostExitWindow=${pct(exit.netMovePctAtEndOfPostExitWindow)}`,
      ],
    });
  }

  if (
    !isShort &&
    hasAnyPattern(result, [
      "exit_into_support_with_relief_after_exit",
      "exit_into_stacked_support_with_relief_after_exit",
      "stabilized_recovery_with_exit_into_stacked_support_and_relief",
    ])
  ) {
    pushUniqueInsight(insights, {
      id: "exit_into_support_with_relief_after_exit",
      category: "exit",
      tone: "neutral",
      title: "Review the exit near support",
      summary:
        "The final exit happened near support and the after-exit chart later bounced, so the exit reason should be checked against the plan.",
      evidence: [
        `finalExitOccurredNearSupport=${supportResistance.finalExitOccurredNearSupport}`,
        `finalExitDistanceToNearestSupportPct=${pctPoints(supportResistance.finalExitDistanceToNearestSupportPct)}`,
        `maxFavorableMovePctAfterExit=${pct(exit.maxFavorableMovePctAfterExit)}`,
        `netMovePctAtEndOfPostExitWindow=${pct(exit.netMovePctAtEndOfPostExitWindow)}`,
      ],
    });
  }

  const exitHadPositiveCapture =
    exit.realizedCapturePercentOfTradeMfe !== null &&
    exit.realizedCapturePercentOfTradeMfe >= 0.6;
  const afterExitFadeWasMeasured =
    !isShort &&
    exit.postExitCandleCount > 0 &&
    exit.maxAdverseMovePctAfterExit !== null &&
    exit.maxFavorableMovePctAfterExit !== null &&
    exit.netMovePctAtEndOfPostExitWindow !== null &&
    Number.isFinite(exit.maxAdverseMovePctAfterExit) &&
    Number.isFinite(exit.maxFavorableMovePctAfterExit) &&
    Number.isFinite(exit.netMovePctAtEndOfPostExitWindow) &&
    exit.maxAdverseMovePctAfterExit > exit.maxFavorableMovePctAfterExit &&
    exit.netMovePctAtEndOfPostExitWindow <= 0;

  if (
    exitHadPositiveCapture &&
    afterExitFadeWasMeasured &&
    hasAnyPattern(result, [
      "high_capture_exit_structure",
      "exit_near_favorable_extreme",
      "exit_with_limited_giveback",
      "timely_profit_protection_with_constructive_final_exit",
      "balanced_management_with_constructive_exit",
      "exit_avoided_adverse_followthrough",
      "disciplined_defensive_exit",
    ])
  ) {
    pushUniqueInsight(insights, {
      id: "protected_profit_before_fade",
      category: "exit",
      tone: "strength",
      title: "Protected profit before the fade",
      summary:
        "The exit protected a meaningful part of the trade before the after-exit chart faded.",
      evidence: [
        `realizedCapturePercentOfTradeMfe=${pct(exit.realizedCapturePercentOfTradeMfe)}`,
        `finalExitToPeakDistancePct=${pct(exit.finalExitToPeakDistancePct)}`,
        `maxAdverseMovePctAfterExit=${pct(exit.maxAdverseMovePctAfterExit)}`,
        `maxFavorableMovePctAfterExit=${pct(exit.maxFavorableMovePctAfterExit)}`,
        `netMovePctAtEndOfPostExitWindow=${pct(exit.netMovePctAtEndOfPostExitWindow)}`,
        `postExitCandleCount=${exit.postExitCandleCount}`,
      ],
    });
  }

  if (
    exitHadPositiveCapture &&
    afterExitFadeWasMeasured &&
    hasAnyPattern(result, [
      "balanced_management_with_constructive_exit",
      "recovery_with_balanced_management_and_constructive_final_exit",
    ])
  ) {
    pushUniqueInsight(insights, {
      id: "balanced_management_with_constructive_exit",
      category: "exit",
      tone: "strength",
      title: "Managed the full trade constructively",
      summary:
        "The trade added, reduced, returned flat, kept giveback controlled, and after-exit candles later faded.",
      evidence: [
        `addCountAfterInitialEntry=${input.scalingContext.addCountAfterInitialEntry}`,
        `totalPositionDecreaseCount=${input.tradeStructure.totalPositionDecreaseCount}`,
        `maxGivebackFromPeakOpenProfitPct=${pct(input.recoveryContext.maxGivebackFromPeakOpenProfitPct)}`,
        `realizedCapturePercentOfTradeMfe=${pct(exit.realizedCapturePercentOfTradeMfe)}`,
        `postExitCandleCount=${exit.postExitCandleCount}`,
        `maxAdverseMovePctAfterExit=${pct(exit.maxAdverseMovePctAfterExit)}`,
        `maxFavorableMovePctAfterExit=${pct(exit.maxFavorableMovePctAfterExit)}`,
        `netMovePctAtEndOfPostExitWindow=${pct(exit.netMovePctAtEndOfPostExitWindow)}`,
      ],
    });
  }

  if (
    exitHadPositiveCapture &&
    afterExitFadeWasMeasured &&
    hasAnyPattern(result, [
      "add_into_strength_with_constructive_final_exit",
      "recovery_with_add_into_strength_and_constructive_final_exit",
      "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
      "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    ])
  ) {
    pushUniqueInsight(insights, {
      id: "add_into_strength_with_constructive_final_exit",
      category: "exit",
      tone: "strength",
      title: "Added into strength and exited constructively",
      summary:
        "The trade pressed strength, kept giveback controlled, returned flat, and after-exit candles later faded.",
      evidence: [
        `addCountAfterInitialEntry=${input.scalingContext.addCountAfterInitialEntry}`,
        `addAbovePreviousAverageEntryCount=${input.scalingContext.addAbovePreviousAverageEntryCount}`,
        `averageAddPriceVsPreviousAverageEntryPct=${pct(input.scalingContext.averageAddPriceVsPreviousAverageEntryPct)}`,
        `averageAddPricePositionInRecentRangePct=${pct(input.scalingContext.averageAddPricePositionInRecentRangePct)}`,
        `maxGivebackFromPeakOpenProfitPct=${pct(input.recoveryContext.maxGivebackFromPeakOpenProfitPct)}`,
        `realizedCapturePercentOfTradeMfe=${pct(exit.realizedCapturePercentOfTradeMfe)}`,
        `postExitCandleCount=${exit.postExitCandleCount}`,
        `maxAdverseMovePctAfterExit=${pct(exit.maxAdverseMovePctAfterExit)}`,
        `maxFavorableMovePctAfterExit=${pct(exit.maxFavorableMovePctAfterExit)}`,
        `netMovePctAtEndOfPostExitWindow=${pct(exit.netMovePctAtEndOfPostExitWindow)}`,
      ],
    });
  }

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
      title: "Open profit was not protected",
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
      title: "During-trade movement was measured",
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
      sessionBucket:
        result.rawTradeTimeline.timeline.sessionContext.sessionBucket,
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
      nearestSupportPrice: supportResistance.firstEntryNearestSupportBelowPrice,
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
        supportResistance.firstEntryNearestResistanceSourceStrengthLabel ??
        null,
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
      maxAdverseMovePctAfterExit: input.exitContext.maxAdverseMovePctAfterExit,
    },
    insights,
  };
}
