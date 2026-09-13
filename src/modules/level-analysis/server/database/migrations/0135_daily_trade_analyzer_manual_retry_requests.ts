import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const uuid = (column: string) => `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column},9,1)='-' AND substr(${column},14,1)='-' AND substr(${column},19,1)='-' AND substr(${column},24,1)='-' AND substr(${column},15,1)='4' AND substr(${column},20,1) GLOB '[89ab]')`;
const utc = (column: string) => `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;

const sql = `CREATE TABLE level_analysis_manual_retry_requests (
 retry_request_id TEXT PRIMARY KEY ${uuid("retry_request_id")},
 logical_trade_job_id TEXT NOT NULL ${uuid("logical_trade_job_id")},
 user_id TEXT NOT NULL ${uuid("user_id")},
 workspace_id TEXT NOT NULL ${uuid("workspace_id")},
 account_id TEXT NOT NULL ${uuid("account_id")},
 logical_trade_id TEXT NOT NULL ${uuid("logical_trade_id")},
 logical_trade_version_id TEXT NOT NULL ${uuid("logical_trade_version_id")},
 new_york_date TEXT NOT NULL CHECK (length(new_york_date)=10 AND new_york_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
 daily_ordinal INTEGER NOT NULL CHECK (daily_ordinal BETWEEN 1 AND 3),
 created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
 UNIQUE(workspace_id, account_id, logical_trade_id, new_york_date, daily_ordinal),
 FOREIGN KEY(logical_trade_job_id) REFERENCES level_analysis_logical_trade_jobs(logical_trade_job_id) ON DELETE RESTRICT ON UPDATE RESTRICT
) STRICT;
CREATE INDEX level_analysis_manual_retry_requests_job ON level_analysis_manual_retry_requests(logical_trade_job_id, created_at_utc);
CREATE TRIGGER level_analysis_manual_retry_requests_owner BEFORE INSERT ON level_analysis_manual_retry_requests
WHEN NOT EXISTS (SELECT 1 FROM level_analysis_logical_trade_jobs job WHERE job.logical_trade_job_id=NEW.logical_trade_job_id
 AND job.user_id=NEW.user_id AND job.workspace_id=NEW.workspace_id AND job.account_id=NEW.account_id
 AND job.logical_trade_id=NEW.logical_trade_id AND job.logical_trade_version_id=NEW.logical_trade_version_id AND job.status='queued')
BEGIN SELECT RAISE(ABORT,'manual_retry_job_scope_invalid'); END;
CREATE TRIGGER level_analysis_manual_retry_requests_no_update BEFORE UPDATE ON level_analysis_manual_retry_requests
BEGIN SELECT RAISE(ABORT,'manual_retry_identity_immutable'); END;
CREATE TRIGGER level_analysis_manual_retry_requests_no_delete BEFORE DELETE ON level_analysis_manual_retry_requests
BEGIN SELECT RAISE(ABORT,'manual_retry_identity_required'); END;

CREATE TABLE level_analysis_manual_retry_acquisitions (
 acquisition_id TEXT PRIMARY KEY ${uuid("acquisition_id")},
 retry_request_id TEXT NOT NULL ${uuid("retry_request_id")},
 FOREIGN KEY(acquisition_id) REFERENCES level_analysis_analyzer_acquisitions(acquisition_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(retry_request_id) REFERENCES level_analysis_manual_retry_requests(retry_request_id) ON DELETE RESTRICT ON UPDATE RESTRICT
) STRICT;
CREATE INDEX level_analysis_manual_retry_acquisitions_request ON level_analysis_manual_retry_acquisitions(retry_request_id);
CREATE TRIGGER level_analysis_manual_retry_acquisitions_owner BEFORE INSERT ON level_analysis_manual_retry_acquisitions
WHEN NOT EXISTS (SELECT 1 FROM level_analysis_analyzer_acquisitions acquisition
 JOIN level_analysis_manual_retry_requests request ON request.retry_request_id=NEW.retry_request_id
 JOIN level_analysis_logical_trade_jobs job ON job.logical_trade_job_id=request.logical_trade_job_id
 WHERE acquisition.acquisition_id=NEW.acquisition_id AND acquisition.charged_user_id=request.user_id
 AND acquisition.market_session_set_id=job.market_session_set_id AND acquisition.charge_kind='correction_waived'
 AND acquisition.reservation_id IS NULL AND acquisition.started_at_utc >= request.created_at_utc)
BEGIN SELECT RAISE(ABORT,'manual_retry_acquisition_invalid'); END;
CREATE TRIGGER level_analysis_manual_retry_acquisitions_no_update BEFORE UPDATE ON level_analysis_manual_retry_acquisitions
BEGIN SELECT RAISE(ABORT,'manual_retry_acquisition_immutable'); END;
CREATE TRIGGER level_analysis_manual_retry_acquisitions_no_delete BEFORE DELETE ON level_analysis_manual_retry_acquisitions
BEGIN SELECT RAISE(ABORT,'manual_retry_acquisition_required'); END;

CREATE TABLE level_analysis_manual_retry_history_requests (
 history_request_id TEXT PRIMARY KEY ${uuid("history_request_id")},
 retry_request_id TEXT NOT NULL ${uuid("retry_request_id")},
 logical_trade_job_id TEXT NOT NULL ${uuid("logical_trade_job_id")},
 acquisition_id TEXT NOT NULL ${uuid("acquisition_id")},
 requested_start_seconds INTEGER NOT NULL CHECK(requested_start_seconds>0 AND requested_start_seconds%60=0),
 requested_end_seconds INTEGER NOT NULL CHECK(requested_end_seconds>requested_start_seconds AND requested_end_seconds%60=0 AND requested_end_seconds-requested_start_seconds<=86400),
 attempt_number INTEGER NOT NULL CHECK(attempt_number BETWEEN 1 AND 3),
 status TEXT NOT NULL CHECK(status IN ('requested','complete','no_history','partial','provider_failure')),
 failure_reason TEXT CHECK(failure_reason IS NULL OR length(failure_reason) BETWEEN 1 AND 100),
 candles_json TEXT CHECK(candles_json IS NULL OR (json_valid(candles_json) AND json_type(candles_json)='array')),
 candle_sha256 TEXT CHECK(candle_sha256 IS NULL OR (length(candle_sha256)=64 AND candle_sha256 NOT GLOB '*[^0-9a-f]*')),
 created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
 completed_at_utc TEXT ${utc("completed_at_utc")},
 UNIQUE(retry_request_id,requested_start_seconds,requested_end_seconds,attempt_number),
 CHECK((status='requested')=(completed_at_utc IS NULL)),
 CHECK(status NOT IN ('complete','no_history') OR (candles_json IS NOT NULL AND candle_sha256 IS NOT NULL AND failure_reason IS NULL)),
 FOREIGN KEY(retry_request_id) REFERENCES level_analysis_manual_retry_requests(retry_request_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(logical_trade_job_id) REFERENCES level_analysis_logical_trade_jobs(logical_trade_job_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(acquisition_id) REFERENCES level_analysis_manual_retry_acquisitions(acquisition_id) ON DELETE RESTRICT ON UPDATE RESTRICT
) STRICT;
CREATE TRIGGER level_analysis_manual_retry_history_owner BEFORE INSERT ON level_analysis_manual_retry_history_requests
WHEN NOT EXISTS (SELECT 1 FROM level_analysis_manual_retry_requests request
 JOIN level_analysis_manual_retry_acquisitions link ON link.retry_request_id=request.retry_request_id
 WHERE request.retry_request_id=NEW.retry_request_id AND request.logical_trade_job_id=NEW.logical_trade_job_id AND link.acquisition_id=NEW.acquisition_id)
BEGIN SELECT RAISE(ABORT,'manual_retry_history_scope_invalid'); END;
CREATE TRIGGER level_analysis_manual_retry_history_no_update BEFORE UPDATE ON level_analysis_manual_retry_history_requests
WHEN OLD.status<>'requested' BEGIN SELECT RAISE(ABORT,'manual_retry_history_immutable'); END;
CREATE TRIGGER level_analysis_manual_retry_history_no_delete BEFORE DELETE ON level_analysis_manual_retry_history_requests
BEGIN SELECT RAISE(ABORT,'manual_retry_history_required'); END;`;

export const dailyTradeAnalyzerManualRetryRequestsMigration: PlatformMigration = Object.freeze({
 moduleNamespace: "level_analysis", migrationId: "0135_daily_trade_analyzer_manual_retry_requests",
 executionOrder: 135, statements: Object.freeze([sql]),
});
