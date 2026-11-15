import type {PlatformMigration} from "../platform-migration-contract";

// Coordinator-reserved successor of0161. No existing delivery is replayed.
export const platformCoachingDeliveryAttemptHistoryMigration:PlatformMigration=Object.freeze({
 moduleNamespace:"community",migrationId:"0162_platform_coaching_delivery_attempt_history",executionOrder:175,
 statements:Object.freeze([
  `ALTER TABLE traderlink_community_content_deliveries ADD COLUMN current_attempt_key TEXT;`,
  `CREATE TABLE traderlink_community_delivery_attempt_history (
    event_id TEXT PRIMARY KEY NOT NULL,
    attempt_key TEXT NOT NULL,
    delivery_id TEXT NOT NULL REFERENCES traderlink_community_content_deliveries(delivery_id) ON DELETE RESTRICT,
    community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
    actor_user_id TEXT REFERENCES platform_users(user_id) ON DELETE SET NULL,
    outcome TEXT NOT NULL CHECK(outcome IN ('requested','confirmed','rejected','uncertain','pending','cancelled')),
    discord_message_id TEXT CHECK(discord_message_id IS NULL OR (length(discord_message_id) BETWEEN 1 AND 32 AND discord_message_id NOT GLOB '*[^0-9]*')),
    error_message TEXT CHECK(error_message IS NULL OR length(error_message)<=1000),
    occurred_at_utc TEXT NOT NULL CHECK(length(occurred_at_utc)=24 AND occurred_at_utc GLOB '????-??-??T??:??:??.???Z')
  ) STRICT;`,
  `CREATE INDEX traderlink_community_delivery_attempt_history_recent ON traderlink_community_delivery_attempt_history(delivery_id,occurred_at_utc DESC);`,
 ]),
});
