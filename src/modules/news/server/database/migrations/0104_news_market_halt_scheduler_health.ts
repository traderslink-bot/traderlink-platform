import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

const sql = `CREATE TABLE news_market_halt_scheduler_runs (
  market_halt_scheduler_run_id TEXT PRIMARY KEY
    ${uuidCheck("market_halt_scheduler_run_id")},
  state TEXT NOT NULL CHECK (state IN ('running', 'completed', 'failed')),
  started_at_utc TEXT NOT NULL ${utcCheck("started_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  source_statuses_json TEXT CHECK (
    source_statuses_json IS NULL OR (
      json_valid(source_statuses_json) AND json_type(source_statuses_json) = 'array'
    )
  ),
  failure_code TEXT CHECK (
    failure_code IS NULL OR failure_code = 'MARKET_HALT_CRON_FAILED'
  ),
  CHECK (
    (state = 'running' AND finalized_at_utc IS NULL AND source_statuses_json IS NULL AND failure_code IS NULL)
    OR
    (state = 'completed' AND finalized_at_utc IS NOT NULL AND source_statuses_json IS NOT NULL AND failure_code IS NULL)
    OR
    (state = 'failed' AND finalized_at_utc IS NOT NULL AND failure_code IS NOT NULL)
  ),
  CHECK (finalized_at_utc IS NULL OR finalized_at_utc >= started_at_utc)
) STRICT, WITHOUT ROWID;

CREATE INDEX news_market_halt_scheduler_runs_finalized
ON news_market_halt_scheduler_runs(finalized_at_utc DESC);

CREATE TRIGGER news_market_halt_scheduler_runs_no_delete
BEFORE DELETE ON news_market_halt_scheduler_runs
BEGIN SELECT RAISE(ABORT, 'news_market_halt_scheduler_history_required'); END;

CREATE TRIGGER news_market_halt_scheduler_runs_terminal_immutable
BEFORE UPDATE ON news_market_halt_scheduler_runs
WHEN OLD.state <> 'running'
BEGIN SELECT RAISE(ABORT, 'news_market_halt_scheduler_terminal_immutable'); END;

CREATE TRIGGER news_market_halt_scheduler_runs_transition_guard
BEFORE UPDATE ON news_market_halt_scheduler_runs
WHEN NEW.market_halt_scheduler_run_id <> OLD.market_halt_scheduler_run_id
  OR NEW.started_at_utc <> OLD.started_at_utc
  OR NEW.state NOT IN ('completed', 'failed')
BEGIN SELECT RAISE(ABORT, 'news_market_halt_scheduler_transition_invalid'); END;`;

/** Records only scheduler health and source availability; it never stores users or Push endpoints. */
export const newsMarketHaltSchedulerHealthMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "news",
  migrationId: "0104_news_market_halt_scheduler_health",
  executionOrder: 104,
  statements: Object.freeze([sql]),
});
