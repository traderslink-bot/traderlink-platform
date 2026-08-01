import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

export type PlatformDatabaseInitializationResult = Readonly<{
  status: "initialized_empty_foundation";
  databasePath: string;
  completedAtUtc: string;
  migrationIds: readonly string[];
  appliedThisRun: readonly string[];
  finalSchemaSha256: string;
}>;

export function initializeTraderLinkPlatformDatabase(
  options: Readonly<{
    environment?: NodeJS.ProcessEnv;
    databasePath?: string;
    now?: () => Date;
    forbiddenRepositoryRoots?: readonly string[];
  }> = {},
): PlatformDatabaseInitializationResult {
  const databasePath =
    options.databasePath ??
    resolvePlatformDatabaseConfig({
      environment: options.environment,
      forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
    }).databasePath;
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath,
    forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
  });
  try {
    const migrationResult = runPlatformMigrations(database, { now: options.now });
    return Object.freeze({
      status: "initialized_empty_foundation",
      databasePath,
      completedAtUtc: createCanonicalUtcTimestamp(options.now?.() ?? new Date()),
      migrationIds: Object.freeze(
        platformMigrationManifest.map((migration) => migration.migrationId),
      ),
      appliedThisRun: migrationResult.appliedMigrationIds,
      finalSchemaSha256: migrationResult.finalSchemaSha256,
    });
  } finally {
    database.close();
  }
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;
  return resolve(invokedPath).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
}

function main(): void {
  if (process.argv.length !== 3 || process.argv[2] !== "--initialize-empty") {
    console.error(JSON.stringify({ code: "TRADERLINK_INITIALIZER_ARGUMENT_INVALID" }));
    process.exitCode = 1;
    return;
  }
  try {
    console.info(JSON.stringify(initializeTraderLinkPlatformDatabase(), null, 2));
  } catch (error) {
    console.error(
      JSON.stringify({
        code: isTraderLinkPlatformError(error)
          ? error.code
          : "TRADERLINK_INITIALIZER_FAILED",
      }),
    );
    process.exitCode = 1;
  }
}

if (isDirectExecution()) main();
