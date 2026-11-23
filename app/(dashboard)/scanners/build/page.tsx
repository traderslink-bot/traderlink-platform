import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { ScannerBuilderPage } from "../scanner-builder-page";

export const metadata: Metadata = { title: "Scan builder | TraderLink Platform" };
export const dynamic = "force-dynamic";

export default async function ScanBuilderPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasScannerDashboardAccess(identity)) notFound();
  return <ScannerBuilderPage identity={identity}/>;
}
