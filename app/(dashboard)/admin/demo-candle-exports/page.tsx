import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DashboardPage } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";

import { DemoCandleExportClient } from "./demo-candle-export-client";

export const metadata: Metadata = {
  description: "Export the approved TradersLink demo candle sessions.",
  title: "Demo Candle Exports | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DemoCandleExportsPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasWatchlistDashboardNavigationAccess(identity)) notFound();

  return (
    <DashboardPage>
      <DemoCandleExportClient />
    </DashboardPage>
  );
}
