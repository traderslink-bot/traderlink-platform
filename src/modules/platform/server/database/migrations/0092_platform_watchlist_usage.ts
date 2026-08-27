import type { PlatformMigration } from "../platform-migration-contract";

const sql = `CREATE TABLE platform_watchlist_usage_events (
  event_id TEXT PRIMARY KEY CHECK (length(event_id) = 36),
  user_id TEXT NOT NULL,
  visited_at_ms INTEGER NOT NULL CHECK (visited_at_ms > 0),
  new_york_date TEXT NOT NULL CHECK (length(new_york_date) = 10),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;
CREATE INDEX platform_watchlist_usage_events_daily
  ON platform_watchlist_usage_events(new_york_date, user_id, visited_at_ms DESC);
CREATE INDEX platform_watchlist_usage_events_recent
  ON platform_watchlist_usage_events(visited_at_ms DESC);`;

export const platformWatchlistUsageMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0092_platform_watchlist_usage",
  executionOrder: 92,
  statements: Object.freeze([sql]),
});
