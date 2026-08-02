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

const REQUIRED_ACCOUNT_FILES = Object.freeze([
  "src/modules/journal/server/accounts/journal-account-repository.ts",
  "src/modules/journal/server/accounts/journal-account-service.ts",
  "src/modules/journal/server/accounts/journal-account-boundary.test.ts",
  "src/modules/journal/server/accounts/journal-account-fingerprint-rotation.test.ts",
  "src/modules/journal/server/accounts/journal-account-authorization.test.ts",
]);

const REQUIRED_SLICE_B_FILES = Object.freeze([
  "src/modules/journal/contracts/journal-execution-contracts.ts",
  "src/modules/journal/contracts/journal-import-contracts.ts",
  "src/modules/journal/server/imports/record-preserving-csv.ts",
  "src/modules/journal/server/imports/journal-value-normalization.ts",
  "src/modules/journal/server/imports/ibkr-activity-statement-adapter.ts",
  "src/modules/journal/server/imports/journal-import-repository.ts",
  "src/modules/journal/server/imports/journal-import-service.ts",
  "src/modules/journal/server/imports/synthetic-ibkr-fixtures.ts",
  "src/modules/journal/server/executions/journal-execution-repository.ts",
  "src/modules/journal/server/executions/journal-execution-service.ts",
  "src/modules/journal/server/imports/record-preserving-csv.test.ts",
  "src/modules/journal/server/imports/ibkr-activity-statement-adapter.test.ts",
  "src/modules/journal/server/imports/journal-import-service.test.ts",
]);

const REQUIRED_SLICE_C_FILES = Object.freeze([
  "src/modules/journal/contracts/journal-decision-contracts.ts",
  "src/modules/journal/contracts/journal-integrity-coverage-contracts.ts",
  "src/modules/journal/contracts/journal-round-trip-contracts.ts",
  "src/modules/journal/server/decisions/journal-data-decision-repository.ts",
  "src/modules/journal/server/decisions/journal-data-decision-service.ts",
  "src/modules/journal/server/round-trips/journal-decimal-math.ts",
  "src/modules/journal/server/round-trips/journal-round-trip-repository.ts",
  "src/modules/journal/server/round-trips/journal-round-trip-service.ts",
  "src/modules/journal/server/journal-integrity-command-service.ts",
  "src/modules/journal/server/journal-integrity-read-repository.ts",
  "src/modules/journal/server/journal-integrity-command-service.test.ts",
]);

const REQUIRED_SLICE_D_AUTOMATION_SOURCE_FILES = Object.freeze([
  "src/modules/journal/server/accounts/ibkr-source-account-canonicalizer.ts",
  "src/modules/journal/server/accounts/journal-development-owner-scope.ts",
  "src/modules/journal/server/accounts/journal-source-identity-preparation.ts",
  "src/modules/journal/server/accounts/journal-source-identity-preparation.test.ts",
  "src/modules/journal/server/imports/journal-evidence-vault.ts",
  "src/modules/journal/server/imports/journal-import-source-preview.ts",
  "src/modules/journal/server/imports/journal-private-source-import.ts",
  "src/modules/journal/server/imports/journal-private-source-automation.test.ts",
  "src/modules/journal/server/verification/journal-integrity-verifier.ts",
  "src/scripts/import-traderlink-platform-journal-source.ts",
  "src/scripts/preview-traderlink-platform-journal-import.ts",
  "src/scripts/prepare-traderlink-platform-journal-source-identity.ts",
  "src/scripts/verify-traderlink-platform-journal-integrity.ts",
]);

const PHASE_3_VERIFIER_FILE =
  "src/scripts/verify-traderlink-platform-phase-3-files.ts";

const REQUIRED_PHASE_3_FILES = Object.freeze([
  ...REQUIRED_SLICE_A_FILES,
  ...REQUIRED_ACCOUNT_FILES,
  ...REQUIRED_SLICE_B_FILES,
  ...REQUIRED_SLICE_C_FILES,
  ...REQUIRED_SLICE_D_AUTOMATION_SOURCE_FILES,
  PHASE_3_VERIFIER_FILE,
]);

const PHASE_3_FOCUSED_TEST_FILES = Object.freeze(
  REQUIRED_PHASE_3_FILES.filter((sourcePath) => sourcePath.endsWith(".test.ts")),
);

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
  accountFiles: number;
  sliceBFiles: number;
  sliceCFiles: number;
  sliceDAutomationSourceFiles: number;
  requiredFiles: number;
  focusedTestFiles: number;
}> {
  verifyTraderLinkPlatformMigrationFiles(repositoryRoot);
  requireCondition(platformMigrationManifest.length === 6, "phase_3_manifest_count");
  requireCondition(
    JSON.stringify(platformMigrationManifest.slice(0, 2).map((migration) =>
      migration.migrationId)) ===
      JSON.stringify(["0001_platform_identity", "0002_journal_account_boundary"]),
    "phase_2_historical_prefix",
  );
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
  requireCondition(
    new Set(REQUIRED_PHASE_3_FILES).size === REQUIRED_PHASE_3_FILES.length,
    "phase_3_required_file_duplicates",
  );
  requireCondition(REQUIRED_PHASE_3_FILES.length === 50, "phase_3_required_file_count");
  requireCondition(
    REQUIRED_SLICE_D_AUTOMATION_SOURCE_FILES.length === 13,
    "phase_3_slice_d_automation_source_file_count",
  );
  requireCondition(
    PHASE_3_FOCUSED_TEST_FILES.length === 11,
    "phase_3_focused_test_count",
  );

  for (const sourcePath of REQUIRED_PHASE_3_FILES) {
    const source = readFileSync(resolve(repositoryRoot, sourcePath), "utf8");
    if (sourcePath === PHASE_3_VERIFIER_FILE) {
      requireCondition(
        !/\bfrom\s+["'][^"']*(?:trader-intelligence-v3|v4-temp-sql|private-data)/iu
          .test(source),
        "phase_3_verifier_dependency",
      );
      continue;
    }
    requireCondition(!/trader-intelligence-v3|trader_analytics|v4-temp-sql/iu.test(source),
      "phase_3_legacy_dependency");
    requireCondition(
      !/(?:^|[^a-z0-9_])[a-z]:[\\/]|private-data|\.codex|v3-dashboard|trading-rules-v1\.sqlite/iu
        .test(source),
      "phase_3_private_path_forbidden",
    );
    if (sourcePath === "src/modules/journal/server/imports/synthetic-ibkr-fixtures.ts") {
      requireCondition(
        source.includes("SYNTH-ACCOUNT") && source.includes("SYNTH-FILL-1"),
        "phase_3_fixture_not_synthetic",
      );
    } else if (!sourcePath.endsWith(".test.ts")) {
      requireCondition(
        !source.includes("synthetic-ibkr-fixtures"),
        "phase_3_fixture_production_dependency",
      );
    }
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
    accountFiles: REQUIRED_ACCOUNT_FILES.length,
    sliceBFiles: REQUIRED_SLICE_B_FILES.length,
    sliceCFiles: REQUIRED_SLICE_C_FILES.length,
    sliceDAutomationSourceFiles: REQUIRED_SLICE_D_AUTOMATION_SOURCE_FILES.length,
    requiredFiles: REQUIRED_PHASE_3_FILES.length,
    focusedTestFiles: PHASE_3_FOCUSED_TEST_FILES.length,
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
