// @vitest-environment node
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyMembershipPlan, newMembershipPlanPrice, type MembershipPlanEditor } from "../../contracts/membership-plan-editor";
import { newMembershipProductFeature as feature } from "../../contracts/membership-product-features";
import { platformIdentityMigration } from "../database/migrations/0001_platform_identity";
import { platformAdministrationMigration } from "../database/migrations/0019_platform_administration";
import { platformMembershipPlatformMigration } from "../database/migrations/0148_platform_membership_platform";
import { platformMembershipGenerationAllowancesMigration } from "../database/migrations/0150_platform_membership_generation_allowances";
import { platformMembershipFeatureCopyMigration } from "../database/migrations/0157_platform_membership_feature_copy";
import { platformMembershipUnifiedEditorMigration } from "../database/migrations/0165_platform_membership_unified_editor";
import { readMembershipEditorChoices, readMembershipPlanEditor } from "./membership-plan-editor-read";
import { MembershipPlanEditorDrafts } from "./membership-plan-editor-drafts";
import { writeMembershipPlanEditor } from "./membership-plan-editor-write";
import { assertMembershipFeature, evaluateMembershipFeature } from "./platform-membership-access";
import { PlatformMembershipRepository } from "./platform-membership-repository";
import { readMembershipNewsDelaySeconds } from "./membership-news-delay";
import { canReceiveMembershipNotification } from "./membership-notification-access";

const filtersKey = "news.filters_sorting";
const at = "2026-11-18T18:00:00.000Z";
const expiry = "2026-11-19T18:00:00.000Z";
const databases: Database.Database[] = [];
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(at));
});
afterEach(() => {
  databases.splice(0).forEach(database => database.close());
  vi.useRealTimers();
});

function fixture() {
  const db = new Database(":memory:");
  databases.push(db);
  db.pragma("foreign_keys=ON");
  for (const migration of [platformIdentityMigration, platformAdministrationMigration, platformMembershipPlatformMigration,
    platformMembershipGenerationAllowancesMigration, platformMembershipFeatureCopyMigration, platformMembershipUnifiedEditorMigration]) {
    for (const sql of migration.statements) db.exec(sql);
  }
  const actor = randomUUID();
  db.prepare("INSERT INTO platform_users VALUES (?,'test',?,'Fixture member','active',?,?)").run(actor, actor, at, at);
  const repository = new PlatformMembershipRepository(db);
  const policy = (key: string, mode: "off" | "shadow" | "enforced") => db.prepare(
    "INSERT INTO platform_membership_feature_policies VALUES (?,?,?,?) ON CONFLICT(feature_key) DO UPDATE SET enforcement_mode=excluded.enforcement_mode",
  ).run(key, mode, actor, at);
  const document = (withFilters: boolean) => {
    const plan = emptyMembershipPlan();
    plan.name = randomUUID();
    plan.prices = [{ ...newMembershipPlanPrice(randomUUID()), name: "Free fixture access" }];
    plan.features.push(feature("news.access"), feature("news.visibility_delay_seconds", 300),
      feature("news.notification_delay_seconds", 120), ...(withFilters ? [feature(filtersKey)] : []));
    return plan;
  };
  const publish = (plan: MembershipPlanEditor) => writeMembershipPlanEditor(db, actor, {
    document: plan, intent: "publish", requestId: randomUUID(), draftId: null, revision: null, applyToMembers: false,
  }, at);
  const grant = (versionId: string) => repository.grantEntitlement({
    actorUserId: actor, userId: actor, planVersionId: versionId, sourceType: "owner_grant", sourceRef: randomUUID(),
    startsAtUtc: at, endsAtUtc: expiry, atUtc: at,
  });
  return { db, actor, repository, policy, document, publish, grant };
}

describe("Press release filter plan integration", () => {
  it("lists the definition without writing policies or modifying existing selections", () => {
    const f = fixture();
    const before = f.db.prepare("SELECT total_changes()").pluck().get();
    const option = readMembershipEditorChoices(f.db).features.find(item => item.key === filtersKey);
    expect(option).toMatchObject({ label: "Press release filters and sorting", kind: "boolean", module: "news", enforcement: "off" });
    expect(option?.brief).toContain("market cap");
    expect(f.db.prepare("SELECT total_changes()").pluck().get()).toBe(before);
    expect(f.document(false).features.some(item => item.key === filtersKey)).toBe(false);
    expect(evaluateMembershipFeature(f.db, f.actor, filtersKey, undefined, at)).toMatchObject({ mode: "off", allowed: true });
  });

  it("saves and reopens the optional setting and publishes without granting access or changing existing plans", () => {
    const f = fixture();
    const existing = f.publish(f.document(false));
    const existingPlan = readMembershipPlanEditor(f.db, existing.planId!);
    const schema = f.db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name").all();
    const plan = f.document(true);
    const saved = writeMembershipPlanEditor(f.db, f.actor, {
      document: plan, intent: "save", requestId: randomUUID(), draftId: null, revision: null, applyToMembers: false,
    }, at);
    const reopened = new MembershipPlanEditorDrafts(f.db).read(saved.draftId!);
    expect(reopened.document).toEqual(plan);
    const published = writeMembershipPlanEditor(f.db, f.actor, {
      document: reopened.document, intent: "publish", requestId: randomUUID(),
      draftId: saved.draftId!, revision: saved.revision!, applyToMembers: false,
    }, at);
    expect(readMembershipPlanEditor(f.db, published.planId!).features).toEqual(expect.arrayContaining(plan.features));
    expect(readMembershipPlanEditor(f.db, existing.planId!)).toEqual(existingPlan);
    expect(f.repository.readEffectiveAccess(f.actor, at).sources).toEqual([]);
    for (const table of ["platform_membership_entitlements", "platform_membership_feature_policies",
      "platform_membership_provider_subscriptions", "platform_membership_discord_offer_rules"]) {
      expect(f.db.prepare(`SELECT COUNT(*) n FROM ${table}`).get()).toEqual({ n: 0 });
    }
    expect(f.db.pragma("foreign_key_check")).toEqual([]);
    expect(f.db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY type,name").all()).toEqual(schema);
  });

  it("keeps off and shadow open and enforces only a current grant when the owner chooses enforced", () => {
    const f = fixture();
    const published = f.publish(f.document(false));
    f.grant(published.versionId!);
    for (const mode of ["off", "shadow", "enforced"] as const) {
      f.policy(filtersKey, mode);
      expect(evaluateMembershipFeature(f.db, f.actor, filtersKey, undefined, at).allowed).toBe(mode !== "enforced");
    }
    const entitled = f.publish(f.document(true));
    const grant = f.grant(entitled.versionId!);
    expect(evaluateMembershipFeature(f.db, f.actor, filtersKey, undefined, at).allowed).toBe(true);
    expect(evaluateMembershipFeature(f.db, f.actor, filtersKey, undefined, expiry).allowed).toBe(false);
    f.db.prepare("UPDATE platform_membership_entitlements SET status='revoked' WHERE entitlement_id=?").run(grant);
    expect(evaluateMembershipFeature(f.db, f.actor, filtersKey, undefined, at).allowed).toBe(false);
    f.policy("news.access", "enforced");
    expect(evaluateMembershipFeature(f.db, f.actor, "news.access", undefined, at).allowed).toBe(true);
  });

  it("does not turn a filter grant into basic news-reading permission", () => {
    const f = fixture();
    f.repository.synchronizeBuiltInFeatures(f.actor, at);
    const plan = f.repository.createPlan({ actorUserId: f.actor, planKey: "filters-only", name: "Filters only",
      visibility: "private", features: [{ featureKey: filtersKey, limitValue: null }], atUtc: at });
    f.repository.publishPlanVersion({ actorUserId: f.actor, planVersionId: plan.planVersionId, atUtc: at });
    f.grant(plan.planVersionId);
    f.policy(filtersKey, "enforced");
    f.policy("news.access", "enforced");
    expect(evaluateMembershipFeature(f.db, f.actor, filtersKey, undefined, at).allowed).toBe(true);
    expect(() => assertMembershipFeature(f.db, f.actor, "news.access")).toThrow();
  });

  it("preserves notification decisions and the two independent delay values", () => {
    const f = fixture();
    const published = f.publish(f.document(true));
    const filtersGrant = f.grant(published.versionId!);
    for (const key of ["news.access", "news.visibility_delay_seconds", "news.notification_delay_seconds",
      "notifications.access", "notifications.press_release", filtersKey]) f.policy(key, "enforced");
    expect(readMembershipNewsDelaySeconds(f.db, f.actor, "news.visibility_delay_seconds", at)).toBe(300);
    expect(readMembershipNewsDelaySeconds(f.db, f.actor, "news.notification_delay_seconds", at)).toBe(120);
    expect(canReceiveMembershipNotification(f.db, f.actor, "press_release")).toBe(false);
    expect(f.repository.readEffectiveAccess(f.actor, at).booleanFeatures).not.toContain("notifications.press_release");
    const notifications = f.document(false);
    notifications.features.push(feature("notifications.press_release"));
    const notificationPlan = f.publish(notifications);
    f.grant(notificationPlan.versionId!);
    expect(canReceiveMembershipNotification(f.db, f.actor, "press_release")).toBe(true);
    f.db.prepare("UPDATE platform_membership_entitlements SET status='revoked' WHERE entitlement_id=?").run(filtersGrant);
    expect(evaluateMembershipFeature(f.db, f.actor, filtersKey, undefined, at).allowed).toBe(false);
    expect(canReceiveMembershipNotification(f.db, f.actor, "press_release")).toBe(true);
    expect(readMembershipNewsDelaySeconds(f.db, f.actor, "news.visibility_delay_seconds", at)).toBe(300);
    expect(readMembershipNewsDelaySeconds(f.db, f.actor, "news.notification_delay_seconds", at)).toBe(120);
  });

  it("uses the existing owner bypass without creating a plan or granting the capability", () => {
    const f = fixture();
    f.repository.synchronizeBuiltInFeatures(f.actor, at);
    f.policy(filtersKey, "enforced");
    f.db.prepare(`INSERT INTO platform_operator_grants
      (operator_grant_id,user_id,authority_key,operator_role,grant_state,granted_by_kind,grant_receipt_sha256,granted_at_utc,updated_at_utc)
      VALUES (?,?,'journal_administration','journal_owner_admin','active','bootstrap_console',?,?,?)`)
      .run(randomUUID(), f.actor, "0".repeat(64), at, at);
    expect(evaluateMembershipFeature(f.db, f.actor, filtersKey, undefined, at)).toMatchObject({ ownerBypass: true, allowed: true });
    expect(f.repository.readEffectiveAccess(f.actor, at).sources).toEqual([]);
  });
});
