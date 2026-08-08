import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

function dateCheck(column: string): string {
  return `CHECK (length(${column}) = 10 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')`;
}

function digestCheck(column: string): string {
  return `CHECK (length(${column}) = 64 AND ${column} = lower(${column}) AND ${column} NOT GLOB '*[^0-9a-f]*')`;
}

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

const sql = `CREATE TABLE coach_us_equities_calendar_snapshots (
  calendar_id TEXT PRIMARY KEY CHECK (length(calendar_id) BETWEEN 1 AND 96),
  contract_version TEXT NOT NULL CHECK (contract_version = 'traderlink_us_equities_review_calendar_v1'),
  target_year INTEGER NOT NULL CHECK (target_year BETWEEN 2026 AND 2199),
  version INTEGER NOT NULL CHECK (version >= 1),
  timezone TEXT NOT NULL CHECK (timezone = 'America/New_York'),
  coverage_start_date TEXT NOT NULL ${dateCheck("coverage_start_date")},
  coverage_end_date TEXT NOT NULL ${dateCheck("coverage_end_date")},
  normalized_calendar_sha256 TEXT NOT NULL ${digestCheck("normalized_calendar_sha256")},
  evidence_digest_sha256 TEXT NOT NULL UNIQUE ${digestCheck("evidence_digest_sha256")},
  nasdaq_content_sha256 TEXT NOT NULL ${digestCheck("nasdaq_content_sha256")},
  nyse_content_sha256 TEXT NOT NULL ${digestCheck("nyse_content_sha256")},
  snapshot_json TEXT NOT NULL CHECK (json_valid(snapshot_json) AND json_type(snapshot_json) = 'object'),
  retrieved_at_utc TEXT NOT NULL ${utcCheck("retrieved_at_utc")},
  verified_at_utc TEXT NOT NULL ${utcCheck("verified_at_utc")},
  CHECK (coverage_start_date = printf('%04d-01-01', target_year)),
  CHECK (coverage_end_date = printf('%04d-12-31', target_year)),
  UNIQUE (target_year, version),
  UNIQUE (target_year, normalized_calendar_sha256)
) STRICT, WITHOUT ROWID;

CREATE TABLE coach_us_equities_calendar_verification_attempts (
  calendar_verification_attempt_id TEXT PRIMARY KEY ${uuidCheck("calendar_verification_attempt_id")},
  target_year INTEGER NOT NULL CHECK (target_year BETWEEN 2026 AND 2199),
  status TEXT NOT NULL CHECK (status IN ('awaiting_primary', 'source_unavailable', 'conflict', 'verified')),
  result_code TEXT NOT NULL CHECK (length(result_code) BETWEEN 1 AND 96 AND result_code NOT GLOB '*[^A-Z0-9_]*'),
  nasdaq_source_url TEXT NOT NULL CHECK (nasdaq_source_url = 'https://www.nasdaqtrader.com/Trader.aspx?id=Calendar'),
  nyse_source_url TEXT NOT NULL CHECK (nyse_source_url = 'https://www.nyse.com/trade/hours-calendars'),
  nasdaq_content_sha256 TEXT ${digestCheck("nasdaq_content_sha256")},
  nyse_content_sha256 TEXT ${digestCheck("nyse_content_sha256")},
  nasdaq_calendar_sha256 TEXT ${digestCheck("nasdaq_calendar_sha256")},
  nyse_calendar_sha256 TEXT ${digestCheck("nyse_calendar_sha256")},
  calendar_id TEXT CHECK (calendar_id IS NULL OR length(calendar_id) BETWEEN 1 AND 96),
  checked_at_utc TEXT NOT NULL ${utcCheck("checked_at_utc")},
  CHECK ((status = 'verified' AND calendar_id IS NOT NULL AND nasdaq_content_sha256 IS NOT NULL AND nyse_content_sha256 IS NOT NULL AND nasdaq_calendar_sha256 = nyse_calendar_sha256) OR status <> 'verified'),
  FOREIGN KEY (calendar_id) REFERENCES coach_us_equities_calendar_snapshots(calendar_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE INDEX coach_us_equities_calendar_attempts_year_time
ON coach_us_equities_calendar_verification_attempts(target_year, checked_at_utc DESC);

CREATE TABLE coach_us_equities_calendar_verification_state (
  target_year INTEGER PRIMARY KEY CHECK (target_year BETWEEN 2026 AND 2199),
  latest_status TEXT NOT NULL CHECK (latest_status IN ('awaiting_primary', 'source_unavailable', 'conflict', 'verified')),
  latest_result_code TEXT NOT NULL CHECK (length(latest_result_code) BETWEEN 1 AND 96 AND latest_result_code NOT GLOB '*[^A-Z0-9_]*'),
  latest_attempt_id TEXT NOT NULL UNIQUE ${uuidCheck("latest_attempt_id")},
  active_calendar_id TEXT CHECK (active_calendar_id IS NULL OR length(active_calendar_id) BETWEEN 1 AND 96),
  last_checked_at_utc TEXT NOT NULL ${utcCheck("last_checked_at_utc")},
  next_check_after_utc TEXT NOT NULL ${utcCheck("next_check_after_utc")},
  revision INTEGER NOT NULL CHECK (revision >= 1),
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (next_check_after_utc > last_checked_at_utc),
  FOREIGN KEY (latest_attempt_id) REFERENCES coach_us_equities_calendar_verification_attempts(calendar_verification_attempt_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (active_calendar_id) REFERENCES coach_us_equities_calendar_snapshots(calendar_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE TRIGGER coach_us_equities_calendar_snapshots_no_update
BEFORE UPDATE ON coach_us_equities_calendar_snapshots
BEGIN SELECT RAISE(ABORT, 'coach_market_calendar_snapshot_immutable'); END;
CREATE TRIGGER coach_us_equities_calendar_snapshots_no_delete
BEFORE DELETE ON coach_us_equities_calendar_snapshots
BEGIN SELECT RAISE(ABORT, 'coach_market_calendar_history_required'); END;

CREATE TRIGGER coach_us_equities_calendar_attempts_no_update
BEFORE UPDATE ON coach_us_equities_calendar_verification_attempts
BEGIN SELECT RAISE(ABORT, 'coach_market_calendar_attempt_immutable'); END;
CREATE TRIGGER coach_us_equities_calendar_attempts_no_delete
BEFORE DELETE ON coach_us_equities_calendar_verification_attempts
BEGIN SELECT RAISE(ABORT, 'coach_market_calendar_history_required'); END;

CREATE TRIGGER coach_us_equities_calendar_state_no_delete
BEFORE DELETE ON coach_us_equities_calendar_verification_state
BEGIN SELECT RAISE(ABORT, 'coach_market_calendar_state_required'); END;
CREATE TRIGGER coach_us_equities_calendar_state_update_guard
BEFORE UPDATE ON coach_us_equities_calendar_verification_state
WHEN NEW.target_year <> OLD.target_year OR NEW.revision <> OLD.revision + 1 OR NEW.updated_at_utc <= OLD.updated_at_utc OR NEW.last_checked_at_utc < OLD.last_checked_at_utc
BEGIN SELECT RAISE(ABORT, 'coach_market_calendar_state_transition_invalid'); END;`;

export const coachUsEquitiesReviewCalendarsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0039_coach_us_equities_review_calendars",
  executionOrder: 39,
  statements: Object.freeze([sql]),
});
