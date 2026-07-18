import type { ExactResult } from "../exact";

declare const canonicalUtcTimestampBrand: unique symbol;

export type CanonicalUtcTimestamp = string & {
  readonly [canonicalUtcTimestampBrand]: "CanonicalUtcTimestamp";
};

export type TimestampSourcePrecision =
  | "date"
  | "minute"
  | "second"
  | "millisecond"
  | "microsecond"
  | "nanosecond"
  | "unknown";

export type CanonicalTimestampFailureCode =
  | "ti_v3_timestamp_input_not_string"
  | "ti_v3_timestamp_format_invalid"
  | "ti_v3_timestamp_component_invalid"
  | "ti_v3_timestamp_precision_invalid"
  | "ti_v3_timestamp_precision_evidence_conflict";

export interface CanonicalTimestampFailure {
  code: CanonicalTimestampFailureCode;
}

interface TimestampParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  nanosecond: number;
}

const TIMESTAMP_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{9})Z$/;

const SOURCE_PRECISIONS = new Set<TimestampSourcePrecision>([
  "date",
  "minute",
  "second",
  "millisecond",
  "microsecond",
  "nanosecond",
  "unknown",
]);

function leapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  const lengths = [31, leapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1] ?? 0;
}

function parseParts(input: string): TimestampParts | null {
  const match = TIMESTAMP_PATTERN.exec(input);
  if (match === null) {
    return null;
  }
  const parts: TimestampParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6]),
    nanosecond: Number(match[7]),
  };
  if (
    parts.year < 1 ||
    parts.month < 1 ||
    parts.month > 12 ||
    parts.day < 1 ||
    parts.day > daysInMonth(parts.year, parts.month) ||
    parts.hour > 23 ||
    parts.minute > 59 ||
    parts.second > 59 ||
    parts.nanosecond > 999_999_999
  ) {
    return null;
  }
  return parts;
}

function precisionMatches(parts: TimestampParts, precision: TimestampSourcePrecision): boolean {
  if (precision === "unknown" || precision === "nanosecond") {
    return true;
  }
  if (precision === "date") {
    return (
      parts.hour === 0 &&
      parts.minute === 0 &&
      parts.second === 0 &&
      parts.nanosecond === 0
    );
  }
  if (precision === "minute") {
    return parts.second === 0 && parts.nanosecond === 0;
  }
  if (precision === "second") {
    return parts.nanosecond === 0;
  }
  if (precision === "millisecond") {
    return parts.nanosecond % 1_000_000 === 0;
  }
  return parts.nanosecond % 1_000 === 0;
}

export function parseCanonicalUtcTimestamp(
  input: unknown,
  precision: unknown,
): ExactResult<CanonicalUtcTimestamp, CanonicalTimestampFailure> {
  if (typeof input !== "string") {
    return { ok: false, error: { code: "ti_v3_timestamp_input_not_string" } };
  }
  if (typeof precision !== "string" || !SOURCE_PRECISIONS.has(precision as TimestampSourcePrecision)) {
    return { ok: false, error: { code: "ti_v3_timestamp_precision_invalid" } };
  }
  const parts = parseParts(input);
  if (parts === null) {
    return {
      ok: false,
      error: {
        code: TIMESTAMP_PATTERN.test(input)
          ? "ti_v3_timestamp_component_invalid"
          : "ti_v3_timestamp_format_invalid",
      },
    };
  }
  if (!precisionMatches(parts, precision as TimestampSourcePrecision)) {
    return {
      ok: false,
      error: { code: "ti_v3_timestamp_precision_evidence_conflict" },
    };
  }
  return { ok: true, value: input as CanonicalUtcTimestamp };
}

function daysBeforeYear(year: number): bigint {
  const previous = BigInt(year - 1);
  return (
    previous * BigInt(365) +
    previous / BigInt(4) -
    previous / BigInt(100) +
    previous / BigInt(400)
  );
}

function daysBeforeMonth(year: number, month: number): bigint {
  let days = BigInt(0);
  for (let current = 1; current < month; current += 1) {
    days += BigInt(daysInMonth(year, current));
  }
  return days;
}

export function timestampEpochNanoseconds(value: CanonicalUtcTimestamp): bigint {
  const parts = parseParts(value);
  if (parts === null) {
    throw new Error("ti_v3_timestamp_invariant_invalid");
  }
  const days =
    daysBeforeYear(parts.year) +
    daysBeforeMonth(parts.year, parts.month) +
    BigInt(parts.day - 1);
  const seconds =
    days * BigInt(86_400) +
    BigInt(parts.hour) * BigInt(3_600) +
    BigInt(parts.minute) * BigInt(60) +
    BigInt(parts.second);
  return seconds * BigInt(1_000_000_000) + BigInt(parts.nanosecond);
}

export function timestampPrecisionIntervalNanoseconds(
  value: CanonicalUtcTimestamp,
  precision: TimestampSourcePrecision,
): { start: bigint; endExclusive: bigint | null } {
  const start = timestampEpochNanoseconds(value);
  const width =
    precision === "date"
      ? BigInt("86400000000000")
      : precision === "minute"
        ? BigInt("60000000000")
        : precision === "second"
          ? BigInt(1_000_000_000)
          : precision === "millisecond"
            ? BigInt(1_000_000)
            : precision === "microsecond"
              ? BigInt(1_000)
              : precision === "nanosecond"
                ? BigInt(1)
                : null;
  return { start, endExclusive: width === null ? null : start + width };
}
