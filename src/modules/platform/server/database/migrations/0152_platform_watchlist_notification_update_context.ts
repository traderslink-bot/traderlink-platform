import type { PlatformMigration } from "../platform-migration-contract";

/** Additive only. Historical events remain unchanged and no deliveries are created. */
export const platformWatchlistNotificationUpdateContextMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0152_platform_watchlist_notification_update_context",
  executionOrder: 152,
  statements: Object.freeze([
    `ALTER TABLE platform_watchlist_notification_events ADD COLUMN analysis_update_context_json TEXT
      CHECK(analysis_update_context_json IS NULL OR json_valid(analysis_update_context_json));`,
  ]),
});
