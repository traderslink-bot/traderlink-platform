import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WorkspaceOfflineViewCapture } from "@/app/pwa/workspace-offline-view-capture";
import { recoverLegacyDemoWorkspaceTradeLibraryProjection } from "@/src/modules/journal-analytics/server/workspace-trade-library-demo-projection-recovery";
import { WorkspaceDashboard } from "./workspace-dashboard";
import { readRuleResults, workspaceRuleResultsCard } from "../rules/results/rule-results-data";
import { readWorkspaceTradeLibrary } from "./workspace-trade-library";
import type { WorkspaceTradeLibraryFilter, WorkspaceTradeLibraryGroup, WorkspaceTradeLibrarySort } from "./workspace-trade-library";
import { readWorkspaceReviewSummary } from "./workspace-review-summary";
import { readWorkspaceTopTickersCard } from "./workspace-top-tickers-card";
import { JournalWorkspaceRuleResultsCardPreferenceService } from "@/src/modules/journal/server/rules/journal-workspace-rule-results-card-preference";
import { JournalWorkspacePrScannerCardPreferenceService } from "@/src/modules/journal/server/news/journal-workspace-pr-scanner-card-preference";
import { JournalWorkspaceTopTickersCardPreferenceService } from "@/src/modules/journal/server/workspace/journal-workspace-top-tickers-card-preference";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
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
  requireTraderLinkPlatformServerComponentPageIdentity,
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
import { readJournalDemoScopeClockFromDatabase } from "@/src/modules/journal/server/demo/journal-demo-scope-clock";

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

function workspaceMetricId(
  metricId: (typeof WORKSPACE_METRICS)[number][1],
  moneyBasis: "gross" | "net",
): string {
  return metricId === "gross_pnl" && moneyBasis === "net" ? "net_pnl" : metricId;
}

type WorkspacePeriod = "today" | "week" | "month" | "all";

function workspacePeriod(value: string | undefined): WorkspacePeriod {
  return value === "today" || value === "week" || value === "month" ? value : "all";
}

function localDate(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone, year: "numeric" }).formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

function periodDates(
  period: WorkspacePeriod,
  timeZone: string,
  currentDate?: string,
): Readonly<{ endDate: string | null; startDate: string | null }> {
  if (period === "all") return Object.freeze({ endDate: null, startDate: null });
  const endDate = currentDate ?? localDate(timeZone);
  if (period === "today") return Object.freeze({ endDate, startDate: endDate });
  if (period === "month") return Object.freeze({ endDate, startDate: `${endDate.slice(0, 8)}01` });
  const date = new Date(`${endDate}T12:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return Object.freeze({ endDate, startDate: date.toISOString().slice(0, 10) });
}

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ endDate?: string; filter?: string; gettingStarted?: string; group?: string; period?: string; searchTicker?: string; sort?: string; startDate?: string }>;
}) {
  const queryParameters = await searchParams;
  const period = workspacePeriod(queryParameters.period);
  const filter: WorkspaceTradeLibraryFilter = queryParameters.filter === "open" || queryParameters.filter === "swing" || queryParameters.filter === "closed" || queryParameters.filter === "fees_not_entered" ? queryParameters.filter : "all";
  const group: WorkspaceTradeLibraryGroup = queryParameters.group === "day" || queryParameters.group === "ticker" ? queryParameters.group : "none";
  const allowedSorts: readonly WorkspaceTradeLibrarySort[] = ["newest", "oldest", "ticker_asc", "ticker_desc", "direction_asc", "direction_desc", "status_asc", "status_desc", "position", "position_asc", "buy_quantity", "buy_quantity_asc", "entry", "entry_asc", "exit", "exit_asc", "entry_value", "entry_value_asc", "hold", "hold_asc", "pnl_high", "pnl_low"];
  const sort: WorkspaceTradeLibrarySort = allowedSorts.includes(queryParameters.sort as WorkspaceTradeLibrarySort) ? queryParameters.sort as WorkspaceTradeLibrarySort : "newest";
  const identity = await requireTraderLinkPlatformServerComponentPageIdentity();
  const scope = identity.scope;
  if (!scope.activeAccountId) {
    // Preserve the existing read-before-redirect failure boundary.
    readJournalFirstExecutionOnboardingStatus(scope);
    await cookies();
    redirect("/account/trading");
  }
  recoverLegacyDemoWorkspaceTradeLibraryProjection(scope);
  const { account, customEndDate, customStartDate, logicalClosedTradeCount, onboardingStatus, periodEndDate, periodStartDate, pnlReportingBasis, prScannerCardPreference, response, reviewSummary, ruleResultsCardPreference, ruleResultsEndDate, ruleResultsStartDate, topTickersCard, topTickersCardPreference, tradeLibrary } = await withJournalAnalyticsReportingDashboardRuntime(
    scope, ({ database, dashboard, pnlReportingBasis, service }) => {
      const demoClock = readJournalDemoScopeClockFromDatabase(database, scope);
      const account = database.prepare(`
SELECT base_currency, trading_timezone
FROM journal_accounts
WHERE workspace_id = ? AND account_id = ? AND status = 'active'`).get(
          scope.workspaceId,
          scope.activeAccountId,
        ) as Readonly<{ base_currency: string; trading_timezone: string }> | undefined;
      const periodDateRange = periodDates(
        period,
        account?.trading_timezone ?? "UTC",
        demoClock?.today,
      );
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
        metricIds: WORKSPACE_METRICS.map(([, metricId]) =>
          workspaceMetricId(metricId, pnlReportingBasis)),
        moneyBasis: pnlReportingBasis,
      });
      return Object.freeze({
        account,
        customEndDate: queryParameters.endDate ?? null,
        customStartDate: queryParameters.startDate ?? null,
        onboardingStatus: readJournalFirstExecutionOnboardingStatusFromDatabase(database, scope),
        periodEndDate: periodDateRange.endDate,
        periodStartDate: periodDateRange.startDate,
        pnlReportingBasis,
        prScannerCardPreference: new JournalWorkspacePrScannerCardPreferenceService(database).read(scope),
        ruleResultsCardPreference: new JournalWorkspaceRuleResultsCardPreferenceService(database).read(scope),
        topTickersCardPreference: new JournalWorkspaceTopTickersCardPreferenceService(database).read(scope),
        ruleResultsEndDate: dates.endDate,
        ruleResultsStartDate: dates.startDate,
        response: service.getWorkspaceJournalAnalyticsSummary(scope, query),
        reviewSummary: readWorkspaceReviewSummary(
          database,
          scope,
          new Date(),
          dashboard,
          demoClock?.today,
        ),
        topTickersCard: readWorkspaceTopTickersCard(database, scope, {
          endDate: dates.endDate,
          moneyBasis: pnlReportingBasis,
          startDate: dates.startDate,
        }),
        tradeLibrary: readWorkspaceTradeLibrary(database, scope, {
          afterCursor: null, endDate: dates.endDate, filter, followDashboardPeriod: false,
          group, searchTicker: queryParameters.searchTicker ?? "", sort, startDate: dates.startDate,
        }),
        logicalClosedTradeCount: readWorkspaceTradeLibrary(database, scope, {
          afterCursor: null, endDate: dates.endDate, filter: "closed", followDashboardPeriod: false,
          group: "none", searchTicker: "", sort: "newest", startDate: dates.startDate,
        }).totalRowCount,
      });
    },
    { prefetchAllFactSet: period === "all" && !(queryParameters.startDate && queryParameters.endDate) },
  );
  const demoAccountSelectionRef = onboardingStatus.activeAccountIsDemo
    ? currentJournalAccountSelectionRef(scope)
    : undefined;
  const showDemoTradeTrackerInvitation = !onboardingStatus.activeAccountIsDemo &&
    onboardingStatus.demoLifecycleState !== "cleared";
  const analyticsMetrics = WORKSPACE_METRICS.map(([label, metricId, caption]) => {
    const selectedMetricId = workspaceMetricId(metricId, pnlReportingBasis);
    const metrics = findJournalAnalyticsMetric(response, selectedMetricId);
    const metric = metrics.length === 1 ? metrics[0] ?? null : null;
    return {
      label,
      caption,
      value: label === "Closed trades"
        ? String(logicalClosedTradeCount)
        : formatJournalAnalyticsPartitionedMetric(response, selectedMetricId),
      valueColor: financialSummaryMetricColor(selectedMetricId, metric?.value),
      tradeDetailsRoundTripId: label === "Best trade"
        ? topTickersCard.bestTradeRoundTripId
        : label === "Worst trade" ? topTickersCard.worstTradeRoundTripId : null,
    };
  });
  const offlinePartition = response.partitions.length === 1
    ? response.partitions[0] ?? null
    : null;
  const offlineModel = createPlatformWorkspaceOfflineViewModel({
    analyticsMetrics,
    reviewSummary,
  });
  const ruleResultsCard = ruleResultsCardPreference.showInWorkspace
    ? workspaceRuleResultsCard(await readRuleResults(scope, {
      endDate: ruleResultsEndDate,
      startDate: ruleResultsStartDate,
    }))
    : undefined;
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
        newsScannerAvailable={hasPressReleaseDashboardAccess(identity)}
        prScannerCardPreference={prScannerCardPreference}
        reviewSummary={reviewSummary}
        offlineScopeRef={currentPlatformOfflineScopeRef(scope)}
        period={period}
        ruleResultsCard={ruleResultsCard}
        ruleResultsCardPreference={ruleResultsCardPreference}
        topTickersCard={topTickersCard}
        topTickersCardPreference={topTickersCardPreference}
        customEndDate={customEndDate}
        customStartDate={customStartDate}
        periodEndDate={periodEndDate}
        periodStartDate={periodStartDate}
        trades={tradeLibrary}
      />
    </>
  );
}
