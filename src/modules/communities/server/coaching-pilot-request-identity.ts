import "server-only";

import {
  requireTraderLinkPlatformBillingRequestIdentity,
  requireTraderLinkPlatformPageIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";

export function requireCoachingPilotRequestIdentity(
  headers: Headers,
): TraderLinkPlatformRequestIdentity {
  return requireCoachingPilotIdentity(requireTraderLinkPlatformBillingRequestIdentity(headers));
}

export async function requireCoachingPilotPageIdentity(): Promise<TraderLinkPlatformRequestIdentity> {
  return requireCoachingPilotIdentity(await requireTraderLinkPlatformPageIdentity());
}

export function requireCoachingPilotIdentity(
  identity: TraderLinkPlatformRequestIdentity,
): TraderLinkPlatformRequestIdentity {
  if (!hasWatchlistDashboardNavigationAccess(identity)) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  return identity;
}
