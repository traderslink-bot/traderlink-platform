import type {
  CoachAiReviewCadence,
  CoachAiReviewInsightFamily,
  CoachAiReviewInsightLane,
  CoachAiReviewRankStabilityState,
} from "./coach-ai-review-insight-contracts";

export const COACH_AI_REVIEW_RENDERER_VERSION =
  "traderlink_coach_ai_review_renderer_v1" as const;

export const COACH_AI_REVIEW_PLAN_CATALOG_VERSION =
  "traderlink_coach_ai_review_plan_catalog_v1" as const;

export type CoachAiReviewSectionKey =
  | "opening"
  | "what_improved"
  | "what_held_you_back"
  | "focus_follow_through";

export type CoachAiReviewSectionPurpose =
  | "period_outcome"
  | "result_process_contrast"
  | "directional_change"
  | "no_improvement_comparison"
  | "maintained_strength"
  | "residual_friction"
  | "mixed_result"
  | "no_friction_strength"
  | "focus_change"
  | "focus_measurement";

export type CoachAiReviewSectionSelectionMode =
  | "primary"
  | "no_improvement_comparison"
  | "maintained_strength"
  | "mixed_result"
  | "no_friction_strength"
  | "not_available";

export type CoachAiReviewNotAvailableReason =
  | "no_qualifying_pattern"
  | "insufficient_coverage"
  | "no_compatible_baseline"
  | "no_later_evidence"
  | "required_facts_unavailable";

export type CoachAiReviewClaimKind =
  | "period_outcome"
  | "affected_rate"
  | "trend_change"
  | "financial_impact"
  | "analyzer_path_impact"
  | "representative_example"
  | "rank_certainty"
  | "unavailable_boundary";

export type CoachAiReviewRenderedClaim = Readonly<{
  claimRef: string;
  findingRef: string | null;
  family: CoachAiReviewInsightFamily | null;
  kind: CoachAiReviewClaimKind;
  factualJobKey: string;
  measurementRefs: readonly string[];
  evidenceRefs: readonly string[];
  renderedSentence: string;
}>;

export type CoachAiReviewRenderedSectionPlan = Readonly<{
  sectionPlanRef: string;
  sectionKey: CoachAiReviewSectionKey;
  sectionPurpose: CoachAiReviewSectionPurpose;
  selectionMode: CoachAiReviewSectionSelectionMode;
  selectionState: "selected" | "not_available";
  notAvailableReason: CoachAiReviewNotAvailableReason | null;
  lane: CoachAiReviewInsightLane | null;
  findingRef: string | null;
  claimRefs: readonly string[];
  bridgeRef: string | null;
  renderedText: string;
  rankStability: CoachAiReviewRankStabilityState | null;
  laneScore: number | null;
  confidence: number | null;
  specificity: number | null;
  focusConnection: number | null;
  primaryEvidenceRefs: readonly string[];
  actionTargetKey: string | null;
}>;

export type CoachAiReviewRenderedFocusQuestion = Readonly<{
  focusQuestionRef: string;
  findingRef: string;
  actionTargetKey: string;
  renderedQuestion: string;
}>;

export type CoachAiReviewRenderedOutput = Readonly<{
  reviewSummary: string;
  whatImproved: string;
  whatHeldYouBack: string;
  focusFollowThrough: string;
  nextPeriodFocuses: readonly string[];
  incompleteRecord: string | null;
}>;

export type CoachAiReviewCompletePlan = Readonly<{
  reviewPlanRef: string;
  sectionPlanRefs: Readonly<Record<CoachAiReviewSectionKey, string>>;
  focusQuestionRefs: readonly string[];
  output: CoachAiReviewRenderedOutput;
  totalLaneScoreLoss: number;
  overlapBurden: number;
  totalFocusConnection: number;
  totalSpecificity: number;
  structuralTieKey: string;
}>;

export type CoachAiReviewDecisionCriticalSpine = Readonly<{
  periodOutcomeFindingRef: string;
  improvementFindingRef: string | null;
  improvementUnavailableReason: CoachAiReviewNotAvailableReason | null;
  frictionFindingRef: string | null;
  frictionUnavailableReason: CoachAiReviewNotAvailableReason | null;
  followThroughFindingRef: string | null;
  followThroughUnavailableReason: CoachAiReviewNotAvailableReason | null;
}>;

export type CoachAiReviewRenderedPlanCatalog = Readonly<{
  catalogVersion: typeof COACH_AI_REVIEW_PLAN_CATALOG_VERSION;
  rendererVersion: typeof COACH_AI_REVIEW_RENDERER_VERSION;
  cadence: CoachAiReviewCadence;
  claims: readonly CoachAiReviewRenderedClaim[];
  sectionPlans: readonly CoachAiReviewRenderedSectionPlan[];
  focusQuestions: readonly CoachAiReviewRenderedFocusQuestion[];
  completePlans: readonly CoachAiReviewCompletePlan[];
  decisionCriticalSpine: CoachAiReviewDecisionCriticalSpine;
}>;
