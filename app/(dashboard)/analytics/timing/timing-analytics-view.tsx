"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DashboardPage } from "@/app/dashboard-ui";
import { FeatureHelpLink } from "../../feature-help-link";
import { TimingAnalyticsClient, type TimingChartData } from "./timing-analytics-client";

export function TimingAnalyticsView({ chartData, completedTradeCount, moneyBasis, timezone }: {
  chartData: TimingChartData;
  completedTradeCount: number;
  moneyBasis: "gross" | "net";
  timezone: string;
}) {
  return <DashboardPage>
    <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, justifyContent: "space-between" }}>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Analytics</Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Timing</Typography>
      </Box>
      <FeatureHelpLink href="/help/core-analytics" label="Core Analytics" size="medium" />
    </Box>
    <TimingAnalyticsClient chartData={chartData} completedTradeCount={completedTradeCount} moneyBasis={moneyBasis} timezone={timezone} />
  </DashboardPage>;
}
