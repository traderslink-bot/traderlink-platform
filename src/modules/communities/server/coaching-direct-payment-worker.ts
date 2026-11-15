import {qualifyCoachingWhopPaymentQuote} from './coaching-whop-payment-quote';
import {observeCoachingWhopResource} from './coaching-whop-resource-events';
import type Database from 'better-sqlite3';
import {CoachingDirectPaymentInbox} from './coaching-direct-payment-inbox';
import {CoachingDirectPaymentRepository} from './coaching-direct-payment-repository';
import {CoachingPaymentIdentityRepository} from './coaching-payment-identity-repository';
import {normalizeCoachingWhopPayment} from './coaching-whop-payment-normalization';
import {assessCoachingPurchasePayment} from '../contracts/coaching-direct-purchase';
import {fulfillIndependentCoachingPurchase} from './independent-coaching-paid-work';
import {reconcileCoachingPurchaseCommission} from './coaching-direct-commission-service';
import {CoachingWhopCycleRepository} from './coaching-whop-cycle-repository';
import {coachingWhopRenewalPurchase} from './coaching-whop-billing-cycle';

type DatabaseOperation=<T>(operation:(database:Database.Database)=>T)=>T;
/** Explicitly invoked worker only. No timer/startup hook or provider credentials here. */
export async function processCoachingPaymentEvent(input:{environment:'sandbox'|'live';identityKey:string;withDatabase:DatabaseOperation;retrievePayment:(id:string)=>Promise<Record<string,unknown>>;retrieveMembership?:(id:string)=>Promise<Record<string,unknown>>;retrieveAccount?:(id:string)=>Promise<Record<string,unknown>>;platformAccountId?:string;retrieveCommissionActivity?:(accountId:string,paymentId:string,after?:string)=>Promise<Record<string,unknown>>;now:()=>string}):Promise<'idle'|'completed'|'retry'>{
 const started=input.now(),leaseUntil=new Date(Date.parse(started)+60000).toISOString();
 const claim=input.withDatabase(db=>new CoachingDirectPaymentInbox(db).claimNext(input.environment,started,leaseUntil));
 if(!claim)return 'idle';
 try{
  if(claim.event.resourceKind!=='payment'){
   await observeCoachingWhopResource({...input,event:claim.event,assertOwned:(db,at)=>new CoachingDirectPaymentInbox(db).assertOwned(claim,at),complete:db=>new CoachingDirectPaymentInbox(db).complete(claim)});return 'completed';
  }
  if(claim.event.type==='coaching.commission.reconcile'){
   if(!input.platformAccountId||!input.retrieveCommissionActivity)throw new Error('reconciliation_required');
   const binding=input.withDatabase(db=>db.prepare('SELECT purchase_id FROM traderlink_coaching_direct_payment_bindings WHERE environment=? AND merchant_account_id=? AND payment_id=?').get(input.environment,claim.event.merchantAccountId,claim.event.resourceId) as {purchase_id:string}|undefined);
   if(!binding)throw new Error('binding_unavailable');
   const result=await reconcileCoachingPurchaseCommission({purchaseId:binding.purchase_id,paymentId:claim.event.resourceId,platformAccountId:input.platformAccountId,withDatabase:input.withDatabase,retrieveActivity:input.retrieveCommissionActivity,now:input.now,assertCommit:(db,at)=>new CoachingDirectPaymentInbox(db).assertOwned(claim,at)});
   if(result.state!=='matched')throw new Error('reconciliation_required');
   input.withDatabase(db=>db.transaction(()=>{const inbox=new CoachingDirectPaymentInbox(db);inbox.assertOwned(claim,input.now());inbox.complete(claim);}).immediate());return 'completed';
  }
  const payment=await input.retrievePayment(claim.event.resourceId);
  if(payment.id!==claim.event.resourceId||payment.account_id!==claim.event.merchantAccountId)throw new Error('binding_unavailable');
  const known=input.withDatabase(db=>{
   const repository=new CoachingDirectPaymentRepository(db),cycles=new CoachingWhopCycleRepository(db);
   const binding=db.prepare('SELECT purchase_id FROM traderlink_coaching_direct_payment_bindings WHERE environment=? AND merchant_account_id=? AND payment_id=?').get(input.environment,claim.event.merchantAccountId,claim.event.resourceId) as {purchase_id:string}|undefined;
   if(binding){const purchase=repository.readPurchase(binding.purchase_id);if(!purchase)throw new Error('binding_unavailable');return {purchase,renewalOrigin:null,needsMembership:!purchase.billingCycle&&purchase.agreement.terms.billingCadence!=='one_time'&&typeof payment.membership_id==='string'&&!cycles.readOrigin(input.environment,claim.event.merchantAccountId,payment.membership_id)};}
   if(payment.billing_reason==='subscription_cycle'){
    if(typeof payment.membership_id!=='string')throw new Error('binding_unavailable');
    const origin=cycles.readOrigin(input.environment,claim.event.merchantAccountId,payment.membership_id);if(!origin)throw new Error('binding_unavailable');
    return {purchase:null,renewalOrigin:origin,needsMembership:true};
   }
   const checkout=db.prepare('SELECT purchase_id FROM traderlink_coaching_direct_checkouts WHERE environment=? AND merchant_account_id=? AND checkout_id=?').get(input.environment,claim.event.merchantAccountId,typeof payment.checkout_configuration_id==='string'?payment.checkout_configuration_id:'') as {purchase_id:string}|undefined;
   const purchase=checkout?repository.readPurchase(checkout.purchase_id):null;if(!purchase)throw new Error('binding_unavailable');
   return {purchase,renewalOrigin:null,needsMembership:purchase.agreement.terms.billingCadence!=='one_time'&&typeof payment.membership_id==='string'&&!cycles.readOrigin(input.environment,claim.event.merchantAccountId,payment.membership_id)};
  });
  const membership=known.needsMembership&&typeof payment.membership_id==='string'&&input.retrieveMembership?await input.retrieveMembership(payment.membership_id):null;
  if(known.needsMembership&&!membership)throw new Error('binding_unavailable');
  if(membership&&membership.id!==payment.membership_id)throw new Error('binding_unavailable');
  const atUtc=input.now();
  input.withDatabase(db=>db.transaction(()=>{
   const inbox=new CoachingDirectPaymentInbox(db);inbox.assertOwned(claim,atUtc);
   if(payment.id!==claim.event.resourceId||payment.account_id!==claim.event.merchantAccountId)throw new Error('binding_unavailable');
   const repository=new CoachingDirectPaymentRepository(db),cycles=new CoachingWhopCycleRepository(db);
   let purchase=known.purchase;
   if(known.renewalOrigin&&membership){
    const renewed=coachingWhopRenewalPurchase({origin:known.renewalOrigin,membership,payment,atUtc}),prior=repository.readPurchase(renewed.purchaseId);
    purchase={...renewed,createdAtUtc:prior?.createdAtUtc??renewed.createdAtUtc};repository.recordPurchase(purchase);
   }
   if(!purchase)throw new Error('binding_unavailable');
   const user=payment.user as {id?:unknown}|undefined;
   if(typeof user?.id!=='string'||!new CoachingPaymentIdentityRepository(db,input.environment,input.identityKey).matchesUser(purchase.studentUserId,user.id))throw new Error('binding_unavailable');
   // Exact authenticated quote facts only; unsupported tax/FX allocations stay
   // in reconciliation. Renewals still need their original membership/period.
   const checkout=repository.readCheckout(purchase.purchaseId),cycle=purchase.billingCycle;
   const quote=qualifyCoachingWhopPaymentQuote(purchase,payment);
   const normalized=normalizeCoachingWhopPayment({purchase,payment,binding:{paymentId:claim.event.resourceId,providerUserId:user.id,checkoutId:cycle?null:checkout?.checkoutId??null,membershipId:cycle?.membershipId??null,...(cycle?{cycle:{invoicePaymentId:cycle.invoicePaymentId,periodStartAtUtc:cycle.periodStartAtUtc,periodEndAtUtc:cycle.periodEndAtUtc}}:{}),quote}});
   db.prepare('INSERT INTO traderlink_coaching_payment_quote_observations VALUES(?,?,?,?,?,?)').run(input.environment,purchase.purchaseId,claim.event.resourceId,claim.event.eventId,JSON.stringify(quote),atUtc);
   const assessment=assessCoachingPurchasePayment(purchase,normalized.evidence);
   repository.recordObservation({receiptId:claim.event.eventId,payloadSha256:claim.event.payloadSha256,source:'provider_event',observedAtUtc:atUtc,payment:normalized.evidence});
   if(assessment.state==='paid'){
    repository.recordFunding(purchase.purchaseId,claim.event.resourceId,atUtc);
    if(cycle)cycles.recordCycle(purchase);
    else if(membership)cycles.recordOrigin(purchase,membership,user.id,atUtc);
    fulfillIndependentCoachingPurchase(db,purchase.purchaseId,atUtc);
   }
   inbox.complete(claim);
   // Internal follow-up work is durable and separate from the signed provider
   // receipt. It cannot create another financial observation or service batch.
   inbox.enqueue(input.environment,{...claim.event,eventId:`coaching-commission:${claim.event.eventId}`,type:'coaching.commission.reconcile',occurredAtUtc:atUtc},atUtc);
  }).immediate());
  return 'completed';
 }catch(error){
  const atUtc=input.now(),retryAt=new Date(Date.parse(atUtc)+60000).toISOString();
  try{input.withDatabase(db=>{const inbox=new CoachingDirectPaymentInbox(db);inbox.assertOwned(claim,atUtc);inbox.retry(claim,retryAt,error instanceof Error&&error.message==='binding_unavailable'?'binding_unavailable':'reconciliation_required');});}catch{/* A newer lease owns recovery; stale workers cannot mutate it. */}
  return 'retry';
 }
}
