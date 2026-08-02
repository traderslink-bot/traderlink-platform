import type { PlatformMigration } from "../platform-migration-contract";

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

const sql = `CREATE TABLE platform_hosted_transfer_events (
  transfer_event_id TEXT PRIMARY KEY ${uuidCheck("transfer_event_id")},
  transfer_run_id TEXT NOT NULL ${uuidCheck("transfer_run_id")},
  module_namespace TEXT NOT NULL CHECK (
    module_namespace IN ('academy', 'watchlist', 'news', 'affiliate')
  ),
  event_kind TEXT NOT NULL CHECK (
    event_kind IN ('executed', 'reconciled')
  ),
  preview_sha256 TEXT NOT NULL ${sha256Check("preview_sha256")},
  source_snapshot_sha256 TEXT NOT NULL ${sha256Check("source_snapshot_sha256")},
  reconciliation_sha256 TEXT ${sha256Check("reconciliation_sha256")},
  source_row_count INTEGER NOT NULL CHECK (source_row_count >= 0),
  accepted_row_count INTEGER NOT NULL CHECK (accepted_row_count >= 0),
  unchanged_row_count INTEGER NOT NULL CHECK (unchanged_row_count >= 0),
  pending_row_count INTEGER NOT NULL CHECK (pending_row_count >= 0),
  conflict_row_count INTEGER NOT NULL CHECK (conflict_row_count >= 0),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  CHECK (
    event_kind = 'reconciled' OR reconciliation_sha256 IS NULL
  ),
  UNIQUE (module_namespace, event_kind, preview_sha256)
) STRICT;

CREATE INDEX platform_hosted_transfer_events_run_chronology
  ON platform_hosted_transfer_events(
    transfer_run_id, created_at_utc, module_namespace, transfer_event_id
  );

CREATE TRIGGER platform_hosted_transfer_events_no_update
BEFORE UPDATE ON platform_hosted_transfer_events BEGIN
  SELECT RAISE(ABORT, 'platform_hosted_transfer_event_immutable');
END;

CREATE TRIGGER platform_hosted_transfer_events_no_delete
BEFORE DELETE ON platform_hosted_transfer_events BEGIN
  SELECT RAISE(ABORT, 'platform_hosted_transfer_event_immutable');
END`;

export const platformHostedTransferEventsMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "platform",
    migrationId: "0018_platform_hosted_transfer_events",
    executionOrder: 18,
    statements: Object.freeze([sql]),
  });
