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

function dateCheck(column: string): string {
  return `CHECK (
    length(${column}) = 10
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
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

function currencyCheck(column: string): string {
  return `CHECK (
    length(${column}) = 3 AND ${column} = upper(${column})
    AND ${column} NOT GLOB '*[^A-Z]*'
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
    AND CASE
      WHEN substr(${column}, 1, 1) = '-' THEN length(${column}) > 1
      ELSE 1
    END
    AND CASE
      WHEN instr(${column}, '.') > 0 THEN substr(${column}, -1, 1) <> '0'
      ELSE 1
    END
    AND CASE
      WHEN substr(${column}, 1, 1) = '-' THEN
        substr(${column}, 2, 1) <> '0' OR substr(${column}, 2, 2) = '0.'
      ELSE
        substr(${column}, 1, 1) <> '0' OR ${column} = '0' OR substr(${column}, 1, 2) = '0.'
    END
  )`;
}

function positiveDecimalCheck(column: string): string {
  return `${canonicalDecimalCheck(column)} CHECK (${column} <> '0' AND substr(${column}, 1, 1) <> '-')`;
}

const sql = `CREATE TABLE journal_chain_rebuilds (
  rebuild_id TEXT PRIMARY KEY ${uuidCheck("rebuild_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  instrument_id TEXT NOT NULL ${uuidCheck("instrument_id")},
  trade_currency TEXT NOT NULL ${currencyCheck("trade_currency")},
  chain_key_sha256 TEXT NOT NULL ${sha256Check("chain_key_sha256")},
  trigger_kind TEXT NOT NULL CHECK (trigger_kind IN ('import_event', 'decision_event', 'maintenance')),
  trigger_import_event_id TEXT ${uuidCheck("trigger_import_event_id")},
  trigger_decision_event_id TEXT ${uuidCheck("trigger_decision_event_id")},
  maintenance_reason_code TEXT ${tokenCheck("maintenance_reason_code")},
  previous_rebuild_id TEXT ${uuidCheck("previous_rebuild_id")},
  algorithm_version TEXT NOT NULL ${tokenCheck("algorithm_version")},
  ordered_input_sha256 TEXT NOT NULL ${sha256Check("ordered_input_sha256")},
  output_sha256 TEXT NOT NULL ${sha256Check("output_sha256")},
  coverage_state TEXT NOT NULL CHECK (coverage_state IN ('complete', 'partial', 'unavailable')),
  ready_closed_count INTEGER NOT NULL CHECK (ready_closed_count >= 0),
  legitimate_open_count INTEGER NOT NULL CHECK (legitimate_open_count >= 0),
  needs_decision_count INTEGER NOT NULL CHECK (needs_decision_count >= 0),
  excluded_count INTEGER NOT NULL CHECK (excluded_count >= 0),
  first_execution_at_utc TEXT ${utcCheck("first_execution_at_utc")},
  last_execution_at_utc TEXT ${utcCheck("last_execution_at_utc")},
  completed_at_utc TEXT NOT NULL ${utcCheck("completed_at_utc")},
  CHECK (
    (trigger_import_event_id IS NOT NULL) + (trigger_decision_event_id IS NOT NULL)
    + (maintenance_reason_code IS NOT NULL) = 1
  ),
  CHECK (
    (trigger_kind = 'import_event' AND trigger_import_event_id IS NOT NULL)
    OR (trigger_kind = 'decision_event' AND trigger_decision_event_id IS NOT NULL)
    OR (trigger_kind = 'maintenance' AND maintenance_reason_code IS NOT NULL)
  ),
  CHECK (previous_rebuild_id IS NULL OR previous_rebuild_id <> rebuild_id),
  CHECK (
    (first_execution_at_utc IS NULL AND last_execution_at_utc IS NULL)
    OR (first_execution_at_utc IS NOT NULL AND last_execution_at_utc IS NOT NULL AND last_execution_at_utc >= first_execution_at_utc)
  ),
  UNIQUE (workspace_id, account_id, rebuild_id),
  UNIQUE (workspace_id, account_id, instrument_id, trade_currency, chain_key_sha256, rebuild_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, instrument_id) REFERENCES journal_instruments(workspace_id, instrument_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, trigger_import_event_id) REFERENCES journal_import_events(workspace_id, account_id, import_event_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, trigger_decision_event_id) REFERENCES journal_data_decision_events(workspace_id, account_id, decision_event_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, instrument_id, trade_currency, chain_key_sha256, previous_rebuild_id) REFERENCES journal_chain_rebuilds(workspace_id, account_id, instrument_id, trade_currency, chain_key_sha256, rebuild_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_chain_rebuilds_latest
  ON journal_chain_rebuilds(workspace_id, account_id, instrument_id, trade_currency, completed_at_utc, rebuild_id);

CREATE TABLE journal_round_trips (
  round_trip_id TEXT PRIMARY KEY ${uuidCheck("round_trip_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  current_version_id TEXT NOT NULL ${uuidCheck("current_version_id")},
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'superseded')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, round_trip_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, round_trip_id, current_version_id) REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_id, round_trip_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE journal_round_trip_versions (
  round_trip_version_id TEXT PRIMARY KEY ${uuidCheck("round_trip_version_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  rebuild_id TEXT NOT NULL ${uuidCheck("rebuild_id")},
  instrument_id TEXT NOT NULL ${uuidCheck("instrument_id")},
  trade_currency TEXT NOT NULL ${currencyCheck("trade_currency")},
  chain_key_sha256 TEXT NOT NULL ${sha256Check("chain_key_sha256")},
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  opened_at_utc TEXT NOT NULL ${utcCheck("opened_at_utc")},
  closed_at_utc TEXT ${utcCheck("closed_at_utc")},
  final_position_decimal TEXT NOT NULL ${canonicalDecimalCheck("final_position_decimal")},
  projection_state TEXT NOT NULL CHECK (
    projection_state IN ('ready_closed', 'legitimate_open', 'needs_decision', 'excluded_by_trader')
  ),
  coverage_reason_code TEXT CHECK (coverage_reason_code IS NULL OR (${tokenCheck("coverage_reason_code").replace(/^CHECK \(|\)$/gu, "")})),
  projection_fingerprint_sha256 TEXT NOT NULL ${sha256Check("projection_fingerprint_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (projection_state = 'ready_closed' AND final_position_decimal = '0' AND closed_at_utc IS NOT NULL AND coverage_reason_code IS NULL)
    OR (projection_state = 'legitimate_open' AND final_position_decimal <> '0' AND closed_at_utc IS NULL AND coverage_reason_code IS NULL)
    OR (projection_state IN ('needs_decision', 'excluded_by_trader') AND coverage_reason_code IS NOT NULL)
  ),
  CHECK (closed_at_utc IS NULL OR closed_at_utc >= opened_at_utc),
  UNIQUE (workspace_id, account_id, round_trip_id, round_trip_version_id),
  UNIQUE (workspace_id, account_id, round_trip_version_id),
  UNIQUE (workspace_id, account_id, round_trip_id, version_number),
  FOREIGN KEY (workspace_id, account_id, round_trip_id) REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id, account_id, instrument_id, trade_currency, chain_key_sha256, rebuild_id) REFERENCES journal_chain_rebuilds(workspace_id, account_id, instrument_id, trade_currency, chain_key_sha256, rebuild_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, instrument_id) REFERENCES journal_instruments(workspace_id, instrument_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_round_trip_versions_chain
  ON journal_round_trip_versions(workspace_id, account_id, instrument_id, trade_currency, opened_at_utc, round_trip_version_id);

CREATE TABLE journal_round_trip_execution_allocations (
  allocation_id TEXT PRIMARY KEY ${uuidCheck("allocation_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  execution_version_id TEXT NOT NULL ${uuidCheck("execution_version_id")},
  allocation_sequence INTEGER NOT NULL CHECK (allocation_sequence > 0),
  allocation_role TEXT NOT NULL CHECK (
    allocation_role IN ('opening', 'adding', 'reducing', 'closing', 'flip_closing', 'flip_opening')
  ),
  quantity_decimal TEXT NOT NULL ${positiveDecimalCheck("quantity_decimal")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  UNIQUE (workspace_id, account_id, round_trip_version_id, allocation_sequence),
  UNIQUE (workspace_id, account_id, allocation_id),
  FOREIGN KEY (workspace_id, account_id, round_trip_version_id) REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, execution_version_id) REFERENCES journal_execution_versions(workspace_id, account_id, execution_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_round_trip_allocations_execution
  ON journal_round_trip_execution_allocations(workspace_id, account_id, execution_version_id, round_trip_version_id);

CREATE TABLE journal_round_trip_identity_aliases (
  round_trip_alias_id TEXT PRIMARY KEY ${uuidCheck("round_trip_alias_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  alias_scheme_version TEXT NOT NULL ${tokenCheck("alias_scheme_version")},
  alias_key_sha256 TEXT NOT NULL ${sha256Check("alias_key_sha256")},
  status TEXT NOT NULL CHECK (status IN ('active', 'superseded')),
  superseded_by_alias_id TEXT ${uuidCheck("superseded_by_alias_id")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (superseded_by_alias_id IS NULL OR superseded_by_alias_id <> round_trip_alias_id),
  UNIQUE (workspace_id, account_id, round_trip_alias_id),
  UNIQUE (workspace_id, account_id, alias_scheme_version, alias_key_sha256),
  FOREIGN KEY (workspace_id, account_id, round_trip_id) REFERENCES journal_round_trips(workspace_id, account_id, round_trip_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, superseded_by_alias_id) REFERENCES journal_round_trip_identity_aliases(workspace_id, account_id, round_trip_alias_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_round_trip_aliases_round_trip
  ON journal_round_trip_identity_aliases(workspace_id, account_id, round_trip_id, status);

CREATE TABLE journal_trading_days (
  trading_day_id TEXT PRIMARY KEY ${uuidCheck("trading_day_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  trading_date TEXT NOT NULL ${dateCheck("trading_date")},
  trading_timezone TEXT NOT NULL CHECK (length(trim(trading_timezone)) BETWEEN 1 AND 64),
  status TEXT NOT NULL CHECK (status IN ('active', 'superseded')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, trading_day_id),
  UNIQUE (workspace_id, account_id, trading_date, trading_timezone),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT`;

export const journalRoundTripProjectionMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0006_journal_round_trip_projection",
  executionOrder: 6,
  statements: Object.freeze([sql]),
});
