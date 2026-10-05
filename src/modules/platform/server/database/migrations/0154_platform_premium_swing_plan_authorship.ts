import type { PlatformMigration } from "../platform-migration-contract";

export const platformPremiumSwingPlanAuthorshipMigration: PlatformMigration = Object.freeze({
  moduleNamespace:"platform",migrationId:"0154_platform_premium_swing_plan_authorship",executionOrder:154,
  statements:Object.freeze([
    `CREATE TABLE platform_swing_plans (
      idea_id TEXT PRIMARY KEY CHECK(length(idea_id)=32),
      slug TEXT NOT NULL UNIQUE CHECK(length(slug)=8),
      draft_json TEXT NOT NULL, draft_version INTEGER NOT NULL CHECK(draft_version>0),
      published_revision INTEGER, public_teaser_json TEXT,
      created_at_ms INTEGER NOT NULL, updated_at_ms INTEGER NOT NULL
    ) STRICT;`,
    `CREATE TABLE platform_swing_plan_versions (
      idea_id TEXT NOT NULL REFERENCES platform_swing_plans(idea_id),
      version INTEGER NOT NULL, document_json TEXT NOT NULL,
      saved_at_ms INTEGER NOT NULL, actor_user_id TEXT,
      PRIMARY KEY(idea_id,version)
    ) STRICT;`,
    `CREATE TABLE platform_swing_plan_publications (
      publication_id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL REFERENCES platform_swing_plans(idea_id),
      version INTEGER NOT NULL, published_at_ms INTEGER NOT NULL,
      UNIQUE(idea_id,version),
      FOREIGN KEY(idea_id,version) REFERENCES platform_swing_plan_versions(idea_id,version)
    ) STRICT;`,
    `CREATE TABLE platform_swing_plan_deliveries (
      delivery_id TEXT PRIMARY KEY,
      idea_id TEXT NOT NULL REFERENCES platform_swing_plans(idea_id),
      publication_id TEXT NOT NULL REFERENCES platform_swing_plan_publications(publication_id),
      channel_kind TEXT NOT NULL CHECK(channel_kind IN ('premium','free')),
      content_json TEXT NOT NULL,
      state TEXT NOT NULL CHECK(state IN ('pending','sending','sent','failed','uncertain')),
      receipt_id TEXT, status_message TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL, updated_at_ms INTEGER NOT NULL,
      UNIQUE(publication_id,channel_kind)
    ) STRICT;`,
  ]),
});
