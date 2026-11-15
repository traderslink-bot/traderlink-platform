import type Database from 'better-sqlite3';
import {submissionDate,submissionPeriod} from '../contracts/coaching-request-submission-limits';
import {coachingReviewService} from './coaching-review-service-binding';
/** Use the stored coverage window when the agreement defines one. */
export function coachingReviewSelectionStart(db:Database.Database,reviewId:string){
 const row=db.prepare(`SELECT r.period_start,r.requested_at_utc,(SELECT o.period_start FROM traderlink_community_coaching_occurrences o WHERE o.work_id=r.review_id AND o.work_type='review' LIMIT 1) occurrence_start FROM traderlink_community_coaching_trade_reviews r WHERE r.review_id=?`).get(reviewId) as {period_start:string|null;requested_at_utc:string;occurrence_start:string|null}|undefined;
 if(!row)return null;
 const bound=coachingReviewService(db,reviewId);if(!bound)return null;
 if(bound.item.coveragePeriod!=='single_item'&&row.period_start)return row.period_start;
 if(row.occurrence_start)return row.occurrence_start;
 return bound.item.frequency==='once'?(bound.terms.startDate??submissionDate(row.requested_at_utc)):submissionPeriod(row.requested_at_utc,bound.item.frequency,bound.terms.startDate??submissionDate(row.requested_at_utc),bound.terms.customIntervalDays).start;
}
