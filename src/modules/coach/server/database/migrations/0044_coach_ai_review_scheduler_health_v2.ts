import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

const sql = `CREATE TABLE coach_ai_review_scheduler_runs_v2 (
  coach_ai_review_scheduler_run_id TEXT PRIMARY KEY
    ${uuidCheck("coach_ai_review_scheduler_run_id")},
  origin TEXT NOT NULL CHECK (origin IN ('scheduled', 'manual')),
  state TEXT NOT NULL CHECK (state IN ('running', 'completed', 'failed')),
  started_at_utc TEXT NOT NULL ${utcCheck("started_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  summary_json TEXT CHECK (
    summary_json IS NULL OR (json_valid(summary_json) AND json_type(summary_json) = 'object')
  ),
  failure_code TEXT CHECK (
    failure_code IS NULL OR (
      length(failure_code) BETWEEN 1 AND 96 AND
      failure_code NOT GLOB '*[^A-Z0-9_]*'
    )
  ),
  CHECK (
    (state = 'running' AND finalized_at_utc IS NULL AND summary_json IS NULL AND failure_code IS NULL)
    OR
    (state = 'completed' AND finalized_at_utc IS NOT NULL AND summary_json IS NOT NULL AND failure_code IS NULL)
    OR
    (state = 'failed' AND finalized_at_utc IS NOT NULL AND summary_json IS NULL AND failure_code IS NOT NULL)
  ),
  CHECK (finalized_at_utc IS NULL OR finalized_at_utc >= started_at_utc)
) STRICT, WITHOUT ROWID;

CREATE INDEX coach_ai_review_scheduler_runs_v2_started
ON coach_ai_review_scheduler_runs_v2(started_at_utc DESC);

CREATE TRIGGER coach_ai_review_scheduler_runs_v2_no_delete
BEFORE DELETE ON coach_ai_review_scheduler_runs_v2
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_scheduler_history_required'); END;

CREATE TRIGGER coach_ai_review_scheduler_runs_v2_terminal_immutable
BEFORE UPDATE ON coach_ai_review_scheduler_runs_v2
WHEN OLD.state <> 'running'
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_scheduler_terminal_immutable'); END;

CREATE TRIGGER coach_ai_review_scheduler_runs_v2_transition_guard
BEFORE UPDATE ON coach_ai_review_scheduler_runs_v2
WHEN NEW.coach_ai_review_scheduler_run_id <> OLD.coach_ai_review_scheduler_run_id
  OR NEW.origin <> OLD.origin
  OR NEW.started_at_utc <> OLD.started_at_utc
  OR NEW.state NOT IN ('completed', 'failed')
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_scheduler_transition_invalid'); END;`;

export const coachAiReviewSchedulerHealthV2Migration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "coach",
    migrationId: "0044_coach_ai_review_scheduler_health_v2",
    executionOrder: 44,
    statements: Object.freeze([sql]),
  });
