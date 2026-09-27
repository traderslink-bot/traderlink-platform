import type { PlatformMigration } from "../platform-migration-contract";

export const watchlistOwnerReviewNotificationsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0146_watchlist_owner_review_notifications",
  executionOrder: 146,
  statements: Object.freeze([`CREATE TABLE platform_watchlist_owner_review_deliveries (
    event_key TEXT PRIMARY KEY,
    cycle_id TEXT NOT NULL,
    generation_id TEXT NOT NULL,
    ticker TEXT NOT NULL,
    owner_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
    created_at_utc TEXT NOT NULL,
    inbox_state TEXT NOT NULL DEFAULT 'pending' CHECK(inbox_state IN ('pending','sent','disabled')),
    discord_state TEXT NOT NULL DEFAULT 'pending' CHECK(discord_state IN ('pending','sending','sent','uncertain','failed','disabled','expired')),
    discord_attempts INTEGER NOT NULL DEFAULT 0 CHECK(discord_attempts >= 0),
    next_attempt_at_utc TEXT NOT NULL,
    last_status TEXT
  ) STRICT;
  CREATE INDEX platform_watchlist_owner_review_delivery_queue
    ON platform_watchlist_owner_review_deliveries(discord_state,next_attempt_at_utc);`]),
});
