import { compareUnicodeCodePoints } from "../../../domain/canonical";
import type { TradeQueryGrouping } from "../contracts/query-plan";
import {
  compareRatioToDecimal,
  shiftCanonicalDate,
  type QueryRowSemantics,
} from "../execution/row-semantics";

export interface TradeQueryGroup {
  readonly groupIdentity: string;
  readonly groupLabel: string;
  readonly canonicalOrder: string;
  readonly rows: readonly QueryRowSemantics[];
}

const WEEKDAY_ORDER: Readonly<Record<string, string>> = Object.freeze({
  monday: "1", tuesday: "2", wednesday: "3", thursday: "4",
  friday: "5", saturday: "6", sunday: "7",
});

function pad(value: bigint, width: number): string {
  return value.toString().padStart(width, "0");
}

function bucketForRatio(
  row: QueryRowSemantics,
  value: QueryRowSemantics["entryPrice"],
  boundaries: readonly string[],
  prefix: string,
): readonly [string, string, string] {
  if (value === null) return [`${prefix}:unavailable`, "Unavailable", "z"];
  const index = boundaries.findIndex((boundary) => compareRatioToDecimal(value, boundary) < 0);
  if (index === 0) return [`${prefix}:below:${boundaries[0]}`, `< ${boundaries[0]}`, `0:${boundaries[0]}`];
  if (index < 0) {
    const last = boundaries[boundaries.length - 1];
    return [`${prefix}:at_or_above:${last}`, `>= ${last}`, `2:${last}`];
  }
  const lower = boundaries[index - 1];
  const upper = boundaries[index];
  return [`${prefix}:${lower}:${upper}`, `${lower} to < ${upper}`, `1:${lower}:${upper}`];
}

function groupFacts(row: QueryRowSemantics, grouping: TradeQueryGrouping): readonly [string, string, string] {
  switch (grouping.kind) {
    case "aggregate": return ["aggregate:all", "All included trades", "0"];
    case "month": {
      const month = row.row.sessionDate.slice(0, 7);
      return [`month:${month}`, month, month];
    }
    case "week": {
      const date = row.row.sessionDate;
      const weekday = BigInt(WEEKDAY_ORDER[row.row.weekday]);
      const monday = shiftCanonicalDate(date, -(weekday - BigInt("1")));
      return [`week:${monday}`, `Week of ${monday}`, monday];
    }
    case "weekday":
      return [`weekday:${row.row.weekday}`, row.row.weekday, WEEKDAY_ORDER[row.row.weekday]];
    case "time_bucket": {
      const time = grouping.source === "entry" ? row.entryTime : row.exitTime;
      const minutes = BigInt(time.slice(0, 2)) * BigInt("60") + BigInt(time.slice(3, 5));
      const size = BigInt(grouping.bucketMinutes);
      const start = (minutes / size) * size;
      const end = start + size;
      const display = `${pad(start / BigInt("60"), 2)}:${pad(start % BigInt("60"), 2)}-${pad(end / BigInt("60"), 2)}:${pad(end % BigInt("60"), 2)}`;
      return [`time:${grouping.source}:${start}:${size}`, display, pad(start, 4)];
    }
    case "price_range":
      return bucketForRatio(row, row.entryPrice, grouping.boundaries, "price");
    case "trade_sequence":
      return [`sequence:${row.sequenceInSession}`, `Trade ${row.sequenceInSession}`, pad(row.sequenceInSession, 20)];
    case "previous_completed_outcome":
      return [`previous:${row.previousCompletedOutcome}`, row.previousCompletedOutcome, row.previousCompletedOutcome];
    case "repeat_attempt":
      return [`repeat:${row.repeatAttempt}`, `Attempt ${row.repeatAttempt}`, pad(row.repeatAttempt, 20)];
    case "holding_time_bucket": {
      const index = grouping.boundariesSeconds.findIndex((boundary) => row.holdingSecondsFloor < BigInt(boundary));
      if (index === 0) return [`holding:below:${grouping.boundariesSeconds[0]}`, `< ${grouping.boundariesSeconds[0]}s`, `0:${grouping.boundariesSeconds[0]}`];
      if (index < 0) {
        const last = grouping.boundariesSeconds[grouping.boundariesSeconds.length - 1];
        return [`holding:at_or_above:${last}`, `>= ${last}s`, `2:${last}`];
      }
      const lower = grouping.boundariesSeconds[index - 1];
      const upper = grouping.boundariesSeconds[index];
      return [`holding:${lower}:${upper}`, `${lower}s to < ${upper}s`, `1:${lower}:${upper}`];
    }
    case "position_size_bucket":
      return bucketForRatio(row, row.positionSize, grouping.boundaries, "position_size");
    case "direction":
      return [`direction:${row.row.direction}`, row.row.direction, row.row.direction];
    case "symbol":
      return [`symbol:${row.row.stableInstrumentKey}`, row.row.displayedSymbol, row.row.stableInstrumentKey];
    case "account":
      return [`account:${row.row.canonicalAccountKey}`, row.row.canonicalAccountKey, row.row.canonicalAccountKey];
  }
}

export function groupTradeQueryRows(
  rows: readonly QueryRowSemantics[],
  grouping: TradeQueryGrouping,
): readonly TradeQueryGroup[] {
  if (rows.length === 0 && grouping.kind === "aggregate") {
    return Object.freeze([Object.freeze({
      groupIdentity: "aggregate:all",
      groupLabel: "All included trades",
      canonicalOrder: "0",
      rows: Object.freeze([]),
    })]);
  }
  const groups = new Map<string, { label: string; order: string; rows: QueryRowSemantics[] }>();
  for (const row of rows) {
    const [identity, label, order] = groupFacts(row, grouping);
    const current = groups.get(identity) ?? { label, order, rows: [] };
    current.rows.push(row);
    groups.set(identity, current);
  }
  return Object.freeze(
    [...groups.entries()]
      .sort((left, right) =>
        compareUnicodeCodePoints(left[1].order, right[1].order) ||
        compareUnicodeCodePoints(left[0], right[0]))
      .map(([groupIdentity, value]) => Object.freeze({
        groupIdentity,
        groupLabel: value.label,
        canonicalOrder: value.order,
        rows: Object.freeze(value.rows),
      })),
  );
}
