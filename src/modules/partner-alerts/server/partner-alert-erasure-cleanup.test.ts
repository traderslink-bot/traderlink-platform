// @vitest-environment node
import { describe,expect,it } from "vitest";
import { projectPartnerAlertRoleCleanup,projectPlatformPremiumRoleCleanup,retainPartnerAlertRoleCleanup,
  type PartnerAlertRoleErasureSource } from "./partner-alert-erasure-cleanup";

const id=(d:string)=>`${d.repeat(8)}-${d.repeat(4)}-4${d.repeat(3)}-8${d.repeat(3)}-${d.repeat(12)}`;
const ticket={premium:{scope:{authorityKey:id("4"),userId:id("3"),discordUserId:"810000000000000001",
  guildId:"810000000000000002",identityGeneration:1,entitlementGeneration:1,erasureGeneration:1,
  policyGeneration:1},authorityRevision:3,whopGeneration:1,admissionRef:"admission",factsSha256:"a".repeat(64),
  observedAtUtc:"2026-11-02T11:00:00.000Z",validUntilUtc:"2026-11-02T13:00:00.000Z"},context:{
  communityId:id("1"),mappingId:id("2"),userId:id("3"),linkedDiscordUserId:"810000000000000001",
  guildId:"810000000000000002",roleId:"810000000000000003",authorityRevision:3,partnerRevision:2,
  mappingRevision:4,providerGeneration:1,identityGeneration:1,erasureGeneration:1,policyGeneration:1,
  admissionRef:"admission",factsSha256:"a".repeat(64),offerFactsSha256:"b".repeat(64),
  observedAtUtc:"2026-11-02T11:00:00.000Z",validUntilUtc:"2026-11-02T13:00:00.000Z"}};
const source:PartnerAlertRoleErasureSource={community_id:id("1"),mapping_id:id("2"),user_id:id("3"),
  discord_user_id:"810000000000000001",destination_guild_id:"810000000000000002",
  destination_role_id:"810000000000000003",decision_revision:4,status:"applied",
  desired_ticket_json:JSON.stringify(ticket),lease_token:null,lease_until_utc:null,in_flight_present:null,
  in_flight_intent_json:null,outcome_json:null};
const nativeJob=(state="confirmed")=>JSON.stringify({intent:{ticket:{scope:{authorityKey:id("4"),userId:id("3"),
  discordUserId:"810000000000000001",guildId:"810000000000000002",identityGeneration:1,
  entitlementGeneration:1,erasureGeneration:1,policyGeneration:1},authorityRevision:3,whopGeneration:1,
  admissionRef:"admission",factsSha256:"a".repeat(64),observedAtUtc:"2026-11-02T11:00:00.000Z",
  validUntilUtc:"2026-11-02T13:00:00.000Z"},managedAssignmentRef:null,
  target:{authorityKey:id("4"),guildId:"810000000000000002",discordUserId:"810000000000000001",
    roleId:"810000000000000004"},scope:{authorityKey:id("4"),userId:id("3"),
    discordUserId:"810000000000000001",guildId:"810000000000000002",identityGeneration:1,
    entitlementGeneration:1,erasureGeneration:1,policyGeneration:1},authorityRevision:3,desired:"present",
  validUntilUtc:"2026-11-02T13:00:00.000Z",atUtc:"2026-11-02T11:00:00.000Z",reason:"paid"},
  managedAssignment:null,lastOutcome:null,version:7,state,actualPresent:true,attempts:1,
  nextAttemptAtUtc:"2026-11-02T12:00:00.000Z",lease:null,error:null});

describe("Partner Channel role erasure cleanup",()=>{
  it("projects a settled job into a minimal remove-role obligation",()=>{
    expect(projectPartnerAlertRoleCleanup({receiptRef:id("5"),capturedAtUtc:"2026-11-02T12:00:00.000Z",
      source,originalClaimState:"captured"})).toEqual({receiptRef:id("5"),authorityKey:id("4"),
      guildId:"810000000000000002",discordUserId:"810000000000000001",roleId:"810000000000000003",
      roleKind:"partner_channel",sourceRef:id("2"),capturedAtUtc:"2026-11-02T12:00:00.000Z",
      fenceRevision:4,state:"pending",priorWriteToken:null,priorWriteUntilUtc:null,priorPresent:null,
      quiescenceRef:null});
  });
  it("holds an in-flight or uncertain operation until its exact claim settles",()=>{
    expect(()=>projectPartnerAlertRoleCleanup({receiptRef:id("5"),capturedAtUtc:"2026-11-02T12:00:00.000Z",
      source:{...source,status:"uncertain"},originalClaimState:"in_flight"})).toThrow();
    expect(()=>projectPartnerAlertRoleCleanup({receiptRef:id("5"),capturedAtUtc:"2026-11-02T12:00:00.000Z",
      source:{...source,status:"uncertain"},originalClaimState:"settled"})).toThrow();
  });
  it("requires the exact Partner outcome and transport quiescence for a formerly uncertain write",()=>{
    const intent={ticket,communityId:id("1"),mappingId:id("2"),userId:id("3"),
      discordUserId:"810000000000000001",guildId:"810000000000000002",roleId:"810000000000000003",
      present:true,revision:4,validUntilUtc:"2026-11-02T13:00:00.000Z",managedAssignmentRef:null};
    const uncertain:PartnerAlertRoleErasureSource={...source,status:"uncertain",lease_token:"write_token",
      lease_until_utc:"2026-11-02T12:30:00.000Z",in_flight_present:1,in_flight_intent_json:JSON.stringify(intent),
      outcome_json:JSON.stringify({operationId:"write_token",intent,result:{kind:"confirmed",
        guildId:intent.guildId,discordUserId:intent.discordUserId,roleId:intent.roleId,present:true},
        receivedAtUtc:"2026-11-02T12:00:00.000Z"})};
    const common={receiptRef:id("5"),capturedAtUtc:"2026-11-02T12:00:00.000Z",source:uncertain,
      originalClaimState:"settled" as const};
    expect(()=>projectPartnerAlertRoleCleanup(common)).toThrow();
    expect(()=>projectPartnerAlertRoleCleanup({...common,quiescence:{token:"wrong_token",outcomeRef:"outcome",
      quiescenceRef:"quiet"}})).toThrow();
    expect(projectPartnerAlertRoleCleanup({...common,quiescence:{token:"write_token",outcomeRef:"outcome",
      quiescenceRef:"quiet"}})).toMatchObject({state:"pending",priorWriteToken:"write_token",
      priorWriteUntilUtc:"2026-11-02T12:30:00.000Z",priorPresent:true,quiescenceRef:"quiet"});
    const mismatched={...uncertain,outcome_json:JSON.stringify({operationId:"write_token",intent,
      result:{kind:"confirmed",guildId:intent.guildId,discordUserId:intent.discordUserId,
        roleId:intent.roleId,present:false},receivedAtUtc:"2026-11-02T12:00:00.000Z"})};
    expect(()=>projectPartnerAlertRoleCleanup({...common,source:mismatched,
      quiescence:{token:"write_token",outcomeRef:"outcome",quiescenceRef:"quiet"}})).toThrow();
  });
  it("stores an exact idempotent cleanup row",()=>{
    const row=projectPartnerAlertRoleCleanup({receiptRef:id("5"),capturedAtUtc:"2026-11-02T12:00:00.000Z",
      source,originalClaimState:"captured"});
    const db={prepare:(sql:string)=>({run:()=>({changes:1}),get:()=>sql.includes("SELECT")?{
      authority_key:row.authorityKey,role_kind:row.roleKind,source_ref:row.sourceRef,
      captured_at_utc:row.capturedAtUtc,fence_revision:row.fenceRevision,state:"pending",
      prior_write_token:null,prior_write_until_utc:null,prior_present:null,quiescence_ref:null}:undefined})};
    expect(()=>retainPartnerAlertRoleCleanup(db as never,row)).not.toThrow();
  });
  it("projects a settled ordinary Premium role into the same cleanup ledger",()=>{
    expect(projectPlatformPremiumRoleCleanup({receiptRef:id("5"),capturedAtUtc:"2026-11-02T12:00:00.000Z",
      source:{guild_id:"810000000000000002",discord_user_id:"810000000000000001",
        role_id:"810000000000000004",authority_key:id("4"),version:7,state:"confirmed",job_json:nativeJob()},
      originalClaimState:"captured",erasedUserId:id("3")})).toMatchObject({roleKind:"ordinary_paid",authorityKey:id("4"),
        sourceRef:id("4"),fenceRevision:7,state:"pending"});
  });
  it("holds malformed or mismatched Native subject and scalar bindings",()=>{
    const base={guild_id:"810000000000000002",discord_user_id:"810000000000000001",
      role_id:"810000000000000004",authority_key:id("4"),version:7,state:"confirmed",job_json:nativeJob()};
    expect(()=>projectPlatformPremiumRoleCleanup({receiptRef:id("5"),capturedAtUtc:"2026-11-02T12:00:00.000Z",
      source:{...base,job_json:"{}"},originalClaimState:"captured",erasedUserId:id("3")})).toThrow();
    expect(()=>projectPlatformPremiumRoleCleanup({receiptRef:id("5"),capturedAtUtc:"2026-11-02T12:00:00.000Z",
      source:base,originalClaimState:"captured",erasedUserId:id("6")})).toThrow();
    expect(()=>projectPlatformPremiumRoleCleanup({receiptRef:id("5"),capturedAtUtc:"2026-11-02T12:00:00.000Z",
      source:{...base,role_id:"810000000000000009"},originalClaimState:"captured",erasedUserId:id("3")})).toThrow();
  });
  it("keeps a formerly uncertain write held until exact outcome and transport quiescence bind its token",()=>{
    const decoded=JSON.parse(nativeJob()) as Record<string,unknown>;
    const intent=decoded.intent;
    decoded.state="uncertain"; decoded.actualPresent=null;
    decoded.lease={token:"write_token",untilUtc:"2026-11-02T12:30:00.000Z",version:7,present:true,intent};
    decoded.lastOutcome={token:"write_token",intent,kind:"confirmed",actualPresent:true,
      receivedAtUtc:"2026-11-02T12:00:00.000Z"};
    const native={guild_id:"810000000000000002",discord_user_id:"810000000000000001",
      role_id:"810000000000000004",authority_key:id("4"),version:7,state:"uncertain",
      job_json:JSON.stringify(decoded)};
    const common={receiptRef:id("5"),capturedAtUtc:"2026-11-02T12:00:00.000Z",source:native,
      originalClaimState:"settled" as const,erasedUserId:id("3")};
    expect(()=>projectPlatformPremiumRoleCleanup(common)).toThrow();
    expect(()=>projectPlatformPremiumRoleCleanup({...common,
      quiescence:{token:"wrong_token",outcomeRef:"outcome",quiescenceRef:"quiet"}})).toThrow();
    expect(projectPlatformPremiumRoleCleanup({...common,
      quiescence:{token:"write_token",outcomeRef:"outcome",quiescenceRef:"quiet"}})).toMatchObject({
        state:"pending",priorWriteToken:"write_token",priorWriteUntilUtc:"2026-11-02T12:30:00.000Z",
        priorPresent:true,quiescenceRef:"quiet"});
  });
});
