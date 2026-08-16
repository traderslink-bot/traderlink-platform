import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4'
    AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB
    '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

const sql = `CREATE TABLE journal_round_trip_daily_trade_analysis_pattern_occurrences (
  daily_trade_analysis_version_id TEXT NOT NULL
    ${uuidCheck("daily_trade_analysis_version_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  execution_id TEXT NOT NULL ${uuidCheck("execution_id")},
  pattern_sequence INTEGER NOT NULL CHECK (pattern_sequence >= 0),
  event_kind TEXT NOT NULL CHECK (
    event_kind IN ('entry', 'add', 'partial_exit', 'final_exit')
  ),
  executed_at_utc TEXT NOT NULL ${utcCheck("executed_at_utc")},
  pattern_kind TEXT NOT NULL CHECK (
    length(trim(pattern_kind)) BETWEEN 1 AND 120
    AND pattern_kind = trim(pattern_kind)
  ),
  timeframe TEXT NOT NULL CHECK (timeframe IN ('1m', '5m')),
  candles_before_execution INTEGER NOT NULL CHECK (
    candles_before_execution IN (0, 1, 2)
  ),
  pattern_time_utc_seconds INTEGER NOT NULL CHECK (
    pattern_time_utc_seconds > 0
  ),
  known_at_utc_seconds INTEGER NOT NULL CHECK (known_at_utc_seconds > 0),
  PRIMARY KEY (
    daily_trade_analysis_version_id,
    execution_id,
    pattern_sequence
  ),
  FOREIGN KEY (daily_trade_analysis_version_id)
    REFERENCES journal_round_trip_daily_trade_analysis_versions(
      daily_trade_analysis_version_id
    ) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id)
    REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (execution_id) REFERENCES journal_executions(execution_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

INSERT INTO journal_round_trip_daily_trade_analysis_pattern_occurrences (
  daily_trade_analysis_version_id,
  workspace_id,
  account_id,
  round_trip_id,
  execution_id,
  pattern_sequence,
  event_kind,
  executed_at_utc,
  pattern_kind,
  timeframe,
  candles_before_execution,
  pattern_time_utc_seconds,
  known_at_utc_seconds
)
SELECT
  snapshot.daily_trade_analysis_version_id,
  analysis.workspace_id,
  analysis.account_id,
  analysis.round_trip_id,
  snapshot.execution_id,
  CAST(pattern.key AS INTEGER),
  snapshot.event_kind,
  json_extract(snapshot.snapshot_json, '$.event.executedAtUtc'),
  json_extract(pattern.value, '$.kind'),
  json_extract(pattern.value, '$.timeframe'),
  json_extract(pattern.value, '$.candlesBeforeExecution'),
  json_extract(pattern.value, '$.time'),
  json_extract(pattern.value, '$.knownAtTime')
FROM journal_round_trip_daily_trade_analysis_event_snapshots snapshot
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_version_id =
    snapshot.daily_trade_analysis_version_id
JOIN journal_round_trip_daily_trade_analyses analysis
  ON analysis.daily_trade_analysis_id = version.daily_trade_analysis_id
JOIN json_each(snapshot.snapshot_json, '$.patterns') pattern
WHERE json_extract(pattern.value, '$.availableAtExecution') = 1
  AND json_extract(pattern.value, '$.timeframe') IN ('1m', '5m')
  AND json_extract(pattern.value, '$.candlesBeforeExecution') IN (0, 1, 2)
  AND json_type(pattern.value, '$.kind') = 'text'
  AND length(trim(json_extract(pattern.value, '$.kind'))) BETWEEN 1 AND 120
  AND json_extract(pattern.value, '$.kind') =
    trim(json_extract(pattern.value, '$.kind'))
  AND json_type(pattern.value, '$.time') = 'integer'
  AND json_extract(pattern.value, '$.time') > 0
  AND json_type(pattern.value, '$.knownAtTime') = 'integer'
  AND json_extract(pattern.value, '$.knownAtTime') > 0
  AND json_type(snapshot.snapshot_json, '$.event.executedAtUtc') = 'text'
  AND length(json_extract(snapshot.snapshot_json, '$.event.executedAtUtc')) = 24
  AND json_extract(snapshot.snapshot_json, '$.event.executedAtUtc') GLOB
    '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z';

CREATE INDEX journal_daily_trade_pattern_occurrences_account_pattern_time
  ON journal_round_trip_daily_trade_analysis_pattern_occurrences (
    workspace_id,
    account_id,
    pattern_kind,
    executed_at_utc DESC,
    execution_id DESC,
    pattern_sequence DESC
  );
CREATE INDEX journal_daily_trade_pattern_occurrences_analysis_version
  ON journal_round_trip_daily_trade_analysis_pattern_occurrences (
    daily_trade_analysis_version_id,
    pattern_kind,
    timeframe,
    event_kind,
    candles_before_execution
  );

CREATE TRIGGER journal_daily_trade_pattern_occurrences_scope_guard
BEFORE INSERT ON journal_round_trip_daily_trade_analysis_pattern_occurrences
WHEN NOT EXISTS (
  SELECT 1
  FROM journal_round_trip_daily_trade_analysis_versions version
  JOIN journal_round_trip_daily_trade_analyses analysis
    ON analysis.daily_trade_analysis_id = version.daily_trade_analysis_id
  WHERE version.daily_trade_analysis_version_id =
      NEW.daily_trade_analysis_version_id
    AND analysis.workspace_id = NEW.workspace_id
    AND analysis.account_id = NEW.account_id
    AND analysis.round_trip_id = NEW.round_trip_id
)
BEGIN
  SELECT RAISE(ABORT, 'journal_daily_trade_pattern_occurrence_scope_mismatch');
END;

CREATE TRIGGER journal_daily_trade_pattern_occurrences_no_update
BEFORE UPDATE ON journal_round_trip_daily_trade_analysis_pattern_occurrences
BEGIN
  SELECT RAISE(ABORT, 'journal_daily_trade_pattern_occurrence_immutable');
END;
CREATE TRIGGER journal_daily_trade_pattern_occurrences_no_delete
BEFORE DELETE ON journal_round_trip_daily_trade_analysis_pattern_occurrences
BEGIN
  SELECT RAISE(ABORT, 'journal_daily_trade_pattern_occurrence_history_required');
END;`;

export const dailyTradePatternOccurrencesMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "level_analysis",
    migrationId: "0059_daily_trade_pattern_occurrences",
    executionOrder: 59,
    statements: Object.freeze([sql]),
  });
