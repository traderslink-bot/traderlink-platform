import type Database from "better-sqlite3";

import {
  isPlatformAppearance,
  type PlatformAppearance,
} from "@/src/modules/platform/contracts/platform-appearance";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";

export const PLATFORM_REPORTING_CURRENCIES = Object.freeze([
  "USD",
  "CAD",
  "AUD",
  "BRL",
  "CNY",
  "EUR",
  "HKD",
  "INR",
  "IDR",
  "JPY",
  "MYR",
  "MXN",
  "NZD",
  "NOK",
  "PEN",
  "PLN",
  "SGD",
  "ZAR",
  "KRW",
  "SEK",
  "CHF",
  "TWD",
  "THB",
  "TRY",
  "GBP",
] as const);

export type PlatformReportingCurrency = typeof PLATFORM_REPORTING_CURRENCIES[number];
export type PlatformPnlReportingBasis = "gross" | "net";

type PreferenceRow = Readonly<{
  appearance_mode: string;
  pnl_reporting_basis: string;
  reporting_currency: string;
}>;

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

export function parsePlatformPnlReportingBasis(value: unknown): PlatformPnlReportingBasis {
  if (value === "gross" || value === "net") return value;
  platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
    field: "pnlReportingBasis",
  });
}

export function parsePlatformAppearance(value: unknown): PlatformAppearance {
  if (!isPlatformAppearance(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "appearance",
    });
  }
  return value;
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

  getActiveUserPnlReportingBasis(userId: string): PlatformPnlReportingBasis {
    assertCanonicalUuidV4(userId, "userId");
    const row = this.database.prepare<[string], PreferenceRow>(`SELECT
  preference.pnl_reporting_basis
FROM platform_user_preferences preference
JOIN platform_users user ON user.user_id = preference.user_id
WHERE preference.user_id = ? AND user.status = 'active'`).get(userId);
    if (!row) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    return parsePlatformPnlReportingBasis(row.pnl_reporting_basis);
  }

  getActiveWorkspaceAppearance(scope: WorkspaceAccessScope): PlatformAppearance {
    assertCanonicalUuidV4(scope.userId, "userId");
    assertCanonicalUuidV4(scope.workspaceId, "workspaceId");
    const row = this.database.prepare<[string, string], PreferenceRow>(`SELECT
  preference.appearance_mode,
  preference.reporting_currency
FROM platform_user_preferences preference
JOIN platform_users user ON user.user_id = preference.user_id
JOIN platform_workspace_memberships membership
  ON membership.user_id = preference.user_id
WHERE preference.user_id = ?
  AND membership.workspace_id = ?
  AND membership.status = 'active'
  AND user.status = 'active'`).get(scope.userId, scope.workspaceId);
    if (!row) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    return parsePlatformAppearance(row.appearance_mode);
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

  updateActiveUserPnlReportingBasis(input: Readonly<{
    userId: string;
    pnlReportingBasis: unknown;
    updatedAtUtc: string;
  }>): PlatformPnlReportingBasis {
    assertCanonicalUuidV4(input.userId, "userId");
    const pnlReportingBasis = parsePlatformPnlReportingBasis(input.pnlReportingBasis);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "updatedAtUtc");
    const result = this.database.prepare(`UPDATE platform_user_preferences
SET pnl_reporting_basis = ?, updated_at_utc = ?
WHERE user_id = ?
  AND EXISTS (
    SELECT 1 FROM platform_users
    WHERE user_id = platform_user_preferences.user_id AND status = 'active'
  )`).run(pnlReportingBasis, input.updatedAtUtc, input.userId);
    if (result.changes !== 1) {
      platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    }
    return pnlReportingBasis;
  }

  updateActiveWorkspaceAppearance(input: Readonly<{
    appearance: unknown;
    scope: WorkspaceAccessScope;
    updatedAtUtc: string;
  }>): PlatformAppearance {
    assertCanonicalUuidV4(input.scope.userId, "userId");
    assertCanonicalUuidV4(input.scope.workspaceId, "workspaceId");
    const appearance = parsePlatformAppearance(input.appearance);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "updatedAtUtc");
    const result = this.database.prepare(`UPDATE platform_user_preferences
SET appearance_mode = ?, updated_at_utc = ?
WHERE user_id = ?
  AND EXISTS (
    SELECT 1
    FROM platform_users user
    JOIN platform_workspace_memberships membership
      ON membership.user_id = user.user_id
    WHERE user.user_id = platform_user_preferences.user_id
      AND user.status = 'active'
      AND membership.workspace_id = ?
      AND membership.status = 'active'
  )`).run(
      appearance,
      input.updatedAtUtc,
      input.scope.userId,
      input.scope.workspaceId,
    );
    if (result.changes !== 1) {
      platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    }
    return appearance;
  }
}
