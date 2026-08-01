import {
  assertCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

const CANONICAL_DECIMAL_PATTERN = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*[1-9])?$/u;
const LOWERCASE_SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const LOWERCASE_TOKEN_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/u;
const TRADING_DATE_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u;

export function assertCanonicalJournalDecimal(
  value: string,
  field: string,
  options: Readonly<{ positive?: boolean; nonNegative?: boolean }> = {},
): void {
  if (
    value.length > 128 ||
    value === "-0" ||
    !CANONICAL_DECIMAL_PATTERN.test(value) ||
    (options.positive && (value === "0" || value.startsWith("-"))) ||
    (options.nonNegative && value.startsWith("-"))
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

export function assertJournalCurrency(value: string, field: string): void {
  if (
    !/^[A-Z]{3}$/u.test(value) ||
    !Intl.supportedValuesOf("currency").includes(value)
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

export function assertJournalTimezone(value: string, field: string): void {
  if (value.trim() !== value || value.length < 1 || value.length > 64) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(0);
  } catch {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

export function assertJournalTradingDate(value: string, field: string): void {
  if (!TRADING_DATE_PATTERN.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

export function assertJournalSha256(value: string, field: string): void {
  if (!LOWERCASE_SHA256_PATTERN.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

export function assertJournalToken(value: string, field: string): void {
  if (!LOWERCASE_TOKEN_PATTERN.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
}

export function assertJournalUtcTimestamp(value: string, field: string): void {
  assertCanonicalUtcTimestamp(value, field);
}
