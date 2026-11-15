import {requireCoachCommercialAccess} from './coaching-commercial-access';
import {createHash} from 'node:crypto';
import type Database from 'better-sqlite3';
import type {WorkspaceAccessScope} from '../../platform/contracts/workspace-access-scope';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import {COACHING_ACCESS_LABELS} from '../contracts/coaching-required-access';
import type {CoachingRequiredScope} from '../contracts/coaching-required-access';

export function independentCoachingJournalAccess(database:Database.Database,input:{enrollmentId:string;actorUserId:string;requiredScopes:readonly CoachingRequiredScope[];reviewId?:string}){
 const repository=new IndependentCoachingRepository(database),enrollment=repository.enrollment(input.enrollmentId,input.actorUserId);
 if(enrollment.coach_user_id===input.actorUserId)requireCoachCommercialAccess(database,{coachUserId:input.actorUserId,scope:'platform',atUtc:new Date().toISOString()});
 if(enrollment.status!=='active')throw new Error('Journal access is unavailable for an ended enrollment.');
 const review=input.reviewId?repository.review(input.reviewId,input.actorUserId):null;
 if(review&&(review.enrollmentId!==input.enrollmentId||review.status==='cancelled'))throw new Error('This review is unavailable.');
 const grant=database.prepare(`SELECT grant_id,journal_account_id,scopes_json FROM traderlink_coaching_journal_access
  WHERE enrollment_id=? AND student_user_id=? AND status='active' ORDER BY granted_at_utc DESC LIMIT 1`).get(input.enrollmentId,enrollment.student_user_id) as {grant_id:string;journal_account_id:string;scopes_json:string}|undefined;
 const studentOwnReview=enrollment.student_user_id===input.actorUserId&&!!review?.journalAccountId;
 const accountId=studentOwnReview?review!.journalAccountId!:grant?.journal_account_id;
 if(!studentOwnReview&&!grant)throw new Error('The student must allow the required Journal access.');
 if(!studentOwnReview&&review?.journalAccountId&&review.journalAccountId!==grant!.journal_account_id)throw new Error('The shared account differs from the account submitted for this review.');
 const scopes:CoachingRequiredScope[]=studentOwnReview?Object.keys(COACHING_ACCESS_LABELS) as CoachingRequiredScope[]:JSON.parse(grant!.scopes_json);
 if(input.requiredScopes.some(scope=>!scopes.includes(scope)))throw new Error('The student must allow the required Journal access.');
 const account=database.prepare("SELECT workspace_id,trading_timezone FROM journal_accounts WHERE account_id=? AND created_by_user_id=? AND status='active'").get(accountId,enrollment.student_user_id) as {workspace_id:string;trading_timezone:string}|undefined;
 if(!account)throw new Error('The shared Journal account is unavailable.');
 const scope:WorkspaceAccessScope=Object.freeze({userId:enrollment.student_user_id,workspaceId:account.workspace_id,workspaceRole:'owner',activeAccountId:accountId!,allowedAccountIds:Object.freeze([accountId!])});
 const authorizationKey=createHash('sha256').update(JSON.stringify({actor:input.actorUserId,grant:studentOwnReview?null:grant!.grant_id,scopes,account:accountId,enrollment:input.enrollmentId,review:review?{id:review.reviewId,periodStart:review.periodStart,periodEnd:review.periodEnd,status:review.status==='cancelled'?'cancelled':'available'}:null})).digest('hex');
 return {scope,scopes,review,authorizationKey,timezone:account.trading_timezone,permits:(field:CoachingRequiredScope)=>scopes.includes(field)};
}
