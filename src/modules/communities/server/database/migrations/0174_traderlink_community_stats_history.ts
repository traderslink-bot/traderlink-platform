import type {PlatformMigration} from "@/src/modules/platform/server/database/platform-migration-contract";
import {communityStatsHistoryStatements} from "../../stats/community-stats-history-schema";

/** Coordinator reservation: Stats staging line; registration is a separate integration step. */
export const traderLinkCommunityStatsHistoryMigration:PlatformMigration=Object.freeze({
  moduleNamespace:"community",migrationId:"0174_traderlink_community_stats_history",executionOrder:187,
  statements:communityStatsHistoryStatements,
});
