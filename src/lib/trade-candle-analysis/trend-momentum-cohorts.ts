import Decimal from "decimal.js";
import { summarizeIndicatorRecords, type IndicatorExecutionKind, type TrendMomentumProjection,
  type TrendMomentumRecord } from "./trend-momentum-analytics";

export const INDICATOR_FILTER_OPTIONS = {
  alignment: ["any", "above", "below", "close"],
  ema9Direction: ["any", "rising", "falling", "little_change"],
  ema20Direction: ["any", "rising", "falling", "little_change"],
  separation: ["any", "expanding", "contracting", "little_change"],
  rsiBand: ["any", "below_30", "30_to_below_50", "50_to_70", "above_70"],
  rsiDirection: ["any", "rising", "falling", "little_change"],
  vwapSide: ["any", "above", "below", "near"],
  spacing: ["any", "standard", "sparse"],
} as const;
export type IndicatorConditionFilters = { [K in keyof typeof INDICATOR_FILTER_OPTIONS]: typeof INDICATOR_FILTER_OPTIONS[K][number] };
export const DEFAULT_INDICATOR_FILTERS: IndicatorConditionFilters = { alignment: "any", ema9Direction: "any",
  ema20Direction: "any", separation: "any", rsiBand: "any", rsiDirection: "any", vwapSide: "any", spacing: "any" };

export function parseIndicatorConditions(query: Pick<URLSearchParams, "get">): IndicatorConditionFilters {
  const result = { ...DEFAULT_INDICATOR_FILTERS };
  for (const key of Object.keys(result) as (keyof IndicatorConditionFilters)[]) {
    const value = query.get(`indicator_${key}`);
    if (value && (INDICATOR_FILTER_OPTIONS[key] as readonly string[]).includes(value)) {
      (result as Record<string, string>)[key] = value;
    }
  }
  return result;
}

export function indicatorRecordMatch(record: TrendMomentumRecord, interval: "1m" | "5m", filters: IndicatorConditionFilters): boolean | null {
  const context = record.context?.[interval === "1m" ? "oneMinute" : "fiveMinute"];
  const vwap = record.context?.sessionVwap?.value;
  const delta = vwap != null && vwap > 0 && new Decimal(record.executionPriceDecimal).isFinite()
    ? new Decimal(record.executionPriceDecimal).minus(vwap).div(vwap).mul(100).toNumber() : null;
  const values = { alignment: context?.alignment ?? null, ema9Direction: context?.ema9Direction ?? null,
    ema20Direction: context?.ema20Direction ?? null, separation: context?.separation ?? null,
    rsiBand: context?.rsiBand ?? null, rsiDirection: context?.rsiDirection ?? null,
    vwapSide: delta === null ? null : delta > 0.02 ? "above" : delta < -0.02 ? "below" : "near",
    spacing: context?.spacing === "standard" || context?.spacing === "sparse" ? context.spacing : null };
  const selected = (Object.keys(filters) as (keyof IndicatorConditionFilters)[]).filter((key) => filters[key] !== "any");
  // Complete context is required to call a trade a nonmatch, even if another
  // known condition already fails. Missing context is not a control group.
  if (selected.some((key) => values[key] === null)) return null;
  return selected.every((key) => values[key] === filters[key]);
}

export function buildIndicatorCohorts(projection: TrendMomentumProjection, interval: "1m" | "5m",
  kind: IndicatorExecutionKind, filters: IndicatorConditionFilters) {
  const byTrade = new Map<string, TrendMomentumRecord[]>();
  for (const record of projection.records) if (record.executionKind === kind) {
    const rows = byTrade.get(record.tradeId);
    if (rows) rows.push(record); else byTrade.set(record.tradeId, [record]);
  }
  const cohorts: Record<"matching" | "nonmatching" | "unknown", TrendMomentumRecord[]> = { matching: [], nonmatching: [], unknown: [] };
  const outside: string[] = [];
  for (const trade of projection.trades) {
    const rows = byTrade.get(trade.tradeId);
    if (!rows?.length) { outside.push(trade.tradeId); continue; }
    const matches = rows.map((record) => indicatorRecordMatch(record, interval, filters));
    const group = matches.some((match) => match === true) ? "matching" : matches.some((match) => match === null) ? "unknown" : "nonmatching";
    // Matching drilldown shows executions that actually satisfied all conditions.
    cohorts[group].push(...(group === "matching" ? rows.filter((_, i) => matches[i] === true) : rows));
  }
  return { matching: { rows: cohorts.matching, summary: summarizeIndicatorRecords(cohorts.matching) },
    nonmatching: { rows: cohorts.nonmatching, summary: summarizeIndicatorRecords(cohorts.nonmatching) },
    unknown: { rows: cohorts.unknown, summary: summarizeIndicatorRecords(cohorts.unknown) }, outsideTradeIds: outside };
}
