import "server-only";

import { PlatformOperatorRepository } from "@/src/modules/platform/server/administration/platform-operator-repository";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { hasMarketToolDashboardAdmission, readMarketToolMembershipAccess } from "@/src/modules/platform/server/membership/membership-market-tool-access";
import { hasPlatformMembershipFeature } from "@/src/modules/platform/server/membership/platform-membership-access";
import { stockScreenersEnabled } from "@/src/modules/stock-screeners/service";
import { hasMarketToolsDashboardReadAccess, hasStockScreenersDashboardAccess, isTradingWorkspaceReviewAccount } from "./market-tools-dashboard-access";

const chartsKey = "charts.access";

export function hasChartsDashboardAccess(identity: TraderLinkPlatformRequestIdentity): boolean {
  return isTradingWorkspaceReviewAccount(identity);
}

function hasChartMembershipDataAccess(identity: TraderLinkPlatformRequestIdentity): boolean {
  if (identity.mode === "local_development") return true;
  const userId = identity.scope.userId;
  return withReadonlyPlatformDatabase({}, database => {
    if (new PlatformOperatorRepository(database).findActive()?.userId === userId) return true;
    return readMarketToolMembershipAccess(database, userId, [
      {
        key: chartsKey,
        existingAccess: false,
        memberReleaseReady: true,
        prePaywallAccess: hasMarketToolDashboardAdmission(database, identity),
      },
    ]).get(chartsKey) === true;
  });
}

/** Only the settings and market data used by actual embedded chart consumers. */
export function hasSharedChartDataAccess(identity: TraderLinkPlatformRequestIdentity): boolean {
  if (hasChartsDashboardAccess(identity) || hasMarketToolsDashboardReadAccess(identity) || hasChartMembershipDataAccess(identity)) return true;
  if (stockScreenersEnabled(identity.mode) && hasStockScreenersDashboardAccess(identity)) return true;
  // The Trade Analyzer drawer lives inside an account-scoped Journal session.
  // A policy in off or shadow mode does not confer shared market data access.
  const { activeAccountId, userId } = identity.scope;
  return Boolean(activeAccountId && withReadonlyPlatformDatabase({}, database =>
    hasPlatformMembershipFeature(database, userId, "journal.access")));
}
