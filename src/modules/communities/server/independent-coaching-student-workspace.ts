import {requireCoachCommercialAccess} from './coaching-commercial-access';
import type Database from 'better-sqlite3';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import {assertCanonicalUuidV4} from '../../platform/server/database/platform-migration-contract';
import {independentCoachingMessageCounts} from './independent-coaching-mailbox';
/** Only hydrate a student's drawers when that coach opens the student. */
export function readIndependentStudentWorkspace(database:Database.Database,input:{coachUserId:string;studentId:string;planId?:string;includeMessages?:boolean}){
 if(input.planId!==undefined)assertCanonicalUuidV4(input.planId,'planId');
 requireCoachCommercialAccess(database,{coachUserId:input.coachUserId,scope:'platform',atUtc:new Date().toISOString()});
 const repo=new IndependentCoachingRepository(database),rows=repo.listEnrollments(input.coachUserId).filter(e=>e.coachUserId===input.coachUserId&&e.studentUserId===input.studentId&&(input.planId===undefined||e.planId===input.planId));
 if(!rows.length)throw new Error('This student is not in your coaching workspace.');
 const plans=repo.readPlans();
 return {studentId:input.studentId,name:rows[0].studentName,avatarUrl:repo.studentAvatar(input.studentId),enrollments:rows.map(e=>{
  const agreements=repo.agreements(e.enrollmentId,input.coachUserId),access=repo.journalAccess(e.enrollmentId,input.coachUserId);
  return {enrollmentId:e.enrollmentId,planId:e.planId,planName:agreements.find(a=>a.status==='accepted')?.terms.planName??plans.find(p=>p.planId===e.planId)?.terms.planName??'Coaching plan',status:e.status,studentContext:repo.studentContext(e.enrollmentId,input.coachUserId),agreements,reviews:repo.listReviews(e.enrollmentId,input.coachUserId),work:repo.listWork(e.enrollmentId,input.coachUserId),messages:input.includeMessages===false?[]:repo.listMessages(e.enrollmentId,input.coachUserId),...(input.includeMessages===false?independentCoachingMessageCounts(database,e.enrollmentId,input.coachUserId):{}),missingAccess:access.missing.length>0||access.reviewAccountMismatch,reviewAccountMismatch:access.reviewAccountMismatch,missingScopes:access.missing,accountAvailable:access.accountAvailable};
 })};
}
