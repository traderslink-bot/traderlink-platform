export const COACH_AI_DAILY_COMPANION_CONTEXT_VERSION =
  "traderlink_coach_ai_daily_companion_context_v1" as const;

export type CoachAiDailyCompanionContextSelector = Readonly<{
  kind: "daily_review";
  tradingDate: string;
  currency: string;
}>;

export type CoachAiDailyCompanionRule = Readonly<{
  title: string;
  status: "followed" | "broken" | "not_reviewed" | "n_a";
}>;

export type CoachAiDailyCompanionContext = Readonly<{
  contractVersion: typeof COACH_AI_DAILY_COMPANION_CONTEXT_VERSION;
  kind: "daily_review";
  tradingDate: string;
  timezone: string;
  currency: string;
  factSetRevisionSha256: string;
  dayResult: Readonly<{
    netPnlDecimal: string | null;
    tradeCount: number;
    tickerCount: number;
  }>;
  review: Readonly<{
    status: "reviewed" | "incomplete" | "not_started";
  }>;
  dailyNotes: Readonly<{
    whatWorked: string;
    whatNeedsWork: string;
    technicalRecap: string;
    currentFocuses: string;
    anythingElse: string;
  }>;
  focusRevisions: readonly Readonly<{
    tradingDate: string;
    currentFocuses: string;
  }>[];
  dayRules: readonly CoachAiDailyCompanionRule[];
  trades: readonly Readonly<{
    tradeNumber: number;
    ticker: string;
    direction: "long" | "short";
    entryAtUtc: string;
    exitAtUtc: string;
    netPnlDecimal: string | null;
    gainLossPercentDecimal: string | null;
    tradeNote: string;
    tags: readonly string[];
    rules: readonly CoachAiDailyCompanionRule[];
  }>[];
  openPositions: readonly Readonly<{
    ticker: string;
    direction: "long" | "short";
    openedAtUtc: string;
    remainingQuantityDecimal: string;
    savedClassification: "swing" | "long_term" | "bag_hold" | "unclassified";
  }>[];
  coverage: Readonly<{
    needsDecisionCount: number;
    contextTruncated: boolean;
    limitations: readonly string[];
  }>;
}>;

export type CoachAiChatTrustedContext = CoachAiDailyCompanionContext;
