import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS } from "@/src/modules/journal/server/accounts/journal-source-account-canonicalizers";
import { readProtectedInitialOwnerDiscordSubject } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { requireJournalAdminScope } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import {
  consumeJournalAdminRateLimit,
  requireJournalAdminMutationRequest,
} from "@/src/modules/platform/server/administration/platform-admin-request-security";
import {
  createAndRestoreVerifyPlatformDatabaseBackup,
  type PlatformDatabaseRecoveryRequirements,
} from "@/src/modules/platform/server/database/platform-database-backup";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import {
  isLowercaseSha256,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { openReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import type { HostedTransferModule } from "@/src/modules/platform/server/transfer/hosted-transfer-contract";
import { prepareHostedTransfer } from "@/src/modules/platform/server/transfer/hosted-transfer-preview-service";
import { readHostedSourceSnapshotsFromExportDirectory } from "@/src/modules/platform/server/transfer/hosted-source-export-snapshot-reader";
import { executeHostedTransfer } from "@/src/modules/platform/server/transfer/hosted-transfer-service";

import { journalAdminJson, journalAdminUnavailable } from "../../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOSTED_TRANSFER_EXPORT_DIRECTORY_ENV =
  "TRADERLINK_HOSTED_TRANSFER_EXPORT_DIRECTORY" as const;
const BACKUP_ROOT = "/data/backups/hosted-transfer" as const;
const JOURNAL_AUTHORITY_PATH_ENV = "TRADERLINK_PLATFORM_JOURNAL_AUTHORITY_PATH" as const;
const ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION_ENV =
  "TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION" as const;
const ACCOUNT_IDENTITY_HMAC_KEYS_ENV =
  "TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON" as const;
const JOURNAL_HMAC_ACTIVE_KEY_VERSION_ENV =
  "TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION" as const;
const JOURNAL_HMAC_KEYS_ENV =
  "TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON" as const;

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
    !keysBase64 || typeof keysBase64 !== "object" || Array.isArray(keysBase64)
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

function configuredAuthoritySection(
  activeKeyVersionEnv: string,
  keysEnv: string,
): AuthoritySection {
  const activeKeyVersion = process.env[activeKeyVersionEnv];
  const encodedKeys = process.env[keysEnv];
  if (!activeKeyVersion || !encodedKeys) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  let keysBase64: unknown;
  try {
    keysBase64 = JSON.parse(encodedKeys);
  } catch (error) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED", {}, error);
  }
  return authoritySection({ activeKeyVersion, keysBase64 });
}

function verifyRecoveryAuthority(
  requirements: PlatformDatabaseRecoveryRequirements,
): Readonly<{
  verified: true;
  hmacKeyVersions: readonly string[];
  sourceAccountCanonicalizationVersions: readonly string[];
}> {
  const authorityPath = process.env[JOURNAL_AUTHORITY_PATH_ENV];
  let accountIdentity: AuthoritySection;
  if (authorityPath) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(authorityPath, "utf8"));
    } catch (error) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED", {}, error);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
    }
    const authority = parsed as Record<string, unknown>;
    authoritySection(authority.journalPrivacy);
    accountIdentity = authoritySection(authority.accountIdentity);
  } else {
    accountIdentity = configuredAuthoritySection(
      ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION_ENV,
      ACCOUNT_IDENTITY_HMAC_KEYS_ENV,
    );
  }
  if (!authorityPath) {
    configuredAuthoritySection(JOURNAL_HMAC_ACTIVE_KEY_VERSION_ENV, JOURNAL_HMAC_KEYS_ENV);
  }
  const keysAvailable = requirements.hmacKeyVersions.every((version) =>
    version in accountIdentity.keysBase64);
  const canonicalizersAvailable = requirements.sourceAccountCanonicalizationVersions
    .every((version) => version in ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS);
  if (!keysAvailable || !canonicalizersAvailable) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  return Object.freeze({
    verified: true as const,
    hmacKeyVersions: requirements.hmacKeyVersions,
    sourceAccountCanonicalizationVersions: requirements.sourceAccountCanonicalizationVersions,
  });
}

function exportDirectory(): string {
  const value = process.env[HOSTED_TRANSFER_EXPORT_DIRECTORY_ENV]?.trim();
  if (!value || !value.startsWith("/data/upload-staging/")) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", {
      field: "hosted_transfer_export_directory",
    });
  }
  return value;
}

function expectedPreviewSha256(value: unknown): string {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !isLowercaseSha256((value as Record<string, unknown>).previewSha256 as string)
  ) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  return (value as Record<string, string>).previewSha256;
}

function backupPaths(): Readonly<{ backupPath: string; restorePath: string }> {
  const operationId = randomUUID();
  const root = join(BACKUP_ROOT, operationId);
  return Object.freeze({
    backupPath: join(root, "target-before-transfer.sqlite"),
    restorePath: join(root, "target-before-transfer-restore.sqlite"),
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    requireJournalAdminMutationRequest(request);
    const expectedPreview = expectedPreviewSha256(await request.json());
    const scope = requireJournalAdminScope(request.headers);
    consumeJournalAdminRateLimit({
      category: "sensitive",
      headers: request.headers,
      userId: scope.userId,
    });

    const databasePath = resolvePlatformDatabaseConfig().databasePath;
    const sources = readHostedSourceSnapshotsFromExportDirectory(exportDirectory());
    const protectedInitialOwnerAuthSubject = readProtectedInitialOwnerDiscordSubject();
    const readonly = openReadonlyPlatformDatabase({ databasePath });
    let prepared;
    try {
      prepared = prepareHostedTransfer(readonly, sources, {
        protectedInitialOwnerAuthSubject,
      });
    } finally {
      readonly.close();
    }
    if (prepared.preview.previewSha256 !== expectedPreview) {
      platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
        check: "expected_preview",
      });
    }

    const paths = backupPaths();
    const backup = await createAndRestoreVerifyPlatformDatabaseBackup({
      sourcePath: databasePath,
      backupPath: paths.backupPath,
      restoreVerificationPath: paths.restorePath,
      verifyRecoveryAuthority,
    });
    const database = openPlatformDatabase({ mode: "runtime", databasePath });
    try {
      const locked = prepareHostedTransfer(database, sources, {
        protectedInitialOwnerAuthSubject,
      });
      if (locked.preview.previewSha256 !== expectedPreview) {
        platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
          check: "locked_preview",
        });
      }
      const sourceSnapshotSha256ByModule: Readonly<Record<HostedTransferModule, string>> = Object.freeze(Object.fromEntries(
        locked.preview.modules.map((module) => [module.module, module.sourceSnapshotSha256]),
      ) as Record<HostedTransferModule, string>);
      const sourceBackupCompletedAtUtcByModule: Readonly<Record<HostedTransferModule, string>> = Object.freeze(Object.fromEntries(
        locked.preview.modules.map((module) => [module.module, backup.completedAtUtc]),
      ) as Record<HostedTransferModule, string>);
      const result = executeHostedTransfer({
        database,
        databasePath,
        prepared: locked,
        authorization: Object.freeze({
          authorized: true as const,
          previewSha256: expectedPreview,
          targetDatabaseFileSha256: backup.source.fileSha256,
          targetBackupPath: backup.backup.path,
          targetBackupSha256: backup.backup.fileSha256,
          targetRestorePath: backup.restored.path,
          targetRestoreSha256: backup.restored.fileSha256,
          targetBackupCompletedAtUtc: backup.completedAtUtc,
          sourceSnapshotSha256ByModule,
          sourceBackupCompletedAtUtcByModule,
        }),
      });
      return journalAdminJson({
        status: result.status,
        previewSha256: result.previewSha256,
        reconciliationSha256: result.reconciliationSha256,
        backup: {
          sha256: backup.backup.fileSha256,
          restoredSha256: backup.restored.fileSha256,
          verified: backup.backupRestoreFileIdentityMatch,
        },
      });
    } finally {
      database.close();
    }
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
