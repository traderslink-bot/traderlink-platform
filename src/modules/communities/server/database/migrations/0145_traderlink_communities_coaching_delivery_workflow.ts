import type {PlatformMigration} from "@/src/modules/platform/server/database/platform-migration-contract";

const uuid=(column:string)=>`CHECK (${column} IS NULL OR (length(${column})=36 AND ${column}=lower(${column}) AND substr(${column},9,1)='-' AND substr(${column},14,1)='-' AND substr(${column},15,1)='4' AND substr(${column},19,1)='-' AND substr(${column},24,1)='-'))`;
const utc=(column:string)=>`CHECK (${column} IS NULL OR (length(${column})=24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'))`;

// Additive only. Applied coaching records and Journal facts are never rewritten.
export const traderLinkCommunitiesCoachingDeliveryWorkflowMigration:PlatformMigration=Object.freeze({
  moduleNamespace:"community",
  migrationId:"0145_traderlink_communities_coaching_delivery_workflow",
  executionOrder:145,
  statements:Object.freeze([
    `ALTER TABLE traderlink_community_coaching_relationships ADD COLUMN archived_at_utc TEXT ${utc("archived_at_utc")};`,
    `ALTER TABLE traderlink_community_coaching_plans ADD COLUMN builder_config_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(builder_config_json) AND json_type(builder_config_json)='object');`,
    `ALTER TABLE traderlink_community_coaching_plans ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0);`,
    `CREATE TABLE traderlink_community_coaching_agreements(
      agreement_id TEXT PRIMARY KEY ${uuid("agreement_id")},community_id TEXT NOT NULL ${uuid("community_id")},relationship_id TEXT NOT NULL ${uuid("relationship_id")},
      revision INTEGER NOT NULL CHECK(revision>0),status TEXT NOT NULL CHECK(status IN ('proposed','accepted','superseded','withdrawn')),
      terms_json TEXT NOT NULL CHECK(length(terms_json)<=65536 AND json_valid(terms_json) AND json_type(terms_json)='object'),
      proposed_by_user_id TEXT NOT NULL ${uuid("proposed_by_user_id")},proposed_at_utc TEXT NOT NULL ${utc("proposed_at_utc")},accepted_at_utc TEXT ${utc("accepted_at_utc")},last_scheduled_at_utc TEXT ${utc("last_scheduled_at_utc")},
      UNIQUE(relationship_id,revision),UNIQUE(agreement_id,community_id),
      FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id),
      FOREIGN KEY(proposed_by_user_id) REFERENCES platform_users(user_id)
    ) STRICT;`,
    `CREATE UNIQUE INDEX traderlink_coaching_one_accepted_agreement ON traderlink_community_coaching_agreements(relationship_id) WHERE status='accepted';`,
    `CREATE UNIQUE INDEX traderlink_coaching_one_proposed_agreement ON traderlink_community_coaching_agreements(relationship_id) WHERE status='proposed';`,
    `CREATE TABLE traderlink_community_coaching_occurrences(
      occurrence_id TEXT PRIMARY KEY ${uuid("occurrence_id")},community_id TEXT NOT NULL ${uuid("community_id")},agreement_id TEXT NOT NULL ${uuid("agreement_id")},item_key TEXT NOT NULL,
      period_start TEXT NOT NULL,period_end TEXT NOT NULL,due_at_utc TEXT NOT NULL ${utc("due_at_utc")},
      work_type TEXT NOT NULL CHECK(work_type IN ('review','task','session')),work_id TEXT NOT NULL ${uuid("work_id")},
      created_at_utc TEXT NOT NULL ${utc("created_at_utc")},UNIQUE(agreement_id,item_key,period_start),
      FOREIGN KEY(agreement_id,community_id) REFERENCES traderlink_community_coaching_agreements(agreement_id,community_id)
    ) STRICT;`,
    `CREATE TABLE traderlink_community_coaching_access_state(
      relationship_id TEXT PRIMARY KEY ${uuid("relationship_id")},community_id TEXT NOT NULL ${uuid("community_id")},state TEXT NOT NULL CHECK(state IN ('active','paused')),
      changed_at_utc TEXT NOT NULL ${utc("changed_at_utc")},verified_at_utc TEXT NOT NULL ${utc("verified_at_utc")},
      FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id)
    ) STRICT;`,
    `CREATE TABLE traderlink_community_coaching_notices(
      notice_id TEXT PRIMARY KEY ${uuid("notice_id")},community_id TEXT NOT NULL ${uuid("community_id")},relationship_id TEXT NOT NULL ${uuid("relationship_id")},user_id TEXT NOT NULL ${uuid("user_id")},
      kind TEXT NOT NULL CHECK(kind IN ('access_paused','access_restored','agreement_proposed','agreement_accepted')),
      body TEXT NOT NULL,created_at_utc TEXT NOT NULL ${utc("created_at_utc")},read_at_utc TEXT ${utc("read_at_utc")},
      FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id),
      FOREIGN KEY(user_id) REFERENCES platform_users(user_id)
    ) STRICT;`,
    `CREATE INDEX traderlink_coaching_notices_user ON traderlink_community_coaching_notices(user_id,created_at_utc);`,
    `ALTER TABLE traderlink_community_coaching_sessions ADD COLUMN duration_minutes INTEGER CHECK(duration_minutes BETWEEN 1 AND 1440);`,
    `ALTER TABLE traderlink_community_coaching_sessions ADD COLUMN meeting_url TEXT NOT NULL DEFAULT '';`,
    `ALTER TABLE traderlink_community_coaching_sessions ADD COLUMN coach_private_notes TEXT NOT NULL DEFAULT '';`,
    `ALTER TABLE traderlink_community_coaching_sessions ADD COLUMN attendance TEXT NOT NULL DEFAULT 'not_recorded' CHECK(attendance IN ('not_recorded','attended','missed','excused'));`,
    `ALTER TABLE traderlink_community_coaching_teaching_items ADD COLUMN delivery_kind TEXT NOT NULL DEFAULT 'live' CHECK(delivery_kind IN ('live','recorded','resource'));`,
    `ALTER TABLE traderlink_community_coaching_teaching_items ADD COLUMN recording_url TEXT NOT NULL DEFAULT '';`,
    `ALTER TABLE traderlink_community_coaching_teaching_items ADD COLUMN available_at_utc TEXT ${utc("available_at_utc")};`,
    `ALTER TABLE traderlink_community_coaching_teaching_items ADD COLUMN due_at_utc TEXT ${utc("due_at_utc")};`,
  ]),
});
