import type { TrendMomentumProjection } from "./trend-momentum-analytics";

/** Display scope only: preserve analysis results, including missing/older indicators. */
export function analyzedIndicatorPopulation(projection: TrendMomentumProjection): TrendMomentumProjection {
  const recorded = new Set(projection.records.map((record) => record.tradeId));
  // Older offline snapshots predate analyzed metadata; saved executions/context
  // are positive analysis evidence, unlike journal-only trade identities.
  const allAnalyzed = projection.analyzedTradeCount === projection.trades.length;
  const trades = projection.trades.filter((trade) => trade.analyzed ??
    (allAnalyzed || recorded.has(trade.tradeId) || trade.indicators !== null));
  const ids = new Set(trades.map((trade) => trade.tradeId));
  return { ...projection, trades, records: projection.records.filter((record) => ids.has(record.tradeId)),
    tradeCount: trades.length, analyzedTradeCount: trades.length,
    indicatorTradeCount: trades.filter((trade) => trade.indicators !== null).length };
}
