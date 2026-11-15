import {loadCoachingWhopRuntime} from '@/src/modules/communities/server/coaching-whop-runtime';
import {parseSignedCoachingWhopEvent} from '@/src/modules/communities/server/coaching-whop-event';
import {CoachingDirectPaymentInbox} from '@/src/modules/communities/server/coaching-direct-payment-inbox';
import {coachingDirectPaymentStorageReady} from '@/src/modules/communities/server/coaching-payment-readiness';
import {withPlatformDatabase} from '@/src/modules/platform/server/database/open-platform-database';
export const runtime='nodejs';
export async function POST(request:Request){
 let configuration:ReturnType<typeof loadCoachingWhopRuntime>;
 try{configuration=loadCoachingWhopRuntime();if(!configuration.webhookSecret)throw new Error('Unavailable');}catch{return Response.json({error:'Coaching payment events are not enabled.'},{status:503});}
 const rawBody=await request.text();if(rawBody.length>1000000)return Response.json({error:'Event too large.'},{status:413});
 try{
  const result=withPlatformDatabase({mode:'runtime'},db=>{
   if(!coachingDirectPaymentStorageReady(db))throw new Error('Unavailable');
   // Previously verified merchants remain eligible for historical payment/refund
   // receipts after disconnect. Purchase/buyer bindings still govern every event.
   const merchants=new Set((db.prepare("SELECT merchant_account_id FROM traderlink_coaching_merchant_connections WHERE environment=? AND platform_account_id=? AND status IN ('verified','disconnected')").all(configuration.environment,configuration.platformAccountId) as {merchant_account_id:string}[]).map(row=>row.merchant_account_id));
   const event=parseSignedCoachingWhopEvent({rawBody,webhookId:request.headers.get('webhook-id')??'',webhookTimestamp:request.headers.get('webhook-timestamp')??'',webhookSignature:request.headers.get('webhook-signature')??'',secret:configuration.webhookSecret!,allowedMerchantAccountIds:merchants});
   return event?new CoachingDirectPaymentInbox(db).enqueue(configuration.environment,event,new Date().toISOString()):'ignored';
  });
  // Acknowledge only after durable storage. Webhook bodies never grant work or access.
  return Response.json({received:true,result});
 }catch{return Response.json({error:'Event could not be verified or recorded.'},{status:400});}
}
