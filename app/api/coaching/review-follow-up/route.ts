import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';
import {IndependentCoachingReviewFollowUp} from '@/src/modules/communities/server/independent-coaching-review-follow-up';
export const runtime='nodejs';
export async function GET(request:Request){
 const headers={'Cache-Control':'private, no-store'};let actor:string;try{actor=requireCoachingPilotRequestIdentity(request.headers).scope.userId;}catch{return Response.json({error:'Sign in to continue.'},{status:401,headers});}
 try{const reviewId=new URL(request.url).searchParams.get('reviewId')??'';return Response.json(withReadonlyPlatformDatabase({},db=>new IndependentCoachingReviewFollowUp(db).read(reviewId,actor,new Date().toISOString())),{headers});}catch{return Response.json({error:'This follow-up is unavailable.'},{status:403,headers});}
}
