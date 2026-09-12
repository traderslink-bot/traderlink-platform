import { hasCompletedIndicatorCoverage, type IndicatorHistoryRange } from "./trend-momentum-history";
import type { TradeIndicatorPoint } from "./trend-momentum-indicators";

export type TradeIndicatorContextPolicy = Readonly<{
  version: string;
  minimumBars: Readonly<{ ema9: number; ema20: number; rsi14: number }>;
  maxAgeSeconds: number;
  emaChangePercent: number;
  rsiChangePoints: number;
}>;

type Direction = "rising" | "falling" | "little_change";
function direction(change: number | null, threshold: number): Direction | null {
  return change === null ? null : change > threshold ? "rising" : change < -threshold ? "falling" : "little_change";
}

/** Use only an internally calculated, strictly chronological series. */
export function tradeIndicatorContextAt(input: Readonly<{
  series: readonly TradeIndicatorPoint[];
  at: number;
  interval: "1m" | "5m";
  completedRanges: readonly IndicatorHistoryRange[];
  resetTimes: readonly number[];
  policy: TradeIndicatorContextPolicy;
}>) {
  const { policy } = input;
  if (!Number.isFinite(input.at) || input.at <= 0 || !policy.version ||
      !Number.isSafeInteger(policy.maxAgeSeconds) || policy.maxAgeSeconds < 0 ||
      !Number.isFinite(policy.emaChangePercent) || policy.emaChangePercent < 0 ||
      !Number.isFinite(policy.rsiChangePoints) || policy.rsiChangePoints < 0 ||
      Object.values(policy.minimumBars).some((count) => !Number.isSafeInteger(count) || count < 1)) {
    throw new Error("trade_indicator_context_policy_invalid");
  }
  // Upper-bound search prevents a containing, unfinished candle being selected.
  let lower = 0;
  let upper = input.series.length;
  while (lower < upper) {
    const middle = Math.floor((lower + upper) / 2);
    if (input.series[middle].availableAt <= input.at) lower = middle + 1;
    else upper = middle;
  }
  const index = lower - 1;
  const current = input.series[index];
  if (!current) return null;
  const prior = input.series[index - 3];
  const eligible = (point: TradeIndicatorPoint | undefined, name: "ema9" | "ema20" | "rsi14") =>
    point && point.historyBars >= policy.minimumBars[name] &&
      !(name === "rsi14" && point.unchangedCloseBars >= policy.minimumBars.rsi14) ? point[name] : null;
  const ema9 = eligible(current, "ema9");
  const ema20 = eligible(current, "ema20");
  const rsi14 = eligible(current, "rsi14");
  const span = prior ? current.availableAt - prior.availableAt : null;
  const reset = prior ? input.resetTimes.some((at) => at > prior.time && at <= current.availableAt) : false;
  const covered = prior ? hasCompletedIndicatorCoverage(input.completedRanges, prior.time, current.availableAt) : false;
  const spacing = !prior ? "insufficient_bars" : reset ? "interrupted"
    : !covered ? "coverage_incomplete"
    : span === (input.interval === "1m" ? 180 : 900) ? "standard" : "sparse";
  const canCompare = spacing === "standard" || spacing === "sparse";
  const delta = (name: "ema9" | "ema20" | "rsi14") => {
    const a = eligible(current, name), b = eligible(prior, name);
    return !canCompare || a === null || b === null ? null : name === "rsi14" ? a - b : 100 * (a - b) / current.close;
  };
  const ema9ChangePercent = delta("ema9");
  const ema20ChangePercent = delta("ema20");
  const rsiChangePoints = delta("rsi14");
  const separationPercent = ema9 === null || ema20 === null ? null : 100 * (ema9 - ema20) / current.close;
  const prior9 = eligible(prior, "ema9"), prior20 = eligible(prior, "ema20");
  const separationChange = canCompare && separationPercent !== null && prior && prior9 !== null && prior20 !== null
    ? Math.abs(separationPercent) - Math.abs(100 * (prior9 - prior20) / prior.close) : null;
  const age = input.at - current.availableAt;
  return Object.freeze({
    policyVersion: policy.version,
    interval: input.interval,
    observedAt: current.availableAt,
    ageSeconds: age,
    currentWordingEligible: age <= policy.maxAgeSeconds,
    historyBars: current.historyBars,
    lookbackSpanSeconds: span,
    spacing,
    ema9, ema20, rsi14,
    rsiUnavailableReason: current.unchangedCloseBars >= policy.minimumBars.rsi14 ? "no_recent_price_change"
      : rsi14 === null ? "insufficient_history" : null,
    ema9ChangePercent, ema20ChangePercent, rsiChangePoints, separationPercent, separationChange,
    ema9Direction: direction(ema9ChangePercent, policy.emaChangePercent),
    ema20Direction: direction(ema20ChangePercent, policy.emaChangePercent),
    rsiDirection: direction(rsiChangePoints, policy.rsiChangePoints),
    alignment: separationPercent === null ? null : separationPercent > policy.emaChangePercent ? "above"
      : separationPercent < -policy.emaChangePercent ? "below" : "close",
    separation: separationChange === null ? null : separationChange > policy.emaChangePercent ? "expanding"
      : separationChange < -policy.emaChangePercent ? "contracting" : "little_change",
    rsiBand: rsi14 === null ? null : rsi14 < 30 ? "below_30" : rsi14 < 50 ? "30_to_below_50"
      : rsi14 <= 70 ? "50_to_70" : "above_70",
  });
}
