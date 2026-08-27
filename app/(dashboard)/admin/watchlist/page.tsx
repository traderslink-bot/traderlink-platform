import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DashboardPage } from "@/app/dashboard-template";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { readWatchlistUsageAdminSnapshot } from "@/src/modules/watchlist/server/watchlist-usage-service";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { WatchlistRuntimeAdminClient } from "./watchlist-runtime-admin-client";

export const metadata: Metadata = {
  description: "Manage the private TradersLink Watchlist runtime.",
  title: "Watchlist Admin | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WatchlistRuntimeAdminPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasWatchlistDashboardNavigationAccess(identity)) notFound();
  let usage = null;
  try {
    usage = readWatchlistUsageAdminSnapshot();
  } catch {
    usage = null;
  }
  return (
    <DashboardPage>
      <WatchlistRuntimeAdminClient usage={usage} />
    </DashboardPage>
  );
}
