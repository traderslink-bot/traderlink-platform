import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

export const traderLinkCommunitiesReviewWorkspaceMetadataMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0144_traderlink_communities_review_workspace_metadata",
  executionOrder: 144,
  statements: Object.freeze([
    `ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN workspace_kind TEXT
      CHECK(workspace_kind IS NULL OR workspace_kind IN ('trade','trading_day','performance','strategy','custom'));`,
    `ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN focus_areas_json TEXT NOT NULL DEFAULT '[]'
      CHECK(json_valid(focus_areas_json) AND json_type(focus_areas_json)='array');`,
    `ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN focus_feedback_json TEXT NOT NULL DEFAULT '{}'
      CHECK(json_valid(focus_feedback_json) AND json_type(focus_feedback_json)='object');`,
    `ALTER TABLE traderlink_community_coaching_plan_items ADD COLUMN focus_areas_json TEXT NOT NULL DEFAULT '[]'
      CHECK(json_valid(focus_areas_json) AND json_type(focus_areas_json)='array');`,
  ]),
});
