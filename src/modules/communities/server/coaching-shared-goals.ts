import type Database from "better-sqlite3";
import type {CoachingSharedGoal} from "../contracts/coaching-shared-goals";
/** Student-authored sharing ledger; delivered reviews cannot acquire a later revision. */
export function coachingSharedGoals(db:Database.Database,reviewId:string):CoachingSharedGoal[]{
 const row=db.prepare(`SELECT e.details_json FROM traderlink_community_coaching_review_events e JOIN traderlink_community_coaching_trade_reviews r ON r.review_id=e.review_id AND r.community_id=e.community_id JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id AND x.community_id=r.community_id WHERE e.review_id=? AND e.actor_user_id=x.student_user_id AND json_extract(e.details_json,'$.action')='student_goals_shared' AND (r.delivered_at_utc IS NULL OR e.occurred_at_utc<=r.delivered_at_utc) ORDER BY e.occurred_at_utc DESC,e.rowid DESC LIMIT 1`).get(reviewId) as {details_json:string}|undefined;
 return row?(JSON.parse(row.details_json) as {goals:CoachingSharedGoal[]}).goals:[];
}
