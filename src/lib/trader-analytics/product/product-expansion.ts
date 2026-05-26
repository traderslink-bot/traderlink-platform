import type {
  ExecutionFeedbackSummary,
} from "../../execution-feedback/summary/build-execution-feedback-summary";
import type {
  ProductTraderAnalyticsTradeRow,
  SavedExecutionTrade,
  SavedReportSnapshotCard,
  SavedTradeImportInbox,
  SavedTradeImportInboxItem,
  SavedTradeImportPreview,
  SavedTraderAnalyticsReport,
  TraderAnalyticsStorageMode,
  TraderAnalyticsStorageReadiness,
  TraderBehaviorStreak,
  TraderFocusQueueItem,
  TraderJournalPrompt,
  TraderMarketContextAddOnStatus,
  TraderRuleComplianceSummary,
  TraderRuleEvaluation,
  TraderWeeklyReviewDashboard,
} from "./types";

function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function reportRowsWithTradeIds(
  report: SavedTraderAnalyticsReport,
): ProductTraderAnalyticsTradeRow[] {
  return report.report.trades.map((row) => ({
    ...row,
    tradeId:
      report.sourceSummaries.find(
        (summaryRef) => summaryRef.requestIndex === row.requestIndex,
      )?.tradeId ??
      report.sourceTradeIds[row.tradeIndex - 1] ??
      `trade-${row.tradeIndex}`,
  }));
}

function summaryHasPoint(summary: ExecutionFeedbackSummary, pointId: string) {
  return (
    summary.points.context.some((point) => point.id === pointId) ||
    summary.points.risks.some((point) => point.id === pointId) ||
    summary.points.strengths.some((point) => point.id === pointId) ||
    summary.points.primaryFocus?.id === pointId
  );
}

export function buildTraderAnalyticsStorageReadiness(args: {
  mode: TraderAnalyticsStorageMode;
}): TraderAnalyticsStorageReadiness {
  const persistent = args.mode === "authenticated_persistent";
  const localSingleUser = args.mode === "local_sqlite_single_user";
  const checks = [
    {
      id: "authenticated_user_scope",
      label: "Authenticated user ownership on every saved trade and report.",
      passed: persistent,
      required: true,
    },
    {
      id: "account_scoped_reads",
      label: "Account-scoped reads for trades, reports, rules, and notes.",
      passed: persistent,
      required: true,
    },
    {
      id: "server_persistence",
      label: "Server-side persistence for saved reports and review state.",
      passed: persistent || localSingleUser,
      required: true,
    },
    {
      id: "immutable_report_snapshots",
      label: "Generated report snapshots are preserved as in-app history.",
      passed: true,
      required: true,
    },
    {
      id: "no_end_user_export",
      label: "No production export or raw data download surface.",
      passed: true,
      required: true,
    },
  ];
  const blockerCount = checks.filter(
    (check) => check.required && !check.passed,
  ).length;

  return {
    mode: args.mode,
    label: persistent
      ? "Authenticated persistent storage"
      : localSingleUser
        ? "Local SQLite beta storage"
        : "Sample in-memory storage",
    readyForProductionPersistence: blockerCount === 0,
    blockerCount,
    checks,
    nextAction: persistent
      ? "Storage is ready for production saved analytics."
      : localSingleUser
        ? "Use for controlled single-user beta testing only; add auth and tenant isolation before multi-user production data."
        : "Choose auth and database storage before saving real customer analytics.",
  };
}

export function buildSavedTradeImportInbox(args: {
  batchId: string;
  preview: SavedTradeImportPreview;
}): SavedTradeImportInbox {
  const items: SavedTradeImportInboxItem[] = args.preview.items.map((item) => {
    const status =
      item.errorCount > 0
        ? "rejected"
        : item.warningCount > 0
          ? "needs_review"
          : "ready_to_save";

    return {
      id: `${args.batchId}:${item.requestIndex}`,
      batchId: args.batchId,
      requestIndex: item.requestIndex,
      symbol: item.symbol,
      status,
      issueCount: item.issueCount,
      errorCount: item.errorCount,
      warningCount: item.warningCount,
      messages: item.messages,
      primaryAction:
        status === "ready_to_save"
          ? "Save to analytics"
          : status === "needs_review"
            ? "Review warnings"
            : "Fix import data",
    };
  });

  return {
    batchId: args.batchId,
    totalCount: items.length,
    readyCount: items.filter((item) => item.status === "ready_to_save").length,
    needsReviewCount: items.filter((item) => item.status === "needs_review")
      .length,
    rejectedCount: items.filter((item) => item.status === "rejected").length,
    warningCount: items.reduce((total, item) => total + item.warningCount, 0),
    items,
  };
}

export function buildSavedReportSnapshotCards(
  reports: SavedTraderAnalyticsReport[],
): SavedReportSnapshotCard[] {
  return [...reports]
    .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt))
    .map((report) => ({
      id: report.id,
      label: report.reportPeriod.label,
      generatedAt: report.generatedAt,
      completedTradeCount: report.report.sampleSize.completedTradeCount,
      grossTotalRealizedPnl: report.report.pnl.grossTotalRealizedPnl,
      grossWinRate: report.report.pnl.grossWinRate,
      topRiskLabel: report.report.topRisks[0]?.label ?? null,
      topStrengthLabel: report.report.topStrengths[0]?.label ?? null,
      noteCount: report.notes.length,
      reviewStatus: report.reviewStatus,
      sampleData: report.sampleData,
    }));
}

function buildStreak(args: {
  id: string;
  label: string;
  report: SavedTraderAnalyticsReport;
  predicate: (summary: ExecutionFeedbackSummary) => boolean;
  activeSummary: (count: number) => string;
  brokenSummary: string;
}): TraderBehaviorStreak {
  const ordered = [...args.report.sourceSummaries].sort(
    (left, right) => left.requestIndex - right.requestIndex,
  );

  if (ordered.length === 0) {
    return {
      id: args.id,
      label: args.label,
      currentCount: 0,
      status: "insufficient_data",
      tradeIds: [],
      summary: "More reviewed trades are needed.",
    };
  }

  const tradeIds: string[] = [];
  for (const summaryRef of [...ordered].reverse()) {
    if (!args.predicate(summaryRef.summary)) {
      break;
    }

    tradeIds.unshift(summaryRef.tradeId);
  }

  return {
    id: args.id,
    label: args.label,
    currentCount: tradeIds.length,
    status: tradeIds.length > 0 ? "active" : "broken",
    tradeIds,
    summary:
      tradeIds.length > 0
        ? args.activeSummary(tradeIds.length)
        : args.brokenSummary,
  };
}

export function buildTraderBehaviorStreaks(
  report: SavedTraderAnalyticsReport,
): TraderBehaviorStreak[] {
  return [
    buildStreak({
      id: "no_adverse_price_adds",
      label: "Require Repair Before Adding Size",
      report,
      predicate: (summary) => summary.riskFacts.adversePriceAddCount === 0,
      activeSummary: (count) =>
        `${count} recent trade${count === 1 ? "" : "s"} without adding after price moved against the position.`,
      brokenSummary:
        "The latest reviewed trade added size after price moved against the position. Check whether the chart repaired or the add only increased exposure.",
    }),
    buildStreak({
      id: "closed_to_flat",
      label: "Closed To Flat",
      report,
      predicate: (summary) => summary.lifecycle.closedToFlat,
      activeSummary: (count) =>
        `${count} recent trade${count === 1 ? "" : "s"} closed to flat.`,
      brokenSummary: "The latest reviewed trade was left open.",
    }),
    buildStreak({
      id: "no_rapid_fire_cluster",
      label: "No Fast Execution Clusters",
      report,
      predicate: (summary) => summary.sequencing.rapidFireGapCount === 0,
      activeSummary: (count) =>
        `${count} recent trade${count === 1 ? "" : "s"} without unusually tight execution clusters.`,
      brokenSummary:
        "The latest reviewed trade had several executions close together in time.",
    }),
    buildStreak({
      id: "decisive_full_exit",
      label: "Clean Full Exit",
      report,
      predicate: (summary) => summaryHasPoint(summary, "decisive_full_exit"),
      activeSummary: (count) =>
        `${count} recent trade${count === 1 ? "" : "s"} closed cleanly to flat.`,
      brokenSummary:
        "The latest reviewed trade did not show a clean full exit.",
    }),
  ];
}

export function buildTraderRuleComplianceSummary(args: {
  report: SavedTraderAnalyticsReport;
  evaluations: TraderRuleEvaluation[];
}): TraderRuleComplianceSummary {
  const violated = args.evaluations.filter(
    (evaluation) => evaluation.violatedTradeCount > 0,
  );
  const worstViolation =
    [...violated].sort(
      (left, right) => right.violatedTradeCount - left.violatedTradeCount,
    )[0] ?? null;
  const totalViolations = args.evaluations.reduce(
    (total, evaluation) => total + evaluation.violatedTradeCount,
    0,
  );

  return {
    reportId: args.report.id,
    totalRules: args.evaluations.length,
    passingRules: args.evaluations.length - violated.length,
    violatedRules: violated.length,
    totalViolations,
    worstViolation: worstViolation
      ? {
          ruleId: worstViolation.ruleId,
          label: worstViolation.label,
          violationCount: worstViolation.violatedTradeCount,
          tradeIds: worstViolation.violationTradeIds,
        }
      : null,
    summary:
      totalViolations === 0
        ? "No rule violations in this saved report."
        : `${totalViolations} rule violation${totalViolations === 1 ? "" : "s"} across ${violated.length} rule${violated.length === 1 ? "" : "s"}.`,
  };
}

export function buildTraderJournalPrompts(args: {
  report: SavedTraderAnalyticsReport;
  focusQueue: TraderFocusQueueItem[];
  limit?: number;
}): TraderJournalPrompt[] {
  const prompts: TraderJournalPrompt[] = [];
  const primaryFocus = args.focusQueue[0];

  if (primaryFocus) {
    prompts.push({
      id: `weekly:${args.report.id}:primary-focus`,
      targetKind: "weekly_review",
      targetId: args.report.id,
      label: "Primary review",
      prompt: `What repeated decision led to ${primaryFocus.title.toLowerCase()} this period?`,
      relatedTradeIds: primaryFocus.relatedTradeIds,
    });
  }

  const topStrength = args.report.report.topStrengths[0];
  if (topStrength) {
    prompts.push({
      id: `report:${args.report.id}:top-strength`,
      targetKind: "report",
      targetId: args.report.id,
      label: "Repeatable strength",
      prompt: `What made ${topStrength.label.toLowerCase()} repeatable in this sample?`,
      relatedTradeIds: reportRowsWithTradeIds(args.report)
        .filter((row) => row.topStrength?.id === topStrength.id)
        .map((row) => row.tradeId),
    });
  }

  const topRisk = args.report.report.topRisks[0];
  if (topRisk) {
    prompts.push({
      id: `report:${args.report.id}:top-risk`,
      targetKind: "report",
      targetId: args.report.id,
      label: "Risk pattern",
      prompt: `What condition showed up before ${topRisk.label.toLowerCase()}?`,
      relatedTradeIds: reportRowsWithTradeIds(args.report)
        .filter((row) => row.topRisk?.id === topRisk.id)
        .map((row) => row.tradeId),
    });
  }

  return prompts.slice(0, args.limit ?? 4);
}

export function buildTradeJournalPrompts(args: {
  trade: SavedExecutionTrade;
  summary: ExecutionFeedbackSummary | null;
  reportRow: ProductTraderAnalyticsTradeRow | null;
}): TraderJournalPrompt[] {
  const prompts: TraderJournalPrompt[] = [];

  if (args.reportRow?.topRisk) {
    prompts.push({
      id: `trade:${args.trade.id}:top-risk`,
      targetKind: "trade",
      targetId: args.trade.id,
      label: "Risk review",
      prompt: `What decision point led to ${args.reportRow.topRisk.label.toLowerCase()}?`,
      relatedTradeIds: [args.trade.id],
    });
  }

  if (args.reportRow?.topStrength) {
    prompts.push({
      id: `trade:${args.trade.id}:top-strength`,
      targetKind: "trade",
      targetId: args.trade.id,
      label: "Strength review",
      prompt: `What did you do before ${args.reportRow.topStrength.label.toLowerCase()} that could be repeated?`,
      relatedTradeIds: [args.trade.id],
    });
  }

  if (args.summary?.lifecycle.isOpenPosition) {
    prompts.push({
      id: `trade:${args.trade.id}:open-position`,
      targetKind: "trade",
      targetId: args.trade.id,
      label: "Open-position note",
      prompt: "What was the reason for leaving shares open at the end of the execution sequence?",
      relatedTradeIds: [args.trade.id],
    });
  }

  if (prompts.length === 0) {
    prompts.push({
      id: `trade:${args.trade.id}:general-review`,
      targetKind: "trade",
      targetId: args.trade.id,
      label: "Trade review",
      prompt: "What part of this execution should be repeated or avoided next time?",
      relatedTradeIds: [args.trade.id],
    });
  }

  return prompts.slice(0, 3);
}

export function buildTraderWeeklyReviewDashboard(args: {
  report: SavedTraderAnalyticsReport;
  focusQueue: TraderFocusQueueItem[];
  ruleCompliance: TraderRuleComplianceSummary;
  streaks: TraderBehaviorStreak[];
}): TraderWeeklyReviewDashboard {
  const bestStreak =
    [...args.streaks].sort(
      (left, right) => right.currentCount - left.currentCount,
    )[0] ?? null;
  const primaryFocus = args.focusQueue[0];

  return {
    reportId: args.report.id,
    label: args.report.reportPeriod.label,
    completedTradeCount: args.report.report.sampleSize.completedTradeCount,
    grossTotalRealizedPnl: args.report.report.pnl.grossTotalRealizedPnl,
    primaryFocusTitle: primaryFocus?.title ?? null,
    topRiskLabel: args.report.report.topRisks[0]?.label ?? null,
    topStrengthLabel: args.report.report.topStrengths[0]?.label ?? null,
    ruleViolationCount: args.ruleCompliance.totalViolations,
    bestStreak,
    nextAction:
      primaryFocus?.suggestedReviewAction ??
      `Review ${args.report.reportPeriod.label} and compare it with the prior saved report.`,
  };
}

export function buildTraderMarketContextAddOnStatus(args?: {
  calibrationStatus?: TraderMarketContextAddOnStatus["calibrationStatus"];
}): TraderMarketContextAddOnStatus {
  const calibrationStatus = args?.calibrationStatus ?? "collecting_samples";

  return {
    id: "market_context_add_on",
    enabledForDisplay: true,
    calibrationStatus,
    usedForExecutionAnalytics: false,
    sources: [
      "levels-system support/resistance",
      "levels-system market structure",
      "shared VWAP and EMA context",
    ],
    summary:
      "Market context is tracked as a separate add-on and is not used by execution-only analytics.",
    nextAction:
      calibrationStatus === "ready_for_internal_review"
        ? "Review calibrated market-context reads before promotion."
        : "Collect real saved trades before market context affects user-facing conclusions.",
  };
}

export function buildStorageModeCopy(mode: TraderAnalyticsStorageMode): string {
  return mode === "authenticated_persistent"
    ? "Persistent"
    : "Sample memory";
}

export function formatWeeklyPnl(value: number): string {
  return formatSigned(value);
}
