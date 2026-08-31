import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

import { IBKR_SOURCE_ACCOUNT_CANONICALIZERS } from "@/src/modules/journal/server/accounts/ibkr-source-account-canonicalizer";
import {
  executePlatformOperatorChange,
  type PlatformOperatorOperation,
  previewPlatformOperatorChange,
} from "@/src/modules/platform/server/administration/platform-operator-service";
import { createAndRestoreVerifyPlatformDatabaseBackup } from "@/src/modules/platform/server/database/platform-database-backup";
import {
  ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
  isPathWithinRoot,
  resolvePlatformDatabaseConfig,
} from "@/src/modules/platform/server/database/platform-database-config";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { readProtectedInitialOwnerDiscordSubject } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

const AUTHORITY_PATH_ENV = "TRADERLINK_PLATFORM_JOURNAL_AUTHORITY_PATH";

type AuthoritySection = Readonly<{
  activeKeyVersion: string;
  keysBase64: Readonly<Record<string, string>>;
}>;

function argument(name: string): string {
  const prefix = `--${name}=`;
  const values = process.argv.slice(2).filter((value) => value.startsWith(prefix));
  if (values.length !== 1 || !values[0]) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  const value = values[0].slice(prefix.length);
  if (!value || value.trim() !== value) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  return value;
}

function optionalArgument(name: string): string | null {
  const prefix = `--${name}=`;
  const values = process.argv.slice(2).filter((value) => value.startsWith(prefix));
  if (values.length > 1) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  if (values.length === 0) return null;
  const value = values[0]!.slice(prefix.length);
  if (!value || value.trim() !== value) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  return value;
}

function operation(): PlatformOperatorOperation {
  const value = argument("operation");
  if (value !== "grant" && value !== "recover" && value !== "revoke") {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  return value;
}

function requireExactArgumentSet(mode: "preview" | "execute"): void {
  const allowedFlags = new Set([`--${mode}`]);
  const allowedNames = mode === "preview"
    ? ["operation", "target-user-id", "target"]
    : [
        "operation",
        "target-user-id",
        "target",
        "expected-preview-digest",
        "confirm",
      ];
  const allowedPrefixes = allowedNames.map((name) => `--${name}=`);
  if (process.argv.slice(2).some((value) =>
    !allowedFlags.has(value) &&
    !allowedPrefixes.some((prefix) => value.startsWith(prefix)))) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
}

function configuredInitialOwnerUserId(databasePath: string): string {
  const subject = readProtectedInitialOwnerDiscordSubject();
  if (!subject) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  return withReadonlyPlatformDatabase({ databasePath }, (database) => {
    const rows = database.prepare<[string], Readonly<{ user_id: string }>>(`SELECT user.user_id
FROM platform_users user
JOIN platform_auth_identities identity
  ON identity.user_id = user.user_id
WHERE user.status = 'active'
  AND identity.auth_provider = 'discord'
  AND identity.auth_subject = ?
  AND identity.status = 'active'
ORDER BY user.user_id`).all(subject);
    if (rows.length !== 1 || !rows[0]) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    }
    return rows[0].user_id;
  });
}

function targetUserId(
  databasePath: string,
  requestedOperation: PlatformOperatorOperation,
): string {
  const direct = optionalArgument("target-user-id");
  const target = optionalArgument("target");
  if ((direct === null) === (target === null)) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  if (direct !== null) return direct;
  if (target !== "configured-initial-owner" || requestedOperation !== "grant") {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  return configuredInitialOwnerUserId(databasePath);
}

function authoritySection(value: unknown): AuthoritySection {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.activeKeyVersion !== "string" ||
    !record.keysBase64 ||
    typeof record.keysBase64 !== "object" ||
    Array.isArray(record.keysBase64)
  ) platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  const keys = Object.freeze(Object.fromEntries(
    Object.entries(record.keysBase64).map(([version, encoded]) => {
      if (typeof encoded !== "string") {
        platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
      }
      const decoded = Buffer.from(encoded, "base64");
      if (decoded.length < 32 || decoded.toString("base64") !== encoded) {
        platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
      }
      return [version, encoded];
    }),
  ));
  if (!(record.activeKeyVersion in keys)) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  return Object.freeze({
    activeKeyVersion: record.activeKeyVersion,
    keysBase64: keys,
  });
}

function loadRecoveryAuthority(): AuthoritySection {
  const configured = process.env[AUTHORITY_PATH_ENV];
  if (!configured || !isAbsolute(configured)) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  const path = resolve(configured);
  if (
    !existsSync(path) ||
    lstatSync(path).isSymbolicLink() ||
    !lstatSync(path).isFile() ||
    realpathSync(path) !== path ||
    isPathWithinRoot(path, ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT)
  ) platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED", {}, error);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  const value = parsed as Record<string, unknown>;
  const accountIdentity = authoritySection(value.accountIdentity);
  authoritySection(value.journalPrivacy);
  return accountIdentity;
}

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const previewMode = arguments_.includes("--preview");
  const executeMode = arguments_.includes("--execute");
  if (previewMode === executeMode) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
  }
  requireExactArgumentSet(previewMode ? "preview" : "execute");
  const databasePath = resolvePlatformDatabaseConfig().databasePath;
  const requestedOperation = operation();
  const resolvedTargetUserId = targetUserId(databasePath, requestedOperation);
  const preview = previewPlatformOperatorChange({
    databasePath,
    operation: requestedOperation,
    targetUserId: resolvedTargetUserId,
  });
  if (previewMode) {
    process.stdout.write(`${JSON.stringify(preview, null, 2)}\n`);
    return;
  }

  const accountIdentity = loadRecoveryAuthority();
  const timestamp = new Date().toISOString().replaceAll(/[-:.]/gu, "");
  const backupRoot = join(
    dirname(databasePath),
    "backups",
    "journal-admin-operator",
    timestamp,
  );
  const evidence = await createAndRestoreVerifyPlatformDatabaseBackup({
    sourcePath: databasePath,
    backupPath: join(backupRoot, "backup.sqlite"),
    restoreVerificationPath: join(backupRoot, "restore-verification.sqlite"),
    verifyRecoveryAuthority(requirements) {
      if (
        !requirements.hmacKeyVersions.every((version) =>
          version in accountIdentity.keysBase64) ||
        !requirements.sourceAccountCanonicalizationVersions.every((version) =>
          version in IBKR_SOURCE_ACCOUNT_CANONICALIZERS)
      ) platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
      return Object.freeze({
        verified: true as const,
        hmacKeyVersions: requirements.hmacKeyVersions,
        sourceAccountCanonicalizationVersions:
          requirements.sourceAccountCanonicalizationVersions,
      });
    },
  });
  const result = executePlatformOperatorChange({
    databasePath,
    operation: requestedOperation,
    targetUserId: resolvedTargetUserId,
    expectedPreviewDigest: argument("expected-preview-digest"),
    confirmationText: argument("confirm"),
    backupEvidence: evidence,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${JSON.stringify({
    status: "failed",
    code: error instanceof Error
      ? error.message
      : "TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID",
  })}\n`);
  process.exitCode = 1;
});
