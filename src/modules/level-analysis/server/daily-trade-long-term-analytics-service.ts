import Decimal from "decimal.js";
import type Database from "better-sqlite3";

import type { JournalAnalyticsRoundTripTableRow } from "@/src/modules/journal-analytics/contracts/analytics-result";
import { readJournalProfitProtectionOutcome } from
  "@/src/modules/journal/server/analytics/journal-profit-protection-outcome-service";
import { JournalLogicalTradeRepository } from
  "@/src/modules/journal/server/logical-trades/journal-logical-trade-repository";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type {
  DailyTradeGreenToRedStatus,
  DailyTradeProfitProtectionOutcome,
} from "../contracts/daily-trade-analyzer-contracts";
import { readDailyTradePathMaterialization } from "./daily-trade-path-materialization-repository";
import { LogicalTradeAnalyzerRepository } from "./logical-trade-analyzer-repository";
import {
  analyzeDailyTradeV2Scenario,
  DAILY_TRADE_V2_PROFIT_ZONE_LEVELS,
  type DailyTradeV2ScenarioAnalysis,
} from "./daily-trade-v2-scenario-analyzer";

type AnalysisRow = Readonly<{
  daily_trade_analysis_version_id: string;
  direction: "long" | "short";
  market_session_set_version_id: string;
  round_trip_id: string;
  round_trip_version_id: string;
}>;

type SnapshotRow = Readonly<{
  event_kind: "entry" | "add" | "partial_exit" | "final_exit";
  snapshot_json: string;
}>;

type PostExitPathRow = Readonly<{
  favorable_move_decimal: string | null;
  minutes_after_exit: 5 | 15 | 30 | 60;
}>;

type CandleRow = Readonly<{
  candle_time_utc_seconds: number;
  close_decimal: string;
  high_decimal: string;
  low_decimal: string;
}>;

type EventPathFact = Readonly<{
  minutesAfterEvent: 5 | 15 | 30 | 60;
  observedAtCandleTime: number | null;
  oppositeDirectionMoveDecimal: string | null;
  tradeDirectionMoveDecimal: string | null;
}>;

type PatternFact = Readonly<{
  candlesBeforeExecution: 0 | 1 | 2;
  kind: string;
  timeframe: "1m" | "5m";
}>;

type EventFact = Readonly<{
  atr14Percent: number | null;
  candleLocationRatio: number | null;
  ema9DistancePercent: number | null;
  eventId: string;
  eventKind: SnapshotRow["event_kind"];
  eventSequence: number;
  executedAtUtc: string;
  feesDecimal: string | null;
  fiveMinuteEma9DistancePercent: number | null;
  excursionAdverseDecimal: string | null;
  excursionFavorableDecimal: string | null;
  excursionMinutes: number | null;
  givebackDecimal: string | null;
  patterns: readonly PatternFact[];
  positionQuantityAfterDecimal: string | null;
  positionQuantityBeforeDecimal: string | null;
  postEventPaths: readonly EventPathFact[];
  priorFavorableExtremePriceDecimal: string | null;
  priceDecimal: string;
  quantityDecimal: string;
  relativeVolume: number | null;
  vwapDistancePercent: number | null;
}>;

type AnalyzerFact = Readonly<{
  events: readonly EventFact[];
  malformedSnapshotCount: number;
  path: NonNullable<ReturnType<typeof readDailyTradePathMaterialization>>["path"];
  postExitPaths: readonly PostExitPathRow[];
  postExitThirtyMinuteMoveDecimal: string | null;
  profitProtection: DailyTradeProfitProtectionOutcome;
  roundTripId: string;
  scenario: DailyTradeV2ScenarioAnalysis | null;
}>;

type ScenarioTrade = Readonly<{
  closeLocalDate: string;
  direction: "long" | "short";
  entryLocalDate: string;
  representativeRoundTripId: string;
  scenario: DailyTradeV2ScenarioAnalysis;
  symbol: string;
  totalHoldingMinutes: number;
  tradeId: string;
}>;

export type TradeAnalysisBreakdownRow = Readonly<{
  averageAdditionalOpportunityDecimal: string | null;
  averagePotentialPnlDecimal: string | null;
  averagePnlDecimal: string | null;
  averageReturnPercent: number | null;
  averageValue: number | null;
  label: string;
  medianPnlDecimal?: string | null;
  occurrenceCount: number;
  opportunityTradeCount: number;
  totalPnlDecimal?: string | null;
  winRatePercent: number | null;
  tradeCount: number;
}>;

export type TradeAnalysisPatternRow = Readonly<{
  averagePnlDecimal: string | null;
  executionSide: "Entry" | "Exit";
  location: "Exact execution candle" | "Before execution";
  medianPnlDecimal?: string | null;
  occurrenceCount: number;
  pattern: string;
  averageReturnPercent: number | null;
  direction: "long" | "short";
  totalPnlDecimal?: string | null;
  winRatePercent: number | null;
  timeframe: "1 min" | "5 min";
  tradeCount: number;
}>;

export type TradeAnalysisTradeRow = Readonly<{
  actualPnlDecimal: string;
  additionalOpportunityDecimal: string | null;
  capturedPercent: number | null;
  closeDate: string;
  direction: "long" | "short";
  executionCount: number;
  finalExitPriceDecimal: string | null;
  greenToRedStatus: DailyTradeGreenToRedStatus;
  malformedSnapshotCount: number;
  peakToExitMinutes: number | null;
  postExitThirtyMinuteMoveDecimal: string | null;
  postExitThirtyMinutePriceDecimal: string | null;
  returnPercent: number | null;
  roundTripId: string;
  sustainedOpportunityDecimal: string | null;
  symbol: string;
  trackerDate: string;
}>;

export type TradeAnalysisExcursionRow = Readonly<{
  actualPnlDecimal: string;
  adverseMoveDecimal: string;
  adverseMovePercent: number;
  closeDate: string;
  direction: "long" | "short";
  entryPriceDecimal: string;
  eventKind: "Entry" | "Add";
  executionSequence: number;
  favorableMoveDecimal: string;
  favorableMovePercent: number;
  minutesUntilFlat: number;
  roundTripId: string;
  symbol: string;
  trackerDate: string;
}>;

export type TradeAnalysisExcursionBreakdownRow = Readonly<{
  averageAdverseMoveDecimal: string | null;
  averageAdverseMovePercent: number | null;
  averageFavorableMoveDecimal: string | null;
  averageFavorableMovePercent: number | null;
  label: string;
  measuredExecutionCount: number;
  medianAdverseMoveDecimal: string | null;
  medianFavorableMoveDecimal: string | null;
}>;

export type TradeAnalysisMeaningfulProfitRow = Readonly<{
  actualPnlDecimal: string;
  calculatedPotentialPnlDecimal: string;
  closeDate: string;
  differenceDecimal: string;
  direction: "long" | "short";
  outcome: "ended_flat" | "ended_green" | "ended_red";
  profitLevelPriceDecimal: string;
  qualifiedAtUtcSeconds: number;
  requiredCloseCount: number;
  roundTripId: string;
  scaledOutWhileGreen: boolean;
  symbol: string;
  thresholdPercent: number;
  trackerDate: string;
}>;

export type TradeAnalysisScalingOutRow = Readonly<{
  actualPnlDecimal: string;
  closeDate: string;
  direction: "long" | "short";
  maximumOpenQuantityDecimal: string;
  positionReducedPercent: number | null;
  profitSecuredGrossDecimal: string;
  profitProtection: DailyTradeProfitProtectionOutcome;
  remainingQuantityDecimal: string | null;
  requiredCloseCount: number;
  roundTripId: string;
  scaledOutWhileGreen: boolean;
  scaledQuantityDecimal: string;
  symbol: string;
  thresholdPercent: number;
  trackerDate: string;
}>;

export type TradeAnalysisProfitZoneRecord = Readonly<{
  closeDate: string;
  direction: "long" | "short";
  finalGrossPnlDecimal: string;
  firstReachedAtUtcSeconds: number;
  firstReachSource: "completed_close" | "exit";
  longestConsecutiveMinutesAtOrAbove: number;
  lowerBoundPercent: number;
  maximumProfitOpportunityInZoneGrossDecimal: string;
  minutesFromEntryToFirstReach: number;
  observedOutcome: "dropped_before_next" | "exited_before_next" | "reached_next";
  partialProfitTakenAfterNextGrossDecimal: string;
  partialProfitTakenBeforeNextGrossDecimal: string;
  partialProfitTakenInZoneGrossDecimal: string;
  partialProfitTakingExitCount: number;
  profitAvailableAtLevelGrossDecimal: string;
  profitTakenInZoneGrossDecimal: string;
  profitableFullExitInZoneGrossDecimal: string;
  quantitySoldInZoneDecimal: string;
  reachedNextLevel: boolean;
  roundTripId: string;
  symbol: string;
  totalCompletedMinutesInZone: number;
  totalHoldingMinutes: number;
  tradeId: string;
  trackerDate: string;
  upperBoundPercent: number | null;
}>;

export type TradeAnalysisProfitZoneSummaryRow = Readonly<{
  didNotReachNextTradeCount: number | null;
  droppedBeforeNextTradeCount: number | null;
  exitedBeforeNextTradeCount: number | null;
  fullExitOnlyTradeProfitInZoneGrossDecimal: string;
  fullExitShareOfProfitTakingPercent: number | null;
  lowerBoundPercent: number;
  medianFirstReachMinutes: number | null;
  medianCompletedMinutesInZone: number | null;
  medianHoldingMinutes: number | null;
  medianLongestConsecutiveMinutesAtOrAbove: number | null;
  noProfitDroppedBelowFirstRatePercent: number | null;
  noProfitEndedRedGrossLossDecimal: string;
  noProfitEndedRedRatePercent: number | null;
  noProfitEndedRedTradeCount: number;
  noProfitExitedInZoneRatePercent: number | null;
  noProfitMaximumOpportunityGrossDecimal: string;
  noProfitRateOfReachedPercent: number | null;
  noProfitReachedNextFirstRatePercent: number | null;
  noProfitTradeCount: number;
  partialProfitRateOfReachedPercent: number | null;
  partialProfitTakenInZoneGrossDecimal: string;
  partialProfitTradeCount: number;
  partialAndReturnedFlatRateOfReachedPercent: number | null;
  partialAndReturnedFlatTradeCount: number;
  partialExitShareOfProfitTakingPercent: number | null;
  partialExitTradeProfitInZoneGrossDecimal: string;
  profitAvailableAtLevelGrossDecimal: string;
  profitAvailableDidNotReachNextGrossDecimal: string | null;
  profitAvailableReachedNextGrossDecimal: string | null;
  profitTakenInZoneGrossDecimal: string;
  profitableFullExitInZoneGrossDecimal: string;
  profitableFullExitTradeCount: number;
  quantitySoldInZoneDecimal: string;
  reachRatePercent: number | null;
  reachedNextTradeCount: number | null;
  reachedTradeCount: number;
  tookProfitRateOfReachedPercent: number | null;
  tookProfitTradeCount: number;
  upperBoundPercent: number | null;
}>;

export type TradeAnalysisGreenToRedOpportunityRow = Readonly<{
  closeDate: string;
  direction: "long" | "short";
  finalGrossPnlDecimal: string;
  firstReachedTwentyAtUtcSeconds: number;
  firstRedAfterTwentyAtUtcSeconds: number | null;
  maximumGainAtUtcSeconds: number;
  maximumGainPercent: number;
  maximumGainPriceDecimal: string;
  maximumGrossProfitOpportunityDecimal: string;
  peakZoneLowerBoundPercent: number;
  peakZoneUpperBoundPercent: number | null;
  profitOpportunityToFinalDifferenceDecimal: string;
  profitSecuredGrossDecimal: string;
  profitTakingExitCount: number;
  recoveredAfterTurningRed: boolean;
  roundTripId: string;
  symbol: string;
  timeInPeakZoneMinutes: number;
  totalHoldingMinutes: number;
  trackerDate: string;
}>;

export type TradeAnalysisEventPathRow = Readonly<{
  adverseMoveDecimal: string | null;
  closeDate: string;
  direction: "long" | "short";
  eventKind: "Add" | "Final exit" | "Initial entry" | "Partial exit";
  eventPriceDecimal: string;
  eventSequence: number;
  executedAtUtc: string;
  favorableMoveDecimal: string | null;
  minutesAfterEvent: 5 | 15 | 30 | 60;
  observedAtCandleTime: number | null;
  roundTripId: string;
  session: "After-hours" | "Premarket" | "Regular hours";
  symbol: string;
  trackerDate: string;
}>;

export type TradeAnalysisExecutionContextRow = Readonly<{
  actualPnlDecimal: string;
  atr14Percent: number | null;
  candleLocationPercent: number | null;
  closeDate: string;
  direction: "long" | "short";
  ema9DistancePercent: number | null;
  ema9FiveMinuteDistancePercent: number | null;
  eventKind: TradeAnalysisEventPathRow["eventKind"];
  eventPriceDecimal: string;
  eventSequence: number;
  executedAtUtc: string;
  relativeVolume: number | null;
  returnPercent: number | null;
  roundTripId: string;
  session: TradeAnalysisEventPathRow["session"];
  symbol: string;
  trackerDate: string;
  vwapDistancePercent: number | null;
}>;

type TradeAnalysisGreenToRedDamage = Readonly<{
  averageGreenToRedMinutes: number | null;
  averagePeakToFinalDamageDecimal: string | null;
  averagePeakToRedDamageDecimal: string | null;
  averageRecoveryMinutes: number | null;
  endedRedActualPnlDecimal: string | null;
  endedRedAdditionalOpportunityDecimal: string | null;
  endedRedPotentialPnlDecimal: string | null;
  endedRedTradeCount: number;
  recoveryRatePercent: number | null;
}>;

export type DailyTradeLongTermAnalyticsModel = Readonly<{
  analyzedExecutionCount: number;
  analyzedTradeCount: number;
  averageAdditionalOpportunityDecimal: string | null;
  averagePnlDecimal: string | null;
  averageReturnPercent: number | null;
  coveragePercent: number | null;
  currency: string | null;
  eligibleDayTradeCount: number;
  eligibilityBoundary: "not_configured";
  directionTradeCounts?: Readonly<{ long: number; short: number }>;
  eventPaths?: readonly TradeAnalysisEventPathRow[];
  executionContextRows?: readonly TradeAnalysisExecutionContextRow[];
  entryContext: Readonly<{
    ema9: readonly TradeAnalysisBreakdownRow[];
    ema9FiveMinute?: readonly TradeAnalysisBreakdownRow[];
    relativeVolume: readonly TradeAnalysisBreakdownRow[];
    vwap: readonly TradeAnalysisBreakdownRow[];
  }>;
  entryContextByDirection?: Readonly<Record<"long" | "short", Readonly<{
    atr14Percent: readonly TradeAnalysisBreakdownRow[];
    candleLocation: readonly TradeAnalysisBreakdownRow[];
    ema9: readonly TradeAnalysisBreakdownRow[];
    ema9FiveMinute: readonly TradeAnalysisBreakdownRow[];
    relativeVolume: readonly TradeAnalysisBreakdownRow[];
    vwap: readonly TradeAnalysisBreakdownRow[];
  }>>>;
  exitContext: readonly TradeAnalysisBreakdownRow[];
  exitContextByDirection?: Readonly<Record<"long" | "short", readonly TradeAnalysisBreakdownRow[]>>;
  exitExecutionContextByDirection?: Readonly<Record<"long" | "short", Readonly<{
    atr14Percent: readonly TradeAnalysisBreakdownRow[];
    candleLocation: readonly TradeAnalysisBreakdownRow[];
    ema9: readonly TradeAnalysisBreakdownRow[];
    ema9FiveMinute: readonly TradeAnalysisBreakdownRow[];
    relativeVolume: readonly TradeAnalysisBreakdownRow[];
    vwap: readonly TradeAnalysisBreakdownRow[];
  }>>>;
  greenToRed: readonly TradeAnalysisBreakdownRow[];
  greenToRedByDirection?: Readonly<Record<"long" | "short", readonly TradeAnalysisBreakdownRow[]>>;
  greenToRedDamage: TradeAnalysisGreenToRedDamage;
  greenToRedDamageByDirection?: Readonly<Record<"long" | "short", TradeAnalysisGreenToRedDamage>>;
  greenToRedOpportunity?: Readonly<{
    rows: readonly TradeAnalysisGreenToRedOpportunityRow[];
    tradeCountsByDirection: Readonly<{ long: number; short: number }>;
  }>;
  greenToRedTradeCount: number;
  holding: readonly TradeAnalysisBreakdownRow[];
  holdingDuration: readonly TradeAnalysisBreakdownRow[];
  entryTime: readonly TradeAnalysisBreakdownRow[];
  entryOpportunityRisk: Readonly<{
    averageAdverseMoveDecimal: string | null;
    averageFavorableMoveDecimal: string | null;
    medianAdverseMoveDecimal: string | null;
    medianFavorableMoveDecimal: string | null;
    measuredExecutionCount: number;
  }>;
  excursions: readonly TradeAnalysisExcursionRow[];
  mfeMae: Readonly<{
    averageAdverseMovePercent: number | null;
    averageFavorableMovePercent: number | null;
    breakdown: readonly TradeAnalysisExcursionBreakdownRow[];
    medianAdverseMovePercent: number | null;
    medianFavorableMovePercent: number | null;
  }>;
  malformedSnapshotCount: number;
  meaningfulProfit?: Readonly<{
    endedFlatTradeCount: number;
    endedGreenTradeCount: number;
    endedRedTradeCount: number;
    noScaleEndedRedActualPnlDecimal: string | null;
    noScaleEndedRedDifferenceDecimal: string | null;
    noScaleEndedRedPotentialPnlDecimal: string | null;
    noScaleEndedRedTradeCount: number;
    rows: readonly TradeAnalysisMeaningfulProfitRow[];
    thresholdCounts: readonly Readonly<{
      qualifiedTradeCount: number;
      requiredCloseCount: number;
      thresholdPercent: number;
    }>[];
    thresholdCountsByDirection: Readonly<Record<"long" | "short", readonly Readonly<{
      qualifiedTradeCount: number;
      requiredCloseCount: number;
      thresholdPercent: number;
    }>[]>>;
    totalActualPnlDecimal: string | null;
    totalDifferenceDecimal: string | null;
    totalPotentialPnlDecimal: string | null;
    tradeCount: number;
  }>;
  moneyBasis: "gross" | "net";
  opportunityTradeCount: number;
  profitCapture: Readonly<{
    averageCapturedPercent: number | null;
    averagePeakToFinalGivebackDecimal: string | null;
    medianCapturedPercent: number | null;
    totalActualPnlDecimal: string | null;
    totalAdditionalOpportunityDecimal: string | null;
    totalPotentialPnlDecimal: string | null;
  }>;
  patterns: readonly TradeAnalysisPatternRow[];
  profitZones?: Readonly<{
    recordsByDirection: Readonly<Record<"long" | "short", readonly TradeAnalysisProfitZoneRecord[]>>;
    rowsByDirection: Readonly<Record<"long" | "short", readonly TradeAnalysisProfitZoneSummaryRow[]>>;
    tradeCountsByDirection: Readonly<{ long: number; short: number }>;
  }>;
  riskManagement: Readonly<{
    addedAfterPeak: readonly TradeAnalysisBreakdownRow[];
    partialExitBeforeRed: readonly TradeAnalysisBreakdownRow[];
  }>;
  scalingOut?: Readonly<{
    noScaleEndedRedTradeCount: number;
    noScaleTradeCount: number;
    rows: readonly TradeAnalysisScalingOutRow[];
    scaledOutTradeCount: number;
    tradeCount: number;
  }>;
  timezone: string;
  trades: readonly TradeAnalysisTradeRow[];
  winRatePercent: number | null;
}>;

type TradeAnalysisExecutionContext = Readonly<{
  atr14Percent: readonly TradeAnalysisBreakdownRow[];
  candleLocation: readonly TradeAnalysisBreakdownRow[];
  ema9: readonly TradeAnalysisBreakdownRow[];
  ema9FiveMinute: readonly TradeAnalysisBreakdownRow[];
  relativeVolume: readonly TradeAnalysisBreakdownRow[];
  vwap: readonly TradeAnalysisBreakdownRow[];
}>;

export type DailyTradeLongTermAnalyticsV2Model = Omit<
  DailyTradeLongTermAnalyticsModel,
  "directionTradeCounts" | "entryContext" | "entryContextByDirection" | "eventPaths" | "executionContextRows" |
  "exitContextByDirection" | "exitExecutionContextByDirection" | "greenToRedByDirection" |
  "greenToRedDamageByDirection" | "greenToRedOpportunity" | "meaningfulProfit" | "profitZones" | "scalingOut"
> & Readonly<{
  directionTradeCounts: Readonly<{ long: number; short: number }>;
  entryContext: TradeAnalysisExecutionContext;
  entryContextByDirection: Readonly<Record<"long" | "short", TradeAnalysisExecutionContext>>;
  eventPaths: readonly TradeAnalysisEventPathRow[];
  executionContextRows: readonly TradeAnalysisExecutionContextRow[];
  exitContextByDirection: Readonly<Record<"long" | "short", readonly TradeAnalysisBreakdownRow[]>>;
  exitExecutionContextByDirection: Readonly<Record<"long" | "short", TradeAnalysisExecutionContext>>;
  greenToRedByDirection: Readonly<Record<"long" | "short", readonly TradeAnalysisBreakdownRow[]>>;
  greenToRedDamageByDirection: Readonly<Record<"long" | "short", TradeAnalysisGreenToRedDamage>>;
  greenToRedOpportunity: NonNullable<DailyTradeLongTermAnalyticsModel["greenToRedOpportunity"]>;
  meaningfulProfit: NonNullable<DailyTradeLongTermAnalyticsModel["meaningfulProfit"]>;
  profitZones: NonNullable<DailyTradeLongTermAnalyticsModel["profitZones"]>;
  scalingOut: NonNullable<DailyTradeLongTermAnalyticsModel["scalingOut"]>;
}>;

export function readDailyTradeAnalysisCurrencies(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): readonly string[] {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) return Object.freeze([]);
  const rows = database.prepare<[string, string, string, string], { trade_currency: string }>(`SELECT DISTINCT trade_currency FROM (
SELECT round_trip_version.trade_currency AS trade_currency
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
JOIN journal_round_trip_daily_trade_analysis_path_summaries summary
  ON summary.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
  AND summary.round_trip_version_id = analysis.round_trip_version_id
JOIN journal_round_trip_versions round_trip_version
  ON round_trip_version.round_trip_version_id = analysis.round_trip_version_id
WHERE analysis.workspace_id = ? AND analysis.account_id = ?
  AND analysis.status = 'ready' AND version.status = 'ready'
  AND EXISTS (
    SELECT 1
    FROM journal_round_trip_daily_trade_analysis_event_snapshots snapshot
    JOIN level_analysis_market_session_candles candle
      ON candle.market_session_set_version_id = version.market_session_set_version_id
      AND candle.candle_time_utc_seconds = snapshot.candle_time_utc_seconds
    WHERE snapshot.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
  )
UNION
SELECT round_trip_version.trade_currency AS trade_currency
FROM journal_logical_trade_daily_analyses analysis
JOIN journal_logical_trade_daily_analysis_versions version
  ON version.logical_trade_analysis_id = analysis.logical_trade_analysis_id
  AND version.revision_number = analysis.current_revision
JOIN journal_logical_trade_version_members member
  ON member.workspace_id = analysis.workspace_id
  AND member.account_id = analysis.account_id
  AND member.logical_trade_id = analysis.logical_trade_id
  AND member.logical_trade_version_id = analysis.logical_trade_version_id
  AND member.member_sequence = 1
JOIN journal_round_trip_versions round_trip_version
  ON round_trip_version.workspace_id = member.workspace_id
  AND round_trip_version.account_id = member.account_id
  AND round_trip_version.round_trip_version_id = member.round_trip_version_id
WHERE analysis.workspace_id = ? AND analysis.account_id = ?
  AND analysis.status = 'ready' AND version.status = 'ready'
  AND version.evidence_candles_json IS NOT NULL
  AND json_array_length(version.evidence_candles_json) > 0
)
ORDER BY trade_currency`).all(scope.workspaceId, accountId, scope.workspaceId, accountId);
  return Object.freeze(rows.map((row) => row.trade_currency));
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function decimalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    return new Decimal(value).toString();
  } catch {
    return null;
  }
}

function parseEvent(row: SnapshotRow): EventFact | null {
  try {
    const snapshot = record(JSON.parse(row.snapshot_json));
    const event = record(snapshot?.event);
    const metrics = record(snapshot?.metrics);
    if (!snapshot || !event || !metrics || typeof event.eventId !== "string" || event.eventId.length === 0 ||
        typeof event.executedAtUtc !== "string" ||
        Number.isNaN(Date.parse(event.executedAtUtc))) return null;
    const eventSequence = finiteNumber(event.sequence);
    const priceDecimal = decimalString(event.priceDecimal);
    const quantityDecimal = decimalString(event.quantityDecimal);
    if (eventSequence === null || !Number.isInteger(eventSequence) || priceDecimal === null ||
        quantityDecimal === null || new Decimal(priceDecimal).lte(0) || new Decimal(quantityDecimal).lte(0)) return null;
    const indicators = record(snapshot.indicators);
    const vwapDistance = record(metrics.vwapDistance);
    const ema9Distance = record(metrics.ema9Distance);
    const excursion = record(metrics.excursionUntilFlat);
    const fiveMinuteContext = record(snapshot.fiveMinuteContext);
    const completedFiveMinuteCandle = record(fiveMinuteContext?.completedBeforeExecution);
    const fiveMinuteEmaDistance = record(completedFiveMinuteCandle?.ema9Distance);
    const atr14 = finiteNumber(indicators?.atr14);
    const postEventPaths = Array.isArray(metrics.postEventPaths)
      ? metrics.postEventPaths.flatMap((value): EventPathFact[] => {
          const path = record(value);
          const minutes = finiteNumber(path?.minutesAfterEvent);
          if (minutes !== 5 && minutes !== 15 && minutes !== 30 && minutes !== 60) return [];
          return [Object.freeze({
            minutesAfterEvent: minutes,
            observedAtCandleTime: finiteNumber(path?.observedAtCandleTime),
            oppositeDirectionMoveDecimal: decimalString(path?.oppositeDirectionMoveDecimal),
            tradeDirectionMoveDecimal: decimalString(path?.tradeDirectionMoveDecimal),
          })];
        })
      : [];
    const patterns = Array.isArray(snapshot.patterns)
      ? snapshot.patterns.flatMap((value): PatternFact[] => {
          const pattern = record(value);
          const before = finiteNumber(pattern?.candlesBeforeExecution);
          return pattern?.availableAtExecution === true &&
            typeof pattern.kind === "string" && pattern.kind.length > 0 &&
            (before === 0 || before === 1 || before === 2) &&
            (pattern.timeframe === "1m" || pattern.timeframe === "5m")
            ? [{
                candlesBeforeExecution: before,
                kind: pattern.kind,
                timeframe: pattern.timeframe,
              }]
            : [];
        })
      : [];
    return Object.freeze({
      atr14Percent: atr14 === null ? null : atr14 / Number(priceDecimal) * 100,
      candleLocationRatio: finiteNumber(metrics.candleLocationRatio),
      ema9DistancePercent: finiteNumber(ema9Distance?.signedDistancePercent),
      eventId: event.eventId,
      eventKind: row.event_kind,
      eventSequence,
      executedAtUtc: event.executedAtUtc,
      feesDecimal: event.feesDecimal === null || event.feesDecimal === undefined
        ? null
        : decimalString(event.feesDecimal),
      fiveMinuteEma9DistancePercent: finiteNumber(fiveMinuteEmaDistance?.signedDistancePercent),
      excursionAdverseDecimal: decimalString(excursion?.adverseMoveDecimal),
      excursionFavorableDecimal: decimalString(excursion?.favorableMoveDecimal),
      excursionMinutes: finiteNumber(excursion?.minutesUntilFlat),
      givebackDecimal: decimalString(metrics.givebackFromPriorFavorableExtremeDecimal),
      patterns: Object.freeze(patterns),
      positionQuantityAfterDecimal: decimalString(metrics.positionQuantityAfterDecimal),
      positionQuantityBeforeDecimal: decimalString(metrics.positionQuantityBeforeDecimal),
      postEventPaths: Object.freeze(postEventPaths),
      priorFavorableExtremePriceDecimal: decimalString(metrics.priorFavorableExtremePriceDecimal),
      priceDecimal,
      quantityDecimal,
      relativeVolume: finiteNumber(indicators?.relativeVolume),
      vwapDistancePercent: finiteNumber(vwapDistance?.signedDistancePercent),
    });
  } catch {
    return null;
  }
}

function readAnalyzerFacts(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): ReadonlyMap<string, AnalyzerFact> {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) return new Map();
  const analyses = database.prepare<[string, string], AnalysisRow>(`SELECT
  analysis.round_trip_id,
  analysis.round_trip_version_id,
  version.daily_trade_analysis_version_id,
  version.market_session_set_version_id,
  round_trip_version.direction
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
JOIN journal_round_trip_daily_trade_analysis_path_summaries summary
  ON summary.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
  AND summary.round_trip_version_id = analysis.round_trip_version_id
JOIN journal_round_trip_versions round_trip_version
  ON round_trip_version.round_trip_version_id = analysis.round_trip_version_id
WHERE analysis.workspace_id = ? AND analysis.account_id = ?
  AND analysis.status = 'ready' AND version.status = 'ready'
  AND EXISTS (
    SELECT 1
    FROM journal_round_trip_daily_trade_analysis_event_snapshots snapshot
    JOIN level_analysis_market_session_candles candle
      ON candle.market_session_set_version_id = version.market_session_set_version_id
      AND candle.candle_time_utc_seconds = snapshot.candle_time_utc_seconds
    WHERE snapshot.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
  )
ORDER BY analysis.round_trip_id`).all(scope.workspaceId, accountId);
  const snapshots = database.prepare<[string], SnapshotRow>(`SELECT event_kind, snapshot_json
FROM journal_round_trip_daily_trade_analysis_event_snapshots
WHERE daily_trade_analysis_version_id = ?
ORDER BY COALESCE(json_extract(snapshot_json, '$.event.sequence'), candle_time_utc_seconds), candle_time_utc_seconds`);
  const postExitPaths = database.prepare<[string], PostExitPathRow>(`SELECT
  favorable_move_decimal,
  minutes_after_exit
FROM journal_round_trip_daily_trade_analysis_post_exit_paths
WHERE daily_trade_analysis_version_id = ?
ORDER BY minutes_after_exit`);
  const candles = database.prepare<[string], CandleRow>(`SELECT
  candle_time_utc_seconds,
  close_decimal,
  high_decimal,
  low_decimal
FROM level_analysis_market_session_candles
WHERE market_session_set_version_id = ?
ORDER BY candle_time_utc_seconds`);
  const result = new Map<string, AnalyzerFact>();
  for (const analysis of analyses) {
    const path = readDailyTradePathMaterialization(database, analysis.daily_trade_analysis_version_id);
    if (!path || path.roundTripVersionId !== analysis.round_trip_version_id) continue;
    const rows = snapshots.all(analysis.daily_trade_analysis_version_id);
    const parsed = rows.map(parseEvent);
    const parsedEvents = Object.freeze(parsed.filter((event): event is EventFact => event !== null));
    const savedCandles = candles.all(analysis.market_session_set_version_id);
    const savedPostExitPaths = Object.freeze(postExitPaths.all(analysis.daily_trade_analysis_version_id));
    const scenario = analyzeDailyTradeV2Scenario({
      candles: savedCandles.map((candle) => Object.freeze({
        closeDecimal: candle.close_decimal,
        highDecimal: candle.high_decimal,
        lowDecimal: candle.low_decimal,
        time: candle.candle_time_utc_seconds,
      })),
      direction: analysis.direction,
      events: parsedEvents.map((event) => Object.freeze({
        executedAtUtc: event.executedAtUtc,
        feesDecimal: event.feesDecimal,
        kind: event.eventKind,
        priceDecimal: event.priceDecimal,
        quantityDecimal: event.quantityDecimal,
        sequence: event.eventSequence,
      })),
    });
    const postExitThirty = savedPostExitPaths.find((candidate) => candidate.minutes_after_exit === 30);
    const profitProtection = readJournalProfitProtectionOutcome(database, scope, {
      events: parsedEvents.map((event) => Object.freeze({
        eventId: event.eventId,
        executedAt: event.executedAtUtc,
        kind: event.eventKind,
        metrics: Object.freeze({
          positionQuantityAfter: event.positionQuantityAfterDecimal ?? "",
          positionQuantityBefore: event.positionQuantityBeforeDecimal ?? "",
        }),
        price: event.priceDecimal,
        quantity: event.quantityDecimal,
      })),
      roundTripId: analysis.round_trip_id,
    });
    result.set(analysis.round_trip_id, Object.freeze({
      events: parsedEvents,
      malformedSnapshotCount: parsed.filter((event) => event === null).length,
      path: path.path,
      postExitPaths: savedPostExitPaths,
      postExitThirtyMinuteMoveDecimal: decimalString(postExitThirty?.favorable_move_decimal),
      profitProtection,
      roundTripId: analysis.round_trip_id,
      scenario,
    }));
  }
  return result;
}

function averageDecimals(values: readonly string[]): string | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum.plus(value), new Decimal(0))
    .div(values.length).toString();
}

function sumDecimals(values: readonly string[]): string | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum.plus(value), new Decimal(0)).toString();
}

function averageNumbers(values: readonly number[]): number | null {
  return values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function medianNumbers(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

function medianDecimals(values: readonly string[]): string | null {
  if (values.length === 0) return null;
  const sorted = values.map((value) => new Decimal(value)).sort((left, right) => left.comparedTo(right));
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? sorted[middle - 1]!.plus(sorted[middle]!).div(2).toString()
    : sorted[middle]!.toString();
}

function percentage(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator * 100;
}

function legacyOpportunityFor(fact: AnalyzerFact): string | null {
  const index = fact.path.bestProfitOpportunityIndex;
  return index === null ? null : fact.path.profitOpportunities[index]?.peakPnlDecimal ?? null;
}

function v2OpportunityFor(
  fact: AnalyzerFact,
  moneyBasis: "gross" | "net",
  actualPnlDecimal: string,
): string | null {
  const qualification = fact.scenario?.primaryQualification;
  if (!qualification || !fact.scenario) return null;
  const calculatedFinal = moneyBasis === "gross"
    ? fact.scenario.calculatedFinalGrossResultDecimal
    : fact.scenario.calculatedFinalNetResultDecimal;
  const potential = moneyBasis === "gross"
    ? qualification.calculatedGrossResultDecimal
    : qualification.calculatedNetResultDecimal;
  if (calculatedFinal === null || potential === null) return null;
  return new Decimal(calculatedFinal).minus(actualPnlDecimal).abs().lte("0.02")
    ? potential
    : null;
}

function scaledDecimal(value: string | null, multiplier: string): string | null {
  return value === null ? null : new Decimal(value).times(multiplier).toString();
}

function scaleProfitProtection(
  outcome: DailyTradeProfitProtectionOutcome,
  multiplier: string,
): DailyTradeProfitProtectionOutcome {
  if (outcome.status === "avoided_additional_loss") return Object.freeze({
    ...outcome,
    actualGrossResultDecimal: scaledDecimal(outcome.actualGrossResultDecimal, multiplier)!,
    avoidedAdditionalLossDecimal: scaledDecimal(outcome.avoidedAdditionalLossDecimal, multiplier)!,
    counterfactualGrossResultDecimal: scaledDecimal(outcome.counterfactualGrossResultDecimal, multiplier)!,
  });
  if (outcome.status === "gave_up_additional_profit") return Object.freeze({
    ...outcome,
    actualGrossResultDecimal: scaledDecimal(outcome.actualGrossResultDecimal, multiplier)!,
    additionalProfitGivenUpDecimal: scaledDecimal(outcome.additionalProfitGivenUpDecimal, multiplier)!,
    counterfactualGrossResultDecimal: scaledDecimal(outcome.counterfactualGrossResultDecimal, multiplier)!,
  });
  if (outcome.status === "no_difference") return Object.freeze({
    ...outcome,
    actualGrossResultDecimal: scaledDecimal(outcome.actualGrossResultDecimal, multiplier)!,
    counterfactualGrossResultDecimal: scaledDecimal(outcome.counterfactualGrossResultDecimal, multiplier)!,
  });
  return outcome;
}

function scaleScenario(
  scenario: DailyTradeV2ScenarioAnalysis,
  multiplier: string,
): DailyTradeV2ScenarioAnalysis {
  if (multiplier === "1") return scenario;
  return Object.freeze({
    ...scenario,
    calculatedFinalGrossResultDecimal: scaledDecimal(scenario.calculatedFinalGrossResultDecimal, multiplier)!,
    calculatedFinalNetResultDecimal: scaledDecimal(scenario.calculatedFinalNetResultDecimal, multiplier),
    greenOpportunity: scenario.greenOpportunity ? Object.freeze({
      ...scenario.greenOpportunity,
      maximumGainPriceDecimal: scaledDecimal(scenario.greenOpportunity.maximumGainPriceDecimal, multiplier)!,
      maximumGrossProfitOpportunityDecimal: scaledDecimal(
        scenario.greenOpportunity.maximumGrossProfitOpportunityDecimal,
        multiplier,
      )!,
      profitSecuredGrossDecimal: scaledDecimal(
        scenario.greenOpportunity.profitSecuredGrossDecimal,
        multiplier,
      )!,
    }) : null,
    primaryQualification: scenario.primaryQualification ? Object.freeze({
      ...scenario.primaryQualification,
      calculatedGrossResultDecimal: scaledDecimal(
        scenario.primaryQualification.calculatedGrossResultDecimal,
        multiplier,
      )!,
      calculatedNetResultDecimal: scaledDecimal(
        scenario.primaryQualification.calculatedNetResultDecimal,
        multiplier,
      ),
      closePriceDecimal: scaledDecimal(scenario.primaryQualification.closePriceDecimal, multiplier)!,
    }) : null,
    qualifications: Object.freeze(scenario.qualifications.map((qualification) => Object.freeze({
      ...qualification,
      calculatedGrossResultDecimal: scaledDecimal(qualification.calculatedGrossResultDecimal, multiplier)!,
      calculatedNetResultDecimal: scaledDecimal(qualification.calculatedNetResultDecimal, multiplier),
      closePriceDecimal: scaledDecimal(qualification.closePriceDecimal, multiplier)!,
    }))),
    profitZones: Object.freeze(scenario.profitZones.map((zone) => Object.freeze({
      ...zone,
      partialProfitTakenAfterNextGrossDecimal: scaledDecimal(
        zone.partialProfitTakenAfterNextGrossDecimal,
        multiplier,
      )!,
      partialProfitTakenBeforeNextGrossDecimal: scaledDecimal(
        zone.partialProfitTakenBeforeNextGrossDecimal,
        multiplier,
      )!,
      partialProfitTakenInZoneGrossDecimal: scaledDecimal(
        zone.partialProfitTakenInZoneGrossDecimal,
        multiplier,
      )!,
      maximumProfitOpportunityInZoneGrossDecimal: scaledDecimal(
        zone.maximumProfitOpportunityInZoneGrossDecimal,
        multiplier,
      ),
      profitAvailableAtLevelGrossDecimal: scaledDecimal(zone.profitAvailableAtLevelGrossDecimal, multiplier),
      profitTakenInZoneGrossDecimal: scaledDecimal(zone.profitTakenInZoneGrossDecimal, multiplier)!,
      profitableFullExitInZoneGrossDecimal: scaledDecimal(
        zone.profitableFullExitInZoneGrossDecimal,
        multiplier,
      )!,
    }))),
    scaleOut: Object.freeze({
      ...scenario.scaleOut,
      profitSecuredGrossDecimal: scaledDecimal(scenario.scaleOut.profitSecuredGrossDecimal, multiplier)!,
    }),
  });
}

function scaleAnalyzerFact(fact: AnalyzerFact, multiplier: string): AnalyzerFact {
  if (multiplier === "1") return fact;
  return Object.freeze({
    ...fact,
    events: Object.freeze(fact.events.map((event) => Object.freeze({
      ...event,
      excursionAdverseDecimal: scaledDecimal(event.excursionAdverseDecimal, multiplier),
      excursionFavorableDecimal: scaledDecimal(event.excursionFavorableDecimal, multiplier),
      givebackDecimal: scaledDecimal(event.givebackDecimal, multiplier),
      priorFavorableExtremePriceDecimal: scaledDecimal(event.priorFavorableExtremePriceDecimal, multiplier),
      priceDecimal: scaledDecimal(event.priceDecimal, multiplier)!,
      postEventPaths: Object.freeze(event.postEventPaths.map((path) => Object.freeze({
        ...path,
        oppositeDirectionMoveDecimal: scaledDecimal(path.oppositeDirectionMoveDecimal, multiplier),
        tradeDirectionMoveDecimal: scaledDecimal(path.tradeDirectionMoveDecimal, multiplier),
      }))),
    }))),
    path: Object.freeze({
      ...fact.path,
      completedClosePeakPnlDecimal: scaledDecimal(fact.path.completedClosePeakPnlDecimal, multiplier),
      finalPnlDecimal: scaledDecimal(fact.path.finalPnlDecimal, multiplier),
      firstRedPnlDecimal: scaledDecimal(fact.path.firstRedPnlDecimal, multiplier),
      peakPnlDecimal: scaledDecimal(fact.path.peakPnlDecimal, multiplier),
      peakToFinalReversalDecimal: scaledDecimal(fact.path.peakToFinalReversalDecimal, multiplier),
      peakToRedReversalDecimal: scaledDecimal(fact.path.peakToRedReversalDecimal, multiplier),
      profitOpportunityThresholdDecimal: scaledDecimal(fact.path.profitOpportunityThresholdDecimal, multiplier),
      strongOpportunityThresholdDecimal: scaledDecimal(fact.path.strongOpportunityThresholdDecimal, multiplier),
      profitOpportunities: Object.freeze(fact.path.profitOpportunities.map((opportunity) => Object.freeze({
        ...opportunity,
        lowestPnlDecimal: scaledDecimal(opportunity.lowestPnlDecimal, multiplier)!,
        peakPnlDecimal: scaledDecimal(opportunity.peakPnlDecimal, multiplier)!,
        peakToFinalReversalDecimal: scaledDecimal(opportunity.peakToFinalReversalDecimal, multiplier)!,
      }))),
    }),
    postExitPaths: Object.freeze(fact.postExitPaths.map((path) => Object.freeze({
      ...path,
      favorable_move_decimal: scaledDecimal(path.favorable_move_decimal, multiplier),
    }))),
    postExitThirtyMinuteMoveDecimal: scaledDecimal(fact.postExitThirtyMinuteMoveDecimal, multiplier),
    profitProtection: scaleProfitProtection(fact.profitProtection, multiplier),
    scenario: fact.scenario ? scaleScenario(fact.scenario, multiplier) : null,
  });
}

function additionalOpportunity(actual: string, opportunity: string | null): string | null {
  if (opportunity === null) return null;
  return Decimal.max(new Decimal(opportunity).minus(actual), 0).toString();
}

function capturedPercent(actual: string, opportunity: string | null): number | null {
  if (opportunity === null || new Decimal(opportunity).lte(0)) return null;
  return new Decimal(actual).div(opportunity).mul(100).toNumber();
}

function finalExitSeconds(events: readonly EventFact[]): number | null {
  const exits = events.filter((event) => event.eventKind === "final_exit")
    .map((event) => Math.floor(Date.parse(event.executedAtUtc) / 1000))
    .filter(Number.isFinite);
  return exits.length === 0 ? null : Math.max(...exits);
}

function finalExitEvent(events: readonly EventFact[]): EventFact | null {
  const exits = events.filter((event) => event.eventKind === "final_exit");
  return exits.length === 0 ? null : exits.reduce((latest, event) =>
    Date.parse(event.executedAtUtc) > Date.parse(latest.executedAtUtc) ? event : latest);
}

function postExitPrice(
  direction: "long" | "short",
  exitPriceDecimal: string | null,
  moveDecimal: string | null,
): string | null {
  if (exitPriceDecimal === null || moveDecimal === null) return null;
  const exitPrice = new Decimal(exitPriceDecimal);
  const move = new Decimal(moveDecimal);
  return direction === "long" ? exitPrice.plus(move).toString() : exitPrice.minus(move).toString();
}

function peakToExitMinutes(fact: AnalyzerFact): number | null {
  const index = fact.path.bestProfitOpportunityIndex;
  const opportunity = index === null ? null : fact.path.profitOpportunities[index] ?? null;
  const finalExit = finalExitSeconds(fact.events);
  if (!opportunity || finalExit === null || finalExit < opportunity.peakAtUtcSeconds) return null;
  return Math.round((finalExit - opportunity.peakAtUtcSeconds) / 60);
}

type Joined = Readonly<{
  actualPnl: string;
  analyzer: AnalyzerFact;
  journal: JournalAnalyticsRoundTripTableRow;
  opportunity: string | null;
  additional: string | null;
  peakToExit: number | null;
  returnPercent: number | null;
  v2Opportunity: string | null;
}>;

function breakdownRow(
  label: string,
  rows: readonly Joined[],
  occurrenceCount = rows.length,
  averageValue: number | null = null,
): TradeAnalysisBreakdownRow {
  const opportunityRows = rows.filter((row) => row.additional !== null);
  return Object.freeze({
    averageAdditionalOpportunityDecimal: averageDecimals(opportunityRows.map((row) => row.additional!)),
    averagePotentialPnlDecimal: averageDecimals(opportunityRows.map((row) =>
      new Decimal(row.actualPnl).plus(row.additional!).toString())),
    averagePnlDecimal: averageDecimals(rows.map((row) => row.actualPnl)),
    averageReturnPercent: averageNumbers(rows.flatMap((row) => row.returnPercent === null ? [] : [row.returnPercent])),
    averageValue,
    label,
    medianPnlDecimal: medianDecimals(rows.map((row) => row.actualPnl)),
    occurrenceCount,
    opportunityTradeCount: opportunityRows.length,
    totalPnlDecimal: sumDecimals(rows.map((row) => row.actualPnl)),
    tradeCount: rows.length,
    winRatePercent: percentage(rows.filter((row) => new Decimal(row.actualPnl).gt(0)).length, rows.length),
  });
}

function outcomeRows(joined: readonly Joined[]): readonly TradeAnalysisBreakdownRow[] {
  const definitions: readonly [DailyTradeGreenToRedStatus, string][] = [
    ["never_green", "Never moved green"],
    ["green_no_red", "Green and stayed above breakeven"],
    ["green_to_red_ended_red", "Green to red, ended red"],
    ["green_to_red_recovered", "Green to red, recovered"],
    ["green_to_red_ended_flat", "Green to red, ended flat"],
    ["unavailable", "Unavailable"],
  ];
  return Object.freeze(definitions.map(([status, label]) => {
    const rows = joined.filter((item) => item.analyzer.path.status === status);
    return breakdownRow(label, rows);
  }).filter((row) => row.tradeCount > 0));
}

const GREEN_TO_RED_STATUSES: readonly DailyTradeGreenToRedStatus[] = Object.freeze([
  "green_to_red_ended_red", "green_to_red_recovered", "green_to_red_ended_flat",
]);

function greenToRedDamageFor(joined: readonly Joined[]): TradeAnalysisGreenToRedDamage {
  const greenToRedTrades = joined.filter((row) => GREEN_TO_RED_STATUSES.includes(row.analyzer.path.status));
  const endedRedTrades = joined.filter((row) => row.analyzer.path.status === "green_to_red_ended_red");
  const recoveries = greenToRedTrades.filter((row) => row.analyzer.path.firstRecoveryAtUtcSeconds !== null);
  return Object.freeze({
    averageGreenToRedMinutes: averageNumbers(greenToRedTrades.flatMap((row) => {
      const { firstGreenAtUtcSeconds: green, firstRedAtUtcSeconds: red } = row.analyzer.path;
      return green === null || red === null ? [] : [(red - green) / 60];
    })),
    averagePeakToFinalDamageDecimal: averageDecimals(greenToRedTrades.flatMap((row) =>
      row.analyzer.path.peakToFinalReversalDecimal === null ? [] : [row.analyzer.path.peakToFinalReversalDecimal])),
    averagePeakToRedDamageDecimal: averageDecimals(greenToRedTrades.flatMap((row) =>
      row.analyzer.path.peakToRedReversalDecimal === null ? [] : [row.analyzer.path.peakToRedReversalDecimal])),
    averageRecoveryMinutes: averageNumbers(recoveries.flatMap((row) => {
      const { firstRecoveryAtUtcSeconds: recovery, firstRedAtUtcSeconds: red } = row.analyzer.path;
      return recovery === null || red === null ? [] : [(recovery - red) / 60];
    })),
    endedRedActualPnlDecimal: sumDecimals(endedRedTrades.map((row) => row.actualPnl)),
    endedRedAdditionalOpportunityDecimal: sumDecimals(endedRedTrades.flatMap((row) =>
      row.additional === null ? [] : [row.additional])),
    endedRedPotentialPnlDecimal: sumDecimals(endedRedTrades.map((row) =>
      new Decimal(row.actualPnl).plus(row.additional ?? 0).toString())),
    endedRedTradeCount: endedRedTrades.length,
    recoveryRatePercent: percentage(recoveries.length, greenToRedTrades.length),
  });
}

function holdingRows(joined: readonly Joined[]): readonly TradeAnalysisBreakdownRow[] {
  const definitions = [
    { label: "0-5 minutes after peak", test: (value: number) => value <= 5 },
    { label: "6-15 minutes after peak", test: (value: number) => value >= 6 && value <= 15 },
    { label: "16-30 minutes after peak", test: (value: number) => value >= 16 && value <= 30 },
    { label: "31-60 minutes after peak", test: (value: number) => value >= 31 && value <= 60 },
    { label: "More than 60 minutes after peak", test: (value: number) => value > 60 },
  ] as const;
  return Object.freeze(definitions.map((definition) => {
    const rows = joined.filter((item) => item.peakToExit !== null && definition.test(item.peakToExit));
    return breakdownRow(
      definition.label,
      rows,
      rows.length,
      averageNumbers(rows.flatMap((row) => row.peakToExit === null ? [] : [row.peakToExit])),
    );
  }).filter((row) => row.tradeCount > 0));
}

type EventJoined = Readonly<{ event: EventFact; trade: Joined }>;

function excursionPercent(moveDecimal: string, entryPriceDecimal: string): number {
  const entry = new Decimal(entryPriceDecimal);
  if (entry.lte(0)) throw new Error("Daily Trade Analyzer excursion requires a positive entry price.");
  return new Decimal(moveDecimal).div(entry).mul(100).toNumber();
}

function excursionBreakdown(
  label: string,
  events: readonly EventJoined[],
): TradeAnalysisExcursionBreakdownRow {
  const measured = events.filter(({ event }) =>
    event.excursionFavorableDecimal !== null && event.excursionAdverseDecimal !== null);
  const favorablePercent = measured.map(({ event }) =>
    excursionPercent(event.excursionFavorableDecimal!, event.priceDecimal));
  const adversePercent = measured.map(({ event }) =>
    excursionPercent(event.excursionAdverseDecimal!, event.priceDecimal));
  return Object.freeze({
    averageAdverseMoveDecimal: averageDecimals(measured.map(({ event }) => event.excursionAdverseDecimal!)),
    averageAdverseMovePercent: averageNumbers(adversePercent),
    averageFavorableMoveDecimal: averageDecimals(measured.map(({ event }) => event.excursionFavorableDecimal!)),
    averageFavorableMovePercent: averageNumbers(favorablePercent),
    label,
    measuredExecutionCount: measured.length,
    medianAdverseMoveDecimal: medianDecimals(measured.map(({ event }) => event.excursionAdverseDecimal!)),
    medianFavorableMoveDecimal: medianDecimals(measured.map(({ event }) => event.excursionFavorableDecimal!)),
  });
}

function eventBreakdown(
  events: readonly EventJoined[],
  definitions: readonly Readonly<{ label: string; test: (value: number) => boolean }>[],
  read: (event: EventFact) => number | null,
): readonly TradeAnalysisBreakdownRow[] {
  return Object.freeze(definitions.map((definition) => {
    const selected = events.filter(({ event }) => {
      const value = read(event);
      return value !== null && definition.test(value);
    });
    const trades = new Map(selected.map(({ trade }) => [trade.journal.roundTripId, trade]));
    const tradeRows = [...trades.values()];
    const values = selected.flatMap(({ event }) => {
      const value = read(event);
      return value === null ? [] : [value];
    });
    return breakdownRow(definition.label, tradeRows, selected.length, averageNumbers(values));
  }).filter((row) => row.occurrenceCount > 0));
}

function eventKindBreakdown(
  events: readonly EventJoined[],
  kinds: readonly Readonly<{ kind: EventFact["eventKind"]; label: string }>[],
  definitions: readonly Readonly<{ label: string; test: (value: number) => boolean }>[],
  read: (event: EventFact) => number | null,
): readonly TradeAnalysisBreakdownRow[] {
  return Object.freeze(kinds.flatMap(({ kind, label }) => eventBreakdown(
    events.filter(({ event }) => event.eventKind === kind),
    definitions,
    read,
  ).map((row) => Object.freeze({ ...row, label: `${label} · ${row.label}` }))));
}

const ENTRY_EVENT_KINDS = Object.freeze([
  Object.freeze({ kind: "entry" as const, label: "Initial entry" }),
  Object.freeze({ kind: "add" as const, label: "Add" }),
]);

const EXIT_EVENT_KINDS = Object.freeze([
  Object.freeze({ kind: "partial_exit" as const, label: "Partial exit" }),
  Object.freeze({ kind: "final_exit" as const, label: "Final exit" }),
]);

const DISTANCE_BUCKETS = Object.freeze([
  { label: "20%+ below", test: (value: number) => value < -20 },
  { label: "10-20% below", test: (value: number) => value >= -20 && value < -10 },
  { label: "5-10% below", test: (value: number) => value >= -10 && value < -5 },
  { label: "1-5% below", test: (value: number) => value >= -5 && value < -1 },
  { label: "Within 1%", test: (value: number) => value >= -1 && value <= 1 },
  { label: "1-5% above", test: (value: number) => value > 1 && value <= 5 },
  { label: "5-10% above", test: (value: number) => value > 5 && value <= 10 },
  { label: "10-20% above", test: (value: number) => value > 10 && value <= 20 },
  { label: "20%+ above", test: (value: number) => value > 20 },
]);

const RELATIVE_VOLUME_BUCKETS = Object.freeze([
  { label: "Below 1x", test: (value: number) => value < 1 },
  { label: "1-2x", test: (value: number) => value >= 1 && value < 2 },
  { label: "2-5x", test: (value: number) => value >= 2 && value < 5 },
  { label: "5-10x", test: (value: number) => value >= 5 && value < 10 },
  { label: "10x+", test: (value: number) => value >= 10 },
]);

const ONE_MINUTE_ATR_BUCKETS = Object.freeze([
  { label: "Under 2%", test: (value: number) => value < 2 },
  { label: "2% to under 5%", test: (value: number) => value >= 2 && value < 5 },
  { label: "5% to under 10%", test: (value: number) => value >= 5 && value < 10 },
  { label: "10% to under 20%", test: (value: number) => value >= 10 && value < 20 },
  { label: "20%+", test: (value: number) => value >= 20 },
]);

const CANDLE_LOCATION_BUCKETS = Object.freeze([
  { label: "Outside saved candle range", test: (value: number) => value < 0 || value > 1 },
  { label: "Bottom 20% of candle", test: (value: number) => value >= 0 && value < 0.2 },
  { label: "Lower-middle 20%", test: (value: number) => value >= 0.2 && value < 0.4 },
  { label: "Middle 20%", test: (value: number) => value >= 0.4 && value <= 0.6 },
  { label: "Upper-middle 20%", test: (value: number) => value > 0.6 && value <= 0.8 },
  { label: "Top 20% of candle", test: (value: number) => value > 0.8 && value <= 1 },
]);

function exitRows(events: readonly EventJoined[]): readonly TradeAnalysisBreakdownRow[] {
  const definitions = Object.freeze([
    { label: "No measured giveback", test: (value: number) => value === 0 },
    { label: "Up to 1% giveback", test: (value: number) => value > 0 && value <= 1 },
    { label: "1-3% giveback", test: (value: number) => value > 1 && value <= 3 },
    { label: "More than 3% giveback", test: (value: number) => value > 3 },
  ]);
  return eventBreakdown(events, definitions, (event) => {
    if (event.givebackDecimal === null || event.priorFavorableExtremePriceDecimal === null) return null;
    const anchor = new Decimal(event.priorFavorableExtremePriceDecimal).abs();
    return anchor.eq(0) ? null : new Decimal(event.givebackDecimal).abs().div(anchor).mul(100).toNumber();
  });
}

function patternRows(events: readonly EventJoined[]): readonly TradeAnalysisPatternRow[] {
  const groups = new Map<string, { events: EventJoined[]; pattern: PatternFact }>();
  for (const item of events) for (const pattern of item.event.patterns) {
    const side = item.event.eventKind === "entry" || item.event.eventKind === "add" ? "Entry" : "Exit";
    const location = pattern.candlesBeforeExecution === 0 ? "Exact execution candle" : "Before execution";
    const key = `${item.trade.journal.direction}|${pattern.timeframe}|${side}|${location}|${pattern.kind}`;
    const group = groups.get(key) ?? { events: [], pattern };
    group.events.push(item);
    groups.set(key, group);
  }
  return Object.freeze([...groups.values()].map((group): TradeAnalysisPatternRow => {
    const trades = new Map(group.events.map(({ trade }) => [trade.journal.roundTripId, trade]));
    const tradeRows = [...trades.values()];
    const first = group.events[0]!;
    return Object.freeze({
      averagePnlDecimal: averageDecimals(tradeRows.map((row) => row.actualPnl)),
      averageReturnPercent: averageNumbers(tradeRows.flatMap((row) => row.returnPercent === null ? [] : [row.returnPercent])),
      direction: first.trade.journal.direction,
      executionSide: first.event.eventKind === "entry" || first.event.eventKind === "add" ? "Entry" : "Exit",
      location: group.pattern.candlesBeforeExecution === 0 ? "Exact execution candle" : "Before execution",
      medianPnlDecimal: medianDecimals(tradeRows.map((row) => row.actualPnl)),
      occurrenceCount: group.events.length,
      pattern: group.pattern.kind,
      totalPnlDecimal: sumDecimals(tradeRows.map((row) => row.actualPnl)),
      winRatePercent: percentage(tradeRows.filter((row) => new Decimal(row.actualPnl).gt(0)).length, tradeRows.length),
      timeframe: group.pattern.timeframe === "1m" ? "1 min" : "5 min",
      tradeCount: tradeRows.length,
    });
  }).sort((left, right) => right.occurrenceCount - left.occurrenceCount || left.pattern.localeCompare(right.pattern)));
}

function behaviorRows(
  joined: readonly Joined[],
  labelWhenTrue: string,
  labelWhenFalse: string,
  test: (row: Joined) => boolean,
): readonly TradeAnalysisBreakdownRow[] {
  const selected = joined.filter(test);
  const unselected = joined.filter((row) => !test(row));
  return Object.freeze([
    breakdownRow(labelWhenTrue, selected),
    breakdownRow(labelWhenFalse, unselected),
  ].filter((row) => row.tradeCount > 0));
}

function holdingDurationRows(joined: readonly Joined[]): readonly TradeAnalysisBreakdownRow[] {
  const definitions = [
    { label: "0-5 minutes", minimum: 0, maximum: 5 },
    { label: "6-15 minutes", minimum: 5, maximum: 15 },
    { label: "16-30 minutes", minimum: 15, maximum: 30 },
    { label: "31-60 minutes", minimum: 30, maximum: 60 },
    { label: "More than 60 minutes", minimum: 60, maximum: Number.POSITIVE_INFINITY },
  ] as const;
  return Object.freeze(definitions.flatMap((definition) => {
    const rows = joined.filter((row) => {
      const minutes = row.journal.holdingDurationMilliseconds / 60_000;
      return minutes > definition.minimum && minutes <= definition.maximum ||
        definition.minimum === 0 && minutes >= 0 && minutes <= definition.maximum;
    });
    return rows.length === 0 ? [] : [breakdownRow(
      definition.label,
      rows,
      rows.length,
      averageNumbers(rows.map((row) => row.journal.holdingDurationMilliseconds / 60_000)),
    )];
  }));
}

function entryTimeRows(joined: readonly Joined[], timezone: string): readonly TradeAnalysisBreakdownRow[] {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: timezone,
  });
  const minutesFor = (value: string): number => {
    const parts = formatter.formatToParts(new Date(value));
    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0") % 24;
    const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
    return hour * 60 + minute;
  };
  const definitions = [
    { label: "Premarket", minimum: 4 * 60, maximum: 9 * 60 + 29 },
    { label: "Opening hour", minimum: 9 * 60 + 30, maximum: 10 * 60 + 29 },
    { label: "Late morning", minimum: 10 * 60 + 30, maximum: 11 * 60 + 59 },
    { label: "Afternoon", minimum: 12 * 60, maximum: 15 * 60 + 59 },
    { label: "After-hours", minimum: 16 * 60, maximum: 20 * 60 },
  ] as const;
  return Object.freeze(definitions.flatMap((definition) => {
    const rows = joined.filter((row) => {
      const minutes = minutesFor(row.journal.openedAtUtc);
      return minutes >= definition.minimum && minutes <= definition.maximum;
    });
    return rows.length === 0 ? [] : [breakdownRow(definition.label, rows)];
  }));
}

function tradingSession(
  executedAtUtc: string,
  timezone: string,
): TradeAnalysisEventPathRow["session"] {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: timezone,
  }).formatToParts(new Date(executedAtUtc));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const total = hour * 60 + minute;
  if (total < 9 * 60 + 30) return "Premarket";
  if (total < 16 * 60) return "Regular hours";
  return "After-hours";
}

function eventKindLabel(kind: EventFact["eventKind"]): TradeAnalysisEventPathRow["eventKind"] {
  if (kind === "entry") return "Initial entry";
  if (kind === "add") return "Add";
  if (kind === "partial_exit") return "Partial exit";
  return "Final exit";
}

function outcomeFor(actualPnlDecimal: string): TradeAnalysisMeaningfulProfitRow["outcome"] {
  const actual = new Decimal(actualPnlDecimal);
  return actual.isPositive() ? "ended_green" : actual.isNegative() ? "ended_red" : "ended_flat";
}

function profitZoneSummaryRows(
  records: readonly TradeAnalysisProfitZoneRecord[],
  totalTradeCount: number,
): readonly TradeAnalysisProfitZoneSummaryRow[] {
  return Object.freeze(DAILY_TRADE_V2_PROFIT_ZONE_LEVELS.map((lowerBoundPercent) => {
    const zoneRecords = records.filter((record) => record.lowerBoundPercent === lowerBoundPercent);
    const upperBoundPercent = zoneRecords[0]?.upperBoundPercent ??
      (lowerBoundPercent < 100 ? lowerBoundPercent + 10 : null);
    const tookProfit = zoneRecords.filter((record) => new Decimal(record.profitTakenInZoneGrossDecimal).isPositive());
    const tookPartialProfit = zoneRecords.filter((record) =>
      new Decimal(record.partialProfitTakenInZoneGrossDecimal).isPositive());
    const tookFullExitOnlyProfit = tookProfit.filter((record) =>
      new Decimal(record.partialProfitTakenInZoneGrossDecimal).isZero());
    const closedProfitably = zoneRecords.filter((record) =>
      new Decimal(record.profitableFullExitInZoneGrossDecimal).isPositive());
    const partiallyExitedAndClosedProfitably = zoneRecords.filter((record) =>
      new Decimal(record.partialProfitTakenInZoneGrossDecimal).isPositive() &&
      new Decimal(record.profitableFullExitInZoneGrossDecimal).isPositive());
    const noProfit = zoneRecords.filter((record) =>
      new Decimal(record.profitTakenInZoneGrossDecimal).isZero());
    const noProfitReachedNextFirst = noProfit.filter((record) =>
      record.observedOutcome === "reached_next");
    const noProfitDroppedBelowFirst = noProfit.filter((record) =>
      record.observedOutcome === "dropped_before_next");
    const noProfitExitedInZone = noProfit.filter((record) =>
      record.observedOutcome === "exited_before_next");
    const noProfitEndedRed = noProfit.filter((record) =>
      new Decimal(record.finalGrossPnlDecimal).isNegative());
    const reachedNext = upperBoundPercent === null
      ? []
      : zoneRecords.filter((record) => record.reachedNextLevel);
    const didNotReachNext = upperBoundPercent === null
      ? []
      : zoneRecords.filter((record) => !record.reachedNextLevel);
    return Object.freeze({
      didNotReachNextTradeCount: upperBoundPercent === null ? null : didNotReachNext.length,
      droppedBeforeNextTradeCount: upperBoundPercent === null ? null : zoneRecords.filter((record) =>
        record.observedOutcome === "dropped_before_next").length,
      exitedBeforeNextTradeCount: upperBoundPercent === null ? null : zoneRecords.filter((record) =>
        record.observedOutcome === "exited_before_next").length,
      fullExitOnlyTradeProfitInZoneGrossDecimal: sumDecimals(tookFullExitOnlyProfit.map((record) =>
        record.profitTakenInZoneGrossDecimal)) ?? "0",
      fullExitShareOfProfitTakingPercent: percentage(tookFullExitOnlyProfit.length, tookProfit.length),
      lowerBoundPercent,
      medianCompletedMinutesInZone: medianNumbers(zoneRecords.map((record) =>
        record.totalCompletedMinutesInZone)),
      medianFirstReachMinutes: medianNumbers(zoneRecords.map((record) => record.minutesFromEntryToFirstReach)),
      medianHoldingMinutes: medianNumbers(zoneRecords.map((record) => record.totalHoldingMinutes)),
      medianLongestConsecutiveMinutesAtOrAbove: medianNumbers(zoneRecords.map((record) =>
        record.longestConsecutiveMinutesAtOrAbove)),
      noProfitDroppedBelowFirstRatePercent: percentage(noProfitDroppedBelowFirst.length, noProfit.length),
      noProfitEndedRedGrossLossDecimal: sumDecimals(noProfitEndedRed.map((record) =>
        record.finalGrossPnlDecimal)) ?? "0",
      noProfitEndedRedRatePercent: percentage(noProfitEndedRed.length, noProfit.length),
      noProfitEndedRedTradeCount: noProfitEndedRed.length,
      noProfitExitedInZoneRatePercent: percentage(noProfitExitedInZone.length, noProfit.length),
      noProfitMaximumOpportunityGrossDecimal: sumDecimals(noProfit.map((record) =>
        record.maximumProfitOpportunityInZoneGrossDecimal)) ?? "0",
      noProfitRateOfReachedPercent: percentage(noProfit.length, zoneRecords.length),
      noProfitReachedNextFirstRatePercent: percentage(noProfitReachedNextFirst.length, noProfit.length),
      noProfitTradeCount: noProfit.length,
      partialProfitRateOfReachedPercent: percentage(tookPartialProfit.length, zoneRecords.length),
      partialProfitTakenInZoneGrossDecimal: sumDecimals(tookPartialProfit.map((record) =>
        record.partialProfitTakenInZoneGrossDecimal)) ?? "0",
      partialProfitTradeCount: tookPartialProfit.length,
      partialAndReturnedFlatRateOfReachedPercent: percentage(
        partiallyExitedAndClosedProfitably.length,
        zoneRecords.length,
      ),
      partialAndReturnedFlatTradeCount: partiallyExitedAndClosedProfitably.length,
      partialExitShareOfProfitTakingPercent: percentage(tookPartialProfit.length, tookProfit.length),
      partialExitTradeProfitInZoneGrossDecimal: sumDecimals(tookPartialProfit.map((record) =>
        record.profitTakenInZoneGrossDecimal)) ?? "0",
      profitAvailableAtLevelGrossDecimal: sumDecimals(zoneRecords.map((record) =>
        record.profitAvailableAtLevelGrossDecimal)) ?? "0",
      profitAvailableDidNotReachNextGrossDecimal: upperBoundPercent === null
        ? null
        : sumDecimals(didNotReachNext.map((record) => record.profitAvailableAtLevelGrossDecimal)) ?? "0",
      profitAvailableReachedNextGrossDecimal: upperBoundPercent === null
        ? null
        : sumDecimals(reachedNext.map((record) => record.profitAvailableAtLevelGrossDecimal)) ?? "0",
      profitTakenInZoneGrossDecimal: sumDecimals(tookProfit.map((record) =>
        record.profitTakenInZoneGrossDecimal)) ?? "0",
      profitableFullExitInZoneGrossDecimal: sumDecimals(closedProfitably.map((record) =>
        record.profitableFullExitInZoneGrossDecimal)) ?? "0",
      profitableFullExitTradeCount: closedProfitably.length,
      quantitySoldInZoneDecimal: sumDecimals(tookProfit.map((record) => record.quantitySoldInZoneDecimal)) ?? "0",
      reachRatePercent: percentage(zoneRecords.length, totalTradeCount),
      reachedNextTradeCount: upperBoundPercent === null ? null : reachedNext.length,
      reachedTradeCount: zoneRecords.length,
      tookProfitRateOfReachedPercent: percentage(tookProfit.length, zoneRecords.length),
      tookProfitTradeCount: tookProfit.length,
      upperBoundPercent,
    });
  }));
}

function analyzedScenarioTrades(input: Readonly<{
  analyzerByRoundTripId: ReadonlyMap<string, AnalyzerFact>;
  database: Database.Database;
  journalRows: readonly JournalAnalyticsRoundTripTableRow[];
  reportingMultiplierByRoundTrip: ReadonlyMap<string, string>;
  scope: WorkspaceAccessScope;
}>): readonly ScenarioTrade[] {
  const accountId = input.scope.activeAccountId;
  if (!accountId || !input.scope.allowedAccountIds.includes(accountId)) return Object.freeze([]);
  const accountScope = Object.freeze({
    accountId,
    userId: input.scope.userId,
    workspaceId: input.scope.workspaceId,
    workspaceRole: input.scope.workspaceRole,
  });
  const journalByRoundTripId = new Map(input.journalRows.map((row) =>
    [row.roundTripId, row] as const));
  const logicalAnalyzer = new LogicalTradeAnalyzerRepository(input.database);
  const trades = new JournalLogicalTradeRepository(input.database).list(accountScope);

  return Object.freeze(trades.flatMap((trade): ScenarioTrade[] => {
    if (trade.tradeStyle !== "day" || trade.lifecycleState !== "active") return [];
    const journalMembers = trade.members.map((member) => journalByRoundTripId.get(member.roundTripId) ?? null);
    if (journalMembers.some((member) => member === null)) return [];
    const members = journalMembers as readonly JournalAnalyticsRoundTripTableRow[];
    const representative = trade.members[0];
    const firstJournal = members[0];
    const lastJournal = members.at(-1);
    if (!representative || !firstJournal || !lastJournal) return [];
    const multiplier = input.reportingMultiplierByRoundTrip.get(representative.roundTripId) ?? "1";
    let scenario: DailyTradeV2ScenarioAnalysis | null = null;

    if (trade.logicalTradeId) {
      const saved = logicalAnalyzer.readCurrentByRoundTrip(accountScope, representative.roundTripId);
      if (saved?.status === "ready" && saved.analyzed) {
        scenario = analyzeDailyTradeV2Scenario({
          candles: saved.candles.map((candle) => Object.freeze({
            closeDecimal: candle.closeDecimal,
            highDecimal: candle.highDecimal,
            lowDecimal: candle.lowDecimal,
            time: candle.time,
          })),
          direction: trade.direction,
          events: saved.analyzed.eventSnapshots.map((snapshot) => Object.freeze({
            executedAtUtc: snapshot.event.executedAtUtc,
            feesDecimal: snapshot.event.feesDecimal ?? null,
            kind: snapshot.event.kind,
            priceDecimal: snapshot.event.priceDecimal,
            quantityDecimal: snapshot.event.quantityDecimal,
            sequence: snapshot.event.sequence,
          })),
        });
      }
    }

    // A materialized one-member trade is still the same individual trade. Its
    // existing round-trip analysis remains valid until a logical re-analysis
    // replaces it. Multi-member user-defined trades require their own combined
    // analysis and must never be reconstructed by ticker or by member totals.
    if (!scenario && trade.members.length === 1) {
      scenario = input.analyzerByRoundTripId.get(representative.roundTripId)?.scenario ?? null;
    }
    if (!scenario) return [];

    return [Object.freeze({
      closeLocalDate: lastJournal.closeLocalDate,
      direction: trade.direction,
      entryLocalDate: firstJournal.entryLocalDate,
      representativeRoundTripId: representative.roundTripId,
      scenario: scaleScenario(scenario, multiplier),
      symbol: trade.symbol,
      totalHoldingMinutes: Math.max(0, Date.parse(trade.closedAtUtc) - Date.parse(trade.openedAtUtc)) / 60_000,
      tradeId: trade.logicalTradeId ?? representative.roundTripId,
    })];
  }));
}

export function buildDailyTradeLongTermAnalytics(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  journalRows: readonly JournalAnalyticsRoundTripTableRow[],
  moneyBasis: "gross" | "net",
  currency: string | null,
  timezone = "America/New_York",
  reportingMultiplierByRoundTrip: ReadonlyMap<string, string> = new Map(),
): DailyTradeLongTermAnalyticsV2Model {
  const analyzer = readAnalyzerFacts(database, scope);
  const eligibleDayTrades = journalRows.filter((row) => row.tradeClassification === "day_trade");
  const scenarioTrades = analyzedScenarioTrades({
    analyzerByRoundTripId: analyzer,
    database,
    journalRows,
    reportingMultiplierByRoundTrip,
    scope,
  });
  const joined: readonly Joined[] = Object.freeze(eligibleDayTrades.flatMap((journal) => {
    const sourceFact = analyzer.get(journal.roundTripId);
    if (!sourceFact || journal.selectedPnlDecimal === null) return [];
    const fact = scaleAnalyzerFact(
      sourceFact,
      reportingMultiplierByRoundTrip.get(journal.roundTripId) ?? "1",
    );
    const opportunity = legacyOpportunityFor(fact);
    const v2Opportunity = v2OpportunityFor(fact, moneyBasis, journal.selectedPnlDecimal);
    return [Object.freeze({
      actualPnl: journal.selectedPnlDecimal,
      additional: additionalOpportunity(journal.selectedPnlDecimal, opportunity),
      analyzer: fact,
      journal,
      opportunity,
      peakToExit: peakToExitMinutes(fact),
      returnPercent: journal.returnPercentDecimal === null || journal.returnPercentDecimal === undefined
        ? null
        : new Decimal(journal.returnPercentDecimal).toNumber(),
      v2Opportunity,
    })];
  }));
  const allEvents: readonly EventJoined[] = Object.freeze(joined.flatMap((trade) =>
    trade.analyzer.events.map((event) => Object.freeze({ event, trade }))));
  const entryEvents = allEvents.filter(({ event }) => event.eventKind === "entry" || event.eventKind === "add");
  const exitEvents = allEvents.filter(({ event }) => event.eventKind === "partial_exit" || event.eventKind === "final_exit");
  const greenToRedTrades = joined.filter((row) => GREEN_TO_RED_STATUSES.includes(row.analyzer.path.status));
  const capturedValues = joined.flatMap((row) => {
    const value = capturedPercent(row.actualPnl, row.opportunity);
    return value === null ? [] : [value];
  });
  const measuredEntryExcursions = entryEvents.filter(({ event }) =>
    event.excursionFavorableDecimal !== null && event.excursionAdverseDecimal !== null);
  const excursionRows = Object.freeze(measuredEntryExcursions.map(({ event, trade }): TradeAnalysisExcursionRow => Object.freeze({
    actualPnlDecimal: trade.actualPnl,
    adverseMoveDecimal: event.excursionAdverseDecimal!,
    adverseMovePercent: excursionPercent(event.excursionAdverseDecimal!, event.priceDecimal),
    closeDate: trade.journal.closeLocalDate,
    direction: trade.journal.direction,
    entryPriceDecimal: event.priceDecimal,
    eventKind: event.eventKind === "entry" ? "Entry" : "Add",
    executionSequence: event.eventSequence,
    favorableMoveDecimal: event.excursionFavorableDecimal!,
    favorableMovePercent: excursionPercent(event.excursionFavorableDecimal!, event.priceDecimal),
    minutesUntilFlat: event.excursionMinutes ?? 0,
    roundTripId: trade.journal.roundTripId,
    symbol: trade.journal.displayedSymbol,
    trackerDate: trade.journal.entryLocalDate,
  })).sort((left, right) => right.closeDate.localeCompare(left.closeDate) || left.symbol.localeCompare(right.symbol) || left.executionSequence - right.executionSequence));
  const excursionPercentRows = measuredEntryExcursions.map(({ event }) => Object.freeze({
    adverse: excursionPercent(event.excursionAdverseDecimal!, event.priceDecimal),
    favorable: excursionPercent(event.excursionFavorableDecimal!, event.priceDecimal),
  }));
  const peakEligibleTrades = joined.filter((row) => row.analyzer.path.peakAtUtcSeconds !== null);
  const meaningfulProfitRows = Object.freeze(joined.flatMap((row): TradeAnalysisMeaningfulProfitRow[] => {
    const qualification = row.analyzer.scenario?.primaryQualification;
    if (!qualification || row.v2Opportunity === null) return [];
    return [Object.freeze({
      actualPnlDecimal: row.actualPnl,
      calculatedPotentialPnlDecimal: row.v2Opportunity,
      closeDate: row.journal.closeLocalDate,
      differenceDecimal: new Decimal(row.v2Opportunity).minus(row.actualPnl).toString(),
      direction: row.journal.direction,
      outcome: outcomeFor(row.actualPnl),
      profitLevelPriceDecimal: qualification.closePriceDecimal,
      qualifiedAtUtcSeconds: qualification.qualifiedAtUtcSeconds,
      requiredCloseCount: qualification.requiredCloseCount,
      roundTripId: row.journal.roundTripId,
      scaledOutWhileGreen: row.analyzer.scenario!.scaleOut.eventCount > 0,
      symbol: row.journal.displayedSymbol,
      thresholdPercent: qualification.thresholdPercent,
      trackerDate: row.journal.entryLocalDate,
    })];
  }).sort((left, right) => right.closeDate.localeCompare(left.closeDate) || left.symbol.localeCompare(right.symbol)));
  const greenToRedOpportunityRows = Object.freeze(scenarioTrades.flatMap((trade): TradeAnalysisGreenToRedOpportunityRow[] => {
    const opportunity = trade.scenario.greenOpportunity;
    const calculatedFinalGross = trade.scenario.calculatedFinalGrossResultDecimal;
    if (!opportunity || new Decimal(opportunity.maximumGrossProfitOpportunityDecimal).lte(0)) return [];
    return [Object.freeze({
      closeDate: trade.closeLocalDate,
      direction: trade.direction,
      finalGrossPnlDecimal: calculatedFinalGross,
      firstReachedTwentyAtUtcSeconds: opportunity.firstReachedTwentyAtUtcSeconds,
      firstRedAfterTwentyAtUtcSeconds: opportunity.firstRedAfterTwentyAtUtcSeconds,
      maximumGainAtUtcSeconds: opportunity.maximumGainAtUtcSeconds,
      maximumGainPercent: opportunity.maximumGainPercent,
      maximumGainPriceDecimal: opportunity.maximumGainPriceDecimal,
      maximumGrossProfitOpportunityDecimal: opportunity.maximumGrossProfitOpportunityDecimal,
      peakZoneLowerBoundPercent: opportunity.peakZoneLowerBoundPercent,
      peakZoneUpperBoundPercent: opportunity.peakZoneUpperBoundPercent,
      profitOpportunityToFinalDifferenceDecimal: new Decimal(opportunity.maximumGrossProfitOpportunityDecimal)
        .minus(calculatedFinalGross)
        .toString(),
      profitSecuredGrossDecimal: opportunity.profitSecuredGrossDecimal,
      profitTakingExitCount: opportunity.profitTakingExitCount,
      recoveredAfterTurningRed: opportunity.recoveredAfterTurningRed,
      roundTripId: trade.representativeRoundTripId,
      symbol: trade.symbol,
      timeInPeakZoneMinutes: opportunity.timeInPeakZoneMinutes,
      totalHoldingMinutes: trade.totalHoldingMinutes,
      trackerDate: trade.entryLocalDate,
    })];
  }).sort((left, right) => right.closeDate.localeCompare(left.closeDate) || left.symbol.localeCompare(right.symbol)));
  const scalingRows = Object.freeze(joined.flatMap((row): TradeAnalysisScalingOutRow[] => {
    const qualification = row.analyzer.scenario?.primaryQualification;
    const scaleOut = row.analyzer.scenario?.scaleOut;
    if (!qualification || !scaleOut || row.v2Opportunity === null) return [];
    return [Object.freeze({
      actualPnlDecimal: row.actualPnl,
      closeDate: row.journal.closeLocalDate,
      direction: row.journal.direction,
      maximumOpenQuantityDecimal: scaleOut.maximumOpenQuantityDecimal,
      positionReducedPercent: scaleOut.positionReducedPercent,
      profitSecuredGrossDecimal: scaleOut.profitSecuredGrossDecimal,
      profitProtection: row.analyzer.profitProtection,
      remainingQuantityDecimal: scaleOut.remainingQuantityDecimal,
      requiredCloseCount: qualification.requiredCloseCount,
      roundTripId: row.journal.roundTripId,
      scaledOutWhileGreen: scaleOut.eventCount > 0,
      scaledQuantityDecimal: scaleOut.scaledQuantityDecimal,
      symbol: row.journal.displayedSymbol,
      thresholdPercent: qualification.thresholdPercent,
      trackerDate: row.journal.entryLocalDate,
    })];
  }).sort((left, right) => right.closeDate.localeCompare(left.closeDate) || left.symbol.localeCompare(right.symbol)));
  const noScaleEndedRedRows = meaningfulProfitRows.filter((row) =>
    !row.scaledOutWhileGreen && row.outcome === "ended_red");
  const profitZoneRecords = Object.freeze(scenarioTrades.flatMap((trade): TradeAnalysisProfitZoneRecord[] =>
    trade.scenario.profitZones.flatMap((zone) => {
      if (zone.firstReachedAtUtcSeconds === null ||
          zone.firstReachSource === null ||
          zone.maximumProfitOpportunityInZoneGrossDecimal === null ||
          zone.minutesFromEntryToFirstReach === null ||
          zone.profitAvailableAtLevelGrossDecimal === null ||
          zone.observedOutcome === "did_not_reach") return [];
      return [Object.freeze({
        closeDate: trade.closeLocalDate,
        direction: trade.direction,
        finalGrossPnlDecimal: trade.scenario.calculatedFinalGrossResultDecimal,
        firstReachedAtUtcSeconds: zone.firstReachedAtUtcSeconds,
        firstReachSource: zone.firstReachSource,
        longestConsecutiveMinutesAtOrAbove: zone.longestConsecutiveMinutesAtOrAbove,
        lowerBoundPercent: zone.lowerBoundPercent,
        maximumProfitOpportunityInZoneGrossDecimal:
          zone.maximumProfitOpportunityInZoneGrossDecimal,
        minutesFromEntryToFirstReach: zone.minutesFromEntryToFirstReach,
        observedOutcome: zone.observedOutcome,
        partialProfitTakenAfterNextGrossDecimal: zone.partialProfitTakenAfterNextGrossDecimal,
        partialProfitTakenBeforeNextGrossDecimal: zone.partialProfitTakenBeforeNextGrossDecimal,
        partialProfitTakenInZoneGrossDecimal: zone.partialProfitTakenInZoneGrossDecimal,
        partialProfitTakingExitCount: zone.partialProfitTakingExitCount,
        profitAvailableAtLevelGrossDecimal: zone.profitAvailableAtLevelGrossDecimal,
        profitTakenInZoneGrossDecimal: zone.profitTakenInZoneGrossDecimal,
        profitableFullExitInZoneGrossDecimal: zone.profitableFullExitInZoneGrossDecimal,
        quantitySoldInZoneDecimal: zone.quantitySoldInZoneDecimal,
        reachedNextLevel: zone.reachedNextLevel,
        roundTripId: trade.representativeRoundTripId,
        symbol: trade.symbol,
        totalCompletedMinutesInZone: zone.totalCompletedMinutesInZone,
        totalHoldingMinutes: trade.totalHoldingMinutes,
        tradeId: trade.tradeId,
        trackerDate: trade.entryLocalDate,
        upperBoundPercent: zone.upperBoundPercent,
      })];
    })
  ).sort((left, right) => right.closeDate.localeCompare(left.closeDate) ||
    left.symbol.localeCompare(right.symbol) || left.lowerBoundPercent - right.lowerBoundPercent));
  const profitZoneRecordsByDirection = Object.freeze({
    long: Object.freeze(profitZoneRecords.filter((record) => record.direction === "long")),
    short: Object.freeze(profitZoneRecords.filter((record) => record.direction === "short")),
  });
  const eventPathRows = Object.freeze(allEvents.flatMap(({ event, trade }): TradeAnalysisEventPathRow[] =>
    event.postEventPaths.map((path) => Object.freeze({
      adverseMoveDecimal: path.oppositeDirectionMoveDecimal,
      closeDate: trade.journal.closeLocalDate,
      direction: trade.journal.direction,
      eventKind: eventKindLabel(event.eventKind),
      eventPriceDecimal: event.priceDecimal,
      eventSequence: event.eventSequence,
      executedAtUtc: event.executedAtUtc,
      favorableMoveDecimal: path.tradeDirectionMoveDecimal,
      minutesAfterEvent: path.minutesAfterEvent,
      observedAtCandleTime: path.observedAtCandleTime,
      roundTripId: trade.journal.roundTripId,
      session: tradingSession(event.executedAtUtc, timezone),
      symbol: trade.journal.displayedSymbol,
      trackerDate: trade.journal.entryLocalDate,
    }))
  ).sort((left, right) => right.closeDate.localeCompare(left.closeDate) ||
    left.symbol.localeCompare(right.symbol) || left.eventSequence - right.eventSequence ||
    left.minutesAfterEvent - right.minutesAfterEvent));
  const executionContextRows = Object.freeze(allEvents.map(({ event, trade }): TradeAnalysisExecutionContextRow => Object.freeze({
    actualPnlDecimal: trade.actualPnl,
    atr14Percent: event.atr14Percent,
    candleLocationPercent: event.candleLocationRatio === null ? null : event.candleLocationRatio * 100,
    closeDate: trade.journal.closeLocalDate,
    direction: trade.journal.direction,
    ema9DistancePercent: event.ema9DistancePercent,
    ema9FiveMinuteDistancePercent: event.fiveMinuteEma9DistancePercent,
    eventKind: eventKindLabel(event.eventKind),
    eventPriceDecimal: event.priceDecimal,
    eventSequence: event.eventSequence,
    executedAtUtc: event.executedAtUtc,
    relativeVolume: event.relativeVolume,
    returnPercent: trade.returnPercent,
    roundTripId: trade.journal.roundTripId,
    session: tradingSession(event.executedAtUtc, timezone),
    symbol: trade.journal.displayedSymbol,
    trackerDate: trade.journal.entryLocalDate,
    vwapDistancePercent: event.vwapDistancePercent,
  })).sort((left, right) => right.closeDate.localeCompare(left.closeDate) ||
    left.symbol.localeCompare(right.symbol) || left.eventSequence - right.eventSequence));
  const thresholdCountsFor = (direction: "long" | "short" | null) => Object.freeze(
    [50, 30, 20, 15].map((thresholdPercent) => {
      const requiredCloseCount = thresholdPercent === 50 ? 3 : thresholdPercent === 30 ? 5 : thresholdPercent === 20 ? 10 : 15;
      return Object.freeze({
        qualifiedTradeCount: joined.filter((row) =>
          (direction === null || row.journal.direction === direction) && row.v2Opportunity !== null &&
          row.analyzer.scenario?.qualifications.some((qualification) =>
            qualification.thresholdPercent === thresholdPercent)).length,
        requiredCloseCount,
        thresholdPercent,
      });
    }),
  );
  return Object.freeze({
    analyzedExecutionCount: allEvents.length,
    analyzedTradeCount: joined.length,
    averageAdditionalOpportunityDecimal: averageDecimals(joined.flatMap((row) => row.additional === null ? [] : [row.additional])),
    averagePnlDecimal: averageDecimals(joined.map((row) => row.actualPnl)),
    averageReturnPercent: averageNumbers(joined.flatMap((row) => row.returnPercent === null ? [] : [row.returnPercent])),
    coveragePercent: percentage(joined.length, eligibleDayTrades.length),
    currency,
    eligibleDayTradeCount: eligibleDayTrades.length,
    eligibilityBoundary: "not_configured",
    directionTradeCounts: Object.freeze({
      long: joined.filter((row) => row.journal.direction === "long").length,
      short: joined.filter((row) => row.journal.direction === "short").length,
    }),
    eventPaths: eventPathRows,
    executionContextRows,
    entryContext: Object.freeze({
      atr14Percent: eventBreakdown(entryEvents, ONE_MINUTE_ATR_BUCKETS, (event) => event.atr14Percent),
      candleLocation: eventBreakdown(entryEvents, CANDLE_LOCATION_BUCKETS, (event) => event.candleLocationRatio),
      ema9: eventBreakdown(entryEvents, DISTANCE_BUCKETS, (event) => event.ema9DistancePercent),
      ema9FiveMinute: eventBreakdown(entryEvents, DISTANCE_BUCKETS, (event) => event.fiveMinuteEma9DistancePercent),
      relativeVolume: eventBreakdown(entryEvents, RELATIVE_VOLUME_BUCKETS, (event) => event.relativeVolume),
      vwap: eventBreakdown(entryEvents, DISTANCE_BUCKETS, (event) => event.vwapDistancePercent),
    }),
    entryContextByDirection: Object.freeze({
      long: Object.freeze({
        atr14Percent: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "long"), ENTRY_EVENT_KINDS, ONE_MINUTE_ATR_BUCKETS, (event) => event.atr14Percent),
        candleLocation: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "long"), ENTRY_EVENT_KINDS, CANDLE_LOCATION_BUCKETS, (event) => event.candleLocationRatio),
        ema9: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "long"), ENTRY_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.ema9DistancePercent),
        ema9FiveMinute: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "long"), ENTRY_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.fiveMinuteEma9DistancePercent),
        relativeVolume: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "long"), ENTRY_EVENT_KINDS, RELATIVE_VOLUME_BUCKETS, (event) => event.relativeVolume),
        vwap: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "long"), ENTRY_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.vwapDistancePercent),
      }),
      short: Object.freeze({
        atr14Percent: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "short"), ENTRY_EVENT_KINDS, ONE_MINUTE_ATR_BUCKETS, (event) => event.atr14Percent),
        candleLocation: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "short"), ENTRY_EVENT_KINDS, CANDLE_LOCATION_BUCKETS, (event) => event.candleLocationRatio),
        ema9: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "short"), ENTRY_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.ema9DistancePercent),
        ema9FiveMinute: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "short"), ENTRY_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.fiveMinuteEma9DistancePercent),
        relativeVolume: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "short"), ENTRY_EVENT_KINDS, RELATIVE_VOLUME_BUCKETS, (event) => event.relativeVolume),
        vwap: eventKindBreakdown(entryEvents.filter(({ trade }) => trade.journal.direction === "short"), ENTRY_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.vwapDistancePercent),
      }),
    }),
    exitContext: exitRows(exitEvents),
    exitContextByDirection: Object.freeze({
      long: exitRows(exitEvents.filter(({ trade }) => trade.journal.direction === "long")),
      short: exitRows(exitEvents.filter(({ trade }) => trade.journal.direction === "short")),
    }),
    exitExecutionContextByDirection: Object.freeze({
      long: Object.freeze({
        atr14Percent: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "long"), EXIT_EVENT_KINDS, ONE_MINUTE_ATR_BUCKETS, (event) => event.atr14Percent),
        candleLocation: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "long"), EXIT_EVENT_KINDS, CANDLE_LOCATION_BUCKETS, (event) => event.candleLocationRatio),
        ema9: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "long"), EXIT_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.ema9DistancePercent),
        ema9FiveMinute: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "long"), EXIT_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.fiveMinuteEma9DistancePercent),
        relativeVolume: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "long"), EXIT_EVENT_KINDS, RELATIVE_VOLUME_BUCKETS, (event) => event.relativeVolume),
        vwap: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "long"), EXIT_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.vwapDistancePercent),
      }),
      short: Object.freeze({
        atr14Percent: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "short"), EXIT_EVENT_KINDS, ONE_MINUTE_ATR_BUCKETS, (event) => event.atr14Percent),
        candleLocation: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "short"), EXIT_EVENT_KINDS, CANDLE_LOCATION_BUCKETS, (event) => event.candleLocationRatio),
        ema9: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "short"), EXIT_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.ema9DistancePercent),
        ema9FiveMinute: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "short"), EXIT_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.fiveMinuteEma9DistancePercent),
        relativeVolume: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "short"), EXIT_EVENT_KINDS, RELATIVE_VOLUME_BUCKETS, (event) => event.relativeVolume),
        vwap: eventKindBreakdown(exitEvents.filter(({ trade }) => trade.journal.direction === "short"), EXIT_EVENT_KINDS, DISTANCE_BUCKETS, (event) => event.vwapDistancePercent),
      }),
    }),
    greenToRed: outcomeRows(joined),
    greenToRedByDirection: Object.freeze({
      long: outcomeRows(joined.filter((row) => row.journal.direction === "long")),
      short: outcomeRows(joined.filter((row) => row.journal.direction === "short")),
    }),
    greenToRedDamage: greenToRedDamageFor(joined),
    greenToRedDamageByDirection: Object.freeze({
      long: greenToRedDamageFor(joined.filter((row) => row.journal.direction === "long")),
      short: greenToRedDamageFor(joined.filter((row) => row.journal.direction === "short")),
    }),
    greenToRedOpportunity: Object.freeze({
      rows: greenToRedOpportunityRows,
      tradeCountsByDirection: Object.freeze({
        long: scenarioTrades.filter((trade) => trade.direction === "long").length,
        short: scenarioTrades.filter((trade) => trade.direction === "short").length,
      }),
    }),
    greenToRedTradeCount: greenToRedTrades.length,
    holding: holdingRows(joined),
    holdingDuration: holdingDurationRows(joined),
    entryTime: entryTimeRows(joined, timezone),
    entryOpportunityRisk: Object.freeze({
      averageAdverseMoveDecimal: averageDecimals(measuredEntryExcursions.map(({ event }) => event.excursionAdverseDecimal!)),
      averageFavorableMoveDecimal: averageDecimals(measuredEntryExcursions.map(({ event }) => event.excursionFavorableDecimal!)),
      medianAdverseMoveDecimal: medianDecimals(measuredEntryExcursions.map(({ event }) => event.excursionAdverseDecimal!)),
      medianFavorableMoveDecimal: medianDecimals(measuredEntryExcursions.map(({ event }) => event.excursionFavorableDecimal!)),
      measuredExecutionCount: measuredEntryExcursions.length,
    }),
    excursions: excursionRows,
    mfeMae: Object.freeze({
      averageAdverseMovePercent: averageNumbers(excursionPercentRows.map((row) => row.adverse)),
      averageFavorableMovePercent: averageNumbers(excursionPercentRows.map((row) => row.favorable)),
      breakdown: Object.freeze([
        excursionBreakdown("Entries", measuredEntryExcursions.filter(({ event }) => event.eventKind === "entry")),
        excursionBreakdown("Adds", measuredEntryExcursions.filter(({ event }) => event.eventKind === "add")),
        excursionBreakdown("Long", measuredEntryExcursions.filter(({ trade }) => trade.journal.direction === "long")),
        excursionBreakdown("Short", measuredEntryExcursions.filter(({ trade }) => trade.journal.direction === "short")),
      ].filter((row) => row.measuredExecutionCount > 0)),
      medianAdverseMovePercent: medianNumbers(excursionPercentRows.map((row) => row.adverse)),
      medianFavorableMovePercent: medianNumbers(excursionPercentRows.map((row) => row.favorable)),
    }),
    malformedSnapshotCount: joined.reduce((sum, row) => sum + row.analyzer.malformedSnapshotCount, 0),
    meaningfulProfit: Object.freeze({
      endedFlatTradeCount: meaningfulProfitRows.filter((row) => row.outcome === "ended_flat").length,
      endedGreenTradeCount: meaningfulProfitRows.filter((row) => row.outcome === "ended_green").length,
      endedRedTradeCount: meaningfulProfitRows.filter((row) => row.outcome === "ended_red").length,
      noScaleEndedRedActualPnlDecimal: sumDecimals(noScaleEndedRedRows.map((row) => row.actualPnlDecimal)),
      noScaleEndedRedDifferenceDecimal: sumDecimals(noScaleEndedRedRows.map((row) => row.differenceDecimal)),
      noScaleEndedRedPotentialPnlDecimal: sumDecimals(noScaleEndedRedRows.map((row) => row.calculatedPotentialPnlDecimal)),
      noScaleEndedRedTradeCount: noScaleEndedRedRows.length,
      rows: meaningfulProfitRows,
      thresholdCounts: thresholdCountsFor(null),
      thresholdCountsByDirection: Object.freeze({
        long: thresholdCountsFor("long"),
        short: thresholdCountsFor("short"),
      }),
      totalActualPnlDecimal: sumDecimals(meaningfulProfitRows.map((row) => row.actualPnlDecimal)),
      totalDifferenceDecimal: sumDecimals(meaningfulProfitRows.map((row) => row.differenceDecimal)),
      totalPotentialPnlDecimal: sumDecimals(meaningfulProfitRows.map((row) => row.calculatedPotentialPnlDecimal)),
      tradeCount: meaningfulProfitRows.length,
    }),
    moneyBasis,
    opportunityTradeCount: joined.filter((row) => row.opportunity !== null).length,
    profitCapture: Object.freeze({
      averageCapturedPercent: averageNumbers(capturedValues),
      averagePeakToFinalGivebackDecimal: averageDecimals(joined.flatMap((row) =>
        row.analyzer.path.peakToFinalReversalDecimal === null ? [] : [row.analyzer.path.peakToFinalReversalDecimal])),
      medianCapturedPercent: medianNumbers(capturedValues),
      totalActualPnlDecimal: sumDecimals(joined.map((row) => row.actualPnl)),
      totalAdditionalOpportunityDecimal: sumDecimals(joined.flatMap((row) => row.additional === null ? [] : [row.additional])),
      totalPotentialPnlDecimal: sumDecimals(joined.map((row) =>
        new Decimal(row.actualPnl).plus(row.additional ?? 0).toString())),
    }),
    patterns: patternRows(allEvents),
    profitZones: Object.freeze({
      recordsByDirection: profitZoneRecordsByDirection,
      rowsByDirection: Object.freeze({
        long: profitZoneSummaryRows(
          profitZoneRecordsByDirection.long,
          scenarioTrades.filter((trade) => trade.direction === "long").length,
        ),
        short: profitZoneSummaryRows(
          profitZoneRecordsByDirection.short,
          scenarioTrades.filter((trade) => trade.direction === "short").length,
        ),
      }),
      tradeCountsByDirection: Object.freeze({
        long: scenarioTrades.filter((trade) => trade.direction === "long").length,
        short: scenarioTrades.filter((trade) => trade.direction === "short").length,
      }),
    }),
    riskManagement: Object.freeze({
      addedAfterPeak: behaviorRows(
        peakEligibleTrades,
        "Added after the peak",
        "Did not add after the peak",
        (row) => row.analyzer.path.addedAfterPeakCount > 0,
      ),
      partialExitBeforeRed: behaviorRows(
        greenToRedTrades,
        "Partially exited before red",
        "No partial exit before red",
        (row) => row.analyzer.path.partialExitBeforeRedCount > 0,
      ),
    }),
    scalingOut: Object.freeze({
      noScaleEndedRedTradeCount: scalingRows.filter((row) =>
        !row.scaledOutWhileGreen && new Decimal(row.actualPnlDecimal).isNegative()).length,
      noScaleTradeCount: scalingRows.filter((row) => !row.scaledOutWhileGreen).length,
      rows: scalingRows,
      scaledOutTradeCount: scalingRows.filter((row) => row.scaledOutWhileGreen).length,
      tradeCount: scalingRows.length,
    }),
    timezone,
    trades: Object.freeze(joined.map((row): TradeAnalysisTradeRow => {
      const finalExit = finalExitEvent(row.analyzer.events);
      const finalExitPriceDecimal = finalExit?.priceDecimal ?? null;
      const postExitThirtyMinuteMoveDecimal = row.analyzer.postExitThirtyMinuteMoveDecimal;
      return Object.freeze({
        actualPnlDecimal: row.actualPnl,
        additionalOpportunityDecimal: row.additional,
        capturedPercent: capturedPercent(row.actualPnl, row.opportunity),
        closeDate: row.journal.closeLocalDate,
        direction: row.journal.direction,
        executionCount: row.analyzer.events.length,
        finalExitPriceDecimal,
        greenToRedStatus: row.analyzer.path.status,
        malformedSnapshotCount: row.analyzer.malformedSnapshotCount,
        peakToExitMinutes: row.peakToExit,
        postExitThirtyMinuteMoveDecimal,
        postExitThirtyMinutePriceDecimal: postExitPrice(
          row.journal.direction,
          finalExitPriceDecimal,
          postExitThirtyMinuteMoveDecimal,
        ),
        returnPercent: row.returnPercent,
        roundTripId: row.journal.roundTripId,
        sustainedOpportunityDecimal: row.opportunity,
        symbol: row.journal.displayedSymbol,
        trackerDate: row.journal.entryLocalDate,
      });
    }).sort((left, right) => right.closeDate.localeCompare(left.closeDate) || left.symbol.localeCompare(right.symbol))),
    winRatePercent: percentage(joined.filter((row) => new Decimal(row.actualPnl).gt(0)).length, joined.length),
  });
}
