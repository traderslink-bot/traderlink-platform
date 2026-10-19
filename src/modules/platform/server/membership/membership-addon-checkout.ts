import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { membershipPlanEditorSchema, newMembershipPlanPrice } from "../../contracts/membership-plan-editor";
import { combinedMembershipFeatures, combinedMembershipPrice } from "../../contracts/membership-addons";
import { editorPriceTerms } from "../../contracts/membership-price-card";
import { currencyDecimals } from "../../contracts/platform-membership-pricing";
import { createCanonicalUuidV4, assertCanonicalUuidV4, assertCanonicalUtcTimestamp } from "../database/platform-migration-contract";
import { readMembershipPlanEditor, readMembershipEditorChoices } from "./membership-plan-editor-read";
import { writeMembershipPlanEditor } from "./membership-plan-editor-write";
import { PlatformMembershipClaims } from "./platform-membership-claims";
import { membershipUsageAnchor } from "./membership-plan-usage";

/** Build a buyer-bound immutable monthly bundle using existing versioned offer storage. */
export function reserveMembershipAddonCheckout(db: Database.Database, userId: string, baseOfferId: string, addonOfferIds: readonly string[], at: string) {
  assertCanonicalUuidV4(userId, "userId"); assertCanonicalUtcTimestamp(at, "at");
  for (const id of [baseOfferId, ...addonOfferIds]) assertCanonicalUuidV4(id, "offerId");
  if (new Set([baseOfferId, ...addonOfferIds]).size !== addonOfferIds.length + 1) throw new Error("This selection includes a package more than once.");
  return db.transaction(() => {
    const selected = [baseOfferId, ...addonOfferIds].map((offerId, index) => {
      const row = db.prepare(`SELECT p.plan_id,v.plan_version_id,v.published_at_utc,s.document_json FROM platform_membership_offers o
        JOIN platform_membership_plan_versions v USING(plan_version_id) JOIN platform_membership_plans p USING(plan_id)
        JOIN platform_membership_plan_presentations s USING(plan_version_id)
        WHERE o.offer_id=? AND o.status='active' AND p.status='active' AND p.visibility='public' AND v.lifecycle_state='published'
        AND o.channel IN ('website','both')`).get(offerId) as { plan_id: string; plan_version_id: string; published_at_utc: string; document_json: string } | undefined;
      if (!row) throw new Error("This package is no longer available.");
      const doc = membershipPlanEditorSchema.parse(JSON.parse(row.document_json));
      if (doc.displayOnly || doc.bundleOfferIds.length || doc.packageType !== (index ? "addon" : "plan")) throw new Error("This package cannot be selected for this checkout.");
      const current = readMembershipPlanEditor(db, row.plan_id, row.plan_version_id);
      const price = current.prices.find(price => price.id === offerId && price.enabled);
      if (!price || (price.billing !== "free" && price.provider !== "stripe")) throw new Error("This combined checkout requires Stripe for paid packages.");
      if (price.accessDays !== null) throw new Error("This combined checkout needs access options without a separate expiry duration.");
      return { row, doc: current, price };
    });
    if (new Set(selected.map(item => item.row.plan_id)).size !== selected.length) throw new Error("This selection includes an add-on package more than once.");
    const total = combinedMembershipPrice(selected.map(item => editorPriceTerms(item.price)));
    const fingerprint = createHash("sha256").update(JSON.stringify({ userId, versions: selected.map(item => item.row.plan_version_id).sort(), offers: [baseOfferId, ...addonOfferIds].sort() })).digest("hex");
    const key = `bundle_${fingerprint}`;
    let existing = db.prepare(`SELECT o.offer_id FROM platform_membership_plans p JOIN platform_membership_plan_versions v USING(plan_id)
      JOIN platform_membership_offers o USING(plan_version_id) WHERE p.plan_key=? AND p.status='active' AND o.status='active'`).get(key) as { offer_id: string } | undefined;
    if (!existing) {
      const choices = readMembershipEditorChoices(db);
      const document = structuredClone(selected[0].doc);
      document.planId = null; document.baseRevision = ""; document.bundleOfferIds = [baseOfferId, ...addonOfferIds];
      document.name = selected.map(item => item.doc.name).join(" + ");
      if (document.name.length > 120) document.name = `${selected[0].doc.name.slice(0, 75)} + ${addonOfferIds.length} add-ons`;
      document.privatePageIds = []; document.internalNote = "";
      document.requiresDiscord = selected.some(item => item.doc.requiresDiscord);
      document.features = combinedMembershipFeatures(selected.map(item => item.doc.features), new Map(choices.features.map(feature => [feature.key, feature.kind])));
      const price = newMembershipPlanPrice(createCanonicalUuidV4()); price.name = "Plan and add-ons";
      price.billing = total.billingKind === "free" ? "free" : "recurring"; price.provider = price.billing === "free" ? "free" : "stripe"; price.currency = total.currency!;
      const digits = currencyDecimals(price.currency); const scale = BigInt(10) ** BigInt(digits);
      const amount = (minor: number) => digits ? `${BigInt(minor) / scale}.${String(BigInt(minor) % scale).padStart(digits, "0")}` : String(minor);
      price.initialPrice = amount(total.initialAmountMinor!); price.renewalPrice = amount(total.renewalAmountMinor!);
      document.prices = [price];
      const published = writeMembershipPlanEditor(db, userId, { requestId: createCanonicalUuidV4(), draftId: null, revision: null, document, intent: "publish", applyToMembers: false }, at);
      if (!published.planId || !published.versionId || !published.offerIds?.[0]) throw new Error("This combined checkout could not be prepared.");
      db.prepare("UPDATE platform_membership_plans SET plan_key=? WHERE plan_id=?").run(key, published.planId);
      // Keep original usage boundaries: choosing a bundle cannot reset consumed allowance.
      const version = { plan_version_id: published.versionId };
      for (const feature of document.features) {
        const source = selected.find(item => item.doc.features.some(f => f.key === feature.key));
        if (source) db.prepare("UPDATE platform_membership_feature_usage_anchors SET anchor_at_utc=? WHERE plan_version_id=? AND feature_key=?")
          .run(membershipUsageAnchor(db, source.row.plan_version_id, feature.key, source.row.published_at_utc), version.plan_version_id, feature.key);
      }
      existing = { offer_id: published.offerIds[0] };
    }
    // Free base access remains available when paid add-ons are cancelled.
    if (selected[0].price.billing === "free") {
      const base = new PlatformMembershipClaims(db).reserve({ userId, offerId: baseOfferId, atUtc: at });
      new PlatformMembershipClaims(db).fulfillFree(base.claimId, userId, at);
    }
    return new PlatformMembershipClaims(db).reserve({ userId, offerId: existing.offer_id, atUtc: at, allowBundle: true });
  }).immediate();
}
