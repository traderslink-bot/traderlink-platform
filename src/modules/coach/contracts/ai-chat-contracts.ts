import type { CoachAiManualExecutionExtraction } from "./ai-manual-entry-draft-contracts";
import type { CoachAiDailyCompanionDraftExtraction } from "./ai-daily-companion-contracts";
import type { CoachAiReviewDeliveryChangeExtraction } from "./ai-review-delivery-change-contracts";

export const COACH_AI_CHAT_SNAPSHOT_CONTRACT_VERSION =
  "traderlink_coach_ai_chat_snapshot_v1" as const;

export const COACH_AI_CHAT_ANSWER_CONTRACT_VERSION =
  "traderlink_coach_ai_chat_answer_v1" as const;

/** The stored answer shape. UI code renders these fields without exposing runtime labels. */
export type CoachAiChatAnswer = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_ANSWER_CONTRACT_VERSION;
  directAnswer: string;
  supportingObservations: readonly string[];
  limitation: string | null;
  nextQuestion: string | null;
  evidenceReferences: readonly Readonly<{
    toolCallId: string;
    statement: string;
  }>[];
}>;

export type CoachAiChatFactualToolCallSnapshot = Readonly<{
  toolCallId: string;
  toolName: string;
  request: unknown;
  result: unknown;
  serializedResultBytes: number;
}>;

export type CoachAiChatGenerationResult = Readonly<{
  answer: CoachAiChatAnswer;
  usage: CoachAiChatGenerationUsage;
  factualToolCalls: readonly CoachAiChatFactualToolCallSnapshot[];
  manualEntryExtraction: CoachAiManualExecutionExtraction | null;
  dailyCompanionDraftExtraction: CoachAiDailyCompanionDraftExtraction | null;
  reviewDeliveryChangeExtraction: CoachAiReviewDeliveryChangeExtraction | null;
}>;

export type CoachAiChatMessageIntent =
  | "answer_question"
  | "prepare_manual_execution_draft";

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

export type CoachAiChatGenerationPair = Readonly<{
  userMessage: CoachAiChatMessage;
  assistantMessage: CoachAiChatMessage;
}>;
