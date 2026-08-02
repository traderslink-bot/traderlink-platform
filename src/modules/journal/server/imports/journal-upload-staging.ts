import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

import {
  ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
  isPathWithinRoot,
} from "@/src/modules/platform/server/database/platform-database-config";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT_ENV =
  "TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT" as const;

function requireStagingRoot(environment: NodeJS.ProcessEnv): string {
  const configured = environment[TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT_ENV];
  if (!configured || !isAbsolute(configured)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
      check: "upload_staging_root_missing",
    });
  }
  const root = resolve(configured);
  if (
    !existsSync(root) ||
    lstatSync(root).isSymbolicLink() ||
    !lstatSync(root).isDirectory() ||
    realpathSync(root) !== root ||
    isPathWithinRoot(root, ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT)
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
      check: "upload_staging_root_boundary",
    });
  }
  return root;
}

export function withStagedJournalUpload<T>(
  sourceBytes: Uint8Array,
  operation: (sourcePath: string) => T,
  environment: NodeJS.ProcessEnv = process.env,
): T {
  if (sourceBytes.byteLength < 1 || sourceBytes.byteLength > 25 * 1024 * 1024) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
      check: "upload_size",
    });
  }
  const root = requireStagingRoot(environment);
  const sourcePath = join(root, `journal-upload-${randomUUID()}.csv`);
  let descriptor: number | null = null;
  try {
    descriptor = openSync(sourcePath, "wx+", 0o600);
    let offset = 0;
    while (offset < sourceBytes.byteLength) {
      const written = writeSync(
        descriptor,
        sourceBytes,
        offset,
        sourceBytes.byteLength - offset,
      );
      if (written <= 0) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
          check: "upload_staging_write",
        });
      }
      offset += written;
    }
    fsyncSync(descriptor);
    const status = fstatSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    const staged = readFileSync(sourcePath);
    if (
      status.size !== sourceBytes.byteLength ||
      createHash("sha256").update(staged).digest("hex") !==
        createHash("sha256").update(sourceBytes).digest("hex")
    ) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
        check: "upload_staging_verify",
      });
    }
    return operation(sourcePath);
  } finally {
    if (descriptor !== null) closeSync(descriptor);
    if (existsSync(sourcePath)) unlinkSync(sourcePath);
  }
}
