import "server-only";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { evaluateMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";

export function readWatchlistFeatureAccess(userId: string) {
  return withReadonlyPlatformDatabase({}, database => ({
    tickerDetails: evaluateMembershipFeature(database, userId, "watchlist.ticker_details").allowed,
    tradeAnalysis: evaluateMembershipFeature(database, userId, "watchlist.trade_analysis").allowed,
  }));
}
