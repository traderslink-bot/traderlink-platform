// @vitest-environment node
import {describe,expect,it} from "vitest";
import {PARTNER_ALERT_ERASURE_PRINCIPAL_ID,PartnerAlertErasureAnonymizer} from "./partner-alert-erasure-anonymizer";

const operation="11111111-1111-4111-8111-111111111111",user="22222222-2222-4222-8222-222222222222";
const configuration={binding:{keyRef:"key",key:new Uint8Array(32).fill(8)},
  nowUtc:()=>"2026-11-02T12:00:00.000Z",createId:()=>"33333333-3333-4333-8333-333333333333"};

describe("Partner Channel erasure anonymizer",()=>{
  it("rejects a disabled principal that has any pre-existing Platform authority reference",()=>{
    const db={inTransaction:true,pragma:()=>[{table:"platform_users",from:"user_id"}],prepare:(sql:string)=>({
      all:()=>sql.includes("sqlite_schema")?[{name:"platform_workspace_memberships"}]:[],
      get:()=>sql.includes("module_operations")?{phase:"ready"}:sql.includes("FROM platform_users")?{
        auth_provider:"erasure",auth_subject:"paid-partner-retained-principal-v1",display_name:"Removed Partner owner",
        status:"disabled"}:sql.includes("platform_workspace_memberships")?{1:1}:undefined})};
    expect(()=>new PartnerAlertErasureAnonymizer(db as never,configuration).anonymize(operation,user,
      "2026-11-02T12:00:00.000Z")).toThrow();
  });
  it("uses one fixed nonidentifying principal rather than a per-user pseudonym",()=>{
    expect(PARTNER_ALERT_ERASURE_PRINCIPAL_ID).toBe("00000000-0000-4000-8000-000000000195");
    expect(PARTNER_ALERT_ERASURE_PRINCIPAL_ID).not.toContain(user.slice(0,8));
  });
});
