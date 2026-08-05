import "server-only";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardMetricCard, DashboardPage } from "@/app/dashboard-template";
import type { JournalAnalyticsExactValue, JournalAnalyticsMetricResult, JournalAnalyticsPartition } from "@/src/modules/journal-analytics/contracts/analytics-result";
import { formatJournalAnalyticsMetric } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { buildJournalAnalyticsDashboardQuery, withJournalAnalyticsDashboardService } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { MonthlyPnlChart, type MonthlyPnlChartRow } from "./monthly-pnl-chart";
import { OverviewDateRangeControl, type OverviewDateRange } from "./overview-date-range-control";

const OVERVIEW_METRICS = [
  { id: "net_pnl", label: "Net P/L", caption: "All completed trades" },
  { id: "win_rate", label: "Win rate", caption: "Completed trades that were profitable" },
  { id: "profit_factor", label: "Profit factor", caption: "Gross wins divided by gross losses" },
  { id: "expectancy", label: "Expectancy", caption: "Average result per trade" },
  { id: "average_winning_trade", label: "Average win", caption: "Average profitable trade" },
  { id: "average_losing_trade", label: "Average loss", caption: "Average losing trade" },
  { id: "best_trade", label: "Largest win", caption: "Best single trade" },
  { id: "worst_trade", label: "Largest loss", caption: "Worst single trade" },
  { id: "total_trades", label: "Completed trades", caption: "All closed trades" },
] as const;

function metricFor(metrics: readonly JournalAnalyticsMetricResult[], metricId: string): JournalAnalyticsMetricResult | null {
  return metrics.find((metric) => metric.metricId === metricId) ?? null;
}

function numberValue(value: JournalAnalyticsExactValue | null): number | null {
  if (value === null || value.kind === "text") return null;
  if (value.kind === "integer") return value.value;
  if (value.kind === "duration") return null;
  return Number(value.kind === "decimal" ? value.valueDecimal : value.roundedDecimal);
}

function monthLabel(value: string): string {
  const date = new Date(`${value}-01T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function easternToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function subtractMonths(date: string, count: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCMonth(value.getUTCMonth() - count);
  return value.toISOString().slice(0, 10);
}

function dateRangeFromSearchParams(searchParams: Readonly<Record<string, string | string[] | undefined>>): OverviewDateRange {
  const range = typeof searchParams.range === "string" ? searchParams.range : "all";
  const today = easternToday();
  if (range === "3m" || range === "6m" || range === "12m") {
    const months = Number(range.slice(0, -1));
    return { endDate: today, kind: range, startDate: subtractMonths(today, months) };
  }
  if (range === "ytd") return { endDate: today, kind: "ytd", startDate: `${today.slice(0, 4)}-01-01` };
  const start = typeof searchParams.start === "string" ? searchParams.start : "";
  const end = typeof searchParams.end === "string" ? searchParams.end : "";
  if (range === "custom" && /^\d{4}-\d{2}-\d{2}$/u.test(start) && /^\d{4}-\d{2}-\d{2}$/u.test(end) && start <= end) {
    return { endDate: end, kind: "custom", startDate: start };
  }
  return { endDate: null, kind: "all", startDate: null };
}

function MonthlyPnlChartForPartition({ partition }: { partition: JournalAnalyticsPartition }) {
  const rows: readonly MonthlyPnlChartRow[] = partition.groups
    .filter((group) => group.grouping === "closing_month")
    .map((group) => {
      const metric = metricFor(group.metrics, "net_pnl");
      return {
        key: group.groupKey,
        label: monthLabel(group.label),
        value: numberValue(metric?.value ?? null) ?? 0,
        display: metric ? formatJournalAnalyticsMetric(metric) : "N/A",
      };
    });
  return <MonthlyPnlChart rows={rows} />;
}

function OverviewPartition({ partition, showCurrency }: { partition: JournalAnalyticsPartition; showCurrency: boolean }) {
  return (
    <Stack spacing={2.5}>
      {showCurrency ? <Typography sx={{ fontWeight: 800 }}>{partition.currency ?? "Currency unavailable"}</Typography> : null}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" } }}>
        {OVERVIEW_METRICS.map((definition) => {
          const metric = metricFor(partition.metrics, definition.id);
          return <DashboardMetricCard caption={definition.caption} key={definition.id} label={definition.label} value={metric ? formatJournalAnalyticsMetric(metric) : "N/A"} />;
        })}
      </Box>
      <MonthlyPnlChartForPartition partition={partition} />
    </Stack>
  );
}

export async function AnalyticsOverviewPage({ searchParams }: { searchParams: Readonly<Record<string, string | string[] | undefined>> }) {
  const scope = await requireTraderLinkPlatformPageScope();
  const dateRange = dateRangeFromSearchParams(searchParams);
  const query = buildJournalAnalyticsDashboardQuery(scope, {
    closingDateRange: dateRange.startDate && dateRange.endDate
      ? { endDate: dateRange.endDate, kind: "inclusive_closing_date", startDate: dateRange.startDate }
      : { kind: "all_available" },
    groupings: ["closing_month"],
    metricIds: OVERVIEW_METRICS.map((metric) => metric.id),
  });
  const response = withJournalAnalyticsDashboardService(scope, (service) => service.getAnalyticsOverview(scope, query));
  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Analytics</Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Overview</Typography>
      </Box>
      <OverviewDateRangeControl value={dateRange} />
      {response.partitions.map((partition) => <OverviewPartition key={partition.currency ?? "currency-unavailable"} partition={partition} showCurrency={response.partitions.length > 1} />)}
    </DashboardPage>
  );
}
