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

export interface TradeQueryGroupAssignment {
  readonly groupIdentity: string;
  readonly groupLabel: string;
  readonly canonicalOrder: string;
}

const WEEKDAY_ORDER: Readonly<Record<string, string>> = Object.freeze({
  monday: "1", tuesday: "2", wednesday: "3", thursday: "4",
  friday: "5", saturday: "6", sunday: "7",
});

function pad(value: bigint, width: number): string {
  return value.toString().padStart(width, "0");
}

function compoundIdentityPart(value: string): string {
  return `${value.length}:${value}`;
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

export function tradeQueryGroupAssignment(
  row: QueryRowSemantics,
  grouping: TradeQueryGrouping,
): TradeQueryGroupAssignment {
  let facts: readonly [string, string, string];
  switch (grouping.kind) {
    case "compound": {
      const dimensions = grouping.dimensions.map((dimension) =>
        tradeQueryGroupAssignment(row, dimension),
      );
      facts = [
        `compound:${dimensions.map((dimension) => compoundIdentityPart(dimension.groupIdentity)).join("|")}`,
        dimensions.map((dimension) => dimension.groupLabel).join(" × "),
        dimensions.map((dimension) => compoundIdentityPart(dimension.canonicalOrder)).join("|"),
      ];
      break;
    }
    case "aggregate": facts = ["aggregate:all", "All included trades", "0"]; break;
    case "day":
      facts = [`day:${row.row.sessionDate}`, row.row.sessionDate, row.row.sessionDate];
      break;
    case "month": {
      const month = row.row.sessionDate.slice(0, 7);
      facts = [`month:${month}`, month, month];
      break;
    }
    case "year": {
      const year = row.row.sessionDate.slice(0, 4);
      facts = [`year:${year}`, year, year];
      break;
    }
    case "week": {
      const date = row.row.sessionDate;
      const weekday = BigInt(WEEKDAY_ORDER[row.row.weekday]);
      const monday = shiftCanonicalDate(date, -(weekday - BigInt("1")));
      facts = [`week:${monday}`, `Week of ${monday}`, monday];
      break;
    }
    case "weekday":
      facts = [`weekday:${row.row.weekday}`, row.row.weekday, WEEKDAY_ORDER[row.row.weekday]];
      break;
    case "session":
      facts = [`session:${row.row.session}`, row.row.session, row.row.session];
      break;
    case "time_bucket": {
      const time = grouping.source === "entry" ? row.entryTime : row.exitTime;
      const minutes = BigInt(time.slice(0, 2)) * BigInt("60") + BigInt(time.slice(3, 5));
      const size = BigInt(grouping.bucketMinutes);
      const start = (minutes / size) * size;
      const end = start + size;
      const display = `${pad(start / BigInt("60"), 2)}:${pad(start % BigInt("60"), 2)}-${pad(end / BigInt("60"), 2)}:${pad(end % BigInt("60"), 2)}`;
      facts = [`time:${grouping.source}:${start}:${size}`, display, pad(start, 4)];
      break;
    }
    case "entry_price_range":
    case "price_range":
      facts = bucketForRatio(row, row.entryPrice, grouping.boundaries, "entry_price");
      break;
    case "trade_sequence":
      facts = [`sequence:${row.sequenceInSession}`, `Trade ${row.sequenceInSession}`, pad(row.sequenceInSession, 20)];
      break;
    case "trade_sequence_bucket":
      facts = row.sequenceInSession === BigInt("1")
        ? ["sequence_bucket:v1:first", "First trade", "1"]
        : row.sequenceInSession === BigInt("2")
          ? ["sequence_bucket:v1:second", "Second trade", "2"]
          : row.sequenceInSession === BigInt("3")
            ? ["sequence_bucket:v1:third", "Third trade", "3"]
            : ["sequence_bucket:v1:fourth_or_later", "Fourth and later trades", "4"];
      break;
    case "previous_completed_outcome":
      facts = [`previous:${row.previousCompletedOutcome}`, row.previousCompletedOutcome, row.previousCompletedOutcome];
      break;
    case "prior_completed_streak_bucket":
      facts = row.priorCompletedStreakLength === null
        ? ["prior_streak:ambiguous", "Ambiguous prior completed-trade streak", "z"]
        : row.priorCompletedStreakOutcome === "gain" || row.priorCompletedStreakOutcome === "loss"
          ? [
              `prior_streak:${row.priorCompletedStreakOutcome}:${row.priorCompletedStreakLength}`,
              `After ${row.priorCompletedStreakLength} prior ${row.priorCompletedStreakOutcome === "gain" ? "win" : "loss"}${row.priorCompletedStreakLength === BigInt("1") ? "" : "es"}`,
              `${row.priorCompletedStreakOutcome}:${pad(row.priorCompletedStreakLength, 20)}`,
            ]
          : ["prior_streak:none", "No prior win/loss streak", "0"];
      break;
    case "pre_entry_daily_state":
      facts = [
        `pre_entry_daily_state:${row.preEntryDailyState}`,
        `Already ${row.preEntryDailyState} before entry`,
        row.preEntryDailyState,
      ];
      break;
    case "repeat_attempt":
      facts = [`repeat:${row.repeatAttempt}`, `Attempt ${row.repeatAttempt}`, pad(row.repeatAttempt, 20)];
      break;
    case "repeat_attempt_bucket":
      facts = row.repeatAttempt === BigInt("1")
        ? ["repeat_attempt_bucket:v1:first", "First attempt", "1"]
        : row.repeatAttempt === BigInt("2")
          ? ["repeat_attempt_bucket:v1:second", "Second attempt", "2"]
          : row.repeatAttempt === BigInt("3")
            ? ["repeat_attempt_bucket:v1:third", "Third attempt", "3"]
            : ["repeat_attempt_bucket:v1:fourth_or_later", "Fourth and later attempts", "4"];
      break;
    case "holding_time_bucket": {
      const index = grouping.boundariesSeconds.findIndex((boundary) => row.holdingSecondsFloor < BigInt(boundary));
      if (index === 0) {
        facts = [`holding:below:${grouping.boundariesSeconds[0]}`, `< ${grouping.boundariesSeconds[0]}s`, `0:${grouping.boundariesSeconds[0]}`];
        break;
      }
      if (index < 0) {
        const last = grouping.boundariesSeconds[grouping.boundariesSeconds.length - 1];
        facts = [`holding:at_or_above:${last}`, `>= ${last}s`, `2:${last}`];
        break;
      }
      const lower = grouping.boundariesSeconds[index - 1];
      const upper = grouping.boundariesSeconds[index];
      facts = [`holding:${lower}:${upper}`, `${lower}s to < ${upper}s`, `1:${lower}:${upper}`];
      break;
    }
    case "share_quantity_bucket":
      facts = bucketForRatio(row, row.shareQuantity, grouping.boundaries, "share_quantity");
      break;
    case "entry_notional_bucket":
      facts = bucketForRatio(row, row.entryNotional, grouping.boundaries, "entry_notional");
      break;
    case "position_size_bucket":
      facts = bucketForRatio(row, row.positionSize, grouping.boundaries, "entry_notional");
      break;
    case "direction":
      facts = [`direction:${row.row.direction}`, row.row.direction, row.row.direction];
      break;
    case "symbol":
      facts = [`symbol:${row.row.stableInstrumentKey}`, row.row.displayedSymbol, row.row.stableInstrumentKey];
      break;
    case "account":
      facts = [`account:${row.row.canonicalAccountKey}`, row.row.canonicalAccountKey, row.row.canonicalAccountKey];
      break;
    case "source_identity":
      facts = row.row.sourceAuthority.state === "available"
        ? [
            `source:${row.row.sourceAuthority.sourceIdentity}`,
            row.row.sourceAuthority.sourceIdentity,
            row.row.sourceAuthority.sourceIdentity,
          ]
        : ["source:unavailable", "Source authority unavailable", "z"];
      break;
    case "broker_code":
      facts = row.row.sourceAuthority.state === "available"
        ? [
            `broker:${row.row.sourceAuthority.brokerCode}`,
            row.row.sourceAuthority.brokerCode,
            row.row.sourceAuthority.brokerCode,
          ]
        : ["broker:unavailable", "Broker authority unavailable", "z"];
      break;
    case "source_kind":
      facts = row.row.sourceAuthority.state === "available"
        ? [`source_kind:${row.row.sourceAuthority.sourceKind}`, row.row.sourceAuthority.sourceKind, row.row.sourceAuthority.sourceKind]
        : ["source_kind:unavailable", "Source kind unavailable", "z"];
      break;
    case "charge_coverage": {
      const unknown = row.row.limitationCodes.includes("ti_v3_analytics_charge_coverage_unknown");
      facts = unknown
        ? ["charge_coverage:unknown", "Charge coverage unknown", "unknown"]
        : ["charge_coverage:complete", "Charge coverage complete", "complete"];
      break;
    }
  }
  return Object.freeze({
    groupIdentity: facts[0],
    groupLabel: facts[1],
    canonicalOrder: facts[2],
  });
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
    const assignment = tradeQueryGroupAssignment(row, grouping);
    const current = groups.get(assignment.groupIdentity) ?? {
      label: assignment.groupLabel,
      order: assignment.canonicalOrder,
      rows: [],
    };
    current.rows.push(row);
    groups.set(assignment.groupIdentity, current);
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
