import type { PlatformMigration } from "../platform-migration-contract";

export const platformPremiumSwingIdeaVisitEventsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0139_platform_premium_swing_idea_visit_events",
  executionOrder: 139,
  statements: Object.freeze([`CREATE TABLE platform_premium_swing_idea_visit_events (
    event_id TEXT PRIMARY KEY CHECK(length(event_id) = 36),
    idea_id TEXT NOT NULL CHECK(length(idea_id) = 32),
    user_id TEXT,
    visited_at_ms INTEGER NOT NULL CHECK(visited_at_ms > 0),
    access_outcome TEXT NOT NULL CHECK(access_outcome IN ('full','locked')),
    content_revision TEXT NOT NULL CHECK(length(content_revision) BETWEEN 1 AND 64),
    FOREIGN KEY(user_id) REFERENCES platform_users(user_id) ON DELETE SET NULL ON UPDATE RESTRICT
  ) STRICT;
  CREATE INDEX platform_swing_visits_idea_time ON platform_premium_swing_idea_visit_events(idea_id,visited_at_ms DESC);
  CREATE INDEX platform_swing_visits_user_time ON platform_premium_swing_idea_visit_events(user_id,visited_at_ms DESC);`]),
});
