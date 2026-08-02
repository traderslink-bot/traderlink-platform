import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadTraderLinkPlatformJournalImportSourcePath } from "@/src/modules/journal/server/imports/journal-import-source-preview";
import {
  JOURNAL_INTEGRITY_VERIFICATION_ACTION,
  type TraderLinkJournalIntegrityVerificationOptions,
  verifyTraderLinkPlatformJournalIntegrity,
} from "@/src/modules/journal/server/verification/journal-integrity-verifier";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

type VerificationArguments = Readonly<{
  sourceTimezone: string;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
  aggregatePreviewSha256: string;
  firstImportBatchId: string;
  reimportBatchId: string;
}>;

function argumentValue(arguments_: readonly string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const matches = arguments_.filter((argument) => argument.startsWith(prefix));
  if (matches.length !== 1) return undefined;
  const value = matches[0]?.slice(prefix.length);
  return value && value.length > 0 ? value : undefined;
}

function parseArguments(arguments_: readonly string[]): VerificationArguments {
  const sourceTimezone = argumentValue(arguments_, "source-timezone");
  const sourceFileSha256 = argumentValue(arguments_, "expected-sha256");
  const sourceFileSizeBytes = Number(
    argumentValue(arguments_, "expected-size-bytes"),
  );
  const aggregatePreviewSha256 = argumentValue(
    arguments_,
    "expected-preview-sha256",
  );
  const firstImportBatchId = argumentValue(arguments_, "first-import-batch-id");
  const reimportBatchId = argumentValue(arguments_, "reimport-batch-id");
  const action = argumentValue(arguments_, "action");
  const allowedPrefixes = [
    "--action=",
    "--source-timezone=",
    "--expected-sha256=",
    "--expected-size-bytes=",
    "--expected-preview-sha256=",
    "--first-import-batch-id=",
    "--reimport-batch-id=",
  ];
  if (
    action !== JOURNAL_INTEGRITY_VERIFICATION_ACTION ||
    !sourceTimezone ||
    !sourceFileSha256 ||
    !aggregatePreviewSha256 ||
    !firstImportBatchId ||
    !reimportBatchId ||
    !Number.isSafeInteger(sourceFileSizeBytes) ||
    sourceFileSizeBytes < 1 ||
    arguments_.some((argument) =>
      !allowedPrefixes.some((prefix) => argument.startsWith(prefix)))
  ) {
    throw new Error("TRADERLINK_JOURNAL_INTEGRITY_ARGUMENT_INVALID");
  }
  return Object.freeze({
    sourceTimezone,
    sourceFileSha256,
    sourceFileSizeBytes,
    aggregatePreviewSha256,
    firstImportBatchId,
    reimportBatchId,
  });
}

export function runTraderLinkPlatformJournalIntegrityVerification(
  arguments_: readonly string[] = process.argv.slice(2),
  environment: NodeJS.ProcessEnv = process.env,
  overrides: Partial<Omit<
    TraderLinkJournalIntegrityVerificationOptions,
    | "sourcePath"
    | "sourceTimezone"
    | "expectedSourceFileSha256"
    | "expectedSourceFileSizeBytes"
    | "expectedAggregatePreviewSha256"
    | "expectedFirstImportBatchId"
    | "expectedReimportBatchId"
    | "environment"
  >> = {},
): ReturnType<typeof verifyTraderLinkPlatformJournalIntegrity> {
  const parsed = parseArguments(arguments_);
  return verifyTraderLinkPlatformJournalIntegrity({
    ...overrides,
    sourcePath: loadTraderLinkPlatformJournalImportSourcePath(environment),
    sourceTimezone: parsed.sourceTimezone,
    expectedSourceFileSha256: parsed.sourceFileSha256,
    expectedSourceFileSizeBytes: parsed.sourceFileSizeBytes,
    expectedAggregatePreviewSha256: parsed.aggregatePreviewSha256,
    expectedFirstImportBatchId: parsed.firstImportBatchId,
    expectedReimportBatchId: parsed.reimportBatchId,
    environment,
  });
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;
  return resolve(invokedPath).toLowerCase() ===
    fileURLToPath(import.meta.url).toLowerCase();
}

if (isDirectExecution()) {
  try {
    console.info(JSON.stringify(
      runTraderLinkPlatformJournalIntegrityVerification(),
      null,
      2,
    ));
  } catch (error) {
    console.error(JSON.stringify({
      code: isTraderLinkPlatformError(error)
        ? error.code
        : error instanceof Error &&
            error.message === "TRADERLINK_JOURNAL_INTEGRITY_ARGUMENT_INVALID"
          ? error.message
          : "TRADERLINK_JOURNAL_INTEGRITY_VERIFICATION_FAILED",
    }));
    process.exitCode = 1;
  }
}
