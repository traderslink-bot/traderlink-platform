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
