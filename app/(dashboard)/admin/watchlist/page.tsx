import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DashboardPage } from "@/app/dashboard-template";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { readWatchlistVisibility } from "@/src/modules/watchlist/server/access/watchlist-visibility-service";
import { readWatchlistUsageAdminSnapshot } from "@/src/modules/watchlist/server/watchlist-usage-service";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { WatchlistRuntimeAdminClient } from "./watchlist-runtime-admin-client";
import { WatchlistUsageAdminPanel } from "./watchlist-usage-admin-panel";
import { WatchlistVisibilityAdminPanel } from "./watchlist-visibility-admin-panel";

export const metadata: Metadata = {
  description: "Manage the private TradersLink Watchlist runtime.",
  title: "Watchlist Admin | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WatchlistRuntimeAdminPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasWatchlistDashboardNavigationAccess(identity)) notFound();
  const visibility = readWatchlistVisibility();
  let usage = null;
  try {
    usage = readWatchlistUsageAdminSnapshot();
  } catch {
    usage = null;
  }
  return (
    <DashboardPage>
      <WatchlistVisibilityAdminPanel initialState={visibility} />
      <WatchlistRuntimeAdminClient usagePanel={<WatchlistUsageAdminPanel usage={usage} />} />
    </DashboardPage>
  );
}
