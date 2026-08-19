import type {
  CoachAiReviewCompletePlan,
  CoachAiReviewRenderedPlanCatalog,
  CoachAiReviewSectionKey,
} from "./coach-ai-review-rendered-plan-contracts";

export const COACH_AI_REVIEW_PROVIDER_PLAN_PACKAGE_VERSION =
  "traderlink_coach_ai_review_provider_plan_package_v1" as const;

export const COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION =
  "traderlink_coach_ai_review_plan_selection_v1" as const;

export type CoachAiReviewProviderChoiceKey =
  | "plan_1"
  | "plan_2"
  | "plan_3"
  | "plan_4"
  | "plan_5"
  | "plan_6";

export type CoachAiReviewProviderPlanChoice = Readonly<{
  choiceKey: CoachAiReviewProviderChoiceKey;
  review: CoachAiReviewCompletePlan["output"];
  sections: readonly Readonly<{
    sectionKey: CoachAiReviewSectionKey;
    purpose: string;
    rankStability: "dominant" | "near_tie" | "only_eligible" | null;
    facts: readonly string[];
  }>[];
  selectionRationale: string;
}>;

export type CoachAiReviewProviderPlanPackage = Readonly<{
  packageVersion: typeof COACH_AI_REVIEW_PROVIDER_PLAN_PACKAGE_VERSION;
  selectionContractVersion: typeof COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION;
  packageKey: string;
  period: Readonly<{
    cadence: "weekly" | "two_week" | "monthly";
    startDate: string;
    endDate: string;
  }>;
  instruction: string;
  choices: readonly CoachAiReviewProviderPlanChoice[];
}>;

export type CoachAiReviewPrivatePlanChoice = Readonly<{
  choiceKey: CoachAiReviewProviderChoiceKey;
  reviewPlanRef: string;
}>;

export type CoachAiReviewFrozenProviderPlanPackage = Readonly<{
  providerPackage: CoachAiReviewProviderPlanPackage;
  canonicalProviderPackage: string;
  canonicalProviderPackageByteLength: number;
  providerPackageDigestSha256: string;
  selectionPayloadDigestSha256: string;
  privateChoices: readonly CoachAiReviewPrivatePlanChoice[];
  catalog: CoachAiReviewRenderedPlanCatalog;
}>;

export type CoachAiReviewPlanSelectionResponse = Readonly<{
  contractVersion: typeof COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION;
  packageKey: string;
  choiceKey: CoachAiReviewProviderChoiceKey;
}>;
