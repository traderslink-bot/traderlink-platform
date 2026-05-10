import type {
  MappedUserFacingBehavior,
  UserFacingBehaviorRoute,
  UserFacingBehaviorState,
} from "../types/user-facing-behavior-contract";
import { mapUserFacingBehavior } from "./map-user-facing-behavior";

export interface DecisionReviewInsightForUserInput {
  id: string;
  category: string;
  evidence?: string[];
  summary: string;
  title: string;
  tone: string;
}

export type UserFacingDecisionReviewInsightTone =
  | "danger"
  | "info"
  | "success"
  | "warning";

export interface UserFacingDecisionReviewInsight {
  category: string;
  canDrivePrimaryConclusion: boolean;
  canShowPrimary: boolean;
  detail: string;
  evidence: string[];
  evidenceChannel: MappedUserFacingBehavior["evidenceChannel"];
  hiddenReason: string | null;
  label: string;
  opportunityType: MappedUserFacingBehavior["opportunityType"];
  reviewAction: string;
  sourceInsightId: string;
  state: UserFacingBehaviorState;
  tone: UserFacingDecisionReviewInsightTone;
}

function toneForMappedBehavior(
  mapped: Pick<MappedUserFacingBehavior, "opportunityType" | "tone">,
): UserFacingDecisionReviewInsightTone {
  if (mapped.opportunityType === "strength_to_repeat" || mapped.tone === "strength") {
    return "success";
  }

  if (mapped.opportunityType === "risk_to_reduce" || mapped.tone === "risk") {
    return "danger";
  }

  if (mapped.opportunityType === "review_prompt" || mapped.tone === "warning") {
    return "warning";
  }

  return "info";
}

export function mapDecisionReviewInsightForUser(
  input: DecisionReviewInsightForUserInput,
  route: UserFacingBehaviorRoute | string,
): UserFacingDecisionReviewInsight {
  const mapped = mapUserFacingBehavior({
    behaviorId: input.id,
    rawLabel: input.title,
    route,
  });

  if (!mapped.contractFound) {
    return {
      category: input.category,
      canDrivePrimaryConclusion: false,
      canShowPrimary: false,
      detail:
        "This chart note is kept out of normal coaching until it has a user-facing evidence contract.",
      evidence: input.evidence ?? [],
      evidenceChannel: mapped.evidenceChannel,
      hiddenReason: mapped.missingDataSentence,
      label: mapped.label,
      opportunityType: "internal_only",
      reviewAction:
        "Use the execution replay now and keep this raw chart note in advanced details.",
      sourceInsightId: input.id,
      state: "internal_only",
      tone: "info",
    };
  }

  const canShowPrimary = mapped.state !== "internal_only";
  const isReviewPrompt = mapped.state === "review_prompt";

  return {
    category: input.category,
    canDrivePrimaryConclusion: mapped.canDrivePrimaryConclusion,
    canShowPrimary,
    detail: isReviewPrompt ? mapped.unsupportedFallback : mapped.plainExplanation,
    evidence: input.evidence ?? [],
    evidenceChannel: mapped.evidenceChannel,
    hiddenReason: canShowPrimary ? null : mapped.missingDataSentence,
    label: mapped.label,
    opportunityType: mapped.opportunityType,
    reviewAction: isReviewPrompt ? mapped.unsupportedFallback : mapped.fixFirstAction,
    sourceInsightId: input.id,
    state: mapped.state,
    tone: toneForMappedBehavior(mapped),
  };
}
