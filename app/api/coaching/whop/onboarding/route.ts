import {NextResponse,type NextRequest} from 'next/server';
import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';
import {loadCoachingWhopRuntime} from '@/src/modules/communities/server/coaching-whop-runtime';
import {CoachingPaymentIdentityRepository} from '@/src/modules/communities/server/coaching-payment-identity-repository';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 try{
  const identity=requireCoachingPilotRequestIdentity(request.headers),config=loadCoachingWhopRuntime();
  const merchant=withReadonlyPlatformDatabase({},db=>new CoachingPaymentIdentityRepository(db,config.environment,config.identityKey).readMerchant(identity.scope.userId));
  if(!merchant)throw new Error('Connect your coach payment account first.');
  return NextResponse.redirect(await config.client.createOnboardingLink(merchant.merchantAccountId));
 }catch{return NextResponse.redirect(new URL('/coaching/profile?payment=unavailable',request.url));}
}
