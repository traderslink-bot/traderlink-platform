import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { PlatformAuthenticationRepository } from "../authentication/platform-authentication-repository";
import { createAndRestoreVerifyPlatformDatabaseBackup } from "../database/platform-database-backup";
import { openPlatformDatabase } from "../database/open-platform-database";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformUserRepository } from "../identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "../identity/platform-workspace-repository";
import {
  executeInitialOwnerDiscordLink,
  previewInitialOwnerDiscordLink,
} from "./link-initial-owner-discord-identity";

const roots: string[] = [];
const USER_ID = "10000000-0000-4000-8000-000000000001";
const WORKSPACE_ID = "10000000-0000-4000-8000-000000000002";
const ACCOUNT_ID = "10000000-0000-4000-8000-000000000003";
const SUBJECT = "123456789012345678";
const NOW = new Date("2026-08-02T12:00:00.000Z");

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function createSeededDatabase(): Readonly<{
  root: string;
  databasePath: string;
}> {
  const root = mkdtempSync(join(tmpdir(), "traderlink-owner-discord-link-"));
  roots.push(root);
  const databasePath = join(root, "development.sqlite");
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath,
    forbiddenRepositoryRoots: [],
  });
  try {
    runPlatformMigrations(database, { now: () => NOW });
    new PlatformUserRepository(database, {
      allowedAuthProviders: ["development_local"],
    }).createUser({
      userId: USER_ID,
      authProvider: "development_local",
      authSubject: "initial_owner",
      displayName: "Owner",
      createdAtUtc: NOW.toISOString(),
      updatedAtUtc: NOW.toISOString(),
    });
    new PlatformWorkspaceRepository(database).createWorkspaceWithOwner({
      workspaceId: WORKSPACE_ID,
      ownerUserId: USER_ID,
      displayName: "Workspace",
      defaultTradingTimezone: "America/New_York",
      createdAtUtc: NOW.toISOString(),
    });
    new JournalAccountRepository(database).createAccount({
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
  } finally {
    database.close();
  }
  return Object.freeze({ root, databasePath });
}

describe("initial owner Discord identity link", () => {
  it("requires the exact preview plus a fresh byte-verified backup", async () => {
    const { root, databasePath } = createSeededDatabase();
    const preview = previewInitialOwnerDiscordLink({
      databasePath,
      authSubject: SUBJECT,
      forbiddenRepositoryRoots: [],
    });
    expect(JSON.stringify(preview)).not.toContain(SUBJECT);
    const backupEvidence = await createAndRestoreVerifyPlatformDatabaseBackup({
      sourcePath: databasePath,
      backupPath: join(root, "backup", "source.sqlite"),
      restoreVerificationPath: join(root, "restore", "restored.sqlite"),
      forbiddenRepositoryRoots: [],
      now: () => NOW,
    });
    expect(() => executeInitialOwnerDiscordLink({
      databasePath,
      authSubject: SUBJECT,
      expectedPreviewDigest: "0".repeat(64),
      authorization: {
        operation: "link_initial_owner_discord_identity",
        authorized: true,
      },
      backupEvidence,
      forbiddenRepositoryRoots: [],
      now: () => NOW,
    })).toThrowError("TRADERLINK_INITIAL_OWNER_LINK_CONFIRMATION_INVALID");

    expect(executeInitialOwnerDiscordLink({
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
    })).toMatchObject({ status: "linked", ownerDiscordIdentityCount: 1 });

    const database = openPlatformDatabase({
      mode: "runtime",
      databasePath,
      forbiddenRepositoryRoots: [],
    });
    try {
      expect(
        new PlatformAuthenticationRepository(database)
          .findActiveIdentity("discord", SUBJECT)?.userId,
      ).toBe(USER_ID);
    } finally {
      database.close();
    }
    expect(() => previewInitialOwnerDiscordLink({
      databasePath,
      authSubject: SUBJECT,
      forbiddenRepositoryRoots: [],
    })).toThrowError("TRADERLINK_INITIAL_OWNER_LINK_PRECONDITION_FAILED");
  });
});
