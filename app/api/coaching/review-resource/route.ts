import {submissionDate} from '@/src/modules/communities/contracts/coaching-request-submission-limits';
import {requireCoachingPilotRequestIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';
import {IndependentCoachingJournalReadService} from '@/src/modules/communities/server/independent-coaching-journal-read';
import {matchesIndependentCoachingTrade} from '@/src/modules/communities/contracts/independent-coaching-trade-selection';
import {IndependentCoachingRepository} from '@/src/modules/communities/server/independent-coaching-repository';
import {independentCoachingJournalAccess} from '@/src/modules/communities/server/independent-coaching-journal-access';
import {getReplacementDailyTradeAnalyzerReplay} from '@/app/(dashboard)/trade-tracker/trade-tracker-platform-data';
export const runtime='nodejs';
export async function GET(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 let actorUserId:string;
 try{actorUserId=requireCoachingPilotRequestIdentity(request.headers).scope.userId;}catch{return Response.json({error:'Sign in to continue.'},{status:401,headers});}
 const query=new URL(request.url).searchParams,reviewId=query.get('reviewId'),resource=query.get('resource');
 if(!reviewId)return Response.json({error:'Choose a review.'},{status:400,headers});
 try{
  const result=withReadonlyPlatformDatabase({},db=>{
   const repo=new IndependentCoachingRepository(db),review=repo.review(reviewId,actorUserId),input={reviewId,actorUserId,enrollmentId:review.enrollmentId},reader=new IndependentCoachingJournalReadService(db);
   const access=independentCoachingJournalAccess(db,{...input,requiredScopes:resource==='analyzer'?['trades','analytics']:['trades']});
   let result:unknown;
   if(resource==='student-replacements'){
    const state=repo.studentTradeReplacementState(reviewId,actorUserId),trades=reader.studentReplacementTrades({...input,atUtc:new Date().toISOString()}),byId=new Map(trades.map(trade=>[trade.roundTripId,trade])),selectedIds=new Set(state.selected.map(trade=>trade.roundTripId));
    const display=(trade:typeof trades[number])=>({roundTripId:trade.roundTripId,label:`${trade.symbol} · ${trade.tradingDate} · ${trade.direction}`,tradingDate:trade.tradingDate});
    result={kind:review.kind,selected:state.selected.map(row=>{const trade=byId.get(row.roundTripId);return trade?{...display(trade),canReplace:row.canReplace}:{roundTripId:row.roundTripId,label:'Selected trade unavailable',tradingDate:null,canReplace:false};}),choices:trades.filter(trade=>trade.tradingDate&&trade.tradingDate<=submissionDate(new Date().toISOString())&&!selectedIds.has(trade.roundTripId)&&!state.protectedIds.includes(trade.roundTripId)).map(display)};
   }
   else if(resource==='trades')result=reader.listTrades({...input,olderFrom:query.get('olderFrom')??undefined,pickerPeriod:query.get('start')&&query.get('end')?{start:query.get('start')!,end:query.get('end')!}:undefined,excludeReviewed:['trade','trading_day','strategy'].includes(review.kind)&&(review.status==='awaiting_submission'||['ready','draft'].includes(review.status))});
   else if(resource==='trade-eligibility')result=reader.tradeReviewEligibility({...input,period:review.status==='awaiting_submission'&&query.get('start')&&query.get('end')?{start:review.periodStart??query.get('start')!,end:review.periodEnd??query.get('end')!}:undefined});
   else if(resource==='removed-trades')result=reader.removedReviewTradeMetadata(input);
   else if(resource==='day-context')result=reader.dayContext(input);
   else{
    const roundTripId=query.get('roundTripId');if(!roundTripId)throw new Error('Choose a trade.');
    if(resource==='details')result=reader.tradeCard({...input,roundTripId});
    else if(resource==='analyzer'){
     const trade=reader.listTrades(input).find(t=>matchesIndependentCoachingTrade(t,roundTripId));if(!trade)throw new Error('Choose a trade in this review period.');
     result=getReplacementDailyTradeAnalyzerReplay(access.scope,{roundTripId:trade.representativeRoundTripId,direction:trade.direction});
    }else throw new Error('Choose an available review resource.');
   }
   const after=independentCoachingJournalAccess(db,{...input,requiredScopes:resource==='analyzer'?['trades','analytics']:['trades']});
   if(after.authorizationKey!==access.authorizationKey)throw new Error('Journal access changed. Open the resource again.');
   return result;
  });
  return Response.json(result,{headers});
 }catch{return Response.json({error:'This resource is unavailable. Check the review period and current Journal access.'},{status:403,headers});}
}
