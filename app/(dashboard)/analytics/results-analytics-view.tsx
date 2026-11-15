"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DashboardPage } from "@/app/dashboard-ui";
import { OverviewDateRangeControl, type OverviewDateRange } from "./overview-date-range-control";
import { ResultsTickerTable, type ResultsTickerRow } from "./results-ticker-table";

export function ResultsAnalyticsView({ selectedRange, moneyBasis, rows }: {
  selectedRange: OverviewDateRange;
  moneyBasis: "gross" | "net";
  rows: readonly ResultsTickerRow[];
}) {
  return <DashboardPage>
    <Box>
      <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Analytics</Typography>
      <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Ticker</Typography>
    </Box>
    <Box sx={{ alignItems: { sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 0.5 }}>
      <OverviewDateRangeControl href="/analytics/results" value={selectedRange} />
    </Box>
    <ResultsTickerTable endDate={selectedRange.endDate} moneyBasis={moneyBasis} rows={rows} startDate={selectedRange.startDate} />
  </DashboardPage>;
}
