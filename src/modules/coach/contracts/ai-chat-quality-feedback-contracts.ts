export type CoachAiChatQualityEventKind =
  | "trader_flagged"
  | "automatic_failure"
  | "automatic_unavailable";

export type CoachAiChatQualityCaseState = "open" | "resolved" | "dismissed";

export type CoachAiChatQualityContextMessage = Readonly<{
  messageId: string;
  role: "user" | "assistant";
  text: string | null;
  generationState: "not_applicable" | "pending" | "completed" | "failed";
  createdAtUtc: string;
}>;

export type CoachAiChatQualityCase = Readonly<{
  caseId: string;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  state: CoachAiChatQualityCaseState;
  context: readonly CoachAiChatQualityContextMessage[];
  eventKinds: readonly CoachAiChatQualityEventKind[];
  failureCode: string | null;
  createdAtUtc: string;
}>;
