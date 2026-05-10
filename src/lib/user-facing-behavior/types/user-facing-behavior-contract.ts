export type UserFacingBehaviorState =
  | "certified_detection"
  | "review_prompt"
  | "internal_only";

export type UserFacingBehaviorTone =
  | "risk"
  | "strength"
  | "neutral"
  | "warning";

export type UserFacingBehaviorOpportunityType =
  | "risk_to_reduce"
  | "strength_to_repeat"
  | "review_prompt"
  | "internal_only";

export type UserFacingBehaviorEvidenceChannel =
  | "execution_only"
  | "market_context"
  | "combined";

export type UserFacingBehaviorRoute =
  | "/coach"
  | "/analytics"
  | "/review"
  | "/progress"
  | "/trades"
  | "/trades/[tradeId]"
  | "advanced";

export interface UserFacingBehaviorContract {
  advancedHowDetected: string;
  aliases?: readonly string[];
  behaviorId: string;
  confidenceRules: readonly string[];
  copySafetyNotes: readonly string[];
  evidenceChannel: UserFacingBehaviorEvidenceChannel;
  evidenceSentence: string;
  fixFirstAction: string;
  missingDataSentence: string;
  negativeGuards: readonly string[];
  optionalEvidence: readonly string[];
  opportunityType: UserFacingBehaviorOpportunityType;
  plainExplanation: string;
  requiredEvidence: readonly string[];
  routesAllowed: readonly UserFacingBehaviorRoute[];
  state: UserFacingBehaviorState;
  testCases: readonly string[];
  tone: UserFacingBehaviorTone;
  triggerRules: readonly string[];
  unsupportedFallback: string;
  userFacingLabel: string;
}

export interface MapUserFacingBehaviorInput {
  behaviorId?: string | null;
  rawLabel?: string | null;
  route?: UserFacingBehaviorRoute | string | null;
}

export interface MappedUserFacingBehavior {
  advancedHowDetected: string;
  behaviorId: string;
  canDrivePrimaryConclusion: boolean;
  contractFound: boolean;
  copySafetyNotes: readonly string[];
  evidenceChannel: UserFacingBehaviorEvidenceChannel;
  evidenceSentence: string;
  fixFirstAction: string;
  label: string;
  missingDataSentence: string;
  opportunityType: UserFacingBehaviorOpportunityType;
  originalBehaviorId: string | null;
  originalLabel: string | null;
  plainExplanation: string;
  routesAllowed: readonly UserFacingBehaviorRoute[];
  state: UserFacingBehaviorState;
  tone: UserFacingBehaviorTone;
  unsupportedFallback: string;
}
