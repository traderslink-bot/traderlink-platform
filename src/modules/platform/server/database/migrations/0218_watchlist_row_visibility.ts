import type { PlatformMigration } from "../platform-migration-contract";

/** Additive per-ticker list display choice; existing Premium controls stay independent. */
export const watchlistRowVisibilityMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0218_watchlist_row_visibility",
  executionOrder: 293,
  statements: Object.freeze([
    `CREATE TABLE platform_watchlist_row_visibility (
      symbol TEXT PRIMARY KEY,
      hidden_from_free INTEGER NOT NULL DEFAULT 0 CHECK(hidden_from_free IN (0,1)),
      updated_at_utc TEXT NOT NULL,
      updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id)
    ) STRICT;`,
    `CREATE TABLE platform_watchlist_row_visibility_audit (
      audit_id INTEGER PRIMARY KEY,
      symbol TEXT NOT NULL,
      previous_hidden_from_free INTEGER NOT NULL CHECK(previous_hidden_from_free IN (0,1)),
      hidden_from_free INTEGER NOT NULL CHECK(hidden_from_free IN (0,1)),
      changed_at_utc TEXT NOT NULL,
      actor_user_id TEXT NOT NULL REFERENCES platform_users(user_id)
    ) STRICT;`,
    "CREATE INDEX platform_watchlist_row_visibility_audit_symbol ON platform_watchlist_row_visibility_audit(symbol,audit_id);",
  ]),
});
