import type Database from "better-sqlite3";
import {TraderLinkCommunityCoachJournalReadService} from "./traderlink-community-coach-journal-read-service";
import {coachingReviewService} from "./coaching-review-service-binding";
import {coachingRequiredAccess,COACHING_ACCESS_LABELS} from "../contracts/coaching-required-access";
export function coachingReviewResourceScope(db:Database.Database,input:{coachUserId:string;reviewId:string;communitySlug:string}){
 const review=db.prepare(`SELECT x.coach_user_id,r.relationship_id,r.period_start,r.period_end,r.workspace_kind,r.focus_areas_json,r.delivery_state FROM traderlink_community_coaching_trade_reviews r JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id AND x.community_id=r.community_id JOIN traderlink_communities c ON c.community_id=r.community_id WHERE r.review_id=? AND c.slug=? AND x.coach_user_id=? AND r.acceptance_state='accepted' AND r.delivery_state!='cancelled'`).get(input.reviewId,input.communitySlug,input.coachUserId) as {delivery_state:string;coach_user_id:string;relationship_id:string;period_start:string|null;period_end:string|null;workspace_kind:string;focus_areas_json:string}|undefined;
 if(!review)throw new Error("This review is unavailable.");
 if(review.workspace_kind==='trading_day'&&(!review.period_start||!review.period_end))throw new Error("Choose the review date range before opening resources.");
 const service=coachingReviewService(db,input.reviewId);if(!service&&review.delivery_state==='draft')throw new Error("Identify the accepted service before opening resources.");
 if(service?.item.itemType==='trade_review'&&service.item.coveragePeriod!=='single_item'&&review.delivery_state==='draft'&&(!review.period_start||!review.period_end))throw new Error('Choose the date range required by this accepted Trade service.');
 const reader=new TraderLinkCommunityCoachJournalReadService(db);
 const access=reader.readAnalysisScope({coachUserId:input.coachUserId,relationshipId:review.relationship_id});
 if(!access.canReadTrades)throw new Error("The student must share trades for this review.");
 const shared=reader.read({coachUserId:input.coachUserId,relationshipId:review.relationship_id});
 const selected=db.prepare(`SELECT round_trip_id FROM traderlink_community_coaching_review_trades WHERE review_id=? AND workflow_state!='removed'`).all(input.reviewId) as {round_trip_id:string}[];
 let start=review.period_start,end=review.period_end;
 if(!start||!end){const ids=new Set(selected.map(row=>row.round_trip_id));const dates=shared.trades.filter(trade=>ids.has(trade.roundTripId)).map(trade=>trade.tradingDate);if(!dates.length||dates.some(date=>!date))throw new Error("Select trades with verified trading dates before opening analytics.");const sorted=(dates as string[]).sort();start=sorted[0];end=sorted.at(-1)!;}
 const scopes=coachingRequiredAccess(service?[service.item]:[],service?.terms.builderConfig);
 const grants=db.prepare(`SELECT data_scope,shared_fields_json FROM traderlink_community_journal_grants WHERE relationship_id=? AND coach_user_id=? AND journal_account_id=? AND status='active'`).all(review.relationship_id,input.coachUserId,access.scope.activeAccountId) as {data_scope:string;shared_fields_json:string}[];
 const permits=(key:string)=>grants.some(grant=>grant.data_scope==='complete'||grant.data_scope===key||(grant.data_scope==='trades'&&(JSON.parse(grant.shared_fields_json) as string[]).includes(key)));
 const missing=scopes.filter(scope=>!permits(scope)).map(scope=>COACHING_ACCESS_LABELS[scope]??scope);
 const authorizationKey=JSON.stringify(grants.map(grant=>[grant.data_scope,JSON.parse(grant.shared_fields_json)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
 return {authorizationKey,scope:access.scope,relationshipId:review.relationship_id,period:{start,end},missing,permits,review,shared};
}
