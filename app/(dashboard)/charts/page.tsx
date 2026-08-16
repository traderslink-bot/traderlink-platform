import type { Metadata } from "next";
import Typography from "@mui/material/Typography";

import { DashboardPage } from "../../dashboard-template";
import { TradingViewChart } from "./trading-view-chart";

export const metadata: Metadata = {
  title: "Market Charts | TraderLink Platform",
};

export default function MarketChartsPage() {
  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">Market Charts</Typography>
      <TradingViewChart />
    </DashboardPage>
  );
}
