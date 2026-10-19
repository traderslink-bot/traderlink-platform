import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { membershipPlanEditorSchema, newMembershipPlanPrice } from "../../contracts/membership-plan-editor";
import { combinedMembershipFeatures } from "../../contracts/membership-addons";
import { currencyDecimals } from "../../contracts/platform-membership-pricing";
import { createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { readMembershipEditorChoices } from "./membership-plan-editor-read";
import { writeMembershipPlanEditor } from "./membership-plan-editor-write";
import { membershipUsageAnchor } from "./membership-plan-usage";
import { PlatformMembershipCatalogRepository } from "./platform-membership-catalog-repository";

type Component = { offer_id: string; plan_id: string; plan_version_id: string; published_at_utc: string; document_json: string;
  currency: string | null; renewal_amount_minor: number | null; initial_amount_minor: number | null; billing_kind: string;
  billing_interval: string | null; billing_interval_count: number | null; access_duration_days: number | null; provider: string;
  configuration_state: string; status: string; plan_status: string; visibility: string; lifecycle_state: string; channel: string };
function component(db: Database.Database, offerId: string): Component {
  const row = db.prepare(`SELECT o.*,v.plan_id,v.published_at_utc,v.lifecycle_state,p.status plan_status,p.visibility,s.document_json,d.configuration_state
    FROM platform_membership_offers o JOIN platform_membership_plan_versions v USING(plan_version_id)
    JOIN platform_membership_plans p USING(plan_id) JOIN platform_membership_plan_presentations s USING(plan_version_id)
    JOIN platform_membership_provider_definitions d ON d.provider_key=o.provider WHERE o.offer_id=?`).get(offerId) as Component | undefined;
  if (!row) throw new Error("This package is no longer available.");
  return row;
}

/** Caller owns an immediate transaction. Existing accepted terms may be archived;
 * new components must be public or included in a valid private invitation. Never reserves a
 * second checkout/claim or grants access merely by preparing a target snapshot.
 */
export function prepareMembershipAmendmentBundle(db: Database.Database, userId: string, originalOfferId: string, addonOfferIds: readonly string[], at: string, invitationSecret?: string) {
  if (!db.inTransaction) throw new Error("Amendment bundle needs a transaction.");
  if (!addonOfferIds.length || new Set(addonOfferIds).size !== addonOfferIds.length) throw new Error("Choose distinct add-on packages.");
  const original = component(db, originalOfferId);
  const originalDoc = membershipPlanEditorSchema.parse(JSON.parse(original.document_json));
  if (originalDoc.packageType !== "plan" || originalDoc.displayOnly || original.provider !== "stripe" || original.billing_kind !== "recurring" ||
    original.billing_interval !== "month" || original.billing_interval_count !== 1 || original.access_duration_days !== null ||
    !original.currency || original.renewal_amount_minor === null) throw new Error("This subscription cannot use monthly add-on amendments.");
  const oldIds = originalDoc.bundleOfferIds.length ? originalDoc.bundleOfferIds : [originalOfferId];
  const oldPlans = new Set(oldIds.map(id => component(db, id).plan_id));
  const invitedOffers = invitationSecret && /^[A-Za-z0-9_-]{40,64}$/u.test(invitationSecret)
    ? new Set(new PlatformMembershipCatalogRepository(db).readSharedPlans(invitationSecret,at)?.flatMap(plan=>plan.offers.map(offer=>offer.offerId)) ?? []) : null;
  if (invitationSecret && !addonOfferIds.every(id=>invitedOffers?.has(id))) throw new Error("This private offer is no longer available. Reopen your invitation.");
  const selected = addonOfferIds.map(id => {
    const row = component(db, id), doc = membershipPlanEditorSchema.parse(JSON.parse(row.document_json));
    if (row.status !== "active" || row.plan_status !== "active" || (!invitedOffers?.has(id) && (row.visibility !== "public" || !["website", "both"].includes(row.channel))) || row.lifecycle_state !== "published" ||
      !["test", "ready"].includes(row.configuration_state) || doc.packageType !== "addon" ||
      doc.displayOnly || doc.bundleOfferIds.length || row.access_duration_days !== null || oldPlans.has(row.plan_id)) throw new Error("This add-on is unavailable or already included.");
    oldPlans.add(row.plan_id);
    if (row.billing_kind !== "free" && (row.provider !== "stripe" || row.billing_kind !== "recurring" || row.billing_interval !== "month" ||
      row.billing_interval_count !== 1 || row.currency !== original.currency || row.renewal_amount_minor === null ||
      row.initial_amount_minor !== row.renewal_amount_minor)) throw new Error("This add-on needs compatible monthly pricing without a separate entry charge.");
    if (row.provider === "stripe" && row.configuration_state !== original.configuration_state) throw new Error("This add-on uses a different payment environment.");
    return { row, doc };
  });
  const total = selected.reduce((amount, { row }) => amount + (row.billing_kind === "free" ? 0 : row.renewal_amount_minor!), original.renewal_amount_minor);
  if (!Number.isSafeInteger(total) || total < original.renewal_amount_minor) throw new Error("This combined price is too large.");
  const key = `amend_bundle_${createHash("sha256").update(JSON.stringify([userId, originalOfferId, [...addonOfferIds].sort()])).digest("hex")}`;
  let target = db.prepare(`SELECT o.offer_id,o.plan_version_id FROM platform_membership_plans p JOIN platform_membership_plan_versions v USING(plan_id)
    JOIN platform_membership_offers o USING(plan_version_id) WHERE p.plan_key=?`).get(key) as { offer_id: string; plan_version_id: string } | undefined;
  if (!target) {
    const doc = structuredClone(originalDoc);
    Object.assign(doc, { planId: null, baseRevision: "", visibility: "unlisted", privatePageIds: [], internalNote: "", bundleOfferIds: [...oldIds, ...addonOfferIds],
      name: [originalDoc.name, ...selected.map(x => x.doc.name)].join(" + ").slice(0, 120), requiresDiscord: originalDoc.requiresDiscord || selected.some(x => x.doc.requiresDiscord) });
    doc.features = combinedMembershipFeatures([originalDoc.features, ...selected.map(x => x.doc.features)], new Map(readMembershipEditorChoices(db).features.map(x => [x.key, x.kind])));
    const price = newMembershipPlanPrice(createCanonicalUuidV4()), digits = currencyDecimals(original.currency), scale = BigInt(10) ** BigInt(digits);
    const amount = digits ? `${BigInt(total) / scale}.${String(BigInt(total) % scale).padStart(digits, "0")}` : String(total);
    Object.assign(price, { name: "Plan and add-ons", channel: "private", provider: "stripe", billing: "recurring", currency: original.currency, initialPrice: amount, renewalPrice: amount });
    doc.prices = [price];
    const saved = writeMembershipPlanEditor(db, userId, { requestId: createCanonicalUuidV4(), draftId: null, revision: null, document: doc, intent: "publish", applyToMembers: false }, at);
    if (!saved.planId || !saved.versionId || !saved.offerIds?.[0]) throw new Error("This add-on selection could not be prepared.");
    db.prepare("UPDATE platform_membership_plans SET plan_key=? WHERE plan_id=?").run(key, saved.planId);
    target = { offer_id: saved.offerIds[0], plan_version_id: saved.versionId };
    for (const feature of doc.features) {
      const source = originalDoc.features.some(x => x.key === feature.key) ? original : selected.find(x => x.doc.features.some(f => f.key === feature.key))!.row;
      db.prepare("UPDATE platform_membership_feature_usage_anchors SET anchor_at_utc=? WHERE plan_version_id=? AND feature_key=?")
        .run(membershipUsageAnchor(db, source.plan_version_id, feature.key, source.published_at_utc), target.plan_version_id, feature.key);
    }
  }
  return { original, offerId: target.offer_id, versionId: target.plan_version_id, currency: original.currency, monthlyMinor: total, addonNames: selected.map(x=>x.doc.name) };
}
