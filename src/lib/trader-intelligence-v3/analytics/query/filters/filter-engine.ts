import type { TradeQueryFilter } from "../contracts/query-plan";
import { compareRatioToDecimal, type QueryRowSemantics } from "../execution/row-semantics";

function withinBigInt(value: bigint, minimum: string | null, maximum: string | null): boolean {
  return (minimum === null || value >= BigInt(minimum)) &&
    (maximum === null || value <= BigInt(maximum));
}

function matches(row: QueryRowSemantics, filter: TradeQueryFilter): boolean {
  switch (filter.kind) {
    case "date_range":
      return row.row.sessionDate >= filter.startDate && row.row.sessionDate <= filter.endDate;
    case "account":
      return filter.values.includes(row.row.canonicalAccountKey);
    case "symbol":
      return filter.values.includes(row.row.stableInstrumentKey) ||
        filter.values.includes(row.row.displayedSymbol);
    case "direction":
      return filter.values.includes(row.row.direction);
    case "currency":
      return row.row.currency === filter.value;
    case "realized_outcome":
      return filter.values.includes(row.outcome);
    case "weekday":
      return filter.values.includes(row.row.weekday);
    case "entry_time_range":
      return row.entryTime >= filter.startTime && row.entryTime <= filter.endTime;
    case "exit_time_range":
      return row.exitTime >= filter.startTime && row.exitTime <= filter.endTime;
    case "price_range":
      return row.entryPrice !== null &&
        (filter.minimum === null || compareRatioToDecimal(row.entryPrice, filter.minimum) >= 0) &&
        (filter.maximum === null || compareRatioToDecimal(row.entryPrice, filter.maximum) <= 0);
    case "sequence_in_session":
      return withinBigInt(row.sequenceInSession, filter.minimum, filter.maximum);
    case "previous_completed_outcome":
      return filter.values.includes(row.previousCompletedOutcome);
    case "holding_time_seconds":
      return withinBigInt(row.holdingSecondsFloor, filter.minimum, filter.maximum);
    case "repeat_attempt":
      return withinBigInt(row.repeatAttempt, filter.minimum, filter.maximum);
    case "position_size":
      return row.positionSize !== null &&
        (filter.minimum === null || compareRatioToDecimal(row.positionSize, filter.minimum) >= 0) &&
        (filter.maximum === null || compareRatioToDecimal(row.positionSize, filter.maximum) <= 0);
  }
}

export function applyTradeQueryFilters(
  rows: readonly QueryRowSemantics[],
  filters: readonly TradeQueryFilter[],
): Readonly<{
  readonly included: readonly QueryRowSemantics[];
  readonly excluded: readonly QueryRowSemantics[];
}> {
  const included: QueryRowSemantics[] = [];
  const excluded: QueryRowSemantics[] = [];
  for (const row of rows) (filters.every((filter) => matches(row, filter)) ? included : excluded).push(row);
  return Object.freeze({
    included: Object.freeze(included),
    excluded: Object.freeze(excluded),
  });
}
