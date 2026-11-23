import type { Metadata } from "next";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { DashboardPage, DashboardPanel, DashboardSecondaryAction } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { LiveScreenersClient } from "../screeners/live-screeners-client";

export const metadata: Metadata = { title: "Scanners | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScannersPage({ searchParams }: {
  searchParams?: Promise<{ evidence?: string | string[]; view?: string | string[] }>;
} = {}) {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasScannerDashboardAccess(identity)) notFound();
  const params = await searchParams;
  const reference = params?.evidence;
  if (reference === undefined && params?.view !== "live") {
    const { ScannerBuilderPage } = await import("./scanner-builder-page");
    return <ScannerBuilderPage identity={identity} initialChoice="live:gainers"/>;
  }
  if (typeof reference === "string") {
    const { resolveScannerChartEvidence } = await import("@/src/modules/scanner/custom/server/scanner-chart-evidence");
    const result = await resolveScannerChartEvidence(identity, reference).catch(() => ({ state: "unavailable" as const }));
    if (result.state === "ready") {
      const { ScannerMatchChart } = await import("./scanner-match-chart");
      return <DashboardPage>
        <DashboardPanel title="Why it matched"
          action={<DashboardSecondaryAction href={`/charts?evidence=${encodeURIComponent(reference)}`}>Open Market Charts</DashboardSecondaryAction>}>
          <ScannerMatchChart key={reference} evidence={result.evidence} initialTimeframe={result.timeframe} />
        </DashboardPanel>
        <LiveScreenersClient verifiedLevels={process.env.TRADERLINK_SCANNER_VERIFIED_LEVELS === "1"} />
      </DashboardPage>;
    }
  }
  return <DashboardPage>
    {reference !== undefined && <Typography role="status" variant="body2">Matched chart evidence is unavailable.</Typography>}
    <DashboardSecondaryAction href="/scanners/build">Build a scan</DashboardSecondaryAction>
    <LiveScreenersClient verifiedLevels={process.env.TRADERLINK_SCANNER_VERIFIED_LEVELS === "1"} />
  </DashboardPage>;
}
