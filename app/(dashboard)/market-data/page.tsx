import { notFound } from "next/navigation";
import { DashboardPage } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasOwnerMarketDataAccess } from "@/src/modules/level-analysis/server/owner-market-data-access";
import { OwnerMarketDataClient } from "./owner-market-data-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Market Data | TradersLink Platform" };
export default async function MarketDataPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasOwnerMarketDataAccess(identity)) notFound();
  return <DashboardPage><OwnerMarketDataClient /></DashboardPage>;
}
