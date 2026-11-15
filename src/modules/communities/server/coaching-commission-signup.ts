import type Database from 'better-sqlite3';
import {readCoachCommercialAccess} from './coaching-commercial-access';
import {CoachingPaymentIdentityRepository} from './coaching-payment-identity-repository';
import {verifyCoachingWhopCommissionFees} from './coaching-whop-offer-verification';
/** Only authenticated provider reads may be supplied by the request boundary.
 * Verification reads configuration; it does not change fees or require a sale. */
export function recordCoachCommissionSetup(db:Database.Database,input:{coachUserId:string;scope:'platform'|'community';communityId?:string;environment:'sandbox'|'live';identityKey:string;platformAccountId:string;nativeAccount:Record<string,unknown>;accountFees:Record<string,unknown>;atUtc:string}):void{
 db.transaction(()=>{
  const access=readCoachCommercialAccess(db,input);
  if(!access.commissionRequired||!access.consentReady)throw new Error('Accept the current commission terms before verifying setup.');
  const identity=new CoachingPaymentIdentityRepository(db,input.environment,input.identityKey),merchant=identity.readMerchant(input.coachUserId);
  if(!merchant||input.nativeAccount.id!==merchant.merchantAccountId)throw new Error('Connect the coach payment account first.');
  identity.verifyMerchant(input.coachUserId,input.platformAccountId,input.nativeAccount,input.atUtc);
  verifyCoachingWhopCommissionFees({accountFees:input.accountFees,merchantAccountId:merchant.merchantAccountId,platformAccountId:input.platformAccountId,basisPoints:access.policy.commissionBasisPoints});
  db.prepare(`INSERT INTO traderlink_coaching_commission_setup_checks VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(coach_user_id,environment,scope,scope_key,policy_version) DO UPDATE SET merchant_account_id=excluded.merchant_account_id,commission_basis_points=excluded.commission_basis_points,verified_at_utc=excluded.verified_at_utc`).run(input.coachUserId,input.environment,input.scope,input.communityId??'platform',access.policy.policyVersion,merchant.merchantAccountId,access.policy.commissionBasisPoints,input.atUtc);
 }).immediate();
}

/** Initial fixed-rate setup only. Changing deals already bound to agreements or
 * purchases is a separate qualification; no existing renewal is silently repriced. */
export async function completeInitialCoachCommission(input:{withDatabase:<T>(operation:(db:Database.Database)=>T)=>T;client:{retrieveAccount:(id:string)=>Promise<Record<string,unknown>>;retrieveAccountFees:(id:string)=>Promise<Record<string,unknown>>;setPaymentMarkup:(input:{merchantAccountId:string;platformAccountId:string;basisPoints:number;operationKey:string})=>Promise<void>};coachUserId:string;scope:'platform'|'community';communityId?:string;environment:'sandbox'|'live';identityKey:string;platformAccountId:string;atUtc:string}):Promise<void>{
 if(input.scope!=='platform')throw new Error('Community commission checkout is not enabled.');
 const original=input.withDatabase(db=>{
  const access=readCoachCommercialAccess(db,input),merchant=new CoachingPaymentIdentityRepository(db,input.environment,input.identityKey).readMerchant(input.coachUserId);
  if(!access.commissionRequired||!access.consentReady||!merchant||merchant.status!=='verified'||merchant.platformAccountId!==input.platformAccountId)throw new Error('Accept the commission terms and connect your own coach account.');
  return {access,merchant};
 });
 const nativeAccount=await input.client.retrieveAccount(original.merchant.merchantAccountId),fees=await input.client.retrieveAccountFees(original.merchant.merchantAccountId);
 input.withDatabase(db=>new CoachingPaymentIdentityRepository(db,input.environment,input.identityKey).verifyMerchant(input.coachUserId,input.platformAccountId,nativeAccount,input.atUtc));
 let matches=true;try{verifyCoachingWhopCommissionFees({accountFees:fees,merchantAccountId:original.merchant.merchantAccountId,platformAccountId:input.platformAccountId,basisPoints:original.access.policy.commissionBasisPoints});}catch{matches=false;}
 if(!matches){
  input.withDatabase(db=>{
   const current=readCoachCommercialAccess(db,input);if(current.policy.policyVersion!==original.access.policy.policyVersion||!current.consentReady)throw new Error('The coach terms changed. Reload before completing setup.');
   const rate=current.policy.commissionBasisPoints;
   const purchase=db.prepare("SELECT 1 FROM traderlink_coaching_direct_purchases WHERE environment=? AND merchant_account_id=? AND json_extract(snapshot_json,'$.commission.basisPoints')<>? LIMIT 1").get(input.environment,original.merchant.merchantAccountId,rate);
   const agreement=db.prepare("SELECT 1 FROM traderlink_coaching_accepted_terms a JOIN traderlink_coaching_enrollments e ON e.enrollment_id=a.enrollment_id JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id WHERE c.coach_user_id=? AND a.status='accepted' AND json_extract(a.terms_json,'$.priceAmountMinor')>0 AND json_extract(a.terms_json,'$.commercialPolicy.commissionEnabled')=1 AND json_extract(a.terms_json,'$.commercialPolicy.commissionBasisPoints')<>? LIMIT 1").get(input.coachUserId,rate);
   if(purchase||agreement)throw new Error('Existing accepted payment terms need a qualified rate change before this account markup can change.');
  });
  await input.client.setPaymentMarkup({merchantAccountId:original.merchant.merchantAccountId,platformAccountId:input.platformAccountId,basisPoints:original.access.policy.commissionBasisPoints,operationKey:`coaching-signup:${input.coachUserId}:${original.access.policy.policyVersion}`});
 }
 const accountFees=matches?fees:await input.client.retrieveAccountFees(original.merchant.merchantAccountId);
 input.withDatabase(db=>recordCoachCommissionSetup(db,{...input,nativeAccount,accountFees}));
}
