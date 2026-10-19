import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { z } from "zod";
import { combinedMembershipFeatures } from "../../contracts/membership-addons";
import { storedMembershipProductFeatures } from "../../contracts/membership-product-features";
import { membershipPlanEditorSchema, newMembershipPlanPrice } from "../../contracts/membership-plan-editor";
import { createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { membershipInvoiceLinePrice, stripeReference } from "./membership-addon-amendment-evidence";
import { writeMembershipPlanEditor } from "./membership-plan-editor-write";
import { carryMembershipUsage, membershipUsageAnchor } from "./membership-plan-usage";
import type { MembershipStripeRefundEvidence } from "./membership-stripe-refund-hydration";

const record = z.record(z.string(), z.unknown());
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const action = "stripe.purchase_refunded";
type Claim = { user_id: string; offer_id: string; plan_version_id: string; trial_campaign_id: string | null; external_session_ref: string | null };
type Entitlement = { entitlement_id: string; plan_version_id: string; ends_at_utc: string | null; status: string; updated_at_utc: string };
type Component = { offer_id: string; plan_id: string; plan_version_id: string; published_at_utc: string; name: string; document_json: string | null };
type RefundMarker = { chargeHash: string; coveredUntil: string | null; invoiceHash: string | null;
  removedPlanIds: string[]; before: Entitlement | null; after: Entitlement | null };

function hasTable(db: Database.Database, name: string): boolean {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(name));
}

function component(db: Database.Database, offerId: string): Component {
  const row = db.prepare(`SELECT o.offer_id,v.plan_id,v.plan_version_id,v.published_at_utc,p.name,s.document_json
    FROM platform_membership_offers o JOIN platform_membership_plan_versions v USING(plan_version_id)
    JOIN platform_membership_plans p USING(plan_id)
    LEFT JOIN platform_membership_plan_presentations s USING(plan_version_id)
    WHERE o.offer_id=? AND v.lifecycle_state='published'`).get(offerId) as Component | undefined;
  if (!row) throw new Error("Refund purchase snapshot is unavailable.");
  return row;
}

function components(db: Database.Database, version: string, fallbackOffer: string): Component[] {
  const row = db.prepare("SELECT document_json FROM platform_membership_plan_presentations WHERE plan_version_id=?").get(version) as { document_json: string } | undefined;
  const ids = row ? membershipPlanEditorSchema.parse(JSON.parse(row.document_json)).bundleOfferIds : [];
  if (ids.length) return ids.map(id => component(db, id));
  const fallback = component(db, fallbackOffer);
  if (fallback.plan_version_id === version) return [fallback];
  const ownOffer = db.prepare("SELECT offer_id FROM platform_membership_offers WHERE plan_version_id=? ORDER BY created_at_utc,offer_id LIMIT 1")
    .get(version) as { offer_id: string } | undefined;
  if (!ownOffer) throw new Error("Refund current purchase snapshot is unavailable.");
  return [component(db, ownOffer.offer_id)];
}

function invoiceEnd(invoice: Record<string, unknown>): string {
  const lines = record.parse(invoice.lines);
  if (lines.has_more === true) throw new Error("Refund needs complete invoice coverage.");
  const ends = z.array(record).parse(lines.data).flatMap(line => {
    const period = line.period ? record.parse(line.period) : null;
    return period?.end && Number(line.amount ?? 0) >= 0 ? [z.number().int().positive().parse(period.end)] : [];
  });
  if (!ends.length) throw new Error("Refund invoice has no covered period.");
  return new Date(Math.max(...ends) * 1000).toISOString();
}

function assertPreservableBundle(db: Database.Database, version: string, current: Component[]): void {
  const row = db.prepare("SELECT document_json FROM platform_membership_plan_presentations WHERE plan_version_id=?")
    .get(version) as { document_json: string } | undefined;
  if (!row) return;
  const doc = membershipPlanEditorSchema.parse(JSON.parse(row.document_json));
  if (!doc.bundleOfferIds.length) return;
  if (current.some(item => !item.document_json)) throw new Error("Refund bundle needs complete component snapshots.");
  const kinds = new Map((db.prepare("SELECT feature_key,feature_kind FROM platform_membership_feature_definitions").all() as
    { feature_key: string; feature_kind: string }[]).map(item => [item.feature_key, item.feature_kind]));
  const expected = storedMembershipProductFeatures(combinedMembershipFeatures(current.map(item =>
    membershipPlanEditorSchema.parse(JSON.parse(item.document_json!)).features), kinds), doc.packageType);
  const facts = (features: typeof doc.features) => features.map(({ key, limit, resetDays, period }) =>
    ({ key, limit, resetDays, period })).sort((a, b) => a.key.localeCompare(b.key));
  if (JSON.stringify(facts(expected)) !== JSON.stringify(facts(doc.features))) {
    throw new Error("Refund bundle needs reconciliation after an independent feature change.");
  }
}

function invoiceVersion(db: Database.Database, invoice: Record<string, unknown>, subscriptionId: string, fallback: string): string {
  const prices = z.array(record).parse(record.parse(invoice.lines).data)
    .filter(line => Number(line.amount ?? 0) >= 0).map(membershipInvoiceLinePrice).filter((x): x is string => Boolean(x));
  if (!prices.length || !hasTable(db, "platform_membership_addon_amendments")) return fallback;
  const matches = db.prepare(`SELECT DISTINCT target_plan_version_id FROM platform_membership_addon_amendments
    WHERE external_subscription_ref=? AND state='applied' AND target_price_ref IN (${prices.map(() => "?").join(",")})`)
    .all(subscriptionId, ...prices) as { target_plan_version_id: string }[];
  if (matches.length > 1) throw new Error("Refund invoice purchase is ambiguous.");
  return matches[0]?.target_plan_version_id ?? fallback;
}

function markers(db: Database.Database, sourceRef: string): RefundMarker[] {
  return (db.prepare(`SELECT applied.safe_details_json FROM platform_membership_audit_events applied
    WHERE applied.action=? AND applied.target_type='purchase' AND applied.target_id=?
    AND NOT EXISTS (SELECT 1 FROM platform_membership_audit_events reversed
      WHERE reversed.action='stripe.purchase_refund_reversed' AND reversed.target_type=applied.target_type
      AND reversed.target_id=applied.target_id AND reversed.rowid>applied.rowid
      AND json_extract(reversed.safe_details_json,'$.chargeHash')=json_extract(applied.safe_details_json,'$.chargeHash'))
    ORDER BY applied.rowid`).all(action, `stripe-refund:${digest(sourceRef)}`) as { safe_details_json: string }[])
    .map(row => JSON.parse(row.safe_details_json) as RefundMarker);
}

/** A delayed browser/paid event is never fresh evidence for refunded coverage. */
export function suppressRefundedMembershipStripePayment(db: Database.Database, type: string,
  data: Record<string, unknown>, subscription: Record<string, unknown> | null): boolean {
  const metadata = record.parse(data.metadata ?? {});
  const sourceRef = subscription ? stripeReference(subscription.id) : typeof metadata.membership_claim_id === "string" ? metadata.membership_claim_id : null;
  if (!sourceRef) return false;
  const refunds = markers(db, sourceRef);
  if (!refunds.length) return false;
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(type)) return true;
  if (!type.startsWith("invoice.")) return false;
  const invoiceId = stripeReference(data.id);
  if (refunds.some(refund => invoiceId && refund.invoiceHash === digest(invoiceId))) return true;
  if (type !== "invoice.paid") return false;
  const coveredUntil = invoiceEnd(data);
  return refunds.some(refund => refund.coveredUntil === null || coveredUntil <= refund.coveredUntil);
}

/** Only a genuinely later paid period may restore the packages it paid for. */
export function restoreLaterPaidMembershipStripeCoverage(db: Database.Database, userId: string,
  invoice: Record<string, unknown>, subscriptionId: string, fallbackVersion: string, at: string): void {
  const refunds = markers(db, subscriptionId);
  if (!refunds.length) return;
  const end = invoiceEnd(invoice);
  if (refunds.some(refund => refund.coveredUntil === null || end <= refund.coveredUntil)) return;
  let target = invoiceVersion(db, invoice, subscriptionId, fallbackVersion);
  const targetPlan = db.prepare("SELECT plan_id FROM platform_membership_plan_versions WHERE plan_version_id=?")
    .get(target) as { plan_id: string } | undefined;
  for (const refund of [...refunds].reverse()) {
    if (!refund.before) continue;
    const snapshot = db.prepare("SELECT plan_id FROM platform_membership_plan_versions WHERE plan_version_id=?")
      .get(refund.before.plan_version_id) as { plan_id: string } | undefined;
    if (targetPlan && snapshot?.plan_id === targetPlan.plan_id) { target = refund.before.plan_version_id; break; }
  }
  const existing = db.prepare(`SELECT entitlement_id,plan_version_id,ends_at_utc FROM platform_membership_entitlements
    WHERE user_id=? AND source_type='subscription' AND source_ref=? AND status='active'`)
    .get(userId, subscriptionId) as { entitlement_id: string; plan_version_id: string; ends_at_utc: string | null } | undefined;
  if (!existing || existing.plan_version_id === target) return;
  const currentPlan = db.prepare("SELECT plan_id FROM platform_membership_plan_versions WHERE plan_version_id=?")
    .get(existing.plan_version_id) as { plan_id: string } | undefined;
  // A current owner-published version of the paid plan takes precedence over
  // the older commercial snapshot. Never downgrade it while restoring billing.
  if (targetPlan && currentPlan?.plan_id === targetPlan.plan_id) return;
  if (!refunds.some(refund => refund.after?.plan_version_id === existing.plan_version_id || refund.before?.plan_version_id === existing.plan_version_id)) {
    throw new Error("Paid refund recovery needs reconciliation after an independent access change.");
  }
  carryMembershipUsage(db, userId, [existing.plan_version_id], target, at);
  db.prepare("UPDATE platform_membership_entitlements SET plan_version_id=? WHERE entitlement_id=? AND user_id=?")
    .run(target, existing.entitlement_id, userId);
}

function residualVersion(db: Database.Database, userId: string, currentVersion: string, keep: Component[], at: string): string {
  if (keep.length === 1) return keep[0].plan_version_id;
  const presentation = db.prepare("SELECT document_json FROM platform_membership_plan_presentations WHERE plan_version_id=?").get(currentVersion) as { document_json: string } | undefined;
  if (!presentation || keep.some(item => !item.document_json)) throw new Error("Refund cannot preserve an incomplete bundle snapshot.");
  const doc = membershipPlanEditorSchema.parse(JSON.parse(presentation.document_json));
  const documents = keep.map(item => membershipPlanEditorSchema.parse(JSON.parse(item.document_json!)));
  const kinds = new Map((db.prepare("SELECT feature_key,feature_kind FROM platform_membership_feature_definitions").all() as { feature_key: string; feature_kind: string }[]).map(row => [row.feature_key, row.feature_kind]));
  const price = newMembershipPlanPrice(createCanonicalUuidV4());
  Object.assign(price, { name: "Preserved access", provider: "free", channel: "private" });
  Object.assign(doc, { planId: null, baseRevision: "", name: keep.map(item => item.name).join(" + ").slice(0, 120),
    visibility: "unlisted", privatePageIds: [], internalNote: "Immutable access remaining after a verified Stripe refund; not an enrollment offer.",
    packageType: documents.every(item => item.packageType === "addon") ? "addon" : "plan", requiresDiscord: documents.some(item => item.requiresDiscord),
    bundleOfferIds: keep.map(item => item.offer_id), features: combinedMembershipFeatures(documents.map(item => item.features), kinds), prices: [price] });
  const saved = writeMembershipPlanEditor(db, userId, { requestId: createCanonicalUuidV4(), draftId: null, revision: null, document: doc, intent: "publish", applyToMembers: false }, at);
  if (!saved.planId || !saved.versionId) throw new Error("Refund could not preserve unrefunded access.");
  db.prepare("UPDATE platform_membership_offers SET status='paused',updated_at_utc=? WHERE plan_version_id=?").run(at, saved.versionId);
  db.prepare("UPDATE platform_membership_plans SET status='retired',updated_at_utc=? WHERE plan_id=?").run(at, saved.planId);
  for (const feature of doc.features) db.prepare("UPDATE platform_membership_feature_usage_anchors SET anchor_at_utc=? WHERE plan_version_id=? AND feature_key=?")
    .run(membershipUsageAnchor(db, currentVersion, feature.key, at), saved.versionId, feature.key);
  return saved.versionId;
}

/** Undo only our own removal when Stripe later reports an unsuccessful refund. */
function reverseRefund(db: Database.Database, evidence: MembershipStripeRefundEvidence, claim: Claim,
  sourceRef: string, sourceType: string, entitlement: Entitlement | undefined, active: RefundMarker[], at: string): string {
  const prior = active.find(item => item.chargeHash === digest(evidence.chargeId));
  if (!prior) return "ignored";
  if (!prior.before) throw new Error("Refund reversal needs payment reconciliation before initial access was projected.");
  if (evidence.invoice?.billing_reason === "subscription_update" && hasTable(db, "platform_membership_addon_amendments")) {
    const pending = db.prepare("SELECT state FROM platform_membership_addon_amendments WHERE external_invoice_ref=? AND user_id=?")
      .get(stripeReference(evidence.invoice.id), claim.user_id) as { state: string } | undefined;
    if (pending && pending.state !== "applied") throw new Error("Refund reversal needs add-on payment reconciliation.");
  }
  const projection = evidence.subscription ? db.prepare("SELECT lifecycle_state FROM platform_membership_provider_subscriptions WHERE provider='stripe' AND external_subscription_ref=?")
    .get(sourceRef) as { lifecycle_state: string } | undefined : null;
  const user = db.prepare("SELECT status FROM platform_users WHERE user_id=?").get(claim.user_id) as { status: string } | undefined;
  const newerCoverage = prior.coveredUntil && entitlement?.ends_at_utc && entitlement.ends_at_utc > prior.coveredUntil;
  if (!entitlement) throw new Error("Refund reversal needs reconciliation after the original access was removed.");
  const withhold = (reason: string): string => {
    // This is an observation, not a reversal tombstone: the original replay
    // suppression remains active when an independent boundary prevents restoration.
    db.prepare(`INSERT INTO platform_membership_audit_events
      (audit_event_id,subject_user_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
      VALUES (?,?,'stripe.purchase_refund_reversal_withheld','purchase',?,?,?)`).run(createCanonicalUuidV4(), claim.user_id,
        `stripe-refund:${digest(sourceRef)}`, JSON.stringify({ chargeHash: digest(evidence.chargeId), reason }), at);
    return "applied";
  };
  if (prior.before.status !== "active") return withhold("previous_access_inactive");
  if (newerCoverage) return withhold("newer_paid_coverage");
  if (user?.status !== "active") return withhold("account_inactive");
  if (entitlement.ends_at_utc && entitlement.ends_at_utc <= new Date().toISOString()) return withhold("paid_period_ended");
  if (evidence.subscription && (!['active', 'trialing', 'past_due'].includes(String(evidence.subscription.status)) ||
    !projection || !['active', 'trialing', 'past_due', 'cancel_at_period_end'].includes(projection.lifecycle_state))) {
    return withhold("subscription_not_entitling");
  }
  const latest = active[active.length - 1].after;
  if (!latest || latest.entitlement_id !== entitlement.entitlement_id || latest.plan_version_id !== entitlement.plan_version_id ||
    latest.status !== entitlement.status || latest.updated_at_utc !== entitlement.updated_at_utc) {
    throw new Error("Refund reversal needs reconciliation after an independent access change.");
  }
  if (active.some(item => item !== prior && (!item.coveredUntil || !entitlement.ends_at_utc || item.coveredUntil >= entitlement.ends_at_utc))) {
    throw new Error("Refund reversal needs reconciliation while other refunds affect this purchase.");
  }
  carryMembershipUsage(db, claim.user_id, [entitlement.plan_version_id], prior.before.plan_version_id, at);
  db.prepare("UPDATE platform_membership_entitlements SET status='active',plan_version_id=?,updated_at_utc=MAX(updated_at_utc,?) WHERE entitlement_id=? AND user_id=? AND source_type=? AND source_ref=?")
    .run(prior.before.plan_version_id, at, entitlement.entitlement_id, claim.user_id, sourceType, sourceRef);
  db.prepare(`INSERT INTO platform_membership_audit_events
    (audit_event_id,subject_user_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
    VALUES (?,?,'stripe.purchase_refund_reversed','purchase',?,?,?)`).run(createCanonicalUuidV4(), claim.user_id,
      `stripe-refund:${digest(sourceRef)}`, JSON.stringify({ chargeHash: digest(evidence.chargeId) }), at);
  return "applied";
}

/** Caller holds the same immediate transaction as the verified provider receipt. */
export function applyMembershipStripeRefund(db: Database.Database, evidence: MembershipStripeRefundEvidence, at: string): string {
  if (!db.inTransaction) throw new Error("Refund projection needs a transaction.");
  const { invoice, subscription, session, chargeId } = evidence;
  const metadata = record.parse(subscription?.metadata ?? session?.metadata ?? {});
  if (typeof metadata.membership_claim_id !== "string") return "ignored";
  const claim = db.prepare(`SELECT c.user_id,c.offer_id,c.trial_campaign_id,c.external_session_ref,o.plan_version_id
    FROM platform_membership_claims c JOIN platform_membership_offers o USING(offer_id)
    WHERE c.claim_id=? AND o.provider='stripe'`).get(metadata.membership_claim_id) as Claim | undefined;
  if (!claim || !claim.external_session_ref) throw new Error("Refund has no exact Membership purchase.");
  const subscriptionId = stripeReference(subscription?.id);
  if (!subscriptionId && session?.id !== claim.external_session_ref) throw new Error("Refund checkout does not match its claim.");
  const sourceRef = subscriptionId ?? metadata.membership_claim_id;
  const sourceType = subscriptionId ? "subscription" : claim.trial_campaign_id ? "trial" : "lifetime_purchase";
  const projection = subscriptionId ? db.prepare(`SELECT user_id,external_customer_ref FROM platform_membership_provider_subscriptions
    WHERE provider='stripe' AND external_subscription_ref=?`).get(subscriptionId) as { user_id: string; external_customer_ref: string | null } | undefined : null;
  if (projection && (projection.user_id !== claim.user_id || projection.external_customer_ref !== stripeReference(subscription?.customer))) throw new Error("Refund Membership owner mismatch.");
  const target = `stripe-refund:${digest(sourceRef)}`;
  const active = markers(db, sourceRef);
  const entitlement = db.prepare(`SELECT entitlement_id,plan_version_id,ends_at_utc,status,updated_at_utc FROM platform_membership_entitlements
    WHERE user_id=? AND source_type=? AND source_ref=?`).get(claim.user_id, sourceType, sourceRef) as Entitlement | undefined;
  if (!evidence.fullyRefunded) return reverseRefund(db, evidence, claim, sourceRef, sourceType, entitlement, active, at);
  if (active.some(item => item.chargeHash === digest(chargeId))) return "applied";
  let coveredUntil = invoice ? invoiceEnd(invoice) : null;
  if (invoice?.billing_reason === "subscription_create" && claim.trial_campaign_id && subscription?.trial_end) {
    coveredUntil = new Date(z.number().int().positive().parse(subscription.trial_end) * 1000).toISOString();
  }
  let purchasedVersion = claim.plan_version_id;
  let removed = components(db, purchasedVersion, claim.offer_id);
  if (invoice && subscriptionId) {
    const amendment = hasTable(db, "platform_membership_addon_amendments") ? db.prepare(`SELECT amendment_id,user_id,addon_offer_ids_json,period_end_utc FROM platform_membership_addon_amendments
      WHERE external_subscription_ref=? AND external_invoice_ref=?`).get(subscriptionId, stripeReference(invoice.id)) as { amendment_id: string; user_id: string; addon_offer_ids_json: string; period_end_utc: string } | undefined : undefined;
    if (amendment) {
      if (amendment.user_id !== claim.user_id) throw new Error("Refund add-on owner mismatch.");
      removed = z.array(z.string().uuid()).parse(JSON.parse(amendment.addon_offer_ids_json)).map(id => component(db, id));
      coveredUntil = amendment.period_end_utc;
      db.prepare("UPDATE platform_membership_claims SET state='released' WHERE claim_id=? AND user_id=? AND state='reserved'").run(amendment.amendment_id, claim.user_id);
      db.prepare("UPDATE platform_membership_addon_amendments SET state='failed',failure_code='invoice_refunded',updated_at_utc=MAX(updated_at_utc,?) WHERE amendment_id=? AND state IN ('confirming','pending_payment','reconciliation_required')")
        .run(at, amendment.amendment_id);
    } else {
      if (invoice.billing_reason === "subscription_update") throw new Error("Refund add-on purchase is not mapped.");
      purchasedVersion = invoiceVersion(db, invoice, subscriptionId, purchasedVersion);
      removed = components(db, purchasedVersion, claim.offer_id);
    }
  }
  const removedPlans = new Set(removed.map(item => item.plan_id));
  // Refunding an older period must not erase separately paid newer coverage.
  if (entitlement?.status === "active" && !(coveredUntil && entitlement.ends_at_utc && entitlement.ends_at_utc > coveredUntil)) {
    const current = components(db, entitlement.plan_version_id, claim.offer_id);
    const keep = current.filter(item => !removedPlans.has(item.plan_id));
    if (!keep.length) db.prepare("UPDATE platform_membership_entitlements SET status='revoked',updated_at_utc=MAX(updated_at_utc,?) WHERE entitlement_id=? AND user_id=?")
      .run(at, entitlement.entitlement_id, claim.user_id);
    else if (keep.length !== current.length) {
      assertPreservableBundle(db, entitlement.plan_version_id, current);
      const version = residualVersion(db, claim.user_id, entitlement.plan_version_id, keep, at);
      carryMembershipUsage(db, claim.user_id, [entitlement.plan_version_id], version, at);
      db.prepare("UPDATE platform_membership_entitlements SET plan_version_id=?,updated_at_utc=MAX(updated_at_utc,?) WHERE entitlement_id=? AND user_id=?")
        .run(version, at, entitlement.entitlement_id, claim.user_id);
    }
  }
  db.prepare(`INSERT INTO platform_membership_audit_events
    (audit_event_id,subject_user_id,action,target_type,target_id,safe_details_json,occurred_at_utc)
    VALUES (?,?,?,'purchase',?,?,?)`).run(createCanonicalUuidV4(), claim.user_id, action, target,
      JSON.stringify({ chargeHash: digest(chargeId), sourceType, invoiceHash: invoice ? digest(String(invoice.id)) : null, coveredUntil,
        removedPlanIds: [...removedPlans], before: entitlement ?? null,
        after: entitlement ? db.prepare("SELECT entitlement_id,plan_version_id,ends_at_utc,status,updated_at_utc FROM platform_membership_entitlements WHERE entitlement_id=?").get(entitlement.entitlement_id) : null }), at);
  db.prepare("UPDATE platform_membership_claims SET state='released' WHERE claim_id=? AND user_id=? AND state='reserved'").run(metadata.membership_claim_id, claim.user_id);
  return "applied";
}
