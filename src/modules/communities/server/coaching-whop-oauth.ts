import {createHash} from 'node:crypto';
import {createWhopOAuthPkce} from '../../platform/server/billing/whop-ai-review-oauth';
export {createWhopOAuthPkce};
export const COACHING_WHOP_OAUTH_COOKIE='traderlink_coaching_whop_oauth';

export function coachingWhopAuthorizeUrl(input:{environment:'sandbox'|'live';clientId:string;origin:string;state:string;challenge:string}):string{
  const host=input.environment==='sandbox'?'https://sandbox-api.whop.com':'https://api.whop.com';
  const url=new URL('/oauth/authorize',host);url.search=new URLSearchParams({response_type:'code',client_id:input.clientId,redirect_uri:new URL('/api/coaching/whop/callback',input.origin).href,scope:'openid profile email',state:input.state,code_challenge:input.challenge,code_challenge_method:'S256'}).toString();return url.href;
}
export function coachingOAuthStateDigest(value:string):string{return createHash('sha256').update(value).digest('hex');}
export async function readCoachingWhopOAuthUser(input:{environment:'sandbox'|'live';clientId:string;origin:string;code:string;verifier:string},transport:typeof fetch):Promise<{providerUserId:string;email:string|null;emailVerified:boolean}>{
  const host=input.environment==='sandbox'?'https://sandbox-api.whop.com':'https://api.whop.com';
  const response=await transport(`${host}/oauth/token`,{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json'},body:JSON.stringify({grant_type:'authorization_code',client_id:input.clientId,code:input.code,code_verifier:input.verifier,redirect_uri:new URL('/api/coaching/whop/callback',input.origin).href}),signal:AbortSignal.timeout(15000),cache:'no-store'});
  if(!response.ok)throw new Error('Whop identity connection could not be verified.');const token=await response.json() as {access_token?:unknown};if(typeof token.access_token!=='string')throw new Error('Whop identity connection could not be verified.');
  const userResponse=await transport(`${host}/oauth/userinfo`,{headers:{Authorization:`Bearer ${token.access_token}`},redirect:'manual',signal:AbortSignal.timeout(15000),cache:'no-store'});
  if(!userResponse.ok)throw new Error('Whop identity connection could not be verified.');const user=await userResponse.json() as {sub?:unknown;email?:unknown;email_verified?:unknown};if(typeof user.sub!=='string'||!user.sub)throw new Error('Whop identity connection could not be verified.');
  return {providerUserId:user.sub,email:typeof user.email==='string'?user.email:null,emailVerified:user.email_verified===true};
}
