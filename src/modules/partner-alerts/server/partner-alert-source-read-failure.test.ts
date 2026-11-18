// @vitest-environment node
import {expect,it} from "vitest";
import {partnerAlertPrivateReadFailure} from "./partner-alert-http";
import {PartnerAlertPlatformAuthority,type PartnerAlertPlatformReadBindings} from "./partner-alert-platform-authority";
import {TraderLinkPlatformError} from "../../platform/server/database/platform-migration-contract";
import {PartnerAlertValidationError} from "../contracts/partner-alert-contracts";

// Synthetic repository/identity ports; actual authority and native error types.
// This is HTTP classification evidence, not native admission or provider proof.
const userId="11111111-1111-4111-8111-111111111111",ownerId="22222222-2222-4222-8222-222222222222",communityId="33333333-3333-4333-8333-333333333333";
function ownerAuthority(kind:"nonowner"|"stale"|"freshowner") {
 const now="2026-11-18T12:00:00.000Z";
 const bindings={resolveIdentity:()=>({mode:"platform_session",sessionId:"44444444-4444-4444-8444-444444444444",scope:{userId:kind==="nonowner"?userId:ownerId,workspaceId:"55555555-5555-4555-8555-555555555555",activeAccountId:null}}),
  identityOptions:{environment:{}},admin:{authorize:()=>{throw Error("Admin not exercised");}},
  communities:{findById:()=>({communityId,status:"active",ownerUserId:ownerId,discordGuildId:"12345"}),resolveAccess:()=>({isOwner:true,userId:ownerId,communityId,membershipStatus:"active",capabilities:["community.manage"]})},
  discordMemberships:{findCurrent:()=>({guildOwner:true,userId:ownerId,guildId:"12345",lastVerifiedAtUtc:kind==="stale"?"2026-11-18T11:55:00.000Z":"2026-11-18T12:00:00.000Z"})},
  nowUtc:()=>now,maximumActorAgeMs:300000,maximumDiscordEvidenceAgeMs:300000,destinationGuildId:"12345"} as unknown as PartnerAlertPlatformReadBindings;
 const authority=PartnerAlertPlatformAuthority.forRequest(new Request("https://synthetic.test/source-channels"),bindings);
 return authority;
}
it.each(["nonowner","stale"] as const)("maps real %s authority refusal to403 without exposing its message",async kind=>{
 let error:unknown;try{ownerAuthority(kind).requireCommunityOwner(communityId);}catch(value){error=value;}
 expect(error).toBeInstanceOf(PartnerAlertValidationError);
 expect((error as PartnerAlertValidationError).field).toBe(kind==="stale"?"authority":"communityOwner");
 const response=partnerAlertPrivateReadFailure(error);expect(response.status).toBe(403);
 expect(response.headers.get("cache-control")).toContain("no-store");await expect(response.json()).resolves.toMatchObject({ok:false,code:"forbidden"});
});
it("accepts the same fresh real owner before any failure mapping",()=>{expect(ownerAuthority("freshowner").requireCommunityOwner(communityId).userId).toBe(ownerId);});
it.each(["TRADERLINK_WORKSPACE_ACCESS_DENIED","TRADERLINK_AUTH_SESSION_INVALID"] as const)("keeps native %s sign-in classification",code=>{
 expect(partnerAlertPrivateReadFailure(new TraderLinkPlatformError(code)).status).toBe(401);
});
it("keeps native admin denial403",()=>expect(partnerAlertPrivateReadFailure(new TraderLinkPlatformError("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED")).status).toBe(403));
it.each([new Error("Discord unavailable"),new SyntaxError("provider malformed"),new TraderLinkPlatformError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED"),new PartnerAlertValidationError("sourceChannelId"),{field:"communityOwner"},new Error("communityOwner")])("keeps genuine dependency or untrusted errors unavailable",async error=>{
 const response=partnerAlertPrivateReadFailure(error);expect(response.status).toBe(503);await expect(response.json()).resolves.toMatchObject({ok:false,code:"unavailable"});
});
