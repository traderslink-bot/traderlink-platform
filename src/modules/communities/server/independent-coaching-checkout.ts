import {requireCoachCommercialAccess} from './coaching-commercial-access';
import type Database from 'better-sqlite3';
import type {CoachingDirectPurchase} from '../contracts/coaching-direct-purchase';
import type {CoachingWhopBillingExpectation} from './coaching-whop-offer-verification';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import {CoachingPaymentIdentityRepository} from './coaching-payment-identity-repository';
import {CoachingDirectPaymentRepository} from './coaching-direct-payment-repository';
import {CoachingDirectPaymentService} from './coaching-direct-payment-service';
import type {CoachingWhopDirectClient} from './coaching-whop-direct-client';

type WithDatabase=<T>(operation:(database:Database.Database)=>T)=>T;
export async function beginIndependentCoachingCheckout(input:{withDatabase:WithDatabase;client:CoachingWhopDirectClient;environment:'sandbox'|'live';identityKey:string;platformAccountId:string;actorUserId:string;enrollmentId:string;agreementId:string;purchaseId:string;commission:{policyVersion:string;basisPoints:number};atUtc:string}){
 const original=input.withDatabase(db=>{
  const repo=new IndependentCoachingRepository(db),enrollment=repo.enrollment(input.enrollmentId,input.actorUserId);
  requireCoachCommercialAccess(db,{coachUserId:enrollment.coach_user_id,scope:'platform',atUtc:input.atUtc,environment:input.environment});
  if(enrollment.student_user_id!==input.actorUserId)throw new Error('Only the student pays for this coaching agreement.');
  const agreement=repo.agreements(input.enrollmentId,input.actorUserId).find(a=>a.agreementId===input.agreementId&&a.status==='accepted');
  if(!agreement||agreement.terms.builderConfig?.payment?.method!=='whop')throw new Error('Use the payment method in the accepted agreement.');
  if(agreement.terms.priceAmountMinor===0)throw new Error('This agreement does not require a coach service payment. Open your agreed work.');
  if(db.prepare('SELECT 1 FROM traderlink_coaching_direct_purchase_funding WHERE purchase_id=?').get(input.purchaseId))throw new Error('Payment is already recorded. Open your agreed coaching work.');
  if(!db.prepare('SELECT 1 FROM traderlink_coaching_whop_identities WHERE environment=? AND user_id=?').get(input.environment,input.actorUserId))throw new Error('Connect your Whop identity before paying.');
  const identity=new CoachingPaymentIdentityRepository(db,input.environment,input.identityKey),merchant=identity.readMerchant(enrollment.coach_user_id);
  if(!merchant||merchant.status!=='verified'||merchant.platformAccountId!==input.platformAccountId)throw new Error('The coach needs to complete payment setup.');
  return {agreement,enrollment,merchant};
 });
 const nativeAccount=await input.client.retrieveAccount(original.merchant.merchantAccountId);
 if(nativeAccount.id!==original.merchant.merchantAccountId)throw new Error('The provider returned a different coach account.');
 input.withDatabase(db=>new CoachingPaymentIdentityRepository(db,input.environment,input.identityKey).verifyMerchant(original.enrollment.coach_user_id,input.platformAccountId,nativeAccount,input.atUtc));
 const terms=original.agreement.terms;
 const interval=terms.billingCadence==='weekly'?7:terms.builderConfig?.payment?.billingIntervalDays??null;
 if(terms.billingCadence!=='one_time'&&(!Number.isSafeInteger(interval)||interval!<1))throw new Error('Agree an explicit billing interval before payment.');
 const billing:CoachingWhopBillingExpectation=terms.billingCadence==='one_time'?{planType:'one_time',periodDays:null,renewalPriceMinor:0,cadenceQualification:'one_time'}:{planType:'renewal',periodDays:interval,renewalPriceMinor:terms.priceAmountMinor,cadenceQualification:terms.billingCadence==='weekly'?'weekly':'explicit_day_interval'};
 type Offer={product_id:string;variant_id:string;billing_json:string};
 const findOffer=()=>input.withDatabase(db=>db.prepare('SELECT product_id,variant_id,billing_json FROM traderlink_coaching_provider_offers WHERE environment=? AND agreement_id=? AND merchant_account_id=?').get(input.environment,input.agreementId,original.merchant.merchantAccountId) as Offer|undefined);
 let offer=findOffer();
 if(!offer){
  const created=await input.client.createOffer({agreementId:input.agreementId,merchantAccountId:original.merchant.merchantAccountId,title:terms.planName,description:terms.description,currency:terms.currency,priceAmountMinor:terms.priceAmountMinor,billing});
  input.withDatabase(db=>db.prepare('INSERT INTO traderlink_coaching_provider_offers VALUES(?,?,?,?,?,?,?) ON CONFLICT(environment,agreement_id,merchant_account_id) DO NOTHING').run(input.environment,input.agreementId,original.merchant.merchantAccountId,created.productId,created.variantId,JSON.stringify(billing),input.atUtc));
  offer=findOffer();
 }
 if(!offer||offer.billing_json!==JSON.stringify(billing))throw new Error('Provider billing differs from the accepted agreement.');
 const policy=terms.commercialPolicy;
 const commission=policy?{policyVersion:policy.policyVersion,basisPoints:policy.commissionEnabled?policy.commissionBasisPoints:0}:input.commission;
 const purchase:CoachingDirectPurchase={version:1,purchaseId:input.purchaseId,environment:input.environment,coachUserId:original.enrollment.coach_user_id,studentUserId:input.actorUserId,merchantAccountId:original.merchant.merchantAccountId,providerOffer:{productId:offer.product_id,variantId:offer.variant_id},agreement:original.agreement,price:{amountMinor:terms.priceAmountMinor,currency:terms.currency},commission:{...commission,rounding:'half_up'},allocations:terms.items.map(item=>({planItemId:item.planItemId,occurrences:terms.builderConfig?.payment?.serviceOccurrences[item.itemType]??1})),createdAtUtc:input.atUtc};
 const repository:ConstructorParameters<typeof CoachingDirectPaymentService>[0]={
  readPurchase:id=>input.withDatabase(db=>new CoachingDirectPaymentRepository(db).readPurchase(id)),
  recordPurchase:value=>input.withDatabase(db=>{
   const current=new IndependentCoachingRepository(db).agreements(input.enrollmentId,input.actorUserId).find(a=>a.agreementId===input.agreementId&&a.status==='accepted');
   if(!current)throw new Error('The accepted agreement changed. Review it before paying.');
   return new CoachingDirectPaymentRepository(db).recordPurchase(value);
  }),
  readCheckout:id=>input.withDatabase(db=>new CoachingDirectPaymentRepository(db).readCheckout(id)),
  recordCheckout:(id,checkout,at)=>input.withDatabase(db=>new CoachingDirectPaymentRepository(db).recordCheckout(id,checkout,at)),
  recordObservation:value=>input.withDatabase(db=>new CoachingDirectPaymentRepository(db).recordObservation(value)),
  recordFunding:(id,payment,at)=>input.withDatabase(db=>new CoachingDirectPaymentRepository(db).recordFunding(id,payment,at)),
 };
 return new CoachingDirectPaymentService(repository,input.client).beginCheckout({purchase,actorUserId:input.actorUserId,returnPath:`/coaching/enrollments/${encodeURIComponent(input.enrollmentId)}`,platformAccountId:input.platformAccountId,billing,atUtc:input.atUtc});
}
