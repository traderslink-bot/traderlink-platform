import { createHash } from "node:crypto";
import {
  closeSync,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { extname, isAbsolute, resolve } from "node:path";

import type {
  IbkrActivityStatementPreview,
  JournalImportPreview,
} from "../../contracts/journal-import-contracts";
import {
  ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
  isPathWithinRoot,
} from "@/src/modules/platform/server/database/platform-database-config";
import {
  isLowercaseSha256,
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { previewIbkrActivityStatement } from "./ibkr-activity-statement-adapter";
import { createPrivacySafeIbkrPreview } from "./journal-import-service";

export const JOURNAL_IMPORT_SOURCE_MAX_BYTES = 64 * 1024 * 1024;
export const TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH_ENV =
  "TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH" as const;

export type JournalImportSourceEvidence = Readonly<{
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
  aggregatePreviewSha256: string;
}>;

export type TraderLinkJournalImportPreviewResult = Readonly<{
  status: "journal_import_previewed";
  identifiersRedacted: true;
  evidence: JournalImportSourceEvidence;
  aggregatePreview: JournalImportPreview;
}>;

export type JournalImportSourceReadOptions = Readonly<{
  sourcePath: string;
  sourceTimezone: string;
  expectedSourceFileSha256?: string;
  expectedSourceFileSizeBytes?: number;
  additionalForbiddenRepositoryRoot?: string;
}>;

type PrivateJournalImportSource = Readonly<{
  sourceBytes: Uint8Array;
  privatePreview: IbkrActivityStatementPreview;
  aggregatePreview: JournalImportPreview;
  evidence: JournalImportSourceEvidence;
}>;

function sha256Bytes(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function loadTraderLinkPlatformJournalImportSourcePath(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const sourcePath = environment[
    TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH_ENV
  ];
  if (typeof sourcePath !== "string" || sourcePath.length === 0) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
      check: "source_path_environment",
    });
  }
  return sourcePath;
}

function requireExpectedSourceEvidence(
  evidence: Readonly<{ sha256: string; sizeBytes: number }>,
  options: JournalImportSourceReadOptions,
): void {
  if (
    options.expectedSourceFileSha256 !== undefined &&
    (!isLowercaseSha256(options.expectedSourceFileSha256) ||
      evidence.sha256 !== options.expectedSourceFileSha256)
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
      check: "source_sha256",
    });
  }
  if (
    options.expectedSourceFileSizeBytes !== undefined &&
    (!Number.isSafeInteger(options.expectedSourceFileSizeBytes) ||
      options.expectedSourceFileSizeBytes < 1 ||
      evidence.sizeBytes !== options.expectedSourceFileSizeBytes)
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
      check: "source_size",
    });
  }
}

function readValidatedJournalImportSource(
  options: JournalImportSourceReadOptions,
): Uint8Array {
  if (
    typeof options.sourcePath !== "string" ||
    options.sourcePath.trim() !== options.sourcePath ||
    options.sourcePath.length === 0 ||
    /[\u0000-\u001f\u007f]/u.test(options.sourcePath) ||
    !isAbsolute(options.sourcePath) ||
    extname(options.sourcePath).toLowerCase() !== ".csv"
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
      check: "source_path_shape",
    });
  }
  const forbiddenRepositoryRoots = [
    resolve(ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT),
  ];
  if (options.additionalForbiddenRepositoryRoot !== undefined) {
    if (
      typeof options.additionalForbiddenRepositoryRoot !== "string" ||
      options.additionalForbiddenRepositoryRoot.length === 0
    ) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
        check: "additional_forbidden_repository_root",
      });
    }
    forbiddenRepositoryRoots.push(
      resolve(options.additionalForbiddenRepositoryRoot),
    );
  }
  const isForbiddenRepositoryPath = (candidatePath: string): boolean =>
    forbiddenRepositoryRoots.some((repositoryRoot) =>
      isPathWithinRoot(candidatePath, repositoryRoot));

  try {
    const requestedPath = resolve(options.sourcePath);
    if (isForbiddenRepositoryPath(requestedPath)) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
        check: "source_file_boundary",
      });
    }
    const requestedStatus = lstatSync(requestedPath);
    if (
      requestedStatus.isSymbolicLink() ||
      !requestedStatus.isFile() ||
      isForbiddenRepositoryPath(requestedPath)
    ) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
        check: "source_file_boundary",
      });
    }
    const sourcePath = realpathSync(requestedPath);
    if (
      extname(sourcePath).toLowerCase() !== ".csv" ||
      isForbiddenRepositoryPath(sourcePath)
    ) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
        check: "source_file_boundary",
      });
    }

    const descriptor = openSync(sourcePath, "r");
    try {
      const before = fstatSync(descriptor);
      if (
        requestedStatus.dev !== before.dev ||
        requestedStatus.ino !== before.ino ||
        requestedStatus.size !== before.size ||
        requestedStatus.mtimeMs !== before.mtimeMs ||
        realpathSync(requestedPath) !== sourcePath
      ) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
          check: "source_changed_before_open",
        });
      }
      if (
        !before.isFile() ||
        before.size < 1 ||
        before.size > JOURNAL_IMPORT_SOURCE_MAX_BYTES
      ) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
          check: "source_file_size",
        });
      }
      const bytes = readFileSync(descriptor);
      const after = fstatSync(descriptor);
      if (
        before.dev !== after.dev ||
        before.ino !== after.ino ||
        before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs ||
        bytes.byteLength !== after.size
      ) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
          check: "source_changed_during_read",
        });
      }
      if (bytes.subarray(0, 16).toString("utf8") === "SQLite format 3\u0000") {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {
          check: "database_source_forbidden",
        });
      }
      return bytes;
    } finally {
      closeSync(descriptor);
    }
  } catch (error) {
    if (isTraderLinkPlatformError(error)) throw error;
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_PATH_INVALID", {}, error);
  }
}

export function withPrivateJournalImportSource<T>(
  options: JournalImportSourceReadOptions,
  operation: (source: PrivateJournalImportSource) => T,
): T {
  const sourceBytes = readValidatedJournalImportSource(options);
  const sourceEvidence = Object.freeze({
    sha256: sha256Bytes(sourceBytes),
    sizeBytes: sourceBytes.byteLength,
  });
  requireExpectedSourceEvidence(sourceEvidence, options);
  const privatePreview = previewIbkrActivityStatement({
    sourceBytes,
    sourceTimezone: options.sourceTimezone,
  });
  if (
    privatePreview.sourceFileSha256 !== sourceEvidence.sha256 ||
    privatePreview.sourceFileSizeBytes !== sourceEvidence.sizeBytes
  ) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_SOURCE_EVIDENCE_MISMATCH", {
      check: "parser_source_evidence",
    });
  }
  const aggregatePreview = createPrivacySafeIbkrPreview(privatePreview);
  const evidence = Object.freeze({
    sourceFileSha256: sourceEvidence.sha256,
    sourceFileSizeBytes: sourceEvidence.sizeBytes,
    aggregatePreviewSha256: sha256Text(JSON.stringify(aggregatePreview)),
  });
  return operation(Object.freeze({
    sourceBytes,
    privatePreview,
    aggregatePreview,
    evidence,
  }));
}

export function previewTraderLinkPlatformJournalImport(
  options: JournalImportSourceReadOptions,
): TraderLinkJournalImportPreviewResult {
  return withPrivateJournalImportSource(options, (source) => Object.freeze({
    status: "journal_import_previewed" as const,
    identifiersRedacted: true as const,
    evidence: source.evidence,
    aggregatePreview: source.aggregatePreview,
  }));
}
