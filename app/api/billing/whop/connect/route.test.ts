import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {NextRequest} from "next/server";
const fixture=vi.hoisted(()=>({realm:"sandbox" as "sandbox"|undefined,unavailable:false}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope",()=>({requireTraderLinkPlatformRequestIdentity:()=>({scope:{userId:"user"}})}));
vi.mock("@/src/modules/platform/server/billing/whop-ai-review-staging-identity",()=>({requireWhopOAuthRequestIdentity:()=>({scope:{userId:"user"}}),loadWhopOAuthRequestConfiguration:()=>{if(fixture.unavailable)throw Error("unavailable");return{realm:fixture.realm,clientId:"app_test",redirectUri:"https://example.com/callback",identityHmacKey:"x".repeat(32)};},createWhopOAuthFlowBinding:()=>"synthetic_flow_binding"}));
import {GET} from "./route";
afterEach(()=>vi.unstubAllEnvs());
beforeEach(()=>{fixture.realm="sandbox";fixture.unavailable=false;});
it("issues sandbox-marked state with private finite PKCE, user and realm cookies",async()=>{
 const response=await GET(new NextRequest("https://example.com/api/billing/whop/connect"));const location=new URL(response.headers.get("location")!);
 expect(location.searchParams.get("state")).toMatch(/^sandbox\./);expect(location.searchParams.get("scope")).toBe("openid");
 const cookies=response.headers.get("set-cookie")!;for(const name of ["state","verifier","user","flow"])expect(cookies).toContain("traderlink_whop_oauth_"+name+"=");
 expect(cookies).toContain("Max-Age=600");expect(cookies).toContain("HttpOnly");expect(cookies).toContain("SameSite=Lax");
});
it("preserves live public-client URL and unmarked state",async()=>{fixture.realm=undefined;const response=await GET(new NextRequest("https://example.com/api/billing/whop/connect"));const url=new URL(response.headers.get("location")!);expect(url.origin).toBe("https://api.whop.com");expect(url.searchParams.get("state")).not.toMatch(/^sandbox\./);});
it("redirects unavailable without authorization cookies",async()=>{fixture.unavailable=true;const response=await GET(new NextRequest("https://example.com/api/billing/whop/connect"));expect(response.headers.get("location")).toBe("https://example.com/account?whop=unavailable");expect(response.headers.get("set-cookie")).toBeNull();});

it("uses the configured public origin for unavailable redirects behind Railway",async()=>{
 vi.stubEnv("NODE_ENV","production");vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN","https://stage.example.com");fixture.unavailable=true;
 const response=await GET(new NextRequest("http://0.0.0.0:8080/api/billing/whop/connect",{headers:{"x-forwarded-host":"attacker.example","x-forwarded-proto":"http"}}));
 expect(response.headers.get("location")).toBe("https://stage.example.com/account?whop=unavailable");expect(response.headers.get("set-cookie")).toBeNull();
});
