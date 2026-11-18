// @vitest-environment node
import { createHash } from "node:crypto";
import { describe,expect,it } from "vitest";
import { PartnerAlertErasureEvidenceArchiver } from "./partner-alert-erasure-evidence-archiver";

const operation="11111111-1111-4111-8111-111111111111",life="22222222-2222-4222-8222-222222222222";

describe("Partner Channel erasure retained-evidence archiver",()=>{
  it("archives an audit original and binds its exact successor in one admitted transaction",()=>{
    const source={audit_event_id:"33333333-3333-4333-8333-333333333333",
      community_id:"44444444-4444-4444-8444-444444444444",actor_user_id:"55555555-5555-4555-8555-555555555555",
      action:"partner.save_draft",resource_id:"resource",detail_json:JSON.stringify({partnerRevision:2,
        resourceVersion:1,state:"draft"}),created_at_utc:"2026-11-02T12:00:00.000Z"};
    const original=JSON.stringify(source),retained:Record<string,unknown>={},successor:Record<string,unknown>={};
    const db={inTransaction:true,prepare:(sql:string)=>({
      all:()=>sql.includes("participant IN")?[{participant:"partner_audit",claim_ref:"claim",original_json:original,state:"captured"}]:[],
      get:()=>sql.includes("platform_erasure_module_operations")?{lifecycle_ref:life}
        :sql.includes("operation_claims")?{participant:"partner_audit",claim_ref:"claim",original_json:original,
          original_sha256:createHash("sha256").update(original).digest("hex"),state:"captured"}
        :sql.includes("retained_operation_evidence")?Object.keys(retained).length?retained:undefined
        :sql.includes("claim_successors")?successor
        :undefined,
      run:(...args:unknown[])=>{
        if(sql.includes("INSERT OR IGNORE INTO partner_alert_retained_operation_evidence"))Object.assign(retained,{
          evidence_ref:args[0],lifecycle_ref:args[1],record_kind:args[2],community_binding_hmac_sha256:args[3],
          source_record_hmac_sha256:args[4],binding_key_ref:args[5],action_code:args[6],
          resource_binding_hmac_sha256:args[7],partner_revision:args[8],resource_version:args[9],state_code:args[10],
          fingerprint_hmac_sha256:args[11],result_hmac_sha256:args[12],source_created_at_utc:args[13],
          archived_at_utc:args[14],retain_until_utc:args[15]});
        if(sql.includes("INSERT OR IGNORE INTO partner_alert_erasure_claim_successors"))Object.assign(successor,{
          original_binding_hmac_sha256:args[3],binding_key_ref:args[4],successor_kind:args[5],successor_ref:args[6],
          verified_at_utc:args[7],retain_until_utc:args[8]});
        return{changes:1};
      }})};
    let sequence=0;
    const archived=new PartnerAlertErasureEvidenceArchiver(db as never,{binding:{keyRef:"key",key:new Uint8Array(32).fill(7)},
      nowUtc:()=>"2026-11-03T12:00:00.000Z",createId:()=>sequence++===0?
        "66666666-6666-4666-8666-666666666666":"77777777-7777-4777-8777-777777777777"}).archive(operation);
    expect(archived).toBe(1);
    expect(retained).toMatchObject({record_kind:"audit",binding_key_ref:"key",action_code:"partner.save_draft"});
    expect(successor).toMatchObject({successor_kind:"operational_evidence",
      successor_ref:"66666666-6666-4666-8666-666666666666"});
  });
  it("refuses to archive outside the admitted transaction",()=>{
    const db={inTransaction:false};
    expect(()=>new PartnerAlertErasureEvidenceArchiver(db as never,{binding:{keyRef:"key",key:new Uint8Array(32).fill(7)},
      nowUtc:()=>"2026-11-03T12:00:00.000Z",createId:()=>operation}).archive(operation)).toThrow();
  });
});
