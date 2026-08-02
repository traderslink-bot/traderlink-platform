import { createHash, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type Database from "better-sqlite3";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { PlatformAuthenticationRepository } from "../authentication/platform-authentication-repository";
import type { PlatformDatabaseBackupEvidence } from "../database/platform-database-backup";
import { platformMigrationManifest } from "../database/platform-migration-manifest";
import {
  createCanonicalUtcTimestamp,
  isLowercaseSha256,
  platformFailure,
} from "../database/platform-migration-contract";
import { withPlatformDatabase } from "../database/open-platform-database";
import { withReadonlyPlatformDatabase } from "../database/open-readonly-platform-database";
import { calculatePlatformSchemaDigest } from "../database/platform-schema-digest";
import { readAppliedPlatformMigrations } from "../database/platform-migration-registry";
import {
  DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
  DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT,
} from "./development-owner-seed-authorization";

const PREVIEW_VERSION = "initial-owner-discord-link-v1";
const DISCORD_SNOWFLAKE_PATTERN = /^[0-9]{1,32}$/u;
const DEFAULT_BACKUP_FRESHNESS_MS = 15 * 60 * 1_000;

type SeededOwnerRow = Readonly<{
  user_id: string;
  workspace_id: string;
}>;

type CountRow = Readonly<{ count: number }>;

type PrivatePreviewFacts = Readonly<{
  databaseFileSha256: string;
  schemaSha256: string;
  migrationCount: number;
  finalMigrationId: string;
  ownerUserId: string;
  ownerWorkspaceId: string;
  activeAccountIds: readonly string[];
  authSubject: string;
}>;

export type InitialOwnerDiscordLinkPreview = Readonly<{
  status: "ready_to_link";
  previewDigest: string;
  databaseFileSha256: string;
  schemaSha256: string;
  migrationCount: number;
  ownerWorkspaceCount: 1;
  ownerAccountCount: number;
  ownerDiscordIdentityCount: 0;
  targetDiscordIdentityCount: 0;
}>;

export type InitialOwnerDiscordLinkResult = Readonly<{
  status: "linked";
  previewDigest: string;
  linkedAtUtc: string;
  ownerDiscordIdentityCount: 1;
  backupFileSha256: string;
  restoreFileSha256: string;
}>;

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function digestFacts(facts: PrivatePreviewFacts): string {
  return createHash("sha256")
    .update(`${JSON.stringify([
      PREVIEW_VERSION,
      facts.databaseFileSha256,
      facts.schemaSha256,
      facts.migrationCount,
      facts.finalMigrationId,
      facts.ownerUserId,
      facts.ownerWorkspaceId,
      facts.activeAccountIds,
      facts.authSubject,
    ])}\n`, "utf8")
    .digest("hex");
}

function sameDigest(left: string, right: string): boolean {
  return isLowercaseSha256(left) &&
    isLowercaseSha256(right) &&
    timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function count(
  database: Database.Database,
  sql: string,
  parameters: readonly unknown[] = [],
): number {
  const row = database.prepare(sql).get(...parameters) as CountRow | undefined;
  return row?.count ?? -1;
}

function readPrivatePreviewFacts(
  database: Database.Database,
  databasePath: string,
  authSubject: string,
): PrivatePreviewFacts {
  if (!DISCORD_SNOWFLAKE_PATTERN.test(authSubject)) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_PRECONDITION_FAILED", {
      check: "discord_subject",
    });
  }
  const owners = database.prepare<[string, string], SeededOwnerRow>(`SELECT
  user.user_id, membership.workspace_id
FROM platform_users user
JOIN platform_workspace_memberships membership
  ON membership.user_id = user.user_id
JOIN platform_workspaces workspace
  ON workspace.workspace_id = membership.workspace_id
WHERE user.auth_provider = ? AND user.auth_subject = ?
  AND user.status = 'active'
  AND membership.role = 'owner' AND membership.status = 'active'
  AND workspace.status = 'active'
ORDER BY user.user_id, membership.workspace_id`)
    .all(DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER, DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT);
  if (owners.length !== 1 || !owners[0]) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_PRECONDITION_FAILED", {
      check: "seeded_owner_cardinality",
    });
  }
  const owner = owners[0];
  const ownerDiscordIdentityCount = count(
    database,
    `SELECT COUNT(*) AS count FROM platform_auth_identities
WHERE user_id = ? AND auth_provider = 'discord'`,
    [owner.user_id],
  );
  const targetDiscordIdentityCount = count(
    database,
    `SELECT COUNT(*) AS count FROM platform_auth_identities
WHERE auth_provider = 'discord' AND auth_subject = ?`,
    [authSubject],
  );
  if (ownerDiscordIdentityCount !== 0 || targetDiscordIdentityCount !== 0) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_PRECONDITION_FAILED", {
      check: "discord_identity_unlinked",
    });
  }
  const activeAccountIds = new JournalAccountRepository(database)
    .listActiveAccounts(owner.workspace_id)
    .map((account) => account.accountId);
  if (activeAccountIds.length < 1) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_PRECONDITION_FAILED", {
      check: "owner_account_cardinality",
    });
  }
  const migrationRows = readAppliedPlatformMigrations(database);
  const finalMigrationId = platformMigrationManifest.at(-1)?.migrationId;
  if (
    migrationRows.length !== platformMigrationManifest.length ||
    !finalMigrationId ||
    migrationRows.at(-1)?.migration_id !== finalMigrationId
  ) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_PRECONDITION_FAILED", {
      check: "migration_boundary",
    });
  }
  return Object.freeze({
    databaseFileSha256: sha256File(databasePath),
    schemaSha256: calculatePlatformSchemaDigest(database),
    migrationCount: migrationRows.length,
    finalMigrationId,
    ownerUserId: owner.user_id,
    ownerWorkspaceId: owner.workspace_id,
    activeAccountIds: Object.freeze(activeAccountIds),
    authSubject,
  });
}

export function previewInitialOwnerDiscordLink(options: Readonly<{
  databasePath: string;
  authSubject: string;
  forbiddenRepositoryRoots?: readonly string[];
}>): InitialOwnerDiscordLinkPreview {
  return withReadonlyPlatformDatabase(options, (database) => {
    const facts = readPrivatePreviewFacts(
      database,
      options.databasePath,
      options.authSubject,
    );
    return Object.freeze({
      status: "ready_to_link" as const,
      previewDigest: digestFacts(facts),
      databaseFileSha256: facts.databaseFileSha256,
      schemaSha256: facts.schemaSha256,
      migrationCount: facts.migrationCount,
      ownerWorkspaceCount: 1 as const,
      ownerAccountCount: facts.activeAccountIds.length,
      ownerDiscordIdentityCount: 0 as const,
      targetDiscordIdentityCount: 0 as const,
    });
  });
}

function requireFreshMatchingBackup(
  preview: InitialOwnerDiscordLinkPreview,
  evidence: PlatformDatabaseBackupEvidence,
  databasePath: string,
  now: Date,
  maximumAgeMs: number,
): void {
  const completedAt = Date.parse(evidence.completedAtUtc);
  const ageMs = now.getTime() - completedAt;
  if (
    !Number.isSafeInteger(maximumAgeMs) ||
    maximumAgeMs <= 0 ||
    !Number.isFinite(completedAt) ||
    ageMs < -60_000 ||
    ageMs > maximumAgeMs ||
    resolve(evidence.source.path).toLowerCase() !== resolve(databasePath).toLowerCase() ||
    evidence.source.fileSha256 !== preview.databaseFileSha256 ||
    evidence.source.actualSchemaSha256 !== preview.schemaSha256 ||
    evidence.source.migrationRows.length !== preview.migrationCount ||
    evidence.source.sidecars.wal.sizeBytes !== 0 ||
    evidence.exactRegistryMatch !== true ||
    evidence.exactTableCountsMatch !== true ||
    evidence.pageGeometryMatch !== true ||
    evidence.backupRestoreFileIdentityMatch !== true ||
    evidence.backup.fileSha256 !== evidence.restored.fileSha256
  ) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_PRECONDITION_FAILED", {
      check: "fresh_backup_restore_evidence",
    });
  }
}

export function executeInitialOwnerDiscordLink(options: Readonly<{
  databasePath: string;
  authSubject: string;
  expectedPreviewDigest: string;
  authorization: Readonly<{
    operation: "link_initial_owner_discord_identity";
    authorized: true;
  }>;
  backupEvidence: PlatformDatabaseBackupEvidence;
  forbiddenRepositoryRoots?: readonly string[];
  now?: () => Date;
  maximumBackupAgeMs?: number;
}>): InitialOwnerDiscordLinkResult {
  if (
    options.authorization.operation !== "link_initial_owner_discord_identity" ||
    options.authorization.authorized !== true
  ) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_CONFIRMATION_INVALID");
  }
  const preview = previewInitialOwnerDiscordLink(options);
  if (!sameDigest(preview.previewDigest, options.expectedPreviewDigest)) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_CONFIRMATION_INVALID");
  }
  const now = options.now?.() ?? new Date();
  requireFreshMatchingBackup(
    preview,
    options.backupEvidence,
    options.databasePath,
    now,
    options.maximumBackupAgeMs ?? DEFAULT_BACKUP_FRESHNESS_MS,
  );
  const linkedAtUtc = createCanonicalUtcTimestamp(now);
  withPlatformDatabase(
    {
      mode: "runtime",
      databasePath: options.databasePath,
      forbiddenRepositoryRoots: options.forbiddenRepositoryRoots,
    },
    (database) => {
      database.transaction(() => {
        const locked = readPrivatePreviewFacts(
          database,
          options.databasePath,
          options.authSubject,
        );
        if (!sameDigest(digestFacts(locked), options.expectedPreviewDigest)) {
          platformFailure("TRADERLINK_INITIAL_OWNER_LINK_CONFIRMATION_INVALID");
        }
        new PlatformAuthenticationRepository(database).linkIdentity({
          userId: locked.ownerUserId,
          authProvider: "discord",
          authSubject: options.authSubject,
          linkedByUserId: locked.ownerUserId,
          timestamp: linkedAtUtc,
        });
      }).immediate();
    },
  );
  return Object.freeze({
    status: "linked" as const,
    previewDigest: options.expectedPreviewDigest,
    linkedAtUtc,
    ownerDiscordIdentityCount: 1 as const,
    backupFileSha256: options.backupEvidence.backup.fileSha256,
    restoreFileSha256: options.backupEvidence.restored.fileSha256,
  });
}
