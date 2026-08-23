import type Database from "better-sqlite3";

import {
  expectedPlatformTableNamesForPrefix,
  platformMigrationManifest,
} from "./platform-migration-manifest";
import {
  calculatePlatformMigrationChecksum,
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
  type PlatformMigration,
  platformFailure,
  TraderLinkPlatformError,
  validatePlatformMigrationManifest,
} from "./platform-migration-contract";
import {
  createPlatformMigrationRegistry,
  listPlatformUserTableNames,
  platformMigrationRegistryExists,
  readAppliedPlatformMigrations,
  requireOnlyExpectedPlatformTables,
  requirePlatformForeignKeyCheck,
  requirePlatformQuickCheck,
  requirePlatformSchemaDigest,
  validateAppliedPlatformMigrationPrefix,
} from "./platform-migration-registry";
import { calculatePlatformSchemaDigest } from "./platform-schema-digest";

export type PlatformMigrationRunResult = Readonly<{
  appliedMigrationIds: readonly string[];
  finalSchemaSha256: string;
}>;

export function verifyCompletedPlatformDatabase(
  database: Database.Database,
  manifestInput: readonly PlatformMigration[] = platformMigrationManifest,
): PlatformMigrationRunResult {
  const manifest = validatePlatformMigrationManifest(manifestInput);
  const tables = listPlatformUserTableNames(database);
  if (tables.length === 0) platformFailure("TRADERLINK_PLATFORM_DATABASE_EMPTY");
  if (!platformMigrationRegistryExists(database)) {
    platformFailure("TRADERLINK_PLATFORM_UNMANAGED_SCHEMA");
  }
  const rows = readAppliedPlatformMigrations(database);
  validateAppliedPlatformMigrationPrefix(rows, manifest);
  requireOnlyExpectedPlatformTables(
    database,
    expectedPlatformTableNamesForPrefix(rows.length),
  );
  if (rows.length !== manifest.length) {
    platformFailure("TRADERLINK_PLATFORM_MIGRATIONS_PENDING", {
      appliedMigrationCount: rows.length,
      requiredMigrationCount: manifest.length,
    });
  }
  const finalRow = rows.at(-1);
  if (!finalRow) platformFailure("TRADERLINK_PLATFORM_DATABASE_EMPTY");
  const digest = requirePlatformSchemaDigest(database, finalRow.post_schema_sha256);
  requirePlatformForeignKeyCheck(database);
  requirePlatformQuickCheck(database);
  return Object.freeze({
    appliedMigrationIds: Object.freeze([]),
    finalSchemaSha256: digest,
  });
}

export function runPlatformMigrations(
  database: Database.Database,
  options: Readonly<{
    manifest?: readonly PlatformMigration[];
    now?: () => Date;
  }> = {},
): PlatformMigrationRunResult {
  const manifest = validatePlatformMigrationManifest(
    options.manifest ?? platformMigrationManifest,
  );
  const initialTables = listPlatformUserTableNames(database);
  const registryExists = platformMigrationRegistryExists(database);
  if (initialTables.length > 0 && !registryExists) {
    platformFailure("TRADERLINK_PLATFORM_UNMANAGED_SCHEMA");
  }
  const appliedRows = readAppliedPlatformMigrations(database);
  validateAppliedPlatformMigrationPrefix(appliedRows, manifest);
  if (registryExists) {
    requireOnlyExpectedPlatformTables(
      database,
      expectedPlatformTableNamesForPrefix(appliedRows.length),
    );
  }
  const latestApplied = appliedRows.at(-1);
  if (latestApplied) {
    requirePlatformSchemaDigest(database, latestApplied.post_schema_sha256);
  }

  const appliedMigrationIds: string[] = [];
  for (const migration of manifest.slice(appliedRows.length)) {
    let migrationPhase = "transaction";
    const restoreForeignKeys = migration.requiresForeignKeysDisabled === true &&
      database.pragma("foreign_keys", { simple: true }) === 1;
    try {
      migrationPhase = "foreign_keys";
      if (restoreForeignKeys) database.pragma("foreign_keys = OFF");
      migrationPhase = "begin";
      database.exec("BEGIN IMMEDIATE");
      migrationPhase = "registry";
      if (!platformMigrationRegistryExists(database)) createPlatformMigrationRegistry(database);
      for (const [statementIndex, statement] of migration.statements.entries()) {
        migrationPhase = `statement_${statementIndex + 1}`;
        database.exec(statement);
      }
      migrationPhase = "foreign_key_check";
      requirePlatformForeignKeyCheck(database);
      migrationPhase = "schema_digest";
      const postSchemaSha256 = calculatePlatformSchemaDigest(database);
      migrationPhase = "sqlite_version";
      const sqliteVersion = database
        .prepare<[], { sqlite_version: string }>("SELECT sqlite_version() AS sqlite_version")
        .get()?.sqlite_version;
      if (!sqliteVersion) {
        platformFailure("TRADERLINK_MIGRATION_FAILED", {
          migrationId: migration.migrationId,
        });
      }
      database
        .prepare(`INSERT INTO platform_schema_migrations (
  migration_id, module_namespace, execution_order, checksum_sha256,
  post_schema_sha256, applied_at_utc, sqlite_version
) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(
          migration.migrationId,
          migration.moduleNamespace,
          migration.executionOrder,
          calculatePlatformMigrationChecksum(migration),
          postSchemaSha256,
          createCanonicalUtcTimestamp(options.now?.() ?? new Date()),
          sqliteVersion,
      );
      migrationPhase = "commit";
      database.exec("COMMIT");
      if (restoreForeignKeys) database.pragma("foreign_keys = ON");
      appliedMigrationIds.push(migration.migrationId);
    } catch (error) {
      if (database.inTransaction) {
        try {
          database.exec("ROLLBACK");
        } catch {
          // The original migration failure remains authoritative.
        }
      }
      if (restoreForeignKeys) database.pragma("foreign_keys = ON");
      if (
        isTraderLinkPlatformError(error) &&
        error.code === "TRADERLINK_MIGRATION_FAILED"
      ) {
        throw error;
      }
      throw new TraderLinkPlatformError(
        "TRADERLINK_MIGRATION_FAILED",
        { migrationId: migration.migrationId, migrationPhase },
        { cause: error },
      );
    }
  }

  const finalRows = readAppliedPlatformMigrations(database);
  validateAppliedPlatformMigrationPrefix(finalRows, manifest);
  requireOnlyExpectedPlatformTables(
    database,
    expectedPlatformTableNamesForPrefix(finalRows.length),
  );
  const finalRow = finalRows.at(-1);
  if (!finalRow || finalRows.length !== manifest.length) {
    platformFailure("TRADERLINK_PLATFORM_MIGRATIONS_PENDING");
  }
  const finalSchemaSha256 = requirePlatformSchemaDigest(
    database,
    finalRow.post_schema_sha256,
  );
  requirePlatformQuickCheck(database);
  return Object.freeze({
    appliedMigrationIds: Object.freeze(appliedMigrationIds),
    finalSchemaSha256,
  });
}
