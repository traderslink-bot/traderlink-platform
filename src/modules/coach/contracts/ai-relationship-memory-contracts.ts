export const COACH_AI_RELATIONSHIP_MEMORY_CATEGORIES = Object.freeze([
  "preferred_name",
  "experience",
  "trading_approach",
  "markets_products",
  "setups",
  "current_focus",
  "emotional_pattern",
  "routine",
  "learning_goal",
  "preference",
  "other",
] as const);

export type CoachAiRelationshipMemoryCategory =
  (typeof COACH_AI_RELATIONSHIP_MEMORY_CATEGORIES)[number];

export const COACH_AI_RELATIONSHIP_MEMORY_SOURCE_KINDS = Object.freeze([
  "meet_links",
  "direct_request",
  "approved_suggestion",
  "memory_surface",
  "user_edit",
  "reconfirmation",
] as const);

export type CoachAiRelationshipMemorySourceKind =
  (typeof COACH_AI_RELATIONSHIP_MEMORY_SOURCE_KINDS)[number];

export type CoachAiRelationshipMemoryScope =
  | Readonly<{ kind: "user" }>
  | Readonly<{ kind: "account"; accountId: string }>;

export type CoachAiRelationshipMemory = Readonly<{
  memoryId: string;
  scope: CoachAiRelationshipMemoryScope;
  scopeLabel: string;
  category: CoachAiRelationshipMemoryCategory;
  text: string;
  versionSequence: number;
  sourceKind: CoachAiRelationshipMemorySourceKind;
  sourceConversationId: string | null;
  sourceConversationTitle: string | null;
  rememberedAtUtc: string;
  reviewDueAtUtc: string | null;
  needsReview: boolean;
  updatedAtUtc: string;
}>;

export type CoachAiRelationshipMemorySettings = Readonly<{
  enabled: boolean;
  meetLinksState: "not_started" | "completed" | "skipped";
  meetLinksCompletedAtUtc: string | null;
}>;

export type CoachAiRelationshipMemoryView = Readonly<{
  settings: CoachAiRelationshipMemorySettings;
  currentAccount: Readonly<{ accountId: string; displayName: string }>;
  memories: readonly CoachAiRelationshipMemory[];
}>;

export type CoachAiRelationshipMemoryWrite = Readonly<{
  scope: CoachAiRelationshipMemoryScope;
  category: CoachAiRelationshipMemoryCategory;
  text: string;
  sourceKind: CoachAiRelationshipMemorySourceKind;
  sourceConversationId?: string | null;
  sourceMessageId?: string | null;
  reviewDueAtUtc?: string | null;
}>;

export type CoachAiMeetLinksMemory = Readonly<{
  scope: CoachAiRelationshipMemoryScope;
  category: CoachAiRelationshipMemoryCategory;
  text: string;
  reviewDueAtUtc?: string | null;
}>;
