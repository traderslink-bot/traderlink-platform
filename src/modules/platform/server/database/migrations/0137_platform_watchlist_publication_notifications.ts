import type { PlatformMigration } from "../platform-migration-contract";

const sql = `CREATE TABLE platform_watchlist_notification_intents (
  cycle_id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  expected_head INTEGER NOT NULL CHECK(expected_head >= 1),
  draft_revision INTEGER NOT NULL CHECK(draft_revision >= 1),
  actor TEXT NOT NULL,
  recipients_json TEXT NOT NULL CHECK(json_valid(recipients_json)),
  requested_at_utc TEXT NOT NULL,
  next_check_at_utc TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('pending','accepted','expired'))
) STRICT;
CREATE INDEX platform_watchlist_notification_intent_queue ON platform_watchlist_notification_intents(state,next_check_at_utc);

CREATE TABLE platform_watchlist_notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE CASCADE,
  web_push_enabled INTEGER NOT NULL DEFAULT 0 CHECK(web_push_enabled IN (0,1)),
  email_enabled INTEGER NOT NULL DEFAULT 0 CHECK(email_enabled IN (0,1)),
  updated_at_utc TEXT NOT NULL
) STRICT;

CREATE TABLE platform_watchlist_notification_events (
  cycle_id TEXT PRIMARY KEY,
  ticker TEXT NOT NULL,
  approved_at_utc TEXT NOT NULL,
  published_at_utc TEXT NOT NULL,
  accepted_at_utc TEXT NOT NULL,
  expires_at_utc TEXT NOT NULL,
  CHECK(approved_at_utc <= published_at_utc),
  CHECK(published_at_utc < expires_at_utc)
) STRICT;

CREATE TABLE platform_watchlist_notification_deliveries (
  delivery_id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL REFERENCES platform_watchlist_notification_events(cycle_id) ON UPDATE RESTRICT ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK(channel IN ('web_push','email')),
  target_ref TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('pending','sending','delivered','expired','opted_out','inaccessible','failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 5),
  available_at_utc TEXT NOT NULL,
  last_attempt_at_utc TEXT,
  delivered_at_utc TEXT,
  failure_code TEXT,
  UNIQUE(cycle_id,user_id,channel,target_ref)
) STRICT;
CREATE INDEX platform_watchlist_notification_delivery_queue
  ON platform_watchlist_notification_deliveries(state,available_at_utc);
CREATE INDEX platform_watchlist_notification_delivery_user
  ON platform_watchlist_notification_deliveries(user_id,channel);
CREATE TRIGGER platform_watchlist_notification_event_immutable
BEFORE UPDATE ON platform_watchlist_notification_events
BEGIN SELECT RAISE(ABORT,'watchlist_notification_event_immutable'); END;`;

/** Additive, empty at rollout: never selects old Watchlist posts for delivery. */
export const platformWatchlistPublicationNotificationsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0137_platform_watchlist_publication_notifications",
  executionOrder: 137,
  statements: Object.freeze([sql]),
});
