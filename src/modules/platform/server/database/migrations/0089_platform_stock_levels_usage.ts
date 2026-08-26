import type { PlatformMigration } from "../platform-migration-contract";

const sql = `CREATE TABLE platform_stock_levels_usage (
  usage_id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL CHECK (length(symbol) BETWEEN 1 AND 10 AND symbol = upper(symbol)),
  requested_at_ms INTEGER NOT NULL CHECK (requested_at_ms > 0),
  new_york_date TEXT NOT NULL CHECK (length(new_york_date) = 10),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;
CREATE INDEX platform_stock_levels_usage_hourly ON platform_stock_levels_usage(user_id, requested_at_ms);
CREATE INDEX platform_stock_levels_usage_new_york_day ON platform_stock_levels_usage(user_id, new_york_date, requested_at_ms);`;

export const platformStockLevelsUsageMigration: PlatformMigration = Object.freeze({ moduleNamespace: "platform", migrationId: "0089_platform_stock_levels_usage", executionOrder: 89, statements: Object.freeze([sql]) });
