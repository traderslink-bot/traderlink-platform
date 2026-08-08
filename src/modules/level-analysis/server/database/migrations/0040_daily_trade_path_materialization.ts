import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function decimalCheck(column: string): string {
  return `CHECK (${column} IS NULL OR (length(${column}) BETWEEN 1 AND 128
    AND ${column} NOT GLOB '*[^0-9.-]*' AND ${column} NOT LIKE '+%'
    AND substr(${column}, -1, 1) <> '.' AND ${column} NOT IN ('-', '.', '-.', '-0', '-0.0', '')
    AND (length(${column}) - length(replace(${column}, '.', ''))) <= 1
    AND (length(${column}) - length(replace(${column}, '-', ''))) <= 1
    AND instr(${column}, '-') IN (0, 1)))`;
}

const sql = `CREATE TABLE journal_round_trip_daily_trade_analysis_path_summaries (
  daily_trade_analysis_version_id TEXT PRIMARY KEY ${uuidCheck("daily_trade_analysis_version_id")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  path_contract_version TEXT NOT NULL CHECK (path_contract_version = 'daily_trade_path_v1'),
  path_status TEXT NOT NULL CHECK (path_status IN (
    'unavailable', 'never_green', 'green_no_red', 'green_to_red_ended_red',
    'green_to_red_recovered', 'green_to_red_ended_flat'
  )),
  fees_complete INTEGER NOT NULL CHECK (fees_complete IN (0, 1)),
  added_after_peak_count INTEGER NOT NULL CHECK (added_after_peak_count >= 0),
  partial_exit_before_red_count INTEGER NOT NULL CHECK (partial_exit_before_red_count >= 0),
  profit_opportunity_count INTEGER NOT NULL CHECK (profit_opportunity_count >= 0),
  best_profit_opportunity_sequence INTEGER CHECK (
    best_profit_opportunity_sequence IS NULL OR best_profit_opportunity_sequence >= 0
  ),
  final_pnl_decimal TEXT ${decimalCheck("final_pnl_decimal")},
  first_green_at_utc_seconds INTEGER CHECK (first_green_at_utc_seconds IS NULL OR first_green_at_utc_seconds > 0),
  first_red_at_utc_seconds INTEGER CHECK (first_red_at_utc_seconds IS NULL OR first_red_at_utc_seconds > 0),
  first_red_pnl_decimal TEXT ${decimalCheck("first_red_pnl_decimal")},
  first_recovery_at_utc_seconds INTEGER CHECK (first_recovery_at_utc_seconds IS NULL OR first_recovery_at_utc_seconds > 0),
  minutes_from_peak_to_red INTEGER CHECK (minutes_from_peak_to_red IS NULL OR minutes_from_peak_to_red >= 0),
  peak_at_utc_seconds INTEGER CHECK (peak_at_utc_seconds IS NULL OR peak_at_utc_seconds > 0),
  peak_pnl_decimal TEXT ${decimalCheck("peak_pnl_decimal")},
  peak_to_final_reversal_decimal TEXT ${decimalCheck("peak_to_final_reversal_decimal")},
  peak_to_red_reversal_decimal TEXT ${decimalCheck("peak_to_red_reversal_decimal")},
  position_quantity_at_peak_decimal TEXT ${decimalCheck("position_quantity_at_peak_decimal")},
  position_quantity_at_red_decimal TEXT ${decimalCheck("position_quantity_at_red_decimal")},
  completed_close_peak_at_utc_seconds INTEGER CHECK (
    completed_close_peak_at_utc_seconds IS NULL OR completed_close_peak_at_utc_seconds > 0
  ),
  completed_close_peak_pnl_decimal TEXT ${decimalCheck("completed_close_peak_pnl_decimal")},
  profit_opportunity_threshold_decimal TEXT ${decimalCheck("profit_opportunity_threshold_decimal")},
  strong_opportunity_threshold_decimal TEXT ${decimalCheck("strong_opportunity_threshold_decimal")},
  CHECK (
    (profit_opportunity_count = 0 AND best_profit_opportunity_sequence IS NULL) OR
    (profit_opportunity_count > 0 AND best_profit_opportunity_sequence >= 0
      AND best_profit_opportunity_sequence < profit_opportunity_count)
  ),
  FOREIGN KEY (daily_trade_analysis_version_id)
    REFERENCES journal_round_trip_daily_trade_analysis_versions(daily_trade_analysis_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (round_trip_version_id) REFERENCES journal_round_trip_versions(round_trip_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_round_trip_daily_trade_analysis_profit_opportunities (
  daily_trade_analysis_version_id TEXT NOT NULL ${uuidCheck("daily_trade_analysis_version_id")},
  opportunity_sequence INTEGER NOT NULL CHECK (opportunity_sequence >= 0),
  is_best INTEGER NOT NULL CHECK (is_best IN (0, 1)),
  started_at_utc_seconds INTEGER NOT NULL CHECK (started_at_utc_seconds > 0),
  ended_at_utc_seconds INTEGER NOT NULL CHECK (ended_at_utc_seconds > 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
  completed_close_count INTEGER NOT NULL CHECK (completed_close_count > 0),
  closes_at_or_above_strong_threshold_count INTEGER NOT NULL CHECK (
    closes_at_or_above_strong_threshold_count >= 0
    AND closes_at_or_above_strong_threshold_count <= completed_close_count
  ),
  lowest_pnl_decimal TEXT NOT NULL ${decimalCheck("lowest_pnl_decimal")},
  peak_at_utc_seconds INTEGER NOT NULL CHECK (peak_at_utc_seconds > 0),
  peak_pnl_decimal TEXT NOT NULL ${decimalCheck("peak_pnl_decimal")},
  peak_to_final_reversal_decimal TEXT NOT NULL ${decimalCheck("peak_to_final_reversal_decimal")},
  CHECK (ended_at_utc_seconds >= started_at_utc_seconds),
  CHECK (peak_at_utc_seconds BETWEEN started_at_utc_seconds AND ended_at_utc_seconds),
  CHECK (ended_at_utc_seconds - started_at_utc_seconds = duration_minutes * 60),
  PRIMARY KEY (daily_trade_analysis_version_id, opportunity_sequence),
  FOREIGN KEY (daily_trade_analysis_version_id)
    REFERENCES journal_round_trip_daily_trade_analysis_path_summaries(daily_trade_analysis_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE UNIQUE INDEX journal_daily_trade_analysis_profit_opportunities_one_best
  ON journal_round_trip_daily_trade_analysis_profit_opportunities(daily_trade_analysis_version_id)
  WHERE is_best = 1;
CREATE INDEX journal_daily_trade_analysis_path_summaries_round_trip_version
  ON journal_round_trip_daily_trade_analysis_path_summaries(round_trip_version_id);

CREATE TRIGGER journal_daily_trade_analysis_path_summaries_no_update
BEFORE UPDATE ON journal_round_trip_daily_trade_analysis_path_summaries
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_analysis_path_summary_immutable'); END;
CREATE TRIGGER journal_daily_trade_analysis_path_summaries_no_delete
BEFORE DELETE ON journal_round_trip_daily_trade_analysis_path_summaries
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_analysis_path_history_required'); END;
CREATE TRIGGER journal_daily_trade_analysis_profit_opportunities_no_update
BEFORE UPDATE ON journal_round_trip_daily_trade_analysis_profit_opportunities
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_analysis_profit_opportunity_immutable'); END;
CREATE TRIGGER journal_daily_trade_analysis_profit_opportunities_no_delete
BEFORE DELETE ON journal_round_trip_daily_trade_analysis_profit_opportunities
BEGIN SELECT RAISE(ABORT, 'journal_daily_trade_analysis_profit_opportunity_history_required'); END;`;

export const dailyTradePathMaterializationMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "level_analysis",
  migrationId: "0040_daily_trade_path_materialization",
  executionOrder: 40,
  statements: Object.freeze([sql]),
});
