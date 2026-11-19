import { expect, it } from "vitest";
import { parsePlatformPremiumEligibilityEvent } from "./platform-premium-eligibility-event";
const at="2026-11-17T20:00:00.000Z",until="2026-11-17T20:01:00.000Z";
const scope={authorityKey:"11111111-1111-4111-8111-111111111111",userId:"22222222-2222-4222-8222-222222222222",discordUserId:"12345",guildId:"12346",identityGeneration:1,entitlementGeneration:1,erasureGeneration:1,policyGeneration:1};
const common={scope,authorityKey:scope.authorityKey,authorityRevision:1,observedAtUtc:at,ticket:{scope,authorityRevision:1,whopGeneration:1,admissionRef:"admitted",factsSha256:"a".repeat(64),observedAtUtc:at,validUntilUtc:until}};
const legacy=()=>({...common,paidEligible:true,paidThroughUtc:"2026-12-01T00:00:00.000Z",validUntilUtc:until});
const current=()=>({...common,protocol:"platform_premium_current_access_event_v1",basis:"current_provider_access",state:"paid",paidEligible:true,paidThroughUtc:null,validUntilUtc:until,realm:"live",nativeObservationRefs:["observation"]});
it("preserves exact legacy shape and period rules",()=>{
 expect(parsePlatformPremiumEligibilityEvent(legacy())).toEqual(legacy());
 expect(parsePlatformPremiumEligibilityEvent({...legacy(),paidEligible:false,paidThroughUtc:null,validUntilUtc:null})).toMatchObject({paidEligible:false});
 for(const delta of [{paidThroughUtc:null},{paidThroughUtc:at},{paidEligible:null},{validUntilUtc:at},{validUntilUtc:"2026-11-17T20:02:00.000Z"}])expect(()=>parsePlatformPremiumEligibilityEvent({...legacy(),...delta})).toThrow();
});
it.each(["paid","not_paid","unknown"])("copies truthful current %s state and original ticket without inventing a period",state=>{
 const value={...current(),state,paidEligible:state==="unknown"?null:state==="paid"};
 const parsed=parsePlatformPremiumEligibilityEvent(value);expect(parsed).toEqual(value);expect(Object.isFrozen(parsed)).toBe(true);
 expect(Object.isFrozen(parsed.ticket.scope)).toBe(true);
 if(parsed.basis!=="current_provider_access")throw Error("Wrong basis");expect(Object.isFrozen(parsed.nativeObservationRefs)).toBe(true);
 value.nativeObservationRefs.push("changed");expect(parsed.nativeObservationRefs).toEqual(["observation"]);
 expect(parsed.paidEligible).toBe(state==="unknown"?null:state==="paid");
});
it("rejects false unknowns, fake periods, invalid native references, realms and mismatched tickets",()=>{
 for(const delta of [{state:"unknown",paidEligible:false},{state:"paid",paidEligible:null},{protocol:"wrong"},{basis:"wrong"},{paidThroughUtc:until},
 {validUntilUtc:at},{validUntilUtc:"2026-11-17T20:02:00.000Z"},{realm:"other"},{nativeObservationRefs:[]},{nativeObservationRefs:["same","same"]},
 {authorityRevision:2},{ticket:{...common.ticket,factsSha256:"bad"}},{scope:{...scope,erasureGeneration:2}}])expect(()=>parsePlatformPremiumEligibilityEvent({...current(),...delta})).toThrow();
});
it("does not retain hidden raw provider data in canonical events or scopes",()=>{
 const parsed=parsePlatformPremiumEligibilityEvent({...current(),rawProviderBody:"private",scope:{...scope,hidden:"private"}});
 expect(JSON.stringify(parsed)).not.toContain("private");
});

it("refuses current-only fields on a legacy branch, including a dropped-basis unknown-to-false downgrade",()=>{
 const damaged={...current(),state:"unknown",paidEligible:false,validUntilUtc:null};
 for(const basis of [undefined,"payment_period","wrong"]){const value={...damaged,basis};expect(()=>parsePlatformPremiumEligibilityEvent(value)).toThrow();}
 for(const key of ["protocol","state","realm","nativeObservationRefs"]){expect(()=>parsePlatformPremiumEligibilityEvent({...legacy(),paidEligible:false,paidThroughUtc:null,validUntilUtc:null,[key]:null})).toThrow();}
});
