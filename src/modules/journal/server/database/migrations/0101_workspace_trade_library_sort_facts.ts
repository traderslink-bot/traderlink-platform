import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN buy_quantity_decimal TEXT;
ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN buy_quantity_sort_key TEXT;
ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN position_decimal TEXT;
ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN position_sort_key TEXT;
ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN entry_price_decimal TEXT;
ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN entry_price_sort_key TEXT;
ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN exit_price_decimal TEXT;
ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN exit_price_sort_key TEXT;
ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN entry_value_sort_key TEXT;
ALTER TABLE journal_workspace_trade_library_projections ADD COLUMN gross_pnl_sort_key TEXT;

CREATE INDEX journal_workspace_trade_library_by_buy_quantity
  ON journal_workspace_trade_library_projections(workspace_id, account_id, buy_quantity_sort_key, round_trip_id);
CREATE INDEX journal_workspace_trade_library_by_position
  ON journal_workspace_trade_library_projections(workspace_id, account_id, position_sort_key, round_trip_id);
CREATE INDEX journal_workspace_trade_library_by_entry_price
  ON journal_workspace_trade_library_projections(workspace_id, account_id, entry_price_sort_key, round_trip_id);
CREATE INDEX journal_workspace_trade_library_by_exit_price
  ON journal_workspace_trade_library_projections(workspace_id, account_id, exit_price_sort_key, round_trip_id);
CREATE INDEX journal_workspace_trade_library_by_entry_value
  ON journal_workspace_trade_library_projections(workspace_id, account_id, entry_value_sort_key, round_trip_id);
CREATE INDEX journal_workspace_trade_library_by_gross_pnl
  ON journal_workspace_trade_library_projections(workspace_id, account_id, gross_pnl_sort_key, round_trip_id);`;

export const workspaceTradeLibrarySortFactsMigration: PlatformMigration = Object.freeze({
  // Production compatibility tail after its previously applied 0103/0104.
  executionOrder: 106,
  migrationId: "0101_workspace_trade_library_sort_facts",
  moduleNamespace: "journal",
  statements: Object.freeze([sql]),
});
