import type { PlatformMigration } from "../platform-migration-contract";

const sql = `ALTER TABLE platform_watchlist_notification_intents RENAME TO platform_watchlist_notification_intents_v137;
DROP INDEX platform_watchlist_notification_intent_queue;
CREATE TABLE platform_watchlist_notification_intents (
  intent_id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  expected_head INTEGER NOT NULL CHECK(expected_head >= 1),
  draft_revision INTEGER NOT NULL CHECK(draft_revision >= 0),
  notify_users INTEGER NOT NULL CHECK(notify_users IN (0,1)),
  actor TEXT NOT NULL,
  recipients_json TEXT NOT NULL CHECK(json_valid(recipients_json)),
  requested_at_utc TEXT NOT NULL,
  next_check_at_utc TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('pending','accepted','expired'))
) STRICT;
INSERT INTO platform_watchlist_notification_intents
SELECT cycle_id,cycle_id,ticker,expected_head,draft_revision,1,actor,recipients_json,requested_at_utc,next_check_at_utc,state
FROM platform_watchlist_notification_intents_v137;
DROP TABLE platform_watchlist_notification_intents_v137;
CREATE INDEX platform_watchlist_notification_intent_queue ON platform_watchlist_notification_intents(state,next_check_at_utc);

DROP TRIGGER platform_watchlist_notification_event_immutable;
ALTER TABLE platform_watchlist_notification_events RENAME COLUMN cycle_id TO event_id;
ALTER TABLE platform_watchlist_notification_events ADD COLUMN cycle_id TEXT NOT NULL DEFAULT '';
ALTER TABLE platform_watchlist_notification_events ADD COLUMN notification_kind TEXT NOT NULL DEFAULT 'listing' CHECK(notification_kind IN ('listing','analysis'));
ALTER TABLE platform_watchlist_notification_events ADD COLUMN approval_revision INTEGER NOT NULL DEFAULT 0 CHECK(approval_revision >= 0);
ALTER TABLE platform_watchlist_notification_events ADD COLUMN notify_users INTEGER NOT NULL DEFAULT 1 CHECK(notify_users IN (0,1));
UPDATE platform_watchlist_notification_events SET cycle_id=event_id;
ALTER TABLE platform_watchlist_notification_deliveries RENAME COLUMN cycle_id TO event_id;
CREATE UNIQUE INDEX platform_watchlist_notification_one_listing ON platform_watchlist_notification_events(cycle_id) WHERE notification_kind='listing';
CREATE UNIQUE INDEX platform_watchlist_notification_analysis_revision ON platform_watchlist_notification_events(cycle_id,approval_revision) WHERE notification_kind='analysis';
CREATE TRIGGER platform_watchlist_notification_event_immutable
BEFORE UPDATE ON platform_watchlist_notification_events
BEGIN SELECT RAISE(ABORT,'watchlist_notification_event_immutable'); END;`;

/** Preserves 0137 preferences, events, recipients and delivery receipts. No sends. */
export const platformWatchlistNotificationActionIdentityMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0138_platform_watchlist_notification_action_identity",
  executionOrder: 138,
  statements: Object.freeze([sql]),
});
