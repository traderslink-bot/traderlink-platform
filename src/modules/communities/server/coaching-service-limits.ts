import type Database from "better-sqlite3";
import {coachingPeriod,type CoachingAgreementTerms} from "../contracts/coaching-agreements";

export function acceptedCoachingTerms(db:Database.Database,relationshipId:string):CoachingAgreementTerms|null{
 const row=db.prepare(`SELECT terms_json FROM traderlink_community_coaching_agreements WHERE relationship_id=? AND status='accepted'`).get(relationshipId) as {terms_json:string}|undefined;
 return row?JSON.parse(row.terms_json) as CoachingAgreementTerms:null;
}
export function questionAllowance(db:Database.Database,relationshipId:string,studentUserId:string,atUtc:string){
 const terms=acceptedCoachingTerms(db,relationshipId);if(!terms)return null;
 const item=terms.items.find(item=>item.itemType==="questions");
 // A freely agreed custom arrangement does not acquire an invented quota.
 if(!item)return terms.items.some(item=>item.itemType==="custom_task")?null:{limit:0,used:0,remaining:0,renewsOn:null};
 let start:string|null=null,end:string|null=null;
 if(terms.startDate&&(item.frequency==="once"||!item.timelineEnabled)){
  if(terms.startDate>atUtc.slice(0,10))return {limit:item.quantity,used:0,remaining:0,renewsOn:terms.startDate};
  start=terms.startDate;
 }else if(terms.startDate){
  const today=atUtc.slice(0,10);
  for(let index=0;index<10000;index++){
   const period=coachingPeriod(terms,item,index);if(!period||period.start>today)break;
   if(period.end>=today){start=period.start;end=period.end;break;}
  }
  if(!start)return {limit:item.quantity,used:0,remaining:0,renewsOn:terms.startDate>today?terms.startDate:null};
 }
 const count=db.prepare(`SELECT count(*) count FROM traderlink_community_coaching_messages WHERE relationship_id=? AND author_user_id=? AND (? IS NULL OR created_at_utc>=?) AND (? IS NULL OR substr(created_at_utc,1,10)<=?)`).get(relationshipId,studentUserId,start,start?start+"T00:00:00.000Z":null,end,end) as {count:number};
 return {limit:item.quantity,used:count.count,remaining:Math.max(0,item.quantity-count.count),renewsOn:end?new Date(Date.parse(end)+86400000).toISOString().slice(0,10):null};
}
export function requireQuestionAllowance(db:Database.Database,relationshipId:string,studentUserId:string,atUtc:string){
 const allowance=questionAllowance(db,relationshipId,studentUserId,atUtc);
 if(allowance&&allowance.remaining===0)throw new Error(allowance.renewsOn?`Question allowance renews on ${allowance.renewsOn}.`:"The question allowance for this agreement has been used.");
}
export function requireFollowUpWindow(db:Database.Database,relationshipId:string,reviewId:string,atUtc:string){
 const occurrence=db.prepare(`SELECT agreement.terms_json FROM traderlink_community_coaching_occurrences occurrence JOIN traderlink_community_coaching_agreements agreement ON agreement.agreement_id=occurrence.agreement_id WHERE occurrence.work_type='review' AND occurrence.work_id=? AND agreement.relationship_id=?`).get(reviewId,relationshipId) as {terms_json:string}|undefined;
 const terms=occurrence?JSON.parse(occurrence.terms_json) as CoachingAgreementTerms:acceptedCoachingTerms(db,relationshipId);
 if(!terms)return;
 const service=terms.items.find(item=>item.itemType==="review_follow_up");
 if(!service){if(terms.items.some(item=>item.itemType==="custom_task"))return;throw new Error("Follow-up is not included in this agreement.");}
 const review=db.prepare(`SELECT viewed_at_utc FROM traderlink_community_coaching_trade_reviews WHERE review_id=? AND relationship_id=?`).get(reviewId,relationshipId) as {viewed_at_utc:string|null}|undefined;
 if(!review?.viewed_at_utc)throw new Error("Mark the review as read before sending a follow-up.");
 if(Date.parse(atUtc)>Date.parse(review.viewed_at_utc)+service.followUpDays*86400000)throw new Error("The follow-up period for this review has ended.");
}
