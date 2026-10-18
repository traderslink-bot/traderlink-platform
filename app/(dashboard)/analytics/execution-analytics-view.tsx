"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DashboardPage } from "@/app/dashboard-ui";
import { DashboardAppearanceText } from "../dashboard-appearance-text";
import { FeatureHelpLink } from "../feature-help-link";
import { ExecutionAnalyticsClient } from "./execution-analytics-client";
import type { loadExecutionAnalyticsModel } from "./execution-analytics-page";
import { OverviewDateRangeControl } from "./overview-date-range-control";

type Model = Awaited<ReturnType<typeof loadExecutionAnalyticsModel>>;
type ViewProps = Pick<Model, "chartData" | "currency" | "moneyBasis" | "priceComparison" | "priceInsights" | "priceResults" | "priceResultsByDirection" | "rows" | "selectedRange">;

export function ExecutionAnalyticsView({ chartData, currency, moneyBasis, priceComparison, priceInsights, priceResults, priceResultsByDirection, rows, selectedRange, initialTicker="" }: ViewProps & {initialTicker?:string}) {
  return <DashboardPage>
    <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, justifyContent: "space-between" }}>
      <Box>
        <DashboardAppearanceText lightColor="primary.main" sx={{ fontWeight: 800 }} variant="caption">Analytics</DashboardAppearanceText>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Trade Breakdown</Typography>
        <DashboardAppearanceText lightColor="text.secondary" sx={{ mt: 0.5 }}>See how your completed trades were entered, sized, held, and exited.</DashboardAppearanceText>
      </Box>
      <FeatureHelpLink href="/help/core-analytics" label="Core Analytics" size="medium" />
    </Box>
    <ExecutionAnalyticsClient initialTicker={initialTicker} dateControls={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}><OverviewDateRangeControl href="/analytics/execution" showCaption={false} value={selectedRange} /><FeatureHelpLink href="/help/core-analytics/overview-and-date-range#set-a-date-range" label="Analytics date range" /></Box>} chartData={chartData} currency={currency} moneyBasis={moneyBasis} priceComparison={priceComparison} priceInsights={priceInsights} priceResults={priceResults} priceResultsByDirection={priceResultsByDirection} rows={rows} />
  </DashboardPage>;
}
