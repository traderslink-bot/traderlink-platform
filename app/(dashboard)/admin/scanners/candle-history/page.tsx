import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardPage, DashboardSecondaryAction } from "@/app/dashboard-template";
import { hasCandleHistoryOwnerAccess } from "@/src/modules/market-data/server/candle-history-owner";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { CandleHistoryAdmin } from "./candle-history-admin";

export const metadata: Metadata = { title: "Candle History | TraderLink Platform" };
export const dynamic = "force-dynamic";

export default async function CandleHistoryAdminPage() {
  if (!hasCandleHistoryOwnerAccess(await requireTraderLinkPlatformPageIdentity())) notFound();
  return <DashboardPage>
    <DashboardSecondaryAction href="/admin/scanners">Scanner Admin</DashboardSecondaryAction>
    <CandleHistoryAdmin />
  </DashboardPage>;
}
