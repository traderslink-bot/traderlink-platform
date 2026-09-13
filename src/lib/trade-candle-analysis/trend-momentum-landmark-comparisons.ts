import Decimal from "decimal.js";
import { summarizeIndicatorRecords, type TrendMomentumProjection } from "./trend-momentum-analytics";
import type { IndicatorComparisonAxis } from "./trend-momentum-cohorts";

export type IndicatorLandmarkCandidate = Readonly<{ tradeId: string; key: string; at: number; outcome: string }>;

/** Candidates come from the existing financial page, never indicator eligibility. */
export function compareIndicatorLandmarks(projection: TrendMomentumProjection | undefined,
  candidates: readonly IndicatorLandmarkCandidate[], interval: "1m" | "5m", axis: IndicatorComparisonAxis) {
  const trades = new Map(projection?.trades.map((trade) => [trade.tradeId, trade]) ?? []);
  const seen = new Set<string>();
  const directionAxis = ["ema9Direction", "ema20Direction", "rsiDirection", "separation"].includes(axis);
  const records = candidates.map((candidate) => {
    if (seen.has(candidate.tradeId)) throw new Error("indicator_landmark_duplicate_trade");
    seen.add(candidate.tradeId);
    const trade = trades.get(candidate.tradeId);
    // A changed financial landmark cannot reuse another revision's observation.
    const saved = trade?.indicators?.landmarks?.find((row) => row.key === candidate.key && row.at === candidate.at);
    const context = saved?.[interval === "1m" ? "oneMinute" : "fiveMinute"];
    const vwap = saved?.sessionVwap?.value;
    const price = saved?.lastCompletedClose;
    const delta = price != null && vwap != null && vwap > 0 ? new Decimal(price).minus(vwap).div(vwap).mul(100).toNumber() : null;
    const value = axis === "vwapSide" ? delta === null ? null : delta > 0.02 ? "above" : delta < -0.02 ? "below" : "near"
      : context?.[axis] ?? null;
    return { ...candidate, value, spacing: directionAxis ? context?.spacing ?? "unavailable" : null,
      freshness: axis === "vwapSide" ? "session" : !context ? "unavailable" : context.currentWordingEligible ? "current" : "older",
      contextAt: saved?.contextAt ?? null, precision: saved?.precision ?? null,
      spanSeconds: context?.lookbackSpanSeconds ?? null, ageSeconds: context?.ageSeconds ?? null,
      pnlDecimal: trade?.pnlDecimal ?? null, returnPercentDecimal: trade?.returnPercentDecimal ?? null };
  });
  const groups = new Map<string, typeof records>();
  for (const record of records) {
    const key = JSON.stringify([record.outcome, record.value, record.spacing, record.freshness]);
    const group = groups.get(key); if (group) group.push(record); else groups.set(key, [record]);
  }
  return { tradeCount: candidates.length, coveredTradeCount: records.filter((row) => row.value !== null).length,
    rows: [...groups].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, rows]) => ({
      key, outcome: rows[0].outcome, value: rows[0].value, spacing: rows[0].spacing, freshness: rows[0].freshness,
      records: rows, summary: summarizeIndicatorRecords(rows),
    })) };
}
