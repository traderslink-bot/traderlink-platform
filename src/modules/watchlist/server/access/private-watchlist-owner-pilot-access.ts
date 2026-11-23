import "server-only";

import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { hasWatchlistDashboardNavigationAccess } from "./watchlist-dashboard-navigation-access";

/** Authenticates first, then applies the temporary Private Watchlist pilot gate. */
export async function readPrivateWatchlistPilotPageIdentity(): Promise<TraderLinkPlatformRequestIdentity | null> {
  const identity = await requireTraderLinkPlatformPageIdentity();
  return hasWatchlistDashboardNavigationAccess(identity) ? identity : null;
}
