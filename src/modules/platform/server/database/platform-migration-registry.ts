import type Database from "better-sqlite3";

import {
  calculatePlatformMigrationChecksum,
  isCanonicalUtcTimestamp,
  isLowercaseSha256,
  type PlatformMigration,
  platformFailure,
  validatePlatformMigrationManifest,
} from "./platform-migration-contract";
import { calculatePlatformSchemaDigest } from "./platform-schema-digest";

export const PLATFORM_MIGRATION_REGISTRY_TABLE = "platform_schema_migrations";

export const CREATE_PLATFORM_MIGRATION_REGISTRY_SQL = `CREATE TABLE platform_schema_migrations (
  migration_id TEXT PRIMARY KEY CHECK (
    length(migration_id) >= 6
    AND migration_id GLOB '[0-9][0-9][0-9][0-9]_*'
    AND migration_id NOT GLOB '*[^a-z0-9_]*'
  ),
  module_namespace TEXT NOT NULL CHECK (
    module_namespace GLOB '[a-z]*'
    AND module_namespace NOT GLOB '*[^a-z0-9_]*'
  ),
  execution_order INTEGER NOT NULL CHECK (execution_order > 0),
  checksum_sha256 TEXT NOT NULL CHECK (
    length(checksum_sha256) = 64
    AND checksum_sha256 = lower(checksum_sha256)
    AND checksum_sha256 NOT GLOB '*[^0-9a-f]*'
  ),
  post_schema_sha256 TEXT NOT NULL CHECK (
    length(post_schema_sha256) = 64
    AND post_schema_sha256 = lower(post_schema_sha256)
    AND post_schema_sha256 NOT GLOB '*[^0-9a-f]*'
  ),
  applied_at_utc TEXT NOT NULL CHECK (
    length(applied_at_utc) = 24
    AND applied_at_utc GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  ),
  sqlite_version TEXT NOT NULL CHECK (length(sqlite_version) > 0),
  UNIQUE (execution_order)
) STRICT, WITHOUT ROWID`;

export type AppliedPlatformMigrationRow = Readonly<{
  migration_id: string;
  module_namespace: string;
  execution_order: number;
  checksum_sha256: string;
  post_schema_sha256: string;
  applied_at_utc: string;
  sqlite_version: string;
}>;

export function listPlatformUserTableNames(
  database: Database.Database,
): readonly string[] {
  return database
    .prepare<[], { name: string }>(`SELECT name
FROM sqlite_schema
WHERE type = 'table' AND substr(name, 1, 7) <> 'sqlite_'
ORDER BY name COLLATE BINARY`)
    .all()
    .map((row) => row.name);
}

export function platformMigrationRegistryExists(
  database: Database.Database,
): boolean {
  return database
    .prepare<[string], { present: number }>(
      "SELECT 1 AS present FROM sqlite_schema WHERE type = 'table' AND name = ?",
    )
    .get(PLATFORM_MIGRATION_REGISTRY_TABLE)?.present === 1;
}

export function createPlatformMigrationRegistry(
  database: Database.Database,
): void {
  database.exec(CREATE_PLATFORM_MIGRATION_REGISTRY_SQL);
}

export function readAppliedPlatformMigrations(
  database: Database.Database,
): readonly AppliedPlatformMigrationRow[] {
  if (!platformMigrationRegistryExists(database)) return [];
  return database
    .prepare<[], AppliedPlatformMigrationRow>(`SELECT
  migration_id, module_namespace, execution_order, checksum_sha256,
  post_schema_sha256, applied_at_utc, sqlite_version
FROM platform_schema_migrations
ORDER BY execution_order`)
    .all();
}

export function validateAppliedPlatformMigrationPrefix(
  rows: readonly AppliedPlatformMigrationRow[],
  manifestInput: readonly PlatformMigration[],
): readonly PlatformMigration[] {
  const manifest = validatePlatformMigrationManifest(manifestInput);
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const expected = manifest[index];
    if (!expected) {
      platformFailure("TRADERLINK_MIGRATION_UNKNOWN_APPLIED", {
        migrationId: row.migration_id,
      });
    }
    const knownIndex = manifest.findIndex(
      (migration) => migration.migrationId === row.migration_id,
    );
    if (knownIndex < 0) {
      platformFailure("TRADERLINK_MIGRATION_UNKNOWN_APPLIED", {
        migrationId: row.migration_id,
      });
    }
    if (knownIndex !== index || row.execution_order !== expected.executionOrder) {
      platformFailure("TRADERLINK_MIGRATION_ORDER_CONFLICT", {
        migrationId: row.migration_id,
      });
    }
    if (
      row.migration_id !== expected.migrationId ||
      row.module_namespace !== expected.moduleNamespace ||
      row.checksum_sha256 !== calculatePlatformMigrationChecksum(expected)
    ) {
      platformFailure("TRADERLINK_MIGRATION_CHECKSUM_MISMATCH", {
        migrationId: row.migration_id,
      });
    }
    if (
      !isLowercaseSha256(row.post_schema_sha256) ||
      !isCanonicalUtcTimestamp(row.applied_at_utc) ||
      row.sqlite_version.length === 0
    ) {
      platformFailure("TRADERLINK_MIGRATION_CHECKSUM_MISMATCH", {
        migrationId: row.migration_id,
      });
    }
  }
  return manifest;
}

export function requireOnlyExpectedPlatformTables(
  database: Database.Database,
  expectedTableNames: ReadonlySet<string>,
): void {
  const unexpected = listPlatformUserTableNames(database).find(
    (tableName) => !expectedTableNames.has(tableName),
  );
  if (unexpected) {
    platformFailure("TRADERLINK_PLATFORM_UNMANAGED_SCHEMA", {
      tableName: unexpected,
    });
  }
}

export function requirePlatformSchemaDigest(
  database: Database.Database,
  expectedDigest: string,
): string {
  const actualDigest = calculatePlatformSchemaDigest(database);
  if (actualDigest !== expectedDigest) {
    platformFailure("TRADERLINK_PLATFORM_SCHEMA_MISMATCH", {
      expectedPostSchemaSha256: expectedDigest,
      actualSchemaSha256: actualDigest,
    });
  }
  return actualDigest;
}

export function requirePlatformForeignKeyCheck(
  database: Database.Database,
): void {
  const rows = database.pragma("foreign_key_check") as readonly unknown[];
  if (rows.length !== 0) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "foreign_key_check",
    });
  }
}

export function requirePlatformQuickCheck(database: Database.Database): void {
  const rows = database.pragma("quick_check") as readonly Record<string, unknown>[];
  const result = rows.length === 1 ? Object.values(rows[0] ?? {})[0] : undefined;
  if (result !== "ok") {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "quick_check",
    });
  }
}
