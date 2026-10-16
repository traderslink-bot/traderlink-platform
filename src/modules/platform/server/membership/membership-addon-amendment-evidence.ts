import type Database from "better-sqlite3";
import { z } from "zod";
import { MembershipAddonAmendmentRepository, type AddonAmendmentRow } from "./membership-addon-amendment-repository";
import { membershipAmountFromStripe } from "./membership-stripe-http";
const record = z.record(z.string(),z.unknown());
export const stripeReference = (value: unknown): string | null => typeof value === "string" ? value : value && typeof value === "object" && "id" in value && typeof value.id === "string" ? value.id : null;
export function membershipHostedInvoiceUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "invoice.stripe.com" || url.username || url.password) throw new Error("This payment link is invalid.");
  return url.href;
}
export function stripeInvoiceSubscription(invoice: Record<string, unknown>): string | null {
  const parent = invoice.parent ? record.parse(invoice.parent) : null;
  const details = parent?.subscription_details ? record.parse(parent.subscription_details) : null;
  return stripeReference(invoice.subscription ?? details?.subscription);
}
export function membershipInvoiceLinePrice(line: Record<string,unknown>): string | null {
  const pricing = line.pricing ? record.parse(line.pricing) : null;
  const details = pricing?.price_details ? record.parse(pricing.price_details) : null;
  return stripeReference(line.price ?? details?.price);
}

/** Only call with a signature-verified webhook or authenticated Stripe response.
 * Exact invoice/price/period matching, not mutable subscription metadata, links
 * payment to the locally confirmed operation (including webhook-before-response).
 */
export function reconcileMembershipAddonInvoice(db: Database.Database, invoice: Record<string, unknown>, subscription: Record<string, unknown>, at: string): "applied" | "conflict" | null {
  if (!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_membership_addon_amendments'").get() || invoice.billing_reason !== "subscription_update") return null;
  const subId = stripeInvoiceSubscription(invoice);
  if (!subId || stripeReference(subscription.id)!==subId) return null;
  const lines = record.parse(invoice.lines);
  if (lines.has_more === true) throw new Error("This add-on invoice needs complete payment evidence.");
  const items = z.array(record).parse(lines.data), prices = items.map(membershipInvoiceLinePrice).filter((x): x is string => !!x);
  if (!prices.length) return null;
  const matches = db.prepare(`SELECT * FROM platform_membership_addon_amendments WHERE external_subscription_ref=? AND target_price_ref IN (${prices.map(()=>"?").join(",")})
    AND (state IN ('confirming','pending_payment','reconciliation_required') OR external_invoice_ref=?)`).all(subId,...prices,stripeReference(invoice.id)) as AddonAmendmentRow[];
  if (!matches.length) return null;
  if (matches.length!==1) throw new Error("This add-on invoice is ambiguous.");
  const row = matches[0], repository = new MembershipAddonAmendmentRepository(db), invoiceId = stripeReference(invoice.id);
  if (!invoiceId || stripeReference(invoice.customer)!==row.external_customer_ref || stripeReference(subscription.customer)!==row.external_customer_ref ||
      String(invoice.currency).toUpperCase()!==row.currency || membershipAmountFromStripe(invoice.amount_due,row.currency)!==row.charge_minor ||
      row.external_invoice_ref && row.external_invoice_ref!==invoiceId) throw new Error("This add-on invoice does not match the confirmed preview.");
  const expectedStart = Math.floor(Date.parse(row.proration_at_utc)/1000), expectedEnd = Math.floor(Date.parse(row.period_end_utc)/1000);
  if (!items.some(line => {
    const period = line.period ? record.parse(line.period) : {};
    const parent = line.parent ? record.parse(line.parent) : {};
    const detail = parent.subscription_item_details ? record.parse(parent.subscription_item_details) : {};
    return membershipInvoiceLinePrice(line)===row.target_price_ref && period.start===expectedStart && period.end===expectedEnd && (line.proration===true || detail.proration===true);
  })) throw new Error("This add-on payment covers a different period.");
  if (!['confirming','pending_payment','reconciliation_required','applied'].includes(row.state)) return "conflict";
  repository.attachInvoice(row.user_id,row.amendment_id,invoiceId,membershipHostedInvoiceUrl(invoice.hosted_invoice_url),at);
  if (invoice.status==='void' || invoice.status==='uncollectible') {
    if (row.state!=='applied') db.prepare("UPDATE platform_membership_addon_amendments SET state='failed',failure_code='invoice_unpaid',updated_at_utc=MAX(updated_at_utc,?) WHERE amendment_id=?").run(at,row.amendment_id);
    return "applied";
  }
  // Current Stripe invoices omit the legacy paid boolean. Require the terminal
  // status plus fully settled amounts when that legacy field is absent.
  const settled = invoice.paid===true || (invoice.paid===undefined &&
    invoice.amount_remaining===0 && Number.isSafeInteger(invoice.amount_paid) &&
    Number(invoice.amount_paid)>=Number(invoice.amount_due));
  if (invoice.status!=='paid' || !settled) return "applied";
  const currentItems = z.array(record).parse(record.parse(subscription.items).data);
  if (subscription.status!=='active' || subscription.pending_update || subscription.cancel_at_period_end ||
    currentItems.length!==1 || stripeReference(currentItems[0].id)!==row.external_item_ref || stripeReference(currentItems[0].price)!==row.target_price_ref || currentItems[0].quantity!==1) {
    repository.fail(row.user_id,row.amendment_id,"provider_subscription_changed",at); return "conflict";
  }
  return repository.applyPaidInvoice(row,invoiceId,at) ? "applied" : "conflict";
}
