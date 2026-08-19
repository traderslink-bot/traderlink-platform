import Decimal from "decimal.js";
import type Database from "better-sqlite3";

import type { JournalAnalyticsRoundTripTableRow } from "@/src/modules/journal-analytics/contracts/analytics-result";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type { DailyTradeGreenToRedStatus } from "../contracts/daily-trade-analyzer-contracts";
import { readDailyTradePathMaterialization } from "./daily-trade-path-materialization-repository";

type AnalysisRow = Readonly<{
  daily_trade_analysis_version_id: string;
  round_trip_id: string;
  round_trip_version_id: string;
}>;

type SnapshotRow = Readonly<{
  event_kind: "entry" | "add" | "partial_exit" | "final_exit";
  snapshot_json: string;
}>;

type PatternFact = Readonly<{
  candlesBeforeExecution: 0 | 1 | 2;
  kind: string;
  timeframe: "1m" | "5m";
}>;

type EventFact = Readonly<{
  candleLocationRatio: number | null;
  ema9DistancePercent: number | null;
  eventKind: SnapshotRow["event_kind"];
  eventSequence: number;
  executedAtUtc: string;
  excursionAdverseDecimal: string | null;
  excursionFavorableDecimal: string | null;
  excursionMinutes: number | null;
  givebackDecimal: string | null;
  patterns: readonly PatternFact[];
  priorFavorableExtremePriceDecimal: string | null;
  priceDecimal: string;
  relativeVolume: number | null;
  vwapDistancePercent: number | null;
}>;

type AnalyzerFact = Readonly<{
  events: readonly EventFact[];
  malformedSnapshotCount: number;
  path: NonNullable<ReturnType<typeof readDailyTradePathMaterialization>>["path"];
  roundTripId: string;
}>;

export type TradeAnalysisBreakdownRow = Readonly<{
  averageAdditionalOpportunityDecimal: string | null;
  averagePotentialPnlDecimal: string | null;
  averagePnlDecimal: string | null;
  averageReturnPercent: number | null;
  averageValue: number | null;
  label: string;
  occurrenceCount: number;
  opportunityTradeCount: number;
  winRatePercent: number | null;
  tradeCount: number;
}>;

export type TradeAnalysisPatternRow = Readonly<{
  averagePnlDecimal: string | null;
  executionSide: "Entry" | "Exit";
  location: "Exact execution candle" | "Before execution";
  occurrenceCount: number;
  pattern: string;
  averageReturnPercent: number | null;
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
  greenToRedStatus: DailyTradeGreenToRedStatus;
  malformedSnapshotCount: number;
  peakToExitMinutes: number | null;
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
  entryContext: Readonly<{
    ema9: readonly TradeAnalysisBreakdownRow[];
    relativeVolume: readonly TradeAnalysisBreakdownRow[];
    vwap: readonly TradeAnalysisBreakdownRow[];
  }>;
  exitContext: readonly TradeAnalysisBreakdownRow[];
  greenToRed: readonly TradeAnalysisBreakdownRow[];
  greenToRedDamage: Readonly<{
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
  riskManagement: Readonly<{
    addedAfterPeak: readonly TradeAnalysisBreakdownRow[];
    partialExitBeforeRed: readonly TradeAnalysisBreakdownRow[];
  }>;
  timezone: string;
  trades: readonly TradeAnalysisTradeRow[];
  winRatePercent: number | null;
}>;

export function readDailyTradeAnalysisCurrencies(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): readonly string[] {
  const accountId = scope.activeAccountId;
  if (!accountId || !scope.allowedAccountIds.includes(accountId)) return Object.freeze([]);
  const rows = database.prepare<[string, string], { trade_currency: string }>(`SELECT DISTINCT round_trip_version.trade_currency
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
ORDER BY round_trip_version.trade_currency`).all(scope.workspaceId, accountId);
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
    if (!snapshot || !event || !metrics || typeof event.executedAtUtc !== "string" ||
        Number.isNaN(Date.parse(event.executedAtUtc))) return null;
    const eventSequence = finiteNumber(event.sequence);
    const priceDecimal = decimalString(event.priceDecimal);
    if (eventSequence === null || !Number.isInteger(eventSequence) || priceDecimal === null || new Decimal(priceDecimal).lte(0)) return null;
    const indicators = record(snapshot.indicators);
    const vwapDistance = record(metrics.vwapDistance);
    const ema9Distance = record(metrics.ema9Distance);
    const excursion = record(metrics.excursionUntilFlat);
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
      candleLocationRatio: finiteNumber(metrics.candleLocationRatio),
      ema9DistancePercent: finiteNumber(ema9Distance?.signedDistancePercent),
      eventKind: row.event_kind,
      eventSequence,
      executedAtUtc: event.executedAtUtc,
      excursionAdverseDecimal: decimalString(excursion?.adverseMoveDecimal),
      excursionFavorableDecimal: decimalString(excursion?.favorableMoveDecimal),
      excursionMinutes: finiteNumber(excursion?.minutesUntilFlat),
      givebackDecimal: decimalString(metrics.givebackFromPriorFavorableExtremeDecimal),
      patterns: Object.freeze(patterns),
      priorFavorableExtremePriceDecimal: decimalString(metrics.priorFavorableExtremePriceDecimal),
      priceDecimal,
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
  version.daily_trade_analysis_version_id
FROM journal_round_trip_daily_trade_analyses analysis
JOIN journal_round_trip_daily_trade_analysis_versions version
  ON version.daily_trade_analysis_id = analysis.daily_trade_analysis_id
  AND version.revision_number = analysis.current_revision
JOIN journal_round_trip_daily_trade_analysis_path_summaries summary
  ON summary.daily_trade_analysis_version_id = version.daily_trade_analysis_version_id
  AND summary.round_trip_version_id = analysis.round_trip_version_id
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
  const result = new Map<string, AnalyzerFact>();
  for (const analysis of analyses) {
    const path = readDailyTradePathMaterialization(database, analysis.daily_trade_analysis_version_id);
    if (!path || path.roundTripVersionId !== analysis.round_trip_version_id) continue;
    const rows = snapshots.all(analysis.daily_trade_analysis_version_id);
    const parsed = rows.map(parseEvent);
    result.set(analysis.round_trip_id, Object.freeze({
      events: Object.freeze(parsed.filter((event): event is EventFact => event !== null)),
      malformedSnapshotCount: parsed.filter((event) => event === null).length,
      path: path.path,
      roundTripId: analysis.round_trip_id,
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

function opportunityFor(fact: AnalyzerFact): string | null {
  const index = fact.path.bestProfitOpportunityIndex;
  return index === null ? null : fact.path.profitOpportunities[index]?.peakPnlDecimal ?? null;
}

function scaledDecimal(value: string | null, multiplier: string): string | null {
  return value === null ? null : new Decimal(value).times(multiplier).toString();
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
    occurrenceCount,
    opportunityTradeCount: opportunityRows.length,
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

const DISTANCE_BUCKETS = Object.freeze([
  { label: "5%+ below", test: (value: number) => value < -5 },
  { label: "1-5% below", test: (value: number) => value >= -5 && value < -1 },
  { label: "Within 1%", test: (value: number) => value >= -1 && value <= 1 },
  { label: "1-5% above", test: (value: number) => value > 1 && value <= 5 },
  { label: "5%+ above", test: (value: number) => value > 5 },
]);

const RELATIVE_VOLUME_BUCKETS = Object.freeze([
  { label: "Below 1x", test: (value: number) => value < 1 },
  { label: "1-2x", test: (value: number) => value >= 1 && value < 2 },
  { label: "2-3x", test: (value: number) => value >= 2 && value < 3 },
  { label: "3x+", test: (value: number) => value >= 3 },
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
    const key = `${pattern.timeframe}|${side}|${location}|${pattern.kind}`;
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
      executionSide: first.event.eventKind === "entry" || first.event.eventKind === "add" ? "Entry" : "Exit",
      location: group.pattern.candlesBeforeExecution === 0 ? "Exact execution candle" : "Before execution",
      occurrenceCount: group.events.length,
      pattern: group.pattern.kind,
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

export function buildDailyTradeLongTermAnalytics(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  journalRows: readonly JournalAnalyticsRoundTripTableRow[],
  moneyBasis: "gross" | "net",
  currency: string | null,
  timezone = "America/New_York",
  reportingMultiplierByRoundTrip: ReadonlyMap<string, string> = new Map(),
): DailyTradeLongTermAnalyticsModel {
  const analyzer = readAnalyzerFacts(database, scope);
  const eligibleDayTrades = journalRows.filter((row) => row.tradeClassification === "day_trade");
  const joined: readonly Joined[] = Object.freeze(eligibleDayTrades.flatMap((journal) => {
    const sourceFact = analyzer.get(journal.roundTripId);
    if (!sourceFact || journal.selectedPnlDecimal === null) return [];
    const fact = scaleAnalyzerFact(
      sourceFact,
      reportingMultiplierByRoundTrip.get(journal.roundTripId) ?? "1",
    );
    const opportunity = opportunityFor(fact);
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
    })];
  }));
  const allEvents: readonly EventJoined[] = Object.freeze(joined.flatMap((trade) =>
    trade.analyzer.events.map((event) => Object.freeze({ event, trade }))));
  const entryEvents = allEvents.filter(({ event }) => event.eventKind === "entry" || event.eventKind === "add");
  const exitEvents = allEvents.filter(({ event }) => event.eventKind === "partial_exit" || event.eventKind === "final_exit");
  const greenStatuses: readonly DailyTradeGreenToRedStatus[] = [
    "green_to_red_ended_red", "green_to_red_recovered", "green_to_red_ended_flat",
  ];
  const greenToRedTrades = joined.filter((row) => greenStatuses.includes(row.analyzer.path.status));
  const endedRedTrades = joined.filter((row) => row.analyzer.path.status === "green_to_red_ended_red");
  const recoveries = greenToRedTrades.filter((row) => row.analyzer.path.firstRecoveryAtUtcSeconds !== null);
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
    entryContext: Object.freeze({
      ema9: eventBreakdown(entryEvents, DISTANCE_BUCKETS, (event) => event.ema9DistancePercent),
      relativeVolume: eventBreakdown(entryEvents, RELATIVE_VOLUME_BUCKETS, (event) => event.relativeVolume),
      vwap: eventBreakdown(entryEvents, DISTANCE_BUCKETS, (event) => event.vwapDistancePercent),
    }),
    exitContext: exitRows(exitEvents),
    greenToRed: outcomeRows(joined),
    greenToRedDamage: Object.freeze({
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
    timezone,
    trades: Object.freeze(joined.map((row): TradeAnalysisTradeRow => Object.freeze({
      actualPnlDecimal: row.actualPnl,
      additionalOpportunityDecimal: row.additional,
      capturedPercent: capturedPercent(row.actualPnl, row.opportunity),
      closeDate: row.journal.closeLocalDate,
      direction: row.journal.direction,
      executionCount: row.analyzer.events.length,
      greenToRedStatus: row.analyzer.path.status,
      malformedSnapshotCount: row.analyzer.malformedSnapshotCount,
      peakToExitMinutes: row.peakToExit,
      returnPercent: row.returnPercent,
      roundTripId: row.journal.roundTripId,
      sustainedOpportunityDecimal: row.opportunity,
      symbol: row.journal.displayedSymbol,
      trackerDate: row.journal.entryLocalDate,
    })).sort((left, right) => right.closeDate.localeCompare(left.closeDate) || left.symbol.localeCompare(right.symbol))),
    winRatePercent: percentage(joined.filter((row) => new Decimal(row.actualPnl).gt(0)).length, joined.length),
  });
}
