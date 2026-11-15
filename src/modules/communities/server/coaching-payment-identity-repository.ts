import type Database from "better-sqlite3";
import { createWhopPrivacyReference } from "../../platform/server/billing/whop-ai-review-identity";

export class CoachingPaymentIdentityRepository {
  constructor(private readonly database:Database.Database,private readonly environment:'sandbox'|'live',private readonly identityKey:string){}
  linkUser(userId:string,providerUserId:string,atUtc:string):void {
    const ref=createWhopPrivacyReference(providerUserId,'user',this.identityKey);
    this.database.transaction(()=>{
      const prior=this.database.prepare("SELECT provider_user_ref_hmac FROM traderlink_coaching_whop_identities WHERE environment=? AND user_id=?").get(this.environment,userId) as {provider_user_ref_hmac:string}|undefined;
      if(prior&&prior.provider_user_ref_hmac!==ref)throw new Error('A different Whop identity is already connected.');
      this.database.prepare("INSERT INTO traderlink_coaching_whop_identities VALUES(?,?,?,?) ON CONFLICT(environment,user_id) DO NOTHING").run(this.environment,userId,ref,atUtc);
    }).immediate();
  }
  matchesUser(userId:string,providerUserId:string):boolean {
    const ref=createWhopPrivacyReference(providerUserId,'user',this.identityKey);
    return Boolean(this.database.prepare("SELECT 1 FROM traderlink_coaching_whop_identities WHERE environment=? AND user_id=? AND provider_user_ref_hmac=?").get(this.environment,userId,ref));
  }
  verifyMerchant(coachUserId:string,platformAccountId:string,nativeAccount:Record<string,unknown>,atUtc:string):void {
    const owner=nativeAccount.owner as {id?:unknown}|null,parent=nativeAccount.parent_account as {id?:unknown}|null;
    if(typeof nativeAccount.id!=='string'||typeof owner?.id!=='string'||parent?.id!==platformAccountId||!this.matchesUser(coachUserId,owner.id))throw new Error('Verify ownership of a coach-owned connected Whop account.');
    const ref=createWhopPrivacyReference(owner.id,'user',this.identityKey);
    this.database.prepare(`INSERT INTO traderlink_coaching_merchant_connections VALUES(?,?,?,?,?,'verified',?)
      ON CONFLICT(environment,coach_user_id) DO UPDATE SET platform_account_id=excluded.platform_account_id,merchant_account_id=excluded.merchant_account_id,owner_ref_hmac=excluded.owner_ref_hmac,status='verified',verified_at_utc=excluded.verified_at_utc`)
      .run(this.environment,coachUserId,platformAccountId,nativeAccount.id,ref,atUtc);
  }
  readMerchant(coachUserId:string):Readonly<{merchantAccountId:string;platformAccountId:string;status:string;verifiedAtUtc:string}>|null {
    return this.database.prepare("SELECT merchant_account_id merchantAccountId,platform_account_id platformAccountId,status,verified_at_utc verifiedAtUtc FROM traderlink_coaching_merchant_connections WHERE environment=? AND coach_user_id=?").get(this.environment,coachUserId) as {merchantAccountId:string;platformAccountId:string;status:string;verifiedAtUtc:string}|undefined??null;
  }
}
