import type { Metadata } from "next";
import Box from "@mui/material/Box";

import { DashboardPage } from "../../dashboard-template";
import { TradingViewChart } from "./trading-view-chart";

export const metadata: Metadata = {
  title: "Market Charts | TraderLink Platform",
};

export default function MarketChartsPage() {
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
      <TradingViewChart />
    </DashboardPage>
  );
}
