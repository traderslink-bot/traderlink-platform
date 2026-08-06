import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (${column} IS NULL OR (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'))`;
}

const sql = `CREATE TABLE coach_ai_review_delivery_change_drafts (
  coach_ai_review_delivery_change_draft_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_review_delivery_change_draft_id")},
  coach_ai_chat_conversation_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_conversation_id")},
  source_message_id TEXT NOT NULL ${uuidCheck("source_message_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  current_weekly_delivery_day TEXT NOT NULL CHECK (current_weekly_delivery_day IN ('friday', 'saturday', 'sunday')),
  current_delivery_time_eastern TEXT NOT NULL CHECK (current_delivery_time_eastern GLOB '[0-2][0-9]:[0-5][0-9]' AND current_delivery_time_eastern >= '16:00' AND current_delivery_time_eastern <= '23:59'),
  current_settings_updated_at_utc TEXT ${utcCheck("current_settings_updated_at_utc")},
  proposed_weekly_delivery_day TEXT NOT NULL CHECK (proposed_weekly_delivery_day IN ('friday', 'saturday', 'sunday')),
  proposed_delivery_time_eastern TEXT NOT NULL CHECK (proposed_delivery_time_eastern GLOB '[0-2][0-9]:[0-5][0-9]' AND proposed_delivery_time_eastern >= '16:00' AND proposed_delivery_time_eastern <= '23:59'),
  disposition TEXT NOT NULL CHECK (disposition IN ('proposed', 'confirmed', 'rejected', 'expired')),
  settings_write_state TEXT NOT NULL CHECK (settings_write_state IN ('not_written', 'commit_pending', 'committed', 'write_failed')),
  canonical_settings_command TEXT CHECK (canonical_settings_command IS NULL OR canonical_settings_command = 'coach_review_delivery_save'),
  canonical_settings_reference TEXT CHECK (canonical_settings_reference IS NULL OR length(canonical_settings_reference) BETWEEN 1 AND 128),
  write_failure_code TEXT CHECK (write_failure_code IS NULL OR (length(write_failure_code) BETWEEN 1 AND 96 AND write_failure_code NOT GLOB '*[^A-Z0-9_]*')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  expires_at_utc TEXT NOT NULL ${utcCheck("expires_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  CHECK (expires_at_utc > created_at_utc),
  CHECK ((disposition = 'proposed' AND finalized_at_utc IS NULL AND settings_write_state = 'not_written') OR (disposition = 'confirmed' AND finalized_at_utc IS NOT NULL AND settings_write_state IN ('commit_pending', 'committed', 'write_failed')) OR (disposition IN ('rejected', 'expired') AND finalized_at_utc IS NOT NULL AND settings_write_state = 'not_written')),
  CHECK ((settings_write_state = 'not_written' AND canonical_settings_command IS NULL AND canonical_settings_reference IS NULL AND write_failure_code IS NULL) OR (settings_write_state = 'commit_pending' AND canonical_settings_command = 'coach_review_delivery_save' AND canonical_settings_reference IS NULL AND write_failure_code IS NULL) OR (settings_write_state = 'committed' AND canonical_settings_command = 'coach_review_delivery_save' AND canonical_settings_reference IS NOT NULL AND write_failure_code IS NULL) OR (settings_write_state = 'write_failed' AND canonical_settings_command = 'coach_review_delivery_save' AND canonical_settings_reference IS NULL AND write_failure_code IS NOT NULL)),
  UNIQUE (source_message_id),
  FOREIGN KEY (coach_ai_chat_conversation_id) REFERENCES coach_ai_chat_conversations(coach_ai_chat_conversation_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (source_message_id) REFERENCES coach_ai_chat_messages(coach_ai_chat_message_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_review_delivery_change_drafts_conversation
ON coach_ai_review_delivery_change_drafts(account_id, coach_ai_chat_conversation_id, created_at_utc DESC);

CREATE TRIGGER coach_ai_review_delivery_change_drafts_scope BEFORE INSERT ON coach_ai_review_delivery_change_drafts
WHEN NOT EXISTS (SELECT 1 FROM coach_ai_chat_messages message JOIN coach_ai_chat_conversations conversation ON conversation.coach_ai_chat_conversation_id = message.coach_ai_chat_conversation_id WHERE message.coach_ai_chat_message_id = NEW.source_message_id AND message.role = 'user' AND message.user_id = NEW.user_id AND message.workspace_id = NEW.workspace_id AND message.account_id = NEW.account_id AND conversation.coach_ai_chat_conversation_id = NEW.coach_ai_chat_conversation_id AND conversation.user_id = NEW.user_id AND conversation.workspace_id = NEW.workspace_id AND conversation.account_id = NEW.account_id)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_delivery_change_draft_scope_required'); END;

CREATE TRIGGER coach_ai_review_delivery_change_drafts_no_delete BEFORE DELETE ON coach_ai_review_delivery_change_drafts
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_delivery_change_draft_history_required'); END;

CREATE TRIGGER coach_ai_review_delivery_change_drafts_update_guard BEFORE UPDATE ON coach_ai_review_delivery_change_drafts
WHEN NEW.coach_ai_review_delivery_change_draft_id <> OLD.coach_ai_review_delivery_change_draft_id OR NEW.coach_ai_chat_conversation_id <> OLD.coach_ai_chat_conversation_id OR NEW.source_message_id <> OLD.source_message_id OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR NEW.account_id <> OLD.account_id OR NEW.current_weekly_delivery_day <> OLD.current_weekly_delivery_day OR NEW.current_delivery_time_eastern <> OLD.current_delivery_time_eastern OR NEW.current_settings_updated_at_utc IS NOT OLD.current_settings_updated_at_utc OR NEW.proposed_weekly_delivery_day <> OLD.proposed_weekly_delivery_day OR NEW.proposed_delivery_time_eastern <> OLD.proposed_delivery_time_eastern OR NEW.created_at_utc <> OLD.created_at_utc OR NEW.expires_at_utc <> OLD.expires_at_utc OR (OLD.disposition = 'proposed' AND NOT ((NEW.disposition = 'confirmed' AND NEW.settings_write_state = 'commit_pending' AND NEW.canonical_settings_command = 'coach_review_delivery_save' AND NEW.finalized_at_utc IS NOT NULL) OR (NEW.disposition IN ('rejected', 'expired') AND NEW.settings_write_state = 'not_written' AND NEW.finalized_at_utc IS NOT NULL))) OR (OLD.disposition = 'confirmed' AND OLD.settings_write_state = 'commit_pending' AND NOT (NEW.disposition = 'confirmed' AND NEW.settings_write_state IN ('committed', 'write_failed') AND NEW.finalized_at_utc = OLD.finalized_at_utc)) OR OLD.disposition IN ('rejected', 'expired') OR OLD.settings_write_state IN ('committed', 'write_failed')
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_delivery_change_draft_transition_invalid'); END;`;

export const coachAiChatSettingChangeDraftsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0031_coach_ai_chat_setting_change_drafts",
  executionOrder: 31,
  statements: Object.freeze([sql]),
});
