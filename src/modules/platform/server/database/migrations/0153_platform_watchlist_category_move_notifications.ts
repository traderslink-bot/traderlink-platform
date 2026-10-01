import type { PlatformMigration } from "../platform-migration-contract";

/** Independent move outbox. No changes to listing/analysis events or historical sends. */
export const platformWatchlistCategoryMoveNotificationsMigration: PlatformMigration = Object.freeze({
  moduleNamespace:"platform", migrationId:"0153_platform_watchlist_category_move_notifications", executionOrder:153,
  statements:Object.freeze([`
CREATE TABLE platform_watchlist_category_move_intents (
 operation_id TEXT PRIMARY KEY, ticker TEXT NOT NULL, destination_group TEXT NOT NULL,
 actor TEXT NOT NULL, recipients_json TEXT NOT NULL CHECK(json_valid(recipients_json)),
 requested_at_utc TEXT NOT NULL, expires_at_utc TEXT NOT NULL, next_check_at_utc TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','accepted','expired','cancelled'))
) STRICT;
CREATE TABLE platform_watchlist_category_move_deliveries (
 delivery_id TEXT PRIMARY KEY, operation_id TEXT NOT NULL REFERENCES platform_watchlist_category_move_intents(operation_id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE CASCADE,
 channel TEXT NOT NULL CHECK(channel IN ('web_push','email')), target_ref TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending','sending','delivered','failed','expired','opted_out','inaccessible')),
 attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 5),
 available_at_utc TEXT NOT NULL, last_attempt_at_utc TEXT, delivered_at_utc TEXT, failure_code TEXT,
 UNIQUE(operation_id,user_id,channel,target_ref)
) STRICT;
CREATE INDEX platform_watchlist_category_move_intent_queue ON platform_watchlist_category_move_intents(state,next_check_at_utc);
CREATE INDEX platform_watchlist_category_move_delivery_queue ON platform_watchlist_category_move_deliveries(state,available_at_utc);
`]),
});
