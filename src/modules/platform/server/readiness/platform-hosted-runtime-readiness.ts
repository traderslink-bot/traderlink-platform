import { accessSync, constants, existsSync, lstatSync, realpathSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

import {
  TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT_ENV,
  TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON_ENV,
} from "@/src/modules/journal/server/imports/journal-evidence-vault";
import { TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT_ENV } from "@/src/modules/journal/server/imports/journal-upload-staging";

import { TRADERLINK_PLATFORM_DB_PATH_ENV } from "../database/platform-database-config";
import { platformMigrationManifest } from "../database/platform-migration-manifest";
import { openReadonlyPlatformDatabase } from "../database/open-readonly-platform-database";
import {
  requirePlatformSingleNodeSqliteStorage,
  TRADERLINK_PLATFORM_SQLITE_SINGLE_NODE_BACKEND,
} from "../database/platform-storage-backend";

export const TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT_ENV =
  "TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT" as const;
export const RAILWAY_VOLUME_MOUNT_PATH_ENV = "RAILWAY_VOLUME_MOUNT_PATH" as const;
export const TRADERLINK_PLATFORM_HOSTED_VOLUME_ROOT = "/data" as const;

export type PlatformHostedRuntimeReadiness = Readonly<{
  status: "ready";
  migrationCount: number;
  storage: typeof TRADERLINK_PLATFORM_SQLITE_SINGLE_NODE_BACKEND;
}>;

function requireExactAbsolutePath(
  environment: NodeJS.ProcessEnv,
  key: string,
  expectedPath: string,
): string {
  const configured = environment[key];
  if (
    !configured ||
    configured.trim() !== configured ||
    !isAbsolute(configured) ||
    resolve(configured) !== resolve(expectedPath)
  ) {
    throw new Error("TRADERLINK_HOSTED_RUNTIME_CONFIGURATION_INVALID");
  }
  return resolve(configured);
}

function requireDirectory(path: string, writable: boolean): void {
  if (
    !existsSync(path) ||
    lstatSync(path).isSymbolicLink() ||
    !lstatSync(path).isDirectory() ||
    resolve(realpathSync(path)) !== resolve(path)
  ) {
    throw new Error("TRADERLINK_HOSTED_RUNTIME_STORAGE_INVALID");
  }
  accessSync(path, constants.R_OK | (writable ? constants.W_OK : 0));
}

function requireProtectedBackupRoot(
  environment: NodeJS.ProcessEnv,
  backupRoot: string,
): void {
  const encoded = environment[
    TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON_ENV
  ];
  let parsed: unknown;
  try {
    parsed = encoded ? JSON.parse(encoded) : null;
  } catch {
    throw new Error("TRADERLINK_HOSTED_RUNTIME_CONFIGURATION_INVALID");
  }
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 1 ||
    typeof parsed[0] !== "string" ||
    !isAbsolute(parsed[0]) ||
    resolve(parsed[0]) !== backupRoot
  ) {
    throw new Error("TRADERLINK_HOSTED_RUNTIME_CONFIGURATION_INVALID");
  }
}

export function verifyPlatformHostedRuntimeReadiness(
  environment: NodeJS.ProcessEnv = process.env,
): PlatformHostedRuntimeReadiness {
  if (environment.NODE_ENV !== "production") {
    throw new Error("TRADERLINK_HOSTED_RUNTIME_PRODUCTION_REQUIRED");
  }
  requirePlatformSingleNodeSqliteStorage(
    "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED",
    environment,
  );

  const volumeRoot = requireExactAbsolutePath(
    environment,
    RAILWAY_VOLUME_MOUNT_PATH_ENV,
    TRADERLINK_PLATFORM_HOSTED_VOLUME_ROOT,
  );
  requireDirectory(volumeRoot, true);

  const databasePath = requireExactAbsolutePath(
    environment,
    TRADERLINK_PLATFORM_DB_PATH_ENV,
    join(volumeRoot, "traderlink-platform.sqlite"),
  );
  const evidenceVaultRoot = requireExactAbsolutePath(
    environment,
    TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT_ENV,
    join(volumeRoot, "evidence-vault"),
  );
  const uploadStagingRoot = requireExactAbsolutePath(
    environment,
    TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT_ENV,
    join(volumeRoot, "upload-staging"),
  );
  const backupRoot = requireExactAbsolutePath(
    environment,
    TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT_ENV,
    join(volumeRoot, "backups"),
  );
  requireDirectory(evidenceVaultRoot, true);
  requireDirectory(uploadStagingRoot, true);
  requireDirectory(backupRoot, true);
  requireProtectedBackupRoot(environment, backupRoot);

  const database = openReadonlyPlatformDatabase({ databasePath, environment });
  database.close();

  return Object.freeze({
    migrationCount: platformMigrationManifest.length,
    status: "ready" as const,
    storage: TRADERLINK_PLATFORM_SQLITE_SINGLE_NODE_BACKEND,
  });
}
