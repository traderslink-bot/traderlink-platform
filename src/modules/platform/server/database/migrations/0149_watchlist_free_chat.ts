import type { PlatformMigration } from "../platform-migration-contract";

export const watchlistFreeChatMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform", migrationId: "0149_watchlist_free_chat", executionOrder: 149,
  statements: Object.freeze([
    `CREATE TABLE platform_watchlist_free_chat_preferences (
      cycle_id TEXT PRIMARY KEY, ticker TEXT NOT NULL,
      owner_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
      automatic_enabled INTEGER NOT NULL DEFAULT 0 CHECK(automatic_enabled IN (0,1)),
      enabled_at_ms INTEGER NOT NULL, updated_at_ms INTEGER NOT NULL
    ) STRICT;`,
    `CREATE TABLE platform_watchlist_free_chat_posts (
      post_key TEXT PRIMARY KEY, cycle_id TEXT NOT NULL, ticker TEXT NOT NULL,
      owner_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
      draft_revision INTEGER, approval_revision INTEGER,
      origin TEXT NOT NULL CHECK(origin IN ('approval','manual','automatic')),
      state TEXT NOT NULL CHECK(state IN ('pending','sending','sent','retry','failed','uncertain','cancelled')),
      requested_at_ms INTEGER NOT NULL, updated_at_ms INTEGER NOT NULL,
      next_attempt_at_ms INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0,
      sent_at_ms INTEGER, discord_message_id TEXT, status_message TEXT,
      UNIQUE(cycle_id,approval_revision)
    ) STRICT;`,
    `CREATE INDEX platform_watchlist_free_chat_pending ON platform_watchlist_free_chat_posts(state,next_attempt_at_ms);`,
  ]),
});
