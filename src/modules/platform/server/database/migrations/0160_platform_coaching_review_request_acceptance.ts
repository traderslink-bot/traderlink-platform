import type { PlatformMigration } from "../platform-migration-contract";

// Coordinator-reserved successor of 0159. Existing work remains accepted.
export const platformCoachingReviewRequestAcceptanceMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0160_platform_coaching_review_request_acceptance",
  executionOrder: 173,
  statements: Object.freeze([
    `ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN acceptance_state TEXT NOT NULL DEFAULT 'accepted' CHECK(acceptance_state IN ('pending','accepted'));`,
    `ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN accepted_at_utc TEXT;`,
    `ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN accepted_by_user_id TEXT REFERENCES platform_users(user_id);`,
    `ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN accepted_scope TEXT NOT NULL DEFAULT '' CHECK(length(accepted_scope)<=4000);`,
  ]),
});
