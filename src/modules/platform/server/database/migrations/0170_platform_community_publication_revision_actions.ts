import type {PlatformMigration} from "../platform-migration-contract";
export const communityPublicationRevisionActionStatements=Object.freeze([
 `CREATE TABLE traderlink_community_publication_revisions (
 revision_id TEXT PRIMARY KEY,community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE CASCADE,
 object_type TEXT NOT NULL CHECK(object_type IN ('alert','watchlist')),object_id TEXT NOT NULL,
 evidence_kind TEXT NOT NULL CHECK(evidence_kind IN ('original','legacy_baseline','revision')),
 actor_user_id TEXT REFERENCES platform_users(user_id) ON DELETE SET NULL,
 content_json TEXT NOT NULL CHECK(json_valid(content_json)),content_hash TEXT NOT NULL,
 original_published_at_utc TEXT,recorded_at_utc TEXT NOT NULL,change_summary TEXT NOT NULL DEFAULT '') STRICT;`,
 `CREATE INDEX community_revision_object ON traderlink_community_publication_revisions(community_id,object_type,object_id,recorded_at_utc);`,
 `CREATE TABLE traderlink_community_publication_actions (
 action_id TEXT PRIMARY KEY,community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE CASCADE,
 revision_id TEXT NOT NULL REFERENCES traderlink_community_publication_revisions(revision_id) ON DELETE CASCADE,
 object_type TEXT NOT NULL CHECK(object_type IN ('alert','watchlist')),object_id TEXT NOT NULL,
 destination_id TEXT NOT NULL REFERENCES traderlink_community_discord_destinations(destination_id),
 publisher_user_id TEXT REFERENCES platform_users(user_id) ON DELETE SET NULL,
 initiating_publisher_user_id TEXT REFERENCES platform_users(user_id) ON DELETE SET NULL,
 action_kind TEXT NOT NULL CHECK(action_kind IN ('edit','announce')),target_message_id TEXT NOT NULL,
 payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','confirmed','rejected','uncertain')),
 attempt_count INTEGER NOT NULL DEFAULT 0,next_attempt_at_utc TEXT,discord_message_id TEXT,last_error TEXT,
 requested_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL) STRICT;`,
 `CREATE TABLE traderlink_community_publication_action_attempts (
 attempt_id TEXT PRIMARY KEY,action_id TEXT NOT NULL REFERENCES traderlink_community_publication_actions(action_id) ON DELETE CASCADE,
 attempt_number INTEGER NOT NULL,outcome TEXT NOT NULL CHECK(outcome IN ('sending','pending','confirmed','rejected','uncertain')),
 discord_message_id TEXT,error_message TEXT,occurred_at_utc TEXT NOT NULL) STRICT;`,
 `CREATE INDEX community_publication_action_attempt_history ON traderlink_community_publication_action_attempts(action_id,occurred_at_utc);`,
 `CREATE INDEX community_publication_action_pending ON traderlink_community_publication_actions(status,next_attempt_at_utc,requested_at_utc);`,
]);
export const platformCommunityPublicationRevisionActionsMigration:PlatformMigration=Object.freeze({moduleNamespace:"community",migrationId:"0170_platform_community_publication_revision_actions",executionOrder:183,statements:communityPublicationRevisionActionStatements});
