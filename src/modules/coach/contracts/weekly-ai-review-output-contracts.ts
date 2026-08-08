export const COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION =
  "traderlink_coach_weekly_ai_output_v1" as const;

export type CoachWeeklyAiReviewOutput = Readonly<{
  contractVersion: typeof COACH_WEEKLY_AI_OUTPUT_CONTRACT_VERSION;
  weeklyReview: string;
  whatImproved: string;
  whatHeldYouBack: string;
  focusFollowThrough: string;
  nextWeekFocuses: readonly string[];
  incompleteRecord: string | null;
}>;

export const COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION =
  "traderlink_coach_periodic_ai_review_output_v2" as const;

export type CoachPeriodicAiReviewOutputV2 = Readonly<{
  contractVersion: typeof COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION;
  reviewSummary: string;
  whatImproved: string;
  whatHeldYouBack: string;
  focusFollowThrough: string;
  nextPeriodFocuses: readonly string[];
  incompleteRecord: string | null;
}>;
