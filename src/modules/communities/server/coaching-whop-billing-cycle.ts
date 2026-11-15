import {createHash} from 'node:crypto';
import {snapshotCoachingDirectPurchase,type CoachingDirectPurchase} from '../contracts/coaching-direct-purchase';

function utc(value:unknown):string{if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))throw new Error('The provider billing period needs reconciliation.');return new Date(value).toISOString();}
/** Current provider period only. A delayed historical invoice is never assigned
 * to today's membership period or inferred from the number of previous payments. */
export function coachingWhopRenewalPurchase(input:{origin:CoachingDirectPurchase;membership:Record<string,unknown>;payment:Record<string,unknown>;atUtc:string}):CoachingDirectPurchase{
 const {origin,membership,payment}=input;
 const account=membership.account as {id?:unknown}|undefined,user=payment.user as {id?:unknown}|undefined;
 if(origin.agreement.terms.billingCadence==='one_time'||payment.billing_reason!=='subscription_cycle'||typeof payment.id!=='string'||!payment.id.startsWith('pay_')||typeof membership.id!=='string'||membership.id!==payment.membership_id||account?.id!==origin.merchantAccountId||payment.account_id!==origin.merchantAccountId||membership.user_id!==user?.id||membership.plan_id!==origin.providerOffer.variantId||membership.product_id!==origin.providerOffer.productId)throw new Error('Identify the original paid recurring coaching membership.');
 const days=origin.agreement.terms.billingCadence==='weekly'?7:origin.agreement.terms.builderConfig?.payment?.billingIntervalDays;
 if(!Number.isSafeInteger(days)||!days||membership.billing_period_days!==days)throw new Error('Provider renewal cadence differs from the accepted agreement.');
 const start=utc(membership.current_period_start),end=utc(membership.current_period_end),created=utc(payment.created_at);
 if(Date.parse(end)-Date.parse(start)!==days*86400000||created<start||created>=end)throw new Error('This invoice does not identify the current verified billing period.');
 // paid_at is not billing-period authority: failed invoices can carry stale
 // timestamps, and an actual late settlement can occur after the period ends.
 // Funding still requires the separately normalized authoritative paid status.
 const purchaseId=createHash('sha256').update(JSON.stringify(['coaching-cycle-v1',origin.environment,origin.purchaseId,membership.id,start])).digest('hex');
 return snapshotCoachingDirectPurchase({...origin,purchaseId,createdAtUtc:input.atUtc,billingCycle:{originPurchaseId:origin.purchaseId,membershipId:membership.id,invoicePaymentId:payment.id,periodStartAtUtc:start,periodEndAtUtc:end}});
}
