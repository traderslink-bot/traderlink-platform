import type { PlatformMigration } from "../platform-migration-contract";

const sql = `CREATE TABLE platform_stock_levels_saved_maps (
  saved_map_id TEXT PRIMARY KEY CHECK (length(saved_map_id) BETWEEN 1 AND 80),
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL CHECK (length(symbol) BETWEEN 1 AND 10 AND symbol = upper(symbol)),
  map_json TEXT NOT NULL CHECK (length(map_json) > 0),
  saved_at_ms INTEGER NOT NULL CHECK (saved_at_ms > 0),
  updated_at_ms INTEGER NOT NULL CHECK (updated_at_ms >= saved_at_ms),
  expires_at_ms INTEGER NOT NULL CHECK (expires_at_ms > updated_at_ms),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;
CREATE INDEX platform_stock_levels_saved_maps_account_recent
  ON platform_stock_levels_saved_maps(user_id, updated_at_ms DESC);
CREATE INDEX platform_stock_levels_saved_maps_expiry
  ON platform_stock_levels_saved_maps(expires_at_ms);`;

export const platformStockLevelsSavedMapsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0090_platform_stock_levels_saved_maps",
  executionOrder: 90,
  statements: Object.freeze([sql]),
});
