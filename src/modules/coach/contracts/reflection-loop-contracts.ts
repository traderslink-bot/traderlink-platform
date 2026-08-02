export const COACH_REFLECTION_CONTRACT_VERSION =
  "traderlink_coach_reflection_v1" as const;

export type CoachReflectionPeriod = "daily" | "weekly" | "monthly";

export type CoachReflectionRuleReviewCounts = Readonly<{
  followed: number;
  broken: number;
  notReviewed: number;
}>;

export type CoachReflectionTrade = Readonly<{
  roundTripId: string;
  symbol: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string;
  netPnlDecimal: string | null;
  noteSaved: boolean;
  tagNames: readonly string[];
  ruleReviews: CoachReflectionRuleReviewCounts;
}>;

export type CoachReflectionDay = Readonly<{
  date: string;
  currency: string;
  netPnlDecimal: string | null;
  tradeCount: number;
  dailyNoteSaved: boolean;
  ruleReviews: CoachReflectionRuleReviewCounts;
  trades: readonly CoachReflectionTrade[];
}>;

export type CoachReflectionPrompt = Readonly<{
  code:
    | "resolve_data_decisions"
    | "review_trading_days"
    | "review_round_trips"
    | "review_trading_rules"
    | "choose_focus_rule";
  title: string;
  description: string;
  href: string;
  count: number;
}>;

export type CoachReflectionReadModel = Readonly<{
  contractVersion: typeof COACH_REFLECTION_CONTRACT_VERSION;
  source: "journal_facts";
  state: "ready" | "empty";
  period: CoachReflectionPeriod;
  anchorDate: string;
  startDate: string;
  endDate: string;
  timezone: string | null;
  currency: string | null;
  availableCurrencies: readonly string[];
  summary: Readonly<{
    tradingDayCount: number;
    readyClosedTradeCount: number;
    netPnlDecimal: string | null;
    winRatePercentDecimal: string | null;
    dailyNotesSavedCount: number;
    roundTripNotesSavedCount: number;
    taggedTradeCount: number;
    ruleReviews: CoachReflectionRuleReviewCounts;
    activeRuleCount: number;
    focusRuleCount: number;
    accountPendingDataDecisionCount: number;
  }>;
  coverage: Readonly<{
    readyClosedCount: number;
    legitimateOpenCount: number;
    needsDecisionCount: number;
    feeCompleteCount: number;
    feeIncompleteCount: number;
    limitationReasonCodes: readonly string[];
    factSetRevisionSha256: string | null;
  }>;
  focusRules: readonly Readonly<{
    ruleId: string;
    title: string;
    statement: string;
    reviewScope: "day" | "trade" | "both";
  }>[];
  prompts: readonly CoachReflectionPrompt[];
  days: readonly CoachReflectionDay[];
}>;
