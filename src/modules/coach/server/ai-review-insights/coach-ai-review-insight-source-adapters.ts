import Decimal from "decimal.js";

import type {
  CoachAiReviewBehaviorObservation,
  CoachAiReviewCalculationSource,
  CoachAiReviewComparableOutcomeObservation,
  CoachAiReviewInsightCandidate,
  CoachAiReviewMeasurement,
  CoachAiReviewNormalizedRuleOpportunity,
  CoachAiReviewRuleOpportunityInput,
  CoachAiReviewSourceDay,
  CoachAiReviewSourceRule,
  CoachAiReviewSourceTrade,
  CoachAiReviewTradeStylePopulation,
} from "@/src/modules/coach/contracts/coach-ai-review-insight-contracts";
import {
  buildCoachAiReviewBehaviorCandidate,
  buildCoachAiReviewNamedRuleCandidates,
  buildCoachAiReviewPeriodOutcomeCandidate,
  buildCoachAiReviewRateTrendCandidate,
  type CoachAiReviewBehaviorCandidateSource,
  type CoachAiReviewRateTrendBucket,
} from "./coach-ai-review-insight-candidates";
import {
  createCoachAiReviewMeasurement,
  measureCoachAiReviewPeriodOutcomes,
} from "./coach-ai-review-insight-measurements";
import {
  CoachAiReviewInsightInvariantError,
  compareCoachAiReviewText,
  normalizeCoachAiReviewRuleOpportunities,
} from "./coach-ai-review-insight-normalizer";

const ExactDecimal = Decimal.clone({
  precision: 160,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});

const RSI_BANDS = Object.freeze([
  Object.freeze({ key: "0_30", minimum: 0, maximum: 30, includeMaximum: false }),
  Object.freeze({ key: "30_40", minimum: 30, maximum: 40, includeMaximum: false }),
  Object.freeze({ key: "40_50", minimum: 40, maximum: 50, includeMaximum: false }),
  Object.freeze({ key: "50_60", minimum: 50, maximum: 60, includeMaximum: false }),
  Object.freeze({ key: "60_70", minimum: 60, maximum: 70, includeMaximum: false }),
  Object.freeze({ key: "70_100", minimum: 70, maximum: 100, includeMaximum: true }),
]);

const ENTRY_TIME_BUCKETS = Object.freeze([
  Object.freeze({ key: "before_09_30", start: 0, end: 570 }),
  Object.freeze({ key: "09_30_10_00", start: 570, end: 600 }),
  Object.freeze({ key: "10_00_11_30", start: 600, end: 690 }),
  Object.freeze({ key: "11_30_14_00", start: 690, end: 840 }),
  Object.freeze({ key: "14_00_15_30", start: 840, end: 930 }),
  Object.freeze({ key: "15_30_16_00", start: 930, end: 960 }),
  Object.freeze({ key: "at_or_after_16_00", start: 960, end: 1440 }),
]);

const DAY_DURATION_BUCKETS = Object.freeze([
  Object.freeze({ key: "under_1_minute", start: 0, end: 60_000 }),
  Object.freeze({ key: "1_to_under_5_minutes", start: 60_000, end: 300_000 }),
  Object.freeze({ key: "5_to_under_15_minutes", start: 300_000, end: 900_000 }),
  Object.freeze({ key: "15_to_under_30_minutes", start: 900_000, end: 1_800_000 }),
  Object.freeze({ key: "30_to_under_60_minutes", start: 1_800_000, end: 3_600_000 }),
  Object.freeze({ key: "1_to_under_4_hours", start: 3_600_000, end: 14_400_000 }),
  Object.freeze({ key: "4_hours_or_more", start: 14_400_000, end: Number.POSITIVE_INFINITY }),
]);

const SWING_DURATION_BUCKETS = Object.freeze([
  Object.freeze({ key: "under_1_day", start: 0, end: 86_400_000 }),
  Object.freeze({ key: "1_to_under_3_days", start: 86_400_000, end: 259_200_000 }),
  Object.freeze({ key: "3_to_under_7_days", start: 259_200_000, end: 604_800_000 }),
  Object.freeze({ key: "7_to_under_30_days", start: 604_800_000, end: 2_592_000_000 }),
  Object.freeze({ key: "30_days_or_more", start: 2_592_000_000, end: Number.POSITIVE_INFINITY }),
]);

const REENTRY_TEMPLATE_KEYS = new Set([
  "cooldown_after_loss",
  "cooldown_before_same_ticker_reentry",
  "maximum_attempts_per_ticker",
  "maximum_trades_per_day",
  "stop_after_consecutive_losses",
  "stop_after_total_daily_losses",
  "stop_after_losing_ticker_attempts",
]);

const DAILY_BOUNDARY_TEMPLATE_KEYS = new Set([
  "no_new_trades_after_time",
  "stop_after_daily_realized_loss",
  "stop_after_profit_giveback",
  "stop_after_daily_realized_gain_limit",
]);

const easternTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const easternDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type RuleOpportunityBundle = Readonly<{
  rule: CoachAiReviewSourceRule;
  targetKind: "trading_day" | "round_trip";
  opportunities: readonly CoachAiReviewNormalizedRuleOpportunity[];
}>;

export type CoachAiReviewSourceAdapterOptions = Readonly<{
  rsiReferenceVectorsAccepted?: boolean;
}>;

export type CoachAiReviewSourceAdapterResult = Readonly<{
  candidates: readonly CoachAiReviewInsightCandidate[];
  normalizedRuleOpportunities: readonly CoachAiReviewNormalizedRuleOpportunity[];
}>;

function invariant(condition: boolean, code: string): asserts condition {
  if (!condition) throw new CoachAiReviewInsightInvariantError(code);
}

function periodMoney(
  source: CoachAiReviewCalculationSource,
): readonly CoachAiReviewComparableOutcomeObservation[] {
  return Object.freeze(source.trades.map((trade) => Object.freeze({
    memberRef: trade.tradeRef,
    netPnlDecimal: trade.netPnlDecimal,
    currency: trade.currency,
    bucketRef: weekBucket(trade.marketDate),
    stratumKey: stratumKey(trade),
  })));
}

function mondayDate(marketDate: string): string {
  const date = new Date(`${marketDate}T12:00:00.000Z`);
  const offset = date.getUTCDay() === 0 ? -6 : 1 - date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function weekBucket(marketDate: string): string {
  return `calendar_week:${mondayDate(marketDate)}`;
}

function marketDateForUtc(timestamp: string): string {
  const parts = Object.fromEntries(easternDate.formatToParts(new Date(timestamp))
    .filter((part) => part.type === "year" || part.type === "month" || part.type === "day")
    .map((part) => [part.type, part.value]));
  invariant(parts.year !== undefined && parts.month !== undefined && parts.day !== undefined,
    "TRADERLINK_AI_REVIEW_MARKET_DATE_INVALID");
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function eventInsidePeriod(
  timestamp: string,
  source: CoachAiReviewCalculationSource,
): boolean {
  const marketDate = marketDateForUtc(timestamp);
  return marketDate >= source.period.startDate && marketDate <= source.period.endDate;
}

function tradeStylePopulation(trade: CoachAiReviewSourceTrade): CoachAiReviewTradeStylePopulation {
  if (trade.tradeStyle?.linkedRoundTripVersionCurrent) {
    if (trade.tradeStyle.tradeStyle === "day_trade") return "declared_day";
    if (trade.tradeStyle.tradeStyle === "swing") return "declared_swing";
    return "declared_other";
  }
  if (trade.tradeStyle) return "unknown_or_mixed";
  return trade.objectiveTiming === "same_market_date"
    ? "objective_same_market_date"
    : "unknown_or_mixed";
}

function stratumKey(trade: CoachAiReviewSourceTrade): string {
  return `${tradeStylePopulation(trade)}:${trade.direction}`;
}

function compareTradesStable(
  left: CoachAiReviewSourceTrade,
  right: CoachAiReviewSourceTrade,
): number {
  return compareCoachAiReviewText(left.closedAtUtc, right.closedAtUtc) ||
    compareCoachAiReviewText(left.openedAtUtc, right.openedAtUtc) ||
    compareCoachAiReviewText(left.ticker, right.ticker) ||
    compareCoachAiReviewText(left.direction, right.direction) ||
    compareCoachAiReviewText(left.grossPnlDecimal, right.grossPnlDecimal) ||
    compareCoachAiReviewText(left.netPnlDecimal ?? "", right.netPnlDecimal ?? "");
}

function typicalTrade(
  trades: readonly CoachAiReviewSourceTrade[],
): CoachAiReviewSourceTrade | null {
  const eligible = trades.filter((trade) => trade.netPnlDecimal !== null)
    .sort((left, right) => new ExactDecimal(left.netPnlDecimal!)
      .comparedTo(right.netPnlDecimal!) || compareTradesStable(left, right));
  if (eligible.length === 0) return null;
  const middle = Math.floor(eligible.length / 2);
  const median = eligible.length % 2 === 1
    ? new ExactDecimal(eligible[middle]!.netPnlDecimal!)
    : new ExactDecimal(eligible[middle - 1]!.netPnlDecimal!)
      .plus(eligible[middle]!.netPnlDecimal!).dividedBy(2);
  return [...eligible].sort((left, right) =>
    new ExactDecimal(left.netPnlDecimal!).minus(median).abs().comparedTo(
      new ExactDecimal(right.netPnlDecimal!).minus(median).abs(),
    ) || compareTradesStable(left, right))[0]!;
}

function selectBehaviorRepresentatives(input: Readonly<{
  source: CoachAiReviewCalculationSource;
  lane: CoachAiReviewBehaviorCandidateSource["lane"];
  resultPolarity: CoachAiReviewBehaviorCandidateSource["resultPolarity"];
  observations: readonly CoachAiReviewBehaviorObservation[];
}>): CoachAiReviewBehaviorCandidateSource["representativeEvidence"] {
  const tradeByRef = new Map(input.source.trades.map((trade) =>
    [trade.tradeRef, trade] as const));
  const affectedRefs = new Set(input.observations.filter((item) => item.affected)
    .map((item) => item.memberRef));
  const affected = [...affectedRefs].flatMap((memberRef) => {
    const trade = tradeByRef.get(memberRef);
    return trade ? [trade] : [];
  });
  const comparison = input.observations.filter((item) => !item.affected).flatMap((item) => {
    const trade = tradeByRef.get(item.memberRef);
    return trade ? [trade] : [];
  });
  if (affected.length === 0) return Object.freeze([]);
  const selected: Array<Readonly<{
    memberRef: string;
    role: CoachAiReviewInsightCandidate["representativeEvidenceRoles"][number];
  }>> = [];
  const add = (
    trade: CoachAiReviewSourceTrade | null,
    role: CoachAiReviewInsightCandidate["representativeEvidenceRoles"][number],
  ) => {
    if (!trade || selected.some((item) => item.memberRef === trade.tradeRef)) return;
    selected.push(Object.freeze({ memberRef: trade.tradeRef, role }));
  };
  if (input.lane === "friction") {
    const material = [...affected].filter((trade) => trade.netPnlDecimal !== null)
      .sort((left, right) => input.resultPolarity === "negative"
        ? new ExactDecimal(left.netPnlDecimal!).comparedTo(right.netPnlDecimal!) ||
          compareTradesStable(left, right)
        : new ExactDecimal(right.netPnlDecimal!).comparedTo(left.netPnlDecimal!) ||
          compareTradesStable(left, right))[0] ?? null;
    add(material, "highest_material_contribution");
    add(typicalTrade(affected), "typical_affected");
  } else if (input.lane === "strength") {
    const typical = typicalTrade(affected);
    add(typical, "typical_affected");
    const typicalWeek = typical ? weekBucket(typical.marketDate) : null;
    const recent = [...affected].sort((left, right) =>
      compareCoachAiReviewText(right.closedAtUtc, left.closedAtUtc) ||
      compareTradesStable(left, right)).find((trade) =>
        typicalWeek === null || weekBucket(trade.marketDate) !== typicalWeek) ??
      [...affected].sort((left, right) =>
        compareCoachAiReviewText(right.closedAtUtc, left.closedAtUtc) ||
        compareTradesStable(left, right))[0] ?? null;
    add(recent, "most_recent_independent");
  } else {
    add(typicalTrade(affected), "typical_affected");
    add(typicalTrade(comparison), "typical_comparison");
  }
  return Object.freeze(selected);
}

function tradeBehaviorObservations(
  trades: readonly CoachAiReviewSourceTrade[],
  affected: (trade: CoachAiReviewSourceTrade) => boolean,
): readonly CoachAiReviewBehaviorObservation[] {
  return Object.freeze(trades.map((trade) => Object.freeze({
    memberRef: trade.tradeRef,
    netPnlDecimal: trade.netPnlDecimal,
    currency: trade.currency,
    bucketRef: weekBucket(trade.marketDate),
    stratumKey: stratumKey(trade),
    affected: affected(trade),
  })));
}

function canonicalDecimal(value: Decimal): string {
  return value.isZero() ? "0" : value.toFixed();
}

function analyzerPathMoneyMeasurement(input: Readonly<{
  metricName: string;
  affectedTrades: readonly CoachAiReviewSourceTrade[];
  denominatorTrades: readonly CoachAiReviewSourceTrade[];
  value: (trade: CoachAiReviewSourceTrade) => string | null;
}>): CoachAiReviewMeasurement {
  const valued = input.affectedTrades.flatMap((trade) => {
    const value = input.value(trade);
    return value === null ? [] : [Object.freeze({ trade, value })];
  });
  const currencies = new Set(valued.map((item) => item.trade.currency));
  const mixedCurrency = currencies.size > 1;
  const exactValue = valued.length === 0 || mixedCurrency
    ? null
    : canonicalDecimal(valued.reduce((total, item) =>
        total.plus(item.value), new ExactDecimal(0)));
  const availability = mixedCurrency
    ? "unavailable_mixed_currency" as const
    : exactValue === null
      ? "unavailable_missing_money" as const
      : valued.length === input.affectedTrades.length
        ? "available" as const
        : "partial_display_only" as const;
  const currency = currencies.size === 1 ? [...currencies][0]! : null;
  return createCoachAiReviewMeasurement({
    metricName: input.metricName,
    exactValue,
    unit: "money",
    currency,
    observationUnit: "analyzer_covered_trade",
    numeratorMemberRefs: valued.map((item) => item.trade.tradeRef),
    denominatorMemberRefs: input.denominatorTrades.map((trade) => trade.tradeRef),
    moneyEligibleCount: valued.length,
    expectedCount: input.denominatorTrades.length,
    availability,
    attributionKind: "analyzer_path",
    displayLiteral: exactValue === null || currency === null ? null : `${currency} ${exactValue}`,
  });
}

function analyzerPathCountMeasurement(input: Readonly<{
  metricName: string;
  affectedTrades: readonly CoachAiReviewSourceTrade[];
  denominatorTrades: readonly CoachAiReviewSourceTrade[];
  count: (trade: CoachAiReviewSourceTrade) => number;
}>): CoachAiReviewMeasurement {
  const exactValue = String(input.affectedTrades.reduce((total, trade) =>
    total + input.count(trade), 0));
  return createCoachAiReviewMeasurement({
    metricName: input.metricName,
    exactValue,
    unit: "count",
    observationUnit: "analyzer_covered_trade",
    numeratorMemberRefs: input.affectedTrades.map((trade) => trade.tradeRef),
    denominatorMemberRefs: input.denominatorTrades.map((trade) => trade.tradeRef),
    expectedCount: input.denominatorTrades.length,
    availability: "available",
    attributionKind: "analyzer_path",
    displayLiteral: exactValue,
  });
}

function coverageBalance(
  expected: readonly CoachAiReviewSourceTrade[],
  observed: readonly CoachAiReviewSourceTrade[],
): "balanced" | "materially_skewed" | "balance_unavailable" {
  const resultClasses = [
    expected.filter((trade) => trade.netPnlDecimal !== null &&
      new ExactDecimal(trade.netPnlDecimal).gt(0)),
    expected.filter((trade) => trade.netPnlDecimal !== null &&
      new ExactDecimal(trade.netPnlDecimal).lt(0)),
  ];
  if (resultClasses.some((members) => members.length === 0)) return "balance_unavailable";
  const observedRefs = new Set(observed.map((trade) => trade.tradeRef));
  const rates = resultClasses.map((members) =>
    members.filter((trade) => observedRefs.has(trade.tradeRef)).length / members.length);
  return Math.abs(rates[0]! - rates[1]!) > 0.20 ? "materially_skewed" : "balanced";
}

function activeDuringDay(rule: CoachAiReviewSourceRule, day: CoachAiReviewSourceDay): boolean {
  return rule.effectiveFromUtc < day.dayEndUtc &&
    (rule.effectiveUntilUtc === null || rule.effectiveUntilUtc > day.dayStartUtc) &&
    rule.activeIntervals.some((interval) => interval.fromUtc < day.dayEndUtc &&
      (interval.untilUtc === null || interval.untilUtc > day.dayStartUtc));
}

function activeAtTradeEntry(rule: CoachAiReviewSourceRule, trade: CoachAiReviewSourceTrade): boolean {
  return rule.effectiveFromUtc <= trade.openedAtUtc &&
    (rule.effectiveUntilUtc === null || rule.effectiveUntilUtc > trade.openedAtUtc) &&
    rule.activeIntervals.some((interval) => interval.fromUtc <= trade.openedAtUtc &&
      (interval.untilUtc === null || interval.untilUtc > trade.openedAtUtc));
}

function targetKinds(rule: CoachAiReviewSourceRule): readonly ("trading_day" | "round_trip")[] {
  if (rule.reviewScope === "day") return Object.freeze(["trading_day"]);
  if (rule.reviewScope === "trade") return Object.freeze(["round_trip"]);
  return Object.freeze(["trading_day", "round_trip"]);
}

function normalizeRuleBundles(source: CoachAiReviewCalculationSource): readonly RuleOpportunityBundle[] {
  const dayByRef = new Map(source.days.map((day) => [day.dayRef, day] as const));
  const tradeByRef = new Map(source.trades.map((trade) => [trade.tradeRef, trade] as const));
  const dayByTradeRef = new Map(source.days.flatMap((day) => day.tradeRefs.map((tradeRef) =>
    [tradeRef, day] as const)));
  const savedByKey = new Map<string, CoachAiReviewCalculationSource["ruleReviews"][number]>(
    source.ruleReviews.map((review) => [
    `${review.ruleVersionRef}\u0000${review.targetKind}\u0000${review.targetRef}`,
    review,
  ] as const));
  const presetByKey = new Map<string, CoachAiReviewCalculationSource["presetEvaluations"][number]>(
    source.presetEvaluations.map((evaluation) => [
    `${evaluation.ruleVersionRef}\u0000${evaluation.targetKind}\u0000${evaluation.targetRef}`,
    evaluation,
  ] as const));
  const bundles: RuleOpportunityBundle[] = [];
  for (const rule of source.rules) {
    for (const targetKind of targetKinds(rule)) {
      const projectedTargetRefs = rule.sourceKind === "custom"
        ? targetKind === "trading_day"
          ? source.days.map((day) => day.dayRef)
          : source.trades.map((trade) => trade.tradeRef)
        : source.presetEvaluations.filter((evaluation) =>
            evaluation.ruleVersionRef === rule.ruleVersionRef &&
            evaluation.targetKind === targetKind).map((evaluation) => evaluation.targetRef);
      const savedTargetRefs = source.ruleReviews.filter((review) =>
        review.ruleVersionRef === rule.ruleVersionRef && review.targetKind === targetKind)
        .map((review) => review.targetRef);
      const targetRefs = [...new Set([...projectedTargetRefs, ...savedTargetRefs])]
        .sort(compareCoachAiReviewText);
      const inputs: CoachAiReviewRuleOpportunityInput[] = targetRefs.map((targetRef) => {
        const day = targetKind === "trading_day"
          ? dayByRef.get(targetRef)
          : dayByTradeRef.get(targetRef);
        invariant(day !== undefined, "TRADERLINK_AI_REVIEW_RULE_TARGET_DAY_MISSING");
        const trade = targetKind === "round_trip" ? tradeByRef.get(targetRef) : null;
        if (targetKind === "round_trip") invariant(trade !== undefined,
          "TRADERLINK_AI_REVIEW_RULE_TRADE_MISSING");
        const key = `${rule.ruleVersionRef}\u0000${targetKind}\u0000${targetRef}`;
        const saved = savedByKey.get(key) ?? null;
        const preset = presetByKey.get(key) ?? null;
        const activeAtTarget = trade
          ? activeAtTradeEntry(rule, trade)
          : activeDuringDay(rule, day);
        return Object.freeze({
          ruleRef: rule.ruleRef,
          ruleVersionRef: rule.ruleVersionRef,
          targetRef,
          targetKind,
          reviewScope: rule.reviewScope,
          sourceKind: rule.sourceKind,
          activeAtTarget,
          historicalProjection: activeAtTarget
            ? "applicable" as const
            : "not_applicable" as const,
          savedDisposition: saved?.status ?? null,
          presetEvaluation: preset ? Object.freeze({
            status: preset.status,
            availabilityReason: preset.availabilityReason,
            violationTradeRefs: Object.freeze(preset.violations.map((item) => item.tradeRef)),
          }) : null,
        });
      });
      const opportunities = normalizeCoachAiReviewRuleOpportunities(inputs);
      if (opportunities.length > 0) bundles.push(Object.freeze({ rule, targetKind, opportunities }));
    }
  }
  return Object.freeze(bundles.sort((left, right) =>
    compareCoachAiReviewText(left.rule.sourceKind, right.rule.sourceKind) ||
    compareCoachAiReviewText(left.rule.templateKey ?? "", right.rule.templateKey ?? "") ||
    compareCoachAiReviewText(left.rule.title, right.rule.title) ||
    left.rule.versionNumber - right.rule.versionNumber ||
    compareCoachAiReviewText(left.rule.effectiveFromUtc, right.rule.effectiveFromUtc) ||
    compareCoachAiReviewText(left.targetKind, right.targetKind)));
}

function comparableRuleState(
  opportunity: CoachAiReviewNormalizedRuleOpportunity,
): "broken" | "followed" | null {
  if (!opportunity.isReviewOpportunity || opportunity.sourceConsistency === "conflict") return null;
  if (opportunity.dispositionState === "reviewed_broken" ||
      opportunity.presetEvaluationState === "evaluated_broken") return "broken";
  if (opportunity.dispositionState === "reviewed_followed" ||
      opportunity.presetEvaluationState === "evaluated_followed") return "followed";
  return null;
}

function selectRuleRepresentatives(
  bundle: RuleOpportunityBundle,
  source: CoachAiReviewCalculationSource,
  polarity: "negative" | "positive",
): readonly Readonly<{
  memberRef: string;
  role: CoachAiReviewInsightCandidate["representativeEvidenceRoles"][number];
}>[] {
  const desired = polarity === "negative" ? "broken" : "followed";
  const applicable = bundle.opportunities.filter((item) => item.isReviewOpportunity);
  const affectedRefs = new Set(applicable.filter((item) => comparableRuleState(item) === desired)
    .map((item) => item.targetRef));
  if (bundle.targetKind === "round_trip") {
    const trades = source.trades.filter((trade) =>
      applicable.some((item) => item.targetRef === trade.tradeRef));
    return selectBehaviorRepresentatives({
      source,
      lane: polarity === "negative" ? "friction" : "strength",
      resultPolarity: polarity,
      observations: tradeBehaviorObservations(trades, (trade) =>
        affectedRefs.has(trade.tradeRef)),
    });
  }
  const affectedDays = source.days.filter((day) => affectedRefs.has(day.dayRef))
    .sort((left, right) => compareCoachAiReviewText(left.marketDate, right.marketDate));
  if (affectedDays.length === 0) return Object.freeze([]);
  const middle = affectedDays[Math.floor((affectedDays.length - 1) / 2)]!;
  const recent = [...affectedDays].reverse().find((day) =>
    weekBucket(day.marketDate) !== weekBucket(middle.marketDate)) ?? affectedDays.at(-1)!;
  return Object.freeze([
    Object.freeze({ memberRef: middle.dayRef, role: "typical_affected" as const }),
    ...(recent.dayRef === middle.dayRef ? [] : [Object.freeze({
      memberRef: recent.dayRef,
      role: "most_recent_independent" as const,
    })]),
  ]);
}

function bucketForTarget(
  targetRef: string,
  source: CoachAiReviewCalculationSource,
): string | null {
  const trade = source.trades.find((item) => item.tradeRef === targetRef);
  if (trade) return weekBucket(trade.marketDate);
  const day = source.days.find((item) => item.dayRef === targetRef);
  return day ? weekBucket(day.marketDate) : null;
}

function ruleTrendBuckets(
  bundle: RuleOpportunityBundle,
  source: CoachAiReviewCalculationSource,
): readonly CoachAiReviewRateTrendBucket[] {
  const dayByTradeRef = new Map(source.days.flatMap((day) => day.tradeRefs.map((tradeRef) =>
    [tradeRef, day] as const)));
  const bucketRefs = [...new Set(bundle.opportunities.map((opportunity) =>
    bucketForTarget(opportunity.targetRef, source)).filter((value): value is string => value !== null))]
    .sort(compareCoachAiReviewText);
  return Object.freeze(bucketRefs.flatMap((bucketRef) => {
    const expected = bundle.opportunities.filter((opportunity) =>
      opportunity.isReviewOpportunity && bucketForTarget(opportunity.targetRef, source) === bucketRef);
    const observed = expected.filter((opportunity) => comparableRuleState(opportunity) !== null);
    if (observed.length === 0) return [];
    const stratumKeyByMemberRef = Object.fromEntries(observed.map((opportunity) => {
      const trade = source.trades.find((item) => item.tradeRef === opportunity.targetRef);
      return [opportunity.targetRef, trade ? stratumKey(trade) : "trading_day"] as const;
    }));
    const marketDateRefs = observed.map((opportunity) => {
      const day = bundle.targetKind === "trading_day"
        ? source.days.find((item) => item.dayRef === opportunity.targetRef)
        : dayByTradeRef.get(opportunity.targetRef);
      invariant(day !== undefined, "TRADERLINK_AI_REVIEW_RULE_TREND_DAY_MISSING");
      return day.dayRef;
    });
    return [Object.freeze({
      bucketRef,
      memberRefs: Object.freeze(observed.map((item) => item.targetRef)
        .sort(compareCoachAiReviewText)),
      affectedMemberRefs: Object.freeze(observed.filter((item) =>
        comparableRuleState(item) === "broken").map((item) => item.targetRef)
        .sort(compareCoachAiReviewText)),
      marketDateRefs: Object.freeze([...new Set(marketDateRefs)].sort(compareCoachAiReviewText)),
      expectedCount: expected.length,
      stratumKeyByMemberRef: Object.freeze(stratumKeyByMemberRef),
    })];
  }));
}

function candidate(
  values: CoachAiReviewInsightCandidate[],
  source: CoachAiReviewBehaviorCandidateSource,
): void {
  const value = buildCoachAiReviewBehaviorCandidate(source);
  if (value) values.push(value);
}

function behaviorSource(input: Readonly<{
  source: CoachAiReviewCalculationSource;
  family: CoachAiReviewBehaviorCandidateSource["family"];
  lane: CoachAiReviewBehaviorCandidateSource["lane"];
  polarity: CoachAiReviewBehaviorCandidateSource["polarity"];
  subjectRef: string;
  subjectLabel?: string | null;
  tradeStylePopulation: CoachAiReviewTradeStylePopulation;
  populationDefinition: string;
  opportunityDefinition: string | null;
  cohortDefinition: string;
  comparisonDefinition: string;
  observations: readonly CoachAiReviewBehaviorObservation[];
  additionalMeasurements?: readonly CoachAiReviewMeasurement[];
  processClass: CoachAiReviewBehaviorCandidateSource["processClass"];
  resultPolarity: CoachAiReviewBehaviorCandidateSource["resultPolarity"];
  expectedPopulationCount: number;
  expectedPopulationTrades?: readonly CoachAiReviewSourceTrade[];
  coverageBalance?: CoachAiReviewBehaviorCandidateSource["coverageBalance"];
  structuredSourceConsistency?: number | null;
  exploratorySiblingCount?: number | null;
  recurringEvidenceAllowed?: boolean;
  allowSpecificExample?: boolean;
  allowMaterialOutlier?: boolean;
  relatedRuleRefs?: readonly string[];
  overlapKeys: readonly string[];
}>): CoachAiReviewBehaviorCandidateSource {
  const expectedPopulationTrades = input.expectedPopulationTrades ?? input.source.trades.filter(
    (trade) => input.observations.some((observation) => observation.memberRef === trade.tradeRef),
  );
  invariant(expectedPopulationTrades.length === input.expectedPopulationCount,
    "TRADERLINK_AI_REVIEW_EXPECTED_POPULATION_COUNT_MISMATCH");
  const moneyObservations = periodMoney(input.source);
  const representativeInput = Object.freeze({
    source: input.source,
    lane: input.lane,
    resultPolarity: input.resultPolarity,
  });
  const sensitivityBucketRefs = [...new Set([
    ...input.observations.map((observation) => observation.bucketRef),
    ...moneyObservations.map((observation) => observation.bucketRef),
  ])].sort(compareCoachAiReviewText);
  return Object.freeze({
    cadence: input.source.period.cadence,
    family: input.family,
    lane: input.lane,
    polarity: input.polarity,
    subjectRef: input.subjectRef,
    subjectLabel: input.subjectLabel ?? null,
    observationUnit: input.family === "favorable_move_outcome" ||
        input.family === "entry_evidence" || input.family === "exit_sequence"
      ? "analyzer_covered_trade" as const
      : "trade" as const,
    resultOwnership: "trade_close_market_date" as const,
    tradeStylePopulation: input.tradeStylePopulation,
    populationDefinition: input.populationDefinition,
    opportunityDefinition: input.opportunityDefinition,
    cohortDefinition: input.cohortDefinition,
    comparisonDefinition: input.comparisonDefinition,
    observations: input.observations,
    additionalMeasurements: input.additionalMeasurements,
    periodMoneyObservations: moneyObservations,
    periodOutcomes: measureCoachAiReviewPeriodOutcomes(moneyObservations),
    processClass: input.processClass,
    resultPolarity: input.resultPolarity,
    expectedPopulationCount: input.expectedPopulationCount,
    expectedPopulationCountByBucket: Object.freeze(Object.fromEntries(
      [...new Set(expectedPopulationTrades.map((trade) => weekBucket(trade.marketDate)))]
        .sort(compareCoachAiReviewText)
        .map((bucketRef) => [bucketRef, expectedPopulationTrades.filter((trade) =>
          weekBucket(trade.marketDate) === bucketRef).length]),
    )),
    coverageBalance: input.coverageBalance ?? "balanced",
    structuredSourceConsistency: input.structuredSourceConsistency ?? 100,
    exploratorySiblingCount: input.exploratorySiblingCount ?? null,
    recurringEvidenceAllowed: input.recurringEvidenceAllowed,
    allowSpecificExample: input.allowSpecificExample ?? false,
    allowMaterialOutlier: input.allowMaterialOutlier ?? false,
    representativeEvidence: selectBehaviorRepresentatives({
      ...representativeInput,
      observations: input.observations,
    }),
    representativeEvidenceByOmittedBucket: Object.freeze(Object.fromEntries(
      sensitivityBucketRefs.map((bucketRef) => [bucketRef, selectBehaviorRepresentatives({
        ...representativeInput,
        observations: input.observations.filter((observation) =>
          observation.bucketRef !== bucketRef),
      })]),
    )),
    relatedRuleRefs: Object.freeze([...(input.relatedRuleRefs ?? [])]),
    relatedFocusRefs: Object.freeze([]),
    overlapKeys: Object.freeze([...input.overlapKeys]),
    futureTrackability: "trackable" as const,
  });
}

function analyzerEligibleTrades(source: CoachAiReviewCalculationSource): readonly CoachAiReviewSourceTrade[] {
  return Object.freeze(source.trades.filter((trade) => trade.objectiveTiming === "same_market_date" &&
    (trade.tradeStyle === null || trade.tradeStyle.linkedRoundTripVersionCurrent) &&
    trade.tradeStyle?.tradeStyle !== "swing" && trade.tradeStyle?.tradeStyle !== "other" &&
    trade.tradeStyle?.lifecycleState !== "needs_relink"));
}

function analyzerPathTrades(source: CoachAiReviewCalculationSource): readonly CoachAiReviewSourceTrade[] {
  return Object.freeze(analyzerEligibleTrades(source).filter((trade) =>
    trade.analyzer.linkedRoundTripVersionCurrent &&
    trade.analyzer.analysis.availability === "ready" &&
    trade.analyzer.analysis.greenToRed !== null &&
    trade.analyzer.analysis.greenToRed.status !== "unavailable"));
}

function typicalTrendMemberRef(
  memberRefs: readonly string[],
  source: CoachAiReviewCalculationSource,
): string | null {
  if (memberRefs.length === 0) return null;
  const memberSet = new Set(memberRefs);
  const trades = source.trades.filter((trade) => memberSet.has(trade.tradeRef));
  if (trades.length === memberSet.size) return typicalTrade(trades)?.tradeRef ?? null;
  const days = source.days.filter((day) => memberSet.has(day.dayRef))
    .sort((left, right) => compareCoachAiReviewText(left.marketDate, right.marketDate) ||
      compareCoachAiReviewText(left.dayRef, right.dayRef));
  if (days.length === memberSet.size) return days[Math.floor((days.length - 1) / 2)]!.dayRef;
  throw new CoachAiReviewInsightInvariantError(
    "TRADERLINK_AI_REVIEW_TREND_REPRESENTATIVE_MEMBER_KIND_UNKNOWN",
  );
}

function selectTrendRepresentatives(
  buckets: readonly CoachAiReviewRateTrendBucket[],
  cadence: CoachAiReviewCalculationSource["period"]["cadence"],
  source: CoachAiReviewCalculationSource,
): readonly Readonly<{
  memberRef: string;
  role: "typical_early" | "typical_later";
}>[] {
  const sideBucketCount = cadence === "monthly" && buckets.length >= 4 ? 2 : 1;
  const sideRepresentative = (
    side: readonly CoachAiReviewRateTrendBucket[],
  ): string | null => {
    const affectedRefs = side.flatMap((bucket) => bucket.affectedMemberRefs);
    return typicalTrendMemberRef(
      affectedRefs.length > 0 ? affectedRefs : side.flatMap((bucket) => bucket.memberRefs),
      source,
    );
  };
  const earlyRef = sideRepresentative(buckets.slice(0, sideBucketCount));
  const laterRef = sideRepresentative(buckets.slice(-sideBucketCount));
  return Object.freeze([
    ...(earlyRef === null ? [] : [{ memberRef: earlyRef, role: "typical_early" as const }]),
    ...(laterRef === null || laterRef === earlyRef
      ? []
      : [{ memberRef: laterRef, role: "typical_later" as const }]),
  ].map((item) => Object.freeze(item)));
}

function trendRepresentativeSensitivity(
  buckets: readonly CoachAiReviewRateTrendBucket[],
  cadence: CoachAiReviewCalculationSource["period"]["cadence"],
  source: CoachAiReviewCalculationSource,
): Readonly<Record<string, ReturnType<typeof selectTrendRepresentatives>>> {
  return Object.freeze(Object.fromEntries(buckets.map((removedBucket) => [
    removedBucket.bucketRef,
    selectTrendRepresentatives(
      buckets.filter((bucket) => bucket.bucketRef !== removedBucket.bucketRef),
      cadence,
      source,
    ),
  ])));
}

function addTradeRateTrends(
  values: CoachAiReviewInsightCandidate[],
  source: CoachAiReviewCalculationSource,
  input: Readonly<{
    family: CoachAiReviewBehaviorCandidateSource["family"];
    subjectRef: string;
    opportunityTrades: readonly CoachAiReviewSourceTrade[];
    expectedTrades: readonly CoachAiReviewSourceTrade[];
    affected: (trade: CoachAiReviewSourceTrade) => boolean;
    improvementDirection: "lower_is_better" | "higher_is_better";
    processClass: CoachAiReviewBehaviorCandidateSource["processClass"];
    populationDefinition: string;
    opportunityDefinition: string;
    cohortDefinition: string;
    overlapKeys: readonly string[];
  }>,
): void {
  const dayRefByDate = new Map(source.days.map((day) => [day.marketDate, day.dayRef] as const));
  const expectedByBucket = new Map<string, CoachAiReviewSourceTrade[]>();
  for (const trade of input.expectedTrades) {
    const bucketRef = weekBucket(trade.marketDate);
    expectedByBucket.set(bucketRef, [...(expectedByBucket.get(bucketRef) ?? []), trade]);
  }
  const opportunityByBucket = new Map<string, CoachAiReviewSourceTrade[]>();
  for (const trade of input.opportunityTrades) {
    const bucketRef = weekBucket(trade.marketDate);
    opportunityByBucket.set(bucketRef, [...(opportunityByBucket.get(bucketRef) ?? []), trade]);
  }
  const buckets = Object.freeze([...opportunityByBucket.entries()]
    .sort(([left], [right]) => compareCoachAiReviewText(left, right))
    .map(([bucketRef, trades]) => Object.freeze({
      bucketRef,
      memberRefs: Object.freeze(trades.map((trade) => trade.tradeRef)
        .sort(compareCoachAiReviewText)),
      affectedMemberRefs: Object.freeze(trades.filter(input.affected)
        .map((trade) => trade.tradeRef).sort(compareCoachAiReviewText)),
      marketDateRefs: Object.freeze([...new Set(trades.map((trade) => {
        const dayRef = dayRefByDate.get(trade.marketDate);
        invariant(dayRef !== undefined, "TRADERLINK_AI_REVIEW_TREND_DAY_REF_MISSING");
        return dayRef;
      }))].sort(compareCoachAiReviewText)),
      expectedCount: expectedByBucket.get(bucketRef)?.length ?? trades.length,
      stratumKeyByMemberRef: Object.freeze(Object.fromEntries(trades.map((trade) =>
        [trade.tradeRef, stratumKey(trade)] as const))),
    })));
  for (const trendKind of ["improvement", "deterioration"] as const) {
    const trend = buildCoachAiReviewRateTrendCandidate({
      cadence: source.period.cadence,
      family: input.family,
      subjectRef: input.subjectRef,
      trendKind,
      improvementDirection: input.improvementDirection,
      observationUnit: "analyzer_covered_trade",
      resultOwnership: "trade_close_market_date",
      tradeStylePopulation: "objective_same_market_date",
      processClass: input.processClass,
      populationDefinition: input.populationDefinition,
      opportunityDefinition: input.opportunityDefinition,
      cohortDefinition: input.cohortDefinition,
      buckets,
      representativeEvidence: selectTrendRepresentatives(buckets, source.period.cadence, source),
      representativeEvidenceByOmittedBucket: trendRepresentativeSensitivity(
        buckets,
        source.period.cadence,
        source,
      ),
      representativeMetricName: "trade_net_pnl",
      relatedRuleRefs: [],
      relatedFocusRefs: [],
      overlapKeys: input.overlapKeys,
    });
    if (trend) values.push(trend);
  }
}

function addAnalyzerCandidates(
  values: CoachAiReviewInsightCandidate[],
  source: CoachAiReviewCalculationSource,
): void {
  const expected = analyzerEligibleTrades(source);
  const observed = analyzerPathTrades(source);
  const balance = coverageBalance(expected, observed);
  const common = {
    source,
    tradeStylePopulation: "objective_same_market_date" as const,
    expectedPopulationCount: expected.length,
    expectedPopulationTrades: expected,
    coverageBalance: balance,
    structuredSourceConsistency: 100,
    processClass: "analyzer_only" as const,
    populationDefinition: "Objective same-market-date trades eligible for current-version Analyzer paths.",
  };
  const entryEvidenceTrades = expected.filter((trade) =>
    trade.analyzer.linkedRoundTripVersionCurrent &&
    trade.analyzer.analysis.availability === "ready" &&
    trade.analyzer.analysis.events.some((event) => event.kind === "entry" &&
      event.oneMinute.favorableMoveUntilFlatDecimal !== null &&
      event.oneMinute.adverseMoveUntilFlatDecimal !== null));
  const strongEntryExamples = entryEvidenceTrades.filter((trade) => {
    if (trade.netPnlDecimal === null || new ExactDecimal(trade.netPnlDecimal).lte(0)) return false;
    const entry = trade.analyzer.analysis.events.filter((event) => event.kind === "entry")
      .sort((left, right) => left.sequence - right.sequence)[0]!;
    const favorable = new ExactDecimal(entry.oneMinute.favorableMoveUntilFlatDecimal!);
    const adverse = new ExactDecimal(entry.oneMinute.adverseMoveUntilFlatDecimal!).abs();
    return favorable.gt(0) && (adverse.isZero() || favorable.dividedBy(adverse).gte(2));
  }).sort((left, right) => new ExactDecimal(right.netPnlDecimal!)
    .comparedTo(left.netPnlDecimal!) || compareTradesStable(left, right))
    .slice(0, 5);
  for (const example of strongEntryExamples) {
    candidate(values, behaviorSource({
      source,
      family: "entry_evidence",
      lane: "strength",
      polarity: "positive",
      subjectRef: `entry_example:${example.tradeRef}`,
      tradeStylePopulation: "objective_same_market_date",
      populationDefinition: "Current-version same-market-date trades with measured entry excursion.",
      opportunityDefinition: "Initial-entry events with both favorable and adverse movement available.",
      cohortDefinition: "One profitable trade whose favorable move was at least twice its adverse move.",
      comparisonDefinition: "Other current-version trades with measured initial-entry excursion.",
      observations: tradeBehaviorObservations(entryEvidenceTrades, (trade) =>
        trade.tradeRef === example.tradeRef),
      processClass: "analyzer_only",
      resultPolarity: "positive",
      expectedPopulationCount: expected.length,
      expectedPopulationTrades: expected,
      coverageBalance: coverageBalance(expected, entryEvidenceTrades),
      recurringEvidenceAllowed: false,
      allowSpecificExample: true,
      overlapKeys: [`trade:${example.tradeRef}`, "entry:strong_example"],
    }));
  }
  const movedGreenTrades = observed.filter((trade) =>
    trade.analyzer.analysis.greenToRed?.status !== "never_green");
  const crossedGreenToRedTrades = observed.filter((trade) =>
    trade.analyzer.analysis.greenToRed?.status.startsWith("green_to_red_") === true);
  const endedRedTrades = movedGreenTrades.filter((trade) =>
    trade.analyzer.analysis.greenToRed?.status === "green_to_red_ended_red");
  const recoveredTrades = crossedGreenToRedTrades.filter((trade) =>
    trade.analyzer.analysis.greenToRed?.status === "green_to_red_recovered");
  candidate(values, behaviorSource({
    ...common,
    family: "favorable_move_outcome",
    lane: "friction",
    polarity: "negative",
    subjectRef: "favorable_move:green_to_red_ended_red",
    opportunityDefinition: "Current-version Analyzer trades that first moved green.",
    cohortDefinition: "Trades whose measured path moved green, crossed red and ended red.",
    comparisonDefinition: "Other current-version Analyzer-covered same-market-date trades.",
    observations: tradeBehaviorObservations(movedGreenTrades, (trade) =>
      trade.analyzer.analysis.greenToRed?.status === "green_to_red_ended_red"),
    additionalMeasurements: [
      analyzerPathMoneyMeasurement({
        metricName: "ended_red_combined_measured_peak_pnl",
        affectedTrades: endedRedTrades,
        denominatorTrades: movedGreenTrades,
        value: (trade) => trade.analyzer.analysis.greenToRed?.feesComplete
          ? trade.analyzer.analysis.greenToRed.peakPnlDecimal
          : null,
      }),
      analyzerPathMoneyMeasurement({
        metricName: "ended_red_combined_peak_to_final_reversal",
        affectedTrades: endedRedTrades,
        denominatorTrades: movedGreenTrades,
        value: (trade) => trade.analyzer.analysis.greenToRed?.feesComplete
          ? trade.analyzer.analysis.greenToRed.peakToFinalReversalDecimal
          : null,
      }),
    ],
    resultPolarity: "negative",
    allowSpecificExample: true,
    allowMaterialOutlier: true,
    overlapKeys: ["analyzer:path:green_to_red_ended_red"],
  }));
  candidate(values, behaviorSource({
    ...common,
    family: "positive_process",
    lane: "strength",
    polarity: "positive",
    subjectRef: "favorable_move:green_to_red_recovered",
    opportunityDefinition: "Current-version Analyzer trades that crossed from green to red.",
    cohortDefinition: "Trades that recovered above breakeven after a measured green-to-red path.",
    comparisonDefinition: "Other current-version Analyzer-covered same-market-date trades.",
    observations: tradeBehaviorObservations(crossedGreenToRedTrades, (trade) =>
      trade.analyzer.analysis.greenToRed?.status === "green_to_red_recovered"),
    additionalMeasurements: [
      analyzerPathMoneyMeasurement({
        metricName: "recovered_combined_final_pnl",
        affectedTrades: recoveredTrades,
        denominatorTrades: crossedGreenToRedTrades,
        value: (trade) => trade.analyzer.analysis.greenToRed?.feesComplete
          ? trade.analyzer.analysis.greenToRed.finalPnlDecimal
          : null,
      }),
    ],
    resultPolarity: "positive",
    allowSpecificExample: true,
    overlapKeys: ["analyzer:path:green_to_red_recovered"],
  }));
  const moneyPathObserved = observed.filter((trade) => {
    const path = trade.analyzer.analysis.greenToRed;
    return path?.feesComplete === true && path.peakPnlDecimal !== null &&
      path.finalPnlDecimal !== null && path.peakToFinalReversalDecimal !== null &&
      new ExactDecimal(path.peakPnlDecimal).gt(0);
  });
  const givebackRatio = (trade: CoachAiReviewSourceTrade): Decimal => {
    const path = trade.analyzer.analysis.greenToRed!;
    return new ExactDecimal(path.peakToFinalReversalDecimal!).abs()
      .dividedBy(path.peakPnlDecimal!);
  };
  const largeGivebackTrades = moneyPathObserved.filter((trade) => {
    const path = trade.analyzer.analysis.greenToRed!;
    return new ExactDecimal(path.finalPnlDecimal!).gt(0) && givebackRatio(trade).gte("0.5");
  });
  const retainedPeakTrades = moneyPathObserved.filter((trade) =>
    new ExactDecimal(1).minus(givebackRatio(trade)).gte("0.7"));
  candidate(values, behaviorSource({
    ...common,
    family: "favorable_move_outcome",
    lane: "friction",
    polarity: "negative",
    subjectRef: "favorable_move:profitable_large_giveback_50_percent",
    opportunityDefinition: "Fee-complete Analyzer paths with a positive measured peak.",
    cohortDefinition: "Profitable trades that gave back at least half of measured peak P/L.",
    comparisonDefinition: "Other fee-complete positive-peak Analyzer paths.",
    observations: tradeBehaviorObservations(moneyPathObserved, (trade) =>
      largeGivebackTrades.some((item) => item.tradeRef === trade.tradeRef)),
    additionalMeasurements: [
      analyzerPathMoneyMeasurement({
        metricName: "large_giveback_combined_measured_peak_pnl",
        affectedTrades: largeGivebackTrades,
        denominatorTrades: moneyPathObserved,
        value: (trade) => trade.analyzer.analysis.greenToRed!.peakPnlDecimal,
      }),
      analyzerPathMoneyMeasurement({
        metricName: "large_giveback_combined_peak_to_final_reversal",
        affectedTrades: largeGivebackTrades,
        denominatorTrades: moneyPathObserved,
        value: (trade) => trade.analyzer.analysis.greenToRed!.peakToFinalReversalDecimal,
      }),
    ],
    expectedPopulationCount: expected.length,
    resultPolarity: "negative",
    allowSpecificExample: true,
    allowMaterialOutlier: true,
    overlapKeys: ["analyzer:path:peak_to_final_giveback"],
  }));
  candidate(values, behaviorSource({
    ...common,
    family: "positive_process",
    lane: "strength",
    polarity: "positive",
    subjectRef: "favorable_move:retained_70_percent_of_peak",
    opportunityDefinition: "Fee-complete Analyzer paths with a positive measured peak.",
    cohortDefinition: "Trades that retained at least 70 percent of measured peak P/L.",
    comparisonDefinition: "Other fee-complete positive-peak Analyzer paths.",
    observations: tradeBehaviorObservations(moneyPathObserved, (trade) =>
      retainedPeakTrades.some((item) => item.tradeRef === trade.tradeRef)),
    additionalMeasurements: [
      analyzerPathMoneyMeasurement({
        metricName: "retained_peak_combined_final_pnl",
        affectedTrades: retainedPeakTrades,
        denominatorTrades: moneyPathObserved,
        value: (trade) => trade.analyzer.analysis.greenToRed!.finalPnlDecimal,
      }),
    ],
    expectedPopulationCount: expected.length,
    resultPolarity: "positive",
    allowSpecificExample: true,
    overlapKeys: ["analyzer:path:peak_retention"],
  }));
  const addTrades = expected.filter((trade) => trade.executionEvents.some((event) =>
    eventInsidePeriod(event.executedAtUtc, source) && event.role === "adding"));
  const addPathTrades = observed.filter((trade) => addTrades.some((item) =>
    item.tradeRef === trade.tradeRef));
  const addedAfterPeakTrades = addPathTrades.filter((trade) =>
    (trade.analyzer.analysis.greenToRed?.addedAfterPeakCount ?? 0) > 0);
  candidate(values, behaviorSource({
    source,
    family: "add_sequence",
    lane: "friction",
    polarity: "negative",
    subjectRef: "add_sequence:add_after_measured_peak",
    tradeStylePopulation: "objective_same_market_date",
    populationDefinition: "Same-market-date trades with at least one recorded add.",
    opportunityDefinition: "Add trades with current-version measured path evidence.",
    cohortDefinition: "Trades with one or more adds after the measured P/L peak.",
    comparisonDefinition: "Other add trades with current-version measured path evidence.",
    observations: tradeBehaviorObservations(addPathTrades, (trade) =>
      (trade.analyzer.analysis.greenToRed?.addedAfterPeakCount ?? 0) > 0),
    additionalMeasurements: [analyzerPathCountMeasurement({
      metricName: "add_after_peak_event_count",
      affectedTrades: addedAfterPeakTrades,
      denominatorTrades: addPathTrades,
      count: (trade) => trade.analyzer.analysis.greenToRed?.addedAfterPeakCount ?? 0,
    })],
    processClass: "analyzer_only",
    resultPolarity: "negative",
    expectedPopulationCount: addTrades.length,
    expectedPopulationTrades: addTrades,
    coverageBalance: coverageBalance(addTrades, addPathTrades),
    allowSpecificExample: true,
    allowMaterialOutlier: true,
    overlapKeys: ["analyzer:path:add_after_peak", "sequence:add"],
  }));
  const partialRecoveryOpportunityTrades = crossedGreenToRedTrades;
  const partialRecoveryTrades = partialRecoveryOpportunityTrades.filter((trade) => {
    const path = trade.analyzer.analysis.greenToRed!;
    return path.partialExitBeforeRedCount > 0 && path.status === "green_to_red_recovered";
  });
  candidate(values, behaviorSource({
    source,
    family: "exit_sequence",
    lane: "strength",
    polarity: "positive",
    subjectRef: "exit_sequence:partial_before_red_then_recovered",
    tradeStylePopulation: "objective_same_market_date",
    populationDefinition: "Current-version Analyzer trades that crossed from green to red.",
    opportunityDefinition: "Green-to-red paths with observed partial-exit sequencing.",
    cohortDefinition: "Trades with a partial exit before red that later recovered above breakeven.",
    comparisonDefinition: "Other current-version green-to-red paths.",
    observations: tradeBehaviorObservations(partialRecoveryOpportunityTrades, (trade) => {
        const path = trade.analyzer.analysis.greenToRed!;
        return path.partialExitBeforeRedCount > 0 && path.status === "green_to_red_recovered";
      }),
    additionalMeasurements: [analyzerPathCountMeasurement({
      metricName: "partial_exit_before_red_event_count",
      affectedTrades: partialRecoveryTrades,
      denominatorTrades: partialRecoveryOpportunityTrades,
      count: (trade) => trade.analyzer.analysis.greenToRed?.partialExitBeforeRedCount ?? 0,
    })],
    processClass: "analyzer_only",
    resultPolarity: "positive",
    expectedPopulationCount: expected.length,
    expectedPopulationTrades: expected,
    coverageBalance: balance,
    allowSpecificExample: true,
    overlapKeys: ["analyzer:path:partial_before_red", "sequence:exit"],
  }));
  addTradeRateTrends(values, source, {
    family: "favorable_move_outcome",
    subjectRef: "trend:favorable_move:green_to_red_ended_red",
    opportunityTrades: observed.filter((trade) =>
      trade.analyzer.analysis.greenToRed?.status !== "never_green"),
    expectedTrades: expected,
    affected: (trade) =>
      trade.analyzer.analysis.greenToRed?.status === "green_to_red_ended_red",
    improvementDirection: "lower_is_better",
    processClass: "analyzer_only",
    populationDefinition: "Current-version same-market-date Analyzer path observations by calendar week.",
    opportunityDefinition: "Analyzer paths that first moved green.",
    cohortDefinition: "Weekly green-to-red paths that ended red.",
    overlapKeys: ["analyzer:path:green_to_red_ended_red"],
  });
  addTradeRateTrends(values, source, {
    family: "add_sequence",
    subjectRef: "trend:add_sequence:add_after_measured_peak",
    opportunityTrades: addPathTrades,
    expectedTrades: addTrades,
    affected: (trade) => (trade.analyzer.analysis.greenToRed?.addedAfterPeakCount ?? 0) > 0,
    improvementDirection: "lower_is_better",
    processClass: "analyzer_only",
    populationDefinition: "Recorded add trades by calendar week.",
    opportunityDefinition: "Add trades with current-version measured path evidence.",
    cohortDefinition: "Weekly add trades with at least one add after the measured P/L peak.",
    overlapKeys: ["analyzer:path:add_after_peak", "sequence:add"],
  });
}

function addRuleCandidates(
  values: CoachAiReviewInsightCandidate[],
  source: CoachAiReviewCalculationSource,
  bundles: readonly RuleOpportunityBundle[],
): void {
  const money = periodMoney(source);
  const outcomes = measureCoachAiReviewPeriodOutcomes(money);
  for (const bundle of bundles) {
    const bucketByTargetRef = Object.fromEntries(bundle.opportunities.map((opportunity) => [
      opportunity.targetRef,
      bucketForTarget(opportunity.targetRef, source) ?? "calendar_week:unknown",
    ]));
    const sensitivityBucketRefs = [...new Set([
      ...Object.values(bucketByTargetRef),
      ...money.map((observation) => observation.bucketRef),
    ])].sort(compareCoachAiReviewText);
    values.push(...buildCoachAiReviewNamedRuleCandidates({
      ruleRef: bundle.rule.ruleRef,
      ruleVersionRef: bundle.rule.ruleVersionRef,
      ruleTitle: bundle.rule.title,
      targetKind: bundle.targetKind,
      presetCoreRule: bundle.rule.sourceKind === "template",
      cadence: source.period.cadence,
      opportunities: bundle.opportunities,
      bucketByTargetRef: Object.freeze(bucketByTargetRef),
      moneyObservations: money,
      periodOutcomes: outcomes,
      representativeEvidence: Object.freeze({
        negative: selectRuleRepresentatives(bundle, source, "negative"),
        positive: selectRuleRepresentatives(bundle, source, "positive"),
      }),
      representativeEvidenceByOmittedBucket: Object.freeze(Object.fromEntries(
        sensitivityBucketRefs.map((bucketRef) => {
          const reducedBundle = Object.freeze({
            ...bundle,
            opportunities: Object.freeze(bundle.opportunities.filter((opportunity) =>
              bucketByTargetRef[opportunity.targetRef] !== bucketRef)),
          });
          return [bucketRef, Object.freeze({
            negative: selectRuleRepresentatives(reducedBundle, source, "negative"),
            positive: selectRuleRepresentatives(reducedBundle, source, "positive"),
          })];
        }),
      )),
    }));
    const buckets = ruleTrendBuckets(bundle, source);
    for (const trendKind of ["improvement", "deterioration"] as const) {
      const trend = buildCoachAiReviewRateTrendCandidate({
        cadence: source.period.cadence,
        family: "rule_trend",
        subjectRef: bundle.rule.ruleVersionRef,
        subjectLabel: bundle.rule.title,
        trendKind,
        improvementDirection: "lower_is_better",
        observationUnit: "rule_review_opportunity",
        resultOwnership: "rule_target",
        tradeStylePopulation: "unknown_or_mixed",
        processClass: bundle.rule.sourceKind === "template"
          ? "preset_core_rule"
          : "named_rule_or_exact_focus",
        populationDefinition: "Comparable observed opportunities for the same rule version and target kind.",
        opportunityDefinition: "Active, historically applicable targets for the same rule version.",
        cohortDefinition: "Broken recorded or deterministic preset outcomes, with conflicts excluded.",
        buckets,
        representativeEvidence: selectTrendRepresentatives(
          buckets,
          source.period.cadence,
          source,
        ),
        representativeEvidenceByOmittedBucket: trendRepresentativeSensitivity(
          buckets,
          source.period.cadence,
          source,
        ),
        representativeMetricName: bundle.targetKind === "round_trip"
          ? "trade_net_pnl"
          : "market_date_chronology",
        relatedRuleRefs: [bundle.rule.ruleRef],
        relatedFocusRefs: [],
        overlapKeys: [`rule:${bundle.rule.ruleVersionRef}:${bundle.targetKind}`],
      });
      if (trend) values.push(trend);
    }
    addRuleSequenceCandidate(values, source, bundle);
    addRuleResultContrasts(values, source, bundle);
  }
}

function addRuleSequenceCandidate(
  values: CoachAiReviewInsightCandidate[],
  source: CoachAiReviewCalculationSource,
  bundle: RuleOpportunityBundle,
): void {
  const templateKey = bundle.rule.templateKey;
  if (!templateKey || bundle.rule.sourceKind !== "template") return;
  const family = templateKey === "exclude_entry_price_range"
    ? "entry_evidence" as const
    : REENTRY_TEMPLATE_KEYS.has(templateKey)
      ? "reentry_day_sequence" as const
      : DAILY_BOUNDARY_TEMPLATE_KEYS.has(templateKey)
        ? "risk_stop_sizing" as const
        : null;
  if (!family) return;
  const affectedRefs = new Set(bundle.opportunities.flatMap((opportunity) =>
    comparableRuleState(opportunity) === "broken"
      ? opportunity.authorizedViolationTradeRefs.length > 0
        ? opportunity.authorizedViolationTradeRefs
        : opportunity.targetKind === "round_trip" ? [opportunity.targetRef] : []
      : []));
  const opportunityTradeRefs = new Set(bundle.opportunities.flatMap((opportunity) => {
    if (!opportunity.isReviewOpportunity) return [];
    if (opportunity.targetKind === "round_trip") return [opportunity.targetRef];
    return source.days.find((day) => day.dayRef === opportunity.targetRef)?.tradeRefs ?? [];
  }));
  const trades = source.trades.filter((trade) => opportunityTradeRefs.has(trade.tradeRef));
  candidate(values, behaviorSource({
    source,
    family,
    lane: "friction",
    polarity: "negative",
    subjectRef: `preset_sequence:${templateKey}:${bundle.rule.ruleVersionRef}`,
    subjectLabel: bundle.rule.title,
    tradeStylePopulation: "objective_same_market_date",
    populationDefinition: "Trades inside exact applicable preset-rule targets.",
    opportunityDefinition: "Trades reached by the same deterministic preset-rule version.",
    cohortDefinition: "Exact preset violation members only; day P/L is not assigned to the violation.",
    comparisonDefinition: "Other trades inside exact applicable targets for the same preset rule version.",
    observations: tradeBehaviorObservations(trades, (trade) => affectedRefs.has(trade.tradeRef)),
    processClass: "preset_core_rule",
    resultPolarity: "negative",
    expectedPopulationCount: trades.length,
    expectedPopulationTrades: trades,
    structuredSourceConsistency: 100 * bundle.opportunities.filter((item) =>
      item.sourceConsistency !== "conflict").length / Math.max(1, bundle.opportunities.length),
    allowSpecificExample: true,
    allowMaterialOutlier: true,
    relatedRuleRefs: [bundle.rule.ruleRef],
    overlapKeys: [`rule:${bundle.rule.ruleVersionRef}:${bundle.targetKind}`,
      `preset_sequence:${templateKey}`],
  }));
}

function addRuleResultContrasts(
  values: CoachAiReviewInsightCandidate[],
  source: CoachAiReviewCalculationSource,
  bundle: RuleOpportunityBundle,
): void {
  if (bundle.targetKind !== "round_trip") return;
  const tradeByRef = new Map(source.trades.map((trade) => [trade.tradeRef, trade] as const));
  const opportunities = bundle.opportunities.filter((item) =>
    item.isReviewOpportunity && tradeByRef.has(item.targetRef));
  const trades = opportunities.map((item) => tradeByRef.get(item.targetRef)!);
  candidate(values, behaviorSource({
    source,
    family: "result_process_contrast",
    lane: "contrast",
    polarity: "mixed",
    subjectRef: `contrast:profitable_broken:${bundle.rule.ruleVersionRef}`,
    subjectLabel: bundle.rule.title,
    tradeStylePopulation: "unknown_or_mixed",
    populationDefinition: "Exact trade opportunities for one rule version.",
    opportunityDefinition: "Active, historically applicable trade-rule targets.",
    cohortDefinition: "Profitable trades with a broken recorded or deterministic preset outcome.",
    comparisonDefinition: "Other exact trade opportunities for the same rule version.",
    observations: tradeBehaviorObservations(trades, (trade) => {
      const state = comparableRuleState(opportunities.find((item) =>
        item.targetRef === trade.tradeRef)!);
      return state === "broken" && trade.netPnlDecimal !== null &&
        new ExactDecimal(trade.netPnlDecimal).gt(0);
    }),
    processClass: "named_rule_or_exact_focus",
    resultPolarity: "positive",
    expectedPopulationCount: opportunities.length,
    expectedPopulationTrades: trades,
    allowSpecificExample: true,
    relatedRuleRefs: [bundle.rule.ruleRef],
    overlapKeys: [`rule:${bundle.rule.ruleVersionRef}:round_trip`, "contrast:profitable_broken"],
  }));
  candidate(values, behaviorSource({
    source,
    family: "result_process_contrast",
    lane: "contrast",
    polarity: "mixed",
    subjectRef: `contrast:losing_followed:${bundle.rule.ruleVersionRef}`,
    subjectLabel: bundle.rule.title,
    tradeStylePopulation: "unknown_or_mixed",
    populationDefinition: "Exact trade opportunities for one rule version.",
    opportunityDefinition: "Active, historically applicable trade-rule targets.",
    cohortDefinition: "Losing trades with a followed recorded or deterministic preset outcome.",
    comparisonDefinition: "Other exact trade opportunities for the same rule version.",
    observations: tradeBehaviorObservations(trades, (trade) => {
      const state = comparableRuleState(opportunities.find((item) =>
        item.targetRef === trade.tradeRef)!);
      return state === "followed" && trade.netPnlDecimal !== null &&
        new ExactDecimal(trade.netPnlDecimal).lt(0);
    }),
    processClass: "named_rule_or_exact_focus",
    resultPolarity: "negative",
    expectedPopulationCount: opportunities.length,
    expectedPopulationTrades: trades,
    allowSpecificExample: true,
    relatedRuleRefs: [bundle.rule.ruleRef],
    overlapKeys: [`rule:${bundle.rule.ruleVersionRef}:round_trip`, "contrast:losing_followed"],
  }));
}

function exactNet(trades: readonly CoachAiReviewSourceTrade[]): Decimal | null {
  if (trades.length === 0 || trades.some((trade) => trade.netPnlDecimal === null)) return null;
  if (new Set(trades.map((trade) => trade.currency)).size !== 1) return null;
  return trades.reduce((total, trade) => total.plus(trade.netPnlDecimal!), new ExactDecimal(0));
}

function addSegmentCandidate(
  values: CoachAiReviewInsightCandidate[],
  source: CoachAiReviewCalculationSource,
  input: Readonly<{
    dimension: string;
    group: string;
    groupLabel?: string;
    eligibleTrades: readonly CoachAiReviewSourceTrade[];
    affected: (trade: CoachAiReviewSourceTrade) => boolean;
    siblingCount: number;
    tradeStylePopulation: CoachAiReviewTradeStylePopulation;
  }>,
): void {
  const affectedTrades = input.eligibleTrades.filter(input.affected);
  const net = exactNet(affectedTrades);
  if (net === null || net.isZero()) return;
  const negative = net.lt(0);
  candidate(values, behaviorSource({
    source,
    family: "fixed_cohort",
    lane: negative ? "friction" : "contrast",
    polarity: negative ? "negative" : "mixed",
    subjectRef: `segment:${input.dimension}:${input.group}`,
    subjectLabel: `${input.dimension.replaceAll("_", " ")}: ${input.groupLabel ?? input.group}`,
    tradeStylePopulation: input.tradeStylePopulation,
    populationDefinition: `All eligible trades for the fixed ${input.dimension} dimension.`,
    opportunityDefinition: null,
    cohortDefinition: `Trades in the fixed ${input.dimension} group ${input.groupLabel ?? input.group}.`,
    comparisonDefinition: `The fixed ${input.dimension} group versus the eligible remainder.`,
    observations: tradeBehaviorObservations(input.eligibleTrades, input.affected),
    processClass: "fixed_result_cohort",
    resultPolarity: negative ? "negative" : "positive",
    expectedPopulationCount: input.eligibleTrades.length,
    expectedPopulationTrades: input.eligibleTrades,
    exploratorySiblingCount: input.siblingCount,
    allowSpecificExample: true,
    overlapKeys: [`segment:${input.dimension}:${input.group}`],
  }));
}

function entryMinutes(executedAtUtc: string): number {
  const parts = Object.fromEntries(easternTime.formatToParts(new Date(executedAtUtc))
    .filter((part) => part.type === "hour" || part.type === "minute")
    .map((part) => [part.type, Number(part.value)]));
  invariant(Number.isInteger(parts.hour) && Number.isInteger(parts.minute),
    "TRADERLINK_AI_REVIEW_ENTRY_TIME_INVALID");
  return parts.hour! * 60 + parts.minute!;
}

function bucketKey(
  value: number,
  buckets: readonly Readonly<{ key: string; start: number; end: number }>[],
): string {
  const bucket = buckets.find((item) => value >= item.start && value < item.end);
  invariant(bucket !== undefined, "TRADERLINK_AI_REVIEW_FIXED_BUCKET_MISSING");
  return bucket.key;
}

function addSegmentCandidates(
  values: CoachAiReviewInsightCandidate[],
  source: CoachAiReviewCalculationSource,
): void {
  const all = source.trades;
  const dimensions: readonly Readonly<{
    name: string;
    eligible: readonly CoachAiReviewSourceTrade[];
    group: (trade: CoachAiReviewSourceTrade) => readonly string[];
    groupLabel?: (group: string) => string;
    population: CoachAiReviewTradeStylePopulation;
  }>[] = [
    Object.freeze({ name: "ticker", eligible: all,
      group: (trade: CoachAiReviewSourceTrade) => [trade.instrumentRef],
      groupLabel: (group: string) => all.find((trade) =>
        trade.instrumentRef === group)?.ticker ?? "Unknown ticker",
      population: "all_closed_trades" as const }),
    Object.freeze({ name: "tag", eligible: all,
      group: (trade: CoachAiReviewSourceTrade) => trade.tags,
      population: "all_closed_trades" as const }),
    Object.freeze({ name: "direction", eligible: all,
      group: (trade: CoachAiReviewSourceTrade) => [trade.direction],
      population: "all_closed_trades" as const }),
    Object.freeze({ name: "weekday", eligible: all,
      group: (trade: CoachAiReviewSourceTrade) => [String(
        new Date(`${trade.marketDate}T12:00:00.000Z`).getUTCDay(),
      )], population: "all_closed_trades" as const }),
  ];
  for (const dimension of dimensions) {
    const groups = [...new Set(dimension.eligible.flatMap(dimension.group))]
      .sort((left, right) => compareCoachAiReviewText(
        dimension.groupLabel?.(left) ?? left,
        dimension.groupLabel?.(right) ?? right,
      ));
    for (const group of groups) {
      addSegmentCandidate(values, source, {
        dimension: dimension.name,
        group,
        ...(dimension.groupLabel ? { groupLabel: dimension.groupLabel(group) } : {}),
        eligibleTrades: dimension.eligible,
        affected: (trade) => dimension.group(trade).includes(group),
        siblingCount: groups.length,
        tradeStylePopulation: dimension.population,
      });
    }
  }
  const declaredDayTrades = all.filter((trade) =>
    tradeStylePopulation(trade) === "declared_day" && eventInsidePeriod(trade.openedAtUtc, source));
  const objectiveDayTrades = all.filter((trade) =>
    tradeStylePopulation(trade) === "objective_same_market_date");
  const swingTrades = all.filter((trade) => tradeStylePopulation(trade) === "declared_swing");
  for (const input of [
    Object.freeze({ name: "entry_time_declared_day", eligible: declaredDayTrades,
      buckets: ENTRY_TIME_BUCKETS, value: (trade: CoachAiReviewSourceTrade) =>
        entryMinutes(trade.openedAtUtc), population: "declared_day" as const }),
    Object.freeze({ name: "duration_declared_day", eligible: declaredDayTrades,
      buckets: DAY_DURATION_BUCKETS, value: (trade: CoachAiReviewSourceTrade) =>
        trade.holdingDurationMilliseconds, population: "declared_day" as const }),
    Object.freeze({ name: "entry_time_objective_same_date", eligible: objectiveDayTrades,
      buckets: ENTRY_TIME_BUCKETS, value: (trade: CoachAiReviewSourceTrade) =>
        entryMinutes(trade.openedAtUtc), population: "objective_same_market_date" as const }),
    Object.freeze({ name: "duration_objective_same_date", eligible: objectiveDayTrades,
      buckets: DAY_DURATION_BUCKETS, value: (trade: CoachAiReviewSourceTrade) =>
        trade.holdingDurationMilliseconds, population: "objective_same_market_date" as const }),
    Object.freeze({ name: "duration_swing", eligible: swingTrades,
      buckets: SWING_DURATION_BUCKETS, value: (trade: CoachAiReviewSourceTrade) =>
        trade.holdingDurationMilliseconds, population: "declared_swing" as const }),
  ]) {
    const groupByRef = new Map(input.eligible.map((trade) => [
      trade.tradeRef,
      bucketKey(input.value(trade), input.buckets),
    ] as const));
    const groups = [...new Set(groupByRef.values())].sort(compareCoachAiReviewText);
    for (const group of groups) {
      addSegmentCandidate(values, source, {
        dimension: input.name,
        group,
        eligibleTrades: input.eligible,
        affected: (trade) => groupByRef.get(trade.tradeRef) === group,
        siblingCount: groups.length,
        tradeStylePopulation: input.population,
      });
    }
  }
}

function addConcentrationCandidates(
  values: CoachAiReviewInsightCandidate[],
  source: CoachAiReviewCalculationSource,
): void {
  const complete = source.trades.filter((trade) => trade.netPnlDecimal !== null);
  const losses = complete.filter((trade) => new ExactDecimal(trade.netPnlDecimal!).lt(0))
    .sort((left, right) => new ExactDecimal(left.netPnlDecimal!).comparedTo(right.netPnlDecimal!) ||
      compareTradesStable(left, right));
  const winners = complete.filter((trade) => new ExactDecimal(trade.netPnlDecimal!).gt(0))
    .sort((left, right) => new ExactDecimal(right.netPnlDecimal!).comparedTo(left.netPnlDecimal!) ||
      compareTradesStable(left, right));
  for (const input of [
    Object.freeze({ subject: "largest_loser", members: losses.slice(0, 1),
      lane: "friction" as const, polarity: "negative" as const,
      resultPolarity: "negative" as const }),
    Object.freeze({ subject: "three_largest_losers", members: losses.slice(0, 3),
      lane: "friction" as const, polarity: "negative" as const,
      resultPolarity: "negative" as const }),
    Object.freeze({ subject: "five_largest_losers", members: losses.slice(0, 5),
      lane: "friction" as const, polarity: "negative" as const,
      resultPolarity: "negative" as const }),
    Object.freeze({ subject: "largest_winner_reliance", members: winners.slice(0, 1),
      lane: "contrast" as const, polarity: "mixed" as const,
      resultPolarity: "positive" as const }),
    Object.freeze({ subject: "three_largest_winners", members: winners.slice(0, 3),
      lane: "contrast" as const, polarity: "mixed" as const,
      resultPolarity: "positive" as const }),
    Object.freeze({ subject: "five_largest_winners", members: winners.slice(0, 5),
      lane: "contrast" as const, polarity: "mixed" as const,
      resultPolarity: "positive" as const }),
  ]) {
    const refs = new Set(input.members.map((trade) => trade.tradeRef));
    candidate(values, behaviorSource({
      source,
      family: "concentration_outlier",
      lane: input.lane,
      polarity: input.polarity,
      subjectRef: `concentration:${input.subject}`,
      subjectLabel: input.subject.replaceAll("_", " "),
      tradeStylePopulation: "all_closed_trades",
      populationDefinition: "All money-complete closed trades in the period.",
      opportunityDefinition: null,
      cohortDefinition: `The fixed ${input.subject.replaceAll("_", " ")} result cohort.`,
      comparisonDefinition: "The selected result outlier versus the remaining money-complete trades.",
      observations: tradeBehaviorObservations(complete, (trade) => refs.has(trade.tradeRef)),
      processClass: "fixed_result_cohort",
      resultPolarity: input.resultPolarity,
      expectedPopulationCount: source.trades.length,
      expectedPopulationTrades: source.trades,
      recurringEvidenceAllowed: false,
      allowSpecificExample: true,
      allowMaterialOutlier: true,
      overlapKeys: [`concentration:${input.subject}`],
    }));
  }
  const byDate = new Map<string, CoachAiReviewSourceTrade[]>();
  for (const trade of complete) {
    byDate.set(trade.marketDate, [...(byDate.get(trade.marketDate) ?? []), trade]);
  }
  const completeDays = [...byDate.entries()].flatMap(([marketDate, trades]) => {
    const net = exactNet(trades);
    return net === null ? [] : [Object.freeze({ marketDate, trades, net })];
  });
  const worstDay = [...completeDays].sort((left, right) =>
    left.net.comparedTo(right.net) || compareCoachAiReviewText(left.marketDate, right.marketDate))[0];
  const bestDay = [...completeDays].sort((left, right) =>
    right.net.comparedTo(left.net) || compareCoachAiReviewText(left.marketDate, right.marketDate))[0];
  for (const input of [
    ...(worstDay && worstDay.net.lt(0)
      ? [Object.freeze({ subject: "worst_day", day: worstDay,
          lane: "friction" as const, polarity: "negative" as const,
          resultPolarity: "negative" as const })]
      : []),
    ...(bestDay && bestDay.net.gt(0)
      ? [Object.freeze({ subject: "best_day_reliance", day: bestDay,
          lane: "contrast" as const, polarity: "mixed" as const,
          resultPolarity: "positive" as const })]
      : []),
  ]) {
    const refs = new Set(input.day.trades.map((trade) => trade.tradeRef));
    candidate(values, behaviorSource({
      source,
      family: "concentration_outlier",
      lane: input.lane,
      polarity: input.polarity,
      subjectRef: `concentration:${input.subject}:${input.day.marketDate}`,
      subjectLabel: `${input.subject.replaceAll("_", " ")} ${input.day.marketDate}`,
      tradeStylePopulation: "all_closed_trades",
      populationDefinition: "All money-complete closed trades in the period.",
      opportunityDefinition: null,
      cohortDefinition: `Trades closed on the period's ${input.subject.replaceAll("_", " ")}.`,
      comparisonDefinition: "That day's closed trades versus all other money-complete period trades.",
      observations: tradeBehaviorObservations(complete, (trade) => refs.has(trade.tradeRef)),
      processClass: "fixed_result_cohort",
      resultPolarity: input.resultPolarity,
      expectedPopulationCount: source.trades.length,
      expectedPopulationTrades: source.trades,
      recurringEvidenceAllowed: false,
      allowSpecificExample: true,
      allowMaterialOutlier: input.day.trades.length === 1,
      overlapKeys: [`concentration:${input.subject}`, `market_date:${input.day.marketDate}`],
    }));
  }
}

function rsiBand(value: number): string | null {
  if (!Number.isFinite(value) || value < 0 || value > 100) return null;
  return RSI_BANDS.find((band) => value >= band.minimum &&
    (value < band.maximum || band.includeMaximum && value === band.maximum))?.key ?? null;
}

function addRsiCandidates(
  values: CoachAiReviewInsightCandidate[],
  source: CoachAiReviewCalculationSource,
  enabled: boolean,
): void {
  if (!enabled) return;
  const events = analyzerEligibleTrades(source).flatMap((trade) => {
    if (!trade.analyzer.linkedRoundTripVersionCurrent ||
        trade.analyzer.analysis.availability !== "ready") return [];
    const initialEntry = trade.analyzer.analysis.events.filter((event) => event.kind === "entry")
      .sort((left, right) => left.sequence - right.sequence)[0];
    const finalExit = trade.analyzer.analysis.events.filter((event) => event.kind === "final_exit")
      .sort((left, right) => right.sequence - left.sequence)[0];
    return [
      ...(initialEntry ? [Object.freeze({ trade, role: "entry" as const, event: initialEntry })] : []),
      ...(finalExit ? [Object.freeze({ trade, role: "final_exit" as const, event: finalExit })] : []),
    ].filter((item) => item.event.oneMinute.rsi14CalculationVersion === "wilder_rsi_14_v1" &&
      item.event.oneMinute.rsi14 !== null && rsiBand(item.event.oneMinute.rsi14) !== null);
  });
  const groups = [...new Set(events.map((item) =>
    `${item.trade.direction}:${item.role}:${rsiBand(item.event.oneMinute.rsi14!)}`))]
    .sort(compareCoachAiReviewText);
  for (const group of groups) {
    const [direction, role, band] = group.split(":");
    const comparable = events.filter((item) => item.trade.direction === direction && item.role === role);
    const affectedRefs = new Set(comparable.filter((item) =>
      rsiBand(item.event.oneMinute.rsi14!) === band).map((item) => item.trade.tradeRef));
    const trades = comparable.map((item) => item.trade);
    const net = exactNet(trades.filter((trade) => affectedRefs.has(trade.tradeRef)));
    if (net === null || net.isZero()) continue;
    candidate(values, behaviorSource({
      source,
      family: role === "entry" ? "entry_evidence" : "exit_sequence",
      lane: "contrast",
      polarity: "mixed",
      subjectRef: `rsi14:${group}`,
      tradeStylePopulation: "objective_same_market_date",
      populationDefinition: `Corrected-version ${direction} ${role} RSI observations.`,
      opportunityDefinition: "One initial-entry or final-exit corrected Wilder RSI observation per trade.",
      cohortDefinition: `Trades in the fixed RSI 14 band ${band}.`,
      comparisonDefinition: "The same direction and event role in the other fixed RSI bands.",
      observations: tradeBehaviorObservations(trades, (trade) => affectedRefs.has(trade.tradeRef)),
      processClass: "analyzer_only",
      resultPolarity: net.lt(0) ? "negative" : "positive",
      expectedPopulationCount: analyzerEligibleTrades(source).length,
      expectedPopulationTrades: analyzerEligibleTrades(source),
      exploratorySiblingCount: groups.length,
      allowSpecificExample: true,
      overlapKeys: [`rsi14:${group}`],
    }));
  }
}

export function buildCoachAiReviewInsightCandidatesFromSource(
  source: CoachAiReviewCalculationSource,
  options: CoachAiReviewSourceAdapterOptions = {},
): CoachAiReviewSourceAdapterResult {
  const values: CoachAiReviewInsightCandidate[] = [];
  const money = periodMoney(source);
  values.push(buildCoachAiReviewPeriodOutcomeCandidate({
    cadence: source.period.cadence,
    observations: money,
    periodStartDate: source.period.startDate,
    periodEndDate: source.period.endDate,
    tradingDayRefs: source.days.map((day) => day.dayRef),
    confirmedOpenPositionRefs: source.periodEndOpenPositionRefs,
    openLifecycleReductionRefs: source.periodEndOpenWithInPeriodReductionRefs,
  }));
  const bundles = normalizeRuleBundles(source);
  addRuleCandidates(values, source, bundles);
  addAnalyzerCandidates(values, source);
  addSegmentCandidates(values, source);
  addConcentrationCandidates(values, source);
  addRsiCandidates(values, source, options.rsiReferenceVectorsAccepted === true);
  const normalizedRuleOpportunities = Object.freeze(bundles.flatMap((bundle) =>
    bundle.opportunities));
  return Object.freeze({
    candidates: Object.freeze(values),
    normalizedRuleOpportunities,
  });
}
