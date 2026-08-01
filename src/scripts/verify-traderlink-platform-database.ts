import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

import {
  resolvePlatformDatabaseConfig,
  validatePlatformDatabasePath,
} from "@/src/modules/platform/server/database/platform-database-config";
import {
  expectedPlatformDomainTableNamesForPrefix,
  expectedPlatformTableNamesForPrefix,
  platformMigrationManifest,
} from "@/src/modules/platform/server/database/platform-migration-manifest";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  listPlatformUserTableNames,
  readAppliedPlatformMigrations,
  requirePlatformForeignKeyCheck,
  requirePlatformQuickCheck,
} from "@/src/modules/platform/server/database/platform-migration-registry";
import { calculatePlatformSchemaDigest } from "@/src/modules/platform/server/database/platform-schema-digest";
import {
  readSinglePlatformDatabasePragmaValue,
  verifyPlatformDatabaseConnectionPragmas,
} from "@/src/modules/platform/server/database/open-platform-database";
import { verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";

export type PlatformDatabaseVerificationEvidence = Readonly<{
  status: "verified_current_database" | "verified_manifest_prefix";
  verificationProfile: Readonly<{
    kind: "current" | "manifest_prefix";
    migrationCount: number;
    domainTablesExpectedEmpty: boolean;
  }>;
  databasePath: string;
  sqliteVersion: string;
  migrationRows: readonly Readonly<{
    migrationId: string;
    executionOrder: number;
    checksumSha256: string;
    postSchemaSha256: string;
  }>[];
  expectedPostSchemaSha256: string;
  actualSchemaSha256: string;
  schemaDigestMatch: true;
  tableCounts: Readonly<Record<string, number>>;
  pragmas: Readonly<{
    foreignKeys: number;
    busyTimeout: number;
    journalMode: string;
    synchronous: number;
  }>;
  integrity: Readonly<{
    foreignKeyCheck: "ok";
    quickCheck: "ok";
    integrityCheck: "ok";
  }>;
  pageSize: number;
  pageCount: number;
  fileSizeBytes: number;
  fileSha256: string;
  sidecars: Readonly<{ wal: boolean; shm: boolean }>;
}>;

function requireIntegrityCheck(database: Database.Database): void {
  const rows = database.pragma("integrity_check") as readonly Record<string, unknown>[];
  if (rows.length !== 1 || Object.values(rows[0] ?? {})[0] !== "ok") {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      check: "integrity_check",
    });
  }
}

export function verifyTraderLinkPlatformDatabase(
  options: Readonly<{
    environment?: NodeJS.ProcessEnv;
    databasePath?: string;
    profile?:
      | Readonly<{ kind: "current"; expectDomainTablesEmpty?: boolean }>
      | Readonly<{
          kind: "manifest_prefix";
          migrationCount: number;
          expectDomainTablesEmpty?: boolean;
        }>;
    forbiddenRepositoryRoots?: readonly string[];
  }> = {},
): PlatformDatabaseVerificationEvidence {
  const profile = options.profile ?? Object.freeze({ kind: "current" as const });
  const migrationCount =
    profile.kind === "current"
      ? platformMigrationManifest.length
      : profile.migrationCount;
  if (
    !Number.isSafeInteger(migrationCount) ||
    migrationCount < 1 ||
    migrationCount > platformMigrationManifest.length
  ) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "migrationCount",
    });
  }
  const verificationManifest = platformMigrationManifest.slice(0, migrationCount);
  const expectedTableNames = expectedPlatformTableNamesForPrefix(migrationCount);
  const expectedDomainTableNames =
    expectedPlatformDomainTableNamesForPrefix(migrationCount);
  const expectDomainTablesEmpty = profile.expectDomainTablesEmpty === true;
  const databasePath = options.databasePath
    ? validatePlatformDatabasePath(options.databasePath, options)
    : resolvePlatformDatabaseConfig({
        environment: options.environment,
        forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
      }).databasePath;
  if (!existsSync(databasePath)) platformFailure("TRADERLINK_PLATFORM_DATABASE_MISSING");
  let evidenceWithoutFile: Omit<
    PlatformDatabaseVerificationEvidence,
    "fileSizeBytes" | "fileSha256" | "sidecars"
  >;
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");
    verifyCompletedPlatformDatabase(database, verificationManifest);
    const pragmas = verifyPlatformDatabaseConnectionPragmas(database);
    requirePlatformForeignKeyCheck(database);
    requirePlatformQuickCheck(database);
    requireIntegrityCheck(database);
    const tableNames = listPlatformUserTableNames(database);
    if (
      tableNames.length !== expectedTableNames.size ||
      tableNames.some((tableName) => !expectedTableNames.has(tableName))
    ) {
      platformFailure("TRADERLINK_PLATFORM_UNMANAGED_SCHEMA");
    }
    const tableCounts = Object.fromEntries(
      expectedDomainTableNames.map((tableName) => {
        const row = database
          .prepare<[], { count: number }>(`SELECT COUNT(*) AS count FROM ${tableName}`)
          .get();
        return [tableName, row?.count ?? -1];
      }),
    );
    const migrations = readAppliedPlatformMigrations(database);
    if (migrations.length !== migrationCount) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "migration_manifest_alignment",
      });
    }
    if (
      expectDomainTablesEmpty &&
      Object.values(tableCounts).some((count) => count !== 0)
    ) {
      platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
        check: "empty_foundation",
      });
    }
    const expectedPostSchemaSha256 = migrations.at(-1)?.post_schema_sha256;
    const actualSchemaSha256 = calculatePlatformSchemaDigest(database);
    if (!expectedPostSchemaSha256 || expectedPostSchemaSha256 !== actualSchemaSha256) {
      platformFailure("TRADERLINK_PLATFORM_SCHEMA_MISMATCH");
    }
    const sqliteVersion = database
      .prepare<[], { sqlite_version: string }>("SELECT sqlite_version() AS sqlite_version")
      .get()?.sqlite_version;
    if (!sqliteVersion) platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED");
    evidenceWithoutFile = Object.freeze({
      status:
        profile.kind === "current"
          ? "verified_current_database"
          : "verified_manifest_prefix",
      verificationProfile: Object.freeze({
        kind: profile.kind,
        migrationCount,
        domainTablesExpectedEmpty: expectDomainTablesEmpty,
      }),
      databasePath,
      sqliteVersion,
      migrationRows: Object.freeze(
        migrations.map((migration) =>
          Object.freeze({
            migrationId: migration.migration_id,
            executionOrder: migration.execution_order,
            checksumSha256: migration.checksum_sha256,
            postSchemaSha256: migration.post_schema_sha256,
          }),
        ),
      ),
      expectedPostSchemaSha256,
      actualSchemaSha256,
      schemaDigestMatch: true,
      tableCounts: Object.freeze(tableCounts),
      pragmas,
      integrity: Object.freeze({
        foreignKeyCheck: "ok",
        quickCheck: "ok",
        integrityCheck: "ok",
      }),
      pageSize: Number(
        readSinglePlatformDatabasePragmaValue(database, "page_size"),
      ),
      pageCount: Number(
        readSinglePlatformDatabasePragmaValue(database, "page_count"),
      ),
    });
  } finally {
    database.close();
  }
  return Object.freeze({
    ...evidenceWithoutFile,
    fileSizeBytes: statSync(databasePath).size,
    fileSha256: createHash("sha256").update(readFileSync(databasePath)).digest("hex"),
    sidecars: Object.freeze({
      wal: existsSync(`${databasePath}-wal`),
      shm: existsSync(`${databasePath}-shm`),
    }),
  });
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;
  return resolve(invokedPath).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
}

if (isDirectExecution()) {
  const argument = process.argv[2];
  const profile =
    argument === "--verify-current"
      ? Object.freeze({ kind: "current" as const })
      : argument === "--expect-current-empty"
        ? Object.freeze({ kind: "current" as const, expectDomainTablesEmpty: true })
        : argument === "--expect-empty-foundation"
          ? Object.freeze({
              kind: "manifest_prefix" as const,
              migrationCount: 2,
              expectDomainTablesEmpty: true,
            })
          : null;
  if (process.argv.length !== 3 || !profile) {
    console.error(JSON.stringify({ code: "TRADERLINK_VERIFIER_ARGUMENT_INVALID" }));
    process.exitCode = 1;
  } else {
    try {
      console.info(
        JSON.stringify(
          verifyTraderLinkPlatformDatabase({ profile }),
          null,
          2,
        ),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          code: isTraderLinkPlatformError(error)
            ? error.code
            : "TRADERLINK_PLATFORM_DATABASE_VERIFICATION_FAILED",
        }),
      );
      process.exitCode = 1;
    }
  }
}
