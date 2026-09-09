import "server-only";

import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess, TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";

/** Require the two configured stable owner identities, including on local previews. */
export function hasOwnerMarketDataAccess(identity: TraderLinkPlatformRequestIdentity): boolean {
  const subjects = process.env[TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV]?.split(",").map((value) => value.trim()) ?? [];
  if (identity.mode === "local_development" || new Set(subjects).size !== 2 ||
    subjects.length !== 2 || subjects.some((value) => !/^[0-9]{1,32}$/u.test(value))) return false;
  return hasWatchlistDashboardNavigationAccess(identity);
}
