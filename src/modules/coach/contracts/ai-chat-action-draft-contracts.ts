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
    }>
  | Readonly<{
      kind: "notification_preferences";
      discordDmCategories: readonly string[];
    }>
  | Readonly<{
      kind: "ai_review_account_setting";
      isEnabled: boolean;
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
    }>
  | Readonly<{
      kind: "notification_preferences";
      title: "Change Discord notifications";
      currentCategoryLabels: readonly string[];
      proposedCategoryLabels: readonly string[];
    }>
  | Readonly<{
      kind: "ai_review_account_setting";
      title: "Change AI Reviews";
      currentEnabled: boolean;
      proposedEnabled: boolean;
    }>;

export type CoachAiChatActionCanonicalCommand =
  | "platform_reporting_currency_update"
  | "platform_notification_mark_read"
  | "platform_account_selection"
  | "platform_notification_preferences_update"
  | "coach_ai_review_account_setting_save";

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
