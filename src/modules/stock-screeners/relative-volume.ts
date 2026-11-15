import type { ChartMarketSession } from "../scanner/alpaca/chart-calendar";
import type { MarketSession } from "./contracts";
import { sessionBounds, type ProviderBar, type Window } from "./market-metrics";

const FRAME = 15 * 60_000;
const SLOTS_PER_DAY = 64;
const HISTORY_SESSIONS = 10;
const MINIMUM_SESSIONS = 8;

type Comparison = { day: number; start: number; end: number };
type RelativeVolumeWindow = { cutoff: number; previous: Comparison[] };

export function relativeVolumeSchedule(days: readonly ChartMarketSession[], windows: Record<MarketSession, Window>, basisDate?: string) {
  const indices = new Map(days.map((day, index) => [day.date, index]));
  const current = Object.values(windows).map(window => indices.get(window.date)!);
  const anchor = Math.max(...current, basisDate === undefined ? -1 : (indices.get(basisDate) ?? -1));
  // Keep the prior session's baseline warm until today's last regular close is available.
  const first = Math.max(0, Math.min(anchor - 1, ...current) - HISTORY_SESSIONS);
  const reference = days.slice(first, anchor);
  const slots = new Map<number, number>();
  for (const [index, day] of reference.entries()) {
    const start = sessionBounds(day, "premarket").from;
    for (let slot = 0; slot < SLOTS_PER_DAY; slot++) slots.set(start + slot * FRAME, index * SLOTS_PER_DAY + slot);
  }
  const plans = new Map<MarketSession, RelativeVolumeWindow>();
  for (const window of Object.values(windows)) {
    const index = indices.get(window.date)!;
    const elapsed = Math.floor((window.asOf - window.from) / FRAME);
    if (!elapsed) continue;
    const offset = window.from - sessionBounds(days[index], "premarket").from;
    const previous: Comparison[] = [];
    for (let prior = Math.max(first, index - HISTORY_SESSIONS); prior < index; prior++) {
      const day = days[prior];
      const dayStart = sessionBounds(day, "premarket").from;
      const phase = sessionBounds(day, window.session);
      if (phase.from - dayStart !== offset || phase.from + elapsed * FRAME > phase.until) continue;
      const dayIndex = (prior - first) * SLOTS_PER_DAY;
      const start = dayIndex + offset / FRAME;
      previous.push({ day: dayIndex, start, end: start + elapsed });
    }
    if (previous.length >= MINIMUM_SESSIONS) plans.set(window.session, { cutoff: window.from + elapsed * FRAME, previous });
  }
  return {
    from: slots.keys().next().value ?? 0,
    until: reference.length ? sessionBounds(reference.at(-1)!, "premarket").from + SLOTS_PER_DAY * FRAME : 0,
    slots,
    plans,
  };
}

export function relativeVolumeHistory(
  bars: ReadonlyMap<string, ReadonlyMap<number, ProviderBar>>,
  rejected: ReadonlySet<string>,
  slots: ReadonlyMap<number, number>,
) {
  const series = new Map<string, Float64Array>();
  for (const [symbol, observations] of bars) {
    if (rejected.has(symbol)) continue;
    const prefix = new Float64Array(slots.size + 1);
    for (const bar of observations.values()) {
      const index = slots.get(bar.time * 1000);
      if (index !== undefined) prefix[index + 1] = bar.volume;
    }
    for (let index = 1; index < prefix.length; index++) prefix[index] += prefix[index - 1];
    if (prefix[prefix.length - 1] > 0) series.set(symbol, prefix);
  }
  return series;
}

export function relativeVolumeAtTime(window: Window, plan: RelativeVolumeWindow, bars: readonly ProviderBar[], prefix: Float64Array) {
  let observations = 0, baseline = 0;
  for (const prior of plan.previous) {
    // A fully fetched day with trades can have zero volume before the cutoff.
    // An entirely unobserved day cannot establish a comparison.
    if (prefix[prior.day + SLOTS_PER_DAY] <= prefix[prior.day]) continue;
    observations++;
    baseline += prefix[prior.end] - prefix[prior.start];
  }
  if (observations < MINIMUM_SESSIONS || baseline <= 0) return undefined;
  const volume = bars.reduce((total, bar) => {
    const time = bar.time * 1000;
    return time >= window.from && time + 5 * 60_000 <= plan.cutoff ? total + bar.volume : total;
  }, 0);
  const value = volume / (baseline / observations);
  return Number.isFinite(value) ? value : undefined;
}
