import "server-only";

import { DashboardPage } from "@/app/dashboard-template";
import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import type { JournalAnalyticsGrouping } from "@/src/modules/journal-analytics/contracts/analytics-query";
import type { JournalAnalyticsExactValue, JournalAnalyticsMetricResult } from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION,
  journalAnalyticsOfflineRouteCoverage,
  type JournalAnalyticsTimingOfflineViewModel,
} from "@/src/modules/journal-analytics/contracts/journal-analytics-offline-view-contracts";
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
  const timezone = response.partitions[0]?.timezone ?? "America/New_York";
  const offlineModel: JournalAnalyticsTimingOfflineViewModel = Object.freeze({
    chartData,
    completedTradeCount: response.crossPartitionCounts.readyClosedCount,
    kind: "analytics-timing",
    timezone,
    version: 1,
  });

  return (
    <>
    <OfflineSavedViewCapture
      accountTimezone={timezone}
      calculationVersion={`journal-analytics-${response.registryVersion}`}
      coverage={journalAnalyticsOfflineRouteCoverage("analytics-timing")}
      generatedAtUtc={response.generatedAtUtc}
      model={offlineModel}
      pathname="/analytics/timing"
      queryIdentity="all-available"
      reportingCurrency={response.partitions[0]?.currency ?? null}
      routeViewVersion={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION}
      viewKey={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS["analytics-timing"]}
    />
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
        timezone={timezone}
      />
    </DashboardPage>
    </>
  );
}
