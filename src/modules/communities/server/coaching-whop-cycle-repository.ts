import type Database from 'better-sqlite3';
import type {CoachingDirectPurchase} from '../contracts/coaching-direct-purchase';
import {CoachingDirectPaymentRepository} from './coaching-direct-payment-repository';
export class CoachingWhopCycleRepository{
 constructor(private readonly database:Database.Database){}
 readOrigin(environment:'sandbox'|'live',merchantAccountId:string,membershipId:string):CoachingDirectPurchase|null{
  const row=this.database.prepare('SELECT origin_purchase_id FROM traderlink_coaching_recurring_memberships WHERE environment=? AND merchant_account_id=? AND membership_id=?').get(environment,merchantAccountId,membershipId) as {origin_purchase_id:string}|undefined;
  return row?new CoachingDirectPaymentRepository(this.database).readPurchase(row.origin_purchase_id):null;
 }
 recordOrigin(origin:CoachingDirectPurchase,membership:Record<string,unknown>,providerUserId:string,atUtc:string):void{
  const account=membership.account as {id?:unknown}|undefined;
  const days=origin.agreement.terms.billingCadence==='weekly'?7:origin.agreement.terms.builderConfig?.payment?.billingIntervalDays;
  if(origin.billingCycle||origin.agreement.terms.billingCadence==='one_time'||typeof membership.id!=='string'||!membership.id.startsWith('mem_')||account?.id!==origin.merchantAccountId||membership.user_id!==providerUserId||membership.plan_id!==origin.providerOffer.variantId||membership.product_id!==origin.providerOffer.productId||!days||membership.billing_period_days!==days)throw new Error('The paid membership differs from the original coaching purchase.');
  if(!this.database.prepare('SELECT 1 FROM traderlink_coaching_direct_purchase_funding WHERE purchase_id=?').get(origin.purchaseId))throw new Error('Verify initial funding before binding a recurring membership.');
  const prior=this.readOrigin(origin.environment,origin.merchantAccountId,membership.id);
  if(prior&&prior.purchaseId!==origin.purchaseId)throw new Error('This membership already belongs to another accepted purchase.');
  this.database.prepare('INSERT INTO traderlink_coaching_recurring_memberships VALUES(?,?,?,?,?) ON CONFLICT(environment,merchant_account_id,membership_id) DO NOTHING').run(origin.environment,origin.merchantAccountId,membership.id,origin.purchaseId,atUtc);
 }
 recordCycle(purchase:CoachingDirectPurchase):void{
  const cycle=purchase.billingCycle;if(!cycle)throw new Error('Identify the verified billing cycle.');
  if(!this.database.prepare('SELECT 1 FROM traderlink_coaching_direct_purchase_funding WHERE purchase_id=?').get(purchase.purchaseId))throw new Error('Verify funding before recording a paid billing cycle.');
  const origin=this.readOrigin(purchase.environment,purchase.merchantAccountId,cycle.membershipId);
  if(!origin||origin.purchaseId!==cycle.originPurchaseId)throw new Error('This billing cycle is not bound to its original paid purchase.');
  const prior=this.database.prepare('SELECT invoice_payment_id,purchase_id,period_end_utc FROM traderlink_coaching_paid_billing_cycles WHERE environment=? AND merchant_account_id=? AND membership_id=? AND period_start_utc=?').get(purchase.environment,purchase.merchantAccountId,cycle.membershipId,cycle.periodStartAtUtc) as {invoice_payment_id:string;purchase_id:string;period_end_utc:string}|undefined;
  if(prior&&(prior.invoice_payment_id!==cycle.invoicePaymentId||prior.purchase_id!==purchase.purchaseId||prior.period_end_utc!==cycle.periodEndAtUtc))throw new Error('Another invoice already identifies this billing cycle.');
  this.database.prepare('INSERT INTO traderlink_coaching_paid_billing_cycles VALUES(?,?,?,?,?,?,?) ON CONFLICT(environment,merchant_account_id,membership_id,period_start_utc) DO NOTHING').run(purchase.environment,purchase.merchantAccountId,cycle.membershipId,cycle.periodStartAtUtc,cycle.periodEndAtUtc,cycle.invoicePaymentId,purchase.purchaseId);
 }
}
