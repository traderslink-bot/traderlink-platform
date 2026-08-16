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
      kind: "create_journal_account";
      displayName: string;
      baseCurrency: string;
      tradingTimezone: string;
    }>
  | Readonly<{
      kind: "swing_note";
      positionRef: string;
      reviewDate: string;
      note: string;
      nextSessionPlan: string | null;
    }>
  | Readonly<{
      kind: "trade_style";
      positionRef: string;
      classification:
        | "active_swing"
        | "day_trade_still_open"
        | "bag_hold"
        | "long_term_hold";
    }>
  | Readonly<{
      kind: "notification_preferences";
      discordDmCategories: readonly string[];
    }>
  | Readonly<{
      kind: "ai_review_account_setting";
      isEnabled: boolean;
    }>
  | Readonly<{
      kind: "ai_review_request";
      reviewKind: "weekly" | "two_week" | "monthly";
      periodStartDate: string;
      periodEndDate: string;
    }>
  | Readonly<{
      kind: "trade_tags";
      roundTripId: string | null;
      positionRef: string | null;
      tagNames: readonly string[];
    }>
  | Readonly<{
      kind: "rule_change";
      operation:
        | Readonly<{
            kind: "create_preset";
            presetKey: string;
            configuration: Readonly<Record<string, string>>;
          }>
        | Readonly<{
            kind: "revise_preset";
            ruleRef: string;
            configuration: Readonly<Record<string, string>>;
          }>
        | Readonly<{
            kind: "transition";
            ruleRef: string;
            newStatus: "active" | "paused" | "retired";
          }>
        | Readonly<{
            kind: "create_custom";
            title: string;
            statement: string;
            category: "process" | "setup" | "mindset" | "review";
            reviewScope: "day_session" | "trade" | "both";
            isFocus: boolean;
          }>
        | Readonly<{
            kind: "revise_custom";
            ruleRef: string;
            title: string;
            statement: string;
            category: "process" | "setup" | "mindset" | "review";
            reviewScope: "day_session" | "trade" | "both";
            isFocus: boolean;
          }>;
    }>
  | Readonly<{
      kind: "data_decision";
      decisionRef: string;
      resolution:
        | Readonly<{
            action:
              | "confirm_legitimate_open_position"
              | "reconcile_grouped_fills"
              | "accept_source_limitation";
          }>
        | Readonly<{
            action: "exclude_execution";
            executionRef: string;
            exclusionReason:
              | "not_a_trade_execution"
              | "duplicate_execution"
              | "broker_correction_or_reversal"
              | "corporate_action";
          }>
        | Readonly<{
            action: "restore_execution" | "keep_distinct";
            executionRef: string;
          }>
        | Readonly<{
            action: "merge_supported_duplicate";
            duplicateExecutionRef: string;
            retainedExecutionRef: string;
          }>;
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
      kind: "create_journal_account";
      title: "Create Trade Tracker account";
      displayName: string;
      baseCurrency: string;
      tradingTimezone: string;
      becomesActive: true;
    }>
  | Readonly<{
      kind: "swing_note";
      title: "Save swing note";
      ticker: string;
      reviewDate: string;
      currentNote: string | null;
      currentNextSessionPlan: string | null;
      proposedNote: string;
      proposedNextSessionPlan: string | null;
    }>
  | Readonly<{
      kind: "trade_style";
      title: "Change open position type";
      ticker: string;
      currentLabel: string;
      proposedLabel: string;
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
    }>
  | Readonly<{
      kind: "ai_review_request";
      title: "Request AI Review";
      reviewLabel: "Weekly Review" | "Two-Week Review" | "Monthly Review";
      periodStartDate: string;
      periodEndDate: string;
    }>
  | Readonly<{
      kind: "trade_tags";
      title: "Change trade tags";
      ticker: string;
      currentTagNames: readonly string[];
      proposedTagNames: readonly string[];
    }>
  | Readonly<{
      kind: "rule_change";
      title: "Add trading rule" | "Change trading rule";
      ruleTitle: string;
      currentDetails: readonly string[];
      proposedDetails: readonly string[];
    }>
  | Readonly<{
      kind: "data_decision";
      title: "Resolve data decision";
      ticker: string | null;
      question: string;
      actionLabel: string;
      details: readonly string[];
    }>;

export type CoachAiChatActionCanonicalCommand =
  | "platform_reporting_currency_update"
  | "platform_notification_mark_read"
  | "platform_account_selection"
  | "journal_account_create"
  | "journal_swing_note_save"
  | "journal_trade_style_change"
  | "platform_notification_preferences_update"
  | "coach_ai_review_account_setting_save"
  | "coach_ai_review_request_create"
  | "journal_trade_tags_replace"
  | "journal_trading_rules_mutate"
  | "journal_data_decision_resolve";

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
