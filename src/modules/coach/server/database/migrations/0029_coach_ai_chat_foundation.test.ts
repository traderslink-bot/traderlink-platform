import Database from "better-sqlite3";

import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

const timestamp = "2026-08-05T12:00:00.000Z";
const laterTimestamp = "2026-08-05T12:01:00.000Z";
const userId = "00000000-0000-4000-8000-000000000001";
const workspaceId = "00000000-0000-4000-8000-000000000002";
const accountId = "00000000-0000-4000-8000-000000000003";
const conversationId = "00000000-0000-4000-8000-000000000004";
const userMessageId = "00000000-0000-4000-8000-000000000005";
const assistantMessageId = "00000000-0000-4000-8000-000000000006";
const failedAssistantMessageId = "00000000-0000-4000-8000-000000000014";

function setup(): Database.Database {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, {
    manifest: platformMigrationManifest,
    now: () => new Date(timestamp),
  });
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'development_local', 'coach-chat-test-owner', 'Test owner', 'active', ?, ?)`).run(
    userId, timestamp, timestamp,
  );
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Test workspace', 'America/New_York', 'active', ?, ?)`).run(
    workspaceId, timestamp, timestamp,
  );
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`).run(
    workspaceId, userId, userId, timestamp, timestamp,
  );
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Primary', 'USD', 'America/New_York', 'active', ?, ?, ?)`).run(
    accountId, workspaceId, userId, timestamp, timestamp,
  );
  return database;
}

function insertConversation(database: Database.Database): void {
  database.prepare(`INSERT INTO coach_ai_chat_conversations (
  coach_ai_chat_conversation_id, user_id, workspace_id, account_id, title,
  state, created_at_utc, updated_at_utc, archived_at_utc
) VALUES (?, ?, ?, ?, 'August review questions', 'active', ?, ?, NULL)`).run(
    conversationId, userId, workspaceId, accountId, timestamp, timestamp,
  );
}

function insertUserMessage(database: Database.Database): void {
  database.prepare(`INSERT INTO coach_ai_chat_messages (
  coach_ai_chat_message_id, coach_ai_chat_conversation_id, user_id, workspace_id,
  account_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json,
  assistant_text_private, generation_state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, 1, 'user', 'What did I record this week?',
  'What did I record this week?', '{"schemaVersion":"1"}', NULL,
  'not_applicable', NULL, ?, NULL)`).run(
    userMessageId, conversationId, userId, workspaceId, accountId, timestamp,
  );
}

function insertPendingAssistantMessage(database: Database.Database): void {
  database.prepare(`INSERT INTO coach_ai_chat_messages (
  coach_ai_chat_message_id, coach_ai_chat_conversation_id, user_id, workspace_id,
  account_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json,
  assistant_text_private, generation_state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, 2, 'assistant', NULL, NULL, NULL, NULL,
  'pending', NULL, ?, NULL)`).run(
    assistantMessageId, conversationId, userId, workspaceId, accountId, timestamp,
  );
}

describe("0029 coach AI Chat foundation migration", () => {
  it("creates all seven account-scoped records with ordered, retry-safe private chat evidence", () => {
    const database = setup();
    try {
      const tables = database.prepare(`SELECT name FROM sqlite_master
WHERE type = 'table' AND name LIKE 'coach_ai_%' ORDER BY name`).all() as readonly { name: string }[];
      expect(tables.map((row) => row.name)).toEqual(expect.arrayContaining([
        "coach_ai_chat_conversations",
        "coach_ai_chat_messages",
        "coach_ai_chat_answer_snapshots",
        "coach_ai_chat_generation_receipts",
        "coach_ai_manual_entry_drafts",
        "coach_ai_daily_companion_interactions",
        "coach_ai_archive_events",
      ]));
      const payloadChecks = database.prepare(`SELECT name, sql FROM sqlite_master
WHERE type = 'table' AND name IN (
  'coach_ai_chat_answer_snapshots', 'coach_ai_manual_entry_drafts',
  'coach_ai_daily_companion_interactions'
)`).all() as readonly { name: string; sql: string }[];
      expect(payloadChecks.find((row) => row.name === "coach_ai_chat_answer_snapshots")?.sql)
        .toContain("length(factual_snapshot_json) BETWEEN 2 AND 256000");
      expect(payloadChecks.find((row) => row.name === "coach_ai_manual_entry_drafts")?.sql)
        .toContain("length(draft_rows_json) BETWEEN 2 AND 64000");
      expect(payloadChecks.find((row) => row.name === "coach_ai_daily_companion_interactions")?.sql)
        .toContain("length(proposed_content_json) BETWEEN 2 AND 32000");

      insertConversation(database);
      insertUserMessage(database);
      insertPendingAssistantMessage(database);
      expect(() => database.prepare(`INSERT INTO coach_ai_chat_messages (
  coach_ai_chat_message_id, coach_ai_chat_conversation_id, user_id, workspace_id,
  account_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json,
  assistant_text_private, generation_state, failure_code, created_at_utc, finalized_at_utc
) VALUES ('00000000-0000-4000-8000-000000000007', ?, ?, ?, ?, 3, 'assistant',
  NULL, NULL, NULL, NULL, 'pending', NULL, ?, NULL)`).run(
        conversationId, userId, workspaceId, accountId, timestamp,
      )).toThrowError("UNIQUE constraint failed");
      expect(() => database.prepare(`INSERT INTO coach_ai_chat_messages (
  coach_ai_chat_message_id, coach_ai_chat_conversation_id, user_id, workspace_id,
  account_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json,
  assistant_text_private, generation_state, failure_code, created_at_utc, finalized_at_utc
) VALUES ('00000000-0000-4000-8000-000000000008', ?, ?, ?, ?, 3, 'assistant',
  NULL, NULL, NULL, 'A completed answer', 'completed', NULL, ?, ?)`).run(
        conversationId, userId, workspaceId, accountId, timestamp, laterTimestamp,
      )).toThrowError("coach_ai_chat_message_initial_state_required");

      database.prepare(`UPDATE coach_ai_chat_messages SET
  assistant_text_private = 'A factual answer.', generation_state = 'completed',
  finalized_at_utc = ?
WHERE coach_ai_chat_message_id = ?`).run(laterTimestamp, assistantMessageId);
      database.prepare(`INSERT INTO coach_ai_chat_answer_snapshots (
  coach_ai_chat_answer_snapshot_id, coach_ai_chat_message_id,
  coach_ai_chat_conversation_id, user_id, workspace_id, account_id,
  snapshot_contract_version, factual_snapshot_json, factual_snapshot_sha256, created_at_utc
) VALUES ('00000000-0000-4000-8000-000000000009', ?, ?, ?, ?, ?,
  'traderlink_coach_ai_chat_snapshot_v1', '{"coverage":"available"}', ?, ?)`).run(
        assistantMessageId, conversationId, userId, workspaceId, accountId, "a".repeat(64), laterTimestamp,
      );
      database.prepare(`INSERT INTO coach_ai_chat_generation_receipts (
  coach_ai_chat_generation_receipt_id, coach_ai_chat_message_id,
  coach_ai_chat_conversation_id, user_id, workspace_id, account_id, provider_key,
  model_id, input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens, output_cost_usd_per_million_tokens,
  estimated_cost_usd, recorded_at_utc
) VALUES ('00000000-0000-4000-8000-000000000010', ?, ?, ?, ?, ?, 'openai_direct',
  'gpt-test', NULL, NULL, NULL, NULL, NULL, NULL, ?)`).run(
        assistantMessageId, conversationId, userId, workspaceId, accountId, laterTimestamp,
      );
      expect(() => database.prepare(`DELETE FROM coach_ai_chat_answer_snapshots`).run())
        .toThrowError("coach_ai_chat_history_required");
      expect(() => database.prepare(`UPDATE coach_ai_chat_messages
SET assistant_text_private = 'Rewritten' WHERE coach_ai_chat_message_id = ?`).run(assistantMessageId))
        .toThrowError("coach_ai_chat_message_transition_invalid");

      database.prepare(`INSERT INTO coach_ai_chat_messages (
  coach_ai_chat_message_id, coach_ai_chat_conversation_id, user_id, workspace_id,
  account_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json,
  assistant_text_private, generation_state, failure_code, created_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, 3, 'assistant', NULL, NULL, NULL, NULL,
  'pending', NULL, ?, NULL)`).run(
        failedAssistantMessageId, conversationId, userId, workspaceId, accountId, timestamp,
      );
      database.prepare(`UPDATE coach_ai_chat_messages SET
  generation_state = 'failed', failure_code = 'TRADERLINK_COACH_PROVIDER_FAILED',
  finalized_at_utc = ?
WHERE coach_ai_chat_message_id = ?`).run(laterTimestamp, failedAssistantMessageId);
      database.prepare(`INSERT INTO coach_ai_chat_generation_receipts (
  coach_ai_chat_generation_receipt_id, coach_ai_chat_message_id,
  coach_ai_chat_conversation_id, user_id, workspace_id, account_id, provider_key,
  model_id, input_tokens, output_tokens, total_tokens,
  input_cost_usd_per_million_tokens, output_cost_usd_per_million_tokens,
  estimated_cost_usd, recorded_at_utc
) VALUES ('00000000-0000-4000-8000-000000000015', ?, ?, ?, ?, ?, 'openai_direct',
  'gpt-test', 10, 5, 15, '1', '2', '0.00002', ?)`).run(
        failedAssistantMessageId, conversationId, userId, workspaceId, accountId, laterTimestamp,
      );
      expect(database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_chat_answer_snapshots
WHERE coach_ai_chat_message_id = ?`).get(failedAssistantMessageId)).toEqual({ count: 0 });

      database.prepare(`INSERT INTO coach_ai_manual_entry_drafts (
  coach_ai_manual_entry_draft_id, coach_ai_chat_conversation_id, source_message_id,
  user_id, workspace_id, account_id, draft_kind, draft_rows_json,
  journal_write_state, canonical_journal_command, canonical_journal_reference,
  write_failure_code, state, created_at_utc, updated_at_utc, expires_at_utc, finalized_at_utc
) VALUES ('00000000-0000-4000-8000-000000000011', ?, ?, ?, ?, ?,
  'manual_execution_draft', '[]', 'not_written', NULL, NULL, NULL, 'draft', ?, ?, NULL, NULL)`).run(
        conversationId, userMessageId, userId, workspaceId, accountId, timestamp, timestamp,
      );
      database.prepare(`UPDATE coach_ai_manual_entry_drafts SET
  state = 'ready_for_confirmation', updated_at_utc = ?
WHERE coach_ai_manual_entry_draft_id = '00000000-0000-4000-8000-000000000011'`).run(laterTimestamp);
      database.prepare(`UPDATE coach_ai_manual_entry_drafts SET
  state = 'confirmed_by_trader', updated_at_utc = ?
WHERE coach_ai_manual_entry_draft_id = '00000000-0000-4000-8000-000000000011'`).run(laterTimestamp);
      expect(() => database.prepare(`UPDATE coach_ai_manual_entry_drafts
SET draft_rows_json = '[{}]'
WHERE coach_ai_manual_entry_draft_id = '00000000-0000-4000-8000-000000000011'`).run())
        .toThrowError("coach_ai_manual_entry_draft_transition_invalid");
      database.prepare(`UPDATE coach_ai_manual_entry_drafts SET
  state = 'commit_pending', journal_write_state = 'commit_pending',
  canonical_journal_command = 'journal_manual_execution_commit', updated_at_utc = ?
WHERE coach_ai_manual_entry_draft_id = '00000000-0000-4000-8000-000000000011'`).run(laterTimestamp);
      database.prepare(`UPDATE coach_ai_manual_entry_drafts SET
  state = 'committed', journal_write_state = 'committed',
  canonical_journal_reference = 'canonical-manual-entry-result',
  updated_at_utc = ?, finalized_at_utc = ?
WHERE coach_ai_manual_entry_draft_id = '00000000-0000-4000-8000-000000000011'`).run(laterTimestamp, laterTimestamp);
      expect(() => database.prepare(`UPDATE coach_ai_manual_entry_drafts
SET draft_rows_json = '[{}]' WHERE coach_ai_manual_entry_draft_id = '00000000-0000-4000-8000-000000000011'`).run())
        .toThrowError("coach_ai_manual_entry_draft_transition_invalid");
      expect(database.prepare(`SELECT COUNT(*) AS count FROM pragma_foreign_key_list('coach_ai_manual_entry_drafts')
WHERE "table" = 'journal_executions'`).get()).toEqual({ count: 0 });

      database.prepare(`INSERT INTO coach_ai_daily_companion_interactions (
  coach_ai_daily_companion_interaction_id, coach_ai_chat_conversation_id, source_message_id,
  user_id, workspace_id, account_id, trading_date, interaction_kind,
  proposed_content_json, journal_write_state, canonical_journal_command,
  canonical_journal_reference, write_failure_code, disposition, created_at_utc, resolved_at_utc
) VALUES ('00000000-0000-4000-8000-000000000012', ?, ?, ?, ?, ?, '2026-08-05',
  'daily_note_draft', '{"text":"Draft"}', 'not_written', NULL, NULL, NULL, 'proposed', ?, NULL)`).run(
        conversationId, userMessageId, userId, workspaceId, accountId, timestamp,
      );
      database.prepare(`UPDATE coach_ai_daily_companion_interactions SET
  disposition = 'accepted', resolved_at_utc = ?
WHERE coach_ai_daily_companion_interaction_id = '00000000-0000-4000-8000-000000000012'`).run(laterTimestamp);
      database.prepare(`UPDATE coach_ai_daily_companion_interactions SET
  journal_write_state = 'commit_pending', canonical_journal_command = 'journal_annotation_save'
WHERE coach_ai_daily_companion_interaction_id = '00000000-0000-4000-8000-000000000012'`).run();
      database.prepare(`UPDATE coach_ai_daily_companion_interactions SET
  journal_write_state = 'committed', canonical_journal_reference = 'canonical-annotation-result'
WHERE coach_ai_daily_companion_interaction_id = '00000000-0000-4000-8000-000000000012'`).run();
      expect(() => database.prepare(`UPDATE coach_ai_daily_companion_interactions
SET proposed_content_json = '{"text":"Changed"}'
WHERE coach_ai_daily_companion_interaction_id = '00000000-0000-4000-8000-000000000012'`).run())
        .toThrowError("coach_ai_daily_companion_interaction_transition_invalid");

      database.prepare(`UPDATE coach_ai_chat_conversations SET
  state = 'archived', updated_at_utc = ?, archived_at_utc = ?
WHERE coach_ai_chat_conversation_id = ?`).run(laterTimestamp, laterTimestamp, conversationId);
      database.prepare(`INSERT INTO coach_ai_archive_events (
  coach_ai_archive_event_id, coach_ai_chat_conversation_id, user_id,
  workspace_id, account_id, event_kind, occurred_at_utc
) VALUES ('00000000-0000-4000-8000-000000000013', ?, ?, ?, ?, 'archive', ?)`).run(
        conversationId, userId, workspaceId, accountId, laterTimestamp,
      );
      expect(() => database.prepare(`DELETE FROM coach_ai_archive_events`).run())
        .toThrowError("coach_ai_chat_history_required");

      database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES ('00000000-0000-4000-8000-000000000016', 'development_local', 'outside-member', 'Outside member', 'active', ?, ?)`).run(
        timestamp, timestamp,
      );
      expect(() => database.prepare(`INSERT INTO coach_ai_chat_conversations (
  coach_ai_chat_conversation_id, user_id, workspace_id, account_id, title,
  state, created_at_utc, updated_at_utc, archived_at_utc
) VALUES ('00000000-0000-4000-8000-000000000017', '00000000-0000-4000-8000-000000000016', ?, ?, 'No membership', 'active', ?, ?, NULL)`).run(
        workspaceId, accountId, timestamp, timestamp,
      )).toThrowError("coach_ai_chat_account_workspace_scope_required");
      expect(() => database.prepare(`INSERT INTO coach_ai_chat_messages (
  coach_ai_chat_message_id, coach_ai_chat_conversation_id, user_id, workspace_id,
  account_id, message_sequence, role, original_user_text_private,
  normalized_user_text_private, structured_interpretation_json,
  assistant_text_private, generation_state, failure_code, created_at_utc, finalized_at_utc
) VALUES ('00000000-0000-4000-8000-000000000018', ?, ?, ?, ?, 4, 'user', ?, NULL,
  NULL, NULL, 'not_applicable', NULL, ?, NULL)`).run(
        conversationId, userId, workspaceId, accountId, "x".repeat(4001), timestamp,
      )).toThrowError("CHECK constraint failed");
    } finally {
      database.close();
    }
  });
});
