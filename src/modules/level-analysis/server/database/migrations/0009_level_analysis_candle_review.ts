import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

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

function utcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

function sha256Check(column: string): string {
  return `CHECK (
    length(${column}) = 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^0-9a-f]*'
  )`;
}

function tokenCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 64 AND ${column} = lower(${column})
    AND ${column} NOT GLOB '*[^a-z0-9_-]*'
  )`;
}

function canonicalDecimalCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 128
    AND ${column} NOT GLOB '*[^0-9.-]*'
    AND ${column} NOT LIKE '+%'
    AND substr(${column}, -1, 1) <> '.'
    AND ${column} NOT IN ('-0', '-0.0', '')
    AND (length(${column}) - length(replace(${column}, '.', ''))) <= 1
    AND (length(${column}) - length(replace(${column}, '-', ''))) <= 1
    AND instr(${column}, '-') IN (0, 1)
    AND CASE WHEN substr(${column}, 1, 1) = '-' THEN length(${column}) > 1 ELSE 1 END
    AND CASE WHEN instr(${column}, '.') > 0 THEN substr(${column}, -1, 1) <> '0' ELSE 1 END
    AND CASE
      WHEN substr(${column}, 1, 1) = '-' THEN substr(${column}, 2, 1) <> '0' OR substr(${column}, 2, 2) = '0.'
      ELSE substr(${column}, 1, 1) <> '0' OR ${column} = '0' OR substr(${column}, 1, 2) = '0.'
    END
  )`;
}

function positiveDecimalCheck(column: string): string {
  return `${canonicalDecimalCheck(column)} CHECK (${column} <> '0' AND substr(${column}, 1, 1) <> '-')`;
}

const sql = `CREATE TABLE level_analysis_market_data_requests (
  request_id TEXT PRIMARY KEY ${uuidCheck("request_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  provider_key TEXT NOT NULL CHECK (provider_key = 'yahoo_chart'),
  provider_adapter_version TEXT NOT NULL CHECK (provider_adapter_version = 'yahoo_chart_v1'),
  normalized_symbol TEXT NOT NULL CHECK (
    length(normalized_symbol) BETWEEN 1 AND 16
    AND normalized_symbol = upper(trim(normalized_symbol))
    AND normalized_symbol NOT GLOB '*[^A-Z0-9.-]*'
  ),
  interval TEXT NOT NULL CHECK (interval IN ('1m', '1d')),
  requested_start_utc TEXT NOT NULL ${utcCheck("requested_start_utc")},
  requested_end_utc TEXT NOT NULL ${utcCheck("requested_end_utc")},
  include_extended_hours INTEGER NOT NULL CHECK (include_extended_hours IN (0, 1)),
  timestamp_semantics TEXT NOT NULL CHECK (timestamp_semantics = 'provider_epoch_seconds_utc'),
  provider_exchange_timezone TEXT CHECK (
    provider_exchange_timezone IS NULL
    OR length(trim(provider_exchange_timezone)) BETWEEN 1 AND 64
  ),
  provider_utc_offset_seconds INTEGER CHECK (
    provider_utc_offset_seconds IS NULL
    OR provider_utc_offset_seconds BETWEEN -86400 AND 86400
  ),
  adjustment_policy TEXT NOT NULL CHECK (adjustment_policy = 'provider_quote_unadjusted_v1'),
  requested_at_utc TEXT NOT NULL ${utcCheck("requested_at_utc")},
  completed_at_utc TEXT NOT NULL ${utcCheck("completed_at_utc")},
  outcome TEXT NOT NULL CHECK (
    outcome IN ('accepted', 'coverage_unavailable', 'provider_unavailable', 'invalid_payload', 'unsupported')
  ),
  failure_reason_code TEXT CHECK (
    failure_reason_code IS NULL OR (${tokenCheck("failure_reason_code").replace(/^CHECK \(|\)$/gu, "")})
  ),
  normalized_candle_set_id TEXT ${uuidCheck("normalized_candle_set_id")},
  candle_count INTEGER NOT NULL CHECK (candle_count >= 0),
  coverage_start_utc TEXT ${utcCheck("coverage_start_utc")},
  coverage_end_utc TEXT ${utcCheck("coverage_end_utc")},
  normalized_candle_sha256 TEXT ${sha256Check("normalized_candle_sha256")},
  CHECK (requested_end_utc > requested_start_utc),
  CHECK (completed_at_utc >= requested_at_utc),
  CHECK (
    (outcome = 'accepted' AND failure_reason_code IS NULL
      AND normalized_candle_set_id IS NOT NULL AND candle_count > 0
      AND coverage_start_utc IS NOT NULL AND coverage_end_utc IS NOT NULL
      AND normalized_candle_sha256 IS NOT NULL AND coverage_end_utc >= coverage_start_utc)
    OR
    (outcome <> 'accepted' AND failure_reason_code IS NOT NULL
      AND normalized_candle_set_id IS NULL AND candle_count = 0
      AND coverage_start_utc IS NULL AND coverage_end_utc IS NULL
      AND normalized_candle_sha256 IS NULL)
  ),
  UNIQUE (workspace_id, account_id, request_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id, round_trip_version_id) REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_id, round_trip_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, request_id, normalized_candle_set_id) REFERENCES level_analysis_normalized_candle_sets(workspace_id, account_id, request_id, candle_set_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX level_analysis_requests_round_trip
  ON level_analysis_market_data_requests(workspace_id, account_id, round_trip_id, requested_at_utc DESC, request_id);

CREATE TABLE level_analysis_normalized_candle_sets (
  candle_set_id TEXT PRIMARY KEY ${uuidCheck("candle_set_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  request_id TEXT NOT NULL ${uuidCheck("request_id")},
  provider_key TEXT NOT NULL CHECK (provider_key = 'yahoo_chart'),
  provider_adapter_version TEXT NOT NULL CHECK (provider_adapter_version = 'yahoo_chart_v1'),
  normalized_symbol TEXT NOT NULL CHECK (
    length(normalized_symbol) BETWEEN 1 AND 16
    AND normalized_symbol = upper(trim(normalized_symbol))
    AND normalized_symbol NOT GLOB '*[^A-Z0-9.-]*'
  ),
  interval TEXT NOT NULL CHECK (interval IN ('1m', '1d')),
  include_extended_hours INTEGER NOT NULL CHECK (include_extended_hours IN (0, 1)),
  timestamp_semantics TEXT NOT NULL CHECK (timestamp_semantics = 'provider_epoch_seconds_utc'),
  provider_exchange_timezone TEXT CHECK (
    provider_exchange_timezone IS NULL
    OR length(trim(provider_exchange_timezone)) BETWEEN 1 AND 64
  ),
  provider_utc_offset_seconds INTEGER CHECK (
    provider_utc_offset_seconds IS NULL
    OR provider_utc_offset_seconds BETWEEN -86400 AND 86400
  ),
  adjustment_policy TEXT NOT NULL CHECK (adjustment_policy = 'provider_quote_unadjusted_v1'),
  coverage_start_utc TEXT NOT NULL ${utcCheck("coverage_start_utc")},
  coverage_end_utc TEXT NOT NULL ${utcCheck("coverage_end_utc")},
  candle_count INTEGER NOT NULL CHECK (candle_count > 0),
  normalized_candle_sha256 TEXT NOT NULL ${sha256Check("normalized_candle_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (coverage_end_utc >= coverage_start_utc),
  UNIQUE (workspace_id, account_id, request_id, candle_set_id),
  UNIQUE (workspace_id, account_id, candle_set_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, request_id) REFERENCES level_analysis_market_data_requests(workspace_id, account_id, request_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE level_analysis_normalized_candles (
  candle_set_id TEXT NOT NULL ${uuidCheck("candle_set_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  candle_time_utc INTEGER NOT NULL CHECK (candle_time_utc > 0),
  open_decimal TEXT NOT NULL ${positiveDecimalCheck("open_decimal")},
  high_decimal TEXT NOT NULL ${positiveDecimalCheck("high_decimal")},
  low_decimal TEXT NOT NULL ${positiveDecimalCheck("low_decimal")},
  close_decimal TEXT NOT NULL ${positiveDecimalCheck("close_decimal")},
  volume_decimal TEXT NOT NULL ${canonicalDecimalCheck("volume_decimal")} CHECK (substr(volume_decimal, 1, 1) <> '-'),
  PRIMARY KEY (workspace_id, account_id, candle_set_id, candle_time_utc),
  FOREIGN KEY (workspace_id, account_id, candle_set_id) REFERENCES level_analysis_normalized_candle_sets(workspace_id, account_id, candle_set_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER level_analysis_market_data_requests_no_update
BEFORE UPDATE ON level_analysis_market_data_requests BEGIN
  SELECT RAISE(ABORT, 'level_analysis_request_immutable');
END;
CREATE TRIGGER level_analysis_market_data_requests_no_delete
BEFORE DELETE ON level_analysis_market_data_requests BEGIN
  SELECT RAISE(ABORT, 'level_analysis_request_immutable');
END;
CREATE TRIGGER level_analysis_normalized_candle_sets_no_update
BEFORE UPDATE ON level_analysis_normalized_candle_sets BEGIN
  SELECT RAISE(ABORT, 'level_analysis_candle_set_immutable');
END;
CREATE TRIGGER level_analysis_normalized_candle_sets_no_delete
BEFORE DELETE ON level_analysis_normalized_candle_sets BEGIN
  SELECT RAISE(ABORT, 'level_analysis_candle_set_immutable');
END;
CREATE TRIGGER level_analysis_normalized_candles_no_update
BEFORE UPDATE ON level_analysis_normalized_candles BEGIN
  SELECT RAISE(ABORT, 'level_analysis_candle_immutable');
END;
CREATE TRIGGER level_analysis_normalized_candles_no_delete
BEFORE DELETE ON level_analysis_normalized_candles BEGIN
  SELECT RAISE(ABORT, 'level_analysis_candle_immutable');
END;

CREATE TABLE journal_round_trip_candle_reviews (
  candle_review_id TEXT PRIMARY KEY ${uuidCheck("candle_review_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  analysis_contract_version TEXT NOT NULL CHECK (analysis_contract_version = 'journal_candle_review_v1'),
  current_version_id TEXT NOT NULL ${uuidCheck("current_version_id")},
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state = 'active'),
  revision INTEGER NOT NULL CHECK (revision > 0),
  created_by_user_id TEXT NOT NULL ${uuidCheck("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, round_trip_id, analysis_contract_version),
  UNIQUE (workspace_id, account_id, candle_review_id),
  FOREIGN KEY (workspace_id, account_id, round_trip_id) REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, candle_review_id, current_version_id) REFERENCES journal_round_trip_candle_review_versions(workspace_id, account_id, candle_review_id, candle_review_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE journal_round_trip_candle_review_versions (
  candle_review_version_id TEXT PRIMARY KEY ${uuidCheck("candle_review_version_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  candle_review_id TEXT NOT NULL ${uuidCheck("candle_review_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  review_status TEXT NOT NULL CHECK (review_status IN ('ready', 'no_coverage', 'provider_unavailable', 'unsupported')),
  primary_request_id TEXT ${uuidCheck("primary_request_id")},
  daily_request_id TEXT ${uuidCheck("daily_request_id")},
  normalized_symbol TEXT NOT NULL CHECK (
    length(normalized_symbol) BETWEEN 1 AND 16
    AND normalized_symbol = upper(trim(normalized_symbol))
    AND normalized_symbol NOT GLOB '*[^A-Z0-9.-]*'
  ),
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  opened_at_utc TEXT NOT NULL ${utcCheck("opened_at_utc")},
  closed_at_utc TEXT NOT NULL ${utcCheck("closed_at_utc")},
  entry_price_decimal TEXT NOT NULL ${positiveDecimalCheck("entry_price_decimal")},
  exit_price_decimal TEXT NOT NULL ${positiveDecimalCheck("exit_price_decimal")},
  analysis_json TEXT NOT NULL CHECK (json_valid(analysis_json) AND json_type(analysis_json) = 'object'),
  analysis_sha256 TEXT NOT NULL ${sha256Check("analysis_sha256")},
  observations_json TEXT NOT NULL CHECK (json_valid(observations_json) AND json_type(observations_json) = 'array'),
  observations_sha256 TEXT NOT NULL ${sha256Check("observations_sha256")},
  indicators_json TEXT NOT NULL CHECK (json_valid(indicators_json) AND json_type(indicators_json) = 'array'),
  indicators_sha256 TEXT NOT NULL ${sha256Check("indicators_sha256")},
  refresh_available_at_utc TEXT NOT NULL ${utcCheck("refresh_available_at_utc")},
  requested_by_user_id TEXT NOT NULL ${uuidCheck("requested_by_user_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (closed_at_utc >= opened_at_utc),
  CHECK (
    (review_status = 'unsupported' AND primary_request_id IS NULL AND daily_request_id IS NULL)
    OR (review_status <> 'unsupported' AND primary_request_id IS NOT NULL)
  ),
  UNIQUE (workspace_id, account_id, candle_review_id, version_number),
  UNIQUE (workspace_id, account_id, candle_review_id, candle_review_version_id),
  FOREIGN KEY (workspace_id, account_id, candle_review_id) REFERENCES journal_round_trip_candle_reviews(workspace_id, account_id, candle_review_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id, account_id, round_trip_id, round_trip_version_id) REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_id, round_trip_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, primary_request_id) REFERENCES level_analysis_market_data_requests(workspace_id, account_id, request_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, daily_request_id) REFERENCES level_analysis_market_data_requests(workspace_id, account_id, request_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (requested_by_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_candle_reviews_round_trip
  ON journal_round_trip_candle_reviews(workspace_id, account_id, round_trip_id, updated_at_utc DESC);

CREATE TRIGGER journal_round_trip_candle_reviews_no_delete
BEFORE DELETE ON journal_round_trip_candle_reviews BEGIN
  SELECT RAISE(ABORT, 'journal_candle_review_immutable');
END;
CREATE TRIGGER journal_round_trip_candle_review_versions_no_update
BEFORE UPDATE ON journal_round_trip_candle_review_versions BEGIN
  SELECT RAISE(ABORT, 'journal_candle_review_version_immutable');
END;
CREATE TRIGGER journal_round_trip_candle_review_versions_no_delete
BEFORE DELETE ON journal_round_trip_candle_review_versions BEGIN
  SELECT RAISE(ABORT, 'journal_candle_review_version_immutable');
END`;

export const levelAnalysisCandleReviewMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0009_level_analysis_candle_review",
  executionOrder: 9,
  statements: Object.freeze([sql]),
});
