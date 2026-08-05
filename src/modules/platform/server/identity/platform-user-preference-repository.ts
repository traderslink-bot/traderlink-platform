import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";

export const PLATFORM_REPORTING_CURRENCIES = Object.freeze([
  "USD",
  "CAD",
  "AUD",
  "EUR",
  "HKD",
  "SGD",
  "MYR",
] as const);

export type PlatformReportingCurrency = typeof PLATFORM_REPORTING_CURRENCIES[number];

type PreferenceRow = Readonly<{ reporting_currency: string }>;

export function parsePlatformReportingCurrency(value: unknown): PlatformReportingCurrency {
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "reportingCurrency",
    });
  }
  const normalized = value.trim().toUpperCase();
  if (!(PLATFORM_REPORTING_CURRENCIES as readonly string[]).includes(normalized)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "reportingCurrency",
    });
  }
  return normalized as PlatformReportingCurrency;
}

export class PlatformUserPreferenceRepository {
  constructor(private readonly database: Database.Database) {}

  getActiveUserReportingCurrency(userId: string): PlatformReportingCurrency {
    assertCanonicalUuidV4(userId, "userId");
    const row = this.database.prepare<[string], PreferenceRow>(`SELECT
  preference.reporting_currency
FROM platform_user_preferences preference
JOIN platform_users user ON user.user_id = preference.user_id
WHERE preference.user_id = ? AND user.status = 'active'`).get(userId);
    if (!row) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    return parsePlatformReportingCurrency(row.reporting_currency);
  }

  updateActiveUserReportingCurrency(input: Readonly<{
    userId: string;
    reportingCurrency: unknown;
    updatedAtUtc: string;
  }>): PlatformReportingCurrency {
    assertCanonicalUuidV4(input.userId, "userId");
    const reportingCurrency = parsePlatformReportingCurrency(input.reportingCurrency);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "updatedAtUtc");
    const result = this.database.prepare(`UPDATE platform_user_preferences
SET reporting_currency = ?, updated_at_utc = ?
WHERE user_id = ?
  AND EXISTS (
    SELECT 1 FROM platform_users
    WHERE user_id = platform_user_preferences.user_id AND status = 'active'
  )`).run(reportingCurrency, input.updatedAtUtc, input.userId);
    if (result.changes !== 1) {
      platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    }
    return reportingCurrency;
  }
}
