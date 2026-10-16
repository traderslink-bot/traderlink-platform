import type Database from "better-sqlite3";
import { z } from "zod";
import { MembershipAddonAmendmentRepository, type AddonAmendmentRow } from "./membership-addon-amendment-repository";
import { membershipAmountFromStripe, membershipStripeAmount, stripeRequest } from "./membership-stripe-http";
import { reconcileMembershipAddonInvoice, stripeReference, membershipInvoiceLinePrice } from "./membership-addon-amendment-evidence";
const record = z.record(z.string(),z.unknown());
type DatabaseWork = <T>(work: (database: Database.Database)=>T)=>T;
const epoch = (value: string) => String(Math.floor(Date.parse(value)/1000));
const subscriptionPath = (row: AddonAmendmentRow) => `subscriptions/${encodeURIComponent(row.external_subscription_ref)}?expand[]=latest_invoice`;
function validateSubscription(row: AddonAmendmentRow, sub: Record<string,unknown>) {
  const items = z.array(record).parse(record.parse(sub.items).data), item = items[0], price = item?.price ? record.parse(item.price) : {};
  const recurring = price.recurring ? record.parse(price.recurring) : {};
  const tax = sub.automatic_tax ? record.parse(sub.automatic_tax) : {};
  const latest = sub.latest_invoice ? record.parse(sub.latest_invoice) : {};
  if (stripeReference(sub.id)!==row.external_subscription_ref || stripeReference(sub.customer)!==row.external_customer_ref || sub.status!=="active" ||
    sub.collection_method!=="charge_automatically" || sub.pending_update || sub.cancel_at_period_end || sub.schedule || sub.pause_collection ||
    items.length!==1 || item.quantity!==1 || recurring.interval!=="month" || recurring.interval_count!==1 ||
    String(price.currency).toUpperCase()!==row.currency || membershipAmountFromStripe(price.unit_amount,row.currency)!==row.original_monthly_minor ||
    String(sub.current_period_end ?? item.current_period_end)!==epoch(row.period_end_utc) || latest.status!=="paid" || tax.enabled ||
    (Array.isArray(sub.discounts)&&sub.discounts.length>0) || sub.discount || (Array.isArray(item.discounts)&&item.discounts.length>0) ||
    (Array.isArray(sub.default_tax_rates)&&sub.default_tax_rates.length>0) || (Array.isArray(item.tax_rates)&&item.tax_rates.length>0) ||
    sub.billing_thresholds || sub.pending_invoice_item_interval) throw new Error("This subscription has billing changes or terms that need review before adding a package.");
  const itemId = stripeReference(item.id), priceId = stripeReference(price.id);
  if (!itemId || !priceId || (row.external_item_ref && row.external_item_ref!==itemId) || (row.original_price_ref && row.original_price_ref!==priceId)) throw new Error("This subscription changed. Request a new payment preview.");
  return { itemId, priceId };
}
const previewValues = (row: AddonAmendmentRow, item: string, price: string) => ({ subscription: row.external_subscription_ref,
  "subscription_details[items][0][id]": item, "subscription_details[items][0][price]": price,
  "subscription_details[items][0][quantity]": "1", "subscription_details[proration_behavior]": "always_invoice",
  "subscription_details[proration_date]": epoch(row.proration_at_utc) });
function previewCharge(row: AddonAmendmentRow, value: Record<string,unknown>): number {
  if (String(value.currency).toUpperCase()!==row.currency) throw new Error("This payment preview has a different currency.");
  const lines=record.parse(value.lines);
  if(lines.has_more===true || value.starting_balance && value.starting_balance!==0 ||
    (Array.isArray(value.total_discount_amounts)&&value.total_discount_amounts.length) ||
    (Array.isArray(value.total_taxes)&&value.total_taxes.length) ||
    (Array.isArray(value.total_tax_amounts)&&value.total_tax_amounts.length)) throw new Error("This payment preview includes adjustments that need review.");
  const items=z.array(record).parse(lines.data);
  let total=BigInt(0),targetFound=false;
  for(const line of items){
    const amount=z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER).parse(line.amount);
    const parent=line.parent?record.parse(line.parent):{};
    const details=parent.subscription_item_details?record.parse(parent.subscription_item_details):{};
    if(line.proration!==true&&details.proration!==true){if(amount!==0)throw new Error("This preview includes a future renewal. Request an immediate add-on charge preview.");continue;}
    const period=record.parse(line.period);
    if(String(period.start)!==epoch(row.proration_at_utc)||String(period.end)!==epoch(row.period_end_utc))throw new Error("This payment preview covers a different period.");
    const linePrice=membershipInvoiceLinePrice(line);
    if(linePrice!==row.target_price_ref&&linePrice!==row.original_price_ref)throw new Error("This preview includes another subscription change.");
    if(linePrice===row.target_price_ref)targetFound=true;
    total+=BigInt(amount);
  }
  const charge=membershipAmountFromStripe(value.amount_due,row.currency);
  const rawCharge=BigInt(membershipStripeAmount(charge,row.currency));
  if(!targetFound||total<0||total>BigInt(Number.MAX_SAFE_INTEGER)||(rawCharge!==total&&rawCharge!==BigInt(0)))throw new Error("This payment preview does not match the add-on prorations.");
  return charge;
}
/** All network work occurs outside SQLite write transactions. The injected
 * database runner opens short owned transactions/connections for each step. */
export class MembershipAddonAmendmentService {
  constructor(private readonly database: DatabaseWork, private readonly now: ()=>Date = ()=>new Date()) {}
  async quote(userId: string, requestId: string, subscriptionId: string, addons: readonly string[]) {
    let row = this.database(db=>new MembershipAddonAmendmentRepository(db).reserve(userId,requestId,subscriptionId,addons,this.now().toISOString()));
    if (row.state!=="preparing") return row;
    try {
      this.assertPaymentMode(row);
      const subscription = await stripeRequest(subscriptionPath(row)), item = validateSubscription(row,subscription);
      const price = await stripeRequest("prices", { currency: row.currency.toLowerCase(), unit_amount: membershipStripeAmount(row.target_monthly_minor,row.currency),
        "recurring[interval]": "month", "recurring[interval_count]": "1", "product_data[name]": "TradersLink plan and add-ons" }, `membership-addon-price-${row.amendment_id}`);
      const priceId = stripeReference(price.id);
      if (!priceId) throw new Error("This add-on price could not be prepared.");
      const preview = await stripeRequest("invoices/create_preview",previewValues(row,item.itemId,priceId));
      row = this.database(db=>new MembershipAddonAmendmentRepository(db).quote(userId,row.amendment_id,
        { item: item.itemId, originalPrice: item.priceId,targetPrice: priceId,charge: previewCharge({...row,original_price_ref:item.priceId,target_price_ref:priceId},preview) },this.now().toISOString()));
      return row;
    } catch (error) { this.database(db=>new MembershipAddonAmendmentRepository(db).fail(userId,row.amendment_id,"quote_failed",this.now().toISOString())); throw error; }
  }
  async confirm(userId: string,id: string) {
    const row = this.database(db=>new MembershipAddonAmendmentRepository(db).read(userId,id));
    if (row.state!=="quoted") return row;
    if (row.expires_at_utc<=this.now().toISOString()) return this.database(db=>new MembershipAddonAmendmentRepository(db).beginConfirmation(userId,id,this.now().toISOString()).row);
    this.assertPaymentMode(row);
    validateSubscription(row,await stripeRequest(subscriptionPath(row)));
    const preview = await stripeRequest("invoices/create_preview",previewValues(row,row.external_item_ref!,row.target_price_ref!));
    if (previewCharge(row,preview)!==row.charge_minor) throw new Error("This charge changed. Request a new payment preview before confirming.");
    const claim = this.database(db=>new MembershipAddonAmendmentRepository(db).beginConfirmation(userId,id,this.now().toISOString()));
    if (!claim.acquired) return claim.row;
    return this.submit(claim.row);
  }
  private async submit(row: AddonAmendmentRow) {
    try {
      const updated = await stripeRequest(`subscriptions/${encodeURIComponent(row.external_subscription_ref)}`, {
        "items[0][id]": row.external_item_ref!,"items[0][price]": row.target_price_ref!,"items[0][quantity]": "1",
        payment_behavior: "pending_if_incomplete",proration_behavior: "always_invoice",proration_date: epoch(row.proration_at_utc),"expand[]": "latest_invoice",
      },`membership-addon-confirm-${row.amendment_id}`);
      if (row.charge_minor===0 && row.target_monthly_minor===row.original_monthly_minor && !updated.pending_update) {
        validateSubscription({ ...row, original_price_ref: row.target_price_ref },updated);
        this.database(db=>new MembershipAddonAmendmentRepository(db).applyPaidInvoice(row,null,this.now().toISOString()));
        return this.database(db=>new MembershipAddonAmendmentRepository(db).read(row.user_id,row.amendment_id));
      }
      const invoiceRef = stripeReference(updated.latest_invoice);
      if (!invoiceRef) throw new Error("This payment is awaiting reconciliation.");
      // Retrieve full invoice lines even when latest_invoice is only shallowly expanded.
      const invoice = await stripeRequest(`invoices/${encodeURIComponent(invoiceRef)}`);
      this.database(db=>{
        const result = reconcileMembershipAddonInvoice(db,invoice,updated,this.now().toISOString());
        if (result===null) throw new Error("This payment is awaiting reconciliation.");
      });
    } catch (error) { this.database(db=>new MembershipAddonAmendmentRepository(db).fail(row.user_id,row.amendment_id,"confirmation_uncertain",this.now().toISOString())); throw error; }
    return this.database(db=>new MembershipAddonAmendmentRepository(db).read(row.user_id,row.amendment_id));
  }
  async refresh(userId: string,id: string) {
    const row = this.database(db=>new MembershipAddonAmendmentRepository(db).read(userId,id));
    if (!['confirming','pending_payment','reconciliation_required'].includes(row.state)) return row;
    this.assertPaymentMode(row);
    const subscription = await stripeRequest(subscriptionPath(row));
    if (row.charge_minor===0 && row.target_monthly_minor===row.original_monthly_minor && !subscription.pending_update) {
      try {
        validateSubscription({ ...row, original_price_ref: row.target_price_ref },subscription);
        this.database(db=>new MembershipAddonAmendmentRepository(db).applyPaidInvoice(row,null,this.now().toISOString()));
        return this.database(db=>new MembershipAddonAmendmentRepository(db).read(userId,id));
      } catch { /* Paid-price fallback below remains invoice-bound. */ }
    }
    const invoiceId = row.external_invoice_ref ?? stripeReference(subscription.latest_invoice);
    if (invoiceId) {
      const invoice = await stripeRequest(`invoices/${encodeURIComponent(invoiceId)}`);
      this.database(db=>reconcileMembershipAddonInvoice(db,invoice,subscription,this.now().toISOString()));
    }
    const current=this.database(db=>new MembershipAddonAmendmentRepository(db).read(userId,id));
    // Retry only the already confirmed immutable request, within its short quote
    // window (well inside Stripe's idempotency retention). A provider read must
    // still show the untouched paid subscription and no pending update/invoice.
    if(['confirming','reconciliation_required'].includes(current.state) && !current.external_invoice_ref && current.expires_at_utc>this.now().toISOString()) {
      try { validateSubscription(current,subscription); }
      catch { return current; }
      return this.submit(current);
    }
    return current;
  }
  private assertPaymentMode(row: AddonAmendmentRow) {
    const mode = this.database(db=>db.prepare(`SELECT d.configuration_state FROM platform_membership_offers o JOIN platform_membership_provider_definitions d ON d.provider_key=o.provider WHERE o.offer_id=?`).get(row.original_offer_id)) as {configuration_state:string} | undefined;
    if (mode?.configuration_state!=="ready" && mode?.configuration_state!=="test") throw new Error("Stripe is not ready for this subscription.");
    if (mode.configuration_state==="test" && !/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY??"")) throw new Error("This subscription needs Stripe test credentials.");

  }
}
