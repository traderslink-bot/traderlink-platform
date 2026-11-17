// @vitest-environment node
import {describe,expect,it} from "vitest";
import {createHash} from "node:crypto";
import {PartnerAlertErasureClaimSuccessors} from "./partner-alert-erasure-claim-successors";

const operation="11111111-1111-4111-8111-111111111111";
const original={mapping_id:"22222222-2222-4222-8222-222222222222",destination_guild_id:"810000000000000001",
  discord_user_id:"810000000000000002",destination_role_id:"810000000000000003"};

describe("Partner Channel erasure claim successor accounting",()=>{
  it("records only an exact surviving role-cleanup successor",()=>{
    const text=JSON.stringify(original),stored:Record<string,unknown>={};
    const db={inTransaction:true,prepare:(sql:string)=>({
      get:()=>sql.includes("operation_claims")?{participant:"partner_role",claim_ref:"claim",
        original_json:text,original_sha256:createHash("sha256").update(text).digest("hex"),state:"captured"}
        :sql.includes("external_cleanup")?{state:"pending"}:sql.includes("claim_successors")?stored:undefined,
      run:(...args:unknown[])=>{if(sql.includes("INSERT OR IGNORE"))Object.assign(stored,{original_binding_hmac_sha256:args[3],
        binding_key_ref:args[4],successor_kind:args[5],successor_ref:args[6],verified_at_utc:args[7],retain_until_utc:args[8]});return{changes:1};},
      all:()=>[]})};
    expect(()=>new PartnerAlertErasureClaimSuccessors(db as never,{keyRef:"key",key:new Uint8Array(32).fill(7)})
      .recordRoleCleanup({operationRef:operation,participant:"partner_role",claimRef:"claim",
        verifiedAtUtc:"2026-11-02T12:00:00.000Z"})).not.toThrow();
  });
  it("holds in-flight originals before successor accounting",()=>{
    const text=JSON.stringify(original);
    const db={inTransaction:true,prepare:()=>({get:()=>({participant:"partner_role",claim_ref:"claim",original_json:text,
      original_sha256:createHash("sha256").update(text).digest("hex"),state:"in_flight"})})};
    expect(()=>new PartnerAlertErasureClaimSuccessors(db as never,{keyRef:"key",key:new Uint8Array(32).fill(7)})
      .recordRoleCleanup({operationRef:operation,participant:"partner_role",claimRef:"claim",
        verifiedAtUtc:"2026-11-02T12:00:00.000Z"})).toThrow();
  });
  it("binds audit and idempotency claims only to exact retained operation evidence",()=>{
    for(const [participant,sourceKey,kind] of [["partner_audit","audit_event_id","audit"],
      ["partner_command","request_id","idempotency"]] as const){
      const source={ [sourceKey]:"22222222-2222-4222-8222-222222222222" },text=JSON.stringify(source),stored:Record<string,unknown>={};
      const db={inTransaction:true,prepare:(sql:string)=>({get:()=>sql.includes("module_operations")?{lifecycle_ref:"life"}
        :sql.includes("operation_claims")?{participant,claim_ref:"claim",original_json:text,
          original_sha256:createHash("sha256").update(text).digest("hex"),state:"captured"}
        :sql.includes("retained_operation_evidence")?{evidence_ref:"33333333-3333-4333-8333-333333333333",binding_key_ref:"key"}
        :sql.includes("claim_successors")?stored:undefined,
        run:(...args:unknown[])=>{if(sql.includes("INSERT OR IGNORE"))Object.assign(stored,{original_binding_hmac_sha256:args[3],
          binding_key_ref:args[4],successor_kind:args[5],successor_ref:args[6],verified_at_utc:args[7],retain_until_utc:args[8]});return{changes:1};}})};
      expect(()=>new PartnerAlertErasureClaimSuccessors(db as never,{keyRef:"key",key:new Uint8Array(32).fill(7)})
        .recordRetainedOperationEvidence({operationRef:operation,participant,claimRef:"claim",
          verifiedAtUtc:"2026-11-02T12:00:00.000Z"})).not.toThrow();
      expect(stored).toMatchObject({successor_kind:"operational_evidence",
        successor_ref:"33333333-3333-4333-8333-333333333333"});
      expect(kind).toBe(kind);
    }
  });
  it("binds an agreement claim only to exact seven-year retained evidence",()=>{
    const text=JSON.stringify({agreement_id:"22222222-2222-4222-8222-222222222222"}),stored:Record<string,unknown>={};
    const db={inTransaction:true,prepare:(sql:string)=>({get:()=>sql.includes("module_operations")?{lifecycle_ref:"life"}
      :sql.includes("operation_claims")?{participant:"partner_agreement",claim_ref:"claim",original_json:text,
        original_sha256:createHash("sha256").update(text).digest("hex"),state:"captured"}
      :sql.includes("retained_commercial_evidence")?{evidence_ref:"33333333-3333-4333-8333-333333333333",
        binding_key_ref:"key",successor_ref:"commercial-successor"}:sql.includes("claim_successors")?stored:undefined,
      run:(...args:unknown[])=>{if(sql.includes("INSERT OR IGNORE"))Object.assign(stored,{original_binding_hmac_sha256:args[3],
        binding_key_ref:args[4],successor_kind:args[5],successor_ref:args[6],verified_at_utc:args[7],retain_until_utc:args[8]});return{changes:1};}})};
    expect(()=>new PartnerAlertErasureClaimSuccessors(db as never,{keyRef:"key",key:new Uint8Array(32).fill(7)})
      .recordRetainedAgreementEvidence({operationRef:operation,participant:"partner_agreement",claimRef:"claim",
        verifiedAtUtc:"2026-11-02T12:00:00.000Z"})).not.toThrow();
    expect(stored).toMatchObject({successor_kind:"commercial_evidence",
      successor_ref:"33333333-3333-4333-8333-333333333333"});
  });
  it("binds a completed inbox claim only to its pseudonymized applied-event receipt",()=>{
    const source={community_id:"22222222-2222-4222-8222-222222222222",environment:"live",whop_account_id:"biz_one",
      event_id:"evt_one",event_type:"payment.updated",resource_kind:"payment",resource_id:"pay_one",
      payload_sha256:"a".repeat(64),occurred_at_utc:"2026-11-02T11:00:00.000Z",
      received_at_utc:"2026-11-02T12:00:00.000Z",status:"completed",lease_token:null,lease_until_utc:null,
      admission_fence_json:null},text=JSON.stringify(source),stored:Record<string,unknown>={};
    const db={inTransaction:true,prepare:(sql:string)=>({get:()=>sql.includes("operation_claims")?{
      participant:"partner_inbox",claim_ref:"claim",original_json:text,
      original_sha256:createHash("sha256").update(text).digest("hex"),state:"captured"}
      :sql.includes("claim_successors")?stored:undefined,
      all:()=>sql.includes("retained_operation_evidence")?[{evidence_ref:"33333333-3333-4333-8333-333333333333",
        binding_key_ref:"key"}]:[],
      run:(...args:unknown[])=>{if(sql.includes("INSERT OR IGNORE"))Object.assign(stored,{original_binding_hmac_sha256:args[3],
        binding_key_ref:args[4],successor_kind:args[5],successor_ref:args[6],verified_at_utc:args[7],retain_until_utc:args[8]});return{changes:1};}})};
    expect(()=>new PartnerAlertErasureClaimSuccessors(db as never,{keyRef:"key",key:new Uint8Array(32).fill(7)})
      .recordProviderInboxDisposition({operationRef:operation,participant:"partner_inbox",claimRef:"claim",
        verifiedAtUtc:"2026-11-02T13:00:00.000Z"})).not.toThrow();
    expect(stored).toMatchObject({successor_kind:"operational_evidence",
      successor_ref:"33333333-3333-4333-8333-333333333333"});
  });
  it("disposes an unapplied inbox event only after logical deletion and exact source removal",()=>{
    const source={community_id:"22222222-2222-4222-8222-222222222222",environment:"live",whop_account_id:"biz_one",
      event_id:"evt_one",event_type:"payment.updated",resource_kind:"payment",resource_id:"pay_one",
      payload_sha256:"a".repeat(64),occurred_at_utc:"2026-11-02T11:00:00.000Z",
      received_at_utc:"2026-11-02T12:00:00.000Z",status:"failed",lease_token:null,lease_until_utc:null,
      admission_fence_json:null},text=JSON.stringify(source),stored:Record<string,unknown>={};
    const db={inTransaction:true,prepare:(sql:string)=>({get:()=>sql.includes("module_operations")?{phase:"logical_deleted"}
      :sql.includes("operation_claims")?{participant:"partner_inbox",claim_ref:"claim",original_json:text,
        original_sha256:createHash("sha256").update(text).digest("hex"),state:"captured"}
      :sql.includes("partner_alert_whop_inbox")?undefined:sql.includes("claim_successors")?stored:undefined,
      run:(...args:unknown[])=>{if(sql.includes("INSERT OR IGNORE"))Object.assign(stored,{original_binding_hmac_sha256:args[3],
        binding_key_ref:args[4],successor_kind:args[5],successor_ref:args[6],verified_at_utc:args[7],retain_until_utc:args[8]});return{changes:1};}})};
    expect(()=>new PartnerAlertErasureClaimSuccessors(db as never,{keyRef:"key",key:new Uint8Array(32).fill(7)})
      .recordProviderInboxDisposition({operationRef:operation,participant:"partner_inbox",claimRef:"claim",
        verifiedAtUtc:"2026-11-02T13:00:00.000Z"})).not.toThrow();
    expect(stored.successor_kind).toBe("private_disposition");
  });
  it("records private disposition only after logical deletion and exact source removal",()=>{
    const refresh={authority_key:"authority",authority_revision:2,user_id:"22222222-2222-4222-8222-222222222222",
      observed_at_utc:"2026-11-02T11:00:00.000Z",reason:"paid_changed"};
    const text=JSON.stringify(refresh),stored:Record<string,unknown>={};
    const db={inTransaction:true,prepare:(sql:string)=>({get:()=>sql.includes("module_operations")?{phase:"logical_deleted"}
      :sql.includes("operation_claims")?{participant:"partner_refresh",claim_ref:"claim",original_json:text,
        original_sha256:createHash("sha256").update(text).digest("hex"),state:"captured"}
      :sql.includes("premium_refresh_events")?undefined:sql.includes("claim_successors")?stored:undefined,
      run:(...args:unknown[])=>{if(sql.includes("INSERT OR IGNORE"))Object.assign(stored,{original_binding_hmac_sha256:args[3],
        binding_key_ref:args[4],successor_kind:args[5],successor_ref:args[6],verified_at_utc:args[7],retain_until_utc:args[8]});return{changes:1};}})};
    expect(()=>new PartnerAlertErasureClaimSuccessors(db as never,{keyRef:"key",key:new Uint8Array(32).fill(7)})
      .recordPrivateDisposition({operationRef:operation,participant:"partner_refresh",claimRef:"claim",
        verifiedAtUtc:"2026-11-02T12:00:00.000Z"})).not.toThrow();
    expect(stored.successor_kind).toBe("private_disposition");
  });
  it("binds delivery originals only to an exact terminal row and active text-retention successor",()=>{
    const delivery={delivery_id:"22222222-2222-4222-8222-222222222222",community_id:"community",
      mapping_id:"mapping",source_channel_id:"810000000000000001",message_id:"810000000000000002",
      source_revision:2,part_index:0,action:"create",status:"sending",lease_token:"token",text_content:"alert"};
    const text=JSON.stringify(delivery),stored:Record<string,unknown>={};
    const db={inTransaction:true,prepare:(sql:string)=>({get:()=>sql.includes("operation_claims")?{
      participant:"partner_delivery",claim_ref:"claim",original_json:text,
      original_sha256:createHash("sha256").update(text).digest("hex"),state:"settled"}
      :sql.includes("partner_alert_deliveries")?{...delivery,status:"delivered",lease_token:null}
      :sql.includes("source_messages")?{retain_until_utc:"2026-12-02T12:00:00.000Z",text_content:"alert"}
      :sql.includes("claim_successors")?stored:undefined,
      run:(...args:unknown[])=>{if(sql.includes("INSERT OR IGNORE"))Object.assign(stored,{original_binding_hmac_sha256:args[3],
        binding_key_ref:args[4],successor_kind:args[5],successor_ref:args[6],verified_at_utc:args[7],retain_until_utc:args[8]});return{changes:1};}})};
    expect(()=>new PartnerAlertErasureClaimSuccessors(db as never,{keyRef:"key",key:new Uint8Array(32).fill(7)})
      .recordDeliverySettlement({operationRef:operation,participant:"partner_delivery",claimRef:"claim",
        verifiedAtUtc:"2026-11-02T12:00:00.000Z"})).not.toThrow();
    expect(stored).toMatchObject({successor_kind:"delivery_settlement",successor_ref:delivery.delivery_id});
  });
  it("refuses transactional purge while any captured original lacks a successor",()=>{
    const text=JSON.stringify(original);
    const db={inTransaction:true,prepare:(sql:string)=>({get:()=>sql.includes("module_operations")?{phase:"logical_deleted"}:undefined,
      all:()=>sql.includes("operation_claims")?[{participant:"partner_role",claim_ref:"claim",original_json:text,
        original_sha256:createHash("sha256").update(text).digest("hex"),state:"captured"}]:[],run:()=>({changes:1})})};
    expect(()=>new PartnerAlertErasureClaimSuccessors(db as never,{keyRef:"key",key:new Uint8Array(32).fill(7)})
      .purgeCovered(operation)).toThrow();
  });
  it("binds a late role outcome only to its settled parent token and cleanup quiescence",()=>{
    const parent={...original,lease_token:"write_token"},parentText=JSON.stringify(parent);
    const outcomeText=JSON.stringify({operationId:"write_token",intent:{},result:{kind:"confirmed"},
      receivedAtUtc:"2026-11-02T12:00:00.000Z"}),stored:Record<string,unknown>={};
    const db={inTransaction:true,prepare:(sql:string)=>({get:()=>sql.includes("outcome_ref=?")?{
      participant:"partner_role",claim_ref:"parent",original_json:parentText,
      original_sha256:createHash("sha256").update(parentText).digest("hex"),state:"settled"}
      :sql.includes("operation_claims")?{participant:"partner_role_outcome",claim_ref:"outcome",original_json:outcomeText,
        original_sha256:createHash("sha256").update(outcomeText).digest("hex"),state:"captured"}
      :sql.includes("external_cleanup")?{prior_write_token:"write_token",quiescence_ref:"quiescence"}
      :sql.includes("claim_successors")?stored:undefined,
      run:(...args:unknown[])=>{if(sql.includes("INSERT OR IGNORE"))Object.assign(stored,{original_binding_hmac_sha256:args[3],
        binding_key_ref:args[4],successor_kind:args[5],successor_ref:args[6],verified_at_utc:args[7],retain_until_utc:args[8]});return{changes:1};}})};
    expect(()=>new PartnerAlertErasureClaimSuccessors(db as never,{keyRef:"key",key:new Uint8Array(32).fill(7)})
      .recordRoleTransportQuiescence({operationRef:operation,participant:"partner_role_outcome",claimRef:"outcome",
        verifiedAtUtc:"2026-11-02T12:01:00.000Z"})).not.toThrow();
    expect(stored).toMatchObject({successor_kind:"transport_quiescence",successor_ref:"quiescence"});
  });
  it("binds a late delivery outcome only after the exact row reaches its terminal state",()=>{
    const parent={delivery_id:"22222222-2222-4222-8222-222222222222",lease_token:"write_token"};
    const parentText=JSON.stringify(parent),outcomeText=JSON.stringify({operationId:"write_token",job:{},fence:{},
      result:{kind:"confirmed"},receivedAtUtc:"2026-11-02T12:00:00.000Z"}),stored:Record<string,unknown>={};
    const db={inTransaction:true,prepare:(sql:string)=>({get:()=>sql.includes("outcome_ref=?")?{
      participant:"partner_delivery",claim_ref:"parent",original_json:parentText,
      original_sha256:createHash("sha256").update(parentText).digest("hex"),state:"settled"}
      :sql.includes("operation_claims")?{participant:"partner_delivery_outcome",claim_ref:"outcome",original_json:outcomeText,
        original_sha256:createHash("sha256").update(outcomeText).digest("hex"),state:"captured"}
      :sql.includes("partner_alert_deliveries")?{status:"delivered",lease_token:null,outcome_json:outcomeText}
      :sql.includes("claim_successors")?stored:undefined,
      run:(...args:unknown[])=>{if(sql.includes("INSERT OR IGNORE"))Object.assign(stored,{original_binding_hmac_sha256:args[3],
        binding_key_ref:args[4],successor_kind:args[5],successor_ref:args[6],verified_at_utc:args[7],retain_until_utc:args[8]});return{changes:1};}})};
    expect(()=>new PartnerAlertErasureClaimSuccessors(db as never,{keyRef:"key",key:new Uint8Array(32).fill(7)})
      .recordDeliveryTransportQuiescence({operationRef:operation,participant:"partner_delivery_outcome",claimRef:"outcome",
        verifiedAtUtc:"2026-11-02T12:01:00.000Z"})).not.toThrow();
    expect(stored).toMatchObject({successor_kind:"transport_quiescence",successor_ref:"outcome"});
  });
});
