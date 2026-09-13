import Decimal from "decimal.js";
import type { DailyTradeAnalyzerResult } from "../../modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import type { TradeExecutionIndicatorResult } from "./trend-momentum-executions";

export type TrendMomentumTrade = Readonly<{
  tradeId: string; representativeRoundTripId: string; symbol: string; direction: "long" | "short";
  closeDate: string; trackerDate: string; pnlDecimal: string | null;
  returnPercentDecimal?: string | null;
  analysis: Pick<DailyTradeAnalyzerResult, "eventSnapshots" | "trendMomentum" | "trendMomentumUnavailableReason"> | null;
}>;
export type IndicatorExecutionKind = "initial_entry" | "re_entry" | "add" | "partial_exit" | "position_close" | "final_exit";
export type TrendMomentumRecord = Readonly<Omit<TrendMomentumTrade, "analysis"> & {
  executionId: string; executionKind: IndicatorExecutionKind; executedAtUtc: string; executionSequence: number;
  executionPriceDecimal: string;
  context: TradeExecutionIndicatorResult["executions"][number] | null;
}>;
export type TrendMomentumProjection = Readonly<{
  tradeCount: number; analyzedTradeCount: number; indicatorTradeCount: number;
  records: readonly TrendMomentumRecord[];
  trades: readonly Readonly<Omit<TrendMomentumTrade, "analysis"> & {
    indicators: Omit<TradeExecutionIndicatorResult, "chartSeries"> | null; unavailableReason: string | null;
  }>[];
}>;

export function buildTrendMomentumProjection(trades: readonly TrendMomentumTrade[]): TrendMomentumProjection {
  if (new Set(trades.map((t) => t.tradeId)).size !== trades.length) throw new Error("indicator_duplicate_logical_trade");
  const records: TrendMomentumRecord[] = [];
  for (const trade of trades) {
    const { analysis, ...identity } = trade;
    let entries = 0;
    const contexts = new Map(analysis?.trendMomentum?.executions.map((e) => [e.eventId, e]) ?? []);
    for (const snapshot of [...(analysis?.eventSnapshots ?? [])].sort((a, b) => a.event.sequence - b.event.sequence)) {
      const event = snapshot.event;
      const kind = event.kind === "entry" ? entries++ === 0 ? "initial_entry" : "re_entry"
        : event.kind === "temporary_flat" ? "position_close" : event.kind;
      const candidate = contexts.get(event.eventId);
      records.push(Object.freeze({ ...identity, executionId: event.eventId, executionKind: kind,
        executionPriceDecimal: event.priceDecimal,
        executedAtUtc: event.executedAtUtc, executionSequence: event.sequence,
        context: candidate?.executedAtUtc === event.executedAtUtc ? candidate : null }));
    }
  }
  return Object.freeze({
    tradeCount: trades.length,
    analyzedTradeCount: trades.filter((t) => t.analysis !== null).length,
    indicatorTradeCount: trades.filter((t) => t.analysis?.trendMomentum != null).length,
    records: Object.freeze(records),
    trades: Object.freeze(trades.map(({ analysis, ...identity }) => Object.freeze({
      ...identity, indicators: analysis?.trendMomentum ? {
        calculationVersion: analysis.trendMomentum.calculationVersion,
        historyOutcome: analysis.trendMomentum.historyOutcome,
        timingUnavailable: analysis.trendMomentum.timingUnavailable,
        duringTrade: analysis.trendMomentum.duringTrade,
        executions: analysis.trendMomentum.executions,
        ...(analysis.trendMomentum.landmarks ? { landmarks: analysis.trendMomentum.landmarks } : {}),
      } : null,
      unavailableReason: analysis?.trendMomentumUnavailableReason ?? (analysis?.trendMomentum ? null : "not_yet_analyzed"),
    }))),
  });
}

/** A trade contributes its actual selected-basis outcome only once per group. */
export function summarizeIndicatorRecords(records: readonly Pick<TrendMomentumRecord, "tradeId" | "pnlDecimal" | "returnPercentDecimal">[]) {
  const trades = new Map<string, string | null>();
  for (const record of records) {
    if (trades.has(record.tradeId) && trades.get(record.tradeId) !== record.pnlDecimal) throw new Error("indicator_trade_outcome_conflict");
    trades.set(record.tradeId, record.pnlDecimal);
  }
  const known = [...trades.values()].filter((p): p is string => p !== null).map((p) => new Decimal(p));
  if (known.some((p) => !p.isFinite())) throw new Error("indicator_trade_outcome_invalid");
  const sum = known.reduce((total, p) => total.plus(p), new Decimal(0));
  const sorted = [...known].sort((a, b) => a.cmp(b));
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length ? sorted.length % 2 ? sorted[middle] : sorted[middle - 1].plus(sorted[middle]).div(2) : null;
  const returns = [...new Map(records.map((record) => [record.tradeId, record.returnPercentDecimal ?? null])).values()]
    .filter((value): value is string => value !== null).map((value) => new Decimal(value));
  if (returns.some((value) => !value.isFinite())) throw new Error("indicator_trade_return_invalid");
  return Object.freeze({ tradeCount: trades.size, occurrenceCount: records.length, pnlTradeCount: known.length,
    wins: known.filter((p) => p.gt(0)).length, losses: known.filter((p) => p.lt(0)).length,
    breakevens: known.filter((p) => p.eq(0)).length, medianPnlDecimal: median?.toFixed() ?? null,
    returnTradeCount: returns.length,
    averageReturnPercent: returns.length ? returns.reduce((total, value) => total.plus(value), new Decimal(0)).div(returns.length).toNumber() : null,
    totalPnlDecimal: known.length ? sum.toFixed() : null,
    averagePnlDecimal: known.length ? sum.div(known.length).toFixed() : null,
    winRatePercent: known.length ? 100 * known.filter((p) => p.gt(0)).length / known.length : null });
}

export function selectIndicatorStudy(projection: TrendMomentumProjection,
  interval: "1m" | "5m", reference: "ema9" | "ema20" | "vwap", firstOnly: boolean) {
  const frame = interval === "1m" ? "oneMinute" : "fiveMinute";
  return projection.trades.flatMap((trade) => {
    const all = [...(trade.indicators?.duringTrade?.[frame]?.episodes ?? [])]
      .filter((e) => e.reference === reference).sort((a, b) => a.at - b.at || a.cycle - b.cycle);
    // Select the first event BEFORE callers apply any context condition.
    return (firstOnly ? all.slice(0, 1) : all).map((episode) => ({ trade, episode }));
  });
}

export function summarizeIndicatorStudy(rows: ReturnType<typeof selectIndicatorStudy>) {
  const observed = rows.filter((r) => r.episode.recovery === "observed_reclaim").length;
  const noRecorded = rows.filter((r) => r.episode.recovery === "no_recorded_reclaim_before_closure").length;
  const unknown = rows.length - observed - noRecorded;
  const horizons = ([5, 15, 30, 60] as const).map((minutes) => {
    const values = rows.map((r) => r.episode.horizons.find((h) => h.minutes === minutes));
    const counts = { timing_unavailable: 0, closed_before_horizon: 0, closed_at_horizon: 0, endpoint_unavailable: 0, measured: 0 };
    const measured: number[] = [];
    for (const value of values) {
      const status = value?.status ?? "timing_unavailable";
      counts[status]++;
      if (status === "measured" && value?.changePercent != null) measured.push(value.changePercent);
    }
    return { minutes, counts, averageChangePercent: measured.length
      ? measured.reduce((sum, v) => sum + v, 0) / measured.length : null };
  });
  return { occurrenceCount: rows.length, tradeCount: new Set(rows.map((r) => r.trade.tradeId)).size,
    observed, noRecorded, unknown, recordedReclaimRate: observed + noRecorded ? 100 * observed / (observed + noRecorded) : null,
    horizons };
}

/** Select by reclaim time before applying conditions; never replace missing context with a later event. */
export function selectIndicatorReclaimStudy(projection: TrendMomentumProjection,
  interval: "1m" | "5m", reference: "ema9" | "ema20" | "vwap", firstOnly: boolean) {
  const frame = interval === "1m" ? "oneMinute" : "fiveMinute";
  return projection.trades.flatMap((trade) => {
    const reclaimed = [...(trade.indicators?.duringTrade?.[frame]?.episodes ?? [])]
      .filter((episode) => episode.reference === reference && episode.recovery === "observed_reclaim" && episode.reclaimedAt !== null)
      .sort((a, b) => a.reclaimedAt! - b.reclaimedAt! || a.cycle - b.cycle);
    return (firstOnly ? reclaimed.slice(0, 1) : reclaimed).map((episode) => ({ trade, episode,
      observation: episode.reclaimStudy ?? null }));
  });
}
