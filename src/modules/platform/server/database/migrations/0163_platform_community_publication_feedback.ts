import type { PlatformMigration } from "../platform-migration-contract";

// Additive candidate; coordinator must confirm ordering before integration.
export const platformCommunityPublicationFeedbackMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0163_platform_community_publication_feedback",
  executionOrder: 176,
  statements: Object.freeze([
    `ALTER TABLE traderlink_community_server_watchlists ADD COLUMN ticker_research_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(ticker_research_json));`,
    `CREATE TABLE traderlink_community_publication_receipts (
      community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE CASCADE,
      request_id TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      result_json TEXT NOT NULL CHECK(json_valid(result_json)),
      created_at_utc TEXT NOT NULL,
      PRIMARY KEY(community_id,user_id,request_id)
    ) STRICT, WITHOUT ROWID;`,
  ]),
});
