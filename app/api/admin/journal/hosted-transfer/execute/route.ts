import { randomUUID } from "node:crypto";
import { join } from "node:path";

import { readProtectedInitialOwnerDiscordSubject } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { requireJournalAdminScope } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import {
  consumeJournalAdminRateLimit,
  requireJournalAdminMutationRequest,
} from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { createAndRestoreVerifyPlatformDatabaseBackup } from "@/src/modules/platform/server/database/platform-database-backup";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import {
  isLowercaseSha256,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { openReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { prepareHostedTransfer } from "@/src/modules/platform/server/transfer/hosted-transfer-preview-service";
import { readHostedSourceSnapshotsFromExportDirectory } from "@/src/modules/platform/server/transfer/hosted-source-export-snapshot-reader";
import { executeHostedTransfer } from "@/src/modules/platform/server/transfer/hosted-transfer-service";

import { journalAdminJson, journalAdminUnavailable } from "../../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOSTED_TRANSFER_EXPORT_DIRECTORY_ENV =
  "TRADERLINK_HOSTED_TRANSFER_EXPORT_DIRECTORY" as const;
const BACKUP_ROOT = "/data/backups/hosted-transfer" as const;

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
      const sourceSnapshotSha256ByModule = Object.freeze(Object.fromEntries(
        locked.preview.modules.map((module) => [module.module, module.sourceSnapshotSha256]),
      ));
      const sourceBackupCompletedAtUtcByModule = Object.freeze(Object.fromEntries(
        locked.preview.modules.map((module) => [module.module, backup.completedAtUtc]),
      ));
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
