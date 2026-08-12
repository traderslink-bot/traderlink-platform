import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

import Database from "better-sqlite3";

import { deriveDevelopmentOwnerJournalScope } from "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import {
  currentPlatformDomainTableNames,
  currentPlatformTableNames,
  platformMigrationManifest,
} from "@/src/modules/platform/server/database/platform-migration-manifest";
import { verifyPlatformDatabaseConnectionPragmas } from "@/src/modules/platform/server/database/open-platform-database";
import { verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformReadinessReadService } from "@/src/modules/platform/server/readiness/platform-readiness-read-service";

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function main(): void {
  const path = resolvePlatformDatabaseConfig({ environment: process.env }).databasePath;
  const before = Object.freeze({ size: statSync(path).size, sha256: sha256(path) });
  const database = new Database(path, { readonly: true, fileMustExist: true });
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  database.pragma("query_only = ON");

  try {
    verifyCompletedPlatformDatabase(database);
    verifyPlatformDatabaseConnectionPragmas(database);
    const scope = deriveDevelopmentOwnerJournalScope(database).scope;
    const readiness = new PlatformReadinessReadService(database).get(scope);
    const expectedModuleBoundaryCount = new Set(
      platformMigrationManifest.map((migration) => migration.moduleNamespace),
    ).size;
    const privacySafeObservedState = Object.freeze({
      storage: readiness.storage,
      ownership: Object.freeze({
        activeJournalAccountAvailable:
          readiness.ownership.activeJournalAccountAvailable,
        allowedJournalAccountCount:
          readiness.ownership.allowedJournalAccountCount,
        stablePlatformOwnerAvailable:
          readiness.ownership.stablePlatformOwnerAvailable,
        stableWorkspaceAvailable:
          readiness.ownership.stableWorkspaceAvailable,
      }),
      moduleBoundaryCount: readiness.modules.length,
      legacyRoutes: readiness.legacyRoutes,
    });
    if (
      readiness.storage.state !== "verified" ||
      readiness.storage.appliedMigrationCount !== platformMigrationManifest.length ||
      readiness.storage.expectedMigrationCount !== platformMigrationManifest.length ||
      readiness.storage.observedTableCount !== currentPlatformTableNames.size ||
      readiness.storage.expectedTableCount !== currentPlatformTableNames.size ||
      readiness.storage.domainTableCount !== currentPlatformDomainTableNames.length ||
      readiness.modules.length !== expectedModuleBoundaryCount ||
      !readiness.ownership.stablePlatformOwnerAvailable ||
      !readiness.ownership.stableWorkspaceAvailable ||
      !readiness.ownership.activeJournalAccountAvailable ||
      readiness.ownership.allowedJournalAccountCount < 1 ||
      readiness.legacyRoutes.total !== 52 ||
      readiness.legacyRoutes.byDisposition.canonical_redirect !== 44 ||
      readiness.legacyRoutes.byDisposition.compatibility_redirect !== 2 ||
      readiness.legacyRoutes.byDisposition.operations_only !== 5 ||
      readiness.legacyRoutes.byDisposition.owner_rejected_test_surface !== 1
    ) {
      throw new Error(
        `TRADERLINK_PLATFORM_READINESS_VERIFICATION_FAILED:${JSON.stringify(privacySafeObservedState)}`,
      );
    }

    const after = Object.freeze({ size: statSync(path).size, sha256: sha256(path) });
    if (before.size !== after.size || before.sha256 !== after.sha256) {
      throw new Error("TRADERLINK_PLATFORM_READINESS_DATABASE_CHANGED");
    }

    process.stdout.write(`${JSON.stringify({
      status: "ok",
      identifiersRedacted: true,
      ...privacySafeObservedState,
      launchGates: readiness.launchGates.map(({ id, state }) => ({ id, state })),
      database: { ...after, state: "unchanged" },
    })}\n`);
  } finally {
    database.close();
  }
}

main();
