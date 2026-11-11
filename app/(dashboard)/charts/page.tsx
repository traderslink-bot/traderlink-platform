import type { Metadata } from "next";
import Box from "@mui/material/Box";

import { DashboardPage } from "../../dashboard-template";
import { MarketChartWorkspace } from "./market-chart-workspace";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const metadata: Metadata = {
  title: "Market Charts | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export default async function MarketChartsPage() {
  await requireTraderLinkPlatformPageIdentity();
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
      <MarketChartWorkspace />
    </DashboardPage>
  );
}
