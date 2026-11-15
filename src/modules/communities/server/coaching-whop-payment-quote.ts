import type {CoachingDirectPurchase} from '../contracts/coaching-direct-purchase';
import {coachingDecimalMinor} from '../contracts/coaching-commission-reconciliation';
/** Quote facts from an authenticated native payment read. Only exact same-
 * currency, undiscounted service plus explicitly exclusive tax is qualified.
 * Inclusive tax, discounts, FX and buyer fee allocation need separate evidence. */
export function qualifyCoachingWhopPaymentQuote(purchase:CoachingDirectPurchase,payment:Record<string,unknown>):Readonly<{serviceAmountMinor:number;presentmentTotalMinor:number;taxAmountMinor:number;currency:string}>{
 const money=(raw:unknown)=>{if(!raw||typeof raw!=='object')throw new Error('Qualify the provider payment quote.');const value=raw as Record<string,unknown>;
  if(typeof value.amount!=='string'||typeof value.currency!=='string'||value.currency.toUpperCase()!==purchase.price.currency)throw new Error('Qualify cross-currency payment allocation.');
  const amount=coachingDecimalMinor(value.amount,2);if(amount<0)throw new Error('Qualify the provider payment quote.');return amount;};
 const total=money(payment.presentment_total),settlement=money(payment.total);
 if(total!==settlement)throw new Error('Qualify presentment and settlement allocation.');
 if(payment.tax_behavior==='inclusive')throw new Error('Qualify inclusive tax and service allocation.');
 const tax=payment.presentment_tax_amount===undefined?0:money(payment.presentment_tax_amount);
 if(tax===0&&total===purchase.price.amountMinor)return {serviceAmountMinor:purchase.price.amountMinor,presentmentTotalMinor:total,taxAmountMinor:0,currency:purchase.price.currency};
 if(payment.tax_behavior!=='exclusive'||!Array.isArray(payment.line_items)||payment.line_items.length!==1)throw new Error('Qualify tax and service allocation.');
 const line=payment.line_items[0] as Record<string,unknown>;
 if(line.quantity!==1||line.plan_id!==purchase.providerOffer.variantId||line.product_id!==purchase.providerOffer.productId||money(line.subtotal)!==purchase.price.amountMinor||total!==purchase.price.amountMinor+tax)throw new Error('The provider service/tax quote differs from accepted terms.');
 return {serviceAmountMinor:purchase.price.amountMinor,presentmentTotalMinor:total,taxAmountMinor:tax,currency:purchase.price.currency};
}
