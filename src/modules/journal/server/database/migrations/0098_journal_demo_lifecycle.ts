import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 9, 1) = '-' AND substr(${column}, 14, 1) = '-'
    AND substr(${column}, 19, 1) = '-' AND substr(${column}, 24, 1) = '-'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

const sql = `CREATE TABLE journal_demo_lifecycle (
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state = 'cleared'),
  cleared_demo_account_id TEXT NOT NULL ${uuidCheck("cleared_demo_account_id")},
  cleared_at_utc TEXT NOT NULL ${utcCheck("cleared_at_utc")},
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (user_id, workspace_id) REFERENCES platform_workspace_memberships(user_id, workspace_id)
    ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;

CREATE TRIGGER journal_demo_lifecycle_immutable_update
BEFORE UPDATE ON journal_demo_lifecycle
BEGIN SELECT RAISE(ABORT, 'journal demo lifecycle is immutable'); END;`;

export const journalDemoLifecycleMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0098_journal_demo_lifecycle",
  executionOrder: 98,
  statements: Object.freeze([sql]),
});
