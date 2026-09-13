import { createHash } from "node:crypto";
import type { SavedPatternObservation } from "../../../lib/trade-candle-analysis/trend-momentum-patterns";
import { matchesExecutionIndicatorFilter, type ExecutionIndicatorFilters } from "../../../lib/trade-candle-analysis/trend-momentum-execution-filter";
import type { DailyTradePatternOccurrenceRow } from "./daily-trade-analysis-evidence-service";
import { platformFailure } from "../../platform/server/database/platform-migration-contract";

const invalid = () => platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "patternEvidence" });
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
function decode(value: string): Record<string, unknown> {
  if (value.length > 4096 || !/^[A-Za-z0-9_-]+$/.test(value)) return invalid();
  try { const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return invalid(); return parsed;
  } catch { return invalid(); }
}
export function patternEvidenceRow(row: SavedPatternObservation, currency: string): DailyTradePatternOccurrenceRow {
  return { candlesBeforeExecution: row.candlesBeforeExecution, currency, direction: row.direction,
    eventKind: row.eventKind, executedAtUtc: row.executedAtUtc, executionId: row.eventId,
    occurrenceRef: encode({ kind: "saved-pattern-v1", key: row.occurrenceKey }), pattern: row.pattern,
    patternTimeUtcSeconds: row.patternTime, resultDecimal: row.pnlDecimal, returnPercentDecimal: row.returnPercentDecimal,
    roundTripId: row.tradeId, symbol: row.symbol, timeframe: row.timeframe, trackerDate: row.trackerDate };
}
export function resolveSavedPatternEvidence(observations: readonly SavedPatternObservation[], reference: string) {
  const decoded = decode(reference);
  if (decoded.kind !== "saved-pattern-v1" || typeof decoded.key !== "string") return invalid();
  const row = observations.find((candidate) => candidate.occurrenceKey === decoded.key);
  if (!row) return platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "stalePatternEvidence" });
  return row;
}
export function pageSavedPatternEvidence(observations: readonly SavedPatternObservation[], input: {
  filters: ExecutionIndicatorFilters; pattern: string; ticker: string; direction: "long" | "short";
  timeframe: "all" | "1m" | "5m"; execution: "all" | "entry" | "exit"; location: "all" | "exact" | "before";
  pageSize: number; cursor: string | null; currency: string; timezone: string; selectionIdentity: string;
}) {
  if (![10, 25, 50, 100].includes(input.pageSize) || !input.pattern.trim() || input.pattern.length > 120) return invalid();
  const rows = observations.filter((row) => row.pattern === input.pattern && row.direction === input.direction &&
    row.symbol.toUpperCase().includes(input.ticker.trim().toUpperCase()) &&
    (input.timeframe === "all" || row.timeframe === input.timeframe) &&
    (input.execution === "all" || (row.eventKind === "entry" || row.eventKind === "add" ? "entry" : "exit") === input.execution) &&
    (input.location === "all" || (row.candlesBeforeExecution === 0 ? "exact" : "before") === input.location) &&
    matchesExecutionIndicatorFilter(row.indicatorFilterContext, input.filters) === true);
  const signature = createHash("sha256").update(JSON.stringify([input.selectionIdentity, input.filters, input.pattern, input.ticker,
    input.direction, input.timeframe, input.execution, input.location, input.pageSize, input.currency, input.timezone,
    rows.map((row) => [row.occurrenceKey, row.pnlDecimal, row.returnPercentDecimal])])).digest("hex");
  let start = 0;
  if (input.cursor) {
    const cursor = decode(input.cursor);
    if (cursor.signature !== signature || typeof cursor.key !== "string") return invalid();
    start = rows.findIndex((row) => row.occurrenceKey === cursor.key) + 1;
    if (start === 0) return invalid();
  }
  const page = rows.slice(start, start + input.pageSize);
  return { rows: page.map((row) => patternEvidenceRow(row, input.currency)), totalRowCount: rows.length, timezone: input.timezone,
    continuationCursor: start + page.length < rows.length ? encode({ signature, key: page.at(-1)!.occurrenceKey }) : null };
}
