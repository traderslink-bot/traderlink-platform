import { createHash, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type Database from "better-sqlite3";

import type { PlatformDatabaseBackupEvidence } from "../database/platform-database-backup";
import { platformMigrationManifest } from "../database/platform-migration-manifest";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  isLowercaseSha256,
  platformFailure,
} from "../database/platform-migration-contract";
import { withPlatformDatabase } from "../database/open-platform-database";
import { withReadonlyPlatformDatabase } from "../database/open-readonly-platform-database";
import { readAppliedPlatformMigrations } from "../database/platform-migration-registry";
import { calculatePlatformSchemaDigest } from "../database/platform-schema-digest";
import { PlatformAdminAuditRepository } from "./platform-admin-audit-repository";
import { PlatformOperatorRepository } from "./platform-operator-repository";

export type PlatformOperatorOperation = "grant" | "recover" | "revoke";

const PREVIEW_VERSION = "journal-admin-operator-v1";
const MAXIMUM_BACKUP_AGE_MS = 15 * 60 * 1_000;
const CONFIRMATIONS: Readonly<Record<PlatformOperatorOperation, string>> =
  Object.freeze({
    grant: "GRANT JOURNAL OWNER ADMIN",
    recover: "RECOVER JOURNAL OWNER ADMIN",
    revoke: "REVOKE JOURNAL OWNER ADMIN",
  });

type UserRow = Readonly<{ status: "active" | "disabled" }>;
type CountRow = Readonly<{ count: number }>;
type PrivateFacts = Readonly<{
  operation: PlatformOperatorOperation;
  targetUserId: string;
  targetUserStatus: "active" | "disabled";
  targetDiscordIdentityCount: number;
  activeGrantId: string | null;
  activeGrantUserId: string | null;
  databaseFileSha256: string;
  schemaSha256: string;
  migrationCount: number;
  finalMigrationId: string;
}>;

export type PlatformOperatorPreview = Readonly<{
  status: "ready";
  operation: PlatformOperatorOperation;
  previewDigest: string;
  databaseFileSha256: string;
  schemaSha256: string;
  migrationCount: number;
  activeGrantPresent: boolean;
  activeGrantMatchesTarget: boolean;
  targetDiscordIdentityCount: number;
  confirmationText: string;
}>;

export type PlatformOperatorResult = Readonly<{
  status: "completed";
  operation: PlatformOperatorOperation;
  previewDigest: string;
  completedAtUtc: string;
  activeGrantPresent: boolean;
  backupFileSha256: string;
  restoreFileSha256: string;
}>;

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function fileSha256(path: string): string {
  return sha256(readFileSync(path));
}

function sameDigest(left: string, right: string): boolean {
  return isLowercaseSha256(left) && isLowercaseSha256(right) &&
    timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function digestFacts(facts: PrivateFacts): string {
  return sha256(`${JSON.stringify([
    PREVIEW_VERSION,
    facts.operation,
    facts.targetUserId,
    facts.targetUserStatus,
    facts.targetDiscordIdentityCount,
    facts.activeGrantId,
    facts.activeGrantUserId,
    facts.databaseFileSha256,
    facts.schemaSha256,
    facts.migrationCount,
    facts.finalMigrationId,
  ])}\n`);
}

function readFacts(
  database: Database.Database,
  databasePath: string,
  operation: PlatformOperatorOperation,
  targetUserId: string,
): PrivateFacts {
  const user = database.prepare<[string], UserRow>(
    "SELECT status FROM platform_users WHERE user_id = ?",
  ).get(targetUserId);
  if (!user) platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
  const targetDiscordIdentityCount = database.prepare<[string], CountRow>(`SELECT
  COUNT(*) AS count FROM platform_auth_identities
WHERE user_id = ? AND auth_provider = 'discord' AND status = 'active'`)
    .get(targetUserId)?.count ?? -1;
  const active = new PlatformOperatorRepository(database).findActive();
  if (
    (operation === "grant" && active !== null) ||
    (operation !== "grant" && active === null) ||
    (operation === "revoke" && active?.userId !== targetUserId) ||
    (operation !== "revoke" &&
      (user.status !== "active" || targetDiscordIdentityCount !== 1))
  ) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
  }
  const migrations = readAppliedPlatformMigrations(database);
  const finalMigrationId = platformMigrationManifest.at(-1)?.migrationId;
  if (
    !finalMigrationId ||
    migrations.length !== platformMigrationManifest.length ||
    migrations.at(-1)?.migration_id !== finalMigrationId
  ) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
  }
  return Object.freeze({
    operation,
    targetUserId,
    targetUserStatus: user.status,
    targetDiscordIdentityCount,
    activeGrantId: active?.operatorGrantId ?? null,
    activeGrantUserId: active?.userId ?? null,
    databaseFileSha256: fileSha256(databasePath),
    schemaSha256: calculatePlatformSchemaDigest(database),
    migrationCount: migrations.length,
    finalMigrationId,
  });
}

function publicPreview(facts: PrivateFacts): PlatformOperatorPreview {
  return Object.freeze({
    status: "ready",
    operation: facts.operation,
    previewDigest: digestFacts(facts),
    databaseFileSha256: facts.databaseFileSha256,
    schemaSha256: facts.schemaSha256,
    migrationCount: facts.migrationCount,
    activeGrantPresent: facts.activeGrantId !== null,
    activeGrantMatchesTarget: facts.activeGrantUserId === facts.targetUserId,
    targetDiscordIdentityCount: facts.targetDiscordIdentityCount,
    confirmationText: CONFIRMATIONS[facts.operation],
  });
}

export function previewPlatformOperatorChange(options: Readonly<{
  databasePath: string;
  operation: PlatformOperatorOperation;
  targetUserId: string;
  forbiddenRepositoryRoots?: readonly string[];
}>): PlatformOperatorPreview {
  return withReadonlyPlatformDatabase(options, (database) => publicPreview(
    readFacts(database, options.databasePath, options.operation, options.targetUserId),
  ));
}

function requireBackup(
  preview: PlatformOperatorPreview,
  evidence: PlatformDatabaseBackupEvidence,
  databasePath: string,
  now: Date,
  maximumAgeMs: number,
): void {
  const completed = Date.parse(evidence.completedAtUtc);
  const age = now.getTime() - completed;
  if (
    !Number.isSafeInteger(maximumAgeMs) || maximumAgeMs <= 0 ||
    !Number.isFinite(completed) || age < -60_000 || age > maximumAgeMs ||
    resolve(evidence.source.path).toLowerCase() !== resolve(databasePath).toLowerCase() ||
    evidence.source.fileSha256 !== preview.databaseFileSha256 ||
    evidence.source.actualSchemaSha256 !== preview.schemaSha256 ||
    evidence.source.migrationRows.length !== preview.migrationCount ||
    evidence.source.sidecars.wal.sizeBytes !== 0 ||
    evidence.exactRegistryMatch !== true ||
    evidence.exactTableCountsMatch !== true ||
    evidence.pageGeometryMatch !== true ||
    evidence.backupRestoreFileIdentityMatch !== true ||
    evidence.backup.fileSha256 !== evidence.restored.fileSha256
  ) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
}

export function executePlatformOperatorChange(options: Readonly<{
  databasePath: string;
  operation: PlatformOperatorOperation;
  targetUserId: string;
  expectedPreviewDigest: string;
  confirmationText: string;
  backupEvidence: PlatformDatabaseBackupEvidence;
  forbiddenRepositoryRoots?: readonly string[];
  now?: () => Date;
  maximumBackupAgeMs?: number;
}>): PlatformOperatorResult {
  const preview = previewPlatformOperatorChange(options);
  if (
    options.confirmationText !== CONFIRMATIONS[options.operation] ||
    !sameDigest(options.expectedPreviewDigest, preview.previewDigest)
  ) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  const now = options.now?.() ?? new Date();
  requireBackup(
    preview,
    options.backupEvidence,
    options.databasePath,
    now,
    options.maximumBackupAgeMs ?? MAXIMUM_BACKUP_AGE_MS,
  );
  const completedAtUtc = createCanonicalUtcTimestamp(now);
  withPlatformDatabase({
    mode: "runtime",
    databasePath: options.databasePath,
    forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
  }, (database) => database.transaction(() => {
    const lockedFacts = readFacts(
      database,
      options.databasePath,
      options.operation,
      options.targetUserId,
    );
    if (!sameDigest(digestFacts(lockedFacts), options.expectedPreviewDigest)) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    }
    const operators = new PlatformOperatorRepository(database);
    const active = operators.findActive();
    const receiptSha256 = sha256(`${JSON.stringify([
      PREVIEW_VERSION,
      options.expectedPreviewDigest,
      options.backupEvidence.backup.fileSha256,
      completedAtUtc,
    ])}\n`);
    if (options.operation === "revoke") {
      operators.revoke({
        operatorGrantId: active!.operatorGrantId,
        revokedByKind: "bootstrap_console",
        revokedByUserId: null,
        reasonCode: "offline_operator_revoke",
        revokedAtUtc: completedAtUtc,
      });
    } else {
      if (options.operation === "recover") {
        operators.revoke({
          operatorGrantId: active!.operatorGrantId,
          revokedByKind: "bootstrap_console",
          revokedByUserId: null,
          reasonCode: "offline_operator_recovery",
          revokedAtUtc: completedAtUtc,
        });
      }
      operators.insert({
        operatorGrantId: createCanonicalUuidV4(),
        userId: options.targetUserId,
        grantedByKind: "bootstrap_console",
        grantedByUserId: null,
        grantReceiptSha256: receiptSha256,
        recoveryOfGrantId: options.operation === "recover"
          ? active!.operatorGrantId
          : null,
        grantedAtUtc: completedAtUtc,
      });
    }
    new PlatformAdminAuditRepository(database).append({
      actorKind: "bootstrap_console",
      actorUserId: null,
      actorRole: "bootstrap_console",
      action: options.operation === "grant"
        ? "operator_granted"
        : options.operation === "recover"
          ? "operator_recovered"
          : "operator_revoked",
      targetKind: "authority",
      targetRefSha256: sha256("journal_administration"),
      outcome: "success",
      reasonCode: `offline_operator_${options.operation}`,
      correlationRefSha256: sha256(
        `journal-admin-operator-correlation-v1\u001f${options.expectedPreviewDigest}`,
      ),
      previewReceiptSha256: options.expectedPreviewDigest,
      details: Object.freeze({ operation: options.operation }),
      createdAtUtc: completedAtUtc,
    });
  }).immediate());
  return Object.freeze({
    status: "completed",
    operation: options.operation,
    previewDigest: options.expectedPreviewDigest,
    completedAtUtc,
    activeGrantPresent: options.operation !== "revoke",
    backupFileSha256: options.backupEvidence.backup.fileSha256,
    restoreFileSha256: options.backupEvidence.restored.fileSha256,
  });
}
