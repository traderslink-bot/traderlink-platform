import type { PlatformMigration } from "../platform-migration-contract";

/** Independent, explicit publication-date disclosure for concealed list rows. */
export const watchlistMaskedAddedDateMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0219_watchlist_masked_added_date",
  executionOrder: 294,
  statements: Object.freeze([
    `CREATE TABLE platform_watchlist_hidden_added_visibility (
      symbol TEXT PRIMARY KEY,
      show_added INTEGER NOT NULL DEFAULT 0 CHECK(show_added IN (0,1)),
      updated_at_utc TEXT NOT NULL,
      updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id)
    ) STRICT;`,
    `CREATE TABLE platform_watchlist_hidden_added_visibility_audit (
      audit_id INTEGER PRIMARY KEY,
      symbol TEXT NOT NULL,
      previous_show_added INTEGER NOT NULL CHECK(previous_show_added IN (0,1)),
      show_added INTEGER NOT NULL CHECK(show_added IN (0,1)),
      changed_at_utc TEXT NOT NULL,
      actor_user_id TEXT NOT NULL REFERENCES platform_users(user_id)
    ) STRICT;`,
    "CREATE INDEX platform_watchlist_hidden_added_visibility_audit_symbol ON platform_watchlist_hidden_added_visibility_audit(symbol,audit_id);",
  ]),
});
