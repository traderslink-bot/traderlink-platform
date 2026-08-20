import type { CoachAiChatAnalysisScope } from "./ai-chat-contracts";
import type { CoachAiChatPageFeature } from "./ai-chat-page-context-contracts";

export const COACH_AI_CHAT_CONVERSATION_STATE_CONTRACT_VERSION =
  "traderlink_coach_ai_chat_conversation_state_v1" as const;

export type CoachAiChatConversationDraftKind =
  | "manual_execution"
  | "daily_note"
  | "review_delivery"
  | "account_action";

export type CoachAiChatConversationState = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_CONVERSATION_STATE_CONTRACT_VERSION;
  stateSequence: number;
  activeQuestion: string;
  analysisScope: CoachAiChatAnalysisScope;
  currentPageHint: Readonly<{
    feature: CoachAiChatPageFeature;
    featureLabel: string;
    tradingDate: string | null;
  }> | null;
  unresolvedQuestions: readonly string[];
  conversationNotes: readonly string[];
  pendingDrafts: readonly Readonly<{
    kind: CoachAiChatConversationDraftKind;
    opaqueRef: string;
    state: string;
  }>[];
  olderContextSummary: string | null;
  summarizedThroughSequence: number;
  sourceMessageSequenceThrough: number;
}>;
