import {
  PRODUCTION_ANALYTICS_NO_EXPORT_CHECKLIST,
  auditProductionAnalyticsSurface,
} from "./production-guardrails";
import {
  buildBehaviorTrendCards,
  buildFilteredTraderAnalyticsView,
  buildTraderAnalyticsComparison,
  buildTraderAnalyticsDrillDowns,
  buildTraderAnalyticsFilterOptions,
  buildTraderFocusQueue,
  getLatestSavedTraderAnalyticsReport,
} from "./selectors";
import {
  TRADER_RULE_TEMPLATES,
  buildDefaultTraderRuleInstances,
  evaluateTraderRules,
} from "./rule-tracker";
import { buildTraderAnalyticsReport } from "../build-trader-analytics-report";
import {
  buildSavedReportSnapshotCards,
  buildSavedTradeImportInbox,
  buildTraderAnalyticsStorageReadiness,
  buildTraderBehaviorStreaks,
  buildTraderJournalPrompts,
  buildTraderMarketContextAddOnStatus,
  buildTraderRuleComplianceSummary,
  buildTraderWeeklyReviewDashboard,
} from "./product-expansion";
import { buildTraderAnalyticsProductizationViewModel } from "./productization";
import { buildTraderProductIntelligenceViewModel } from "./product-intelligence";
import { buildTraderImprovementIntelligence } from "./trader-improvement";
import { buildTraderCoachActionLoop } from "./coach-action-loop";
import { buildTraderProductPolishViewModel } from "./product-polish";
import { buildTraderReviewHabitLoopViewModel } from "./review-habit-loop";
import { buildTraderImportTrialExperienceViewModel } from "./import-trial-experience";
import { previewSavedTradeImport } from "./import-preview";
import type {
  ProductTraderAnalyticsViewModel,
  SavedTraderAnalyticsReport,
  SavedTraderAnalyticsSummaryRef,
  SavedTraderAnalyticsRepository,
  TraderAnalyticsFilter,
  TraderAnalyticsStorageMode,
  TraderAnalyticsUserId,
} from "./types";
import type { UserTradeAnalysisRequest } from "../../trade-analysis/request/trade-analysis-request-contract";
import type { ExecutionFeedbackSummary } from "../../execution-feedback/summary/build-execution-feedback-summary";

function buildAllSavedTradesReport(
  reportHistory: SavedTraderAnalyticsReport[],
): SavedTraderAnalyticsReport | null {
  const latestReport = getLatestSavedTraderAnalyticsReport(reportHistory);

  if (!latestReport) {
    return null;
  }

  const sourceSummaries: SavedTraderAnalyticsSummaryRef[] = [];
  const seenTradeIds = new Set<string>();

  for (const report of [...reportHistory].reverse()) {
    for (const summaryRef of report.sourceSummaries) {
      if (seenTradeIds.has(summaryRef.tradeId)) {
        continue;
      }

      seenTradeIds.add(summaryRef.tradeId);
      sourceSummaries.push({
        ...summaryRef,
        requestIndex: sourceSummaries.length,
      });
    }
  }

  if (sourceSummaries.length <= latestReport.sourceTradeIds.length) {
    return latestReport;
  }

  const dates = reportHistory.flatMap((report) => [
    report.reportPeriod.startDate,
    report.reportPeriod.endDate,
  ]);
  const sortedDates = dates.filter(Boolean).sort();
  const generatedAt = latestReport.generatedAt;
  const report = buildTraderAnalyticsReport({
    source: "saved_import:all_saved_trades",
    generatedAt,
    inputMode: "execution_feedback_summaries",
    summaries: sourceSummaries.map((summaryRef, requestIndex) => ({
      requestIndex,
      summary: summaryRef.summary as ExecutionFeedbackSummary,
    })),
    requestCount: sourceSummaries.length,
  });

  return {
    id: "report:all-saved-trades",
    userId: latestReport.userId,
    accountId: latestReport.accountId,
    generatedAt,
    reportPeriod: {
      startDate: sortedDates[0] ?? latestReport.reportPeriod.startDate,
      endDate: sortedDates[sortedDates.length - 1] ?? latestReport.reportPeriod.endDate,
      label: "All saved trades",
    },
    sourceTradeIds: sourceSummaries.map((summaryRef) => summaryRef.tradeId),
    sourceSummaries,
    report,
    reviewStatus: "new",
    notes: latestReport.notes,
    sampleData: latestReport.sampleData,
  };
}

export function buildProductTraderAnalyticsViewModel(args: {
  repository: SavedTraderAnalyticsRepository;
  userId: TraderAnalyticsUserId;
  filters?: TraderAnalyticsFilter;
  storageMode?: TraderAnalyticsStorageMode;
  importRequests?: UserTradeAnalysisRequest[];
}): ProductTraderAnalyticsViewModel {
  const reportHistory = args.repository.listReports(args.userId);
  const latestReport = buildAllSavedTradesReport(reportHistory);

  if (!latestReport) {
    throw new Error("No saved trader analytics report is available.");
  }

  const priorReport = reportHistory.find(
    (report) => report.id !== latestReport.id,
  );
  const drillDowns = buildTraderAnalyticsDrillDowns(latestReport);
  const ruleInstances = buildDefaultTraderRuleInstances(args.userId);
  const ruleEvaluations = evaluateTraderRules({
    report: latestReport,
    instances: ruleInstances,
  });
  const focusQueue = buildTraderFocusQueue({
    report: latestReport,
    drillDowns,
  });
  const behaviorStreaks = buildTraderBehaviorStreaks(latestReport);
  const ruleComplianceSummary = buildTraderRuleComplianceSummary({
    report: latestReport,
    evaluations: ruleEvaluations,
  });
  const importPreview = previewSavedTradeImport(args.importRequests ?? []);
  const importInbox = buildSavedTradeImportInbox({
    batchId: "sample-import-review",
    preview: importPreview,
  });
  const trades = args.repository.listTrades(args.userId);
  const surfaceAudit = auditProductionAnalyticsSurface({
    route: "/analytics",
    hasRawJsonPanel: false,
    hasExportControl: false,
    hasDebugCopy: false,
    fixtureBacked: latestReport.sampleData,
    hasFixtureOnlyDataLabel: latestReport.sampleData,
  });

  if (!surfaceAudit.passed) {
    throw new Error(surfaceAudit.issues.join(" "));
  }

  const productization = buildTraderAnalyticsProductizationViewModel({
    userId: latestReport.userId,
    accountId: latestReport.accountId,
    trades,
    report: latestReport,
    focusQueue,
    ruleCompliance: ruleComplianceSummary,
    importPreview,
    importRequests: args.importRequests ?? [],
    storageMode: args.storageMode ?? "sample_in_memory",
  });
  const productIntelligence = buildTraderProductIntelligenceViewModel({
    currentReport: latestReport,
    previousReport: priorReport,
    trades,
    focusQueue,
    reviewWorkflow: productization.reviewWorkflow,
    ruleEvaluations,
    badges: productization.analysisConfidenceBadges,
    calibrationQueue: productization.marketContextCalibrationQueue,
  });
  const improvementIntelligence = buildTraderImprovementIntelligence({
    report: latestReport,
    trades,
    ruleEvaluations,
    productIntelligence,
  });
  const coachActionLoop = buildTraderCoachActionLoop({
    report: latestReport,
    trades,
    improvement: improvementIntelligence,
    productIntelligence,
    ruleEvaluations,
    reviewWorkflow: productization.reviewWorkflow,
  });
  const productPolish = buildTraderProductPolishViewModel({
    report: latestReport,
    importInbox,
    productization,
    productIntelligence,
    improvement: improvementIntelligence,
    coachActionLoop,
  });
  const reviewHabitLoop = buildTraderReviewHabitLoopViewModel({
    currentReport: latestReport,
    previousReport: priorReport ?? null,
    trades,
    productization,
    productIntelligence,
    improvement: improvementIntelligence,
    coachActionLoop,
    productPolish,
  });
  const importTrialExperience = buildTraderImportTrialExperienceViewModel({
    analytics: {
      userId: latestReport.userId,
      accountId: latestReport.accountId,
      latestReport,
      reportHistory,
      filterOptions: buildTraderAnalyticsFilterOptions(latestReport),
      filteredView: buildFilteredTraderAnalyticsView({
        report: latestReport,
        filters: args.filters,
      }),
      drillDowns,
      comparison: priorReport
        ? buildTraderAnalyticsComparison({
            previousReport: priorReport,
            currentReport: latestReport,
          })
        : null,
      behaviorTrends: priorReport
        ? buildBehaviorTrendCards({
            previousReport: priorReport,
            currentReport: latestReport,
          })
        : [],
      focusQueue,
      ruleTemplates: TRADER_RULE_TEMPLATES,
      ruleEvaluations,
      storageReadiness: buildTraderAnalyticsStorageReadiness({
        mode: args.storageMode ?? "sample_in_memory",
      }),
      importInbox,
      reportSnapshots: buildSavedReportSnapshotCards(reportHistory),
      weeklyReview: buildTraderWeeklyReviewDashboard({
        report: latestReport,
        focusQueue,
        ruleCompliance: ruleComplianceSummary,
        streaks: behaviorStreaks,
      }),
      behaviorStreaks,
      journalPrompts: buildTraderJournalPrompts({
        report: latestReport,
        focusQueue,
      }),
      ruleComplianceSummary,
      marketContextAddOn: buildTraderMarketContextAddOnStatus(),
      productization,
      productIntelligence,
      improvementIntelligence,
      coachActionLoop,
      productPolish,
      reviewHabitLoop,
      onboarding: {
        sampleData: latestReport.sampleData,
        title: latestReport.sampleData
          ? "Sample analytics are loaded"
          : "Your latest analytics are ready",
        summary: latestReport.sampleData
          ? "Connect or import execution data to replace this sample report with your own saved trade history."
          : "Review the latest report, drill into the source trades, and keep notes inside the app.",
        nextAction: latestReport.sampleData
          ? "Prepare saved execution trades"
          : "Review focus queue",
      },
      productionGuardrails: PRODUCTION_ANALYTICS_NO_EXPORT_CHECKLIST,
    },
  });

  return {
    userId: latestReport.userId,
    accountId: latestReport.accountId,
    latestReport,
    reportHistory,
    filterOptions: buildTraderAnalyticsFilterOptions(latestReport),
    filteredView: buildFilteredTraderAnalyticsView({
      report: latestReport,
      filters: args.filters,
    }),
    drillDowns,
    comparison: priorReport
      ? buildTraderAnalyticsComparison({
          previousReport: priorReport,
          currentReport: latestReport,
        })
      : null,
    behaviorTrends: priorReport
      ? buildBehaviorTrendCards({
          previousReport: priorReport,
          currentReport: latestReport,
        })
      : [],
    focusQueue,
    ruleTemplates: TRADER_RULE_TEMPLATES,
    ruleEvaluations,
    storageReadiness: buildTraderAnalyticsStorageReadiness({
      mode: args.storageMode ?? "sample_in_memory",
    }),
    importInbox,
    reportSnapshots: buildSavedReportSnapshotCards(reportHistory),
    weeklyReview: buildTraderWeeklyReviewDashboard({
      report: latestReport,
      focusQueue,
      ruleCompliance: ruleComplianceSummary,
      streaks: behaviorStreaks,
    }),
    behaviorStreaks,
    journalPrompts: buildTraderJournalPrompts({
      report: latestReport,
      focusQueue,
    }),
    ruleComplianceSummary,
    marketContextAddOn: buildTraderMarketContextAddOnStatus(),
    productization,
    productIntelligence,
    improvementIntelligence,
    coachActionLoop,
    productPolish,
    reviewHabitLoop,
    importTrialExperience,
    onboarding: {
      sampleData: latestReport.sampleData,
      title: latestReport.sampleData
        ? "Sample analytics are loaded"
        : "Your latest analytics are ready",
      summary: latestReport.sampleData
        ? "Connect or import execution data to replace this sample report with your own saved trade history."
        : "Review the latest report, drill into the source trades, and keep notes inside the app.",
      nextAction: latestReport.sampleData
        ? "Prepare saved execution trades"
        : "Review focus queue",
    },
    productionGuardrails: PRODUCTION_ANALYTICS_NO_EXPORT_CHECKLIST,
  };
}

export function getSavedReportOrLatest(args: {
  reports: SavedTraderAnalyticsReport[];
  reportId?: string;
}): SavedTraderAnalyticsReport | null {
  if (args.reportId) {
    return args.reports.find((report) => report.id === args.reportId) ?? null;
  }

  return getLatestSavedTraderAnalyticsReport(args.reports);
}
