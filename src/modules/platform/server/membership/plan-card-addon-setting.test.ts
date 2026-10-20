import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PlanCatalog } from "@/app/plans/plan-catalog";
import { emptyMembershipPlan, membershipPlanEditorSchema, newMembershipPlanPrice } from "../../contracts/membership-plan-editor";
import { platformIdentityMigration } from "../database/migrations/0001_platform_identity";
import { platformAuthenticationIdentitiesMigration } from "../database/migrations/0012_platform_authentication_identities";
import { platformDiscordMembershipsMigration } from "../database/migrations/0017_platform_discord_memberships";
import { platformMembershipPlatformMigration } from "../database/migrations/0148_platform_membership_platform";
import { platformMembershipGenerationAllowancesMigration } from "../database/migrations/0150_platform_membership_generation_allowances";
import { platformMembershipFeatureCopyMigration } from "../database/migrations/0157_platform_membership_feature_copy";
import { platformMemberPrivateWatchlistsMigration } from "../database/migrations/0158_platform_member_private_watchlists";
import { platformMembershipUnifiedEditorMigration } from "../database/migrations/0165_platform_membership_unified_editor";
import { writeMembershipPlanEditor } from "./membership-plan-editor-write";
import { readMembershipPlanEditor } from "./membership-plan-editor-read";
import { PlatformMembershipCatalogRepository } from "./platform-membership-catalog-repository";

vi.mock("@/app/plans/checkout-actions", () => ({ selectMembershipAction: vi.fn(), selectEmbeddedMembershipAction: vi.fn() }));
vi.mock("@/app/plans/pricing-site-chrome", () => ({ PricingSiteChrome: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/app/admin/journal/memberships/membership-form", () => ({ MembershipForm: ({ children }: { children: React.ReactNode }) => createElement("form", null, children) }));

const at = "2026-10-20T12:00:00.000Z";
function fixture() {
  const db = new Database(":memory:"); db.pragma("foreign_keys=ON");
  for (const migration of [platformIdentityMigration, platformAuthenticationIdentitiesMigration, platformDiscordMembershipsMigration,
    platformMembershipPlatformMigration, platformMembershipGenerationAllowancesMigration, platformMembershipFeatureCopyMigration,
    platformMemberPrivateWatchlistsMigration, platformMembershipUnifiedEditorMigration]) for (const sql of migration.statements) db.exec(sql);
  const actor = randomUUID();
  db.prepare("INSERT INTO platform_users VALUES (?,'test','owner','Owner','active',?,?)").run(actor, at, at);
  return { db, publish: (document: ReturnType<typeof emptyMembershipPlan>) => writeMembershipPlanEditor(db, actor,
    { requestId: randomUUID(), draftId: null, revision: null, document, intent: "publish", applyToMembers: false }, at) };
}

describe("Optional add-ons on plan cards", () => {
  it("defaults new and older saved documents to off", () => {
    expect(emptyMembershipPlan().showOptionalAddons).toBe(false);
    const older = { ...emptyMembershipPlan() };
    delete (older as Partial<typeof older>).showOptionalAddons;
    expect(membershipPlanEditorSchema.parse(older).showOptionalAddons).toBe(false);
  });

  it.each([true, false])("persists the opt-in and gates selectors for displayOnly=%s while retaining the add-on section", displayOnly => {
    const f = fixture();
    try {
      const base = emptyMembershipPlan(); base.name = "Base"; base.visibility = "public"; base.displayOnly = displayOnly;
      const price = newMembershipPlanPrice(randomUUID()); price.name = "Free access"; price.provider = "free";
      base.prices.push(price);
      const published = f.publish(base);
      const addon = emptyMembershipPlan(); addon.name = "Extra"; addon.visibility = "public"; addon.packageType = "addon"; addon.features = [];
      addon.displayOnly = displayOnly; addon.prices.push({ ...price, id: randomUUID() }); f.publish(addon);
      const catalog = new PlatformMembershipCatalogRepository(f.db);
      const render = (privateOffer = false) => renderToStaticMarkup(createElement(PlanCatalog, { plans: catalog.readPublicPlans(), privateOffer, embedded: true }));
      // Simulate an existing stored presentation from before the setting existed.
      const version = f.db.prepare("SELECT document_json FROM platform_membership_plan_presentations WHERE plan_version_id=?").get(published.versionId) as { document_json: string };
      const older = JSON.parse(version.document_json); delete older.showOptionalAddons;
      f.db.prepare("UPDATE platform_membership_plan_presentations SET document_json=? WHERE plan_version_id=?").run(JSON.stringify(older), published.versionId);
      expect(readMembershipPlanEditor(f.db, published.planId!).showOptionalAddons).toBe(false);
      expect(render()).not.toContain("<legend>Optional add-ons</legend>");
      expect(render()).toContain('id="plan-addons-title"');
      const enabled = readMembershipPlanEditor(f.db, published.planId!); enabled.showOptionalAddons = true; f.publish(enabled);
      expect(readMembershipPlanEditor(f.db, published.planId!).showOptionalAddons).toBe(true);
      expect(render()).toContain("<legend>Optional add-ons</legend>");
      expect(render(true)).not.toContain("<legend>Optional add-ons</legend>");
      const disabled = readMembershipPlanEditor(f.db, published.planId!); disabled.showOptionalAddons = false; f.publish(disabled);
      expect(render()).not.toContain("<legend>Optional add-ons</legend>");
      expect(render()).toContain('id="plan-addons-title"');
    } finally { f.db.close(); }
  });
});
