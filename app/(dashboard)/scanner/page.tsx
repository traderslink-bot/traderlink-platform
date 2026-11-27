import type { Metadata } from "next";
import type { ReactNode } from "react";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { DashboardPanel, DashboardSecondaryAction } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasLegacyScannerDashboardAccess, hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";

export const metadata: Metadata = { title: "Scanner | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ScannerPage({ searchParams }: {
  searchParams?: Promise<{ evidence?: string | string[]; view?: string | string[] }>;
}) {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const params = await searchParams;
  if (params?.view === "legacy") {
    if (!hasLegacyScannerDashboardAccess(identity)) notFound();
    const { ScannerClient } = await import("./scanner-client");
    return <ScannerClient />;
  }
  if (!hasScannerDashboardAccess(identity)) notFound();
  const { ScannerBuilderPage } = await import("../scanners/scanner-builder-page");
  const reference = params?.evidence;
  let evidence: ReactNode = reference === undefined
    ? null
    : <Typography role="status" variant="body2">Matched chart evidence is unavailable.</Typography>;
  if (typeof reference === "string") {
    const { resolveScannerChartEvidence } = await import("@/src/modules/scanner/custom/server/scanner-chart-evidence");
    const result = await resolveScannerChartEvidence(identity, reference).catch(() => ({ state: "unavailable" as const }));
    if (result.state === "ready") {
      const { ScannerMatchChart } = await import("../scanners/scanner-match-chart");
      evidence = <DashboardPanel title="Why it matched"
        action={<DashboardSecondaryAction href={`/charts?evidence=${encodeURIComponent(reference)}`}>Open Market Charts</DashboardSecondaryAction>}>
        <ScannerMatchChart key={reference} evidence={result.evidence} initialTimeframe={result.timeframe} />
      </DashboardPanel>;
    }
  }
  return <ScannerBuilderPage identity={identity} initialChoice="live:gainers">{evidence}</ScannerBuilderPage>;
}
