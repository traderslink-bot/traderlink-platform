import type { PlatformMigration } from "../platform-migration-contract";

const sql = `CREATE TABLE platform_watchlist_visibility (
  settings_key TEXT PRIMARY KEY CHECK (settings_key = 'member_visibility'),
  member_visible INTEGER NOT NULL CHECK (member_visible IN (0, 1)),
  updated_at_utc TEXT CHECK (
    updated_at_utc IS NULL OR (
      length(updated_at_utc) = 24
      AND updated_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
    )
  ),
  updated_by_user_id TEXT CHECK (
    updated_by_user_id IS NULL OR (
      length(updated_by_user_id) = 36
      AND updated_by_user_id = lower(updated_by_user_id)
      AND length(replace(updated_by_user_id, '-', '')) = 32
      AND replace(updated_by_user_id, '-', '') NOT GLOB '*[^0-9a-f]*'
      AND substr(updated_by_user_id, 15, 1) = '4'
      AND substr(updated_by_user_id, 20, 1) GLOB '[89ab]'
    )
  ),
  CHECK (
    (updated_at_utc IS NULL AND updated_by_user_id IS NULL)
    OR (updated_at_utc IS NOT NULL AND updated_by_user_id IS NOT NULL)
  ),
  FOREIGN KEY (updated_by_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

INSERT INTO platform_watchlist_visibility (settings_key, member_visible)
VALUES ('member_visibility', 1);

CREATE TRIGGER platform_watchlist_visibility_update_guard
BEFORE UPDATE ON platform_watchlist_visibility
WHEN NEW.settings_key <> OLD.settings_key
  OR NEW.member_visible NOT IN (0, 1)
  OR (NEW.updated_at_utc IS NULL) <> (NEW.updated_by_user_id IS NULL)
BEGIN
  SELECT RAISE(ABORT, 'platform_watchlist_visibility_invalid_update');
END;

CREATE TRIGGER platform_watchlist_visibility_no_delete
BEFORE DELETE ON platform_watchlist_visibility
BEGIN
  SELECT RAISE(ABORT, 'platform_watchlist_visibility_delete_forbidden');
END;`;

export const platformWatchlistVisibilityMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0100_platform_watchlist_visibility",
  executionOrder: 100,
  statements: Object.freeze([sql]),
});
