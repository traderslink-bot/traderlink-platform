import { validateTradeAnalysisRequest } from "../trade-analysis/request/trade-analysis-request-contract";
import type { TradeAnalysisRequestIssue } from "../trade-analysis/request/trade-analysis-request-contract";
import { buildExecutionFeedbackFacts } from "./build-execution-feedback-facts";
import { buildExecutionFeedbackPoints } from "./execution-behavior-patterns";
import {
  buildExecutionFeedbackSummary,
  type ExecutionFeedbackSummary,
} from "./summary/build-execution-feedback-summary";

export type RunExecutionFeedbackStatus =
  | "completed"
  | "validation_failed"
  | "failed";

export interface RunExecutionFeedbackResult {
  contractVersion: "execution_feedback_run_v1";
  generatedAt: string;
  status: RunExecutionFeedbackStatus;
  symbol: string | null;
  validation: {
    valid: boolean;
    issues: TradeAnalysisRequestIssue[];
  };
  summary: ExecutionFeedbackSummary | null;
  failure: {
    message: string;
  } | null;
}

export interface RunExecutionFeedbackOptions {
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

function toFailureMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toWarningMessages(issues: TradeAnalysisRequestIssue[]): string[] {
  return issues
    .filter((issue) => issue.severity === "warning")
    .map((issue) => `${issue.path}: ${issue.message}`);
}

export function runExecutionFeedback(
  request: unknown,
  options: RunExecutionFeedbackOptions = {},
): RunExecutionFeedbackResult {
  const validation = validateTradeAnalysisRequest(request);
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const symbol = validation.request?.symbol ?? getRequestSymbol(request);

  if (!validation.valid || !validation.request) {
    return {
      contractVersion: "execution_feedback_run_v1",
      generatedAt,
      status: "validation_failed",
      symbol,
      validation: {
        valid: false,
        issues: validation.issues,
      },
      summary: null,
      failure: null,
    };
  }

  try {
    const facts = buildExecutionFeedbackFacts(validation.request);
    const points = buildExecutionFeedbackPoints(facts);
    const summary = buildExecutionFeedbackSummary({
      facts,
      points,
      warnings: toWarningMessages(validation.issues),
    });

    return {
      contractVersion: "execution_feedback_run_v1",
      generatedAt,
      status: "completed",
      symbol,
      validation: {
        valid: true,
        issues: validation.issues,
      },
      summary,
      failure: null,
    };
  } catch (error) {
    return {
      contractVersion: "execution_feedback_run_v1",
      generatedAt,
      status: "failed",
      symbol,
      validation: {
        valid: true,
        issues: validation.issues,
      },
      summary: null,
      failure: {
        message: toFailureMessage(error),
      },
    };
  }
}
