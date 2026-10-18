import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

/** Reserved by Coordinator. Registration/application remain a separate release action. */
export const traderLinkCommunityStatsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community", migrationId: "0173_traderlink_community_stats", executionOrder: 186,
  statements: Object.freeze([`
CREATE TABLE community_stats_settings (
  community_id TEXT PRIMARY KEY REFERENCES traderlink_communities(community_id),
  discord_enabled INTEGER NOT NULL DEFAULT 0 CHECK(discord_enabled IN (0,1)),
  discord_configuration_version INTEGER NOT NULL DEFAULT 0 CHECK(discord_configuration_version>=0),
  revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
  channel_ids_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(channel_ids_json)),
  own_content_user_ids_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(own_content_user_ids_json)),
  export_user_ids_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(export_user_ids_json)),
  created_at_utc TEXT NOT NULL, updated_at_utc TEXT NOT NULL
) STRICT;
CREATE TABLE community_stats_members (
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id), discord_user_id TEXT NOT NULL,
  username TEXT NOT NULL CHECK(length(username) BETWEEN 1 AND 80), display_name TEXT, nickname TEXT,
  role_ids_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(role_ids_json)),
  is_bot INTEGER NOT NULL CHECK(is_bot IN (0,1)), active INTEGER NOT NULL CHECK(active IN (0,1)),
  joined_at_utc TEXT, first_observed_at_utc TEXT NOT NULL, last_observed_at_utc TEXT NOT NULL,
  invite_source TEXT NOT NULL DEFAULT 'unknown',
  PRIMARY KEY(community_id,discord_user_id)
) STRICT, WITHOUT ROWID;
CREATE TABLE community_stats_memberships (
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id), discord_user_id TEXT NOT NULL,
  from_utc TEXT NOT NULL, until_utc TEXT, joined_at_utc TEXT, join_kind TEXT NOT NULL CHECK(join_kind IN ('observed_join','rejoin','snapshot')),
  end_kind TEXT CHECK(end_kind IN ('observed_leave','snapshot_absent')),
  CHECK(until_utc IS NULL OR until_utc>=from_utc), PRIMARY KEY(community_id,discord_user_id,from_utc)
) STRICT, WITHOUT ROWID;
CREATE UNIQUE INDEX community_stats_one_membership ON community_stats_memberships(community_id,discord_user_id) WHERE until_utc IS NULL;
CREATE INDEX community_stats_membership_joins ON community_stats_memberships(community_id,join_kind,joined_at_utc);
CREATE TABLE community_stats_identity_links (
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id), platform_user_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL, from_utc TEXT NOT NULL, until_utc TEXT,
  CHECK(until_utc IS NULL OR until_utc>=from_utc), PRIMARY KEY(community_id,platform_user_id,discord_user_id,from_utc)
) STRICT, WITHOUT ROWID;
CREATE UNIQUE INDEX community_stats_one_platform_link ON community_stats_identity_links(community_id,platform_user_id) WHERE until_utc IS NULL;
CREATE UNIQUE INDEX community_stats_one_discord_link ON community_stats_identity_links(community_id,discord_user_id) WHERE until_utc IS NULL;
CREATE TABLE community_stats_events (
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id), event_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL, platform_user_id TEXT, surface TEXT NOT NULL CHECK(surface IN ('web','discord')),
  kind TEXT NOT NULL CHECK(kind IN ('web_visit','message','reaction_add','thread_reply','forum_post','voice_participation')),
  occurred_at_utc TEXT NOT NULL, received_at_utc TEXT NOT NULL,
  content_id TEXT, canonical_content_id TEXT, placement_id TEXT, content_type TEXT, title TEXT, path TEXT, author_user_id TEXT,
  username TEXT, display_name TEXT, nickname TEXT, nickname_state TEXT NOT NULL DEFAULT 'not_collected' CHECK(nickname_state IN('observed','not_collected')), identity_observed_at_utc TEXT,
  channel_id TEXT, duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK(duration_seconds>=0),
  reply_to_event_id TEXT, reply_delay_seconds INTEGER CHECK(reply_delay_seconds>=0), source_link_id TEXT,
  CHECK((surface='web' AND kind='web_visit' AND platform_user_id IS NOT NULL AND content_id IS NOT NULL) OR (surface='discord' AND kind!='web_visit')),
  PRIMARY KEY(community_id,event_id)
) STRICT, WITHOUT ROWID;
CREATE INDEX community_stats_event_time ON community_stats_events(community_id,surface,occurred_at_utc,event_id);
CREATE INDEX community_stats_person_time ON community_stats_events(community_id,discord_user_id,occurred_at_utc,event_id);
CREATE INDEX community_stats_content_time ON community_stats_events(community_id,content_id,occurred_at_utc,event_id);
CREATE TABLE community_stats_coverage (
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id), source TEXT NOT NULL CHECK(source IN ('web','discord','membership')),
  from_utc TEXT NOT NULL, until_utc TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('observed','gap')),
  reason TEXT, CHECK(until_utc>from_utc), PRIMARY KEY(community_id,source,from_utc)
) STRICT, WITHOUT ROWID;
CREATE INDEX community_stats_coverage_time ON community_stats_coverage(community_id,source,until_utc);
CREATE TABLE community_stats_source_state (
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id), source TEXT NOT NULL CHECK(source IN ('web','discord','membership')),
  status TEXT NOT NULL CHECK(status IN ('not_configured','connecting','collecting','gap','unavailable','disabled')),
  since_utc TEXT NOT NULL, checked_at_utc TEXT NOT NULL, last_event_at_utc TEXT, reason TEXT,
  PRIMARY KEY(community_id,source)
) STRICT, WITHOUT ROWID;
CREATE TABLE community_stats_channels (
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id), channel_id TEXT NOT NULL,
  name TEXT NOT NULL, channel_type INTEGER NOT NULL, public_readable INTEGER NOT NULL CHECK(public_readable IN (0,1)),
  last_observed_at_utc TEXT NOT NULL, PRIMARY KEY(community_id,channel_id)
) STRICT, WITHOUT ROWID;
CREATE TABLE community_stats_voice_state (
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id), discord_user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL, from_utc TEXT NOT NULL, last_confirmed_at_utc TEXT NOT NULL,
  PRIMARY KEY(community_id,discord_user_id)
) STRICT, WITHOUT ROWID;
CREATE TABLE community_stats_roles (
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),role_id TEXT NOT NULL,
  name TEXT NOT NULL,last_observed_at_utc TEXT NOT NULL,PRIMARY KEY(community_id,role_id)
) STRICT, WITHOUT ROWID;
CREATE TABLE community_stats_settings_audit (
  audit_id TEXT PRIMARY KEY,community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),
  actor_user_id TEXT NOT NULL,occurred_at_utc TEXT NOT NULL,settings_json TEXT NOT NULL CHECK(json_valid(settings_json))
) STRICT;
CREATE INDEX community_stats_settings_audit_time ON community_stats_settings_audit(community_id,occurred_at_utc);
`]),
});
