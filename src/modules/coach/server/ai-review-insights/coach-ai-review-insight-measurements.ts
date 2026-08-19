import { createHash } from "node:crypto";

import Decimal from "decimal.js";

import type {
  CoachAiReviewAttributionKind,
  CoachAiReviewComparableOutcomeObservation,
  CoachAiReviewConsequenceComparison,
  CoachAiReviewConsequenceVerdict,
  CoachAiReviewMeasurement,
  CoachAiReviewMeasurementAvailability,
  CoachAiReviewMoneyObservation,
  CoachAiReviewNormalizedRuleOpportunity,
  CoachAiReviewObservationUnit,
  CoachAiReviewPeriodOutcomeMeasurements,
} from "@/src/modules/coach/contracts/coach-ai-review-insight-contracts";
import {
  CoachAiReviewInsightInvariantError,
  assertMemberSubset,
  compareCoachAiReviewText,
  freezeSortedUniqueRefs,
} from "./coach-ai-review-insight-normalizer";

const ExactDecimal = Decimal.clone({
  precision: 160,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});

function invariant(condition: boolean, code: string): asserts condition {
  if (!condition) throw new CoachAiReviewInsightInvariantError(code);
}

function decimal(value: string | number): Decimal {
  const parsed = new ExactDecimal(value);
  invariant(parsed.isFinite(), "TRADERLINK_AI_REVIEW_DECIMAL_INVALID");
  return parsed;
}

function canonical(value: Decimal): string {
  return value.isZero() ? "0" : value.toFixed();
}

function sum(values: readonly string[]): string {
  return canonical(values.reduce((total, value) => total.plus(decimal(value)), new ExactDecimal(0)));
}

function ratio(numerator: number | string, denominator: number | string): string | null {
  const denominatorDecimal = decimal(denominator);
  return denominatorDecimal.isZero()
    ? null
    : canonical(decimal(numerator).dividedBy(denominatorDecimal));
}

function median(values: readonly string[]): string | null {
  if (values.length === 0) return null;
  const sorted = values
    .map(decimal)
    .sort((left, right) => left.comparedTo(right));
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? canonical(sorted[middle]!)
    : canonical(sorted[middle - 1]!.plus(sorted[middle]!).dividedBy(2));
}

function average(values: readonly string[]): string | null {
  return values.length === 0 ? null : ratio(sum(values), values.length);
}

export function formatCoachAiReviewRateLiteral(
  numerator: number,
  denominator: number,
): string | null {
  if (denominator === 0) return null;
  if (denominator < 20) return `${numerator} of ${denominator}`;
  const percentage = decimal(numerator).times(100).dividedBy(denominator).toDecimalPlaces(2);
  return `${numerator} of ${denominator} (${canonical(percentage)}%)`;
}

function measurementRef(input: Readonly<{
  metricName: string;
  numeratorMemberRefs: readonly string[];
  denominatorMemberRefs: readonly string[];
  attributionKind: CoachAiReviewAttributionKind;
}>): string {
  return `measurement_${createHash("sha256").update(JSON.stringify([
    input.metricName,
    input.attributionKind,
    input.numeratorMemberRefs,
    input.denominatorMemberRefs,
  ])).digest("hex").slice(0, 24)}`;
}

export function createCoachAiReviewMeasurement(input: Readonly<{
  metricName: string;
  exactValue: string | null;
  unit: CoachAiReviewMeasurement["unit"];
  currency?: string | null;
  observationUnit: CoachAiReviewObservationUnit;
  numeratorMemberRefs: readonly string[];
  denominatorMemberRefs: readonly string[];
  moneyEligibleCount?: number | null;
  expectedCount?: number | null;
  availability: CoachAiReviewMeasurementAvailability;
  attributionKind: CoachAiReviewAttributionKind;
  displayLiteral?: string | null;
}>): CoachAiReviewMeasurement {
  const numeratorMemberRefs = freezeSortedUniqueRefs(
    input.numeratorMemberRefs,
    "MEASUREMENT_NUMERATOR_REF",
  );
  const denominatorMemberRefs = freezeSortedUniqueRefs(
    input.denominatorMemberRefs,
    "MEASUREMENT_DENOMINATOR_REF",
  );
  assertMemberSubset(numeratorMemberRefs, denominatorMemberRefs);
  invariant(
    input.availability === "available" || input.exactValue === null ||
      input.availability === "partial_display_only",
    "TRADERLINK_AI_REVIEW_UNAVAILABLE_MEASUREMENT_HAS_VALUE",
  );
  invariant(
    input.moneyEligibleCount === undefined || input.moneyEligibleCount === null ||
      Number.isInteger(input.moneyEligibleCount) && input.moneyEligibleCount >= 0 &&
      input.moneyEligibleCount <= denominatorMemberRefs.length,
    "TRADERLINK_AI_REVIEW_MONEY_ELIGIBLE_COUNT_INVALID",
  );
  invariant(
    input.expectedCount === undefined || input.expectedCount === null ||
      Number.isInteger(input.expectedCount) && input.expectedCount >= denominatorMemberRefs.length,
    "TRADERLINK_AI_REVIEW_EXPECTED_COUNT_INVALID",
  );
  return Object.freeze({
    measurementRef: measurementRef({
      metricName: input.metricName,
      numeratorMemberRefs,
      denominatorMemberRefs,
      attributionKind: input.attributionKind,
    }),
    metricName: input.metricName,
    exactValue: input.exactValue,
    unit: input.unit,
    currency: input.currency ?? null,
    observationUnit: input.observationUnit,
    numeratorMemberRefs,
    denominatorMemberRefs,
    affectedCount: numeratorMemberRefs.length,
    moneyEligibleCount: input.moneyEligibleCount ?? null,
    expectedCount: input.expectedCount ?? null,
    availability: input.availability,
    attributionKind: input.attributionKind,
    displayLiteral: input.displayLiteral ?? null,
  });
}

export function measureCoachAiReviewPeriodOutcomes(
  observations: readonly CoachAiReviewMoneyObservation[],
): CoachAiReviewPeriodOutcomeMeasurements {
  const memberRefs = freezeSortedUniqueRefs(
    observations.map((observation) => observation.memberRef),
    "PERIOD_TRADE_REF",
  );
  const byMember = new Map(observations.map((observation) => [observation.memberRef, observation]));
  const resultEligible = memberRefs
    .map((memberRef) => byMember.get(memberRef)!)
    .filter((observation) => observation.netPnlDecimal !== null);
  const moneyEligible = resultEligible.filter((observation) => observation.currency !== null);
  const currencies = new Set(moneyEligible.map((observation) => observation.currency!));
  const comparableCurrency = currencies.size === 1 ? [...currencies][0]! : null;
  const comparableMoney = comparableCurrency === null
    ? []
    : moneyEligible.filter((observation) => observation.currency === comparableCurrency);
  const wins = resultEligible.filter((observation) => decimal(observation.netPnlDecimal!).gt(0));
  const losses = resultEligible.filter((observation) => decimal(observation.netPnlDecimal!).lt(0));
  const flats = resultEligible.filter((observation) => decimal(observation.netPnlDecimal!).isZero());
  const winningValues = comparableMoney
    .filter((observation) => decimal(observation.netPnlDecimal!).gt(0))
    .map((observation) => observation.netPnlDecimal!);
  const losingValues = comparableMoney
    .filter((observation) => decimal(observation.netPnlDecimal!).lt(0))
    .map((observation) => observation.netPnlDecimal!);
  const comparableValues = comparableMoney.map((observation) => observation.netPnlDecimal!);
  const combinedMoneyAvailable = comparableValues.length > 0 && currencies.size === 1;
  const moneyAvailability = currencies.size > 1
    ? "mixed_currency" as const
    : comparableMoney.length === 0
      ? "missing" as const
      : comparableMoney.length === observations.length
        ? "available" as const
        : "partial" as const;
  const winningPnlDecimal = combinedMoneyAvailable ? sum(winningValues) : null;
  const losingPnlDecimal = combinedMoneyAvailable ? sum(losingValues) : null;
  const largestWinnerDecimal = winningValues.length === 0
    ? null
    : canonical(winningValues.map(decimal).reduce((largest, value) =>
      value.gt(largest) ? value : largest));
  const largestLoserDecimal = losingValues.length === 0
    ? null
    : canonical(losingValues.map(decimal).reduce((lowest, value) =>
      value.lt(lowest) ? value : lowest));
  const absolutePnlMagnitudeDecimal = combinedMoneyAvailable
    ? canonical(decimal(winningPnlDecimal ?? "0").plus(decimal(losingPnlDecimal ?? "0").abs()))
    : null;

  return Object.freeze({
    memberRefs,
    moneyEligibleMemberRefs: Object.freeze(moneyEligible
      .map((observation) => observation.memberRef)
      .sort(compareCoachAiReviewText)),
    tradeCount: observations.length,
    winCount: wins.length,
    lossCount: losses.length,
    flatCount: flats.length,
    netPnlDecimal: combinedMoneyAvailable ? sum(comparableValues) : null,
    winningPnlDecimal,
    losingPnlDecimal,
    absolutePnlMagnitudeDecimal,
    winRateDecimal: ratio(wins.length, resultEligible.length),
    lossRateDecimal: ratio(losses.length, resultEligible.length),
    medianWinnerDecimal: combinedMoneyAvailable ? median(winningValues) : null,
    medianLoserDecimal: combinedMoneyAvailable ? median(losingValues) : null,
    averageWinnerDecimal: combinedMoneyAvailable ? average(winningValues) : null,
    averageLoserDecimal: combinedMoneyAvailable ? average(losingValues) : null,
    largestWinnerDecimal: combinedMoneyAvailable ? largestWinnerDecimal : null,
    largestLoserDecimal: combinedMoneyAvailable ? largestLoserDecimal : null,
    profitFactorDecimal: winningPnlDecimal === null || losingPnlDecimal === null ||
        decimal(losingPnlDecimal).isZero()
      ? null
      : ratio(winningPnlDecimal, canonical(decimal(losingPnlDecimal).abs())),
    largestWinnerContributionDecimal: largestWinnerDecimal === null ||
        winningPnlDecimal === null || decimal(winningPnlDecimal).isZero()
      ? null
      : ratio(largestWinnerDecimal, winningPnlDecimal),
    largestLoserContributionDecimal: largestLoserDecimal === null ||
        losingPnlDecimal === null || decimal(losingPnlDecimal).isZero()
      ? null
      : ratio(
        canonical(decimal(largestLoserDecimal).abs()),
        canonical(decimal(losingPnlDecimal).abs()),
      ),
    netExcludingLargestWinnerDecimal: combinedMoneyAvailable && largestWinnerDecimal !== null
      ? canonical(decimal(sum(comparableValues)).minus(largestWinnerDecimal))
      : null,
    netExcludingLargestLoserDecimal: combinedMoneyAvailable && largestLoserDecimal !== null
      ? canonical(decimal(sum(comparableValues)).minus(largestLoserDecimal))
      : null,
    moneyAvailability,
    moneyCoverageComplete: observations.length > 0 &&
      comparableMoney.length === observations.length && currencies.size === 1,
    currency: comparableCurrency,
  });
}

export function measureCoachAiReviewRuleDispositions(
  opportunities: readonly CoachAiReviewNormalizedRuleOpportunity[],
): readonly CoachAiReviewMeasurement[] {
  const expected = opportunities.filter((item) => item.isReviewOpportunity);
  const followed = expected.filter((item) => item.dispositionState === "reviewed_followed");
  const broken = expected.filter((item) => item.dispositionState === "reviewed_broken");
  const explicitNotReviewed = expected.filter(
    (item) => item.dispositionState === "explicit_not_reviewed",
  );
  const reviewed = [...followed, ...broken];
  const dispositionRecorded = [...reviewed, ...explicitNotReviewed];
  const expectedRefs = freezeSortedUniqueRefs(expected.map((item) => item.targetRef), "RULE_EXPECTED_REF");
  const reviewedRefs = freezeSortedUniqueRefs(reviewed.map((item) => item.targetRef), "RULE_REVIEWED_REF");
  const brokenRefs = freezeSortedUniqueRefs(broken.map((item) => item.targetRef), "RULE_BROKEN_REF");
  const dispositionRefs = freezeSortedUniqueRefs(
    dispositionRecorded.map((item) => item.targetRef),
    "RULE_DISPOSITION_REF",
  );
  const followedRefs = freezeSortedUniqueRefs(followed.map((item) => item.targetRef), "RULE_FOLLOWED_REF");

  return Object.freeze([
    createCoachAiReviewMeasurement({
      metricName: "reviewed_broken_rate",
      exactValue: reviewed.length < 3 ? null : ratio(broken.length, reviewed.length),
      unit: "ratio",
      observationUnit: "rule_review_opportunity",
      numeratorMemberRefs: brokenRefs,
      denominatorMemberRefs: reviewedRefs,
      expectedCount: expected.length,
      availability: reviewed.length < 3 ? "unavailable_missing_population" : "available",
      attributionKind: "cohort_association",
      displayLiteral: formatCoachAiReviewRateLiteral(broken.length, reviewed.length),
    }),
    createCoachAiReviewMeasurement({
      metricName: "review_completion",
      exactValue: expected.length === 0 ? null : ratio(reviewed.length, expected.length),
      unit: "ratio",
      observationUnit: "rule_review_opportunity",
      numeratorMemberRefs: reviewedRefs,
      denominatorMemberRefs: expectedRefs,
      expectedCount: expected.length,
      availability: expected.length === 0 ? "not_applicable" : "available",
      attributionKind: "coverage_only",
      displayLiteral: formatCoachAiReviewRateLiteral(reviewed.length, expected.length),
    }),
    createCoachAiReviewMeasurement({
      metricName: "recorded_disposition_coverage",
      exactValue: expected.length === 0
        ? null
        : ratio(dispositionRecorded.length, expected.length),
      unit: "ratio",
      observationUnit: "rule_review_opportunity",
      numeratorMemberRefs: dispositionRefs,
      denominatorMemberRefs: expectedRefs,
      expectedCount: expected.length,
      availability: expected.length === 0 ? "not_applicable" : "available",
      attributionKind: "coverage_only",
      displayLiteral: formatCoachAiReviewRateLiteral(dispositionRecorded.length, expected.length),
    }),
    createCoachAiReviewMeasurement({
      metricName: "broken_prevalence",
      exactValue: expected.length === 0 ? null : ratio(broken.length, expected.length),
      unit: "ratio",
      observationUnit: "rule_review_opportunity",
      numeratorMemberRefs: brokenRefs,
      denominatorMemberRefs: expectedRefs,
      expectedCount: expected.length,
      availability: expected.length === 0 ? "not_applicable" : "available",
      attributionKind: "cohort_association",
      displayLiteral: formatCoachAiReviewRateLiteral(broken.length, expected.length),
    }),
    createCoachAiReviewMeasurement({
      metricName: "reviewed_followed_count",
      exactValue: expected.length === 0 ? null : String(followed.length),
      unit: "count",
      observationUnit: "rule_review_opportunity",
      numeratorMemberRefs: followedRefs,
      denominatorMemberRefs: expectedRefs,
      expectedCount: expected.length,
      availability: expected.length === 0 ? "not_applicable" : "available",
      attributionKind: "cohort_association",
      displayLiteral: `${followed.length} of ${expected.length}`,
    }),
  ]);
}

export function measureCoachAiReviewPresetEvaluation(
  opportunities: readonly CoachAiReviewNormalizedRuleOpportunity[],
): readonly CoachAiReviewMeasurement[] {
  const followed = opportunities.filter(
    (item) => item.presetEvaluationState === "evaluated_followed" &&
      item.sourceConsistency !== "conflict",
  );
  const broken = opportunities.filter(
    (item) => item.presetEvaluationState === "evaluated_broken" &&
      item.sourceConsistency !== "conflict",
  );
  const eligible = [...followed, ...broken];
  const eligibleRefs = freezeSortedUniqueRefs(
    eligible.map((item) => item.targetRef),
    "PRESET_ELIGIBLE_REF",
  );
  const brokenRefs = freezeSortedUniqueRefs(
    broken.map((item) => item.targetRef),
    "PRESET_BROKEN_REF",
  );
  return Object.freeze([
    createCoachAiReviewMeasurement({
      metricName: "preset_evaluated_violation_rate",
      exactValue: eligible.length < 3 ? null : ratio(broken.length, eligible.length),
      unit: "ratio",
      observationUnit: "rule_review_opportunity",
      numeratorMemberRefs: brokenRefs,
      denominatorMemberRefs: eligibleRefs,
      expectedCount: opportunities.length,
      availability: eligible.length < 3 ? "unavailable_missing_population" : "available",
      attributionKind: "preset_evaluator",
      displayLiteral: formatCoachAiReviewRateLiteral(broken.length, eligible.length),
    }),
  ]);
}

export type CoachAiReviewCohortMoneyMeasurements = Readonly<{
  cohortNetPnlDecimal: string | null;
  affectedLosingPnlDecimal: string | null;
  adverseNetContributionDecimal: string | null;
  beneficialNetContributionDecimal: string | null;
  lossShareDecimal: string | null;
  profitShareDecimal: string | null;
  periodMagnitudeShareDecimal: string | null;
  moneyEligibleMemberRefs: readonly string[];
  currency: string | null;
  coverageComplete: boolean;
}>;

export function measureCoachAiReviewCohortMoney(input: Readonly<{
  affectedMemberRefs: readonly string[];
  observations: readonly CoachAiReviewMoneyObservation[];
  period: CoachAiReviewPeriodOutcomeMeasurements;
}>): CoachAiReviewCohortMoneyMeasurements {
  const affectedMemberRefs = freezeSortedUniqueRefs(input.affectedMemberRefs, "COHORT_AFFECTED_REF");
  assertMemberSubset(
    affectedMemberRefs,
    input.period.memberRefs,
    "TRADERLINK_AI_REVIEW_COHORT_OUTSIDE_PERIOD",
  );
  const affectedSet = new Set(affectedMemberRefs);
  const affected = input.observations.filter((observation) => affectedSet.has(observation.memberRef));
  invariant(
    affected.length === affectedMemberRefs.length,
    "TRADERLINK_AI_REVIEW_COHORT_MEMBER_MISSING",
  );
  const eligibleSet = new Set(input.period.moneyEligibleMemberRefs);
  const moneyEligible = affected.filter((observation) => eligibleSet.has(observation.memberRef));
  const coverageComplete = moneyEligible.length === affected.length && input.period.moneyCoverageComplete;
  const comparable = input.period.currency === null
    ? []
    : moneyEligible.filter((observation) => observation.currency === input.period.currency);
  const values = comparable.map((observation) => observation.netPnlDecimal!);
  const losses = comparable
    .filter((observation) => decimal(observation.netPnlDecimal!).lt(0))
    .map((observation) => observation.netPnlDecimal!);
  const wins = comparable
    .filter((observation) => decimal(observation.netPnlDecimal!).gt(0))
    .map((observation) => observation.netPnlDecimal!);
  const cohortNet = values.length > 0 ? sum(values) : null;
  const affectedLosing = values.length > 0 ? sum(losses) : null;
  const affectedWinning = values.length > 0 ? sum(wins) : null;
  const adverseAmount = cohortNet !== null && decimal(cohortNet).lt(0)
    ? canonical(decimal(cohortNet).abs())
    : "0";
  const beneficialAmount = cohortNet !== null && decimal(cohortNet).gt(0) ? cohortNet : "0";
  const periodLosingMagnitude = input.period.losingPnlDecimal === null
    ? null
    : canonical(decimal(input.period.losingPnlDecimal).abs());

  return Object.freeze({
    cohortNetPnlDecimal: cohortNet,
    affectedLosingPnlDecimal: affectedLosing,
    adverseNetContributionDecimal: coverageComplete && periodLosingMagnitude !== null
      ? ratio(adverseAmount, periodLosingMagnitude)
      : null,
    beneficialNetContributionDecimal: coverageComplete && input.period.winningPnlDecimal !== null
      ? ratio(beneficialAmount, input.period.winningPnlDecimal)
      : null,
    lossShareDecimal: coverageComplete && periodLosingMagnitude !== null && affectedLosing !== null
      ? ratio(canonical(decimal(affectedLosing).abs()), periodLosingMagnitude)
      : null,
    profitShareDecimal: coverageComplete && input.period.winningPnlDecimal !== null &&
      affectedWinning !== null
      ? ratio(affectedWinning, input.period.winningPnlDecimal)
      : null,
    periodMagnitudeShareDecimal: coverageComplete &&
      input.period.absolutePnlMagnitudeDecimal !== null && cohortNet !== null
      ? ratio(canonical(decimal(cohortNet).abs()), input.period.absolutePnlMagnitudeDecimal)
      : null,
    moneyEligibleMemberRefs: Object.freeze(comparable
      .map((observation) => observation.memberRef)
      .sort(compareCoachAiReviewText)),
    currency: input.period.currency,
    coverageComplete,
  });
}

export function exactCoachAiReviewRatio(
  numerator: number | string,
  denominator: number | string,
): string | null {
  return ratio(numerator, denominator);
}

export function exactCoachAiReviewMedian(values: readonly string[]): string | null {
  return median(values);
}

function absoluteMedian(values: readonly string[]): Decimal | null {
  if (values.length === 0) return null;
  const value = median(values.map((item) => canonical(decimal(item).abs())));
  return value === null ? null : decimal(value);
}

function resultRate(
  observations: readonly CoachAiReviewComparableOutcomeObservation[],
  polarity: "negative" | "positive",
): Decimal | null {
  if (observations.length === 0) return null;
  const matching = observations.filter((observation) => polarity === "negative"
    ? decimal(observation.netPnlDecimal!).lt(0)
    : decimal(observation.netPnlDecimal!).gt(0));
  return decimal(matching.length).dividedBy(observations.length);
}

function medianPnl(
  observations: readonly CoachAiReviewComparableOutcomeObservation[],
): Decimal | null {
  const value = median(observations.map((observation) => observation.netPnlDecimal!));
  return value === null ? null : decimal(value);
}

function weightedMedian(
  observations: readonly Readonly<{
    value: Decimal;
    weight: Decimal;
    memberRef: string;
  }>[],
): Decimal | null {
  if (observations.length === 0) return null;
  const ordered = [...observations].sort((left, right) =>
    left.value.comparedTo(right.value) ||
      compareCoachAiReviewText(left.memberRef, right.memberRef));
  const total = ordered.reduce((current, observation) => current.plus(observation.weight),
    new ExactDecimal(0));
  if (total.lte(0)) return null;
  const threshold = total.dividedBy(2);
  let cumulative = new ExactDecimal(0);
  for (const observation of ordered) {
    cumulative = cumulative.plus(observation.weight);
    if (cumulative.gte(threshold)) return observation.value;
  }
  return ordered.at(-1)!.value;
}

type ComparableSides = Readonly<{
  affected: readonly CoachAiReviewComparableOutcomeObservation[];
  comparison: readonly CoachAiReviewComparableOutcomeObservation[];
}>;

function medianBranchAvailable(sides: ComparableSides): boolean {
  const affectedAbsolute = absoluteMedian(sides.affected.map((item) => item.netPnlDecimal!));
  const comparisonAbsolute = absoluteMedian(sides.comparison.map((item) => item.netPnlDecimal!));
  if (affectedAbsolute === null || comparisonAbsolute === null) return false;
  if (affectedAbsolute.isZero() && comparisonAbsolute.isZero()) return true;
  if (affectedAbsolute.isZero() || comparisonAbsolute.isZero()) return false;
  const ratioValue = affectedAbsolute.dividedBy(comparisonAbsolute);
  return ratioValue.gte("0.5") && ratioValue.lte("2");
}

function directionAlignedGaps(
  sides: ComparableSides,
  polarity: "negative" | "positive",
  periodMedianAbsolute: Decimal | null,
): Readonly<{
  rate: Decimal | null;
  median: Decimal | null;
}> {
  const affectedRate = resultRate(sides.affected, polarity);
  const comparisonRate = resultRate(sides.comparison, polarity);
  const affectedMedian = medianPnl(sides.affected);
  const comparisonMedian = medianPnl(sides.comparison);
  return Object.freeze({
    rate: affectedRate === null || comparisonRate === null
      ? null
      : affectedRate.minus(comparisonRate),
    median: !medianBranchAvailable(sides) || periodMedianAbsolute === null ||
        periodMedianAbsolute.isZero() || affectedMedian === null || comparisonMedian === null
      ? null
      : polarity === "negative"
        ? comparisonMedian.minus(affectedMedian)
        : affectedMedian.minus(comparisonMedian),
  });
}

function verdictFromGaps(
  gaps: Readonly<{ rate: Decimal | null; median: Decimal | null }>,
  polarity: "negative" | "positive",
  periodMedianAbsolute: Decimal | null,
): CoachAiReviewConsequenceVerdict {
  const rateDirection = gaps.rate === null
    ? 0
    : gaps.rate.gte("0.15")
      ? 1
      : gaps.rate.lte("-0.15")
        ? -1
        : 0;
  const medianThreshold = periodMedianAbsolute === null
    ? null
    : periodMedianAbsolute.times("0.2");
  const medianDirection = gaps.median === null || medianThreshold === null || medianThreshold.isZero()
    ? 0
    : gaps.median.gte(medianThreshold)
      ? 1
      : gaps.median.lte(medianThreshold.negated())
        ? -1
        : 0;
  if ((rateDirection === 1 && medianDirection === -1) ||
      (rateDirection === -1 && medianDirection === 1)) return "mixed_outcome_separation";
  if (rateDirection === 1 || medianDirection === 1) {
    return polarity === "negative" ? "worse_associated_outcome" : "better_associated_outcome";
  }
  if (rateDirection === -1 || medianDirection === -1) return "opposite_associated_outcome";
  return "not_separated";
}

function standardizedDirectionAlignedGaps(
  sides: ComparableSides,
  polarity: "negative" | "positive",
  periodMedianAbsolute: Decimal | null,
): Readonly<{ rate: Decimal | null; median: Decimal | null }> | null {
  const affectedByStratum = new Map<string, CoachAiReviewComparableOutcomeObservation[]>();
  const comparisonByStratum = new Map<string, CoachAiReviewComparableOutcomeObservation[]>();
  for (const observation of sides.affected) {
    const values = affectedByStratum.get(observation.stratumKey) ?? [];
    values.push(observation);
    affectedByStratum.set(observation.stratumKey, values);
  }
  for (const observation of sides.comparison) {
    const values = comparisonByStratum.get(observation.stratumKey) ?? [];
    values.push(observation);
    comparisonByStratum.set(observation.stratumKey, values);
  }
  const common = [...affectedByStratum.keys()].filter((key) =>
    (comparisonByStratum.get(key)?.length ?? 0) > 0).sort();
  const affectedCommonCount = common.reduce((total, key) =>
    total + affectedByStratum.get(key)!.length, 0);
  const comparisonCommonCount = common.reduce((total, key) =>
    total + comparisonByStratum.get(key)!.length, 0);
  if (affectedCommonCount < 5 || comparisonCommonCount < 5) return null;
  const pooledTotal = decimal(affectedCommonCount + comparisonCommonCount);
  let affectedRate = new ExactDecimal(0);
  let comparisonRate = new ExactDecimal(0);
  const affectedWeighted: Array<Readonly<{ value: Decimal; weight: Decimal; memberRef: string }>> = [];
  const comparisonWeighted: Array<Readonly<{ value: Decimal; weight: Decimal; memberRef: string }>> = [];
  for (const key of common) {
    const affectedStratum = affectedByStratum.get(key)!;
    const comparisonStratum = comparisonByStratum.get(key)!;
    const pooledWeight = decimal(affectedStratum.length + comparisonStratum.length)
      .dividedBy(pooledTotal);
    const affectedStratumRate = resultRate(affectedStratum, polarity)!;
    const comparisonStratumRate = resultRate(comparisonStratum, polarity)!;
    affectedRate = affectedRate.plus(pooledWeight.times(affectedStratumRate));
    comparisonRate = comparisonRate.plus(pooledWeight.times(comparisonStratumRate));
    const affectedMemberWeight = pooledWeight.dividedBy(affectedStratum.length);
    const comparisonMemberWeight = pooledWeight.dividedBy(comparisonStratum.length);
    affectedWeighted.push(...affectedStratum.map((observation) => Object.freeze({
      value: decimal(observation.netPnlDecimal!),
      weight: affectedMemberWeight,
      memberRef: observation.memberRef,
    })));
    comparisonWeighted.push(...comparisonStratum.map((observation) => Object.freeze({
      value: decimal(observation.netPnlDecimal!),
      weight: comparisonMemberWeight,
      memberRef: observation.memberRef,
    })));
  }
  const affectedMedian = weightedMedian(affectedWeighted);
  const comparisonMedian = weightedMedian(comparisonWeighted);
  return Object.freeze({
    rate: affectedRate.minus(comparisonRate),
    median: !medianBranchAvailable(sides) || periodMedianAbsolute === null ||
        periodMedianAbsolute.isZero() || affectedMedian === null || comparisonMedian === null
      ? null
      : polarity === "negative"
        ? comparisonMedian.minus(affectedMedian)
        : affectedMedian.minus(comparisonMedian),
  });
}

function materialCompositionShift(sides: ComparableSides): boolean {
  const keys = new Set([
    ...sides.affected.map((item) => item.stratumKey),
    ...sides.comparison.map((item) => item.stratumKey),
  ]);
  const pooledCount = sides.affected.length + sides.comparison.length;
  return [...keys].some((key) => {
    const affectedCount = sides.affected.filter((item) => item.stratumKey === key).length;
    const comparisonCount = sides.comparison.filter((item) => item.stratumKey === key).length;
    const pooledShare = (affectedCount + comparisonCount) / pooledCount;
    const affectedShare = affectedCount / sides.affected.length;
    const comparisonShare = comparisonCount / sides.comparison.length;
    return pooledShare >= 0.20 && Math.abs(affectedShare - comparisonShare) >= 0.15;
  });
}

function alignedEffect(
  sides: ComparableSides,
  polarity: "negative" | "positive",
  periodMedianAbsolute: Decimal | null,
): Decimal | null {
  if (sides.affected.length < 5 || sides.comparison.length < 5) return null;
  const gaps = directionAlignedGaps(sides, polarity, periodMedianAbsolute);
  const normalizedRate = gaps.rate === null ? null : gaps.rate.dividedBy("0.15");
  const normalizedMedian = gaps.median === null || periodMedianAbsolute === null ||
      periodMedianAbsolute.isZero()
    ? null
    : gaps.median.dividedBy(periodMedianAbsolute.times("0.2"));
  const values = [normalizedRate, normalizedMedian].filter((value): value is Decimal => value !== null);
  if (values.length === 0) return null;
  return values.reduce((strongest, value) => value.abs().gt(strongest.abs()) ? value : strongest);
}

function alignedEffectFromGaps(
  gaps: Readonly<{ rate: Decimal | null; median: Decimal | null }>,
  periodMedianAbsolute: Decimal | null,
): Decimal | null {
  const normalizedRate = gaps.rate === null ? null : gaps.rate.dividedBy("0.15");
  const normalizedMedian = gaps.median === null || periodMedianAbsolute === null ||
      periodMedianAbsolute.isZero()
    ? null
    : gaps.median.dividedBy(periodMedianAbsolute.times("0.2"));
  return [normalizedRate, normalizedMedian]
    .filter((value): value is Decimal => value !== null)
    .reduce<Decimal | null>((strongest, value) => strongest === null ||
        value.abs().gt(strongest.abs()) ? value : strongest, null);
}

function outlierResistance(
  sides: ComparableSides,
  polarity: "negative" | "positive",
  periodMedianAbsolute: Decimal | null,
): number | null {
  const original = alignedEffect(sides, polarity, periodMedianAbsolute);
  if (original === null || original.isZero()) return null;
  const combined = [...sides.affected, ...sides.comparison];
  const largest = [...combined].sort((left, right) =>
    decimal(right.netPnlDecimal!).abs().comparedTo(decimal(left.netPnlDecimal!).abs()) ||
    compareCoachAiReviewText(left.memberRef, right.memberRef))[0]!;
  const removals = [
    Object.freeze(new Set([largest.memberRef])),
    ...[...new Set(combined.map((item) => item.bucketRef))].sort().map((bucketRef) =>
      Object.freeze(new Set(combined.filter((item) => item.bucketRef === bucketRef)
        .map((item) => item.memberRef)))),
  ];
  let minimum = new ExactDecimal(100);
  for (const removal of removals) {
    const reduced = Object.freeze({
      affected: sides.affected.filter((item) => !removal.has(item.memberRef)),
      comparison: sides.comparison.filter((item) => !removal.has(item.memberRef)),
    });
    const effect = alignedEffect(reduced, polarity, periodMedianAbsolute);
    if (effect === null || !effect.isPositive() || !original.isPositive()) return 0;
    const retained = ExactDecimal.min(100, effect.abs().dividedBy(original.abs()).times(100));
    if (retained.lt(minimum)) minimum = retained;
  }
  return minimum.toNumber();
}

export function compareCoachAiReviewConsequences(input: Readonly<{
  polarity: "negative" | "positive";
  affectedMemberRefs: readonly string[];
  comparisonMemberRefs: readonly string[];
  observations: readonly CoachAiReviewComparableOutcomeObservation[];
  periodMoneyObservations: readonly CoachAiReviewMoneyObservation[];
  period: CoachAiReviewPeriodOutcomeMeasurements;
}>): CoachAiReviewConsequenceComparison {
  const affectedRefs = freezeSortedUniqueRefs(input.affectedMemberRefs, "COMPARISON_AFFECTED_REF");
  const comparisonRefs = freezeSortedUniqueRefs(input.comparisonMemberRefs, "COMPARISON_REMAINDER_REF");
  invariant(!affectedRefs.some((memberRef) => comparisonRefs.includes(memberRef)),
    "TRADERLINK_AI_REVIEW_COMPARISON_OVERLAP");
  assertMemberSubset(affectedRefs, input.period.memberRefs,
    "TRADERLINK_AI_REVIEW_COMPARISON_AFFECTED_OUTSIDE_PERIOD");
  assertMemberSubset(comparisonRefs, input.period.memberRefs,
    "TRADERLINK_AI_REVIEW_COMPARISON_REMAINDER_OUTSIDE_PERIOD");
  const byMember = new Map(input.observations.map((observation) => [observation.memberRef, observation]));
  invariant(byMember.size === input.observations.length, "TRADERLINK_AI_REVIEW_COMPARISON_MEMBER_DUPLICATE");
  const periodMoneyByMember = new Map(input.periodMoneyObservations.map((observation) => [
    observation.memberRef,
    observation,
  ]));
  invariant(periodMoneyByMember.size === input.periodMoneyObservations.length,
    "TRADERLINK_AI_REVIEW_PERIOD_MONEY_MEMBER_DUPLICATE");
  const affected = affectedRefs.map((memberRef) => byMember.get(memberRef));
  const comparison = comparisonRefs.map((memberRef) => byMember.get(memberRef));
  const recordsComplete = [...affected, ...comparison].every((observation) =>
    observation !== undefined && observation.netPnlDecimal !== null &&
    observation.currency !== null && observation.currency === input.period.currency) &&
    input.period.moneyEligibleMemberRefs.every((memberRef) => periodMoneyByMember.has(memberRef));
  const unavailable = affected.length < 5 || comparison.length < 5 ||
    !recordsComplete || !input.period.moneyCoverageComplete;
  if (unavailable) {
    return Object.freeze({
      verdict: "comparison_unavailable",
      consequenceFactor: 0.5,
      affectedCount: affected.length,
      comparisonCount: comparison.length,
      affectedRateDecimal: null,
      comparisonRateDecimal: null,
      affectedMedianPnlDecimal: null,
      comparisonMedianPnlDecimal: null,
      periodMedianAbsolutePnlDecimal: null,
      rawDirectionAlignedRateGapDecimal: null,
      rawDirectionAlignedMedianGapDecimal: null,
      standardizedDirectionAlignedRateGapDecimal: null,
      standardizedDirectionAlignedMedianGapDecimal: null,
      structuralStandardizationApplied: false,
      materialCompositionShift: false,
      outlierResistance: null,
      confidenceAdjustment: "none",
    });
  }
  const sides: ComparableSides = Object.freeze({
    affected: Object.freeze(affected as CoachAiReviewComparableOutcomeObservation[]),
    comparison: Object.freeze(comparison as CoachAiReviewComparableOutcomeObservation[]),
  });
  const periodMedianAbsolute = absoluteMedian(input.period.moneyEligibleMemberRefs
    .map((memberRef) => periodMoneyByMember.get(memberRef)!.netPnlDecimal!));
  const rawGaps = directionAlignedGaps(sides, input.polarity, periodMedianAbsolute);
  const rawVerdict = verdictFromGaps(rawGaps, input.polarity, periodMedianAbsolute);
  const compositionShift = materialCompositionShift(sides);
  let finalVerdict = rawVerdict;
  let standardizedGaps: Readonly<{ rate: Decimal | null; median: Decimal | null }> | null = null;
  if (compositionShift) {
    standardizedGaps = standardizedDirectionAlignedGaps(
      sides,
      input.polarity,
      periodMedianAbsolute,
    );
    if (standardizedGaps === null) {
      finalVerdict = "comparison_unavailable";
    } else {
      const standardizedVerdict = verdictFromGaps(
        standardizedGaps,
        input.polarity,
        periodMedianAbsolute,
      );
      const rawAligned = rawVerdict === "worse_associated_outcome" ||
        rawVerdict === "better_associated_outcome";
      const standardizedAligned = standardizedVerdict === "worse_associated_outcome" ||
        standardizedVerdict === "better_associated_outcome";
      const rawOpposite = rawVerdict === "opposite_associated_outcome";
      const standardizedOpposite = standardizedVerdict === "opposite_associated_outcome";
      finalVerdict = (rawAligned && !standardizedAligned) || (rawOpposite && !standardizedOpposite)
        ? "composition_confounded"
        : standardizedVerdict;
    }
  }
  const rawEffect = alignedEffect(sides, input.polarity, periodMedianAbsolute);
  const standardizedEffect = compositionShift && standardizedGaps !== null
    ? alignedEffectFromGaps(standardizedGaps, periodMedianAbsolute)
    : rawEffect;
  const magnitudeShift = rawEffect !== null && standardizedEffect !== null && !rawEffect.isZero() &&
    standardizedEffect.minus(rawEffect).abs().dividedBy(rawEffect.abs()).gt("0.5");
  const affectedRate = resultRate(sides.affected, input.polarity);
  const comparisonRate = resultRate(sides.comparison, input.polarity);
  const affectedMedian = medianPnl(sides.affected);
  const comparisonMedian = medianPnl(sides.comparison);
  const alignedVerdict = finalVerdict === "worse_associated_outcome" ||
    finalVerdict === "better_associated_outcome";
  return Object.freeze({
    verdict: finalVerdict,
    consequenceFactor: alignedVerdict ? 1 : finalVerdict === "comparison_unavailable" ? 0.5 : 0,
    affectedCount: affected.length,
    comparisonCount: comparison.length,
    affectedRateDecimal: affectedRate === null ? null : canonical(affectedRate),
    comparisonRateDecimal: comparisonRate === null ? null : canonical(comparisonRate),
    affectedMedianPnlDecimal: affectedMedian === null ? null : canonical(affectedMedian),
    comparisonMedianPnlDecimal: comparisonMedian === null ? null : canonical(comparisonMedian),
    periodMedianAbsolutePnlDecimal: periodMedianAbsolute === null
      ? null
      : canonical(periodMedianAbsolute),
    rawDirectionAlignedRateGapDecimal: rawGaps.rate === null ? null : canonical(rawGaps.rate),
    rawDirectionAlignedMedianGapDecimal: rawGaps.median === null ? null : canonical(rawGaps.median),
    standardizedDirectionAlignedRateGapDecimal: standardizedGaps === null ||
        standardizedGaps.rate === null
      ? null
      : canonical(standardizedGaps.rate),
    standardizedDirectionAlignedMedianGapDecimal: standardizedGaps === null ||
        standardizedGaps.median === null
      ? null
      : canonical(standardizedGaps.median),
    structuralStandardizationApplied: compositionShift && standardizedGaps !== null,
    materialCompositionShift: compositionShift,
    outlierResistance: outlierResistance(sides, input.polarity, periodMedianAbsolute),
    confidenceAdjustment: magnitudeShift ? "magnitude_shift_over_50_percent" : "none",
  });
}
