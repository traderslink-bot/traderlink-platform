import { dirname, isAbsolute, join, resolve } from "node:path";

import Database from "better-sqlite3";

import {
  ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
  DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "@/src/modules/journal/server/accounts/journal-source-account-canonicalizers";
import { loadAccountIdentityConfiguration } from "@/src/modules/journal/server/accounts/journal-account-service";

import { initializeTraderLinkPlatformDatabase } from "@/src/scripts/initialize-traderlink-platform-database";

import { createAndRestoreVerifyPlatformDatabaseBackup } from "./platform-database-backup";
import {
  isPathWithinRoot,
  resolvePlatformDatabaseConfig,
} from "./platform-database-config";
import { platformFailure } from "./platform-migration-contract";
import { platformMigrationManifest } from "./platform-migration-manifest";
import {
  readAppliedPlatformMigrations,
  validateAppliedPlatformMigrationPrefix,
} from "./platform-migration-registry";
import { verifyCompletedPlatformDatabase } from "./run-platform-migrations";

const MAINTENANCE_MIGRATION_ID_ENV =
  "TRADERLINK_PLATFORM_MAINTENANCE_MIGRATION_ID";
const MAINTENANCE_CONFIRMATION_ENV =
  "TRADERLINK_PLATFORM_MAINTENANCE_CONFIRM";
const MAINTENANCE_CONFIRMATION = "apply-reviewed-migration";
const HOSTED_BACKUP_ROOT_ENV = "TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT";

type MaintenancePreflight = "apply" | "already_applied";

function maintenanceMigrationId(environment: NodeJS.ProcessEnv): string | null {
  const migrationId = environment[MAINTENANCE_MIGRATION_ID_ENV];
  const confirmation = environment[MAINTENANCE_CONFIRMATION_ENV];
  if (migrationId === undefined && confirmation === undefined) return null;
  if (
    !migrationId ||
    migrationId.trim() !== migrationId ||
    confirmation !== MAINTENANCE_CONFIRMATION
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      stage: "maintenance_request",
    });
  }
  const expected = platformMigrationManifest.at(-1)?.migrationId;
  if (!expected || migrationId !== expected) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      stage: "maintenance_target",
    });
  }
  return migrationId;
}

function backupRoot(databasePath: string, environment: NodeJS.ProcessEnv): string {
  const configured = environment[HOSTED_BACKUP_ROOT_ENV];
  if (!configured || !isAbsolute(configured)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      stage: "maintenance_backup_root",
    });
  }
  const resolved = resolve(configured);
  const databaseRoot = dirname(databasePath);
  if (resolved === databaseRoot || !isPathWithinRoot(resolved, databaseRoot)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      stage: "maintenance_backup_root_boundary",
    });
  }
  return resolved;
}

function readMaintenancePreflight(
  databasePath: string,
  migrationId: string,
): MaintenancePreflight {
  const target = platformMigrationManifest.at(-1);
  const prefixManifest = platformMigrationManifest.slice(0, -1);
  const predecessor = prefixManifest.at(-1);
  if (
    !target ||
    target.migrationId !== migrationId ||
    !predecessor
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      stage: "maintenance_manifest_predecessor",
    });
  }

  const database = new Database(databasePath, {
    fileMustExist: true,
    readonly: true,
    timeout: 5_000,
  });
  try {
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");
    database.pragma("query_only = ON");
    const applied = readAppliedPlatformMigrations(database);
    validateAppliedPlatformMigrationPrefix(applied, platformMigrationManifest);
    if (applied.length === platformMigrationManifest.length) {
      if (applied.at(-1)?.migration_id !== migrationId) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          stage: "maintenance_already_applied_target",
        });
      }
      verifyCompletedPlatformDatabase(database);
      return "already_applied";
    }
    if (
      applied.length !== prefixManifest.length ||
      applied.at(-1)?.migration_id !== predecessor.migrationId
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        stage: "maintenance_exact_predecessor",
      });
    }
    verifyCompletedPlatformDatabase(database, prefixManifest);
    return "apply";
  } finally {
    database.close();
  }
}

/**
 * Runs only when both protected maintenance variables are deliberately set.
 * Ordinary startup never calls the initializer and remains read-only.
 */
export async function runHostedPlatformMigrationMaintenance(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<readonly string[] | null> {
  const migrationId = maintenanceMigrationId(environment);
  if (!migrationId) return null;

  const databasePath = resolvePlatformDatabaseConfig({ environment }).databasePath;
  const preflight = readMaintenancePreflight(databasePath, migrationId);
  if (preflight === "already_applied") return Object.freeze([]);

  const accountIdentity = loadAccountIdentityConfiguration(
    environment,
    ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
    DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
  );
  const timestamp = new Date().toISOString().replaceAll(/[-:.]/gu, "");
  const checkpointRoot = join(backupRoot(databasePath, environment), "migrations", migrationId, timestamp);
  const prefixManifest = platformMigrationManifest.slice(0, -1);

  await createAndRestoreVerifyPlatformDatabaseBackup({
    sourcePath: databasePath,
    backupPath: join(checkpointRoot, "backup.sqlite"),
    restoreVerificationPath: join(checkpointRoot, "restore-verification.sqlite"),
    verificationManifest: prefixManifest,
    verifyRecoveryAuthority(requirements) {
      if (
        !requirements.hmacKeyVersions.every((version) =>
          version in accountIdentity.keysBase64) ||
        !requirements.sourceAccountCanonicalizationVersions.every((version) =>
          version in ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS)
      ) {
        platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
      }
      return Object.freeze({
        verified: true as const,
        hmacKeyVersions: requirements.hmacKeyVersions,
        sourceAccountCanonicalizationVersions:
          requirements.sourceAccountCanonicalizationVersions,
      });
    },
  });

  const initialized = initializeTraderLinkPlatformDatabase({
    databasePath,
  });
  if (
    initialized.appliedThisRun.length !== 1 ||
    initialized.appliedThisRun[0] !== migrationId
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  }
  return initialized.appliedThisRun;
}
