import {communityStatsBotMessageStatements} from "./community-stats-message-populations";
/** Local candidate. Coordinator assigns the migration identity at integration; never execute DDL from requests. */
export const communityStatsAttributionStatements=Object.freeze([
  ...communityStatsBotMessageStatements,
  `CREATE TABLE community_stats_traffic_sources (
    community_id TEXT NOT NULL,event_id TEXT NOT NULL,category TEXT NOT NULL,source TEXT NOT NULL,
    referrer_host TEXT,campaign_source TEXT,campaign_medium TEXT,campaign_name TEXT,
    PRIMARY KEY(community_id,event_id),
    FOREIGN KEY(community_id,event_id) REFERENCES community_stats_events(community_id,event_id) ON DELETE CASCADE
  ) STRICT, WITHOUT ROWID;`,
  `CREATE TABLE community_stats_invites (
    community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),invite_hash TEXT NOT NULL,
    channel_id TEXT,creator_id TEXT,creator_name TEXT,uses INTEGER CHECK(uses IS NULL OR uses>=0),
    max_uses INTEGER,created_at_utc TEXT,expires_at_utc TEXT,temporary INTEGER NOT NULL DEFAULT 0,
    vanity INTEGER NOT NULL DEFAULT 0,active INTEGER NOT NULL DEFAULT 1,checked_at_utc TEXT NOT NULL,
    PRIMARY KEY(community_id,invite_hash)
  ) STRICT, WITHOUT ROWID;`,
  `CREATE TABLE community_stats_invite_usage (
    community_id TEXT NOT NULL,invite_hash TEXT NOT NULL,date_utc TEXT NOT NULL,uses INTEGER CHECK(uses IS NULL OR uses>=0),checked_at_utc TEXT NOT NULL,
    PRIMARY KEY(community_id,invite_hash,date_utc),
    FOREIGN KEY(community_id,invite_hash) REFERENCES community_stats_invites(community_id,invite_hash) ON DELETE CASCADE
  ) STRICT, WITHOUT ROWID;`,
  `CREATE TABLE community_stats_invite_joins (
    community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),discord_user_id TEXT NOT NULL,
    joined_at_utc TEXT NOT NULL,invite_hash TEXT,method TEXT NOT NULL CHECK(method IN('unknown','estimated')),
    PRIMARY KEY(community_id,discord_user_id,joined_at_utc)
  ) STRICT, WITHOUT ROWID;`,
  `INSERT INTO community_stats_invite_joins(community_id,discord_user_id,joined_at_utc,invite_hash,method)
    SELECT DISTINCT m.community_id,m.discord_user_id,coalesce(m.joined_at_utc,CASE WHEN m.join_kind='snapshot' AND m.until_utc IS NULL THEN n.joined_at_utc END),NULL,'unknown'
    FROM community_stats_memberships m JOIN community_stats_members n ON n.community_id=m.community_id AND n.discord_user_id=m.discord_user_id
    WHERE coalesce(m.joined_at_utc,CASE WHEN m.join_kind='snapshot' AND m.until_utc IS NULL THEN n.joined_at_utc END) IS NOT NULL AND n.is_bot=0;`,
  `CREATE INDEX community_stats_invite_join_date ON community_stats_invite_joins(community_id,joined_at_utc);`,
  `CREATE TABLE community_stats_attribution_state (
    community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),source TEXT NOT NULL,
    status TEXT NOT NULL,checked_at_utc TEXT NOT NULL,PRIMARY KEY(community_id,source)
  ) STRICT, WITHOUT ROWID;`,
]);
