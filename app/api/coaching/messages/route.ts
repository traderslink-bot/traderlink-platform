import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';
import {CoachingMailboxUnavailable,readIndependentCoachingMailbox,readIndependentCoachingMessage} from '@/src/modules/communities/server/independent-coaching-mailbox';
import type {MailboxFolder,MailboxScope} from '@/src/modules/communities/contracts/independent-coaching-messages';
export const runtime='nodejs';
export async function GET(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 let actorUserId:string;try{actorUserId=requireCoachingPilotRequestIdentity(request.headers).scope.userId;}catch{return Response.json({error:'Sign in to continue.'},{status:401,headers});}
 const q=new URL(request.url).searchParams,status=q.get('status')??'active',folder=q.get('folder')??'unread',earlier=q.get('earlier');
 if(!['active','ended'].includes(status)||!['unread','read','sent'].includes(folder)||earlier!==null&&earlier!=='true')return Response.json({error:'Choose a message folder.'},{status:400,headers});
 const scope:MailboxScope={studentId:q.get('studentId')??undefined,planId:q.get('planId')??undefined,enrollmentId:q.get('enrollmentId')??undefined,status:status as MailboxScope['status']};
 try{
  const result=withReadonlyPlatformDatabase({},db=>q.has('messageId')?readIndependentCoachingMessage(db,{actorUserId,scope,messageId:q.get('messageId')!,atUtc:new Date().toISOString()}):readIndependentCoachingMailbox(db,{actorUserId,scope,folder:folder as MailboxFolder,earlier:earlier==='true',cursor:q.get('cursor')??undefined,atUtc:new Date().toISOString()}));
  return Response.json(result,{headers});
 }catch(error){return Response.json({available:false,error:error instanceof CoachingMailboxUnavailable?error.message:'This conversation is unavailable. Reopen Messages to check your current access.'},{status:error instanceof CoachingMailboxUnavailable?503:403,headers});}
}
