import type {PlatformMigration} from "../platform-migration-contract";
// Coordinator reservation: 0168/order181, integrated predecessor0167/order180. Source only.
export const communityDestinationPublisherStatements=Object.freeze([
 `CREATE UNIQUE INDEX community_destination_identity ON traderlink_community_discord_destinations(community_id,destination_id);`,
 `CREATE TABLE traderlink_community_destination_publishers (
 community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE CASCADE,
 destination_id TEXT NOT NULL REFERENCES traderlink_community_discord_destinations(destination_id) ON DELETE CASCADE,
 subject_kind TEXT NOT NULL CHECK(subject_kind IN ('user','role')), subject_id TEXT NOT NULL,
 updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id), updated_at_utc TEXT NOT NULL,
 PRIMARY KEY(community_id,destination_id,subject_kind,subject_id),
 FOREIGN KEY(community_id,destination_id) REFERENCES traderlink_community_discord_destinations(community_id,destination_id) ON DELETE CASCADE) STRICT, WITHOUT ROWID;`,
 `CREATE TABLE traderlink_community_publication_distribution (
 community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE CASCADE,
 object_type TEXT NOT NULL CHECK(object_type IN ('alert','watchlist')),object_id TEXT NOT NULL,
 publisher_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE CASCADE,distribution TEXT NOT NULL CHECK(distribution IN ('website','discord')),
 destination_ids_json TEXT NOT NULL CHECK(json_valid(destination_ids_json)),updated_at_utc TEXT NOT NULL,
 PRIMARY KEY(community_id,object_type,object_id)) STRICT, WITHOUT ROWID;`,
 `CREATE TABLE traderlink_community_destination_audit (
 audit_id TEXT PRIMARY KEY,community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE CASCADE,
 destination_id TEXT NOT NULL REFERENCES traderlink_community_discord_destinations(destination_id) ON DELETE CASCADE,
 actor_user_id TEXT NOT NULL REFERENCES platform_users(user_id),before_json TEXT NOT NULL CHECK(json_valid(before_json)),
 after_json TEXT NOT NULL CHECK(json_valid(after_json)),created_at_utc TEXT NOT NULL) STRICT;`,
 `ALTER TABLE traderlink_community_content_deliveries ADD COLUMN publisher_user_id TEXT REFERENCES platform_users(user_id) ON DELETE SET NULL;`,
]);

export const platformCommunityDestinationPublishersMigration:PlatformMigration=Object.freeze({moduleNamespace:"community",migrationId:"0168_platform_community_destination_publishers",executionOrder:181,statements:communityDestinationPublisherStatements});
