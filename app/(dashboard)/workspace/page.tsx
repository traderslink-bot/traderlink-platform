import type { Metadata } from "next";

import { WorkspaceDashboard } from "./workspace-dashboard";
import { readWorkspaceReviewSummary } from "./workspace-review-summary";
import { formatJournalAnalyticsPartitionedMetric } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import {
  buildJournalAnalyticsDashboardQuery,
  withJournalAnalyticsReportingDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import {
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export const metadata: Metadata = {
  title: "Workspace | TraderLink Platform",
  description: "Trade Tracker performance, manual entry, and day sessions.",
};

export const dynamic = "force-dynamic";

const WORKSPACE_METRICS = [
  ["P/L", "gross_pnl", "Completed trades"],
  ["Expectancy", "expectancy", "Per completed trade"],
  ["Win rate", "win_rate", "Completed round trips"],
  ["Profit factor", "profit_factor", "Gross wins divided by losses"],
  ["Round trips", "included_count", "All available history"],
] as const;

export default async function WorkspacePage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const query = buildJournalAnalyticsDashboardQuery(scope, {
    metricIds: WORKSPACE_METRICS.map(([, metricId]) => metricId),
  });
  const { calendar, response, reviewSummary } = await withJournalAnalyticsReportingDashboardRuntime(
    scope,
    ({ dashboard, service }) => Object.freeze({
      response: service.getWorkspaceJournalAnalyticsSummary(scope, query),
      calendar: dashboard.getCalendar(scope, {
        currency: null,
        startDate: null,
        endDate: null,
        symbol: null,
        direction: null,
        performance: null,
        pnlBand: null,
        tradeCountBand: null,
        session: null,
      }),
      reviewSummary: withReadonlyPlatformDatabase({}, (database) =>
        readWorkspaceReviewSummary(database, scope, new Date(), dashboard)),
    }),
  );
  return (
    <WorkspaceDashboard
      analyticsMetrics={WORKSPACE_METRICS.map(([label, metricId, caption]) => ({
        label,
        caption,
        value: formatJournalAnalyticsPartitionedMetric(response, metricId),
      }))}
      calendarData={calendar}
      reviewSummary={reviewSummary}
    />
  );
}
