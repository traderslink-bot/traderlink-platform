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
    pendingDataDecisionCount: number;
  }>;
  summary: Readonly<{
    tradingDayCount: number;
    readyClosedTradeCount: number;
    netPnlDecimal: string | null;
    winRatePercentDecimal: string | null;
  }>;
  currentFocuses: readonly Readonly<{
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
      netPnlDecimal: string | null;
      ruleReviews: CoachReflectionRuleReviewCounts;
      note: string | null;
    }>[];
  }>[];
}>;
