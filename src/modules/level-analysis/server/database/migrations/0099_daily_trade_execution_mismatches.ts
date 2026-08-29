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

function decimalCheck(column: string): string {
  return `CHECK (length(${column}) BETWEEN 1 AND 128
    AND ${column} NOT GLOB '*[^0-9.-]*' AND ${column} NOT LIKE '+%'
    AND substr(${column}, -1, 1) <> '.' AND ${column} NOT IN ('-0', '-0.0', '')
    AND (length(${column}) - length(replace(${column}, '.', ''))) <= 1
    AND (length(${column}) - length(replace(${column}, '-', ''))) <= 1
    AND instr(${column}, '-') IN (0, 1))`;
}

const sql = `CREATE TABLE journal_round_trip_daily_trade_execution_mismatch_sets (
  execution_mismatch_set_id TEXT PRIMARY KEY ${uuidCheck("execution_mismatch_set_id")},
  daily_trade_job_id TEXT NOT NULL UNIQUE ${uuidCheck("daily_trade_job_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  market_session_set_version_id TEXT ${uuidCheck("market_session_set_version_id")},
  outcome TEXT NOT NULL CHECK (outcome = 'execution_mismatch'),
  validator_contract_version TEXT NOT NULL CHECK (
    validator_contract_version = 'daily_trade_execution_candle_match_v1'
  ),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, round_trip_version_id),
  UNIQUE (workspace_id, account_id, round_trip_id, execution_mismatch_set_id),
  FOREIGN KEY (daily_trade_job_id) REFERENCES level_analysis_daily_trade_jobs(daily_trade_job_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id)
    REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id, round_trip_version_id)
    REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_id, round_trip_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (market_session_set_version_id)
    REFERENCES level_analysis_market_session_set_versions(market_session_set_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_round_trip_daily_trade_execution_mismatches (
  execution_mismatch_set_id TEXT NOT NULL ${uuidCheck("execution_mismatch_set_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  execution_id TEXT NOT NULL ${uuidCheck("execution_id")},
  execution_sequence INTEGER NOT NULL CHECK (execution_sequence >= 0),
  event_kind TEXT NOT NULL CHECK (event_kind IN ('entry', 'add', 'partial_exit', 'final_exit')),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  executed_at_utc TEXT NOT NULL ${utcCheck("executed_at_utc")},
  quantity_decimal TEXT NOT NULL ${decimalCheck("quantity_decimal")},
  entered_price_decimal TEXT NOT NULL ${decimalCheck("entered_price_decimal")},
  candle_time_utc_seconds INTEGER NOT NULL CHECK (candle_time_utc_seconds > 0),
  mismatch_kind TEXT NOT NULL CHECK (
    mismatch_kind IN ('execution_minute_unavailable', 'execution_price_outside_candle')
  ),
  candle_low_decimal TEXT ${decimalCheck("candle_low_decimal")},
  candle_high_decimal TEXT ${decimalCheck("candle_high_decimal")},
  PRIMARY KEY (execution_mismatch_set_id, execution_id),
  CHECK (
    (mismatch_kind = 'execution_minute_unavailable'
      AND candle_low_decimal IS NULL AND candle_high_decimal IS NULL)
    OR (mismatch_kind = 'execution_price_outside_candle'
      AND candle_low_decimal IS NOT NULL AND candle_high_decimal IS NOT NULL)
  ),
  FOREIGN KEY (execution_mismatch_set_id) REFERENCES journal_round_trip_daily_trade_execution_mismatch_sets(execution_mismatch_set_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, execution_id)
    REFERENCES journal_executions(workspace_id, account_id, execution_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE TABLE journal_round_trip_daily_trade_execution_mismatch_confirmations (
  execution_mismatch_confirmation_id TEXT PRIMARY KEY ${uuidCheck("execution_mismatch_confirmation_id")},
  execution_mismatch_set_id TEXT NOT NULL UNIQUE ${uuidCheck("execution_mismatch_set_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  confirmation_kind TEXT NOT NULL CHECK (confirmation_kind = 'broker_record_confirmed'),
  confirmed_at_utc TEXT NOT NULL ${utcCheck("confirmed_at_utc")},
  FOREIGN KEY (execution_mismatch_set_id) REFERENCES journal_round_trip_daily_trade_execution_mismatch_sets(execution_mismatch_set_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_daily_trade_execution_mismatch_current
  ON journal_round_trip_daily_trade_execution_mismatch_sets(
    workspace_id, account_id, round_trip_id, created_at_utc DESC
  );

CREATE TRIGGER journal_daily_trade_execution_mismatch_rows_scope_guard
BEFORE INSERT ON journal_round_trip_daily_trade_execution_mismatches
WHEN NOT EXISTS (
  SELECT 1 FROM journal_round_trip_daily_trade_execution_mismatch_sets mismatch_set
  WHERE mismatch_set.execution_mismatch_set_id = NEW.execution_mismatch_set_id
    AND mismatch_set.workspace_id = NEW.workspace_id
    AND mismatch_set.account_id = NEW.account_id
)
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_execution_mismatch_scope_mismatch'); END;

CREATE TRIGGER journal_daily_trade_execution_mismatch_confirmation_scope_guard
BEFORE INSERT ON journal_round_trip_daily_trade_execution_mismatch_confirmations
WHEN NOT EXISTS (
  SELECT 1 FROM journal_round_trip_daily_trade_execution_mismatch_sets mismatch_set
  WHERE mismatch_set.execution_mismatch_set_id = NEW.execution_mismatch_set_id
    AND mismatch_set.user_id = NEW.user_id
    AND mismatch_set.workspace_id = NEW.workspace_id
    AND mismatch_set.account_id = NEW.account_id
)
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_execution_mismatch_confirmation_scope_mismatch'); END;

CREATE TRIGGER journal_daily_trade_execution_mismatch_sets_no_update
BEFORE UPDATE ON journal_round_trip_daily_trade_execution_mismatch_sets
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_execution_mismatch_immutable'); END;
CREATE TRIGGER journal_daily_trade_execution_mismatch_sets_no_delete
BEFORE DELETE ON journal_round_trip_daily_trade_execution_mismatch_sets
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_execution_mismatch_history_required'); END;
CREATE TRIGGER journal_daily_trade_execution_mismatches_no_update
BEFORE UPDATE ON journal_round_trip_daily_trade_execution_mismatches
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_execution_mismatch_immutable'); END;
CREATE TRIGGER journal_daily_trade_execution_mismatches_no_delete
BEFORE DELETE ON journal_round_trip_daily_trade_execution_mismatches
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_execution_mismatch_history_required'); END;
CREATE TRIGGER journal_daily_trade_execution_mismatch_confirmations_no_update
BEFORE UPDATE ON journal_round_trip_daily_trade_execution_mismatch_confirmations
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_execution_mismatch_confirmation_immutable'); END;
CREATE TRIGGER journal_daily_trade_execution_mismatch_confirmations_no_delete
BEFORE DELETE ON journal_round_trip_daily_trade_execution_mismatch_confirmations
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_execution_mismatch_confirmation_history_required'); END;`;

/** Follows the serialized 0095 through 0098 demo-data lineage. */
export const dailyTradeExecutionMismatchesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "level_analysis",
  migrationId: "0099_daily_trade_execution_mismatches",
  executionOrder: 99,
  statements: Object.freeze([sql]),
});
