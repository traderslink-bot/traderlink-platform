import {
  runBatchExecutionFeedback,
  type BatchExecutionFeedbackItem,
} from "../execution-feedback/batch/run-execution-feedback-batch";
import type { ExecutionFeedbackSummary } from "../execution-feedback/summary/build-execution-feedback-summary";
import { parseTradeAnalysisRequestDocument } from "../trade-analysis/request/trade-analysis-request-contract";
import { buildTraderAnalyticsReport } from "./build-trader-analytics-report";
import type {
  TraderAnalyticsCompletedSummaryInput,
  TraderAnalyticsReport,
  TraderAnalyticsReportFailure,
  TraderAnalyticsReportSummaryInput,
} from "./types/trader-analytics-report";

export interface ParsedTraderAnalyticsReportDocument {
  mode: "raw_trade_requests" | "execution_feedback_summaries";
  requests?: unknown[];
  summaries?: TraderAnalyticsReportSummaryInput[];
}

export interface RunTraderAnalyticsReportArgs {
  source: string;
  generatedAt?: string;
  validateOnly?: boolean;
  document?: unknown;
  requests?: unknown[];
  summaries?: TraderAnalyticsReportSummaryInput[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isExecutionFeedbackSummary(
  value: unknown,
): value is ExecutionFeedbackSummary {
  return (
    isRecord(value) &&
    value.contractVersion === "execution_feedback_summary_v1" &&
    value.dataSource === "executions_only" &&
    typeof value.symbol === "string" &&
    typeof value.tradeDirection === "string" &&
    isRecord(value.lifecycle) &&
    isRecord(value.executionOnlyPnl) &&
    isRecord(value.points)
  );
}

function normalizeSummaryDocumentItem(
  value: unknown,
  index: number,
): TraderAnalyticsReportSummaryInput {
  if (isExecutionFeedbackSummary(value)) {
    return value;
  }

  if (
    isRecord(value) &&
    (value.requestIndex === undefined || typeof value.requestIndex === "number") &&
    isExecutionFeedbackSummary(value.summary)
  ) {
    return {
      requestIndex: value.requestIndex ?? index,
      summary: value.summary,
    };
  }

  throw new Error(
    "summaries must contain execution_feedback_summary_v1 objects or { requestIndex, summary } objects.",
  );
}

export function parseTraderAnalyticsReportDocument(
  document: unknown,
): ParsedTraderAnalyticsReportDocument {
  if (Array.isArray(document) && document.every(isExecutionFeedbackSummary)) {
    return {
      mode: "execution_feedback_summaries",
      summaries: document,
    };
  }

  if (isRecord(document) && Array.isArray(document.summaries)) {
    return {
      mode: "execution_feedback_summaries",
      summaries: document.summaries.map(normalizeSummaryDocumentItem),
    };
  }

  return {
    mode: "raw_trade_requests",
    requests: parseTradeAnalysisRequestDocument(document).requests,
  };
}

function toFailure(item: BatchExecutionFeedbackItem): TraderAnalyticsReportFailure | null {
  if (!item.failure) {
    return null;
  }

  return {
    requestIndex: item.requestIndex,
    symbol: item.symbol,
    code: item.failure.code,
    message: item.failure.message,
    source: item.failure.source,
  };
}

function completedSummaryInput(
  item: BatchExecutionFeedbackItem,
): TraderAnalyticsCompletedSummaryInput | null {
  if (item.status !== "completed" || !item.summary) {
    return null;
  }

  return {
    requestIndex: item.requestIndex,
    summary: item.summary,
  };
}

function countValidationWarnings(items: BatchExecutionFeedbackItem[]): number {
  return items.reduce(
    (total, item) =>
      total +
      item.validation.issues.filter((issue) => issue.severity === "warning")
        .length,
    0,
  );
}

export function runTraderAnalyticsReport(
  args: RunTraderAnalyticsReportArgs,
): TraderAnalyticsReport {
  if (args.summaries) {
    return buildTraderAnalyticsReport({
      source: args.source,
      generatedAt: args.generatedAt,
      inputMode: "execution_feedback_summaries",
      summaries: args.summaries,
      requestCount: args.summaries.length,
    });
  }

  const parsed = args.document
    ? parseTraderAnalyticsReportDocument(args.document)
    : {
        mode: "raw_trade_requests" as const,
        requests: args.requests ?? [],
      };

  if (parsed.mode === "execution_feedback_summaries") {
    return buildTraderAnalyticsReport({
      source: args.source,
      generatedAt: args.generatedAt,
      inputMode: "execution_feedback_summaries",
      summaries: parsed.summaries ?? [],
      requestCount: parsed.summaries?.length ?? 0,
    });
  }

  const batch = runBatchExecutionFeedback({
    source: args.source,
    requests: parsed.requests ?? [],
    validateOnly: args.validateOnly,
    generatedAt: args.generatedAt,
  });
  const completedSummaries = batch.items
    .map(completedSummaryInput)
    .filter(
      (item): item is TraderAnalyticsCompletedSummaryInput => item !== null,
    );
  const failures = batch.items
    .map(toFailure)
    .filter((failure): failure is TraderAnalyticsReportFailure => failure !== null);

  return buildTraderAnalyticsReport({
    source: args.source,
    generatedAt: batch.generatedAt,
    inputMode: "raw_trade_requests",
    summaries: completedSummaries,
    requestCount: batch.totals.requests,
    failedTradeCount: batch.totals.failed,
    validatedOnlyCount: batch.items.filter((item) => item.status === "validated")
      .length,
    validationWarningCount: countValidationWarnings(batch.items),
    failures,
    failureCounts: batch.failureCounts,
    validateOnly: batch.validateOnly,
  });
}
