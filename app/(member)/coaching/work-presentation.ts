import type {IndependentCoachWorkRow} from '@/src/modules/communities/server/independent-coaching-work-read';
import {coachingReviewLabel,type CoachingReviewKind} from '@/src/modules/communities/contracts/coaching-review-workspace';

export type IndependentWorkPlan={planId:string;name:string;status:string;activeStudents:number};
export function workType(row:IndependentCoachWorkRow){return row.serviceType==='review_follow_up'?'review_follow_up':row.serviceType==='questions'?'questions':row.kind;}
export function workLabel(row:IndependentCoachWorkRow){return row.serviceType==='review_follow_up'?'Review follow-up':row.reviewId?coachingReviewLabel(row.kind as CoachingReviewKind,'Review'):row.serviceType==='questions'?'Student questions':row.kind==='session'?'Session':row.kind==='follow_up'?'Follow-up':'Task';}
export function workState(row:IndependentCoachWorkRow){return row.serviceType==='review_follow_up'?'Follow-up due':row.reviewId?row.status==='draft'?'Draft saved':'Ready to review':row.status==='scheduled'?'Scheduled':row.status==='assigned'?'Assigned':'Open';}
export function workStateColor(row:IndependentCoachWorkRow):'default'|'info'|'success'|'warning'{return row.serviceType==='review_follow_up'?'warning':row.reviewId?row.status==='draft'?'info':row.status==='ready'?'success':'default':row.status==='scheduled'?'info':'default';}

/** Deadline and readiness are independent; expected submissions never enter this active work projection. */
export function workOverdue(row:IndependentCoachWorkRow,nowUtc:string):boolean{
 const active=row.serviceType==='review_follow_up'?['open','scheduled','assigned'].includes(row.status):row.reviewId?['ready','draft'].includes(row.status):['open','scheduled','assigned'].includes(row.status);
 if(!active||!row.reviewId&&row.kind==='session'&&row.status!=='scheduled')return false;
 const due=Date.parse(row.dueAtUtc),now=Date.parse(nowUtc);return Number.isFinite(due)&&Number.isFinite(now)&&due<now;
}

/** Saved units are not whole-review readiness or delivery. Never expose internal reason codes. */
export function workProgressLines(row:IndependentCoachWorkRow):readonly string[]{
 if(row.serviceType==='review_follow_up')return ['Review delivered; follow-up pending.'];
 if(!row.reviewId)return [];
 if(row.status==='delivered')return ['Review delivered.'];
 const detail=row.reviewProgress;
 if(detail?.availability==='unavailable'&&detail.unavailableReason==='unsupported_unit')return ['No trade or day count applies.'];
 if(detail?.availability==='available'&&detail.progress.unit==='performance_criteria'){const progress=detail.progress;return [`${progress.saved} of ${progress.selected} Performance criteria answered`,`${progress.writtenAnswered??0} of ${progress.writtenRequired??0} required written responses complete`,progress.feedbackReady?'Agreed feedback complete; review not delivered.':'Agreed feedback incomplete; review not delivered.'];}
 const lines:string[]=[];
 if(detail?.acceptedAllowanceLabel){
  lines.push('Trade reviews included: '+detail.acceptedAllowanceLabel);
 }else if(detail?.acceptedQuantity!==null&&detail?.acceptedQuantity!==undefined&&detail.acceptedUnit){
  const unit=detail.acceptedUnit==='trades'?(detail.acceptedQuantity===1?'trade':'trades'):(detail.acceptedQuantity===1?'trading day':'trading days');
  lines.push((detail.acceptedUnit==='trades'?'Agreed count: ':'Agreed limit: up to ')+detail.acceptedQuantity+' '+unit+' per review');
 }
 if(!detail||detail.availability!=='available')return [...lines,'Saved progress unavailable.'];
 const {selected,saved,unit}=detail.progress,remaining=selected-saved;
 lines.push(saved+' of '+selected+' '+(unit==='trades'?'trade drafts':'day assessments')+' saved'+(remaining?' · '+remaining+' incomplete':''));
 lines.push(unit==='trading_days'?detail.progress.includesTradeEvaluations?'Each day requires a day/session assessment and feedback on its selected trades; review not delivered.':'Day assessments only; review not delivered.':'Review not delivered.');
 return lines;
}

export function workAction(row:IndependentCoachWorkRow){return row.serviceType==='review_follow_up'?'Open follow-up':row.reviewId?row.status==='draft'?'Continue review':'Start review':row.kind==='session'?'Open session':'Open work';}
export function workDestination(row:IndependentCoachWorkRow,returnTo?:string){return row.reviewId?`/coaching/reviews/${row.reviewId}${returnTo?`?returnTo=${encodeURIComponent(returnTo)}`:''}${row.serviceType==='review_follow_up'?'#follow-up':''}`:`${returnTo?.match(/^\/coaching\/plans\/[^/?#]+(?:\?[^#]*)?$/)?returnTo:'/coaching/students'}#${new URLSearchParams({student:row.studentId,section:row.kind==='session'?'sessions':'tasks',work:row.workId??''})}`;}
export function workKey(row:IndependentCoachWorkRow){return `${row.serviceType??row.kind}:${row.reviewId??row.workId??row.enrollmentId}`;}
const dayFormatter=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
export function easternDay(utc:string){const parts=dayFormatter.formatToParts(new Date(utc));return ['year','month','day'].map(type=>parts.find(part=>part.type===type)!.value).join('-');}
export function addCalendarDays(day:string,days:number){const date=new Date(`${day}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10);}
export function validDay(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(`${value}T12:00:00Z`))&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;}
