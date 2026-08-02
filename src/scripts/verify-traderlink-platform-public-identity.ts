import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { PlatformAuthenticationRepository } from "@/src/modules/platform/server/authentication/platform-authentication-repository";
import { PlatformDiscordMembershipRepository } from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { PlatformSessionRepository } from "@/src/modules/platform/server/authentication/platform-session-repository";
import { PlatformSessionService } from "@/src/modules/platform/server/authentication/platform-session-service";
import {
  executeInitialOwnerDiscordLink,
  previewInitialOwnerDiscordLink,
} from "@/src/modules/platform/server/bootstrap/link-initial-owner-discord-identity";
import { createAndRestoreVerifyPlatformDatabaseBackup } from "@/src/modules/platform/server/database/platform-database-backup";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";

const USER_ID = "10000000-0000-4000-8000-000000000001";
const WORKSPACE_ID = "10000000-0000-4000-8000-000000000002";
const ACCOUNT_ID = "10000000-0000-4000-8000-000000000003";
const SESSION_ID = "10000000-0000-4000-8000-000000000004";
const SUBJECT = "123456789012345678";
const GUILD = "987654321098765432";
const TOKEN = "P".repeat(43);
const NOW = new Date("2026-08-02T12:00:00.000Z");

function requireCondition(condition: unknown, check: string): asserts condition {
  if (!condition) throw new Error(`TRADERLINK_PUBLIC_IDENTITY_VERIFICATION_FAILED:${check}`);
}

async function main(): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), "traderlink-public-identity-"));
  const databasePath = join(root, "platform.sqlite");
  try {
    const seedDatabase = openPlatformDatabase({
      mode: "initializer",
      databasePath,
      forbiddenRepositoryRoots: [],
    });
    try {
      runPlatformMigrations(seedDatabase, { now: () => NOW });
      new PlatformUserRepository(seedDatabase, {
        allowedAuthProviders: ["development_local"],
      }).createUser({
        userId: USER_ID,
        authProvider: "development_local",
        authSubject: "initial_owner",
        displayName: "Owner",
        createdAtUtc: NOW.toISOString(),
        updatedAtUtc: NOW.toISOString(),
      });
      new PlatformWorkspaceRepository(seedDatabase).createWorkspaceWithOwner({
        workspaceId: WORKSPACE_ID,
        ownerUserId: USER_ID,
        displayName: "Workspace",
        defaultTradingTimezone: "America/New_York",
        createdAtUtc: NOW.toISOString(),
      });
      new JournalAccountRepository(seedDatabase).createAccount({
        accountId: ACCOUNT_ID,
        workspaceId: WORKSPACE_ID,
        displayName: "Primary Journal",
        baseCurrency: "USD",
        tradingTimezone: "America/New_York",
        status: "active",
        createdByUserId: USER_ID,
        createdAtUtc: NOW.toISOString(),
        updatedAtUtc: NOW.toISOString(),
      });
      let protectedBeforeLink = false;
      try {
        new PlatformDiscordSignInService(seedDatabase, {
          now: () => NOW,
          protectedInitialOwnerAuthSubject: SUBJECT,
        }).signIn({
          authSubject: SUBJECT,
          username: "owner",
          globalDisplayName: "Owner",
          avatarHash: null,
          guildId: GUILD,
          roleIds: ["200", "3", "10"],
          guildOwner: true,
          joinedAtUtc: null,
        });
      } catch (error) {
        protectedBeforeLink = error instanceof Error &&
          error.message === "TRADERLINK_INITIAL_OWNER_LINK_REQUIRED";
      }
      requireCondition(protectedBeforeLink, "ordinary_login_owner_claim_blocked");
    } finally {
      seedDatabase.close();
    }

    const preview = previewInitialOwnerDiscordLink({
      databasePath,
      authSubject: SUBJECT,
      forbiddenRepositoryRoots: [],
    });
    requireCondition(!JSON.stringify(preview).includes(SUBJECT), "preview_privacy");
    const backupEvidence = await createAndRestoreVerifyPlatformDatabaseBackup({
      sourcePath: databasePath,
      backupPath: join(root, "backup", "platform.sqlite"),
      restoreVerificationPath: join(root, "restore", "platform.sqlite"),
      forbiddenRepositoryRoots: [],
      now: () => NOW,
    });
    executeInitialOwnerDiscordLink({
      databasePath,
      authSubject: SUBJECT,
      expectedPreviewDigest: preview.previewDigest,
      authorization: {
        operation: "link_initial_owner_discord_identity",
        authorized: true,
      },
      backupEvidence,
      forbiddenRepositoryRoots: [],
      now: () => NOW,
    });

    const linkedDatabase = openPlatformDatabase({
      mode: "runtime",
      databasePath,
      forbiddenRepositoryRoots: [],
    });
    try {
      const signIn = new PlatformDiscordSignInService(linkedDatabase, {
        now: () => NOW,
        createId: () => SESSION_ID,
        createToken: () => TOKEN,
        protectedInitialOwnerAuthSubject: SUBJECT,
      }).signIn({
        authSubject: SUBJECT,
        username: "owner",
        globalDisplayName: "Owner",
        avatarHash: null,
        guildId: GUILD,
        roleIds: ["200", "3", "10", "3"],
        guildOwner: true,
        joinedAtUtc: null,
      });
      requireCondition(signIn.provisioned === false, "linked_owner_reused");
      requireCondition(signIn.userId === USER_ID, "stable_owner_user");
      requireCondition(signIn.workspaceId === WORKSPACE_ID, "stable_owner_workspace");
      requireCondition(
        signIn.allowedAccountIds.length === 1 &&
          signIn.allowedAccountIds[0] === ACCOUNT_ID,
        "stable_owner_accounts",
      );
      requireCondition(
        new PlatformAuthenticationRepository(linkedDatabase)
          .findActiveIdentity("discord", SUBJECT)?.userId === USER_ID,
        "discord_identity_link",
      );
      requireCondition(
        JSON.stringify(
          new PlatformDiscordMembershipRepository(linkedDatabase)
            .findCurrent(USER_ID, GUILD)?.roleIds,
        ) === JSON.stringify(["3", "10", "200"]),
        "canonical_roles",
      );
      const storedRaw = linkedDatabase.prepare<[string], { count: number }>(`SELECT COUNT(*) AS count
FROM platform_auth_sessions WHERE token_sha256 = ?`).get(TOKEN)?.count ?? -1;
      requireCondition(storedRaw === 0, "raw_session_not_stored");
      const sessions = new PlatformSessionService(
        new PlatformSessionRepository(linkedDatabase),
        { now: () => NOW },
      );
      requireCondition(sessions.resolve(TOKEN)?.userId === USER_ID, "session_resolves");
      requireCondition(sessions.revoke(TOKEN), "session_revokes");
      requireCondition(sessions.resolve(TOKEN) === null, "revoked_session_denied");
      const counts = linkedDatabase.prepare<[], {
        users: number;
        workspaces: number;
        accounts: number;
        identities: number;
        memberships: number;
        sessions: number;
      }>(`SELECT
  (SELECT COUNT(*) FROM platform_users) AS users,
  (SELECT COUNT(*) FROM platform_workspaces) AS workspaces,
  (SELECT COUNT(*) FROM journal_accounts) AS accounts,
  (SELECT COUNT(*) FROM platform_auth_identities) AS identities,
  (SELECT COUNT(*) FROM platform_discord_memberships) AS memberships,
  (SELECT COUNT(*) FROM platform_auth_sessions) AS sessions`).get();
      requireCondition(
        counts?.users === 1 && counts.workspaces === 1 && counts.accounts === 1 &&
          counts.identities === 1 && counts.memberships === 1 && counts.sessions === 1,
        "exact_cardinality",
      );
    } finally {
      linkedDatabase.close();
    }

    process.stdout.write(`${JSON.stringify({
      status: "ok",
      migrationCount: platformMigrationManifest.length,
      schemaSha256: preview.schemaSha256,
      backupRestoreIdentity: true,
      ordinaryLoginOwnerClaimBlocked: true,
      linkedOwnerReused: true,
      rawSessionStored: false,
      revokedSessionDenied: true,
      users: 1,
      workspaces: 1,
      journalAccounts: 1,
    })}\n`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

void main();
