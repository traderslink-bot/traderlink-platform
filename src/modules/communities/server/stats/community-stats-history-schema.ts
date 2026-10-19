/** Migration registration and numbering are Coordinator-owned. No import-time storage changes. */
export const communityStatsHistoryStatements = Object.freeze([
  `ALTER TABLE community_stats_events ADD COLUMN evidence TEXT NOT NULL DEFAULT 'live' CHECK(evidence IN('live','imported_message'));`,
  `CREATE INDEX community_stats_reply_target ON community_stats_events(community_id,reply_to_event_id);`,
  `CREATE TABLE community_stats_history_jobs (
    community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id), configuration_version INTEGER NOT NULL,
    channel_id TEXT NOT NULL, parent_id TEXT, kind TEXT NOT NULL CHECK(kind IN('messages','archived','active')),
    cursor TEXT, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','running','complete','blocked')),
    scanned INTEGER NOT NULL DEFAULT 0, recovered INTEGER NOT NULL DEFAULT 0,
    oldest_at_utc TEXT, snapshot_at_utc TEXT NOT NULL, checked_at_utc TEXT NOT NULL, retry_at_utc TEXT NOT NULL,
    reason TEXT, PRIMARY KEY(community_id,configuration_version,channel_id,kind)
  ) STRICT, WITHOUT ROWID;`,
  `CREATE TABLE community_stats_reaction_snapshots (
    community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id), channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL, message_at_utc TEXT NOT NULL, reactions INTEGER NOT NULL CHECK(reactions>=0),
    observed_at_utc TEXT NOT NULL, PRIMARY KEY(community_id,message_id)
  ) STRICT, WITHOUT ROWID;`,
  `CREATE INDEX community_stats_reaction_channel ON community_stats_reaction_snapshots(community_id,channel_id,message_at_utc);`,
  `CREATE TABLE community_stats_history_exclusions (
    community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id), identity_hash TEXT NOT NULL,
    erased_at_utc TEXT NOT NULL, PRIMARY KEY(community_id,identity_hash)
  ) STRICT, WITHOUT ROWID;`,
]);
