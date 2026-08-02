import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  JOURNAL_SOURCE_IDENTITY_PREPARATION_ACTION,
  prepareTraderLinkPlatformJournalSourceIdentity,
} from "@/src/modules/journal/server/accounts/journal-source-identity-preparation";
import { loadTraderLinkPlatformJournalImportSourcePath } from "@/src/modules/journal/server/imports/journal-import-source-preview";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

type PreparationArguments = Readonly<{
  sourceTimezone: string;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
  aggregatePreviewSha256: string;
}>;

function argumentValue(arguments_: readonly string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const matches = arguments_.filter((argument) => argument.startsWith(prefix));
  if (matches.length !== 1) return undefined;
  const value = matches[0]?.slice(prefix.length);
  return value && value.length > 0 ? value : undefined;
}

function parseArguments(arguments_: readonly string[]): PreparationArguments {
  const sourceTimezone = argumentValue(arguments_, "source-timezone");
  const sourceFileSha256 = argumentValue(arguments_, "expected-sha256");
  const sourceFileSizeText = argumentValue(arguments_, "expected-size-bytes");
  const aggregatePreviewSha256 = argumentValue(
    arguments_,
    "expected-preview-sha256",
  );
  const allowedPrefixes = [
    "--action=",
    "--source-timezone=",
    "--expected-sha256=",
    "--expected-size-bytes=",
    "--expected-preview-sha256=",
  ];
  const action = argumentValue(arguments_, "action");
  const sourceFileSizeBytes = Number(sourceFileSizeText);
  if (
    action !== JOURNAL_SOURCE_IDENTITY_PREPARATION_ACTION ||
    !sourceTimezone ||
    !sourceFileSha256 ||
    !aggregatePreviewSha256 ||
    !Number.isSafeInteger(sourceFileSizeBytes) ||
    sourceFileSizeBytes < 1 ||
    arguments_.some((argument) =>
      !allowedPrefixes.some((prefix) => argument.startsWith(prefix)))
  ) {
    throw new Error(
      "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PREPARATION_ARGUMENT_INVALID",
    );
  }
  return Object.freeze({
    sourceTimezone,
    sourceFileSha256,
    sourceFileSizeBytes,
    aggregatePreviewSha256,
  });
}

export function runTraderLinkPlatformJournalSourceIdentityPreparation(
  arguments_: readonly string[] = process.argv.slice(2),
  environment: NodeJS.ProcessEnv = process.env,
): ReturnType<typeof prepareTraderLinkPlatformJournalSourceIdentity> {
  const parsed = parseArguments(arguments_);
  return prepareTraderLinkPlatformJournalSourceIdentity({
    sourcePath: loadTraderLinkPlatformJournalImportSourcePath(environment),
    sourceTimezone: parsed.sourceTimezone,
    environment,
    expectedEvidence: Object.freeze({
      sourceFileSha256: parsed.sourceFileSha256,
      sourceFileSizeBytes: parsed.sourceFileSizeBytes,
      aggregatePreviewSha256: parsed.aggregatePreviewSha256,
    }),
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
      JSON.stringify(
        runTraderLinkPlatformJournalSourceIdentityPreparation(),
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(JSON.stringify({
      code: isTraderLinkPlatformError(error)
        ? error.code
        : error instanceof Error &&
            error.message ===
              "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PREPARATION_ARGUMENT_INVALID"
          ? error.message
          : "TRADERLINK_JOURNAL_SOURCE_IDENTITY_PREPARATION_FAILED",
    }));
    process.exitCode = 1;
  }
}
