// =========================
// 2026-04-12 05:36 PM America/Toronto
// PATTERN INPUT CONTRACT
// file name: pattern-input.ts
// =========================
//
// PURPOSE:
// Defines the pattern input contract.
// This is the clean, normalized structure that pattern detection will consume.
// It aggregates raw derived signals into a simplified, structured format.
// No interpretation, labeling, or scoring is done here.
//
// CRITICAL CONTRACT:
// This type is the ONLY input allowed for pattern detection.
// Pattern detection must NOT access raw timeline or derived signals directly.
// All future logic must depend ONLY on PatternInput.
//

import type { TradeDirection } from "../../raw-trade-timeline/types/trade-timeline-input";
import type { ReferenceLevelLabel } from "../../raw-trade-timeline/types/reference-level-label";
import type { SessionBucket } from "../../raw-trade-timeline/types/session-context";

export interface PatternInput {
  symbol: string;
  tradeDirection: TradeDirection;
  sessionBucket: SessionBucket;

  // ===== EXECUTION STRUCTURE =====
  executionCount: number;
  executionTimestamps: string[];

  firstExecutionTimestamp: string;
  lastExecutionTimestamp: string;

  // ===== TRADE STRUCTURE =====
  tradeDurationSeconds: number;
  tradeDurationMinutes: number;
  tradeCandleCount: number;

  // ===== POSITION BEHAVIOR =====
  totalPositionIncreaseCount: number;
  totalPositionDecreaseCount: number;
  totalPositionUnchangedCount: number;

  openedFromFlat: boolean;
  closedToFlat: boolean;

  hadMultipleIncreases: boolean;
  hadMultipleDecreases: boolean;

  maxPositionSize: number;
  finalPositionSize: number;

  // ===== PRICE PERFORMANCE =====
  entryPrice: number;
  exitPrice: number;

  tradeMfe: number | null;
  tradeMae: number | null;

  tradeMfePct: number | null;
  tradeMaePct: number | null;

  peakPriceDuringTrade: number | null;
  worstPriceDuringTrade: number | null;

  // ===== ENTRY CONTEXT =====
  // 2026-04-12 05:36 PM America/Toronto
  // These fields describe where the FIRST entry occurred relative to the
  // eventual full trade range and how much opportunity or pain remained after
  // that first entry.
  //
  // IMPORTANT:
  // These are still purely structural and factual.
  // They do NOT label the entry as good, bad, early, late, or chase.
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
  firstEntryNearestSupportBelowPrice: number | null;
  firstEntryNearestResistanceBelowPrice: number | null;
  firstEntryNearestResistanceAbovePrice: number | null;
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

  // ===== EXIT CONTEXT =====
  // 2026-04-12 05:36 PM America/Toronto
  // These fields describe where the FINAL exit occurred relative to the
  // eventual trade range and how much favorable excursion was actually
  // converted into realized result.
  //
  // IMPORTANT:
  // These are still purely structural and factual.
  // They do NOT label the exit as good, bad, disciplined, weak, early, or late.
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
  maxGivebackFromPeakOpenProfitPct: number | null;
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

  // ===== EXECUTION QUALITY AGGREGATES =====
  maxExecutionMfePct: number | null;
  maxExecutionMaePct: number | null;

  averageExecutionMfePct: number | null;
  averageExecutionMaePct: number | null;

  // ===== TIMING =====
  averageTimeBetweenExecutionsSeconds: number | null;
  minTimeBetweenExecutionsSeconds: number | null;
  maxTimeBetweenExecutionsSeconds: number | null;

  averageCandlesBetweenExecutions: number | null;

  executionsPerMinute: number | null;

  // ===== ADD / SCALING CONTEXT =====
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
