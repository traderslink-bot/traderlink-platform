import Decimal from "decimal.js";

import {
  assertCanonicalJournalDecimal, assertJournalCurrency,
  assertJournalTimezone, assertJournalUtcTimestamp,
} from "../../contracts/journal-storage-values";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

const JournalDecimal = Decimal.clone({ precision: 160, rounding: Decimal.ROUND_HALF_UP, toExpNeg: -1000, toExpPos: 1000 });

export function normalizeBrokerDecimal(
  rawValue: string, field: string,
  options: Readonly<{ positive?: boolean; nonNegative?: boolean }> = {},
): string {
  if (rawValue.length > 256) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", { field });
  }
  let value = rawValue.trim();
  let negativeByParentheses = false;
  if (value.startsWith("(") && value.endsWith(")")) {
    negativeByParentheses = true; value = value.slice(1, -1).trim();
  }
  if (/^[+-]?(?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?:\.[0-9]+)?$/u.test(value)) value = value.replaceAll(",", "");
  if (negativeByParentheses) value = `-${value}`;
  if (!/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u.test(value)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", { field });
  }
  let normalized: string;
  try { normalized = new JournalDecimal(value).toFixed(); }
  catch (error) { platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", { field }, error); }
  if (normalized === "-0") normalized = "0";
  assertCanonicalJournalDecimal(normalized, field, options);
  return normalized;
}

type LocalDateTimeParts = Readonly<{ year: number; month: number; day: number; hour: number; minute: number; second: number }>;

function parseIbkrDateTimeParts(value: string): LocalDateTimeParts | null {
  const compact = value.match(/^(\d{4})(\d{2})(\d{2})[;, T]+(\d{2}):?(\d{2}):?(\d{2})$/u);
  const dashed = value.match(/^(\d{4})-(\d{2})-(\d{2})[;, T]+(\d{2}):(\d{2}):(\d{2})$/u);
  const slashed = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[;, T]+(\d{2}):(\d{2}):(\d{2})$/u);
  const match = compact ?? dashed;
  const numbers = match ? match.slice(1).map(Number) : slashed
    ? [Number(slashed[3]), Number(slashed[1]), Number(slashed[2]), Number(slashed[4]), Number(slashed[5]), Number(slashed[6])]
    : null;
  if (!numbers) return null;
  const [year, month, day, hour, minute, second] = numbers;
  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) return null;
  return { year, month, day, hour, minute, second };
}

function partsAt(instant: Date, timeZone: string): LocalDateTimeParts {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(instant).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
  return { year: values.year, month: values.month, day: values.day, hour: values.hour, minute: values.minute, second: values.second };
}

function sameParts(left: LocalDateTimeParts, right: LocalDateTimeParts): boolean {
  return Object.keys(left).every((key) => left[key as keyof LocalDateTimeParts] === right[key as keyof LocalDateTimeParts]);
}

export function assertUtcMatchesJournalLocalTime(
  sourceTimestampText: string,
  sourceTimezone: string,
  executedAtUtc: string,
): void {
  assertJournalTimezone(sourceTimezone, "sourceTimezone");
  assertJournalUtcTimestamp(executedAtUtc, "executedAtUtc");
  if (sourceTimestampText.length > 120) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      field: "sourceTimestampText",
    });
  }
  const parts = parseIbkrDateTimeParts(sourceTimestampText.trim());
  if (
    !parts ||
    !sameParts(partsAt(new Date(executedAtUtc), sourceTimezone), parts)
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      field: "executedAtUtc",
      reason: "utc_local_time_mismatch",
    });
  }
}

export function normalizeIbkrExecutionTime(sourceTimestampText: string, sourceTimezone: string): string {
  assertJournalTimezone(sourceTimezone, "sourceTimezone");
  if (sourceTimestampText.length > 120) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      field: "sourceTimestampText",
    });
  }
  const parts = parseIbkrDateTimeParts(sourceTimestampText.trim());
  if (!parts) platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", { field: "sourceTimestampText" });
  const desiredAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let candidate = desiredAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = partsAt(new Date(candidate), sourceTimezone);
    candidate += desiredAsUtc - Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second);
  }
  const instant = new Date(candidate);
  if (!sameParts(partsAt(instant, sourceTimezone), parts)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      field: "sourceTimestampText",
      reason: "local_time_invalid",
    });
  }
  const ambiguous = [-180, -120, -90, -60, -30, 30, 60, 90, 120, 180]
    .some((offsetMinutes) => sameParts(
      partsAt(new Date(candidate + offsetMinutes * 60_000), sourceTimezone),
      parts,
    ));
  if (ambiguous) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      field: "sourceTimestampText",
      reason: "local_time_ambiguous",
    });
  }
  const canonical = instant.toISOString();
  assertJournalUtcTimestamp(canonical, "executedAtUtc");
  return canonical;
}

export function normalizeJournalCurrency(rawValue: string): string {
  if (rawValue.length > 16) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      field: "currency",
    });
  }
  const value = rawValue.trim().toUpperCase();
  assertJournalCurrency(value, "currency");
  return value;
}

export function normalizeJournalStockSymbol(rawValue: string): string {
  const value = rawValue.trim().toUpperCase();
  if (
    value.length < 1 ||
    value.length > 64 ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED", {
      field: "normalizedSymbol",
    });
  }
  return value;
}
