import {coachingReviewTradeCap} from "./coaching-review-cap-resolution";
import {coachingReviewRequestedDays,coachingReviewService} from "./coaching-review-service-binding";
import {coachingUnavailableReviewTrades,coachingDistinctReviewTrades} from "./coaching-review-trade-eligibility";
import {TraderLinkCommunityCoachJournalReadService} from "./traderlink-community-coach-journal-read-service";
import type Database from "better-sqlite3";
import type {CoachingDayAssessment} from "../contracts/coaching-review-workspace";
/** Append-only draft history in the review event ledger; no Journal write. */
export function coachingDayAssessments(db:Database.Database,reviewId:string):CoachingDayAssessment[]{
 const rows=db.prepare(`SELECT json_extract(details_json,'$.dayAssessment') assessment FROM traderlink_community_coaching_review_events WHERE review_id=? AND json_type(details_json,'$.dayAssessment')='object' ORDER BY occurred_at_utc,rowid`).all(reviewId) as {assessment:string}[];
 const days=new Map<string,CoachingDayAssessment>();for(const row of rows){const item=JSON.parse(row.assessment) as CoachingDayAssessment&{removed?:boolean};if(item.removed)days.delete(item.date);else days.set(item.date,item);}return [...days.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

export function coachingTradingDayRequirements(db:Database.Database,reviewId:string){
 const service=coachingReviewService(db,reviewId);if(service?.item.itemType!=='trading_day_review')return {coverage:undefined,problem:null};
 const row=db.prepare(`SELECT r.period_start,r.period_end,r.delivery_state,x.coach_user_id,r.relationship_id FROM traderlink_community_coaching_trade_reviews r JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id AND x.community_id=r.community_id WHERE r.review_id=?`).get(reviewId) as {period_start:string|null;period_end:string|null;delivery_state:string;coach_user_id:string;relationship_id:string};
 if(row.delivery_state!=='draft')return {coverage:undefined,problem:null};
 if(!row.period_start||!row.period_end)return {coverage:undefined,problem:'Choose the review date range before selecting trading days.'};
 const cap=coachingReviewTradeCap(db,reviewId);if(!cap)return {coverage:undefined,problem:'Agree on a trading-day trade limit with the student before delivery.'};
 const reader=new TraderLinkCommunityCoachJournalReadService(db),input={coachUserId:row.coach_user_id,relationshipId:row.relationship_id,periodStart:row.period_start??undefined,periodEnd:row.period_end??undefined};
 const requestedDays=coachingReviewRequestedDays(db,reviewId),rawShared=reader.read(input);
 const allowed=(date:string)=>!requestedDays.length||requestedDays.includes(date);
 const selected=db.prepare(`SELECT round_trip_id,workflow_state FROM traderlink_community_coaching_review_trades WHERE review_id=? AND workflow_state!='removed'`).all(reviewId) as {round_trip_id:string;workflow_state:string}[];
 const rawTrades=rawShared.trades.filter(trade=>trade.tradingDate&&allowed(trade.tradingDate));
 const unavailable=coachingUnavailableReviewTrades(db,reviewId);
 const trades=coachingDistinctReviewTrades(db,rawTrades.filter(trade=>!unavailable.has(trade.roundTripId)),selected.map(item=>item.round_trip_id));
 const context=reader.readReviewContext({...input,includeJournal:true,includeDayJournal:true,includeRules:true});
 const availableDays=new Set([...rawShared.trades.flatMap(trade=>trade.tradingDate?[trade.tradingDate]:[]),...context.dayNotes.map(day=>day.date),...context.dayRules.map(day=>day.date)]);
 const days=coachingDayAssessments(db,reviewId),complete=rawShared.coverage==='complete';
 const requiredDays=complete?Math.min(service.item.quantity,availableDays.size):service.item.quantity;
 const expected=trades.filter(trade=>days.some(day=>day.date===trade.tradingDate)).length;
 const perDay=(date:string)=>complete?Math.min(cap.quantity,trades.filter(trade=>trade.tradingDate===date).length):cap.quantity;
 const requiredTradeFeedback=cap.basis==='per_day'?days.reduce((count,day)=>count+perDay(day.date),0):complete?Math.min(cap.quantity,expected):cap.quantity;
 const reviewedTrades=selected.filter(item=>item.workflow_state==='saved').length;
 const coverage={agreedDays:service.item.quantity,availableDays:complete?availableDays.size:null,reviewedDays:days.length,shortfallDays:complete?Math.max(0,service.item.quantity-availableDays.size):0,tradeCap:cap,requiredTradeFeedback,reviewedTrades,shortfallTrades:complete&&days.length>=requiredDays?Math.max(0,(cap.basis==='per_day'?cap.quantity*days.length:cap.quantity)-requiredTradeFeedback):0};
 let problem:string|null=null;
 if((requestedDays.length||service.item.selectionMode==='student')&&requestedDays.length<requiredDays)problem='Complete the student day selection for the agreed review period before delivery.';
 else
 if(days.length<requiredDays||days.length>service.item.quantity||days.some(day=>!availableDays.has(day.date)||!allowed(day.date)||!day.assessment.trim()||(service.item.focusAreas??[]).some(key=>!['overall','next_steps'].includes(key)&&!day.focusFeedback[key]?.trim())))problem='Complete each agreed trading-day assessment and focus area before delivery.';
 else if(selected.some(item=>!trades.some(trade=>trade.roundTripId===item.round_trip_id&&days.some(day=>day.date===trade.tradingDate))))problem='Every selected trade needs a completed day assessment.';
 else if(cap.basis==='per_day'&&days.some(day=>selected.filter(item=>item.workflow_state==='saved'&&trades.some(trade=>trade.roundTripId===item.round_trip_id&&trade.tradingDate===day.date)).length<perDay(day.date)))problem='Finish the available individual trade reviews for each selected day.';
 else if(cap.basis==='per_review'&&reviewedTrades<requiredTradeFeedback)problem='Finish the available trade reviews included across the selected days.';
 return {coverage,problem};
}
export function requireTradingDayReviewReady(db:Database.Database,reviewId:string){const result=coachingTradingDayRequirements(db,reviewId);if(result.problem)throw new Error(result.problem);return result.coverage;}
