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

export type CoachAiDailyNoteDraftField =
  | "whatWorked"
  | "whatNeedsWork"
  | "technicalRecap"
  | "anythingElse";

export type CoachAiDailyCompanionDraftExtraction =
  | Readonly<{
      kind: "daily_note_draft";
      updates: readonly Readonly<{
        field: CoachAiDailyNoteDraftField;
        content: string;
      }>[];
    }>
  | Readonly<{
      kind: "trade_note_draft";
      tradeNumber: number;
      content: string;
    }>
  | Readonly<{
      kind: "current_focus_draft";
      currentFocuses: string;
    }>;

export type CoachAiDailyCompanionDraftProposal =
  | Readonly<{
      kind: "daily_note_draft";
      updates: readonly Readonly<{
        field: CoachAiDailyNoteDraftField;
        content: string;
      }>[];
    }>
  | Readonly<{
      kind: "trade_note_draft";
      tradeNumber: number;
      ticker: string;
      direction: "long" | "short";
      content: string;
    }>
  | Readonly<{
      kind: "current_focus_draft";
      currentFocuses: string;
    }>;

export type CoachAiDailyCompanionDraft = Readonly<{
  interactionId: string;
  conversationId: string;
  sourceMessageId: string;
  tradingDate: string;
  proposal: CoachAiDailyCompanionDraftProposal;
  disposition: "proposed" | "accepted" | "rejected" | "expired";
  journalWriteState: "not_written" | "commit_pending" | "committed" | "write_failed";
  createdAtUtc: string;
  resolvedAtUtc: string | null;
}>;

/** Server-only target information. It is never included in the provider prompt or API view. */
export type CoachAiDailyCompanionResolvedContext = Readonly<{
  context: CoachAiDailyCompanionContext;
  dailyNoteRevision: number | null;
  trades: readonly Readonly<{
    tradeNumber: number;
    roundTripId: string;
    noteRevision: number | null;
    ticker: string;
    direction: "long" | "short";
  }>[];
}>;
