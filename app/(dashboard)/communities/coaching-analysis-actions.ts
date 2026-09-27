"use server";
import {requireTraderLinkPlatformPageIdentity,currentJournalAccountSelectionRef} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {TraderLinkCommunityCoachJournalReadService} from "@/src/modules/communities/server/traderlink-community-coach-journal-read-service";
import {readTradeExplorerPageModel,runTradeExplorerQuery} from "../analytics/trade-explorer/trade-explorer-service";
import {getReplacementDailyTradeAnalyzerReplay} from "../trade-tracker/trade-tracker-platform-data";

async function analysisScope(relationshipId:string){
 const identity=await requireTraderLinkPlatformPageIdentity();
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
export async function loadCoachingAnalyzerAction(relationshipId:string,roundTripId:string){
 try{
  const {scope,canReadTrades}=await analysisScope(relationshipId);if(!canReadTrades)throw new Error("Trade details are not shared.");
  const identity=await requireTraderLinkPlatformPageIdentity();
  const trade=withReadonlyPlatformDatabase({},db=>new TraderLinkCommunityCoachJournalReadService(db).read({coachUserId:identity.scope.userId,relationshipId}).trades.find(item=>item.roundTripId===roundTripId));
  if(!trade)throw new Error("Trade unavailable.");
  const analyzer=getReplacementDailyTradeAnalyzerReplay(scope,{roundTripId,direction:trade.direction});
  return {ok:true as const,analyzer};
 }catch{return {ok:false as const,message:"Saved analysis is unavailable for this trade."};}
}
