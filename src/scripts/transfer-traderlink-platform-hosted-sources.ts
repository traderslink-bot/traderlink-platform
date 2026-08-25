import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { isAbsolute, resolve } from "node:path";

import {
  HOSTED_TRANSFER_MODULES,
  type HostedTransferModule,
} from "@/src/modules/platform/server/transfer/hosted-transfer-contract";
import { readHostedSourceSnapshots } from "@/src/modules/platform/server/transfer/hosted-source-snapshot-reader";
import { readHostedSourceSnapshotsFromExportDirectory } from "@/src/modules/platform/server/transfer/hosted-source-export-snapshot-reader";
import { prepareHostedTransfer } from "@/src/modules/platform/server/transfer/hosted-transfer-preview-service";
import {
  executeHostedTransfer,
  type HostedTransferExecutionAuthorization,
} from "@/src/modules/platform/server/transfer/hosted-transfer-service";
import { readProtectedInitialOwnerDiscordSubject } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import {
  ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
  isPathWithinRoot,
  resolvePlatformDatabaseConfig,
} from "@/src/modules/platform/server/database/platform-database-config";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { openReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

const AUTHORITY_PATH_ENV = "TRADERLINK_PLATFORM_HOSTED_TRANSFER_AUTHORITY_PATH";

function string(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", { field });
  }
  return value;
}

function moduleRecord(
  value: unknown,
  field: string,
): Readonly<Record<HostedTransferModule, string>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", { field });
  }
  const record = value as Record<string, unknown>;
  return Object.freeze(Object.fromEntries(HOSTED_TRANSFER_MODULES.map((module) => [
    module,
    string(record[module], `${field}_${module}`),
  ])) as Record<HostedTransferModule, string>);
}

function readAuthorization(): HostedTransferExecutionAuthorization {
  const configuredPath = process.env[AUTHORITY_PATH_ENV];
  if (!configuredPath || !isAbsolute(configuredPath)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
      check: "authority_path",
    });
  }
  const path = resolve(configuredPath);
  if (
    !existsSync(path) ||
    lstatSync(path).isSymbolicLink() ||
    !lstatSync(path).isFile() ||
    realpathSync(path) !== path ||
    isPathWithinRoot(path, ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT)
  ) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
      check: "authority_file",
    });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
      check: "authority_json",
    }, error);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED");
  }
  const value = parsed as Record<string, unknown>;
  if (
    value.contractVersion !== "traderlink_hosted_transfer_authorization_v1" ||
    value.authorized !== true
  ) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", {
      check: "authority_contract",
    });
  }
  return Object.freeze({
    authorized: true as const,
    previewSha256: string(value.previewSha256, "previewSha256"),
    targetDatabaseFileSha256: string(
      value.targetDatabaseFileSha256,
      "targetDatabaseFileSha256",
    ),
    targetBackupPath: string(value.targetBackupPath, "targetBackupPath"),
    targetBackupSha256: string(value.targetBackupSha256, "targetBackupSha256"),
    targetRestorePath: string(value.targetRestorePath, "targetRestorePath"),
    targetRestoreSha256: string(value.targetRestoreSha256, "targetRestoreSha256"),
    targetBackupCompletedAtUtc: string(
      value.targetBackupCompletedAtUtc,
      "targetBackupCompletedAtUtc",
    ),
    sourceSnapshotSha256ByModule: moduleRecord(
      value.sourceSnapshotSha256ByModule,
      "sourceSnapshotSha256ByModule",
    ),
    sourceBackupCompletedAtUtcByModule: moduleRecord(
      value.sourceBackupCompletedAtUtcByModule,
      "sourceBackupCompletedAtUtcByModule",
    ),
  });
}

function safePreview(preview: ReturnType<typeof prepareHostedTransfer>["preview"]): unknown {
  return Object.freeze({
    contractVersion: preview.contractVersion,
    previewSha256: preview.previewSha256,
    modules: preview.modules.map((module) => Object.freeze({
      module: module.module,
      sourceSnapshotSha256: module.sourceSnapshotSha256,
      previewSha256: module.previewSha256,
      counts: module.counts,
    })),
  });
}

async function main(): Promise<void> {
  const mode = process.argv.includes("--execute") ? "execute" : "preview";
  if (process.argv.includes("--execute") && process.argv.includes("--preview")) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: "mode" });
  }
  const exportDirectoryFlagIndex = process.argv.indexOf("--source-export-directory");
  const exportDirectory = exportDirectoryFlagIndex === -1
    ? null
    : process.argv[exportDirectoryFlagIndex + 1];
  if (exportDirectoryFlagIndex !== -1 && (!exportDirectory || !isAbsolute(exportDirectory))) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: "source_export_directory" });
  }
  if (exportDirectory && mode !== "preview") {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field: "source_export_preview_only" });
  }
  const databasePath = resolvePlatformDatabaseConfig().databasePath;
  const sources = exportDirectory
    ? readHostedSourceSnapshotsFromExportDirectory(exportDirectory)
    : await readHostedSourceSnapshots();
  const protectedInitialOwnerAuthSubject = readProtectedInitialOwnerDiscordSubject();
  const database = mode === "execute"
    ? openPlatformDatabase({ mode: "runtime", databasePath })
    : openReadonlyPlatformDatabase({ databasePath });
  try {
    const prepared = prepareHostedTransfer(database, sources, {
      protectedInitialOwnerAuthSubject,
    });
    if (mode === "preview") {
      process.stdout.write(`${JSON.stringify({
        status: "preview_ready",
        ...safePreview(prepared.preview) as Record<string, unknown>,
      })}\n`);
      return;
    }
    const result = executeHostedTransfer({
      database,
      databasePath,
      prepared,
      authorization: readAuthorization(),
      protectedInitialOwnerAuthSubject,
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    database.close();
  }
}

void main();
