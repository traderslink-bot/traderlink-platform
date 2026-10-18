import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openPlatformDatabase } from "../database/open-platform-database";
import { platformMigrationManifest } from "../database/platform-migration-manifest";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import { PlatformLoginService } from "./platform-login-service";
import { PlatformSessionRepository } from "./platform-session-repository";
import { PlatformSessionService } from "./platform-session-service";
import { PlatformMembershipRepository } from "../membership/platform-membership-repository";
const roots: string[] = [];
afterEach(() => {
  for (const p of roots.splice(0)) rmSync(p, { recursive: true, force: true });
});
function setup() {
  const root = mkdtempSync(join(tmpdir(), "login-service-"));
  roots.push(root);
  const db = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "qa.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(db, { manifest: platformMigrationManifest });
  let now = new Date("2026-10-14T12:00:00.000Z");
  const service = new PlatformLoginService(db, { now: () => now });
  return {
    db,
    service,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
    sessions: new PlatformSessionService(new PlatformSessionRepository(db), {
      now: () => now,
    }),
  };
}
const hash = "$argon2id$synthetic-test-hash-do-not-use";
describe("member login ownership and recovery", () => {
  it("requires verified email and password proof, then reset revokes sessions and cannot replay", () => {
    const { db, service, sessions } = setup();
    try {
      const failing = new PlatformLoginService(db, {
        queueMail: () => {
          throw new Error("synthetic enqueue failure");
        },
      });
      expect(() =>
        failing.signup({
          email: "atomic@example.test",
          displayName: "Trader",
          passwordHash: hash,
        }),
      ).toThrow("synthetic enqueue failure");
      expect(
        db
          .prepare(
            "SELECT count(*) AS n FROM platform_login_credentials WHERE email_normalized='atomic@example.test'",
          )
          .get(),
      ).toEqual({ n: 0 });
      const token = service.signup({
        email: "Trader@Example.com",
        displayName: "Trader",
        passwordHash: hash,
      })!;
      expect(() => service.signInEmail("trader@example.com", hash)).toThrow();
      expect(() => service.verifyEmail("invalid-token")).toThrow();
      const user = service.verifyEmail(token);
      expect(() => service.verifyEmail(token)).toThrow();
      const signed = service.signInEmail("TRADER@example.com", hash);
      expect(sessions.resolve(signed.token)?.userId).toBe(user);
      const reset = service.requestReset("trader@example.com")!;
      service.resetPassword(reset, hash + "new");
      expect(sessions.resolve(signed.token)).toBeNull();
      expect(() => service.resetPassword(reset, hash)).toThrow();
      expect(() => service.signInEmail("trader@example.com", hash)).toThrow();
      expect(
        service.signInEmail("trader@example.com", hash + "new").session.userId,
      ).toBe(user);
    } finally {
      db.close();
    }
  }, 30000);
  it("links providers explicitly, prevents conflicts and last-method removal, and reconnects safely", () => {
    const { db, service, sessions, advance } = setup();
    try {
      const first = service.signInOAuth({
        provider: "google",
        subject: "google-one",
        displayName: "Trader",
        verifiedEmail: "one@example.com",
      });
      const at = "2026-10-14T12:00:00.000Z";
      const memberships = new PlatformMembershipRepository(db);
      memberships.synchronizeBuiltInFeatures(first.session.userId, at);
      const plan = memberships.createPlan({
        actorUserId: first.session.userId,
        planKey: "login-preservation",
        name: "Journal and tools",
        visibility: "public",
        atUtc: at,
        features: [
          { featureKey: "journal.access", limitValue: null },
          { featureKey: "levels.generations", limitValue: 30 },
        ],
      });
      memberships.publishPlanVersion({ actorUserId: first.session.userId, planVersionId: plan.planVersionId, atUtc: at });
      memberships.grantEntitlement({
        actorUserId: first.session.userId, userId: first.session.userId,
        planVersionId: plan.planVersionId, sourceType: "free_plan",
        sourceRef: "synthetic-login-preservation", startsAtUtc: at, endsAtUtc: null, atUtc: at,
      });
      db.prepare("INSERT INTO platform_membership_feature_usage_anchors VALUES (?,?,?)")
        .run(plan.planVersionId, "levels.generations", at);
      db.prepare("INSERT INTO platform_stock_levels_usage (user_id,symbol,requested_at_ms,new_york_date) VALUES (?,?,?,?)")
        .run(first.session.userId, "AAPL", Date.parse(at), "2026-10-14");
      const preserved = () => ({
        accounts: db.prepare("SELECT * FROM journal_accounts WHERE created_by_user_id=? ORDER BY account_id").all(first.session.userId),
        entitlements: db.prepare("SELECT * FROM platform_membership_entitlements WHERE user_id=? ORDER BY entitlement_id").all(first.session.userId),
        anchors: db.prepare("SELECT * FROM platform_membership_feature_usage_anchors WHERE plan_version_id=?").all(plan.planVersionId),
        usage: db.prepare("SELECT * FROM platform_stock_levels_usage WHERE user_id=?").all(first.session.userId),
        access: memberships.readEffectiveAccess(first.session.userId, at),
      });
      const beforeLink = preserved();
      expect(beforeLink.accounts).toHaveLength(1);
      expect(beforeLink.access.limits["levels.generations"]).toBe(30);
      expect(() => service.unlink(first.token, "google")).toThrow(
        "Keep at least one",
      );
      const intent = service.createLinkIntent(first.token, "discord");
      const linked = service.signInOAuth({
        provider: "discord",
        subject: "discord-one",
        displayName: "Trader",
        linkIntent: intent,
        currentSession: first.token,
      });
      expect(linked.session.userId).toBe(first.session.userId);
      expect(sessions.resolve(first.token)).toBeNull();
      expect(service.connected(linked.token)).toHaveLength(2);
      const other = service.signInOAuth({
        provider: "google",
        subject: "google-two",
        displayName: "Other",
      });
      const bad = service.createLinkIntent(other.token, "discord");
      expect(() =>
        service.signInOAuth({
          provider: "discord",
          subject: "discord-one",
          displayName: "Other",
          linkIntent: bad,
          currentSession: other.token,
        }),
      ).toThrow();
      service.unlink(linked.token, "google");
      const again = service.createLinkIntent(linked.token, "google");
      const reconnect = service.signInOAuth({
        provider: "google",
        subject: "google-one",
        displayName: "Trader",
        linkIntent: again,
        currentSession: linked.token,
      });
      expect(reconnect.session.userId).toBe(first.session.userId);
      expect(preserved()).toEqual(beforeLink);
      expect(
        db.prepare("SELECT count(*) AS n FROM platform_users").get(),
      ).toEqual({ n: 2 });
      advance(86400000);
      expect(service.createLinkIntent(reconnect.token, "discord")).toEqual(expect.any(String));
      service.unlink(reconnect.token, "discord");
      expect(service.connected(reconnect.token).map(method => method.provider)).toEqual(["google"]);
      expect(() => service.unlink(reconnect.token, "google")).toThrow("Keep at least one");
      expect(preserved()).toEqual(beforeLink);
      advance(31 * 86400000);
      expect(() => service.createLinkIntent(reconnect.token, "discord")).toThrow("invalid or expired");
      expect(() => service.createLinkIntent(null, "discord")).toThrow("invalid or expired");
    } finally {
      db.close();
    }
  }, 30000);
  it("requires a live account for adding email, and recovers an unverified registration through the mailbox", () => {
    const { db, service } = setup();
    try {
      expect(() =>
        service.signup({
          email: "linked@example.com",
          displayName: "Trader",
          passwordHash: hash,
          currentSession: null,
        }),
      ).toThrow("invalid or expired");
      service.signup({
        email: "pending@example.com",
        displayName: "Trader",
        passwordHash: hash,
      });
      const reset = service.requestReset("pending@example.com")!;
      service.resetPassword(reset, hash + "recovered");
      const signed = service.signInEmail(
        "pending@example.com",
        hash + "recovered",
      );
      expect(signed.session.userId).toBeTruthy();
      expect(() => service.signInEmail("pending@example.com", hash)).toThrow();
    } finally {
      db.close();
    }
  }, 30000);
  it("verifies an email change without rewriting ownership and reconnects a retained email method", () => {
    const { db, service, sessions } = setup();
    try {
      const token = service.signup({
        email: "first@example.com",
        displayName: "Trader",
        passwordHash: hash,
      })!;
      const user = service.verifyEmail(token);
      const email = service.signInEmail("first@example.com", hash);
      const intent = service.createLinkIntent(email.token, "google");
      const google = service.signInOAuth({
        provider: "google",
        subject: "google-existing-member",
        displayName: "Trader",
        linkIntent: intent,
        currentSession: email.token,
      });
      const beforeDisconnectReset = service.requestReset("first@example.com")!;
      service.unlink(google.token, "email");
      expect(service.requestReset("first@example.com")).toBeNull();
      expect(() => service.resetPassword(beforeDisconnectReset, hash + "changed")).toThrow();
      expect(sessions.resolve(google.token)?.userId).toBe(user);
      const reconnected = service.reconnectEmail(
        google.token,
        "first@example.com",
        hash,
      );
      expect(reconnected.session.userId).toBe(user);
      expect(() => service.resetPassword(beforeDisconnectReset, hash + "changed")).toThrow();
      expect(sessions.resolve(google.token)).toBeNull();
      const change = service.requestEmailChange(
        reconnected.token,
        "second@example.com",
      );
      expect(service.credential("first@example.com")?.user_id).toBe(user);
      const completed = service.changeEmail(change.token, reconnected.token);
      expect(completed.signed.session.userId).toBe(user);
      expect(sessions.resolve(reconnected.token)).toBeNull();
      expect(service.credential("first@example.com")).toBeNull();
      expect(
        service.signInEmail("second@example.com", hash).session.userId,
      ).toBe(user);
      expect(() =>
        service.changeEmail(change.token, completed.signed.token),
      ).toThrow();
    } finally {
      db.close();
    }
  }, 30000);
  it("does not auto-merge a verified email across Google and email credentials; expired tokens fail", () => {
    const { db, service, advance } = setup();
    try {
      const raw = service.signup({
        email: "same@example.com",
        displayName: "Trader",
        passwordHash: hash,
      })!;
      expect(() =>
        service.signInOAuth({
          provider: "google",
          subject: "another",
          displayName: "Trader",
          verifiedEmail: "same@example.com",
        }),
      ).toThrow();
      advance(86400001);
      expect(() => service.verifyEmail(raw)).toThrow();
      expect(
        db.prepare("SELECT count(*) AS n FROM platform_users").get(),
      ).toEqual({ n: 0 });
      for (let i = 0; i < 10; i++) service.throttle("a".repeat(64));
      expect(() => service.throttle("a".repeat(64))).toThrow("Too many");
    } finally {
      db.close();
    }
  }, 30000);
  it("keeps Discord membership rechecks on the same account and rejects a different Discord identity", () => {
    const { db, service, sessions } = setup();
    try {
      const original = service.signInOAuth({ provider: "google", subject: "recheck-google", displayName: "Trader" });
      const linked = service.signInOAuth({ provider: "discord", subject: "recheck-discord", displayName: "Trader",
        linkIntent: service.createLinkIntent(original.token, "discord"), currentSession: original.token });
      const badIntent = service.createLinkIntent(linked.token, "discord");
      expect(() => service.signInOAuth({ provider: "discord", subject: "another-discord", displayName: "Other",
        linkIntent: badIntent, currentSession: linked.token })).toThrow();
      expect(sessions.resolve(linked.token)?.userId).toBe(original.session.userId);
      const intent = service.createLinkIntent(linked.token, "discord");
      const checked = service.signInOAuth({ provider: "discord", subject: "recheck-discord", displayName: "Trader",
        linkIntent: intent, currentSession: linked.token });
      expect(checked.session.userId).toBe(original.session.userId);
      expect(service.connected(checked.token)).toHaveLength(2);
      expect(() => service.signInOAuth({ provider: "discord", subject: "recheck-discord", displayName: "Trader",
        linkIntent: intent, currentSession: checked.token })).toThrow();
      expect(db.prepare("SELECT count(*) AS n FROM platform_users").get()).toEqual({ n: 1 });
    } finally { db.close(); }
  }, 30000);

});
