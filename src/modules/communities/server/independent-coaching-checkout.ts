import {createHash} from 'node:crypto';
import {requireCoachCommercialAccess} from './coaching-commercial-access';
import type Database from 'better-sqlite3';
import type {CoachingDirectPurchase} from '../contracts/coaching-direct-purchase';
import {canonicalPackJson} from '../contracts/coaching-pack-repurchase';
import type {CoachingWhopBillingExpectation} from './coaching-whop-offer-verification';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import {CoachingPaymentIdentityRepository} from './coaching-payment-identity-repository';
import {CoachingDirectPaymentRepository} from './coaching-direct-payment-repository';
import {CoachingDirectPaymentService} from './coaching-direct-payment-service';
import {IndependentCheckoutInvocation} from './independent-coaching-checkout-authority';
import type {CoachingWhopDirectClient} from './coaching-whop-direct-client';

type WithDatabase=<T>(operation:(database:Database.Database)=>T)=>T;
const PRODUCT_EVENT='checkout_product_observed_v1',VARIANT_EVENT='checkout_variant_observed_v1';
const changed=()=>{throw new Error('The original coaching order changed. Reconcile it before continuing.');};
type Offer={product_id:string;variant_id:string;billing_json:string};
export async function beginIndependentCoachingCheckout(parameters:{withDatabase:WithDatabase;client:CoachingWhopDirectClient;invocation:IndependentCheckoutInvocation;environment:'sandbox'|'live';identityKey:string;platformAccountId:string;actorUserId:string;enrollmentId:string;agreementId:string;purchaseId:string;commission:{policyVersion:string;basisPoints:number};atUtc:string}){
 const input=Object.freeze({...parameters,commission:Object.freeze({...parameters.commission})});
 if(!(input.invocation instanceof IndependentCheckoutInvocation)||input.invocation.actorUserId!==input.actorUserId)throw new Error('Use the original authenticated coaching checkout.');
 const canonicalId=createHash('sha256').update(JSON.stringify([input.environment,input.actorUserId,input.enrollmentId,input.agreementId,'initial-purchase-v1'])).digest('hex');
 if(input.purchaseId!==canonicalId)changed();
 const frame=<T>(operation:(db:Database.Database,now:string)=>T)=>input.withDatabase(db=>db.transaction(()=>operation(db,new Date().toISOString())).immediate());
 const current=(db:Database.Database,now:string)=>{
  const repo=new IndependentCoachingRepository(db),enrollment=repo.enrollment(input.enrollmentId,input.actorUserId);
  const commercial=requireCoachCommercialAccess(db,{coachUserId:enrollment.coach_user_id,scope:'platform',atUtc:now,environment:input.environment});
  if(enrollment.student_user_id!==input.actorUserId||enrollment.status!=='active')throw new Error('Only the original student pays for an active coaching agreement.');
  const agreement=repo.agreements(input.enrollmentId,input.actorUserId).find(a=>a.agreementId===input.agreementId&&a.status==='accepted');
  if(!agreement||agreement.terms.builderConfig?.payment?.method!=='whop')throw new Error('Use the payment method in the accepted agreement.');
  if(agreement.terms.priceAmountMinor===0)throw new Error('This agreement does not require a coach service payment. Open your agreed work.');
  if(db.prepare('SELECT 1 FROM traderlink_coaching_direct_purchase_funding WHERE purchase_id=?').get(input.purchaseId))throw new Error('Payment is already recorded. Open your agreed coaching work.');
  const identities=db.prepare('SELECT user_id,provider_user_ref_hmac FROM traderlink_coaching_whop_identities WHERE environment=? AND user_id IN (?,?) ORDER BY user_id').all(input.environment,input.actorUserId,enrollment.coach_user_id) as {user_id:string;provider_user_ref_hmac:string}[];
  if(!identities.some(row=>row.user_id===input.actorUserId))throw new Error('Connect your Whop identity before paying.');
  const merchant=new CoachingPaymentIdentityRepository(db,input.environment,input.identityKey).readMerchant(enrollment.coach_user_id);
  if(!merchant||merchant.status!=='verified'||merchant.platformAccountId!==input.platformAccountId)throw new Error('The coach needs to complete payment setup.');
  const merchantOwner=db.prepare('SELECT owner_ref_hmac FROM traderlink_coaching_merchant_connections WHERE environment=? AND coach_user_id=?').get(input.environment,enrollment.coach_user_id);
  return {agreement,enrollment,merchant,domain:canonicalPackJson({agreement,enrollment,commercial,identities,merchant:{account:merchant.merchantAccountId,platform:merchant.platformAccountId,status:merchant.status,owner:merchantOwner}})};
 };
 input.invocation.revalidateRequest();
 const original=frame((db,now)=>{
  input.invocation.assertInDatabase(db,now);const value=current(db,now);
  const offer=db.prepare('SELECT product_id,variant_id,billing_json FROM traderlink_coaching_provider_offers WHERE environment=? AND agreement_id=? AND merchant_account_id=?').get(input.environment,input.agreementId,value.merchant.merchantAccountId) as Offer|undefined;
  return {...value,offer,purchase:new CoachingDirectPaymentRepository(db).readPurchase(input.purchaseId)};
 });
 let expectedPurchase:CoachingDirectPurchase|undefined=undefined,expectedOffer:Offer|undefined=original.offer;
 if(original.purchase){
  const p=original.purchase;
  if(p.environment!==input.environment||p.studentUserId!==input.actorUserId||p.coachUserId!==original.enrollment.coach_user_id||p.merchantAccountId!==original.merchant.merchantAccountId
   ||canonicalPackJson(p.agreement)!==canonicalPackJson(original.agreement)||!original.offer
   ||p.providerOffer.productId!==original.offer.product_id||p.providerOffer.variantId!==original.offer.variant_id)changed();
 }
 const findOffer=(db:Database.Database)=>db.prepare('SELECT product_id,variant_id,billing_json FROM traderlink_coaching_provider_offers WHERE environment=? AND agreement_id=? AND merchant_account_id=?').get(input.environment,input.agreementId,original.merchant.merchantAccountId) as Offer|undefined;
 const guarded=<T>(operation:(db:Database.Database,now:string)=>T):T=>{
  // Never open the normal identity facade while holding a native writer.
  input.invocation.revalidateRequest();
  return frame((db,now)=>{
   input.invocation.assertInDatabase(db,now);
   if(current(db,now).domain!==original.domain)changed();
   const purchase=new CoachingDirectPaymentRepository(db).readPurchase(input.purchaseId);
   if(purchase){if(canonicalPackJson(purchase)!==canonicalPackJson(expectedPurchase??original.purchase))changed();}
   else if(original.purchase)changed();
   if(canonicalPackJson(findOffer(db)??null)!==canonicalPackJson(expectedOffer??null))changed();
   return operation(db,now);
  });
 };
 const beforeRequest=()=>{guarded(()=>undefined);};
 const nativeAccount=await input.client.retrieveAccount(original.merchant.merchantAccountId,beforeRequest);
 if(nativeAccount.id!==original.merchant.merchantAccountId)throw new Error('The provider returned a different coach account.');
 guarded((db,now)=>new CoachingPaymentIdentityRepository(db,input.environment,input.identityKey).verifyMerchant(original.enrollment.coach_user_id,input.platformAccountId,nativeAccount,now));
 const terms=original.agreement.terms,interval=terms.billingCadence==='weekly'?7:terms.builderConfig?.payment?.billingIntervalDays??null;
 if(terms.billingCadence!=='one_time'&&(!Number.isSafeInteger(interval)||interval!<1))throw new Error('Agree an explicit billing interval before payment.');
 const billing:CoachingWhopBillingExpectation=terms.billingCadence==='one_time'?{planType:'one_time',periodDays:null,renewalPriceMinor:0,cadenceQualification:'one_time'}:{planType:'renewal',periodDays:interval,renewalPriceMinor:terms.priceAmountMinor,cadenceQualification:terms.billingCadence==='weekly'?'weekly':'explicit_day_interval'};
 // Past returned facts are not NEW dispatch permission. Normal native opens
 // still apply; erased parents are never recreated or exempted from FK erasure.
 const tuple=Object.freeze({version:1,environment:input.environment,enrollmentId:input.enrollmentId,agreementId:input.agreementId,purchaseId:input.purchaseId,merchantAccountId:original.merchant.merchantAccountId});
 if(Object.values(tuple).some(value=>typeof value==='string'&&value.length>200))changed();
 const eventId=(stage:'product'|'variant')=>createHash('sha256').update(JSON.stringify(['coaching-provider-observation-v1',tuple,stage,`coaching-${stage}:${input.agreementId}`])).digest('hex');
 function readObserved(db:Database.Database,stage:'product'|'variant'){
  const row=db.prepare('SELECT enrollment_id,actor_user_id,kind,object_id FROM traderlink_coaching_events WHERE event_id=?').get(eventId(stage)) as {enrollment_id:string;actor_user_id:string;kind:string;object_id:string}|undefined;
  if(!row)return null;
  if(row.object_id.length>2048)changed();
  const value=JSON.parse(row.object_id) as Record<string,unknown>;
  const {productId,variantId,...binding}=value;
  if(row.enrollment_id!==input.enrollmentId||row.actor_user_id!==input.actorUserId||row.kind!==(stage==='product'?PRODUCT_EVENT:VARIANT_EVENT)
   ||canonicalPackJson(binding)!==canonicalPackJson({...tuple,stage,operationKey:`coaching-${stage}:${input.agreementId}`})
   ||typeof productId!=='string'||productId.length>200||!/^prod_[A-Za-z0-9]+$/.test(productId)
   ||(stage==='variant'?(typeof variantId!=='string'||variantId.length>200||!/^plan_[A-Za-z0-9]+$/.test(variantId)):variantId!==undefined))changed();
  return {productId:productId as string,...(typeof variantId==='string'?{variantId}:{})};
 }
 function observe(stage:'product'|'variant',value:{productId:string;variantId?:string}){
  if(typeof value.productId!=='string'||value.productId.length>200||!/^prod_[A-Za-z0-9]+$/.test(value.productId)
   ||(stage==='variant'?(typeof value.variantId!=='string'||value.variantId.length>200||!/^plan_[A-Za-z0-9]+$/.test(value.variantId)):value.variantId!==undefined))changed();
  const encoded=JSON.stringify({...tuple,stage,operationKey:`coaching-${stage}:${input.agreementId}`,...value});
  if(encoded.length>2048)changed();
  frame((db,now)=>{
   const prior=readObserved(db,stage);
   if(prior){if(canonicalPackJson(prior)!==canonicalPackJson(value))changed();return;}
   if(!db.prepare('SELECT 1 FROM traderlink_coaching_accepted_terms WHERE agreement_id=? AND enrollment_id=?').get(input.agreementId,input.enrollmentId))changed();
   db.prepare('INSERT INTO traderlink_coaching_events VALUES(?,?,?,?,?,?)').run(eventId(stage),input.enrollmentId,input.actorUserId,stage==='product'?PRODUCT_EVENT:VARIANT_EVENT,encoded,now);
  });
 }
 function settleOffer(value:{productId:string;variantId:string}){
  const offer={product_id:value.productId,variant_id:value.variantId,billing_json:JSON.stringify(billing)};
  frame(db=>{
   const prior=findOffer(db);
   if(prior){if(canonicalPackJson(prior)!==canonicalPackJson(offer))changed();return;}
   if(!db.prepare('SELECT 1 FROM traderlink_coaching_accepted_terms WHERE agreement_id=? AND enrollment_id=?').get(input.agreementId,input.enrollmentId))changed();
   db.prepare('INSERT INTO traderlink_coaching_provider_offers VALUES(?,?,?,?,?,?,?)').run(input.environment,input.agreementId,original.merchant.merchantAccountId,value.productId,value.variantId,offer.billing_json,new Date().toISOString());
  });
  return offer;
 }
 let offer=guarded(db=>findOffer(db));
 if(!offer){
  // These lookups can only reuse observed IDs under the original tuple. Every
  // continuation still has normal request/session/domain authorization.
  const observed=guarded(db=>({product:readObserved(db,'product'),variant:readObserved(db,'variant')}));
  if(observed.variant?.variantId){
   if(!observed.product||observed.product.productId!==observed.variant.productId)changed();
   offer=settleOffer({productId:observed.variant.productId,variantId:observed.variant.variantId});
  }else{
   const created=await input.client.createOffer({agreementId:input.agreementId,merchantAccountId:original.merchant.merchantAccountId,title:terms.planName,description:terms.description,currency:terms.currency,priceAmountMinor:terms.priceAmountMinor,billing,beforeRequest,observedProductId:observed.product?.productId,
    onProduct:value=>observe('product',value),onVariant:value=>observe('variant',value)});
   offer=settleOffer(created);
  }
 }
 if(!offer||offer.billing_json!==JSON.stringify(billing))throw new Error('Provider billing differs from the accepted agreement.');
 expectedOffer=Object.freeze({...offer});
 const policy=terms.commercialPolicy,commission=policy?{policyVersion:policy.policyVersion,basisPoints:policy.commissionEnabled?policy.commissionBasisPoints:0}:input.commission;
 expectedPurchase={version:1,purchaseId:input.purchaseId,environment:input.environment,coachUserId:original.enrollment.coach_user_id,studentUserId:input.actorUserId,merchantAccountId:original.merchant.merchantAccountId,providerOffer:{productId:offer.product_id,variantId:offer.variant_id},agreement:original.agreement,price:{amountMinor:terms.priceAmountMinor,currency:terms.currency},commission:{...commission,rounding:'half_up'},allocations:terms.items.map(item=>({planItemId:item.planItemId,occurrences:terms.builderConfig?.payment?.serviceOccurrences[item.itemType]??1})),createdAtUtc:original.purchase?.createdAtUtc??input.atUtc};
 const purchase=expectedPurchase;
 const repository:ConstructorParameters<typeof CoachingDirectPaymentService>[0]={
  readPurchase:id=>guarded(db=>new CoachingDirectPaymentRepository(db).readPurchase(id)),
  recordPurchase:value=>guarded(db=>new CoachingDirectPaymentRepository(db).recordPurchase(value)),
  readCheckout:id=>guarded(db=>new CoachingDirectPaymentRepository(db).readCheckout(id)),
  recordCheckout:(id,checkout,at)=>frame(db=>{
   // Settle this already-returned checkout against its ORIGINAL durable order,
   // even after revocation/funding changes. This never authorizes another POST.
   const repo=new CoachingDirectPaymentRepository(db),saved=repo.readPurchase(id);
   if(id!==input.purchaseId||canonicalPackJson(saved)!==canonicalPackJson(purchase))changed();
   return repo.recordCheckout(id,checkout,at);
  }),
  recordObservation:value=>guarded(db=>new CoachingDirectPaymentRepository(db).recordObservation(value)),
  recordFunding:(id,payment,at)=>guarded(db=>new CoachingDirectPaymentRepository(db).recordFunding(id,payment,at)),
 };
 const result=await new CoachingDirectPaymentService(repository,input.client).beginCheckout({purchase,actorUserId:input.actorUserId,returnPath:`/coaching/enrollments/${encodeURIComponent(input.enrollmentId)}`,platformAccountId:input.platformAccountId,billing,atUtc:input.atUtc,beforeRequest});
 beforeRequest(); // Permission to return a private checkout URL is current too.
 return result;
}
