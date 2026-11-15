import {studentTradeReplacementPeriod} from '../contracts/coaching-student-trade-replacement';
import {coachingPeriod} from '../contracts/coaching-agreements';
import {submissionPeriod,submissionDate} from '../contracts/coaching-request-submission-limits';
import {earlierTradeAllowed,coachTradeDateAllowed} from '../contracts/coaching-student-review-preferences';
import {independentSelectionLifecycleReady} from './independent-coaching-selection-lifecycle-storage';
import {requiresTradeReviewQuantity} from '../contracts/coaching-trade-review-selection-policy';
import {type TradeReviewEligibility} from '../contracts/coaching-trade-review-older-policy';
import {coachingDate} from '../contracts/coaching-agreements';
import {IndependentCoachingRepository} from './independent-coaching-repository';
import {resolveIndependentCoachingSelectedTrades} from './independent-coaching-selected-trades';
import {matchesIndependentCoachingTrade} from '../contracts/independent-coaching-trade-selection';
import {independentCoachingUnavailableTrades} from './independent-coaching-trade-eligibility';
import type Database from 'better-sqlite3';
import Decimal from 'decimal.js';
import {narrowWorkspaceAccessToAccount} from '../../platform/contracts/workspace-access-scope';
import {JournalLogicalTradeRepository} from '../../journal/server/logical-trades/journal-logical-trade-repository';
import {JournalAnalyticsFactSetRepository} from '../../journal/server/analytics/journal-analytics-fact-set-repository';
import {normalizeJournalAnalyticsFacts} from '../../journal-analytics/server/normalize-journal-analytics-facts';
import {readJournalTradeStory} from '../../journal/server/trade-story/journal-trade-story-read-service';
import {independentCoachingJournalAccess} from './independent-coaching-journal-access';
import {independentCoachingReviewPeriod} from '../contracts/independent-coaching-review-period';
import {JournalAnnotationService} from '../../journal/server/annotations/journal-annotation-service';
import {JournalAnnotationRepository} from '../../journal/server/annotations/journal-annotation-repository';
import {JournalRuleRepository} from '../../journal/server/annotations/journal-rule-repository';

export class IndependentCoachingJournalReadService {
 constructor(private readonly database:Database.Database){}
 private population(input:{enrollmentId:string;actorUserId:string;reviewId?:string;excludeReviewed?:boolean},periodOverride?:{start:string|null;end:string|null}){
  const access=independentCoachingJournalAccess(this.database,{...input,requiredScopes:['trades']});
  const account=narrowWorkspaceAccessToAccount(access.scope,access.scope.activeAccountId!);
  const groups=new JournalLogicalTradeRepository(this.database).list(account).filter(group=>group.lifecycleState==='active');
  const facts=new JournalAnalyticsFactSetRepository(this.database).read(access.scope,{accountIds:[account.accountId],closingDateRange:{kind:'all_available'},currencySelection:{kind:'all_partitions'}});
  const rows=new Map(normalizeJournalAnalyticsFacts(facts).realizedRows.map(row=>[row.roundTripId,row]));
  const date=(at:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:access.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
  const enrollment=new IndependentCoachingRepository(this.database).enrollment(input.enrollmentId,input.actorUserId);
  const used=access.review?independentCoachingUnavailableTrades(this.database,{coachUserId:enrollment.coach_user_id,studentUserId:enrollment.student_user_id,reviewId:access.review.reviewId}):new Set<string>();
  const factualTrades=groups.map(group=>{
   const members=group.members.map(member=>rows.get(member.roundTripId)),net=members.every(row=>row?.netPnlDecimal!==null&&row?.netPnlDecimal!==undefined)?members.reduce((sum,row)=>sum.plus(row!.netPnlDecimal!),new Decimal(0)).toFixed():null;
   return {roundTripId:group.logicalTradeId??group.members[0]!.roundTripId,representativeRoundTripId:group.members[0]!.roundTripId,logicalTradeId:group.logicalTradeId??`round-trip:${group.members[0]!.roundTripId}`,memberIds:group.members.map(member=>member.roundTripId),symbol:group.symbol,direction:group.direction,currency:group.currency,openedAtUtc:group.openedAtUtc,closedAtUtc:group.closedAtUtc,tradingDate:date(group.closedAtUtc),netPnlDecimal:net};
  });
  const selected=access.review?new IndependentCoachingRepository(this.database).reviewTrades(access.review.reviewId,input.actorUserId):[];
  const trades=resolveIndependentCoachingSelectedTrades(this.database,account,selected,factualTrades);
  if(periodOverride?.start)coachingDate(periodOverride.start);if(periodOverride?.end)coachingDate(periodOverride.end);if(periodOverride?.start&&periodOverride.end&&periodOverride.start>periodOverride.end)throw new Error('Choose a valid review period.');
  const period=periodOverride??(access.review?independentCoachingReviewPeriod(access.review,selected,trades):{start:null,end:null});
  // Before submission the student needs the eligible picker. Submitted
  // individual reviews must never fall back to the entire shared account.
  if(access.review&&access.review.status!=='awaiting_submission'&&['trade','trading_day','strategy'].includes(access.review.kind)&&(!period.start||!period.end))throw new Error('The review period is unavailable.');
  const eligible=trades.filter(trade=>!used.has(trade.logicalTradeId)&&!used.has(trade.roundTripId)&&!trade.memberIds.some(id=>used.has(id)));
  const repo=new IndependentCoachingRepository(this.database),agreement=access.review?repo.agreements(input.enrollmentId,input.actorUserId).find(a=>a.agreementId===access.review!.agreementId):undefined,item=agreement?.terms.items.find(i=>i.planItemId===access.review!.planItemId);
  const created=access.review?this.database.prepare('SELECT created_at_utc FROM traderlink_coaching_reviews WHERE review_id=?').get(access.review.reviewId) as {created_at_utc:string}:null;
  const scheduled=item&&agreement&&access.review?coachingPeriod(agreement.terms,item,access.review.occurrenceIndex):null;
  const selectionStart=access.review?.kind==='trade'&&item&&agreement?((item.coveragePeriod==='single_item'?null:access.review.periodStart)??scheduled?.start??(item.frequency==='once'?(agreement.terms.startDate??submissionDate(created!.created_at_utc)):submissionPeriod(access.review.submittedAtUtc??created!.created_at_utc,item.frequency,agreement.terms.startDate??submissionDate(agreement.acceptedAtUtc!),agreement.terms.customIntervalDays).start)):period.start;
  const studentSelections=new Set(access.review?(this.database.prepare("SELECT object_id FROM traderlink_coaching_events WHERE enrollment_id=? AND actor_user_id=? AND kind='review_trade_selected' AND substr(object_id,1,?)=?").all(input.enrollmentId,enrollment.student_user_id,access.review.reviewId.length+1,`${access.review.reviewId}:`) as {object_id:string}[]).map(row=>row.object_id.slice(access.review!.reviewId.length+1)):[]);
  const inPeriod=(trade:{tradingDate:string;roundTripId?:string})=>(access.review?.kind==='trade'?coachTradeDateAllowed(agreement?.terms.studentReviewPreferences,trade.tradingDate,selectionStart,enrollment.student_user_id===input.actorUserId,Boolean(trade.roundTripId&&studentSelections.has(trade.roundTripId))):!selectionStart||trade.tradingDate>=selectionStart)&&(!period.end||trade.tradingDate<=period.end);
  const original=eligible.filter(inPeriod);
  const hasOlderPolicy=Boolean(item&&access.review?.kind==='trade'&&selectionStart);
  const olderCandidates=hasOlderPolicy?eligible.filter(trade=>trade.tradingDate<selectionStart!&&earlierTradeAllowed(agreement?.terms.studentReviewPreferences,trade.tradingDate,enrollment.student_user_id===input.actorUserId,selected.some(row=>matchesIndependentCoachingTrade(trade,row.roundTripId)&&studentSelections.has(row.roundTripId)))):[];
  const older=olderCandidates,retainedOlder=olderCandidates.filter(trade=>selected.some(row=>matchesIndependentCoachingTrade(trade,row.roundTripId)));
  const pickerAllowed=Boolean(access.review&&item&&(access.review.status==='awaiting_submission'?(enrollment.coach_user_id===input.actorUserId?['coach','coach_or_student'].includes(item.selectionMode):['student','coach_or_student'].includes(item.selectionMode)):enrollment.coach_user_id===input.actorUserId&&['ready','draft'].includes(access.review.status)&&['coach','coach_or_student'].includes(item.selectionMode)));
  return {access,enrollment,actorUserId:input.actorUserId,trades,selected,period:{...period,start:selectionStart},inPeriod,eligible,original,older,olderCandidates,retainedOlder,item,agreement,hasOlderPolicy,pickerAllowed};
 }
 listTrades(input:{enrollmentId:string;actorUserId:string;reviewId?:string;excludeReviewed?:boolean;olderFrom?:string;pickerPeriod?:{start:string|null;end:string|null}}){
  const review=input.reviewId?new IndependentCoachingRepository(this.database).review(input.reviewId,input.actorUserId):null;
  const override=review?.status==='awaiting_submission'&&input.pickerPeriod?{start:review.periodStart??input.pickerPeriod.start,end:review.periodEnd??input.pickerPeriod.end}:undefined;
  const data=this.population(input,override);
  if(input.olderFrom){coachingDate(input.olderFrom);if(!data.pickerAllowed||!data.older.length||!data.period.start||input.olderFrom>=data.period.start)throw new Error('Earlier trades are unavailable for this review.');}
  const source=input.excludeReviewed?data.eligible:data.trades;
  return source.filter(trade=>data.inPeriod(trade)||data.pickerAllowed&&data.older.some(older=>older.logicalTradeId===trade.logicalTradeId)||data.selected.some(row=>matchesIndependentCoachingTrade(trade,row.roundTripId))&&data.olderCandidates.some(older=>older.logicalTradeId===trade.logicalTradeId)||Boolean(input.olderFrom&&data.older.some(older=>older.logicalTradeId===trade.logicalTradeId)&&trade.tradingDate>=input.olderFrom!));
 }
 /** Student-only replacement picker; ordinary submitted-review readers remain bounded. */
 studentReplacementTrades(input:{enrollmentId:string;actorUserId:string;reviewId:string;atUtc:string}){
  const state=new IndependentCoachingRepository(this.database).studentTradeReplacementState(input.reviewId,input.actorUserId);
  const period=studentTradeReplacementPeriod(state.terms,state.item,state.review,input.atUtc),data=this.population(input,period);
  return data.eligible.filter(trade=>data.inPeriod(trade)||data.older.some(older=>older.logicalTradeId===trade.logicalTradeId));
 }
 tradeReviewEligibility(input:{enrollmentId:string;actorUserId:string;reviewId:string;period?:{start:string|null;end:string|null}}):TradeReviewEligibility{
  const data=this.population(input,input.period);if(data.access.review?.kind!=='trade'||!data.pickerAllowed||!data.item)throw new Error('Trade selection is unavailable.');
  const combined=[...data.original,...data.older,...data.retainedOlder],eligibleCount=new Set(combined.map(trade=>trade.logicalTradeId)).size;
  const exactQuantity=requiresTradeReviewQuantity(data.agreement?.terms.tradeReviewSelectionPolicy,data.item)&&!(!data.item.timelineEnabled&&data.agreement?.terms.builderConfig?.offers[data.item.itemType]?.submissionLimits);
  return {originalCount:data.original.length,eligibleCount,required:Math.min(exactQuantity?data.item.quantity:1,eligibleCount),exactQuantity,maximum:data.item.quantity,selectionChangesAvailable:independentSelectionLifecycleReady(this.database),olderAvailable:data.older.length>0,earliestDate:data.older.map(trade=>trade.tradingDate).sort()[0]??null};
 }
 /** Exact tombstone exceptions are server-only inputs to the atomic restore operation, never picker parameters. */
 private restoreCandidates(data:ReturnType<IndependentCoachingJournalReadService['population']>,ids:readonly string[]){
  if(!ids.length)return [];
  const review=data.access.review,actor=data.enrollment.coach_user_id;
  if(!review||review.kind!=='trade'||data.actorUserId!==actor||!data.pickerAllowed||data.access.scope.activeAccountId!==review.journalAccountId||!['ready','draft'].includes(review.status)||!data.item||!independentSelectionLifecycleReady(this.database))throw new Error('This saved selection cannot be restored.');
  return [...new Set(ids)].map(id=>{
   const removed=this.database.prepare("SELECT logical_trade_id,completed,removed_by_user_id FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=? AND selection_state='removed'").get(review.reviewId,id) as {logical_trade_id:string;completed:number;removed_by_user_id:string}|undefined;
   const origin=this.database.prepare("SELECT actor_user_id FROM traderlink_coaching_events WHERE enrollment_id=? AND kind='review_trade_selected' AND object_id=? ORDER BY created_at_utc DESC,rowid DESC LIMIT 1").get(review.enrollmentId,`${review.reviewId}:${id}`) as {actor_user_id:string}|undefined;
   if(!removed||removed.completed||removed.removed_by_user_id!==actor||origin?.actor_user_id!==actor)throw new Error('Only this coach’s removed partial draft can be restored.');
   const trade=data.eligible.find(trade=>matchesIndependentCoachingTrade(trade,id)&&trade.logicalTradeId===removed.logical_trade_id);
   if(!trade||(!data.inPeriod(trade)&&!(data.olderCandidates.some(candidate=>candidate.logicalTradeId===trade.logicalTradeId))))throw new Error('This removed trade is outside the accepted shared coverage or is already reserved.');
   return trade;
  });
 }
 removedReviewTradeMetadata(input:{enrollmentId:string;actorUserId:string;reviewId:string}){
  const rows=new IndependentCoachingRepository(this.database).removedReviewTrades(input.reviewId,input.actorUserId),data=this.population(input);
  return rows.map(row=>{
   const removed=this.database.prepare("SELECT logical_trade_id FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=? AND selection_state='removed' AND removed_by_user_id=?").get(input.reviewId,row.roundTripId,input.actorUserId) as {logical_trade_id:string}|undefined;
   const origin=this.database.prepare("SELECT actor_user_id FROM traderlink_coaching_events WHERE enrollment_id=? AND kind='review_trade_selected' AND object_id=? ORDER BY created_at_utc DESC,rowid DESC LIMIT 1").get(input.enrollmentId,`${input.reviewId}:${row.roundTripId}`) as {actor_user_id:string}|undefined;
   const trade=origin?.actor_user_id===input.actorUserId&&removed?data.trades.find(trade=>matchesIndependentCoachingTrade(trade,row.roundTripId)&&trade.logicalTradeId===removed.logical_trade_id&&(data.inPeriod(trade)||data.olderCandidates.some(candidate=>candidate.logicalTradeId===trade.logicalTradeId))):undefined;
   return {...row,symbol:trade?.symbol??null,tradingDate:trade?.tradingDate??null};
  });
 }
 /** Called synchronously within the mutation's IMMEDIATE transaction on the same DB handle. */
 tradeReviewEligibleCount(input:{enrollmentId:string;actorUserId:string;reviewId:string;selected:readonly {roundTripId:string;logicalTradeId:string}[];period:{start:string|null;end:string|null};restoreRoundTripIds?:readonly string[]}):number{
  const data=this.population({...input,excludeReviewed:true},input.period),eligible=[...data.original,...data.older,...data.retainedOlder,...this.restoreCandidates(data,input.restoreRoundTripIds??[])];
  for(const selected of input.selected)if(!eligible.some(trade=>matchesIndependentCoachingTrade(trade,selected.roundTripId)&&trade.logicalTradeId===selected.logicalTradeId))throw new Error('Choose available trades from the shared Journal account within the agreed coverage.');
  return new Set(eligible.map(trade=>trade.logicalTradeId)).size;
 }

 verifySelection(input:{enrollmentId:string;actorUserId:string;reviewId:string;ids:readonly string[];days:readonly string[];period:{start:string|null;end:string|null};restoreRoundTripIds?:readonly string[]}){
  const data=this.population({...input,excludeReviewed:true},input.period),restored=this.restoreCandidates(data,input.restoreRoundTripIds??[]),trades=[...data.original,...data.older,...data.retainedOlder,...restored],selected=input.ids.map(id=>trades.find(trade=>matchesIndependentCoachingTrade(trade,id)));
  if(selected.some(trade=>!trade))throw new Error('Choose trades from the shared Journal account.');
  for(const trade of selected){if((input.period.start&&trade!.tradingDate<input.period.start&&!data.older.some(older=>older.logicalTradeId===trade!.logicalTradeId)&&!data.retainedOlder.some(older=>older.logicalTradeId===trade!.logicalTradeId)&&!restored.some(older=>older.logicalTradeId===trade!.logicalTradeId))||(input.period.end&&trade!.tradingDate>input.period.end))throw new Error('Trade outside the review period.');if(input.days.length&&!input.days.includes(trade!.tradingDate))throw new Error('Trade outside the selected trading days.');}
  const access=independentCoachingJournalAccess(this.database,{...input,requiredScopes:['trades']});
  if(access.review?.kind==='trading_day'){
   const row=this.database.prepare('SELECT terms_json FROM traderlink_coaching_accepted_terms WHERE agreement_id=?').get(access.review.agreementId) as {terms_json:string};
   const terms=JSON.parse(row.terms_json) as import('../contracts/coaching-agreements').CoachingAgreementTerms,cap=terms.builderConfig?.offers.trading_day_review?.tradeCap;
   if(!cap)throw new Error('Agree the trading-day trade limit before selecting work.');
   const counts=new Map<string,number>();for(const trade of selected)counts.set(trade!.tradingDate,(counts.get(trade!.tradingDate)??0)+1);
   if(cap.basis==='per_review'?selected.length>cap.quantity:[...counts.values()].some(count=>count>cap.quantity))throw new Error('Selected trades exceed the agreed trading-day limit.');
  }
  return selected.map((trade,index)=>({roundTripId:input.ids[index],logicalTradeId:trade!.logicalTradeId,tradingDate:trade!.tradingDate}));
 }
 dayContext(input:{enrollmentId:string;actorUserId:string;reviewId:string}){
  const access=independentCoachingJournalAccess(this.database,{...input,requiredScopes:['trades']}),review=access.review!;
  const account=narrowWorkspaceAccessToAccount(access.scope,access.scope.activeAccountId!),repository=new JournalAnnotationRepository(this.database),rules=new JournalRuleRepository(this.database),annotations=new JournalAnnotationService(repository,rules);
  const days=[...review.selectedDays].sort();
  if(!days.length&&review.periodStart&&review.periodEnd){
   const first=Date.parse(review.periodStart),last=Date.parse(review.periodEnd);if(last-first>366*86400000)throw new Error('Choose a review period within one year.');
   for(let at=first;at<=last;at+=86400000)days.push(new Date(at).toISOString().slice(0,10));
  }
  const titles=access.permits('day_rules')?new Map(rules.list(account).map(rule=>[rule.ruleId,rule.title])):new Map<string,string>();
  return days.map(date=>{
   const note=access.permits('journal_notes')?annotations.readDailyNote(account,date):null,tradingDayId=repository.findTradingDayId(account,date);
   return {date,notes:note?{whatWorked:note.whatWorked,whatNeedsWork:note.whatNeedsWork,technicalRecap:note.technicalRecap,tomorrowsFocus:note.tomorrowsFocus,anythingElse:note.anythingElse}:null,
    rules:access.permits('day_rules')&&tradingDayId?annotations.listRuleReviews(account,{tradingDayId,roundTripIds:[]}).map(rule=>({title:titles.get(rule.ruleId)??'Rule',status:rule.status,note:rule.note})):[]};
  }).filter(day=>day.notes||day.rules.length);
 }
 tradeCard(input:{enrollmentId:string;actorUserId:string;reviewId:string;roundTripId:string}){
  const access=independentCoachingJournalAccess(this.database,{...input,requiredScopes:['trades']});
  const trade=this.listTrades(input).find(trade=>matchesIndependentCoachingTrade(trade,input.roundTripId));
  if(!trade)throw new Error('This trade is outside the shared review.');
  const source=readJournalTradeStory(access.scope,trade.representativeRoundTripId);
  return {...source,notes:access.permits('trade_notes')?source.notes:null,ruleReviews:access.permits('rules')?source.ruleReviews:[],tags:access.permits('tags')?source.tags:[],hasCurrentAnalyzerResult:access.permits('analytics')&&source.hasCurrentAnalyzerResult};
 }
}
