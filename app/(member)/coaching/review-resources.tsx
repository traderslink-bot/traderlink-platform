"use client";
import {SavedAnalyzerResource} from '@/app/(dashboard)/analytics/saved-analyzer-resource';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {AnalyticsOverviewView} from '@/app/(dashboard)/analytics/analytics-overview-view';
import {ResultsAnalyticsView} from '@/app/(dashboard)/analytics/results-analytics-view';
import {TimingAnalyticsView} from '@/app/(dashboard)/analytics/timing/timing-analytics-view';
import {ExecutionAnalyticsView} from '@/app/(dashboard)/analytics/execution-analytics-view';
import {RuleResultsClient} from '@/app/(dashboard)/rules/results/rule-results-client';
import {CoachingResourceContext} from '@/app/(dashboard)/communities/coaching-resource-context';
import {loadIndependentCoachingStudentRules,independentCoachingAnalyzerResources,readIndependentCoachingAnalyzerEvidence,loadIndependentCoachingReport,resolveIndependentCoachingAnalysisLink} from './resource-actions';
import {coachingResource} from '@/src/modules/communities/contracts/coaching-review-resources';
import {parseCoachingReviewTrackerLink,coachingReviewTradeLinkHref} from '@/src/modules/communities/contracts/coaching-review-trade-links';

import {useIndependentResourceLocation} from './resource-location';

const analyzerIds=['day','entry-exit','mfe-mae','green-to-red','scaling-out','candle-patterns','trend-momentum','trades'] as const;
const reports=[{id:'overview',label:'Analytics overview',path:'/analytics'},{id:'ticker',label:'Ticker results',path:'/analytics/results'},{id:'timing',label:'Timing',path:'/analytics/timing'},{id:'breakdown',label:'Execution breakdown',path:'/analytics/execution'},{id:'rules',label:'Rules analytics',path:'/rules/results'},{id:'student-rules',label:'Current student rules',path:'/rules'},{id:'explorer',label:'Trade Explorer',path:'/analytics/trade-explorer'},{id:'compare',label:'Compare Trades',path:'/analytics/trade-explorer/compare'},...analyzerIds.map(id=>({id,label:coachingResource(id)!.label,path:coachingResource(id)!.path}))] as const;
type Report=typeof reports[number]['id'];
type ResourceModel=Awaited<ReturnType<typeof loadIndependentCoachingReport>>&{studentRules?:Awaited<ReturnType<typeof loadIndependentCoachingStudentRules>>['rules']};
const Explorer=lazy(()=>import('@/app/(dashboard)/analytics/trade-explorer/trade-explorer-client'));
const Compare=lazy(()=>import('@/app/(dashboard)/analytics/trade-explorer/compare/trade-explorer-comparison-client'));
export function IndependentReviewResources({reviewId,canReadRules,openTrade}:{reviewId:string;canReadRules:boolean;openTrade:(id:string)=>void}){
 const tradeLinkRequest=useRef(0);
 useEffect(()=>()=>{tradeLinkRequest.current++;},[reviewId]);
 const [analyzerAvailable,setAnalyzerAvailable]=useState<readonly string[]>([]),[analyzerExpanded,setAnalyzerExpanded]=useState(false);
 useEffect(()=>{let current=true;void independentCoachingAnalyzerResources(reviewId).then(resources=>{if(current)setAnalyzerAvailable(resources);}).catch(()=>{if(current)setAnalyzerAvailable([]);});return()=>{current=false;};},[reviewId]);
 const location=useIndependentResourceLocation(),rawReport=location.parameters.get('report'),active=reports.find(report=>report.id===rawReport)?.id??null,serializedParameters=location.parameters.get('reportParams')??'{}';
 const parameters:Record<string,string>=(()=>{try{const value=JSON.parse(serializedParameters);return value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(item=>typeof item==='string')?value:{};}catch{return {};}})();
 const [retry,setRetry]=useState(0),[expanded,setExpanded]=useState(false),[result,setResult]=useState<{key:string;model:ResourceModel|null;error:string}|null>(null);
 const requestKey=JSON.stringify([reviewId,active,serializedParameters,retry]),model=result?.key===requestKey?result.model:null,error=result?.key===requestKey?result.error:'',loading=Boolean(active&&result?.key!==requestKey);
 function open(id:Report,params:Record<string,string>={}){tradeLinkRequest.current++;location.change({report:id,reportParams:JSON.stringify(params),dayJournal:null,dayJournalDate:null,trade:null,tradeAnalysis:null});}
 useEffect(()=>{
  if(!active)return;let current=true;
  const params:Record<string,string>=(()=>{try{const value=JSON.parse(serializedParameters);return value&&typeof value==='object'&&!Array.isArray(value)&&Object.values(value).every(item=>typeof item==='string')?value:{};}catch{return {};}})();
  const load:Promise<ResourceModel>=active==='student-rules'?loadIndependentCoachingStudentRules(reviewId,params.ruleScope==='trade'?'trade':params.ruleScope==='day'?'day':'all').then(result=>({content:null,analyzerModel:null,period:null,analyticsModel:null,rulesModel:null,explorerModel:null,error:result.error,studentRules:result.rules})):loadIndependentCoachingReport(reviewId,active,params);
  void load.then(model=>{if(current)setResult({key:requestKey,model,error:''});}).catch(()=>{if(current)setResult({key:requestKey,model:null,error:'This report could not be loaded. Try again.'});});
  return()=>{current=false;};
 },[reviewId,active,serializedParameters,requestKey]);
 function close(){tradeLinkRequest.current++;location.change({report:null,reportParams:null},true);}
 async function navigate(href:string){
  const url=new URL(href,window.location.origin),trackerLink=parseCoachingReviewTrackerLink(url.pathname+url.search);
  if(url.pathname.startsWith('/trade-tracker/')){
   if(!trackerLink){setResult({key:requestKey,model:null,error:'This saved trade link is unavailable.'});return;}
   if(trackerLink.kind==='trade'){
    const request=++tradeLinkRequest.current,sourceUrl=window.location.href;
    try{
     const resolved=await resolveIndependentCoachingAnalysisLink(reviewId,url.pathname+url.search);
     if(request!==tradeLinkRequest.current||sourceUrl!==window.location.href)return;
     location.change({trade:resolved.link.tradeId,tradeAnalysis:coachingReviewTradeLinkHref(resolved.link),report:null,reportParams:null,dayJournal:null,dayJournalDate:null});
    }catch{if(request===tradeLinkRequest.current&&sourceUrl===window.location.href)setResult({key:requestKey,model:null,error:'This saved trade is unavailable. Check the review period and Journal access.'});}
    return;
   }
   const date=trackerLink.date,period=model?.period;
   if(!period||date<period.start||date>period.end){setResult({key:requestKey,model:null,error:'This trading day is outside the review period.'});return;}
   tradeLinkRequest.current++;
   location.change({dayJournal:'1',dayJournalDate:date,report:null,reportParams:null,trade:null,tradeAnalysis:null});return;
  }
  const target=reports.find(report=>report.path===url.pathname);
  if(target&&(!['rules','student-rules'].includes(target.id)||canReadRules)){open(target.id,Object.fromEntries(url.searchParams));}
  else setResult({key:requestKey,model:null,error:'Use the review Resources menu to open an available read-only report.'});
 }

 const analytics=model?.analyticsModel,selected=reports.find(report=>report.id===active);
 return <>
  <Button variant="outlined" aria-expanded={expanded} onClick={()=>setExpanded(old=>!old)}>Analytics {expanded?'⌃':'⌄'}</Button><Collapse in={expanded}><Stack>{reports.filter(report=>['overview','ticker','timing','breakdown'].includes(report.id)).map(report=><Button key={report.id} sx={{justifyContent:'flex-start'}} onClick={()=>void open(report.id)}>{report.label}</Button>)}</Stack></Collapse>
  <Button variant="outlined" onClick={()=>void open('explorer')}>Trade Explorer</Button><Button variant="outlined" onClick={()=>void open('compare')}>Compare Trades</Button>{canReadRules?<><Button variant="outlined" onClick={()=>void open('student-rules')}>Student rules</Button><Button variant="outlined" onClick={()=>void open('rules')}>Rules analytics</Button></>:null}
  {analyzerAvailable.length?<><Button variant="outlined" aria-expanded={analyzerExpanded} onClick={()=>setAnalyzerExpanded(old=>!old)}>Trade Analyzer {analyzerExpanded?'⌃':'⌄'}</Button><Collapse in={analyzerExpanded}><Stack>{reports.filter(report=>analyzerAvailable.includes(report.id)).map(report=><Button key={report.id} sx={{justifyContent:'flex-start'}} onClick={()=>void open(report.id)}>{report.label}</Button>)}</Stack></Collapse></>:null}
  <Drawer anchor="right" open={active!==null} onClose={close} slotProps={{paper:{sx:{width:{xs:'100vw',lg:'calc(100vw - 80px)'},maxWidth:'100vw',height:'100dvh'}}}}>
   <Stack direction="row" sx={{p:2,alignItems:'center',borderBottom:1,borderColor:'divider',position:'sticky',top:0,bgcolor:'background.paper',zIndex:1}}><Typography variant="h2" component="h2" sx={{flex:1}}>{selected?.label}{active==='rules'&&parameters.day?` · ${parameters.day}`:active==='student-rules'&&parameters.ruleScope?` · ${parameters.ruleScope==='day'?'Day/session':'Trade'}`:''}</Typography><Button onClick={close}>Close</Button></Stack>
   <Box sx={{p:{xs:2,md:3}}} onClickCapture={event=>{const link=event.target instanceof Element?event.target.closest('a[href]'):null;if(link instanceof HTMLAnchorElement){event.preventDefault();event.stopPropagation();navigate(link.href);}}}>
    {loading?<Stack direction="row" spacing={2} role="status"><CircularProgress size={24}/><Typography>Loading report…</Typography></Stack>:null}
    {error||model?.error?<Alert severity="warning" action={<Button onClick={()=>setRetry(value=>value+1)}>Retry</Button>}>{error||model?.error}</Alert>:null}
    {selected?<CoachingResourceContext.Provider value={{pathname:selected.path,parameters:{...parameters,...(model?.period?{range:'custom',start:model.period.start,end:model.period.end}:{})},navigate,openTrade,fetchRead:async path=>{const result=await readIndependentCoachingAnalyzerEvidence(reviewId,path);return new Response(result.body,{status:result.status,headers:{'content-type':'application/json'}});}}}>
     {active==='student-rules'&&model?.studentRules?<Stack spacing={2}><Typography variant="body2" color="text.secondary">Current rule definitions for the shared account. Rules analytics shows the recorded results and versions for the review period.</Typography>{model.studentRules.length?model.studentRules.map((rule,index)=><Box key={index} sx={{border:1,borderColor:'divider',borderRadius:2,p:2}}><Stack spacing={1}><Typography component="h3" variant="h3">{rule.title}</Typography><Typography variant="body2" color="text.secondary">Version {rule.version} · {rule.status==='active'?'Active':rule.status==='paused'?'Paused':'Retired'} · {rule.scope==='trade'?'Trade rule':rule.scope==='day'?'Trading-day rule':'Trade and trading-day rule'}</Typography><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{rule.statement}</Typography>{rule.configuration.map((parameter,index)=><Typography key={index} variant="body2" sx={{overflowWrap:'anywhere'}}>{parameter.label}: {parameter.value}</Typography>)}</Stack></Box>):<Typography>No current rules are recorded for this shared account.</Typography>}</Stack>:analytics?.kind==='overview'?<AnalyticsOverviewView {...analytics.model}/>:analytics?.kind==='ticker'?<ResultsAnalyticsView {...analytics.model}/>:analytics?.kind==='timing'?<TimingAnalyticsView {...analytics.model}/>:analytics?.kind==='breakdown'?<ExecutionAnalyticsView {...analytics.model} initialTicker={parameters.ticker??''}/>:model?.explorerModel?<Suspense fallback={<Typography role="status">Loading report…</Typography>}>{model.explorerModel.kind==='explorer'?<Explorer model={model.explorerModel.model} coaching={{kind:'independent',reviewId,enrollmentId:model.explorerModel.enrollmentId}}/>:<Compare model={model.explorerModel.model} initialStudies={[]} coaching={{kind:'independent',reviewId,enrollmentId:model.explorerModel.enrollmentId}}/>}</Suspense>:model?.rulesModel?<RuleResultsClient initialView={model.rulesModel}/>:model?.analyzerModel?<SavedAnalyzerResource model={model.analyzerModel}/>:model?.content??null}
    </CoachingResourceContext.Provider>:null}
   </Box>
  </Drawer>
 </>;
}
