import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';
import {coachingPaymentConfiguration,coachingDirectPaymentStorageReady} from '@/src/modules/communities/server/coaching-payment-readiness';
export const runtime='nodejs';
export async function GET(request:Request){
 try{
  const identity=requireCoachingPilotRequestIdentity(request.headers),config=coachingPaymentConfiguration();
  const state=withReadonlyPlatformDatabase({},db=>{
   if(!coachingDirectPaymentStorageReady(db)||!config.environment)return {merchantConnected:false,identityConnected:false};
   const merchant=db.prepare("SELECT status FROM traderlink_coaching_merchant_connections WHERE environment=? AND coach_user_id=?").get(config.environment,identity.scope.userId) as {status:string}|undefined;
   const linked=db.prepare("SELECT 1 FROM traderlink_coaching_whop_identities WHERE environment=? AND user_id=?").get(config.environment,identity.scope.userId);
   return {merchantConnected:merchant?.status==='verified',identityConnected:Boolean(linked)};
  });
  return Response.json({available:config.enabled&&config.configured&&config.oauthConfigured,...state},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:'Sign in to view payment setup.'},{status:401,headers:{'Cache-Control':'private, no-store'}});}
}
