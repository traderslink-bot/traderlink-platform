import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { openPlatformDatabase } from "../database/open-platform-database";
import { platformMigrationManifest } from "../database/platform-migration-manifest";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformUserRepository } from "../identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "../identity/platform-workspace-repository";
import { PlatformDiscordMembershipRepository } from "./platform-discord-membership-repository";
import { PlatformDiscordSignInService } from "./platform-discord-sign-in-service";

const roots: string[] = [];
const IDS = [
  "10000000-0000-4000-8000-000000000001",
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
  "10000000-0000-4000-8000-000000000004",
  "10000000-0000-4000-8000-000000000005",
  "10000000-0000-4000-8000-000000000006",
  "10000000-0000-4000-8000-000000000007",
  "10000000-0000-4000-8000-000000000008",
] as const;
const TOKEN_ONE = "A".repeat(43);
const TOKEN_TWO = "B".repeat(43);

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function databaseForTest() {
  const root = mkdtempSync(join(tmpdir(), "traderlink-discord-sign-in-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "test.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, {
    manifest: platformMigrationManifest,
    now: () => new Date("2026-08-02T12:00:00.000Z"),
  });
  return database;
}

const facts = Object.freeze({
  authSubject: "123456789012345678",
  username: "trader",
  globalDisplayName: "Trader",
  avatarHash: "avatar_123",
  guildId: "987654321098765432",
  roleIds: Object.freeze(["200", "3", "10", "3"]),
  guildOwner: false,
  joinedAtUtc: "2026-08-01T10:11:12.123456Z",
});

describe("PlatformDiscordSignInService", () => {
  it("atomically provisions one user, workspace, journal account and hashed session", () => {
    const database = databaseForTest();
    try {
      let idIndex = 0;
      const result = new PlatformDiscordSignInService(database, {
        now: () => new Date("2026-08-02T12:30:00.000Z"),
        createId: () => IDS[idIndex++] as string,
        createToken: () => TOKEN_ONE,
      }).signIn(facts);

      expect(result).toMatchObject({
        userId: IDS[0],
        workspaceId: IDS[1],
        displayName: "Trader",
        provisioned: true,
      });
      expect(result.allowedAccountIds).toEqual([IDS[2]]);
      expect(result.session.token).toBe(TOKEN_ONE);
      expect(database.prepare("SELECT COUNT(*) AS count FROM platform_users").get())
        .toEqual({ count: 1 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM platform_workspaces").get())
        .toEqual({ count: 1 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_accounts").get())
        .toEqual({ count: 1 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM platform_auth_sessions").get())
        .toEqual({ count: 1 });
      expect(
        database.prepare("SELECT token_sha256 FROM platform_auth_sessions").get(),
      ).not.toEqual({ token_sha256: TOKEN_ONE });
      expect(
        new PlatformDiscordMembershipRepository(database)
          .findCurrent(IDS[0], facts.guildId)?.roleIds,
      ).toEqual(["3", "10", "200"]);
    } finally {
      database.close();
    }
  });

  it("reuses the exact user and never claims the seeded development owner", () => {
    const database = databaseForTest();
    try {
      const timestamp = "2026-08-02T12:00:00.000Z";
      new PlatformUserRepository(database, {
        allowedAuthProviders: ["development_local"],
      }).createUser({
        userId: IDS[0],
        authProvider: "development_local",
        authSubject: "initial_owner",
        displayName: "Development Owner",
        createdAtUtc: timestamp,
        updatedAtUtc: timestamp,
      });
      new PlatformWorkspaceRepository(database).createWorkspaceWithOwner({
        workspaceId: IDS[1],
        ownerUserId: IDS[0],
        displayName: "Development Workspace",
        defaultTradingTimezone: "America/New_York",
        createdAtUtc: timestamp,
      });
      new JournalAccountRepository(database).createAccount({
        accountId: IDS[2],
        workspaceId: IDS[1],
        displayName: "Development Journal",
        baseCurrency: "USD",
        tradingTimezone: "America/New_York",
        status: "active",
        createdByUserId: IDS[0],
        createdAtUtc: timestamp,
        updatedAtUtc: timestamp,
      });

      let idIndex = 3;
      let tokenIndex = 0;
      const service = new PlatformDiscordSignInService(database, {
        now: () => new Date("2026-08-02T12:30:00.000Z"),
        createId: () => IDS[idIndex++] as string,
        createToken: () => [TOKEN_ONE, TOKEN_TWO][tokenIndex++] as string,
      });
      const first = service.signIn(facts);
      const second = service.signIn({ ...facts, globalDisplayName: "Current Trader" });

      expect(first.provisioned).toBe(true);
      expect(first.userId).toBe(IDS[3]);
      expect(first.userId).not.toBe(IDS[0]);
      expect(second.provisioned).toBe(false);
      expect(second.userId).toBe(first.userId);
      expect(second.workspaceId).toBe(first.workspaceId);
      expect(database.prepare("SELECT COUNT(*) AS count FROM platform_users").get())
        .toEqual({ count: 2 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM platform_auth_sessions").get())
        .toEqual({ count: 2 });
    } finally {
      database.close();
    }
  });
});
