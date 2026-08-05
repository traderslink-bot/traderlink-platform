export const COACH_MONTHLY_AI_OUTPUT_CONTRACT_VERSION =
  "traderlink_coach_monthly_ai_output_v1" as const;

export type CoachMonthlyAiReviewOutput = Readonly<{
  contractVersion: typeof COACH_MONTHLY_AI_OUTPUT_CONTRACT_VERSION;
  monthlyReview: string;
  progressAcrossMonth: string;
  recurringFriction: string;
  focusFollowThrough: string;
  nextMonthFocuses: readonly string[];
  incompleteRecord: string | null;
}>;
