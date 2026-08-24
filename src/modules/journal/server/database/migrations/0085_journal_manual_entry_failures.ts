import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

const sql = `CREATE TABLE journal_manual_entry_failures (
  manual_entry_failure_id TEXT PRIMARY KEY ${uuidCheck("manual_entry_failure_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  tracker TEXT NOT NULL CHECK (tracker IN ('day', 'quick', 'swing')),
  failure_fingerprint_sha256 TEXT NOT NULL UNIQUE CHECK (
    length(failure_fingerprint_sha256) = 64
    AND failure_fingerprint_sha256 NOT GLOB '*[^0-9a-f]*'
  ),
  safe_reason_category TEXT NOT NULL CHECK (safe_reason_category IN (
    'entry_changed', 'duplicate_conflict', 'entry_dates_need_review',
    'save_conflict', 'save_unavailable'
  )),
  occurred_at_utc TEXT NOT NULL CHECK (
    length(occurred_at_utc) = 24
    AND occurred_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  created_at_utc TEXT NOT NULL CHECK (
    length(created_at_utc) = 24
    AND created_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_manual_entry_failures_user_recent
  ON journal_manual_entry_failures(user_id, occurred_at_utc DESC,
    manual_entry_failure_id DESC);
CREATE INDEX journal_manual_entry_failures_account_recent
  ON journal_manual_entry_failures(workspace_id, account_id, occurred_at_utc DESC,
    manual_entry_failure_id DESC);`;

export const journalManualEntryFailuresMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0085_journal_manual_entry_failures",
  executionOrder: 85,
  statements: Object.freeze([sql]),
});
