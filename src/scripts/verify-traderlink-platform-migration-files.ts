import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  platformMigrationFileEntries,
  type PlatformMigrationFileEntry,
} from "@/src/modules/platform/server/database/platform-migration-manifest";
import {
  platformFailure,
  validatePlatformMigrationManifest,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type PlatformMigrationFileVerification = Readonly<{
  sourcePath: string;
  migrationId: string;
  moduleNamespace: string;
  executionOrder: number;
}>;

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export function verifyPlatformMigrationFileEntry(
  entry: PlatformMigrationFileEntry,
  sourceText: string,
): PlatformMigrationFileVerification {
  const filenameStem = basename(entry.sourcePath, ".ts");
  const expectedLiterals = [
    new RegExp(`moduleNamespace\\s*:\\s*"${escapeRegularExpression(entry.migration.moduleNamespace)}"`, "u"),
    new RegExp(`migrationId\\s*:\\s*"${escapeRegularExpression(entry.migration.migrationId)}"`, "u"),
    new RegExp(`executionOrder\\s*:\\s*${entry.migration.executionOrder}(?:\\s|,)`, "u"),
  ];
  if (
    filenameStem !== entry.migration.migrationId ||
    expectedLiterals.some((pattern) => !pattern.test(sourceText))
  ) {
    platformFailure("TRADERLINK_MIGRATION_FILE_ID_MISMATCH", {
      sourcePath: entry.sourcePath,
      migrationId: entry.migration.migrationId,
    });
  }
  return Object.freeze({
    sourcePath: entry.sourcePath,
    migrationId: entry.migration.migrationId,
    moduleNamespace: entry.migration.moduleNamespace,
    executionOrder: entry.migration.executionOrder,
  });
}

export function verifyTraderLinkPlatformMigrationFiles(
  repositoryRoot = process.cwd(),
): readonly PlatformMigrationFileVerification[] {
  const manifest = validatePlatformMigrationManifest(
    platformMigrationFileEntries.map((entry) => entry.migration),
  );
  const results = platformMigrationFileEntries.map((entry) =>
    verifyPlatformMigrationFileEntry(
      entry,
      readFileSync(resolve(repositoryRoot, entry.sourcePath), "utf8"),
    ),
  );
  if (
    results.some(
      (result, index) => result.migrationId !== manifest[index]?.migrationId,
    )
  ) {
    platformFailure("TRADERLINK_MIGRATION_ORDER_CONFLICT");
  }
  return Object.freeze(results);
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;
  return resolve(invokedPath).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
}

if (isDirectExecution()) {
  try {
    console.info(
      JSON.stringify(
        {
          status: "verified",
          migrations: verifyTraderLinkPlatformMigrationFiles(),
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        code:
          error instanceof Error && error.message.startsWith("TRADERLINK_")
            ? error.message
            : "TRADERLINK_MIGRATION_FILE_VERIFICATION_FAILED",
      }),
    );
    process.exitCode = 1;
  }
}
