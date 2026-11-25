import "server-only";

import type Database from "better-sqlite3";

import { stockScreenersEnabled } from "@/src/modules/stock-screeners/service";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { hasStockScreenersDashboardAccess, MARKET_TOOLS_ACCESS_MODE, readMarketToolsDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { hasChartMembershipDataAccess, hasChartsDashboardAccess } from "@/src/modules/market-data/server/chart-dashboard-access";
import { MARKET_TOOL_MEMBERSHIP_KEYS } from "../../contracts/membership-market-tools";
import type { PlatformHomePage } from "../../contracts/platform-home-page";
import {
  requireTraderLinkPlatformRequestIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "../authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "../database/platform-migration-contract";
import { hasJournalWorkspaceAccess, isMembershipAccessDenied } from "../membership/platform-membership-access";
import { readMarketToolMembershipAccess } from "../membership/membership-market-tool-access";

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
  const screenersEnabled = stockScreenersEnabled(identity.mode);
  // The request above already passed normal global dashboard admission.
  const homeTools = dashboard ? readMarketToolMembershipAccess(database, identity.scope.userId,
    Object.values(MARKET_TOOL_MEMBERSHIP_KEYS).map(key => ({
      key, existingAccess: false, memberReleaseReady: true,
      prePaywallAccess: key !== MARKET_TOOL_MEMBERSHIP_KEYS.stockScreeners || screenersEnabled,
    }))) : null;
  const hasHomeToolAccess = homeTools !== null && [...homeTools.values()].some(Boolean);
  const marketTools = dashboard ? readMarketToolsDashboardAccess(identity) : null;
  const privateReviewHome = process.env[MARKET_TOOLS_ACCESS_MODE] !== "standard" && marketTools?.scanner === true;
  const charts = dashboard && hasChartsDashboardAccess(identity);
  const screeners = dashboard && screenersEnabled && hasStockScreenersDashboardAccess(identity);
  const journal = identity.mode === "local_development" || hasJournalWorkspaceAccess(database, identity.scope.userId);
  const homePages: Record<PlatformHomePage, boolean> = {
    welcome: homeTrial || hasHomeToolAccess || charts || privateReviewHome ||
      (dashboard && hasChartMembershipDataAccess(identity)),
    "trading-workspace": marketTools?.tradingWorkspace ?? false,
    scanners: marketTools?.scanner ?? false,
    screeners,
    "journal-workspace": journal && Boolean(identity.scope.activeAccountId),
  };

  return { dashboard, homePages, journal, charts };
}
