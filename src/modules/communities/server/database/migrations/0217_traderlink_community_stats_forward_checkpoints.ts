import type { PlatformMigration } from "../../../../platform/server/database/platform-migration-contract";
import { communityStatsForwardStatements } from "../../stats/community-stats-forward-schema";

/** Coordinator-reserved staging source slot. Importing performs no migration. */
export const traderLinkCommunityStatsForwardCheckpointsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0217_traderlink_community_stats_forward_checkpoints",
  executionOrder: 292,
  statements: communityStatsForwardStatements,
});
