import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (${column} IS NULL OR (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'))`;
}

const sql = `CREATE TABLE coach_ai_chat_action_drafts (
  coach_ai_chat_action_draft_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_chat_action_draft_id")},
  coach_ai_chat_conversation_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_conversation_id")},
  source_message_id TEXT NOT NULL ${uuidCheck("source_message_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  action_kind TEXT NOT NULL CHECK (action_kind IN ('reporting_currency', 'mark_notification_read', 'select_journal_account', 'notification_preferences', 'create_journal_account', 'swing_note', 'trade_style', 'trade_tags', 'rule_change', 'data_decision', 'ai_review_account_setting')),
  preview_json TEXT NOT NULL CHECK (length(preview_json) BETWEEN 2 AND 8192 AND json_valid(preview_json) AND json_type(preview_json) = 'object'),
  private_payload_json TEXT NOT NULL CHECK (length(private_payload_json) BETWEEN 2 AND 4096 AND json_valid(private_payload_json) AND json_type(private_payload_json) = 'object'),
  preview_sha256 TEXT NOT NULL CHECK (length(preview_sha256) = 64 AND preview_sha256 NOT GLOB '*[^0-9a-f]*'),
  disposition TEXT NOT NULL CHECK (disposition IN ('proposed', 'confirmed', 'rejected', 'expired')),
  write_state TEXT NOT NULL CHECK (write_state IN ('not_written', 'commit_pending', 'committed')),
  canonical_command TEXT CHECK (canonical_command IS NULL OR canonical_command IN ('platform_reporting_currency_update', 'platform_notification_mark_read', 'platform_account_selection', 'platform_notification_preferences_update', 'journal_account_create', 'journal_swing_note_save', 'journal_trade_style_change', 'journal_trade_tags_replace', 'journal_trading_rules_mutate', 'journal_data_decision_resolve', 'coach_ai_review_account_setting_save')),
  canonical_reference TEXT CHECK (canonical_reference IS NULL OR length(canonical_reference) BETWEEN 1 AND 160),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  expires_at_utc TEXT NOT NULL ${utcCheck("expires_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  CHECK (expires_at_utc > created_at_utc),
  CHECK ((disposition = 'proposed' AND write_state = 'not_written' AND finalized_at_utc IS NULL AND canonical_command IS NULL AND canonical_reference IS NULL) OR (disposition = 'confirmed' AND write_state = 'commit_pending' AND finalized_at_utc IS NOT NULL AND canonical_command IS NOT NULL AND canonical_reference IS NULL) OR (disposition = 'confirmed' AND write_state = 'committed' AND finalized_at_utc IS NOT NULL AND canonical_command IS NOT NULL AND canonical_reference IS NOT NULL) OR (disposition IN ('rejected', 'expired') AND write_state = 'not_written' AND finalized_at_utc IS NOT NULL AND canonical_command IS NULL AND canonical_reference IS NULL)),
  UNIQUE (source_message_id),
  FOREIGN KEY (coach_ai_chat_conversation_id) REFERENCES coach_ai_chat_conversations(coach_ai_chat_conversation_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (source_message_id) REFERENCES coach_ai_chat_messages(coach_ai_chat_message_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_chat_action_drafts_conversation
ON coach_ai_chat_action_drafts(account_id, coach_ai_chat_conversation_id, created_at_utc DESC);

CREATE TRIGGER coach_ai_chat_action_drafts_scope BEFORE INSERT ON coach_ai_chat_action_drafts
WHEN NOT EXISTS (SELECT 1 FROM coach_ai_chat_messages message JOIN coach_ai_chat_conversations conversation ON conversation.coach_ai_chat_conversation_id = message.coach_ai_chat_conversation_id WHERE message.coach_ai_chat_message_id = NEW.source_message_id AND message.role = 'user' AND message.user_id = NEW.user_id AND message.workspace_id = NEW.workspace_id AND message.account_id = NEW.account_id AND conversation.coach_ai_chat_conversation_id = NEW.coach_ai_chat_conversation_id AND conversation.user_id = NEW.user_id AND conversation.workspace_id = NEW.workspace_id AND conversation.account_id = NEW.account_id)
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_action_draft_scope_required'); END;

CREATE TRIGGER coach_ai_chat_action_drafts_no_delete BEFORE DELETE ON coach_ai_chat_action_drafts
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_action_draft_history_required'); END;

CREATE TRIGGER coach_ai_chat_action_drafts_update_guard BEFORE UPDATE ON coach_ai_chat_action_drafts
WHEN NEW.coach_ai_chat_action_draft_id <> OLD.coach_ai_chat_action_draft_id OR NEW.coach_ai_chat_conversation_id <> OLD.coach_ai_chat_conversation_id OR NEW.source_message_id <> OLD.source_message_id OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR NEW.account_id <> OLD.account_id OR NEW.action_kind <> OLD.action_kind OR NEW.preview_json <> OLD.preview_json OR NEW.private_payload_json <> OLD.private_payload_json OR NEW.preview_sha256 <> OLD.preview_sha256 OR NEW.created_at_utc <> OLD.created_at_utc OR NEW.expires_at_utc <> OLD.expires_at_utc OR (OLD.disposition = 'proposed' AND NOT ((NEW.disposition = 'confirmed' AND NEW.write_state = 'commit_pending' AND NEW.finalized_at_utc IS NOT NULL AND NEW.canonical_command IS NOT NULL) OR (NEW.disposition IN ('rejected', 'expired') AND NEW.write_state = 'not_written' AND NEW.finalized_at_utc IS NOT NULL))) OR (OLD.disposition = 'confirmed' AND OLD.write_state = 'commit_pending' AND NOT (NEW.disposition = 'confirmed' AND NEW.write_state = 'committed' AND NEW.finalized_at_utc = OLD.finalized_at_utc AND NEW.canonical_command = OLD.canonical_command AND NEW.canonical_reference IS NOT NULL)) OR OLD.disposition IN ('rejected', 'expired') OR OLD.write_state = 'committed'
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_action_draft_transition_invalid'); END;`;

export const coachAiChatActionDraftsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0055_coach_ai_chat_action_drafts",
  executionOrder: 55,
  statements: Object.freeze([sql]),
});
