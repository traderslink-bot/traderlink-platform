import {independentActiveSelectionSql} from './independent-coaching-selection-lifecycle-storage';
import type Database from 'better-sqlite3';
import {coachingReviewTradeLineage} from './coaching-review-trade-eligibility';
/** One coach cannot review the same factual trade again through another plan,
 * independent/community context, or a corrected logical/round-trip alias. */
export function independentCoachingUnavailableTrades(db:Database.Database,input:{coachUserId:string;studentUserId:string;reviewId:string}):ReadonlySet<string>{
 const rows=db.prepare(`SELECT t.round_trip_id,t.logical_trade_id FROM traderlink_coaching_review_trades t
 JOIN traderlink_coaching_reviews r ON r.review_id=t.review_id JOIN traderlink_coaching_enrollments e ON e.enrollment_id=r.enrollment_id
 JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id WHERE c.coach_user_id=? AND e.student_user_id=? AND r.review_id<>? AND r.status!='cancelled' AND ${independentActiveSelectionSql(db,'t')}`).all(input.coachUserId,input.studentUserId,input.reviewId) as {round_trip_id:string;logical_trade_id:string}[];
 const ids=rows.flatMap(row=>[row.round_trip_id,row.logical_trade_id]);
 if(db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_community_coaching_review_trades'").get()){
  ids.push(...(db.prepare(`SELECT t.round_trip_id FROM traderlink_community_coaching_review_trades t JOIN traderlink_community_coaching_trade_reviews r ON r.review_id=t.review_id AND r.community_id=t.community_id
  JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id AND x.community_id=r.community_id WHERE x.coach_user_id=? AND x.student_user_id=? AND t.workflow_state!='removed'
  AND ((r.delivered_at_utc IS NOT NULL AND t.workflow_state='saved' AND trim(t.coach_feedback)!='') OR (r.delivery_state='draft' AND r.cancelled_at_utc IS NULL AND (r.workspace_kind IN ('trade','trading_day','strategy') OR (r.workspace_kind IS NULL AND r.review_type IN ('single_trade','multiple_trades')))))`).all(input.coachUserId,input.studentUserId) as {round_trip_id:string}[]).map(row=>row.round_trip_id));
 }
 const reserved=new Set(ids),hasLineage=['journal_round_trips','journal_round_trip_identity_aliases','journal_logical_trades','journal_logical_trade_versions','journal_logical_trade_version_members'].every(name=>db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(name));
 if(hasLineage)for(const id of coachingReviewTradeLineage(db,ids))reserved.add(id);
 return reserved;
}
