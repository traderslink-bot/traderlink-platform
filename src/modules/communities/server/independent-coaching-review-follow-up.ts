import {randomUUID} from 'node:crypto';
import type Database from 'better-sqlite3';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import {requireCoachCommercialAccess} from './coaching-commercial-access';
function time(value:string){if(!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw new Error('Use a valid UTC time.');}
export class IndependentCoachingReviewFollowUp{
 constructor(private readonly db:Database.Database){}
 private context(reviewId:string,actorUserId:string){const repo=new IndependentCoachingRepository(this.db),review=repo.review(reviewId,actorUserId),enrollment=repo.enrollment(review.enrollmentId,actorUserId),terms=repo.agreements(review.enrollmentId,actorUserId).find(a=>a.agreementId===review.agreementId)?.terms;
  if(review.status!=='delivered'||!terms)throw new Error('Follow-up is available after delivery.');
  return {review,enrollment,service:terms.items.find(item=>item.itemType==='review_follow_up'),custom:terms.items.some(item=>item.itemType==='custom_task')};}
 read(reviewId:string,actorUserId:string,atUtc:string){
  time(atUtc);const context=this.context(reviewId,actorUserId),state=this.db.prepare('SELECT viewed_at_utc viewedAtUtc,follow_up_due_at_utc dueAtUtc,completed_at_utc completedAtUtc FROM traderlink_coaching_review_follow_up WHERE review_id=?').get(reviewId) as {viewedAtUtc:string|null;dueAtUtc:string|null;completedAtUtc:string|null}|undefined;
  const end=state?.viewedAtUtc&&context.service?new Date(Date.parse(state.viewedAtUtc)+context.service.followUpDays*86400000).toISOString():null;
  const coach=context.enrollment.coach_user_id===actorUserId,problem=context.enrollment.status!=='active'?'This coaching enrollment is read-only.':state?.completedAtUtc?'Follow-up is complete.':!context.service&&!context.custom?'Follow-up is not included in this agreement.':coach?null:!state?.viewedAtUtc&&!context.custom?'Mark the review as read to start your agreed follow-up window.':end&&atUtc>end?'The agreed follow-up window has ended.':null;
  const replies=this.db.prepare('SELECT r.reply_id replyId,r.body,r.created_at_utc atUtc,u.display_name author FROM traderlink_coaching_review_replies r JOIN platform_users u ON u.user_id=r.author_user_id WHERE review_id=? ORDER BY r.created_at_utc,r.reply_id').all(reviewId) as {replyId:string;body:string;atUtc:string;author:string}[];
  return {viewedAtUtc:state?.viewedAtUtc??null,dueAtUtc:state?.dueAtUtc??null,completedAtUtc:state?.completedAtUtc??null,windowEndsAtUtc:end,included:Boolean(context.service||context.custom),problem,canReply:problem===null,replies};
 }
 markRead(reviewId:string,actorUserId:string,atUtc:string):void{
  time(atUtc);this.db.transaction(()=>{const {enrollment}=this.context(reviewId,actorUserId);if(enrollment.student_user_id!==actorUserId||enrollment.status!=='active')throw new Error('Only the student marks this review as read.');
   this.db.prepare('INSERT INTO traderlink_coaching_review_follow_up(review_id,viewed_at_utc) VALUES(?,?) ON CONFLICT(review_id) DO UPDATE SET viewed_at_utc=coalesce(viewed_at_utc,excluded.viewed_at_utc)').run(reviewId,atUtc);
  }).immediate();
 }
 reply(reviewId:string,actorUserId:string,body:string,atUtc:string):void{
  time(atUtc);if(typeof body!=='string'||!body.trim()||body.length>8000)throw new Error('Write a follow-up message of 8,000 characters or fewer.');
  this.db.transaction(()=>{const {enrollment}=this.context(reviewId,actorUserId),state=this.read(reviewId,actorUserId,atUtc);if(!state.canReply)throw new Error(state.problem!);
   if(enrollment.coach_user_id===actorUserId)requireCoachCommercialAccess(this.db,{coachUserId:actorUserId,scope:'platform',atUtc});
   this.db.prepare('INSERT INTO traderlink_coaching_review_replies VALUES(?,?,?,?,?)').run(randomUUID(),reviewId,actorUserId,body.trim(),atUtc);
  }).immediate();
 }
 schedule(reviewId:string,actorUserId:string,dueAtUtc:string,atUtc:string):void{
  time(atUtc);time(dueAtUtc);this.db.transaction(()=>{const {enrollment}=this.context(reviewId,actorUserId),state=this.read(reviewId,actorUserId,atUtc);if(enrollment.coach_user_id!==actorUserId||enrollment.status!=='active'||!state.included||state.completedAtUtc||!state.viewedAtUtc)throw new Error('Schedule follow-up after the student reads the delivered review.');
   requireCoachCommercialAccess(this.db,{coachUserId:actorUserId,scope:'platform',atUtc});this.db.prepare('UPDATE traderlink_coaching_review_follow_up SET follow_up_due_at_utc=? WHERE review_id=?').run(dueAtUtc,reviewId);
  }).immediate();
 }
 complete(reviewId:string,actorUserId:string,atUtc:string):void{
  time(atUtc);this.db.transaction(()=>{const {enrollment}=this.context(reviewId,actorUserId),state=this.read(reviewId,actorUserId,atUtc);if(enrollment.coach_user_id!==actorUserId||enrollment.status!=='active'||!state.included)throw new Error('Only the coach completes this follow-up.');requireCoachCommercialAccess(this.db,{coachUserId:actorUserId,scope:'platform',atUtc});
   this.db.prepare('INSERT INTO traderlink_coaching_review_follow_up(review_id,completed_at_utc) VALUES(?,?) ON CONFLICT(review_id) DO UPDATE SET completed_at_utc=coalesce(completed_at_utc,excluded.completed_at_utc)').run(reviewId,atUtc);
  }).immediate();
 }
}
