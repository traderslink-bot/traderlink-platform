import { selectIndicatorStudy, selectIndicatorReclaimStudy, summarizeIndicatorRecords, type TrendMomentumProjection } from "./trend-momentum-analytics";
import { parseIndicatorConditions, type IndicatorConditionFilters } from "./trend-momentum-cohorts";

export function duringStudySelection(query: Pick<URLSearchParams, "get">) {
  const reference = query.get("indicator_reference"), side = query.get("indicator_ema20Side"), group = query.get("indicator_during_group");
  return {
    interval: query.get("indicator_interval") === "5m" ? "5m" : "1m",
    reference: reference === "ema20" || reference === "vwap" ? reference : "ema9",
    event: query.get("indicator_event") === "reclaim" ? "reclaim" : "loss",
    ema20Side: side === "above" || side === "below" || side === "neutral" ? side : "any",
    coverage: query.get("indicator_coverage") === "incomplete" ? "incomplete" : "complete",
    group: group === "nonmatching" || group === "unknown" ? group : "matching",
    filters: parseIndicatorConditions({ get: (key) => query.get(key.replace("indicator_", "indicator_during_")) }),
  } as const;
}

export function duringStudyTradeQuery(query: URLSearchParams, direction: "long" | "short", group: "matching" | "nonmatching" | "unknown") {
  const next = new URLSearchParams(query);
  next.set("indicator_study", "during"); next.set("indicator_during_group", group); next.set("direction", direction);
  for (const key of ["cursor", "page", "indicator_page"]) next.delete(key);
  return next.toString();
}

type Episode = ReturnType<typeof selectIndicatorStudy>[number]["episode"];
export type DuringStudySelection = Readonly<{
  interval: "1m" | "5m"; reference: "ema9" | "ema20" | "vwap"; event: "loss" | "reclaim";
  filters: IndicatorConditionFilters; ema20Side: "any" | "above" | "below" | "neutral";
}>;
export type DuringStudyRow = Readonly<{
  trade: TrendMomentumProjection["trades"][number]; episode: Episode;
  at: number; price: number | null; match: boolean | null;
  followThrough: Pick<Episode, "horizons" | "untilClosure"> | null;
}>;

function matchEpisode(episode: Episode, selection: DuringStudySelection): boolean | null {
  const saved = selection.event === "loss" ? episode.lossContext : episode.reclaimStudy;
  const context = saved?.context;
  const values = { alignment: context?.alignment ?? null, ema9Direction: context?.ema9Direction ?? null,
    ema20Direction: context?.ema20Direction ?? null, separation: context?.separation ?? null,
    rsiBand: context?.rsiBand ?? null, rsiDirection: context?.rsiDirection ?? null,
    vwapSide: saved?.vwapSide === "neutral" ? "near" : saved?.vwapSide ?? null,
    spacing: context?.spacing === "standard" || context?.spacing === "sparse" ? context.spacing : null };
  const selected = (Object.keys(selection.filters) as (keyof IndicatorConditionFilters)[]).filter((key) => selection.filters[key] !== "any");
  const ema20Side = saved?.ema20Side ?? (selection.event === "loss" ? episode.ema20SideAtLoss : null);
  if (selected.some((key) => values[key] === null) || (selection.ema20Side !== "any" && ema20Side === null)) return null;
  return selected.every((key) => selection.filters[key] === values[key]) &&
    (selection.ema20Side === "any" || selection.ema20Side === ema20Side);
}

/** First means first recorded event across the whole saved trade, BEFORE condition filtering. */
export function buildDuringStudy(projection: TrendMomentumProjection, selection: DuringStudySelection) {
  const events = selection.event === "loss" ? selectIndicatorStudy(projection, selection.interval, selection.reference, false)
    : selectIndicatorReclaimStudy(projection, selection.interval, selection.reference, false);
  const rows: DuringStudyRow[] = events.map(({ trade, episode }) => ({ trade, episode,
    at: selection.event === "loss" ? episode.at : episode.reclaimedAt!,
    price: selection.event === "loss" ? episode.price : episode.reclaimPrice,
    followThrough: selection.event === "loss" ? episode : episode.reclaimStudy ?? null,
    match: matchEpisode(episode, selection),
  })).sort((a, b) => a.at - b.at || a.trade.tradeId.localeCompare(b.trade.tradeId) || a.episode.cycle - b.episode.cycle);
  const first = new Map<string, DuringStudyRow>();
  for (const row of rows) if (!first.has(row.trade.tradeId)) first.set(row.trade.tradeId, row);
  const complete = { matching: [] as DuringStudyRow[], nonmatching: [] as DuringStudyRow[], unknown: [] as DuringStudyRow[] };
  const incomplete = { matching: [] as DuringStudyRow[], nonmatching: [] as DuringStudyRow[], unknown: [] as DuringStudyRow[] };
  for (const row of first.values()) {
    const coverage = row.episode.firstEventCoverage === "complete" ? complete : incomplete;
    coverage[row.match === true ? "matching" : row.match === false ? "nonmatching" : "unknown"].push(row);
  }
  const noEvent: string[] = [], presenceUnknown: string[] = [];
  const frame = selection.interval === "1m" ? "oneMinute" : "fiveMinute";
  for (const trade of projection.trades) if (!first.has(trade.tradeId)) {
    const valid = !trade.indicators?.timingUnavailable && trade.indicators?.duringTrade?.[frame]?.historyComplete?.[selection.reference] === true;
    (valid ? noEvent : presenceUnknown).push(trade.tradeId);
  }
  return { complete, incomplete, occurrences: rows, noEventTradeIds: noEvent, unknownPresenceTradeIds: presenceUnknown };
}

export function summarizeDuringStudy(rows: readonly DuringStudyRow[], event: "loss" | "reclaim") {
  const observed = rows.filter((row) => row.episode.recovery === "observed_reclaim").length;
  const noRecorded = rows.filter((row) => row.episode.recovery === "no_recorded_reclaim_before_closure").length;
  const unknown = rows.length - observed - noRecorded;
  return { ...summarizeIndicatorRecords(rows.map((row) => row.trade)),
    cycleCount: new Set(rows.map((row) => JSON.stringify([row.trade.tradeId, row.episode.cycle]))).size,
    observed, noRecorded, unknown,
    // Reclaim-selected samples cannot estimate the chance of a reclaim.
    recordedReclaimRate: event === "loss" && observed + noRecorded > 0 ? 100 * observed / (observed + noRecorded) : null,
    horizons: ([5, 15, 30, 60] as const).map((minutes) => {
      const counts = { timing_unavailable: 0, closed_before_horizon: 0, closed_at_horizon: 0, endpoint_unavailable: 0, measured: 0 };
      const changes: number[] = [];
      for (const row of rows) {
        const horizon = row.followThrough?.horizons.find((value) => value.minutes === minutes);
        counts[horizon?.status ?? "timing_unavailable"]++;
        if (horizon?.status === "measured" && horizon.changePercent !== null) changes.push(horizon.changePercent);
      }
      return { minutes, counts, averageChangePercent: changes.length ? changes.reduce((sum, value) => sum + value, 0) / changes.length : null };
    }),
  };
}
