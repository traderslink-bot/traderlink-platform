import { buildExecutionFeedbackPoints } from "../execution-behavior-patterns";
import type { ExecutionFeedbackFacts } from "../types/execution-feedback-facts";
import type {
  SessionBucket,
  SessionExposureSegment,
} from "../../raw-trade-timeline/types/session-context";
import type {
  ExecutionFeedbackPoint,
  ExecutionFeedbackPointSet,
} from "../types/execution-feedback-point";

export interface ExecutionFeedbackSummary {
  contractVersion: "execution_feedback_summary_v1";
  dataSource: "executions_only";
  symbol: string;
  tradeDirection: string;
  sessionDate: string;
  sessionBucket: string;
  entrySessionBucket: SessionBucket;
  entrySessionDateEt: string;
  entryTimeEt: string;
  entryHourEt: number | null;
  entryHourLabelEt: string;
  sessionExposure: SessionExposureSegment[];
  heldSessionBuckets: SessionBucket[];
  heldHourBucketsEt: string[];
  heldPremarketIntoOpen: boolean;
  heldOpenIntoMidday: boolean;
  heldMiddayIntoPostmarket: boolean;
  heldPostmarketIntoOvernight: boolean;
  heldOvernight: boolean;
  executionCount: number;
  lifecycle: {
    openedFromFlat: boolean;
    closedToFlat: boolean;
    isOpenPosition: boolean;
    finalPositionSize: number;
    maxPositionSize: number;
    initialEntrySize: number;
    initialEntryPrice: number;
    finalExecutionPrice: number;
    addCountAfterInitialEntry: number;
    reductionCount: number;
    partialReductionCount: number;
    fullExitCount: number;
    readdAfterReductionCount: number;
    durationSeconds: number;
  };
  sizing: {
    totalPositionIncreaseShares: number;
    totalPositionReductionShares: number;
    largestAddShares: number | null;
    averageAddShares: number | null;
    sizeExpansionRatioFromInitialToMax: number | null;
    largestAddPctOfMaxPosition: number | null;
    increaseShareSizeRangePctOfAverage: number | null;
  };
  sequencing: {
    firstReductionExecutionIndex: number | null;
    secondsFromEntryToFirstReduction: number | null;
    addsBeforeFirstReductionCount: number;
    addsAfterFirstReductionCount: number;
    averageTimeBetweenExecutionsSeconds: number | null;
    executionsPerMinute: number | null;
    rapidFireGapCount: number;
  };
  executionOnlyPnl: {
    grossRealizedPnl: number;
    grossRealizedPnlPctOfEntryNotional: number | null;
    averageEntryExecutionPrice: number | null;
    averageReductionExecutionPrice: number | null;
    commissionsAndFeesIncluded: false;
  };
  riskFacts: {
    adversePriceAddCount: number;
    adversePriceAddShares: number;
    profitableReductionCount: number;
    losingReductionCount: number;
    firstReductionPctOfPreviousPosition: number | null;
    openPositionShares: number;
  };
  points: {
    context: ExecutionFeedbackPoint[];
    strengths: ExecutionFeedbackPoint[];
    risks: ExecutionFeedbackPoint[];
    primaryFocus: ExecutionFeedbackPoint | null;
  };
  warnings: string[];
  limitations: string[];
}

export interface BuildExecutionFeedbackSummaryArgs {
  facts: ExecutionFeedbackFacts;
  points?: ExecutionFeedbackPointSet;
  warnings?: string[];
}

export const EXECUTION_FEEDBACK_LIMITATIONS = [
  "This read uses execution data only.",
  "Market context, support/resistance, VWAP/EMA, and candle structure were not used.",
  "Setup quality and level interaction require candle context.",
  "Gross realized P/L excludes commissions, fees, borrow costs, and slippage.",
] as const;

function getPrimaryFocus(
  points: ExecutionFeedbackPointSet,
): ExecutionFeedbackPoint | null {
  return points.risks[0] ?? points.strengths[0] ?? null;
}

export function buildExecutionFeedbackSummary(
  args: BuildExecutionFeedbackSummaryArgs,
): ExecutionFeedbackSummary {
  const points = args.points ?? buildExecutionFeedbackPoints(args.facts);
  const facts = args.facts;

  return {
    contractVersion: "execution_feedback_summary_v1",
    dataSource: "executions_only",
    symbol: facts.symbol,
    tradeDirection: facts.tradeDirection,
    sessionDate: facts.sessionDate,
    sessionBucket: facts.sessionBucket,
    entrySessionBucket: facts.entrySessionBucket,
    entrySessionDateEt: facts.entrySessionDateEt,
    entryTimeEt: facts.entryTimeEt,
    entryHourEt: facts.entryHourEt,
    entryHourLabelEt: facts.entryHourLabelEt,
    sessionExposure: facts.sessionExposure,
    heldSessionBuckets: facts.heldSessionBuckets,
    heldHourBucketsEt: facts.heldHourBucketsEt,
    heldPremarketIntoOpen: facts.heldPremarketIntoOpen,
    heldOpenIntoMidday: facts.heldOpenIntoMidday,
    heldMiddayIntoPostmarket: facts.heldMiddayIntoPostmarket,
    heldPostmarketIntoOvernight: facts.heldPostmarketIntoOvernight,
    heldOvernight: facts.heldOvernight,
    executionCount: facts.lifecycle.executionCount,
    lifecycle: {
      openedFromFlat: facts.lifecycle.openedFromFlat,
      closedToFlat: facts.lifecycle.closedToFlat,
      isOpenPosition: facts.lifecycle.isOpenPosition,
      finalPositionSize: facts.lifecycle.finalPositionSize,
      maxPositionSize: facts.lifecycle.maxPositionSize,
      initialEntrySize: facts.lifecycle.initialEntrySize,
      initialEntryPrice: facts.lifecycle.initialEntryPrice,
      finalExecutionPrice: facts.lifecycle.finalExecutionPrice,
      addCountAfterInitialEntry: facts.lifecycle.addCountAfterInitialEntry,
      reductionCount: facts.lifecycle.reductionCount,
      partialReductionCount: facts.lifecycle.partialReductionCount,
      fullExitCount: facts.lifecycle.fullExitCount,
      readdAfterReductionCount: facts.lifecycle.readdAfterReductionCount,
      durationSeconds: facts.lifecycle.durationSeconds,
    },
    sizing: {
      totalPositionIncreaseShares: facts.sizing.totalPositionIncreaseShares,
      totalPositionReductionShares: facts.sizing.totalPositionReductionShares,
      largestAddShares: facts.sizing.largestAddShares,
      averageAddShares: facts.sizing.averageAddShares,
      sizeExpansionRatioFromInitialToMax:
        facts.sizing.sizeExpansionRatioFromInitialToMax,
      largestAddPctOfMaxPosition: facts.sizing.largestAddPctOfMaxPosition,
      increaseShareSizeRangePctOfAverage:
        facts.sizing.increaseShareSizeRangePctOfAverage,
    },
    sequencing: {
      firstReductionExecutionIndex:
        facts.sequencing.firstReductionExecutionIndex,
      secondsFromEntryToFirstReduction:
        facts.sequencing.secondsFromEntryToFirstReduction,
      addsBeforeFirstReductionCount:
        facts.sequencing.addsBeforeFirstReductionCount,
      addsAfterFirstReductionCount:
        facts.sequencing.addsAfterFirstReductionCount,
      averageTimeBetweenExecutionsSeconds:
        facts.sequencing.averageTimeBetweenExecutionsSeconds,
      executionsPerMinute: facts.sequencing.executionsPerMinute,
      rapidFireGapCount: facts.sequencing.rapidFireGapCount,
    },
    executionOnlyPnl: {
      grossRealizedPnl: facts.price.grossRealizedPnl,
      grossRealizedPnlPctOfEntryNotional:
        facts.price.grossRealizedPnlPctOfEntryNotional,
      averageEntryExecutionPrice: facts.price.averageEntryExecutionPrice,
      averageReductionExecutionPrice:
        facts.price.averageReductionExecutionPrice,
      commissionsAndFeesIncluded: facts.price.commissionsAndFeesIncluded,
    },
    riskFacts: {
      adversePriceAddCount: facts.risk.adversePriceAddCount,
      adversePriceAddShares: facts.risk.adversePriceAddShares,
      profitableReductionCount: facts.risk.profitableReductionCount,
      losingReductionCount: facts.risk.losingReductionCount,
      firstReductionPctOfPreviousPosition:
        facts.risk.firstReductionPctOfPreviousPosition,
      openPositionShares: facts.risk.openPositionShares,
    },
    points: {
      context: points.context,
      strengths: points.strengths,
      risks: points.risks,
      primaryFocus: getPrimaryFocus(points),
    },
    warnings: args.warnings ?? [],
    limitations: [...EXECUTION_FEEDBACK_LIMITATIONS],
  };
}
