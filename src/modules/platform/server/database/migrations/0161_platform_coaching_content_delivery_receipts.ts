import type { PlatformMigration } from "../platform-migration-contract";

// Coordinator reservation: successor of 0160. Existing delivery statuses stay intact.
export const platformCoachingContentDeliveryReceiptsMigration: PlatformMigration = Object.freeze({
 moduleNamespace:"community",
 migrationId:"0161_platform_coaching_content_delivery_receipts",
 executionOrder:174,
 statements:Object.freeze([
  `ALTER TABLE traderlink_community_content_deliveries ADD COLUMN discord_message_id TEXT CHECK(discord_message_id IS NULL OR (length(discord_message_id) BETWEEN 1 AND 32 AND discord_message_id NOT GLOB '*[^0-9]*'));`,
  `ALTER TABLE traderlink_community_content_deliveries ADD COLUMN next_attempt_at_utc TEXT CHECK(next_attempt_at_utc IS NULL OR (length(next_attempt_at_utc)=24 AND next_attempt_at_utc GLOB '????-??-??T??:??:??.???Z'));`,
  `ALTER TABLE traderlink_community_content_deliveries ADD COLUMN delivery_outcome TEXT NOT NULL DEFAULT 'pending' CHECK(delivery_outcome IN ('pending','confirmed','rejected','uncertain'));`,
  `UPDATE traderlink_community_content_deliveries SET delivery_outcome=CASE WHEN status='delivered' THEN 'confirmed' WHEN status IN ('sending','failed') THEN 'uncertain' WHEN status='cancelled' THEN 'rejected' ELSE 'pending' END;`,
 ]),
});
