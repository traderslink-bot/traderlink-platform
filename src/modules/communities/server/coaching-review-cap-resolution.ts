import type Database from "better-sqlite3";
import {coachingReviewService} from "./coaching-review-service-binding";
import {isCoachingReviewTradeCap,type CoachingReviewCapResolution,type CoachingReviewTradeCap} from "../contracts/coaching-review-cap";
/** An additive review-specific agreement. Never modify the accepted terms_json. */
export function coachingReviewCapResolution(db:Database.Database,reviewId:string):CoachingReviewCapResolution|null{
 const bound=coachingReviewService(db,reviewId);if(bound?.item.itemType!=='trading_day_review'||bound.terms.builderConfig?.offers.trading_day_review?.tradeCap)return null;
 const row=db.prepare(`SELECT e.event_id,e.occurred_at_utc,e.details_json FROM traderlink_community_coaching_review_events e JOIN traderlink_community_coaching_trade_reviews r ON r.review_id=e.review_id AND r.community_id=e.community_id JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id AND x.community_id=r.community_id WHERE e.review_id=? AND e.actor_user_id=x.coach_user_id AND json_extract(e.details_json,'$.action')='day_cap_proposed' ORDER BY e.occurred_at_utc DESC,e.rowid DESC LIMIT 1`).get(reviewId) as {event_id:string;occurred_at_utc:string;details_json:string}|undefined;
 if(!row)return null;const details=JSON.parse(row.details_json) as {agreementId:string;planItemId:string;tradeCap:unknown};
 if(details.agreementId!==bound.agreementId||details.planItemId!==bound.item.planItemId||!isCoachingReviewTradeCap(details.tradeCap))return null;
 const acceptance=db.prepare(`SELECT e.occurred_at_utc FROM traderlink_community_coaching_review_events e JOIN traderlink_community_coaching_trade_reviews r ON r.review_id=e.review_id AND r.community_id=e.community_id JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id AND x.community_id=r.community_id WHERE e.review_id=? AND e.actor_user_id=x.student_user_id AND json_extract(e.details_json,'$.action')='day_cap_accepted' AND json_extract(e.details_json,'$.proposalId')=? ORDER BY e.occurred_at_utc,e.rowid LIMIT 1`).get(reviewId,row.event_id) as {occurred_at_utc:string}|undefined;
 return {proposalId:row.event_id,tradeCap:details.tradeCap,status:acceptance?'accepted':'proposed',proposedAtUtc:row.occurred_at_utc,acceptedAtUtc:acceptance?.occurred_at_utc??null};
}
export function coachingReviewTradeCap(db:Database.Database,reviewId:string):CoachingReviewTradeCap|null{
 const bound=coachingReviewService(db,reviewId);const original=bound?.terms.builderConfig?.offers.trading_day_review?.tradeCap;
 if(bound?.item.itemType!=='trading_day_review')return null;
 if(original)return original;
 const resolution=coachingReviewCapResolution(db,reviewId);return resolution?.status==='accepted'?resolution.tradeCap:null;
}
