import type { TradeAnalysisExcursionRow, TradeAnalysisEventPathRow } from "../../modules/level-analysis/server/daily-trade-long-term-analytics-service";
import { matchesExecutionIndicatorFilter, type ExecutionIndicatorFilters } from "./trend-momentum-execution-filter";
import { summarizeSavedIndicatorMovement } from "./trend-momentum-movement-projection";

export const movementAlignmentOptions = { any: "Any alignment", above: "EMA9 above EMA20", below: "EMA9 below EMA20", close: "EMAs close together" } as const;
export const movementRsiOptions = { any: "Any RSI range", below_30: "Below 30 · oversold", "30_to_below_50": "30 to below 50", "50_to_70": "50 to 70", above_70: "Above 70 · overbought" } as const;
export function readMovementFilters(query: URLSearchParams): ExecutionIndicatorFilters {
  const alignment = query.get("movement_alignment"), rsi = query.get("movement_rsi");
  return { interval: query.get("movement_interval") === "5m" ? "5m" : "1m",
    alignment: alignment && Object.hasOwn(movementAlignmentOptions, alignment) ? alignment as ExecutionIndicatorFilters["alignment"] : "any",
    rsiBand: rsi && Object.hasOwn(movementRsiOptions, rsi) ? rsi as ExecutionIndicatorFilters["rsiBand"] : "any" };
}

export function filterSavedTradeMovement(input: { excursions: readonly TradeAnalysisExcursionRow[]; eventPaths?: readonly TradeAnalysisEventPathRow[] }, filters: ExecutionIndicatorFilters) {
  const status = (row: { indicatorFilterContext?: TradeAnalysisExcursionRow["indicatorFilterContext"] }) => matchesExecutionIndicatorFilter(row.indicatorFilterContext, filters);
  const excursions = input.excursions.filter((row) => status(row) === true);
  const eventPaths = (input.eventPaths ?? []).filter((row) => status(row) === true);
  const coverage = { long: { matched: 0, notMatched: 0, unavailable: 0 }, short: { matched: 0, notMatched: 0, unavailable: 0 } };
  const seen = new Set<string>();
  for (const row of [...input.excursions, ...(input.eventPaths ?? [])]) {
    const sequence = "executionSequence" in row ? row.executionSequence : row.eventSequence;
    const key = `${row.roundTripId}:${sequence}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const match = status(row);
    coverage[row.direction][match === null ? "unavailable" : match ? "matched" : "notMatched"]++;
  }
  return { excursions, eventPaths, coverage, ...summarizeSavedIndicatorMovement(excursions) };
}
