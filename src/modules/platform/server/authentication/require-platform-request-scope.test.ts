import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { openPlatformDatabase } from "../database/open-platform-database";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformDiscordSignInService } from "./platform-discord-sign-in-service";
import { PlatformLoginService } from "./platform-login-service";
import { PlatformMembershipRepository } from "../membership/platform-membership-repository";
import {
  deriveJournalAccountSelectionRef,
} from "../../contracts/journal-account-selection";
import { deriveAuthenticatedUserJournalScope } from "./authenticated-user-journal-scope";
import { PlatformDiscordMembershipRepository } from "./platform-discord-membership-repository";
import { TRADERLINK_PLATFORM_SESSION_COOKIE } from "./platform-session-service";
import {
  requireExpectedJournalAccountSelection,
  requireTraderLinkPlatformRequestIdentity,
  requireTraderLinkPlatformBillingRequestIdentity,
} from "./require-platform-request-scope";

const roots: string[] = [];
const SUBJECT = "123456789012345678";
const GUILD = "987654321098765432";

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("unified Platform request scope", () => {
  it("resolves Google and email members without Discord and keeps their accounts separate", () => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-multi-provider-scope-"));
    roots.push(root);
    const databasePath = join(root, "test.sqlite");
    const database = openPlatformDatabase({ mode: "initializer", databasePath, forbiddenRepositoryRoots: [] });
    const now = new Date();
    const at = now.toISOString();
    try {
      runPlatformMigrations(database, { now: () => now });
      const service = new PlatformLoginService(database, { now: () => now });
      const google = service.signInOAuth({ provider: "google", subject: "synthetic-google-member", displayName: "Google trader" });
      const hash = "$argon2id$synthetic-service-test-proof";
      const verification = service.signup({ email: "member@example.test", displayName: "Email trader", passwordHash: hash })!;
      service.verifyEmail(verification);
      const email = service.signInEmail("member@example.test", hash);
      const options = {
        environment: { NODE_ENV: "production", DISCORD_GUILD_ID: GUILD } as NodeJS.ProcessEnv,
        databasePath, forbiddenRepositoryRoots: [], now: () => now,
      };
      const request = (token: string) => new Headers({
        cookie: `${TRADERLINK_PLATFORM_SESSION_COOKIE}=${token}`, host: "app.traderslink.pro",
      });
      const billing = requireTraderLinkPlatformBillingRequestIdentity(request(google.token), options);
      expect(billing.scope.userId).toBe(google.session.userId);
      expect(billing.discord).toBeNull();
      const developmentOptions = { ...options, environment: { ...options.environment,
        NODE_ENV: "development" as const, TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_SESSIONS: "true" } };
      expect(requireTraderLinkPlatformBillingRequestIdentity(request(google.token), developmentOptions).scope.userId).toBe(google.session.userId);
      expect(() => requireTraderLinkPlatformBillingRequestIdentity(new Headers(), developmentOptions)).toThrow();
      expect(() => requireTraderLinkPlatformBillingRequestIdentity(request(google.token), {
        ...developmentOptions, environment: { ...developmentOptions.environment, TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_SESSIONS: "false" },
      })).toThrow();
      expect(() => requireTraderLinkPlatformRequestIdentity(request(google.token), options)).toThrow();
      const memberships = new PlatformMembershipRepository(database);
      memberships.synchronizeBuiltInFeatures(google.session.userId, at);
      const plan = memberships.createPlan({ actorUserId: google.session.userId,
        planKey: "scope-journal", name: "Journal", visibility: "public", atUtc: at,
        features: [{ featureKey: "journal.access", limitValue: null }],
      });
      memberships.publishPlanVersion({ actorUserId: google.session.userId, planVersionId: plan.planVersionId, atUtc: at });
      const scopes = [google, email].map(member => {
        memberships.grantEntitlement({ actorUserId: google.session.userId, userId: member.session.userId,
          planVersionId: plan.planVersionId, sourceType: "free_plan", sourceRef: member.session.authProvider,
          startsAtUtc: at, endsAtUtc: null, atUtc: at,
        });
        const identity = requireTraderLinkPlatformRequestIdentity(request(member.token), options);
        expect(identity.mode).toBe("platform_session");
        expect(identity.scope.userId).toBe(member.session.userId);
        expect(identity.discord).toBeNull();
        expect(identity.scope.allowedAccountIds).toHaveLength(1);
        return identity.scope;
      });
      expect(scopes[0].workspaceId).not.toBe(scopes[1].workspaceId);
      expect(scopes[0].allowedAccountIds).not.toContain(scopes[1].activeAccountId);
    } finally {
      database.close();
    }
  }, 60000);
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
      database.prepare("UPDATE platform_dashboard_member_access_settings SET allow_all_discord_members=1 WHERE settings_key='member_dashboard_access'").run();
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
      database.prepare("UPDATE platform_dashboard_member_access_settings SET allow_all_discord_members=1 WHERE settings_key='member_dashboard_access'").run();
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

describe("security: effective membership and account authorization", () => {
  it("keeps historical Discord evidence but excludes absence and stale snapshots; members get no account authority", () => {
    const root = mkdtempSync(join(tmpdir(), "security-effective-scope-")); roots.push(root);
    const db = openPlatformDatabase({ mode: "initializer", databasePath: join(root, "test.sqlite"), forbiddenRepositoryRoots: [] });
    const at = new Date("2026-10-31T12:00:00.000Z");
    try {
      runPlatformMigrations(db, { now: () => at });
      const owner = new PlatformDiscordSignInService(db, { now: () => at }).signIn({ authSubject: SUBJECT, username: "owner", globalDisplayName: null, avatarHash: null, guildId: GUILD, roleIds: ["5"], guildOwner: true, joinedAtUtc: null });
      const memberships = new PlatformDiscordMembershipRepository(db);
      expect(memberships.findEffective(owner.userId, GUILD, at, 1000)).not.toBeNull();
      expect(memberships.findEffective(owner.userId, GUILD, new Date(at.getTime() + 1001), 1000)).toBeNull();
      db.prepare(`INSERT INTO platform_membership_audit_events(audit_event_id,subject_user_id,action,target_type,target_id,occurred_at_utc) VALUES ('synthetic-absence',?,'discord.membership.absent','discord_membership',?,?)`).run(owner.userId, GUILD, at.toISOString());
      expect(memberships.findCurrent(owner.userId, GUILD)).not.toBeNull();
      expect(memberships.findEffective(owner.userId, GUILD, at, 1000)).toBeNull();
      db.prepare("UPDATE platform_discord_memberships SET last_verified_at_utc=? WHERE user_id=? AND guild_id=?").run(new Date(at.getTime()+1).toISOString(), owner.userId, GUILD);
      expect(memberships.findEffective(owner.userId, GUILD, new Date(at.getTime()+1), 1000)).not.toBeNull();
      expect(deriveAuthenticatedUserJournalScope(db, owner.userId).allowedAccountIds.length).toBeGreaterThan(0);
      db.prepare("UPDATE platform_workspace_memberships SET role='member' WHERE user_id=?").run(owner.userId);
      const memberScope = deriveAuthenticatedUserJournalScope(db, owner.userId);
      expect(memberScope.allowedAccountIds).toEqual([]); expect(memberScope.activeAccountId).toBeNull();
    } finally { db.close(); }
  });
});
