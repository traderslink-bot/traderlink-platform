import {
  validateTradeAnalysisRequest,
  type TradeAnalysisRequestIssue,
} from "../../trade-analysis/request/trade-analysis-request-contract";
import {
  runExecutionFeedback,
  type RunExecutionFeedbackResult,
} from "../run-execution-feedback";
import type { ExecutionFeedbackSummary } from "../summary/build-execution-feedback-summary";

export type BatchExecutionFeedbackItemStatus =
  | "validated"
  | "completed"
  | "failed";

export interface BatchExecutionFeedbackFailure {
  code: "invalid_trade_request" | "execution_feedback_failed";
  message: string;
  source: "local_validation" | "execution_feedback";
}

export interface BatchExecutionFeedbackItem {
  requestIndex: number;
  status: BatchExecutionFeedbackItemStatus;
  symbol: string | null;
  validation: {
    valid: boolean;
    issues: TradeAnalysisRequestIssue[];
  };
  failure: BatchExecutionFeedbackFailure | null;
  summary: ExecutionFeedbackSummary | null;
}

export interface BatchExecutionFeedbackResult {
  contractVersion: "batch_execution_feedback_v1";
  source: string;
  generatedAt: string;
  validateOnly: boolean;
  totals: {
    requests: number;
    validated: number;
    completed: number;
    failed: number;
    warnings: number;
  };
  pointCounts: {
    context: number;
    strengths: number;
    risks: number;
    primaryFocusIds: Record<string, number>;
    riskIds: Record<string, number>;
    strengthIds: Record<string, number>;
  };
  failureCounts: Record<string, number>;
  items: BatchExecutionFeedbackItem[];
}

export interface RunBatchExecutionFeedbackArgs {
  source: string;
  requests: unknown[];
  validateOnly?: boolean;
  generatedAt?: string;
}

function getRequestSymbol(request: unknown): string | null {
  if (
    typeof request === "object" &&
    request !== null &&
    "symbol" in request &&
    typeof request.symbol === "string"
  ) {
    const symbol = request.symbol.trim().toUpperCase();

    return symbol || null;
  }

  return null;
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function validationFailureMessage(issues: TradeAnalysisRequestIssue[]): string {
  return issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join(" | ");
}

function toCompletedItem(args: {
  requestIndex: number;
  result: RunExecutionFeedbackResult;
}): BatchExecutionFeedbackItem {
  return {
    requestIndex: args.requestIndex,
    status: "completed",
    symbol: args.result.symbol,
    validation: args.result.validation,
    failure: null,
    summary: args.result.summary,
  };
}

function buildResult(args: {
  source: string;
  generatedAt: string;
  validateOnly: boolean;
  items: BatchExecutionFeedbackItem[];
}): BatchExecutionFeedbackResult {
  const primaryFocusIds: Record<string, number> = {};
  const riskIds: Record<string, number> = {};
  const strengthIds: Record<string, number> = {};
  const failureCounts: Record<string, number> = {};

  for (const item of args.items) {
    if (item.failure) {
      increment(failureCounts, item.failure.code);
    }

    const primaryFocusId = item.summary?.points.primaryFocus?.id;

    if (primaryFocusId) {
      increment(primaryFocusIds, primaryFocusId);
    }

    for (const risk of item.summary?.points.risks ?? []) {
      increment(riskIds, risk.id);
    }

    for (const strength of item.summary?.points.strengths ?? []) {
      increment(strengthIds, strength.id);
    }
  }

  return {
    contractVersion: "batch_execution_feedback_v1",
    source: args.source,
    generatedAt: args.generatedAt,
    validateOnly: args.validateOnly,
    totals: {
      requests: args.items.length,
      validated: args.items.filter((item) => item.validation.valid).length,
      completed: args.items.filter((item) => item.status === "completed")
        .length,
      failed: args.items.filter((item) => item.status === "failed").length,
      warnings: args.items.reduce(
        (total, item) =>
          total +
          item.validation.issues.filter((issue) => issue.severity === "warning")
            .length +
          (item.summary?.warnings.length ?? 0),
        0,
      ),
    },
    pointCounts: {
      context: args.items.reduce(
        (total, item) => total + (item.summary?.points.context.length ?? 0),
        0,
      ),
      strengths: args.items.reduce(
        (total, item) => total + (item.summary?.points.strengths.length ?? 0),
        0,
      ),
      risks: args.items.reduce(
        (total, item) => total + (item.summary?.points.risks.length ?? 0),
        0,
      ),
      primaryFocusIds,
      riskIds,
      strengthIds,
    },
    failureCounts,
    items: args.items,
  };
}

export function runBatchExecutionFeedback(
  args: RunBatchExecutionFeedbackArgs,
): BatchExecutionFeedbackResult {
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const validateOnly = args.validateOnly ?? false;
  const items: BatchExecutionFeedbackItem[] = [];

  for (const [requestIndex, request] of args.requests.entries()) {
    const validation = validateTradeAnalysisRequest(request);
    const symbol = validation.request?.symbol ?? getRequestSymbol(request);

    if (!validation.valid || !validation.request) {
      items.push({
        requestIndex,
        status: "failed",
        symbol,
        validation: {
          valid: false,
          issues: validation.issues,
        },
        failure: {
          code: "invalid_trade_request",
          message: validationFailureMessage(validation.issues),
          source: "local_validation",
        },
        summary: null,
      });
      continue;
    }

    if (validateOnly) {
      items.push({
        requestIndex,
        status: "validated",
        symbol,
        validation: {
          valid: true,
          issues: validation.issues,
        },
        failure: null,
        summary: null,
      });
      continue;
    }

    const result = runExecutionFeedback(request, { generatedAt });

    if (result.status === "completed") {
      items.push(toCompletedItem({ requestIndex, result }));
      continue;
    }

    items.push({
      requestIndex,
      status: "failed",
      symbol: result.symbol,
      validation: result.validation,
      failure: {
        code:
          result.status === "validation_failed"
            ? "invalid_trade_request"
            : "execution_feedback_failed",
        message:
          result.failure?.message ??
          validationFailureMessage(result.validation.issues),
        source:
          result.status === "validation_failed"
            ? "local_validation"
            : "execution_feedback",
      },
      summary: null,
    });
  }

  return buildResult({
    source: args.source,
    generatedAt,
    validateOnly,
    items,
  });
}
