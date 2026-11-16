"use server";
import {requireCoachingPilotPageIdentity} from "@/src/modules/communities/server/coaching-pilot-request-identity";
import {TradeAnalysisPage,type TradeAnalysisResourceModel} from '../analytics/trade-analysis-page';
import {readScopedCoachingAnalyzerEvidence} from "./coaching-analyzer-evidence-reader";
import type {ReactNode} from "react";
import {requireCommunityRequestAccess} from "@/src/modules/communities/server/community-request-access";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {coachingReviewResourceScope} from "@/src/modules/communities/server/coaching-review-resource-scope";
import {coachingResource,type CoachingResourceId} from "@/src/modules/communities/contracts/coaching-review-resources";
import type {loadAnalyticsOverviewModel} from "../analytics/analytics-overview-page";
import type {loadResultsAnalyticsModel} from "../analytics/results-analytics-page";
import type {loadTimingAnalyticsModel} from "../analytics/timing/timing-analytics-page";
import type {loadExecutionAnalyticsModel} from "../analytics/execution-analytics-page";
import type {readRuleResults} from "../rules/results/rule-results-data";
import type {TradeExplorerPageModel} from "../analytics/trade-explorer/trade-explorer-service";

export type CoachingAnalyticsModel=
 | {kind:'overview';model:Awaited<ReturnType<typeof loadAnalyticsOverviewModel>>}
 | {kind:'ticker';model:Pick<Awaited<ReturnType<typeof loadResultsAnalyticsModel>>,'selectedRange'|'moneyBasis'|'rows'>}
 | {kind:'timing';model:Pick<Awaited<ReturnType<typeof loadTimingAnalyticsModel>>,'chartData'|'completedTradeCount'|'moneyBasis'|'timezone'>}
 | {kind:'breakdown';model:Pick<Awaited<ReturnType<typeof loadExecutionAnalyticsModel>>,'chartData'|'currency'|'moneyBasis'|'priceComparison'|'priceInsights'|'priceResults'|'priceResultsByDirection'|'rows'|'selectedRange'>};
export type CoachingExplorerModel={kind:'explorer'|'compare';model:TradeExplorerPageModel;coaching:{communitySlug:string;reviewId:string;relationshipId:string}};

export async function loadCoachingReviewResource(communitySlug:string,reviewId:string,resourceId:CoachingResourceId,parameters:Record<string,string>={}):Promise<{content:ReactNode;analyzerModel:TradeAnalysisResourceModel|null;analyticsModel:CoachingAnalyticsModel|null;explorerModel:CoachingExplorerModel|null;rulesModel:Awaited<ReturnType<typeof readRuleResults>>|null;error:string|null}>{
 try{
  const identity=await requireCoachingPilotPageIdentity();
  await requireCommunityRequestAccess({userId:identity.scope.userId,slug:communitySlug,reviewId,existingCoachingOnly:true});
  const access=withReadonlyPlatformDatabase({},db=>coachingReviewResourceScope(db,{coachUserId:identity.scope.userId,reviewId,communitySlug}));
  const resource=coachingResource(resourceId);if(!resource)throw new Error("Resource unavailable.");
  const searchParams={...parameters,range:"custom",start:access.period.start,end:access.period.end,startDate:access.period.start,endDate:access.period.end};
  let analyzerModel:TradeAnalysisResourceModel|null=null;let content:ReactNode=null;
  let analyticsModel:CoachingAnalyticsModel|null=null;
  let explorerModel:CoachingExplorerModel|null=null;
  let rulesModel:Awaited<ReturnType<typeof readRuleResults>>|null=null;
  switch(resourceId){
   case 'overview':{const {loadAnalyticsOverviewModel}=await import('../analytics/analytics-overview-page');analyticsModel={kind:'overview',model:await loadAnalyticsOverviewModel({resourceScope:access.scope,searchParams})};content=null;break;}
   case 'ticker':{const {loadResultsAnalyticsModel}=await import('../analytics/results-analytics-page');const {selectedRange,moneyBasis,rows}=await loadResultsAnalyticsModel({resourceScope:access.scope,searchParams});analyticsModel={kind:'ticker',model:{selectedRange,moneyBasis,rows}};content=null;break;}
   case 'timing':{const {loadTimingAnalyticsModel}=await import('../analytics/timing/timing-analytics-page');const {chartData,completedTradeCount,moneyBasis,timezone}=await loadTimingAnalyticsModel({resourceScope:access.scope,period:access.period,searchParams:Promise.resolve({basis:parameters.basis})});analyticsModel={kind:'timing',model:{chartData,completedTradeCount,moneyBasis,timezone}};content=null;break;}
   case 'breakdown':{const {loadExecutionAnalyticsModel}=await import('../analytics/execution-analytics-page');const {chartData,currency,moneyBasis,priceComparison,priceInsights,priceResults,priceResultsByDirection,rows,selectedRange}=await loadExecutionAnalyticsModel({resourceScope:access.scope,searchParams});analyticsModel={kind:'breakdown',model:{chartData,currency,moneyBasis,priceComparison,priceInsights,priceResults,priceResultsByDirection,rows,selectedRange}};content=null;break;}
   case 'explorer':case 'compare':{
    const {readTradeExplorerPageModel}=await import('../analytics/trade-explorer/trade-explorer-service');
    const source=await readTradeExplorerPageModel(access.scope,{startDate:access.period.start,endDate:access.period.end},{communitySlug,reviewId,coachUserId:identity.scope.userId});
    const model={...source,minimumDate:access.period.start,maximumDate:access.period.end,annotationOptions:{tags:access.permits('tags')?source.annotationOptions.tags:[],tradeRules:access.permits('rules')?source.annotationOptions.tradeRules:[],dayRules:access.permits('day_rules')?source.annotationOptions.dayRules:[]}};
    explorerModel={kind:resourceId,model,coaching:{communitySlug,reviewId,relationshipId:access.relationshipId}};
    content=null;break;
   }
   case 'rules':{
    if(!access.permits('rules')||!access.permits('day_rules'))throw new Error("The student must share the agreed rule data before opening Rules analytics.");
    const {readRuleResults}=await import('../rules/results/rule-results-data');
    rulesModel=await readRuleResults(access.scope,{startDate:access.period.start,endDate:access.period.end});content=null;break;
   }
   case 'day':case 'entry-exit':case 'mfe-mae':case 'green-to-red':case 'scaling-out':case 'candle-patterns':case 'trend-momentum':case 'trades':{
    const {coachingAnalyzerResources}=await import('@/src/modules/communities/server/coaching-review-analyzer-availability');const ids=access.shared.trades.filter(trade=>trade.tradingDate&&trade.tradingDate>=access.period.start&&trade.tradingDate<=access.period.end).map(trade=>trade.roundTripId);if(!withReadonlyPlatformDatabase({},db=>coachingAnalyzerResources(db,access.scope,ids)).includes(resourceId))throw new Error('Saved analysis is not applicable to this review period.');
    analyzerModel=await TradeAnalysisPage({resourceScope:access.scope,baseHref:resource.path,searchParams,view:resourceId});break;
   }
   default:throw new Error("This resource is still being connected to the authorized review scope.");
  }
  // Recheck after asynchronous page loading: a changed/revoked grant never returns data.
  const current=withReadonlyPlatformDatabase({},db=>coachingReviewResourceScope(db,{coachUserId:identity.scope.userId,reviewId,communitySlug}));
  if(current.authorizationKey!==access.authorizationKey||current.scope.activeAccountId!==access.scope.activeAccountId||current.period.start!==access.period.start||current.period.end!==access.period.end)throw new Error("Sharing or review selection changed. Reopen the resource.");
  return {content,analyzerModel,analyticsModel,explorerModel,rulesModel,error:null};
 }catch(error){return {content:null,analyzerModel:null,analyticsModel:null,explorerModel:null,rulesModel:null,error:error instanceof Error&&/^(Identify the accepted service|This review is unavailable|The student must share|Select trades with verified|Sharing or review selection changed|This resource is still)/.test(error.message)?error.message:"This resource is unavailable. Check Journal sharing and try again."};}
}

async function verifiedAccess(communitySlug:string,reviewId:string){
 const identity=await requireCoachingPilotPageIdentity();await requireCommunityRequestAccess({userId:identity.scope.userId,slug:communitySlug,reviewId,existingCoachingOnly:true});
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
  const payload=await readScopedCoachingAnalyzerEvidence(scope,access.period,path);
  const current=await verifiedAccess(communitySlug,reviewId);if(current.authorizationKey!==access.authorizationKey||current.scope.activeAccountId!==scope.activeAccountId||current.period.start!==access.period.start||current.period.end!==access.period.end)throw new Error('Sharing changed');
  return {body:JSON.stringify(payload),status:200};
 }catch{return {body:JSON.stringify({status:'unavailable'}),status:403};}
}

export async function readCoachingTradeExecutions(communitySlug:string,reviewId:string,roundTripId:string){
 try{const access=await verifiedAccess(communitySlug,reviewId);const {TraderLinkCommunityCoachJournalReadService}=await import('@/src/modules/communities/server/traderlink-community-coach-journal-read-service');const details=withReadonlyPlatformDatabase({},db=>new TraderLinkCommunityCoachJournalReadService(db).readTrade({coachUserId:access.review.coach_user_id,relationshipId:access.relationshipId,roundTripId}));
 if(!details.trade.tradingDate||details.trade.tradingDate<access.period.start||details.trade.tradingDate>access.period.end)throw new Error('Trade outside review');
  const executions=details.story.executions.map(execution=>({executed_at_utc:execution.executedAtUtc,price_decimal:execution.priceDecimal,quantity_decimal:execution.quantityDecimal,round_trip_id:roundTripId,side:execution.side}));
  // The reader import above yields. Recheck the exact current review and grant
  // after that final yield before returning any execution evidence.
  const current=await verifiedAccess(communitySlug,reviewId);
  if(current.authorizationKey!==access.authorizationKey||current.relationshipId!==access.relationshipId||
    current.scope.userId!==access.scope.userId||current.scope.workspaceId!==access.scope.workspaceId||
    current.scope.activeAccountId!==access.scope.activeAccountId||
    current.period.start!==access.period.start||current.period.end!==access.period.end)throw new Error("Sharing or review period changed.");
  if(!details.trade.tradingDate||details.trade.tradingDate<current.period.start||details.trade.tradingDate>current.period.end)throw new Error("Trade outside review");
  return {ok:true as const,executions};
 }catch{return {ok:false as const,executions:[]};}
}
