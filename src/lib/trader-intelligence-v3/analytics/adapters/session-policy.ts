import type { ExactResult } from "../../domain/exact";
import {
  contractFailure,
  validateTimestampValue,
  type AnalyticalContractFailure,
} from "../contracts/contract-validation";

export const GA0_B1_DERIVATION_POLICY = Object.freeze({
  policyKey: "ti_v3_closed_round_trip_read_model",
  policyVersion: "v1",
  sessionPolicyKey: "ti_v3_utc_and_new_york_civil_session",
  sessionPolicyVersion: "v1",
  displayedSymbolPolicy:
    "ti_v3_first_economic_entry_symbol_non_authoritative_v1",
  supportedTimezones: Object.freeze(["America/New_York", "UTC"] as const),
});

export type CanonicalWeekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type CanonicalSession =
  | "premarket"
  | "regular"
  | "after_hours"
  | "overnight";

export interface ResolvedSessionFacts {
  readonly sessionDate: string;
  readonly weekday: CanonicalWeekday;
  readonly session: CanonicalSession;
}

const WEEKDAYS: readonly CanonicalWeekday[] = Object.freeze([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]);

function isLeapYear(year: bigint): boolean {
  return (
    year % BigInt(4) === BigInt(0) &&
    (year % BigInt(100) !== BigInt(0) || year % BigInt(400) === BigInt(0))
  );
}

function daysInMonth(year: bigint, month: bigint): bigint {
  if (month === BigInt(2)) return isLeapYear(year) ? BigInt(29) : BigInt(28);
  if (
    month === BigInt(4) ||
    month === BigInt(6) ||
    month === BigInt(9) ||
    month === BigInt(11)
  ) {
    return BigInt(30);
  }
  return BigInt(31);
}

function daysFromCivil(yearInput: bigint, monthInput: bigint, day: bigint): bigint {
  const year = yearInput - (monthInput <= BigInt(2) ? BigInt(1) : BigInt(0));
  const era = (year >= BigInt(0) ? year : year - BigInt(399)) / BigInt(400);
  const yearOfEra = year - era * BigInt(400);
  const shiftedMonth = monthInput + (monthInput > BigInt(2) ? BigInt(-3) : BigInt(9));
  const dayOfYear =
    (BigInt(153) * shiftedMonth + BigInt(2)) / BigInt(5) + day - BigInt(1);
  const dayOfEra =
    yearOfEra * BigInt(365) +
    yearOfEra / BigInt(4) -
    yearOfEra / BigInt(100) +
    dayOfYear;
  return era * BigInt(146097) + dayOfEra - BigInt(719468);
}

function sundayBasedWeekdayIndex(year: bigint, month: bigint, day: bigint): bigint {
  const raw = (daysFromCivil(year, month, day) + BigInt(4)) % BigInt(7);
  return raw < BigInt(0) ? raw + BigInt(7) : raw;
}

function padTwo(value: bigint): string {
  return value.toString().padStart(2, "0");
}

function canonicalDate(year: bigint, month: bigint, day: bigint): string {
  return `${year.toString().padStart(4, "0")}-${padTwo(month)}-${padTwo(day)}`;
}

function newYorkDstBounds(year: bigint): Readonly<{ start: string; end: string }> {
  const marchFirst = sundayBasedWeekdayIndex(year, BigInt(3), BigInt(1));
  const secondSunday = BigInt(1) + ((BigInt(7) - marchFirst) % BigInt(7)) + BigInt(7);
  const novemberFirst = sundayBasedWeekdayIndex(year, BigInt(11), BigInt(1));
  const firstSunday = BigInt(1) + ((BigInt(7) - novemberFirst) % BigInt(7));
  return Object.freeze({
    start: `${canonicalDate(year, BigInt(3), secondSunday)}T07:00:00.000000000Z`,
    end: `${canonicalDate(year, BigInt(11), firstSunday)}T06:00:00.000000000Z`,
  });
}

function shiftUtcToLocal(
  timestamp: string,
  offsetHours: bigint,
): Readonly<{ year: bigint; month: bigint; day: bigint; hour: bigint; minute: bigint }> {
  let year = BigInt(timestamp.slice(0, 4));
  let month = BigInt(timestamp.slice(5, 7));
  let day = BigInt(timestamp.slice(8, 10));
  let hour = BigInt(timestamp.slice(11, 13)) + offsetHours;
  const minute = BigInt(timestamp.slice(14, 16));
  if (hour < BigInt(0)) {
    hour += BigInt(24);
    day -= BigInt(1);
    if (day === BigInt(0)) {
      month -= BigInt(1);
      if (month === BigInt(0)) {
        month = BigInt(12);
        year -= BigInt(1);
      }
      day = daysInMonth(year, month);
    }
  }
  return Object.freeze({ year, month, day, hour, minute });
}

function classifySession(hour: bigint, minute: bigint): CanonicalSession {
  const minuteOfDay = hour * BigInt(60) + minute;
  if (minuteOfDay >= BigInt(240) && minuteOfDay < BigInt(570)) return "premarket";
  if (minuteOfDay >= BigInt(570) && minuteOfDay < BigInt(960)) return "regular";
  if (minuteOfDay >= BigInt(960) && minuteOfDay < BigInt(1200)) return "after_hours";
  return "overnight";
}

export function resolveSessionFacts(
  timestampInput: unknown,
  timezone: string,
): ExactResult<ResolvedSessionFacts, AnalyticalContractFailure> {
  const timestamp = validateTimestampValue(timestampInput, "$.timestamp");
  if (!timestamp.ok) return timestamp;
  if (timezone !== "UTC" && timezone !== "America/New_York") {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.timezone");
  }
  const year = BigInt(timestamp.value.slice(0, 4));
  let offset = BigInt(0);
  if (timezone === "America/New_York") {
    const bounds = newYorkDstBounds(year);
    offset = timestamp.value >= bounds.start && timestamp.value < bounds.end
      ? BigInt(-4)
      : BigInt(-5);
  }
  const local = shiftUtcToLocal(timestamp.value, offset);
  const weekdayIndex = sundayBasedWeekdayIndex(local.year, local.month, local.day);
  const weekday = WEEKDAYS.find((_, index) => BigInt(index) === weekdayIndex);
  if (weekday === undefined) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.timestamp");
  }
  return {
    ok: true,
    value: Object.freeze({
      sessionDate: canonicalDate(local.year, local.month, local.day),
      weekday,
      session: classifySession(local.hour, local.minute),
    }),
  };
}
