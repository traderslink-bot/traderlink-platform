import Decimal from "decimal.js";
import type { DailyTradeAnalyzerResult } from "../../modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import type { TradeAnalysisPatternRow } from "../../modules/level-analysis/server/daily-trade-long-term-analytics-service";
import { matchesExecutionIndicatorFilter, readExecutionIndicatorFilterContext, type ExecutionIndicatorFilters, type ExecutionIndicatorFilterContext } from "./trend-momentum-execution-filter";

export type SavedPatternTrade = Readonly<{
  tradeId: string; analysisVersionId: string; representativeRoundTripId: string;
  symbol: string; direction: "long" | "short"; closeDate: string; trackerDate: string;
  openedAtUtc: string; closedAtUtc: string;
  pnlDecimal: string | null; returnPercentDecimal: string | null;
  analyzed: Pick<DailyTradeAnalyzerResult, "eventSnapshots" | "trendMomentum" | "trendMomentumUnavailableReason">;
}>;
export type SavedPatternObservation = Omit<SavedPatternTrade, "analyzed"> & Readonly<{
  occurrenceKey: string; eventId: string; eventSequence: number;
  eventKind: DailyTradeAnalyzerResult["eventSnapshots"][number]["event"]["kind"];
  executedAtUtc: string; patternSequence: number; pattern: string;
  timeframe: "1m" | "5m"; candlesBeforeExecution: 0 | 1 | 2;
  patternTime: number; knownAtTime: number;
  indicatorFilterContext: ExecutionIndicatorFilterContext | null;
}>;

/** One current version per saved trade; no ticker/sequence cross-join. */
export function savedPatternObservations(trades: readonly SavedPatternTrade[]): SavedPatternObservation[] {
  const seen = new Set<string>();
  const result: SavedPatternObservation[] = [];
  for (const trade of trades) {
    if (seen.has(trade.tradeId)) throw new Error("duplicate_saved_pattern_trade");
    seen.add(trade.tradeId);
    const { analyzed, ...identity } = trade;
    for (const snapshot of analyzed.eventSnapshots) {
      if (!snapshot?.event || !Array.isArray(snapshot.patterns)) continue;
      const event = snapshot.event, executedAt = Date.parse(event.executedAtUtc) / 1000;
      if (!Number.isFinite(executedAt)) continue;
      const indicatorFilterContext = readExecutionIndicatorFilterContext(snapshot.indicatorFilterContext, event);
      snapshot.patterns.forEach((pattern, patternSequence) => {
        if (!pattern.availableAtExecution || (pattern.timeframe !== "1m" && pattern.timeframe !== "5m") ||
          !Number.isFinite(pattern.knownAtTime) || pattern.knownAtTime > executedAt ||
          !Number.isFinite(pattern.time) || pattern.time > pattern.knownAtTime ||
          ![0, 1, 2].includes(pattern.candlesBeforeExecution)) return;
        result.push({ ...identity, occurrenceKey: JSON.stringify([trade.tradeId, trade.analysisVersionId, event.eventId, patternSequence]),
          eventId: event.eventId, eventSequence: event.sequence, eventKind: event.kind, executedAtUtc: event.executedAtUtc,
          patternSequence, pattern: pattern.kind, timeframe: pattern.timeframe,
          candlesBeforeExecution: pattern.candlesBeforeExecution, patternTime: pattern.time, knownAtTime: pattern.knownAtTime,
          indicatorFilterContext });
      });
    }
  }
  return result.sort((a, b) => b.executedAtUtc.localeCompare(a.executedAtUtc) || a.occurrenceKey.localeCompare(b.occurrenceKey));
}

export function summarizeSavedPatterns(observations: readonly SavedPatternObservation[], filters: ExecutionIndicatorFilters) {
  const matching = observations.filter((row) => matchesExecutionIndicatorFilter(row.indicatorFilterContext, filters) === true);
  const unavailableOccurrenceCount = observations.filter((row) => matchesExecutionIndicatorFilter(row.indicatorFilterContext, filters) === null).length;
  const groups = new Map<string, SavedPatternObservation[]>();
  for (const row of matching) {
    const side = row.eventKind === "entry" || row.eventKind === "add" ? "Entry" : "Exit";
    const key = JSON.stringify([row.direction, row.timeframe, side, row.candlesBeforeExecution === 0, row.pattern]);
    const group = groups.get(key) ?? []; group.push(row); groups.set(key, group);
  }
  const rows = [...groups.values()].map((group): TradeAnalysisPatternRow & { pnlTradeCount: number } => {
    const first = group[0]!;
    const trades = [...new Map(group.map((row) => [row.tradeId, row])).values()];
    const pnl = trades.flatMap((row) => row.pnlDecimal === null ? [] : [new Decimal(row.pnlDecimal)]).sort((a, b) => a.comparedTo(b));
    const returns = trades.flatMap((row) => row.returnPercentDecimal === null ? [] : [new Decimal(row.returnPercentDecimal)]);
    const sum = (values: Decimal[]) => values.reduce((total, value) => total.plus(value), new Decimal(0));
    const middle = Math.floor(pnl.length / 2);
    return { direction: first.direction, pattern: first.pattern, timeframe: first.timeframe === "1m" ? "1 min" : "5 min",
      executionSide: first.eventKind === "entry" || first.eventKind === "add" ? "Entry" : "Exit",
      location: first.candlesBeforeExecution === 0 ? "Exact execution candle" : "Before execution",
      occurrenceCount: group.length, tradeCount: trades.length, pnlTradeCount: pnl.length,
      totalPnlDecimal: pnl.length ? sum(pnl).toFixed() : null,
      averagePnlDecimal: pnl.length ? sum(pnl).div(pnl.length).toFixed() : null,
      medianPnlDecimal: !pnl.length ? null : (pnl.length % 2 ? pnl[middle]! : pnl[middle - 1]!.plus(pnl[middle]!).div(2)).toFixed(),
      winRatePercent: pnl.length ? pnl.filter((value) => value.gt(0)).length / pnl.length * 100 : null,
      averageReturnPercent: returns.length ? sum(returns).div(returns.length).toNumber() : null };
  }).sort((a, b) => b.occurrenceCount - a.occurrenceCount || a.pattern.localeCompare(b.pattern) || a.direction.localeCompare(b.direction) || a.timeframe.localeCompare(b.timeframe) || a.executionSide.localeCompare(b.executionSide) || a.location.localeCompare(b.location));
  return { rows, matching, unavailableOccurrenceCount, nonmatchingOccurrenceCount: observations.length - matching.length - unavailableOccurrenceCount };
}
