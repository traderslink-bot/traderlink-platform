import { notFound } from "next/navigation";
import { DashboardPage, DashboardSecondaryAction } from "@/app/dashboard-template";
import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { savedCustomScansDirectory } from "@/src/modules/scanner/custom/saved";
import { readSharedScan, sharedScanView } from "@/src/modules/scanner/custom/server/shared-scan-store";
import { SharedScanResults } from "./shared-scan-results";

export const dynamic = "force-dynamic";

export default async function SharedScanPage({ params }: { params: Promise<{ id: string }> }) {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasScannerDashboardAccess(identity)) notFound();
  const { id } = await params;
  const share = readSharedScan(savedCustomScansDirectory(), id);
  if (!share) notFound();

  return <DashboardPage>
    <DashboardSecondaryAction href="/scanner">Scanner</DashboardSecondaryAction>
    <SharedScanResults key={id} share={sharedScanView(share)} />
  </DashboardPage>;
}
