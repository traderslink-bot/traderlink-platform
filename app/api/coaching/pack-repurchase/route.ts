import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';
import {readPackRepurchaseStatus} from '@/src/modules/communities/server/independent-coaching-pack-repurchase';

export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store'};
/** Original-party read only: no receipts, provider lookup, admission, grants or work on GET. */
export async function GET(request:Request){
 let actorUserId:string;try{actorUserId=requireCoachingPilotRequestIdentity(request.headers).scope.userId;}catch{return Response.json({error:'Sign in to continue.'},{status:401,headers});}
 const q=new URL(request.url).searchParams,enrollmentId=q.get('enrollmentId');
 if(!enrollmentId||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(enrollmentId))return Response.json({error:'Choose the original coaching plan.'},{status:400,headers});
 try{
  const result=withReadonlyPlatformDatabase({},db=>readPackRepurchaseStatus(db,{enrollmentId,actorUserId,quotedPrice:q.get('quotedPrice')??undefined}));
  return Response.json(result,{headers});
 }catch(error){
  const text=error instanceof Error&&!/SQLITE|database|JSON|Unexpected|undefined/i.test(error.message)?error.message:'This pack confirmation is unavailable. Reopen your coaching plan.';
  return Response.json({error:text},{status:403,headers});
 }
}
