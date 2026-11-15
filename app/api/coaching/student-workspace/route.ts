import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';
import {readIndependentStudentWorkspace} from '@/src/modules/communities/server/independent-coaching-student-workspace';
export const runtime='nodejs';
export async function GET(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 let coachUserId:string;try{coachUserId=requireCoachingPilotRequestIdentity(request.headers).scope.userId;}catch{return Response.json({error:'Sign in to continue.'},{status:401,headers});}
 const query=new URL(request.url).searchParams,studentId=query.get('studentId'),planId=query.get('planId')??undefined;if(!studentId)return Response.json({error:'Choose a student.'},{status:400,headers});
 const includeMessages=query.get('includeMessages');if(includeMessages!==null&&!['true','false'].includes(includeMessages))return Response.json({error:'Check the student workspace request.'},{status:400,headers});
 try{return Response.json(withReadonlyPlatformDatabase({},db=>readIndependentStudentWorkspace(db,{coachUserId,studentId,planId,includeMessages:includeMessages!=='false'})),{headers});}catch{return Response.json({error:'This student workspace is unavailable.'},{status:403,headers});}
}
