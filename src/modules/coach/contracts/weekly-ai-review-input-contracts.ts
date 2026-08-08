import type { CoachReflectionRuleReviewCounts } from "./reflection-loop-contracts";

export const COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION =
  "traderlink_coach_weekly_ai_input_v1" as const;

export type CoachWeeklyAiReviewInput = Readonly<{
  contractVersion: typeof COACH_WEEKLY_AI_INPUT_CONTRACT_VERSION;
  week: Readonly<{
    startDate: string;
    endDate: string;
    timezone: string | null;
    currency: string | null;
  }>;
  coverage: Readonly<{
    weekReadyClosedCount: number;
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
  priorReview: Readonly<{
    weekStartDate: string;
    weekEndDate: string;
    weeklyReview: string;
    whatImproved: string;
    whatHeldYouBack: string;
    focusFollowThrough: string;
    nextWeekFocuses: readonly string[];
    incompleteRecord: string | null;
  }> | null;
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

export const COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION =
  "traderlink_coach_periodic_ai_review_input_v2" as const;

export type CoachAiReviewCadenceV2 = "weekly" | "two_week";

export type CoachAiReviewRuleCountsV2 = Readonly<{
  followed: number;
  broken: number;
  notReviewed: number;
}>;

export type CoachAiReviewTradeMarketFactV2 = Readonly<{
  ticker: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string;
  executionCount: number | null;
  realizedGrossPnlDecimal: string | null;
  netPnlDecimal: string | null;
  holdingDurationMilliseconds: number | null;
  tradingSession: "premarket" | "regular" | "after_hours" | null;
  ruleReviews: CoachAiReviewRuleCountsV2;
  tags: readonly string[];
}>;

export type CoachAiReviewDayMarketFactsV2 = Readonly<{
  reviewMarketDate: string;
  marketSessionState: "open" | "closed";
  marketSessionKind: "normal" | "scheduled_early_close" | "weekend" | "holiday";
  readyClosedTradeCount: number;
  netPnlDecimal: string | null;
  ruleReviews: CoachAiReviewRuleCountsV2;
  trades: readonly CoachAiReviewTradeMarketFactV2[];
}>;

export type CoachAiReviewDailyReflectionV2 = Readonly<{
  evidenceRef: string;
  reviewMarketDate: string;
  reviewedStatusRevision: number;
  dailyNotes: Readonly<{
    whatWorked: string;
    whatNeedsWork: string;
    technicalRecap: string;
    anythingElse: string;
  }> | null;
  tradeNotes: readonly Readonly<{
    ticker: string;
    note: string;
  }>[];
}>;

export type CoachAiReviewPriorIssuedReviewV2 = Readonly<{
  reviewRef: string;
  cadence: CoachAiReviewCadenceV2;
  periodStartDate: string;
  periodEndDate: string;
  reviewSummary: string;
  whatImproved: string;
  whatHeldYouBack: string;
  focusFollowThrough: string;
  nextPeriodFocuses: readonly string[];
  incompleteRecord: string | null;
  representedEvidenceRefs: readonly string[];
}>;

export type CoachAiReviewCarryForwardEvidenceBundleV2 = Readonly<{
  evidenceRef: string;
  sourcePeriodStartDate: string;
  sourcePeriodEndDate: string;
  destinationPeriodStartDate: string;
  destinationPeriodEndDate: string;
  reflection: CoachAiReviewDailyReflectionV2;
  representedByPriorReviewRef: string | null;
  evidenceWeight: "single_observation";
  statisticalUse: "prohibited";
}>;

export type CoachPeriodicAiReviewInputV2 = Readonly<{
  contractVersion: typeof COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION;
  period: Readonly<{
    cadence: CoachAiReviewCadenceV2;
    startDate: string;
    endDate: string;
    calendarTimezone: "America/New_York";
    currency: string | null;
    calendarId: string;
    calendarEvidenceDigestSha256: string;
    cohorts: readonly Readonly<{
      mondayDate: string;
      fridayDate: string;
      openSessionDates: readonly string[];
      finalOpenSessionDate: string;
      sealedAtUtc: string;
    }>[];
  }>;
  reviewPeriodMarketFacts: Readonly<{
    tradingDayCount: number;
    readyClosedTradeCount: number;
    netPnlDecimal: string | null;
    winRatePercentDecimal: string | null;
    accountLegitimateOpenCount: number;
    accountNeedsDecisionCount: number;
    accountPendingDataDecisionCount: number;
    days: readonly CoachAiReviewDayMarketFactsV2[];
  }>;
  completedDailyReflections: readonly CoachAiReviewDailyReflectionV2[];
  reflectionCoverage: readonly Readonly<{
    reviewMarketDate: string;
    marketSessionState: "open" | "closed";
    reflectionState: "completed" | "incomplete" | "not_created" | "market_closed";
    noTradeReview: boolean | null;
  }>[];
  carryForwardEvidenceBundles: readonly CoachAiReviewCarryForwardEvidenceBundleV2[];
  priorIssuedReview: CoachAiReviewPriorIssuedReviewV2 | null;
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
