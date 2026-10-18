import {coachingReviewTradeCap} from "./coaching-review-cap-resolution";
import {coachingReviewRequestedDays,coachingReviewService} from "./coaching-review-service-binding";
import type {CoachStudentJournalTrade} from "./traderlink-community-coach-journal-read-service";
import type Database from "better-sqlite3";
const reviewLineageSql=`WITH RECURSIVE reserved(id) AS (
 SELECT t.round_trip_id FROM traderlink_community_coaching_review_trades t
 JOIN traderlink_community_coaching_trade_reviews r ON r.review_id=t.review_id AND r.community_id=t.community_id
 JOIN traderlink_community_coaching_relationships x ON x.relationship_id=r.relationship_id AND x.community_id=r.community_id
 JOIN traderlink_community_coaching_trade_reviews current ON current.review_id=? AND current.community_id=r.community_id
 JOIN traderlink_community_coaching_relationships target ON target.relationship_id=current.relationship_id AND target.community_id=current.community_id
 WHERE r.review_id!=current.review_id AND x.coach_user_id=target.coach_user_id AND x.student_user_id=target.student_user_id
 AND t.workflow_state!='removed' AND ((r.delivered_at_utc IS NOT NULL AND t.workflow_state='saved' AND trim(t.coach_feedback)!='') OR (r.delivery_state='draft' AND r.cancelled_at_utc IS NULL AND (r.workspace_kind IN ('trade','trading_day','strategy') OR (r.workspace_kind IS NULL AND r.review_type IN ('single_trade','multiple_trades')))))
 ), accounts AS (
 SELECT DISTINCT r.workspace_id,r.account_id FROM journal_round_trips r JOIN reserved ON reserved.id=r.round_trip_id
 UNION SELECT DISTINCT t.workspace_id,t.account_id FROM journal_logical_trades t JOIN reserved ON reserved.id=t.logical_trade_id
 ), edges(from_id,to_id) AS (
 SELECT a.round_trip_id,b.round_trip_id FROM journal_round_trip_identity_aliases a JOIN journal_round_trip_identity_aliases b ON b.round_trip_alias_id=a.superseded_by_alias_id AND b.workspace_id=a.workspace_id AND b.account_id=a.account_id JOIN accounts x ON x.workspace_id=a.workspace_id AND x.account_id=a.account_id
 UNION SELECT b.round_trip_id,a.round_trip_id FROM journal_round_trip_identity_aliases a JOIN journal_round_trip_identity_aliases b ON b.round_trip_alias_id=a.superseded_by_alias_id AND b.workspace_id=a.workspace_id AND b.account_id=a.account_id JOIN accounts x ON x.workspace_id=a.workspace_id AND x.account_id=a.account_id
 UNION SELECT v.logical_trade_id,m.round_trip_id FROM journal_logical_trade_versions v JOIN journal_logical_trade_version_members m ON m.logical_trade_version_id=v.logical_trade_version_id AND m.workspace_id=v.workspace_id AND m.account_id=v.account_id JOIN accounts x ON x.workspace_id=v.workspace_id AND x.account_id=v.account_id
 UNION SELECT m.round_trip_id,v.logical_trade_id FROM journal_logical_trade_versions v JOIN journal_logical_trade_version_members m ON m.logical_trade_version_id=v.logical_trade_version_id AND m.workspace_id=v.workspace_id AND m.account_id=v.account_id JOIN accounts x ON x.workspace_id=v.workspace_id AND x.account_id=v.account_id
 ), lineage(id) AS (SELECT id FROM reserved UNION SELECT edges.to_id FROM lineage JOIN edges ON edges.from_id=lineage.id)
 SELECT id FROM lineage`;
/** Identity aliases record verified projection lineage. Never match ticker/date/price. */
export function coachingUnavailableReviewTrades(db:Database.Database,reviewId:string):ReadonlySet<string>{
 const rows=db.prepare(reviewLineageSql).all(reviewId) as {id:string}[];
 return new Set(rows.map(row=>row.id));
}
export function coachingReviewTradeLineage(db:Database.Database,ids:readonly string[]):ReadonlySet<string>{
 if(!ids.length)return new Set();const seedSql=reviewLineageSql.slice(0,reviewLineageSql.indexOf(' SELECT t.round_trip_id'))+' SELECT value FROM json_each(?)'+reviewLineageSql.slice(reviewLineageSql.indexOf(' ), accounts AS ('));
 return new Set((db.prepare(seedSql).all(JSON.stringify(ids)) as {id:string}[]).map(row=>row.id));
}

/** Count/select the same verified identity units used by the no-repeat guard. */
export function coachingReviewIdentityKeys(db:Database.Database,ids:readonly string[]):ReadonlyMap<string,string>{
 if(!ids.length)return new Map();
 const seedSql=reviewLineageSql.slice(0,reviewLineageSql.indexOf(' SELECT t.round_trip_id'))+' SELECT value FROM json_each(?)'+reviewLineageSql.slice(reviewLineageSql.indexOf(' ), accounts AS ('));
 const pairSql=seedSql.replace('lineage(id) AS (SELECT id FROM reserved UNION SELECT edges.to_id FROM lineage JOIN edges ON edges.from_id=lineage.id)','lineage(seed,id) AS (SELECT id,id FROM reserved UNION SELECT lineage.seed,edges.to_id FROM lineage JOIN edges ON edges.from_id=lineage.id)').replace('SELECT id FROM lineage','SELECT seed,min(id) identity_key FROM lineage GROUP BY seed');
 return new Map((db.prepare(pairSql).all(JSON.stringify([...new Set(ids)])) as {seed:string;identity_key:string}[]).map(row=>[row.seed,row.identity_key]));
}
export function coachingDistinctReviewTrades(db:Database.Database,trades:readonly CoachStudentJournalTrade[],preferredIds:readonly string[]=[],retainExisting=false):readonly CoachStudentJournalTrade[]{
 const keys=coachingReviewIdentityKeys(db,trades.map(trade=>trade.roundTripId)),preferred=new Set(preferredIds),groups=new Set<string>();
 const ranked=[...trades.filter(trade=>preferred.has(trade.roundTripId)),...trades.filter(trade=>!preferred.has(trade.roundTripId))];
 const chosen=new Set(ranked.filter(trade=>{const key=keys.get(trade.roundTripId)??trade.roundTripId;if(groups.has(key))return retainExisting&&preferred.has(trade.roundTripId);groups.add(key);return true;}).map(trade=>trade.roundTripId));
 return trades.filter(trade=>chosen.has(trade.roundTripId));
}

export function coachingReviewTradeCountsByDay(db:Database.Database,trades:readonly CoachStudentJournalTrade[]):Readonly<Record<string,number>>{
 const keys=coachingReviewIdentityKeys(db,trades.map(trade=>trade.roundTripId)),days=new Map<string,Set<string>>();
 for(const trade of trades)if(trade.tradingDate){const group=days.get(trade.tradingDate)??new Set<string>();group.add(keys.get(trade.roundTripId)??trade.roundTripId);days.set(trade.tradingDate,group);}
 return Object.fromEntries([...days].map(([date,groups])=>[date,groups.size]));
}

export function requireEligibleReviewTrades(db:Database.Database,reviewId:string,ids:readonly string[]){
 const unique=[...new Set(ids)];
 if(unique.length>1){
  const seedSql=reviewLineageSql.slice(0,reviewLineageSql.indexOf(' SELECT t.round_trip_id'))+' SELECT value FROM json_each(?)'+reviewLineageSql.slice(reviewLineageSql.indexOf(' ), accounts AS ('));
  const pairSql=seedSql.replace('lineage(id) AS (SELECT id FROM reserved UNION SELECT edges.to_id FROM lineage JOIN edges ON edges.from_id=lineage.id)','lineage(seed,id) AS (SELECT id,id FROM reserved UNION SELECT lineage.seed,edges.to_id FROM lineage JOIN edges ON edges.from_id=lineage.id)').replace('SELECT id FROM lineage','SELECT seed,id FROM lineage');
  const identities=db.prepare(pairSql).all(JSON.stringify(unique)) as {seed:string;id:string}[];const owners=new Map<string,string>();for(const row of identities){if(owners.has(row.id)&&owners.get(row.id)!==row.seed)throw new Error('These selections refer to the same Journal trade or verified merge. Select it once.');owners.set(row.id,row.seed);}
 }
 const unavailable=coachingUnavailableReviewTrades(db,reviewId);
 if(ids.some(id=>unavailable.has(id)))throw new Error("A selected trade is already reviewed or reserved in another review. Refresh the trade table.");
}

export function requireReviewSelectionLimits(db:Database.Database,reviewId:string,trades:readonly CoachStudentJournalTrade[]){
 const service=coachingReviewService(db,reviewId);if(!service)throw new Error("Identify the accepted service before adding trades.");
 const requestedDays=coachingReviewRequestedDays(db,reviewId);if(requestedDays.length&&trades.some(trade=>!trade.tradingDate||!requestedDays.includes(trade.tradingDate)))throw new Error('Select trades from the student-requested days.');
 const review=db.prepare(`SELECT period_start,period_end FROM traderlink_community_coaching_trade_reviews WHERE review_id=?`).get(reviewId) as {period_start:string|null;period_end:string|null};
 if(service.item.itemType==='trade_review'&&service.item.coveragePeriod!=='single_item'&&(!review.period_start||!review.period_end))throw new Error('Choose the date range required by this accepted Trade service.');
 if(service.item.itemType==='trading_day_review'&&trades.length&&(!review.period_start||!review.period_end))throw new Error("Choose the review date range before selecting trading days.");
 if(trades.some(trade=>!trade.tradingDate||(review.period_start&&trade.tradingDate<review.period_start)||(review.period_end&&trade.tradingDate>review.period_end)))throw new Error("Select trades with verified trading dates inside this review period.");
 if(service.item.itemType==='trade_review'&&trades.length>service.item.quantity)throw new Error("The selected trades exceed the agreed review quantity.");
 if(service.item.itemType==='trading_day_review'&&trades.length){
  const cap=coachingReviewTradeCap(db,reviewId);
  if(!cap)throw new Error("This accepted service has no trade cap. Resolve its terms with the student before selecting trades.");
  const days=new Map<string,number>();for(const trade of trades)days.set(trade.tradingDate!,(days.get(trade.tradingDate!)??0)+1);
  if(days.size>service.item.quantity)throw new Error("The selected days exceed this agreement.");
  if(cap.basis==='per_review'?trades.length>cap.quantity:[...days.values()].some(count=>count>cap.quantity))throw new Error("The selected trades exceed the agreed trading-day limit.");
 }
 if(!['trade_review','trading_day_review','strategy_review'].includes(service.item.itemType)&&trades.length)throw new Error("This assessment uses trades as evidence, without additional individual trade reviews.");
}
