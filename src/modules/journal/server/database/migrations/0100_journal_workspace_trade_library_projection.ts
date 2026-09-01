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

function decimalCheck(column: string): string {
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
    AND CASE WHEN substr(${column}, 1, 1) = '-' THEN
      substr(${column}, 2, 1) <> '0' OR substr(${column}, 2, 2) = '0.'
      ELSE substr(${column}, 1, 1) <> '0' OR ${column} = '0' OR substr(${column}, 1, 2) = '0.'
    END
  )`;
}

const sql = `CREATE TABLE journal_workspace_trade_library_projection_revisions (
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  projection_revision_id TEXT NOT NULL ${uuidCheck("projection_revision_id")},
  refreshed_at_utc TEXT NOT NULL ${utcCheck("refreshed_at_utc")},
  PRIMARY KEY (workspace_id, account_id),
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TABLE journal_workspace_trade_library_projections (
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  round_trip_id TEXT NOT NULL ${uuidCheck("round_trip_id")},
  round_trip_version_id TEXT NOT NULL ${uuidCheck("round_trip_version_id")},
  projection_state TEXT NOT NULL CHECK (projection_state IN ('ready_closed', 'legitimate_open')),
  opened_at_utc TEXT NOT NULL ${utcCheck("opened_at_utc")},
  closed_at_utc TEXT ${utcCheck("closed_at_utc")},
  activity_at_utc TEXT NOT NULL ${utcCheck("activity_at_utc")},
  activity_local_date TEXT NOT NULL CHECK (activity_local_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  entry_local_date TEXT NOT NULL CHECK (entry_local_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  entry_local_time TEXT NOT NULL CHECK (entry_local_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  exit_local_date TEXT CHECK (exit_local_date IS NULL OR exit_local_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  exit_local_time TEXT CHECK (exit_local_time IS NULL OR exit_local_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  gross_pnl_decimal TEXT ${decimalCheck("gross_pnl_decimal")},
  net_pnl_decimal TEXT ${decimalCheck("net_pnl_decimal")},
  net_pnl_sort_key TEXT,
  entered_quantity_decimal TEXT ${decimalCheck("entered_quantity_decimal")},
  exit_quantity_decimal TEXT ${decimalCheck("exit_quantity_decimal")},
  maximum_position_quantity_decimal TEXT ${decimalCheck("maximum_position_quantity_decimal")},
  entry_notional_decimal TEXT ${decimalCheck("entry_notional_decimal")},
  exit_notional_decimal TEXT ${decimalCheck("exit_notional_decimal")},
  unique_execution_count INTEGER NOT NULL CHECK (unique_execution_count >= 0),
  refreshed_at_utc TEXT NOT NULL ${utcCheck("refreshed_at_utc")},
  PRIMARY KEY (workspace_id, account_id, round_trip_version_id),
  UNIQUE (workspace_id, account_id, round_trip_id),
  CHECK (
    (projection_state = 'ready_closed' AND closed_at_utc IS NOT NULL
      AND gross_pnl_decimal IS NOT NULL AND entered_quantity_decimal IS NOT NULL
      AND exit_quantity_decimal IS NOT NULL AND maximum_position_quantity_decimal IS NOT NULL
      AND entry_notional_decimal IS NOT NULL AND exit_notional_decimal IS NOT NULL)
    OR (projection_state = 'legitimate_open' AND closed_at_utc IS NULL
      AND gross_pnl_decimal IS NULL AND net_pnl_decimal IS NULL AND net_pnl_sort_key IS NULL)
  ),
  CHECK ((net_pnl_decimal IS NULL AND net_pnl_sort_key IS NULL)
    OR (net_pnl_decimal IS NOT NULL AND net_pnl_sort_key IS NOT NULL)),
  FOREIGN KEY (workspace_id, account_id, round_trip_id, round_trip_version_id)
    REFERENCES journal_round_trip_versions(workspace_id, account_id, round_trip_id, round_trip_version_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, account_id) REFERENCES journal_accounts(workspace_id, account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX journal_workspace_trade_library_by_activity
  ON journal_workspace_trade_library_projections(
    workspace_id, account_id, activity_at_utc DESC, round_trip_id DESC
  );

CREATE INDEX journal_workspace_trade_library_by_net_pnl
  ON journal_workspace_trade_library_projections(
    workspace_id, account_id, net_pnl_sort_key, round_trip_id
  ) WHERE net_pnl_sort_key IS NOT NULL;`;

export const journalWorkspaceTradeLibraryProjectionMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0100_journal_workspace_trade_library_projection",
  // Production already has the later 0103/0104 migrations. Keep this
  // Workspace migration as the next guarded production tail entry.
  executionOrder: 105,
  statements: Object.freeze([sql]),
});
