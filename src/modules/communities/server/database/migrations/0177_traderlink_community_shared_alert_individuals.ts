import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

// Coordinator reserved 0177/order190 after exact 0176/order189 for source integration.
// Historical 0171 remains byte-for-byte intact; hosted application is not authorized.
// No legacy community-wide agreement becomes an individual publishing grant.
export const traderLinkCommunitySharedAlertIndividualsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0177_traderlink_community_shared_alert_individuals",
  executionOrder: 190,
  requiresForeignKeysDisabled: true,
  statements: Object.freeze([`
CREATE TABLE community_alert_publisher_permissions (
  community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id),
  user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
  assigned_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  updated_at_utc TEXT NOT NULL,
  PRIMARY KEY(community_id,user_id)
) STRICT, WITHOUT ROWID;
CREATE TABLE community_shared_alert_routes (
  request_id TEXT NOT NULL REFERENCES community_shared_alert_requests(request_id),
  author_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  source_offered INTEGER NOT NULL DEFAULT 1 CHECK(source_offered IN (0,1)),
  receiver_selected INTEGER NOT NULL DEFAULT 0 CHECK(receiver_selected IN (0,1)),
  channel_id TEXT,
  channel_name TEXT,
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),
  require_approval INTEGER NOT NULL DEFAULT 0 CHECK(require_approval IN (0,1)),
  receiver_paused INTEGER NOT NULL DEFAULT 0 CHECK(receiver_paused IN (0,1)),
  selected_at_utc TEXT,
  updated_at_utc TEXT NOT NULL,
  PRIMARY KEY(request_id,author_user_id),
  CHECK(receiver_selected=0 OR (source_offered=1 AND channel_id IS NOT NULL AND channel_name IS NOT NULL AND selected_at_utc IS NOT NULL))
) STRICT, WITHOUT ROWID;
CREATE TABLE community_shared_alert_requests_individual_next (
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
    activated_at_utc IS NOT NULL))
) STRICT;
INSERT INTO community_shared_alert_requests_individual_next(request_id,source_community_id,receiver_community_id,initiator_community_id,source_owner_user_id,receiver_owner_user_id,source_owner_discord_id,receiver_owner_discord_id,status,terms_version,source_approved_version,receiver_approved_version,show_source_name,source_paused,receiver_paused,activated_at_utc,created_at_utc,updated_at_utc)
SELECT request_id,source_community_id,receiver_community_id,initiator_community_id,source_owner_user_id,receiver_owner_user_id,source_owner_discord_id,receiver_owner_discord_id,
  CASE WHEN status='active' THEN 'pending' ELSE status END,
  CASE WHEN status IN ('pending','active') THEN terms_version+1 ELSE terms_version END,
  CASE WHEN status IN ('pending','active') THEN NULL ELSE source_approved_version END,
  CASE WHEN status IN ('pending','active') THEN NULL ELSE receiver_approved_version END,
  show_source_name,source_paused,receiver_paused,
  CASE WHEN status IN ('pending','active') THEN NULL ELSE activated_at_utc END,created_at_utc,updated_at_utc
FROM community_shared_alert_requests;
DROP TABLE community_shared_alert_requests;
ALTER TABLE community_shared_alert_requests_individual_next RENAME TO community_shared_alert_requests;
CREATE UNIQUE INDEX community_shared_alert_open_pair ON community_shared_alert_requests(source_community_id,receiver_community_id) WHERE status IN ('pending','active');
CREATE INDEX community_shared_alert_source ON community_shared_alert_requests(source_community_id,status);
CREATE INDEX community_shared_alert_receiver ON community_shared_alert_requests(receiver_community_id,status);
INSERT INTO community_shared_alert_routes(request_id,author_user_id,source_offered,receiver_selected,updated_at_utc)
SELECT d.request_id,a.author_user_id,0,0,max(d.updated_at_utc)
FROM community_shared_alert_deliveries d JOIN traderlink_community_alerts a ON a.alert_id=d.alert_id
GROUP BY d.request_id,a.author_user_id;
CREATE TABLE community_shared_alert_deliveries_individual_next (
  delivery_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES community_shared_alert_requests(request_id),
  alert_id TEXT NOT NULL REFERENCES traderlink_community_alerts(alert_id),
  event_key TEXT NOT NULL DEFAULT 'publication',
  kind TEXT NOT NULL DEFAULT 'publication' CHECK(kind IN ('publication','correction','withdrawal')),
  original_delivery_id TEXT REFERENCES community_shared_alert_deliveries(delivery_id),
  publisher_user_id TEXT REFERENCES platform_users(user_id),
  author_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  change_actor_user_id TEXT REFERENCES platform_users(user_id),
  source_destination_ids_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(source_destination_ids_json)),
  terms_version INTEGER NOT NULL,
  channel_revision INTEGER NOT NULL,
  content_revision INTEGER NOT NULL DEFAULT 1 CHECK(content_revision>0),
  requires_approval INTEGER NOT NULL CHECK(requires_approval IN (0,1)),
  approved_content_revision INTEGER,
  approved_by_user_id TEXT REFERENCES platform_users(user_id),
  reviewed_at_utc TEXT,
  channel_id TEXT NOT NULL,
  title TEXT NOT NULL,
  symbol TEXT,
  body TEXT NOT NULL,
  publishing_mode TEXT NOT NULL CHECK(publishing_mode IN ('tracked_page','discord_post')),
  source_name TEXT NOT NULL,
  show_source_name INTEGER NOT NULL CHECK(show_source_name IN (0,1)),
  status TEXT NOT NULL CHECK(status IN ('awaiting_approval','pending','sending','delivered','failed','cancelled','uncertain','rejected')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 5),
  retry_at_utc TEXT,
  last_error TEXT,
  discord_message_id TEXT,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  CHECK((kind='publication' AND original_delivery_id IS NULL AND event_key='publication') OR
    (kind<>'publication' AND original_delivery_id IS NOT NULL AND event_key<>'publication')),
  FOREIGN KEY(request_id,author_user_id) REFERENCES community_shared_alert_routes(request_id,author_user_id),
  CHECK(approved_content_revision IS NULL OR approved_content_revision=content_revision),
  CHECK(requires_approval=0 OR status NOT IN ('pending','sending','delivered') OR
    (approved_content_revision IS NOT NULL AND approved_content_revision=content_revision AND approved_by_user_id IS NOT NULL AND reviewed_at_utc IS NOT NULL)),
  UNIQUE(request_id,alert_id,channel_id,event_key)
) STRICT;
INSERT INTO community_shared_alert_deliveries_individual_next(delivery_id,request_id,alert_id,event_key,kind,original_delivery_id,publisher_user_id,author_user_id,change_actor_user_id,source_destination_ids_json,terms_version,channel_revision,content_revision,requires_approval,channel_id,title,symbol,body,publishing_mode,source_name,show_source_name,status,attempt_count,retry_at_utc,last_error,discord_message_id,created_at_utc,updated_at_utc)
SELECT d.delivery_id,d.request_id,d.alert_id,d.event_key,d.kind,d.original_delivery_id,d.publisher_user_id,a.author_user_id,d.change_actor_user_id,d.source_destination_ids_json,d.terms_version,d.channel_revision,1,0,d.channel_id,d.title,d.symbol,d.body,d.publishing_mode,d.source_name,d.show_source_name,
  CASE WHEN d.status IN ('pending','failed') THEN 'cancelled' WHEN d.status='sending' THEN 'uncertain' ELSE d.status END,d.attempt_count,NULL,
  CASE WHEN d.status IN ('pending','failed') THEN 'Previous sharing settings replaced; owner agreement is required.' WHEN d.status='sending' THEN 'Previous send was unconfirmed; no automatic resend.' ELSE d.last_error END,
  d.discord_message_id,d.created_at_utc,d.updated_at_utc
FROM community_shared_alert_deliveries d JOIN traderlink_community_alerts a ON a.alert_id=d.alert_id;
DROP TABLE community_shared_alert_deliveries;
ALTER TABLE community_shared_alert_deliveries_individual_next RENAME TO community_shared_alert_deliveries;
CREATE INDEX community_shared_alert_delivery_queue ON community_shared_alert_deliveries(status,retry_at_utc,created_at_utc);
CREATE TABLE community_shared_alert_delivery_parts (
  delivery_id TEXT NOT NULL REFERENCES community_shared_alert_deliveries(delivery_id),
  content_revision INTEGER NOT NULL CHECK(content_revision>0),
  part_number INTEGER NOT NULL CHECK(part_number BETWEEN 1 AND 32),
  total_parts INTEGER NOT NULL CHECK(total_parts BETWEEN 1 AND 32 AND part_number<=total_parts),
  content TEXT NOT NULL CHECK(length(content) BETWEEN 1 AND 2000),
  nonce TEXT NOT NULL UNIQUE CHECK(length(nonce) BETWEEN 1 AND 25),
  status TEXT NOT NULL CHECK(status IN ('pending','sending','delivered','failed','cancelled','uncertain')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 5),
  retry_at_utc TEXT,
  last_error TEXT,
  discord_message_id TEXT,
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  PRIMARY KEY(delivery_id,content_revision,part_number),
  CHECK(status<>'delivered' OR discord_message_id IS NOT NULL)
) STRICT, WITHOUT ROWID;
CREATE INDEX community_shared_alert_parts_queue ON community_shared_alert_delivery_parts(status,updated_at_utc);
CREATE TRIGGER community_shared_alert_parts_payload_immutable
BEFORE UPDATE OF delivery_id,content_revision,part_number,total_parts,content,nonce ON community_shared_alert_delivery_parts
BEGIN SELECT RAISE(ABORT,'Alert message parts are immutable'); END;
`]),
});
