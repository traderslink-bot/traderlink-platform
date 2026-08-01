import { journalAccountBoundaryMigration } from "@/src/modules/journal/server/database/migrations/0002_journal_account_boundary";
import { journalImportEvidenceMigration } from "@/src/modules/journal/server/database/migrations/0003_journal_import_evidence";
import { journalExecutionLedgerMigration } from "@/src/modules/journal/server/database/migrations/0004_journal_execution_ledger";
import { journalDataDecisionsMigration } from "@/src/modules/journal/server/database/migrations/0005_journal_data_decisions";
import { journalRoundTripProjectionMigration } from "@/src/modules/journal/server/database/migrations/0006_journal_round_trip_projection";

import { platformIdentityMigration } from "./migrations/0001_platform_identity";
import {
  type PlatformMigration,
  validatePlatformMigrationManifest,
} from "./platform-migration-contract";

export type PlatformMigrationFileEntry = Readonly<{
  sourcePath: string;
  migration: PlatformMigration;
}>;

export const platformMigrationFileEntries: readonly PlatformMigrationFileEntry[] =
  Object.freeze([
    Object.freeze({
      sourcePath: "src/modules/platform/server/database/migrations/0001_platform_identity.ts",
      migration: platformIdentityMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0002_journal_account_boundary.ts",
      migration: journalAccountBoundaryMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0003_journal_import_evidence.ts",
      migration: journalImportEvidenceMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0004_journal_execution_ledger.ts",
      migration: journalExecutionLedgerMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0005_journal_data_decisions.ts",
      migration: journalDataDecisionsMigration,
    }),
    Object.freeze({
      sourcePath: "src/modules/journal/server/database/migrations/0006_journal_round_trip_projection.ts",
      migration: journalRoundTripProjectionMigration,
    }),
  ]);

export const platformMigrationManifest = validatePlatformMigrationManifest(
  platformMigrationFileEntries.map((entry) => entry.migration),
);

const managedTablesByMigrationId: Readonly<Record<string, readonly string[]>> =
  Object.freeze({
    "0001_platform_identity": Object.freeze([
      "platform_users",
      "platform_workspaces",
      "platform_workspace_memberships",
    ]),
    "0002_journal_account_boundary": Object.freeze([
      "journal_accounts",
      "journal_account_source_identities",
    ]),
    "0003_journal_import_evidence": Object.freeze([
      "journal_instruments",
      "journal_import_batches",
      "journal_import_events",
      "journal_source_rows",
      "journal_source_row_issues",
      "journal_source_coverage_intervals",
      "journal_position_facts",
    ]),
    "0004_journal_execution_ledger": Object.freeze([
      "journal_executions",
      "journal_execution_versions",
      "journal_execution_provenance",
      "journal_execution_identity_aliases",
    ]),
    "0005_journal_data_decisions": Object.freeze([
      "journal_data_decisions",
      "journal_data_decision_events",
    ]),
    "0006_journal_round_trip_projection": Object.freeze([
      "journal_chain_rebuilds",
      "journal_round_trips",
      "journal_round_trip_versions",
      "journal_round_trip_execution_allocations",
      "journal_round_trip_identity_aliases",
      "journal_trading_days",
    ]),
  });

export function expectedPlatformTableNamesForPrefix(
  appliedMigrationCount: number,
): ReadonlySet<string> {
  const names = new Set<string>();
  if (appliedMigrationCount > 0) names.add("platform_schema_migrations");
  for (const migration of platformMigrationManifest.slice(0, appliedMigrationCount)) {
    for (const tableName of managedTablesByMigrationId[migration.migrationId] ?? []) {
      names.add(tableName);
    }
  }
  return names;
}

export function expectedPlatformDomainTableNamesForPrefix(
  appliedMigrationCount: number,
): readonly string[] {
  return Object.freeze(
    platformMigrationManifest
      .slice(0, appliedMigrationCount)
      .flatMap((migration) => managedTablesByMigrationId[migration.migrationId] ?? []),
  );
}

export const platformOwnershipFoundationDomainTableNames = Object.freeze([
  "platform_users",
  "platform_workspaces",
  "platform_workspace_memberships",
  "journal_accounts",
  "journal_account_source_identities",
]);

export const currentPlatformDomainTableNames =
  expectedPlatformDomainTableNamesForPrefix(platformMigrationManifest.length);

export const currentPlatformTableNames = expectedPlatformTableNamesForPrefix(
  platformMigrationManifest.length,
);
