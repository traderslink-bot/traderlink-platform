"use server";
import type {ReactNode} from "react";
import {requireTraderLinkPlatformPageIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {requireCommunityRequestAccess} from "@/src/modules/communities/server/community-request-access";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {coachingReviewResourceScope} from "@/src/modules/communities/server/coaching-review-resource-scope";
import {coachingResource,type CoachingResourceId} from "@/src/modules/communities/contracts/coaching-review-resources";

export async function loadCoachingReviewResource(communitySlug:string,reviewId:string,resourceId:CoachingResourceId,parameters:Record<string,string>={}):Promise<{content:ReactNode;error:string|null}>{
 try{
  const identity=await requireTraderLinkPlatformPageIdentity();
  await requireCommunityRequestAccess({userId:identity.scope.userId,slug:communitySlug,reviewId,existingCoachingOnly:true});
  const access=withReadonlyPlatformDatabase({},db=>coachingReviewResourceScope(db,{coachUserId:identity.scope.userId,reviewId,communitySlug}));
  const resource=coachingResource(resourceId);if(!resource)throw new Error("Resource unavailable.");
  const searchParams={...parameters,range:"custom",start:access.period.start,end:access.period.end,startDate:access.period.start,endDate:access.period.end};
  let content:ReactNode;
  switch(resourceId){
   case 'overview':{const {AnalyticsOverviewPage}=await import('../analytics/analytics-overview-page');content=await AnalyticsOverviewPage({resourceScope:access.scope,searchParams});break;}
   case 'ticker':{const {ResultsAnalyticsPage}=await import('../analytics/results-analytics-page');content=await ResultsAnalyticsPage({resourceScope:access.scope,searchParams});break;}
   case 'timing':{const {TimingAnalyticsPage}=await import('../analytics/timing/timing-analytics-page');content=await TimingAnalyticsPage({resourceScope:access.scope,period:access.period,searchParams:Promise.resolve(searchParams)});break;}
   case 'breakdown':{const {ExecutionAnalyticsPage}=await import('../analytics/execution-analytics-page');content=await ExecutionAnalyticsPage({resourceScope:access.scope,searchParams});break;}
   case 'explorer':case 'compare':{
    const {readTradeExplorerPageModel}=await import('../analytics/trade-explorer/trade-explorer-service');
    const source=await readTradeExplorerPageModel(access.scope,{startDate:access.period.start,endDate:access.period.end},{communitySlug,reviewId,coachUserId:identity.scope.userId});
    const model={...source,minimumDate:access.period.start,maximumDate:access.period.end,annotationOptions:{tags:access.permits('tags')?source.annotationOptions.tags:[],tradeRules:access.permits('rules')?source.annotationOptions.tradeRules:[],dayRules:access.permits('day_rules')?source.annotationOptions.dayRules:[]}};
    const coaching={communitySlug,reviewId,relationshipId:access.relationshipId};
    if(resourceId==='explorer'){const {default:TradeExplorerClient}=await import('../analytics/trade-explorer/trade-explorer-client');content=<TradeExplorerClient model={model} coaching={coaching}/>;}
    else{const {default:TradeExplorerComparisonClient}=await import('../analytics/trade-explorer/compare/trade-explorer-comparison-client');content=<TradeExplorerComparisonClient model={model} initialStudies={[]} coaching={coaching}/>;}break;
   }
   case 'rules':{
    if(!access.permits('rules')||!access.permits('day_rules'))throw new Error("The student must share the agreed rule data before opening Rules analytics.");
    const {readRuleResults}=await import('../rules/results/rule-results-data');const {RuleResultsClient}=await import('../rules/results/rule-results-client');
    const model=await readRuleResults(access.scope,{startDate:access.period.start,endDate:access.period.end});content=<RuleResultsClient initialView={model}/>;break;
   }
   case 'day':case 'entry-exit':case 'mfe-mae':case 'green-to-red':case 'scaling-out':case 'candle-patterns':case 'trend-momentum':case 'trades':{
    const {coachingAnalyzerResources}=await import('@/src/modules/communities/server/coaching-review-analyzer-availability');const ids=access.shared.trades.filter(trade=>trade.tradingDate&&trade.tradingDate>=access.period.start&&trade.tradingDate<=access.period.end).map(trade=>trade.roundTripId);if(!withReadonlyPlatformDatabase({},db=>coachingAnalyzerResources(db,access.scope,ids)).includes(resourceId))throw new Error('Saved analysis is not applicable to this review period.');
    const {TradeAnalysisPage}=await import('../analytics/trade-analysis-page');content=await TradeAnalysisPage({resourceScope:access.scope,baseHref:resource.path,searchParams,view:resourceId});break;
   }
   default:throw new Error("This resource is still being connected to the authorized review scope.");
  }
  // Recheck after asynchronous page loading: a changed/revoked grant never returns data.
  const current=withReadonlyPlatformDatabase({},db=>coachingReviewResourceScope(db,{coachUserId:identity.scope.userId,reviewId,communitySlug}));
  if(current.authorizationKey!==access.authorizationKey||current.scope.activeAccountId!==access.scope.activeAccountId||current.period.start!==access.period.start||current.period.end!==access.period.end)throw new Error("Sharing or review selection changed. Reopen the resource.");
  return {content,error:null};
 }catch(error){return {content:null,error:error instanceof Error&&/^(Identify the accepted service|This review is unavailable|The student must share|Select trades with verified|Sharing or review selection changed|This resource is still)/.test(error.message)?error.message:"This resource is unavailable. Check Journal sharing and try again."};}
}

async function verifiedAccess(communitySlug:string,reviewId:string){
 const identity=await requireTraderLinkPlatformPageIdentity();await requireCommunityRequestAccess({userId:identity.scope.userId,slug:communitySlug,reviewId,existingCoachingOnly:true});
 return withReadonlyPlatformDatabase({},db=>coachingReviewResourceScope(db,{coachUserId:identity.scope.userId,reviewId,communitySlug}));
}
function permittedQuery(access:Awaited<ReturnType<typeof verifiedAccess>>,input:unknown){
 if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Invalid filters.");const query=input as Record<string,unknown>;
 for(const [scope,keys] of [['tags',['tagId','untaggedOnly']],['rules',['ruleId','ruleVersionId','ruleStatus','reviewIncompleteOnly']],['trade_notes',['noteState']],['journal_notes',['dayNoteState']],['day_rules',['dayRuleId','dayRuleVersionId','dayRuleStatus']]] as const)if(!access.permits(scope)&&keys.some(key=>Boolean(query[key])))throw new Error("The requested Journal fields are not shared.");
 return {...query,startDate:access.period.start,endDate:access.period.end};
}
export async function runCoachingExplorer(communitySlug:string,reviewId:string,input:unknown,afterCursor?:unknown,tradeSort?:unknown){
 try{const access=await verifiedAccess(communitySlug,reviewId);const {runTradeExplorerQuery}=await import('../analytics/trade-explorer/trade-explorer-service');const preview=await runTradeExplorerQuery(access.scope,permittedQuery(access,input),afterCursor,tradeSort,{communitySlug,reviewId,coachUserId:access.review.coach_user_id});const current=await verifiedAccess(communitySlug,reviewId);if(current.authorizationKey!==access.authorizationKey||current.scope.activeAccountId!==access.scope.activeAccountId||current.period.start!==access.period.start||current.period.end!==access.period.end)throw new Error("Sharing changed");permittedQuery(current,input);return {ok:true as const,preview};}catch{return {ok:false as const,message:'Results unavailable. Check the review period and sharing.',refreshRequired:false};}
}
export async function runCoachingExplorerGroup(communitySlug:string,reviewId:string,input:unknown,group:unknown,afterCursor?:unknown){
 try{const access=await verifiedAccess(communitySlug,reviewId);const {runTradeExplorerGroupTradesQuery}=await import('../analytics/trade-explorer/trade-explorer-service');if(group&&typeof group==='object'&&(group as {resultView?:string}).resultView==='days'){const date=(group as {groupKey?:string}).groupKey;if(!date||date<access.period.start||date>access.period.end)throw new Error('Day outside review');}const preview=await runTradeExplorerGroupTradesQuery(access.scope,permittedQuery(access,input),group,afterCursor,{communitySlug,reviewId,coachUserId:access.review.coach_user_id});const current=await verifiedAccess(communitySlug,reviewId);if(current.authorizationKey!==access.authorizationKey||current.scope.activeAccountId!==access.scope.activeAccountId||current.period.start!==access.period.start||current.period.end!==access.period.end)throw new Error("Sharing changed");permittedQuery(current,input);return {ok:true as const,preview};}catch{return {ok:false as const,message:'Trade evidence unavailable. Check sharing.',refreshRequired:false};}
}
export async function compareCoachingExplorer(communitySlug:string,reviewId:string,input:unknown){
 try{const access=await verifiedAccess(communitySlug,reviewId);if(!input||typeof input!=="object"||!Array.isArray((input as {groups?:unknown}).groups))throw new Error('Invalid groups');const raw=input as {groups:{name:string;query:unknown}[];comparisonVersion:unknown};
 const groups=raw.groups.map(group=>{const query=permittedQuery(access,group.query);if(!group.query||typeof group.query!=='object')throw new Error('Invalid comparison period');const dates=group.query as {startDate?:string;endDate?:string};if(!dates.startDate||!dates.endDate||dates.startDate<access.period.start||dates.endDate>access.period.end||dates.startDate>dates.endDate)throw new Error('Comparison dates must stay inside the review period');query.startDate=dates.startDate;query.endDate=dates.endDate;return {...group,query};});
 const {runTradeExplorerComparison}=await import('../analytics/trade-explorer/trade-explorer-service');const comparison=await runTradeExplorerComparison(access.scope,{...raw,groups},{communitySlug,reviewId,coachUserId:access.review.coach_user_id});const current=await verifiedAccess(communitySlug,reviewId);if(current.authorizationKey!==access.authorizationKey||current.scope.activeAccountId!==access.scope.activeAccountId||current.period.start!==access.period.start||current.period.end!==access.period.end)throw new Error("Sharing changed");return {ok:true as const,comparison};}catch{return {ok:false as const,message:'Comparison unavailable. Keep groups inside the review period and check sharing.',refreshRequired:false};}
}

export async function readCoachingAnalyzerEvidence(communitySlug:string,reviewId:string,path:string):Promise<{body:string;status:number}>{
 try{
  const access=await verifiedAccess(communitySlug,reviewId),scope=access.scope;
  const url=new URL(path,'https://review.invalid'),query=url.searchParams;
  query.set('start',access.period.start);query.set('end',access.period.end);
  const {withSavedPatternRuntime}=await import('@/src/modules/level-analysis/server/trend-momentum-pattern-runtime');
  const selection={basis:query.get('basis'),startDate:access.period.start,endDate:access.period.end};
  let payload:unknown;
  if(url.pathname==='/api/platform/trade-analyzer/analyzed-trades'){
   const {pageSavedAnalyzedTrades}=await import('@/src/modules/level-analysis/server/trend-momentum-analyzed-trades');
   const {resolveJournalAnalyticsMoneyBasis}=await import('@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime');
   const page=await withSavedPatternRuntime(scope,{...selection,includePatterns:false},({trades,timezone,runtime})=>{query.set('basis',resolveJournalAnalyticsMoneyBasis(query.get('basis'),runtime.pnlReportingBasis));return pageSavedAnalyzedTrades(trades,{query,timezone,scopeIdentity:`${scope.workspaceId}:${scope.activeAccountId}:${runtime.reportingCurrency}`,pageSize:Number(query.get('pageSize')??25),cursor:query.get('cursor'),ticker:(query.get('ticker')??'').slice(0,32)});});payload={status:'ready',page};
  }else if(url.pathname==='/api/platform/trade-analyzer/candle-patterns/occurrences'){
   const {pageSavedPatternEvidence}=await import('@/src/modules/level-analysis/server/trend-momentum-pattern-evidence');const {readMovementFilters}=await import('@/src/lib/trade-candle-analysis/trend-momentum-movement-filter');
   const timeframe=query.get('timeframe')??'all',execution=query.get('execution')??'all',location=query.get('location')??'all',direction=query.get('direction');
   if(!['all','1m','5m'].includes(timeframe)||!['all','entry','exit'].includes(execution)||!['all','exact','before'].includes(location)||!['long','short'].includes(direction??''))throw new Error('Invalid filters');
   const page=await withSavedPatternRuntime(scope,selection,({observations,timezone,runtime})=>pageSavedPatternEvidence(observations,{filters:readMovementFilters(query),pattern:query.get('pattern')??'',ticker:(query.get('ticker')??'').slice(0,32),direction:direction as 'long'|'short',timeframe:timeframe as 'all'|'1m'|'5m',execution:execution as 'all'|'entry'|'exit',location:location as 'all'|'exact'|'before',pageSize:Number(query.get('pageSize')??25),cursor:query.get('cursor'),currency:runtime.reportingCurrency,timezone,selectionIdentity:JSON.stringify([scope.workspaceId,scope.activeAccountId,selection])}));payload={status:'ready',page};
  }else if(url.pathname==='/api/platform/trade-analyzer/candle-patterns/replay'){
   const {resolveSavedPatternEvidence,patternEvidenceRow}=await import('@/src/modules/level-analysis/server/trend-momentum-pattern-evidence');
   const {getReplacementDailyTradeAnalyzerReplay,scaleDaySessionTradeAnalyzer}=await import('../trade-tracker/trade-tracker-platform-data');
   const {JournalLogicalTradeRepository}=await import('@/src/modules/journal/server/logical-trades/journal-logical-trade-repository');const {journalReportingCurrencyMultiplier}=await import('@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set');
   payload=await withSavedPatternRuntime(scope,selection,({observations,runtime})=>{
    const source=resolveSavedPatternEvidence(observations,query.get('ref')??'');const occurrence=patternEvidenceRow(source,runtime.reportingCurrency);
    const analysis=getReplacementDailyTradeAnalyzerReplay(scope,{direction:source.direction,roundTripId:source.representativeRoundTripId});if(!analysis||analysis.status!=='ready'||analysis.analysisRevisionRef!==source.analysisVersionId)return {status:'unavailable',analysis:null,occurrence};
    const context=runtime.reportingContext;const trade=new JournalLogicalTradeRepository(runtime.verifiedReadonlyDatabase).list({accountId:scope.activeAccountId!,userId:scope.userId,workspaceId:scope.workspaceId,workspaceRole:scope.workspaceRole}).find(candidate=>(candidate.logicalTradeId??candidate.members[0]?.roundTripId)===source.tradeId);
    if(!trade)return {status:'unavailable',analysis:null,occurrence};const rates=trade.members.map(member=>{const currency=context.sourceCurrencyByRoundTrip.get(member.roundTripId),date=context.sourceDateByRoundTrip.get(member.roundTripId);return currency&&date?journalReportingCurrencyMultiplier(currency,date,context):null;});
    if(!rates.length||rates.some(rate=>rate===null)||new Set(rates).size!==1)return {status:'unavailable',analysis:null,occurrence};return {status:'ready',analysis:scaleDaySessionTradeAnalyzer(analysis,rates[0]!),occurrence};
   });
  }else throw new Error('Unavailable request');
  const current=await verifiedAccess(communitySlug,reviewId);if(current.authorizationKey!==access.authorizationKey||current.scope.activeAccountId!==scope.activeAccountId||current.period.start!==access.period.start||current.period.end!==access.period.end)throw new Error('Sharing changed');
  return {body:JSON.stringify(payload),status:200};
 }catch{return {body:JSON.stringify({status:'unavailable'}),status:403};}
}

export async function readCoachingTradeExecutions(communitySlug:string,reviewId:string,roundTripId:string){
 try{const access=await verifiedAccess(communitySlug,reviewId);const {TraderLinkCommunityCoachJournalReadService}=await import('@/src/modules/communities/server/traderlink-community-coach-journal-read-service');const details=withReadonlyPlatformDatabase({},db=>new TraderLinkCommunityCoachJournalReadService(db).readTrade({coachUserId:access.review.coach_user_id,relationshipId:access.relationshipId,roundTripId}));
 if(!details.trade.tradingDate||details.trade.tradingDate<access.period.start||details.trade.tradingDate>access.period.end)throw new Error('Trade outside review');
 const executions=details.story.executions.map(execution=>({executed_at_utc:execution.executedAtUtc,price_decimal:execution.priceDecimal,quantity_decimal:execution.quantityDecimal,round_trip_id:roundTripId,side:execution.side}));return {ok:true as const,executions};
 }catch{return {ok:false as const,executions:[]};}
}
