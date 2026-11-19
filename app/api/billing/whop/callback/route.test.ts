import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {NextRequest} from "next/server";
import {createWhopPrivacyReference} from "@/src/modules/platform/server/billing/whop-ai-review-identity";
import {platformAuthCookieName} from "@/src/modules/platform/server/authentication/platform-auth-cookies";
const fixture=vi.hoisted(()=>({user:"user",realm:"sandbox" as "sandbox"|undefined,config:"image1",link:vi.fn(),provider:vi.fn(),native:vi.fn()}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope",()=>({requireTraderLinkPlatformRequestIdentity:()=>({scope:{userId:fixture.user}})}));
vi.mock("@/src/modules/platform/server/billing/whop-ai-review-staging-identity",()=>({requireWhopOAuthRequestIdentity:()=>({scope:{userId:fixture.user}}),loadWhopOAuthRequestConfiguration:()=>({realm:fixture.realm,identityHmacKey:"x".repeat(32),stagingBinding:fixture.config}),createWhopOAuthFlowBinding:(config:{realm?:string;stagingBinding:string},user:string)=>[config.realm??"live",config.stagingBinding,user].join("_")}));
vi.mock("@/src/modules/platform/server/billing/whop-ai-review-oauth",async importOriginal=>({...await importOriginal<object>(),readWhopOAuthSubject:fixture.provider}));
vi.mock("@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository",()=>({WhopAiReviewEntitlementRepository:class{linkUser=fixture.link;}}));
vi.mock("@/src/modules/platform/server/database/open-platform-database",()=>({withPlatformDatabase:(_options:unknown,run:(db:object)=>unknown)=>run({})}));
vi.mock("@/src/modules/platform/server/billing/whop-ai-review-staging-native-link",()=>({bindWhopAiReviewStagingNativeLink:fixture.native}));
import {GET} from "./route";
function request(changes:Record<string,string>={},state="sandbox.state",code="code"){
 const cookies={state,verifier:"verifier",user:createWhopPrivacyReference("user","platform_user","x".repeat(32)),flow:"sandbox_image1_user",...changes};
 return new NextRequest("https://example.com/api/billing/whop/callback?"+new URLSearchParams({state,code}),{headers:{cookie:Object.entries(cookies).map(([key,value])=>platformAuthCookieName("traderlink_whop_oauth_"+key)+"="+encodeURIComponent(value)).join("; ")}});
}
beforeEach(()=>{fixture.user="user";fixture.realm="sandbox";fixture.config="image1";fixture.link.mockReset().mockReturnValue("linked");fixture.provider.mockReset().mockResolvedValue("synthetic_buyer");fixture.native.mockReset().mockReturnValue({kind:"bound"});});
afterEach(()=>vi.unstubAllEnvs());
it("links only genuine userinfo HMAC after both config checks and clears all cookies",async()=>{
 const response=await GET(request());expect(response.headers.get("location")).toContain("whop=connected");expect(fixture.link).toHaveBeenCalledWith("user",createWhopPrivacyReference("synthetic_buyer","user","x".repeat(32)));
 expect(response.headers.get("set-cookie")).toContain("traderlink_whop_oauth_flow=;");expect(response.headers.get("set-cookie")).not.toContain("synthetic_buyer");
});
it.each(["state","verifier","user","flow"])("refuses missing %s before provider I/O",async key=>{const response=await GET(request({[key]:""}));expect(response.headers.get("location")).toContain("whop=invalid-state");expect(fixture.provider).not.toHaveBeenCalled();expect(fixture.link).not.toHaveBeenCalled();});
it("refuses changed current user",async()=>{fixture.user="other";await GET(request());expect(fixture.provider).not.toHaveBeenCalled();});
it("refuses changed image/config before exchange",async()=>{fixture.config="image2";await GET(request());expect(fixture.provider).not.toHaveBeenCalled();});
it("refuses stage-to-live downgrade even if realm companion cookie is removed",async()=>{fixture.realm=undefined;await GET(request({flow:""}));expect(fixture.provider).not.toHaveBeenCalled();});
it.each(["user","config"])("refuses changed %s after provider await before persistence",async key=>{
 fixture.provider.mockImplementation(async()=>{if(key==="user")fixture.user="other";else fixture.config="image2";return"synthetic_buyer";});const response=await GET(request());expect(response.headers.get("location")).toContain("whop=invalid-state");expect(fixture.link).not.toHaveBeenCalled();
});
it("handles provider failure without linking",async()=>{fixture.provider.mockRejectedValue(Error("provider"));const response=await GET(request());expect(response.headers.get("location")).toContain("whop=unavailable");expect(fixture.link).not.toHaveBeenCalled();});
it("retains conflict behavior",async()=>{fixture.link.mockReturnValue("conflict");expect((await GET(request())).headers.get("location")).toContain("whop=conflict");});
it("reads actual production host-prefixed cookies",async()=>{vi.stubEnv("NODE_ENV","production");vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN","https://example.com");expect((await GET(request())).headers.get("location")).toContain("whop=connected");});
it("preserves already-issued live flow compatibility",async()=>{fixture.realm=undefined;expect((await GET(request({flow:""},"state"))).headers.get("location")).toContain("whop=connected");});

it("uses only the genuine server userinfo subject for the native identity hook",async()=>{
 const response=await GET(request());expect(response.headers.get("location")).not.toContain("whopNative=held");expect(fixture.native).toHaveBeenCalledWith(expect.objectContaining({linkedUserId:"user",justVerifiedSubject:"synthetic_buyer"}));
});
it("preserves the real canonical link while marking native qualification held",async()=>{
 fixture.native.mockReturnValue({kind:"held"});const response=await GET(request());expect(response.headers.get("location")).toContain("whop=connected&whopNative=held");expect(fixture.link).toHaveBeenCalledTimes(1);
});
it("never calls native binding for live or conflicting canonical links",async()=>{
 fixture.realm=undefined;await GET(request({flow:""},"state"));expect(fixture.native).not.toHaveBeenCalled();
 fixture.realm="sandbox";fixture.link.mockReturnValue("conflict");await GET(request());expect(fixture.native).not.toHaveBeenCalled();
});

it.each(["connected","conflict","invalid-state","unavailable"] as const)("uses configured public origin and clears cookies for %s behind Railway",async status=>{
 vi.stubEnv("NODE_ENV","production");vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN","https://stage.example.com");
 if(status==="conflict")fixture.link.mockReturnValue("conflict");
 if(status==="unavailable")fixture.provider.mockRejectedValue(Error("provider"));
 const source=request(status==="invalid-state"?{state:""}:{});
 const req=new NextRequest("http://0.0.0.0:8080/api/billing/whop/callback"+source.nextUrl.search,{headers:{cookie:source.headers.get("cookie")!,"x-forwarded-host":"attacker.example","x-forwarded-proto":"http"}});
 const response=await GET(req);
 expect(response.headers.get("location")).toBe("https://stage.example.com/account?whop="+status);
 for(const name of ["state","verifier","user","flow"])expect(response.headers.get("set-cookie")).toContain("__Host-traderlink_whop_oauth_"+name+"=;");
 if(status==="invalid-state")expect(fixture.provider).not.toHaveBeenCalled();
});
