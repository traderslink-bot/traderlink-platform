import { createHash } from "node:crypto";

import Decimal from "decimal.js";

import {
  COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION,
  type CoachAiReviewCadence,
  type CoachAiReviewComparableOutcomeObservation,
  type CoachAiReviewBehaviorObservation,
  type CoachAiReviewInsightCandidate,
  type CoachAiReviewInsightFamily,
  type CoachAiReviewInsightLane,
  type CoachAiReviewMoneyObservation,
  type CoachAiReviewNormalizedRuleOpportunity,
  type CoachAiReviewObservationUnit,
  type CoachAiReviewResultOwnership,
  type CoachAiReviewScoreDimension,
  type CoachAiReviewTradeStylePopulation,
} from "@/src/modules/coach/contracts/coach-ai-review-insight-contracts";
import {
  createCoachAiReviewMeasurement,
  compareCoachAiReviewConsequences,
  exactCoachAiReviewRatio,
  formatCoachAiReviewRateLiteral,
  measureCoachAiReviewCohortMoney,
  measureCoachAiReviewPeriodOutcomes,
  measureCoachAiReviewPresetEvaluation,
  measureCoachAiReviewRuleDispositions,
} from "./coach-ai-review-insight-measurements";
import {
  CoachAiReviewInsightInvariantError,
  compareCoachAiReviewText,
  freezeSortedUniqueRefs,
  validateCoachAiReviewCandidateMembership,
} from "./coach-ai-review-insight-normalizer";
import {
  calculateCoachAiReviewLaneScore,
  coachAiReviewScoreDimension,
  scoreCoachAiReviewEvidenceConfidence,
  scoreCoachAiReviewFinancialMateriality,
  scoreCoachAiReviewProcessRelevance,
  scoreCoachAiReviewRepetition,
  scoreCoachAiReviewSpecificity,
  scoreCoachAiReviewTrendMagnitude,
} from "./coach-ai-review-insight-ranking";

const ExactDecimal = Decimal.clone({ precision: 160, rounding: Decimal.ROUND_HALF_UP });

function invariant(condition: boolean, code: string): asserts condition {
  if (!condition) throw new CoachAiReviewInsightInvariantError(code);
}

function canonicalDecimal(value: Decimal): string {
  return value.isZero() ? "0" : value.toFixed();
}

function findingRef(parts: readonly unknown[]): string {
  return `finding_${createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 24)}`;
}

function withBucketSensitivity(
  candidate: CoachAiReviewInsightCandidate,
  reductions: readonly Readonly<{
    bucketRef: string;
    candidate: CoachAiReviewInsightCandidate | null;
  }>[],
): CoachAiReviewInsightCandidate {
  const bucketRefs = freezeSortedUniqueRefs(
    reductions.map((reduction) => reduction.bucketRef),
    "CANDIDATE_SENSITIVITY_BUCKET_REF",
  );
  invariant(bucketRefs.length === reductions.length,
    "TRADERLINK_AI_REVIEW_CANDIDATE_SENSITIVITY_BUCKET_DUPLICATE");
  const candidateBucketRefs = freezeSortedUniqueRefs(
    candidate.weekSeries.map((bucket) => bucket.bucketRef),
    "CANDIDATE_WEEK_SERIES_BUCKET_REF",
  );
  invariant(candidateBucketRefs.length === bucketRefs.length &&
    candidateBucketRefs.every((bucketRef, index) => bucketRef === bucketRefs[index]),
  "TRADERLINK_AI_REVIEW_CANDIDATE_SENSITIVITY_BUCKET_SET_MISMATCH");
  const populationSet = new Set(candidate.populationMemberRefs);
  const bucketSensitivity = Object.freeze([...reductions]
    .sort((left, right) => compareCoachAiReviewText(left.bucketRef, right.bucketRef))
    .map((reduction) => {
      const classificationStable = reduction.candidate?.classification === candidate.classification;
      invariant(!classificationStable || reduction.candidate!.affectedMemberRefs.every((memberRef) =>
        populationSet.has(memberRef)),
      "TRADERLINK_AI_REVIEW_CANDIDATE_SENSITIVITY_MEMBER_OUTSIDE_POPULATION");
      return Object.freeze({
        bucketRef: reduction.bucketRef,
        candidateEligible: reduction.candidate !== null && classificationStable,
        classification: reduction.candidate?.classification ?? candidate.classification,
        affectedMemberRefs: classificationStable
          ? reduction.candidate!.affectedMemberRefs
          : Object.freeze([]),
        consequenceVerdict: classificationStable
          ? reduction.candidate!.consequenceVerdict
          : "comparison_unavailable" as const,
        scores: classificationStable ? reduction.candidate!.scores : Object.freeze([]),
      });
    }));
  return Object.freeze({
    ...candidate,
    bucketSensitivity,
    sensitivityResults: Object.freeze([
      ...candidate.sensitivityResults,
      ...bucketSensitivity.map((reduction) =>
        `leave_bucket=${reduction.bucketRef};eligible=${reduction.candidateEligible}`),
    ]),
  });
}

function spreadCount(
  memberRefs: readonly string[],
  bucketByMemberRef: Readonly<Record<string, string>>,
): number {
  return new Set(memberRefs.map((memberRef) => bucketByMemberRef[memberRef]).filter(Boolean)).size;
}

function confidenceForRule(input: Readonly<{
  observedCount: number;
  expectedCount: number;
  affectedCount: number;
  minimumAffected: number;
  affectedSpreadCount: number;
  eligibleSpreadCount: number;
  sourceConflictCount: number;
  outlierResistance: number | null;
}>): CoachAiReviewScoreDimension {
  const coverage = input.expectedCount === 0 ? null : (input.observedCount / input.expectedCount) * 100;
  const sample = input.minimumAffected === 0
    ? null
    : Math.min(100, 50 * input.affectedCount / input.minimumAffected);
  const spread = input.eligibleSpreadCount === 0
    ? null
    : (input.affectedSpreadCount / input.eligibleSpreadCount) * 100;
  const sourceConsistency = input.sourceConflictCount === 0 ? 100 : 0;
  return scoreCoachAiReviewEvidenceConfidence({
    requiredFieldCoverage: coverage,
    weakestSampleSufficiency: sample,
    independentSpread: spread,
    outlierResistance: input.outlierResistance,
    structuredSourceConsistency: sourceConsistency,
  });
}

export function buildCoachAiReviewPeriodOutcomeCandidate(input: Readonly<{
  cadence: CoachAiReviewCadence;
  observations: readonly CoachAiReviewMoneyObservation[];
  periodStartDate: string;
  periodEndDate: string;
  tradingDayRefs: readonly string[];
  confirmedOpenPositionRefs: readonly string[];
  openLifecycleReductionRefs: readonly string[];
}>): CoachAiReviewInsightCandidate {
  const confirmedOpenPositionRefs = freezeSortedUniqueRefs(
    input.confirmedOpenPositionRefs,
    "PERIOD_OPEN_POSITION_REF",
  );
  const openLifecycleReductionRefs = freezeSortedUniqueRefs(
    input.openLifecycleReductionRefs,
    "PERIOD_OPEN_REDUCTION_REF",
  );
  const tradingDayRefs = freezeSortedUniqueRefs(input.tradingDayRefs, "PERIOD_TRADING_DAY_REF");
  const openPositionSet = new Set(confirmedOpenPositionRefs);
  invariant(openLifecycleReductionRefs.every((memberRef) => openPositionSet.has(memberRef)),
    "TRADERLINK_AI_REVIEW_OPEN_REDUCTION_OUTSIDE_OPEN_POSITION");
  const outcome = measureCoachAiReviewPeriodOutcomes(input.observations);
  const observationByRef = new Map(input.observations.map((observation) => [
    observation.memberRef,
    observation,
  ]));
  const resultEligibleRefs = outcome.memberRefs.filter(
    (memberRef) => observationByRef.get(memberRef)!.netPnlDecimal !== null,
  );
  const winRefs = resultEligibleRefs.filter((memberRef) =>
    new ExactDecimal(observationByRef.get(memberRef)!.netPnlDecimal!).gt(0));
  const lossRefs = resultEligibleRefs.filter((memberRef) =>
    new ExactDecimal(observationByRef.get(memberRef)!.netPnlDecimal!).lt(0));
  const flatRefs = resultEligibleRefs.filter((memberRef) =>
    new ExactDecimal(observationByRef.get(memberRef)!.netPnlDecimal!).isZero());
  const moneyRefs = outcome.moneyEligibleMemberRefs;
  const comparableMoneyRefs = outcome.currency === null
    ? []
    : moneyRefs.filter((memberRef) => observationByRef.get(memberRef)!.currency === outcome.currency);
  const moneyWinRefs = comparableMoneyRefs.filter((memberRef) => winRefs.includes(memberRef));
  const moneyLossRefs = comparableMoneyRefs.filter((memberRef) => lossRefs.includes(memberRef));
  const largestWinnerRef = [...moneyWinRefs].sort((left, right) =>
    new ExactDecimal(observationByRef.get(right)!.netPnlDecimal!).comparedTo(
      new ExactDecimal(observationByRef.get(left)!.netPnlDecimal!),
    ) || compareCoachAiReviewText(left, right))[0] ?? null;
  const largestLoserRef = [...moneyLossRefs].sort((left, right) =>
    new ExactDecimal(observationByRef.get(left)!.netPnlDecimal!).comparedTo(
      new ExactDecimal(observationByRef.get(right)!.netPnlDecimal!),
    ) || compareCoachAiReviewText(left, right))[0] ?? null;
  const moneyAvailability = (exactValue: string | null) => exactValue === null
    ? outcome.moneyAvailability === "mixed_currency"
      ? "unavailable_mixed_currency" as const
      : "unavailable_missing_money" as const
    : outcome.moneyCoverageComplete
      ? "available" as const
      : "partial_display_only" as const;
  const measurements = Object.freeze([
    createCoachAiReviewMeasurement({
      metricName: "trading_day_count",
      exactValue: String(tradingDayRefs.length),
      unit: "count",
      observationUnit: "trading_day",
      numeratorMemberRefs: tradingDayRefs,
      denominatorMemberRefs: tradingDayRefs,
      expectedCount: tradingDayRefs.length,
      availability: "available",
      attributionKind: "period_result",
      displayLiteral: String(tradingDayRefs.length),
    }),
    createCoachAiReviewMeasurement({
      metricName: "closed_trade_count",
      exactValue: String(outcome.tradeCount),
      unit: "count",
      observationUnit: "trade",
      numeratorMemberRefs: outcome.memberRefs,
      denominatorMemberRefs: outcome.memberRefs,
      expectedCount: outcome.tradeCount,
      availability: "available",
      attributionKind: "period_result",
      displayLiteral: String(outcome.tradeCount),
    }),
    createCoachAiReviewMeasurement({
      metricName: "closed_trade_net_pnl",
      exactValue: outcome.netPnlDecimal,
      unit: "money",
      currency: outcome.currency,
      observationUnit: "trade",
      numeratorMemberRefs: outcome.moneyEligibleMemberRefs,
      denominatorMemberRefs: outcome.memberRefs,
      moneyEligibleCount: outcome.moneyEligibleMemberRefs.length,
      expectedCount: outcome.tradeCount,
      availability: outcome.netPnlDecimal === null
        ? outcome.moneyAvailability === "mixed_currency"
          ? "unavailable_mixed_currency"
          : "unavailable_missing_money"
        : outcome.moneyAvailability === "available"
          ? "available"
          : "partial_display_only",
      attributionKind: "period_result",
      displayLiteral: outcome.netPnlDecimal === null || outcome.currency === null
        ? null
        : `${outcome.currency} ${outcome.netPnlDecimal}`,
    }),
    createCoachAiReviewMeasurement({
      metricName: "win_rate",
      exactValue: outcome.winRateDecimal,
      unit: "ratio",
      observationUnit: "trade",
      numeratorMemberRefs: winRefs,
      denominatorMemberRefs: resultEligibleRefs,
      expectedCount: outcome.tradeCount,
      availability: outcome.winRateDecimal === null
        ? "unavailable_missing_population"
        : "available",
      attributionKind: "period_result",
      displayLiteral: resultEligibleRefs.length === 0
        ? null
        : `${winRefs.length} of ${resultEligibleRefs.length}`,
    }),
    createCoachAiReviewMeasurement({
      metricName: "loss_rate",
      exactValue: outcome.lossRateDecimal,
      unit: "ratio",
      observationUnit: "trade",
      numeratorMemberRefs: lossRefs,
      denominatorMemberRefs: resultEligibleRefs,
      expectedCount: outcome.tradeCount,
      availability: outcome.lossRateDecimal === null
        ? "unavailable_missing_population"
        : "available",
      attributionKind: "period_result",
      displayLiteral: resultEligibleRefs.length === 0
        ? null
        : `${lossRefs.length} of ${resultEligibleRefs.length}`,
    }),
    createCoachAiReviewMeasurement({
      metricName: "flat_count",
      exactValue: String(flatRefs.length),
      unit: "count",
      observationUnit: "trade",
      numeratorMemberRefs: flatRefs,
      denominatorMemberRefs: resultEligibleRefs,
      expectedCount: outcome.tradeCount,
      availability: resultEligibleRefs.length === 0 ? "unavailable_missing_population" : "available",
      attributionKind: "period_result",
      displayLiteral: `${flatRefs.length} of ${resultEligibleRefs.length}`,
    }),
    ...([
      ["winning_trade_pnl", outcome.winningPnlDecimal, moneyWinRefs, winRefs],
      ["losing_trade_pnl", outcome.losingPnlDecimal, moneyLossRefs, lossRefs],
      ["average_winner", outcome.averageWinnerDecimal, moneyWinRefs, winRefs],
      ["average_loser", outcome.averageLoserDecimal, moneyLossRefs, lossRefs],
      ["median_winner", outcome.medianWinnerDecimal, moneyWinRefs, winRefs],
      ["median_loser", outcome.medianLoserDecimal, moneyLossRefs, lossRefs],
    ] as const).map(([metricName, exactValue, numeratorMemberRefs, denominatorMemberRefs]) =>
      createCoachAiReviewMeasurement({
        metricName,
        exactValue,
        unit: "money",
        currency: outcome.currency,
        observationUnit: "trade",
        numeratorMemberRefs,
        denominatorMemberRefs,
        moneyEligibleCount: denominatorMemberRefs.filter((memberRef) =>
          moneyRefs.includes(memberRef)).length,
        expectedCount: denominatorMemberRefs.length,
        availability: exactValue === null && denominatorMemberRefs.length === 0
          ? "unavailable_missing_population"
          : moneyAvailability(exactValue),
        attributionKind: "period_result",
        displayLiteral: exactValue === null || outcome.currency === null
          ? null
          : `${outcome.currency} ${exactValue}`,
      })),
    ...([
      ["largest_winner", outcome.largestWinnerDecimal, largestWinnerRef, winRefs],
      ["largest_loser", outcome.largestLoserDecimal, largestLoserRef, lossRefs],
    ] as const).map(([metricName, exactValue, memberRef, denominatorMemberRefs]) =>
      createCoachAiReviewMeasurement({
        metricName,
        exactValue,
        unit: "money",
        currency: outcome.currency,
        observationUnit: "trade",
        numeratorMemberRefs: memberRef === null ? [] : [memberRef],
        denominatorMemberRefs,
        moneyEligibleCount: denominatorMemberRefs.filter((candidateRef) =>
          moneyRefs.includes(candidateRef)).length,
        expectedCount: denominatorMemberRefs.length,
        availability: memberRef === null ? "unavailable_missing_population" : moneyAvailability(exactValue),
        attributionKind: "period_result",
        displayLiteral: exactValue === null || outcome.currency === null
          ? null
          : `${outcome.currency} ${exactValue}`,
      })),
    createCoachAiReviewMeasurement({
      metricName: "profit_factor",
      exactValue: outcome.profitFactorDecimal,
      unit: "ratio",
      observationUnit: "trade",
      numeratorMemberRefs: [...moneyWinRefs, ...moneyLossRefs],
      denominatorMemberRefs: moneyRefs,
      moneyEligibleCount: moneyRefs.length,
      expectedCount: outcome.tradeCount,
      availability: outcome.profitFactorDecimal === null
        ? lossRefs.length === 0
          ? "unavailable_missing_population"
          : moneyAvailability(null)
        : moneyAvailability(outcome.profitFactorDecimal),
      attributionKind: "period_result",
      displayLiteral: outcome.profitFactorDecimal,
    }),
    ...([
      ["largest_winner_contribution", outcome.largestWinnerContributionDecimal, largestWinnerRef, moneyWinRefs],
      ["largest_loser_contribution", outcome.largestLoserContributionDecimal, largestLoserRef, moneyLossRefs],
    ] as const).map(([metricName, exactValue, memberRef, denominatorMemberRefs]) =>
      createCoachAiReviewMeasurement({
        metricName,
        exactValue,
        unit: "ratio",
        observationUnit: "trade",
        numeratorMemberRefs: memberRef === null ? [] : [memberRef],
        denominatorMemberRefs,
        moneyEligibleCount: denominatorMemberRefs.filter((candidateRef) =>
          moneyRefs.includes(candidateRef)).length,
        expectedCount: denominatorMemberRefs.length,
        availability: exactValue === null
          ? "unavailable_missing_population"
          : moneyAvailability(exactValue),
        attributionKind: "period_result",
        displayLiteral: exactValue,
      })),
    ...([
      ["net_excluding_largest_winner", outcome.netExcludingLargestWinnerDecimal, largestWinnerRef],
      ["net_excluding_largest_loser", outcome.netExcludingLargestLoserDecimal, largestLoserRef],
    ] as const).map(([metricName, exactValue, excludedMemberRef]) =>
      createCoachAiReviewMeasurement({
        metricName,
        exactValue,
        unit: "money",
        currency: outcome.currency,
        observationUnit: "trade",
        numeratorMemberRefs: excludedMemberRef === null
          ? []
          : moneyRefs.filter((memberRef) => memberRef !== excludedMemberRef),
        denominatorMemberRefs: moneyRefs,
        moneyEligibleCount: moneyRefs.length,
        expectedCount: outcome.tradeCount,
        availability: excludedMemberRef === null
          ? "unavailable_missing_population"
          : moneyAvailability(exactValue),
        attributionKind: "period_result",
        displayLiteral: exactValue === null || outcome.currency === null
          ? null
          : `${outcome.currency} ${exactValue}`,
      })),
    createCoachAiReviewMeasurement({
      metricName: "confirmed_period_end_open_positions",
      exactValue: String(confirmedOpenPositionRefs.length),
      unit: "count",
      observationUnit: "trade",
      numeratorMemberRefs: confirmedOpenPositionRefs,
      denominatorMemberRefs: confirmedOpenPositionRefs,
      expectedCount: confirmedOpenPositionRefs.length,
      availability: "available",
      attributionKind: "coverage_only",
      displayLiteral: String(confirmedOpenPositionRefs.length),
    }),
    createCoachAiReviewMeasurement({
      metricName: "open_lifecycles_with_period_reduction",
      exactValue: String(openLifecycleReductionRefs.length),
      unit: "count",
      observationUnit: "trade",
      numeratorMemberRefs: openLifecycleReductionRefs,
      denominatorMemberRefs: confirmedOpenPositionRefs,
      expectedCount: confirmedOpenPositionRefs.length,
      availability: "available",
      attributionKind: "coverage_only",
      displayLiteral: String(openLifecycleReductionRefs.length),
    }),
    createCoachAiReviewMeasurement({
      metricName: "period_end_open_position_unrealized_pnl",
      exactValue: null,
      unit: "money",
      observationUnit: "trade",
      numeratorMemberRefs: [],
      denominatorMemberRefs: confirmedOpenPositionRefs,
      moneyEligibleCount: 0,
      expectedCount: confirmedOpenPositionRefs.length,
      availability: confirmedOpenPositionRefs.length === 0
        ? "not_applicable"
        : "unavailable_missing_money",
      attributionKind: "coverage_only",
      displayLiteral: null,
    }),
  ]);
  const candidate: CoachAiReviewInsightCandidate = Object.freeze({
    findingRef: findingRef([
      "period_outcome",
      input.cadence,
      input.periodStartDate,
      input.periodEndDate,
      outcome.memberRefs,
    ]),
    engineVersion: COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION,
    family: "period_outcome",
    classification: "outcome_context",
    polarity: outcome.netPnlDecimal === null
      ? "context"
      : new ExactDecimal(outcome.netPnlDecimal).gt(0)
        ? "positive"
        : new ExactDecimal(outcome.netPnlDecimal).lt(0)
          ? "negative"
          : "context",
    subjectRef: `period_${input.periodStartDate}_${input.periodEndDate}`,
    observationUnit: "trade",
    resultOwnership: "trade_close_market_date",
    populationDefinition: "Trades authoritatively closed inside the review period.",
    populationMemberRefs: outcome.memberRefs,
    opportunityDefinition: null,
    opportunityMemberRefs: Object.freeze([]),
    affectedMemberRefs: outcome.memberRefs,
    tradeStylePopulation: "all_closed_trades",
    laneEligibility: Object.freeze([]),
    cohortDefinition: "All closed trades in the exact period.",
    comparisonDefinition: null,
    measurements,
    weekSeries: Object.freeze([]),
    representativeEvidenceRefs: Object.freeze([]),
    representativeEvidenceRoles: Object.freeze([]),
    representativeMetricName: null,
    relatedRuleRefs: Object.freeze([]),
    relatedFocusRefs: Object.freeze([]),
    overlapKeys: Object.freeze([`period:${input.periodStartDate}:${input.periodEndDate}`]),
    coverage: Object.freeze({
      observedCount: outcome.moneyEligibleMemberRefs.length,
      expectedCount: outcome.tradeCount,
      balanced: "balance_unavailable",
    }),
    consequenceVerdict: "comparison_unavailable",
    futureTrackability: "not_applicable",
    scores: Object.freeze([]),
    adjustments: Object.freeze([]),
    penalties: Object.freeze([]),
    bucketSensitivity: Object.freeze([]),
    sensitivityResults: Object.freeze([]),
    rankExplanation: Object.freeze([
      "Outcome context is opening evidence and is not itself good or bad process.",
    ]),
  });
  validateCoachAiReviewCandidateMembership(candidate);
  return candidate;
}

export type CoachAiReviewRuleCandidateSource = Readonly<{
  ruleRef: string;
  ruleVersionRef: string;
  targetKind: "trading_day" | "round_trip";
  presetCoreRule: boolean;
  cadence: CoachAiReviewCadence;
  opportunities: readonly CoachAiReviewNormalizedRuleOpportunity[];
  bucketByTargetRef: Readonly<Record<string, string>>;
  moneyObservations: readonly CoachAiReviewComparableOutcomeObservation[];
  periodOutcomes: ReturnType<typeof measureCoachAiReviewPeriodOutcomes>;
  representativeEvidence?: Readonly<Record<"negative" | "positive", readonly Readonly<{
    memberRef: string;
    role: CoachAiReviewInsightCandidate["representativeEvidenceRoles"][number];
  }>[]>>;
  representativeEvidenceByOmittedBucket?: Readonly<Record<string,
    Readonly<Record<"negative" | "positive", readonly Readonly<{
      memberRef: string;
      role: CoachAiReviewInsightCandidate["representativeEvidenceRoles"][number];
    }>[]>>>>;
}>;

function ruleCandidate(input: Readonly<{
  source: CoachAiReviewRuleCandidateSource;
  polarity: "negative" | "positive";
  affectedMemberRefs: readonly string[];
  comparisonMemberRefs: readonly string[];
  evidenceSource: "saved_disposition" | "preset_evaluator" | "combined";
}>): CoachAiReviewInsightCandidate | null {
  const source = input.source;
  const expected = source.opportunities.filter((item) => item.isReviewOpportunity);
  const affectedMemberRefs = freezeSortedUniqueRefs(input.affectedMemberRefs, "RULE_CANDIDATE_AFFECTED_REF");
  const comparisonMemberRefs = freezeSortedUniqueRefs(
    input.comparisonMemberRefs,
    "RULE_CANDIDATE_COMPARISON_REF",
  );
  const expectedRefs = freezeSortedUniqueRefs(expected.map((item) => item.targetRef), "RULE_CANDIDATE_EXPECTED_REF");
  const eligibleSpreadCount = spreadCount(expectedRefs, source.bucketByTargetRef);
  const affectedSpreadCount = spreadCount(affectedMemberRefs, source.bucketByTargetRef);
  const observationMinimum = input.polarity === "negative" ? 2 : 3;
  const recurring = affectedMemberRefs.length >= observationMinimum && affectedSpreadCount >= 2;
  const dispositionMeasurements = measureCoachAiReviewRuleDispositions(source.opportunities);
  const evaluatorMeasurements = measureCoachAiReviewPresetEvaluation(source.opportunities);
  const affectedMoneyRefs = source.targetKind === "round_trip"
    ? affectedMemberRefs
    : freezeSortedUniqueRefs(source.opportunities
      .filter((item) => affectedMemberRefs.includes(item.targetRef))
      .flatMap((item) => item.authorizedViolationTradeRefs), "RULE_EVENT_BOUNDED_TRADE_REF");
  const comparisonMoneyRefs = source.targetKind === "round_trip" ? comparisonMemberRefs : [];
  const cohortMoney = measureCoachAiReviewCohortMoney({
    affectedMemberRefs: affectedMoneyRefs,
    observations: source.moneyObservations,
    period: source.periodOutcomes,
  });
  const consequence = compareCoachAiReviewConsequences({
    polarity: input.polarity,
    affectedMemberRefs: source.targetKind === "round_trip" ? affectedMoneyRefs : [],
    comparisonMemberRefs: comparisonMoneyRefs,
    observations: source.moneyObservations,
    periodMoneyObservations: source.moneyObservations,
    period: source.periodOutcomes,
  });
  const poolShare = input.polarity === "negative"
    ? cohortMoney.adverseNetContributionDecimal
    : cohortMoney.beneficialNetContributionDecimal;
  const financial = scoreCoachAiReviewFinancialMateriality({
    poolShareDecimal: poolShare,
    periodMagnitudeShareDecimal: cohortMoney.periodMagnitudeShareDecimal,
    consequenceFactor: consequence.consequenceFactor,
  });
  const financiallyMaterial = financial.value !== null && financial.value >= 10;
  if (!recurring && !(input.polarity === "negative" && affectedMemberRefs.length >= 2 && financiallyMaterial)) {
    return null;
  }
  const opportunityRate = exactCoachAiReviewRatio(
    affectedMemberRefs.length,
    expectedRefs.length,
  );
  const representativeEvidence = source.representativeEvidence?.[input.polarity] ?? [];
  invariant(representativeEvidence.length <= 3,
    "TRADERLINK_AI_REVIEW_RULE_REPRESENTATIVE_LIMIT");
  invariant(new Set(representativeEvidence.map((item) => item.memberRef)).size ===
      representativeEvidence.length,
  "TRADERLINK_AI_REVIEW_RULE_REPRESENTATIVE_DUPLICATE");
  invariant(representativeEvidence.every((item) => expectedRefs.includes(item.memberRef)),
    "TRADERLINK_AI_REVIEW_RULE_REPRESENTATIVE_OUTSIDE_POPULATION");
  const repetition = scoreCoachAiReviewRepetition({
    affectedCount: affectedMemberRefs.length,
    eligibleCount: expectedRefs.length,
    rateDecimal: opportunityRate,
    affectedSpreadCount,
    eligibleSpreadCount,
  });
  const processRelevance = scoreCoachAiReviewProcessRelevance({
    structuralClass: source.presetCoreRule ? "preset_core_rule" : "named_rule_or_exact_focus",
  });
  const sourceConflictCount = source.opportunities.filter(
    (item) => item.sourceConsistency === "conflict",
  ).length;
  const savedObservedRefs = expected.filter((item) =>
    item.dispositionState === "reviewed_followed" ||
      item.dispositionState === "reviewed_broken").map((item) => item.targetRef);
  const evaluatorObservedRefs = source.opportunities.filter((item) =>
    (item.presetEvaluationState === "evaluated_followed" ||
      item.presetEvaluationState === "evaluated_broken") &&
    item.sourceConsistency !== "conflict").map((item) => item.targetRef);
  const evidenceObservedCount = input.evidenceSource === "preset_evaluator"
    ? evaluatorObservedRefs.length
    : input.evidenceSource === "saved_disposition"
      ? savedObservedRefs.length
      : new Set([...savedObservedRefs, ...evaluatorObservedRefs]).size;
  const confidence = confidenceForRule({
    observedCount: evidenceObservedCount,
    expectedCount: expected.length,
    affectedCount: affectedMemberRefs.length,
    minimumAffected: observationMinimum,
    affectedSpreadCount,
    eligibleSpreadCount,
    sourceConflictCount,
    outlierResistance: consequence.outlierResistance,
  });
  const specificity = scoreCoachAiReviewSpecificity({
    exactBehaviorSubject: true,
    fixedResultCohort: false,
    exactDenominator: expectedRefs.length > 0,
    hasRepresentativeEvidence: representativeEvidence.length > 0,
    exactSequenceOrComparison: false,
    measurableFutureTarget: true,
  });
  const neutral = coachAiReviewScoreDimension({
    name: "persistence_or_adverse_trend",
    value: null,
    explanation: "A compatible later-window recurrence or adverse trend was not supplied.",
  });
  const outcomeSupport = coachAiReviewScoreDimension({
    name: "outcome_support",
    value: input.polarity === "positive" &&
        cohortMoney.beneficialNetContributionDecimal !== null
      ? new ExactDecimal(cohortMoney.beneficialNetContributionDecimal)
        .times(100)
        .times(consequence.consequenceFactor)
        .toNumber()
      : null,
    rawInputs: {
      beneficialNetContributionDecimal: cohortMoney.beneficialNetContributionDecimal,
      consequenceFactor: consequence.consequenceFactor,
    },
    explanation: input.polarity === "positive"
      ? "Beneficial complete-cohort net contribution to the period winning pool."
      : "Outcome support is not used by a negative rule candidate.",
  });
  const focus = coachAiReviewScoreDimension({
    name: "focus_relevance",
    value: 0,
    explanation: "No earlier focus match was supplied.",
  });
  const crossPeriod = coachAiReviewScoreDimension({
    name: "cross_period_consistency",
    value: eligibleSpreadCount === 0 ? null : (affectedSpreadCount / eligibleSpreadCount) * 100,
    explanation: "Affected independent buckets divided by eligible independent buckets.",
  });
  const dimensions = input.polarity === "negative"
    ? [financial, repetition, processRelevance, confidence, neutral, focus, specificity]
    : [processRelevance, repetition, outcomeSupport, crossPeriod, confidence, focus, specificity];
  const lane = input.polarity === "negative" ? "friction" as const : "strength" as const;
  const score = calculateCoachAiReviewLaneScore({ lane, dimensions });
  const measurements = Object.freeze([
    ...dispositionMeasurements,
    ...evaluatorMeasurements,
    createCoachAiReviewMeasurement({
      metricName: input.polarity === "negative" ? "rule_affected_count" : "rule_followed_count",
      exactValue: String(affectedMemberRefs.length),
      unit: "count",
      observationUnit: "rule_review_opportunity",
      numeratorMemberRefs: affectedMemberRefs,
      denominatorMemberRefs: expectedRefs,
      expectedCount: expectedRefs.length,
      availability: expectedRefs.length === 0 ? "not_applicable" : "available",
      attributionKind: input.evidenceSource === "preset_evaluator"
        ? "preset_evaluator"
        : "cohort_association",
      displayLiteral: `${affectedMemberRefs.length} of ${expectedRefs.length}`,
    }),
    createCoachAiReviewMeasurement({
      metricName: "affected_cohort_net_pnl",
      exactValue: cohortMoney.cohortNetPnlDecimal,
      unit: "money",
      currency: cohortMoney.currency,
      observationUnit: "trade",
      numeratorMemberRefs: cohortMoney.moneyEligibleMemberRefs,
      denominatorMemberRefs: affectedMoneyRefs,
      moneyEligibleCount: cohortMoney.moneyEligibleMemberRefs.length,
      expectedCount: affectedMoneyRefs.length,
      availability: affectedMoneyRefs.length === 0
        ? "not_applicable"
        : cohortMoney.cohortNetPnlDecimal === null
          ? source.periodOutcomes.moneyAvailability === "mixed_currency"
            ? "unavailable_mixed_currency"
            : "unavailable_missing_money"
          : cohortMoney.coverageComplete
            ? "available"
            : "partial_display_only",
      attributionKind: "cohort_association",
      displayLiteral: cohortMoney.cohortNetPnlDecimal === null || cohortMoney.currency === null
        ? null
        : `${cohortMoney.currency} ${cohortMoney.cohortNetPnlDecimal}`,
    }),
    createCoachAiReviewMeasurement({
      metricName: "affected_losing_trade_pnl",
      exactValue: cohortMoney.affectedLosingPnlDecimal,
      unit: "money",
      currency: cohortMoney.currency,
      observationUnit: "trade",
      numeratorMemberRefs: cohortMoney.moneyEligibleMemberRefs.filter((memberRef) => {
        const observation = source.moneyObservations.find((item) => item.memberRef === memberRef);
        return observation !== undefined && observation.netPnlDecimal !== null &&
          new ExactDecimal(observation.netPnlDecimal).lt(0);
      }),
      denominatorMemberRefs: affectedMoneyRefs,
      moneyEligibleCount: cohortMoney.moneyEligibleMemberRefs.length,
      expectedCount: affectedMoneyRefs.length,
      availability: affectedMoneyRefs.length === 0
        ? "not_applicable"
        : cohortMoney.affectedLosingPnlDecimal === null
          ? source.periodOutcomes.moneyAvailability === "mixed_currency"
            ? "unavailable_mixed_currency"
            : "unavailable_missing_money"
          : cohortMoney.coverageComplete
            ? "available"
            : "partial_display_only",
      attributionKind: "cohort_association",
      displayLiteral: cohortMoney.affectedLosingPnlDecimal === null || cohortMoney.currency === null
        ? null
        : `${cohortMoney.currency} ${cohortMoney.affectedLosingPnlDecimal}`,
    }),
    createCoachAiReviewMeasurement({
      metricName: input.polarity === "negative"
        ? "adverse_net_contribution"
        : "beneficial_net_contribution",
      exactValue: poolShare,
      unit: "ratio",
      observationUnit: "trade",
      numeratorMemberRefs: cohortMoney.moneyEligibleMemberRefs,
      denominatorMemberRefs: source.periodOutcomes.moneyEligibleMemberRefs,
      moneyEligibleCount: cohortMoney.moneyEligibleMemberRefs.length,
      expectedCount: source.periodOutcomes.memberRefs.length,
      availability: affectedMoneyRefs.length === 0
        ? "not_applicable"
        : poolShare === null
          ? source.periodOutcomes.moneyAvailability === "mixed_currency"
            ? "unavailable_mixed_currency"
            : "unavailable_missing_money"
          : "available",
      attributionKind: "cohort_association",
      displayLiteral: poolShare,
    }),
    createCoachAiReviewMeasurement({
      metricName: input.polarity === "negative" ? "loss_share" : "profit_share",
      exactValue: input.polarity === "negative"
        ? cohortMoney.lossShareDecimal
        : cohortMoney.profitShareDecimal,
      unit: "ratio",
      observationUnit: "trade",
      numeratorMemberRefs: cohortMoney.moneyEligibleMemberRefs.filter((memberRef) => {
        const observation = source.moneyObservations.find((item) => item.memberRef === memberRef);
        if (observation?.netPnlDecimal === null || observation === undefined) return false;
        const value = new ExactDecimal(observation.netPnlDecimal);
        return input.polarity === "negative" ? value.lt(0) : value.gt(0);
      }),
      denominatorMemberRefs: source.periodOutcomes.moneyEligibleMemberRefs,
      moneyEligibleCount: cohortMoney.moneyEligibleMemberRefs.length,
      expectedCount: source.periodOutcomes.memberRefs.length,
      availability: affectedMoneyRefs.length === 0
        ? "not_applicable"
        : cohortMoney.coverageComplete
          ? (input.polarity === "negative"
              ? cohortMoney.lossShareDecimal
              : cohortMoney.profitShareDecimal) === null
            ? "unavailable_missing_population"
            : "available"
          : source.periodOutcomes.moneyAvailability === "mixed_currency"
            ? "unavailable_mixed_currency"
            : "unavailable_missing_money",
      attributionKind: "cohort_association",
      displayLiteral: input.polarity === "negative"
        ? cohortMoney.lossShareDecimal
        : cohortMoney.profitShareDecimal,
    }),
    createCoachAiReviewMeasurement({
      metricName: "affected_comparison_result_rate",
      exactValue: consequence.affectedRateDecimal,
      unit: "ratio",
      observationUnit: "trade",
      numeratorMemberRefs: source.moneyObservations.filter((observation) =>
        affectedMoneyRefs.includes(observation.memberRef) && observation.netPnlDecimal !== null &&
        (input.polarity === "negative"
          ? new ExactDecimal(observation.netPnlDecimal).lt(0)
          : new ExactDecimal(observation.netPnlDecimal).gt(0)))
        .map((observation) => observation.memberRef),
      denominatorMemberRefs: affectedMoneyRefs,
      expectedCount: affectedMoneyRefs.length,
      availability: consequence.affectedRateDecimal === null
        ? "unavailable_incompatible_comparison"
        : "available",
      attributionKind: "cohort_association",
      displayLiteral: consequence.affectedRateDecimal,
    }),
    createCoachAiReviewMeasurement({
      metricName: "remainder_comparison_result_rate",
      exactValue: consequence.comparisonRateDecimal,
      unit: "ratio",
      observationUnit: "trade",
      numeratorMemberRefs: source.moneyObservations.filter((observation) =>
        comparisonMoneyRefs.includes(observation.memberRef) && observation.netPnlDecimal !== null &&
        (input.polarity === "negative"
          ? new ExactDecimal(observation.netPnlDecimal).lt(0)
          : new ExactDecimal(observation.netPnlDecimal).gt(0)))
        .map((observation) => observation.memberRef),
      denominatorMemberRefs: comparisonMoneyRefs,
      expectedCount: comparisonMoneyRefs.length,
      availability: consequence.comparisonRateDecimal === null
        ? "unavailable_incompatible_comparison"
        : "available",
      attributionKind: "cohort_association",
      displayLiteral: consequence.comparisonRateDecimal,
    }),
  ]);
  const weekSeries = Object.freeze([...new Set([
    ...expectedRefs.map((memberRef) => source.bucketByTargetRef[memberRef]),
    ...source.moneyObservations.map((observation) => observation.bucketRef),
  ].filter((bucketRef): bucketRef is string =>
    typeof bucketRef === "string" && bucketRef.length > 0))]
    .sort(compareCoachAiReviewText)
    .map((bucketRef) => Object.freeze({
      bucketRef,
      numerator: affectedMemberRefs.filter((memberRef) =>
        source.bucketByTargetRef[memberRef] === bucketRef).length,
      denominator: expectedRefs.filter((memberRef) =>
        source.bucketByTargetRef[memberRef] === bucketRef).length,
    })));
  const candidate: CoachAiReviewInsightCandidate = Object.freeze({
    findingRef: findingRef([
      "named_rule_association",
      source.ruleVersionRef,
      source.targetKind,
      input.polarity,
      input.evidenceSource,
      affectedMemberRefs,
    ]),
    engineVersion: COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION,
    family: "named_rule_association",
    classification: "recurring",
    polarity: input.polarity,
    subjectRef: source.ruleRef,
    observationUnit: "rule_review_opportunity",
    resultOwnership: "rule_target",
    populationDefinition: "Exact historical rule targets for the same rule version and scope.",
    populationMemberRefs: expectedRefs,
    opportunityDefinition: "Active, historically projected, applicable rule targets.",
    opportunityMemberRefs: expectedRefs,
    affectedMemberRefs,
    tradeStylePopulation: "unknown_or_mixed",
    laneEligibility: Object.freeze([lane]),
    cohortDefinition: input.evidenceSource === "preset_evaluator"
      ? "Same-version preset-evaluated targets."
      : input.evidenceSource === "combined"
        ? "One same-version rule cohort with recorded and preset-evaluated evidence kept distinct."
        : "Saved dispositions for the same rule version.",
    comparisonDefinition: source.targetKind === "round_trip" && comparisonMemberRefs.length > 0
      ? "Same-rule, same-version affected targets versus the opposite recorded/evaluated outcome."
      : null,
    measurements,
    weekSeries,
    representativeEvidenceRefs: Object.freeze(representativeEvidence.map((item) => item.memberRef)),
    representativeEvidenceRoles: Object.freeze(representativeEvidence.map((item) => item.role)),
    representativeMetricName: source.targetKind === "round_trip"
      ? "trade_net_pnl"
      : "market_date_chronology",
    relatedRuleRefs: Object.freeze([source.ruleRef]),
    relatedFocusRefs: Object.freeze([]),
    overlapKeys: Object.freeze([`rule:${source.ruleVersionRef}:${source.targetKind}`]),
    coverage: Object.freeze({
      observedCount: evidenceObservedCount,
      expectedCount: expected.length,
      balanced: "balance_unavailable",
    }),
    consequenceVerdict: consequence.verdict,
    futureTrackability: "trackable",
    scores: Object.freeze([score]),
    adjustments: Object.freeze([
      ...(input.evidenceSource !== "saved_disposition"
        ? ["Preset evaluation remains separate from saved review completion."]
        : []),
      ...(source.targetKind === "trading_day" && affectedMoneyRefs.length === 0
        ? ["Full-day P/L is context-only; no typed event-bounded trade set was available."]
        : source.targetKind === "trading_day"
          ? ["Money evidence uses only the preset evaluator's typed violation-trade set."]
        : []),
      ...(consequence.confidenceAdjustment === "magnitude_shift_over_50_percent"
        ? ["Structural standardization changed consequence magnitude by more than 50 percent."]
        : []),
    ]),
    penalties: Object.freeze([]),
    bucketSensitivity: Object.freeze([]),
    sensitivityResults: Object.freeze([]),
    rankExplanation: Object.freeze([
      `${lane}=${score.postPenaltyScore}`,
      `evidence_source=${input.evidenceSource}`,
      `consequence=${consequence.verdict}`,
    ]),
  });
  validateCoachAiReviewCandidateMembership(candidate);
  return candidate;
}

function buildCoachAiReviewNamedRuleCandidatesCore(
  source: CoachAiReviewRuleCandidateSource,
): readonly CoachAiReviewInsightCandidate[] {
  invariant(source.opportunities.every((item) =>
    item.ruleRef === source.ruleRef && item.ruleVersionRef === source.ruleVersionRef &&
    item.targetKind === source.targetKind), "TRADERLINK_AI_REVIEW_RULE_SOURCE_MIXED");
  const savedBroken = source.opportunities.filter((item) =>
    item.dispositionState === "reviewed_broken").map((item) => item.targetRef);
  const evaluatedBroken = source.opportunities.filter((item) =>
    item.presetEvaluationState === "evaluated_broken" &&
    item.sourceConsistency !== "conflict").map((item) => item.targetRef);
  const savedFollowed = source.opportunities.filter((item) =>
    item.dispositionState === "reviewed_followed").map((item) => item.targetRef);
  const evaluatedFollowed = source.opportunities.filter((item) =>
    item.presetEvaluationState === "evaluated_followed" &&
    item.sourceConsistency !== "conflict").map((item) => item.targetRef);
  const combinedBroken = freezeSortedUniqueRefs(
    [...new Set([...savedBroken, ...evaluatedBroken])],
    "RULE_COMBINED_BROKEN_REF",
  );
  const combinedFollowed = freezeSortedUniqueRefs(
    [...new Set([...savedFollowed, ...evaluatedFollowed])],
    "RULE_COMBINED_FOLLOWED_REF",
  );
  const brokenSource = savedBroken.length > 0 && evaluatedBroken.length > 0
    ? "combined" as const
    : evaluatedBroken.length > 0
      ? "preset_evaluator" as const
      : "saved_disposition" as const;
  const followedSource = savedFollowed.length > 0 && evaluatedFollowed.length > 0
    ? "combined" as const
    : evaluatedFollowed.length > 0
      ? "preset_evaluator" as const
      : "saved_disposition" as const;
  return Object.freeze([
    ruleCandidate({
      source,
      polarity: "negative",
      affectedMemberRefs: combinedBroken,
      comparisonMemberRefs: combinedFollowed,
      evidenceSource: brokenSource,
    }),
    ruleCandidate({
      source,
      polarity: "positive",
      affectedMemberRefs: combinedFollowed,
      comparisonMemberRefs: combinedBroken,
      evidenceSource: followedSource,
    }),
  ].filter((candidate): candidate is CoachAiReviewInsightCandidate => candidate !== null));
}

export function buildCoachAiReviewNamedRuleCandidates(
  source: CoachAiReviewRuleCandidateSource,
): readonly CoachAiReviewInsightCandidate[] {
  const candidates = buildCoachAiReviewNamedRuleCandidatesCore(source);
  return Object.freeze(candidates.map((candidate) => withBucketSensitivity(
    candidate,
    candidate.weekSeries.map(({ bucketRef }) => {
      const opportunities = source.opportunities.filter((opportunity) =>
        source.bucketByTargetRef[opportunity.targetRef] !== bucketRef);
      const remainingTargetRefs = new Set(opportunities.map((opportunity) => opportunity.targetRef));
      const moneyObservations = source.moneyObservations.filter((observation) =>
        observation.bucketRef !== bucketRef);
      const reduced = buildCoachAiReviewNamedRuleCandidatesCore({
        ...source,
        opportunities: Object.freeze(opportunities),
        bucketByTargetRef: Object.freeze(Object.fromEntries(opportunities.map((opportunity) => [
          opportunity.targetRef,
          source.bucketByTargetRef[opportunity.targetRef]!,
        ]))),
        moneyObservations: Object.freeze(moneyObservations),
        periodOutcomes: measureCoachAiReviewPeriodOutcomes(moneyObservations),
        representativeEvidence: source.representativeEvidenceByOmittedBucket?.[bucketRef] ??
          (source.representativeEvidence === undefined ? undefined : Object.freeze({
              negative: Object.freeze(source.representativeEvidence.negative.filter((item) =>
                remainingTargetRefs.has(item.memberRef))),
              positive: Object.freeze(source.representativeEvidence.positive.filter((item) =>
                remainingTargetRefs.has(item.memberRef))),
            })),
      }).find((reducedCandidate) => reducedCandidate.polarity === candidate.polarity) ?? null;
      return Object.freeze({ bucketRef, candidate: reduced });
    }),
  )));
}

export type CoachAiReviewBehaviorProcessClass =
  | "preset_core_rule"
  | "named_rule_or_exact_focus"
  | "analyzer_with_rule"
  | "analyzer_only"
  | "chronology_sequence"
  | "fixed_result_cohort";

export type CoachAiReviewBehaviorCandidateSource = Readonly<{
  cadence: CoachAiReviewCadence;
  family: Exclude<CoachAiReviewInsightFamily,
    "period_outcome" | "named_rule_association" | "rule_trend" | "focus_follow_through">;
  lane: "friction" | "strength" | "contrast";
  polarity: "negative" | "positive" | "mixed";
  subjectRef: string;
  observationUnit: CoachAiReviewObservationUnit;
  resultOwnership: CoachAiReviewResultOwnership;
  tradeStylePopulation: CoachAiReviewTradeStylePopulation;
  populationDefinition: string;
  opportunityDefinition: string | null;
  cohortDefinition: string;
  comparisonDefinition: string;
  observations: readonly CoachAiReviewBehaviorObservation[];
  additionalMeasurements?: readonly CoachAiReviewInsightCandidate["measurements"][number][];
  periodMoneyObservations: readonly CoachAiReviewComparableOutcomeObservation[];
  periodOutcomes: ReturnType<typeof measureCoachAiReviewPeriodOutcomes>;
  processClass: CoachAiReviewBehaviorProcessClass;
  resultPolarity: "negative" | "positive";
  expectedPopulationCount: number;
  expectedPopulationCountByBucket?: Readonly<Record<string, number>>;
  coverageBalance: "balanced" | "materially_skewed" | "balance_unavailable";
  structuredSourceConsistency: number | null;
  exploratorySiblingCount: number | null;
  recurringEvidenceAllowed?: boolean;
  allowSpecificExample: boolean;
  allowMaterialOutlier: boolean;
  representativeEvidence: readonly Readonly<{
    memberRef: string;
    role: CoachAiReviewInsightCandidate["representativeEvidenceRoles"][number];
  }>[];
  representativeEvidenceByOmittedBucket?: Readonly<Record<string, readonly Readonly<{
    memberRef: string;
    role: CoachAiReviewInsightCandidate["representativeEvidenceRoles"][number];
  }>[]>>;
  relatedRuleRefs: readonly string[];
  relatedFocusRefs: readonly string[];
  overlapKeys: readonly string[];
  futureTrackability: CoachAiReviewInsightCandidate["futureTrackability"];
}>;

type SegmentGate = Readonly<{
  affectedMinimum: number;
  comparisonMinimum: number;
  spreadMinimum: number;
  contributorMaximum: number;
  multiplicityPenalty: number;
}>;

function segmentGate(siblingCount: number): SegmentGate {
  invariant(Number.isInteger(siblingCount) && siblingCount > 0,
    "TRADERLINK_AI_REVIEW_SEGMENT_SIBLING_COUNT_INVALID");
  if (siblingCount <= 5) {
    return Object.freeze({
      affectedMinimum: 5,
      comparisonMinimum: 5,
      spreadMinimum: 2,
      contributorMaximum: 0.70,
      multiplicityPenalty: 0,
    });
  }
  if (siblingCount <= 10) {
    return Object.freeze({
      affectedMinimum: 6,
      comparisonMinimum: 6,
      spreadMinimum: 2,
      contributorMaximum: 0.65,
      multiplicityPenalty: 5,
    });
  }
  if (siblingCount <= 25) {
    return Object.freeze({
      affectedMinimum: 8,
      comparisonMinimum: 8,
      spreadMinimum: 3,
      contributorMaximum: 0.60,
      multiplicityPenalty: 10,
    });
  }
  return Object.freeze({
    affectedMinimum: 10,
    comparisonMinimum: 10,
    spreadMinimum: 3,
    contributorMaximum: 0.50,
    multiplicityPenalty: 15,
  });
}

function largestAbsoluteContributorShare(
  observations: readonly CoachAiReviewBehaviorObservation[],
): number | null {
  if (observations.length === 0 || observations.some((item) => item.netPnlDecimal === null)) {
    return null;
  }
  const values = observations.map((item) => new ExactDecimal(item.netPnlDecimal!).abs());
  const total = values.reduce((current, value) => current.plus(value), new ExactDecimal(0));
  if (total.isZero()) return null;
  return ExactDecimal.max(...values).dividedBy(total).toNumber();
}

function behaviorMoneyAvailability(
  period: CoachAiReviewBehaviorCandidateSource["periodOutcomes"],
  exactValue: string | null,
): "available" | "partial_display_only" | "unavailable_missing_money" |
    "unavailable_mixed_currency" {
  if (exactValue === null) {
    return period.moneyAvailability === "mixed_currency"
      ? "unavailable_mixed_currency"
      : "unavailable_missing_money";
  }
  return period.moneyCoverageComplete ? "available" : "partial_display_only";
}

function buildCoachAiReviewBehaviorCandidateCore(
  source: CoachAiReviewBehaviorCandidateSource,
): CoachAiReviewInsightCandidate | null {
  invariant(source.polarity !== "mixed" || source.lane === "contrast",
    "TRADERLINK_AI_REVIEW_MIXED_BEHAVIOR_OUTSIDE_CONTRAST");
  invariant(Number.isInteger(source.expectedPopulationCount) &&
    source.expectedPopulationCount >= source.observations.length,
  "TRADERLINK_AI_REVIEW_BEHAVIOR_EXPECTED_COUNT_INVALID");
  const memberRefs = freezeSortedUniqueRefs(
    source.observations.map((item) => item.memberRef),
    "BEHAVIOR_MEMBER_REF",
  );
  const byMember = new Map(source.observations.map((item) => [item.memberRef, item]));
  const affectedRefs = freezeSortedUniqueRefs(source.observations.filter((item) => item.affected)
    .map((item) => item.memberRef), "BEHAVIOR_AFFECTED_REF");
  const comparisonRefs = freezeSortedUniqueRefs(memberRefs.filter((memberRef) =>
    !affectedRefs.includes(memberRef)), "BEHAVIOR_COMPARISON_REF");
  if (affectedRefs.length === 0) return null;
  const bucketByMemberRef = Object.fromEntries(source.observations.map((item) => [
    item.memberRef,
    item.bucketRef,
  ]));
  const affectedSpreadCount = spreadCount(affectedRefs, bucketByMemberRef);
  const eligibleSpreadCount = spreadCount(memberRefs, bucketByMemberRef);
  const cohortMoney = measureCoachAiReviewCohortMoney({
    affectedMemberRefs: affectedRefs,
    observations: source.observations,
    period: source.periodOutcomes,
  });
  const comparisonPolarity = source.resultPolarity;
  const consequence = compareCoachAiReviewConsequences({
    polarity: comparisonPolarity,
    affectedMemberRefs: affectedRefs,
    comparisonMemberRefs: comparisonRefs,
    observations: source.observations,
    periodMoneyObservations: source.periodMoneyObservations,
    period: source.periodOutcomes,
  });
  const poolShare = comparisonPolarity === "negative"
    ? cohortMoney.adverseNetContributionDecimal
    : cohortMoney.beneficialNetContributionDecimal;
  const financial = scoreCoachAiReviewFinancialMateriality({
    poolShareDecimal: poolShare,
    periodMagnitudeShareDecimal: cohortMoney.periodMagnitudeShareDecimal,
    consequenceFactor: consequence.consequenceFactor,
  });
  const materialFinancial = financial.value !== null && financial.value >= 10;
  let classification: "recurring" | "outlier" | "example" = "recurring";
  const generalRecurring = source.recurringEvidenceAllowed !== false && affectedSpreadCount >= 2 &&
    (affectedRefs.length >= 3 || affectedRefs.length >= 2 && materialFinancial);
  if (!generalRecurring) {
    const materialShare = comparisonPolarity === "negative"
      ? cohortMoney.lossShareDecimal
      : cohortMoney.profitShareDecimal;
    if (source.allowMaterialOutlier && affectedRefs.length === 1 && materialShare !== null &&
        new ExactDecimal(materialShare).gte("0.1")) {
      classification = "outlier";
    } else if (source.allowSpecificExample) {
      classification = "example";
    } else {
      return null;
    }
  }
  let multiplicityPenalty = 0;
  const adjustments: string[] = [];
  if (source.exploratorySiblingCount !== null) {
    const gate = segmentGate(source.exploratorySiblingCount);
    const smallGatePath = source.exploratorySiblingCount <= 5 && affectedRefs.length >= 3 &&
      affectedSpreadCount >= 2;
    const countGate = (affectedRefs.length >= gate.affectedMinimum || smallGatePath) &&
      comparisonRefs.length >= gate.comparisonMinimum &&
      affectedSpreadCount >= gate.spreadMinimum;
    if (!countGate) return null;
    const contributorShare = source.periodOutcomes.moneyCoverageComplete
      ? largestAbsoluteContributorShare(affectedRefs.map((memberRef) => byMember.get(memberRef)!))
      : null;
    if (contributorShare === null) return null;
    if (contributorShare > gate.contributorMaximum) {
      if (!source.allowSpecificExample) return null;
      classification = "example";
      adjustments.push("Exploratory cohort depends on one result contributor and is example-only.");
    }
    multiplicityPenalty = gate.multiplicityPenalty;
  }
  if (source.lane === "strength" && source.processClass === "fixed_result_cohort") return null;
  const repetition = scoreCoachAiReviewRepetition({
    affectedCount: affectedRefs.length,
    eligibleCount: memberRefs.length,
    rateDecimal: exactCoachAiReviewRatio(affectedRefs.length, memberRefs.length),
    affectedSpreadCount,
    eligibleSpreadCount,
    classification,
  });
  const processRelevance = scoreCoachAiReviewProcessRelevance({
    structuralClass: source.processClass,
  });
  const confidence = scoreCoachAiReviewEvidenceConfidence({
    requiredFieldCoverage: source.expectedPopulationCount === 0
      ? null
      : 100 * source.observations.length / source.expectedPopulationCount,
    weakestSampleSufficiency: Math.min(100, 50 * affectedRefs.length /
      (classification === "recurring" ? 3 : 1)),
    independentSpread: eligibleSpreadCount === 0
      ? null
      : 100 * affectedSpreadCount / eligibleSpreadCount,
    outlierResistance: consequence.outlierResistance,
    structuredSourceConsistency: source.structuredSourceConsistency,
  });
  const focus = coachAiReviewScoreDimension({
    name: "focus_relevance",
    value: source.relatedFocusRefs.length > 0 ? 100 : 0,
    rawInputs: { exactFocusMatches: source.relatedFocusRefs.length },
    explanation: "Exact hidden focus match only; prose similarity is not used.",
  });
  const specificity = scoreCoachAiReviewSpecificity({
    exactBehaviorSubject: source.processClass !== "fixed_result_cohort",
    fixedResultCohort: source.processClass === "fixed_result_cohort",
    exactDenominator: true,
    hasRepresentativeEvidence: source.representativeEvidence.length > 0,
    exactSequenceOrComparison: true,
    measurableFutureTarget: source.futureTrackability === "trackable",
  });
  const persistence = coachAiReviewScoreDimension({
    name: "persistence_or_adverse_trend",
    value: null,
    explanation: "No compatible later-window trend was supplied to this candidate.",
  });
  const outcomeSupport = coachAiReviewScoreDimension({
    name: "outcome_support",
    value: source.resultPolarity !== "positive" ||
        cohortMoney.beneficialNetContributionDecimal === null
      ? null
      : new ExactDecimal(cohortMoney.beneficialNetContributionDecimal)
        .times(100)
        .times(consequence.consequenceFactor)
        .toNumber(),
    rawInputs: {
      beneficialNetContributionDecimal: cohortMoney.beneficialNetContributionDecimal,
      consequenceFactor: consequence.consequenceFactor,
      resultPolarity: source.resultPolarity,
    },
    explanation: "Scale-eligible beneficial complete-cohort net contribution.",
  });
  const crossPeriod = coachAiReviewScoreDimension({
    name: "cross_period_consistency",
    value: eligibleSpreadCount === 0 ? null : 100 * affectedSpreadCount / eligibleSpreadCount,
    rawInputs: { affectedSpreadCount, eligibleSpreadCount },
    explanation: "Supporting independent buckets divided by eligible independent buckets.",
  });
  const divergence = coachAiReviewScoreDimension({
    name: "result_process_divergence",
    value: financial.value === null || repetition.value === null
      ? null
      : Math.min(financial.value, repetition.value),
    rawInputs: {
      financialMateriality: financial.value,
      processPolarity: repetition.value,
    },
    explanation: "The smaller of exact result and structured-process polarity scores.",
  });
  const dimensions = source.lane === "friction"
    ? [financial, repetition, processRelevance, confidence, persistence, focus, specificity]
    : source.lane === "strength"
      ? [processRelevance, repetition, outcomeSupport, crossPeriod, confidence, focus, specificity]
      : [divergence, financial, repetition, processRelevance, confidence, specificity];
  const score = calculateCoachAiReviewLaneScore({
    lane: source.lane,
    dimensions,
    penaltyPoints: multiplicityPenalty,
  });
  const moneyEligibleAffectedRefs = cohortMoney.moneyEligibleMemberRefs;
  const affectedLosingRefs = moneyEligibleAffectedRefs.filter((memberRef) =>
    new ExactDecimal(byMember.get(memberRef)!.netPnlDecimal!).lt(0));
  const affectedWinningRefs = moneyEligibleAffectedRefs.filter((memberRef) =>
    new ExactDecimal(byMember.get(memberRef)!.netPnlDecimal!).gt(0));
  const polarityPoolRefs = comparisonPolarity === "negative"
    ? affectedLosingRefs
    : affectedWinningRefs;
  const measurements = Object.freeze([
    createCoachAiReviewMeasurement({
      metricName: "affected_rate",
      exactValue: exactCoachAiReviewRatio(affectedRefs.length, memberRefs.length),
      unit: "ratio",
      observationUnit: source.observationUnit,
      numeratorMemberRefs: affectedRefs,
      denominatorMemberRefs: memberRefs,
      expectedCount: source.expectedPopulationCount,
      availability: "available",
      attributionKind: "cohort_association",
      displayLiteral: formatCoachAiReviewRateLiteral(affectedRefs.length, memberRefs.length),
    }),
    createCoachAiReviewMeasurement({
      metricName: "affected_cohort_net_pnl",
      exactValue: cohortMoney.cohortNetPnlDecimal,
      unit: "money",
      currency: cohortMoney.currency,
      observationUnit: source.observationUnit,
      numeratorMemberRefs: moneyEligibleAffectedRefs,
      denominatorMemberRefs: affectedRefs,
      moneyEligibleCount: moneyEligibleAffectedRefs.length,
      expectedCount: affectedRefs.length,
      availability: behaviorMoneyAvailability(source.periodOutcomes, cohortMoney.cohortNetPnlDecimal),
      attributionKind: "cohort_association",
      displayLiteral: cohortMoney.cohortNetPnlDecimal === null || cohortMoney.currency === null
        ? null
        : `${cohortMoney.currency} ${cohortMoney.cohortNetPnlDecimal}`,
    }),
    createCoachAiReviewMeasurement({
      metricName: comparisonPolarity === "negative" ? "loss_share" : "profit_share",
      exactValue: comparisonPolarity === "negative"
        ? cohortMoney.lossShareDecimal
        : cohortMoney.profitShareDecimal,
      unit: "ratio",
      observationUnit: source.observationUnit,
      numeratorMemberRefs: polarityPoolRefs,
      denominatorMemberRefs: source.periodOutcomes.moneyEligibleMemberRefs,
      moneyEligibleCount: moneyEligibleAffectedRefs.length,
      expectedCount: source.periodOutcomes.memberRefs.length,
      availability: cohortMoney.coverageComplete
        ? (comparisonPolarity === "negative"
            ? cohortMoney.lossShareDecimal
            : cohortMoney.profitShareDecimal) === null
          ? "unavailable_missing_population"
          : "available"
        : behaviorMoneyAvailability(source.periodOutcomes, null),
      attributionKind: "cohort_association",
      displayLiteral: comparisonPolarity === "negative"
        ? cohortMoney.lossShareDecimal
        : cohortMoney.profitShareDecimal,
    }),
    createCoachAiReviewMeasurement({
      metricName: comparisonPolarity === "negative"
        ? "adverse_net_contribution"
        : "beneficial_net_contribution",
      exactValue: poolShare,
      unit: "ratio",
      observationUnit: source.observationUnit,
      numeratorMemberRefs: moneyEligibleAffectedRefs,
      denominatorMemberRefs: source.periodOutcomes.moneyEligibleMemberRefs,
      moneyEligibleCount: moneyEligibleAffectedRefs.length,
      expectedCount: source.periodOutcomes.memberRefs.length,
      availability: poolShare === null
        ? behaviorMoneyAvailability(source.periodOutcomes, null)
        : "available",
      attributionKind: "cohort_association",
      displayLiteral: poolShare,
    }),
    ...(source.additionalMeasurements ?? []),
  ]);
  invariant(source.representativeEvidence.length <= 3,
    "TRADERLINK_AI_REVIEW_REPRESENTATIVE_LIMIT");
  invariant(new Set(source.representativeEvidence.map((item) => item.memberRef)).size ===
      source.representativeEvidence.length,
  "TRADERLINK_AI_REVIEW_REPRESENTATIVE_DUPLICATE");
  invariant(source.representativeEvidence.every((item) => memberRefs.includes(item.memberRef)),
    "TRADERLINK_AI_REVIEW_REPRESENTATIVE_OUTSIDE_POPULATION");
  const weekSeries = Object.freeze([...new Set([
    ...source.observations.map((item) => item.bucketRef),
    ...source.periodMoneyObservations.map((item) => item.bucketRef),
  ])]
    .sort().map((bucketRef) => {
      const bucket = source.observations.filter((item) => item.bucketRef === bucketRef);
      return Object.freeze({
        bucketRef,
        numerator: bucket.filter((item) => item.affected).length,
        denominator: bucket.length,
      });
    }));
  const candidate: CoachAiReviewInsightCandidate = Object.freeze({
    findingRef: findingRef([
      source.family,
      source.lane,
      source.polarity,
      source.subjectRef,
      affectedRefs,
      comparisonRefs,
    ]),
    engineVersion: COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION,
    family: source.family,
    classification: classification === "outlier"
      ? "material_outlier"
      : classification === "example"
        ? "specific_example"
        : source.lane === "contrast"
          ? "contrast"
          : "recurring",
    polarity: source.polarity,
    subjectRef: source.subjectRef,
    observationUnit: source.observationUnit,
    resultOwnership: source.resultOwnership,
    populationDefinition: source.populationDefinition,
    populationMemberRefs: memberRefs,
    opportunityDefinition: source.opportunityDefinition,
    opportunityMemberRefs: memberRefs,
    affectedMemberRefs: affectedRefs,
    tradeStylePopulation: source.tradeStylePopulation,
    laneEligibility: Object.freeze([source.lane] as CoachAiReviewInsightLane[]),
    cohortDefinition: source.cohortDefinition,
    comparisonDefinition: source.comparisonDefinition,
    measurements,
    weekSeries,
    representativeEvidenceRefs: Object.freeze(source.representativeEvidence.map((item) =>
      item.memberRef)),
    representativeEvidenceRoles: Object.freeze(source.representativeEvidence.map((item) =>
      item.role)),
    representativeMetricName: "trade_net_pnl",
    relatedRuleRefs: freezeSortedUniqueRefs(source.relatedRuleRefs, "BEHAVIOR_RULE_REF"),
    relatedFocusRefs: freezeSortedUniqueRefs(source.relatedFocusRefs, "BEHAVIOR_FOCUS_REF"),
    overlapKeys: freezeSortedUniqueRefs(source.overlapKeys, "BEHAVIOR_OVERLAP_KEY"),
    coverage: Object.freeze({
      observedCount: source.observations.length,
      expectedCount: source.expectedPopulationCount,
      balanced: source.coverageBalance,
    }),
    consequenceVerdict: consequence.verdict,
    futureTrackability: source.futureTrackability,
    scores: Object.freeze([score]),
    adjustments: Object.freeze([
      ...adjustments,
      `classification=${classification}`,
      ...(consequence.confidenceAdjustment === "magnitude_shift_over_50_percent"
        ? ["Structural standardization changed consequence magnitude by more than 50 percent."]
        : []),
    ]),
    penalties: Object.freeze(multiplicityPenalty === 0
      ? []
      : [`exploratory_multiplicity=${multiplicityPenalty}`]),
    bucketSensitivity: Object.freeze([]),
    sensitivityResults: Object.freeze([
      `outlier_resistance=${consequence.outlierResistance ?? "unavailable"}`,
      `composition_shift=${consequence.materialCompositionShift}`,
    ]),
    rankExplanation: Object.freeze([
      `${source.lane}=${score.postPenaltyScore}`,
      `consequence=${consequence.verdict}`,
      `affected=${affectedRefs.length}/${memberRefs.length}`,
    ]),
  });
  validateCoachAiReviewCandidateMembership(candidate);
  return candidate;
}

export function buildCoachAiReviewBehaviorCandidate(
  source: CoachAiReviewBehaviorCandidateSource,
): CoachAiReviewInsightCandidate | null {
  const candidate = buildCoachAiReviewBehaviorCandidateCore(source);
  if (candidate === null) return null;
  const bucketRefs = candidate.weekSeries.map((bucket) => bucket.bucketRef);
  return withBucketSensitivity(candidate, bucketRefs.map((bucketRef) => {
    const observations = source.observations.filter((observation) =>
      observation.bucketRef !== bucketRef);
    const removedObservationCount = source.observations.length - observations.length;
    const periodMoneyObservations = source.periodMoneyObservations.filter((observation) =>
      observation.bucketRef !== bucketRef);
    const populationRefSet = new Set(observations.map((observation) => observation.memberRef));
    return Object.freeze({
      bucketRef,
      candidate: buildCoachAiReviewBehaviorCandidateCore({
        ...source,
        observations: Object.freeze(observations),
        additionalMeasurements: Object.freeze([]),
        periodMoneyObservations: Object.freeze(periodMoneyObservations),
        periodOutcomes: measureCoachAiReviewPeriodOutcomes(periodMoneyObservations),
        expectedPopulationCount: Math.max(
          observations.length,
          source.expectedPopulationCount -
            (source.expectedPopulationCountByBucket?.[bucketRef] ?? removedObservationCount),
        ),
        representativeEvidence: source.representativeEvidenceByOmittedBucket?.[bucketRef] ??
          Object.freeze(source.representativeEvidence.filter((item) =>
            populationRefSet.has(item.memberRef))),
      }),
    });
  }));
}

export type CoachAiReviewRateTrendBucket = Readonly<{
  bucketRef: string;
  memberRefs: readonly string[];
  affectedMemberRefs: readonly string[];
  marketDateRefs: readonly string[];
  expectedCount: number;
  stratumKeyByMemberRef: Readonly<Record<string, string>>;
}>;

export type CoachAiReviewRateTrendCandidateSource = Readonly<{
  cadence: CoachAiReviewCadence;
  family: CoachAiReviewInsightFamily;
  subjectRef: string;
  trendKind: "improvement" | "deterioration";
  improvementDirection: "lower_is_better" | "higher_is_better";
  observationUnit: CoachAiReviewObservationUnit;
  resultOwnership: CoachAiReviewResultOwnership;
  tradeStylePopulation: CoachAiReviewTradeStylePopulation;
  processClass: CoachAiReviewBehaviorProcessClass;
  populationDefinition: string;
  opportunityDefinition: string;
  cohortDefinition: string;
  buckets: readonly CoachAiReviewRateTrendBucket[];
  relatedRuleRefs: readonly string[];
  relatedFocusRefs: readonly string[];
  overlapKeys: readonly string[];
  representativeEvidence?: readonly Readonly<{
    memberRef: string;
    role: CoachAiReviewInsightCandidate["representativeEvidenceRoles"][number];
  }>[];
  representativeEvidenceByOmittedBucket?: Readonly<Record<string, readonly Readonly<{
    memberRef: string;
    role: CoachAiReviewInsightCandidate["representativeEvidenceRoles"][number];
  }>[]>>;
  representativeMetricName: "trade_net_pnl" | "market_date_chronology";
}>;

type RateTrendSide = Readonly<{
  memberRefs: readonly string[];
  affectedMemberRefs: readonly string[];
  expectedCount: number;
  marketDateRefs: readonly string[];
  stratumKeyByMemberRef: Readonly<Record<string, string>>;
}>;

function rateTrendSide(
  buckets: readonly CoachAiReviewRateTrendBucket[],
  field: string,
): RateTrendSide {
  const memberRefs = freezeSortedUniqueRefs(buckets.flatMap((bucket) => bucket.memberRefs),
    `${field}_MEMBER_REF`);
  const affectedMemberRefs = freezeSortedUniqueRefs(
    buckets.flatMap((bucket) => bucket.affectedMemberRefs),
    `${field}_AFFECTED_REF`,
  );
  const memberSet = new Set(memberRefs);
  invariant(affectedMemberRefs.every((memberRef) => memberSet.has(memberRef)),
    `TRADERLINK_AI_REVIEW_${field}_AFFECTED_OUTSIDE_MEMBERS`);
  const expectedCount = buckets.reduce((total, bucket) => total + bucket.expectedCount, 0);
  invariant(expectedCount >= memberRefs.length, `TRADERLINK_AI_REVIEW_${field}_EXPECTED_INVALID`);
  return Object.freeze({
    memberRefs,
    affectedMemberRefs,
    expectedCount,
    marketDateRefs: freezeSortedUniqueRefs(buckets.flatMap((bucket) => bucket.marketDateRefs),
      `${field}_MARKET_DATE_REF`),
    stratumKeyByMemberRef: Object.freeze(Object.fromEntries(buckets.flatMap((bucket) =>
      bucket.memberRefs.map((memberRef) => {
        const stratum = bucket.stratumKeyByMemberRef[memberRef];
        invariant(typeof stratum === "string" && stratum.length > 0,
          `TRADERLINK_AI_REVIEW_${field}_STRATUM_MISSING`);
        return [memberRef, stratum] as const;
      })))),
  });
}

function standardizedRateTrend(input: Readonly<{
  early: RateTrendSide;
  later: RateTrendSide;
}>): Readonly<{
  applied: boolean;
  earlyRateDecimal: string;
  laterRateDecimal: string;
  magnitudeShiftOverHalf: boolean;
}> | null {
  const earlyRaw = new ExactDecimal(input.early.affectedMemberRefs.length)
    .dividedBy(input.early.memberRefs.length);
  const laterRaw = new ExactDecimal(input.later.affectedMemberRefs.length)
    .dividedBy(input.later.memberRefs.length);
  const strata = new Set([
    ...Object.values(input.early.stratumKeyByMemberRef),
    ...Object.values(input.later.stratumKeyByMemberRef),
  ]);
  const pooledCount = input.early.memberRefs.length + input.later.memberRefs.length;
  const materialShift = [...strata].some((stratum) => {
    const earlyCount = input.early.memberRefs.filter((memberRef) =>
      input.early.stratumKeyByMemberRef[memberRef] === stratum).length;
    const laterCount = input.later.memberRefs.filter((memberRef) =>
      input.later.stratumKeyByMemberRef[memberRef] === stratum).length;
    const pooledShare = new ExactDecimal(earlyCount + laterCount).dividedBy(pooledCount);
    const shareShift = new ExactDecimal(earlyCount).dividedBy(input.early.memberRefs.length)
      .minus(new ExactDecimal(laterCount).dividedBy(input.later.memberRefs.length)).abs();
    return pooledShare.gte("0.2") && shareShift.gte("0.15");
  });
  if (!materialShift) {
    return Object.freeze({
      applied: false,
      earlyRateDecimal: canonicalDecimal(earlyRaw),
      laterRateDecimal: canonicalDecimal(laterRaw),
      magnitudeShiftOverHalf: false,
    });
  }
  const common = [...strata].filter((stratum) =>
    input.early.memberRefs.some((memberRef) =>
      input.early.stratumKeyByMemberRef[memberRef] === stratum) &&
    input.later.memberRefs.some((memberRef) =>
      input.later.stratumKeyByMemberRef[memberRef] === stratum));
  const earlyCommonCount = input.early.memberRefs.filter((memberRef) =>
    common.includes(input.early.stratumKeyByMemberRef[memberRef]!)).length;
  const laterCommonCount = input.later.memberRefs.filter((memberRef) =>
    common.includes(input.later.stratumKeyByMemberRef[memberRef]!)).length;
  if (earlyCommonCount < 5 || laterCommonCount < 5) return null;
  const commonPooledCount = earlyCommonCount + laterCommonCount;
  let earlyStandardized = new ExactDecimal(0);
  let laterStandardized = new ExactDecimal(0);
  for (const stratum of common) {
    const earlyMembers = input.early.memberRefs.filter((memberRef) =>
      input.early.stratumKeyByMemberRef[memberRef] === stratum);
    const laterMembers = input.later.memberRefs.filter((memberRef) =>
      input.later.stratumKeyByMemberRef[memberRef] === stratum);
    const pooledWeight = new ExactDecimal(earlyMembers.length + laterMembers.length)
      .dividedBy(commonPooledCount);
    const earlyRate = new ExactDecimal(earlyMembers.filter((memberRef) =>
      input.early.affectedMemberRefs.includes(memberRef)).length).dividedBy(earlyMembers.length);
    const laterRate = new ExactDecimal(laterMembers.filter((memberRef) =>
      input.later.affectedMemberRefs.includes(memberRef)).length).dividedBy(laterMembers.length);
    earlyStandardized = earlyStandardized.plus(pooledWeight.times(earlyRate));
    laterStandardized = laterStandardized.plus(pooledWeight.times(laterRate));
  }
  const rawMagnitude = laterRaw.minus(earlyRaw).abs();
  const standardizedMagnitude = laterStandardized.minus(earlyStandardized).abs();
  return Object.freeze({
    applied: true,
    earlyRateDecimal: canonicalDecimal(earlyStandardized),
    laterRateDecimal: canonicalDecimal(laterStandardized),
    magnitudeShiftOverHalf: !rawMagnitude.isZero() &&
      standardizedMagnitude.minus(rawMagnitude).abs().dividedBy(rawMagnitude).gt("0.5"),
  });
}

function buildCoachAiReviewRateTrendCandidateCore(
  source: CoachAiReviewRateTrendCandidateSource,
): CoachAiReviewInsightCandidate | null {
  const minimumBuckets = source.cadence === "monthly" ? 3 : 2;
  if (source.buckets.length < minimumBuckets) return null;
  const bucketRefs = freezeSortedUniqueRefs(source.buckets.map((bucket) => bucket.bucketRef),
    "TREND_BUCKET_REF");
  invariant(bucketRefs.every((bucketRef, index) => source.buckets[index]!.bucketRef === bucketRef),
    "TRADERLINK_AI_REVIEW_TREND_BUCKET_ORDER_INVALID");
  for (const bucket of source.buckets) {
    const members = freezeSortedUniqueRefs(bucket.memberRefs, "TREND_BUCKET_MEMBER_REF");
    const affected = freezeSortedUniqueRefs(bucket.affectedMemberRefs, "TREND_BUCKET_AFFECTED_REF");
    invariant(affected.every((memberRef) => members.includes(memberRef)),
      "TRADERLINK_AI_REVIEW_TREND_BUCKET_AFFECTED_OUTSIDE_MEMBERS");
    invariant(bucket.expectedCount >= members.length,
      "TRADERLINK_AI_REVIEW_TREND_BUCKET_EXPECTED_INVALID");
  }
  const allMembers = source.buckets.flatMap((bucket) => bucket.memberRefs);
  invariant(new Set(allMembers).size === allMembers.length,
    "TRADERLINK_AI_REVIEW_TREND_MEMBER_REUSED_ACROSS_BUCKETS");
  const sideBucketCount = source.cadence === "monthly" && source.buckets.length >= 4 ? 2 : 1;
  const earlyBuckets = source.buckets.slice(0, sideBucketCount);
  const laterBuckets = source.buckets.slice(-sideBucketCount);
  const early = rateTrendSide(earlyBuckets, "TREND_EARLY");
  const later = rateTrendSide(laterBuckets, "TREND_LATER");
  if (early.memberRefs.length < 5 || later.memberRefs.length < 5) return null;
  const earlyCoverage = early.memberRefs.length / early.expectedCount;
  const laterCoverage = later.memberRefs.length / later.expectedCount;
  if (Math.abs(laterCoverage - earlyCoverage) > 0.15) return null;
  const standardized = standardizedRateTrend({ early, later });
  if (standardized === null) return null;
  const rawEarlyRate = new ExactDecimal(early.affectedMemberRefs.length)
    .dividedBy(early.memberRefs.length);
  const rawLaterRate = new ExactDecimal(later.affectedMemberRefs.length)
    .dividedBy(later.memberRefs.length);
  const standardizedEarlyRate = new ExactDecimal(standardized.earlyRateDecimal);
  const standardizedLaterRate = new ExactDecimal(standardized.laterRateDecimal);
  const improvementAligned = source.improvementDirection === "lower_is_better"
    ? standardizedEarlyRate.minus(standardizedLaterRate)
    : standardizedLaterRate.minus(standardizedEarlyRate);
  const desiredChange = source.trendKind === "improvement"
    ? improvementAligned
    : improvementAligned.negated();
  const affectedDifference = source.improvementDirection === "lower_is_better"
    ? early.affectedMemberRefs.length - later.affectedMemberRefs.length
    : later.affectedMemberRefs.length - early.affectedMemberRefs.length;
  const desiredCountDifference = source.trendKind === "improvement"
    ? affectedDifference
    : -affectedDifference;
  const meaningful = desiredCountDifference >= 2 && desiredChange.gte("0.10") ||
    desiredCountDifference >= 5 && desiredChange.gte("0.05") && source.buckets.length >= 3;
  if (!meaningful) return null;
  const alignedDirection = source.trendKind === "improvement"
    ? source.improvementDirection
    : source.improvementDirection === "lower_is_better"
      ? "higher_is_better" as const
      : "lower_is_better" as const;
  const trendMagnitude = scoreCoachAiReviewTrendMagnitude({
    earlierRateDecimal: standardized.earlyRateDecimal,
    laterRateDecimal: standardized.laterRateDecimal,
    direction: alignedDirection,
  });
  const baselineRecurrence = scoreCoachAiReviewRepetition({
    affectedCount: early.affectedMemberRefs.length,
    eligibleCount: early.memberRefs.length,
    rateDecimal: exactCoachAiReviewRatio(early.affectedMemberRefs.length, early.memberRefs.length),
    affectedSpreadCount: earlyBuckets.length,
    eligibleSpreadCount: earlyBuckets.length,
  });
  const focus = coachAiReviewScoreDimension({
    name: "focus_relevance",
    value: source.relatedFocusRefs.length > 0 ? 100 : 0,
    rawInputs: { exactFocusMatches: source.relatedFocusRefs.length },
    explanation: "Exact hidden focus match only.",
  });
  const confidence = scoreCoachAiReviewEvidenceConfidence({
    requiredFieldCoverage: 100 * Math.min(earlyCoverage, laterCoverage),
    weakestSampleSufficiency: Math.min(100, 50 * Math.min(
      early.memberRefs.length,
      later.memberRefs.length,
    ) / 5),
    independentSpread: Math.min(100, 100 * source.buckets.length / minimumBuckets),
    outlierResistance: null,
    structuredSourceConsistency: standardized.magnitudeShiftOverHalf ? 50 : 100,
  });
  const financialImprovement = coachAiReviewScoreDimension({
    name: "financial_improvement",
    value: null,
    explanation: "This rate-trend candidate does not substitute P/L for its primary rate metric.",
  });
  const representativeEvidence = source.representativeEvidence ?? [];
  const specificity = scoreCoachAiReviewSpecificity({
    exactBehaviorSubject: true,
    fixedResultCohort: false,
    exactDenominator: true,
    hasRepresentativeEvidence: representativeEvidence.length > 0,
    exactSequenceOrComparison: true,
    measurableFutureTarget: true,
  });
  const processRelevance = scoreCoachAiReviewProcessRelevance({
    structuralClass: source.processClass,
  });
  const persistence = coachAiReviewScoreDimension({
    name: "persistence_or_adverse_trend",
    value: trendMagnitude.unclampedValue,
    rawInputs: trendMagnitude.rawInputs,
    explanation: "Direction-aligned deterioration magnitude.",
  });
  const lane: CoachAiReviewInsightLane = source.trendKind === "improvement"
    ? "improvement"
    : "friction";
  const score = calculateCoachAiReviewLaneScore({
    lane,
    dimensions: source.trendKind === "improvement"
      ? [trendMagnitude, financialImprovement, coachAiReviewScoreDimension({
          name: "baseline_recurrence",
          value: baselineRecurrence.value,
          rawInputs: baselineRecurrence.rawInputs,
          explanation: "Repetition on the frozen early-side baseline.",
        }), focus, confidence, specificity]
      : [coachAiReviewScoreDimension({
          name: "financial_materiality",
          value: null,
          explanation: "No compatible money trend was supplied.",
        }), baselineRecurrence, processRelevance, confidence, persistence, focus, specificity],
  });
  let latestState = source.trendKind === "improvement" ? "improved" : "worsened";
  if (source.trendKind === "improvement" && source.buckets.length >= 2) {
    const previousBucket = source.buckets.at(-2)!;
    const latestBucket = source.buckets.at(-1)!;
    if (previousBucket.memberRefs.length >= 5 && latestBucket.memberRefs.length >= 5 &&
        latestBucket.marketDateRefs.length >= 2) {
      const previousRate = new ExactDecimal(previousBucket.affectedMemberRefs.length)
        .dividedBy(previousBucket.memberRefs.length);
      const latestRate = new ExactDecimal(latestBucket.affectedMemberRefs.length)
        .dividedBy(latestBucket.memberRefs.length);
      const adverseMove = source.improvementDirection === "lower_is_better"
        ? latestRate.minus(previousRate)
        : previousRate.minus(latestRate);
      if (adverseMove.gte("0.10") && adverseMove.gte(improvementAligned.dividedBy(2))) {
        latestState = "improved_then_recently_regressed";
      }
    }
  }
  const populationMemberRefs = freezeSortedUniqueRefs(allMembers, "TREND_POPULATION_REF");
  const affectedMemberRefs = freezeSortedUniqueRefs(source.buckets.flatMap((bucket) =>
    bucket.affectedMemberRefs), "TREND_AFFECTED_REF");
  invariant(representativeEvidence.length <= 2,
    "TRADERLINK_AI_REVIEW_TREND_REPRESENTATIVE_LIMIT");
  invariant(new Set(representativeEvidence.map((item) => item.memberRef)).size ===
      representativeEvidence.length,
  "TRADERLINK_AI_REVIEW_TREND_REPRESENTATIVE_DUPLICATE");
  invariant(representativeEvidence.every((item) => populationMemberRefs.includes(item.memberRef)),
    "TRADERLINK_AI_REVIEW_TREND_REPRESENTATIVE_OUTSIDE_POPULATION");
  const measurements = Object.freeze([
    createCoachAiReviewMeasurement({
      metricName: "early_affected_rate",
      exactValue: exactCoachAiReviewRatio(early.affectedMemberRefs.length, early.memberRefs.length),
      unit: "ratio",
      observationUnit: source.observationUnit,
      numeratorMemberRefs: early.affectedMemberRefs,
      denominatorMemberRefs: early.memberRefs,
      expectedCount: early.expectedCount,
      availability: "available",
      attributionKind: "cohort_association",
      displayLiteral: formatCoachAiReviewRateLiteral(
        early.affectedMemberRefs.length,
        early.memberRefs.length,
      ),
    }),
    createCoachAiReviewMeasurement({
      metricName: "later_affected_rate",
      exactValue: exactCoachAiReviewRatio(later.affectedMemberRefs.length, later.memberRefs.length),
      unit: "ratio",
      observationUnit: source.observationUnit,
      numeratorMemberRefs: later.affectedMemberRefs,
      denominatorMemberRefs: later.memberRefs,
      expectedCount: later.expectedCount,
      availability: "available",
      attributionKind: "cohort_association",
      displayLiteral: formatCoachAiReviewRateLiteral(
        later.affectedMemberRefs.length,
        later.memberRefs.length,
      ),
    }),
    createCoachAiReviewMeasurement({
      metricName: "standardized_direction_aligned_rate_change",
      exactValue: canonicalDecimal(desiredChange),
      unit: "ratio",
      observationUnit: source.observationUnit,
      numeratorMemberRefs: affectedMemberRefs,
      denominatorMemberRefs: populationMemberRefs,
      expectedCount: source.buckets.reduce((total, bucket) => total + bucket.expectedCount, 0),
      availability: "available",
      attributionKind: "cohort_association",
      displayLiteral: canonicalDecimal(desiredChange),
    }),
  ]);
  const candidate: CoachAiReviewInsightCandidate = Object.freeze({
    findingRef: findingRef([
      "rate_trend",
      source.family,
      source.subjectRef,
      source.trendKind,
      source.improvementDirection,
      source.buckets.map((bucket) => [
        bucket.bucketRef,
        bucket.affectedMemberRefs.length,
        bucket.memberRefs.length,
      ]),
    ]),
    engineVersion: COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION,
    family: source.family,
    classification: "trend",
    polarity: source.trendKind === "improvement" ? "positive" : "negative",
    subjectRef: source.subjectRef,
    observationUnit: source.observationUnit,
    resultOwnership: source.resultOwnership,
    populationDefinition: source.populationDefinition,
    populationMemberRefs,
    opportunityDefinition: source.opportunityDefinition,
    opportunityMemberRefs: populationMemberRefs,
    affectedMemberRefs,
    tradeStylePopulation: source.tradeStylePopulation,
    laneEligibility: Object.freeze([lane]),
    cohortDefinition: source.cohortDefinition,
    comparisonDefinition: "Frozen early activity-weighted rate versus later activity-weighted rate.",
    measurements,
    weekSeries: Object.freeze(source.buckets.map((bucket) => Object.freeze({
      bucketRef: bucket.bucketRef,
      numerator: bucket.affectedMemberRefs.length,
      denominator: bucket.memberRefs.length,
    }))),
    representativeEvidenceRefs: Object.freeze(representativeEvidence.map((item) => item.memberRef)),
    representativeEvidenceRoles: Object.freeze(representativeEvidence.map((item) => item.role)),
    representativeMetricName: source.representativeMetricName,
    relatedRuleRefs: freezeSortedUniqueRefs(source.relatedRuleRefs, "TREND_RULE_REF"),
    relatedFocusRefs: freezeSortedUniqueRefs(source.relatedFocusRefs, "TREND_FOCUS_REF"),
    overlapKeys: freezeSortedUniqueRefs(source.overlapKeys, "TREND_OVERLAP_KEY"),
    coverage: Object.freeze({
      observedCount: populationMemberRefs.length,
      expectedCount: source.buckets.reduce((total, bucket) => total + bucket.expectedCount, 0),
      balanced: Math.abs(earlyCoverage - laterCoverage) <= 0.15 ? "balanced" : "materially_skewed",
    }),
    consequenceVerdict: "comparison_unavailable",
    futureTrackability: "trackable",
    scores: Object.freeze([score]),
    adjustments: Object.freeze([
      `latest_state=${latestState}`,
      `structural_standardization=${standardized.applied}`,
      ...(standardized.magnitudeShiftOverHalf
        ? ["Structural standardization changed trend magnitude by more than 50 percent."]
        : []),
    ]),
    penalties: Object.freeze([]),
    bucketSensitivity: Object.freeze([]),
    sensitivityResults: Object.freeze([
      `raw_early_rate=${canonicalDecimal(rawEarlyRate)}`,
      `raw_later_rate=${canonicalDecimal(rawLaterRate)}`,
      `standardized_early_rate=${standardized.earlyRateDecimal}`,
      `standardized_later_rate=${standardized.laterRateDecimal}`,
    ]),
    rankExplanation: Object.freeze([
      `${lane}=${score.postPenaltyScore}`,
      `trend=${source.trendKind}`,
      `change=${canonicalDecimal(desiredChange)}`,
      `latest_state=${latestState}`,
    ]),
  });
  validateCoachAiReviewCandidateMembership(candidate);
  return candidate;
}

export function buildCoachAiReviewRateTrendCandidate(
  source: CoachAiReviewRateTrendCandidateSource,
): CoachAiReviewInsightCandidate | null {
  const candidate = buildCoachAiReviewRateTrendCandidateCore(source);
  if (candidate === null) return null;
  return withBucketSensitivity(candidate, source.buckets.map((removedBucket) => {
    const buckets = source.buckets.filter((bucket) => bucket.bucketRef !== removedBucket.bucketRef);
    const remainingMemberRefs = new Set(buckets.flatMap((bucket) => bucket.memberRefs));
    return Object.freeze({
      bucketRef: removedBucket.bucketRef,
      candidate: buildCoachAiReviewRateTrendCandidateCore({
        ...source,
        buckets: Object.freeze(buckets),
        representativeEvidence: source.representativeEvidenceByOmittedBucket?.[
          removedBucket.bucketRef
        ] ?? Object.freeze((source.representativeEvidence ?? []).filter((item) =>
          remainingMemberRefs.has(item.memberRef))),
      }),
    });
  }));
}
