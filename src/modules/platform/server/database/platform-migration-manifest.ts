import { journalAccountBoundaryMigration } from "@/src/modules/journal/server/database/migrations/0002_journal_account_boundary";

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

export const platformEmptyFoundationDomainTableNames = Object.freeze(
  platformMigrationManifest.flatMap(
    (migration) => managedTablesByMigrationId[migration.migrationId] ?? [],
  ),
);

export const completedPlatformTableNames = expectedPlatformTableNamesForPrefix(
  platformMigrationManifest.length,
);
