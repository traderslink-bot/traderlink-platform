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

export function indicatorRecordValues(record: TrendMomentumRecord, interval: "1m" | "5m") {
  const context = record.context?.[interval === "1m" ? "oneMinute" : "fiveMinute"];
  const vwap = record.context?.sessionVwap?.value;
  const delta = vwap != null && vwap > 0 && new Decimal(record.executionPriceDecimal).isFinite()
    ? new Decimal(record.executionPriceDecimal).minus(vwap).div(vwap).mul(100).toNumber() : null;
  return { alignment: context?.alignment ?? null, ema9Direction: context?.ema9Direction ?? null,
    ema20Direction: context?.ema20Direction ?? null, separation: context?.separation ?? null,
    rsiBand: context?.rsiBand ?? null, rsiDirection: context?.rsiDirection ?? null,
    vwapSide: delta === null ? null : delta > 0.02 ? "above" : delta < -0.02 ? "below" : "near",
    spacing: context?.spacing === "standard" || context?.spacing === "sparse" ? context.spacing : null };
}

export function indicatorRecordMatch(record: TrendMomentumRecord, interval: "1m" | "5m", filters: IndicatorConditionFilters): boolean | null {
  const values = indicatorRecordValues(record, interval);
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

export function indicatorSupportingSelection(query: Pick<URLSearchParams, "get">, direction: "long" | "short") {
  const execution = query.get("indicator_execution");
  const kinds: readonly string[] = ["initial_entry", "re_entry", "add", "partial_exit", "position_close", "final_exit"];
  const kind: IndicatorExecutionKind = execution && kinds.includes(execution) ? execution as IndicatorExecutionKind : "initial_entry";
  const interval = query.get("indicator_interval") === "5m" ? "5m" as const : "1m" as const;
  const requestedGroup = query.get("indicator_group");
  const group = requestedGroup === "nonmatching" || requestedGroup === "unknown" ? requestedGroup : "matching";
  const size = Number(query.get("indicator_size"));
  const pageSize = [10, 25, 50, 100].includes(size) ? size : 25;
  const page = Number(query.get("indicator_page"));
  const filters = parseIndicatorConditions(query);
  const selection = { direction, kind, interval, group, pageSize, page: Number.isSafeInteger(page) && page > 0 ? page : 1, filters } as const;
  return { ...selection, key: JSON.stringify({ ...selection,
    reportingSelection: ["range", "start", "end", "basis"].map((key) => query.get(key)) }) };
}

/** Call with the current scoped, date- and reporting-filtered projection. */
export function buildIndicatorSupportingPage(projection: TrendMomentumProjection,
  query: Pick<URLSearchParams, "get">, direction: "long" | "short") {
  const selected = indicatorSupportingSelection(query, direction);
  const scoped = { ...projection, trades: projection.trades.filter((row) => row.direction === direction),
    records: projection.records.filter((row) => row.direction === direction) };
  const cohort = buildIndicatorCohorts(scoped, selected.interval, selected.kind, selected.filters)[selected.group];
  const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
  const rows = [...cohort.rows].sort((a, b) => compare(a.executedAtUtc, b.executedAtUtc)
    || compare(a.tradeId, b.tradeId) || a.executionSequence - b.executionSequence || compare(a.executionId, b.executionId));
  const page = Math.min(selected.page, Math.max(1, Math.ceil(rows.length / selected.pageSize)));
  return { selectionKey: selected.key, group: selected.group, page, pageSize: selected.pageSize,
    totalRows: rows.length, totalTrades: cohort.summary.tradeCount,
    rows: rows.slice((page - 1) * selected.pageSize, page * selected.pageSize) };
}
export type IndicatorSupportingPage = ReturnType<typeof buildIndicatorSupportingPage>;

export type IndicatorComparisonAxis = Exclude<keyof IndicatorConditionFilters, "spacing">;
export function groupIndicatorRecords(records: readonly TrendMomentumRecord[], interval: "1m" | "5m", axis: IndicatorComparisonAxis) {
  const grouped = new Map<string, { value: string | null; spacing: string | null; freshness: string;
    records: TrendMomentumRecord[]; spans: number[]; ages: number[] }>();
  const directionAxis = axis === "ema9Direction" || axis === "ema20Direction" || axis === "rsiDirection" || axis === "separation";
  for (const record of records) {
    const context = record.context?.[interval === "1m" ? "oneMinute" : "fiveMinute"];
    const value = indicatorRecordValues(record, interval)[axis];
    const spacing = directionAxis ? context?.spacing ?? "unavailable" : null;
    // Session VWAP has its own source window, not the EMA/RSI bar freshness.
    const freshness = axis === "vwapSide" ? "session" : !context ? "unavailable"
      : context.currentWordingEligible ? "current" : "older";
    const key = JSON.stringify([value, spacing, freshness]);
    const group = grouped.get(key) ?? { value, spacing, freshness, records: [], spans: [], ages: [] };
    group.records.push(record);
    if (context?.lookbackSpanSeconds != null) group.spans.push(context.lookbackSpanSeconds);
    if (context?.ageSeconds != null && axis !== "vwapSide") group.ages.push(context.ageSeconds);
    grouped.set(key, group);
  }
  const extent = (values: number[]) => values.length ? values.reduce((result, value) => ({ min: Math.min(result.min, value), max: Math.max(result.max, value) }), { min: values[0], max: values[0] }) : null;
  return { tradeCount: new Set(records.map((row) => row.tradeId)).size,
    coveredTradeCount: new Set(records.filter((row) => indicatorRecordValues(row, interval)[axis] !== null).map((row) => row.tradeId)).size,
    rows: [...grouped].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, group]) => ({ key,
      value: group.value, spacing: group.spacing, freshness: group.freshness,
      spanSeconds: extent(group.spans), ageSeconds: extent(group.ages), summary: summarizeIndicatorRecords(group.records) })) };
}
