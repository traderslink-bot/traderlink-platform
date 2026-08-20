import "server-only";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { DashboardPage } from "@/app/dashboard-template";
import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import type { JournalAnalyticsGrouping } from "@/src/modules/journal-analytics/contracts/analytics-query";
import type { JournalAnalyticsExactValue, JournalAnalyticsMetricResult } from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  createJournalAnalyticsExecutionOfflineViewModel,
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION,
  journalAnalyticsOfflineRouteCoverage,
} from "@/src/modules/journal-analytics/contracts/journal-analytics-offline-view-contracts";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMetric,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { buildJournalAnalyticsDashboardQuery, withJournalAnalyticsReportingDashboardService } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { ExecutionAnalyticsClient, type ExecutionChartData, type ExecutionTradeRow } from "./execution-analytics-client";
import { OverviewDateRangeControl, type OverviewDateRange } from "./overview-date-range-control";
import { FeatureHelpLink } from "../feature-help-link";

const GROUPINGS = ["entered_quantity_bucket", "maximum_position_bucket", "holding_duration_bucket"] as const satisfies readonly JournalAnalyticsGrouping[];
const METRICS = ["net_pnl", "win_rate", "included_count"] as const;

function metricFor(metrics: readonly JournalAnalyticsMetricResult[], id: string) {
  return metrics.find((metric) => metric.metricId === id) ?? null;
}

function metricNumber(value: JournalAnalyticsExactValue | null): number | null {
  if (value === null || value.kind === "text" || value.kind === "duration") return null;
  return value.kind === "integer" ? value.value : Number(value.kind === "decimal" ? value.valueDecimal : value.roundedDecimal);
}

function money(value: string | null, currency: string | null): string {
  if (value === null) return "Unavailable";
  return formatJournalAnalyticsMoney(value, currency);
}

function timestamp(value: string): string {
  return value.replace("T", " ").replace(".000Z", "");
}

function duration(milliseconds: number): string {
  const minutes = Math.round(milliseconds / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
}

function today(): string {
  const parts = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: "America/New_York", year: "numeric" }).formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function range(input: Readonly<Record<string, string | string[] | undefined>>): OverviewDateRange {
  const kind = typeof input.range === "string" ? input.range : "all";
  const endDate = today();
  const addMonths = (count: number) => { const date = new Date(`${endDate}T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() - count); return date.toISOString().slice(0, 10); };
  if (kind === "3m" || kind === "6m" || kind === "12m") return { endDate, kind, startDate: addMonths(Number(kind.slice(0, -1))) };
  if (kind === "ytd") return { endDate, kind: "ytd", startDate: `${endDate.slice(0, 4)}-01-01` };
  const start = typeof input.start === "string" ? input.start : "";
  const end = typeof input.end === "string" ? input.end : "";
  return kind === "custom" && /^\d{4}-\d{2}-\d{2}$/u.test(start) && /^\d{4}-\d{2}-\d{2}$/u.test(end) && start <= end
    ? { endDate: end, kind: "custom", startDate: start }
    : { endDate: null, kind: "all", startDate: null };
}

export async function ExecutionAnalyticsPage({ searchParams }: { searchParams: Readonly<Record<string, string | string[] | undefined>> }) {
  const scope = await requireTraderLinkPlatformPageScope();
  const selectedRange = range(searchParams);
  const closingDateRange = selectedRange.startDate && selectedRange.endDate
    ? { endDate: selectedRange.endDate, kind: "inclusive_closing_date" as const, startDate: selectedRange.startDate }
    : { kind: "all_available" as const };
  const result = await withJournalAnalyticsReportingDashboardService(scope, (service) => {
    const chartQuery = buildJournalAnalyticsDashboardQuery(scope, { closingDateRange, groupings: GROUPINGS, metricIds: METRICS });
    const charts = service.getExecutionAnalytics(scope, chartQuery);
    const currency = charts.partitions[0]?.currency ?? null;
    const trades = currency === null ? null : service.getRoundTripAnalyticsTable(scope, buildJournalAnalyticsDashboardQuery(scope, { closingDateRange, currency, metricIds: ["included_count"], pageSize: 200 }));
    return { charts, trades };
  });
  const chartData = Object.freeze(Object.fromEntries(GROUPINGS.map((grouping) => {
    const points = result.charts.partitions.flatMap((partition) => partition.groups
      .filter((group) => group.grouping === grouping)
      .map((group) => Object.freeze({
        key: group.groupKey,
        label: group.label,
        metrics: Object.freeze({
          included_count: Object.freeze({ display: formatJournalAnalyticsMetric(metricFor(group.metrics, "included_count")!), value: metricNumber(metricFor(group.metrics, "included_count")?.value ?? null) }),
          net_pnl: Object.freeze({ display: formatJournalAnalyticsMetric(metricFor(group.metrics, "net_pnl")!), value: metricNumber(metricFor(group.metrics, "net_pnl")?.value ?? null) }),
          win_rate: Object.freeze({ display: formatJournalAnalyticsMetric(metricFor(group.metrics, "win_rate")!), value: metricNumber(metricFor(group.metrics, "win_rate")?.value ?? null) }),
        }),
      })));
    return [grouping, Object.freeze(points)];
  }))) as ExecutionChartData;
  const rows: readonly ExecutionTradeRow[] = result.trades?.rows.map((row) => ({ averageEntry: money(row.averageEntryPriceDecimal ?? null, result.trades?.currency ?? null), averageEntryValue: Number(row.averageEntryPriceDecimal ?? 0), averageExit: money(row.averageExitPriceDecimal ?? null, result.trades?.currency ?? null), averageExitValue: Number(row.averageExitPriceDecimal ?? 0), closed: timestamp(row.closedAtUtc), closedValue: row.closedAtUtc, direction: row.direction, executions: row.uniqueExecutionCount, maximumPosition: formatJournalAnalyticsDecimal(row.maximumPositionQuantityDecimal, 2, true), maximumPositionValue: Number(row.maximumPositionQuantityDecimal), netPnl: money(row.selectedPnlDecimal, result.trades?.currency ?? null), netPnlDecimal: row.selectedPnlDecimal, netPnlValue: Number(row.selectedPnlDecimal ?? 0), opened: timestamp(row.openedAtUtc), openedValue: row.openedAtUtc, roundTripId: row.roundTripId, ticker: row.displayedSymbol, tradeType: row.tradeClassification === "day_trade" ? "Day trade" : "Multi-day trade", tradeTypeValue: row.tradeClassification, holdTime: duration(row.holdingDurationMilliseconds), holdTimeValue: row.holdingDurationMilliseconds })) ?? [];
  const currency = result.trades?.currency ?? result.charts.partitions[0]?.currency ?? null;
  const offlineModel = createJournalAnalyticsExecutionOfflineViewModel({
    chartData,
    currency,
    dateRange: selectedRange,
    rows,
  });
  return <><OfflineSavedViewCapture accountTimezone={result.trades?.timezone ?? result.charts.partitions[0]?.timezone ?? null} calculationVersion={`journal-analytics-${result.charts.registryVersion}`} coverage={journalAnalyticsOfflineRouteCoverage("analytics-execution")} generatedAtUtc={result.charts.generatedAtUtc} model={offlineModel} pathname="/analytics/execution" queryIdentity={`range:${selectedRange.kind}:${selectedRange.startDate ?? "all"}:${selectedRange.endDate ?? "all"}`} reportingCurrency={currency} routeViewVersion={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION} viewKey={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS["analytics-execution"]} /><DashboardPage><Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, justifyContent: "space-between" }}><Box><Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">Analytics</Typography><Typography component="h1" sx={{ mt: 0.5 }} variant="h1">Trade Breakdown</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }}>See how your completed trades were entered, sized, held, and exited.</Typography></Box><FeatureHelpLink href="/help/core-analytics" label="Core Analytics" size="medium" /></Box><Box sx={{ alignItems: { sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 0.5 }}><OverviewDateRangeControl href="/analytics/execution" value={selectedRange} /><FeatureHelpLink href="/help/core-analytics/overview-and-date-range#set-a-date-range" label="Analytics date range" /></Box><ExecutionAnalyticsClient chartData={chartData} currency={currency} rows={rows} /></DashboardPage></>;
}
