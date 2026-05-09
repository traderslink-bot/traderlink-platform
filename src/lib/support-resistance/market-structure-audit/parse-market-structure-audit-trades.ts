import type {
  TradeAnalysisEngineArgs,
  TradeAnalysisEngineLevelsSystemCandleArgs,
} from "../../trade-analysis-engine";

export type MarketStructureAuditTradeMode =
  | "provided_trade_candles"
  | "levels_system_trade_window";

export interface ParsedMarketStructureAuditTrades {
  mode: MarketStructureAuditTradeMode;
  trades:
    | TradeAnalysisEngineArgs[]
    | Omit<TradeAnalysisEngineLevelsSystemCandleArgs, "levelsSystem">[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTimestampInput(value: unknown): value is string | Date {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function isNumberInput(value: unknown): value is number | string {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return isNonEmptyString(value) && Number.isFinite(Number(value.trim()));
}

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

function isSessionContextCandidate(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.sessionDate) &&
    isNonEmptyString(value.sessionBucket)
  );
}

function isExecutionCandidate(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.symbol) &&
    isTimestampInput(value.timestamp) &&
    isNonEmptyString(value.side) &&
    isNumberInput(value.shares) &&
    isNumberInput(value.price) &&
    (value.executionIndex === undefined ||
      value.executionIndex === null ||
      value.executionIndex === "" ||
      isNumberInput(value.executionIndex)) &&
    isOptionalString(value.orderId) &&
    isOptionalString(value.brokerExecutionId) &&
    isOptionalString(value.notes) &&
    isOptionalString(value.source)
  );
}

function isExecutionArrayCandidate(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(isExecutionCandidate)
  );
}

function isCandleCandidate(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value.symbol) &&
    isTimestampInput(value.timestamp) &&
    isNonEmptyString(value.timeframe) &&
    isNumberInput(value.open) &&
    isNumberInput(value.high) &&
    isNumberInput(value.low) &&
    isNumberInput(value.close) &&
    isNumberInput(value.volume) &&
    (value.vwap === undefined || value.vwap === null || isNumberInput(value.vwap)) &&
    (value.tradeCount === undefined ||
      value.tradeCount === null ||
      isNumberInput(value.tradeCount)) &&
    isOptionalString(value.source) &&
    isOptionalString(value.sessionBucket)
  );
}

function isCandleArrayCandidate(value: unknown): boolean {
  return Array.isArray(value) && value.every(isCandleCandidate);
}

function hasProvidedCandleTradeFields(value: unknown): boolean {
  return (
    isRecord(value) &&
    ("timeframe" in value ||
      "preTradeCandles" in value ||
      "tradeCandles" in value ||
      "postTradeCandles" in value)
  );
}

function isProvidedCandleTradeCandidate(
  value: unknown,
): value is TradeAnalysisEngineArgs {
  return (
    isRecord(value) &&
    isNonEmptyString(value.symbol) &&
    isNonEmptyString(value.timeframe) &&
    (value.tradeDirection === "long" || value.tradeDirection === "short") &&
    isExecutionArrayCandidate(value.executions) &&
    isSessionContextCandidate(value.sessionContext) &&
    isCandleArrayCandidate(value.preTradeCandles) &&
    isCandleArrayCandidate(value.tradeCandles) &&
    isCandleArrayCandidate(value.postTradeCandles)
  );
}

function isLevelsSystemCandleTradeCandidate(
  value: unknown,
): value is Omit<TradeAnalysisEngineLevelsSystemCandleArgs, "levelsSystem"> {
  return (
    isRecord(value) &&
    isNonEmptyString(value.symbol) &&
    (value.tradeDirection === "long" || value.tradeDirection === "short") &&
    isExecutionArrayCandidate(value.executions) &&
    isSessionContextCandidate(value.sessionContext)
  );
}

function normalizeTradeArray(document: unknown): unknown[] {
  if (Array.isArray(document)) {
    return document;
  }

  if (isRecord(document) && Array.isArray(document.trades)) {
    return document.trades;
  }

  if (isRecord(document) && document.trade !== undefined) {
    return [document.trade];
  }

  return [document];
}

function getFirstInvalidIndex(
  trades: unknown[],
  predicate: (trade: unknown) => boolean,
): number {
  return trades.findIndex((trade) => !predicate(trade));
}

function formatTradeShapeError(index: number): string {
  return [
    `Trade JSON item ${index} is not a supported market-structure audit trade.`,
    "Use either a full TradeAnalysisEngineArgs item with candle arrays,",
    "or an execution-only item with symbol, tradeDirection, executions,",
    "and sessionContext so levels-system can fetch the candles.",
  ].join(" ");
}

export function parseMarketStructureAuditTradeDocument(
  document: unknown,
): ParsedMarketStructureAuditTrades {
  const trades = normalizeTradeArray(document);

  if (trades.length === 0) {
    throw new Error("Trade JSON must include at least one trade.");
  }

  if (trades.some(hasProvidedCandleTradeFields)) {
    const invalidIndex = getFirstInvalidIndex(
      trades,
      isProvidedCandleTradeCandidate,
    );

    if (invalidIndex >= 0) {
      throw new Error(
        [
          "Trade JSON mixes candle-supplied and execution-only shapes,",
          "or includes an invalid candle-supplied trade.",
          "Split those modes into separate files before calibration.",
          formatTradeShapeError(invalidIndex),
        ].join(" "),
      );
    }

    return {
      mode: "provided_trade_candles",
      trades: trades as TradeAnalysisEngineArgs[],
    };
  }

  const invalidIndex = getFirstInvalidIndex(
    trades,
    isLevelsSystemCandleTradeCandidate,
  );

  if (invalidIndex >= 0) {
    throw new Error(formatTradeShapeError(invalidIndex));
  }

  return {
    mode: "levels_system_trade_window",
    trades: trades as Omit<
      TradeAnalysisEngineLevelsSystemCandleArgs,
      "levelsSystem"
    >[],
  };
}
