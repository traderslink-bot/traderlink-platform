import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DashboardPage, DashboardPanel } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";

export const metadata: Metadata = { title: "Screeners | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScreenersPage() {
  const identity=await requireTraderLinkPlatformPageIdentity();
  if(!hasWatchlistDashboardNavigationAccess(identity))notFound();
  return <DashboardPage><Box sx={{'& [data-traderlink-platform-dashboard-card="panel"]':{borderRadius:0}}}><DashboardPanel title="Screeners"><Typography color="text.secondary">Filter-and-run screeners are coming soon.</Typography></DashboardPanel></Box></DashboardPage>;
}
