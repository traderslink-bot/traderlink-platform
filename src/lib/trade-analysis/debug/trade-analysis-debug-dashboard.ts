import type { LevelsSystemRuntimeConfig } from "../../support-resistance/levels-system-runtime-options";
import {
  runBatchTradeAnalysis,
  type BatchTradeAnalysisItem,
} from "../batch/run-trade-analysis-batch";
import {
  type ClassifiedTradeAnalysisFailure,
} from "../failures/classify-trade-analysis-failure";
import type { TradeAnalysisRequestIssue } from "../request/trade-analysis-request-contract";
import type { TradeAnalysisSummary } from "../summary/build-trade-analysis-summary";

export type TradeAnalysisDebugDashboardItemStatus =
  | "validated"
  | "analysis_completed"
  | "analysis_failed";

export interface TradeAnalysisDebugDashboardItem {
  requestIndex: number;
  status: TradeAnalysisDebugDashboardItemStatus;
  symbol: string | null;
  validation: {
    valid: boolean;
    issues: TradeAnalysisRequestIssue[];
  };
  failure: ClassifiedTradeAnalysisFailure | null;
  summary: TradeAnalysisSummary | null;
}

export interface TradeAnalysisDebugDashboard {
  contractVersion: "trade_analysis_debug_dashboard_v1";
  source: string;
  generatedAt: string;
  validateOnly: boolean;
  requestCount: number;
  completedCount: number;
  failedCount: number;
  items: TradeAnalysisDebugDashboardItem[];
}

export interface BuildTradeAnalysisDebugDashboardArgs {
  source: string;
  requests: unknown[];
  levelsSystem?: LevelsSystemRuntimeConfig;
  validateOnly?: boolean;
  generatedAt?: string;
}

function mapBatchStatusToDebugStatus(
  status: BatchTradeAnalysisItem["status"],
): TradeAnalysisDebugDashboardItemStatus {
  switch (status) {
    case "completed":
      return "analysis_completed";
    case "failed":
      return "analysis_failed";
    case "validated":
      return "validated";
  }
}

function mapBatchItemToDebugItem(
  item: BatchTradeAnalysisItem,
): TradeAnalysisDebugDashboardItem {
  return {
    requestIndex: item.requestIndex,
    status: mapBatchStatusToDebugStatus(item.status),
    symbol: item.symbol,
    validation: item.validation,
    failure: item.failure,
    summary: item.summary,
  };
}

export async function buildTradeAnalysisDebugDashboard(
  args: BuildTradeAnalysisDebugDashboardArgs,
): Promise<TradeAnalysisDebugDashboard> {
  const batch = await runBatchTradeAnalysis({
    source: args.source,
    requests: args.requests,
    levelsSystem: args.levelsSystem,
    validateOnly: args.validateOnly,
    generatedAt: args.generatedAt,
  });
  const items = batch.items.map(mapBatchItemToDebugItem);

  return {
    contractVersion: "trade_analysis_debug_dashboard_v1",
    source: batch.source,
    generatedAt: batch.generatedAt,
    validateOnly: batch.validateOnly,
    requestCount: batch.totals.requests,
    completedCount: batch.totals.completed,
    failedCount: batch.totals.failed,
    items,
  };
}

function formatIssue(issue: TradeAnalysisRequestIssue): string {
  return `  - ${issue.severity.toUpperCase()} ${issue.code} at ${issue.path}: ${issue.message}`;
}

function formatPatterns(summary: TradeAnalysisSummary): string[] {
  const top = summary.patterns.topAnchorPattern;

  return [
    `  - detected: ${summary.patterns.detectedCount}`,
    `  - normalized: ${summary.patterns.normalizedCount}`,
    `  - top anchor: ${top ? `${top.patternId} (${top.family})` : "none"}`,
    `  - primary: ${
      summary.patterns.primaryPatterns.length > 0
        ? summary.patterns.primaryPatterns
            .map((pattern) => pattern.patternId)
            .join(", ")
        : "none"
    }`,
  ];
}

function formatDecisionReview(summary: TradeAnalysisSummary): string[] {
  const review = summary.decisionReview;
  const primaryInsights = review.insights.slice(0, 6);

  return [
    `  - score: ${review.score.overallScore} (${review.score.scoreBand}, ${review.score.confidence})`,
    `  - coaching: ${review.coaching.headline}`,
    `  - fix first: ${review.coaching.fixFirstBehaviorId ?? "none"}`,
    `  - market context: ${review.marketContext.source}`,
    `  - VWAP/EMA feedback: ${review.generatedFrom.vwapEmaFeedbackUsed ? "used" : "disabled"}`,
    ...primaryInsights.map(
      (insight) =>
        `  - ${insight.tone}/${insight.category}: ${insight.title} - ${insight.summary}`,
    ),
  ];
}

function formatItem(item: TradeAnalysisDebugDashboardItem): string[] {
  const lines = [
    `## Request ${item.requestIndex}: ${item.symbol ?? "unknown"}`,
    "",
    `- status: ${item.status}`,
    `- validation: ${item.validation.valid ? "valid" : "invalid"}`,
  ];

  if (item.validation.issues.length > 0) {
    lines.push("", "### Validation Issues", "", ...item.validation.issues.map(formatIssue));
  }

  if (item.failure) {
    lines.push(
      "",
      "### Failure",
      "",
      `- code: ${item.failure.code}`,
      `- source: ${item.failure.source}`,
      `- retryable: ${item.failure.retryable}`,
      `- title: ${item.failure.title}`,
      `- action: ${item.failure.userAction}`,
      `- raw: ${item.failure.rawMessage}`,
    );
  }

  if (item.summary) {
    const { summary } = item;

    lines.push(
      "",
      "### Summary",
      "",
      `- session: ${summary.sessionDate} ${summary.sessionBucket}`,
      `- direction: ${summary.tradeDirection}`,
      `- candle source: ${summary.candleSource}`,
      `- support/resistance: ${summary.supportResistance.supportCount}/${summary.supportResistance.resistanceCount}`,
      "- dynamic benchmarks: disabled for trader feedback",
      `- market structure: ${
        summary.marketStructure.observed
          ? `${summary.marketStructure.state} / ${summary.marketStructure.trendDirection} / ${summary.marketStructure.confidenceLabel}`
          : "missing"
      }`,
      `- market structure used for scoring: ${summary.marketStructure.usedForScoring}`,
      "",
      "### Patterns",
      "",
      ...formatPatterns(summary),
      "",
      "### Decision Review",
      "",
      ...formatDecisionReview(summary),
    );

    if (summary.warnings.length > 0) {
      lines.push("", "### Engine Messages", "");
      lines.push(...summary.warnings.map((warning) => `  - ${warning}`));
    }
  }

  lines.push("");

  return lines;
}

export function formatTradeAnalysisDebugDashboardMarkdown(
  dashboard: TradeAnalysisDebugDashboard,
): string {
  return [
    "# Trade Analysis Debug Dashboard",
    "",
    "## Run",
    "",
    `- source: ${dashboard.source}`,
    `- generated: ${dashboard.generatedAt}`,
    `- validate only: ${dashboard.validateOnly}`,
    `- requests: ${dashboard.requestCount}`,
    `- completed: ${dashboard.completedCount}`,
    `- failed: ${dashboard.failedCount}`,
    "",
    ...dashboard.items.flatMap(formatItem),
  ].join("\n");
}
