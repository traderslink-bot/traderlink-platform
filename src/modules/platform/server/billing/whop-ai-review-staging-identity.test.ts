import {NextRequest} from "next/server";
import {afterEach,beforeEach,expect,it,vi} from "vitest";
const fixture=vi.hoisted(()=>({guard:vi.fn(),identity:{mode:"platform_session",sessionId:"session",scope:{userId:"user"}},subjects:[{auth_subject:"12345"}],db:{name:"synthetic"}}));
vi.mock("@/src/modules/communities/server/community-staging-qa-target",()=>({assertCommunityStagingQaTarget:fixture.guard}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope",()=>({requireTraderLinkPlatformRequestIdentity:()=>{throw Error("Dashboard not allowed");},requireTraderLinkPlatformAuthenticatedRequestIdentity:()=>fixture.identity}));
vi.mock("@/src/modules/platform/server/authentication/platform-discord-configuration",()=>({resolveTraderLinkDiscordGuildId:()=>"1559172784813514803"}));
vi.mock("@/src/modules/platform/server/database/open-platform-database",()=>({withPlatformDatabase:(_options:unknown,run:(db:unknown)=>unknown)=>run({...fixture.db,prepare:()=>({all:()=>fixture.subjects})})}));
import {createWhopOAuthFlowBinding,loadWhopOAuthRequestConfiguration,requireWhopOAuthRequestIdentity} from "./whop-ai-review-staging-identity";
import {loadWhopAiReviewOAuthConfiguration,loadWhopAiReviewStagingOAuthConfiguration,readWhopAiReviewConfigurationHealth} from "./whop-ai-review-configuration";
const origin="https://traderlink-platform-staging-staging.up.railway.app",redirect=origin+"/api/billing/whop/callback";
const stage:NodeJS.ProcessEnv={NODE_ENV:"test",TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE:"disabled_isolated_staging",WHOP_OAUTH_CLIENT_ID:"app_test",WHOP_OAUTH_REDIRECT_URI:redirect,TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY:"x".repeat(32)};
beforeEach(()=>{for(const [key,value]of Object.entries(stage))vi.stubEnv(key,value);vi.stubEnv("TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT","12345,12346");fixture.guard.mockReset();fixture.identity={mode:"platform_session",sessionId:"session",scope:{userId:"user"}};fixture.subjects=[{auth_subject:"12345"}];});
afterEach(()=>vi.unstubAllEnvs());
it("qualifies target, real-session port and two selected subjects; no commerce config invented",()=>{
 const value=loadWhopOAuthRequestConfiguration(new NextRequest(origin+"/api/billing/whop/connect"),"user");expect(value.realm).toBe("sandbox");expect(value.stagingBinding).toBeTruthy();expect(fixture.guard).toHaveBeenCalledTimes(1);
 expect(readWhopAiReviewConfigurationHealth(stage).readyForEntitlement).toBe(false);expect(()=>loadWhopAiReviewOAuthConfiguration(stage)).toThrow();
});
it.each(["WHOP_OAUTH_CLIENT_ID","WHOP_OAUTH_REDIRECT_URI","TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY"])("refuses missing %s",key=>{expect(()=>loadWhopAiReviewStagingOAuthConfiguration({...stage,[key]:""})).toThrow();});
it("refuses alternate callback, wrong mode and short key",()=>{
 for(const changes of [{WHOP_OAUTH_REDIRECT_URI:redirect+"?x=1"},{TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE:"enabled"},{TRADERLINK_PLATFORM_WHOP_IDENTITY_HMAC_KEY:"short"}])expect(()=>loadWhopAiReviewStagingOAuthConfiguration({...stage,...changes})).toThrow();
});
it("refuses failed actual-target guard before any binding",()=>{fixture.guard.mockImplementation(()=>{throw Error("native target refused");});expect(()=>loadWhopOAuthRequestConfiguration(new NextRequest(origin),"user")).toThrow();});
it.each(["other-user","development","missing-session","unselected","duplicate-selection","extra-identity","wrong-origin","aborted"])("refuses %s",kind=>{
 const abort=new AbortController();let request=new NextRequest(origin,{signal:abort.signal}),user="user";
 if(kind==="other-user")user="other";if(kind==="development")fixture.identity.mode="local_development";if(kind==="missing-session")fixture.identity.sessionId="";
 if(kind==="unselected")fixture.subjects=[{auth_subject:"98765"}];if(kind==="extra-identity")fixture.subjects.push({auth_subject:"12346"});
 if(kind==="duplicate-selection")vi.stubEnv("TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT","12345,12345");
 if(kind==="wrong-origin")request=new NextRequest("https://other.example");if(kind==="aborted")abort.abort();
 expect(()=>loadWhopOAuthRequestConfiguration(request,user)).toThrow();
});
it("binds realm, user, client, callback, HMAC key and actual image fingerprint",()=>{
 const config={...loadWhopAiReviewStagingOAuthConfiguration(stage),stagingBinding:"image1"};const binding=createWhopOAuthFlowBinding(config,"user");
 expect(binding).toMatch(/^[a-f0-9]{64}$/);expect(binding).not.toContain(config.identityHmacKey);
 for(const changes of [{realm:undefined},{clientId:"app_other"},{redirectUri:redirect+"x"},{identityHmacKey:"y".repeat(32)},{stagingBinding:"image2"}])expect(createWhopOAuthFlowBinding({...config,...changes},"user")).not.toBe(binding);
 expect(createWhopOAuthFlowBinding(config,"other")).not.toBe(binding);
});
it("preserves normal live gate",()=>{vi.stubEnv("TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE","enabled");expect(()=>loadWhopOAuthRequestConfiguration(new NextRequest(origin),"user")).toThrow();expect(fixture.guard).not.toHaveBeenCalled();});

it("binds the actual issued session and native Discord identity",()=>{
 const request=new NextRequest(origin);const first=loadWhopOAuthRequestConfiguration(request,"user");
 fixture.identity.sessionId="replacement";expect(loadWhopOAuthRequestConfiguration(request,"user").stagingBinding).not.toBe(first.stagingBinding);
 fixture.identity.sessionId="session";fixture.subjects=[{auth_subject:"12346"}];expect(loadWhopOAuthRequestConfiguration(request,"user").stagingBinding).not.toBe(first.stagingBinding);
});

it("uses the trusted configured public origin behind Railway's internal request URL",()=>{
 vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN",origin);
 expect(loadWhopOAuthRequestConfiguration(new NextRequest("http://0.0.0.0:8080/api/billing/whop/connect"),"user").realm).toBe("sandbox");
 vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN","https://other.example");
 expect(()=>loadWhopOAuthRequestConfiguration(new NextRequest(origin),"user")).toThrow();
});

it("allows selected stage sign-in before purchase without changing live dashboard policy",()=>{
 const request=new NextRequest(origin);expect(requireWhopOAuthRequestIdentity(request).scope.userId).toBe("user");
 vi.stubEnv("TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE","enabled");expect(()=>requireWhopOAuthRequestIdentity(request)).toThrow("Dashboard not allowed");
});
it("does not adopt attacker forwarded origin over trusted server configuration",()=>{
 vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN","https://other.example");
 const request=new NextRequest("http://0.0.0.0:8080/api/billing/whop/connect",{headers:{"x-forwarded-host":new URL(origin).host,"x-forwarded-proto":"https"}});
 expect(()=>loadWhopOAuthRequestConfiguration(request,"user")).toThrow();
});
