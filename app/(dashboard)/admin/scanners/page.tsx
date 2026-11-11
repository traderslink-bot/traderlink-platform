import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Stack from "@mui/material/Stack";
import { DashboardPage, DashboardSecondaryAction } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { ScannerAuditControls } from "./scanner-audit-controls";
import { LiveScreenersClient } from "../../screeners/live-screeners-client";

export const metadata: Metadata = { title: "Scanner Admin | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScannerAdminPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasWatchlistDashboardNavigationAccess(identity)) notFound();
  return <DashboardPage><Stack direction="row" sx={{justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:1}}><ScannerAuditControls/><DashboardSecondaryAction href="/admin/scanners/audit">Scanner audit</DashboardSecondaryAction></Stack><LiveScreenersClient admin /></DashboardPage>;
}
