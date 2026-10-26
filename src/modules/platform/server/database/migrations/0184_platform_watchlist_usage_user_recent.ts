import type { PlatformMigration } from "../platform-migration-contract";

export const platformWatchlistUsageUserRecentMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0184_platform_watchlist_usage_user_recent",
  executionOrder: 221,
  statements: Object.freeze([
    "CREATE INDEX platform_watchlist_usage_events_user_recent ON platform_watchlist_usage_events(user_id, visited_at_ms DESC);",
  ]),
});
