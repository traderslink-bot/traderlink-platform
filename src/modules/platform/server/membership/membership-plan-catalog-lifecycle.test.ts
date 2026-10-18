import { resolveTraderLinkDiscordGuildId } from "../authentication/platform-discord-configuration";
import { PlatformDiscordMembershipRepository } from "../authentication/platform-discord-membership-repository";
import { recordMembershipDiscordAbsence } from "./platform-membership-discord";
import { readMembershipDiscordConnection } from "./membership-discord-connection";
import { randomUUID, createHmac } from "node:crypto";
import Database from "better-sqlite3";
import { describe, expect, it, vi } from "vitest";
import { emptyMembershipPlan, newMembershipPlanPrice } from "../../contracts/membership-plan-editor";
import { platformIdentityMigration } from "../database/migrations/0001_platform_identity";
import { platformAuthenticationIdentitiesMigration } from "../database/migrations/0012_platform_authentication_identities";
import { platformDiscordMembershipsMigration } from "../database/migrations/0017_platform_discord_memberships";
import { platformMembershipPlatformMigration } from "../database/migrations/0148_platform_membership_platform";
import { platformMembershipGenerationAllowancesMigration } from "../database/migrations/0150_platform_membership_generation_allowances";
import { platformMembershipFeatureCopyMigration } from "../database/migrations/0157_platform_membership_feature_copy";
import { platformMemberPrivateWatchlistsMigration } from "../database/migrations/0158_platform_member_private_watchlists";
import { platformMembershipUnifiedEditorMigration } from "../database/migrations/0165_platform_membership_unified_editor";
import { writeMembershipPlanEditor } from "./membership-plan-editor-write";
import { readMembershipPlanEditor, readMembershipPlanList } from "./membership-plan-editor-read";
import { MembershipPlanEditorDrafts } from "./membership-plan-editor-drafts";
import { archiveMembershipPlan, deleteMembershipPlan } from "./membership-plan-editor-archive";
import { reserveMembershipAddonCheckout } from "./membership-addon-checkout";
import { readGenerationAllowance } from "./platform-membership-generation-allowance";
import { PlatformMembershipClaims } from "./platform-membership-claims";
import { PlatformMembershipRepository } from "./platform-membership-repository";
import { createMembershipStripeCheckout, verifyMembershipStripeEvent, applyMembershipStripeEvent } from "./platform-membership-stripe";
import { PlatformMembershipCatalogRepository } from "./platform-membership-catalog-repository";

const at = "2026-10-13T20:00:00.000Z";
function fixture() {
  const db = new Database(":memory:"); db.pragma("foreign_keys=ON");
  for (const migration of [platformIdentityMigration, platformAuthenticationIdentitiesMigration, platformDiscordMembershipsMigration,
    platformMembershipPlatformMigration, platformMembershipGenerationAllowancesMigration, platformMembershipFeatureCopyMigration,
    platformMemberPrivateWatchlistsMigration, platformMembershipUnifiedEditorMigration]) for (const sql of migration.statements) db.exec(sql);
  const actor = randomUUID();
  db.prepare("INSERT INTO platform_users VALUES (?,'test','owner','Owner','active',?,?)").run(actor, at, at);
  const document = emptyMembershipPlan(); document.name = "Published test"; document.visibility = "public"; document.displayOnly = true;
  document.prices.push(newMembershipPlanPrice(randomUUID()));
  const publish = (doc: typeof document, draftId: string | null = null, revision: number | null = null) => writeMembershipPlanEditor(db, actor,
    { requestId: randomUUID(), draftId, revision, document: doc, intent: "publish", applyToMembers: false }, at);
  publish(document);
  const planId = readMembershipPlanList(db)[0].planId!;
  return { db, actor, planId, publish, store: new MembershipPlanEditorDrafts(db), catalog: new PlatformMembershipCatalogRepository(db) };
}

describe("Plan catalog lifecycle", () => {
  it("preserves Discord requirements and detects active unconnected plans without blocking free signup", () => {
    const f = fixture(); try {
      const doc = readMembershipPlanEditor(f.db, f.planId);
      expect(Object.hasOwn(doc, "requiresDiscord")).toBe(false);
      doc.requiresDiscord = true; doc.displayOnly = false; doc.prices[0].provider = "free"; doc.prices[0].name = "Free";
      const published = f.publish(doc);
      expect(readMembershipPlanEditor(f.db, f.planId).requiresDiscord).toBe(true);
      expect(f.catalog.readPublicPlans().find(plan => plan.planVersionId === published.versionId)?.requiresDiscord).toBe(true);
      expect(readMembershipDiscordConnection(f.db, f.actor, at)).toEqual({ connected: false, joined: false, required: false });
      const claims = new PlatformMembershipClaims(f.db);
      const reserved = claims.reserve({ userId: f.actor, offerId: published.offerIds![0], atUtc: at });
      claims.fulfillFree(reserved.claimId, f.actor, at);
      expect(readMembershipDiscordConnection(f.db, f.actor, at)).toEqual({ connected: false, joined: false, required: true });
      f.db.prepare("INSERT INTO platform_auth_identities VALUES (?,'discord','synthetic-discord','active',?,?,?,NULL)").run(f.actor, f.actor, at, at);
      expect(readMembershipDiscordConnection(f.db, f.actor, at)).toEqual({ connected: true, joined: false, required: true });
      const memberships = new PlatformDiscordMembershipRepository(f.db);
      const membership = { userId: f.actor, guildId: resolveTraderLinkDiscordGuildId(), username: "synthetic",
        globalDisplayName: null, avatarHash: null, roleIds: [], guildOwner: false, joinedAtUtc: at, verifiedAtUtc: at };
      memberships.upsertCurrent({ ...membership, guildId: "123456789" });
      expect(readMembershipDiscordConnection(f.db, f.actor, at).joined).toBe(false);
      memberships.upsertCurrent(membership);
      expect(readMembershipDiscordConnection(f.db, f.actor, at)).toEqual({ connected: true, joined: true, required: true });
      recordMembershipDiscordAbsence(f.db, f.actor, membership.guildId, "2026-10-13T20:00:01.000Z");
      expect(readMembershipDiscordConnection(f.db, f.actor, at).joined).toBe(false);
      memberships.upsertCurrent({ ...membership, verifiedAtUtc: "2026-10-13T20:00:02.000Z" });
      expect(readMembershipDiscordConnection(f.db, f.actor, at).joined).toBe(true);
      f.db.prepare("UPDATE platform_auth_identities SET status='revoked' WHERE user_id=?").run(f.actor);
      expect(readMembershipDiscordConnection(f.db, f.actor, at)).toEqual({ connected: false, joined: false, required: true });
      const other = randomUUID(); f.db.prepare("INSERT INTO platform_users VALUES (?,'test','other','Other','active',?,?)").run(other, at, at);
      expect(readMembershipDiscordConnection(f.db, other, at)).toEqual({ connected: false, joined: false, required: false });
      f.db.prepare("UPDATE platform_membership_entitlements SET ends_at_utc=? WHERE user_id=?").run("2026-10-14T00:00:00.000Z", f.actor);
      expect(readMembershipDiscordConnection(f.db, f.actor, "2026-10-15T00:00:00.000Z")).toEqual({ connected: false, joined: false, required: false });
    } finally { f.db.close(); }
  });

  it("preserves ordinary claim handling when optional unified-editor presentation storage is absent", () => {
    const f = fixture(); try {
      const doc = readMembershipPlanEditor(f.db, f.planId); doc.displayOnly = false; doc.prices[0].provider = "free"; doc.prices[0].name = "Free";
      const published = f.publish(doc);
      f.db.exec("DROP TABLE platform_membership_plan_presentations");
      const claims = new PlatformMembershipClaims(f.db);
      const reserved = claims.reserve({ userId: f.actor, offerId: published.offerIds![0], atUtc: at });
      claims.fulfillFree(reserved.claimId, f.actor, at);
      expect(new PlatformMembershipRepository(f.db).readEffectiveAccess(f.actor, at).booleanFeatures).toContain("journal.access");
    } finally { f.db.close(); }
  });
  it("creates an exact-price buyer-bound bundle with additive access only after payment, safe retries and hidden generated plans", async () => {
    const f = fixture();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_synthetic_only"); vi.stubEnv("STRIPE_MEMBERSHIP_WEBHOOK_SECRET", "synthetic_only");
    try {
      f.db.prepare(`INSERT INTO platform_membership_provider_definitions
        (provider_key,label,integration_mode,configuration_state,created_by_user_id,created_at_utc,updated_at_utc)
        VALUES ('stripe','Stripe','native','ready',?,?,?)`).run(f.actor, at, at);
      f.db.exec(`CREATE TABLE level_analysis_analyzer_reservations(reservation_id,user_id,correction_waiver,status,expires_at_utc);
        CREATE TABLE level_analysis_analyzer_acquisitions(reservation_id,charged_user_id,charge_kind,started_at_utc);`);
      const base = readMembershipPlanEditor(f.db, f.planId); base.displayOnly = false;
      for (const key of ["levels.generations", "trade_analyzer.analyses"]) base.features.push({ key, limit: 10, resetDays: 30, period: null, brief: null, details: null });
      base.prices[0].name = "Free base"; base.prices[0].provider = "free"; f.publish(base);
      const baseOffer = readMembershipPlanEditor(f.db, f.planId).prices[0].id;
      const addons: string[] = [];
      for (const [name, amount, limit] of [["Stock Tools", "10.25", 20], ["Extra Tools", "5.50", 5]] as const) {
        const addon = emptyMembershipPlan(); addon.packageType = "addon"; addon.requiresDiscord = name === "Stock Tools"; addon.name = name; addon.visibility = "public";
        addon.features = ["levels.generations", "trade_analyzer.analyses"].map(key => ({ key, limit, resetDays: 30, period: null, brief: null, details: null }));
        const price = newMembershipPlanPrice(randomUUID()); price.provider = "stripe"; price.name = name; price.billing = "recurring";
        price.initialPrice = price.renewalPrice = amount; addon.prices = [price]; const published = f.publish(addon);
        addons.push(published.offerIds![0]);
      }
      expect(() => new PlatformMembershipClaims(f.db).reserve({ userId: f.actor, offerId: addons[0], atUtc: at })).toThrow(/selected with a plan/);
      f.db.prepare("UPDATE platform_membership_offers SET access_duration_days=3 WHERE offer_id=?").run(baseOffer);
      expect(() => reserveMembershipAddonCheckout(f.db, f.actor, baseOffer, addons, at)).toThrow(/separate expiry/);
      expect(f.db.prepare("SELECT COUNT(*) n FROM platform_membership_entitlements").get()).toEqual({ n: 0 });
      f.db.prepare("UPDATE platform_membership_offers SET access_duration_days=NULL WHERE offer_id=?").run(baseOffer);
      const reserved = reserveMembershipAddonCheckout(f.db, f.actor, baseOffer, addons, at);
      expect(reserved.offer.renewal_amount_minor).toBe(1575);
      expect(new PlatformMembershipRepository(f.db).readEffectiveAccess(f.actor, at).limits["levels.generations"]).toBe(10);
      expect(readGenerationAllowance(f.db, f.actor, "trade_analyzer.analyses", new Date(at))?.remaining).toBe(10);
      const retry = reserveMembershipAddonCheckout(f.db, f.actor, baseOffer, [...addons].reverse(), at);
      expect(retry.claimId).toBe(reserved.claimId);
      const bundlePresentation = f.db.prepare("SELECT document_json FROM platform_membership_plan_presentations WHERE plan_version_id=?").get(reserved.offer.plan_version_id) as { document_json: string };
      expect(JSON.parse(bundlePresentation.document_json).requiresDiscord).toBe(true);
      expect(readMembershipPlanList(f.db)).toHaveLength(3);
      expect(f.catalog.readPublicPlans()).toHaveLength(3);
      expect(f.catalog.readPublicPlans().filter(p => p.packageType === "addon")).toHaveLength(2);
      let submitted: URLSearchParams | null = null;
      vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
        submitted = init.body as URLSearchParams;
        return new Response(JSON.stringify({ id: "cs_test_synthetic", url: "https://checkout.stripe.com/c/test_synthetic" }), { status: 200 });
      }));
      await createMembershipStripeCheckout(reserved);
      expect(submitted!.get("line_items[0][price_data][unit_amount]")).toBe("1575");
      expect(submitted!.get("line_items[0][price_data][recurring][interval]")).toBe("month");
      f.db.prepare("UPDATE platform_membership_claims SET external_session_ref='cs_test_synthetic' WHERE claim_id=?").run(reserved.claimId);
      const epoch = Date.parse(at) / 1000;
      const subscription = { id: "sub_test_synthetic", customer: "cus_test_synthetic", status: "active", cancel_at_period_end: false,
        current_period_start: epoch, current_period_end: epoch + 30 * 86400, items: { data: [{}] }, metadata: { membership_claim_id: reserved.claimId } };
      const event = { id: "evt_test_synthetic", type: "checkout.session.completed", created: epoch,
        data: { object: { id: "cs_test_synthetic", payment_status: "paid", metadata: { membership_claim_id: reserved.claimId } } } };
      const raw = JSON.stringify(event); const signature = createHmac("sha256", "synthetic_only").update(`${epoch}.${raw}`).digest("hex");
      const verified = verifyMembershipStripeEvent(raw, `t=${epoch},v1=${signature}`, "synthetic_only", Date.parse(at));
      expect(applyMembershipStripeEvent(f.db, verified, subscription, raw)).toBe("applied");
      expect(applyMembershipStripeEvent(f.db, verified, subscription, raw)).toBe("duplicate");
      expect(new PlatformMembershipRepository(f.db).readEffectiveAccess(f.actor, at).limits["levels.generations"]).toBe(35);
      expect(readGenerationAllowance(f.db, f.actor, "trade_analyzer.analyses", new Date(at))?.remaining).toBe(35);
      f.db.prepare("INSERT INTO level_analysis_analyzer_reservations VALUES ('bundle-use',?,0,'consumed',?)").run(f.actor,at);
      f.db.prepare("INSERT INTO level_analysis_analyzer_acquisitions VALUES ('bundle-use',?,'user_charged',?)").run(f.actor,at);
      expect(readGenerationAllowance(f.db, f.actor, "trade_analyzer.analyses", new Date(at))?.remaining).toBe(34);
      expect(readMembershipDiscordConnection(f.db, f.actor, at).required).toBe(true);
      const ended = { ...event, id: "evt_ended_synthetic", type: "customer.subscription.deleted" };
      applyMembershipStripeEvent(f.db, ended, { ...subscription, status: "canceled" }, JSON.stringify(ended));
      expect(new PlatformMembershipRepository(f.db).readEffectiveAccess(f.actor, at).limits["levels.generations"]).toBe(10);
      expect(readGenerationAllowance(f.db, f.actor, "trade_analyzer.analyses", new Date(at))?.remaining).toBe(9);
      expect(readMembershipDiscordConnection(f.db, f.actor, at).required).toBe(false);
      expect(() => reserveMembershipAddonCheckout(f.db, f.actor, baseOffer, [addons[0], addons[0]], at)).toThrow(/more than once/);
      const secondBuyer = randomUUID(); f.db.prepare("INSERT INTO platform_users VALUES (?,'test','buyer','Buyer','active',?,?)").run(secondBuyer, at, at);
      expect(() => new PlatformMembershipClaims(f.db).reserve({ userId: secondBuyer, offerId: reserved.offer.offer_id, allowBundle: true, atUtc: at })).toThrow(/another checkout/);
    } finally { vi.unstubAllEnvs(); vi.unstubAllGlobals(); f.db.close(); }
  });
  it("distinguishes published name from draft, reconciles a stale baseline without losing edits and clears drafts on publish", () => {
    const f = fixture(); try {
      const doc = readMembershipPlanEditor(f.db, f.planId); doc.name = "Starter";
      const saved = f.store.save(f.actor, randomUUID(), doc, null, null, at);
      expect(readMembershipPlanList(f.db)[0]).toMatchObject({ name: "Published test", draftName: "Starter", hasDraft: true });
      expect(f.catalog.readPublicPlans().map(p => p.name)).toEqual(["Published test"]);
      f.db.prepare("UPDATE platform_membership_plans SET internal_note='concurrent edit' WHERE plan_id=?").run(f.planId);
      expect(() => f.publish(saved.document, saved.draftId, saved.revision)).toThrow(/published plan changed/);
      const current = readMembershipPlanList(f.db)[0].currentBaseRevision!;
      expect(() => f.store.refreshBaseline(f.actor, saved.draftId, saved.revision + 1, current, at)).toThrow(/draft changed/);
      expect(() => f.store.refreshBaseline(f.actor, saved.draftId, saved.revision, "0".repeat(64), at)).toThrow(/changed again/);
      const refreshed = f.store.refreshBaseline(f.actor, saved.draftId, saved.revision, current, at);
      expect(refreshed.document).toEqual({ ...saved.document, baseRevision: current });
      f.publish(refreshed.document, refreshed.draftId, refreshed.revision);
      expect(readMembershipPlanList(f.db)[0]).toMatchObject({ name: "Starter", hasDraft: false, draftId: null });
      expect(f.catalog.readPublicPlans().map(p => p.name)).toEqual(["Starter"]);
    } finally { f.db.close(); }
  });
  it.each(["active", "archived"])("deletes a %s plan while preserving access/history, rejecting republishing and safely retrying", status => {
    const f = fixture(); try {
      const version = f.db.prepare("SELECT plan_version_id FROM platform_membership_plan_versions WHERE plan_id=?").get(f.planId) as { plan_version_id: string };
      f.db.prepare(`INSERT INTO platform_membership_entitlements VALUES (?, ?, ?, 'owner_grant', 'test', 'active', ?, NULL, ?, 'preserve', ?, ?)`)
        .run(randomUUID(), f.actor, version.plan_version_id, at, f.actor, at, at);
      const entitlements = f.db.prepare("SELECT * FROM platform_membership_entitlements").all();
      const draft = f.store.save(f.actor, randomUUID(), readMembershipPlanEditor(f.db, f.planId), null, null, at);
      if (status === "archived") {
        archiveMembershipPlan(f.db, f.actor, f.planId, at);
        expect(f.catalog.readPublicPlans()).toEqual([]);
        expect(readMembershipPlanList(f.db)[0].status).toBe("archived");
      }
      const history = f.db.prepare("SELECT COUNT(*) n FROM platform_membership_plan_versions").get();
      deleteMembershipPlan(f.db, f.actor, f.planId, at);
      deleteMembershipPlan(f.db, f.actor, f.planId, at);
      expect(readMembershipPlanList(f.db)).toEqual([]);
      expect(f.db.prepare("SELECT * FROM platform_membership_entitlements").all()).toEqual(entitlements);
      expect(() => f.store.read(draft.draftId)).toThrow();
      expect(f.catalog.readPublicPlans()).toEqual([]);
      expect(f.db.prepare("SELECT COUNT(*) n FROM platform_membership_plan_versions").get()).toEqual(history);
      expect(() => readMembershipPlanEditor(f.db, f.planId)).toThrow(/deleted/);
      expect(f.db.prepare("SELECT COUNT(*) n FROM platform_membership_audit_events WHERE action='plan_editor.deleted'").get()).toEqual({ n: 1 });
    } finally { f.db.close(); }
  });
});
