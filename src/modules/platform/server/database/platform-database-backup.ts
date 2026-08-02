import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";

import { validatePlatformDatabasePath } from "./platform-database-config";
import {
  createCanonicalUtcTimestamp,
  isTraderLinkPlatformError,
  platformFailure,
  type PlatformMigration,
} from "./platform-migration-contract";
import {
  listPlatformUserTableNames,
  readAppliedPlatformMigrations,
  requirePlatformForeignKeyCheck,
  requirePlatformQuickCheck,
} from "./platform-migration-registry";
import {
  readPlatformDatabasePragmaEvidence,
  verifyPlatformDatabaseConnectionPragmas,
} from "./open-platform-database";
import { calculatePlatformSchemaDigest } from "./platform-schema-digest";
import { verifyCompletedPlatformDatabase } from "./run-platform-migrations";

export type PlatformDatabaseRecoveryRequirements = Readonly<{
  hmacKeyVersions: readonly string[];
  sourceAccountCanonicalizationVersions: readonly string[];
}>;

export type PlatformDatabaseSnapshotEvidence = Readonly<{
  path: string;
  capturedAtUtc: string;
  lastModifiedAtUtc: string;
  sqliteVersion: string;
  migrationRows: ReturnType<typeof readAppliedPlatformMigrations>;
  expectedPostSchemaSha256: string;
  actualSchemaSha256: string;
  schemaDigestMatch: true;
  tableCounts: Readonly<Record<string, number>>;
  pragmas: ReturnType<typeof readPlatformDatabasePragmaEvidence>;
  integrity: Readonly<{
    foreignKeyCheck: "ok";
    quickCheck: "ok";
  }>;
  pageSize: number;
  pageCount: number;
  fileSizeBytes: number;
  fileSha256: string;
  sidecars: Readonly<{
    wal: Readonly<{ exists: boolean; sizeBytes: number }>;
    shm: Readonly<{ exists: boolean; sizeBytes: number }>;
  }>;
}>;

export type PlatformDatabaseBackupEvidence = Readonly<{
  startedAtUtc: string;
  completedAtUtc: string;
  source: PlatformDatabaseSnapshotEvidence;
  backup: PlatformDatabaseSnapshotEvidence;
  restored: PlatformDatabaseSnapshotEvidence;
  exactRegistryMatch: true;
  exactTableCountsMatch: true;
  pageGeometryMatch: true;
  backupRestoreFileIdentityMatch: true;
  recoveryAuthority: Readonly<{
    status: "not_required" | "verified";
    requirements: PlatformDatabaseRecoveryRequirements;
  }>;
  destructiveMigrationBoundary: "orchestrator_accepted_checkpoint_required";
}>;

type RecoveryAuthorityResult = Readonly<{
  verified: true;
  hmacKeyVersions: readonly string[];
  sourceAccountCanonicalizationVersions: readonly string[];
}>;

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sidecarEvidence(path: string): Readonly<{ exists: boolean; sizeBytes: number }> {
  return existsSync(path)
    ? Object.freeze({ exists: true, sizeBytes: statSync(path).size })
    : Object.freeze({ exists: false, sizeBytes: 0 });
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function readTableCounts(
  database: Database.Database,
): Readonly<Record<string, number>> {
  return Object.freeze(
    Object.fromEntries(
      listPlatformUserTableNames(database).map((tableName) => {
        const row = database
          .prepare<[], { count: number }>(
            `SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`,
          )
          .get();
        return [tableName, row?.count ?? -1];
      }),
    ),
  );
}

function singlePragma(database: Database.Database, pragma: string): number {
  const rows = database.pragma(pragma) as readonly Record<string, unknown>[];
  return Number(rows.length === 1 ? Object.values(rows[0] ?? {})[0] : NaN);
}

function readSnapshotEvidence(
  database: Database.Database,
  path: string,
  now: () => Date,
  verificationManifest?: readonly PlatformMigration[],
): PlatformDatabaseSnapshotEvidence {
  verifyCompletedPlatformDatabase(database, verificationManifest);
  const pragmas = verifyPlatformDatabaseConnectionPragmas(database);
  requirePlatformForeignKeyCheck(database);
  requirePlatformQuickCheck(database);
  const migrationRows = Object.freeze(
    readAppliedPlatformMigrations(database).map((row) => Object.freeze({ ...row })),
  );
  const expectedPostSchemaSha256 = migrationRows.at(-1)?.post_schema_sha256;
  const actualSchemaSha256 = calculatePlatformSchemaDigest(database);
  if (!expectedPostSchemaSha256 || expectedPostSchemaSha256 !== actualSchemaSha256) {
    platformFailure("TRADERLINK_BACKUP_VERIFICATION_FAILED");
  }
  const sqliteVersion = database
    .prepare<[], { sqlite_version: string }>("SELECT sqlite_version() AS sqlite_version")
    .get()?.sqlite_version;
  if (!sqliteVersion) platformFailure("TRADERLINK_BACKUP_VERIFICATION_FAILED");
  const file = statSync(path);
  return Object.freeze({
    path,
    capturedAtUtc: createCanonicalUtcTimestamp(now()),
    lastModifiedAtUtc: file.mtime.toISOString(),
    sqliteVersion,
    migrationRows,
    expectedPostSchemaSha256,
    actualSchemaSha256,
    schemaDigestMatch: true,
    tableCounts: readTableCounts(database),
    pragmas,
    integrity: Object.freeze({ foreignKeyCheck: "ok", quickCheck: "ok" }),
    pageSize: singlePragma(database, "page_size"),
    pageCount: singlePragma(database, "page_count"),
    fileSizeBytes: file.size,
    fileSha256: sha256File(path),
    sidecars: Object.freeze({
      wal: sidecarEvidence(`${path}-wal`),
      shm: sidecarEvidence(`${path}-shm`),
    }),
  });
}

function readRecoveryRequirements(
  database: Database.Database,
): PlatformDatabaseRecoveryRequirements {
  const rows = database
    .prepare<
      [],
      { hmac_key_version: string; source_account_canonicalization_version: string }
    >(`SELECT hmac_key_version, source_account_canonicalization_version
FROM journal_account_source_identities
WHERE status IN ('active_current', 'retained_previous')
ORDER BY hmac_key_version COLLATE BINARY,
  source_account_canonicalization_version COLLATE BINARY`)
    .all();
  return Object.freeze({
    hmacKeyVersions: Object.freeze(
      [...new Set(rows.map((row) => row.hmac_key_version))].sort(),
    ),
    sourceAccountCanonicalizationVersions: Object.freeze(
      [
        ...new Set(
          rows.map((row) => row.source_account_canonicalization_version),
        ),
      ].sort(),
    ),
  });
}

function sameEvidence(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function verifyRecoveryAuthority(
  requirements: PlatformDatabaseRecoveryRequirements,
  verifier:
    | ((
        requirements: PlatformDatabaseRecoveryRequirements,
      ) => RecoveryAuthorityResult | Promise<RecoveryAuthorityResult>)
    | undefined,
): Promise<"not_required" | "verified"> {
  const required =
    requirements.hmacKeyVersions.length > 0 ||
    requirements.sourceAccountCanonicalizationVersions.length > 0;
  if (!required) return "not_required";
  if (!verifier) platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  const result = await verifier(requirements);
  if (
    result.verified !== true ||
    !sameEvidence([...result.hmacKeyVersions].sort(), requirements.hmacKeyVersions) ||
    !sameEvidence(
      [...result.sourceAccountCanonicalizationVersions].sort(),
      requirements.sourceAccountCanonicalizationVersions,
    )
  ) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  return "verified";
}

function validateNewBackupTarget(
  path: string,
  forbiddenRepositoryRoots: readonly string[] | undefined,
): string {
  const validated = validatePlatformDatabasePath(path, { forbiddenRepositoryRoots });
  if (existsSync(validated)) platformFailure("TRADERLINK_BACKUP_TARGET_EXISTS");
  return validated;
}

/**
 * Produces database and recovery-authority evidence only. The later destructive-
 * migration orchestrator remains responsible for no-write maintenance state,
 * checkpoint acceptance, environment switching, and starting the migration.
 */
export async function createAndRestoreVerifyPlatformDatabaseBackup(
  options: Readonly<{
    sourcePath: string;
    backupPath: string;
    restoreVerificationPath: string;
    forbiddenRepositoryRoots?: readonly string[];
    now?: () => Date;
    verifyRecoveryAuthority?: (
      requirements: PlatformDatabaseRecoveryRequirements,
    ) => RecoveryAuthorityResult | Promise<RecoveryAuthorityResult>;
    verificationManifest?: readonly PlatformMigration[];
  }>,
): Promise<PlatformDatabaseBackupEvidence> {
  const now = options.now ?? (() => new Date());
  const sourcePath = validatePlatformDatabasePath(options.sourcePath, options);
  const backupPath = validateNewBackupTarget(
    options.backupPath,
    options.forbiddenRepositoryRoots,
  );
  const restoreVerificationPath = validateNewBackupTarget(
    options.restoreVerificationPath,
    options.forbiddenRepositoryRoots,
  );
  if (
    new Set(
      [sourcePath, backupPath, restoreVerificationPath].map((path) =>
        resolve(path).toLowerCase(),
      ),
    ).size !== 3
  ) {
    platformFailure("TRADERLINK_BACKUP_PATH_INVALID");
  }

  const startedAtUtc = createCanonicalUtcTimestamp(now());
  let source: Database.Database | null = null;
  let backup: Database.Database | null = null;
  let restored: Database.Database | null = null;
  try {
    source = new Database(sourcePath, { readonly: true, fileMustExist: true });
    source.pragma("foreign_keys = ON");
    source.pragma("busy_timeout = 5000");
    verifyCompletedPlatformDatabase(source, options.verificationManifest);
    verifyPlatformDatabaseConnectionPragmas(source);
    const recoveryRequirements = readRecoveryRequirements(source);
    const recoveryStatus = await verifyRecoveryAuthority(
      recoveryRequirements,
      options.verifyRecoveryAuthority,
    );

    mkdirSync(dirname(backupPath), { recursive: true });
    mkdirSync(dirname(restoreVerificationPath), { recursive: true });
    const sourceEvidence = readSnapshotEvidence(
      source,
      sourcePath,
      now,
      options.verificationManifest,
    );
    await source.backup(backupPath);

    backup = new Database(backupPath, { readonly: true, fileMustExist: true });
    backup.pragma("foreign_keys = ON");
    backup.pragma("busy_timeout = 5000");
    const backupEvidence = readSnapshotEvidence(
      backup,
      backupPath,
      now,
      options.verificationManifest,
    );
    await backup.backup(restoreVerificationPath);

    restored = new Database(restoreVerificationPath, {
      readonly: true,
      fileMustExist: true,
    });
    restored.pragma("foreign_keys = ON");
    restored.pragma("busy_timeout = 5000");
    const restoredEvidence = readSnapshotEvidence(
      restored,
      restoreVerificationPath,
      now,
      options.verificationManifest,
    );

    const exactRegistryMatch =
      sameEvidence(sourceEvidence.migrationRows, backupEvidence.migrationRows) &&
      sameEvidence(backupEvidence.migrationRows, restoredEvidence.migrationRows);
    const exactTableCountsMatch =
      sameEvidence(sourceEvidence.tableCounts, backupEvidence.tableCounts) &&
      sameEvidence(backupEvidence.tableCounts, restoredEvidence.tableCounts);
    const pageGeometryMatch =
      sourceEvidence.pageSize === backupEvidence.pageSize &&
      backupEvidence.pageSize === restoredEvidence.pageSize &&
      sourceEvidence.pageCount === backupEvidence.pageCount &&
      backupEvidence.pageCount === restoredEvidence.pageCount;
    const schemaDigestMatch =
      sourceEvidence.actualSchemaSha256 === backupEvidence.actualSchemaSha256 &&
      backupEvidence.actualSchemaSha256 === restoredEvidence.actualSchemaSha256;
    const backupRestoreFileIdentityMatch =
      backupEvidence.fileSizeBytes === restoredEvidence.fileSizeBytes &&
      backupEvidence.fileSha256 === restoredEvidence.fileSha256;
    if (
      !exactRegistryMatch ||
      !exactTableCountsMatch ||
      !pageGeometryMatch ||
      !schemaDigestMatch ||
      !backupRestoreFileIdentityMatch
    ) {
      platformFailure("TRADERLINK_BACKUP_VERIFICATION_FAILED");
    }

    return Object.freeze({
      startedAtUtc,
      completedAtUtc: createCanonicalUtcTimestamp(now()),
      source: sourceEvidence,
      backup: backupEvidence,
      restored: restoredEvidence,
      exactRegistryMatch: true,
      exactTableCountsMatch: true,
      pageGeometryMatch: true,
      backupRestoreFileIdentityMatch: true,
      recoveryAuthority: Object.freeze({
        status: recoveryStatus,
        requirements: recoveryRequirements,
      }),
      destructiveMigrationBoundary:
        "orchestrator_accepted_checkpoint_required",
    });
  } catch (error) {
    if (isTraderLinkPlatformError(error)) throw error;
    return platformFailure("TRADERLINK_BACKUP_VERIFICATION_FAILED", {}, error);
  } finally {
    restored?.close();
    backup?.close();
    source?.close();
  }
}
