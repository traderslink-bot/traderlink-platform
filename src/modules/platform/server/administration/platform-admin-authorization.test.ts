import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { TraderLinkPlatformRequestIdentity } from "../authentication/require-platform-request-scope";
import { PlatformDiscordSignInService } from "../authentication/platform-discord-sign-in-service";
import { openPlatformDatabase } from "../database/open-platform-database";
import { createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformAdminAuthorization } from "./platform-admin-authorization";
import { PlatformOperatorRepository } from "./platform-operator-repository";
import { resetJournalAdminRateLimitsForTests } from "./platform-admin-request-security";

const roots: string[] = [];
const GUILD_ID = "987654321098765432";
const SUBJECT = "123456789012345678";
const RATE_SECRET = "journal-admin-authorization-test-secret";
const SIGN_IN_AT = new Date("2026-08-03T07:00:00.000Z");

afterEach(() => {
  resetJournalAdminRateLimitsForTests();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup(guildOwner = true) {
  const root = mkdtempSync(join(tmpdir(), "traderlink-admin-auth-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "test.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => SIGN_IN_AT });
  const signIn = new PlatformDiscordSignInService(database, {
    now: () => SIGN_IN_AT,
  }).signIn({
    authSubject: SUBJECT,
    username: "owner",
    globalDisplayName: "Owner",
    avatarHash: null,
    guildId: GUILD_ID,
    roleIds: [],
    guildOwner,
    joinedAtUtc: null,
  });
  const identity: TraderLinkPlatformRequestIdentity = Object.freeze({
    mode: "platform_session" as const,
    scope: Object.freeze({
      userId: signIn.userId,
      workspaceId: signIn.workspaceId,
      workspaceRole: "owner" as const,
      allowedAccountIds: signIn.allowedAccountIds,
      activeAccountId: signIn.allowedAccountIds[0] ?? null,
    }),
    displayName: signIn.displayName,
    discord: Object.freeze({ guildOwner, roleIds: Object.freeze([]) }),
  });
  return { database, identity, userId: signIn.userId };
}

function productionEnvironment(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    DISCORD_GUILD_ID: GUILD_ID,
    TRADERLINK_PLATFORM_ADMIN_RATE_LIMIT_SECRET: RATE_SECRET,
  };
}

function productionHeaders(): Headers {
  return new Headers({
    host: "dashboard.traderslink.pro",
    "x-real-ip": "203.0.113.10",
  });
}

function grant(database: ReturnType<typeof openPlatformDatabase>, userId: string) {
  return new PlatformOperatorRepository(database).insert({
    operatorGrantId: createCanonicalUuidV4(),
    userId,
    grantedByKind: "bootstrap_console",
    grantedByUserId: null,
    grantReceiptSha256: createHash("sha256").update("grant").digest("hex"),
    recoveryOfGrantId: null,
    grantedAtUtc: "2026-08-03T07:01:00.000Z",
  });
}

describe("Journal admin authorization", () => {
  it("requires the same fresh Discord owner and singleton operator grant", () => {
    const { database, identity, userId } = setup();
    try {
      grant(database, userId);
      const scope = new PlatformAdminAuthorization(
        database,
        productionEnvironment(),
        () => new Date("2026-08-03T07:04:59.000Z"),
      ).authorize(identity, productionHeaders());
      expect(scope).toMatchObject({
        userId,
        role: "journal_owner_admin",
        mode: "production_discord_owner",
      });
      expect(scope.permissions).toContain("download_consented_sources");
      expect(database.prepare("SELECT COUNT(*) AS count FROM platform_admin_audit_events WHERE action = 'admin_access_allowed'").get()).toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  it("fails without a grant, with stale membership, or without current guild ownership", () => {
    for (const variant of ["missing_grant", "stale", "not_owner"] as const) {
      const { database, identity, userId } = setup(variant !== "not_owner");
      try {
        if (variant !== "missing_grant") grant(database, userId);
        const now = variant === "stale"
          ? new Date("2026-08-03T07:05:00.001Z")
          : new Date("2026-08-03T07:04:00.000Z");
        expect(() => new PlatformAdminAuthorization(
          database,
          productionEnvironment(),
          () => now,
        ).authorize(identity, productionHeaders()))
          .toThrowError("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
        expect(database.prepare("SELECT COUNT(*) AS count FROM platform_admin_audit_events WHERE action = 'admin_access_denied'").get()).toEqual({ count: 1 });
      } finally {
        database.close();
      }
    }
  });

  it("revalidates the exact protected loopback boundary for local review", () => {
    const { database, identity } = setup();
    const token = "a".repeat(43);
    const environment: NodeJS.ProcessEnv = {
      NODE_ENV: "development",
      TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD: "true",
      TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME: "1",
      TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN: token,
    };
    const localIdentity = Object.freeze({ ...identity, mode: "local_development" as const });
    const headers = new Headers({
      host: "127.0.0.1:3010",
      "x-forwarded-host": "127.0.0.1:3010",
      "x-forwarded-for": "127.0.0.1",
      "x-forwarded-proto": "http",
      "x-forwarded-port": "3010",
      "x-traderlink-platform-local-dashboard": token,
    });
    try {
      expect(new PlatformAdminAuthorization(
        database,
        environment,
        () => new Date("2026-08-03T07:04:00.000Z"),
      ).authorize(localIdentity, headers)).toMatchObject({
        role: "development_journal_owner_admin",
        mode: "local_development_owner",
      });
      headers.set("host", "example.com");
      expect(() => new PlatformAdminAuthorization(
        database,
        environment,
        () => new Date("2026-08-03T07:04:01.000Z"),
      ).authorize(localIdentity, headers))
        .toThrowError("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    } finally {
      database.close();
    }
  });
});
