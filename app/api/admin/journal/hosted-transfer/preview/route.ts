import { readProtectedInitialOwnerDiscordSubject } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { prepareHostedTransfer } from "@/src/modules/platform/server/transfer/hosted-transfer-preview-service";
import { readHostedSourceSnapshotsFromExportDirectory } from "@/src/modules/platform/server/transfer/hosted-source-export-snapshot-reader";

import {
  journalAdminJson,
  journalAdminUnavailable,
  withJournalAdminRequest,
} from "../../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOSTED_TRANSFER_EXPORT_DIRECTORY_ENV =
  "TRADERLINK_HOSTED_TRANSFER_EXPORT_DIRECTORY" as const;

function exportDirectory(): string {
  const value = process.env[HOSTED_TRANSFER_EXPORT_DIRECTORY_ENV]?.trim();
  if (!value || !value.startsWith("/data/upload-staging/")) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", {
      field: "hosted_transfer_export_directory",
    });
  }
  return value;
}

export function GET(request: Request): Response {
  try {
    return withJournalAdminRequest(request, (database) => {
      const prepared = prepareHostedTransfer(
        database,
        readHostedSourceSnapshotsFromExportDirectory(exportDirectory()),
        { protectedInitialOwnerAuthSubject: readProtectedInitialOwnerDiscordSubject() },
      );
      return journalAdminJson({
        status: "preview_ready",
        preview: {
          contractVersion: prepared.preview.contractVersion,
          previewSha256: prepared.preview.previewSha256,
          modules: prepared.preview.modules.map((module) => Object.freeze({
            module: module.module,
            sourceSnapshotSha256: module.sourceSnapshotSha256,
            previewSha256: module.previewSha256,
            counts: module.counts,
          })),
        },
      });
    });
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
