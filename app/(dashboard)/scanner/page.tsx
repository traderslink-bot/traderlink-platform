import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasLegacyScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { ScannerClient } from "./scanner-client";

export const metadata: Metadata = {
  title: "Scanner | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScannerPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasLegacyScannerDashboardAccess(identity)) notFound();

  return <ScannerClient />;
}
