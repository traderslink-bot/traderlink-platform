import type { CoachReflectionRuleReviewCounts } from "./reflection-loop-contracts";

export const COACH_MONTHLY_AI_INPUT_CONTRACT_VERSION =
  "traderlink_coach_monthly_ai_input_v1" as const;

export type CoachMonthlyAiReviewPeriod = Readonly<{
  startDate: string;
  endDate: string;
  periodCoverage: "complete_month" | "partial_month";
}>;

export type CoachMonthlyAiReviewInput = Readonly<{
  contractVersion: typeof COACH_MONTHLY_AI_INPUT_CONTRACT_VERSION;
  month: Readonly<{
    startDate: string;
    endDate: string;
    periodCoverage: "complete_month" | "partial_month";
    timezone: string | null;
    currency: string | null;
  }>;
  coverage: Readonly<{
    periodReadyClosedCount: number;
    accountLegitimateOpenCount: number;
    accountNeedsDecisionCount: number;
    accountPendingDataDecisionCount: number;
  }>;
  summary: Readonly<{
    tradingDayCount: number;
    readyClosedTradeCount: number;
    netPnlDecimal: string | null;
    winRatePercentDecimal: string | null;
  }>;
  priorMonthlyReview: Readonly<{
    monthStartDate: string;
    monthEndDate: string;
    monthlyReview: string;
    progressAcrossMonth: string;
    recurringFriction: string;
    focusFollowThrough: string;
    nextMonthFocuses: readonly string[];
    incompleteRecord: string | null;
  }> | null;
  issuedWeeklyReviews: readonly Readonly<{
    weekStartDate: string;
    weekEndDate: string;
    weeklyReview: string;
    whatImproved: string;
    whatHeldYouBack: string;
    focusFollowThrough: string;
    nextWeekFocuses: readonly string[];
    incompleteRecord: string | null;
  }>[];
  currentFocuses: readonly Readonly<{
    effectiveFromDate: string;
    tradingDate: string;
    revisionNumber: number;
    text: string;
  }>[];
  days: readonly Readonly<{
    date: string;
    reviewed: boolean;
    netPnlDecimal: string | null;
    ruleReviews: CoachReflectionRuleReviewCounts;
    notes: Readonly<{
      whatWorked: string;
      whatNeedsWork: string;
      technicalRecap: string;
      anythingElse: string;
    }> | null;
    trades: readonly Readonly<{
      ticker: string;
      direction: "long" | "short";
      openedAtUtc: string;
      closedAtUtc: string;
      executionCount: number | null;
      realizedGrossPnlDecimal: string | null;
      holdingDurationMilliseconds: number | null;
      tradingSession: "premarket" | "regular" | "after_hours" | null;
      netPnlDecimal: string | null;
      ruleReviews: CoachReflectionRuleReviewCounts;
      note: string | null;
      tags: readonly string[];
    }>[];
  }>[];
}>;
