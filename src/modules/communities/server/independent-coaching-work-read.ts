import {parsePerformanceTemplate,performanceProgress,validatePerformanceEvaluation} from '../contracts/coaching-performance-evaluation';
import {daySessionReady,validateDaySessionDraft} from '../contracts/coaching-trading-day-evaluation';
import {independentActiveSelectionSql} from './independent-coaching-selection-lifecycle-storage';
import type Database from 'better-sqlite3';
import {coachingDate,type CoachingAgreementTerms} from '../contracts/coaching-agreements';
import {submissionAllowanceLabel} from '../contracts/coaching-request-submission-limits';
import {coachingServiceFocus,parseCoachingFocus,reviewKindForPlanItem} from '../contracts/coaching-review-workspace';
import {parseIndependentTradeFeedback,independentTradeFeedbackCompleted,parseIndependentReviewDraft} from '../contracts/independent-coaching-review-input';
import {parseTradeEvaluationTemplate} from '../contracts/coaching-trade-evaluation';
import {independentCoachingJournalAccess} from './independent-coaching-journal-access';
import {resolveIndependentCoachingSelectedTrades} from './independent-coaching-selected-trades';
import type {IndependentCoachingTradeIdentity} from '../contracts/independent-coaching-trade-selection';
import {JournalLogicalTradeRepository} from '../../journal/server/logical-trades/journal-logical-trade-repository';
import {narrowWorkspaceAccessToAccount} from '../../platform/contracts/workspace-access-scope';

type ProgressUnit='trades'|'trading_days'|'performance_criteria';
type ProgressUnavailable='accepted_service_unavailable'|'unsupported_unit'|'invalid_saved_selection'|'identity_unavailable'|'feedback_unavailable';
export type IndependentCoachReviewProgress=
 | Readonly<{availability:'available';acceptedQuantity:number;acceptedUnit:ProgressUnit;acceptedAllowanceLabel?:string;progress:Readonly<{unit:ProgressUnit;selected:number;saved:number;writtenRequired?:number;writtenAnswered?:number;feedbackReady?:boolean;includesTradeEvaluations?:true}>;unavailableReason:null}>
 | Readonly<{availability:'unavailable';acceptedQuantity:number|null;acceptedUnit:ProgressUnit|null;acceptedAllowanceLabel?:string;progress:null;unavailableReason:ProgressUnavailable}>;
type ProgressSource={planId:string;planItemId:string;kind:string;termsJson:string|null;agreementStatus:string|null;acceptedAtUtc:string|null;selectedDaysJson:string;dayAssessmentsJson:string|null;draftJson?:string};
type SavedProgressTrade={roundTripId:string;logicalTradeId:string;feedbackJson:string;completed:number};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function unavailable(reason:ProgressUnavailable,acceptedQuantity:number|null=null,acceptedUnit:ProgressUnit|null=null,acceptedAllowanceLabel?:string):IndependentCoachReviewProgress{
 return {availability:'unavailable',acceptedQuantity,acceptedUnit,...(acceptedAllowanceLabel?{acceptedAllowanceLabel}:{}),progress:null,unavailableReason:reason};
}
function jsonObject(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Saved progress unavailable.');
 return value as Record<string,unknown>;
}

/** Resolve only persisted selection IDs; never enumerate eligible Journal trades. */
function selectedProgressGroups(database:Database.Database,coachUserId:string,enrollmentId:string,reviewId:string,trades:readonly SavedProgressTrade[],dateBySelection?:Map<string,string>){
 const access=independentCoachingJournalAccess(database,{enrollmentId,actorUserId:coachUserId,reviewId,requiredScopes:['trades']});
 const account=narrowWorkspaceAccessToAccount(access.scope,access.scope.activeAccountId!);
 const repository=new JournalLogicalTradeRepository(database),candidates=new Map<string,IndependentCoachingTradeIdentity>();
 const groups=new Map<string,SavedProgressTrade[]>(),closedDates=new Map<string,string>();
 for(const selection of trades){
  if(!UUID.test(selection.roundTripId)||typeof selection.logicalTradeId!=='string')throw new Error('Saved identity unavailable.');
  let candidate=candidates.get(selection.logicalTradeId);
  if(!candidate){
   let logicalId=selection.logicalTradeId;
   if(logicalId.startsWith('round-trip:')){
    const physicalId=logicalId.slice('round-trip:'.length);
    if(!UUID.test(physicalId))throw new Error('Saved identity unavailable.');
    // Exact authorized physical ID only. findByRoundTripId would enumerate the account.
    const physical=database.prepare(`SELECT membership.logical_trade_id AS logicalTradeId${dateBySelection?',version.closed_at_utc AS closedAtUtc':''}
FROM journal_round_trips trip
JOIN journal_round_trip_versions version ON version.workspace_id=trip.workspace_id AND version.account_id=trip.account_id AND version.round_trip_version_id=trip.current_version_id
LEFT JOIN journal_active_logical_trade_memberships membership ON membership.workspace_id=trip.workspace_id AND membership.account_id=trip.account_id AND membership.round_trip_id=trip.round_trip_id
WHERE trip.workspace_id=? AND trip.account_id=? AND trip.round_trip_id=? AND trip.lifecycle_state='active' AND version.projection_state='ready_closed'`).get(account.workspaceId,account.accountId,physicalId) as {logicalTradeId:string|null;closedAtUtc?:string}|undefined;
    if(!physical)throw new Error('Saved identity unavailable.');
    if(dateBySelection&&physical.closedAtUtc)closedDates.set(selection.logicalTradeId,physical.closedAtUtc);
    if(physical.logicalTradeId)logicalId=physical.logicalTradeId;
    else candidate={roundTripId:physicalId,logicalTradeId:selection.logicalTradeId,memberIds:[physicalId]};
   }
   if(!candidate){
    if(!UUID.test(logicalId))throw new Error('Saved identity unavailable.');
    const logical=repository.findByLogicalTradeId(account,logicalId);
    if(!logical||logical.lifecycleState!=='active'||!logical.logicalTradeId||!logical.members.length)throw new Error('Saved identity unavailable.');
    if(dateBySelection)closedDates.set(selection.logicalTradeId,logical.closedAtUtc);
    candidate={roundTripId:logical.logicalTradeId,logicalTradeId:logical.logicalTradeId,memberIds:logical.members.map(member=>member.roundTripId)};
   }
   candidates.set(selection.logicalTradeId,candidate);
  }
  // Validate both recorded IDs against the existing resolver independently, then
  // collapse aliases for counting only. Selection/no-repeat/delivery rules do not change.
  const resolved=resolveIndependentCoachingSelectedTrades(database,account,[selection],[candidate]);
  const match=resolved.filter(trade=>trade.reviewSelectionAliases.blocked.length===0&&trade.reviewSelectionAliases.matched.includes(selection.roundTripId)&&trade.reviewSelectionAliases.matched.includes(selection.logicalTradeId));
  if(match.length!==1||!match[0].logicalTradeId)throw new Error('Saved identity unavailable.');
  if(dateBySelection){const at=closedDates.get(selection.logicalTradeId);if(!at)throw new Error('Saved trading date unavailable.');dateBySelection.set(selection.roundTripId,new Intl.DateTimeFormat('en-CA',{timeZone:access.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at)));}
  const key=match[0].logicalTradeId,group=groups.get(key)??[];group.push(selection);groups.set(key,group);
 }
 return [...groups.values()];
}

/** Optional, original-coach metadata. Any unknown retains the underlying work row. */
function readReviewProgress(database:Database.Database,coachUserId:string,row:IndependentCoachWorkRow):IndependentCoachReviewProgress{
 let acceptedQuantity:number|null=null,acceptedUnit:ProgressUnit|null=null,reason:ProgressUnavailable='accepted_service_unavailable';
 let acceptedAllowanceLabel:string|undefined;
 try{
  const source=database.prepare(`SELECT e.plan_id planId,r.plan_item_id planItemId,r.kind,a.terms_json termsJson,a.status agreementStatus,a.accepted_at_utc acceptedAtUtc,
 r.selected_days_json selectedDaysJson,json_extract(r.draft_json,'$.dayAssessments') dayAssessmentsJson,r.draft_json draftJson
 FROM traderlink_coaching_reviews r JOIN traderlink_coaching_enrollments e ON e.enrollment_id=r.enrollment_id
 JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id
 LEFT JOIN traderlink_coaching_accepted_terms a ON a.agreement_id=r.agreement_id AND a.enrollment_id=e.enrollment_id
 WHERE r.review_id=? AND c.coach_user_id=? AND e.status='active' AND r.status IN ('ready','draft')`).get(row.reviewId,coachUserId) as ProgressSource|undefined;
  if(!source?.termsJson||!source.acceptedAtUtc||!['accepted','superseded'].includes(source.agreementStatus??''))return unavailable(reason);
  const terms=jsonObject(JSON.parse(source.termsJson)) as unknown as CoachingAgreementTerms;
  if(terms.planId!==source.planId||!Array.isArray(terms.items))return unavailable(reason);
  const items=terms.items.filter(item=>item?.planItemId===source.planItemId);
  if(items.length!==1)return unavailable(reason);
  const item=items[0];
  if(reviewKindForPlanItem(item.itemType)!==source.kind)return unavailable(reason);
  if(item.itemType==='performance_review'&&terms.performanceEvaluationTemplates){
   const raw=jsonObject(terms.performanceEvaluationTemplates)[source.planItemId];if(raw!==undefined){const template=parsePerformanceTemplate(raw),draft=parseIndependentReviewDraft(JSON.parse(source.draftJson??'{}'));if(draft.performanceEvaluation!==undefined)validatePerformanceEvaluation(draft.performanceEvaluation,template);const progress=performanceProgress(draft.performanceEvaluation,template,draft.focusFeedback?.goals);const feedbackReady=progress.ready&&(!template.periodDesign.overallGoals||Boolean(draft.focusFeedback?.goals?.trim()));return {availability:'available',acceptedQuantity:progress.criteriaTotal,acceptedUnit:'performance_criteria',progress:{unit:'performance_criteria',selected:progress.criteriaTotal,saved:progress.criteriaAnswered,writtenRequired:progress.writtenTotal,writtenAnswered:progress.writtenAnswered,feedbackReady},unavailableReason:null};}
  }
  const unit=item.itemType==='trade_review'&&item.measurementKind==='trades'?'trades':item.itemType==='trading_day_review'&&item.measurementKind==='trading_days'?'trading_days':null;
  if(!unit)return unavailable('unsupported_unit');
  const quantity:unknown=item.quantity;
  if(typeof quantity!=='number'||!Number.isSafeInteger(quantity)||quantity<1)return unavailable(reason);
  acceptedQuantity=quantity;acceptedUnit=unit;reason='invalid_saved_selection';
  const offer=item.itemType==='trade_review'?terms.builderConfig?.offers.trade_review:undefined,allowance=!item.timelineEnabled&&unit==='trades'?offer?.submissionLimits:undefined;
  if(allowance&&Number.isSafeInteger(allowance.perPeriod)&&allowance.perPeriod>0&&allowance.perPeriod<=500)acceptedAllowanceLabel=submissionAllowanceLabel(allowance.perPeriod,offer?.tradeReviewFormat==='pack'?'once':item.frequency);
  const templates=terms.tradeEvaluationTemplates===undefined?undefined:jsonObject(terms.tradeEvaluationTemplates);
  const template=templates&&Object.hasOwn(templates,source.planItemId)?parseTradeEvaluationTemplate(templates[source.planItemId]):undefined;
  if(unit==='trading_days'){
   const raw:unknown=JSON.parse(source.selectedDaysJson);
   if(!Array.isArray(raw)||raw.some(day=>typeof day!=='string'))return unavailable(reason,acceptedQuantity,unit);
   const days=[...new Set(raw.map(day=>coachingDate(day)))];
   if(!days.length||days.length>quantity)return unavailable(reason,acceptedQuantity,unit);
   const assessments=source.dayAssessmentsJson===null?{}:jsonObject(JSON.parse(source.dayAssessmentsJson));
   if(days.some(day=>assessments[day]!==undefined&&typeof assessments[day]!=='string'))return unavailable('feedback_unavailable',acceptedQuantity,unit);
   if(template?.daySessionReview){
    const draft=parseIndependentReviewDraft(JSON.parse(source.draftJson??'{}'));validateDaySessionDraft(draft,days,template);
    const trades=database.prepare(`SELECT t.round_trip_id roundTripId,t.logical_trade_id logicalTradeId,t.feedback_json feedbackJson,t.completed FROM traderlink_coaching_review_trades t WHERE t.review_id=? AND ${independentActiveSelectionSql(database,'t')} ORDER BY t.round_trip_id LIMIT 501`).all(row.reviewId) as SavedProgressTrade[];
    if(trades.length>500)return unavailable('invalid_saved_selection',quantity,unit);
    const dates=new Map<string,string>(),groups=selectedProgressGroups(database,coachUserId,row.enrollmentId,row.reviewId!,trades,dates);
    if(trades.some(trade=>!days.includes(dates.get(trade.roundTripId)??'')))return unavailable('invalid_saved_selection',quantity,unit);
    const saved=days.filter(day=>daySessionReady(day,draft,template.daySessionReview!)&&groups.filter(group=>dates.get(group[0].roundTripId)===day).every(group=>group.every(trade=>trade.completed===1&&independentTradeFeedbackCompleted(parseIndependentTradeFeedback(JSON.parse(trade.feedbackJson)),coachingServiceFocus(item),template)))).length;
    return {availability:'available',acceptedQuantity:quantity,acceptedUnit:unit,progress:{unit,selected:days.length,saved,includesTradeEvaluations:true},unavailableReason:null};
   }
   const saved=days.filter(day=>typeof assessments[day]==='string'&&(assessments[day] as string).trim()).length;
   return {availability:'available',acceptedQuantity:quantity,acceptedUnit:unit,progress:{unit,selected:days.length,saved},unavailableReason:null};
  }
  const trades=database.prepare(`SELECT t.round_trip_id roundTripId,t.logical_trade_id logicalTradeId,t.feedback_json feedbackJson,t.completed
 FROM traderlink_coaching_review_trades t JOIN traderlink_coaching_reviews r ON r.review_id=t.review_id
 JOIN traderlink_coaching_enrollments e ON e.enrollment_id=r.enrollment_id JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id
 WHERE r.review_id=? AND c.coach_user_id=? AND e.status='active' AND r.status IN ('ready','draft') AND ${independentActiveSelectionSql(database,'t')} ORDER BY t.round_trip_id LIMIT 501`).all(row.reviewId,coachUserId) as SavedProgressTrade[];
  if(!trades.length||trades.length>500)return unavailable(reason,acceptedQuantity,unit,acceptedAllowanceLabel);
  reason='identity_unavailable';
  const groups=selectedProgressGroups(database,coachUserId,row.enrollmentId,row.reviewId!,trades);
  if(!groups.length||groups.length>quantity)return unavailable('invalid_saved_selection',acceptedQuantity,unit,acceptedAllowanceLabel);
  reason='feedback_unavailable';
  const focus=coachingServiceFocus({...item,focusAreas:parseCoachingFocus(item.focusAreas??[])});
  const completion=groups.map(group=>group.map(trade=>{
   const feedback=parseIndependentTradeFeedback(JSON.parse(trade.feedbackJson));
   if(trade.completed!==0&&trade.completed!==1)throw new Error('Saved completion unavailable.');
   return trade.completed===1&&independentTradeFeedbackCompleted(feedback,focus,template);
  }));
  const saved=completion.filter(group=>group.every(Boolean)).length;
  return {availability:'available',acceptedQuantity:quantity,acceptedUnit:unit,...(acceptedAllowanceLabel?{acceptedAllowanceLabel}:{}),progress:{unit,selected:groups.length,saved},unavailableReason:null};
 }catch{return unavailable(reason,acceptedQuantity,acceptedUnit,acceptedAllowanceLabel);}
}

export type IndependentCoachWorkRow={reviewId:string|null;workId?:string;serviceType?:string;enrollmentId:string;studentId:string;studentName:string;planId:string;planName:string;kind:string;status:string;dueAtUtc:string;periodStart:string|null;periodEnd:string|null;reviewProgress?:IndependentCoachReviewProgress};
/** Submitted work only; expected student submissions are not a coach deadline. */
export function readIndependentCoachReviewWork(database:Database.Database,coachUserId:string):readonly IndependentCoachWorkRow[]{
 const rows=database.prepare(`SELECT r.review_id reviewId,r.enrollment_id enrollmentId,e.student_user_id studentId,u.display_name studentName,
   e.plan_id planId,json_extract(a.terms_json,'$.planName') planName,r.kind,r.status,r.due_at_utc dueAtUtc,r.period_start periodStart,r.period_end periodEnd
   FROM traderlink_coaching_reviews r JOIN traderlink_coaching_enrollments e ON e.enrollment_id=r.enrollment_id
   JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id JOIN traderlink_coaching_accepted_terms a ON a.agreement_id=r.agreement_id
   JOIN platform_users u ON u.user_id=e.student_user_id WHERE c.coach_user_id=? AND e.status='active' AND r.status IN ('ready','draft') AND r.due_at_utc IS NOT NULL
   ORDER BY r.due_at_utc,r.review_id`).all(coachUserId) as IndependentCoachWorkRow[];
 return rows.map(row=>({...row,reviewProgress:readReviewProgress(database,coachUserId,row)}));
}

/** Only scheduled coach obligations enter the agenda; student-assigned lessons
 * and expected student submissions are not silently turned into coach work. */
export function readIndependentCoachWork(database:Database.Database,coachUserId:string):readonly IndependentCoachWorkRow[]{
 const reviews=readIndependentCoachReviewWork(database,coachUserId);
 const services=database.prepare(`SELECT NULL reviewId,w.work_id workId,w.enrollment_id enrollmentId,e.student_user_id studentId,u.display_name studentName,
 e.plan_id planId,json_extract(a.terms_json,'$.planName') planName,w.kind,w.status,w.due_at_utc dueAtUtc,NULL periodStart,NULL periodEnd,json_extract(w.data_json,'$.serviceType') serviceType
 FROM traderlink_coaching_work w JOIN traderlink_coaching_enrollments e ON e.enrollment_id=w.enrollment_id
 JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id JOIN traderlink_coaching_accepted_terms a ON a.agreement_id=w.agreement_id JOIN platform_users u ON u.user_id=e.student_user_id
 WHERE c.coach_user_id=? AND e.status='active' AND w.status IN ('open','scheduled','assigned') AND w.due_at_utc IS NOT NULL AND json_extract(w.data_json,'$.assignedTo')='coach'
 ORDER BY w.due_at_utc,w.work_id`).all(coachUserId) as IndependentCoachWorkRow[];
 const followUps=database.prepare(`SELECT r.review_id reviewId,r.enrollment_id enrollmentId,e.student_user_id studentId,u.display_name studentName,e.plan_id planId,json_extract(a.terms_json,'$.planName') planName,'follow_up' kind,'scheduled' status,f.follow_up_due_at_utc dueAtUtc,r.period_start periodStart,r.period_end periodEnd,'review_follow_up' serviceType FROM traderlink_coaching_review_follow_up f JOIN traderlink_coaching_reviews r ON r.review_id=f.review_id JOIN traderlink_coaching_enrollments e ON e.enrollment_id=r.enrollment_id JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id JOIN traderlink_coaching_accepted_terms a ON a.agreement_id=r.agreement_id JOIN platform_users u ON u.user_id=e.student_user_id WHERE c.coach_user_id=? AND e.status='active' AND r.status='delivered' AND f.completed_at_utc IS NULL AND f.follow_up_due_at_utc IS NOT NULL`).all(coachUserId) as IndependentCoachWorkRow[];
 return [...reviews,...services,...followUps].sort((a,b)=>a.dueAtUtc.localeCompare(b.dueAtUtc)||(a.reviewId??a.workId??'').localeCompare(b.reviewId??b.workId??''));
}
