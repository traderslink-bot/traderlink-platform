import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardPage } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import { ScannerAuditClient } from "../../screeners/audit/scanner-audit-client";

export const metadata:Metadata={title:"Scanner Audit | TraderLink Platform"};
export const dynamic="force-dynamic";export const revalidate=0;
export default async function ScannerAuditPage(){const identity=await requireTraderLinkPlatformPageIdentity();
  if(!hasWatchlistDashboardNavigationAccess(identity))notFound();return <DashboardPage><ScannerAuditClient/></DashboardPage>;}
