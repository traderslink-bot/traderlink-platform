import { expect, it } from "vitest";
import { evaluatePlatformPremium, type PlatformPremiumSnapshot } from "../../contracts/platform-premium-access";
import { createPlatformPremiumCurrentAccessEvent } from "./platform-premium-current-access-event";
import { PlatformPremiumRoleRepository, type PlatformPremiumRoleStore, type PlatformPremiumRoleJob,
  type PlatformPremiumEligibilityEvent } from "./platform-premium-role-repository";
const at="2026-11-17T20:00:00.000Z",until="2026-11-17T20:00:30.000Z";
function snapshot(unknown=false):PlatformPremiumSnapshot{
 const scope={authorityKey:"11111111-1111-4111-8111-111111111111",userId:"22222222-2222-4222-8222-222222222222",discordUserId:"12345",guildId:"12346",identityGeneration:1,entitlementGeneration:1,erasureGeneration:1,policyGeneration:1};
 const offer={scopeRef:"offer",environment:"live" as const,accountId:"merchant",productId:"product",planId:"plan"};
 return{apiVersion:"platform_premium_authority_v2",scope,authorityRevision:1,observedAtUtc:at,validUntilUtc:until,
  ticket:{scope,authorityRevision:1,whopGeneration:1,admissionRef:"admitted",factsSha256:"a".repeat(64),observedAtUtc:at,validUntilUtc:until},
  payer:{kind:"bound",linkId:"link",whopUserId:"buyer",whopUserRefHmac:"b".repeat(64)},paidRoleId:"12347",complimentaryRoleId:null,
  coverage:[unknown?{kind:"unknown",offer,basis:"current_provider_access",reason:"provider_unavailable"}:{kind:"evidence",offer,nativeObservationRef:"observation",
   evidence:{kind:"current_paid_access",purchase:{...offer,whopUserId:"buyer"},observedAtUtc:at,validUntilUtc:until,memberships:[{membershipRef:"member",paymentRef:"payment"}]}}],
  complimentary:{kind:"none"},assignmentReview:{kind:"reviewed",reviewRef:"review",actorUserId:"actor",reviewedAtUtc:at,paidRoleDisposition:"paid_only"},previousPaidThroughUtc:"2026-11-01T00:00:00.000Z",retiredSubjects:[]};
}
function fixture(){const jobs:PlatformPremiumRoleJob[]=[],events:PlatformPremiumEligibilityEvent[]=[];
 const store:PlatformPremiumRoleStore={transaction:fn=>fn({findTarget:()=>jobs[0]??null,put:job=>{jobs[0]=job;},appendEligibility:event=>{events.push(event);},
  due:now=>jobs.filter(job=>job.nextAttemptAtUtc<=now),cooldownUntilUtc:()=>null,extendCooldown:()=>undefined})};
 return{jobs,events,repo:new PlatformPremiumRoleRepository(store,()=>true),blocked:new PlatformPremiumRoleRepository(store,()=>false)};
}
function intent(s:PlatformPremiumSnapshot,desired:"present"|"absent"|"hold"){
 return{ticket:s.ticket,managedAssignmentRef:null,target:{authorityKey:s.scope.authorityKey,guildId:s.scope.guildId,discordUserId:s.scope.discordUserId!,roleId:s.paidRoleId},scope:s.scope,
 authorityRevision:1,desired,validUntilUtc:desired==="hold"?null:until,atUtc:at,reason:"paid",basis:"current_provider_access" as const,realm:"live" as const,nativeObservationRefs:desired==="hold"?[]:["observation"]};
}
it("stages a finite current-access role intent and truthful positive event under the original ticket",()=>{
 const s=snapshot(),e=createPlatformPremiumCurrentAccessEvent(s,evaluatePlatformPremium(s,at),at)!;const x=fixture();
 expect(e).toMatchObject({basis:"current_provider_access",paidEligible:true,paidThroughUtc:null,validUntilUtc:until,nativeObservationRefs:["observation"]});
 expect(x.repo.stage([intent(s,"present")],e)).toBe(true);expect(x.events[0]).toEqual(e);expect(x.jobs[0]?.intent.ticket).toEqual(s.ticket);
});
it("stages unknown as null plus a held role, wakes a refresh at its finite deadline and never claims a role effect",()=>{
 const s=snapshot(true),e=createPlatformPremiumCurrentAccessEvent(s,evaluatePlatformPremium(s,at),at)!;const x=fixture();
 expect(e).toMatchObject({state:"unknown",paidEligible:null,paidThroughUtc:null});
 expect(x.repo.stage([intent(s,"hold")],e)).toBe(true);expect(x.jobs[0]).toMatchObject({state:"held",nextAttemptAtUtc:until,error:null});
 expect(x.repo.nextDueAuthority(at)).toBe(null);expect(x.repo.nextDueAuthority(until)).toBe(s.scope.authorityKey);
 expect(x.repo.claim(until,"claim",s.scope.authorityKey)).toBe(null);
});
it("rejects mismatched role intent or stale original ticket before writing an event",()=>{
 const s=snapshot(),e=createPlatformPremiumCurrentAccessEvent(s,evaluatePlatformPremium(s,at),at)!;const x=fixture();
 expect(()=>x.repo.stage([intent(s,"absent")],e)).toThrow();expect(x.events).toEqual([]);
 expect(x.blocked.stage([intent(s,"present")],e)).toBe(false);expect(x.events).toEqual([]);expect(x.jobs).toEqual([]);
});
it("requires an actual native observation reference for positive current access",()=>{
 const s=snapshot(),item=s.coverage[0]!;if(item.kind!=="evidence")throw Error("Missing evidence");
 const broken={...s,coverage:[{...item,nativeObservationRef:undefined}]};
 expect(()=>createPlatformPremiumCurrentAccessEvent(broken,evaluatePlatformPremium(broken,at),at)).toThrow();
});
