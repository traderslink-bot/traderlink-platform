import {NextResponse,type NextRequest} from 'next/server';
import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {setPlatformAuthCookie} from '@/src/modules/platform/server/authentication/platform-auth-cookies';
import {createWhopPrivacyReference} from '@/src/modules/platform/server/billing/whop-ai-review-identity';
import {loadCoachingWhopRuntime} from '@/src/modules/communities/server/coaching-whop-runtime';
import {COACHING_WHOP_OAUTH_COOKIE,coachingWhopAuthorizeUrl,createWhopOAuthPkce,coachingOAuthStateDigest} from '@/src/modules/communities/server/coaching-whop-oauth';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 try{
  const identity=requireCoachingPilotRequestIdentity(request.headers),config=loadCoachingWhopRuntime();
  if(!config.oauthClientId)throw new Error('OAuth setup unavailable.');
  const pkce=createWhopOAuthPkce(),purpose=request.nextUrl.searchParams.get('purpose')==='student'?'student':'coach';
  const returnPath=request.nextUrl.searchParams.get('returnTo');
  const safeReturn=returnPath&&returnPath.startsWith('/coaching')&&!returnPath.startsWith('//')&&!returnPath.includes('\\')?returnPath:'/coaching/profile';
  const response=NextResponse.redirect(coachingWhopAuthorizeUrl({environment:config.environment,clientId:config.oauthClientId,origin:config.applicationOrigin,state:pkce.state,challenge:pkce.challenge}));
  setPlatformAuthCookie(response,request,COACHING_WHOP_OAUTH_COOKIE,JSON.stringify({state:coachingOAuthStateDigest(pkce.state),verifier:pkce.verifier,userRef:createWhopPrivacyReference(identity.scope.userId,'platform_user',config.identityKey),purpose,returnPath:safeReturn}),600);
  return response;
 }catch{return NextResponse.redirect(new URL('/coaching/profile?payment=unavailable',request.url));}
}
