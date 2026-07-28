import type { Metadata } from "next";

import { DashboardPage } from "../../dashboard-template";
import { TradingViewChart } from "./trading-view-chart";

export const metadata: Metadata = {
  title: "Market Charts | Trader Intelligence",
};

export default function MarketChartsPage() {
  return (
    <DashboardPage>
      <TradingViewChart />
    </DashboardPage>
  );
}
