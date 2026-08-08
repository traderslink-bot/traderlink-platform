import type { CoachReflectionRuleReviewCounts } from "./reflection-loop-contracts";
import type {
  CoachAiReviewDailyReflectionV2,
  CoachAiReviewDayMarketFactsV2,
} from "./weekly-ai-review-input-contracts";

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

export const COACH_MONTHLY_AI_REVIEW_INPUT_CONTRACT_VERSION_V2 =
  "traderlink_coach_monthly_ai_review_input_v2" as const;

export type CoachMonthlyAiReviewInputV2 = Readonly<{
  contractVersion: typeof COACH_MONTHLY_AI_REVIEW_INPUT_CONTRACT_VERSION_V2;
  calendarMonth: Readonly<{
    calendarMonthStartDate: string;
    calendarMonthEndDate: string;
    coverageStartDate: string;
    coverageEndDate: string;
    periodCoverage: "complete_month" | "partial_month";
    calendarTimezone: "America/New_York";
    currency: string | null;
    calendarId: string;
    calendarEvidenceDigestSha256: string;
    scheduledAtUtc: string;
  }>;
  calendarMonthFacts: Readonly<{
    tradingDayCount: number;
    readyClosedTradeCount: number;
    netPnlDecimal: string | null;
    winRatePercentDecimal: string | null;
    accountLegitimateOpenCount: number;
    accountNeedsDecisionCount: number;
    accountPendingDataDecisionCount: number;
    days: readonly CoachAiReviewDayMarketFactsV2[];
  }>;
  reviewNarrativeContext: readonly Readonly<{
    reviewRef: string;
    reviewKind: "weekly" | "two_week";
    periodStartDate: string;
    periodEndDate: string;
    narrativeOwnerMonth: string;
    representedEvidenceRefs: readonly string[];
    statisticalUse: "prohibited";
    reviewSummary: string;
    whatImproved: string;
    whatHeldYouBack: string;
    focusFollowThrough: string;
    nextPeriodFocuses: readonly string[];
    incompleteRecord: string | null;
  }>[];
  rawReflectionContext: readonly Readonly<{
    reflection: CoachAiReviewDailyReflectionV2;
    sourcePeriodStartDate: string;
    sourcePeriodEndDate: string;
    narrativeOwnerMonth: string;
    contextKind: "current_month_raw" | "terminal_carry_forward";
    statisticalUse: "prohibited";
  }>[];
  reflectionCoverage: readonly Readonly<{
    reviewMarketDate: string;
    marketSessionState: "open" | "closed";
    reflectionState: "completed" | "incomplete" | "not_created" | "market_closed";
    noTradeReview: boolean | null;
  }>[];
  priorMonthlyReview: Readonly<{
    reviewRef: string;
    calendarMonthStartDate: string;
    calendarMonthEndDate: string;
    reviewSummary: string;
    whatImproved: string;
    whatHeldYouBack: string;
    focusFollowThrough: string;
    nextPeriodFocuses: readonly string[];
    incompleteRecord: string | null;
  }> | null;
  currentFocuses: readonly Readonly<{
    effectiveFromDate: string;
    tradingDate: string;
    revisionNumber: number;
    text: string;
  }>[];
  coverageNotice: Readonly<{
    limitationReasonCodes: readonly string[];
    incompleteRecordRequired: boolean;
  }>;
}>;
