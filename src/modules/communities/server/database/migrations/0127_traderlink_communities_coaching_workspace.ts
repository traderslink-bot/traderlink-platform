import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const uuid = (column: string) => `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column},9,1)='-' AND substr(${column},14,1)='-' AND substr(${column},19,1)='-' AND substr(${column},24,1)='-')`;
const utc = (column: string) => `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;

export const traderLinkCommunitiesCoachingWorkspaceMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0127_traderlink_communities_coaching_workspace",
  executionOrder: 127,
  statements: Object.freeze([`ALTER TABLE traderlink_community_coaching_relationships
  ADD COLUMN student_messaging_enabled INTEGER NOT NULL DEFAULT 0
  CHECK(student_messaging_enabled IN (0,1));

ALTER TABLE traderlink_community_coaching_relationships
  ADD COLUMN student_trade_reviews_enabled INTEGER NOT NULL DEFAULT 0
  CHECK(student_trade_reviews_enabled IN (0,1));

CREATE TABLE traderlink_community_coaching_tasks (
  task_id TEXT PRIMARY KEY ${uuid("task_id")},
  relationship_id TEXT NOT NULL ${uuid("relationship_id")},
  community_id TEXT NOT NULL ${uuid("community_id")},
  created_by_user_id TEXT NOT NULL ${uuid("created_by_user_id")},
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),
  due_at_utc TEXT,
  priority TEXT NOT NULL CHECK(priority IN ('normal','high')),
  status TEXT NOT NULL CHECK(status IN ('open','completed','cancelled')),
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  completed_at_utc TEXT,
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  UNIQUE(task_id,community_id),
  FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id) ON DELETE RESTRICT,
  FOREIGN KEY(created_by_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_coaching_tasks_work
  ON traderlink_community_coaching_tasks(community_id,status,due_at_utc);

CREATE TABLE traderlink_community_coaching_records (
  record_id TEXT PRIMARY KEY ${uuid("record_id")},
  relationship_id TEXT NOT NULL ${uuid("relationship_id")},
  community_id TEXT NOT NULL ${uuid("community_id")},
  author_user_id TEXT NOT NULL ${uuid("author_user_id")},
  record_type TEXT NOT NULL CHECK(record_type IN ('session','note')),
  visibility TEXT NOT NULL CHECK(visibility IN ('shared','coach_private')),
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),
  body TEXT NOT NULL DEFAULT '' CHECK(length(body)<=8000),
  occurred_at_utc TEXT NOT NULL ${utc("occurred_at_utc")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  UNIQUE(record_id,community_id),
  FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id) ON DELETE RESTRICT,
  FOREIGN KEY(author_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_coaching_records_history
  ON traderlink_community_coaching_records(relationship_id,occurred_at_utc DESC);`]),
});
