import type { PlatformMigration } from "../platform-migration-contract";

export const watchlistPotentialGainPostsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform", migrationId: "0147_watchlist_potential_gain_posts", executionOrder: 147,
  statements: Object.freeze([`CREATE TABLE platform_watchlist_potential_gain_posts (
    request_id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
    ticker TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('sending','sent','retry','failed','uncertain')),
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL,
    retry_at_ms INTEGER NOT NULL DEFAULT 0,
    discord_message_id TEXT
  ) STRICT;`]),
});
