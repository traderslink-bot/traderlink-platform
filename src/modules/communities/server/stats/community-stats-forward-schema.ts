/** Registration is Coordinator/Core owned; importing never changes storage. */
export const communityStatsForwardStatements = Object.freeze([
  `CREATE TABLE community_stats_forward_checkpoints (
    community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),
    channel_id TEXT NOT NULL, parent_id TEXT, configuration_version INTEGER NOT NULL CHECK(configuration_version BETWEEN 0 AND 9007199254740991),
    committed_until_utc TEXT NOT NULL, scan_until_utc TEXT, before_message_id TEXT,
    retry_at_utc TEXT NOT NULL, updated_at_utc TEXT NOT NULL,
    CHECK(length(channel_id) BETWEEN 1 AND 20 AND channel_id NOT GLOB '*[^0-9]*' AND substr(channel_id,1,1)!='0' AND (length(channel_id)<20 OR channel_id<='18446744073709551615')),
    CHECK(parent_id IS NULL OR (length(parent_id) BETWEEN 1 AND 20 AND parent_id NOT GLOB '*[^0-9]*' AND substr(parent_id,1,1)!='0' AND (length(parent_id)<20 OR parent_id<='18446744073709551615'))),
    CHECK(before_message_id IS NULL OR (length(before_message_id) BETWEEN 1 AND 20 AND before_message_id NOT GLOB '*[^0-9]*' AND substr(before_message_id,1,1)!='0' AND (length(before_message_id)<20 OR before_message_id<='18446744073709551615'))),
    CHECK(length(committed_until_utc)=24 AND julianday(committed_until_utc) IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',committed_until_utc)=committed_until_utc),
    CHECK(scan_until_utc IS NULL OR (length(scan_until_utc)=24 AND julianday(scan_until_utc) IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',scan_until_utc)=scan_until_utc)),
    CHECK(length(retry_at_utc)=24 AND julianday(retry_at_utc) IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',retry_at_utc)=retry_at_utc),
    CHECK(length(updated_at_utc)=24 AND julianday(updated_at_utc) IS NOT NULL AND strftime('%Y-%m-%dT%H:%M:%fZ',updated_at_utc)=updated_at_utc),
    CHECK((scan_until_utc IS NULL AND before_message_id IS NULL) OR (scan_until_utc IS NOT NULL AND before_message_id IS NOT NULL)),
    CHECK(scan_until_utc IS NULL OR scan_until_utc>=committed_until_utc),
    PRIMARY KEY(community_id,channel_id)
  ) STRICT, WITHOUT ROWID;`,
]);
