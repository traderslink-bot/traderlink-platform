import type {WorkspaceAccessScope} from "@/src/modules/platform/contracts/workspace-access-scope";
import "server-only";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import { requireMembershipPageScope } from "@/src/modules/platform/server/membership/platform-membership-page-access";
import type { JournalAnalyticsGrouping } from "@/src/modules/journal-analytics/contracts/analytics-query";
import type { JournalAnalyticsExactValue, JournalAnalyticsMetricResult } from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION,
  journalAnalyticsOfflineRouteCoverage,
  type JournalAnalyticsTimingOfflineViewModel,
} from "@/src/modules/journal-analytics/contracts/journal-analytics-offline-view-contracts";
import { formatJournalAnalyticsMetric } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { buildJournalAnalyticsDashboardQuery, resolveJournalAnalyticsMoneyBasis, withJournalAnalyticsReportingDashboardRuntime } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { type TimingChartData, type TimingMetricId } from "./timing-analytics-client";
import { TimingAnalyticsView } from "./timing-analytics-view";

const GROUPINGS: readonly JournalAnalyticsGrouping[] = [
  "entry_time_bucket",
  "exit_time_bucket",
  "entry_weekday",
  "entry_session",
];

function metricIdsFor(moneyBasis: "gross" | "net"): readonly TimingMetricId[] {
  return [
  moneyBasis === "gross" ? "gross_pnl" : "net_pnl",
  "average_pnl",
  "win_rate",
  "included_count",
  "median_pnl",
  "best_trade",
  ];
}

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

export async function loadTimingAnalyticsModel({
  searchParams,resourceScope,period,
}: {
  resourceScope?:WorkspaceAccessScope;period?:{start:string;end:string};
  searchParams: Promise<{ basis?: string | string[] | undefined }>;
}) {
  const scope = resourceScope ?? await requireMembershipPageScope("analytics.access");
  const requestedBasis = (await searchParams).basis;
  const result = await withJournalAnalyticsReportingDashboardRuntime(scope, ({ pnlReportingBasis, service }) => {
    const moneyBasis = resolveJournalAnalyticsMoneyBasis(requestedBasis, pnlReportingBasis);
    const query = buildJournalAnalyticsDashboardQuery(scope, {
      ...(period?{closingDateRange:{kind:"inclusive_closing_date" as const,startDate:period.start,endDate:period.end}}:{}),
      groupings: GROUPINGS,
      metricIds: metricIdsFor(moneyBasis),
      moneyBasis,
    });
    return Object.freeze({ moneyBasis, response: service.getTimingAnalytics(scope, query) });
  });
  const { moneyBasis, response } = result;
  const metricIds = metricIdsFor(moneyBasis);
  const chartData: TimingChartData = Object.freeze(Object.fromEntries(
    GROUPINGS.map((grouping) => [grouping, Object.freeze(response.partitions.flatMap((partition) =>
      partition.groups
        .filter((group) => group.grouping === grouping)
        .map((group) => Object.freeze({
          key: group.groupKey,
          label: group.label,
          metrics: Object.freeze(Object.fromEntries(metricIds.map((metricId) => [
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
  return { chartData, completedTradeCount: response.crossPartitionCounts.readyClosedCount, moneyBasis, response, timezone };
}

export async function TimingAnalyticsPage({
  searchParams,resourceScope,period,
}: {
  resourceScope?:WorkspaceAccessScope;period?:{start:string;end:string};
  searchParams: Promise<{ basis?: string | string[] | undefined }>;
}) {
  const { chartData, completedTradeCount, moneyBasis, response, timezone } = await loadTimingAnalyticsModel({ searchParams, resourceScope, period });
  const offlineModel: JournalAnalyticsTimingOfflineViewModel = Object.freeze({
    chartData,
    completedTradeCount,
    kind: "analytics-timing",
    moneyBasis,
    timezone,
    version: 1,
  });

  return (
    <>
    {resourceScope?null:<OfflineSavedViewCapture
      accountTimezone={timezone}
      calculationVersion={`journal-analytics-${response.registryVersion}`}
      coverage={journalAnalyticsOfflineRouteCoverage("analytics-timing")}
      generatedAtUtc={response.generatedAtUtc}
      model={offlineModel}
      pathname="/analytics/timing"
      queryIdentity={`basis=${moneyBasis}`}
      reportingCurrency={response.partitions[0]?.currency ?? null}
      routeViewVersion={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION}
      viewKey={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS["analytics-timing"]}
    />}
    <TimingAnalyticsView chartData={chartData} completedTradeCount={completedTradeCount} moneyBasis={moneyBasis} timezone={timezone} />
    </>
  );
}
