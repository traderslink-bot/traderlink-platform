import type { CoachingDirectPurchase } from "../contracts/coaching-direct-purchase";
import { coachingDecimalMinor } from "../contracts/coaching-commission-reconciliation";

export type CoachingWhopBillingExpectation = Readonly<{
  planType: "one_time" | "renewal";
  periodDays: number | null;
  renewalPriceMinor: number;
  /** Calendar-month scheduling is not silently declared equivalent to a day interval. */
  cadenceQualification: "one_time" | "weekly" | "explicit_day_interval";
}>;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Whop offer verification needs complete provider records.");
  return value as Record<string, unknown>;
}
function decimal(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Whop offer price/rate requires exact numeric representation.");
  return coachingDecimalMinor(String(value), 2);
}

/** Existing variant and effective child markup must match server-owned accepted purchase. */
export function verifyCoachingWhopOffer(input: Readonly<{
  purchase: CoachingDirectPurchase;
  platformAccountId: string;
  billing: CoachingWhopBillingExpectation;
  variant: unknown;
  accountFees: unknown;
}>): void {
  const { purchase, billing } = input;
  const variant = object(input.variant), fees = object(input.accountFees);
  if (!input.platformAccountId || variant.id !== purchase.providerOffer.variantId || object(variant.account).id !== purchase.merchantAccountId || object(variant.product).id !== purchase.providerOffer.productId || typeof variant.currency !== "string" || variant.currency.toUpperCase() !== purchase.price.currency) throw new Error("Whop variant ownership/product/currency does not match the accepted purchase.");
  if(variant.adaptive_pricing_enabled===true)throw new Error('Use the accepted coaching currency; adaptive pricing requires a separately qualified quote.');
  const initialDue = object(variant.initial_price_due);
  if (typeof initialDue.amount !== "string" || typeof initialDue.currency !== "string" || initialDue.currency.toUpperCase() !== purchase.price.currency || coachingDecimalMinor(initialDue.amount, 2) !== purchase.price.amountMinor) throw new Error("Whop checkout price does not match the accepted purchase.");
  if (variant.plan_type !== billing.planType || variant.billing_period !== billing.periodDays || decimal(variant.renewal_price) !== billing.renewalPriceMinor) throw new Error("Whop billing interval/renewal price differs from the agreed mapping.");
  const cadence = purchase.agreement.terms.billingCadence;
  if (cadence === "one_time" && (billing.planType !== "one_time" || billing.periodDays !== null || billing.renewalPriceMinor !== 0 || billing.cadenceQualification !== "one_time")) throw new Error("One-time coaching must not create recurring charges.");
  if (cadence === "weekly" && (billing.planType !== "renewal" || billing.periodDays !== 7 || billing.cadenceQualification !== "weekly")) throw new Error("Weekly coaching billing must match its agreed weekly interval.");
  if (["monthly", "custom"].includes(cadence) && billing.cadenceQualification !== "explicit_day_interval") throw new Error("Qualify and agree the provider billing interval; do not infer calendar-month equivalence.");
  if (billing.planType === "renewal" && (!Number.isSafeInteger(billing.periodDays) || billing.periodDays! < 1 || billing.renewalPriceMinor < 0)) throw new Error("Invalid recurring provider billing mapping.");
  verifyCoachingWhopCommissionFees({accountFees:fees,merchantAccountId:purchase.merchantAccountId,platformAccountId:input.platformAccountId,basisPoints:purchase.commission.basisPoints});
  // No claim that adjustable=false protects against a coach-side bypass. Reconcile actual credits.
}

/** Reusable before a first sale; no product or completed payment is required. */
export function verifyCoachingWhopCommissionFees(input:{accountFees:unknown;merchantAccountId:string;platformAccountId:string;basisPoints:number}):void{
 const fees=object(input.accountFees);
 if(fees.account_id!==input.merchantAccountId||fees.parent_account_id!==input.platformAccountId)throw new Error('Coach account is not connected to the expected platform.');
 const markup=object(object(fees.markups).payments),fixed=object(markup.fixed);
 if(decimal(markup.percentage)!==input.basisPoints||typeof fixed.amount!=='string'||coachingDecimalMinor(fixed.amount,2)!==0)throw new Error('Effective provider commission differs from the owner-configured policy.');
}
