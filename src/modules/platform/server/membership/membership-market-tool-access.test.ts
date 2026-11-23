// @vitest-environment node
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { MARKET_TOOL_MEMBERSHIP_KEYS, type MarketToolMembershipKey } from "../../contracts/membership-market-tools";
import { emptyMembershipPlan, newMembershipPlanPrice } from "../../contracts/membership-plan-editor";
import { newMembershipProductFeature } from "../../contracts/membership-product-features";
import type { PlatformMembershipEntitlementSource } from "../../contracts/platform-membership-contracts";
import { platformIdentityMigration } from "../database/migrations/0001_platform_identity";
import { platformAdministrationMigration } from "../database/migrations/0019_platform_administration";
import { platformMembershipPlatformMigration } from "../database/migrations/0148_platform_membership_platform";
import { platformMembershipGenerationAllowancesMigration } from "../database/migrations/0150_platform_membership_generation_allowances";
import { platformMembershipFeatureCopyMigration } from "../database/migrations/0157_platform_membership_feature_copy";
import { platformMembershipUnifiedEditorMigration } from "../database/migrations/0165_platform_membership_unified_editor";
import { MembershipPlanEditorDrafts } from "./membership-plan-editor-drafts";
import { readMembershipEditorChoices, readMembershipPlanEditor } from "./membership-plan-editor-read";
import { writeMembershipPlanEditor } from "./membership-plan-editor-write";
import { hasMarketToolDashboardAdmission, readMarketToolMembershipAccess, type MarketToolAccessCheck } from "./membership-market-tool-access";
import { hasPlatformMembershipFeature } from "./platform-membership-access";
import { PlatformMembershipRepository } from "./platform-membership-repository";

const at = "2026-11-22T18:00:00.000Z";
const expiry = "2026-11-23T18:00:00.000Z";
const keys = Object.values(MARKET_TOOL_MEMBERSHIP_KEYS);
const databases: Database.Database[] = [];
afterEach(() => databases.splice(0).forEach(database => database.close()));

function fixture() {
  const database = new Database(":memory:");
  databases.push(database);
  database.pragma("foreign_keys=ON");
  for (const migration of [platformIdentityMigration, platformAdministrationMigration, platformMembershipPlatformMigration,
    platformMembershipGenerationAllowancesMigration, platformMembershipFeatureCopyMigration, platformMembershipUnifiedEditorMigration]) {
    for (const statement of migration.statements) database.exec(statement);
  }
  const [userId, otherUserId] = [randomUUID(), randomUUID()];
  for (const id of [userId, otherUserId]) {
    database.prepare("INSERT INTO platform_users VALUES (?,'test',?,'Tool fixture','active',?,?)").run(id, id, at, at);
  }
  const repository = new PlatformMembershipRepository(database);
  repository.synchronizeBuiltInFeatures(userId, at);
  const policy = (key: string, mode: "off" | "shadow" | "enforced") => database.prepare(
    "INSERT INTO platform_membership_feature_policies VALUES (?,?,?,?) ON CONFLICT(feature_key) DO UPDATE SET enforcement_mode=excluded.enforcement_mode",
  ).run(key, mode, userId, at);
  const grant = (selected: readonly MarketToolMembershipKey[], targetUserId = userId, startsAtUtc = at,
    sourceType: PlatformMembershipEntitlementSource = "subscription") => {
    const plan = repository.createPlan({ actorUserId: userId, planKey: `tools-${randomUUID()}`, name: "Synthetic tool plan",
      visibility: "private", features: selected.map(featureKey => ({ featureKey, limitValue: null })), atUtc: at });
    repository.publishPlanVersion({ actorUserId: userId, planVersionId: plan.planVersionId, atUtc: at });
    return repository.grantEntitlement({ actorUserId: userId, userId: targetUserId, planVersionId: plan.planVersionId,
      sourceType, sourceRef: randomUUID(), startsAtUtc, endsAtUtc: expiry, atUtc: at });
  };
  const checks = (overrides: Partial<MarketToolAccessCheck> = {}): MarketToolAccessCheck[] =>
    keys.map(key => ({ key, existingAccess: false, memberReleaseReady: true, ...overrides }));
  const read = (input = checks(), timestamp = at, targetUserId = userId) =>
    readMarketToolMembershipAccess(database, targetUserId, input, timestamp);
  return { database, userId, otherUserId, repository, policy, grant, checks, read };
}

describe("Standalone market-tool membership", () => {
  it("keeps feature registration optional and read-only with owner-controlled rollout", () => {
    const f = fixture();
    const before = f.database.prepare("SELECT total_changes() n").get();
    const choices = readMembershipEditorChoices(f.database).features;
    for (const key of keys) {
      expect(choices.find(choice => choice.key === key)).toMatchObject({ key, kind: "boolean", enforcement: "off" });
      expect(emptyMembershipPlan().features.some(feature => feature.key === key)).toBe(false);
    }
    expect(f.read()).toEqual(new Map(keys.map(key => [key, false])));
    expect(f.database.prepare("SELECT total_changes() n").get()).toEqual(before);
    expect(f.database.prepare("SELECT COUNT(*) n FROM platform_membership_feature_policies").get()).toEqual({ n: 0 });
  });

  it("persists independent tool selections and editable copy through draft reopen and publication", () => {
    const f = fixture();
    for (let mask = 0; mask < (1 << keys.length); mask += 1) {
      const selectedKeys = keys.filter((_, index) => (mask & (1 << index)) !== 0);
      const document = emptyMembershipPlan();
      document.name = randomUUID();
      document.prices = [{ ...newMembershipPlanPrice(randomUUID()), name: "Synthetic no-payment offer" }];
      const expected = selectedKeys.map(key => ({ ...newMembershipProductFeature(key), brief: "Owner brief", details: "Owner details" }));
      document.features.push(...expected);
      const saved = writeMembershipPlanEditor(f.database, f.userId, { document, intent: "save", requestId: randomUUID(),
        draftId: null, revision: null, applyToMembers: false }, at);
      const reopened = new MembershipPlanEditorDrafts(f.database).read(saved.draftId!);
      expect(reopened.document).toEqual(document);
      const published = writeMembershipPlanEditor(f.database, f.userId, { document: reopened.document, intent: "publish",
        requestId: randomUUID(), draftId: saved.draftId!, revision: saved.revision!, applyToMembers: false }, at);
      const selected = readMembershipPlanEditor(f.database, published.planId!).features.filter(feature => keys.includes(feature.key as MarketToolMembershipKey));
      expect(selected).toHaveLength(expected.length);
      expect(selected).toEqual(expect.arrayContaining(expected));
    }
    expect(f.repository.readEffectiveAccess(f.userId, at).sources).toEqual([]);
    expect(f.database.pragma("foreign_key_check")).toEqual([]);
  });

  it.each(keys)("admits a current %s subscription grant without granting another product or another user", key => {
    const f = fixture();
    for (const feature of keys) f.policy(feature, "enforced");
    f.grant([key]);
    expect(f.read()).toEqual(new Map(keys.map(feature => [feature, feature === key])));
    expect(f.read(f.checks(), at, f.otherUserId)).toEqual(new Map(keys.map(feature => [feature, false])));
    expect(f.repository.readEffectiveAccess(f.userId, at).booleanFeatures).toEqual([key]);
    expect(hasPlatformMembershipFeature(f.database, f.userId, "dashboard.access", at)).toBe(true);
    for (const feature of ["watchlist.access", "journal.access", "community.access", "coaching.access"]) {
      expect(hasPlatformMembershipFeature(f.database, f.userId, feature, at)).toBe(false);
    }
  });

  it("reads combined grants without changing policy, pricing or grants", () => {
    const f = fixture();
    for (const key of keys) f.policy(key, "enforced");
    f.grant(keys);
    const before = f.database.prepare("SELECT total_changes() n").get();
    expect([...f.read().values()]).toEqual(keys.map(() => true));
    expect(f.database.prepare("SELECT total_changes() n").get()).toEqual(before);
  });

  it.each(["free_plan", "trial", "owner_grant", "lifetime_purchase"] as const)("also honors owner-configured %s access without requiring a payment provider", source => {
    const f = fixture();
    for (const key of keys) f.policy(key, "enforced");
    f.grant(keys, f.userId, at, source);
    expect([...f.read().values()]).toEqual(keys.map(() => true));
    expect(f.database.prepare("SELECT COUNT(*) n FROM platform_membership_provider_subscriptions").get()).toEqual({ n: 0 });
  });

  it("preserves feature-specific pilots and requires both owner rollout and member readiness for new admission", () => {
    const f = fixture();
    f.grant(keys);
    for (const mode of ["off", "shadow", "enforced"] as const) {
      for (const key of keys) f.policy(key, mode);
      expect([...f.read().values()]).toEqual(keys.map(() => mode === "enforced"));
      expect([...f.read(f.checks({ memberReleaseReady: false })).values()]).toEqual(keys.map(() => false));
      const pilot = f.checks().map((check, index) => ({ ...check, existingAccess: index === 0, memberReleaseReady: false }));
      expect([...f.read(pilot).values()]).toEqual(keys.map((_, index) => index === 0));
    }
  });

  it("opens only explicitly released dashboard consumers before enforcement, without creating grants", () => {
    const f = fixture();
    const released = f.checks({ prePaywallAccess: true });
    expect([...f.read(released).values()]).toEqual(keys.map(() => true));
    for (const mode of ["off", "shadow", "enforced"] as const) {
      for (const key of keys) f.policy(key, mode);
      expect([...f.read(released).values()]).toEqual(keys.map(() => mode !== "enforced"));
      expect([...f.read().values()]).toEqual(keys.map(() => false));
      expect([...f.read(f.checks({ prePaywallAccess: true, memberReleaseReady: false })).values()]).toEqual(keys.map(() => false));
    }
    f.grant([keys[0]]);
    expect([...f.read(released).values()]).toEqual(keys.map((_, index) => index === 0));
    expect(f.repository.readEffectiveAccess(f.userId, at).booleanFeatures).toEqual([keys[0]]);
  });

  it("mirrors existing global dashboard admission instead of accepting any signed-in identity", () => {
    const f = fixture();
    const identity = { mode: "platform_session" as const, sessionId: "fixture-session", displayName: null, discord: null,
      scope: { userId: f.userId, workspaceId: randomUUID(), workspaceRole: "owner" as const, activeAccountId: null, allowedAccountIds: [] } };
    const environment = { NODE_ENV: "production" as const, TRADERSLINK_PREMIUM_DISCORD_ROLE_ID: "7" };
    expect(hasMarketToolDashboardAdmission(f.database, identity, environment, at)).toBe(false);
    const grantId = f.grant([keys[0]]);
    expect(hasMarketToolDashboardAdmission(f.database, identity, environment, at)).toBe(true);
    f.database.prepare("UPDATE platform_membership_entitlements SET status='revoked' WHERE entitlement_id=?").run(grantId);
    expect(hasMarketToolDashboardAdmission(f.database, identity, environment, at)).toBe(false);
    f.database.exec(`CREATE TABLE platform_dashboard_member_access_settings
      (settings_key TEXT,allow_all_discord_members INTEGER,updated_at_utc TEXT)`);
    f.database.prepare("INSERT INTO platform_dashboard_member_access_settings VALUES ('member_dashboard_access',1,?)").run(at);
    const member = { ...identity, discord: { guildOwner: false, roleIds: [] as string[] } };
    expect(hasMarketToolDashboardAdmission(f.database, member, environment, at)).toBe(true);
    f.policy("dashboard.access", "enforced");
    expect(hasMarketToolDashboardAdmission(f.database, member, environment, at)).toBe(false);
    f.policy("dashboard.access", "off");
    f.database.exec("UPDATE platform_dashboard_member_access_settings SET allow_all_discord_members=0");
    expect(hasMarketToolDashboardAdmission(f.database, member, environment, at)).toBe(false);
    expect(hasMarketToolDashboardAdmission(f.database, { ...member, discord: { guildOwner: false, roleIds: ["7"] } }, environment, at)).toBe(true);
  });

  it("does not turn missing grant storage into enforced access", () => {
    const database = new Database(":memory:");
    databases.push(database);
    database.exec("CREATE TABLE platform_membership_feature_policies (feature_key TEXT,enforcement_mode TEXT)");
    for (const key of keys) database.prepare("INSERT INTO platform_membership_feature_policies VALUES (?,'enforced')").run(key);
    const checks = keys.map(key => ({ key, existingAccess: false, memberReleaseReady: true, prePaywallAccess: true }));
    expect([...readMarketToolMembershipAccess(database, randomUUID(), checks, at).values()]).toEqual(keys.map(() => false));
  });

  it("rejects missing, future, expired, revoked and pending grants at exact boundaries", () => {
    const f = fixture();
    for (const key of keys) f.policy(key, "enforced");
    expect([...f.read().values()]).toEqual(keys.map(() => false));
    const grantId = f.grant(keys, f.userId, "2026-11-22T19:00:00.000Z");
    expect([...f.read().values()]).toEqual(keys.map(() => false));
    expect([...f.read(f.checks(), "2026-11-22T19:00:00.000Z").values()]).toEqual(keys.map(() => true));
    expect([...f.read(f.checks(), expiry).values()]).toEqual(keys.map(() => false));
    expect(hasPlatformMembershipFeature(f.database, f.userId, "dashboard.access", expiry)).toBe(false);
    for (const status of ["revoked", "pending"]) {
      f.database.prepare("UPDATE platform_membership_entitlements SET status=? WHERE entitlement_id=?").run(status, grantId);
      expect([...f.read(f.checks(), "2026-11-22T19:00:00.000Z").values()]).toEqual(keys.map(() => false));
    }
  });

  it("keeps only explicitly verified pilots when membership storage is unavailable", () => {
    const database = new Database(":memory:");
    databases.push(database);
    const input: MarketToolAccessCheck[] = keys.map((key, index) => ({ key, existingAccess: index === 0, memberReleaseReady: true }));
    expect([...readMarketToolMembershipAccess(database, randomUUID(), input, at).values()]).toEqual(keys.map((_, index) => index === 0));
    const f = fixture();
    f.grant(keys);
    f.database.exec("DROP TABLE platform_membership_feature_policies");
    expect([...f.read(input).values()]).toEqual(keys.map((_, index) => index === 0));
  });
});
