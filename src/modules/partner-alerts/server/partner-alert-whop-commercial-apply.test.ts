// @vitest-environment node
import { describe,expect,it } from "vitest";
import type Database from "better-sqlite3";
import type { PartnerAlertWhopPreparation } from "./partner-alert-whop-reconciliation";
import type { PartnerAlertWhopInboxClaim } from "./partner-alert-whop-inbox";
import { PartnerAlertWhopCommercialApply } from "./partner-alert-whop-commercial-apply";
import type { PartnerAlertRetainedOperationEvidence,PartnerAlertRetainedProviderEvidence } from "./partner-alert-retained-evidence";

const communityId="11111111-1111-4111-8111-111111111111";
const userId="22222222-2222-4222-8222-222222222222";
const offerId="33333333-3333-4333-8333-333333333333";
const lifecycleRef="44444444-4444-4444-8444-444444444444";
const offer={offerId,communityId,version:1,kind:"channel",title:"Alerts",mappingIds:["55555555-5555-4555-8555-555555555555"],
  currency:{code:"USD",minorUnitDigits:2},amountMinor:2500,cadence:{unit:"day",count:30},
  whop:{environment:"live",accountId:"biz_one",productId:"prod_one",planId:"plan_one"}} as const;
const fact={environment:"live",paymentId:"pay_one",accountId:"biz_one",membershipId:"mem_one",productId:"prod_one",
  planId:"plan_one",whopUserRef:"a".repeat(64),state:"paid",paidAtUtc:"2026-11-02T10:00:00.000Z",amountMinor:2500,
  refundState:"partial",disputeState:"observed",observedAtUtc:"2026-11-02T12:00:00.000Z",
  validUntilUtc:"2026-11-02T13:00:00.000Z"} as const;
const claim:PartnerAlertWhopInboxClaim={event:{communityId,environment:"live",accountId:"biz_one",apiVersionDate:"2026-10-27-2",eventId:"evt_one",
  eventType:"payment.updated",resourceKind:"payment",resourceId:"pay_one",payloadSha256:"b".repeat(64),
  occurredAtUtc:"2026-11-02T11:00:00.000Z"},leaseToken:"66666666-6666-4666-8666-666666666666",attempts:1,
  admissionFence:{} as never};
const preparation={status:"prepared",canApply:false,provenance:"current_runtime_unbound",
  requiresRuntimeQualification:["authenticated_current_whop_identity_and_complete_server_owned_target",
    "actual_get_client_environment_account_and_credential_binding",
    "current_identity_connection_and_erasure_generation_fence",
    "current_reviewed_offer_and_policy_and_per_merchant_read_coordination",
    "transactional_fact_application_and_inbox_lease_fencing"],discoveryComplete:true,discoveredMembershipCount:1,issues:[],readCount:5,
  startedAtUtc:"2026-11-02T11:00:00.000Z",finishedAtUtc:"2026-11-02T12:00:00.000Z",
  context:{userId,communityId,offerId,offerVersion:1,environment:"live",accountId:"biz_one",productId:"prod_one",
    planId:"plan_one",currencyCode:"USD",verifiedWhopUserRef:"a".repeat(64),
    claimedGenerations:{identity:1,connection:1,erasure:1}},members:[{kind:"prepared",membershipId:"mem_one",
      evidence:{membershipId:"mem_one",userId,whopUserRef:"a".repeat(64),communityId,offerId,offerVersion:1,
        whop:offer.whop,state:"active",basis:"paid",observedAtUtc:"2026-11-02T11:00:00.000Z",
        startsAtUtc:"2026-11-01T00:00:00.000Z",validUntilUtc:"2026-11-02T12:30:00.000Z"},
      paymentIds:["pay_one"],paymentFacts:[fact]}]} as const satisfies PartnerAlertWhopPreparation;

function fixture(input:Readonly<{inTransaction?:boolean;leaseUntilUtc?:string;authority?:Record<string,unknown>}>= {}){
  const operations:PartnerAlertRetainedOperationEvidence[]=[];
  const providers:PartnerAlertRetainedProviderEvidence[]=[];
  const db={inTransaction:input.inTransaction??true,prepare:(sql:string)=>({get:()=>sql.includes("FROM partner_alert_whop_inbox")?{
    environment:"live",whop_account_id:"biz_one",event_id:"evt_one",event_type:"payment.updated",resource_kind:"payment",
    resource_id:"pay_one",payload_sha256:"b".repeat(64),occurred_at_utc:"2026-11-02T11:00:00.000Z",
    received_at_utc:"2026-11-02T11:30:00.000Z",lease_until_utc:input.leaseUntilUtc??"2026-11-02T12:30:00.000Z"}:sql.includes("platform_erasure_lifecycles")?{
      lifecycle_ref:lifecycleRef,offer_json:JSON.stringify(offer)}:undefined})} as unknown as Database.Database;
  let next=6;
  const runtime={binding:{keyRef:"retention-v1",key:new Uint8Array(32).fill(4)},nowUtc:()=>"2026-11-02T12:00:00.000Z",
    createId:()=>`${next++}7777777-7777-4777-8777-777777777777`.slice(0,36),lastAffectedBackupCreatedAtUtc:()=>"2026-11-02T12:00:00.000Z", lastAffectedBackupExpiresAtUtc:()=>"2026-12-07T12:00:00.000Z",
    tombstoneLedger:{read:()=>({}),prepare:()=>({}),transition:()=>({})}} as never;
  const admitted={kind:"admitted",admissionRef:"88888888-8888-4888-8888-888888888888",userId,
    verifiedWhopUserRef:"a".repeat(64),communityId,environment:"live",accountId:"biz_one",offerId,offerVersion:1,
    productId:"prod_one",planId:"plan_one",currencyCode:"USD",generations:{identity:1,connection:1,erasure:1},
    validUntilUtc:"2026-11-02T12:30:00.000Z",...input.authority};
  const writer=new PartnerAlertWhopCommercialApply(db,runtime,{recheckCurrent:()=>admitted as never},
    {retainOperation:row=>operations.push(row),retainProvider:row=>providers.push(row)});
  return {writer,operations,providers};
}

describe("Partner Channel provider inbox commercial apply",()=>{
  it("archives exact payment, refund, dispute and inbox disposition in the current transaction",()=>{
    const {writer,operations,providers}=fixture();writer.retain(claim,preparation);
    expect(providers.map(row=>row.recordKind)).toEqual(["payment","refund","dispute"]);
    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({recordKind:"idempotency",actionCode:"partner.provider_event_applied",
      stateCode:"completed",lifecycleRef});
    const serialized=JSON.stringify([...providers,...operations]);
    for(const raw of [communityId,"biz_one","mem_one","pay_one","evt_one"])expect(serialized).not.toContain(raw);
  });

  it("holds outside the inbox transaction or when prepared scope changes",()=>{
    expect(()=>fixture({inTransaction:false}).writer.retain(claim,preparation)).toThrow();
    const changed={...preparation,context:{...(preparation as never as {context:Record<string,unknown>}).context,
      accountId:"biz_other"}} as never;
    expect(()=>fixture().writer.retain(claim,changed)).toThrow();
  });
  it("rejects forged subject/fact scope, partial discovery, event mismatch and expired lease",()=>{
    expect(()=>fixture({authority:{verifiedWhopUserRef:"c".repeat(64)}}).writer.retain(claim,preparation)).toThrow();
    for(const factMismatch of [{...fact,membershipId:"mem_other"},{...fact,accountId:"biz_other"},
      {...fact,productId:"prod_other"},{...fact,planId:"plan_other"},{...fact,whopUserRef:"c".repeat(64)}]){
      expect(()=>fixture().writer.retain(claim,{...preparation,members:[{
        ...(preparation as never as {members:Record<string,unknown>[]}).members[0],paymentFacts:[factMismatch]}]} as never)).toThrow();
    }
    expect(()=>fixture().writer.retain(claim,{...preparation,discoveredMembershipCount:2} as never)).toThrow();
    expect(()=>fixture().writer.retain(claim,{...preparation,discoveredMembershipCount:0,members:[]} as never)).toThrow();
    expect(()=>fixture().writer.retain({...claim,event:{...(claim as never as {event:Record<string,unknown>}).event,
      resourceId:"pay_other"}} as never,preparation)).toThrow();
    expect(()=>fixture().writer.retain({...claim,event:{...(claim as never as {event:Record<string,unknown>}).event,
      eventType:"payment.forged"}} as never,preparation)).toThrow();
    expect(()=>fixture({leaseUntilUtc:"2026-11-02T11:59:59.999Z"}).writer.retain(claim,preparation)).toThrow();
  });
});
