"use server";
import {requireCommunityRequestAccess} from "@/src/modules/communities/server/community-request-access";
import {requireTraderLinkPlatformPageIdentity,currentJournalAccountSelectionRef} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {TraderLinkCommunityCoachJournalReadService} from "@/src/modules/communities/server/traderlink-community-coach-journal-read-service";
import {readTradeExplorerPageModel,runTradeExplorerQuery} from "../analytics/trade-explorer/trade-explorer-service";
import {coachingReviewResourceScope} from "@/src/modules/communities/server/coaching-review-resource-scope";
import {getReplacementDailyTradeAnalyzerReplay} from "../trade-tracker/trade-tracker-platform-data";

async function analysisScope(relationshipId:string){
 const identity=await requireTraderLinkPlatformPageIdentity();
 await requireCommunityRequestAccess({userId:identity.scope.userId,relationshipId,existingCoachingOnly:true});
 return withReadonlyPlatformDatabase({},db=>new TraderLinkCommunityCoachJournalReadService(db).readAnalysisScope({coachUserId:identity.scope.userId,relationshipId}));
}
export async function loadCoachingAnalysisAction(relationshipId:string,input?:unknown,afterCursor?:string|null){
 try{
  const access=await analysisScope(relationshipId),scope=access.scope;
  const recheck=async()=>{const current=await analysisScope(relationshipId);if(current.scope.activeAccountId!==scope.activeAccountId||current.canReadTrades!==access.canReadTrades)throw new Error("Shared data changed. Refresh the workspace.");};
  const permittedPreview=(preview:Awaited<ReturnType<typeof runTradeExplorerQuery>>)=>access.canReadTrades?preview:{...preview,evidence:null,evidenceUnavailableReason:"Trade details are not shared."};
  if(input===undefined){const model=await readTradeExplorerPageModel(scope);await recheck();const preview=permittedPreview(model.initialPreview);return {ok:true as const,model:{...model,initialPreview:preview},preview};}
  if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Invalid analysis filters.");
  const preview=await runTradeExplorerQuery(scope,{...input,expectedAccountSelectionRef:currentJournalAccountSelectionRef(scope)},afterCursor);
  await recheck();return {ok:true as const,model:null,preview:permittedPreview(preview)};
 }catch{return {ok:false as const,message:"Analysis is unavailable. Check the student’s shared data and try again."};}
}
export async function loadCoachingAnalyzerAction(communitySlug:string,reviewId:string,roundTripId:string){
 try{
  const identity=await requireTraderLinkPlatformPageIdentity();
  const request={userId:identity.scope.userId,slug:communitySlug,reviewId,existingCoachingOnly:true} as const;
  await requireCommunityRequestAccess(request);
  const input={coachUserId:identity.scope.userId,reviewId,communitySlug};
  const {access,trade,representativeRoundTripId}=withReadonlyPlatformDatabase({},db=>{
   const access=coachingReviewResourceScope(db,input);
   const {trade,representativeRoundTripId}=new TraderLinkCommunityCoachJournalReadService(db).readTrade({coachUserId:identity.scope.userId,relationshipId:access.relationshipId,roundTripId});
   if(!trade.tradingDate||trade.tradingDate<access.period.start||trade.tradingDate>access.period.end)throw new Error("Trade outside review period.");
   return {access,trade,representativeRoundTripId};
  });
  const analyzer=getReplacementDailyTradeAnalyzerReplay(access.scope,{roundTripId:representativeRoundTripId,direction:trade.direction});
  // A review can be cancelled or sharing revoked while an asynchronous read is
  // in flight. Recheck the exact review, account, permissions and period before
  // returning saved analysis. No owner-scope fallback or analysis job is used.
  await requireCommunityRequestAccess(request);
  const {current,currentTrade}=withReadonlyPlatformDatabase({},db=>{
   const current=coachingReviewResourceScope(db,input);
   const currentTrade=new TraderLinkCommunityCoachJournalReadService(db).readTrade({coachUserId:identity.scope.userId,relationshipId:current.relationshipId,roundTripId});
   return {current,currentTrade};
  });
  if(currentTrade.representativeRoundTripId!==representativeRoundTripId||currentTrade.trade.currentTradeId!==trade.currentTradeId||currentTrade.trade.tradingDate!==trade.tradingDate)throw new Error("Trade identity changed.");
  if(current.authorizationKey!==access.authorizationKey||current.relationshipId!==access.relationshipId||current.scope.userId!==access.scope.userId||current.scope.workspaceId!==access.scope.workspaceId||current.scope.activeAccountId!==access.scope.activeAccountId||current.period.start!==access.period.start||current.period.end!==access.period.end)throw new Error("Review sharing changed.");
  return {ok:true as const,analyzer};
 }catch{return {ok:false as const,message:"Saved analysis is unavailable for this trade."};}
}
