import Decimal from "decimal.js";
import type { DailyTradeAnalyzerResult } from "../../modules/level-analysis/contracts/daily-trade-analyzer-contracts";
import type { TradeExecutionIndicatorResult } from "./trend-momentum-executions";

export type TrendMomentumTrade = Readonly<{
  tradeId: string; representativeRoundTripId: string; symbol: string; direction: "long" | "short";
  closeDate: string; trackerDate: string; pnlDecimal: string | null;
  analysis: DailyTradeAnalyzerResult | null;
}>;
export type IndicatorExecutionKind = "initial_entry" | "re_entry" | "add" | "partial_exit" | "position_close" | "final_exit";
export type TrendMomentumRecord = Readonly<Omit<TrendMomentumTrade, "analysis"> & {
  executionId: string; executionKind: IndicatorExecutionKind; executedAtUtc: string; executionSequence: number;
  context: TradeExecutionIndicatorResult["executions"][number] | null;
}>;
export type TrendMomentumProjection = Readonly<{
  tradeCount: number; analyzedTradeCount: number; indicatorTradeCount: number;
  records: readonly TrendMomentumRecord[];
  trades: readonly Readonly<Omit<TrendMomentumTrade, "analysis"> & {
    indicators: TradeExecutionIndicatorResult | null; unavailableReason: string | null;
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
      records.push(Object.freeze({ ...identity, executionId: event.eventId, executionKind: kind,
        executedAtUtc: event.executedAtUtc, executionSequence: event.sequence, context: contexts.get(event.eventId) ?? null }));
    }
  }
  return Object.freeze({
    tradeCount: trades.length,
    analyzedTradeCount: trades.filter((t) => t.analysis !== null).length,
    indicatorTradeCount: trades.filter((t) => t.analysis?.trendMomentum != null).length,
    records: Object.freeze(records),
    trades: Object.freeze(trades.map(({ analysis, ...identity }) => Object.freeze({
      ...identity, indicators: analysis?.trendMomentum ?? null,
      unavailableReason: analysis?.trendMomentumUnavailableReason ?? (analysis?.trendMomentum ? null : "not_yet_analyzed"),
    }))),
  });
}

/** A trade contributes its actual selected-basis outcome only once per group. */
export function summarizeIndicatorRecords(records: readonly TrendMomentumRecord[]) {
  const trades = new Map<string, string | null>();
  for (const record of records) {
    if (trades.has(record.tradeId) && trades.get(record.tradeId) !== record.pnlDecimal) throw new Error("indicator_trade_outcome_conflict");
    trades.set(record.tradeId, record.pnlDecimal);
  }
  const known = [...trades.values()].filter((p): p is string => p !== null).map((p) => new Decimal(p));
  if (known.some((p) => !p.isFinite())) throw new Error("indicator_trade_outcome_invalid");
  const sum = known.reduce((total, p) => total.plus(p), new Decimal(0));
  return Object.freeze({ tradeCount: trades.size, occurrenceCount: records.length, pnlTradeCount: known.length,
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
