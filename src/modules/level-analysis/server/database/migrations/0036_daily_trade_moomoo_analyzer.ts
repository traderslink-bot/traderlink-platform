import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB
    '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

function decimalCheck(column: string): string {
  return `CHECK (length(${column}) BETWEEN 1 AND 128
    AND ${column} NOT GLOB '*[^0-9.-]*' AND ${column} NOT LIKE '+%'
    AND substr(${column}, -1, 1) <> '.' AND ${column} NOT IN ('-0', '-0.0', '')
    AND (length(${column}) - length(replace(${column}, '.', ''))) <= 1
    AND (length(${column}) - length(replace(${column}, '-', ''))) <= 1
    AND instr(${column}, '-') IN (0, 1))`;
}

/*
 * SQLite cannot alter a CHECK constraint in place. The analyzer tables form a
 * small FK graph, so rename each old table, rebuild the same graph against the
 * new parent, copy immutable rows, then remove the detached old graph leaf-up.
 * Foreign keys remain enabled for the entire migration.
 */
const sql = `DROP TRIGGER level_analysis_market_session_sets_no_delete;
DROP INDEX level_analysis_market_session_sets_work;
DROP TRIGGER level_analysis_daily_trade_jobs_no_delete;
DROP INDEX level_analysis_daily_trade_jobs_available;
DROP TRIGGER journal_round_trip_daily_trade_analyses_no_delete;
DROP TRIGGER journal_round_trip_daily_trade_analysis_versions_no_update;
DROP TRIGGER journal_round_trip_daily_trade_analysis_versions_no_delete;

ALTER TABLE level_analysis_market_session_sets RENAME TO level_analysis_market_session_sets_0036_old;
CREATE TABLE level_analysis_market_session_sets (
  market_session_set_id TEXT PRIMARY KEY ${uuidCheck("market_session_set_id")},
  provider_key TEXT NOT NULL CHECK (provider_key IN ('yahoo_chart', 'moomoo_history_kline')),
  provider_adapter_version TEXT NOT NULL CHECK (
    (provider_key = 'yahoo_chart' AND provider_adapter_version = 'yahoo_chart_v1') OR
    (provider_key = 'moomoo_history_kline' AND provider_adapter_version = 'moomoo_history_kline_v1')
  ),
  provider_symbol TEXT NOT NULL CHECK (length(provider_symbol) BETWEEN 1 AND 16 AND provider_symbol = upper(trim(provider_symbol)) AND provider_symbol NOT GLOB '*[^A-Z0-9.-]*'),
  exchange_identity TEXT NOT NULL CHECK (length(exchange_identity) BETWEEN 1 AND 64 AND exchange_identity = lower(trim(exchange_identity)) AND exchange_identity NOT GLOB '*[^a-z0-9_-]*'),
  trading_date_new_york TEXT NOT NULL CHECK (length(trading_date_new_york) = 10 AND trading_date_new_york GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  interval TEXT NOT NULL CHECK (interval = '1m'),
  session_policy TEXT NOT NULL CHECK (session_policy = 'america_new_york_extended_0400_2000_v1'),
  current_version_id TEXT ${uuidCheck("current_version_id")},
  current_coverage_end_utc TEXT ${utcCheck("current_coverage_end_utc")},
  current_status TEXT NOT NULL CHECK (current_status IN ('queued', 'ready', 'no_coverage', 'provider_unavailable')),
  lease_expires_at_utc TEXT ${utcCheck("lease_expires_at_utc")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (provider_key, provider_adapter_version, provider_symbol, exchange_identity, trading_date_new_york, interval, session_policy)
) STRICT;
INSERT INTO level_analysis_market_session_sets SELECT * FROM level_analysis_market_session_sets_0036_old;

ALTER TABLE level_analysis_market_session_set_versions RENAME TO level_analysis_market_session_set_versions_0036_old;
CREATE TABLE level_analysis_market_session_set_versions (
  market_session_set_version_id TEXT PRIMARY KEY ${uuidCheck("market_session_set_version_id")},
  market_session_set_id TEXT NOT NULL ${uuidCheck("market_session_set_id")},
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  requested_start_utc TEXT NOT NULL ${utcCheck("requested_start_utc")},
  requested_end_utc TEXT NOT NULL ${utcCheck("requested_end_utc")},
  provider_exchange_timezone TEXT,
  provider_utc_offset_seconds INTEGER,
  outcome TEXT NOT NULL CHECK (outcome IN ('ready', 'no_coverage', 'provider_unavailable')),
  failure_reason_code TEXT,
  candle_sha256 TEXT CHECK (length(candle_sha256) = 64 AND candle_sha256 = lower(candle_sha256)),
  retrieved_at_utc TEXT NOT NULL ${utcCheck("retrieved_at_utc")},
  UNIQUE (market_session_set_id, revision_number),
  FOREIGN KEY (market_session_set_id) REFERENCES level_analysis_market_session_sets(market_session_set_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;
INSERT INTO level_analysis_market_session_set_versions SELECT * FROM level_analysis_market_session_set_versions_0036_old;

ALTER TABLE level_analysis_market_session_candles RENAME TO level_analysis_market_session_candles_0036_old;
CREATE TABLE level_analysis_market_session_candles (
  market_session_set_version_id TEXT NOT NULL ${uuidCheck("market_session_set_version_id")},
  candle_time_utc_seconds INTEGER NOT NULL CHECK (candle_time_utc_seconds > 0),
  open_decimal TEXT NOT NULL ${decimalCheck("open_decimal")},
  high_decimal TEXT NOT NULL ${decimalCheck("high_decimal")},
  low_decimal TEXT NOT NULL ${decimalCheck("low_decimal")},
  close_decimal TEXT NOT NULL ${decimalCheck("close_decimal")},
  volume_decimal TEXT NOT NULL ${decimalCheck("volume_decimal")},
  PRIMARY KEY (market_session_set_version_id, candle_time_utc_seconds),
  FOREIGN KEY (market_session_set_version_id) REFERENCES level_analysis_market_session_set_versions(market_session_set_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;
INSERT INTO level_analysis_market_session_candles SELECT * FROM level_analysis_market_session_candles_0036_old;

ALTER TABLE level_analysis_daily_trade_jobs RENAME TO level_analysis_daily_trade_jobs_0036_old;
CREATE TABLE level_analysis_daily_trade_jobs (
  daily_trade_job_id TEXT PRIMARY KEY ${uuidCheck("daily_trade_job_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")}, workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")}, account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")}, round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")}, market_session_set_id TEXT NOT NULL ${uuidCheck("market_session_set_id")},
  desired_coverage_end_utc TEXT NOT NULL ${utcCheck("desired_coverage_end_utc")}, next_attempt_at_utc TEXT NOT NULL ${utcCheck("next_attempt_at_utc")},
  status TEXT NOT NULL CHECK (status IN ('queued', 'leased', 'completed', 'no_coverage', 'provider_unavailable', 'expired')), attempt_count INTEGER NOT NULL CHECK (attempt_count >= 0),
  lease_expires_at_utc TEXT ${utcCheck("lease_expires_at_utc")}, completed_at_utc TEXT ${utcCheck("completed_at_utc")}, created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")}, updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc), UNIQUE (workspace_id, account_id, round_trip_version_id, desired_coverage_end_utc),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id) REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (market_session_set_id) REFERENCES level_analysis_market_session_sets(market_session_set_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;
INSERT INTO level_analysis_daily_trade_jobs SELECT * FROM level_analysis_daily_trade_jobs_0036_old;

ALTER TABLE journal_round_trip_daily_trade_analyses RENAME TO journal_round_trip_daily_trade_analyses_0036_old;
CREATE TABLE journal_round_trip_daily_trade_analyses (
  daily_trade_analysis_id TEXT PRIMARY KEY ${uuidCheck("daily_trade_analysis_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")}, workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")}, account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")}, round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")}, market_session_set_version_id TEXT ${uuidCheck("market_session_set_version_id")},
  status TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'no_coverage', 'provider_unavailable', 'expired')), current_revision INTEGER NOT NULL CHECK (current_revision > 0),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")}, updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")}, CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, round_trip_id),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id) REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (market_session_set_version_id) REFERENCES level_analysis_market_session_set_versions(market_session_set_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;
INSERT INTO journal_round_trip_daily_trade_analyses SELECT * FROM journal_round_trip_daily_trade_analyses_0036_old;

ALTER TABLE journal_round_trip_daily_trade_analysis_versions RENAME TO journal_round_trip_daily_trade_analysis_versions_0036_old;
CREATE TABLE journal_round_trip_daily_trade_analysis_versions (
  daily_trade_analysis_version_id TEXT PRIMARY KEY ${uuidCheck("daily_trade_analysis_version_id")}, daily_trade_analysis_id TEXT NOT NULL ${uuidCheck("daily_trade_analysis_id")}, revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  market_session_set_version_id TEXT ${uuidCheck("market_session_set_version_id")}, status TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'no_coverage', 'provider_unavailable', 'expired')),
  analyzer_contract_version TEXT NOT NULL CHECK (analyzer_contract_version = 'daily_trade_analyzer_v1'), created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (daily_trade_analysis_id, revision_number),
  FOREIGN KEY (daily_trade_analysis_id) REFERENCES journal_round_trip_daily_trade_analyses(daily_trade_analysis_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (market_session_set_version_id) REFERENCES level_analysis_market_session_set_versions(market_session_set_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;
INSERT INTO journal_round_trip_daily_trade_analysis_versions SELECT * FROM journal_round_trip_daily_trade_analysis_versions_0036_old;

ALTER TABLE journal_round_trip_daily_trade_analysis_event_snapshots RENAME TO journal_round_trip_daily_trade_analysis_event_snapshots_0036_old;
CREATE TABLE journal_round_trip_daily_trade_analysis_event_snapshots (
  daily_trade_analysis_version_id TEXT NOT NULL ${uuidCheck("daily_trade_analysis_version_id")}, execution_id TEXT NOT NULL ${uuidCheck("execution_id")},
  event_kind TEXT NOT NULL CHECK (event_kind IN ('entry', 'add', 'partial_exit', 'final_exit')), candle_time_utc_seconds INTEGER,
  snapshot_json TEXT NOT NULL CHECK (json_valid(snapshot_json) AND json_type(snapshot_json) = 'object'), PRIMARY KEY (daily_trade_analysis_version_id, execution_id),
  FOREIGN KEY (daily_trade_analysis_version_id) REFERENCES journal_round_trip_daily_trade_analysis_versions(daily_trade_analysis_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (execution_id) REFERENCES journal_executions(execution_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;
INSERT INTO journal_round_trip_daily_trade_analysis_event_snapshots SELECT * FROM journal_round_trip_daily_trade_analysis_event_snapshots_0036_old;

ALTER TABLE journal_round_trip_daily_trade_analysis_post_exit_paths RENAME TO journal_round_trip_daily_trade_analysis_post_exit_paths_0036_old;
CREATE TABLE journal_round_trip_daily_trade_analysis_post_exit_paths (
  daily_trade_analysis_version_id TEXT NOT NULL ${uuidCheck("daily_trade_analysis_version_id")}, minutes_after_exit INTEGER NOT NULL CHECK (minutes_after_exit IN (5, 15, 30, 60)),
  favorable_move_decimal TEXT ${decimalCheck("favorable_move_decimal")}, observed_at_candle_time_utc_seconds INTEGER,
  PRIMARY KEY (daily_trade_analysis_version_id, minutes_after_exit),
  FOREIGN KEY (daily_trade_analysis_version_id) REFERENCES journal_round_trip_daily_trade_analysis_versions(daily_trade_analysis_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;
INSERT INTO journal_round_trip_daily_trade_analysis_post_exit_paths SELECT * FROM journal_round_trip_daily_trade_analysis_post_exit_paths_0036_old;

DROP TABLE level_analysis_market_session_candles_0036_old;
DROP TABLE level_analysis_daily_trade_jobs_0036_old;
DROP TABLE journal_round_trip_daily_trade_analysis_event_snapshots_0036_old;
DROP TABLE journal_round_trip_daily_trade_analysis_post_exit_paths_0036_old;
DROP TABLE journal_round_trip_daily_trade_analysis_versions_0036_old;
DROP TABLE journal_round_trip_daily_trade_analyses_0036_old;
DROP TABLE level_analysis_market_session_set_versions_0036_old;
DROP TABLE level_analysis_market_session_sets_0036_old;

CREATE INDEX level_analysis_market_session_sets_work ON level_analysis_market_session_sets(current_status, lease_expires_at_utc, updated_at_utc);
CREATE INDEX level_analysis_daily_trade_jobs_available ON level_analysis_daily_trade_jobs(status, next_attempt_at_utc, lease_expires_at_utc);
CREATE TRIGGER level_analysis_market_session_sets_no_delete BEFORE DELETE ON level_analysis_market_session_sets BEGIN SELECT RAISE(ABORT, 'level_analysis_market_session_history_required'); END;
CREATE TRIGGER level_analysis_daily_trade_jobs_no_delete BEFORE DELETE ON level_analysis_daily_trade_jobs BEGIN SELECT RAISE(ABORT, 'level_analysis_daily_trade_job_history_required'); END;
CREATE TRIGGER journal_round_trip_daily_trade_analyses_no_delete BEFORE DELETE ON journal_round_trip_daily_trade_analyses BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_analysis_history_required'); END;
CREATE TRIGGER journal_round_trip_daily_trade_analysis_versions_no_update BEFORE UPDATE ON journal_round_trip_daily_trade_analysis_versions BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_analysis_version_immutable'); END;
CREATE TRIGGER journal_round_trip_daily_trade_analysis_versions_no_delete BEFORE DELETE ON journal_round_trip_daily_trade_analysis_versions BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_analysis_history_required'); END;`;

export const dailyTradeMoomooAnalyzerMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "level_analysis",
  migrationId: "0036_daily_trade_moomoo_analyzer",
  executionOrder: 36,
  statements: Object.freeze([sql]),
});
