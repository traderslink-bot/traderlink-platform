import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { hasChartsDashboardAccess } from "@/src/modules/market-data/server/chart-dashboard-access";
import { DashboardPage } from "../../dashboard-template";
import { MarketChartWorkspace, type MarketChartEvidenceHandoff } from "./market-chart-workspace";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { resolveScannerChartEvidence } from "@/src/modules/scanner/custom/server/scanner-chart-evidence";

export const metadata: Metadata = {
  title: "Market Charts | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export default async function MarketChartsPage({ searchParams }: {
  searchParams: Promise<{ evidence?: string | string[] }>;
}) {
  const [identity, { evidence: reference }] = await Promise.all([
    requireTraderLinkPlatformPageIdentity(),
    searchParams,
  ]);
  if (!hasChartsDashboardAccess(identity)) notFound();
  let handoff: MarketChartEvidenceHandoff | undefined;
  if (typeof reference === "string" && /^[a-f0-9-]{36}$/u.test(reference)) {
    try {
      const result = await resolveScannerChartEvidence(identity, reference);
      if (result.state === "ready") handoff = { reference, timeframe: result.timeframe, evidence: result.evidence };
    } catch {
      // Keep normal Charts available if authenticated match evidence cannot be resolved.
    }
  }
  return (
    <DashboardPage>
      <Box
        component="h1"
        sx={{
          border: 0,
          clip: "rect(0 0 0 0)",
          height: 1,
          margin: -1,
          overflow: "hidden",
          padding: 0,
          position: "absolute",
          whiteSpace: "nowrap",
          width: 1,
        }}
      >
        Market Charts
      </Box>
      {reference !== undefined && !handoff && <Typography role="status" variant="body2">
        Matched chart evidence is unavailable.
      </Typography>}
      <MarketChartWorkspace evidenceHandoff={handoff} />
    </DashboardPage>
  );
}
