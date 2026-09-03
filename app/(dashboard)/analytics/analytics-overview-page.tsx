import "server-only";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS,
  JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION,
  journalAnalyticsOfflineRouteCoverage,
  type JournalAnalyticsOverviewOfflineViewModel,
} from "@/src/modules/journal-analytics/contracts/journal-analytics-offline-view-contracts";
import {
  buildJournalAnalyticsDashboardQuery,
  resolveJournalAnalyticsMoneyBasis,
  withJournalAnalyticsReportingDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

import { analyticsOverviewMetrics, AnalyticsOverviewView } from "./analytics-overview-view";
import type { OverviewDateRange } from "./overview-date-range-control";

function easternToday(): string {
  const parts = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: "America/New_York", year: "numeric" }).formatToParts(new Date());
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
    return { endDate: today, kind: range, startDate: subtractMonths(today, Number(range.slice(0, -1))) };
  }
  if (range === "ytd") return { endDate: today, kind: "ytd", startDate: `${today.slice(0, 4)}-01-01` };
  const start = typeof searchParams.start === "string" ? searchParams.start : "";
  const end = typeof searchParams.end === "string" ? searchParams.end : "";
  if (range === "custom" && /^\d{4}-\d{2}-\d{2}$/u.test(start) && /^\d{4}-\d{2}-\d{2}$/u.test(end) && start <= end) {
    return { endDate: end, kind: "custom", startDate: start };
  }
  return { endDate: null, kind: "all", startDate: null };
}

export async function AnalyticsOverviewPage({ searchParams }: { searchParams: Readonly<Record<string, string | string[] | undefined>> }) {
  const scope = await requireTraderLinkPlatformPageScope();
  const dateRange = dateRangeFromSearchParams(searchParams);
  const { moneyBasis, response } = await withJournalAnalyticsReportingDashboardRuntime(
    scope,
    ({ pnlReportingBasis, service }) => {
      const moneyBasis = resolveJournalAnalyticsMoneyBasis(searchParams.basis, pnlReportingBasis);
      const query = buildJournalAnalyticsDashboardQuery(scope, {
        closingDateRange: dateRange.startDate && dateRange.endDate
          ? { endDate: dateRange.endDate, kind: "inclusive_closing_date", startDate: dateRange.startDate }
          : { kind: "all_available" },
        groupings: ["closing_month"],
        metricIds: analyticsOverviewMetrics(moneyBasis).map((metric) => metric.id),
        moneyBasis,
      });
      return Object.freeze({ moneyBasis, response: service.getAnalyticsOverview(scope, query) });
    },
    { prefetchAllFactSet: dateRange.kind === "all" },
  );
  const offlineModel: JournalAnalyticsOverviewOfflineViewModel = Object.freeze({
    dateRange: Object.freeze({ ...dateRange }),
    kind: "analytics-overview",
    moneyBasis,
    response,
    version: 1,
  });
  return (
    <>
      <OfflineSavedViewCapture
        accountTimezone={response.partitions[0]?.timezone ?? null}
        calculationVersion={`journal-analytics-${response.registryVersion}`}
        coverage={journalAnalyticsOfflineRouteCoverage("analytics-overview")}
        generatedAtUtc={response.generatedAtUtc}
        model={offlineModel}
        pathname="/analytics"
        queryIdentity={`range:${dateRange.kind}:${dateRange.startDate ?? "all"}:${dateRange.endDate ?? "all"}:basis:${moneyBasis}`}
        reportingCurrency={response.partitions[0]?.currency ?? null}
        routeViewVersion={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_VERSION}
        viewKey={JOURNAL_ANALYTICS_OFFLINE_ROUTE_VIEW_KEYS["analytics-overview"]}
      />
      <AnalyticsOverviewView dateRange={dateRange} moneyBasis={moneyBasis} response={response} />
    </>
  );
}
