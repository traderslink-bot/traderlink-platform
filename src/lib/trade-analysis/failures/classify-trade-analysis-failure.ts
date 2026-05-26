import type {
  TradeAnalysisRequestIssue,
  TradeAnalysisRequestValidationResult,
} from "../request/trade-analysis-request-contract";

export type TradeAnalysisFailureCode =
  | "invalid_trade_request"
  | "unsupported_provider"
  | "provider_auth_failed"
  | "provider_rate_limited"
  | "invalid_symbol"
  | "no_candles_found"
  | "insufficient_market_context"
  | "insufficient_trade_window"
  | "future_candle_guard_triggered"
  | "shared_engine_failure"
  | "unknown_failure";

export type TradeAnalysisFailureSource =
  | "local_validation"
  | "provider"
  | "levels_system"
  | "unknown";

export interface ClassifiedTradeAnalysisFailure {
  code: TradeAnalysisFailureCode;
  source: TradeAnalysisFailureSource;
  title: string;
  message: string;
  retryable: boolean;
  userAction: string;
  rawMessage: string;
}

const FAILURE_DEFINITIONS: Record<
  TradeAnalysisFailureCode,
  Omit<ClassifiedTradeAnalysisFailure, "rawMessage" | "message">
> = {
  invalid_trade_request: {
    code: "invalid_trade_request",
    source: "local_validation",
    title: "Invalid trade request",
    retryable: false,
    userAction: "Fix the trade request fields before running analysis.",
  },
  unsupported_provider: {
    code: "unsupported_provider",
    source: "local_validation",
    title: "Unsupported candle provider",
    retryable: false,
    userAction: "Use ibkr or stub as the provider.",
  },
  provider_auth_failed: {
    code: "provider_auth_failed",
    source: "provider",
    title: "Provider authentication failed",
    retryable: true,
    userAction: "Check the provider session, credentials, and connection state.",
  },
  provider_rate_limited: {
    code: "provider_rate_limited",
    source: "provider",
    title: "Provider rate limit",
    retryable: true,
    userAction: "Wait and retry with fewer symbols or a smaller batch.",
  },
  invalid_symbol: {
    code: "invalid_symbol",
    source: "provider",
    title: "Invalid or unavailable symbol",
    retryable: false,
    userAction: "Check the ticker symbol and provider contract mapping.",
  },
  no_candles_found: {
    code: "no_candles_found",
    source: "provider",
    title: "No candles found",
    retryable: false,
    userAction: "Check the symbol, session date, provider, and market hours.",
  },
  insufficient_market_context: {
    code: "insufficient_market_context",
    source: "levels_system",
    title: "Insufficient market context",
    retryable: false,
    userAction:
      "Use execution/P&L-only review unless the provider can supply enough historical daily/4h candles.",
  },
  insufficient_trade_window: {
    code: "insufficient_trade_window",
    source: "levels_system",
    title: "Insufficient trade-window candles",
    retryable: false,
    userAction:
      "Review the trade timestamps, session date, and requested candle window.",
  },
  future_candle_guard_triggered: {
    code: "future_candle_guard_triggered",
    source: "levels_system",
    title: "Future-candle guard triggered",
    retryable: false,
    userAction:
      "Check asOfTimestamp and make sure the request is not asking for future candles.",
  },
  shared_engine_failure: {
    code: "shared_engine_failure",
    source: "levels_system",
    title: "Shared engine failure",
    retryable: false,
    userAction:
      "Review the levels-system diagnostics and add a handoff note only if this repeats on real data.",
  },
  unknown_failure: {
    code: "unknown_failure",
    source: "unknown",
    title: "Unknown analysis failure",
    retryable: false,
    userAction: "Inspect the raw error and add a classifier if this repeats.",
  },
};

function normalizeMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function buildFailure(
  code: TradeAnalysisFailureCode,
  rawMessage: string,
): ClassifiedTradeAnalysisFailure {
  const definition = FAILURE_DEFINITIONS[code];

  return {
    ...definition,
    rawMessage,
    message: rawMessage || definition.title,
  };
}

function hasIssue(
  issues: TradeAnalysisRequestIssue[],
  code: TradeAnalysisRequestIssue["code"],
): boolean {
  return issues.some((issue) => issue.code === code);
}

export function classifyTradeAnalysisValidationFailure(
  validation: TradeAnalysisRequestValidationResult,
): ClassifiedTradeAnalysisFailure | null {
  if (validation.valid) {
    return null;
  }

  const errorMessages = validation.issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join(" | ");

  if (hasIssue(validation.issues, "unsupported_provider")) {
    return buildFailure("unsupported_provider", errorMessages);
  }

  return buildFailure("invalid_trade_request", errorMessages);
}

export function classifyTradeAnalysisFailure(
  error: unknown,
): ClassifiedTradeAnalysisFailure {
  const rawMessage = normalizeMessage(error);
  const message = rawMessage.toLowerCase();

  if (
    message.includes("unsupported levels_system_provider") ||
    message.includes("unsupported provider") ||
    message.includes("expected ibkr or stub")
  ) {
    return buildFailure("unsupported_provider", rawMessage);
  }

  if (
    message.includes("auth") ||
    message.includes("unauthorized") ||
    message.includes("forbidden") ||
    message.includes("login") ||
    message.includes("permission denied")
  ) {
    return buildFailure("provider_auth_failed", rawMessage);
  }

  if (message.includes("rate limit") || message.includes("429")) {
    return buildFailure("provider_rate_limited", rawMessage);
  }

  if (
    message.includes("invalid symbol") ||
    message.includes("unknown symbol") ||
    message.includes("contract not found") ||
    message.includes("no security definition")
  ) {
    return buildFailure("invalid_symbol", rawMessage);
  }

  if (
    message.includes("daily and 4h candles are required") ||
    message.includes("requires daily candles to build support/resistance context") ||
    message.includes("requires 4h candles to build support/resistance context")
  ) {
    return buildFailure("insufficient_market_context", rawMessage);
  }

  if (
    message.includes("no candles") ||
    message.includes("no bars") ||
    message.includes("empty candle") ||
    message.includes("empty bars") ||
    message.includes("durable candle warehouse miss")
  ) {
    return buildFailure("no_candles_found", rawMessage);
  }

  if (
    message.includes("missing pre-trade") ||
    message.includes("missing trade candle") ||
    message.includes("missing post-trade") ||
    message.includes("insufficient candle") ||
    message.includes("not enough candle")
  ) {
    return buildFailure("insufficient_trade_window", rawMessage);
  }

  if (
    message.includes("future-candle") ||
    message.includes("future candle") ||
    message.includes("asoftimestamp") ||
    message.includes("as-of timestamp")
  ) {
    return buildFailure("future_candle_guard_triggered", rawMessage);
  }

  if (message.includes("levels-system") || message.includes("shared engine")) {
    return buildFailure("shared_engine_failure", rawMessage);
  }

  return buildFailure("unknown_failure", rawMessage);
}
