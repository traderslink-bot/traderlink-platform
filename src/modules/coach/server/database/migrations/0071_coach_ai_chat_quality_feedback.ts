import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string, nullable = false): string {
  const value = `length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${value}${nullable ? ")" : ")"})`;
}

const sql = `CREATE TABLE coach_ai_chat_quality_cases (
  coach_ai_chat_quality_case_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_chat_quality_case_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  coach_ai_chat_conversation_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_conversation_id")},
  user_message_id TEXT NOT NULL ${uuidCheck("user_message_id")},
  assistant_message_id TEXT NOT NULL ${uuidCheck("assistant_message_id")},
  context_snapshot_json TEXT NOT NULL CHECK (
    length(context_snapshot_json) BETWEEN 2 AND 65536
  ),
  context_snapshot_sha256 TEXT NOT NULL CHECK (
    length(context_snapshot_sha256) = 64
    AND context_snapshot_sha256 NOT GLOB '*[^0-9a-f]*'
  ),
  metadata_json TEXT NOT NULL CHECK (length(metadata_json) BETWEEN 2 AND 16384),
  case_state TEXT NOT NULL CHECK (case_state IN ('open', 'resolved', 'dismissed')),
  resolved_by_user_id TEXT ${uuidCheck("resolved_by_user_id")},
  resolved_at_utc TEXT ${utcCheck("resolved_at_utc", true)},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (assistant_message_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (coach_ai_chat_conversation_id) REFERENCES coach_ai_chat_conversations(coach_ai_chat_conversation_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_message_id) REFERENCES coach_ai_chat_messages(coach_ai_chat_message_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (assistant_message_id) REFERENCES coach_ai_chat_messages(coach_ai_chat_message_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (resolved_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_chat_quality_cases_owner_queue
  ON coach_ai_chat_quality_cases(case_state, created_at_utc DESC, coach_ai_chat_quality_case_id DESC);

CREATE TABLE coach_ai_chat_quality_events (
  coach_ai_chat_quality_event_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_chat_quality_event_id")},
  coach_ai_chat_quality_case_id TEXT NOT NULL ${uuidCheck("coach_ai_chat_quality_case_id")},
  event_kind TEXT NOT NULL CHECK (event_kind IN (
    'trader_flagged', 'automatic_failure', 'automatic_unavailable'
  )),
  safe_failure_code TEXT CHECK (
    safe_failure_code IS NULL OR (
      length(safe_failure_code) BETWEEN 1 AND 96
      AND safe_failure_code NOT GLOB '*[^A-Z0-9_]*'
    )
  ),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (coach_ai_chat_quality_case_id, event_kind),
  FOREIGN KEY (coach_ai_chat_quality_case_id) REFERENCES coach_ai_chat_quality_cases(coach_ai_chat_quality_case_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_chat_quality_events_case_history
  ON coach_ai_chat_quality_events(coach_ai_chat_quality_case_id, created_at_utc, coach_ai_chat_quality_event_id);

CREATE TRIGGER coach_ai_chat_quality_cases_guard_update
BEFORE UPDATE ON coach_ai_chat_quality_cases
WHEN NEW.coach_ai_chat_quality_case_id IS NOT OLD.coach_ai_chat_quality_case_id
  OR NEW.user_id IS NOT OLD.user_id
  OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.account_id IS NOT OLD.account_id
  OR NEW.coach_ai_chat_conversation_id IS NOT OLD.coach_ai_chat_conversation_id
  OR NEW.user_message_id IS NOT OLD.user_message_id
  OR NEW.assistant_message_id IS NOT OLD.assistant_message_id
  OR NEW.context_snapshot_json IS NOT OLD.context_snapshot_json
  OR NEW.context_snapshot_sha256 IS NOT OLD.context_snapshot_sha256
  OR NEW.metadata_json IS NOT OLD.metadata_json
  OR OLD.case_state <> 'open'
  OR NEW.case_state = 'open'
  OR NEW.resolved_by_user_id IS NULL
  OR NEW.resolved_at_utc IS NULL
BEGIN
  SELECT RAISE(ABORT, 'coach_ai_chat_quality_case_invalid_update');
END;

CREATE TRIGGER coach_ai_chat_quality_cases_no_delete
BEFORE DELETE ON coach_ai_chat_quality_cases BEGIN
  SELECT RAISE(ABORT, 'coach_ai_chat_quality_case_history_required');
END;

CREATE TRIGGER coach_ai_chat_quality_events_no_update
BEFORE UPDATE ON coach_ai_chat_quality_events BEGIN
  SELECT RAISE(ABORT, 'coach_ai_chat_quality_event_immutable');
END;

CREATE TRIGGER coach_ai_chat_quality_events_no_delete
BEFORE DELETE ON coach_ai_chat_quality_events BEGIN
  SELECT RAISE(ABORT, 'coach_ai_chat_quality_event_history_required');
END;`;

export const coachAiChatQualityFeedbackMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0071_coach_ai_chat_quality_feedback",
  executionOrder: 71,
  statements: Object.freeze([sql]),
});
