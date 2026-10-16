import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4, createCanonicalUuidV4 } from "../database/platform-migration-contract";
import { prepareMembershipAmendmentBundle } from "./membership-addon-amendment-bundle";

export type AddonAmendmentState = "preparing" | "quoted" | "confirming" | "pending_payment" | "applied" | "expired" | "failed" | "reconciliation_required";
export type AddonAmendmentRow = {
  amendment_id: string; user_id: string; request_id: string; request_sha256: string; provider_subscription_id: string;
  external_subscription_ref: string; external_customer_ref: string; entitlement_id: string; original_offer_id: string; original_plan_version_id: string;
  target_offer_id: string; target_plan_version_id: string; addon_offer_ids_json: string; addon_names_json: string; currency: string; original_monthly_minor: number;
  target_monthly_minor: number; proration_at_utc: string; period_end_utc: string; expires_at_utc: string; external_item_ref: string | null;
  original_price_ref: string | null; target_price_ref: string | null; charge_minor: number | null; external_invoice_ref: string | null;
  hosted_invoice_url: string | null; state: AddonAmendmentState; failure_code: string | null; created_at_utc: string; updated_at_utc: string;
};
export class MembershipAddonAmendmentRepository {
  constructor(private readonly db: Database.Database) {}
  read(userId: string, id: string): AddonAmendmentRow {
    assertCanonicalUuidV4(userId, "userId"); assertCanonicalUuidV4(id, "amendmentId");
    const row = this.db.prepare("SELECT * FROM platform_membership_addon_amendments WHERE amendment_id=? AND user_id=?").get(id,userId) as AddonAmendmentRow | undefined;
    if (!row) throw new Error("This add-on change is unavailable.");
    return row;
  }
  reserve(userId: string, requestId: string, subscriptionId: string, addons: readonly string[], at: string): AddonAmendmentRow {
    for (const value of [userId, requestId, subscriptionId, ...addons]) assertCanonicalUuidV4(value, "membershipReference");
    assertCanonicalUtcTimestamp(at, "atUtc");
    const digest = createHash("sha256").update(JSON.stringify([subscriptionId, [...addons].sort()])).digest("hex");
    return this.db.transaction(() => {
      const prior = this.db.prepare("SELECT * FROM platform_membership_addon_amendments WHERE user_id=? AND request_id=?").get(userId,requestId) as AddonAmendmentRow | undefined;
      if (prior) { if (prior.request_sha256 !== digest) throw new Error("This add-on request changed. Review your selection again."); return prior; }
      this.db.prepare("UPDATE platform_membership_addon_amendments SET state='expired',updated_at_utc=? WHERE user_id=? AND state IN ('preparing','quoted') AND expires_at_utc<=?").run(at,userId,at);
      const current = this.db.prepare(`SELECT s.*,e.entitlement_id,e.plan_version_id FROM platform_membership_provider_subscriptions s
        JOIN platform_membership_entitlements e ON e.user_id=s.user_id AND e.source_type='subscription' AND e.source_ref=s.external_subscription_ref
        JOIN platform_membership_offers o ON o.offer_id=s.offer_id AND o.plan_version_id=e.plan_version_id
        WHERE s.provider_subscription_id=? AND s.user_id=? AND s.provider='stripe' AND s.lifecycle_state='active' AND s.cancel_at_period_end=0
        AND s.external_customer_ref IS NOT NULL AND s.current_period_end_utc>? AND e.status='active' AND e.starts_at_utc<=? AND e.ends_at_utc>?
        AND NOT EXISTS (SELECT 1 FROM platform_membership_version_changes c WHERE c.entitlement_id=e.entitlement_id AND c.applied_at_utc IS NULL)`)
        .get(subscriptionId,userId,at,at,at) as { offer_id: string; external_subscription_ref: string; external_customer_ref: string; entitlement_id: string; plan_version_id: string; current_period_end_utc: string } | undefined;
      if (!current) throw new Error("This subscription cannot add packages right now. Check its billing status or scheduled changes.");
      if (this.db.prepare("SELECT 1 FROM platform_membership_addon_amendments WHERE provider_subscription_id=? AND state IN ('preparing','quoted','confirming','pending_payment','reconciliation_required')").get(subscriptionId)) throw new Error("Your previous add-on change is still open. Finish that payment or review first.");
      const target = prepareMembershipAmendmentBundle(this.db,userId,current.offer_id,addons,at), id = createCanonicalUuidV4();
      const expires = new Date(Math.min(Date.parse(at)+10*60_000,Date.parse(current.current_period_end_utc))).toISOString();
      this.db.prepare(`INSERT INTO platform_membership_addon_amendments
        (amendment_id,user_id,request_id,request_sha256,provider_subscription_id,external_subscription_ref,external_customer_ref,entitlement_id,
        original_offer_id,original_plan_version_id,target_offer_id,target_plan_version_id,addon_offer_ids_json,addon_names_json,currency,original_monthly_minor,
        target_monthly_minor,proration_at_utc,period_end_utc,expires_at_utc,state,created_at_utc,updated_at_utc)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'preparing',?,?)`).run(id,userId,requestId,digest,subscriptionId,current.external_subscription_ref,current.external_customer_ref,current.entitlement_id,
          current.offer_id,current.plan_version_id,target.offerId,target.versionId,JSON.stringify([...addons].sort()),JSON.stringify(target.addonNames),target.currency,target.original.renewal_amount_minor!,target.monthlyMinor,at,current.current_period_end_utc,expires,at,at);
      return this.read(userId,id);
    }).immediate();
  }
  quote(userId: string, id: string, values: { item: string; originalPrice: string; targetPrice: string; charge: number }, at: string) {
    if (!Number.isSafeInteger(values.charge) || values.charge<0 || !values.item || !values.originalPrice || !values.targetPrice) throw new Error("This payment preview is invalid.");
    const updated = this.db.prepare(`UPDATE platform_membership_addon_amendments SET external_item_ref=?,original_price_ref=?,target_price_ref=?,charge_minor=?,state='quoted',updated_at_utc=?
      WHERE amendment_id=? AND user_id=? AND state='preparing' AND expires_at_utc>?`).run(values.item,values.originalPrice,values.targetPrice,values.charge,at,id,userId,at);
    if (!updated.changes) throw new Error("This payment preview expired. Review the add-on again.");
    return this.read(userId,id);
  }
  beginConfirmation(userId: string,id: string,at: string): { row: AddonAmendmentRow; acquired: boolean } {
    return this.db.transaction(() => {
      const row = this.read(userId,id);
      if (row.state !== "quoted") return { row, acquired: false };
      if (row.expires_at_utc<=at) { this.db.prepare("UPDATE platform_membership_addon_amendments SET state='expired',updated_at_utc=? WHERE amendment_id=?").run(at,id); return { row: this.read(userId,id), acquired: false }; }
      this.db.prepare("UPDATE platform_membership_addon_amendments SET state='confirming',updated_at_utc=? WHERE amendment_id=? AND state='quoted'").run(at,id);
      return { row: this.read(userId,id), acquired: true };
    }).immediate();
  }
  abandonQuote(userId: string,id: string,at: string) {
    this.read(userId,id);
    this.db.prepare("UPDATE platform_membership_addon_amendments SET state='expired',updated_at_utc=MAX(updated_at_utc,?) WHERE user_id=? AND amendment_id=? AND state IN ('preparing','quoted')").run(at,userId,id);
    return this.read(userId,id);
  }
  fail(userId: string,id: string,code: string,at: string) {
    this.read(userId,id);
    this.db.prepare("UPDATE platform_membership_addon_amendments SET state=CASE WHEN state IN ('confirming','pending_payment','reconciliation_required') THEN 'reconciliation_required' ELSE 'failed' END,failure_code=?,updated_at_utc=MAX(updated_at_utc,?) WHERE amendment_id=? AND state NOT IN ('applied','expired','failed')").run(code,at,id);
  }
  attachInvoice(userId: string,id: string,invoiceId: string,url: string | null,at: string) {
    this.read(userId,id);
    this.db.prepare("UPDATE platform_membership_addon_amendments SET external_invoice_ref=?,hosted_invoice_url=?,state=CASE WHEN state='confirming' THEN 'pending_payment' ELSE state END,updated_at_utc=MAX(updated_at_utc,?) WHERE amendment_id=? AND state IN ('confirming','pending_payment','applied','reconciliation_required') AND (external_invoice_ref IS NULL OR external_invoice_ref=?)").run(invoiceId,url,at,id,invoiceId);
  }
  applyPaidInvoice(row: AddonAmendmentRow, invoiceId: string | null,at: string): boolean {
    return this.db.transaction(() => {
      const current = this.read(row.user_id,row.amendment_id);
      row = current;
      if (current.state==='applied') return true;
      if (!['confirming','pending_payment','reconciliation_required'].includes(current.state)) return false;
      const valid = this.db.prepare(`SELECT 1 FROM platform_membership_provider_subscriptions s JOIN platform_membership_entitlements e ON e.entitlement_id=?
        WHERE s.provider_subscription_id=? AND s.user_id=? AND s.offer_id=? AND s.lifecycle_state='active' AND s.cancel_at_period_end=0
        AND e.user_id=s.user_id AND e.source_type='subscription' AND e.source_ref=s.external_subscription_ref AND e.status='active'
        AND e.plan_version_id=? AND e.ends_at_utc>?`).get(row.entitlement_id,row.provider_subscription_id,row.user_id,row.original_offer_id,row.original_plan_version_id,at);
      if (!valid) { this.fail(row.user_id,row.amendment_id,"subscription_changed",at); return false; }
      if (invoiceId === null) {
        if (row.charge_minor!==0 || row.original_monthly_minor!==row.target_monthly_minor || row.external_invoice_ref!==null) return false;
      } else {
        this.attachInvoice(row.user_id,row.amendment_id,invoiceId,null,at);
        if (this.read(row.user_id,row.amendment_id).external_invoice_ref!==invoiceId) return false;
      }
      this.db.prepare("UPDATE platform_membership_entitlements SET plan_version_id=?,updated_at_utc=MAX(updated_at_utc,?) WHERE entitlement_id=?").run(row.target_plan_version_id,at,row.entitlement_id);
      this.db.prepare("UPDATE platform_membership_provider_subscriptions SET offer_id=?,updated_at_utc=MAX(updated_at_utc,?) WHERE provider_subscription_id=?").run(row.target_offer_id,at,row.provider_subscription_id);
      this.db.prepare("UPDATE platform_membership_addon_amendments SET state='applied',failure_code=NULL,updated_at_utc=MAX(updated_at_utc,?) WHERE amendment_id=?").run(at,row.amendment_id);
      return true;
    }).immediate();
  }
}
