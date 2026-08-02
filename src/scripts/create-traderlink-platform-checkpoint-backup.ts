import { readFileSync } from "node:fs";

import { IBKR_SOURCE_ACCOUNT_CANONICALIZERS } from "@/src/modules/journal/server/accounts/ibkr-source-account-canonicalizer";
import { createAndRestoreVerifyPlatformDatabaseBackup } from "@/src/modules/platform/server/database/platform-database-backup";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

type AuthoritySection = Readonly<{
  activeKeyVersion: string;
  keysBase64: Readonly<Record<string, string>>;
}>;

function authoritySection(value: unknown): AuthoritySection {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  const record = value as Record<string, unknown>;
  const activeKeyVersion = record.activeKeyVersion;
  const keysBase64 = record.keysBase64;
  if (
    typeof activeKeyVersion !== "string" ||
    !keysBase64 ||
    typeof keysBase64 !== "object" ||
    Array.isArray(keysBase64)
  ) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  const keys = Object.fromEntries(Object.entries(keysBase64).map(([version, encoded]) => {
    if (typeof encoded !== "string") {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
    }
    const decoded = Buffer.from(encoded, "base64");
    if (decoded.length < 32 || decoded.toString("base64") !== encoded) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
    }
    return [version, encoded];
  }));
  if (!(activeKeyVersion in keys)) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  return Object.freeze({ activeKeyVersion, keysBase64: Object.freeze(keys) });
}

async function main(): Promise<void> {
  const sourcePath = process.env.TRADERLINK_PLATFORM_DB_PATH;
  const backupPath = process.env.TRADERLINK_PLATFORM_BACKUP_PATH;
  const restoreVerificationPath = process.env.TRADERLINK_PLATFORM_RESTORE_VERIFICATION_PATH;
  const authorityPath = process.env.TRADERLINK_PLATFORM_JOURNAL_AUTHORITY_PATH;
  if (!sourcePath || !backupPath || !restoreVerificationPath || !authorityPath) {
    platformFailure("TRADERLINK_BACKUP_PATH_INVALID");
  }
  const migrationCountText = process.env.TRADERLINK_PLATFORM_BACKUP_MIGRATION_COUNT;
  const migrationCount = migrationCountText === undefined
    ? platformMigrationManifest.length
    : Number(migrationCountText);
  if (
    !Number.isSafeInteger(migrationCount) || migrationCount < 1 ||
    migrationCount > platformMigrationManifest.length
  ) {
    platformFailure("TRADERLINK_BACKUP_PATH_INVALID");
  }
  const parsed: unknown = JSON.parse(readFileSync(authorityPath, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  const authority = parsed as Record<string, unknown>;
  const accountIdentity = authoritySection(authority.accountIdentity);
  authoritySection(authority.journalPrivacy);
  const evidence = await createAndRestoreVerifyPlatformDatabaseBackup({
    sourcePath,
    backupPath,
    restoreVerificationPath,
    verificationManifest: platformMigrationManifest.slice(0, migrationCount),
    verifyRecoveryAuthority(requirements) {
      const keysAvailable = requirements.hmacKeyVersions.every((version) =>
        version in accountIdentity.keysBase64);
      const canonicalizersAvailable = requirements.sourceAccountCanonicalizationVersions
        .every((version) => version in IBKR_SOURCE_ACCOUNT_CANONICALIZERS);
      if (!keysAvailable || !canonicalizersAvailable) {
        platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
      }
      return Object.freeze({
        verified: true as const,
        hmacKeyVersions: requirements.hmacKeyVersions,
        sourceAccountCanonicalizationVersions:
          requirements.sourceAccountCanonicalizationVersions,
      });
    },
  });
  process.stdout.write(JSON.stringify({
    status: "ok",
    startedAtUtc: evidence.startedAtUtc,
    completedAtUtc: evidence.completedAtUtc,
    source: {
      sizeBytes: evidence.source.fileSizeBytes,
      sha256: evidence.source.fileSha256,
      tableCount: Object.keys(evidence.source.tableCounts).length,
      migrationCount: evidence.source.migrationRows.length,
    },
    backup: {
      path: evidence.backup.path,
      sizeBytes: evidence.backup.fileSizeBytes,
      sha256: evidence.backup.fileSha256,
    },
    restored: {
      path: evidence.restored.path,
      sizeBytes: evidence.restored.fileSizeBytes,
      sha256: evidence.restored.fileSha256,
    },
    exactRegistryMatch: evidence.exactRegistryMatch,
    exactTableCountsMatch: evidence.exactTableCountsMatch,
    pageGeometryMatch: evidence.pageGeometryMatch,
    backupRestoreFileIdentityMatch: evidence.backupRestoreFileIdentityMatch,
    recoveryAuthority: evidence.recoveryAuthority.status,
  }) + "\n");
}

void main();
