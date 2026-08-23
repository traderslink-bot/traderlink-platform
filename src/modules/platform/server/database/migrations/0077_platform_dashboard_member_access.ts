import type { PlatformMigration } from "../platform-migration-contract";

const sql = `CREATE TABLE platform_dashboard_member_access_settings (
  settings_key TEXT PRIMARY KEY CHECK (settings_key = 'member_dashboard_access'),
  allow_all_discord_members INTEGER NOT NULL CHECK (allow_all_discord_members IN (0, 1)),
  updated_at_utc TEXT NOT NULL CHECK (
    length(updated_at_utc) = 24
    AND updated_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )
) STRICT;

INSERT INTO platform_dashboard_member_access_settings (
  settings_key, allow_all_discord_members, updated_at_utc
) VALUES ('member_dashboard_access', 0, '2026-08-22T00:00:00.000Z');

CREATE TABLE platform_dashboard_member_access_events (
  access_event_id TEXT PRIMARY KEY CHECK (
    length(access_event_id) = 36 AND access_event_id = lower(access_event_id)
    AND length(replace(access_event_id, '-', '')) = 32
    AND replace(access_event_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(access_event_id, 9, 1) = '-' AND substr(access_event_id, 14, 1) = '-'
    AND substr(access_event_id, 19, 1) = '-' AND substr(access_event_id, 24, 1) = '-'
    AND substr(access_event_id, 15, 1) = '4' AND substr(access_event_id, 20, 1) GLOB '[89ab]'
  ),
  actor_user_id TEXT NOT NULL CHECK (
    length(actor_user_id) = 36 AND actor_user_id = lower(actor_user_id)
    AND length(replace(actor_user_id, '-', '')) = 32
    AND replace(actor_user_id, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(actor_user_id, 9, 1) = '-' AND substr(actor_user_id, 14, 1) = '-'
    AND substr(actor_user_id, 19, 1) = '-' AND substr(actor_user_id, 24, 1) = '-'
    AND substr(actor_user_id, 15, 1) = '4' AND substr(actor_user_id, 20, 1) GLOB '[89ab]'
  ),
  allow_all_discord_members INTEGER NOT NULL CHECK (allow_all_discord_members IN (0, 1)),
  changed_at_utc TEXT NOT NULL CHECK (
    length(changed_at_utc) = 24
    AND changed_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  FOREIGN KEY (actor_user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX platform_dashboard_member_access_events_chronology
  ON platform_dashboard_member_access_events(changed_at_utc DESC, access_event_id);

CREATE TRIGGER platform_dashboard_member_access_events_no_update
BEFORE UPDATE ON platform_dashboard_member_access_events BEGIN
  SELECT RAISE(ABORT, 'platform_dashboard_member_access_event_immutable');
END;

CREATE TRIGGER platform_dashboard_member_access_events_no_delete
BEFORE DELETE ON platform_dashboard_member_access_events BEGIN
  SELECT RAISE(ABORT, 'platform_dashboard_member_access_event_immutable');
END;`;

export const platformDashboardMemberAccessMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0077_platform_dashboard_member_access",
  executionOrder: 77,
  statements: Object.freeze([sql]),
});
