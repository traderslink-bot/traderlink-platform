import { notFound } from "next/navigation";
import { DashboardPage } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { MarketHaltDetectionControls } from "./market-halt-detection-controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Halt Detection | TradersLink" };
export default async function MarketHaltDetectionPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasWatchlistDashboardNavigationAccess(identity)) notFound();
  return <DashboardPage><MarketHaltDetectionControls /></DashboardPage>;
}
