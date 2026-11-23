import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardPage } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasTradingWorkspaceDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { LiveScreenersClient } from "../screeners/workspace/live-screeners-client";

export const metadata: Metadata = { title: "Trading Workspace | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TradingWorkspacePage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasTradingWorkspaceDashboardAccess(identity)) notFound();
  return <DashboardPage><LiveScreenersClient /></DashboardPage>;
}
