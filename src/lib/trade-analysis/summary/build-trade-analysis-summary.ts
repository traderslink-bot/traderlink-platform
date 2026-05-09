import type { AppTradeAnalysisResult } from "../run-trade-analysis";
import { buildExecutionFeedbackFacts } from "../../execution-feedback/build-execution-feedback-facts";
import { buildExecutionFeedbackPoints } from "../../execution-feedback/execution-behavior-patterns";
import {
  buildExecutionFeedbackSummary,
  type ExecutionFeedbackSummary,
} from "../../execution-feedback/summary/build-execution-feedback-summary";
import {
  buildTradeDecisionReview,
  type TradeDecisionReview,
} from "../review/build-trade-decision-review";

export interface TradeAnalysisSummaryPattern {
  patternId: string;
  patternName: string;
  family: string;
  role?: string;
}

export interface TradeAnalysisSummaryNearestLevelSnapshot {
  executionIndex: number;
  executionPrice: number;
  nearestSupportPrice: number | null;
  nearestResistancePrice: number | null;
  roomToNearestResistancePct: number | null;
  roomToNearestSupportPct: number | null;
  occurredInOpenAir: boolean;
}

export interface TradeAnalysisMarketStructureDebugSummary {
  observed: boolean;
  observationalOnly: true;
  usedForScoring: false;
  timeframe: string | null;
  state: string | null;
  trendDirection: string | null;
  confidenceLabel: string | null;
  confidenceScore: number | null;
  traderLine: string | null;
  diagnosticCodes: string[];
}

export interface TradeAnalysisSummary {
  contractVersion: "trade_analysis_summary_v1";
  symbol: string;
  sessionDate: string;
  sessionBucket: string;
  tradeDirection: string;
  timeframe: string;
  supportResistanceMode: AppTradeAnalysisResult["supportResistanceMode"];
  candleSource: "levels_system_trade_window" | "provided_trade_candles";
  executionCount: number;
  candleCounts: {
    preTrade: number;
    trade: number;
    postTrade: number;
  };
  supportResistance: {
    supportCount: number;
    resistanceCount: number;
    strongestSupportPrice: number | null;
    strongestResistancePrice: number | null;
    dynamicLevels: {
      vwap: number | null;
      ema9: number | null;
      ema20: number | null;
    };
    nearestAtFirstExecution: TradeAnalysisSummaryNearestLevelSnapshot | null;
  };
  patterns: {
    detectedCount: number;
    normalizedCount: number;
    topAnchorPattern: TradeAnalysisSummaryPattern | null;
    primaryPatterns: TradeAnalysisSummaryPattern[];
    supportingPatterns: TradeAnalysisSummaryPattern[];
    contextualPatterns: TradeAnalysisSummaryPattern[];
  };
  marketStructure: TradeAnalysisMarketStructureDebugSummary;
  executionFeedback: ExecutionFeedbackSummary & {
    marketContextUsed: false;
    separatedFromMarketContext: true;
  };
  decisionReview: TradeDecisionReview;
  warnings: string[];
}

function hasLevelsSystemTradeWindow(result: AppTradeAnalysisResult): boolean {
  return "levelsSystemTradeAnalysisCandleContext" in result.rawTradeTimeline;
}

function summarizePattern(pattern: {
  patternId: string;
  patternName: string;
  family: string;
  normalizedRole?: string;
}): TradeAnalysisSummaryPattern {
  return {
    patternId: pattern.patternId,
    patternName: pattern.patternName,
    family: pattern.family,
    role: pattern.normalizedRole,
  };
}

function getStrongestLevelPrice(
  levels:
    | NonNullable<AppTradeAnalysisResult["rawTradeTimeline"]["supportLevels"]>
    | NonNullable<AppTradeAnalysisResult["rawTradeTimeline"]["resistanceLevels"]>
    | undefined,
): number | null {
  if (!levels || levels.length === 0) {
    return null;
  }

  return [...levels].sort(
    (left, right) => right.score - left.score || left.price - right.price,
  )[0].price;
}

function summarizeNearestLevelSnapshot(
  result: AppTradeAnalysisResult,
): TradeAnalysisSummaryNearestLevelSnapshot | null {
  const firstRelation = result.rawTradeTimeline.executionLevelRelations?.[0];

  if (!firstRelation) {
    return null;
  }

  return {
    executionIndex: firstRelation.executionIndex,
    executionPrice: firstRelation.executionPrice,
    nearestSupportPrice: firstRelation.nearestSupportBelow?.price ?? null,
    nearestResistancePrice:
      firstRelation.nearestResistanceAbove?.price ??
      firstRelation.nearestResistanceBelow?.price ??
      null,
    roomToNearestResistancePct: firstRelation.roomToNearestResistancePct,
    roomToNearestSupportPct: firstRelation.roomToNearestSupportPct,
    occurredInOpenAir: firstRelation.occurredInOpenAir,
  };
}

function summarizeMarketStructure(
  result: AppTradeAnalysisResult,
): TradeAnalysisMarketStructureDebugSummary {
  const marketStructure = result.rawTradeTimeline.experimentalMarketStructure;

  if (!marketStructure) {
    return {
      observed: false,
      observationalOnly: true,
      usedForScoring: false,
      timeframe: null,
      state: null,
      trendDirection: null,
      confidenceLabel: null,
      confidenceScore: null,
      traderLine: null,
      diagnosticCodes: [],
    };
  }

  return {
    observed: true,
    observationalOnly: true,
    usedForScoring: false,
    timeframe: marketStructure.timeframe,
    state: marketStructure.state,
    trendDirection: marketStructure.trend.direction,
    confidenceLabel: marketStructure.confidence.label,
    confidenceScore: marketStructure.confidence.score,
    traderLine: marketStructure.traderLine ?? null,
    diagnosticCodes: marketStructure.diagnostics.map(
      (diagnostic) => diagnostic.code,
    ),
  };
}

export function buildTradeAnalysisSummary(
  result: AppTradeAnalysisResult,
): TradeAnalysisSummary {
  const raw = result.rawTradeTimeline;
  const timeline = raw.timeline;
  const normalized = result.normalizedPatterns;
  const executionFeedbackFacts = buildExecutionFeedbackFacts({
    symbol: timeline.symbol,
    tradeDirection: timeline.tradeDirection,
    sessionContext: timeline.sessionContext,
    executions: timeline.executions,
  });
  const executionFeedbackPoints =
    buildExecutionFeedbackPoints(executionFeedbackFacts);
  const executionFeedback = buildExecutionFeedbackSummary({
    facts: executionFeedbackFacts,
    points: executionFeedbackPoints,
  });
  const decisionReview = buildTradeDecisionReview(result);

  return {
    contractVersion: "trade_analysis_summary_v1",
    symbol: timeline.symbol,
    sessionDate: timeline.sessionContext.sessionDate,
    sessionBucket: timeline.sessionContext.sessionBucket,
    tradeDirection: timeline.tradeDirection,
    timeframe: timeline.timeframe,
    supportResistanceMode: result.supportResistanceMode,
    candleSource: hasLevelsSystemTradeWindow(result)
      ? "levels_system_trade_window"
      : "provided_trade_candles",
    executionCount: timeline.executions.length,
    candleCounts: {
      preTrade: timeline.preTradeCandles.length,
      trade: timeline.tradeCandles.length,
      postTrade: timeline.postTradeCandles.length,
    },
    supportResistance: {
      supportCount: raw.supportLevels?.length ?? 0,
      resistanceCount: raw.resistanceLevels?.length ?? 0,
      strongestSupportPrice: getStrongestLevelPrice(raw.supportLevels),
      strongestResistancePrice: getStrongestLevelPrice(raw.resistanceLevels),
      dynamicLevels: {
        vwap: null,
        ema9: null,
        ema20: null,
      },
      nearestAtFirstExecution: summarizeNearestLevelSnapshot(result),
    },
    patterns: {
      detectedCount: result.detectedPatterns.detectedPatterns.length,
      normalizedCount: normalized.prioritizedPatterns.length,
      topAnchorPattern: normalized.topOverallAnchorPattern
        ? summarizePattern(normalized.topOverallAnchorPattern)
        : null,
      primaryPatterns: normalized.primaryPatterns.map(summarizePattern),
      supportingPatterns: normalized.supportingPatterns.map(summarizePattern),
      contextualPatterns: normalized.contextualPatterns.map(summarizePattern),
    },
    marketStructure: summarizeMarketStructure(result),
    executionFeedback: {
      ...executionFeedback,
      marketContextUsed: false,
      separatedFromMarketContext: true,
    },
    decisionReview,
    warnings: raw.warnings ?? [],
  };
}
