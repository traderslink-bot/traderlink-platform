import "server-only";

import type Database from "better-sqlite3";

import { stockScreenersEnabled } from "@/src/modules/stock-screeners/service";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import type { PlatformHomePage } from "../../contracts/platform-home-page";
import {
  requireTraderLinkPlatformRequestIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "../authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "../database/platform-migration-contract";
import { hasJournalWorkspaceAccess, isMembershipAccessDenied } from "../membership/platform-membership-access";

function hasPlatformHomeDashboardAccess(
  identity: TraderLinkPlatformRequestIdentity,
  requestHeaders: Headers,
): boolean {
  if (identity.mode === "local_development") return true;
  try {
    return requireTraderLinkPlatformRequestIdentity(requestHeaders).scope.userId === identity.scope.userId;
  } catch (error) {
    if (
      isMembershipAccessDenied(error) ||
      (isTraderLinkPlatformError(error) && (
        error.code === "TRADERLINK_DASHBOARD_ACCESS_DENIED" ||
        error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED"
      ))
    ) return false;
    throw error;
  }
}

export function readPlatformHomeAccess(
  database: Database.Database,
  identity: TraderLinkPlatformRequestIdentity,
  requestHeaders: Headers,
) {
  const dashboard = hasPlatformHomeDashboardAccess(identity, requestHeaders);
  const homeTrial = hasWatchlistDashboardNavigationAccess(identity);
  const tradingTools = dashboard && homeTrial;
  const journal = identity.mode === "local_development" || hasJournalWorkspaceAccess(database, identity.scope.userId);
  const homePages: Record<PlatformHomePage, boolean> = {
    welcome: homeTrial,
    "trading-workspace": tradingTools,
    scanners: tradingTools,
    screeners: tradingTools && stockScreenersEnabled(identity.mode),
    "journal-workspace": journal && Boolean(identity.scope.activeAccountId),
  };

  return { dashboard, homePages, journal };
}
