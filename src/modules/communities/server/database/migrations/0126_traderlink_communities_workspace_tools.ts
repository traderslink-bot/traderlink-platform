import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const uuid = (column: string) => `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column},9,1)='-' AND substr(${column},14,1)='-' AND substr(${column},19,1)='-' AND substr(${column},24,1)='-')`;
const utc = (column: string) => `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;

export const traderLinkCommunitiesWorkspaceToolsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0126_traderlink_communities_workspace_tools",
  executionOrder: 126,
  statements: Object.freeze([`ALTER TABLE traderlink_community_settings
  ADD COLUMN personal_alert_templates_enabled INTEGER NOT NULL DEFAULT 1
  CHECK(personal_alert_templates_enabled IN (0,1));

ALTER TABLE traderlink_community_alerts
  ADD COLUMN publishing_mode TEXT NOT NULL DEFAULT 'tracked_page'
  CHECK(publishing_mode IN ('tracked_page','discord_post'));

ALTER TABLE traderlink_community_server_watchlists
  ADD COLUMN publishing_mode TEXT NOT NULL DEFAULT 'tracked_page'
  CHECK(publishing_mode IN ('tracked_page','discord_post'));

CREATE TABLE traderlink_community_alert_templates (
  template_id TEXT PRIMARY KEY ${uuid("template_id")},
  community_id TEXT NOT NULL ${uuid("community_id")},
  owner_user_id TEXT NOT NULL ${uuid("owner_user_id")},
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 100),
  scope TEXT NOT NULL CHECK(scope IN ('personal','community')),
  status TEXT NOT NULL CHECK(status IN ('active','archived')),
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  UNIQUE(community_id,owner_user_id,title COLLATE NOCASE),
  UNIQUE(template_id,community_id),
  FOREIGN KEY(community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
  FOREIGN KEY(owner_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_alert_template_fields (
  template_id TEXT NOT NULL ${uuid("template_id")},
  community_id TEXT NOT NULL ${uuid("community_id")},
  field_key TEXT NOT NULL CHECK(length(field_key) BETWEEN 1 AND 40 AND field_key NOT GLOB '*[^a-z0-9_]*'),
  label TEXT NOT NULL CHECK(length(trim(label)) BETWEEN 1 AND 80),
  field_type TEXT NOT NULL CHECK(field_type IN ('text','number','price','ticker','date','time','choice','notes')),
  required INTEGER NOT NULL CHECK(required IN (0,1)),
  placeholder TEXT NOT NULL DEFAULT '' CHECK(length(placeholder)<=120),
  ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 0 AND 49),
  PRIMARY KEY(template_id,field_key),
  UNIQUE(template_id,ordinal),
  FOREIGN KEY(template_id,community_id) REFERENCES traderlink_community_alert_templates(template_id,community_id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;

CREATE TABLE traderlink_community_alert_field_values (
  alert_id TEXT NOT NULL ${uuid("alert_id")},
  community_id TEXT NOT NULL ${uuid("community_id")},
  template_id TEXT NOT NULL ${uuid("template_id")},
  field_key TEXT NOT NULL,
  value TEXT NOT NULL CHECK(length(value)<=4000),
  ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 0 AND 49),
  PRIMARY KEY(alert_id,field_key),
  FOREIGN KEY(alert_id,community_id) REFERENCES traderlink_community_alerts(alert_id,community_id) ON DELETE CASCADE,
  FOREIGN KEY(template_id,field_key) REFERENCES traderlink_community_alert_template_fields(template_id,field_key) ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE TABLE traderlink_community_coaching_messages (
  message_id TEXT PRIMARY KEY ${uuid("message_id")},
  relationship_id TEXT NOT NULL ${uuid("relationship_id")},
  community_id TEXT NOT NULL ${uuid("community_id")},
  author_user_id TEXT NOT NULL ${uuid("author_user_id")},
  body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 8000),
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  edited_at_utc TEXT,
  FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id) ON DELETE RESTRICT,
  FOREIGN KEY(author_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_coaching_messages_thread
  ON traderlink_community_coaching_messages(relationship_id,created_at_utc);

CREATE TABLE traderlink_community_coaching_trade_reviews (
  review_id TEXT PRIMARY KEY ${uuid("review_id")},
  relationship_id TEXT NOT NULL ${uuid("relationship_id")},
  community_id TEXT NOT NULL ${uuid("community_id")},
  requested_by_user_id TEXT NOT NULL ${uuid("requested_by_user_id")},
  round_trip_id TEXT,
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 140),
  student_context TEXT NOT NULL DEFAULT '' CHECK(length(student_context)<=4000),
  coach_feedback TEXT NOT NULL DEFAULT '' CHECK(length(coach_feedback)<=8000),
  status TEXT NOT NULL CHECK(status IN ('requested','in_review','completed','cancelled')),
  requested_at_utc TEXT NOT NULL ${utc("requested_at_utc")},
  completed_at_utc TEXT,
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id) ON DELETE RESTRICT,
  FOREIGN KEY(requested_by_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_coaching_trade_reviews_relationship
  ON traderlink_community_coaching_trade_reviews(relationship_id,status,updated_at_utc DESC);`]),
});
