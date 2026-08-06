export const COACH_AI_CHAT_SNAPSHOT_CONTRACT_VERSION =
  "traderlink_coach_ai_chat_snapshot_v1" as const;

export type CoachAiChatGenerationUsage = Readonly<{
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}>;

export type CoachAiChatGenerationReceiptInput = Readonly<{
  providerKey: "openai_direct";
  modelId: string;
  usage: CoachAiChatGenerationUsage;
  inputCostUsdPerMillionTokens: string | null;
  outputCostUsdPerMillionTokens: string | null;
}>;

export type CoachAiChatGenerationReceipt = Readonly<{
  receiptId: string;
  providerKey: "openai_direct";
  modelId: string;
  usage: CoachAiChatGenerationUsage;
  inputCostUsdPerMillionTokens: string | null;
  outputCostUsdPerMillionTokens: string | null;
  estimatedCostUsd: string | null;
  recordedAtUtc: string;
}>;

export type CoachAiChatConversation = Readonly<{
  conversationId: string;
  title: string;
  state: "active" | "archived";
  createdAtUtc: string;
  updatedAtUtc: string;
  archivedAtUtc: string | null;
}>;

export type CoachAiChatMessage = Readonly<{
  messageId: string;
  sequence: number;
  role: "user" | "assistant";
  originalUserTextPrivate: string | null;
  normalizedUserTextPrivate: string | null;
  structuredInterpretationJson: string | null;
  assistantTextPrivate: string | null;
  generationState: "not_applicable" | "pending" | "completed" | "failed";
  failureCode: string | null;
  createdAtUtc: string;
  finalizedAtUtc: string | null;
}>;

export type CoachAiChatConversationPage = Readonly<{
  conversations: readonly CoachAiChatConversation[];
  nextCursor: CoachAiChatConversationCursor | null;
}>;

export type CoachAiChatConversationCursor = Readonly<{
  updatedAtUtc: string;
  conversationId: string;
}>;

export type CoachAiChatMessageCursor = Readonly<{
  beforeSequence: number;
}>;

export type CoachAiChatMessagePage = Readonly<{
  messages: readonly CoachAiChatMessage[];
  nextCursor: CoachAiChatMessageCursor | null;
}>;

export type CoachAiChatReservedGeneration = Readonly<{
  userMessage: CoachAiChatMessage;
  assistantMessage: CoachAiChatMessage;
}>;
