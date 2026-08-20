import "server-only";

import { DashboardPage } from "@/app/dashboard-template";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import type { JournalAnalyticsGrouping } from "@/src/modules/journal-analytics/contracts/analytics-query";
import type { JournalAnalyticsExactValue, JournalAnalyticsMetricResult } from "@/src/modules/journal-analytics/contracts/analytics-result";
import { formatJournalAnalyticsMetric } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { buildJournalAnalyticsDashboardQuery, withJournalAnalyticsReportingDashboardService } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { TimingAnalyticsClient, type TimingChartData, type TimingMetricId } from "./timing-analytics-client";
import { FeatureHelpLink } from "../../feature-help-link";

const GROUPINGS: readonly JournalAnalyticsGrouping[] = [
  "entry_time_bucket",
  "exit_time_bucket",
  "entry_weekday",
  "entry_session",
];

const METRIC_IDS: readonly TimingMetricId[] = [
  "net_pnl",
  "average_pnl",
  "win_rate",
  "included_count",
  "median_pnl",
  "best_trade",
];

function valueAsNumber(value: JournalAnalyticsExactValue | null): number | null {
  if (value === null) return null;
  if (value.kind === "integer") return value.value;
  if (value.kind === "duration") return value.milliseconds;
  if (value.kind === "text") return null;
  return Number(value.kind === "decimal" ? value.valueDecimal : value.roundedDecimal);
}

function metricValue(metric: JournalAnalyticsMetricResult | null) {
  return Object.freeze({
    display: metric ? formatJournalAnalyticsMetric(metric) : "N/A",
    state: metric?.state ?? "unavailable",
    value: metric ? valueAsNumber(metric.value) : null,
  });
}

function chartOrder(grouping: JournalAnalyticsGrouping, key: string): number | string {
  if (grouping === "entry_weekday") {
    return ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(key);
  }
  if (grouping === "entry_session") {
    return ["premarket", "regular_hours", "after_hours", "overnight"].indexOf(key);
  }
  return key;
}

export async function TimingAnalyticsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const query = buildJournalAnalyticsDashboardQuery(scope, {
    groupings: GROUPINGS,
    metricIds: METRIC_IDS,
  });
  const response = await withJournalAnalyticsReportingDashboardService(scope, (service) =>
    service.getTimingAnalytics(scope, query));
  const chartData: TimingChartData = Object.freeze(Object.fromEntries(
    GROUPINGS.map((grouping) => [grouping, Object.freeze(response.partitions.flatMap((partition) =>
      partition.groups
        .filter((group) => group.grouping === grouping)
        .map((group) => Object.freeze({
          key: group.groupKey,
          label: group.label,
          metrics: Object.freeze(Object.fromEntries(METRIC_IDS.map((metricId) => [
            metricId,
            metricValue(group.metrics.find((metric) => metric.metricId === metricId) ?? null),
          ]))),
        })))
        .sort((left, right) => {
          const leftOrder = chartOrder(grouping, left.key);
          const rightOrder = chartOrder(grouping, right.key);
          return typeof leftOrder === "number" && typeof rightOrder === "number"
            ? leftOrder - rightOrder
            : String(leftOrder).localeCompare(String(rightOrder));
        })),
    ]),
  )) as TimingChartData;

  return (
    <DashboardPage>
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1, justifyContent: "space-between" }}>
        <Box>
          <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
            Analytics
          </Typography>
          <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
            Timing
          </Typography>
        </Box>
        <FeatureHelpLink href="/help/core-analytics" label="Core Analytics" size="medium" />
      </Box>

      <TimingAnalyticsClient
        chartData={chartData}
        completedTradeCount={response.crossPartitionCounts.readyClosedCount}
        timezone={response.partitions[0]?.timezone ?? "America/New_York"}
      />
    </DashboardPage>
  );
}
