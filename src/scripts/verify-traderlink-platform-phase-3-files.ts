import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  currentPlatformDomainTableNames,
  platformMigrationFileEntries,
  platformMigrationManifest,
  platformOwnershipFoundationDomainTableNames,
} from "@/src/modules/platform/server/database/platform-migration-manifest";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { verifyTraderLinkPlatformMigrationFiles } from "@/src/scripts/verify-traderlink-platform-migration-files";

const PHASE_3_MIGRATION_FILES = Object.freeze([
  "src/modules/journal/server/database/migrations/0003_journal_import_evidence.ts",
  "src/modules/journal/server/database/migrations/0004_journal_execution_ledger.ts",
  "src/modules/journal/server/database/migrations/0005_journal_data_decisions.ts",
  "src/modules/journal/server/database/migrations/0006_journal_round_trip_projection.ts",
]);

const REQUIRED_SLICE_A_FILES = Object.freeze([
  ...PHASE_3_MIGRATION_FILES,
  "src/modules/journal/contracts/journal-storage-values.ts",
  "src/modules/journal/contracts/journal-storage-values.test.ts",
  "src/modules/journal/server/database/journal-integrity-migrations.test.ts",
]);

const EXPECTED_FOUNDATION_TABLES = Object.freeze([
  "platform_users",
  "platform_workspaces",
  "platform_workspace_memberships",
  "journal_accounts",
  "journal_account_source_identities",
]);

function requireCondition(condition: boolean, field: string): void {
  if (!condition) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { check: field });
  }
}

export function verifyTraderLinkPlatformPhase3Files(
  repositoryRoot = process.cwd(),
): Readonly<{
  status: "verified";
  migrationCount: number;
  managedDomainTableCount: number;
  phase3MigrationFiles: number;
  sliceAFiles: number;
}> {
  verifyTraderLinkPlatformMigrationFiles(repositoryRoot);
  requireCondition(platformMigrationManifest.length === 6, "phase_3_manifest_count");
  requireCondition(
    JSON.stringify(platformOwnershipFoundationDomainTableNames) ===
      JSON.stringify(EXPECTED_FOUNDATION_TABLES),
    "phase_2_foundation_profile",
  );
  requireCondition(currentPlatformDomainTableNames.length === 24, "managed_table_count");
  requireCondition(
    PHASE_3_MIGRATION_FILES.every((sourcePath, index) => {
      const entry = platformMigrationFileEntries[index + 2];
      return (
        entry?.sourcePath === sourcePath &&
        entry.migration.executionOrder === index + 3
      );
    }),
    "phase_3_manifest_files",
  );

  for (const sourcePath of REQUIRED_SLICE_A_FILES) {
    const source = readFileSync(resolve(repositoryRoot, sourcePath), "utf8");
    requireCondition(!/trader-intelligence-v3|trader_analytics|v4-temp-sql/iu.test(source),
      "phase_3_legacy_dependency");
    if (PHASE_3_MIGRATION_FILES.includes(sourcePath)) {
      requireCondition(!/\bREAL\b/u.test(source), "phase_3_sql_real_forbidden");
    }
  }

  return Object.freeze({
    status: "verified",
    migrationCount: platformMigrationManifest.length,
    managedDomainTableCount: currentPlatformDomainTableNames.length,
    phase3MigrationFiles: PHASE_3_MIGRATION_FILES.length,
    sliceAFiles: REQUIRED_SLICE_A_FILES.length,
  });
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;
  return resolve(invokedPath).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
}

if (isDirectExecution()) {
  try {
    console.info(JSON.stringify(verifyTraderLinkPlatformPhase3Files(), null, 2));
  } catch (error) {
    console.error(
      JSON.stringify({
        code:
          error instanceof Error && error.message.startsWith("TRADERLINK_")
            ? error.message
            : "TRADERLINK_PHASE_3_FILE_VERIFICATION_FAILED",
      }),
    );
    process.exitCode = 1;
  }
}
