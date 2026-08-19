import Decimal from "decimal.js";

import type {
  CoachAiReviewInsightLane,
  CoachAiReviewLaneRankStability,
  CoachAiReviewLaneScore,
  CoachAiReviewScoreDimension,
  CoachAiReviewScoreDimensionName,
} from "@/src/modules/coach/contracts/coach-ai-review-insight-contracts";
import {
  CoachAiReviewInsightInvariantError,
  compareCoachAiReviewText,
} from "./coach-ai-review-insight-normalizer";

const ExactDecimal = Decimal.clone({
  precision: 160,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});

const LANE_WEIGHTS: Readonly<Record<
  CoachAiReviewInsightLane,
  Readonly<Partial<Record<CoachAiReviewScoreDimensionName, number>>>
>> = Object.freeze({
  friction: Object.freeze({
    financial_materiality: 30,
    repetition: 25,
    process_relevance: 15,
    evidence_confidence: 15,
    persistence_or_adverse_trend: 10,
    focus_relevance: 5,
  }),
  improvement: Object.freeze({
    trend_magnitude: 35,
    financial_improvement: 20,
    baseline_recurrence: 15,
    focus_relevance: 15,
    evidence_confidence: 10,
    specificity: 5,
  }),
  strength: Object.freeze({
    process_relevance: 25,
    repetition: 25,
    outcome_support: 20,
    cross_period_consistency: 15,
    evidence_confidence: 10,
    focus_relevance: 5,
  }),
  contrast: Object.freeze({
    result_process_divergence: 30,
    financial_materiality: 20,
    repetition: 20,
    process_relevance: 15,
    evidence_confidence: 10,
    specificity: 5,
  }),
  focus_follow_through: Object.freeze({
    exact_focus_measurability: 35,
    later_evidence_span: 25,
    trend_magnitude: 20,
    financial_materiality: 10,
    evidence_confidence: 10,
  }),
});

function invariant(condition: boolean, code: string): asserts condition {
  if (!condition) throw new CoachAiReviewInsightInvariantError(code);
}

function clamp(value: number, minimum = 0, maximum = 100): number {
  invariant(Number.isFinite(value), "TRADERLINK_AI_REVIEW_SCORE_NOT_FINITE");
  return Math.min(maximum, Math.max(minimum, value));
}

function roundedScore(value: number): number {
  return Math.round(clamp(value));
}

function decimal(value: string | number): Decimal {
  const parsed = new ExactDecimal(value);
  invariant(parsed.isFinite(), "TRADERLINK_AI_REVIEW_SCORE_DECIMAL_INVALID");
  return parsed;
}

export function coachAiReviewScoreDimension(input: Readonly<{
  name: CoachAiReviewScoreDimensionName;
  value: number | null;
  rawInputs?: Readonly<Record<string, string | number | boolean | null>>;
  explanation: string;
}>): CoachAiReviewScoreDimension {
  return Object.freeze({
    name: input.name,
    value: input.value === null ? null : roundedScore(input.value),
    unclampedValue: input.value,
    available: input.value !== null,
    rawInputs: Object.freeze({ ...(input.rawInputs ?? {}) }),
    explanation: input.explanation,
  });
}

export function scoreCoachAiReviewFinancialMateriality(input: Readonly<{
  poolShareDecimal: string | null;
  periodMagnitudeShareDecimal: string | null;
  consequenceFactor: 0 | 0.5 | 1;
}>): CoachAiReviewScoreDimension {
  if (input.poolShareDecimal === null || input.periodMagnitudeShareDecimal === null) {
    return coachAiReviewScoreDimension({
      name: "financial_materiality",
      value: null,
      rawInputs: {
        poolShareDecimal: input.poolShareDecimal,
        periodMagnitudeShareDecimal: input.periodMagnitudeShareDecimal,
        consequenceFactor: input.consequenceFactor,
      },
      explanation: "Comparable complete money was unavailable.",
    });
  }
  const pool = ExactDecimal.min(1, ExactDecimal.max(0, decimal(input.poolShareDecimal)));
  const magnitude = ExactDecimal.min(
    1,
    ExactDecimal.max(0, decimal(input.periodMagnitudeShareDecimal)),
  );
  const harmonic = pool.isZero() && magnitude.isZero()
    ? new ExactDecimal(0)
    : pool.times(magnitude).times(2).dividedBy(pool.plus(magnitude));
  const value = harmonic.times(100).times(input.consequenceFactor).toNumber();
  return coachAiReviewScoreDimension({
    name: "financial_materiality",
    value,
    rawInputs: {
      poolShareDecimal: input.poolShareDecimal,
      periodMagnitudeShareDecimal: input.periodMagnitudeShareDecimal,
      consequenceFactor: input.consequenceFactor,
      scaleGuardedShareDecimal: harmonic.toFixed(),
    },
    explanation: "Harmonic mean of polarity-pool and period-magnitude shares.",
  });
}

export function scoreCoachAiReviewRepetition(input: Readonly<{
  affectedCount: number;
  eligibleCount: number;
  rateDecimal: string | null;
  affectedSpreadCount: number;
  eligibleSpreadCount: number;
  classification?: "recurring" | "outlier" | "example";
}>): CoachAiReviewScoreDimension {
  invariant(
    Number.isInteger(input.affectedCount) && input.affectedCount >= 0 &&
      Number.isInteger(input.eligibleCount) && input.eligibleCount >= input.affectedCount,
    "TRADERLINK_AI_REVIEW_REPETITION_COUNT_INVALID",
  );
  const rawInput = Object.freeze({
    affectedCount: input.affectedCount,
    eligibleCount: input.eligibleCount,
    rateDecimal: input.rateDecimal,
    affectedSpreadCount: input.affectedSpreadCount,
    eligibleSpreadCount: input.eligibleSpreadCount,
    classification: input.classification ?? null,
  });
  if (input.classification === "outlier" || input.classification === "example") {
    return coachAiReviewScoreDimension({
      name: "repetition",
      value: 0,
      rawInputs: rawInput,
      explanation: "Explicit examples and outliers do not receive recurrence credit.",
    });
  }
  if (input.eligibleCount === 0 || input.rateDecimal === null || input.eligibleSpreadCount === 0) {
    return coachAiReviewScoreDimension({
      name: "repetition",
      value: null,
      rawInputs: rawInput,
      explanation: "The opportunity population or independent spread was unavailable.",
    });
  }
  const adaptiveTarget = Math.max(3, Math.min(20, Math.ceil(input.eligibleCount * 0.10)));
  const rateScore = clamp(decimal(input.rateDecimal).times(100).toNumber());
  const countScore = clamp((input.affectedCount / adaptiveTarget) * 100);
  const spreadScore = clamp((input.affectedSpreadCount / input.eligibleSpreadCount) * 100);
  return coachAiReviewScoreDimension({
    name: "repetition",
    value: rateScore * 0.45 + countScore * 0.35 + spreadScore * 0.20,
    rawInputs: {
      ...rawInput,
      adaptiveTarget,
      rateScore,
      countScore,
      spreadScore,
    },
    explanation: "Opportunity rate, adaptive count saturation, and independent spread.",
  });
}

export function scoreCoachAiReviewTrendMagnitude(input: Readonly<{
  earlierRateDecimal: string | null;
  laterRateDecimal: string | null;
  direction: "lower_is_better" | "higher_is_better" | "context_only";
}>): CoachAiReviewScoreDimension {
  if (input.direction === "context_only" || input.earlierRateDecimal === null ||
      input.laterRateDecimal === null) {
    return coachAiReviewScoreDimension({
      name: "trend_magnitude",
      value: input.direction === "context_only" ? 0 : null,
      rawInputs: { ...input },
      explanation: input.direction === "context_only"
        ? "The declared metric is context-only."
        : "A compatible earlier/later rate was unavailable.",
    });
  }
  const earlier = decimal(input.earlierRateDecimal);
  const later = decimal(input.laterRateDecimal);
  const aligned = input.direction === "lower_is_better"
    ? earlier.minus(later)
    : later.minus(earlier);
  const value = aligned.lte(0) ? 0 : aligned.dividedBy("0.25").times(100).toNumber();
  return coachAiReviewScoreDimension({
    name: "trend_magnitude",
    value,
    rawInputs: {
      ...input,
      directionAlignedChangeDecimal: aligned.toFixed(),
    },
    explanation: "A direction-aligned 25-point rate change receives full credit.",
  });
}

export function scoreCoachAiReviewProcessRelevance(input: Readonly<{
  structuralClass:
    | "preset_core_rule"
    | "named_rule_or_exact_focus"
    | "analyzer_with_rule"
    | "analyzer_only"
    | "chronology_sequence"
    | "fixed_result_cohort";
}>): CoachAiReviewScoreDimension {
  const values = Object.freeze({
    preset_core_rule: 100,
    named_rule_or_exact_focus: 90,
    analyzer_with_rule: 80,
    analyzer_only: 70,
    chronology_sequence: 55,
    fixed_result_cohort: 35,
  });
  return coachAiReviewScoreDimension({
    name: "process_relevance",
    value: values[input.structuralClass],
    rawInputs: { structuralClass: input.structuralClass },
    explanation: "Fixed structural process-relevance table.",
  });
}

export function scoreCoachAiReviewEvidenceConfidence(input: Readonly<{
  requiredFieldCoverage: number | null;
  weakestSampleSufficiency: number | null;
  independentSpread: number | null;
  outlierResistance: number | null;
  structuredSourceConsistency: number | null;
}>): CoachAiReviewScoreDimension {
  const components: readonly (readonly [number | null, number])[] = [
    [input.requiredFieldCoverage, 30],
    [input.weakestSampleSufficiency, 25],
    [input.independentSpread, 20],
    [input.outlierResistance, 15],
    [input.structuredSourceConsistency, 10],
  ];
  const available: readonly (readonly [number, number])[] = components.flatMap(
    ([value, weight]) => value === null ? [] : [[value, weight] as const],
  );
  if (available.length === 0) {
    return coachAiReviewScoreDimension({
      name: "evidence_confidence",
      value: null,
      rawInputs: { ...input },
      explanation: "No confidence component was available.",
    });
  }
  const weight = available.reduce((total, component) => total + component[1], 0);
  const value = available.reduce((total, component) =>
    total + clamp(component[0]) * component[1], 0) / weight;
  return coachAiReviewScoreDimension({
    name: "evidence_confidence",
    value,
    rawInputs: { ...input, availableWeight: weight },
    explanation: "Applicable confidence components reweighted inside confidence only.",
  });
}

export function scoreCoachAiReviewSpecificity(input: Readonly<{
  exactBehaviorSubject: boolean;
  fixedResultCohort: boolean;
  exactDenominator: boolean;
  hasRepresentativeEvidence: boolean;
  exactSequenceOrComparison: boolean;
  measurableFutureTarget: boolean;
}>): CoachAiReviewScoreDimension {
  const value = (input.exactBehaviorSubject ? 30 : input.fixedResultCohort ? 15 : 0) +
    (input.exactDenominator ? 25 : 0) +
    (input.hasRepresentativeEvidence ? 20 : 0) +
    (input.exactSequenceOrComparison ? 15 : 0) +
    (input.measurableFutureTarget ? 10 : 0);
  return coachAiReviewScoreDimension({
    name: "specificity",
    value,
    rawInputs: { ...input },
    explanation: "Additive exact-subject, denominator, evidence, comparison, and target score.",
  });
}

export function calculateCoachAiReviewLaneScore(input: Readonly<{
  lane: CoachAiReviewInsightLane;
  dimensions: readonly CoachAiReviewScoreDimension[];
  penaltyPoints?: number;
}>): CoachAiReviewLaneScore {
  const weights = LANE_WEIGHTS[input.lane];
  const byName = new Map(input.dimensions.map((dimension) => [dimension.name, dimension]));
  let weighted = 0;
  let availableWeight = 0;
  for (const [name, weight] of Object.entries(weights) as [CoachAiReviewScoreDimensionName, number][]) {
    const dimension = byName.get(name);
    if (!dimension?.available || dimension.value === null) continue;
    weighted += weight * dimension.value;
    availableWeight += weight;
  }
  invariant(availableWeight > 0, "TRADERLINK_AI_REVIEW_LANE_WITHOUT_DIMENSION");
  const prePenaltyScore = roundedScore(weighted / 100);
  const penaltyPoints = Math.max(0, Math.round(input.penaltyPoints ?? 0));
  return Object.freeze({
    lane: input.lane,
    prePenaltyScore,
    postPenaltyScore: Math.max(0, prePenaltyScore - penaltyPoints),
    availableWeight,
    penaltyPoints,
    dimensions: Object.freeze([...input.dimensions]),
  });
}

export type CoachAiReviewRankableLaneCandidate = Readonly<{
  findingRef: string;
  actionTargetKey: string;
  evidenceClusterRef: string;
  rankTieKey: string;
  score: CoachAiReviewLaneScore;
  confidence: number;
  fullFinancialConsequenceScore: number | null;
  repetition: number | null;
  processRelevance: number | null;
  specificity: number | null;
  leaveOneBucketWinnerStable: boolean | null;
}>;

export function selectCoachAiReviewLaneDefault(input: Readonly<{
  lane: CoachAiReviewInsightLane;
  candidates: readonly CoachAiReviewRankableLaneCandidate[];
}>): Readonly<{
  selected: CoachAiReviewRankableLaneCandidate;
  ordered: readonly CoachAiReviewRankableLaneCandidate[];
  rankStability: CoachAiReviewLaneRankStability;
}> {
  invariant(input.candidates.length > 0, "TRADERLINK_AI_REVIEW_EMPTY_LANE_RANKING");
  const ordered = Object.freeze([...input.candidates].sort((left, right) =>
    right.score.postPenaltyScore - left.score.postPenaltyScore ||
    right.confidence - left.confidence ||
    (right.fullFinancialConsequenceScore ?? -1) - (left.fullFinancialConsequenceScore ?? -1) ||
    (right.repetition ?? -1) - (left.repetition ?? -1) ||
    (right.processRelevance ?? -1) - (left.processRelevance ?? -1) ||
    (right.specificity ?? -1) - (left.specificity ?? -1) ||
    compareCoachAiReviewText(left.rankTieKey, right.rankTieKey)));
  const rawLeader = ordered[0]!;
  let selected = rawLeader;
  let selectedByMeasuredConsequenceGuard = false;
  if (input.lane === "friction") {
    const guarded = ordered.find((candidate) =>
      candidate.fullFinancialConsequenceScore !== null &&
      candidate.fullFinancialConsequenceScore >= 10 &&
      candidate.confidence >= 50 &&
      rawLeader.score.postPenaltyScore - candidate.score.postPenaltyScore <= 10);
    if (guarded && guarded.findingRef !== rawLeader.findingRef) {
      selected = guarded;
      selectedByMeasuredConsequenceGuard = true;
    }
  }
  const nextDistinct = ordered.find((candidate) =>
    candidate.findingRef !== selected.findingRef &&
    candidate.actionTargetKey !== selected.actionTargetKey &&
    candidate.evidenceClusterRef !== selected.evidenceClusterRef);
  const margin = nextDistinct === undefined
    ? null
    : selected.score.postPenaltyScore - nextDistinct.score.postPenaltyScore;
  const state = nextDistinct === undefined
    ? "only_eligible" as const
    : selected.findingRef === rawLeader.findingRef &&
      !selectedByMeasuredConsequenceGuard &&
      margin !== null && margin >= 5 &&
      selected.leaveOneBucketWinnerStable === true
      ? "dominant" as const
      : "near_tie" as const;
  return Object.freeze({
    selected,
    ordered,
    rankStability: Object.freeze({
      state,
      marginToNextDistinct: margin,
      leaveOneBucketWinnerStable: selected.leaveOneBucketWinnerStable,
      selectedByMeasuredConsequenceGuard,
    }),
  });
}
