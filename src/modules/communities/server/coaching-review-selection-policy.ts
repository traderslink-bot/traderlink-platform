import type Database from "better-sqlite3";
type Item={planItemId?:string;itemType?:string;selectionMode?:string};
/** The occurrence's frozen agreement wins over later plan edits. Ambiguous legacy scope never broadens selection. */
export function coachingReviewSelectionPolicy(db:Database.Database,reviewId:string,workspaceKind?:string){
 const review=db.prepare(`SELECT r.relationship_id,r.workspace_kind,r.review_type,x.plan_id FROM traderlink_community_coaching_trade_reviews r JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id AND x.community_id=r.community_id WHERE r.review_id=?`).get(reviewId) as {relationship_id:string;workspace_kind:string|null;review_type:string;plan_id:string}|undefined;
 const deny={coachCanSelect:false,studentCanSelect:false,reason:"Trade selection is unavailable until the agreed plan service is identified."};if(!review)return deny;
 const occurrence=db.prepare(`SELECT o.item_key,a.terms_json FROM traderlink_community_coaching_occurrences o JOIN traderlink_community_coaching_agreements a ON a.agreement_id=o.agreement_id AND a.relationship_id=? WHERE o.work_type='review' AND o.work_id=?`).get(review.relationship_id,reviewId) as {item_key:string;terms_json:string}|undefined;
 let items:Item[]=[];
 if(occurrence){const terms=JSON.parse(occurrence.terms_json) as {items?:Item[]};items=(terms.items??[]).filter(item=>item.planItemId===occurrence.item_key);}
 else{
  const kind=workspaceKind??review.workspace_kind;
  const type=kind==='strategy'?'strategy_review':kind==='trading_day'?'trading_day_review':kind==='performance'||['weekly','monthly'].includes(review.review_type)?'performance_review':'trade_review';
  const agreement=db.prepare(`SELECT terms_json FROM traderlink_community_coaching_agreements WHERE relationship_id=? AND status='accepted' ORDER BY revision DESC LIMIT 1`).get(review.relationship_id) as {terms_json:string}|undefined;
  if(agreement){const terms=JSON.parse(agreement.terms_json) as {items?:Item[]};items=(terms.items??[]).filter(item=>item.itemType===type);}
  else items=db.prepare(`SELECT plan_item_id planItemId,item_type itemType,selection_mode selectionMode FROM traderlink_community_coaching_plan_items WHERE plan_id=? AND item_type=?`).all(review.plan_id,type) as Item[];
 }
 if(!items.length)return deny;
 const coachCanSelect=items.every(item=>item.selectionMode==='coach'||item.selectionMode==='coach_or_student');
 const studentCanSelect=items.every(item=>item.selectionMode==='student'||item.selectionMode==='coach_or_student');
 return {coachCanSelect,studentCanSelect,reason:coachCanSelect?'The agreed plan permits the coach to add shared trades.':studentCanSelect?'The agreed plan lets the student choose trades. Review their requested trades in To review.':'This agreed service does not permit manually adding individual trades.'};
}
