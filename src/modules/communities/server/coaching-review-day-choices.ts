import type Database from "better-sqlite3";
import {TraderLinkCommunityCoachJournalReadService} from "./traderlink-community-coach-journal-read-service";
import {coachingReviewTradeCountsByDay,coachingReviewTradeLineage} from "./coaching-review-trade-eligibility";

/** Day context is independent of eligibility for new individual feedback. */
export function coachingReviewDayChoices(db:Database.Database,input:{coachUserId:string;relationshipId:string;periodStart:string;periodEnd:string}){
 const valid=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
 if(!valid(input.periodStart)||!valid(input.periodEnd)||input.periodStart>input.periodEnd||Date.parse(input.periodEnd)-Date.parse(input.periodStart)>366*86400000)throw new Error('Choose a review period of at most one year.');
 const reader=new TraderLinkCommunityCoachJournalReadService(db),shared=reader.read(input);
 const context=reader.readReviewContext({...input,includeJournal:true,includeDayJournal:true,includeRules:true});
 const counts=coachingReviewTradeCountsByDay(db,shared.trades);
 const dates=new Set([...shared.trades.flatMap(trade=>trade.tradingDate?[trade.tradingDate]:[]),...context.dayNotes.map(day=>day.date),...context.dayRules.map(day=>day.date)]);
 const days=[...dates].filter(date=>date>=input.periodStart&&date<=input.periodEnd).sort().reverse().map(date=>({date,tradeCount:counts[date]??0}));
 return {days,trades:shared.trades};
}

export function coachingStudentUnavailableTrades(db:Database.Database,input:{communityId:string;coachUserId:string;studentUserId:string}){
 const reserved=db.prepare(`SELECT DISTINCT t.round_trip_id FROM traderlink_community_coaching_review_trades t JOIN traderlink_community_coaching_trade_reviews r ON r.review_id=t.review_id AND r.community_id=t.community_id JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id AND x.community_id=r.community_id WHERE r.community_id=? AND x.coach_user_id=? AND x.student_user_id=? AND t.workflow_state!='removed' AND ((r.delivered_at_utc IS NOT NULL AND t.workflow_state='saved' AND trim(t.coach_feedback)!='') OR (r.delivery_state='draft' AND r.cancelled_at_utc IS NULL AND (r.workspace_kind IN ('trade','trading_day','strategy') OR (r.workspace_kind IS NULL AND r.review_type IN ('single_trade','multiple_trades')))))`).all(input.communityId,input.coachUserId,input.studentUserId) as {round_trip_id:string}[];
 return coachingReviewTradeLineage(db,reserved.map(row=>row.round_trip_id));
}
