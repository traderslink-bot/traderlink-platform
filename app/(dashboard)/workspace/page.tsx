import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WorkspaceOfflineViewCapture } from "@/app/pwa/workspace-offline-view-capture";
import { WorkspaceDashboard } from "./workspace-dashboard";
import { readWorkspaceTradeLibrary } from "./workspace-trade-library";
import type { WorkspaceTradeLibraryFilter, WorkspaceTradeLibraryGroup, WorkspaceTradeLibrarySort } from "./workspace-trade-library";
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
  requireTraderLinkPlatformServerComponentPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
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
  title: "Workspace | TradersLink Platform",
  description: "Trade activity, reviews, and manual trade entry.",
};

export const dynamic = "force-dynamic";

const WORKSPACE_METRICS = [
  ["P/L", "gross_pnl", "Completed trades"],
  ["Win rate", "win_rate", "Completed round trips"],
  ["Best trade", "best_trade", ""],
  ["Worst trade", "worst_trade", ""],
  ["Closed trades", "included_count", "All available history"],
] as const;

type WorkspacePeriod = "today" | "week" | "month" | "all";

function workspacePeriod(value: string | undefined): WorkspacePeriod {
  return value === "today" || value === "week" || value === "month" ? value : "all";
}

function localDate(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone, year: "numeric" }).formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function periodDates(period: WorkspacePeriod, timeZone: string): Readonly<{ endDate: string | null; startDate: string | null }> {
  if (period === "all") return Object.freeze({ endDate: null, startDate: null });
  const endDate = localDate(timeZone);
  if (period === "today") return Object.freeze({ endDate, startDate: endDate });
  if (period === "month") return Object.freeze({ endDate, startDate: `${endDate.slice(0, 8)}01` });
  const date = new Date(`${endDate}T12:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return Object.freeze({ endDate, startDate: date.toISOString().slice(0, 10) });
}

function workspaceFirstTimeOnboardingResult(
  value: string | undefined,
): WorkspaceFirstTimeOnboardingResult {
  if (value === "moomoo-failed") return value;
  return null;
}

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ endDate?: string; filter?: string; gettingStarted?: string; group?: string; period?: string; searchTicker?: string; sort?: string; startDate?: string }>;
}) {
  const queryParameters = await searchParams;
  const period = workspacePeriod(queryParameters.period);
  const filter: WorkspaceTradeLibraryFilter = queryParameters.filter === "open" || queryParameters.filter === "swing" || queryParameters.filter === "closed" ? queryParameters.filter : "all";
  const group: WorkspaceTradeLibraryGroup = queryParameters.group === "day" || queryParameters.group === "ticker" ? queryParameters.group : "none";
  const allowedSorts: readonly WorkspaceTradeLibrarySort[] = ["newest", "oldest", "position", "buy_quantity", "entry", "exit", "entry_value", "hold", "pnl_high", "pnl_low"];
  const sort: WorkspaceTradeLibrarySort = allowedSorts.includes(queryParameters.sort as WorkspaceTradeLibrarySort) ? queryParameters.sort as WorkspaceTradeLibrarySort : "newest";
  const scope = await requireTraderLinkPlatformServerComponentPageScope();
  if (!scope.activeAccountId) {
    // Preserve the existing read-before-redirect failure boundary.
    readJournalFirstExecutionOnboardingStatus(scope);
    await cookies();
    redirect("/account/trading");
  }
  const { account, customEndDate, customStartDate, onboardingStatus, periodEndDate, periodStartDate, response, reviewSummary, tradeLibrary } = await withJournalAnalyticsReportingDashboardRuntime(
    scope, ({ database, dashboard, service }) => {
      const account = database.prepare(`
SELECT base_currency, trading_timezone
FROM journal_accounts
WHERE workspace_id = ? AND account_id = ? AND status = 'active'`).get(
          scope.workspaceId,
          scope.activeAccountId,
        ) as Readonly<{ base_currency: string; trading_timezone: string }> | undefined;
      const periodDateRange = periodDates(period, account?.trading_timezone ?? "UTC");
      const customRangeValid = Boolean(
        queryParameters.startDate && queryParameters.endDate &&
        /^\d{4}-\d{2}-\d{2}$/u.test(queryParameters.startDate) &&
        /^\d{4}-\d{2}-\d{2}$/u.test(queryParameters.endDate) &&
        queryParameters.startDate <= queryParameters.endDate,
      );
      const dates = customRangeValid
        ? Object.freeze({ endDate: queryParameters.endDate!, startDate: queryParameters.startDate! })
        : periodDateRange;
      const query = buildJournalAnalyticsDashboardQuery(scope, {
        closingDateRange: dates.startDate && dates.endDate
          ? { endDate: dates.endDate, kind: "inclusive_closing_date", startDate: dates.startDate }
          : { kind: "all_available" },
        metricIds: WORKSPACE_METRICS.map(([, metricId]) => metricId),
        moneyBasis: "gross",
      });
      return Object.freeze({
        account,
        customEndDate: queryParameters.endDate ?? null,
        customStartDate: queryParameters.startDate ?? null,
        onboardingStatus: readJournalFirstExecutionOnboardingStatusFromDatabase(database, scope),
        periodEndDate: periodDateRange.endDate,
        periodStartDate: periodDateRange.startDate,
        response: service.getWorkspaceJournalAnalyticsSummary(scope, query),
        reviewSummary: readWorkspaceReviewSummary(database, scope, new Date(), dashboard),
        tradeLibrary: readWorkspaceTradeLibrary(database, scope, {
          afterCursor: null, endDate: dates.endDate, filter, followDashboardPeriod: false,
          group, searchTicker: queryParameters.searchTicker ?? "", sort, startDate: dates.startDate,
        }),
      });
    },
    { prefetchAllFactSet: period === "all" && !(queryParameters.startDate && queryParameters.endDate) },
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
        accountCurrency={account?.base_currency ?? offlinePartition?.currency ?? "USD"}
        accountTimezone={account?.trading_timezone ?? offlinePartition?.timezone ?? "UTC"}
        analyticsMetrics={analyticsMetrics}
        demoAccountSelectionRef={demoAccountSelectionRef}
        expectedAccountSelectionRef={currentJournalAccountSelectionRef(scope)}
        showDemoTradeTrackerInvitation={showDemoTradeTrackerInvitation}
        hasRealAcceptedExecution={onboardingStatus.hasRealAcceptedExecution}
        firstTimeMoomooConnectionPending={showFirstTimeOnboarding ? moomooConnectionPending : undefined}
        firstTimeMoomooConnected={onboardingStatus.hasActiveMoomooConnection}
        firstTimeOnboardingResult={showFirstTimeOnboarding
          ? workspaceFirstTimeOnboardingResult(queryParameters.gettingStarted)
          : undefined}
        reviewSummary={reviewSummary}
        offlineScopeRef={currentPlatformOfflineScopeRef(scope)}
        period={period}
        customEndDate={customEndDate}
        customStartDate={customStartDate}
        periodEndDate={periodEndDate}
        periodStartDate={periodStartDate}
        trades={tradeLibrary}
      />
    </>
  );
}
