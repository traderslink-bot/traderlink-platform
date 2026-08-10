import type { Metadata } from "next";

import { WorkspaceDashboard } from "./workspace-dashboard";
import { readWorkspaceReviewSummary } from "./workspace-review-summary";
import { formatJournalAnalyticsPartitionedMetric } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import {
  buildJournalAnalyticsDashboardQuery,
  withJournalAnalyticsDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { readJournalDataDecisionNoticeRef } from "@/src/modules/journal/server/decisions/journal-data-decision-notice";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformAccountProfileReadService } from "@/src/modules/platform/server/identity/platform-account-profile-read-service";
import { getWorkspaceReportingSummary } from "@/src/modules/platform/server/reporting/workspace-reporting-summary";

export const metadata: Metadata = {
  title: "Workspace | Trade Tracker",
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
  const { calendar, response } = withJournalAnalyticsDashboardRuntime(
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
    }),
  );
  const { profile, reviewSummary } = withReadonlyPlatformDatabase({}, (database) => Object.freeze({
    profile: new PlatformAccountProfileReadService(database).get(scope),
    reviewSummary: readWorkspaceReviewSummary(database, scope),
  }));
  const reportingSummary = await getWorkspaceReportingSummary(
    calendar,
    profile.reportingCurrency,
  );
  return (
    <WorkspaceDashboard
      accountSelectionRef={currentJournalAccountSelectionRef(scope)}
      analyticsCoverage={response.crossPartitionCounts}
      analyticsMetrics={WORKSPACE_METRICS.map(([label, metricId, caption]) => ({
        label,
        caption,
        value: formatJournalAnalyticsPartitionedMetric(response, metricId),
      }))}
      calendarData={calendar}
      reportingSummary={reportingSummary}
      reviewSummary={reviewSummary}
      decisionNoticeRef={response.crossPartitionCounts.needsDecisionCount > 0
        ? readJournalDataDecisionNoticeRef(scope)
        : null}
    />
  );
}
