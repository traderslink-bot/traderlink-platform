import { calendarDate } from "./chart-calendar";
import { parseChartSplits } from "./chart-splits";

type QualifiedSplitSnapshot = Readonly<{
  symbol: string;
  basisDate: string;
  coverageStart: string;
  events: readonly {
    providerEventId: string;
    effectiveDate: string;
    oldShares: number;
    newShares: number;
    kind: "forward" | "reverse";
  }[];
}>;

export function projectQualifiedChartSplits(symbol: string, basisDate: string, snapshot: QualifiedSplitSnapshot | null) {
  if (!snapshot) return { symbol, basisDate, coverageStart: null, qualifiedThrough: null, splits: [] };
  if (snapshot.symbol !== symbol || snapshot.events.some(event =>
    (event.newShares < event.oldShares ? "reverse" : "forward") !== event.kind)) {
    throw Error("invalid_qualified_split_history");
  }
  return parseQualifiedChartSplits({
    symbol, basisDate, coverageStart: snapshot.coverageStart, qualifiedThrough: snapshot.basisDate,
    splits: snapshot.events.map(({ providerEventId, effectiveDate, oldShares, newShares }) =>
      ({ id: providerEventId, date: effectiveDate, oldShares, newShares })),
  }, symbol, basisDate);
}

export function parseQualifiedChartSplits(value: unknown, symbol: string, basisDate: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("invalid_qualified_split_history");
  const row = value as Record<string, unknown>;
  const { coverageStart, qualifiedThrough } = row;
  if (row.symbol !== symbol || row.basisDate !== basisDate || !calendarDate(basisDate)) {
    throw Error("invalid_qualified_split_history");
  }
  const splits = parseChartSplits(row.splits);
  if (coverageStart === null && qualifiedThrough === null && !splits.length) {
    return { symbol, basisDate, coverageStart, qualifiedThrough, splits };
  }
  if (!calendarDate(coverageStart) || !calendarDate(qualifiedThrough) || coverageStart > qualifiedThrough ||
    qualifiedThrough > basisDate || splits.some(split => split.date < coverageStart || split.date > qualifiedThrough)) {
    throw Error("invalid_qualified_split_history");
  }
  return { symbol, basisDate, coverageStart, qualifiedThrough, splits };
}
