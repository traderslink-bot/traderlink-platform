import type Database from 'better-sqlite3';
import {allowsEarlyCoachingReview} from '../contracts/coaching-agreements';
import {coachingReviewRequestedDays,coachingReviewService} from './coaching-review-service-binding';
import {selectedTradingDayAvailableAt,periodAvailableAt,reviewTimingProblem,type ReviewTiming} from '../contracts/coaching-review-timing';
export function coachingReviewTimezone(db:Database.Database,relationshipId:string){
 void db;void relationshipId;
 return 'America/New_York';
}
export function coachingReviewTiming(db:Database.Database,reviewId:string):ReviewTiming{
 const r=db.prepare(`SELECT r.relationship_id,r.period_end,r.requested_at_utc,r.requested_by_user_id,x.coach_user_id,r.delivery_state,r.status,(SELECT o.period_end FROM traderlink_community_coaching_occurrences o WHERE o.work_id=r.review_id AND o.work_type='review' AND o.community_id=r.community_id LIMIT 1) occurrence_end FROM traderlink_community_coaching_trade_reviews r JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id WHERE r.review_id=?`).get(reviewId) as {relationship_id:string;period_end:string|null;requested_at_utc:string;requested_by_user_id:string;coach_user_id:string;delivery_state:string;status:string;occurrence_end:string|null}|undefined;
 if(!r)throw new Error('Review unavailable.');
 const bound=coachingReviewService(db,reviewId),event=db.prepare(`SELECT occurred_at_utc FROM traderlink_community_coaching_review_events WHERE review_id=? AND json_extract(details_json,'$.action')='student_review_submitted' ORDER BY occurred_at_utc LIMIT 1`).get(reviewId) as {occurred_at_utc:string}|undefined;
 const submittedAtUtc=event?.occurred_at_utc??(r.requested_by_user_id!==r.coach_user_id?r.requested_at_utc:null);
 const requires=Boolean(bound&&(!bound.item.timelineEnabled||bound.item.selectionMode==='student'));
 const tradingTimezone=coachingReviewTimezone(db,r.relationship_id);
 const earlySubmissionAllowed=Boolean(bound&&allowsEarlyCoachingReview(bound.terms,bound.item));
 const lastSelectedDay=earlySubmissionAllowed&&bound?.item.itemType==='trading_day_review'?coachingReviewRequestedDays(db,reviewId).sort().at(-1):null;
 const candidates=earlySubmissionAllowed?[selectedTradingDayAvailableAt(lastSelectedDay,tradingTimezone)].filter((d):d is string=>Boolean(d)):[periodAvailableAt(r.period_end,tradingTimezone),...(bound?.item.coveragePeriod==='single_item'?[periodAvailableAt(r.occurrence_end)]:[])].filter((d):d is string=>Boolean(d));
 return {earlySubmissionAllowed,availableAtUtc:candidates.sort().at(-1)??null,awaitingSubmission:requires&&!submittedAtUtc&&r.delivery_state==='draft'&&r.status!=='cancelled',submittedAtUtc,turnaroundDays:bound?.item.dueOffsetDays??null,deliveryDayCount:bound?.terms.builderConfig?.offers[bound.item.itemType]?.deliveryDayCount,scheduled:bound?.item.timelineEnabled??false,tradingTimezone};
}
export function requireCoachingReviewAvailable(db:Database.Database,reviewId:string,now=new Date().toISOString(),allowMissingDeadline=false){
 const r=db.prepare(`SELECT delivery_state deliveryState,status,period_end periodEnd,due_at_utc dueAtUtc FROM traderlink_community_coaching_trade_reviews WHERE review_id=?`).get(reviewId) as Parameters<typeof reviewTimingProblem>[0]|undefined;
 if(!r)throw new Error('Review unavailable.');
 const problem=reviewTimingProblem({...r,timing:coachingReviewTiming(db,reviewId)},now);
 if(problem&&!(allowMissingDeadline&&problem==='Deadline missing'))throw new Error(problem);
}
