import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {readIndependentAssignedLesson} from '@/src/modules/communities/server/independent-coaching-lesson-management';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';

export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store'};

export async function GET(request:Request){
 let actorUserId:string;
 try{actorUserId=requireCoachingPilotRequestIdentity(request.headers).scope.userId;}
 catch{return Response.json({error:'Sign in to continue.'},{status:401,headers});}
 const query=new URL(request.url).searchParams,planId=query.get('planId'),enrollmentId=query.get('enrollmentId'),workId=query.get('workId');
 if(!planId||!enrollmentId||!workId)return Response.json({error:'Choose a lesson assignment.'},{status:400,headers});
 try{
  const assignment=withReadonlyPlatformDatabase({},db=>readIndependentAssignedLesson(db,{actorUserId,planId,enrollmentId,workId,atUtc:new Date().toISOString()}));
  return Response.json(assignment,{headers});
 }catch{return Response.json({error:'This lesson assignment is unavailable.'},{status:403,headers});}
}
