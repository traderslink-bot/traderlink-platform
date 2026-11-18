import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {NextRequest} from "next/server";
const fixture=vi.hoisted(()=>({user:"user",session:"session",realm:"sandbox",catalog:"e".repeat(64),schema:"a".repeat(64),badLedger:false,erased:false,qualified:true,liveScope:false,
 links:[] as {whop_user_ref_hmac:string}[],authorities:[{authority_key:"authority"}],scopeCount:1,abortAfter:false,record:vi.fn(),guard:vi.fn(),hasCore:true,bind:vi.fn()}));
vi.mock("@/src/modules/communities/server/community-staging-qa-target",()=>({assertCommunityStagingQaTarget:fixture.guard}));
vi.mock("./whop-ai-review-staging-identity",()=>({requireWhopOAuthRequestIdentity:()=>({mode:"platform_session",sessionId:fixture.session,scope:{userId:fixture.user,workspaceId:"workspace",workspaceRole:"owner"}}),loadWhopOAuthRequestConfiguration:()=>({realm:fixture.realm,identityHmacKey:"x".repeat(32),redirectUri:"https://traderlink-platform-staging-staging.up.railway.app/api/billing/whop/callback"})}));
vi.mock("@/src/modules/platform/server/database/platform-migration-registry",()=>({readAppliedPlatformMigrations:()=>fixture.badLedger?[]:[...Array(203).fill({}),{migration_id:"0216_platform_premium_current_access_events",module_namespace:"platform",execution_order:291,checksum_sha256:"a40694720ff085f768b60cc08d5c7971a53f165371aeeed350920f9e076ea539"}]}));
const ticket={scope:{userId:"user"},originalFixture:true};
vi.mock("@/src/modules/platform/server/privacy/platform-erasure-admission",()=>{
 const core={get schemaSha256(){return fixture.schema;},qualificationReceipt:()=>({profileCatalogSha256:fixture.catalog}),runForUsers:(_users:string[],run:()=>unknown)=>{if(fixture.erased)throw Error("Native profile refused");return run();},assertLivePrincipal:()=>{},memberRepository:()=>({captureV2:()=>({kind:"snapshot",ticket,policy:{state:"active",guildId:"1559172784813514803",offerScopes:Array(fixture.scopeCount).fill({scopeRef:"exact_owner_scope",environment:fixture.liveScope?"live":"sandbox"}),nativeQualification:fixture.qualified?{}:null}}),recordVerifiedWhopSubjectBindingV2:fixture.record})};
 fixture.bind.mockImplementation(()=>core);
 return{currentPlatformErasureAdmission:()=>fixture.hasCore?core:null,PlatformErasureAdmission:{bind:fixture.bind}};
});
import {createWhopPrivacyReference} from "./whop-ai-review-identity";
import {bindWhopAiReviewStagingNativeLink} from "./whop-ai-review-staging-native-link";
const origin="https://traderlink-platform-staging-staging.up.railway.app";
let abort:AbortController;
const db={open:true,readonly:false,inTransaction:false,prepare:(sql:string)=>({all:()=>sql.includes("platform_whop_user_links")?fixture.links:fixture.authorities})};
function input(){return{database:db as never,request:new NextRequest(origin+"/api/billing/whop/callback",{signal:abort.signal}),linkedUserId:"user",justVerifiedSubject:"actual_userinfo_subject"};}
beforeEach(()=>{abort=new AbortController();fixture.user="user";fixture.session="session";fixture.realm="sandbox";fixture.schema="a".repeat(64);fixture.catalog="e".repeat(64);fixture.badLedger=false;fixture.erased=false;fixture.qualified=true;fixture.liveScope=false;fixture.scopeCount=1;fixture.hasCore=true;fixture.links=[{whop_user_ref_hmac:createWhopPrivacyReference("actual_userinfo_subject","user","x".repeat(32))}];fixture.authorities=[{authority_key:"authority"}];fixture.guard.mockReset();fixture.record.mockReset().mockReturnValue({kind:"bound"});
 vi.stubEnv("PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256","e".repeat(64));vi.stubEnv("TRADERLINK_PLATFORM_ISOLATED_STAGING_SCHEMA_SHA256","a".repeat(64));});
afterEach(()=>vi.unstubAllEnvs());
it("consumes only a newly captured original V2, exact native scope and just-verified canonical subject",()=>{
 expect(bindWhopAiReviewStagingNativeLink(input())).toEqual({kind:"bound"});expect(fixture.record).toHaveBeenCalledWith(ticket,"exact_owner_scope","actual_userinfo_subject");
});
it("returns exact duplicate without relabeling it as paid proof",()=>{fixture.record.mockReturnValue({kind:"duplicate"});expect(bindWhopAiReviewStagingNativeLink(input())).toEqual({kind:"duplicate"});});
it.each(["cross-user","old-source","wrong-catalog","wrong-schema","expired-profile","unqualified-policy","wrong-scope-realm","ambiguous-scope","canonical-mismatch","ambiguous-link","missing-authority","cancelled","live","no-session"])("holds %s before native binding",kind=>{
 if(kind==="cross-user")fixture.user="other";if(kind==="old-source")fixture.badLedger=true;if(kind==="wrong-catalog")fixture.catalog="f".repeat(64);if(kind==="wrong-schema")fixture.schema="b".repeat(64);
 if(kind==="expired-profile")fixture.erased=true;if(kind==="unqualified-policy")fixture.qualified=false;if(kind==="wrong-scope-realm")fixture.liveScope=true;if(kind==="ambiguous-scope")fixture.scopeCount=2;
 if(kind==="canonical-mismatch")fixture.links=[{whop_user_ref_hmac:"0".repeat(64)}];if(kind==="ambiguous-link")fixture.links.push({...fixture.links[0]!});if(kind==="missing-authority")fixture.authorities=[];
 if(kind==="cancelled")abort.abort();if(kind==="live")fixture.realm="live";if(kind==="no-session")fixture.session="";
 expect(bindWhopAiReviewStagingNativeLink(input())).toEqual({kind:"held"});expect(fixture.record).not.toHaveBeenCalled();
});
it("holds source guard or conflicting-binding failure without fabricating any fallback",()=>{
 fixture.guard.mockImplementation(()=>{throw Error("Native source mismatch");});expect(bindWhopAiReviewStagingNativeLink(input()).kind).toBe("held");expect(fixture.record).not.toHaveBeenCalled();
 fixture.guard.mockReset();fixture.record.mockImplementation(()=>{throw Error("Native existing binding conflict");});expect(bindWhopAiReviewStagingNativeLink(input()).kind).toBe("held");
});
it("normal kernel binding uses reviewed server catalog only when absent",()=>{fixture.hasCore=false;expect(bindWhopAiReviewStagingNativeLink(input()).kind).toBe("bound");expect(fixture.bind).toHaveBeenCalledWith(db,expect.objectContaining({participantStatements:[],profileCatalogSha256:"e".repeat(64)}));});
it("cancellation after binding refuses the native writer operation",()=>{fixture.record.mockImplementation(()=>{abort.abort();return{kind:"bound"};});expect(bindWhopAiReviewStagingNativeLink(input()).kind).toBe("held");});
