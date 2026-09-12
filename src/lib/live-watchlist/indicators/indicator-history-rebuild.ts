import type { IndicatorCandle } from "./indicator-engine";
import type { IndicatorSeriesSnapshot } from "./indicator-series";

/** Evidence of a revised price basis, not a claim about which corporate action caused it. */
export function indicatorHistoryRebuildReason(cached: IndicatorSeriesSnapshot, incoming: readonly IndicatorCandle[]): "older_seed_history" | "price_history_rebased" | null {
  if (incoming.some(bar => bar.start < (cached.initialCheckpoint.last?.end ?? 0))) return "older_seed_history";
  const previous = new Map(cached.candles.map(bar => [bar.start, bar]));
  const overlap = incoming.flatMap(bar => { const old = previous.get(bar.start); return old ? [{ old, bar }] : []; });
  if (overlap.length < 3) return null;
  const ratio = overlap[0].bar.close / overlap[0].old.close;
  if (!Number.isFinite(ratio) || Math.abs(ratio - 1) < 0.000001) return null;
  const fields = ["open", "high", "low", "close"] as const;
  return overlap.every(({ old, bar }) => fields.every(field => Math.abs(bar[field] / old[field] - ratio) <= 0.000001 * Math.max(1, ratio)))
    ? "price_history_rebased" : null;
}
