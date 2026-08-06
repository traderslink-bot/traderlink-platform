import Database from "better-sqlite3";

import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

const at = "2026-08-06T12:00:00.000Z";
const later = "2026-08-06T12:01:00.000Z";
const userId = "00000000-0000-4000-8000-000000000001";
const workspaceId = "00000000-0000-4000-8000-000000000002";
const accountId = "00000000-0000-4000-8000-000000000003";
const conversationId = "00000000-0000-4000-8000-000000000004";
const messageId = "00000000-0000-4000-8000-000000000005";
const draftId = "00000000-0000-4000-8000-000000000006";

function setup(): Database.Database {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => new Date(at) });
  database.exec(`INSERT INTO platform_users VALUES ('${userId}', 'development_local', 'setting-test', 'Test owner', 'active', '${at}', '${at}');
INSERT INTO platform_workspaces VALUES ('${workspaceId}', 'Test workspace', 'America/New_York', 'active', '${at}', '${at}');
INSERT INTO platform_workspace_memberships VALUES ('${workspaceId}', '${userId}', 'owner', 'active', '${userId}', '${at}', '${at}');
INSERT INTO journal_accounts VALUES ('${accountId}', '${workspaceId}', 'Primary', 'USD', 'America/New_York', 'active', '${userId}', '${at}', '${at}');
INSERT INTO coach_ai_chat_conversations VALUES ('${conversationId}', '${userId}', '${workspaceId}', '${accountId}', 'Settings', 'active', '${at}', '${at}', NULL);
INSERT INTO coach_ai_chat_messages VALUES ('${messageId}', '${conversationId}', '${userId}', '${workspaceId}', '${accountId}', 1, 'user', 'Move my review to Sunday at 7 PM.', NULL, NULL, NULL, 'not_applicable', NULL, '${at}', NULL);`);
  return database;
}

function insertDraft(database: Database.Database): void {
  database.prepare(`INSERT INTO coach_ai_review_delivery_change_drafts (
  coach_ai_review_delivery_change_draft_id, coach_ai_chat_conversation_id,
  source_message_id, user_id, workspace_id, account_id,
  current_weekly_delivery_day, current_delivery_time_eastern,
  current_settings_updated_at_utc, proposed_weekly_delivery_day,
  proposed_delivery_time_eastern, disposition, settings_write_state,
  canonical_settings_command, canonical_settings_reference, write_failure_code,
  created_at_utc, expires_at_utc, finalized_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'friday', '18:00', NULL, 'sunday', '19:00',
  'proposed', 'not_written', NULL, NULL, NULL, ?, '2026-08-07T12:00:00.000Z', NULL)`).run(
    draftId, conversationId, messageId, userId, workspaceId, accountId, at,
  );
}

describe("0031 Coach AI Chat setting change drafts", () => {
  it("creates one scoped immutable proposal with guarded confirmation states", () => {
    const database = setup();
    try {
      insertDraft(database);
      database.prepare(`UPDATE coach_ai_review_delivery_change_drafts
SET disposition = 'confirmed', settings_write_state = 'commit_pending',
  canonical_settings_command = 'coach_review_delivery_save', finalized_at_utc = ?
WHERE coach_ai_review_delivery_change_draft_id = ?`).run(later, draftId);
      database.prepare(`UPDATE coach_ai_review_delivery_change_drafts
SET settings_write_state = 'committed', canonical_settings_reference = 'review_delivery:2026-08-06T12:01:00.000Z'
WHERE coach_ai_review_delivery_change_draft_id = ?`).run(draftId);
      const row = database.prepare(`SELECT disposition, settings_write_state
FROM coach_ai_review_delivery_change_drafts WHERE coach_ai_review_delivery_change_draft_id = ?`).get(
        draftId,
      ) as { disposition: string; settings_write_state: string };
      expect(row).toEqual({ disposition: "confirmed", settings_write_state: "committed" });
      expect(() => database.prepare(`DELETE FROM coach_ai_review_delivery_change_drafts
WHERE coach_ai_review_delivery_change_draft_id = ?`).run(draftId)).toThrowError(
        "coach_ai_review_delivery_change_draft_history_required",
      );
      expect(() => database.prepare(`UPDATE coach_ai_review_delivery_change_drafts
SET proposed_weekly_delivery_day = 'saturday'
WHERE coach_ai_review_delivery_change_draft_id = ?`).run(draftId)).toThrowError(
        "coach_ai_review_delivery_change_draft_transition_invalid",
      );
    } finally {
      database.close();
    }
  });

  it("rejects a draft whose message/account scope does not match", () => {
    const database = setup();
    try {
      expect(() => database.prepare(`INSERT INTO coach_ai_review_delivery_change_drafts (
  coach_ai_review_delivery_change_draft_id, coach_ai_chat_conversation_id,
  source_message_id, user_id, workspace_id, account_id,
  current_weekly_delivery_day, current_delivery_time_eastern,
  current_settings_updated_at_utc, proposed_weekly_delivery_day,
  proposed_delivery_time_eastern, disposition, settings_write_state,
  created_at_utc, expires_at_utc
) VALUES (?, ?, ?, ?, ?, '00000000-0000-4000-8000-000000000099',
  'friday', '18:00', NULL, 'sunday', '19:00', 'proposed', 'not_written', ?,
  '2026-08-07T12:00:00.000Z')`).run(
        draftId, conversationId, messageId, userId, workspaceId, at,
      )).toThrowError();
    } finally {
      database.close();
    }
  });
});
