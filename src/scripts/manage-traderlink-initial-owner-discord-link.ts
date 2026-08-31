import { dirname, join } from "node:path";

import {
  executeInitialOwnerDiscordLink,
  previewInitialOwnerDiscordLink,
} from "@/src/modules/platform/server/bootstrap/link-initial-owner-discord-identity";
import { readProtectedInitialOwnerDiscordSubject } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { createAndRestoreVerifyPlatformDatabaseBackup } from "@/src/modules/platform/server/database/platform-database-backup";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

const CONFIRMATION = "LINK INITIAL OWNER DISCORD IDENTITY";

function argument(name: string): string {
  const prefix = `--${name}=`;
  const values = process.argv.slice(2).filter((value) => value.startsWith(prefix));
  if (values.length !== 1 || !values[0]) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_CONFIRMATION_INVALID");
  }
  const value = values[0].slice(prefix.length);
  if (!value || value.trim() !== value) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_CONFIRMATION_INVALID");
  }
  return value;
}

function requireExactArgumentSet(mode: "preview" | "execute"): void {
  const allowedFlags = new Set([`--${mode}`]);
  const allowedNames = mode === "preview"
    ? []
    : ["expected-preview-digest", "confirm"];
  const allowedPrefixes = allowedNames.map((name) => `--${name}=`);
  if (process.argv.slice(2).some((value) =>
    !allowedFlags.has(value) &&
    !allowedPrefixes.some((prefix) => value.startsWith(prefix)))) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_CONFIRMATION_INVALID");
  }
}

function configuredOwnerSubject(): string {
  const subject = readProtectedInitialOwnerDiscordSubject();
  if (!subject) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_PRECONDITION_FAILED", {
      check: "configured_discord_subject",
    });
  }
  return subject;
}

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const previewMode = arguments_.includes("--preview");
  const executeMode = arguments_.includes("--execute");
  if (previewMode === executeMode) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_CONFIRMATION_INVALID");
  }
  requireExactArgumentSet(previewMode ? "preview" : "execute");
  const databasePath = resolvePlatformDatabaseConfig().databasePath;
  const authSubject = configuredOwnerSubject();
  const preview = previewInitialOwnerDiscordLink({ databasePath, authSubject });
  if (previewMode) {
    process.stdout.write(`${JSON.stringify(preview, null, 2)}\n`);
    return;
  }
  if (argument("confirm") !== CONFIRMATION) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_CONFIRMATION_INVALID");
  }
  const timestamp = new Date().toISOString().replaceAll(/[-:.]/gu, "");
  const backupRoot = join(
    dirname(databasePath),
    "backups",
    "initial-owner-discord-link",
    timestamp,
  );
  const backupEvidence = await createAndRestoreVerifyPlatformDatabaseBackup({
    sourcePath: databasePath,
    backupPath: join(backupRoot, "backup.sqlite"),
    restoreVerificationPath: join(backupRoot, "restore-verification.sqlite"),
  });
  const result = executeInitialOwnerDiscordLink({
    databasePath,
    authSubject,
    expectedPreviewDigest: argument("expected-preview-digest"),
    authorization: {
      operation: "link_initial_owner_discord_identity",
      authorized: true,
    },
    backupEvidence,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${JSON.stringify({
    status: "failed",
    code: error instanceof Error
      ? error.message
      : "TRADERLINK_INITIAL_OWNER_LINK_CONFIRMATION_INVALID",
  })}\n`);
  process.exitCode = 1;
});
