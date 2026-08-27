import type { PlatformMigration } from "../platform-migration-contract";

const sql = `CREATE TABLE platform_stock_levels_activity (
  activity_id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  generated_at_ms INTEGER NOT NULL CHECK (generated_at_ms > 0),
  new_york_date TEXT NOT NULL CHECK (length(new_york_date) = 10),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;
CREATE INDEX platform_stock_levels_activity_today
  ON platform_stock_levels_activity(new_york_date, user_id, generated_at_ms DESC);
CREATE INDEX platform_stock_levels_activity_expiry
  ON platform_stock_levels_activity(generated_at_ms);`;

export const platformStockLevelsActivityMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0091_platform_stock_levels_activity",
  executionOrder: 91,
  statements: Object.freeze([sql]),
});
