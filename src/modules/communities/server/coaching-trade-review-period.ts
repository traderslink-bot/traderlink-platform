import type Database from "better-sqlite3";
import {coachingDate,coachingReviewCoverage,type CoachingAgreementTerms} from "../contracts/coaching-agreements";
import type {TraderLinkCommunityCoachingPlanItem} from "../contracts/traderlink-community-platform-contracts";
import {coachingReviewService} from "./coaching-review-service-binding";
/** Resolve only new/manual Trade scope; never reinterpret delivered history. */
export function requireCoachingTradePeriod(db:Database.Database,input:{relationshipId:string;agreementId:string;terms:CoachingAgreementTerms;item:TraderLinkCommunityCoachingPlanItem;start?:string|null;end?:string|null}){
 if(input.item.itemType!=='trade_review'||input.item.coveragePeriod==='single_item')return;
 if(!input.start||!input.end)throw new Error('Choose the date range required by this accepted Trade service.');
 const start=coachingDate(input.start),end=coachingDate(input.end);
 if(start>end||Date.parse(end)-Date.parse(start)>366*86400000)throw new Error('Choose a valid review period of at most one year.');
 const rows=input.item.coveragePeriod==='since_last_review'?db.prepare(`SELECT review_id,period_end FROM traderlink_community_coaching_trade_reviews WHERE relationship_id=? AND delivered_at_utc IS NOT NULL AND period_end<? ORDER BY period_end DESC,delivered_at_utc DESC`).all(input.relationshipId,end) as {review_id:string;period_end:string}[]:[];
 const prior=rows.find(row=>{const bound=coachingReviewService(db,row.review_id);return bound?.terms.planId===input.terms.planId&&bound.item.itemType===input.item.itemType&&(bound.agreementId!==input.agreementId||bound.item.planItemId===input.item.planItemId);});
 const expected=coachingReviewCoverage(input.terms,input.item,{start,end},prior?.period_end);
 if(start!==expected.start||end!==expected.end)throw new Error('Choose the date range required by this accepted Trade service.');
}
