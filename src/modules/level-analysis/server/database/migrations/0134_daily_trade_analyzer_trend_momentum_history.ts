import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuid(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 9, 1) = '-' AND substr(${column}, 14, 1) = '-'
    AND substr(${column}, 19, 1) = '-' AND substr(${column}, 24, 1) = '-'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}
function utc(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB
    '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

// Job ownership remains on the existing scoped logical-trade job. Each provider
// attempt is retained separately; a failed retry cannot erase completed evidence.
const sql = `CREATE TABLE level_analysis_indicator_history_requests (
  history_request_id TEXT PRIMARY KEY ${uuid("history_request_id")},
  logical_trade_job_id TEXT NOT NULL ${uuid("logical_trade_job_id")},
  acquisition_id TEXT NOT NULL ${uuid("acquisition_id")},
  requested_start_seconds INTEGER NOT NULL CHECK (requested_start_seconds > 0 AND requested_start_seconds % 60 = 0),
  requested_end_seconds INTEGER NOT NULL CHECK (requested_end_seconds > requested_start_seconds AND requested_end_seconds % 60 = 0 AND requested_end_seconds - requested_start_seconds <= 86400),
  attempt_number INTEGER NOT NULL CHECK (attempt_number BETWEEN 1 AND 3),
  status TEXT NOT NULL CHECK (status IN ('requested', 'complete', 'no_history', 'partial', 'provider_failure')),
  failure_reason TEXT CHECK (failure_reason IS NULL OR length(failure_reason) BETWEEN 1 AND 100),
  candles_json TEXT CHECK (candles_json IS NULL OR (json_valid(candles_json) AND json_type(candles_json) = 'array')),
  candle_sha256 TEXT CHECK (candle_sha256 IS NULL OR (length(candle_sha256) = 64 AND candle_sha256 NOT GLOB '*[^0-9a-f]*')),
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  completed_at_utc TEXT ${utc("completed_at_utc")},
  UNIQUE (logical_trade_job_id, requested_start_seconds, requested_end_seconds, attempt_number),
  CHECK ((status = 'requested') = (completed_at_utc IS NULL)),
  CHECK (status NOT IN ('complete', 'no_history') OR (candles_json IS NOT NULL AND candle_sha256 IS NOT NULL AND failure_reason IS NULL)),
  FOREIGN KEY (logical_trade_job_id) REFERENCES level_analysis_logical_trade_jobs(logical_trade_job_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (acquisition_id) REFERENCES level_analysis_analyzer_acquisitions(acquisition_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;
CREATE INDEX level_analysis_indicator_history_requests_job ON level_analysis_indicator_history_requests(logical_trade_job_id, requested_end_seconds, attempt_number);
CREATE TRIGGER level_analysis_indicator_history_requests_final_no_update BEFORE UPDATE ON level_analysis_indicator_history_requests
WHEN OLD.status <> 'requested' BEGIN SELECT RAISE(ABORT, 'indicator_history_evidence_immutable'); END;
CREATE TRIGGER level_analysis_indicator_history_requests_no_delete BEFORE DELETE ON level_analysis_indicator_history_requests
BEGIN SELECT RAISE(ABORT, 'indicator_history_evidence_required'); END;`;

export const dailyTradeAnalyzerTrendMomentumHistoryMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "level_analysis",
  migrationId: "0134_daily_trade_analyzer_trend_momentum_history",
  executionOrder: 134,
  statements: Object.freeze([sql]),
});
