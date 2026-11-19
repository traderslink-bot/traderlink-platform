import {createHmac,createHash} from "node:crypto";
import type Database from "better-sqlite3";
import {partnerAlertId,partnerAlertRef,partnerAlertUtc} from "../contracts/partner-alert-validation";
import {PARTNER_ALERT_REMOVED_CREDENTIAL_JSON,partnerAlertRecordRetainUntil} from "./partner-alert-retention-policy";
import {erasureHold} from "../../platform/server/privacy/platform-erasure-admission";
import {partnerAlertProviderInboxSourceRecord} from "./partner-alert-retained-evidence";

import { readPartnerDeliveryTextBinding } from "./partner-alert-erasure-delivery-text-binding";

type Key=Readonly<{keyRef:string;key:Uint8Array}>;
type Claim=Readonly<{participant:string;claim_ref:string;original_json:string;original_sha256:string;
  state:"captured"|"in_flight"|"settled"|"purged"}>;
type SuccessorKind="role_cleanup"|"commercial_evidence"|"operational_evidence"|"owner_disposition"|"delivery_settlement"|"restore_tombstone"|"private_disposition"|"transport_quiescence";
const sha=(value:string)=>createHash("sha256").update(value).digest("hex");
function qualifiedKey(value:Key):Key {
  const keyRef=partnerAlertRef(value.keyRef,"claimSuccessorKeyRef");
  if(!(value.key instanceof Uint8Array)||value.key.byteLength<32||value.key.byteLength>128)return erasureHold();
  return Object.freeze({keyRef,key:value.key});
}
const hmac=(key:Uint8Array,domain:string,value:string)=>createHmac("sha256",key).update(`${domain}\u0000${value}`).digest("hex");

/** Append-only successor accounting. Role-cleanup recording performs its own
 * exact join; other successor kinds need equally specific producer methods
 * before finalization can bind. */
export class PartnerAlertErasureClaimSuccessors {
  private readonly binding:Key;
  constructor(private readonly database:Database.Database,key:Key){this.binding=qualifiedKey(key);}
  private claim(operationRef:string,participant:string,claimRef:string):Claim {
    const row=this.database.prepare(`SELECT participant,claim_ref,original_json,original_sha256,state
      FROM platform_erasure_operation_claims WHERE operation_ref=? AND participant=? AND claim_ref=?`).get(
      partnerAlertId(operationRef,"operationRef"),partnerAlertRef(participant,"participant"),claimRef) as Claim|undefined;
    if(!row||row.state==="in_flight"||row.state==="purged")return erasureHold();
    readPartnerDeliveryTextBinding(this.database,this.binding,operationRef,row);
    return row;
  }
  private originalBinding(operationRef:string,claim:Claim):string {
    return readPartnerDeliveryTextBinding(this.database,this.binding,operationRef,claim)?.originalBinding
      ?? hmac(this.binding.key,"original",claim.original_json);
  }
  private retain(operationRef:string,claim:Claim,kind:SuccessorKind,successorRef:string,verifiedAtUtc:string):void {
    const at=partnerAlertUtc(verifiedAtUtc,"successorVerifiedAtUtc"),claimBinding=hmac(this.binding.key,"claim",claim.claim_ref),
      originalBinding=this.originalBinding(operationRef,claim),successor=partnerAlertRef(successorRef,"successorRef");
    const until=partnerAlertRecordRetainUntil("pseudonymized_audit_or_idempotency",at);
    this.database.prepare(`INSERT OR IGNORE INTO partner_alert_erasure_claim_successors
      (operation_ref,participant,claim_binding_hmac_sha256,original_binding_hmac_sha256,binding_key_ref,
       successor_kind,successor_ref,verified_at_utc,retain_until_utc) VALUES(?,?,?,?,?,?,?,?,?)`).run(
      operationRef,claim.participant,claimBinding,originalBinding,this.binding.keyRef,kind,successor,at,until);
    const stored=this.database.prepare(`SELECT original_binding_hmac_sha256,binding_key_ref,successor_kind,
      successor_ref,verified_at_utc,retain_until_utc FROM partner_alert_erasure_claim_successors
      WHERE operation_ref=? AND participant=? AND claim_binding_hmac_sha256=?`).get(operationRef,claim.participant,
      claimBinding) as Record<string,unknown>|undefined;
    if(!stored||stored.original_binding_hmac_sha256!==originalBinding||stored.binding_key_ref!==this.binding.keyRef
      ||stored.successor_kind!==kind||stored.successor_ref!==successor
      ||typeof stored.verified_at_utc!=="string"||typeof stored.retain_until_utc!=="string"
      ||partnerAlertUtc(stored.verified_at_utc,"storedSuccessorVerifiedAtUtc")>at
      ||stored.retain_until_utc!==partnerAlertRecordRetainUntil("pseudonymized_audit_or_idempotency",
        stored.verified_at_utc))return erasureHold();
  }
  /** Disposable dispatcher integration: exact raw hashes must come from the
   * verified same-transaction readback; no coverage exception. */
  retainVerifiedStripeSettlements(operationRef:string, verified:ReadonlyMap<string,string>, receiptRef:string, at:string, participant:"stripe_role_settlement"|"stripe_role_transport"="stripe_role_settlement"):void {
    if (!this.database.inTransaction || verified.size > 10000) return erasureHold();
    const phase=this.database.prepare("SELECT phase FROM platform_erasure_module_operations WHERE operation_ref=?").pluck().get(operationRef);
    if (phase!=="ready") return erasureHold();
    const refs=this.database.prepare(`SELECT claim_ref FROM platform_erasure_operation_claims
      WHERE operation_ref=? AND participant=? ORDER BY claim_ref LIMIT 10001`).pluck().all(operationRef,participant) as string[];
    if (refs.length!==verified.size) return erasureHold();
    const claims=refs.map(ref=>{
      const claim=this.claim(operationRef,participant,ref);
      if (claim.state!=="settled" || verified.get(ref)!==claim.original_sha256) return erasureHold();
      return claim;
    });
    for (const claim of claims) this.retain(operationRef,claim,"transport_quiescence",receiptRef,at);
  }
  recordRoleCleanup(input:Readonly<{operationRef:string;participant:"partner_role"|"premium_role";
    claimRef:string;verifiedAtUtc:string}>):void {
    if(!this.database.inTransaction)return erasureHold();
    const claim=this.claim(input.operationRef,input.participant,input.claimRef);
    const source=JSON.parse(claim.original_json) as Record<string,unknown>;
    const sourceRef=input.participant==="partner_role"?source.mapping_id:source.authority_key;
    const guild=input.participant==="partner_role"?source.destination_guild_id:source.guild_id;
    const discord=source.discord_user_id,role=input.participant==="partner_role"?source.destination_role_id:source.role_id;
    if(typeof sourceRef!=="string"||typeof guild!=="string"||typeof discord!=="string"||typeof role!=="string")return erasureHold();
    const cleanup=this.database.prepare(`SELECT state FROM platform_premium_external_cleanup WHERE receipt_ref=?
      AND source_ref=? AND guild_id=? AND discord_user_id=? AND role_id=?`).get(input.operationRef,sourceRef,guild,
      discord,role) as {state:string}|undefined;
    if(!cleanup||!["pending","blocked_in_flight","applying","uncertain","confirmed","held"].includes(cleanup.state))return erasureHold();
    this.retain(input.operationRef,claim,"role_cleanup",`${input.participant}:${sourceRef}`,input.verifiedAtUtc);
  }
  recordRetainedOperationEvidence(input:Readonly<{operationRef:string;
    participant:"partner_audit"|"partner_command";claimRef:string;verifiedAtUtc:string}>):void {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(input.operationRef,"operationRef"),claim=this.claim(operation,input.participant,input.claimRef);
    const source=JSON.parse(claim.original_json) as Record<string,unknown>;
    const sourceRef=input.participant==="partner_audit"?source.audit_event_id:source.request_id;
    const expectedKind=input.participant==="partner_audit"?"audit":"idempotency";
    if(typeof sourceRef!=="string")return erasureHold();
    const lifecycle=this.database.prepare("SELECT lifecycle_ref FROM platform_erasure_module_operations WHERE operation_ref=?")
      .get(operation) as {lifecycle_ref:string}|undefined;
    if(!lifecycle)return erasureHold();
    const sourceBinding=hmac(this.binding.key,"source",partnerAlertId(sourceRef,"sourceRecordRef"));
    const evidence=this.database.prepare(`SELECT evidence_ref,binding_key_ref FROM partner_alert_retained_operation_evidence
      WHERE lifecycle_ref=? AND record_kind=? AND source_record_hmac_sha256=?`).get(lifecycle.lifecycle_ref,expectedKind,
      sourceBinding) as {evidence_ref:string;binding_key_ref:string}|undefined;
    if(!evidence||evidence.binding_key_ref!==this.binding.keyRef)return erasureHold();
    this.retain(operation,claim,"operational_evidence",partnerAlertId(evidence.evidence_ref,"evidenceRef"),input.verifiedAtUtc);
  }
  recordRetainedAgreementEvidence(input:Readonly<{operationRef:string;participant:"partner_agreement";
    claimRef:string;verifiedAtUtc:string}>):void {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(input.operationRef,"operationRef"),claim=this.claim(operation,input.participant,input.claimRef);
    const source=JSON.parse(claim.original_json) as Record<string,unknown>;
    if(typeof source.agreement_id!=="string")return erasureHold();
    const lifecycle=this.database.prepare("SELECT lifecycle_ref FROM platform_erasure_module_operations WHERE operation_ref=?")
      .get(operation) as {lifecycle_ref:string}|undefined;
    if(!lifecycle)return erasureHold();
    const sourceBinding=hmac(this.binding.key,"source",partnerAlertId(source.agreement_id,"agreementId"));
    const evidence=this.database.prepare(`SELECT evidence_ref,binding_key_ref,successor_ref
      FROM partner_alert_retained_commercial_evidence WHERE lifecycle_ref=? AND record_kind='agreement'
      AND source_record_hmac_sha256=?`).get(lifecycle.lifecycle_ref,sourceBinding) as
      {evidence_ref:string;binding_key_ref:string;successor_ref:string}|undefined;
    if(!evidence||evidence.binding_key_ref!==this.binding.keyRef)return erasureHold();
    partnerAlertRef(evidence.successor_ref,"commercialSuccessorRef");
    this.retain(operation,claim,"commercial_evidence",partnerAlertId(evidence.evidence_ref,"evidenceRef"),input.verifiedAtUtc);
  }
  recordProviderInboxDisposition(input:Readonly<{operationRef:string;participant:"partner_inbox";
    claimRef:string;verifiedAtUtc:string}>):void {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(input.operationRef,"operationRef"),claim=this.claim(operation,input.participant,input.claimRef);
    const source=JSON.parse(claim.original_json) as Record<string,unknown>;
    if(!["pending","failed","completed"].includes(String(source.status))||source.lease_token!==null
      ||source.lease_until_utc!==null||source.admission_fence_json!==null)return erasureHold();
    if(source.status!=="completed"){
      const phase=this.database.prepare("SELECT phase FROM platform_erasure_module_operations WHERE operation_ref=?")
        .get(operation) as {phase:string}|undefined;
      if(phase?.phase!=="logical_deleted"||this.database.prepare(`SELECT 1 FROM partner_alert_whop_inbox
        WHERE community_id=? AND environment=? AND whop_account_id=? AND event_id=? LIMIT 1`).get(source.community_id,
        source.environment,source.whop_account_id,source.event_id))return erasureHold();
      return this.retain(operation,claim,"private_disposition",
        `discarded_unapplied:${hmac(this.binding.key,"provider_inbox",claim.original_json).slice(0,64)}`,input.verifiedAtUtc);
    }
    const sourceRecord=partnerAlertProviderInboxSourceRecord({environment:source.environment as "sandbox"|"live",
      whopAccountId:String(source.whop_account_id),eventId:String(source.event_id),eventType:String(source.event_type),
      resourceKind:source.resource_kind as "membership"|"payment"|"account",resourceId:String(source.resource_id),
      payloadSha256:String(source.payload_sha256),occurredAtUtc:String(source.occurred_at_utc),
      receivedAtUtc:String(source.received_at_utc)});
    const sourceBinding=hmac(this.binding.key,"source",sourceRecord);
    const evidence=this.database.prepare(`SELECT evidence_ref,binding_key_ref FROM partner_alert_retained_operation_evidence
      WHERE record_kind='idempotency' AND action_code='partner.provider_event_applied'
        AND source_record_hmac_sha256=? AND binding_key_ref=? LIMIT 2`).all(sourceBinding,this.binding.keyRef) as
      {evidence_ref:string;binding_key_ref:string}[];
    if(evidence.length!==1||evidence[0]!.binding_key_ref!==this.binding.keyRef)return erasureHold();
    this.retain(operation,claim,"operational_evidence",partnerAlertId(evidence[0]!.evidence_ref,"evidenceRef"),input.verifiedAtUtc);
  }
  recordOwnerDisposition(input:Readonly<{operationRef:string;participant:"partner_owner";
    claimRef:string;erasurePrincipalId:string;verifiedAtUtc:string}>):void {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(input.operationRef,"operationRef"),claim=this.claim(operation,input.participant,input.claimRef);
    const source=JSON.parse(claim.original_json) as Record<string,unknown>;
    if(typeof source.community_id!=="string"||typeof source.owner_user_id!=="string")return erasureHold();
    const partner=this.database.prepare(`SELECT owner_user_id,approved_by_user_id,status,source_guild_id
      FROM partner_alert_partners WHERE community_id=?`).get(source.community_id) as
      {owner_user_id:string;approved_by_user_id:string|null;status:string;source_guild_id:string}|undefined;
    if(!partner||partner.owner_user_id!==partnerAlertId(input.erasurePrincipalId,"erasurePrincipalId")
      ||partner.approved_by_user_id===source.owner_user_id||partner.status!=="publishing_paused"
      ||partner.source_guild_id!==source.source_guild_id)return erasureHold();
    if(this.database.prepare(`SELECT 1 FROM partner_alert_whop_connections WHERE community_id=?
      AND (status!='disconnected' OR encrypted_authorisation_json!=?) LIMIT 1`).get(source.community_id,
      PARTNER_ALERT_REMOVED_CREDENTIAL_JSON))return erasureHold();
    this.retain(operation,claim,"owner_disposition",`paused:${partnerAlertId(String(source.community_id),"communityId")}`,
      input.verifiedAtUtc);
  }
  recordPrivateDisposition(input:Readonly<{operationRef:string;participant:"partner_refresh"|"premium_event";
    claimRef:string;verifiedAtUtc:string}>):void {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(input.operationRef,"operationRef");
    const phase=this.database.prepare("SELECT phase FROM platform_erasure_module_operations WHERE operation_ref=?")
      .get(operation) as {phase:string}|undefined;
    if(!phase||phase.phase!=="logical_deleted")return erasureHold();
    const claim=this.claim(operation,input.participant,input.claimRef);
    const row=JSON.parse(claim.original_json) as Record<string,unknown>;
    let stillPresent:unknown;
    if(input.participant==="partner_refresh") {
      stillPresent=this.database.prepare(`SELECT 1 FROM partner_alert_premium_refresh_events WHERE authority_key=?
        AND authority_revision=? AND user_id=? AND observed_at_utc=? AND reason=? LIMIT 1`).get(row.authority_key,
        row.authority_revision,row.user_id,row.observed_at_utc,row.reason);
    } else {
      stillPresent=this.database.prepare(`SELECT 1 FROM platform_premium_paid_events WHERE guild_id=? AND paid_role_id=?
        AND authority_key=? AND authority_revision=? AND observed_at_utc=? AND event_json=? LIMIT 1`).get(row.guild_id,
        row.paid_role_id,row.authority_key,row.authority_revision,row.observed_at_utc,row.event_json);
    }
    if(stillPresent)return erasureHold();
    const successor=`disposed:${hmac(this.binding.key,"disposed",claim.original_json).slice(0,64)}`;
    this.retain(operation,claim,"private_disposition",successor,input.verifiedAtUtc);
  }
  recordDeliverySettlement(input:Readonly<{operationRef:string;participant:"partner_delivery";
    claimRef:string;verifiedAtUtc:string}>):void {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(input.operationRef,"operationRef"),claim=this.claim(operation,input.participant,input.claimRef);
    const original=JSON.parse(claim.original_json) as Record<string,unknown>;
    const delivery=this.database.prepare(`SELECT delivery_id,community_id,mapping_id,source_channel_id,message_id,
      source_revision,part_index,action,status,lease_token,text_content FROM partner_alert_deliveries WHERE delivery_id=?`)
      .get(original.delivery_id) as Record<string,unknown>|undefined;
    if(!delivery||!["delivered","failed","cancelled"].includes(String(delivery.status)))return erasureHold();
    for(const key of ["delivery_id","community_id","mapping_id","source_channel_id","message_id","source_revision",
      "part_index","action"] as const)if(delivery[key]!==original[key])return erasureHold();
    if(delivery.lease_token!==null)return erasureHold();
    const source=this.database.prepare(`SELECT retain_until_utc,text_content FROM partner_alert_source_messages
      WHERE community_id=? AND source_channel_id=? AND message_id=?`).get(delivery.community_id,
      delivery.source_channel_id,delivery.message_id) as {retain_until_utc:string|null;text_content:string|null}|undefined;
    if(!source||source.text_content!==null&&(!source.retain_until_utc
      ||partnerAlertUtc(source.retain_until_utc,"sourceRetainUntilUtc")<=partnerAlertUtc(input.verifiedAtUtc,"verifiedAtUtc")))return erasureHold();
    this.retain(operation,claim,"delivery_settlement",partnerAlertId(String(delivery.delivery_id),"deliveryId"),input.verifiedAtUtc);
  }
  recordRoleTransportQuiescence(input:Readonly<{operationRef:string;
    participant:"partner_role_outcome"|"premium_role_outcome";claimRef:string;verifiedAtUtc:string}>):void {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(input.operationRef,"operationRef"),outcome=this.claim(operation,input.participant,input.claimRef);
    const parentParticipant=input.participant==="partner_role_outcome"?"partner_role":"premium_role";
    const parent=this.database.prepare(`SELECT participant,claim_ref,original_json,original_sha256,state FROM
      platform_erasure_operation_claims WHERE operation_ref=? AND participant=? AND outcome_ref=?`).get(operation,
      parentParticipant,input.claimRef) as Claim|undefined;
    if(!parent||parent.state!=="settled"||sha(parent.original_json)!==parent.original_sha256)return erasureHold();
    const source=JSON.parse(parent.original_json) as Record<string,unknown>;
    const receipt=JSON.parse(outcome.original_json) as Record<string,unknown>;
    const token=input.participant==="partner_role_outcome"?receipt.operationId:
      receipt.claim&&typeof receipt.claim==="object"?(receipt.claim as Record<string,unknown>).token:null;
    const sourceRef=parentParticipant==="partner_role"?source.mapping_id:source.authority_key;
    const guild=parentParticipant==="partner_role"?source.destination_guild_id:source.guild_id;
    const discord=source.discord_user_id,role=parentParticipant==="partner_role"?source.destination_role_id:source.role_id;
    if(typeof token!=="string"||typeof sourceRef!=="string"||typeof guild!=="string"
      ||typeof discord!=="string"||typeof role!=="string")return erasureHold();
    const cleanup=this.database.prepare(`SELECT prior_write_token,quiescence_ref FROM platform_premium_external_cleanup
      WHERE receipt_ref=? AND source_ref=? AND guild_id=? AND discord_user_id=? AND role_id=?`).get(operation,sourceRef,
      guild,discord,role) as {prior_write_token:string|null;quiescence_ref:string|null}|undefined;
    if(!cleanup||cleanup.prior_write_token!==token||cleanup.quiescence_ref===null)return erasureHold();
    this.retain(operation,outcome,"transport_quiescence",partnerAlertRef(cleanup.quiescence_ref,"quiescenceRef"),
      input.verifiedAtUtc);
  }
  recordDeliveryTransportQuiescence(input:Readonly<{operationRef:string;participant:"partner_delivery_outcome";
    claimRef:string;verifiedAtUtc:string}>):void {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(input.operationRef,"operationRef"),outcome=this.claim(operation,input.participant,input.claimRef);
    const parent=this.database.prepare(`SELECT participant,claim_ref,original_json,original_sha256,state FROM
      platform_erasure_operation_claims WHERE operation_ref=? AND participant='partner_delivery' AND outcome_ref=?`)
      .get(operation,input.claimRef) as Claim|undefined;
    if(!parent||parent.state!=="settled")return erasureHold();
    readPartnerDeliveryTextBinding(this.database,this.binding,operation,parent);
    const original=JSON.parse(parent.original_json) as Record<string,unknown>;
    const receipt=JSON.parse(outcome.original_json) as Record<string,unknown>,result=receipt.result as Record<string,unknown>|undefined;
    if(typeof receipt.operationId!=="string"||receipt.operationId!==original.lease_token||!result
      ||result.kind==="uncertain")return erasureHold();
    const delivery=this.database.prepare(`SELECT status,lease_token,outcome_json FROM partner_alert_deliveries
      WHERE delivery_id=?`).get(original.delivery_id) as {status:string;lease_token:string|null;outcome_json:string|null}|undefined;
    const expected=result.kind==="confirmed"?"delivered":result.kind==="not_written"?"cancelled":"failed";
    if(!delivery||delivery.status!==expected||delivery.lease_token!==null||delivery.outcome_json!==outcome.original_json)return erasureHold();
    this.retain(operation,outcome,"transport_quiescence",partnerAlertRef(input.claimRef,"deliveryOutcomeRef"),
      input.verifiedAtUtc);
  }
  recordRestoreTombstone(input:Readonly<{operationRef:string;participant:"partner_tombstone";
    claimRef:"restore_tombstone";verifiedAtUtc:string}>):void {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(input.operationRef,"operationRef"),claim=this.claim(operation,input.participant,input.claimRef);
    const tombstone=JSON.parse(claim.original_json) as Record<string,unknown>;
    const stored=this.database.prepare(`SELECT tombstone_ref,subject_binding_hmac_sha256,binding_key_ref,retain_until_utc
      FROM partner_alert_erasure_tombstones WHERE source_operation_ref=?`).get(operation) as Record<string,unknown>|undefined;
    if(!stored||stored.tombstone_ref!==tombstone.tombstoneRef
      ||stored.subject_binding_hmac_sha256!==tombstone.subjectBindingHmacSha256
      ||stored.binding_key_ref!==this.binding.keyRef||stored.retain_until_utc!==tombstone.retainUntilUtc)return erasureHold();
    this.retain(operation,claim,"restore_tombstone",partnerAlertId(String(stored.tombstone_ref),"tombstoneRef"),input.verifiedAtUtc);
  }
  coverage(operationRef:string):Readonly<{complete:boolean;claimCount:number;successorCount:number}> {
    const operation=partnerAlertId(operationRef,"operationRef");
    const claims=this.database.prepare(`SELECT participant,claim_ref,original_json,original_sha256,state
      FROM platform_erasure_operation_claims WHERE operation_ref=? ORDER BY participant,claim_ref LIMIT 10001`).all(operation) as Claim[];
    if(claims.length>10_000||claims.some(row=>row.state==="in_flight"||row.state==="purged"))return erasureHold();
    let covered=0;
    for(const claim of claims){
      const found=this.database.prepare(`SELECT 1 FROM partner_alert_erasure_claim_successors WHERE operation_ref=?
        AND participant=? AND claim_binding_hmac_sha256=? AND original_binding_hmac_sha256=? AND binding_key_ref=?`).get(
        operation,claim.participant,hmac(this.binding.key,"claim",claim.claim_ref),
        this.originalBinding(operation,claim),this.binding.keyRef);
      if(found)covered+=1;
    }
    return Object.freeze({complete:covered===claims.length,claimCount:claims.length,successorCount:covered});
  }
  participantCoverage(operationRef:string,participants:readonly string[]):Readonly<{
    complete:boolean;claimCount:number;successorCount:number}> {
    if(!participants.length||participants.length>20||new Set(participants).size!==participants.length)return erasureHold();
    const operation=partnerAlertId(operationRef,"operationRef"),allowed=new Set(participants.map(value=>partnerAlertRef(value,"participant")));
    const claims=this.database.prepare(`SELECT participant,claim_ref,original_json,original_sha256,state
      FROM platform_erasure_operation_claims WHERE operation_ref=? ORDER BY participant,claim_ref LIMIT 10001`)
      .all(operation) as Claim[];
    const selected=claims.filter(claim=>allowed.has(claim.participant));
    if(claims.length>10_000||selected.some(row=>row.state==="in_flight"||row.state==="purged"))return erasureHold();
    let covered=0;
    for(const claim of selected)if(this.database.prepare(`SELECT 1 FROM partner_alert_erasure_claim_successors
      WHERE operation_ref=? AND participant=? AND claim_binding_hmac_sha256=? AND original_binding_hmac_sha256=?
        AND binding_key_ref=?`).get(operation,claim.participant,hmac(this.binding.key,"claim",claim.claim_ref),
      this.originalBinding(operation,claim),this.binding.keyRef))covered+=1;
    return Object.freeze({complete:covered===selected.length,claimCount:selected.length,successorCount:covered});
  }
  purgeCovered(operationRef:string):number {
    if(!this.database.inTransaction)return erasureHold();
    const operation=partnerAlertId(operationRef,"operationRef");
    const phase=this.database.prepare("SELECT phase FROM platform_erasure_module_operations WHERE operation_ref=?")
      .get(operation) as {phase:string}|undefined;
    if(phase?.phase!=="logical_deleted")return erasureHold();
    const coverage=this.coverage(operation);
    if(!coverage.complete)return erasureHold();
    const removed=this.database.prepare("DELETE FROM platform_erasure_operation_claims WHERE operation_ref=?")
      .run(operation).changes;
    if(removed!==coverage.claimCount
      ||this.database.prepare("SELECT 1 FROM platform_erasure_operation_claims WHERE operation_ref=? LIMIT 1").get(operation)) {
      return erasureHold();
    }
    return removed;
  }
}
