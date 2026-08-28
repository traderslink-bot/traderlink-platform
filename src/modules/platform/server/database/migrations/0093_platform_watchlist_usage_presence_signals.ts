import type { PlatformMigration } from "../platform-migration-contract";

const sql = `CREATE TABLE platform_watchlist_usage_presence (
  presence_id TEXT PRIMARY KEY CHECK (length(presence_id) = 36),
  user_id TEXT NOT NULL,
  last_open_heartbeat_ms INTEGER NOT NULL CHECK (last_open_heartbeat_ms > 0),
  last_visible_heartbeat_ms INTEGER CHECK (last_visible_heartbeat_ms > 0),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;
CREATE INDEX platform_watchlist_usage_presence_open
  ON platform_watchlist_usage_presence(last_open_heartbeat_ms DESC, user_id);
CREATE INDEX platform_watchlist_usage_presence_visible
  ON platform_watchlist_usage_presence(last_visible_heartbeat_ms DESC, user_id);`;

export const platformWatchlistUsagePresenceSignalsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0093_platform_watchlist_usage_presence_signals",
  executionOrder: 93,
  statements: Object.freeze([sql]),
});
