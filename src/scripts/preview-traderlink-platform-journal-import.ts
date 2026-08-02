import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadTraderLinkPlatformJournalImportSourcePath,
  previewTraderLinkPlatformJournalImport,
} from "@/src/modules/journal/server/imports/journal-import-source-preview";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

type PreviewArguments = Readonly<{
  sourceTimezone: string;
  expectedSourceFileSha256?: string;
  expectedSourceFileSizeBytes?: number;
}>;

function argumentValue(arguments_: readonly string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const matches = arguments_.filter((argument) => argument.startsWith(prefix));
  if (matches.length !== 1) return undefined;
  const value = matches[0]?.slice(prefix.length);
  return value && value.length > 0 ? value : undefined;
}

function parseArguments(arguments_: readonly string[]): PreviewArguments {
  const sourceTimezone = argumentValue(arguments_, "source-timezone");
  const expectedSourceFileSha256 = argumentValue(
    arguments_,
    "expected-sha256",
  );
  const expectedSizeText = argumentValue(arguments_, "expected-size-bytes");
  const allowedPrefixes = [
    "--source-timezone=",
    "--expected-sha256=",
    "--expected-size-bytes=",
  ];
  if (
    !sourceTimezone ||
    arguments_.some((argument) =>
      !allowedPrefixes.some((prefix) => argument.startsWith(prefix)))
  ) {
    throw new Error("TRADERLINK_JOURNAL_IMPORT_PREVIEW_ARGUMENT_INVALID");
  }
  let expectedSourceFileSizeBytes: number | undefined;
  if (expectedSizeText !== undefined) {
    expectedSourceFileSizeBytes = Number(expectedSizeText);
    if (
      !Number.isSafeInteger(expectedSourceFileSizeBytes) ||
      expectedSourceFileSizeBytes < 1
    ) {
      throw new Error("TRADERLINK_JOURNAL_IMPORT_PREVIEW_ARGUMENT_INVALID");
    }
  }
  return Object.freeze({
    sourceTimezone,
    expectedSourceFileSha256,
    expectedSourceFileSizeBytes,
  });
}

export function runTraderLinkPlatformJournalImportPreview(
  arguments_: readonly string[] = process.argv.slice(2),
  environment: NodeJS.ProcessEnv = process.env,
): ReturnType<typeof previewTraderLinkPlatformJournalImport> {
  const parsed = parseArguments(arguments_);
  return previewTraderLinkPlatformJournalImport({
    ...parsed,
    sourcePath: loadTraderLinkPlatformJournalImportSourcePath(environment),
  });
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;
  return (
    resolve(invokedPath).toLowerCase() ===
    fileURLToPath(import.meta.url).toLowerCase()
  );
}

if (isDirectExecution()) {
  try {
    console.info(
      JSON.stringify(runTraderLinkPlatformJournalImportPreview(), null, 2),
    );
  } catch (error) {
    console.error(JSON.stringify({
      code: isTraderLinkPlatformError(error)
        ? error.code
        : error instanceof Error &&
            error.message === "TRADERLINK_JOURNAL_IMPORT_PREVIEW_ARGUMENT_INVALID"
          ? error.message
          : "TRADERLINK_JOURNAL_IMPORT_PREVIEW_FAILED",
    }));
    process.exitCode = 1;
  }
}
