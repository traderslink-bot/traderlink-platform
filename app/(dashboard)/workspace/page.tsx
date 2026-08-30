import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WorkspaceOfflineViewCapture } from "@/app/pwa/workspace-offline-view-capture";
import { WorkspaceDashboard } from "./workspace-dashboard";
import type { WorkspaceFirstTimeOnboardingResult } from "./workspace-first-time-onboarding-panel";
import { readWorkspaceReviewSummary } from "./workspace-review-summary";
import {
  findJournalAnalyticsMetric,
  formatJournalAnalyticsPartitionedMetric,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { financialSummaryMetricColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import {
  buildJournalAnalyticsDashboardQuery,
  withJournalAnalyticsReportingDashboardRuntime,
} from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  createPlatformWorkspaceOfflineViewModel,
  platformWorkspaceOfflineCoverage,
} from "@/src/modules/platform/contracts/platform-workspace-offline-view-contracts";
import {
  readJournalFirstExecutionOnboardingStatus,
  readJournalFirstExecutionOnboardingStatusFromDatabase,
} from "@/src/modules/journal/server/product/journal-first-execution-onboarding";
import {
  MOOMOO_OAUTH_ONBOARDING_RETURN_COOKIE,
  MOOMOO_OAUTH_ONBOARDING_RETURN_VALUE,
} from "@/src/modules/platform/server/broker-connections/moomoo-oauth-cookies";

export const metadata: Metadata = {
  title: "Welcome to TradersLink Beta App. | TradersLink Platform",
  description: "Trade Tracker performance, manual entry, and day sessions.",
};

export const dynamic = "force-dynamic";

const WORKSPACE_METRICS = [
  ["P/L", "gross_pnl", "Completed trades"],
  ["Expectancy", "expectancy", "Per completed trade"],
  ["Win rate", "win_rate", "Completed round trips"],
  ["Profit factor", "profit_factor", "Gross wins divided by losses"],
  ["Trades", "included_count", "All available history"],
] as const;

function workspaceFirstTimeOnboardingResult(
  value: string | undefined,
): WorkspaceFirstTimeOnboardingResult {
  if (value === "moomoo-failed") return value;
  return null;
}

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ gettingStarted?: string }>;
}) {
  const queryParameters = await searchParams;
  const scope = await requireTraderLinkPlatformPageScope();
  if (!scope.activeAccountId) {
    // Preserve the existing read-before-redirect failure boundary.
    readJournalFirstExecutionOnboardingStatus(scope);
    await cookies();
    redirect("/account/trading");
  }
  const query = buildJournalAnalyticsDashboardQuery(scope, {
    metricIds: WORKSPACE_METRICS.map(([, metricId]) => metricId),
  });
  const { onboardingStatus, response, reviewSummary } = await withJournalAnalyticsReportingDashboardRuntime(
    scope,
    ({ database, dashboard, service }) => Object.freeze({
      onboardingStatus: readJournalFirstExecutionOnboardingStatusFromDatabase(database, scope),
      response: service.getWorkspaceJournalAnalyticsSummary(scope, query),
      reviewSummary: readWorkspaceReviewSummary(database, scope, new Date(), dashboard),
    }),
    { prefetchAllFactSet: true },
  );
  const showFirstTimeOnboarding = !onboardingStatus.activeAccountIsDemo &&
    !onboardingStatus.hasRealAcceptedExecution;
  const demoAccountSelectionRef = onboardingStatus.activeAccountIsDemo
    ? currentJournalAccountSelectionRef(scope)
    : undefined;
  const showDemoTradeTrackerInvitation = !onboardingStatus.activeAccountIsDemo &&
    onboardingStatus.demoLifecycleState !== "cleared";
  const cookieStore = await cookies();
  const moomooConnectionPending = cookieStore.get(MOOMOO_OAUTH_ONBOARDING_RETURN_COOKIE)?.value
    === MOOMOO_OAUTH_ONBOARDING_RETURN_VALUE;
  const analyticsMetrics = WORKSPACE_METRICS.map(([label, metricId, caption]) => {
    const metrics = findJournalAnalyticsMetric(response, metricId);
    const metric = metrics.length === 1 ? metrics[0] ?? null : null;
    return {
      label,
      caption,
      value: formatJournalAnalyticsPartitionedMetric(response, metricId),
      valueColor: financialSummaryMetricColor(metricId, metric?.value),
    };
  });
  const offlinePartition = response.partitions.length === 1
    ? response.partitions[0] ?? null
    : null;
  const offlineModel = createPlatformWorkspaceOfflineViewModel({
    analyticsMetrics,
    reviewSummary,
  });
  return (
    <>
      <WorkspaceOfflineViewCapture
        accountTimezone={offlinePartition?.timezone ?? null}
        calculationVersion={`${response.resultVersion}:${response.registryVersion}`}
        coverage={platformWorkspaceOfflineCoverage(offlineModel)}
        generatedAtUtc={response.generatedAtUtc}
        model={offlineModel}
        reportingCurrency={offlinePartition?.currency ?? null}
      />
      <WorkspaceDashboard
        analyticsMetrics={analyticsMetrics}
        demoAccountSelectionRef={demoAccountSelectionRef}
        showDemoTradeTrackerInvitation={showDemoTradeTrackerInvitation}
        hasRealAcceptedExecution={onboardingStatus.hasRealAcceptedExecution}
        firstTimeMoomooConnectionPending={showFirstTimeOnboarding ? moomooConnectionPending : undefined}
        firstTimeMoomooConnected={onboardingStatus.hasActiveMoomooConnection}
        firstTimeOnboardingResult={showFirstTimeOnboarding
          ? workspaceFirstTimeOnboardingResult(queryParameters.gettingStarted)
          : undefined}
        reviewSummary={reviewSummary}
      />
    </>
  );
}
