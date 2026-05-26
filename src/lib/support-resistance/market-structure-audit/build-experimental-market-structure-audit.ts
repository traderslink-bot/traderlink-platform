import type { CandleMarketStructureContext } from "levels-system-phase1/support-resistance-engine";
import {
  runTradeAnalysis,
  runTradeAnalysisFromLevelsSystemCandles,
  type SupportResistanceAnalysisMode,
} from "../../trade-analysis/run-trade-analysis";
import type {
  TradeAnalysisEngineArgs,
  TradeAnalysisEngineLevelsSystemCandleArgs,
  TradeAnalysisEngineResult,
} from "../../trade-analysis-engine";
import type { LevelsSystemRuntimeConfig } from "../levels-system-runtime-options";

type CountMap = Record<string, number>;

type CandleMarketStructurePivot = NonNullable<
  CandleMarketStructureContext["pivots"]["latestSwingHigh"]
>;
type CandleMarketStructureRange = NonNullable<
  CandleMarketStructureContext["range"]
>;

export interface ExperimentalMarketStructurePivotSummary {
  kind: CandleMarketStructurePivot["kind"];
  price: number;
  timestamp: number;
  strength: number;
}

export interface ExperimentalMarketStructureSummary {
  symbol: string;
  timeframe: CandleMarketStructureContext["timeframe"];
  asOfTimestamp: number | null;
  state: CandleMarketStructureContext["state"];
  trendDirection: CandleMarketStructureContext["trend"]["direction"];
  trendCounts: {
    higherLowCount: number;
    lowerHighCount: number;
    higherHighCount: number;
    lowerLowCount: number;
  };
  confidence: {
    label: CandleMarketStructureContext["confidence"]["label"];
    score: number;
    reasons: string[];
  };
  range: CandleMarketStructureRange | null;
  pivotEvent: {
    type: NonNullable<CandleMarketStructureContext["pivotEvent"]>["type"];
    confirmation: NonNullable<
      CandleMarketStructureContext["pivotEvent"]
    >["confirmation"];
    triggerPrice: number | null;
    pivot: ExperimentalMarketStructurePivotSummary | null;
  } | null;
  pivotCounts: {
    confirmedHighs: number;
    confirmedLows: number;
  };
  latestSwingHigh: ExperimentalMarketStructurePivotSummary | null;
  latestSwingLow: ExperimentalMarketStructurePivotSummary | null;
  traderLine: string | null;
  diagnostics: CandleMarketStructureContext["diagnostics"];
}

export interface ExperimentalMarketStructureAuditRecord {
  tradeIndex: number;
  symbol: string;
  sessionDate: string;
  tradeDirection: TradeAnalysisEngineArgs["tradeDirection"];
  candleSource: "provided_trade_candles" | "levels_system_trade_window";
  analysisStatus: "ok" | "error";
  supportResistanceMode: SupportResistanceAnalysisMode;
  errorMessage: string | null;
  marketStructure: ExperimentalMarketStructureSummary | null;
  levelCounts: {
    support: number;
    resistance: number;
  };
  detectedPatternIds: string[];
  normalizedPatternIds: string[];
  patternInputContainsExperimentalMarketStructure: boolean;
  warnings: string[];
}

export interface ExperimentalMarketStructureAuditTotals {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  missingMarketStructureCount: number;
  stateCounts: CountMap;
  trendDirectionCounts: CountMap;
  confidenceCounts: CountMap;
  diagnosticCodeCounts: CountMap;
  patternInputLeakCount: number;
  tradesWithWarningsCount: number;
  totalSupportLevels: number;
  totalResistanceLevels: number;
}

export interface ExperimentalMarketStructureAudit {
  generatedAt: string;
  observationalOnly: true;
  totals: ExperimentalMarketStructureAuditTotals;
  records: ExperimentalMarketStructureAuditRecord[];
}

export interface BuildExperimentalMarketStructureAuditArgs {
  trades: TradeAnalysisEngineArgs[];
  levelsSystem?: LevelsSystemRuntimeConfig;
}

export interface BuildExperimentalMarketStructureAuditFromLevelsSystemCandlesArgs {
  trades: Omit<TradeAnalysisEngineLevelsSystemCandleArgs, "levelsSystem">[];
  levelsSystem?: LevelsSystemRuntimeConfig;
}

function incrementCount(counts: CountMap, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function summarizePivot(
  pivot: CandleMarketStructurePivot | null,
): ExperimentalMarketStructurePivotSummary | null {
  if (!pivot) {
    return null;
  }

  return {
    kind: pivot.kind,
    price: pivot.price,
    timestamp: pivot.timestamp,
    strength: pivot.strength,
  };
}

function summarizeMarketStructure(
  marketStructure: CandleMarketStructureContext,
): ExperimentalMarketStructureSummary {
  return {
    symbol: marketStructure.symbol,
    timeframe: marketStructure.timeframe,
    asOfTimestamp: marketStructure.asOfTimestamp,
    state: marketStructure.state,
    trendDirection: marketStructure.trend.direction,
    trendCounts: {
      higherLowCount: marketStructure.trend.higherLowCount,
      lowerHighCount: marketStructure.trend.lowerHighCount,
      higherHighCount: marketStructure.trend.higherHighCount,
      lowerLowCount: marketStructure.trend.lowerLowCount,
    },
    confidence: {
      label: marketStructure.confidence.label,
      score: marketStructure.confidence.score,
      reasons: marketStructure.confidence.reasons,
    },
    range: marketStructure.range,
    pivotEvent: marketStructure.pivotEvent
      ? {
          type: marketStructure.pivotEvent.type,
          confirmation: marketStructure.pivotEvent.confirmation,
          triggerPrice: marketStructure.pivotEvent.triggerPrice,
          pivot: summarizePivot(marketStructure.pivotEvent.pivot),
        }
      : null,
    pivotCounts: {
      confirmedHighs: marketStructure.pivots.confirmedHighs.length,
      confirmedLows: marketStructure.pivots.confirmedLows.length,
    },
    latestSwingHigh: summarizePivot(marketStructure.pivots.latestSwingHigh),
    latestSwingLow: summarizePivot(marketStructure.pivots.latestSwingLow),
    traderLine: marketStructure.traderLine ?? null,
    diagnostics: marketStructure.diagnostics,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function hasExperimentalMarketStructureField(value: object): boolean {
  return Object.prototype.hasOwnProperty.call(
    value,
    "experimentalMarketStructure",
  );
}

function emptyTotals(totalTrades: number): ExperimentalMarketStructureAuditTotals {
  return {
    totalTrades,
    successfulTrades: 0,
    failedTrades: 0,
    missingMarketStructureCount: 0,
    stateCounts: {},
    trendDirectionCounts: {},
    confidenceCounts: {},
    diagnosticCodeCounts: {},
    patternInputLeakCount: 0,
    tradesWithWarningsCount: 0,
    totalSupportLevels: 0,
    totalResistanceLevels: 0,
  };
}

function updateTotalsFromRecord(
  totals: ExperimentalMarketStructureAuditTotals,
  record: ExperimentalMarketStructureAuditRecord,
): void {
  if (record.analysisStatus === "ok") {
    totals.successfulTrades += 1;
  } else {
    totals.failedTrades += 1;
  }

  if (!record.marketStructure) {
    totals.missingMarketStructureCount += 1;
  } else {
    incrementCount(totals.stateCounts, record.marketStructure.state);
    incrementCount(
      totals.trendDirectionCounts,
      record.marketStructure.trendDirection,
    );
    incrementCount(
      totals.confidenceCounts,
      record.marketStructure.confidence.label,
    );

    for (const diagnostic of record.marketStructure.diagnostics) {
      incrementCount(totals.diagnosticCodeCounts, diagnostic.code);
    }
  }

  if (record.patternInputContainsExperimentalMarketStructure) {
    totals.patternInputLeakCount += 1;
  }

  if (record.warnings.length > 0) {
    totals.tradesWithWarningsCount += 1;
  }

  totals.totalSupportLevels += record.levelCounts.support;
  totals.totalResistanceLevels += record.levelCounts.resistance;
}

type AuditTradeIdentity = {
  symbol: string;
  sessionContext: { sessionDate: string };
  tradeDirection: TradeAnalysisEngineArgs["tradeDirection"];
};

function buildErrorRecord(args: {
  trade: AuditTradeIdentity;
  tradeIndex: number;
  candleSource: ExperimentalMarketStructureAuditRecord["candleSource"];
  error: unknown;
}): ExperimentalMarketStructureAuditRecord {
  return {
    tradeIndex: args.tradeIndex,
    symbol: args.trade.symbol,
    sessionDate: args.trade.sessionContext.sessionDate,
    tradeDirection: args.trade.tradeDirection,
    candleSource: args.candleSource,
    analysisStatus: "error",
    supportResistanceMode: "levels_system",
    errorMessage: getErrorMessage(args.error),
    marketStructure: null,
    levelCounts: {
      support: 0,
      resistance: 0,
    },
    detectedPatternIds: [],
    normalizedPatternIds: [],
    patternInputContainsExperimentalMarketStructure: false,
    warnings: [],
  };
}

function buildRecordFromResult(args: {
  tradeIndex: number;
  candleSource: ExperimentalMarketStructureAuditRecord["candleSource"];
  result: TradeAnalysisEngineResult & {
    supportResistanceMode: SupportResistanceAnalysisMode;
  };
}): ExperimentalMarketStructureAuditRecord {
  const marketStructure =
    args.result.rawTradeTimeline.experimentalMarketStructure;

  return {
    tradeIndex: args.tradeIndex,
    symbol: args.result.patternInput.symbol,
    sessionDate:
      args.result.rawTradeTimeline.timeline.sessionContext.sessionDate,
    tradeDirection: args.result.patternInput.tradeDirection,
    candleSource: args.candleSource,
    analysisStatus: "ok",
    supportResistanceMode: args.result.supportResistanceMode,
    errorMessage: null,
    marketStructure: marketStructure
      ? summarizeMarketStructure(marketStructure)
      : null,
    levelCounts: {
      support: args.result.rawTradeTimeline.supportLevels?.length ?? 0,
      resistance: args.result.rawTradeTimeline.resistanceLevels?.length ?? 0,
    },
    detectedPatternIds:
      args.result.detectedPatterns.detectedPatterns.map(
        (pattern) => pattern.patternId,
      ),
    normalizedPatternIds:
      args.result.normalizedPatterns.prioritizedPatterns.map(
        (pattern) => pattern.patternId,
      ),
    patternInputContainsExperimentalMarketStructure:
      hasExperimentalMarketStructureField(
        args.result.patternInput.supportResistanceContext,
      ),
    warnings: args.result.rawTradeTimeline.warnings ?? [],
  };
}

function buildAuditFromRecords(
  records: ExperimentalMarketStructureAuditRecord[],
): ExperimentalMarketStructureAudit {
  const totals = emptyTotals(records.length);

  for (const record of records) {
    updateTotalsFromRecord(totals, record);
  }

  return {
    generatedAt: new Date().toISOString(),
    observationalOnly: true,
    totals,
    records,
  };
}

export async function buildExperimentalMarketStructureAudit(
  args: BuildExperimentalMarketStructureAuditArgs,
): Promise<ExperimentalMarketStructureAudit> {
  const records: ExperimentalMarketStructureAuditRecord[] = [];

  for (const [tradeIndex, trade] of args.trades.entries()) {
    try {
      const result = await runTradeAnalysis({
        trade,
        supportResistance: {
          mode: "levels_system",
          levelsSystem: args.levelsSystem,
        },
      });
      records.push(buildRecordFromResult({
        tradeIndex,
        candleSource: "provided_trade_candles",
        result,
      }));
    } catch (error) {
      records.push(
        buildErrorRecord({
          trade,
          tradeIndex,
          candleSource: "provided_trade_candles",
          error,
        }),
      );
    }
  }

  return buildAuditFromRecords(records);
}

export async function buildExperimentalMarketStructureAuditFromLevelsSystemCandles(
  args: BuildExperimentalMarketStructureAuditFromLevelsSystemCandlesArgs,
): Promise<ExperimentalMarketStructureAudit> {
  const records: ExperimentalMarketStructureAuditRecord[] = [];

  for (const [tradeIndex, trade] of args.trades.entries()) {
    try {
      const result = await runTradeAnalysisFromLevelsSystemCandles({
        trade,
        levelsSystem: args.levelsSystem,
      });

      records.push(buildRecordFromResult({
        tradeIndex,
        candleSource: "levels_system_trade_window",
        result,
      }));
    } catch (error) {
      records.push(
        buildErrorRecord({
          trade,
          tradeIndex,
          candleSource: "levels_system_trade_window",
          error,
        }),
      );
    }
  }

  return buildAuditFromRecords(records);
}
