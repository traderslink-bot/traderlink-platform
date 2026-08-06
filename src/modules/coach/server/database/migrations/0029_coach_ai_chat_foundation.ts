import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

const sql = `CREATE TABLE coach_ai_chat_conversations (
  coach_ai_chat_conversation_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_chat_conversation_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160 AND trim(title) <> ''),
  state TEXT NOT NULL CHECK (state IN ('active', 'archived')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  archived_at_utc TEXT ${utcCheck("archived_at_utc")},
  CHECK ((state = 'active' AND archived_at_utc IS NULL) OR (state = 'archived' AND archived_at_utc IS NOT NULL)),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_chat_conversations_account_list ON coach_ai_chat_conversations(workspace_id, account_id, state, updated_at_utc DESC, coach_ai_chat_conversation_id DESC);

CREATE TABLE coach_ai_chat_messages (
  coach_ai_chat_message_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_chat_message_id")},
  coach_ai_chat_conversation_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_conversation_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  message_sequence INTEGER NOT NULL CHECK (message_sequence >= 1),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  original_user_text_private TEXT CHECK (original_user_text_private IS NULL OR length(original_user_text_private) BETWEEN 1 AND 4000),
  normalized_user_text_private TEXT CHECK (normalized_user_text_private IS NULL OR length(normalized_user_text_private) BETWEEN 1 AND 4000),
  structured_interpretation_json TEXT CHECK (structured_interpretation_json IS NULL OR (length(structured_interpretation_json) BETWEEN 2 AND 24000 AND json_valid(structured_interpretation_json) AND json_type(structured_interpretation_json) = 'object')),
  assistant_text_private TEXT CHECK (assistant_text_private IS NULL OR length(assistant_text_private) BETWEEN 1 AND 8000),
  generation_state TEXT NOT NULL CHECK (generation_state IN ('not_applicable', 'pending', 'completed', 'failed')),
  failure_code TEXT CHECK (failure_code IS NULL OR (length(failure_code) BETWEEN 1 AND 96 AND failure_code NOT GLOB '*[^A-Z0-9_]*')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  CHECK (
    (role = 'user' AND original_user_text_private IS NOT NULL AND length(original_user_text_private) >= 1 AND assistant_text_private IS NULL AND generation_state = 'not_applicable' AND failure_code IS NULL AND finalized_at_utc IS NULL) OR
    (role = 'assistant' AND original_user_text_private IS NULL AND normalized_user_text_private IS NULL AND structured_interpretation_json IS NULL AND generation_state = 'pending' AND assistant_text_private IS NULL AND failure_code IS NULL AND finalized_at_utc IS NULL) OR
    (role = 'assistant' AND original_user_text_private IS NULL AND normalized_user_text_private IS NULL AND structured_interpretation_json IS NULL AND generation_state = 'completed' AND assistant_text_private IS NOT NULL AND length(assistant_text_private) >= 1 AND failure_code IS NULL AND finalized_at_utc IS NOT NULL) OR
    (role = 'assistant' AND original_user_text_private IS NULL AND normalized_user_text_private IS NULL AND structured_interpretation_json IS NULL AND generation_state = 'failed' AND assistant_text_private IS NULL AND failure_code IS NOT NULL AND finalized_at_utc IS NOT NULL)
  ),
  UNIQUE (coach_ai_chat_conversation_id, message_sequence),
  FOREIGN KEY (coach_ai_chat_conversation_id) REFERENCES coach_ai_chat_conversations(coach_ai_chat_conversation_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_chat_messages_conversation_order ON coach_ai_chat_messages(coach_ai_chat_conversation_id, message_sequence ASC);
CREATE UNIQUE INDEX coach_ai_chat_messages_one_pending_generation ON coach_ai_chat_messages(coach_ai_chat_conversation_id) WHERE role = 'assistant' AND generation_state = 'pending';

CREATE TABLE coach_ai_chat_answer_snapshots (
  coach_ai_chat_answer_snapshot_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_chat_answer_snapshot_id")},
  coach_ai_chat_message_id TEXT NOT NULL UNIQUE ${uuidCheck("coach_ai_chat_message_id")},
  coach_ai_chat_conversation_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_conversation_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  snapshot_contract_version TEXT NOT NULL CHECK (length(snapshot_contract_version) BETWEEN 1 AND 128),
  factual_snapshot_json TEXT NOT NULL CHECK (length(factual_snapshot_json) BETWEEN 2 AND 256000 AND json_valid(factual_snapshot_json) AND json_type(factual_snapshot_json) = 'object'),
  factual_snapshot_sha256 TEXT NOT NULL CHECK (length(factual_snapshot_sha256) = 64 AND factual_snapshot_sha256 = lower(factual_snapshot_sha256) AND factual_snapshot_sha256 NOT GLOB '*[^0-9a-f]*'),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  FOREIGN KEY (coach_ai_chat_message_id) REFERENCES coach_ai_chat_messages(coach_ai_chat_message_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (coach_ai_chat_conversation_id) REFERENCES coach_ai_chat_conversations(coach_ai_chat_conversation_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE coach_ai_chat_generation_receipts (
  coach_ai_chat_generation_receipt_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_chat_generation_receipt_id")},
  coach_ai_chat_message_id TEXT NOT NULL UNIQUE ${uuidCheck("coach_ai_chat_message_id")},
  coach_ai_chat_conversation_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_conversation_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  total_tokens INTEGER CHECK (total_tokens IS NULL OR total_tokens >= 0),
  input_cost_usd_per_million_tokens TEXT CHECK (input_cost_usd_per_million_tokens IS NULL OR (length(input_cost_usd_per_million_tokens) BETWEEN 1 AND 24 AND input_cost_usd_per_million_tokens NOT GLOB '*[^0-9.]*' AND input_cost_usd_per_million_tokens NOT GLOB '*.*.*' AND CAST(input_cost_usd_per_million_tokens AS REAL) >= 0)),
  output_cost_usd_per_million_tokens TEXT CHECK (output_cost_usd_per_million_tokens IS NULL OR (length(output_cost_usd_per_million_tokens) BETWEEN 1 AND 24 AND output_cost_usd_per_million_tokens NOT GLOB '*[^0-9.]*' AND output_cost_usd_per_million_tokens NOT GLOB '*.*.*' AND CAST(output_cost_usd_per_million_tokens AS REAL) >= 0)),
  estimated_cost_usd TEXT CHECK (estimated_cost_usd IS NULL OR (length(estimated_cost_usd) BETWEEN 1 AND 32 AND estimated_cost_usd NOT GLOB '*[^0-9.]*' AND estimated_cost_usd NOT GLOB '*.*.*' AND CAST(estimated_cost_usd AS REAL) >= 0)),
  recorded_at_utc TEXT NOT NULL ${utcCheck("recorded_at_utc")},
  CHECK ((input_tokens IS NULL AND output_tokens IS NULL AND total_tokens IS NULL) OR (input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND total_tokens = input_tokens + output_tokens)),
  CHECK ((input_cost_usd_per_million_tokens IS NULL AND output_cost_usd_per_million_tokens IS NULL AND estimated_cost_usd IS NULL) OR (input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL AND estimated_cost_usd IS NOT NULL)),
  FOREIGN KEY (coach_ai_chat_message_id) REFERENCES coach_ai_chat_messages(coach_ai_chat_message_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (coach_ai_chat_conversation_id) REFERENCES coach_ai_chat_conversations(coach_ai_chat_conversation_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE coach_ai_manual_entry_drafts (
  coach_ai_manual_entry_draft_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_manual_entry_draft_id")},
  coach_ai_chat_conversation_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_conversation_id")},
  source_message_id TEXT NOT NULL ${uuidCheck("source_message_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  draft_kind TEXT NOT NULL CHECK (draft_kind = 'manual_execution_draft'),
  draft_rows_json TEXT NOT NULL CHECK (length(draft_rows_json) BETWEEN 2 AND 64000 AND json_valid(draft_rows_json) AND json_type(draft_rows_json) = 'array'),
  journal_write_state TEXT NOT NULL CHECK (journal_write_state IN ('not_written', 'commit_pending', 'committed', 'write_failed')),
  canonical_journal_command TEXT CHECK (canonical_journal_command IS NULL OR canonical_journal_command = 'journal_manual_execution_commit'),
  canonical_journal_reference TEXT CHECK (canonical_journal_reference IS NULL OR length(canonical_journal_reference) BETWEEN 1 AND 128),
  write_failure_code TEXT CHECK (write_failure_code IS NULL OR (length(write_failure_code) BETWEEN 1 AND 96 AND write_failure_code NOT GLOB '*[^A-Z0-9_]*')),
  state TEXT NOT NULL CHECK (state IN ('draft', 'ready_for_confirmation', 'confirmed_by_trader', 'commit_pending', 'committed', 'write_failed', 'expired', 'archived')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  expires_at_utc TEXT ${utcCheck("expires_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  CHECK (
    (state IN ('draft', 'ready_for_confirmation', 'confirmed_by_trader') AND journal_write_state = 'not_written' AND canonical_journal_command IS NULL AND canonical_journal_reference IS NULL AND write_failure_code IS NULL AND finalized_at_utc IS NULL) OR
    (state = 'commit_pending' AND journal_write_state = 'commit_pending' AND canonical_journal_command = 'journal_manual_execution_commit' AND canonical_journal_reference IS NULL AND write_failure_code IS NULL AND finalized_at_utc IS NULL) OR
    (state = 'committed' AND journal_write_state = 'committed' AND canonical_journal_command = 'journal_manual_execution_commit' AND canonical_journal_reference IS NOT NULL AND write_failure_code IS NULL AND finalized_at_utc IS NOT NULL) OR
    (state = 'write_failed' AND journal_write_state = 'write_failed' AND canonical_journal_command = 'journal_manual_execution_commit' AND canonical_journal_reference IS NULL AND write_failure_code IS NOT NULL AND finalized_at_utc IS NOT NULL) OR
    (state IN ('expired', 'archived') AND journal_write_state = 'not_written' AND canonical_journal_command IS NULL AND canonical_journal_reference IS NULL AND write_failure_code IS NULL AND finalized_at_utc IS NOT NULL)
  ),
  FOREIGN KEY (coach_ai_chat_conversation_id) REFERENCES coach_ai_chat_conversations(coach_ai_chat_conversation_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (source_message_id) REFERENCES coach_ai_chat_messages(coach_ai_chat_message_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE coach_ai_daily_companion_interactions (
  coach_ai_daily_companion_interaction_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_daily_companion_interaction_id")},
  coach_ai_chat_conversation_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_conversation_id")},
  source_message_id TEXT NOT NULL ${uuidCheck("source_message_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  trading_date TEXT NOT NULL CHECK (length(trading_date) = 10 AND trading_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  interaction_kind TEXT NOT NULL CHECK (interaction_kind IN ('daily_reflection', 'daily_note_draft', 'trade_note_draft', 'current_focus_draft')),
  proposed_content_json TEXT NOT NULL CHECK (length(proposed_content_json) BETWEEN 2 AND 32000 AND json_valid(proposed_content_json) AND json_type(proposed_content_json) = 'object'),
  journal_write_state TEXT NOT NULL CHECK (journal_write_state IN ('not_written', 'commit_pending', 'committed', 'write_failed')),
  canonical_journal_command TEXT CHECK (canonical_journal_command IS NULL OR canonical_journal_command = 'journal_annotation_save'),
  canonical_journal_reference TEXT CHECK (canonical_journal_reference IS NULL OR length(canonical_journal_reference) BETWEEN 1 AND 128),
  write_failure_code TEXT CHECK (write_failure_code IS NULL OR (length(write_failure_code) BETWEEN 1 AND 96 AND write_failure_code NOT GLOB '*[^A-Z0-9_]*')),
  disposition TEXT NOT NULL CHECK (disposition IN ('proposed', 'accepted', 'rejected', 'expired')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  resolved_at_utc TEXT ${utcCheck("resolved_at_utc")},
  CHECK (
    (disposition = 'proposed' AND journal_write_state = 'not_written' AND canonical_journal_command IS NULL AND canonical_journal_reference IS NULL AND write_failure_code IS NULL AND resolved_at_utc IS NULL) OR
    (disposition = 'accepted' AND journal_write_state = 'not_written' AND canonical_journal_command IS NULL AND canonical_journal_reference IS NULL AND write_failure_code IS NULL AND resolved_at_utc IS NOT NULL) OR
    (disposition = 'accepted' AND journal_write_state = 'commit_pending' AND canonical_journal_command = 'journal_annotation_save' AND canonical_journal_reference IS NULL AND write_failure_code IS NULL AND resolved_at_utc IS NOT NULL) OR
    (disposition = 'accepted' AND journal_write_state = 'committed' AND canonical_journal_command = 'journal_annotation_save' AND canonical_journal_reference IS NOT NULL AND write_failure_code IS NULL AND resolved_at_utc IS NOT NULL) OR
    (disposition = 'accepted' AND journal_write_state = 'write_failed' AND canonical_journal_command = 'journal_annotation_save' AND canonical_journal_reference IS NULL AND write_failure_code IS NOT NULL AND resolved_at_utc IS NOT NULL) OR
    (disposition IN ('rejected', 'expired') AND journal_write_state = 'not_written' AND canonical_journal_command IS NULL AND canonical_journal_reference IS NULL AND write_failure_code IS NULL AND resolved_at_utc IS NOT NULL)
  ),
  FOREIGN KEY (coach_ai_chat_conversation_id) REFERENCES coach_ai_chat_conversations(coach_ai_chat_conversation_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (source_message_id) REFERENCES coach_ai_chat_messages(coach_ai_chat_message_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE coach_ai_archive_events (
  coach_ai_archive_event_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_archive_event_id")},
  coach_ai_chat_conversation_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_conversation_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  event_kind TEXT NOT NULL CHECK (event_kind IN ('archive', 'restore')),
  occurred_at_utc TEXT NOT NULL ${utcCheck("occurred_at_utc")},
  FOREIGN KEY (coach_ai_chat_conversation_id) REFERENCES coach_ai_chat_conversations(coach_ai_chat_conversation_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_archive_events_conversation_order ON coach_ai_archive_events(coach_ai_chat_conversation_id, occurred_at_utc ASC, coach_ai_archive_event_id ASC);

CREATE TRIGGER coach_ai_chat_conversations_scope BEFORE INSERT ON coach_ai_chat_conversations
WHEN NOT EXISTS (SELECT 1 FROM journal_accounts account
JOIN platform_workspace_memberships membership
  ON membership.workspace_id = NEW.workspace_id AND membership.user_id = NEW.user_id AND membership.status = 'active'
WHERE account.account_id = NEW.account_id AND account.workspace_id = NEW.workspace_id)
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_account_workspace_scope_required'); END;
CREATE TRIGGER coach_ai_chat_conversations_initial_state BEFORE INSERT ON coach_ai_chat_conversations
WHEN NEW.state <> 'active' OR NEW.archived_at_utc IS NOT NULL OR NEW.updated_at_utc <> NEW.created_at_utc
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_conversation_initial_state_required'); END;
CREATE TRIGGER coach_ai_chat_conversations_no_delete BEFORE DELETE ON coach_ai_chat_conversations BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_history_required'); END;
CREATE TRIGGER coach_ai_chat_conversations_update_guard BEFORE UPDATE ON coach_ai_chat_conversations
WHEN NEW.coach_ai_chat_conversation_id <> OLD.coach_ai_chat_conversation_id OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR NEW.account_id <> OLD.account_id OR NEW.created_at_utc <> OLD.created_at_utc OR
  (OLD.state = 'active' AND NOT ((NEW.state = 'active' AND NEW.archived_at_utc IS NULL) OR (NEW.state = 'archived' AND NEW.archived_at_utc IS NOT NULL AND NEW.title = OLD.title))) OR
  (OLD.state = 'archived' AND NOT (NEW.state = 'active' AND NEW.archived_at_utc IS NULL AND NEW.title = OLD.title))
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_conversation_transition_invalid'); END;

CREATE TRIGGER coach_ai_chat_messages_scope BEFORE INSERT ON coach_ai_chat_messages
WHEN NOT EXISTS (SELECT 1 FROM coach_ai_chat_conversations conversation WHERE conversation.coach_ai_chat_conversation_id = NEW.coach_ai_chat_conversation_id AND conversation.user_id = NEW.user_id AND conversation.workspace_id = NEW.workspace_id AND conversation.account_id = NEW.account_id)
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_message_scope_required'); END;
CREATE TRIGGER coach_ai_chat_messages_initial_state BEFORE INSERT ON coach_ai_chat_messages
WHEN (NEW.role = 'user' AND NEW.generation_state <> 'not_applicable') OR (NEW.role = 'assistant' AND NEW.generation_state <> 'pending')
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_message_initial_state_required'); END;
CREATE TRIGGER coach_ai_chat_messages_no_delete BEFORE DELETE ON coach_ai_chat_messages BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_history_required'); END;
CREATE TRIGGER coach_ai_chat_messages_update_guard BEFORE UPDATE ON coach_ai_chat_messages
WHEN NEW.coach_ai_chat_message_id <> OLD.coach_ai_chat_message_id OR NEW.coach_ai_chat_conversation_id <> OLD.coach_ai_chat_conversation_id OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR NEW.account_id <> OLD.account_id OR NEW.message_sequence <> OLD.message_sequence OR NEW.role <> OLD.role OR NEW.original_user_text_private IS NOT OLD.original_user_text_private OR NEW.normalized_user_text_private IS NOT OLD.normalized_user_text_private OR NEW.structured_interpretation_json IS NOT OLD.structured_interpretation_json OR NEW.created_at_utc <> OLD.created_at_utc OR
  (OLD.role = 'user') OR
  (OLD.generation_state = 'pending' AND NOT ((NEW.generation_state = 'completed' AND NEW.assistant_text_private IS NOT NULL AND NEW.failure_code IS NULL AND NEW.finalized_at_utc IS NOT NULL) OR (NEW.generation_state = 'failed' AND NEW.assistant_text_private IS NULL AND NEW.failure_code IS NOT NULL AND NEW.finalized_at_utc IS NOT NULL))) OR
  (OLD.generation_state IN ('completed', 'failed'))
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_message_transition_invalid'); END;

CREATE TRIGGER coach_ai_chat_answer_snapshots_scope BEFORE INSERT ON coach_ai_chat_answer_snapshots
WHEN NOT EXISTS (SELECT 1 FROM coach_ai_chat_messages message WHERE message.coach_ai_chat_message_id = NEW.coach_ai_chat_message_id AND message.coach_ai_chat_conversation_id = NEW.coach_ai_chat_conversation_id AND message.user_id = NEW.user_id AND message.workspace_id = NEW.workspace_id AND message.account_id = NEW.account_id AND message.role = 'assistant' AND message.generation_state = 'completed')
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_answer_snapshot_scope_required'); END;
CREATE TRIGGER coach_ai_chat_answer_snapshots_no_update BEFORE UPDATE ON coach_ai_chat_answer_snapshots BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_answer_snapshot_immutable'); END;
CREATE TRIGGER coach_ai_chat_answer_snapshots_no_delete BEFORE DELETE ON coach_ai_chat_answer_snapshots BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_history_required'); END;

CREATE TRIGGER coach_ai_chat_generation_receipts_scope BEFORE INSERT ON coach_ai_chat_generation_receipts
WHEN NOT EXISTS (SELECT 1 FROM coach_ai_chat_messages message WHERE message.coach_ai_chat_message_id = NEW.coach_ai_chat_message_id AND message.coach_ai_chat_conversation_id = NEW.coach_ai_chat_conversation_id AND message.user_id = NEW.user_id AND message.workspace_id = NEW.workspace_id AND message.account_id = NEW.account_id AND message.role = 'assistant' AND message.generation_state IN ('completed', 'failed')) OR
  EXISTS (SELECT 1 FROM coach_ai_chat_messages message WHERE message.coach_ai_chat_message_id = NEW.coach_ai_chat_message_id AND message.generation_state = 'completed' AND NOT EXISTS (SELECT 1 FROM coach_ai_chat_answer_snapshots snapshot WHERE snapshot.coach_ai_chat_message_id = message.coach_ai_chat_message_id))
BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_generation_receipt_scope_required'); END;
CREATE TRIGGER coach_ai_chat_generation_receipts_no_update BEFORE UPDATE ON coach_ai_chat_generation_receipts BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_generation_receipt_immutable'); END;
CREATE TRIGGER coach_ai_chat_generation_receipts_no_delete BEFORE DELETE ON coach_ai_chat_generation_receipts BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_history_required'); END;

CREATE TRIGGER coach_ai_manual_entry_drafts_scope BEFORE INSERT ON coach_ai_manual_entry_drafts
WHEN NOT EXISTS (SELECT 1 FROM coach_ai_chat_messages message WHERE message.coach_ai_chat_message_id = NEW.source_message_id AND message.coach_ai_chat_conversation_id = NEW.coach_ai_chat_conversation_id AND message.user_id = NEW.user_id AND message.workspace_id = NEW.workspace_id AND message.account_id = NEW.account_id AND message.role = 'user')
BEGIN SELECT RAISE(ABORT, 'coach_ai_manual_entry_draft_scope_required'); END;
CREATE TRIGGER coach_ai_manual_entry_drafts_no_delete BEFORE DELETE ON coach_ai_manual_entry_drafts BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_history_required'); END;
CREATE TRIGGER coach_ai_manual_entry_drafts_update_guard BEFORE UPDATE ON coach_ai_manual_entry_drafts
WHEN NEW.coach_ai_manual_entry_draft_id <> OLD.coach_ai_manual_entry_draft_id OR NEW.coach_ai_chat_conversation_id <> OLD.coach_ai_chat_conversation_id OR NEW.source_message_id <> OLD.source_message_id OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR NEW.account_id <> OLD.account_id OR NEW.draft_kind <> OLD.draft_kind OR NEW.created_at_utc <> OLD.created_at_utc OR
  (OLD.state IN ('committed', 'write_failed', 'expired', 'archived')) OR
  (OLD.state IN ('confirmed_by_trader', 'commit_pending') AND NEW.draft_rows_json <> OLD.draft_rows_json) OR
  (OLD.state = 'draft' AND NOT (NEW.state IN ('draft', 'ready_for_confirmation', 'expired', 'archived'))) OR
  (OLD.state = 'ready_for_confirmation' AND NOT (NEW.state IN ('ready_for_confirmation', 'confirmed_by_trader', 'expired', 'archived'))) OR
  (OLD.state = 'confirmed_by_trader' AND NOT (NEW.state IN ('confirmed_by_trader', 'commit_pending', 'expired', 'archived'))) OR
  (OLD.state = 'commit_pending' AND NOT (NEW.state IN ('committed', 'write_failed')))
BEGIN SELECT RAISE(ABORT, 'coach_ai_manual_entry_draft_transition_invalid'); END;

CREATE TRIGGER coach_ai_daily_companion_interactions_scope BEFORE INSERT ON coach_ai_daily_companion_interactions
WHEN NOT EXISTS (SELECT 1 FROM coach_ai_chat_messages message WHERE message.coach_ai_chat_message_id = NEW.source_message_id AND message.coach_ai_chat_conversation_id = NEW.coach_ai_chat_conversation_id AND message.user_id = NEW.user_id AND message.workspace_id = NEW.workspace_id AND message.account_id = NEW.account_id AND message.role = 'user')
BEGIN SELECT RAISE(ABORT, 'coach_ai_daily_companion_interaction_scope_required'); END;
CREATE TRIGGER coach_ai_daily_companion_interactions_no_delete BEFORE DELETE ON coach_ai_daily_companion_interactions BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_history_required'); END;
CREATE TRIGGER coach_ai_daily_companion_interactions_update_guard BEFORE UPDATE ON coach_ai_daily_companion_interactions
WHEN NEW.coach_ai_daily_companion_interaction_id <> OLD.coach_ai_daily_companion_interaction_id OR NEW.coach_ai_chat_conversation_id <> OLD.coach_ai_chat_conversation_id OR NEW.source_message_id <> OLD.source_message_id OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR NEW.account_id <> OLD.account_id OR NEW.trading_date <> OLD.trading_date OR NEW.interaction_kind <> OLD.interaction_kind OR NEW.proposed_content_json <> OLD.proposed_content_json OR NEW.created_at_utc <> OLD.created_at_utc OR
  (OLD.disposition IN ('rejected', 'expired')) OR
  (OLD.disposition = 'proposed' AND NOT (NEW.disposition IN ('accepted', 'rejected', 'expired') AND NEW.resolved_at_utc IS NOT NULL)) OR
  (OLD.disposition = 'accepted' AND OLD.journal_write_state = 'not_written' AND NOT (NEW.disposition = 'accepted' AND NEW.journal_write_state IN ('not_written', 'commit_pending'))) OR
  (OLD.disposition = 'accepted' AND OLD.journal_write_state = 'commit_pending' AND NOT (NEW.disposition = 'accepted' AND NEW.journal_write_state IN ('committed', 'write_failed'))) OR
  (OLD.disposition = 'accepted' AND OLD.journal_write_state IN ('committed', 'write_failed'))
BEGIN SELECT RAISE(ABORT, 'coach_ai_daily_companion_interaction_transition_invalid'); END;

CREATE TRIGGER coach_ai_archive_events_scope BEFORE INSERT ON coach_ai_archive_events
WHEN NOT EXISTS (SELECT 1 FROM coach_ai_chat_conversations conversation WHERE conversation.coach_ai_chat_conversation_id = NEW.coach_ai_chat_conversation_id AND conversation.user_id = NEW.user_id AND conversation.workspace_id = NEW.workspace_id AND conversation.account_id = NEW.account_id AND ((NEW.event_kind = 'archive' AND conversation.state = 'archived') OR (NEW.event_kind = 'restore' AND conversation.state = 'active')))
BEGIN SELECT RAISE(ABORT, 'coach_ai_archive_event_scope_required'); END;
CREATE TRIGGER coach_ai_archive_events_no_update BEFORE UPDATE ON coach_ai_archive_events BEGIN SELECT RAISE(ABORT, 'coach_ai_archive_event_immutable'); END;
CREATE TRIGGER coach_ai_archive_events_no_delete BEFORE DELETE ON coach_ai_archive_events BEGIN SELECT RAISE(ABORT, 'coach_ai_chat_history_required'); END;`;

export const coachAiChatFoundationMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0029_coach_ai_chat_foundation",
  executionOrder: 29,
  statements: Object.freeze([sql]),
});
