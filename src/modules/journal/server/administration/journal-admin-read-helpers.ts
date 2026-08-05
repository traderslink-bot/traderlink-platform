import type Database from "better-sqlite3";

import {
  JOURNAL_ADMIN_PAGE_SIZE_DEFAULT,
  JOURNAL_ADMIN_PAGE_SIZE_MAXIMUM,
  type JournalAdminCoverage,
  type JournalAdminRateMetric,
} from "../../contracts/journal-administration-contracts";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import {
  issueJournalAdminReference,
  resolveJournalAdminReference,
  type JournalAdminReferenceKind,
  type PlatformAdminReferenceKeyConfiguration,
} from "@/src/modules/platform/server/administration/platform-admin-reference-authority";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { loadJournalPrivacyHmacConfiguration } from "../imports/journal-import-service";

export type JournalAdminReadContext = Readonly<{
  database: Database.Database;
  scope: JournalAdminScope;
  configuration: PlatformAdminReferenceKeyConfiguration;
  now: Date;
  nowUtc: string;
}>;

export function createJournalAdminReadContext(input: Readonly<{
  database: Database.Database;
  scope: JournalAdminScope;
  configuration?: PlatformAdminReferenceKeyConfiguration;
  now?: Date;
}>): JournalAdminReadContext {
  const now = input.now ?? new Date();
  return Object.freeze({
    database: input.database,
    scope: input.scope,
    configuration: input.configuration ?? loadJournalPrivacyHmacConfiguration(),
    now,
    nowUtc: createCanonicalUtcTimestamp(now),
  });
}

export function journalAdminCoverage(
  context: JournalAdminReadContext,
  note: string | null = null,
): JournalAdminCoverage {
  return Object.freeze({ dataAsOfUtc: context.nowUtc, timezone: "UTC", note });
}

export function journalAdminReference(
  context: JournalAdminReadContext,
  kind: JournalAdminReferenceKind,
  internalId: string,
): string {
  return issueJournalAdminReference({
    configuration: context.configuration,
    scope: context.scope,
    kind,
    internalId,
  });
}

export function resolveJournalAdminInternalId(
  context: JournalAdminReadContext,
  reference: string,
  expectedKinds: readonly JournalAdminReferenceKind[],
): Readonly<{ kind: JournalAdminReferenceKind; internalId: string }> {
  return resolveJournalAdminReference({
    configuration: context.configuration,
    scope: context.scope,
    reference,
    expectedKinds,
  });
}

export function journalAdminPageSize(value: number | undefined): number {
  if (value === undefined) return JOURNAL_ADMIN_PAGE_SIZE_DEFAULT;
  if (!Number.isSafeInteger(value) || value < 1 || value > JOURNAL_ADMIN_PAGE_SIZE_MAXIMUM) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "pageSize",
    });
  }
  return value;
}
export function journalAdminRate(
  numerator: number,
  denominator: number,
  emptyNote: string,
): JournalAdminRateMetric {
  return Object.freeze({
    numerator,
    denominator,
    percentage: denominator === 0
      ? null
      : Math.round((numerator / denominator) * 10_000) / 100,
    note: denominator === 0 ? emptyNote : null,
  });
}

export function parseSafeCountObject(value: string): Readonly<Record<string, number>> {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      Object.entries(parsed).some(([key, count]) =>
        !/^[a-z][a-z0-9_]{0,63}$/u.test(key) ||
        typeof count !== "number" ||
        !Number.isSafeInteger(count) ||
        count < 0)
    ) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
    }
    return Object.freeze({ ...(parsed as Record<string, number>) });
  } catch (error) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {}, error);
  }
}

export function dateThreshold(now: Date, days: number): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

export function boundedToken(
  value: string | null | undefined,
  field: string,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (!/^[a-z][a-z0-9_-]{0,63}$/u.test(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
  }
  return value;
}
