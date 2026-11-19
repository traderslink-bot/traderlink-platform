// @vitest-environment node
import {describe,expect,it} from "vitest";
import {classifyPartnerAlertCleanupOutcome} from "./partner-alert-erasure-cleanup-worker";

const row={receipt_ref:"11111111-1111-4111-8111-111111111111",authority_key:"authority",
  guild_id:"810000000000000001",discord_user_id:"810000000000000002",role_id:"810000000000000003",
  role_kind:"partner_channel" as const,source_ref:"source",fence_revision:4,state:"applying",
  prior_write_token:null,quiescence_ref:null,cleanup_lease_token:"token",cleanup_lease_until_utc:"2026-11-02T12:01:00.000Z"};

describe("Partner Channel erasure cleanup outcomes",()=>{
  it("deletes identifiers only after exact confirmed absence",()=>{
    expect(classifyPartnerAlertCleanupOutcome(row,{kind:"confirmed_absent",guildId:row.guild_id,
      discordUserId:row.discord_user_id,roleId:row.role_id})).toEqual({action:"delete",error:null,delayMs:null});
    expect(classifyPartnerAlertCleanupOutcome(row,{kind:"confirmed_absent",guildId:row.guild_id,
      discordUserId:row.discord_user_id,roleId:"810000000000000009"})).toEqual({
        action:"uncertain",error:"target_mismatch",delayMs:null});
  });
  it("never converts uncertain, rejected, or retryable outcomes into completion",()=>{
    expect(classifyPartnerAlertCleanupOutcome(row,{kind:"uncertain"}).action).toBe("uncertain");
    expect(classifyPartnerAlertCleanupOutcome(row,{kind:"rejected",reason:"permission_required"}).action).toBe("hold");
    expect(classifyPartnerAlertCleanupOutcome(row,{kind:"retry",reason:"temporary",delayMs:5000})).toEqual({
      action:"retry",error:"temporary",delayMs:5000});
  });
});
