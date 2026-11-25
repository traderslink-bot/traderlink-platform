import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardPage } from "@/app/dashboard-template";
import { hasCandleHistoryOwnerAccess } from "@/src/modules/market-data/server/candle-history-owner";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { readWorkspaceMarketSettings } from "@/src/modules/market-data/server/workspace-market-settings-store";
import { TradingWorkspaceSettingsForm } from "./workspace-settings-form";

export const metadata: Metadata = { title: "Trading Workspace Admin | TraderLink Platform" };
export const dynamic = "force-dynamic";

export default async function TradingWorkspaceAdminPage() {
  if (!hasCandleHistoryOwnerAccess(await requireTraderLinkPlatformPageIdentity())) notFound();
  const settings = readWorkspaceMarketSettings();
  return <DashboardPage><TradingWorkspaceSettingsForm initialSettings={settings} /></DashboardPage>;
}
