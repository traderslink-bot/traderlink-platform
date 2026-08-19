import Decimal from "decimal.js";

import type {
  CoachAiReviewInsightCandidate,
  CoachAiReviewInsightLane,
  CoachAiReviewLaneRankStability,
  CoachAiReviewLaneScore,
  CoachAiReviewScoreDimensionName,
} from "@/src/modules/coach/contracts/coach-ai-review-insight-contracts";
import {
  CoachAiReviewInsightInvariantError,
  compareCoachAiReviewText,
} from "./coach-ai-review-insight-normalizer";
import {
  selectCoachAiReviewLaneDefault,
  type CoachAiReviewRankableLaneCandidate,
} from "./coach-ai-review-insight-ranking";

const ExactDecimal = Decimal.clone({ precision: 160, rounding: Decimal.ROUND_HALF_UP });

function invariant(condition: boolean, code: string): asserts condition {
  if (!condition) throw new CoachAiReviewInsightInvariantError(code);
}

const LANE_QUOTAS: Readonly<Record<CoachAiReviewInsightLane, number>> = Object.freeze({
  friction: 6,
  improvement: 4,
  strength: 4,
  contrast: 3,
  focus_follow_through: 4,
});

export type CoachAiReviewShortlistEntry = Readonly<{
  candidate: CoachAiReviewInsightCandidate;
  lane: CoachAiReviewInsightLane;
  effectiveScore: CoachAiReviewLaneScore;
  confidence: number;
  actionTargetKey: string;
  evidenceClusterRef: string;
  rankTieKey: string;
  overlapPenaltyPoints: number;
  jaccardAudit: number;
  requiredConsideration: "default" | "alternative" | "supporting";
}>;

export type CoachAiReviewLaneSelection = Readonly<{
  lane: CoachAiReviewInsightLane;
  defaultFindingRef: string;
  alternativeFindingRefs: readonly string[];
  rankStability: CoachAiReviewLaneRankStability;
}>;

export type CoachAiReviewBalancedShortlist = Readonly<{
  entries: readonly CoachAiReviewShortlistEntry[];
  laneSelections: readonly CoachAiReviewLaneSelection[];
  privateAuditedCandidateCount: number;
  pairwiseCandidateCountByLane: Readonly<Record<CoachAiReviewInsightLane, number>>;
}>;

function dimensionValue(
  score: CoachAiReviewLaneScore,
  name: CoachAiReviewScoreDimensionName,
): number | null {
  return score.dimensions.find((dimension) => dimension.name === name)?.value ?? null;
}

function scoreForLane(
  candidate: CoachAiReviewInsightCandidate,
  lane: CoachAiReviewInsightLane,
): CoachAiReviewLaneScore | null {
  return candidate.scores.find((score) => score.lane === lane) ?? null;
}

function visiblyEligible(
  candidate: CoachAiReviewInsightCandidate,
  score: CoachAiReviewLaneScore,
): boolean {
  if (candidate.subjectRef.length === 0 || candidate.overlapKeys.length === 0) return false;
  if (score.lane === "friction" && candidate.family === "named_rule_association") {
    const cohortNet = candidate.measurements.find((measurement) =>
      measurement.metricName === "affected_cohort_net_pnl" &&
      measurement.availability === "available" && measurement.exactValue !== null);
    const adverseContribution = candidate.measurements.find((measurement) =>
      measurement.metricName === "adverse_net_contribution" &&
      measurement.availability === "available" && measurement.exactValue !== null);
    if (cohortNet !== undefined && new ExactDecimal(cohortNet.exactValue!).gt(0) &&
        (adverseContribution === undefined ||
          new ExactDecimal(adverseContribution.exactValue!).lte(0))) return false;
  }
  const confidence = dimensionValue(score, "evidence_confidence") ?? 0;
  if (candidate.classification === "recurring" || candidate.classification === "trend" ||
      candidate.classification === "contrast") return confidence >= 50;
  if (candidate.classification === "focus_assessment") {
    return candidate.relatedFocusRefs.length > 0 && candidate.opportunityMemberRefs.length > 0;
  }
  return candidate.classification === "material_outlier" ||
    candidate.classification === "specific_example";
}

function containmentCoefficient(
  left: readonly string[],
  right: readonly string[],
): number {
  if (left.length === 0 || right.length === 0) return 0;
  const rightSet = new Set(right);
  const intersection = left.filter((memberRef) => rightSet.has(memberRef)).length;
  return intersection / Math.min(left.length, right.length);
}

function jaccardCoefficient(
  left: readonly string[],
  right: readonly string[],
): number {
  if (left.length === 0 && right.length === 0) return 0;
  const union = new Set([...left, ...right]);
  const rightSet = new Set(right);
  const intersection = left.filter((memberRef) => rightSet.has(memberRef)).length;
  return union.size === 0 ? 0 : intersection / union.size;
}

function overlapPenalty(coefficient: number): number {
  if (coefficient >= 0.65) return 15;
  if (coefficient >= 0.50) return 10;
  if (coefficient >= 0.35) return 5;
  return 0;
}

function actionTargetKey(candidate: CoachAiReviewInsightCandidate): string {
  return candidate.trackingSubjectKey;
}

function rankTieKey(candidate: CoachAiReviewInsightCandidate): string {
  return JSON.stringify([
    candidate.family,
    candidate.classification,
    candidate.polarity,
    candidate.subjectLabel,
    candidate.populationDefinition,
    candidate.opportunityDefinition,
    candidate.cohortDefinition,
    candidate.comparisonDefinition,
    candidate.measurements.map((measurement) => [
      measurement.metricName,
      measurement.exactValue,
      measurement.unit,
      measurement.currency,
      measurement.affectedCount,
      measurement.expectedCount,
      measurement.availability,
      measurement.attributionKind,
    ]),
    candidate.weekSeries.map((bucket) => [bucket.numerator, bucket.denominator]),
    candidate.representativeEvidenceRoles,
    candidate.representativeMetricName,
  ]);
}

type WorkingEntry = Readonly<{
  candidate: CoachAiReviewInsightCandidate;
  lane: CoachAiReviewInsightLane;
  baseScore: CoachAiReviewLaneScore;
  confidence: number;
  actionTargetKey: string;
  rankTieKey: string;
}>;

function compareWorking(left: WorkingEntry, right: WorkingEntry): number {
  return right.baseScore.postPenaltyScore - left.baseScore.postPenaltyScore ||
    right.confidence - left.confidence ||
    compareCoachAiReviewText(left.rankTieKey, right.rankTieKey);
}

function collapseWithinFamilySubject(entries: readonly WorkingEntry[]): readonly WorkingEntry[] {
  const retained: WorkingEntry[] = [];
  for (const entry of [...entries].sort(compareWorking)) {
    const duplicate = retained.some((existing) =>
      existing.candidate.family === entry.candidate.family &&
      existing.candidate.subjectRef === entry.candidate.subjectRef &&
      containmentCoefficient(
        existing.candidate.affectedMemberRefs,
        entry.candidate.affectedMemberRefs,
      ) >= 0.65);
    if (!duplicate) retained.push(entry);
  }
  return Object.freeze(retained);
}

function withPenalty(score: CoachAiReviewLaneScore, addedPenalty: number): CoachAiReviewLaneScore {
  return Object.freeze({
    ...score,
    postPenaltyScore: Math.max(0, score.postPenaltyScore - addedPenalty),
    penaltyPoints: score.penaltyPoints + addedPenalty,
  });
}

class ClusterSet {
  private readonly parent = new Map<string, string>();

  add(value: string): void {
    if (!this.parent.has(value)) this.parent.set(value, value);
  }

  find(value: string): string {
    const parent = this.parent.get(value);
    invariant(parent !== undefined, "TRADERLINK_AI_REVIEW_CLUSTER_MEMBER_MISSING");
    if (parent === value) return value;
    const root = this.find(parent);
    this.parent.set(value, root);
    return root;
  }

  union(left: string, right: string): void {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot === rightRoot) return;
    const [root, child] = [leftRoot, rightRoot].sort();
    this.parent.set(child!, root!);
  }
}

function rankable(
  entry: CoachAiReviewShortlistEntry,
  leaveOneBucketWinnerStable: boolean | null = null,
): CoachAiReviewRankableLaneCandidate {
  const assessment = entry.candidate.focusAssessment;
  const materialRepeatVerdicts = new Set([
    "improved",
    "improved_but_still_inconsistent",
    "worsened",
  ]);
  const financial = dimensionValue(entry.effectiveScore, "financial_materiality");
  const fullFinancial = entry.candidate.consequenceVerdict === "worse_associated_outcome" ||
      entry.candidate.consequenceVerdict === "better_associated_outcome"
    ? financial
    : null;
  return Object.freeze({
    findingRef: entry.candidate.findingRef,
    actionTargetKey: entry.actionTargetKey,
    evidenceClusterRef: entry.evidenceClusterRef,
    rankTieKey: entry.rankTieKey,
    score: entry.effectiveScore,
    confidence: entry.confidence,
    fullFinancialConsequenceScore: fullFinancial,
    repetition: dimensionValue(entry.effectiveScore, "repetition"),
    processRelevance: dimensionValue(entry.effectiveScore, "process_relevance"),
    specificity: dimensionValue(entry.effectiveScore, "specificity"),
    leaveOneBucketWinnerStable,
    focusPreviouslyAssessed: assessment?.priorAssessmentReviewRef !== null &&
      assessment?.priorAssessmentReviewRef !== undefined,
    focusMaterialRepeatException: assessment !== null &&
      (assessment.verdict === "worsened" ||
        assessment.priorAssessmentVerdict !== null &&
        assessment.priorAssessmentVerdict !== assessment.verdict &&
        materialRepeatVerdicts.has(assessment.verdict)),
  });
}

function candidateWithoutBucket(
  candidate: CoachAiReviewInsightCandidate,
  bucketRef: string,
): CoachAiReviewInsightCandidate | null {
  if (!candidate.weekSeries.some((bucket) => bucket.bucketRef === bucketRef)) return candidate;
  const sensitivity = candidate.bucketSensitivity.find((item) => item.bucketRef === bucketRef);
  // Focus assessments reuse the later candidate's buckets but intentionally do
  // not claim a leave-one-bucket projection. Exclude that assessment from the
  // replay so rank stability cannot be overstated.
  if (sensitivity === undefined && candidate.family === "focus_follow_through") return null;
  invariant(sensitivity !== undefined,
    "TRADERLINK_AI_REVIEW_BUCKET_SENSITIVITY_MISSING");
  if (!sensitivity.candidateEligible) return null;
  return Object.freeze({
    ...candidate,
    classification: sensitivity.classification,
    affectedMemberRefs: sensitivity.affectedMemberRefs,
    consequenceVerdict: sensitivity.consequenceVerdict,
    scores: sensitivity.scores,
    weekSeries: Object.freeze(candidate.weekSeries.filter((bucket) =>
      bucket.bucketRef !== bucketRef)),
    bucketSensitivity: Object.freeze([]),
  });
}

function diversifiedAlternatives(
  selected: CoachAiReviewShortlistEntry,
  ordered: readonly CoachAiReviewShortlistEntry[],
): readonly CoachAiReviewShortlistEntry[] {
  const alternatives: CoachAiReviewShortlistEntry[] = [];
  const distinct = ordered.filter((entry) => entry.candidate.findingRef !== selected.candidate.findingRef &&
    entry.actionTargetKey !== selected.actionTargetKey &&
    entry.evidenceClusterRef !== selected.evidenceClusterRef &&
    selected.effectiveScore.postPenaltyScore - entry.effectiveScore.postPenaltyScore <= 10 &&
    selected.confidence - entry.confidence <= 5);
  alternatives.push(...distinct.slice(0, 2));
  if (alternatives.length < 2) {
    const fallback = ordered.find((entry) =>
      entry.candidate.findingRef !== selected.candidate.findingRef &&
      !alternatives.some((item) => item.candidate.findingRef === entry.candidate.findingRef) &&
      selected.effectiveScore.postPenaltyScore - entry.effectiveScore.postPenaltyScore <= 10 &&
      selected.confidence - entry.confidence <= 5);
    if (fallback) alternatives.push(fallback);
  }
  return Object.freeze(alternatives.slice(0, 2));
}

function buildCoachAiReviewBalancedShortlistInternal(
  candidates: readonly CoachAiReviewInsightCandidate[],
  computeRankStability: boolean,
): CoachAiReviewBalancedShortlist {
  invariant(new Set(candidates.map((candidate) => candidate.findingRef)).size === candidates.length,
    "TRADERLINK_AI_REVIEW_CANDIDATE_REF_DUPLICATE");
  const entriesForLane = (lane: CoachAiReviewInsightLane): readonly WorkingEntry[] => {
    const entries = candidates.flatMap((candidate): WorkingEntry[] => {
      if (!candidate.laneEligibility.includes(lane)) return [];
      const score = scoreForLane(candidate, lane);
      if (score === null || !visiblyEligible(candidate, score)) return [];
      return [{
        candidate,
        lane,
        baseScore: score,
        confidence: dimensionValue(score, "evidence_confidence") ?? 0,
        actionTargetKey: actionTargetKey(candidate),
        rankTieKey: rankTieKey(candidate),
      }];
    });
    return collapseWithinFamilySubject(entries).slice(0, 50);
  };
  const workingByLane: Record<CoachAiReviewInsightLane, readonly WorkingEntry[]> = {
    friction: entriesForLane("friction"),
    improvement: entriesForLane("improvement"),
    strength: entriesForLane("strength"),
    contrast: entriesForLane("contrast"),
    focus_follow_through: entriesForLane("focus_follow_through"),
  };
  const pairwiseCandidateCountByLane = Object.freeze(Object.fromEntries(
    (Object.keys(LANE_QUOTAS) as CoachAiReviewInsightLane[]).map((lane) => [
      lane,
      workingByLane[lane].length,
    ]),
  ) as Record<CoachAiReviewInsightLane, number>);
  const allWorking = (Object.keys(LANE_QUOTAS) as CoachAiReviewInsightLane[])
    .flatMap((lane) => workingByLane[lane]);
  const clusters = new ClusterSet();
  for (const entry of allWorking) clusters.add(entry.candidate.findingRef);
  for (let leftIndex = 0; leftIndex < allWorking.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < allWorking.length; rightIndex += 1) {
      const left = allWorking[leftIndex]!;
      const right = allWorking[rightIndex]!;
      const containment = containmentCoefficient(
        left.candidate.affectedMemberRefs,
        right.candidate.affectedMemberRefs,
      );
      if (containment >= 0.65) {
        clusters.union(left.candidate.findingRef, right.candidate.findingRef);
      }
    }
  }
  const rankLane = (lane: CoachAiReviewInsightLane): readonly CoachAiReviewShortlistEntry[] => {
      const ordered = [...workingByLane[lane]].sort(compareWorking);
      const entries = ordered.map((entry, index): CoachAiReviewShortlistEntry => {
        let addedPenalty = 0;
        for (let strongerIndex = 0; strongerIndex < index; strongerIndex += 1) {
          const stronger = ordered[strongerIndex]!;
          if (stronger.candidate.family === entry.candidate.family) continue;
          addedPenalty = Math.max(addedPenalty, overlapPenalty(containmentCoefficient(
            stronger.candidate.affectedMemberRefs,
            entry.candidate.affectedMemberRefs,
          )));
        }
        const jaccardAudit = ordered.slice(0, index).reduce((maximum, stronger) => Math.max(
          maximum,
          jaccardCoefficient(stronger.candidate.affectedMemberRefs, entry.candidate.affectedMemberRefs),
        ), 0);
        return Object.freeze({
          candidate: entry.candidate,
          lane,
          effectiveScore: withPenalty(entry.baseScore, addedPenalty),
          confidence: entry.confidence,
          actionTargetKey: entry.actionTargetKey,
          evidenceClusterRef: clusters.find(entry.candidate.findingRef),
          rankTieKey: entry.rankTieKey,
          overlapPenaltyPoints: addedPenalty,
          requiredConsideration: "supporting" as const,
          jaccardAudit,
        });
      }).sort((left, right) =>
        right.effectiveScore.postPenaltyScore - left.effectiveScore.postPenaltyScore ||
        right.confidence - left.confidence ||
        compareCoachAiReviewText(left.rankTieKey, right.rankTieKey));
      return Object.freeze(entries);
  };
  const rankedByLane: Record<CoachAiReviewInsightLane, readonly CoachAiReviewShortlistEntry[]> = {
    friction: rankLane("friction"),
    improvement: rankLane("improvement"),
    strength: rankLane("strength"),
    contrast: rankLane("contrast"),
    focus_follow_through: rankLane("focus_follow_through"),
  };
  const laneSelections: CoachAiReviewLaneSelection[] = [];
  const selectedEntries: CoachAiReviewShortlistEntry[] = [];
  const stabilityReplayByBucket = new Map<string, CoachAiReviewBalancedShortlist>();
  for (const lane of Object.keys(LANE_QUOTAS) as CoachAiReviewInsightLane[]) {
    const laneEntries = rankedByLane[lane];
    if (laneEntries.length === 0) continue;
    const provisionalSelection = selectCoachAiReviewLaneDefault({
      lane,
      candidates: laneEntries.map((entry) => rankable(entry)),
    });
    const provisionalSelected = laneEntries.find((entry) =>
      entry.candidate.findingRef === provisionalSelection.selected.findingRef)!;
    const bucketRefs = provisionalSelected.candidate.weekSeries
      .map((bucket) => bucket.bucketRef).sort(compareCoachAiReviewText);
    const leaveOneBucketWinnerStable = !computeRankStability || bucketRefs.length === 0
      ? null
      : bucketRefs.every((bucketRef) => {
          let replay = stabilityReplayByBucket.get(bucketRef);
          if (replay === undefined) {
            const projectedCandidates = candidates.flatMap((candidate) => {
              const projected = candidateWithoutBucket(candidate, bucketRef);
              return projected === null ? [] : [projected];
            });
            replay = buildCoachAiReviewBalancedShortlistInternal(projectedCandidates, false);
            stabilityReplayByBucket.set(bucketRef, replay);
          }
          return replay.laneSelections.find((item) => item.lane === lane)?.defaultFindingRef ===
            provisionalSelected.candidate.findingRef;
        });
    const selection = selectCoachAiReviewLaneDefault({
      lane,
      candidates: laneEntries.map((entry) => rankable(
        entry,
        entry.candidate.findingRef === provisionalSelected.candidate.findingRef
          ? leaveOneBucketWinnerStable
          : null,
      )),
    });
    const selected = laneEntries.find((entry) =>
      entry.candidate.findingRef === selection.selected.findingRef)!;
    const alternatives = diversifiedAlternatives(selected, laneEntries);
    const allowed = [selected, ...alternatives, ...laneEntries.filter((entry) =>
      entry.candidate.findingRef !== selected.candidate.findingRef &&
      !alternatives.some((alternative) =>
        alternative.candidate.findingRef === entry.candidate.findingRef))]
      .slice(0, LANE_QUOTAS[lane]);
    selectedEntries.push(...allowed.map((entry, index) => Object.freeze({
      ...entry,
      requiredConsideration: index === 0
        ? "default" as const
        : index <= alternatives.length
          ? "alternative" as const
          : "supporting" as const,
    })));
    laneSelections.push(Object.freeze({
      lane,
      defaultFindingRef: selected.candidate.findingRef,
      alternativeFindingRefs: Object.freeze(alternatives.map((entry) => entry.candidate.findingRef)),
      rankStability: selection.rankStability,
    }));
  }
  const distinctEntries: CoachAiReviewShortlistEntry[] = [];
  const clusterCounts = new Map<string, number>();
  const actionCounts = new Map<string, number>();
  const admissionOrder = [
    ...selectedEntries.filter((entry) => entry.requiredConsideration === "default"),
    ...selectedEntries.filter((entry) => entry.requiredConsideration !== "default"),
  ];
  for (const entry of admissionOrder) {
    if (distinctEntries.some((item) => item.candidate.findingRef === entry.candidate.findingRef &&
        item.lane === entry.lane)) continue;
    if (entry.requiredConsideration !== "default" &&
        ((clusterCounts.get(entry.evidenceClusterRef) ?? 0) >= 2 ||
        (actionCounts.get(entry.actionTargetKey) ?? 0) >= 2)) continue;
    distinctEntries.push(entry);
    clusterCounts.set(entry.evidenceClusterRef, (clusterCounts.get(entry.evidenceClusterRef) ?? 0) + 1);
    actionCounts.set(entry.actionTargetKey, (actionCounts.get(entry.actionTargetKey) ?? 0) + 1);
    if (distinctEntries.length >= 25) break;
  }
  invariant(laneSelections.every((selection) => distinctEntries.some((entry) =>
    entry.lane === selection.lane &&
    entry.candidate.findingRef === selection.defaultFindingRef)),
  "TRADERLINK_AI_REVIEW_LANE_DEFAULT_MISSING_FROM_SHORTLIST");
  return Object.freeze({
    entries: Object.freeze(distinctEntries),
    laneSelections: Object.freeze(laneSelections),
    privateAuditedCandidateCount: candidates.length,
    pairwiseCandidateCountByLane,
  });
}

export function buildCoachAiReviewBalancedShortlist(
  candidates: readonly CoachAiReviewInsightCandidate[],
): CoachAiReviewBalancedShortlist {
  return buildCoachAiReviewBalancedShortlistInternal(candidates, true);
}
