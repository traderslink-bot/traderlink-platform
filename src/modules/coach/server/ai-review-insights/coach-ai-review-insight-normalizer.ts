import type {
  CoachAiReviewInsightCandidate,
  CoachAiReviewNormalizedRuleOpportunity,
  CoachAiReviewPresetAvailabilityReason,
  CoachAiReviewPresetEvaluationState,
  CoachAiReviewRuleDispositionState,
  CoachAiReviewRuleOpportunityInput,
  CoachAiReviewRuleOpportunityState,
  CoachAiReviewRuleOpportunityUnavailableReason,
} from "@/src/modules/coach/contracts/coach-ai-review-insight-contracts";

export class CoachAiReviewInsightInvariantError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CoachAiReviewInsightInvariantError";
  }
}

function invariant(condition: boolean, code: string): asserts condition {
  if (!condition) throw new CoachAiReviewInsightInvariantError(code);
}

function nonEmptyRef(value: string, field: string): string {
  invariant(value.length > 0 && value.trim() === value, `TRADERLINK_AI_REVIEW_${field}_INVALID`);
  return value;
}

export function compareCoachAiReviewText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function freezeSortedUniqueRefs(
  values: readonly string[],
  field = "MEMBER_REF",
): readonly string[] {
  const normalized = values.map((value) => nonEmptyRef(value, field));
  const unique = new Set(normalized);
  invariant(unique.size === normalized.length, `TRADERLINK_AI_REVIEW_${field}_DUPLICATE`);
  return Object.freeze([...unique].sort(compareCoachAiReviewText));
}

export function assertMemberSubset(
  numerator: readonly string[],
  denominator: readonly string[],
  code = "TRADERLINK_AI_REVIEW_NUMERATOR_OUTSIDE_DENOMINATOR",
): void {
  const denominatorSet = new Set(denominator);
  invariant(numerator.every((memberRef) => denominatorSet.has(memberRef)), code);
}

function dispositionState(
  saved: CoachAiReviewRuleOpportunityInput["savedDisposition"],
): CoachAiReviewRuleDispositionState {
  if (saved === "followed") return "reviewed_followed";
  if (saved === "broken") return "reviewed_broken";
  if (saved === "not_reviewed") return "explicit_not_reviewed";
  return "expected_review_missing";
}

function evaluationState(input: NonNullable<
  CoachAiReviewRuleOpportunityInput["presetEvaluation"]
>): CoachAiReviewPresetEvaluationState {
  if (input.status === "followed") return "evaluated_followed";
  if (input.status === "broken") return "evaluated_broken";
  return input.availabilityReason === "no_applicable_target"
    ? "not_applicable"
    : "evaluation_unavailable";
}

function validatePresetReason(input: NonNullable<
  CoachAiReviewRuleOpportunityInput["presetEvaluation"]
>): CoachAiReviewPresetAvailabilityReason | null {
  if (input.status === "n/a") {
    invariant(
      input.availabilityReason !== null,
      "TRADERLINK_AI_REVIEW_PRESET_NA_REASON_REQUIRED",
    );
    return input.availabilityReason;
  }
  invariant(
    input.availabilityReason === null,
    "TRADERLINK_AI_REVIEW_PRESET_AVAILABLE_REASON_FORBIDDEN",
  );
  return null;
}

function targetMatchesScope(input: CoachAiReviewRuleOpportunityInput): boolean {
  if (input.reviewScope === "both") return true;
  return input.targetKind === "trading_day"
    ? input.reviewScope === "day"
    : input.reviewScope === "trade";
}

export function normalizeCoachAiReviewRuleOpportunity(
  input: CoachAiReviewRuleOpportunityInput,
): CoachAiReviewNormalizedRuleOpportunity {
  const ruleRef = nonEmptyRef(input.ruleRef, "RULE_REF");
  const ruleVersionRef = nonEmptyRef(input.ruleVersionRef, "RULE_VERSION_REF");
  const targetRef = nonEmptyRef(input.targetRef, "RULE_TARGET_REF");
  invariant(targetMatchesScope(input), "TRADERLINK_AI_REVIEW_RULE_SCOPE_TARGET_MISMATCH");
  invariant(
    input.sourceKind === "template" || input.presetEvaluation === null,
    "TRADERLINK_AI_REVIEW_CUSTOM_RULE_PRESET_EVIDENCE",
  );

  const presetReason = input.presetEvaluation === null
    ? null
    : validatePresetReason(input.presetEvaluation);
  const presetState = input.presetEvaluation === null
    ? null
    : evaluationState(input.presetEvaluation);
  let opportunityState: CoachAiReviewRuleOpportunityState = "applicable";
  let opportunityUnavailableReason: CoachAiReviewRuleOpportunityUnavailableReason | null = null;
  if (!input.activeAtTarget || input.historicalProjection === "not_applicable" ||
      presetState === "not_applicable") {
    opportunityState = "not_applicable";
  } else if (input.historicalProjection === "unavailable") {
    opportunityState = "unavailable";
    opportunityUnavailableReason = "historical_projection_unavailable";
  } else if (presetState === "evaluation_unavailable") {
    opportunityState = "unavailable";
    opportunityUnavailableReason = "preset_evaluation_unavailable";
  }
  if (opportunityState !== "applicable" && input.savedDisposition !== null) {
    opportunityState = "unavailable";
    opportunityUnavailableReason = "saved_disposition_without_opportunity";
  }
  const reviewOpportunity = opportunityState === "applicable";
  const disposition = reviewOpportunity ? dispositionState(input.savedDisposition) : null;
  const violationRefs = input.presetEvaluation === null
    ? Object.freeze([])
    : freezeSortedUniqueRefs(
      input.presetEvaluation.violationTradeRefs,
      "RULE_VIOLATION_REF",
    );
  invariant(
    input.presetEvaluation?.status === "broken" || violationRefs.length === 0,
    "TRADERLINK_AI_REVIEW_NON_BROKEN_VIOLATION_MEMBERS",
  );

  const savedComparable = input.savedDisposition === "followed" || input.savedDisposition === "broken";
  const evaluatedComparable = input.presetEvaluation?.status === "followed" ||
    input.presetEvaluation?.status === "broken";
  const sourceConsistency = savedComparable && evaluatedComparable
    ? input.savedDisposition === input.presetEvaluation!.status
      ? "consistent" as const
      : "conflict" as const
    : "single_source" as const;

  return Object.freeze({
    ruleRef,
    ruleVersionRef,
    targetRef,
    targetKind: input.targetKind,
    sourceKind: input.sourceKind,
    opportunityState,
    opportunityUnavailableReason,
    isReviewOpportunity: reviewOpportunity,
    dispositionState: disposition,
    presetEvaluationState: presetState,
    presetAvailabilityReason: presetReason,
    sourceConsistency,
    authorizedViolationTradeRefs: sourceConsistency === "conflict"
      ? Object.freeze([])
      : violationRefs,
  });
}

export function normalizeCoachAiReviewRuleOpportunities(
  inputs: readonly CoachAiReviewRuleOpportunityInput[],
): readonly CoachAiReviewNormalizedRuleOpportunity[] {
  const normalized = inputs.map(normalizeCoachAiReviewRuleOpportunity);
  const keys = normalized.map((item) =>
    `${item.ruleVersionRef}\u0000${item.targetKind}\u0000${item.targetRef}`);
  invariant(
    new Set(keys).size === keys.length,
    "TRADERLINK_AI_REVIEW_RULE_OPPORTUNITY_DUPLICATE",
  );
  return Object.freeze(normalized.sort((left, right) =>
    compareCoachAiReviewText(left.ruleVersionRef, right.ruleVersionRef) ||
    compareCoachAiReviewText(left.targetKind, right.targetKind) ||
    compareCoachAiReviewText(left.targetRef, right.targetRef)));
}

export function validateCoachAiReviewCandidateMembership(
  candidate: CoachAiReviewInsightCandidate,
): void {
  const population = freezeSortedUniqueRefs(candidate.populationMemberRefs, "POPULATION_REF");
  const opportunity = freezeSortedUniqueRefs(candidate.opportunityMemberRefs, "OPPORTUNITY_REF");
  const affected = freezeSortedUniqueRefs(candidate.affectedMemberRefs, "AFFECTED_REF");
  invariant(
    population.every((value, index) => candidate.populationMemberRefs[index] === value),
    "TRADERLINK_AI_REVIEW_POPULATION_NOT_CANONICAL",
  );
  invariant(
    opportunity.every((value, index) => candidate.opportunityMemberRefs[index] === value),
    "TRADERLINK_AI_REVIEW_OPPORTUNITY_NOT_CANONICAL",
  );
  invariant(
    affected.every((value, index) => candidate.affectedMemberRefs[index] === value),
    "TRADERLINK_AI_REVIEW_AFFECTED_NOT_CANONICAL",
  );
  assertMemberSubset(affected, opportunity.length > 0 ? opportunity : population);

  for (const measurement of candidate.measurements) {
    const numerator = freezeSortedUniqueRefs(
      measurement.numeratorMemberRefs,
      "MEASUREMENT_NUMERATOR_REF",
    );
    const denominator = freezeSortedUniqueRefs(
      measurement.denominatorMemberRefs,
      "MEASUREMENT_DENOMINATOR_REF",
    );
    assertMemberSubset(numerator, denominator);
    invariant(
      numerator.length === measurement.affectedCount,
      "TRADERLINK_AI_REVIEW_MEASUREMENT_AFFECTED_COUNT_MISMATCH",
    );
  }
}
