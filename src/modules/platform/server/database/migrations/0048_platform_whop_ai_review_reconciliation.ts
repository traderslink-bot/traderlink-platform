import type { PlatformMigration } from "../platform-migration-contract";

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

function utcCheck(column: string, nullable = false): string {
  const value = `length(${column}) = 24
      AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${value}${nullable ? ")" : ")"})`;
}

const sql = `CREATE TABLE platform_whop_reconciliation_runs (
  run_id TEXT PRIMARY KEY ${uuidCheck("run_id")},
  state TEXT NOT NULL CHECK (state IN ('running', 'completed', 'failed')),
  started_at_utc TEXT NOT NULL ${utcCheck("started_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc", true)},
  page_count INTEGER NOT NULL DEFAULT 0 CHECK (page_count >= 0),
  fetched_count INTEGER NOT NULL DEFAULT 0 CHECK (fetched_count >= 0),
  applied_count INTEGER NOT NULL DEFAULT 0 CHECK (applied_count >= 0),
  duplicate_count INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_count >= 0),
  stale_count INTEGER NOT NULL DEFAULT 0 CHECK (stale_count >= 0),
  conflict_count INTEGER NOT NULL DEFAULT 0 CHECK (conflict_count >= 0),
  ignored_count INTEGER NOT NULL DEFAULT 0 CHECK (ignored_count >= 0),
  failure_code TEXT CHECK (
    failure_code IS NULL OR (
      length(failure_code) BETWEEN 1 AND 96
      AND failure_code NOT GLOB '*[^A-Z0-9_]*'
    )
  ),
  CHECK (
    (state = 'running' AND finalized_at_utc IS NULL AND failure_code IS NULL)
    OR (state = 'completed' AND finalized_at_utc IS NOT NULL AND failure_code IS NULL)
    OR (state = 'failed' AND finalized_at_utc IS NOT NULL AND failure_code IS NOT NULL)
  ),
  CHECK (finalized_at_utc IS NULL OR finalized_at_utc >= started_at_utc),
  CHECK (applied_count + duplicate_count + stale_count + conflict_count + ignored_count <= fetched_count)
) STRICT, WITHOUT ROWID;

CREATE INDEX platform_whop_reconciliation_runs_started
ON platform_whop_reconciliation_runs(started_at_utc DESC);

CREATE UNIQUE INDEX platform_whop_reconciliation_runs_one_running
ON platform_whop_reconciliation_runs(state) WHERE state = 'running';

CREATE TRIGGER platform_whop_reconciliation_runs_no_delete
BEFORE DELETE ON platform_whop_reconciliation_runs
BEGIN SELECT RAISE(ABORT, 'platform_whop_reconciliation_history_required'); END;

CREATE TRIGGER platform_whop_reconciliation_runs_terminal_immutable
BEFORE UPDATE ON platform_whop_reconciliation_runs
WHEN OLD.state <> 'running'
BEGIN SELECT RAISE(ABORT, 'platform_whop_reconciliation_terminal_immutable'); END;

CREATE TRIGGER platform_whop_reconciliation_runs_transition_guard
BEFORE UPDATE ON platform_whop_reconciliation_runs
WHEN NEW.run_id <> OLD.run_id
  OR NEW.started_at_utc <> OLD.started_at_utc
  OR NEW.state NOT IN ('completed', 'failed')
BEGIN SELECT RAISE(ABORT, 'platform_whop_reconciliation_transition_invalid'); END;`;

export const platformWhopAiReviewReconciliationMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "platform",
    migrationId: "0048_platform_whop_ai_review_reconciliation",
    executionOrder: 48,
    statements: Object.freeze([sql]),
  });
