export const COACH_AI_CHAT_ACTION_DRAFT_CONTRACT_VERSION =
  "traderlink_coach_ai_chat_action_draft_v1" as const;

export type CoachAiChatActionDraftExtraction =
  | Readonly<{
      kind: "reporting_currency";
      reportingCurrency: string;
    }>
  | Readonly<{
      kind: "mark_notification_read";
      notificationRef: string;
    }>
  | Readonly<{
      kind: "select_journal_account";
      accountDisplayName: string;
    }>;

export type CoachAiChatActionDraftPreview =
  | Readonly<{
      kind: "reporting_currency";
      title: "Change reporting currency";
      currentReportingCurrency: string;
      proposedReportingCurrency: string;
    }>
  | Readonly<{
      kind: "mark_notification_read";
      title: "Mark notification as read";
      notificationTitle: string;
      notificationSummary: string;
      occurredAtUtc: string;
    }>
  | Readonly<{
      kind: "select_journal_account";
      title: "Switch Journal account";
      currentAccountDisplayName: string;
      proposedAccountDisplayName: string;
    }>;

export type CoachAiChatActionDraft = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_ACTION_DRAFT_CONTRACT_VERSION;
  draftId: string;
  conversationId: string;
  sourceMessageId: string;
  preview: CoachAiChatActionDraftPreview;
  disposition: "proposed" | "confirmed" | "rejected" | "expired";
  writeState: "not_written" | "commit_pending" | "committed";
  createdAtUtc: string;
  expiresAtUtc: string;
  finalizedAtUtc: string | null;
}>;
