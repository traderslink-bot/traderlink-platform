import type Database from 'better-sqlite3';
export function communityTradeHasSavedWork(db:Database.Database,reviewId:string,tradeId:string,coachId:string){
 const row=db.prepare('SELECT coach_feedback,saved_at_utc,workflow_state FROM traderlink_community_coaching_review_trades WHERE review_id=? AND round_trip_id=?').get(reviewId,tradeId) as {coach_feedback:string;saved_at_utc:string|null;workflow_state:string}|undefined;
 return Boolean(row&&(row.coach_feedback.trim()||row.saved_at_utc||row.workflow_state==='saved')||db.prepare("SELECT 1 FROM traderlink_community_coaching_review_events WHERE review_id=? AND actor_user_id=? AND event_type='trade_saved' AND json_extract(details_json,'$.roundTripId')=? LIMIT 1").get(reviewId,coachId,tradeId)||db.prepare('SELECT 1 FROM traderlink_community_coaching_review_attachment_links l JOIN traderlink_community_coaching_attachments a ON a.attachment_id=l.attachment_id WHERE l.review_id=? AND l.round_trip_id=? AND a.uploaded_by_user_id=? LIMIT 1').get(reviewId,tradeId,coachId));
}
export function independentTradeHasSavedWork(db:Database.Database,reviewId:string,tradeId:string,coachId:string,submittedAt:string|null){
 const row=db.prepare('SELECT feedback_json,completed,updated_at_utc FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=?').get(reviewId,tradeId) as {feedback_json:string;completed:number;updated_at_utc:string}|undefined;
 if(row&&(row.completed||Object.keys(JSON.parse(row.feedback_json)).length))return true;
 if(db.prepare("SELECT 1 FROM traderlink_coaching_events WHERE actor_user_id=? AND kind='review_trade_feedback_saved' AND object_id=? LIMIT 1").get(coachId,`${reviewId}:${tradeId}`)||db.prepare('SELECT 1 FROM traderlink_coaching_review_images WHERE review_id=? AND round_trip_id=? LIMIT 1').get(reviewId,tradeId))return true;
 const selected=db.prepare("SELECT created_at_utc FROM traderlink_coaching_events WHERE kind='review_trade_selected' AND object_id=? ORDER BY rowid DESC LIMIT 1").get(`${reviewId}:${tradeId}`) as {created_at_utc:string}|undefined;
 const baseline=selected?.created_at_utc??submittedAt;
 return Boolean(row&&baseline&&Date.parse(row.updated_at_utc)>Date.parse(baseline));
}
