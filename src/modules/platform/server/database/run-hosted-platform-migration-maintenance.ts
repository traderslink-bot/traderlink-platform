import { dirname, isAbsolute, join, resolve } from "node:path";

import {
  IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
  IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
} from "@/src/modules/journal/server/accounts/ibkr-source-account-canonicalizer";
import { loadAccountIdentityConfiguration } from "@/src/modules/journal/server/accounts/journal-account-service";

import { initializeTraderLinkPlatformDatabase } from "@/src/scripts/initialize-traderlink-platform-database";

import { createAndRestoreVerifyPlatformDatabaseBackup } from "./platform-database-backup";
import {
  isPathWithinRoot,
  resolvePlatformDatabaseConfig,
} from "./platform-database-config";
import { platformFailure } from "./platform-migration-contract";
import { platformMigrationManifest } from "./platform-migration-manifest";

const MAINTENANCE_MIGRATION_ID_ENV =
  "TRADERLINK_PLATFORM_MAINTENANCE_MIGRATION_ID";
const MAINTENANCE_CONFIRMATION_ENV =
  "TRADERLINK_PLATFORM_MAINTENANCE_CONFIRM";
const MAINTENANCE_CONFIRMATION = "apply-reviewed-migration";
const HOSTED_BACKUP_ROOT_ENV = "TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT";

function maintenanceMigrationId(environment: NodeJS.ProcessEnv): string | null {
  const migrationId = environment[MAINTENANCE_MIGRATION_ID_ENV];
  const confirmation = environment[MAINTENANCE_CONFIRMATION_ENV];
  if (migrationId === undefined && confirmation === undefined) return null;
  if (
    !migrationId ||
    migrationId.trim() !== migrationId ||
    confirmation !== MAINTENANCE_CONFIRMATION
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  }
  const expected = platformMigrationManifest.at(-1)?.migrationId;
  if (!expected || migrationId !== expected) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  }
  return migrationId;
}

function backupRoot(databasePath: string, environment: NodeJS.ProcessEnv): string {
  const configured = environment[HOSTED_BACKUP_ROOT_ENV];
  if (!configured || !isAbsolute(configured)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  }
  const resolved = resolve(configured);
  const databaseRoot = dirname(databasePath);
  if (resolved === databaseRoot || !isPathWithinRoot(resolved, databaseRoot)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  }
  return resolved;
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
  const accountIdentity = loadAccountIdentityConfiguration(
    environment,
    IBKR_SOURCE_ACCOUNT_CANONICALIZERS,
    IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
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
          version in IBKR_SOURCE_ACCOUNT_CANONICALIZERS)
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
