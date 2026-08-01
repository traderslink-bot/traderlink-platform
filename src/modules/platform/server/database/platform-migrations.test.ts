import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";

import { openPlatformDatabase } from "./open-platform-database";
import { createAndRestoreVerifyPlatformDatabaseBackup } from "./platform-database-backup";
import { platformMigrationManifest } from "./platform-migration-manifest";
import {
  type PlatformMigration,
  validatePlatformMigrationManifest,
} from "./platform-migration-contract";
import { listPlatformUserTableNames } from "./platform-migration-registry";
import { runPlatformMigrations } from "./run-platform-migrations";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function newPath(name: string): string {
  const root = mkdtempSync(join(tmpdir(), "traderlink-platform-migrations-"));
  roots.push(root);
  return join(root, `${name}.sqlite`);
}

function openInitializer(path: string): Database.Database {
  return openPlatformDatabase({
    mode: "initializer",
    databasePath: path,
    forbiddenRepositoryRoots: [],
  });
}

describe("TraderLink Platform migrations", () => {
  it("creates exactly the registry plus five empty domain tables and two rows", () => {
    const database = openInitializer(newPath("foundation"));
    try {
      const result = runPlatformMigrations(database, {
        now: () => new Date("2026-08-01T12:00:00.000Z"),
      });
      expect(result.appliedMigrationIds).toEqual([
        "0001_platform_identity",
        "0002_journal_account_boundary",
      ]);
      expect(listPlatformUserTableNames(database)).toEqual([
        "journal_account_source_identities",
        "journal_accounts",
        "platform_schema_migrations",
        "platform_users",
        "platform_workspace_memberships",
        "platform_workspaces",
      ]);
      expect(
        database.prepare("SELECT COUNT(*) AS count FROM platform_schema_migrations").get(),
      ).toEqual({ count: 2 });
      for (const table of [
        "platform_users",
        "platform_workspaces",
        "platform_workspace_memberships",
        "journal_accounts",
        "journal_account_source_identities",
      ]) {
        expect(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()).toEqual({
          count: 0,
        });
      }
    } finally {
      database.close();
    }
  });

  it("rolls back registry bootstrap and every migration-one object on failure", () => {
    const database = openInitializer(newPath("rollback"));
    const failing: PlatformMigration = Object.freeze({
      ...platformMigrationManifest[0],
      statements: Object.freeze([
        "CREATE TABLE should_rollback (id TEXT) STRICT",
        "THIS IS NOT SQL",
      ]),
    });
    try {
      expect(() => runPlatformMigrations(database, { manifest: [failing] })).toThrowError(
        "TRADERLINK_MIGRATION_FAILED",
      );
      expect(listPlatformUserTableNames(database)).toEqual([]);
    } finally {
      database.close();
    }
  });

  it("preserves an exact committed prefix and resumes at the next order", () => {
    const database = openInitializer(newPath("resume"));
    const failingSecond: PlatformMigration = Object.freeze({
      ...platformMigrationManifest[1],
      statements: Object.freeze(["CREATE TABLE should_rollback (id TEXT) STRICT", "BAD SQL"]),
    });
    try {
      runPlatformMigrations(database, { manifest: [platformMigrationManifest[0]] });
      expect(() =>
        runPlatformMigrations(database, {
          manifest: [platformMigrationManifest[0], failingSecond],
        }),
      ).toThrowError("TRADERLINK_MIGRATION_FAILED");
      expect(
        database.prepare("SELECT COUNT(*) AS count FROM platform_schema_migrations").get(),
      ).toEqual({ count: 1 });
      expect(listPlatformUserTableNames(database)).not.toContain("should_rollback");
      expect(runPlatformMigrations(database).appliedMigrationIds).toEqual([
        "0002_journal_account_boundary",
      ]);
    } finally {
      database.close();
    }
  });

  it("rejects duplicate global IDs and execution orders before mutation", () => {
    const first = platformMigrationManifest[0];
    expect(() => validatePlatformMigrationManifest([first, first])).toThrowError(
      "TRADERLINK_MIGRATION_ID_CONFLICT",
    );
    expect(() =>
      validatePlatformMigrationManifest([
        first,
        { ...platformMigrationManifest[1], executionOrder: first.executionOrder },
      ]),
    ).toThrowError("TRADERLINK_MIGRATION_ORDER_CONFLICT");
  });

  it("rejects applied migration checksum tampering", () => {
    const database = openInitializer(newPath("checksum-tampering"));
    try {
      runPlatformMigrations(database);
      database
        .prepare(`UPDATE platform_schema_migrations
SET checksum_sha256 = ?
WHERE migration_id = ?`)
        .run("0".repeat(64), "0001_platform_identity");
      expect(() => runPlatformMigrations(database)).toThrowError(
        "TRADERLINK_MIGRATION_CHECKSUM_MISMATCH",
      );
    } finally {
      database.close();
    }
  });

  it("rejects unknown applied migration history", () => {
    const database = openInitializer(newPath("unknown-history"));
    try {
      runPlatformMigrations(database);
      database
        .prepare(`UPDATE platform_schema_migrations
SET migration_id = '9999_unknown_history'
WHERE migration_id = '0002_journal_account_boundary'`)
        .run();
      expect(() => runPlatformMigrations(database)).toThrowError(
        "TRADERLINK_MIGRATION_UNKNOWN_APPLIED",
      );
    } finally {
      database.close();
    }
  });

  it("rejects out-of-order applied migration rows", () => {
    const database = openInitializer(newPath("out-of-order-history"));
    try {
      runPlatformMigrations(database);
      database.transaction(() => {
        database
          .prepare(`UPDATE platform_schema_migrations
SET execution_order = 3
WHERE migration_id = '0001_platform_identity'`)
          .run();
        database
          .prepare(`UPDATE platform_schema_migrations
SET execution_order = 1
WHERE migration_id = '0002_journal_account_boundary'`)
          .run();
        database
          .prepare(`UPDATE platform_schema_migrations
SET execution_order = 2
WHERE migration_id = '0001_platform_identity'`)
          .run();
      })();
      expect(() => runPlatformMigrations(database)).toThrowError(
        "TRADERLINK_MIGRATION_ORDER_CONFLICT",
      );
    } finally {
      database.close();
    }
  });

  it("records exact online-backup, restore, file, pragma, and recovery evidence", async () => {
    const sourcePath = newPath("backup-source");
    const backupPath = newPath("backup-target");
    const restorePath = newPath("restore-target");
    const database = openInitializer(sourcePath);
    runPlatformMigrations(database, {
      now: () => new Date("2026-08-01T12:00:00.000Z"),
    });
    database.close();

    const evidence = await createAndRestoreVerifyPlatformDatabaseBackup({
      sourcePath,
      backupPath,
      restoreVerificationPath: restorePath,
      forbiddenRepositoryRoots: [],
      now: () => new Date("2026-08-01T13:00:00.000Z"),
    });

    expect(evidence.source.migrationRows).toEqual(evidence.backup.migrationRows);
    expect(evidence.backup.migrationRows).toEqual(evidence.restored.migrationRows);
    expect(evidence.source.tableCounts).toEqual(evidence.backup.tableCounts);
    expect(evidence.backup.tableCounts).toEqual(evidence.restored.tableCounts);
    expect(Object.keys(evidence.source.tableCounts)).toHaveLength(6);
    expect(evidence.source.pragmas).toEqual({
      foreignKeys: 1,
      busyTimeout: 5000,
      journalMode: "wal",
      synchronous: 1,
    });
    expect(evidence.source.sqliteVersion).toBeTruthy();
    expect(evidence.source.capturedAtUtc).toBe("2026-08-01T13:00:00.000Z");
    expect(evidence.source.lastModifiedAtUtc).toMatch(/Z$/u);
    expect(evidence.source.fileSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(evidence.backup.fileSha256).toBe(evidence.restored.fileSha256);
    expect(evidence.backup.fileSizeBytes).toBe(evidence.restored.fileSizeBytes);
    expect(evidence.exactRegistryMatch).toBe(true);
    expect(evidence.exactTableCountsMatch).toBe(true);
    expect(evidence.pageGeometryMatch).toBe(true);
    expect(evidence.backupRestoreFileIdentityMatch).toBe(true);
    expect(evidence.recoveryAuthority).toEqual({
      status: "not_required",
      requirements: {
        hmacKeyVersions: [],
        sourceAccountCanonicalizationVersions: [],
      },
    });
    expect(evidence.destructiveMigrationBoundary).toBe(
      "orchestrator_accepted_checkpoint_required",
    );
  });

  it("requires exact non-secret HMAC and canonicalizer recovery authority", async () => {
    const sourcePath = newPath("recovery-source");
    const database = openInitializer(sourcePath);
    runPlatformMigrations(database);
    const timestamp = "2026-08-01T12:00:00.000Z";
    const userId = "00000000-0000-4000-8000-000000000001";
    const workspaceId = "00000000-0000-4000-8000-000000000002";
    const accountId = "00000000-0000-4000-8000-000000000003";
    database
      .prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'test', 'owner', 'Owner', 'active', ?, ?)`)
      .run(userId, timestamp, timestamp);
    database
      .prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status,
  created_at_utc, updated_at_utc
) VALUES (?, 'Workspace', 'America/Toronto', 'active', ?, ?)`)
      .run(workspaceId, timestamp, timestamp);
    database
      .prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Journal', 'USD', 'America/Toronto', 'active', ?, ?, ?)`)
      .run(accountId, workspaceId, userId, timestamp, timestamp);
    database
      .prepare(`INSERT INTO journal_account_source_identities (
  source_identity_id, workspace_id, account_id, source_system,
  fingerprint_scheme_version, source_account_canonicalization_version,
  hmac_key_version, source_account_fingerprint, privacy_safe_display,
  status, first_seen_at_utc, last_seen_at_utc
) VALUES (
  '00000000-0000-4000-8000-000000000004', ?, ?, 'ibkr',
  'hmac-sha256-v1', 'ibkr-source-account-v1', 'key-v1', ?,
  '[redacted-account]', 'active_current', ?, ?
)`)
      .run(workspaceId, accountId, "0".repeat(64), timestamp, timestamp);
    database.close();

    await expect(
      createAndRestoreVerifyPlatformDatabaseBackup({
        sourcePath,
        backupPath: newPath("missing-authority-backup"),
        restoreVerificationPath: newPath("missing-authority-restore"),
        forbiddenRepositoryRoots: [],
      }),
    ).rejects.toThrowError("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");

    const evidence = await createAndRestoreVerifyPlatformDatabaseBackup({
      sourcePath,
      backupPath: newPath("authority-backup"),
      restoreVerificationPath: newPath("authority-restore"),
      forbiddenRepositoryRoots: [],
      verifyRecoveryAuthority: (requirements) => ({
        verified: true,
        hmacKeyVersions: requirements.hmacKeyVersions,
        sourceAccountCanonicalizationVersions:
          requirements.sourceAccountCanonicalizationVersions,
      }),
    });
    expect(evidence.recoveryAuthority).toEqual({
      status: "verified",
      requirements: {
        hmacKeyVersions: ["key-v1"],
        sourceAccountCanonicalizationVersions: ["ibkr-source-account-v1"],
      },
    });
  });
});
