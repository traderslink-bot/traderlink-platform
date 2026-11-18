import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { erasureHold } from "../../platform/server/privacy/platform-erasure-admission";
import { partnerAlertId,partnerAlertUtc } from "../contracts/partner-alert-validation";
import { parsePartnerAlertOffer } from "../contracts/partner-alert-validation";
import type { PartnerAlertWhopInboxClaim } from "./partner-alert-whop-inbox";
import type { PartnerAlertWhopPreparation } from "./partner-alert-whop-reconciliation";
import { projectPartnerAlertProviderEvidence,projectPartnerAlertProviderInboxEvidence,
  type PartnerAlertRetainedOperationEvidence,type PartnerAlertRetainedProviderEvidence } from "./partner-alert-retained-evidence";
import { PartnerAlertRetainedEvidenceRepository } from "./partner-alert-retained-evidence-repository";
import type { PartnerAlertErasureRuntime } from "./partner-alert-erasure-runtime";

type EvidenceWriter=Readonly<{
  retainOperation:(row:PartnerAlertRetainedOperationEvidence)=>void;
  retainProvider:(row:PartnerAlertRetainedProviderEvidence)=>void;
}>;
type InboxRow=Readonly<{environment:"sandbox"|"live";whop_account_id:string;event_id:string;event_type:string;
  resource_kind:"membership"|"payment"|"account";resource_id:string;payload_sha256:string;
  occurred_at_utc:string;received_at_utc:string;lease_until_utc:string}>;
export type PartnerAlertWhopApplicationAuthority=Readonly<{recheckCurrent:(database:Database.Database,input:Readonly<{
  claim:PartnerAlertWhopInboxClaim;preparation:PartnerAlertWhopPreparation}>)=>Readonly<{kind:"admitted";
    admissionRef:string;userId:string;verifiedWhopUserRef:string;communityId:string;environment:"sandbox"|"live";
    accountId:string;offerId:string;offerVersion:number;productId:string;planId:string;currencyCode:string;
    generations:Readonly<{identity:number;connection:number;erasure:number}>;validUntilUtc:string}>
    |Readonly<{kind:"unbound"}>}>;

function canonical(value:unknown):string{
  if(Array.isArray(value))return `[${value.map(canonical).join(",")}]`;
  if(value!==null&&typeof value==="object")return `{${Object.keys(value).sort().map(key=>
    `${JSON.stringify(key)}:${canonical((value as Record<string,unknown>)[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

/** Writes the reviewed minimal commercial projection and exact inbox disposition
 * inside the inbox lease transaction. The preparation intentionally remains
 * current_runtime_unbound/canApply=false: only the separate current-authority
 * producer can admit it. This helper performs no provider I/O and grants no
 * membership or role. The caller must still apply membership facts in the same
 * PartnerAlertWhopInbox.completeWith callback. */
export class PartnerAlertWhopCommercialApply {
  private readonly evidence:EvidenceWriter;
  constructor(private readonly database:Database.Database,private readonly runtime:PartnerAlertErasureRuntime,
    private readonly authority:PartnerAlertWhopApplicationAuthority,
    evidence?:EvidenceWriter){this.evidence=evidence??new PartnerAlertRetainedEvidenceRepository(database);}

  retain(claim:PartnerAlertWhopInboxClaim,preparation:PartnerAlertWhopPreparation):void{
    if(!this.database.inTransaction||preparation.status!=="prepared"||preparation.canApply!==false
      ||preparation.provenance!=="current_runtime_unbound"||preparation.discoveryComplete!==true
      ||preparation.issues.length!==0||!preparation.context)return erasureHold();
    const context=preparation.context;
    if(context.communityId!==claim.event.communityId||context.environment!==claim.event.environment
      ||context.accountId!==claim.event.accountId)return erasureHold();
    const now=partnerAlertUtc(this.runtime.nowUtc(),"nowUtc");
    const authority=this.authority.recheckCurrent(this.database,{claim,preparation});
    if(authority.kind!=="admitted"||partnerAlertUtc(authority.validUntilUtc,"authorityValidUntilUtc")<=now
      ||authority.userId!==context.userId||authority.verifiedWhopUserRef!==context.verifiedWhopUserRef
      ||authority.communityId!==context.communityId||authority.environment!==context.environment
      ||authority.accountId!==context.accountId||authority.offerId!==context.offerId
      ||authority.offerVersion!==context.offerVersion||authority.productId!==context.productId
      ||authority.planId!==context.planId||authority.currencyCode!==context.currencyCode
      ||JSON.stringify(authority.generations)!==JSON.stringify(context.claimedGenerations))return erasureHold();
    partnerAlertId(authority.admissionRef,"applicationAdmissionRef");
    const row=this.database.prepare(`SELECT environment,whop_account_id,event_id,event_type,resource_kind,resource_id,
      payload_sha256,occurred_at_utc,received_at_utc,lease_until_utc FROM partner_alert_whop_inbox
      WHERE community_id=? AND environment=? AND whop_account_id=? AND event_id=? AND status='processing'
        AND lease_token=? AND payload_sha256=? AND resource_kind=? AND resource_id=?`).get(claim.event.communityId,
      claim.event.environment,claim.event.accountId,claim.event.eventId,claim.leaseToken,claim.event.payloadSha256,
      claim.event.resourceKind,claim.event.resourceId) as InboxRow|undefined;
    if(!row)return erasureHold();
    if(row.environment!==claim.event.environment||row.whop_account_id!==claim.event.accountId
      ||row.event_id!==claim.event.eventId||row.event_type!==claim.event.eventType
      ||row.resource_kind!==claim.event.resourceKind||row.resource_id!==claim.event.resourceId
      ||row.payload_sha256!==claim.event.payloadSha256||row.occurred_at_utc!==claim.event.occurredAtUtc)return erasureHold();
    if(partnerAlertUtc(row.lease_until_utc,"leaseUntilUtc")<=now)return erasureHold();
    const scope=this.database.prepare(`SELECT l.lifecycle_ref,o.offer_json FROM platform_erasure_lifecycles l
      JOIN partner_alert_offers o ON o.community_id=? AND o.offer_id=? AND o.version=?
      WHERE l.user_id=? AND l.phase='live' AND o.review_state='approved' AND o.whop_environment=?
        AND o.whop_account_id=?`).get(context.communityId,context.offerId,context.offerVersion,context.userId,
      context.environment,context.accountId) as {lifecycle_ref:string;offer_json:string}|undefined;
    if(!scope)return erasureHold();
    const offer=parsePartnerAlertOffer(JSON.parse(scope.offer_json));
    if(offer.communityId!==context.communityId||offer.offerId!==context.offerId||offer.version!==context.offerVersion
      ||offer.currency.code!==context.currencyCode||offer.whop.environment!==context.environment
      ||offer.whop.accountId!==context.accountId||offer.whop.productId!==context.productId
      ||offer.whop.planId!==context.planId)return erasureHold();
    const lifecycleRef=partnerAlertId(scope.lifecycle_ref,"lifecycleRef");
    if(preparation.members.length===0||preparation.discoveredMembershipCount!==preparation.members.length)return erasureHold();
    const membershipIds=new Set<string>(),paymentIds=new Set<string>();
    const facts=preparation.members.flatMap(member=>{
      if(member.kind!=="prepared"||membershipIds.has(member.membershipId))return erasureHold();
      membershipIds.add(member.membershipId);const memberPaymentIds=new Set<string>();
      const evidence=member.evidence;
      if(evidence.membershipId!==member.membershipId||evidence.userId!==context.userId
        ||evidence.whopUserRef!==context.verifiedWhopUserRef||evidence.communityId!==context.communityId
        ||evidence.offerId!==context.offerId||evidence.offerVersion!==context.offerVersion
        ||evidence.whop.environment!==context.environment||evidence.whop.accountId!==context.accountId
        ||evidence.whop.productId!==context.productId||evidence.whop.planId!==context.planId
        ||partnerAlertUtc(evidence.validUntilUtc,"membershipValidUntilUtc")<=now)return erasureHold();
      for(const fact of member.paymentFacts){
        if(fact.membershipId!==member.membershipId||fact.environment!==context.environment
          ||fact.accountId!==context.accountId||fact.productId!==context.productId||fact.planId!==context.planId
          ||fact.whopUserRef!==context.verifiedWhopUserRef||paymentIds.has(fact.paymentId))return erasureHold();
        paymentIds.add(fact.paymentId);memberPaymentIds.add(fact.paymentId);
      }
      if(new Set(member.paymentIds).size!==member.paymentIds.length
        ||member.paymentIds.some(id=>!memberPaymentIds.has(id))
        ||(evidence.basis==="paid")!==(member.paymentIds.length===1))return erasureHold();
      return member.paymentFacts;
    });
    if((claim.event.resourceKind==="payment"&&!paymentIds.has(claim.event.resourceId))
      ||(claim.event.resourceKind==="membership"&&!membershipIds.has(claim.event.resourceId))
      ||(claim.event.resourceKind==="account"&&claim.event.resourceId!==context.accountId))return erasureHold();
    const factsSha256=createHash("sha256").update(canonical(facts),"utf8").digest("hex");
    const common={lifecycleRef,communityId:context.communityId,binding:this.runtime.binding,createId:this.runtime.createId};
    for(const fact of facts){
      const archivedAtUtc=[partnerAlertUtc(row.received_at_utc,"receivedAtUtc"),
        partnerAlertUtc(fact.observedAtUtc,"providerObservedAtUtc")].sort().at(-1)!;
      const kinds:("payment"|"refund"|"dispute")[]=[];
      if(fact.state==="paid")kinds.push("payment");
      if(["partial","full"].includes(fact.refundState))kinds.push("refund");
      if(fact.disputeState==="observed")kinds.push("dispute");
      for(const recordKind of kinds)this.evidence.retainProvider(projectPartnerAlertProviderEvidence({...common,
        archivedAtUtc,recordKind,currencyCode:context.currencyCode,fact}));
    }
    this.evidence.retainOperation(projectPartnerAlertProviderInboxEvidence({...common,
      archivedAtUtc:partnerAlertUtc(row.received_at_utc,"receivedAtUtc"),appliedFactsSha256:factsSha256,row:{
        environment:row.environment,whopAccountId:row.whop_account_id,eventId:row.event_id,eventType:row.event_type,
        resourceKind:row.resource_kind,resourceId:row.resource_id,payloadSha256:row.payload_sha256,
        occurredAtUtc:row.occurred_at_utc,receivedAtUtc:row.received_at_utc}}));
  }
}
