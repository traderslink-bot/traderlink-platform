import { hasCompletedIndicatorCoverage, type IndicatorHistoryRange } from "./trend-momentum-history";
import type { tradeIndicatorContextAt } from "./trend-momentum-context";

export type IndicatorObservation = Readonly<{ at: number; close: number; ema9: number | null;
  ema20: number | null; vwap: number | null; rsi14: number | null }>;
export type IndicatorPositionCycle = Readonly<{ openedAt: number; closedAt: number; closingPrice: number }>;
type Reference = "ema9" | "ema20" | "vwap";
type Recovery = "observed_reclaim" | "no_recorded_reclaim_before_closure" | "unknown";
type Episode = {
  reference: Reference; cycle: number; at: number; previousSideAt: number; price: number;
  lossSide: "above" | "below"; firstEventCoverage: "complete" | "incomplete";
  ema20SideAtLoss: "above" | "below" | "neutral" | null; rsi14: number | null;
  recovery: Recovery; reclaimedAt: number | null; reclaimPrice: number | null;
};
function side(price: number, reference: number | null): "above" | "below" | "neutral" | null {
  if (reference === null || !Number.isFinite(reference) || reference <= 0) return null;
  const difference = 100 * (price - reference) / reference;
  return difference > 0.02 ? "above" : difference < -0.02 ? "below" : "neutral";
}

/** Recorded closes during actual held cycles; never reconstructs trades by ticker. */
export function analyzeIndicatorEpisodes(input: Readonly<{
  observations: readonly IndicatorObservation[];
  oneMinuteCloses: readonly Readonly<{ at: number; close: number }>[];
  cycles: readonly IndicatorPositionCycle[];
  completedRanges: readonly IndicatorHistoryRange[];
  resetTimes: readonly number[];
  direction: "long" | "short";
  contextAt?: (at: number) => ReturnType<typeof tradeIndicatorContextAt>;
}>) {
  const observations = input.observations;
  if (observations.some((o, i) => !Number.isFinite(o.at) || !Number.isFinite(o.close) || o.close <= 0 ||
      (i > 0 && observations[i - 1].at >= o.at)) ||
      input.cycles.some((c, i) => !Number.isFinite(c.openedAt) || !Number.isFinite(c.closedAt) ||
        c.closedAt <= c.openedAt || !Number.isFinite(c.closingPrice) || c.closingPrice <= 0 ||
        (i > 0 && input.cycles[i - 1].closedAt > c.openedAt))) throw new Error("indicator_episode_timeline_invalid");
  const covered = (from: number, to: number) => to <= from ||
    hasCompletedIndicatorCoverage(input.completedRanges, Math.floor(from), Math.ceil(to));
  const interrupted = (from: number, to: number) =>
    !covered(from, to) || input.resetTimes.some((at) => at > from && at <= to);
  const adverse = input.direction === "long" ? "below" : "above";
  const favourable = input.direction === "long" ? "above" : "below";
  const episodes: Episode[] = [];
  const crossings: { kind: "ema_cross" | "rsi_midpoint"; cycle: number; at: number;
    previousSideAt: number; side: "above" | "below"; price: number }[] = [];
  const hasCycles = input.cycles.length > 0;
  const historyComplete: Record<Reference, boolean> = { ema9: hasCycles, ema20: hasCycles, vwap: hasCycles };

  input.cycles.forEach((cycle, cycleIndex) => {
    const held = observations.filter((o) => o.at > cycle.openedAt && o.at < cycle.closedAt);
    const entryContext = observations.findLast((o) => o.at <= cycle.openedAt);
    for (const reference of ["ema9", "ema20", "vwap"] as const) {
      if (!entryContext || entryContext[reference] === null || interrupted(entryContext.at, cycle.openedAt)) {
        historyComplete[reference] = false;
      }
      let previous: { side: "above" | "below"; at: number } | null = null;
      if (entryContext && !interrupted(entryContext.at, cycle.openedAt)) {
        const entrySide = side(entryContext.close, entryContext[reference]);
        if (entrySide === "above" || entrySide === "below") previous = { side: entrySide, at: entryContext.at };
      }
      let priorAt = cycle.openedAt;
      let open: Episode | null = null;
      if (!held.length) historyComplete[reference] = false;
      for (const o of held) {
        if (interrupted(priorAt, o.at)) {
          if (open) open.recovery = "unknown";
          open = null; previous = null; historyComplete[reference] = false;
        }
        const currentSide = side(o.close, o[reference]);
        if (currentSide === null) {
          if (open) open.recovery = "unknown";
          open = null; previous = null; historyComplete[reference] = false;
        } else if (currentSide !== "neutral") {
          if (previous && previous.side === favourable && currentSide === adverse) {
            open = { reference, cycle: cycleIndex, at: o.at, previousSideAt: previous.at, price: o.close,
              lossSide: adverse, firstEventCoverage: historyComplete[reference] ? "complete" : "incomplete",
              ema20SideAtLoss: side(o.close, o.ema20), rsi14: o.rsi14,
              recovery: "unknown", reclaimedAt: null, reclaimPrice: null };
            episodes.push(open);
          } else if (open && currentSide === favourable) {
            open.recovery = "observed_reclaim"; open.reclaimedAt = o.at; open.reclaimPrice = o.close; open = null;
          }
          previous = { side: currentSide, at: o.at };
        }
        priorAt = o.at;
      }
      if (open) open.recovery = interrupted(priorAt, cycle.closedAt) ? "unknown" : "no_recorded_reclaim_before_closure";
      if (interrupted(priorAt, cycle.closedAt)) historyComplete[reference] = false;
    }
    for (const kind of ["ema_cross", "rsi_midpoint"] as const) {
      let previous: { side: "above" | "below"; at: number } | null = null;
      if (entryContext && !interrupted(entryContext.at, cycle.openedAt)) {
        const difference = kind === "ema_cross" ? entryContext.ema9 === null || entryContext.ema20 === null ? null
          : 100 * (entryContext.ema9 - entryContext.ema20) / entryContext.close
          : entryContext.rsi14 === null ? null : entryContext.rsi14 - 50;
        const threshold = kind === "ema_cross" ? 0.02 : 0;
        const entrySide = difference === null ? null : difference > threshold ? "above"
          : difference < -threshold ? "below" : "neutral";
        if (entrySide === "above" || entrySide === "below") previous = { side: entrySide, at: entryContext.at };
      }
      let priorAt = cycle.openedAt;
      for (const o of held) {
        if (interrupted(priorAt, o.at)) previous = null;
        const difference = kind === "ema_cross" ? o.ema9 === null || o.ema20 === null ? null
          : 100 * (o.ema9 - o.ema20) / o.close : o.rsi14 === null ? null : o.rsi14 - 50;
        const threshold = kind === "ema_cross" ? 0.02 : 0;
        const currentSide = difference === null ? null : difference > threshold ? "above"
          : difference < -threshold ? "below" : "neutral";
        if (currentSide === null) previous = null;
        else if (currentSide !== "neutral") {
          if (previous && previous.side !== currentSide) crossings.push({
            kind, cycle: cycleIndex, at: o.at, previousSideAt: previous.at, side: currentSide, price: o.close });
          previous = { side: currentSide, at: o.at };
        }
        priorAt = o.at;
      }
    }
  });
  const endpoint = new Map(input.oneMinuteCloses.map((o) => [o.at, o.close]));
  const followThrough = (cycleIndex: number, from: number, fromPrice: number) => {
    const cycle = input.cycles[cycleIndex];
    const horizons = ([5, 15, 30, 60] as const).map((minutes) => {
      const at = from + minutes * 60;
      const price = endpoint.get(at);
      const status = cycle.closedAt < at ? "closed_before_horizon" : cycle.closedAt === at ? "closed_at_horizon"
        : !Number.isFinite(price) || price! <= 0 || interrupted(from, at) ? "endpoint_unavailable" : "measured";
      return Object.freeze({ minutes, status,
        changePerShare: status === "measured" ? price! - fromPrice : null,
        changePercent: status === "measured" ? 100 * (price! - fromPrice) / fromPrice : null });
    });
    return { horizons: Object.freeze(horizons),
      untilClosure: Object.freeze({ at: cycle.closedAt, changePerShare: cycle.closingPrice - fromPrice,
        changePercent: 100 * (cycle.closingPrice - fromPrice) / fromPrice }) };
  };
  const byTime = new Map(observations.map((observation) => [observation.at, observation]));
  const studyContext = (at: number) => {
    const observation = byTime.get(at)!;
    return { context: input.contextAt?.(at) ?? null, ema20Side: side(observation.close, observation.ema20),
      vwapSide: side(observation.close, observation.vwap), rsi14: observation.rsi14 };
  };
  // Optional fields retain compatibility with previously saved loss-only evidence.
  const enriched: (Episode & ReturnType<typeof followThrough> & {
    lossContext?: ReturnType<typeof studyContext>;
    reclaimStudy?: ReturnType<typeof followThrough> & ReturnType<typeof studyContext> & { at: number; price: number };
  })[] = episodes.map((episode) => {
    const reclaimStudy = episode.recovery === "observed_reclaim" && episode.reclaimedAt !== null && episode.reclaimPrice !== null
      ? { at: episode.reclaimedAt, price: episode.reclaimPrice, ...studyContext(episode.reclaimedAt),
        ...followThrough(episode.cycle, episode.reclaimedAt, episode.reclaimPrice) } : undefined;
    return Object.freeze({ ...episode, ...followThrough(episode.cycle, episode.at, episode.price),
      lossContext: studyContext(episode.at), ...(reclaimStudy ? { reclaimStudy } : {}) });
  });
  return Object.freeze({ episodes: Object.freeze(enriched),
    crossings: Object.freeze(crossings.map((c) => Object.freeze(c))),
    historyComplete: Object.freeze(historyComplete) });
}
