import type Database from "better-sqlite3";
import { partnerAlertId, partnerAlertInteger, partnerAlertRef, partnerAlertSnowflake,
  partnerAlertUtc } from "../contracts/partner-alert-validation";
import { erasureHold } from "../../platform/server/privacy/platform-erasure-admission";

type Row=Readonly<{receipt_ref:string;authority_key:string;guild_id:string;discord_user_id:string;role_id:string;
  role_kind:"ordinary_paid"|"partner_channel";source_ref:string;fence_revision:number;state:string;
  prior_write_token:string|null;quiescence_ref:string|null;cleanup_lease_token:string|null;
  cleanup_lease_until_utc:string|null}>;
export type PartnerAlertCleanupOutcome=Readonly<{kind:"confirmed_absent";guildId:string;discordUserId:string;roleId:string}>
  |Readonly<{kind:"retry";reason:"temporary"|"rate_limited";delayMs:number}>
  |Readonly<{kind:"rejected";reason:"permission_required"|"role_missing"}>
  |Readonly<{kind:"uncertain"}>;
export interface PartnerAlertCleanupAuthority {
  /** Qualified current-target ownership and transport-quiescence read. It must
   * reject a superseding live owner/assignment and cannot infer from expiry. */
  isCurrent(row:Row):boolean;
  inWriter<T>(operation:()=>T):T;
}
export interface PartnerAlertCleanupTransport {
  removeRole(input:Readonly<{guildId:string;discordUserId:string;roleId:string;operationId:string;
    stillCurrent:()=>boolean}>):Promise<PartnerAlertCleanupOutcome>;
}

export function classifyPartnerAlertCleanupOutcome(row:Row,outcome:PartnerAlertCleanupOutcome):
  Readonly<{action:"delete"|"retry"|"hold"|"uncertain";error:string|null;delayMs:number|null}> {
  if (outcome.kind==="confirmed_absent") {
    if (outcome.guildId!==row.guild_id||outcome.discordUserId!==row.discord_user_id||outcome.roleId!==row.role_id) {
      return Object.freeze({action:"uncertain",error:"target_mismatch",delayMs:null});
    }
    return Object.freeze({action:"delete",error:null,delayMs:null});
  }
  if (outcome.kind==="retry") return Object.freeze({action:"retry",error:outcome.reason,
    delayMs:partnerAlertInteger(outcome.delayMs,"cleanupRetryDelayMs",1000,86_400_000)});
  if (outcome.kind==="rejected") return Object.freeze({action:"hold",error:outcome.reason,delayMs:null});
  if (outcome.kind==="uncertain") return Object.freeze({action:"uncertain",error:"outcome_unknown",delayMs:null});
  return erasureHold();
}

/** Dormant explicit-call executor. It can only DELETE a role. Exact Discord
 * target identifiers exist solely in the outstanding cleanup row and are
 * deleted in the same local transaction that accepts confirmed absence. */
export class PartnerAlertErasureCleanupWorker {
  constructor(private readonly database:Database.Database,private readonly authority:PartnerAlertCleanupAuthority,
    private readonly transport:PartnerAlertCleanupTransport,private readonly configuration:Readonly<{
      enabled:boolean;nowUtc:()=>string;createId:()=>string;attention:(receiptRef:string,reason:string)=>void;
    }>){}
  private now(){return partnerAlertUtc(this.configuration.nowUtc(),"nowUtc");}
  private writer<T>(operation:()=>T):T {
    return this.authority.inWriter(()=>{
      if(!this.database.inTransaction)return erasureHold();
      return operation();
    });
  }
  private exact(row:Row):Row|undefined {
    return this.database.prepare(`SELECT * FROM platform_premium_external_cleanup
      WHERE receipt_ref=? AND guild_id=? AND discord_user_id=? AND role_id=?`).get(
      row.receipt_ref,row.guild_id,row.discord_user_id,row.role_id) as Row|undefined;
  }
  private current(row:Row,token:string):boolean {
    try { return this.writer(()=>{
      const now=this.now(),latest=this.exact(row);
      return Boolean(latest&&latest.state==="applying"&&latest.cleanup_lease_token===token
        &&latest.cleanup_lease_until_utc!==null&&latest.cleanup_lease_until_utc>now
        &&latest.authority_key===row.authority_key&&latest.source_ref===row.source_ref
        &&latest.fence_revision===row.fence_revision&&this.authority.isCurrent(latest));
    }); } catch { return false; }
  }
  private claim():Readonly<{row:Row;token:string}>|null {
    return this.writer(()=>{
      const at=this.now();
      const row=this.database.prepare(`SELECT * FROM platform_premium_external_cleanup
        WHERE state='pending' ORDER BY captured_at_utc,receipt_ref,guild_id,discord_user_id,role_id LIMIT 1`).get() as Row|undefined;
      if(!row||!this.authority.isCurrent(row)||(row.prior_write_token!==null&&row.quiescence_ref===null))return null;
      partnerAlertId(row.receipt_ref,"receiptRef");partnerAlertRef(row.authority_key,"authorityKey");
      partnerAlertSnowflake(row.guild_id,"guildId");partnerAlertSnowflake(row.discord_user_id,"discordUserId");
      partnerAlertSnowflake(row.role_id,"roleId");partnerAlertInteger(row.fence_revision,"fenceRevision",1);
      const token=partnerAlertId(this.configuration.createId(),"cleanupOperationId");
      const until=new Date(Date.parse(at)+60_000).toISOString();
      const changed=this.database.prepare(`UPDATE platform_premium_external_cleanup SET state='applying',
        cleanup_lease_token=?,cleanup_lease_until_utc=?,last_error_code=NULL WHERE receipt_ref=? AND guild_id=?
        AND discord_user_id=? AND role_id=? AND state='pending'`).run(token,until,row.receipt_ref,row.guild_id,
        row.discord_user_id,row.role_id).changes;
      return changed===1?Object.freeze({row,token}):null;
    });
  }
  async runOnce():Promise<boolean>{
    if(this.configuration.enabled!==true)return false;
    const claim=this.claim();if(!claim)return false;
    let outcome:PartnerAlertCleanupOutcome;
    try { outcome=await this.transport.removeRole({guildId:claim.row.guild_id,discordUserId:claim.row.discord_user_id,
      roleId:claim.row.role_id,operationId:claim.token,stillCurrent:()=>this.current(claim.row,claim.token)}); }
    catch { outcome={kind:"uncertain"}; }
    let attention:string|null=null;
    this.writer(()=>{
      const latest=this.exact(claim.row);
      if(!latest||latest.state!=="applying"||latest.cleanup_lease_token!==claim.token)return;
      const result=classifyPartnerAlertCleanupOutcome(latest,outcome);
      if(result.action==="delete") {
        if(!this.authority.isCurrent(latest))return erasureHold();
        const removed=this.database.prepare(`DELETE FROM platform_premium_external_cleanup WHERE receipt_ref=?
          AND guild_id=? AND discord_user_id=? AND role_id=? AND state='applying' AND cleanup_lease_token=?`).run(
          latest.receipt_ref,latest.guild_id,latest.discord_user_id,latest.role_id,claim.token).changes;
        if(removed!==1)return erasureHold();
        return;
      }
      const state=result.action==="retry"?"pending":result.action==="hold"?"held":"uncertain";
      const changed=this.database.prepare(`UPDATE platform_premium_external_cleanup SET state=?,last_error_code=?,
        cleanup_lease_token=CASE WHEN ?='uncertain' THEN cleanup_lease_token ELSE NULL END,
        cleanup_lease_until_utc=CASE WHEN ?='uncertain' THEN cleanup_lease_until_utc ELSE NULL END
        WHERE receipt_ref=? AND guild_id=? AND discord_user_id=? AND role_id=? AND cleanup_lease_token=?`).run(
        state,result.error,state,state,latest.receipt_ref,latest.guild_id,latest.discord_user_id,latest.role_id,claim.token).changes;
      if(changed!==1)return erasureHold();
      attention=result.error;
    });
    if(attention)try{this.configuration.attention(claim.row.receipt_ref,attention);}catch{}
    return true;
  }
}
