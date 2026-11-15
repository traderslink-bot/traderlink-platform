import {independentActiveSelectionSql} from './independent-coaching-selection-lifecycle-storage';
import {createHash} from 'node:crypto';
import type Database from 'better-sqlite3';
import type {CoachingAgreement} from '../contracts/coaching-agreements';
import type {IndependentCoachingReview} from '../contracts/independent-coaching';
import {parseTradeEvaluationTemplate,tradeEvaluationReady,validateTradeEvaluation} from '../contracts/coaching-trade-evaluation';
import {projectImprovementHistory,type DeliveredTradeEvaluation,type StoredImprovementEvent} from '../contracts/coaching-improvement-history';
import {matchesIndependentCoachingTrade} from '../contracts/independent-coaching-trade-selection';
import {IndependentCoachingJournalReadService} from './independent-coaching-journal-read';
/** Called only inside the existing protected delivery transaction. No draft/save caller. */
export function captureDeliveredTradeEvaluations(db:Database.Database,input:{review:IndependentCoachingReview;agreement:CoachingAgreement;actorUserId:string;studentUserId:string;atUtc:string}):void{
 const raw=input.agreement.terms.tradeEvaluationTemplates?.[input.review.planItemId];if(!raw)return;
 const template=parseTradeEvaluationTemplate(raw);
 if(!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_coaching_trade_evaluations'").get())throw new Error('Trade evaluation storage is not enabled yet.');
 if(!input.review.journalAccountId)throw new Error('The agreed Journal account is unavailable.');
 const rows=db.prepare(`SELECT round_trip_id,logical_trade_id,feedback_json FROM traderlink_coaching_review_trades WHERE review_id=? AND ${independentActiveSelectionSql(db)} ORDER BY round_trip_id`).all(input.review.reviewId) as {round_trip_id:string;logical_trade_id:string;feedback_json:string}[];
 const facts=new IndependentCoachingJournalReadService(db).listTrades({enrollmentId:input.review.enrollmentId,actorUserId:input.actorUserId,reviewId:input.review.reviewId});
 for(const row of rows){const feedback=JSON.parse(row.feedback_json) as Record<string,unknown>;if(!tradeEvaluationReady(feedback.evaluation,template))throw new Error('Complete each agreed trade evaluation before delivery.');
  const evaluation=validateTradeEvaluation(feedback.evaluation,template),fact=facts.find(trade=>matchesIndependentCoachingTrade(trade,row.round_trip_id));
  if(!fact||!fact.closedAtUtc||!fact.logicalTradeId)throw new Error('The selected trade facts are unavailable. Restore Journal access before delivery.');
  const snapshot:DeliveredTradeEvaluation={reviewId:input.review.reviewId,roundTripId:row.round_trip_id,logicalTradeId:fact.logicalTradeId,accountId:input.review.journalAccountId,tradeAtUtc:fact.closedAtUtc,tradingDate:fact.tradingDate,symbol:fact.symbol,deliveredAtUtc:input.atUtc,template,evaluation};
  db.prepare('INSERT INTO traderlink_coaching_trade_evaluations VALUES(?,?,?,?,?,?,?,?,?,?)').run(input.review.reviewId,row.round_trip_id,input.actorUserId,input.studentUserId,input.agreement.agreementId,input.review.journalAccountId,fact.logicalTradeId,fact.closedAtUtc,input.atUtc,JSON.stringify(snapshot));
 }
}

/** Freeze each event's exact qualifying window once; later earlier-trade deliveries never overwrite it. */
export function captureImprovementEvents(db:Database.Database,input:{reviewId:string;coachUserId:string;studentUserId:string;accountId:string;atUtc:string}):void{
 const rows=db.prepare(`SELECT s.snapshot_json FROM traderlink_coaching_trade_evaluations s JOIN traderlink_coaching_reviews r ON r.review_id=s.review_id WHERE s.coach_user_id=? AND s.student_user_id=? AND s.journal_account_id=? AND r.status='delivered' ORDER BY s.trade_at_utc,s.logical_trade_id,s.delivered_at_utc,s.review_id,s.round_trip_id`).all(input.coachUserId,input.studentUserId,input.accountId) as {snapshot_json:string}[];
 for(const group of projectImprovementHistory(rows.map(row=>JSON.parse(row.snapshot_json) as DeliveredTradeEvaluation)))for(const event of group.events){
  const id=createHash('sha256').update(JSON.stringify([input.coachUserId,input.studentUserId,input.accountId,event.id])).digest('hex');
  const snapshot:StoredImprovementEvent={criterionKey:group.key,recordedAtUtc:input.atUtc,sourceReviewId:input.reviewId,event};
  db.prepare('INSERT OR IGNORE INTO traderlink_coaching_evaluation_events VALUES(?,?,?,?,?,?,?,?)').run(id,input.coachUserId,input.studentUserId,input.accountId,group.key,input.reviewId,input.atUtc,JSON.stringify(snapshot));
 }
}
