import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Stack from "@mui/material/Stack";
import { DashboardPage, DashboardSecondaryAction } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { LiveScreenersClient } from "../../screeners/live-screeners-client";

export const metadata: Metadata = { title: "Screeners Admin | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScreenersAdminPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasWatchlistDashboardNavigationAccess(identity)) notFound();
  return <DashboardPage><Stack direction="row" sx={{justifyContent:"flex-end"}}><DashboardSecondaryAction href="/admin/screeners/audit">Scanner audit</DashboardSecondaryAction></Stack><LiveScreenersClient admin /></DashboardPage>;
}
