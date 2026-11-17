import {afterEach,expect,it,vi} from "vitest";
import {createHash} from "node:crypto";
import {buildWhopAuthorizeUrl,createWhopOAuthPkce,readWhopOAuthSubject} from "./whop-ai-review-oauth";
const configuration={clientId:"app_test",redirectUri:"https://example.com/callback",companyId:"biz_test",identityHmacKey:"x".repeat(32)};
afterEach(()=>vi.unstubAllGlobals());
it("uses independent random state and S256 PKCE with openid only",()=>{
 const one=createWhopOAuthPkce(),two=createWhopOAuthPkce();expect(one.state).not.toBe(two.state);expect(one.verifier).not.toBe(two.verifier);
 expect(one.challenge).toBe(createHash("sha256").update(one.verifier).digest("base64url"));
 const url=buildWhopAuthorizeUrl({configuration,state:one.state,challenge:one.challenge});
 expect(url.origin+url.pathname).toBe("https://api.whop.com/oauth/authorize");expect(url.searchParams.get("scope")).toBe("openid");expect(url.searchParams.get("code_challenge_method")).toBe("S256");
});
it("uses the provider-advertised public-client endpoints without merchant credentials",async()=>{
 const fetch=vi.fn().mockResolvedValueOnce(Response.json({access_token:"synthetic_token"})).mockResolvedValueOnce(Response.json({sub:"synthetic_user"}));vi.stubGlobal("fetch",fetch);
 await expect(readWhopOAuthSubject({configuration:{...configuration,realm:"sandbox"},code:"code",verifier:"verifier"})).resolves.toBe("synthetic_user");
 expect(fetch.mock.calls[0][0]).toBe("https://api.whop.com/oauth/token");expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({grant_type:"authorization_code",code:"code",redirect_uri:configuration.redirectUri,client_id:"app_test",code_verifier:"verifier"});
 expect(fetch.mock.calls[1][0]).toBe("https://api.whop.com/oauth/userinfo");expect(fetch.mock.calls[1][1].headers.Authorization).toBe("Bearer synthetic_token");
});
it.each([{access_token:null},{access_token:""},null])("refuses malformed token response %#",async value=>{
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json(value)));await expect(readWhopOAuthSubject({configuration,code:"c",verifier:"v"})).rejects.toThrow();
});
it.each([{sub:null},{sub:""},{sub:"   "},null])("refuses malformed userinfo %#",async value=>{
 vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(Response.json({access_token:"synthetic"})).mockResolvedValueOnce(Response.json(value)));await expect(readWhopOAuthSubject({configuration,code:"c",verifier:"v"})).rejects.toThrow();
});
