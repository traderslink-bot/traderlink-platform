import {timingSafeEqual} from 'node:crypto';
import {NextResponse,type NextRequest} from 'next/server';
import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {deletePlatformAuthCookie} from '@/src/modules/platform/server/authentication/platform-auth-cookies';
import {createWhopPrivacyReference} from '@/src/modules/platform/server/billing/whop-ai-review-identity';
import {withPlatformDatabase} from '@/src/modules/platform/server/database/open-platform-database';
import {loadCoachingWhopRuntime} from '@/src/modules/communities/server/coaching-whop-runtime';
import {COACHING_WHOP_OAUTH_COOKIE,coachingOAuthStateDigest,readCoachingWhopOAuthUser} from '@/src/modules/communities/server/coaching-whop-oauth';
import {CoachingPaymentIdentityRepository} from '@/src/modules/communities/server/coaching-payment-identity-repository';
export const runtime='nodejs';
const equal=(a:string,b:string)=>a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export async function GET(request:NextRequest){
 let returnPath='/coaching/profile',result='unavailable';
 try{
  const identity=requireCoachingPilotRequestIdentity(request.headers),config=loadCoachingWhopRuntime();if(!config.oauthClientId)throw new Error('OAuth unavailable.');
  const cookie=JSON.parse(request.cookies.get(COACHING_WHOP_OAUTH_COOKIE)?.value??'null') as {state:string;verifier:string;userRef:string;purpose:string;returnPath:string}|null;
  const state=request.nextUrl.searchParams.get('state'),code=request.nextUrl.searchParams.get('code');
  if(!cookie||!state||!code||code.length>2048||!equal(cookie.state,coachingOAuthStateDigest(state))||!equal(cookie.userRef,createWhopPrivacyReference(identity.scope.userId,'platform_user',config.identityKey)))throw new Error('Invalid connection state.');
  if(cookie.returnPath.startsWith('/coaching')&&!cookie.returnPath.includes('\\'))returnPath=cookie.returnPath;
  const user=await readCoachingWhopOAuthUser({environment:config.environment,clientId:config.oauthClientId,origin:config.applicationOrigin,code,verifier:cookie.verifier},fetch);
  const now=new Date().toISOString();
  withPlatformDatabase({mode:'runtime'},db=>new CoachingPaymentIdentityRepository(db,config.environment,config.identityKey).linkUser(identity.scope.userId,user.providerUserId,now));
  if(cookie.purpose==='coach'){
   if(!user.email||!user.emailVerified)throw new Error('A verified Whop email is required for account onboarding.');
   const account=await config.client.createConnectedAccount({coachUserId:identity.scope.userId,email:user.email,title:identity.displayName??'Coach'});
   if(typeof account.id!=='string')throw new Error('Account onboarding needs review.');
   const verified=await config.client.retrieveAccount(account.id);
   withPlatformDatabase({mode:'runtime'},db=>new CoachingPaymentIdentityRepository(db,config.environment,config.identityKey).verifyMerchant(identity.scope.userId,config.platformAccountId,verified,now));
  }
  result='connected';
 }catch{}
 const target=new URL(returnPath,request.nextUrl.origin);target.searchParams.set('payment',result);
 const response=NextResponse.redirect(target);deletePlatformAuthCookie(response,request,COACHING_WHOP_OAUTH_COOKIE);return response;
}
