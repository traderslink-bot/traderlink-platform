import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { openPlatformDatabase } from "../database/open-platform-database";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformDiscordSignInService } from "./platform-discord-sign-in-service";
import {
  deriveJournalAccountSelectionRef,
} from "../../contracts/journal-account-selection";
import { TRADERLINK_PLATFORM_SESSION_COOKIE } from "./platform-session-service";
import {
  requireExpectedJournalAccountSelection,
  requireTraderLinkPlatformRequestIdentity,
} from "./require-platform-request-scope";

const roots: string[] = [];
const SUBJECT = "123456789012345678";
const GUILD = "987654321098765432";

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("unified Platform request scope", () => {
  it("resolves a hosted session to one stable workspace and selected account", () => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-platform-request-"));
    roots.push(root);
    const databasePath = join(root, "test.sqlite");
    const database = openPlatformDatabase({
      mode: "initializer",
      databasePath,
      forbiddenRepositoryRoots: [],
    });
    let token: string;
    let expectedUserId: string;
    try {
      runPlatformMigrations(database, {
        now: () => new Date("2026-08-02T12:00:00.000Z"),
      });
      const signIn = new PlatformDiscordSignInService(database, {
        now: () => new Date("2026-08-02T12:10:00.000Z"),
      }).signIn({
        authSubject: SUBJECT,
        username: "trader",
        globalDisplayName: "Trader",
        avatarHash: null,
        guildId: GUILD,
        roleIds: ["5", "2"],
        guildOwner: false,
        joinedAtUtc: null,
      });
      token = signIn.session.token;
      expectedUserId = signIn.userId;
    } finally {
      database.close();
    }

    const headers = new Headers({
      cookie: `${TRADERLINK_PLATFORM_SESSION_COOKIE}=${token}`,
      host: "dashboard.traderslink.pro",
    });
    const identity = requireTraderLinkPlatformRequestIdentity(headers, {
      environment: {
        NODE_ENV: "production",
        DISCORD_GUILD_ID: GUILD,
      },
      databasePath,
      forbiddenRepositoryRoots: [],
      now: () => new Date("2026-08-02T12:20:00.000Z"),
    });
    expect(identity).toMatchObject({
      mode: "platform_session",
      displayName: "Trader",
      scope: { userId: expectedUserId, workspaceRole: "owner" },
      discord: { guildOwner: false, roleIds: ["2", "5"] },
    });
    expect(identity.scope.allowedAccountIds).toHaveLength(1);
    expect(identity.scope.activeAccountId).toBe(identity.scope.allowedAccountIds[0]);
    expect(JSON.stringify(identity)).not.toContain(SUBJECT);
  });

  it("fails closed for missing or duplicate hosted cookies", () => {
    const environment: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      DISCORD_GUILD_ID: GUILD,
    };
    expect(() => requireTraderLinkPlatformRequestIdentity(new Headers(), {
      environment,
      databasePath: join(tmpdir(), "missing-platform.sqlite"),
      forbiddenRepositoryRoots: [],
    })).toThrowError("TRADERLINK_WORKSPACE_ACCESS_DENIED");
    expect(() => requireTraderLinkPlatformRequestIdentity(new Headers({
      cookie: `${TRADERLINK_PLATFORM_SESSION_COOKIE}=one; ${TRADERLINK_PLATFORM_SESSION_COOKIE}=two`,
    }), {
      environment,
      databasePath: join(tmpdir(), "missing-platform.sqlite"),
      forbiddenRepositoryRoots: [],
    })).toThrowError("TRADERLINK_AUTH_SESSION_INVALID");
  });

  it("recovers a well-formed stale browser selection for a hosted page scope without relaxing mutation selection checks", () => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-platform-request-"));
    roots.push(root);
    const databasePath = join(root, "test.sqlite");
    const database = openPlatformDatabase({
      mode: "initializer",
      databasePath,
      forbiddenRepositoryRoots: [],
    });
    let token: string;
    let workspaceId: string;
    try {
      runPlatformMigrations(database, {
        now: () => new Date("2026-08-02T12:00:00.000Z"),
      });
      const signIn = new PlatformDiscordSignInService(database, {
        now: () => new Date("2026-08-02T12:10:00.000Z"),
      }).signIn({
        authSubject: SUBJECT,
        username: "trader",
        globalDisplayName: "Trader",
        avatarHash: null,
        guildId: GUILD,
        roleIds: ["5", "2"],
        guildOwner: false,
        joinedAtUtc: null,
      });
      token = signIn.session.token;
      workspaceId = signIn.workspaceId;
    } finally {
      database.close();
    }

    const staleSelectionRef = deriveJournalAccountSelectionRef(
      workspaceId!,
      "44444444-4444-4444-8444-444444444444",
    );
    const identity = requireTraderLinkPlatformRequestIdentity(new Headers({
      cookie: [
        `${TRADERLINK_PLATFORM_SESSION_COOKIE}=${token!}`,
        `traderlink_journal_account=${staleSelectionRef}`,
      ].join("; "),
      host: "dashboard.traderslink.pro",
    }), {
      environment: {
        NODE_ENV: "production",
        DISCORD_GUILD_ID: GUILD,
      },
      databasePath,
      forbiddenRepositoryRoots: [],
      now: () => new Date("2026-08-02T12:20:00.000Z"),
    });

    expect(identity.scope.activeAccountId).toBe(identity.scope.allowedAccountIds[0]);
    expect(() => requireExpectedJournalAccountSelection(
      identity.scope,
      staleSelectionRef,
    )).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    expect(() => requireTraderLinkPlatformRequestIdentity(new Headers({
      cookie: [
        `${TRADERLINK_PLATFORM_SESSION_COOKIE}=${token!}`,
        `traderlink_journal_account=${staleSelectionRef.toUpperCase()}`,
      ].join("; "),
      host: "dashboard.traderslink.pro",
    }), {
      environment: {
        NODE_ENV: "production",
        DISCORD_GUILD_ID: GUILD,
      },
      databasePath,
      forbiddenRepositoryRoots: [],
      now: () => new Date("2026-08-02T12:20:00.000Z"),
    })).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  });
});
