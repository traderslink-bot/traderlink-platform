import type { IndicatorCandle } from "../indicators/indicator-engine";
import type { WatchlistSetupVolumeEvidence } from "./setup-contracts";

/** Independent evidence, never a gate on a completed price sequence. */
export function setupVolumeEvidence(
  candle: IndicatorCandle,
  earlier: readonly IndicatorCandle[],
  knownAt: number,
): WatchlistSetupVolumeEvidence {
  const baseline = earlier.filter(bar => bar.sessionKey === candle.sessionKey && bar.end <= candle.start).slice(-5);
  const usable = baseline.length >= 3 && baseline.every(bar => bar.volume !== null && bar.end - bar.start === 60_000);
  const average = usable ? baseline.reduce((sum, bar) => sum + bar.volume!, 0) / baseline.length : null;
  const ratio = candle.volume !== null && average !== null && average > 0 ? candle.volume / average : null;
  return {
    state: candle.volume === null || (baseline.length >= 3 && !usable) ? "unavailable"
      : ratio === null ? "no-comparable-baseline" : ratio >= 1.3 ? "expanded" : "not-expanded",
    basis: "recent-minute-average", shares: candle.volume, baselineShares: average,
    baselineBars: baseline.length, ratio, candleCompletedAt: candle.end, knownAt,
  };
}
