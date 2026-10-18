import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

// Source-only addition. Reconcile 0171 / order 184 against the continuation
// lane's complete migration lineage before an owner-authorized application.
export const traderLinkCommunitySharedAlertsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0171_traderlink_community_shared_alerts",
  executionOrder: 184,
  statements: Object.freeze([`
CREATE TABLE community_shared_alert_settings (
  community_id TEXT PRIMARY KEY REFERENCES traderlink_communities(community_id),
  requests_open INTEGER NOT NULL DEFAULT 1 CHECK(requests_open IN (0,1)),
  updated_at_utc TEXT NOT NULL
) STRICT;
CREATE TABLE community_shared_alert_blocks (
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),
  blocked_community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),
  created_at_utc TEXT NOT NULL,
  PRIMARY KEY(community_id,blocked_community_id),
  CHECK(community_id <> blocked_community_id)
) STRICT, WITHOUT ROWID;
CREATE TABLE community_shared_alert_owner_checks (
  community_id TEXT PRIMARY KEY REFERENCES traderlink_communities(community_id),
  owner_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  discord_user_id TEXT NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('verified','changed','unavailable')),
  checked_at_utc TEXT NOT NULL
) STRICT;
CREATE TABLE community_shared_alert_requests (
  request_id TEXT PRIMARY KEY,
  source_community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),
  receiver_community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),
  initiator_community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),
  source_owner_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  receiver_owner_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  source_owner_discord_id TEXT NOT NULL,
  receiver_owner_discord_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','active','declined','withdrawn','ended')),
  terms_version INTEGER NOT NULL DEFAULT 1 CHECK(terms_version > 0),
  source_approved_version INTEGER,
  receiver_approved_version INTEGER,
  show_source_name INTEGER NOT NULL CHECK(show_source_name IN (0,1)),
  channel_id TEXT,
  channel_name TEXT,
  channel_revision INTEGER NOT NULL DEFAULT 1 CHECK(channel_revision > 0),
  source_paused INTEGER NOT NULL DEFAULT 0 CHECK(source_paused IN (0,1)),
  receiver_paused INTEGER NOT NULL DEFAULT 0 CHECK(receiver_paused IN (0,1)),
  activated_at_utc TEXT,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  CHECK(source_community_id <> receiver_community_id),
  CHECK(initiator_community_id IN (source_community_id,receiver_community_id)),
  CHECK(source_approved_version IS NULL OR source_approved_version BETWEEN 1 AND terms_version),
  CHECK(receiver_approved_version IS NULL OR receiver_approved_version BETWEEN 1 AND terms_version),
  CHECK(status <> 'active' OR (source_approved_version IS NOT NULL AND receiver_approved_version IS NOT NULL AND
    source_approved_version = terms_version AND receiver_approved_version = terms_version AND
    channel_id IS NOT NULL AND channel_name IS NOT NULL AND activated_at_utc IS NOT NULL))
) STRICT;
CREATE UNIQUE INDEX community_shared_alert_open_pair ON community_shared_alert_requests
  (source_community_id,receiver_community_id) WHERE status IN ('pending','active');
CREATE INDEX community_shared_alert_source ON community_shared_alert_requests(source_community_id,status);
CREATE INDEX community_shared_alert_receiver ON community_shared_alert_requests(receiver_community_id,status);
CREATE TABLE community_shared_alert_messages (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT NOT NULL UNIQUE,
  request_id TEXT NOT NULL REFERENCES community_shared_alert_requests(request_id),
  author_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  author_community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),
  author_name TEXT NOT NULL,
  body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 2000),
  created_at_utc TEXT NOT NULL
) STRICT;
CREATE INDEX community_shared_alert_message_thread ON community_shared_alert_messages(request_id,sequence);
CREATE TABLE community_shared_alert_read_positions (
  request_id TEXT NOT NULL REFERENCES community_shared_alert_requests(request_id),
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),
  last_read_sequence INTEGER NOT NULL CHECK(last_read_sequence >= 0),
  last_read_event_sequence INTEGER NOT NULL DEFAULT 0 CHECK(last_read_event_sequence >= 0),
  PRIMARY KEY(request_id,community_id)
) STRICT, WITHOUT ROWID;
CREATE TABLE community_shared_alert_events (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  request_id TEXT NOT NULL REFERENCES community_shared_alert_requests(request_id),
  actor_user_id TEXT REFERENCES platform_users(user_id),
  actor_community_id TEXT REFERENCES traderlink_communities(community_id),
  event_type TEXT NOT NULL,
  detail_json TEXT NOT NULL CHECK(json_valid(detail_json)),
  created_at_utc TEXT NOT NULL
) STRICT;
CREATE INDEX community_shared_alert_event_thread ON community_shared_alert_events(request_id,sequence);
CREATE TABLE community_alert_discord_authors (
  alert_id TEXT PRIMARY KEY REFERENCES traderlink_community_alerts(alert_id),
  discord_user_id TEXT,
  display_name TEXT,
  username TEXT,
  captured_at_utc TEXT NOT NULL
) STRICT;
CREATE TRIGGER community_alert_discord_authors_immutable_update
BEFORE UPDATE ON community_alert_discord_authors BEGIN SELECT RAISE(ABORT,'Alert author snapshots are immutable'); END;
CREATE TABLE community_shared_alert_deliveries (
  delivery_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES community_shared_alert_requests(request_id),
  alert_id TEXT NOT NULL REFERENCES traderlink_community_alerts(alert_id),
  event_key TEXT NOT NULL DEFAULT 'publication',
  kind TEXT NOT NULL DEFAULT 'publication' CHECK(kind IN ('publication','correction','withdrawal')),
  original_delivery_id TEXT REFERENCES community_shared_alert_deliveries(delivery_id),
  publisher_user_id TEXT REFERENCES platform_users(user_id),
  change_actor_user_id TEXT REFERENCES platform_users(user_id),
  source_destination_ids_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(source_destination_ids_json)),
  terms_version INTEGER NOT NULL,
  channel_revision INTEGER NOT NULL,
  channel_id TEXT NOT NULL,
  title TEXT NOT NULL,
  symbol TEXT,
  body TEXT NOT NULL,
  publishing_mode TEXT NOT NULL CHECK(publishing_mode IN ('tracked_page','discord_post')),
  source_name TEXT NOT NULL,
  show_source_name INTEGER NOT NULL CHECK(show_source_name IN (0,1)),
  status TEXT NOT NULL CHECK(status IN ('pending','sending','delivered','failed','cancelled','uncertain','rejected')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 5),
  retry_at_utc TEXT,
  last_error TEXT,
  discord_message_id TEXT,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  CHECK((kind='publication' AND original_delivery_id IS NULL AND event_key='publication') OR
    (kind<>'publication' AND original_delivery_id IS NOT NULL AND event_key<>'publication')),
  UNIQUE(request_id,alert_id,channel_id,event_key)
) STRICT;
CREATE INDEX community_shared_alert_delivery_queue ON community_shared_alert_deliveries(status,retry_at_utc,created_at_utc);
CREATE TABLE community_shared_alert_rate_limits (
  scope TEXT NOT NULL CHECK(scope IN ('global','channel')),
  scope_id TEXT NOT NULL,
  retry_at_utc TEXT NOT NULL,
  PRIMARY KEY(scope,scope_id)
) STRICT, WITHOUT ROWID;
`]),
});
