import {IndependentFeedbackValidationRejection,INDEPENDENT_FEEDBACK_PROTOCOL} from '@/src/modules/communities/contracts/independent-coaching-review-baseline';
import {requirePlatformMutationRequest} from '@/src/modules/platform/server/authentication/platform-mutation-request-security';
import {completeInitialCoachCommission} from '@/src/modules/communities/server/coaching-commission-signup';
import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {withPlatformDatabase} from '@/src/modules/platform/server/database/open-platform-database';
import {independentCoachingStorageReady} from '@/src/modules/communities/server/coaching-payment-readiness';
import {performIndependentCoachingAction} from '@/src/modules/communities/server/independent-coaching-actions';
import {checkIndependentCoachStudentAdmission} from '@/src/modules/communities/server/independent-coaching-admission';
import {IndependentCoachingJournalReadService} from '@/src/modules/communities/server/independent-coaching-journal-read';
import {createHash} from 'node:crypto';
import {loadCoachingWhopRuntime} from '@/src/modules/communities/server/coaching-whop-runtime';
import {beginIndependentCoachingCheckout} from '@/src/modules/communities/server/independent-coaching-checkout';

export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store'};
export async function POST(request:Request){
 try{requirePlatformMutationRequest(request);}catch{return Response.json({error:'Open this form from TraderLink.'},{status:403,headers});}
 if(!request.headers.get('content-type')?.startsWith('application/json'))return Response.json({error:'Use the coaching form.'},{status:415,headers});
 let actorUserId:string;
 try{actorUserId=requireCoachingPilotRequestIdentity(request.headers).scope.userId;}catch{return Response.json({error:'Sign in to continue.'},{status:401,headers});}
 let feedbackAttempt:{raw:Record<string,unknown>;body:string}|null=null;
 try{
  const body=await request.text();if(body.length>160000)return Response.json({error:'This form is too large.'},{status:413,headers});
  const data:unknown=JSON.parse(body);if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Check the coaching form.');
  const atUtc=new Date().toISOString();
  const raw=data as Record<string,unknown>;feedbackAttempt={raw,body};
  if(!['begin_checkout','verify_coach_setup'].includes(String(raw.intent))&&(typeof raw.requestId!=='string'||raw.requestId.length>100))throw new Error('Reload this form before submitting.');
  if(raw.intent==='verify_coach_setup'){
   const config=loadCoachingWhopRuntime(),scope=raw.scope==='community'?'community':'platform',communityId=scope==='community'&&typeof raw.communityId==='string'?raw.communityId:undefined;
   await completeInitialCoachCommission({withDatabase:operation=>withPlatformDatabase({mode:'runtime'},operation),client:config.client,coachUserId:actorUserId,scope,communityId,environment:config.environment,identityKey:config.identityKey,platformAccountId:config.platformAccountId,atUtc:new Date().toISOString()});
   return Response.json({saved:true},{headers});
  }
  if(raw.intent==='begin_checkout'){
   if(typeof raw.enrollmentId!=='string'||typeof raw.agreementId!=='string')throw new Error('Choose the accepted coaching agreement.');
   const config=loadCoachingWhopRuntime();
   const purchaseId=createHash('sha256').update(JSON.stringify([config.environment,actorUserId,raw.enrollmentId,raw.agreementId,'initial-purchase-v1'])).digest('hex');
   const checkout=await beginIndependentCoachingCheckout({withDatabase:operation=>withPlatformDatabase({mode:'runtime'},operation),client:config.client,environment:config.environment,identityKey:config.identityKey,platformAccountId:config.platformAccountId,actorUserId,enrollmentId:raw.enrollmentId,agreementId:raw.agreementId,purchaseId,commission:{policyVersion:config.commissionPolicyVersion,basisPoints:config.commissionBasisPoints},atUtc});
   return Response.json({href:checkout.purchaseUrl},{headers});
  }
  const result=withPlatformDatabase({mode:'runtime'},db=>{
   if(!independentCoachingStorageReady(db))throw new Error('Independent coaching is not enabled in this environment yet.');
   return performIndependentCoachingAction(db,{actorUserId,atUtc,data:data as Record<string,unknown>,
    checkAdmission:enrollmentId=>checkIndependentCoachStudentAdmission(db,{enrollmentId,actorUserId,atUtc,agreementId:typeof raw.agreementId==='string'?raw.agreementId:undefined}),
    tradeReviewEligibleCount:(enrollmentId,reviewId,selected,period,restoreRoundTripIds)=>new IndependentCoachingJournalReadService(db).tradeReviewEligibleCount({enrollmentId,actorUserId,reviewId,selected,period,restoreRoundTripIds}),
    verifySelection:(enrollmentId,reviewId,ids,days,period,restoreRoundTripIds)=>new IndependentCoachingJournalReadService(db).verifySelection({enrollmentId,actorUserId,reviewId,ids,days,period,restoreRoundTripIds})});
  });
  return Response.json(result,{headers});
 }catch(error){
  if(error instanceof IndependentFeedbackValidationRejection&&feedbackAttempt&&['save_review','save_review_trade'].includes(String(feedbackAttempt.raw.intent))){
   const {raw,body}=feedbackAttempt;
   return Response.json({error:error.message,kind:'rejected_feedback',protocol:INDEPENDENT_FEEDBACK_PROTOCOL,requestId:raw.requestId,intent:raw.intent,reviewId:raw.reviewId,roundTripId:raw.roundTripId??null,expectedFingerprint:raw.expectedFingerprint,bodySha256:createHash('sha256').update(body).digest('hex')},{status:400,headers});
  }
  const expected=error instanceof Error&&!/SQLITE|database|no such|JSON|Unexpected|Cannot read|undefined/i.test(error.message);
  return Response.json({error:expected?error.message:'Changes could not be saved. Check the form and try again.'},{status:400,headers});
 }
}
