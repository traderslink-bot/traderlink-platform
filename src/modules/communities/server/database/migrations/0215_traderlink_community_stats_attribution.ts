import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";
import { communityStatsAttributionStatements } from "../../stats/community-stats-attribution-schema";

/** Combined append-only candidate; includes bot populations and reaction refresh once. */
export const traderLinkCommunityStatsAttributionMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0215_traderlink_community_stats_attribution",
  executionOrder: 290,
  statements: communityStatsAttributionStatements,
});
