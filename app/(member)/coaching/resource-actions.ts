"use server";
import {requireCoachingPilotIdentity} from "@/src/modules/communities/server/coaching-pilot-request-identity";
import {JournalRuleRepository} from '@/src/modules/journal/server/annotations/journal-rule-repository';
import {narrowWorkspaceAccessToAccount} from '@/src/modules/platform/contracts/workspace-access-scope';
import {JOURNAL_RULE_TEMPLATE_CATALOG} from '@/src/modules/journal/server/annotations/journal-trading-rules-dashboard';
import {TradeAnalysisPage,type TradeAnalysisResourceModel} from '@/app/(dashboard)/analytics/trade-analysis-page';
import {requireTraderLinkPlatformBillingPageIdentity} from '@/src/modules/platform/server/authentication/require-platform-request-scope';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';
import {independentCoachingJournalAccess} from '@/src/modules/communities/server/independent-coaching-journal-access';
import {IndependentCoachingRepository} from '@/src/modules/communities/server/independent-coaching-repository';
import {IndependentCoachingJournalReadService} from '@/src/modules/communities/server/independent-coaching-journal-read';
import type {CoachingAnalyticsModel} from '@/app/(dashboard)/communities/coaching-review-resource-actions';
import type {readRuleResults} from '@/app/(dashboard)/rules/results/rule-results-data';
import type {TradeExplorerPageModel} from '@/app/(dashboard)/analytics/trade-explorer/trade-explorer-service';
import {readScopedCoachingAnalyzerEvidence} from '@/app/(dashboard)/communities/coaching-analyzer-evidence-reader';
import type {ReactNode} from 'react';
import {coachingResource,type CoachingResourceId} from '@/src/modules/communities/contracts/coaching-review-resources';
import {coachingAnalyzerResources} from '@/src/modules/communities/server/coaching-review-analyzer-availability';
import {parseCoachingReviewTrackerLink,requireCoachingReviewLinkedTrade} from '@/src/modules/communities/contracts/coaching-review-trade-links';
import {matchesIndependentCoachingTrade} from '@/src/modules/communities/contracts/independent-coaching-trade-selection';
import {independentCoachingReviewPeriod} from '@/src/modules/communities/contracts/independent-coaching-review-period';

async function accessFor(reviewId:string,rules:boolean){
 const identity=requireCoachingPilotIdentity(await requireTraderLinkPlatformBillingPageIdentity());
 return withReadonlyPlatformDatabase({},db=>{
  const review=new IndependentCoachingRepository(db).review(reviewId,identity.scope.userId);
  if(!['ready','draft','delivered'].includes(review.status))throw new Error('Submit the review work before opening reports.');
  const input={reviewId,enrollmentId:review.enrollmentId,actorUserId:identity.scope.userId};
  const access=independentCoachingJournalAccess(db,{...input,requiredScopes:rules?['trades','analytics','rules','day_rules']:['trades','analytics']});
  const {start,end}=independentCoachingReviewPeriod(review,new IndependentCoachingRepository(db).reviewTrades(reviewId,identity.scope.userId),new IndependentCoachingJournalReadService(db).listTrades(input));
  if(!start||!end)throw new Error('Choose the review period before opening reports.');
  return {scope:access.scope,authorizationKey:access.authorizationKey,period:{start,end},scopes:access.scopes,authorization:{kind:'independent' as const,actorUserId:identity.scope.userId,reviewId,enrollmentId:review.enrollmentId}};
 });
}

export async function loadIndependentCoachingReport(reviewId:string,resource:Exclude<CoachingResourceId,'lab'|'candles'>,parameters:Record<string,string>={}):Promise<{content:ReactNode;analyzerModel:TradeAnalysisResourceModel|null;period:{start:string;end:string}|null;analyticsModel:CoachingAnalyticsModel|null;rulesModel:Awaited<ReturnType<typeof readRuleResults>>|null;explorerModel:{kind:'explorer'|'compare';model:TradeExplorerPageModel;enrollmentId:string}|null;error:string|null}>{
 try{
  const access=await accessFor(reviewId,resource==='rules'),searchParams={...parameters,range:'custom',start:access.period.start,end:access.period.end,startDate:access.period.start,endDate:access.period.end};
  let analyticsModel:CoachingAnalyticsModel|null=null,rulesModel:Awaited<ReturnType<typeof readRuleResults>>|null=null,explorerModel:{kind:'explorer'|'compare';model:TradeExplorerPageModel;enrollmentId:string}|null=null;
  let analyzerModel:TradeAnalysisResourceModel|null=null;const content:ReactNode=null;
  switch(resource){
   case 'overview':{const {loadAnalyticsOverviewModel}=await import('@/app/(dashboard)/analytics/analytics-overview-page');analyticsModel={kind:'overview',model:await loadAnalyticsOverviewModel({resourceScope:access.scope,searchParams})};break;}
   case 'ticker':{const {loadResultsAnalyticsModel}=await import('@/app/(dashboard)/analytics/results-analytics-page');const {selectedRange,moneyBasis,rows}=await loadResultsAnalyticsModel({resourceScope:access.scope,searchParams});analyticsModel={kind:'ticker',model:{selectedRange,moneyBasis,rows}};break;}
   case 'timing':{const {loadTimingAnalyticsModel}=await import('@/app/(dashboard)/analytics/timing/timing-analytics-page');const {chartData,completedTradeCount,moneyBasis,timezone}=await loadTimingAnalyticsModel({resourceScope:access.scope,period:access.period,searchParams:Promise.resolve({basis:parameters.basis})});analyticsModel={kind:'timing',model:{chartData,completedTradeCount,moneyBasis,timezone}};break;}
   case 'breakdown':{const {loadExecutionAnalyticsModel}=await import('@/app/(dashboard)/analytics/execution-analytics-page');const {chartData,currency,moneyBasis,priceComparison,priceInsights,priceResults,priceResultsByDirection,rows,selectedRange}=await loadExecutionAnalyticsModel({resourceScope:access.scope,searchParams});analyticsModel={kind:'breakdown',model:{chartData,currency,moneyBasis,priceComparison,priceInsights,priceResults,priceResultsByDirection,rows,selectedRange}};break;}
   case 'rules':{const {readRuleResults}=await import('@/app/(dashboard)/rules/results/rule-results-data');const selectedDay=parameters.day;if(selectedDay){const review=withReadonlyPlatformDatabase({},db=>new IndependentCoachingRepository(db).review(reviewId,access.authorization.actorUserId));if(review.kind!=='trading_day'||!review.selectedDays.includes(selectedDay)||selectedDay<access.period.start||selectedDay>access.period.end)throw new Error('Choose a selected trading day.');}rulesModel=await readRuleResults(access.scope,{startDate:selectedDay??access.period.start,endDate:selectedDay??access.period.end});break;}
   case 'explorer':case 'compare':{
    const {readTradeExplorerPageModel}=await import('@/app/(dashboard)/analytics/trade-explorer/trade-explorer-service');
    const source=await readTradeExplorerPageModel(access.scope,{startDate:access.period.start,endDate:access.period.end},access.authorization);
    const model={...source,minimumDate:access.period.start,maximumDate:access.period.end,annotationOptions:{tags:access.scopes.includes('tags')?source.annotationOptions.tags:[],tradeRules:access.scopes.includes('rules')?source.annotationOptions.tradeRules:[],dayRules:access.scopes.includes('day_rules')?source.annotationOptions.dayRules:[]}};
    explorerModel={kind:resource,model,enrollmentId:access.authorization.enrollmentId};break;
   }
   case 'day':case 'entry-exit':case 'mfe-mae':case 'green-to-red':case 'scaling-out':case 'candle-patterns':case 'trend-momentum':case 'trades':{
    if(!applicableAnalyzerResources(access).includes(resource))throw new Error('Saved analysis is not applicable to this period.');
    analyzerModel=await TradeAnalysisPage({resourceScope:access.scope,baseHref:coachingResource(resource)!.path,searchParams,view:resource});break;
   }
   default:throw new Error('Choose an available report.');
  }
  const current=await accessFor(reviewId,resource==='rules');
  if(current.authorizationKey!==access.authorizationKey||current.period.start!==access.period.start||current.period.end!==access.period.end)throw new Error('Journal access changed while loading.');
  return {content,analyzerModel,period:access.period,analyticsModel,rulesModel,explorerModel,error:null};
 }catch{return {content:null,analyzerModel:null,period:null,analyticsModel:null,rulesModel:null,explorerModel:null,error:'This report is unavailable. Check current Journal access and the review period.'};}
}

function applicableAnalyzerResources(access:Awaited<ReturnType<typeof accessFor>>){
 return withReadonlyPlatformDatabase({},db=>{
  const trades=new IndependentCoachingJournalReadService(db).listTrades(access.authorization);
  return coachingAnalyzerResources(db,access.scope,trades.filter(trade=>trade.tradingDate>=access.period.start&&trade.tradingDate<=access.period.end).map(trade=>trade.roundTripId));
 });
}
export async function independentCoachingAnalyzerResources(reviewId:string):Promise<readonly string[]>{
 try{const access=await accessFor(reviewId,false),resources=applicableAnalyzerResources(access);await recheck(reviewId,access);return resources;}catch{return [];}
}

function permittedQuery(access:Awaited<ReturnType<typeof accessFor>>,input:unknown){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Check the report filters.');
 const raw=input as Record<string,unknown>;
 for(const [scope,keys] of [['tags',['tagId','untaggedOnly']],['rules',['ruleId','ruleVersionId','ruleStatus','reviewIncompleteOnly']],['trade_notes',['noteState']],['journal_notes',['dayNoteState']],['day_rules',['dayRuleId','dayRuleVersionId','dayRuleStatus']]] as const)if(!access.scopes.includes(scope)&&keys.some(key=>Boolean(raw[key])))throw new Error('This Journal field is not shared.');
 return {...raw,startDate:access.period.start,endDate:access.period.end};
}
async function recheck(reviewId:string,original:Awaited<ReturnType<typeof accessFor>>){
 const current=await accessFor(reviewId,false);
 if(current.authorizationKey!==original.authorizationKey||current.period.start!==original.period.start||current.period.end!==original.period.end)throw new Error('Journal access changed.');
}
export async function runIndependentCoachingExplorer(reviewId:string,input:unknown,afterCursor?:unknown,tradeSort?:unknown){
 try{const access=await accessFor(reviewId,false),{runTradeExplorerQuery}=await import('@/app/(dashboard)/analytics/trade-explorer/trade-explorer-service');const preview=await runTradeExplorerQuery(access.scope,permittedQuery(access,input),afterCursor,tradeSort,access.authorization);await recheck(reviewId,access);return {ok:true as const,preview};}catch{return {ok:false as const,message:'Results unavailable. Check the review period and Journal access.',refreshRequired:false};}
}
export async function runIndependentCoachingExplorerGroup(reviewId:string,input:unknown,group:unknown,afterCursor?:unknown){
 try{
  const access=await accessFor(reviewId,false),{runTradeExplorerGroupTradesQuery}=await import('@/app/(dashboard)/analytics/trade-explorer/trade-explorer-service');
  if(group&&typeof group==='object'&&(group as {resultView?:string}).resultView==='days'){const date=(group as {groupKey?:string}).groupKey;if(!date||date<access.period.start||date>access.period.end)throw new Error('Day outside review period.');}
  const preview=await runTradeExplorerGroupTradesQuery(access.scope,permittedQuery(access,input),group,afterCursor,access.authorization);await recheck(reviewId,access);return {ok:true as const,preview};
 }catch{return {ok:false as const,message:'Trade evidence unavailable. Check Journal access.',refreshRequired:false};}
}
export async function compareIndependentCoachingExplorer(reviewId:string,input:unknown){
 try{
  const access=await accessFor(reviewId,false);if(!input||typeof input!=='object'||!Array.isArray((input as {groups?:unknown}).groups))throw new Error('Check the comparison groups.');
  const raw=input as {groups:{name:string;query:unknown}[];comparisonVersion:unknown};
  const groups=raw.groups.map(group=>{const query=permittedQuery(access,group.query),dates=group.query as {startDate?:string;endDate?:string};if(!dates.startDate||!dates.endDate||dates.startDate<access.period.start||dates.endDate>access.period.end||dates.startDate>dates.endDate)throw new Error('Keep comparison dates inside the review period.');return {...group,query:{...query,startDate:dates.startDate,endDate:dates.endDate}};});
  const {runTradeExplorerComparison}=await import('@/app/(dashboard)/analytics/trade-explorer/trade-explorer-service');const comparison=await runTradeExplorerComparison(access.scope,{...raw,groups},access.authorization);await recheck(reviewId,access);return {ok:true as const,comparison};
 }catch{return {ok:false as const,message:'Comparison unavailable. Keep groups inside the review period and check Journal access.',refreshRequired:false};}
}
export async function readIndependentCoachingTradeExecutions(reviewId:string,roundTripId:string){
 try{const access=await accessFor(reviewId,false);const story=withReadonlyPlatformDatabase({},db=>new IndependentCoachingJournalReadService(db).tradeCard({actorUserId:access.authorization.actorUserId,enrollmentId:access.authorization.enrollmentId,reviewId,roundTripId}));if(story.status!=='ready')throw new Error('Executions are unavailable.');await recheck(reviewId,access);return {ok:true as const,executions:story.executions.map(row=>({executed_at_utc:row.executedAtUtc,price_decimal:row.priceDecimal,quantity_decimal:row.quantityDecimal,round_trip_id:roundTripId,side:row.side}))};}catch{return {ok:false as const,executions:[]};}
}

export async function readIndependentCoachingAnalyzerEvidence(reviewId:string,path:string):Promise<{body:string;status:number}>{
 try{const access=await accessFor(reviewId,false);const payload=await readScopedCoachingAnalyzerEvidence(access.scope,access.period,path);await recheck(reviewId,access);return {body:JSON.stringify(payload),status:200};}catch{return {body:JSON.stringify({status:'unavailable'}),status:403};}
}

/** Saved trade links remain in the authenticated review, never a personal Tracker route. */
export async function resolveIndependentCoachingAnalysisLink(reviewId:string,href:string,includeSavedAnalysis=false){
 if(typeof includeSavedAnalysis!=='boolean')throw new Error('Choose an available saved analysis.');
 const link=parseCoachingReviewTrackerLink(href);
 if(!link||link.kind!=='trade')throw new Error('Choose a valid saved trade link.');
 const access=await accessFor(reviewId,false);
 const {getReplacementDailyTradeAnalyzerReplay}=await import('@/app/(dashboard)/trade-tracker/trade-tracker-platform-data');
 const result=withReadonlyPlatformDatabase({},db=>{
  const trades=new IndependentCoachingJournalReadService(db).listTrades(access.authorization);
  const linked=trades.find(trade=>matchesIndependentCoachingTrade(trade,link.tradeId));
  const selected=linked&&new IndependentCoachingRepository(db).reviewTrades(reviewId,access.authorization.actorUserId).some(row=>matchesIndependentCoachingTrade(linked,row.roundTripId));
  const trade=requireCoachingReviewLinkedTrade(link,trades,selected?{start:linked!.tradingDate,end:linked!.tradingDate}:access.period);
  const saved=getReplacementDailyTradeAnalyzerReplay(access.scope,{roundTripId:trade.representativeRoundTripId,direction:trade.direction});
  if(!saved||saved.status!=='ready'||!saved.candles.length||link.eventId&&!saved.events.some(event=>event.eventId===link.eventId))throw new Error('This saved analysis is unavailable.');
  return {link:{...link,tradeId:trade.representativeRoundTripId},analysis:includeSavedAnalysis?saved:null};
 });
 await recheck(reviewId,access);
 return result;
}

/** Current rulebook, not a historical reconstruction or an editable Journal page. */
export async function loadIndependentCoachingStudentRules(reviewId:string,view:'all'|'trade'|'day'='all'){
 try{
  if(!['all','trade','day'].includes(view))throw new Error('Choose an available rules view.');
  const access=await accessFor(reviewId,false);
  if(!access.scopes.includes('rules')&&!access.scopes.includes('day_rules'))throw new Error('Rule definitions are not shared.');
  const rules=withReadonlyPlatformDatabase({},db=>new JournalRuleRepository(db).list(narrowWorkspaceAccessToAccount(access.scope,access.scope.activeAccountId!))
   .filter(rule=>view==='all'||rule.reviewScope===view||rule.reviewScope==='both')
   .filter(rule=>rule.reviewScope==='trade'?access.scopes.includes('rules'):rule.reviewScope==='day'?access.scopes.includes('day_rules'):access.scopes.includes('rules')&&access.scopes.includes('day_rules'))
   .map(rule=>{const template=JOURNAL_RULE_TEMPLATE_CATALOG.find(item=>item.templateId===rule.templateKey);return {title:rule.title,statement:rule.statement,category:rule.category,scope:rule.reviewScope,status:rule.lifecycleState,version:rule.versionNumber,configuration:Object.entries(rule.configuration).map(([key,value])=>({label:template?.parameters.find(parameter=>parameter.key===key)?.label??key,value}))};}));
  const current=await accessFor(reviewId,false);
  if(!current.scopes.includes('rules')&&!current.scopes.includes('day_rules'))throw new Error('Rule definitions are no longer shared.');
  if(current.authorizationKey!==access.authorizationKey||current.period.start!==access.period.start||current.period.end!==access.period.end)throw new Error('Journal access changed.');
  return {rules,error:null};
 }catch{return {rules:null,error:'Student rules are unavailable. Check current Journal access and the review period.'};}
}

/** Stored Performance feedback uses historical actor authorization, not a current Journal grant. */
export async function loadIndependentPerformanceHistory(reviewId:string,key?:string,page=0){
 try{
  if(typeof reviewId!=='string'||key!==undefined&&(typeof key!=='string'||key.length>20000)||!Number.isSafeInteger(page)||page<0)throw new Error('Choose an available history page.');
  const identity=requireCoachingPilotIdentity(await requireTraderLinkPlatformBillingPageIdentity());
  const {readPerformanceSnapshots,performanceHistoryPage}=await import('@/src/modules/communities/server/independent-coaching-performance-history');
  return withReadonlyPlatformDatabase({},db=>{const repository=new IndependentCoachingRepository(db),review=repository.review(reviewId,identity.scope.userId),enrollment=repository.enrollment(review.enrollmentId,identity.scope.userId);if(!review.journalAccountId)throw new Error('This review has no historical account.');const history=performanceHistoryPage(readPerformanceSnapshots(db,{coachUserId:enrollment.coach_user_id,studentUserId:enrollment.student_user_id,accountId:review.journalAccountId}),key,page);return {available:true as const,...JSON.parse(JSON.stringify(history)) as typeof history};});
 }catch{return {available:false as const,error:'Performance history is unavailable for this review.'};}
}
