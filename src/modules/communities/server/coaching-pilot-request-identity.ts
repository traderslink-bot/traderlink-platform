import "server-only";

import {
  requireTraderLinkPlatformBillingRequestIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";

export function requireCoachingPilotRequestIdentity(
  headers: Headers,
): TraderLinkPlatformRequestIdentity {
  const identity = requireTraderLinkPlatformBillingRequestIdentity(headers);
  if (!hasWatchlistDashboardNavigationAccess(identity)) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  return identity;
}
