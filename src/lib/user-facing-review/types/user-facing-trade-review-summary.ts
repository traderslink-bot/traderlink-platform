import type { PatternScoringConfidence } from "../../pattern-scoring/types/pattern-scoring-result";

export type UserFacingReviewGradeLabel =
  | "A"
  | "B"
  | "C"
  | "D"
  | "F"
  | "Needs more data";

export type UserFacingReviewOutcomeLabel =
  | "Strong"
  | "Mixed"
  | "Weak"
  | "Inconclusive";

export type UserFacingInsightType =
  | "mistake"
  | "strength"
  | "mixed"
  | "inconclusive";

export type UserFacingConfidenceLabel =
  | "High"
  | "Moderate"
  | "Low"
  | "Needs more data";

export interface UserFacingPrimaryInsight {
  type: UserFacingInsightType;
  title: string;
  plainEnglishSummary: string;
  whyItMatters: string;
  fixFirst: string;
  confidenceLabel: UserFacingConfidenceLabel;
  confidenceExplanation: string;
}

export interface UserFacingSecondaryInsight {
  title: string;
  summary: string;
  priority: "high" | "medium" | "low";
}

export interface UserFacingTimelineEvidence {
  label: string;
  explanation: string;
  timestamp?: string;
  price?: number;
}

export interface UserFacingEducationLink {
  term: string;
  shortDefinition: string;
  anchorId: string;
}

export interface UserFacingAdvancedDetails {
  patternIds: string[];
  dominantFamily: string | null;
  scoreBand: string | null;
  suppressedBehaviorIds: string[];
  rawConfidence: PatternScoringConfidence | "needs_more_data";
}

export interface UserFacingTradeReviewSummary {
  tradeId: string;
  symbol: string;
  sessionLabel: string;
  sideLabel: string;
  resultLabel: string;
  grossPnlLabel: string;
  reviewTitle: string;
  gradeLabel: UserFacingReviewGradeLabel;
  outcomeLabel: UserFacingReviewOutcomeLabel;
  primaryInsight: UserFacingPrimaryInsight;
  secondaryInsights: UserFacingSecondaryInsight[];
  timelineEvidence: UserFacingTimelineEvidence[];
  educationLinks: UserFacingEducationLink[];
  advancedDetails: UserFacingAdvancedDetails;
}
