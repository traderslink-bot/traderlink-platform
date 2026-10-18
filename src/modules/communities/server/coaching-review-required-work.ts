import {coachingRequiredAccess} from "../contracts/coaching-required-access";
import {coachingTradeFeedbackComplete} from "../contracts/coaching-trade-feedback";
import {coachingDayAssessments,coachingTradingDayRequirements} from "./coaching-review-day-assessments";
import {coachingUnavailableReviewTrades,coachingDistinctReviewTrades,coachingReviewIdentityKeys,requireEligibleReviewTrades,requireReviewSelectionLimits} from "./coaching-review-trade-eligibility";
import {coachingReviewService} from "./coaching-review-service-binding";
import {TraderLinkCommunityCoachJournalReadService} from "./traderlink-community-coach-journal-read-service";
import type Database from "better-sqlite3";
import { coachingReviewReadiness } from "../contracts/coaching-review-readiness";
import { platformFailure } from "../../platform/server/database/platform-migration-contract";

/** Use the agreement that generated this occurrence, including superseded agreements. */
export function coachingReviewRequiredTradeCount(db: Database.Database, reviewId: string): number | null {
  const service=coachingReviewService(db,reviewId);
  return service?.item.itemType==='trade_review'?service.item.quantity:null;
}

export function coachingReviewDeliveryCoverage(db:Database.Database,reviewId:string):import("../contracts/traderlink-community-platform-contracts").TraderLinkCommunityTradeReview["deliveryCoverage"]{
 const row=db.prepare(`SELECT json_extract(details_json,'$.reviewCoverage') coverage FROM traderlink_community_coaching_review_events WHERE review_id=? AND event_type='delivered' ORDER BY occurred_at_utc DESC LIMIT 1`).get(reviewId) as {coverage:string|null}|undefined;
 return row?.coverage?JSON.parse(row.coverage):null;
}

/** Only a live authorized Journal read, or recorded delivery evidence, can establish a shortage. */
export function coachingReviewAvailableTradeCount(db:Database.Database,reviewId:string):number|null{
 if(coachingReviewRequiredTradeCount(db,reviewId)===null)return null;
 const delivery=db.prepare(`SELECT json_extract(details_json,'$.reviewCoverage.availableCount') available FROM traderlink_community_coaching_review_events WHERE review_id=? AND event_type='delivered' ORDER BY occurred_at_utc DESC LIMIT 1`).get(reviewId) as {available:number|null}|undefined;
 // A recorded unknown availability stays unknown; never recalculate delivered history.
 if(delivery)return delivery.available;
 const review=db.prepare(`SELECT r.relationship_id,r.period_start,r.period_end,x.coach_user_id FROM traderlink_community_coaching_trade_reviews r JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id WHERE r.review_id=?`).get(reviewId) as {relationship_id:string;period_start:string|null;period_end:string|null;coach_user_id:string}|undefined;
 if(!review)return null;
 const bound=coachingReviewService(db,reviewId);if(bound?.item.coveragePeriod!=='single_item'&&(!review.period_start||!review.period_end))return null;
 try{const shared=new TraderLinkCommunityCoachJournalReadService(db).read({coachUserId:review.coach_user_id,relationshipId:review.relationship_id});if(shared.coverage!=="complete")return null;const unavailable=coachingUnavailableReviewTrades(db,reviewId);return coachingDistinctReviewTrades(db,shared.trades.filter(trade=>{if(unavailable.has(trade.roundTripId))return false;const date=trade.tradingDate??trade.openedAtUtc.slice(0,10);return (!review.period_start||date>=review.period_start)&&(!review.period_end||date<=review.period_end);})).length;}catch{return null;}
}

export function coachingReviewRequirements(db: Database.Database, reviewId: string) {
  const review = db.prepare(`SELECT acceptance_state acceptanceState,coach_feedback coachFeedback,
    went_well wentWell,needs_work needsWork,next_focus nextFocus,
    previous_focus_assessment previousFocusAssessment,focus_feedback_json focusFeedbackJson,delivery_state deliveryState,workspace_kind workspaceKind,focus_areas_json focusAreasJson,delivered_at_utc deliveredAtUtc,relationship_id relationshipId,period_start periodStart,period_end periodEnd
    FROM traderlink_community_coaching_trade_reviews WHERE review_id=?`).get(reviewId) as {
      deliveredAtUtc:string|null;relationshipId:string;periodStart:string|null;periodEnd:string|null;workspaceKind:import("../contracts/coaching-review-workspace").CoachingReviewKind|null;focusAreasJson:string;deliveryState:string; acceptanceState: "accepted" | "pending"; coachFeedback: string; wentWell: string;
      needsWork: string; nextFocus: string; previousFocusAssessment: string; focusFeedbackJson: string;
    };
  const trades = db.prepare(`SELECT round_trip_id roundTripId,workflow_state workflowState,coach_feedback coachFeedback FROM traderlink_community_coaching_review_trades WHERE review_id=?`).all(reviewId) as { roundTripId:string;workflowState: string;coachFeedback:string }[];
  const actions = db.prepare(`SELECT status FROM traderlink_community_coaching_review_actions WHERE review_id=?`).all(reviewId) as { status: string }[];
  const active=trades.filter(trade=>trade.workflowState!=='removed'),identityKeys=review.deliveryState==='draft'?coachingReviewIdentityKeys(db,active.map(trade=>trade.roundTripId)):new Map<string,string>();
  const units=new Map<string,typeof trades[number]>();for(const trade of active){const key=identityKeys.get(trade.roundTripId)??trade.roundTripId;const prior=units.get(key);if(!prior||trade.workflowState==='saved')units.set(key,trade);}
  const progress = coachingReviewReadiness({ ...review,
    agreedTradeCount: coachingReviewRequiredTradeCount(db, reviewId),
    focusFeedback: JSON.parse(review.focusFeedbackJson),focusAreas:JSON.parse(review.focusAreasJson),dayAssessments:coachingDayAssessments(db,reviewId),
  }, [...units.values()], actions,coachingReviewAvailableTradeCount(db,reviewId));
  if(review.deliveryState!=="draft")return {...progress,ready:Boolean(review.deliveredAtUtc),problem:review.deliveredAtUtc?null:'This review has not been delivered.',dayCoverage:coachingReviewDeliveryCoverage(db,reviewId)?.dayCoverage??undefined};
  let dayCoverage:ReturnType<typeof coachingTradingDayRequirements>['coverage'];
  try{
  const service=coachingReviewService(db,reviewId);
  if(review.workspaceKind==='trading_day'&&(!review.periodStart||!review.periodEnd))throw new Error('Choose the review date range before selecting trading days.');
  if(service?.item.itemType==='trade_review'&&service.item.coveragePeriod!=='single_item'&&(!review.periodStart||!review.periodEnd))throw new Error('Choose the date range required by this accepted Trade service.');
  if(!service&&review.deliveryState==='draft')throw new Error('Identify the exact accepted service before delivery.');

  if(service&&coachingRequiredAccess([service.item],service.terms.builderConfig).length){
   const relation=db.prepare(`SELECT x.coach_user_id,r.relationship_id FROM traderlink_community_coaching_trade_reviews r JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id AND x.community_id=r.community_id WHERE r.review_id=?`).get(reviewId) as {coach_user_id:string;relationship_id:string};
   try{const access=new TraderLinkCommunityCoachJournalReadService(db).readAnalysisScope({coachUserId:relation.coach_user_id,relationshipId:relation.relationship_id});const grants=db.prepare(`SELECT data_scope,shared_fields_json FROM traderlink_community_journal_grants WHERE relationship_id=? AND coach_user_id=? AND journal_account_id=? AND status='active'`).all(relation.relationship_id,relation.coach_user_id,access.scope.activeAccountId) as {data_scope:string;shared_fields_json:string}[];if(!access.canReadTrades||coachingRequiredAccess([service.item],service.terms.builderConfig).some(scope=>!grants.some(grant=>grant.data_scope==='complete'||grant.data_scope===scope||(grant.data_scope==='trades'&&(JSON.parse(grant.shared_fields_json) as string[]).includes(scope)))))throw new Error('Required sharing missing');}catch{throw new Error('The required Journal sharing must be active before delivery.');}
  }
  const selected=trades.filter(trade=>trade.workflowState!=='removed');
  requireEligibleReviewTrades(db,reviewId,selected.map(trade=>trade.roundTripId));
  const relation=db.prepare(`SELECT coach_user_id FROM traderlink_community_coaching_relationships WHERE relationship_id=?`).get(review.relationshipId) as {coach_user_id:string};
  const shared=new TraderLinkCommunityCoachJournalReadService(db).read({coachUserId:relation.coach_user_id,relationshipId:review.relationshipId});
  const byId=new Map(shared.trades.map(trade=>[trade.roundTripId,trade]));
  if(selected.some(trade=>!byId.has(trade.roundTripId)))throw new Error('Restore sharing or remove unavailable trade selections before delivery.');
  requireReviewSelectionLimits(db,reviewId,selected.map(trade=>byId.get(trade.roundTripId)!));
  const day=coachingTradingDayRequirements(db,reviewId);dayCoverage=day.coverage;if(dayCoverage)progress.total=Math.max(progress.total,dayCoverage.requiredTradeFeedback);
  if(service&&review.deliveryState==='draft'&&trades.some(trade=>trade.workflowState==='saved'&&!coachingTradeFeedbackComplete(trade.coachFeedback,service.item.focusAreas??[])))throw new Error('Complete the agreed focus feedback for every selected trade.');
  if(day.problem)throw new Error(day.problem);
  if(review.workspaceKind==='trading_day'&&dayCoverage?.availableDays===0){progress.focusComplete=true;progress.ready=review.acceptanceState!=='pending'&&progress.saved===progress.selected&&progress.hasContent;}
  if(service&&service.item.itemType!=="trading_day_review"&&service.item.focusAreas?.filter(key=>service.item.itemType!=="trade_review"||key==="goals").some(key=>!['overall','next_steps'].includes(key)&&!JSON.parse(review.focusFeedbackJson)[key]?.trim()))throw new Error("Complete each agreed focus assessment before delivery.");
  if (!progress.ready) platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
    field: progress.saved < progress.required ? "requiredTradeReviews" : progress.saved < progress.selected ? "unfinishedTradeReviews" : "emptyReview",
  });
  return {...progress,ready:true,problem:null,dayCoverage};
  }catch(error){const message=error instanceof Error?error.message:'';const problem=/^(Choose|Identify|Complete|The required|Restore|Agree on|Finish|Every selected|A selected trade|These selections|Select trades|The selected|This accepted|This assessment)/.test(message)?message:'Complete the agreed review feedback, required trades and focus before delivery.';return {...progress,ready:false,problem,dayCoverage};}
}
export function requireCoachingReviewReady(db:Database.Database,reviewId:string){const result=coachingReviewRequirements(db,reviewId);if(!result.ready)throw new Error(result.problem??'Review requirements are incomplete.');return result;}
