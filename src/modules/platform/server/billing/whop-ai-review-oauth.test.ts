import {afterEach,expect,it,vi} from "vitest";
import {createHash} from "node:crypto";
import {buildWhopAuthorizeUrl,createWhopOAuthPkce,readWhopOAuthSubject} from "./whop-ai-review-oauth";
const configuration={clientId:"app_test",redirectUri:"https://example.com/callback",companyId:"biz_test",identityHmacKey:"x".repeat(32)};
afterEach(()=>vi.unstubAllGlobals());
it("uses independent random state and S256 PKCE with openid only",()=>{
 const one=createWhopOAuthPkce(),two=createWhopOAuthPkce();expect(one.state).not.toBe(two.state);expect(one.verifier).not.toBe(two.verifier);
 expect(one.challenge).toBe(createHash("sha256").update(one.verifier).digest("base64url"));
 const url=buildWhopAuthorizeUrl({configuration,state:one.state,challenge:one.challenge});
 expect(url.searchParams.get("nonce")).toBe(one.state);expect(url.origin+url.pathname).toBe("https://api.whop.com/oauth/authorize");expect(url.searchParams.get("scope")).toBe("openid");expect(url.searchParams.get("code_challenge_method")).toBe("S256");
});
it.each([undefined,"sandbox"] as const)("uses realm %s public-client endpoints without merchant credentials",async realm=>{
 const origin=realm==="sandbox"?"https://sandbox-api.whop.com":"https://api.whop.com";
 const fetch=vi.fn().mockResolvedValueOnce(Response.json({access_token:"synthetic_token"})).mockResolvedValueOnce(Response.json({sub:"synthetic_user"}));vi.stubGlobal("fetch",fetch);
 await expect(readWhopOAuthSubject({configuration:{...configuration,realm},code:"code",verifier:"verifier"})).resolves.toBe("synthetic_user");
 expect(fetch.mock.calls[0][0]).toBe(origin+"/oauth/token");expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({grant_type:"authorization_code",code:"code",redirect_uri:configuration.redirectUri,client_id:"app_test",code_verifier:"verifier"});
 expect(fetch.mock.calls[1][0]).toBe(origin+"/oauth/userinfo");expect(fetch.mock.calls[1][1].headers.Authorization).toBe("Bearer synthetic_token");
});
it.each([{access_token:null},{access_token:""},null])("refuses malformed token response %#",async value=>{
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue(Response.json(value)));await expect(readWhopOAuthSubject({configuration,code:"c",verifier:"v"})).rejects.toThrow();
});
it.each([{sub:null},{sub:""},{sub:"   "},null])("refuses malformed userinfo %#",async value=>{
 vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(Response.json({access_token:"synthetic"})).mockResolvedValueOnce(Response.json(value)));await expect(readWhopOAuthSubject({configuration,code:"c",verifier:"v"})).rejects.toThrow();
});

it.each([undefined,"sandbox"] as const)("selects realm %s for authorize while preserving the exact PKCE and identity-only request",realm=>{
 const url=buildWhopAuthorizeUrl({configuration:{...configuration,realm},state:"original-state",challenge:"original-challenge"});
 expect(url.origin).toBe(realm==="sandbox"?"https://sandbox-api.whop.com":"https://api.whop.com");
 expect(url.pathname).toBe("/oauth/authorize");
 expect(Object.fromEntries(url.searchParams)).toEqual({response_type:"code",client_id:"app_test",redirect_uri:configuration.redirectUri,scope:"openid",state:"original-state",nonce:"original-state",code_challenge:"original-challenge",code_challenge_method:"S256"});
});
