import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardPage } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { LiveScreenersClient } from "./live-screeners-client";

export const metadata: Metadata = { title: "Live Screeners | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LiveScreenersPage() {
  const identity=await requireTraderLinkPlatformPageIdentity();
  if(!hasWatchlistDashboardNavigationAccess(identity))notFound();
  return <DashboardPage><LiveScreenersClient /></DashboardPage>;
}
