// @vitest-environment node
import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {NextRequest} from "next/server";
const native=vi.hoisted(()=>({identity:vi.fn(),configuration:vi.fn(),database:vi.fn(),subject:vi.fn(),link:vi.fn(),bind:vi.fn()}));
vi.mock("./whop-ai-review-staging-identity",async importOriginal=>({...await importOriginal<typeof import("./whop-ai-review-staging-identity")>(),requireWhopOAuthRequestIdentity:native.identity,loadWhopOAuthRequestConfiguration:native.configuration}));
vi.mock("./whop-ai-review-oauth",async importOriginal=>({...await importOriginal<typeof import("./whop-ai-review-oauth")>(),readWhopOAuthSubject:native.subject}));
vi.mock("./whop-ai-review-entitlement-repository",()=>({WhopAiReviewEntitlementRepository:class{linkUser=native.link;}}));
vi.mock("./whop-ai-review-staging-native-link",()=>({bindWhopAiReviewStagingNativeLink:native.bind}));
vi.mock("../database/open-platform-database",()=>({withPlatformDatabase:native.database}));
import {GET as connect} from "@/app/api/billing/whop/connect/route";
import {GET as callback} from "@/app/api/billing/whop/callback/route";
import {createBillingWhopOAuthFlowBinding} from "./whop-account-connection";
import {createWhopOAuthFlowBinding} from "./whop-ai-review-staging-identity";
import {createWhopPrivacyReference} from "./whop-ai-review-identity";
import {platformAuthCookieName} from "../authentication/platform-auth-cookies";
import {WHOP_OAUTH_FLOW_COOKIE,WHOP_OAUTH_STATE_COOKIE,WHOP_OAUTH_VERIFIER_COOKIE,WHOP_OAUTH_USER_BINDING_COOKIE} from "./whop-ai-review-oauth";
const origin="https://stage.example.test",user="11111111-1111-4111-8111-111111111111",other="22222222-2222-4222-8222-222222222222";
const config={realm:"sandbox" as const,clientId:"app_synthetic",clientSecret:"synthetic-only",companyId:"biz_synthetic",identityHmacKey:"a".repeat(64),redirectUri:origin+"/api/billing/whop/callback"};
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv("NODE_ENV","production");vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN",origin);
 native.identity.mockReturnValue({mode:"platform_session",sessionId:"synthetic_session",scope:{userId:user}});native.configuration.mockReturnValue({...config});native.subject.mockResolvedValue("synthetic_whop_subject");native.link.mockReturnValue("linked");native.bind.mockReturnValue({kind:"bound"});native.database.mockImplementation((_options,operation)=>operation({}));});
afterEach(()=>vi.unstubAllEnvs());
function request(billing:boolean,options:{code?:string|null;state?:string;cookieState?:string;boundUser?:string;flow?:string}={}){
 const state=options.state??"sandbox."+(billing?"billing.":"")+"a".repeat(32);const cookieState=options.cookieState??state;
 const flow=options.flow??(billing?createBillingWhopOAuthFlowBinding(config,user,cookieState):createWhopOAuthFlowBinding(config,user));
 const cookies=[[WHOP_OAUTH_STATE_COOKIE,cookieState],[WHOP_OAUTH_VERIFIER_COOKIE,"synthetic_verifier"],[WHOP_OAUTH_USER_BINDING_COOKIE,createWhopPrivacyReference(options.boundUser??user,"platform_user",config.identityHmacKey)],[WHOP_OAUTH_FLOW_COOKIE,flow]].map(([name,value])=>platformAuthCookieName(name!)+"="+encodeURIComponent(value!)).join("; ");
 const url=new URL(origin+"/api/billing/whop/callback");url.searchParams.set("state",state);if(options.code!==null)url.searchParams.set("code",options.code??"synthetic_code");url.searchParams.set("returnTo","https://attacker.example");return new NextRequest(url,{headers:{cookie:cookies}});
}
it.each([false,true])("keeps fixed original/Billing connect failure landing: billing=%s",async billing=>{
 native.identity.mockImplementation(()=>{throw Error("not admitted");});const response=await connect(new NextRequest("http://0.0.0.0:8080/api/billing/whop/connect?"+(billing?"entry=billing&":"")+"returnTo=https://attacker.example",{headers:{"x-forwarded-host":"attacker.example"}}));
 expect(response.headers.get("location")).toBe(origin+(billing?"/account/membership":"/account")+"?whop=unavailable");expect(native.configuration).not.toHaveBeenCalled();expect(native.database).not.toHaveBeenCalled();
});
it.each([false,true])("binds original/Billing entry to actual state and keyed flow: billing=%s",async billing=>{
 const response=await connect(new NextRequest(origin+"/api/billing/whop/connect"+(billing?"?entry=billing":"")));const destination=new URL(response.headers.get("location")!);expect(destination.origin).toBe("https://sandbox-api.whop.com");const state=destination.searchParams.get("state")!;expect(state.startsWith("sandbox.billing.")).toBe(billing);
 const cookie=response.headers.getSetCookie().find(value=>value.startsWith(platformAuthCookieName(WHOP_OAUTH_FLOW_COOKIE)+"="))!;const value=decodeURIComponent(cookie.split(";")[0]!.split("=")[1]!);expect(value).toMatch(/^[a-f0-9]{64}$/);expect(value).toBe(billing?createBillingWhopOAuthFlowBinding(config,user,state):createWhopOAuthFlowBinding(config,user));expect(native.subject).not.toHaveBeenCalled();
});
it.each([false,true])("keeps successful original/Billing callback landing: billing=%s",async billing=>{
 const response=await callback(request(billing));expect(response.headers.get("location")).toBe(origin+(billing?"/account/membership":"/account")+"?whop=connected");expect(native.subject).toHaveBeenCalledTimes(1);expect(native.link).toHaveBeenCalledTimes(1);expect(native.bind).toHaveBeenCalledTimes(1);
});
it.each([false,true])("keeps provider failure original/Billing landing: billing=%s",async billing=>{
 native.subject.mockRejectedValue(Error("synthetic provider failure"));const response=await callback(request(billing));expect(response.headers.get("location")).toBe(origin+(billing?"/account/membership":"/account")+"?whop=unavailable");expect(native.link).not.toHaveBeenCalled();
});
it.each([false,true])("handles original/Billing cancellation without exchange: billing=%s",async billing=>{
 const response=await callback(request(billing,{code:null}));expect(response.headers.get("location")).toBe(origin+(billing?"/account/membership":"/account")+"?whop=invalid-state");expect(native.subject).not.toHaveBeenCalled();expect(native.link).not.toHaveBeenCalled();
});
it.each(["tag","user","configuration","state","unknown"])("refuses %s mismatch before provider exchange",async kind=>{
 const options:Parameters<typeof request>[1]=kind==="tag"?{flow:createWhopOAuthFlowBinding(config,user)}:kind==="user"?{boundUser:other}:kind==="state"?{cookieState:"sandbox.billing."+"b".repeat(32)}:kind==="unknown"?{state:"sandbox.unknown."+"a".repeat(32),flow:createWhopOAuthFlowBinding(config,user)}:{};
 if(kind==="configuration")native.configuration.mockReturnValue({...config,clientId:"app_rotated"});const response=await callback(request(true,options));expect(response.headers.get("location")).toBe(origin+"/account?whop=invalid-state");expect(native.subject).not.toHaveBeenCalled();expect(native.link).not.toHaveBeenCalled();
});
it("rechecks original configuration after provider I/O before linking",async()=>{
 native.configuration.mockReturnValueOnce({...config}).mockReturnValueOnce({...config,clientId:"app_rotated"});const response=await callback(request(true));expect(response.headers.get("location")).toBe(origin+"/account/membership?whop=invalid-state");expect(native.subject).toHaveBeenCalledTimes(1);expect(native.link).not.toHaveBeenCalled();
});
it("clears all four Host and legacy cookies on invalid state without provider exchange",async()=>{
 const response=await callback(new NextRequest(origin+"/api/billing/whop/callback?state=forged&code=untrusted&returnTo=https://attacker.example"));expect(response.headers.get("location")).toBe(origin+"/account?whop=invalid-state");const cookies=response.headers.getSetCookie();expect(cookies).toHaveLength(8);expect(new Set(cookies.map(value=>value.split("=")[0])).size).toBe(8);expect(cookies.every(value=>value.includes("Max-Age=0"))).toBe(true);expect(native.identity).not.toHaveBeenCalled();expect(native.subject).not.toHaveBeenCalled();
});

it("keeps production non-AI Billing entry disabled while preserving legacy live entry",async()=>{
 native.configuration.mockReturnValue({...config,realm:"live"});
 const blocked=await connect(new NextRequest(origin+"/api/billing/whop/connect?entry=billing"));expect(blocked.headers.get("location")).toBe(origin+"/account/membership?whop=unavailable");
 const legacy=await connect(new NextRequest(origin+"/api/billing/whop/connect"));expect(new URL(legacy.headers.get("location")!).origin).toBe("https://api.whop.com");expect(native.subject).not.toHaveBeenCalled();
});
it("refuses a live Billing callback before provider exchange",async()=>{
 native.configuration.mockReturnValue({...config,realm:"live"});const response=await callback(request(true,{state:"billing."+"a".repeat(32)}));expect(response.headers.get("location")).toBe(origin+"/account?whop=invalid-state");expect(native.subject).not.toHaveBeenCalled();expect(native.link).not.toHaveBeenCalled();
});
