import type { PlatformMigration } from "../platform-migration-contract";

export const platformWatchlistXPublicationsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0151_platform_watchlist_x_publications",
  executionOrder: 151,
  statements: Object.freeze([
    `CREATE TABLE platform_watchlist_x_posts (
      post_key TEXT PRIMARY KEY, cycle_id TEXT NOT NULL, ticker TEXT NOT NULL,
      owner_user_id TEXT NOT NULL REFERENCES platform_users(user_id), draft_revision INTEGER,
      approval_revision INTEGER, caption TEXT NOT NULL, channel_id TEXT NOT NULL,
      state TEXT NOT NULL CHECK(state IN ('waiting','preparing','ready','sending','accepted','sent','failed','uncertain','cancelled')),
      status_message TEXT NOT NULL, buffer_post_id TEXT, requested_at_ms INTEGER NOT NULL,
      updated_at_ms INTEGER NOT NULL, next_attempt_at_ms INTEGER NOT NULL DEFAULT 0,
      sent_at_ms INTEGER, attempts INTEGER NOT NULL DEFAULT 0,
      UNIQUE(cycle_id,draft_revision), UNIQUE(cycle_id,approval_revision)
    ) STRICT;`,
    `CREATE TABLE platform_watchlist_x_images (
      token TEXT PRIMARY KEY, post_key TEXT NOT NULL REFERENCES platform_watchlist_x_posts(post_key),
      ordinal INTEGER NOT NULL, png BLOB NOT NULL, sha256 TEXT NOT NULL,
      UNIQUE(post_key,ordinal)
    ) STRICT;`,
    `CREATE INDEX platform_watchlist_x_pending ON platform_watchlist_x_posts(state,next_attempt_at_ms);`,
  ]),
});
