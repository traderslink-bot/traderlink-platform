export type JournalRuleLifecycleState = "active" | "paused" | "retired";
export type JournalRuleReviewStatus = "followed" | "broken" | "not_reviewed";
export type JournalRuleReviewScope = "day" | "trade" | "both";

export type JournalRuleRecord = Readonly<{
  ruleId: string;
  sourceKind: "template" | "custom";
  templateKey: string | null;
  title: string;
  statement: string;
  category: string;
  reviewScope: JournalRuleReviewScope;
  isFocus: boolean;
  configuration: Readonly<Record<string, string>>;
  lifecycleState: JournalRuleLifecycleState;
  versionNumber: number;
  versionId: string;
  revision: number;
  effectiveFromUtc: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type JournalRuleReviewRecord = Readonly<{
  ruleReviewId: string;
  ruleId: string;
  ruleVersionId: string;
  targetKind: "trading_day" | "round_trip";
  tradingDayId: string | null;
  roundTripId: string | null;
  status: JournalRuleReviewStatus;
  revision: number;
  updatedAtUtc: string;
}>;

export type JournalTagRecord = Readonly<{
  tagId: string;
  name: string;
  lifecycleState: "active" | "retired";
  revision: number;
  assignmentCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type JournalDailyNoteRecord = Readonly<{
  dailyNoteId: string;
  tradingDayId: string;
  revision: number;
  whatWorked: string;
  whatNeedsWork: string;
  technicalRecap: string;
  tomorrowsFocus: string;
  anythingElse: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type JournalRoundTripNoteRecord = Readonly<{
  roundTripNoteId: string;
  roundTripId: string;
  revision: number;
  technicalNote: string;
  tradeNote: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type JournalAnnotationReadModel = Readonly<{
  tags: readonly JournalTagRecord[];
  rules: readonly JournalRuleRecord[];
  ruleReviews: readonly JournalRuleReviewRecord[];
  tagsByRoundTripId: Readonly<Record<string, readonly JournalTagRecord[]>>;
  dailyNote: JournalDailyNoteRecord | null;
  roundTripNotes: Readonly<Record<string, JournalRoundTripNoteRecord>>;
}>;
