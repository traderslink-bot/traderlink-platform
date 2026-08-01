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

const sql = `CREATE TABLE journal_executions (
  execution_id TEXT PRIMARY KEY ${uuidCheck("execution_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  current_version_id TEXT NOT NULL ${uuidCheck("current_version_id")},
  current_state TEXT NOT NULL CHECK (
    current_state IN ('accepted', 'needs_decision', 'excluded_by_trader', 'superseded')
  ),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (updated_at_utc >= created_at_utc),
  UNIQUE (workspace_id, account_id, execution_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, execution_id, current_version_id) REFERENCES journal_execution_versions(workspace_id, account_id, execution_id, execution_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE INDEX journal_executions_account_state
  ON journal_executions(workspace_id, account_id, current_state, updated_at_utc);

CREATE TABLE journal_execution_versions (
  execution_version_id TEXT PRIMARY KEY ${uuidCheck("execution_version_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  execution_id TEXT NOT NULL ${uuidCheck("execution_id")},
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  instrument_id TEXT NOT NULL ${uuidCheck("instrument_id")},
  trade_currency TEXT NOT NULL ${currencyCheck("trade_currency")},
  source_timestamp_text TEXT NOT NULL CHECK (length(source_timestamp_text) BETWEEN 1 AND 120),
  source_timezone TEXT NOT NULL CHECK (length(trim(source_timezone)) BETWEEN 1 AND 64),
  time_parser_version TEXT NOT NULL ${tokenCheck("time_parser_version")},
  executed_at_utc TEXT NOT NULL ${utcCheck("executed_at_utc")},
  source_order_key TEXT NOT NULL CHECK (length(source_order_key) BETWEEN 1 AND 255),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity_decimal TEXT NOT NULL ${positiveDecimalCheck("quantity_decimal")},
  price_decimal TEXT ${positiveDecimalCheck("price_decimal")},
  fees_decimal TEXT ${canonicalDecimalCheck("fees_decimal")},
  fee_currency TEXT ${currencyCheck("fee_currency")},
  fee_sign_convention TEXT NOT NULL CHECK (
    fee_sign_convention IN ('not_reported', 'broker_reported_signed', 'cash_effect')
  ),
  fact_completeness TEXT NOT NULL CHECK (
    fact_completeness IN ('complete', 'price_missing', 'order_ambiguous')
  ),
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('system', 'user')),
  actor_user_id TEXT ${uuidCheck("actor_user_id")},
  change_reason_code TEXT NOT NULL ${tokenCheck("change_reason_code")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (price_decimal IS NULL AND fact_completeness = 'price_missing')
    OR (price_decimal IS NOT NULL AND fact_completeness IN ('complete', 'order_ambiguous'))
  ),
  CHECK (
    (fees_decimal IS NULL AND fee_currency IS NULL AND fee_sign_convention = 'not_reported')
    OR (fees_decimal IS NOT NULL AND fee_currency IS NOT NULL AND fee_sign_convention <> 'not_reported')
  ),
  CHECK (
    (actor_kind = 'system' AND actor_user_id IS NULL)
    OR (actor_kind = 'user' AND actor_user_id IS NOT NULL)
  ),
  UNIQUE (workspace_id, account_id, execution_id, execution_version_id),
  UNIQUE (workspace_id, account_id, execution_version_id),
  UNIQUE (workspace_id, account_id, execution_id, version_number),
  FOREIGN KEY (workspace_id, account_id, execution_id) REFERENCES journal_executions(workspace_id, account_id, execution_id) ON UPDATE RESTRICT ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id, instrument_id) REFERENCES journal_instruments(workspace_id, instrument_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_execution_versions_chain_order
  ON journal_execution_versions(workspace_id, account_id, instrument_id, trade_currency, executed_at_utc, source_order_key, execution_version_id);

CREATE TABLE journal_execution_provenance (
  execution_provenance_id TEXT PRIMARY KEY ${uuidCheck("execution_provenance_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  execution_id TEXT NOT NULL ${uuidCheck("execution_id")},
  execution_version_id TEXT NOT NULL ${uuidCheck("execution_version_id")},
  import_batch_id TEXT NOT NULL ${uuidCheck("import_batch_id")},
  source_row_id TEXT NOT NULL ${uuidCheck("source_row_id")},
  provenance_kind TEXT NOT NULL CHECK (
    provenance_kind IN ('broker', 'manual', 'correction', 'overlap_match')
  ),
  provider_identity_scheme_version TEXT ${tokenCheck("provider_identity_scheme_version")},
  provider_identity_sha256 TEXT ${sha256Check("provider_identity_sha256")},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    (provider_identity_scheme_version IS NULL AND provider_identity_sha256 IS NULL)
    OR (provider_identity_scheme_version IS NOT NULL AND provider_identity_sha256 IS NOT NULL)
  ),
  UNIQUE (workspace_id, account_id, execution_version_id, source_row_id, provenance_kind),
  FOREIGN KEY (workspace_id, account_id, execution_id, execution_version_id) REFERENCES journal_execution_versions(workspace_id, account_id, execution_id, execution_version_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, import_batch_id) REFERENCES journal_import_batches(workspace_id, account_id, import_batch_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, import_batch_id, source_row_id) REFERENCES journal_source_rows(workspace_id, account_id, import_batch_id, source_row_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_execution_provenance_source
  ON journal_execution_provenance(workspace_id, account_id, import_batch_id, source_row_id);

CREATE TABLE journal_execution_identity_aliases (
  execution_alias_id TEXT PRIMARY KEY ${uuidCheck("execution_alias_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  execution_id TEXT NOT NULL ${uuidCheck("execution_id")},
  alias_type TEXT NOT NULL CHECK (
    alias_type IN ('broker_fill', 'broker_order_fill', 'content_occurrence', 'manual_entry', 'legacy_reference')
  ),
  alias_scheme_version TEXT NOT NULL ${tokenCheck("alias_scheme_version")},
  alias_sha256 TEXT NOT NULL ${sha256Check("alias_sha256")},
  occurrence_ordinal INTEGER CHECK (occurrence_ordinal IS NULL OR occurrence_ordinal > 0),
  status TEXT NOT NULL CHECK (status IN ('active', 'superseded')),
  superseded_by_alias_id TEXT ${uuidCheck("superseded_by_alias_id")},
  first_seen_at_utc TEXT NOT NULL ${utcCheck("first_seen_at_utc")},
  last_seen_at_utc TEXT NOT NULL ${utcCheck("last_seen_at_utc")},
  CHECK (last_seen_at_utc >= first_seen_at_utc),
  CHECK (
    (alias_type = 'content_occurrence' AND occurrence_ordinal IS NOT NULL)
    OR (alias_type <> 'content_occurrence' AND occurrence_ordinal IS NULL)
  ),
  CHECK (superseded_by_alias_id IS NULL OR superseded_by_alias_id <> execution_alias_id),
  UNIQUE (workspace_id, account_id, execution_alias_id),
  FOREIGN KEY (workspace_id, account_id, execution_id) REFERENCES journal_executions(workspace_id, account_id, execution_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id, superseded_by_alias_id) REFERENCES journal_execution_identity_aliases(workspace_id, account_id, execution_alias_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX journal_execution_alias_identity
  ON journal_execution_identity_aliases(
    workspace_id, account_id, alias_type, alias_scheme_version,
    alias_sha256, ifnull(occurrence_ordinal, 0)
  );

CREATE INDEX journal_execution_aliases_execution
  ON journal_execution_identity_aliases(workspace_id, account_id, execution_id, status)`;

export const journalExecutionLedgerMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0004_journal_execution_ledger",
  executionOrder: 4,
  statements: Object.freeze([sql]),
});
