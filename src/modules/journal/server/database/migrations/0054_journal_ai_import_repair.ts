import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}
function utcCheck(column: string, nullable = false): string {
  const check = `length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${check}))`;
}

const sql = `CREATE TABLE journal_ai_import_repair_jobs (
  repair_job_id TEXT PRIMARY KEY ${uuidCheck("repair_job_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  import_attempt_id TEXT NOT NULL ${uuidCheck("import_attempt_id")},
  support_consent_id TEXT NOT NULL ${uuidCheck("support_consent_id")},
  discord_completion_requested INTEGER NOT NULL CHECK (discord_completion_requested IN (0, 1)),
  job_state TEXT NOT NULL CHECK (job_state IN (
    'queued', 'processing', 'preview_ready', 'completed', 'failed', 'cancelled'
  )),
  retry_count INTEGER NOT NULL CHECK (retry_count >= 0),
  safe_failure_code TEXT CHECK (safe_failure_code IS NULL OR (
    length(safe_failure_code) BETWEEN 1 AND 64
    AND safe_failure_code NOT GLOB '*[^a-z0-9_-]*'
  )),
  completed_import_batch_id TEXT ${uuidCheck("completed_import_batch_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  completed_at_utc TEXT ${utcCheck("completed_at_utc", true)},
  CHECK ((job_state = 'completed' AND completed_import_batch_id IS NOT NULL AND completed_at_utc IS NOT NULL)
    OR (job_state <> 'completed' AND completed_import_batch_id IS NULL AND completed_at_utc IS NULL)),
  UNIQUE (workspace_id, account_id, import_attempt_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, import_attempt_id)
    REFERENCES journal_import_attempts(workspace_id, account_id, import_attempt_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, support_consent_id)
    REFERENCES journal_statement_support_consents(workspace_id, account_id, support_consent_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, completed_import_batch_id)
    REFERENCES journal_import_batches(workspace_id, account_id, import_batch_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_ai_import_repair_jobs_queue
  ON journal_ai_import_repair_jobs(job_state, created_at_utc, repair_job_id);

CREATE TRIGGER journal_ai_import_repair_jobs_guard_update
BEFORE UPDATE ON journal_ai_import_repair_jobs
WHEN NEW.repair_job_id IS NOT OLD.repair_job_id
  OR NEW.user_id IS NOT OLD.user_id OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.account_id IS NOT OLD.account_id OR NEW.import_attempt_id IS NOT OLD.import_attempt_id
  OR NEW.support_consent_id IS NOT OLD.support_consent_id
  OR NEW.discord_completion_requested IS NOT OLD.discord_completion_requested
  OR NEW.created_at_utc IS NOT OLD.created_at_utc OR NEW.updated_at_utc < OLD.updated_at_utc
  OR OLD.job_state IN ('completed', 'failed', 'cancelled')
BEGIN SELECT RAISE(ABORT, 'journal_ai_import_repair_job_invalid_update'); END;

CREATE TRIGGER journal_ai_import_repair_jobs_no_delete
BEFORE DELETE ON journal_ai_import_repair_jobs BEGIN
  SELECT RAISE(ABORT, 'journal_ai_import_repair_job_history_required');
END;`;

export const journalAiImportRepairMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0054_journal_ai_import_repair",
  executionOrder: 54,
  statements: Object.freeze([sql]),
});
