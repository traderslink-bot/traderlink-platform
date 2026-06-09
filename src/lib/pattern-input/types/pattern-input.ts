// =========================
// 2026-04-16 01:05 PM America/Toronto
// PATTERN INPUT CONTRACT
// file name: pattern-input.ts
// =========================
//
// PURPOSE:
// Defines the PatternInput contract consumed by Layer 2 pattern detection.
//
// CURRENT SHAPE:
// - nested context groups are the only supported PatternInput contract
// - Layer 2 consumers must read grouped context data directly
//
// CRITICAL CONTRACT:
// Pattern detection must consume PatternInput only.
// No Layer 2 code should reach back into the raw timeline result directly.

import type { TradeDirection } from "../../raw-trade-timeline/types/trade-timeline-input";
import type { ReferenceLevelLabel } from "../../raw-trade-timeline/types/reference-level-label";
import type { SessionBucket } from "../../raw-trade-timeline/types/session-context";
import type {
  StructuralLevelReactionStrength,
  StructuralLevelFreshness,
  StructuralLevelImportance,
  StructuralLevelStrengthBucket,
  StructuralLevelSourceStrengthLabel,
} from "../../raw-trade-timeline/types/structural-level";

export interface PatternInputTradeStructureContext {
  executionCount: number;
  executionTimestamps: string[];
  firstExecutionTimestamp: string;
  lastExecutionTimestamp: string;
  tradeDurationSeconds: number;
  tradeDurationMinutes: number;
  tradeCandleCount: number;
  totalPositionIncreaseCount: number;
  totalPositionDecreaseCount: number;
  totalPositionUnchangedCount: number;
  openedFromFlat: boolean;
  closedToFlat: boolean;
  hadMultipleIncreases: boolean;
  hadMultipleDecreases: boolean;
  maxPositionSize: number;
  finalPositionSize: number;
  entryPrice: number;
  exitPrice: number;
  tradeMfe: number | null;
  tradeMae: number | null;
  tradeMfePct: number | null;
  tradeMaePct: number | null;
  peakPriceDuringTrade: number | null;
  worstPriceDuringTrade: number | null;
  maxExecutionMfePct: number | null;
  maxExecutionMaePct: number | null;
  averageExecutionMfePct: number | null;
  averageExecutionMaePct: number | null;
}

export interface PatternInputEntryContext {
  firstEntryPricePositionInTradeRangePct: number | null;
  firstEntryDistanceFromTradeLowPct: number | null;
  firstEntryDistanceFromTradeHighPct: number | null;
  firstEntryOccurredDuringMarketOpenSession: boolean;
  firstEntryOpeningRangeCandlesCountBeforeEntry: number;
  firstEntryOpeningRangeHighBeforeEntry: number | null;
  firstEntryOpeningRangeLowBeforeEntry: number | null;
  firstEntryOccurredBeyondOpeningRangeInTradeDirection: boolean;
  firstEntryDistanceBeyondOpeningRangePct: number | null;
  firstEntryOpeningRangeReferenceLevelBeforeEntry: number | null;
  firstEntryOpeningRangeReferenceBreakDepthPctBeforeEntry: number | null;
  firstEntryHadOpeningRangeReclaimBeforeEntry: boolean;
  firstEntryOpeningRangeReclaimHeldIntoEntry: boolean;
  firstEntryOpeningRangeConfirmationCandlesCount: number;
  firstEntryDistanceFromOpeningRangeReferenceLevelPct: number | null;
  firstEntryOccurredBeyondPreEntryRangeInTradeDirection: boolean;
  firstEntryDistanceBeyondPreEntryRangePct: number | null;
  firstEntryToPeakMovePct: number | null;
  firstEntryToWorstMovePct: number | null;
  firstEntryCapturedPercentOfTradeMfe: number | null;
  firstEntryWasNearTradeLow: boolean;
  firstEntryWasNearTradeHigh: boolean;
  firstEntryRecentRunUpPctBeforeEntry: number | null;
  firstEntryRecentDropPctBeforeEntry: number | null;
  firstEntryRecentNetMovePctBeforeEntry: number | null;
  firstEntryRecentReferenceLevelBeforeEntry: number | null;
  firstEntryRecentReferenceBreakDepthPctBeforeEntry: number | null;
  firstEntryHadRecentReferenceReclaimBeforeEntry: boolean;
  firstEntryRecentReferenceReclaimHeldIntoEntry: boolean;
  firstEntryRecentReferenceConfirmationCandlesCount: number;
  firstEntryDistanceFromRecentReferenceLevelPct: number | null;
  firstEntryBullishCandlesBeforeEntryCount: number;
  firstEntryBearishCandlesBeforeEntryCount: number;
}

export interface PatternInputExitContext {
  realizedReturnPct: number | null;
  realizedCapturePercentOfTradeMfe: number | null;
  favorableExcursionLeftOnTablePct: number | null;
  exitPricePositionInTradeRangePct: number | null;
  finalExitToPeakDistancePct: number | null;
  exitWasNearTradeHigh: boolean;
  exitWasNearTradeLow: boolean;
  postExitCandleCount: number;
  maxFavorableMovePctAfterExit: number | null;
  maxAdverseMovePctAfterExit: number | null;
  netMovePctAtEndOfPostExitWindow: number | null;
  partialExitCount: number;
  hadPartialExit: boolean;
  maxFavorableMoveAfterPartialExitPct: number | null;
  maxAdverseMoveAfterPartialExitPct: number | null;
  reductionAbovePreviousAverageEntryCount: number;
  reductionBelowPreviousAverageEntryCount: number;
  averageReductionPriceVsPreviousAverageEntryPct: number | null;
  averageReductionPricePositionInRecentRangePct: number | null;
  reductionsNearRecentHighCount: number;
  reductionsNearRecentLowCount: number;
  averageReductionRecentRunUpPctBeforeExecution: number | null;
  averageReductionRecentDropPctBeforeExecution: number | null;
  reductionsWithRecentRunUpCount: number;
  reductionsWithRecentDropCount: number;
}

export interface PatternInputScalingContext {
  readdAfterReductionCount: number;
  hadReaddAfterReduction: boolean;
  averageReaddPriceChangeFromPriorReductionPct: number | null;
  averageFavorableMovePctAfterPartialExitBeforeReadd: number | null;
  averageAdverseMovePctAfterPartialExitBeforeReadd: number | null;
  averageFavorableMovePctAfterReaddBeforeNextExecution: number | null;
  averageAdverseMovePctAfterReaddBeforeNextExecution: number | null;
  readdsWithStrongerFavorableFollowthroughCount: number;
  readdsWithStrongerAdverseFollowthroughCount: number;
  readdsAfterRecentRunUpCount: number;
  readdsAfterRecentDropCount: number;
  addCountAfterInitialEntry: number;
  addAbovePreviousAverageEntryCount: number;
  addBelowPreviousAverageEntryCount: number;
  averageAddPriceVsPreviousAverageEntryPct: number | null;
  averageAddPricePositionInRecentRangePct: number | null;
  averageAddRecentRunUpPctBeforeExecution: number | null;
  averageAddRecentDropPctBeforeExecution: number | null;
  addsWithRecentRunUpCount: number;
  addsWithRecentDropCount: number;
}

export interface PatternInputTimingContext {
  averageTimeBetweenExecutionsSeconds: number | null;
  minTimeBetweenExecutionsSeconds: number | null;
  maxTimeBetweenExecutionsSeconds: number | null;
  averageCandlesBetweenExecutions: number | null;
  executionsPerMinute: number | null;
}

export interface PatternInputSupportResistanceContext {
  firstEntryNearestSupportBelowPrice: number | null;
  firstEntryNearestResistanceBelowPrice: number | null;
  firstEntryNearestResistanceAbovePrice: number | null;
  firstEntryNearestSupportStrengthBucket?: StructuralLevelStrengthBucket | null;
  firstEntryNearestResistanceStrengthBucket?: StructuralLevelStrengthBucket | null;
  firstEntryNearestSupportSourceStrengthLabel?: StructuralLevelSourceStrengthLabel | null;
  firstEntryNearestResistanceSourceStrengthLabel?: StructuralLevelSourceStrengthLabel | null;
  firstEntryNearestSupportImportance?: StructuralLevelImportance | null;
  firstEntryNearestResistanceImportance?: StructuralLevelImportance | null;
  firstEntryNearestSupportFreshness?: StructuralLevelFreshness | null;
  firstEntryNearestResistanceFreshness?: StructuralLevelFreshness | null;
  firstEntryNearestSupportIsExtension?: boolean;
  firstEntryNearestResistanceIsExtension?: boolean;
  firstEntryNearestSupportIsSyntheticExtension?: boolean;
  firstEntryNearestResistanceIsSyntheticExtension?: boolean;
  firstEntryNearestSupportZoneWidthPct?: number | null;
  firstEntryNearestResistanceZoneWidthPct?: number | null;
  firstEntryNearestSupportReactionStrength?: StructuralLevelReactionStrength | null;
  firstEntryNearestResistanceReactionStrength?: StructuralLevelReactionStrength | null;
  firstEntryNearestSupportScore?: number | null;
  firstEntryNearestResistanceScore?: number | null;
  firstEntryDistanceToNearestSupportPct: number | null;
  firstEntryDistanceAboveNearestResistanceBelowPct: number | null;
  firstEntryDistanceToNearestResistancePct: number | null;
  firstEntryOccurredNearSupport: boolean;
  firstEntryOccurredNearResistance: boolean;
  firstEntryClearedNearestResistanceBelow: boolean;
  firstEntryHadRoomAboveAfterClearingResistance: boolean;
  firstEntryOccurredBelowNearestSupport: boolean;
  firstEntryOccurredInOpenAir: boolean;
  firstEntryNearestReferenceLevelLabel: ReferenceLevelLabel | null;
  firstEntryWasAboveVwap: boolean;
  firstEntryWasBelowVwap: boolean;
  firstEntryDistanceFromVwapPct: number | null;
  firstEntryDistanceFromEma9Pct: number | null;
  firstEntryDistanceFromEma20Pct: number | null;
  firstEntryHasNearbyStructureOnBothSides: boolean;
  firstEntryDistanceBetweenNearestSupportAndResistancePct: number | null;
  firstEntryResistanceLevelsAboveWithinClusterCount: number;
  firstEntryHasStackedResistanceAbove: boolean;
  finalExitDistanceToNearestSupportPct: number | null;
  finalExitDistanceToNearestResistancePct: number | null;
  finalExitOccurredNearSupport: boolean;
  finalExitOccurredNearResistance: boolean;
  finalExitSupportLevelsBelowWithinClusterCount: number;
  finalExitHasStackedSupportBelow: boolean;
  reductionsNearSupportCount: number;
  reductionsNearResistanceCount: number;
  addsNearSupportCount: number;
  addsNearResistanceCount: number;
  addsAboveResistanceCount: number;
  addsAboveResistanceWithRoomCount: number;
  addsBelowSupportCount: number;
  averageAddDistanceToNearestSupportPct: number | null;
  averageAddDistanceToNearestResistancePct: number | null;
  averageAddRoomToNextResistancePct: number | null;
  hadInsufficientCandleDataForStructuralContext: boolean;
  hadSupportResistanceContextAvailable: boolean;
}

export interface PatternInputRecoveryContext {
  maxGivebackFromPeakOpenProfitPct: number | null;
  peakOpenProfitPctOfBasis: number | null;
  worstDrawdownPctOfBasis: number | null;
  hadOpenLossBeforePeakOpenProfit: boolean;
  secondsFromFirstOpenLossToPeakOpenProfit: number | null;
  hadPeakOpenProfitBeforeWorstDrawdown: boolean;
  drawdownFromPeakOpenProfitPctOfBasis: number | null;
  hadReductionAfterPeakOpenProfitBeforeWorstDrawdown: boolean;
  reductionCountAfterPeakOpenProfitBeforeWorstDrawdown: number;
  secondsFromPeakOpenProfitToWorstDrawdown: number | null;
  secondsFromPeakOpenProfitToFirstReduction: number | null;
}

export interface PatternInputIdentity {
  symbol: string;
  tradeDirection: TradeDirection;
  sessionBucket: SessionBucket;
}

export interface PatternInputCore extends PatternInputIdentity {
  tradeStructure: PatternInputTradeStructureContext;
  entryContext: PatternInputEntryContext;
  exitContext: PatternInputExitContext;
  scalingContext: PatternInputScalingContext;
  timingContext: PatternInputTimingContext;
  supportResistanceContext: PatternInputSupportResistanceContext;
  recoveryContext: PatternInputRecoveryContext;
}

export type PatternInput = PatternInputCore;
