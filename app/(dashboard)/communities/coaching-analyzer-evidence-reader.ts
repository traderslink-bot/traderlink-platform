import "server-only";
import type {WorkspaceAccessScope} from '@/src/modules/platform/contracts/workspace-access-scope';
/** Internal scoped read. Public actions must authenticate and recheck their own review. */
export async function readScopedCoachingAnalyzerEvidence(scope:WorkspaceAccessScope,period:{start:string;end:string},path:string):Promise<unknown>{
  const url=new URL(path,'https://review.invalid'),query=url.searchParams;
  query.set('start',period.start);query.set('end',period.end);
  const {withSavedPatternRuntime}=await import('@/src/modules/level-analysis/server/trend-momentum-pattern-runtime');
  const selection={basis:query.get('basis'),startDate:period.start,endDate:period.end};
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
  return payload;
}
