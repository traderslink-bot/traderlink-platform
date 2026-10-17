import type {PlatformMigration} from "../platform-migration-contract";
export const communityRemovalRecoveryStatements=Object.freeze([
 `CREATE TABLE traderlink_community_lifecycle (
 community_id TEXT PRIMARY KEY REFERENCES traderlink_communities(community_id) ON DELETE CASCADE,
 removed_at_utc TEXT,recover_until_utc TEXT,configuration_purged_at_utc TEXT,
 removed_by_user_id TEXT REFERENCES platform_users(user_id) ON DELETE SET NULL,
 bot_state TEXT NOT NULL DEFAULT 'unknown' CHECK(bot_state IN ('unknown','connected','not_installed','unavailable')),
 bot_checked_at_utc TEXT,bot_missing_since_utc TEXT,
 CHECK((removed_at_utc IS NULL AND recover_until_utc IS NULL) OR (removed_at_utc IS NOT NULL AND recover_until_utc IS NOT NULL))) STRICT;`,
]);
// Coordinator reserved identity/order; never execute from this source lane.
export const platformCommunityRemovalRecoveryMigration:PlatformMigration=Object.freeze({moduleNamespace:"community",migrationId:"0169_platform_community_removal_recovery",executionOrder:182,statements:communityRemovalRecoveryStatements});
