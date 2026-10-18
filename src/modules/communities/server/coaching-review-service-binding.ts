import type Database from "better-sqlite3";
import type {CoachingAgreementTerms} from "../contracts/coaching-agreements";
import type {TraderLinkCommunityCoachingPlanItem} from "../contracts/traderlink-community-platform-contracts";

export type BoundReviewService={agreementId:string;item:TraderLinkCommunityCoachingPlanItem;terms:CoachingAgreementTerms};
/** Occurrences and manual requests both retain the exact immutable accepted revision. */
export function coachingReviewService(db:Database.Database,reviewId:string):BoundReviewService|null{
 const row=db.prepare(`SELECT a.agreement_id,a.terms_json,o.item_key FROM traderlink_community_coaching_trade_reviews r
 JOIN traderlink_community_coaching_occurrences o ON o.work_id=r.review_id AND o.work_type='review' AND o.community_id=r.community_id
 JOIN traderlink_community_coaching_agreements a ON a.agreement_id=o.agreement_id AND a.relationship_id=r.relationship_id AND a.community_id=r.community_id
 WHERE r.review_id=?`).get(reviewId) as {agreement_id:string;terms_json:string;item_key:string}|undefined;
 if(row){const terms=JSON.parse(row.terms_json) as CoachingAgreementTerms;const item=terms.items.find(item=>item.planItemId===row.item_key);return item?{agreementId:row.agreement_id,terms,item}:null;}
 const manual=db.prepare(`SELECT a.agreement_id,a.terms_json,json_extract(e.details_json,'$.serviceBinding.planItemId') item_key
 FROM traderlink_community_coaching_trade_reviews r JOIN traderlink_community_coaching_review_events e ON e.review_id=r.review_id AND e.community_id=r.community_id
 JOIN traderlink_community_coaching_agreements a ON a.agreement_id=json_extract(e.details_json,'$.serviceBinding.agreementId') AND a.relationship_id=r.relationship_id AND a.community_id=r.community_id
 WHERE r.review_id=? AND json_type(e.details_json,'$.serviceBinding')='object' ORDER BY e.occurred_at_utc LIMIT 1`).get(reviewId) as typeof row;
 if(!manual)return null;const terms=JSON.parse(manual.terms_json) as CoachingAgreementTerms;const item=terms.items.find(item=>item.planItemId===manual.item_key);return item?{agreementId:manual.agreement_id,terms,item}:null;
}

export function coachingReviewRequestedDays(db:Database.Database,reviewId:string):string[]{
 const row=db.prepare(`SELECT json_extract(details_json,'$.requestedDays') days FROM traderlink_community_coaching_review_events WHERE review_id=? AND json_array_length(details_json,'$.requestedDays')>0 ORDER BY occurred_at_utc DESC,rowid DESC LIMIT 1`).get(reviewId) as {days:string}|undefined;return row?JSON.parse(row.days):[];
}
