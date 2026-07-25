import { compareUnicodeCodePoints } from "../../../domain/canonical";
import {
  compareExactRatios,
  createExactRatio,
  decimalToExactRatio,
  validateExactDecimal,
  type ExactRatio,
} from "../../../domain/exact";
import type { AnalyticalRow } from "../../dataset";
import type { QueryOutcome } from "../contracts/query-plan";

export interface QueryRowSemantics {
  readonly row: AnalyticalRow;
  readonly outcome: QueryOutcome;
  readonly entryTime: string;
  readonly exitTime: string;
  readonly entryPrice: ExactRatio | null;
  readonly positionSize: ExactRatio | null;
  readonly holdingNanoseconds: bigint;
  readonly holdingSecondsFloor: bigint;
  readonly sequenceInSession: bigint;
  readonly repeatAttempt: bigint;
  readonly previousCompletedOutcome: "none" | QueryOutcome | "ambiguous";
}

const NANOS_PER_SECOND = BigInt("1000000000");
const SECONDS_PER_DAY = BigInt("86400");

export function daysFromCivil(yearInput: bigint, monthInput: bigint, day: bigint): bigint {
  const year = yearInput - (monthInput <= BigInt("2") ? BigInt("1") : BigInt("0"));
  const era = year >= BigInt("0") ? year / BigInt("400") : (year - BigInt("399")) / BigInt("400");
  const yearOfEra = year - era * BigInt("400");
  const month = monthInput + (monthInput > BigInt("2") ? -BigInt("3") : BigInt("9"));
  const dayOfYear = (BigInt("153") * month + BigInt("2")) / BigInt("5") + day - BigInt("1");
  const dayOfEra = yearOfEra * BigInt("365") + yearOfEra / BigInt("4") - yearOfEra / BigInt("100") + dayOfYear;
  return era * BigInt("146097") + dayOfEra - BigInt("719468");
}

export function shiftCanonicalDate(date: string, days: bigint): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match === null) throw new Error("ti_v3_query_date_invalid");
  const shifted = daysFromCivil(BigInt(match[1]), BigInt(match[2]), BigInt(match[3])) + days + BigInt("719468");
  const era = shifted >= BigInt("0") ? shifted / BigInt("146097") : (shifted - BigInt("146096")) / BigInt("146097");
  const dayOfEra = shifted - era * BigInt("146097");
  const yearOfEra = (
    dayOfEra - dayOfEra / BigInt("1460") + dayOfEra / BigInt("36524") - dayOfEra / BigInt("146096")
  ) / BigInt("365");
  let year = yearOfEra + era * BigInt("400");
  const dayOfYear = dayOfEra - (BigInt("365") * yearOfEra + yearOfEra / BigInt("4") - yearOfEra / BigInt("100"));
  const monthPrime = (BigInt("5") * dayOfYear + BigInt("2")) / BigInt("153");
  const day = dayOfYear - (BigInt("153") * monthPrime + BigInt("2")) / BigInt("5") + BigInt("1");
  const month = monthPrime + (monthPrime < BigInt("10") ? BigInt("3") : -BigInt("9"));
  year += month <= BigInt("2") ? BigInt("1") : BigInt("0");
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function timestampNanoseconds(value: string): bigint {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{9})Z$/.exec(value);
  if (match === null) throw new Error("ti_v3_query_timestamp_invalid");
  const days = daysFromCivil(BigInt(match[1]), BigInt(match[2]), BigInt(match[3]));
  const seconds = days * SECONDS_PER_DAY +
    BigInt(match[4]) * BigInt("3600") + BigInt(match[5]) * BigInt("60") + BigInt(match[6]);
  return seconds * NANOS_PER_SECOND + BigInt(match[7]);
}

function timePart(value: string): string {
  return value.slice(11, 19);
}

function outcome(row: AnalyticalRow): QueryOutcome {
  const value = validateExactDecimal(row.netPnl);
  const zero = validateExactDecimal("0");
  if (!value.ok || !zero.ok) throw new Error("ti_v3_query_pnl_invalid");
  const comparison = value.value === zero.value ? 0 : value.value.startsWith("-") ? -1 : 1;
  return comparison < 0 ? "loss" : comparison > 0 ? "gain" : "flat";
}

function decimalRatio(value: string): ExactRatio {
  const parsed = validateExactDecimal(value);
  if (!parsed.ok) throw new Error(parsed.error.code);
  const ratio = decimalToExactRatio(parsed.value);
  if (!ratio.ok) throw new Error(ratio.error.code);
  return ratio.value;
}

function price(row: AnalyticalRow): ExactRatio | null {
  if (row.entryNotional.state !== "available" || row.shareQuantity.state !== "available") return null;
  const notional = decimalRatio(row.entryNotional.amount);
  const quantity = decimalRatio(row.shareQuantity.quantity);
  const result = createExactRatio(
    (BigInt(notional.numerator) * BigInt(quantity.denominator)).toString(),
    (BigInt(notional.denominator) * BigInt(quantity.numerator)).toString(),
  );
  return result.ok ? result.value : null;
}

function compareEntry(left: AnalyticalRow, right: AnalyticalRow): number {
  if (left.firstEntryAt !== right.firstEntryAt) return left.firstEntryAt < right.firstEntryAt ? -1 : 1;
  if (left.finalExitAt !== right.finalExitAt) return left.finalExitAt < right.finalExitAt ? -1 : 1;
  return compareUnicodeCodePoints(left.semanticRoundTripKey, right.semanticRoundTripKey);
}

function sessionKey(row: AnalyticalRow): string {
  return [
    row.canonicalOwnerKey, row.canonicalAccountKey, row.currency,
    row.sessionDate, row.timezone, row.dateBasis,
  ].join("|");
}

export function buildQueryRowSemantics(rowsInput: readonly AnalyticalRow[]): readonly QueryRowSemantics[] {
  const rows = [...rowsInput].sort(compareEntry);
  const bySession = new Map<string, AnalyticalRow[]>();
  for (const row of rows) {
    const key = sessionKey(row);
    const existing = bySession.get(key);
    if (existing === undefined) bySession.set(key, [row]);
    else existing.push(row);
  }
  const result: QueryRowSemantics[] = [];
  for (const sessionRows of bySession.values()) {
    const ordered = [...sessionRows].sort(compareEntry);
    const completions = [...sessionRows].sort((left, right) =>
      left.finalExitAt < right.finalExitAt ? -1 :
        left.finalExitAt > right.finalExitAt ? 1 :
          compareUnicodeCodePoints(left.semanticRoundTripKey, right.semanticRoundTripKey));
    let completionIndex = 0;
    let lastCompletedOutcome: QueryRowSemantics["previousCompletedOutcome"] = "none";
    const attemptBySymbol = new Map<string, bigint>();
    for (let index = 0; index < ordered.length; index += 1) {
      const row = ordered[index];
      const previousAttempts = attemptBySymbol.get(row.stableInstrumentKey) ?? BigInt("0");
      attemptBySymbol.set(row.stableInstrumentKey, previousAttempts + BigInt("1"));
      while (
        completionIndex < completions.length &&
        completions[completionIndex].finalExitAt < row.firstEntryAt
      ) {
        const timestamp = completions[completionIndex].finalExitAt;
        const outcomes = new Set<QueryOutcome>();
        while (
          completionIndex < completions.length &&
          completions[completionIndex].finalExitAt === timestamp
        ) {
          outcomes.add(outcome(completions[completionIndex]));
          completionIndex += 1;
        }
        lastCompletedOutcome = outcomes.size === 1 ? [...outcomes][0] : "ambiguous";
      }
      const holdingNanoseconds = timestampNanoseconds(row.finalExitAt) - timestampNanoseconds(row.firstEntryAt);
      result.push(Object.freeze({
        row,
        outcome: outcome(row),
        entryTime: timePart(row.firstEntryAt),
        exitTime: timePart(row.finalExitAt),
        entryPrice: price(row),
        positionSize: row.entryNotional.state === "available"
          ? decimalRatio(row.entryNotional.amount)
          : null,
        holdingNanoseconds,
        holdingSecondsFloor: holdingNanoseconds / NANOS_PER_SECOND,
        sequenceInSession: BigInt(index + 1),
        repeatAttempt: previousAttempts + BigInt("1"),
        previousCompletedOutcome: lastCompletedOutcome,
      }));
    }
  }
  return Object.freeze(result.sort((left, right) => compareEntry(left.row, right.row)));
}

export function compareRatioToDecimal(ratio: ExactRatio, decimal: string): -1 | 0 | 1 {
  return compareExactRatios(ratio, decimalRatio(decimal));
}
