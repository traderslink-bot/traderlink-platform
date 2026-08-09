import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

import Database from "better-sqlite3";

import { createJournalAdminReadContext } from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import { JOURNAL_ADMIN_PERMISSIONS } from "@/src/modules/platform/contracts/journal-admin-scope";
import { PlatformAdminErrorService } from "@/src/modules/platform/server/administration/platform-admin-error-service";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { recordMoomooOperationFailure } from "@/src/modules/platform/server/broker-connections/moomoo-operation-observability";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

const temporaryRoot = mkdtempSync(join(tmpdir(), "traderlink-moomoo-admin-errors-"));
const temporaryDatabasePath = join(temporaryRoot, "development.sqlite");

try {
  const local = loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  copyFileSync(local.databasePath, temporaryDatabasePath);
  const database = new Database(temporaryDatabasePath);
  try {
    database.pragma("foreign_keys = ON");
    const user = database.prepare(`SELECT user_id
FROM platform_users ORDER BY created_at_utc, user_id LIMIT 1`).get() as
      Readonly<{ user_id: string }> | undefined;
    if (!user) throw new Error("moomoo_admin_error_user_fixture_missing");
    const now = new Date("2026-08-09T18:00:00.000Z");
    const before = database.prepare(`SELECT COUNT(*) AS count
FROM platform_operational_events WHERE outcome_code GLOB 'moomoo_*'`).get() as
      Readonly<{ count: number }>;
    let failure: unknown;
    try {
      platformFailure("TRADERLINK_BROKER_CONNECTION_OAUTH_INVALID", {
        httpStatus: 400,
        providerCode: -100,
      });
    } catch (error) {
      failure = error;
    }
    if (!recordMoomooOperationFailure({
      database,
      error: failure,
      stage: "oauth_callback",
      now,
    })) {
      throw new Error("moomoo_admin_error_record_failed");
    }
    const context = createJournalAdminReadContext({
      database,
      now,
      scope: Object.freeze({
        userId: user.user_id,
        role: "development_journal_owner_admin" as const,
        mode: "local_development_owner" as const,
        authorizedAtUtc: now.toISOString(),
        discordOwnerVerifiedAtUtc: null,
        permissions: JOURNAL_ADMIN_PERMISSIONS,
      }),
    });
    const status = new PlatformAdminErrorService(context).read();
    const latest = status.errors[0];
    if (
      !latest || latest.source !== "Moomoo" ||
      latest.operation !== "Oauth callback" ||
      latest.failure !== "Oauth invalid" ||
      latest.safeCounts.http_status !== 400 ||
      latest.safeCounts.provider_code !== 100 ||
      latest.safeCounts.provider_code_negative !== 1 ||
      status.last24Hours < 1
    ) {
      throw new Error("moomoo_admin_error_projection_invalid");
    }
    const after = database.prepare(`SELECT COUNT(*) AS count
FROM platform_operational_events WHERE outcome_code GLOB 'moomoo_*'`).get() as
      Readonly<{ count: number }>;
    if (after.count !== before.count + 1) {
      throw new Error("moomoo_admin_error_count_invalid");
    }
    console.info(JSON.stringify({
      durableFailureRecorded: true,
      numericProviderDetailsPreserved: true,
      privateBrokerValuesExposed: false,
      recentAdminProjectionReady: true,
    }));
  } finally {
    database.close();
  }
} finally {
  const resolvedTemporaryRoot = resolve(temporaryRoot);
  const resolvedTempDirectory = resolve(tmpdir());
  if (!resolvedTemporaryRoot.startsWith(`${resolvedTempDirectory}\\traderlink-moomoo-admin-errors-`)) {
    throw new Error("moomoo_admin_error_temporary_path_invalid");
  }
  rmSync(resolvedTemporaryRoot, { force: true, recursive: true });
}
