import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN hold_duration_seconds INTEGER;
ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN hold_duration_sort_key TEXT;

CREATE INDEX journal_workspace_trade_library_by_hold_duration
  ON journal_workspace_trade_library_projections(workspace_id, account_id, hold_duration_sort_key, round_trip_id);`;

export const workspaceTradeLibraryHoldDurationMigration: PlatformMigration = Object.freeze({
  executionOrder: 102,
  migrationId: "0102_workspace_trade_library_hold_duration",
  moduleNamespace: "journal",
  statements: Object.freeze([sql]),
});
