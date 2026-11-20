"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {DashboardPanel} from '@/app/dashboard-template';
import {TradeDetailsDrawer} from '@/app/(dashboard)/trades/trade-details-drawer';
import {TradingViewChart} from '@/app/(dashboard)/charts/trading-view-chart';
import {CoachingReviewDraftGuard} from '@/app/(dashboard)/communities/coaching-review-draft-guard';
import {canonicalIndependentFeedback,independentFeedbackValue,INDEPENDENT_FEEDBACK_ACK_ERROR} from '@/src/modules/communities/contracts/independent-coaching-review-baseline';
import {parseIndependentReviewDraft} from '@/src/modules/communities/contracts/independent-coaching-review-input';
import {daySessionReady} from '@/src/modules/communities/contracts/coaching-trading-day-evaluation';
import {parseTradeEvaluation} from '@/src/modules/communities/contracts/coaching-trade-evaluation';
import {matchesIndependentCoachingTrade as matches} from '@/src/modules/communities/contracts/independent-coaching-trade-selection';
import type {IndependentCoachingReviewDraft} from '@/src/modules/communities/contracts/independent-coaching';
import type {IndependentCoachingJournalReadService} from '@/src/modules/communities/server/independent-coaching-journal-read';
import {IndependentCoachingForm} from './coaching-form';
import {IndependentReviewTrades,independentTradeFeedbackReady,type IndependentTradeFeedback} from './review-trades';
import {TradeEvaluationFields} from './trade-evaluation-fields';
import {DaySessionAssessment} from './day-session-assessment';
import {IndependentReviewImages} from './review-images';
import {IndependentReviewResources} from './review-resources';
import {IndependentDayJournalResource} from './day-journal-resource';
import {IndependentImprovementHistory} from './improvement-history';
import {IndependentReviewFollowUp} from './review-follow-up';
import {ReviewJournalTradeCard,loadReviewTradeAnalysis,type ReviewWorkspaceProps} from './review-workspace';
import {useReviewAutosaveScope,useReviewSaveState} from './review-autosave';
import {resolveIndependentCoachingAnalysisLink} from './resource-actions';
import {parseCoachingReviewTrackerLink} from '@/src/modules/communities/contracts/coaching-review-trade-links';
import {withWrittenReviewBasis} from '@/app/(dashboard)/trade-tracker/analyzer-written-review-model';
import {useIndependentResourceLocation} from './resource-location';
type Trade=ReturnType<IndependentCoachingJournalReadService['listTrades']>[number];
type View='day'|'trades'|'overall'|'preview';
type PreviewStep={key:string;kind:'trade';date:string|null;tradeId:string}|{key:string;kind:'day';date:string}|{key:string;kind:'overall';date:null};
export function TradingDayReviewWorkspace({review,isCoach,focus,initialFeedback,selectionMode,studentGoals,editorBaselines,template,studentName,studentAvatarUrl,planName,returnHref,reviewLimits}:ReviewWorkspaceProps){
 const config=template!.daySessionReview!,acceptedTemplate=template!,editing=isCoach&&['ready','draft'].includes(review.status),days=[...review.selectedDays].sort();
 const [day,setDay]=useState(days[0]??''),[view,setView]=useState<View>(editing?'day':'preview'),[previewKey,setPreviewKey]=useState<string|null>(null),[previewNotice,setPreviewNotice]=useState('');
 const [draft,setDraft]=useState<IndependentCoachingReviewDraft>(review.draft),[saved,setSaved]=useState(review.draft),[fingerprint,setFingerprint]=useState(editorBaselines?.fingerprint??''),[acknowledged,setAcknowledged]=useState(review.status==='draft');
 const [feedback,setFeedback]=useState<readonly IndependentTradeFeedback[]>(()=>initialFeedback.map(row=>({...row,fingerprint:editorBaselines?.trades.find(item=>item.roundTripId===row.roundTripId)?.fingerprint??row.fingerprint}))),[trades,setTrades]=useState<readonly Trade[]>([]),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState(''),[revision,setRevision]=useState(0);
 const [moveError,setMoveError]=useState(''),[moving,setMoving]=useState(false),[deliveryPending,setDeliveryPending]=useState(false),[tradeImagesBlocked,setTradeImagesBlocked]=useState(false),[reviewImagesBlocked,setReviewImagesBlocked]=useState(false),[chart,setChart]=useState<string|null>(null),[editingPreview,setEditingPreview]=useState(false);
 const scope=useReviewAutosaveScope(),save=useReviewSaveState(),location=useIndependentResourceLocation(),details=location.parameters.get('trade'),main=useRef<HTMLDivElement>(null),alive=useRef(true),busy=useRef(false),navigation=useRef<{open:(id:string)=>Promise<void>;selection:()=>Promise<void>}|null>(null),previewOrigin=useRef<{id:string;key:string;date:string|null;scroll:{element:Element;top:number;left:number}[]}|null>(null);
 const [controlsTarget,setControlsTarget]=useState<HTMLElement|null>(null),[chartTarget,setChartTarget]=useState<HTMLElement|null>(null),[tradeView,setTradeView]=useState<'selection'|'review'>('selection');
 const imageBlocked=tradeImagesBlocked||reviewImagesBlocked;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{const controller=new AbortController();setLoading(true);setLoadError('');fetch(`/api/coaching/review-resource?${new URLSearchParams({reviewId:review.reviewId,resource:'trades'})}`,{signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error('Journal details are unavailable. Check current access. Saved review feedback is retained.');return response.json();}).then(value=>{if(!controller.signal.aborted)setTrades(value);}).catch(error=>{if(!controller.signal.aborted)setLoadError(error.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[review.reviewId,revision]);
 const dirty=canonicalIndependentFeedback(draft)!==canonicalIndependentFeedback(saved),publicDraft=review.delivered??draft;
 const completedTrades=feedback.filter(row=>row.completed&&independentTradeFeedbackReady(row.feedback,focus,acceptedTemplate)).length;
 const completedDays=days.filter(date=>daySessionReady(date,editing?draft:publicDraft,config)).length;
 const goalsMissing=focus.includes('goals')&&!draft.focusFeedback?.goals?.trim();
 const sendBlocked=loading||Boolean(loadError)||imageBlocked||moving||deliveryPending||dirty||!acknowledged||save.dirty||save.pending||Boolean(save.error)||completedDays!==days.length||completedTrades!==feedback.length||goalsMissing||!days.length;
 async function move(next:View,date=day){
  if(busy.current||deliveryPending)return false;busy.current=true;setMoving(true);setMoveError('');
  try{if(imageBlocked)throw new Error('Finish the image upload or remove the selected image before continuing.');if(editing){if(!scope)throw new Error('Review saving is not ready.');await scope.flush();if(date!==day)await navigation.current?.selection();}if(!alive.current)return false;setDay(date);setView(next);requestAnimationFrame(()=>{main.current?.focus({preventScroll:true});main.current?.scrollIntoView({block:'nearest',behavior:'instant'});});return true;}
  catch(error){if(alive.current)setMoveError(error instanceof Error?error.message:'Your draft has not finished saving.');return false;}
  finally{busy.current=false;if(alive.current)setMoving(false);}
 }
 async function editPreview(next:'day'|'trades',date:string,trigger:HTMLButtonElement,tradeId?:string){
  const scroll:{element:Element;top:number;left:number}[]=[];for(let element:Element|null=trigger.parentElement;element;element=element.parentElement)if(element.scrollHeight>element.clientHeight)scroll.push({element,top:element.scrollTop,left:element.scrollLeft});if(document.scrollingElement&&!scroll.some(point=>point.element===document.scrollingElement))scroll.push({element:document.scrollingElement,top:document.scrollingElement.scrollTop,left:document.scrollingElement.scrollLeft});previewOrigin.current={id:trigger.id,key:activeStep.key,date:activeStep.date,scroll};
  if(!await move(next,date))return;setEditingPreview(true);if(tradeId)requestAnimationFrame(()=>{void navigation.current?.open(tradeId).catch(error=>setMoveError(error instanceof Error?error.message:'The selected trade is unavailable.'));});
 }
 async function returnPreview(){const origin=previewOrigin.current,exact=previewSteps.some(step=>step.key===origin?.key);setPreviewKey(exact?origin!.key:origin?.date?`day:${origin.date}`:'overall');if(!await move('preview'))return;setEditingPreview(false);setPreviewNotice(exact?'':'The original item is no longer selected. Showing its day assessment or the overall review.');requestAnimationFrame(()=>{const target=document.getElementById(origin?.id??'');if(target)target.focus({preventScroll:true});else main.current?.focus({preventScroll:true});for(const point of origin?.scroll??[])if(point.element.isConnected)point.element.scrollTo({top:point.top,left:point.left,behavior:'instant'});});}
 const patch=(value:Partial<IndependentCoachingReviewDraft>)=>setDraft(current=>({...current,...value}));
 const unresolvedRows=feedback.filter(row=>!trades.some(trade=>matches(trade,row.roundTripId)&&days.includes(trade.tradingDate)));
 const previewSteps:PreviewStep[]=days.flatMap(date=>[...feedback.filter(row=>trades.some(trade=>matches(trade,row.roundTripId)&&trade.tradingDate===date)).map(row=>({key:`trade:${row.roundTripId}`,kind:'trade' as const,date,tradeId:row.roundTripId})),{key:`day:${date}`,kind:'day' as const,date}]);
 previewSteps.push(...unresolvedRows.map(row=>({key:`trade:${row.roundTripId}`,kind:'trade' as const,date:null,tradeId:row.roundTripId})),{key:'overall',kind:'overall',date:null});
 const activeStep=previewSteps.find(step=>step.key===previewKey)??previewSteps[0],previewIndex=previewSteps.findIndex(step=>step.key===activeStep.key),previewTrade=activeStep.kind==='trade'?feedback.find(row=>row.roundTripId===activeStep.tradeId):undefined;
 useEffect(()=>{
  if(review.status!=='delivered')return;
  const selectLinkedTrade=()=>{
   let target=new URLSearchParams(window.location.hash.slice(1)).get('evaluated-trade');
   if(!target&&window.location.hash.startsWith('#evaluated-trade-')){try{target=decodeURIComponent(window.location.hash.slice('#evaluated-trade-'.length));}catch{return;}}
   if(!target||!feedback.some(row=>row.roundTripId===target))return;
   setPreviewKey(`trade:${target}`);setView('preview');
   requestAnimationFrame(()=>main.current?.focus({preventScroll:true}));
  };
  selectLinkedTrade();window.addEventListener('hashchange',selectLinkedTrade);window.addEventListener('popstate',selectLinkedTrade);
  return()=>{window.removeEventListener('hashchange',selectLinkedTrade);window.removeEventListener('popstate',selectLinkedTrade);};
 },[review.reviewId,review.status,trades,feedback]);
 const mainTitle=view==='preview'?(editing?'Preview review':'Delivered review'):view==='overall'?'Overall feedback':view==='trades'?`${tradeView==='review'?'Trade Review':'Trade Selection'} · ${day}`:`Day/session assessment · ${day}`;

 const analysisHref=location.parameters.get('tradeAnalysis'),analysisLink=analysisHref?parseCoachingReviewTrackerLink(analysisHref):null;
 const loadAnalysis=useCallback(async()=>{if(!details)throw new Error('Choose a trade.');if(analysisHref){const parsed=parseCoachingReviewTrackerLink(analysisHref);if(!parsed||parsed.kind!=='trade')throw new Error('Choose an available saved trade link.');const resolved=await resolveIndependentCoachingAnalysisLink(review.reviewId,analysisHref,true);if(!resolved.analysis||(details!==resolved.link.tradeId&&details!==parsed.tradeId))throw new Error('Saved analysis is unavailable.');return withWrittenReviewBasis(resolved.analysis,resolved.link.basis);}return loadReviewTradeAnalysis(review.reviewId,details);},[review.reviewId,details,analysisHref]);
 return <CoachingReviewDraftGuard readOnly={!editing} onSaveBeforeLeave={editing?async()=>{if(imageBlocked)throw new Error('Finish the selected image before leaving.');if(!scope)throw new Error('Review saving is not ready.');await scope.flush();}:undefined}><Stack spacing={3}>
  <Box><Button href={returnHref} variant="outlined">{isCoach?'Back to work':'Back to coaching'}</Button></Box>
  <DashboardPanel hideHeader><Stack spacing={1}><Stack direction="row" sx={{gap:1.5,alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap'}}><Stack direction="row" spacing={1.5} sx={{alignItems:'center',minWidth:0}}><Avatar src={studentAvatarUrl??undefined} alt={`${studentName??'Student'} profile photo`} sx={{width:40,height:40,flexShrink:0}}>{(studentName??'Student').trim().split(/\s+/).map(part=>part[0]).slice(0,2).join('')}</Avatar><Typography component="h2" variant="h2" sx={{overflowWrap:'anywhere'}}>{studentName??'Student'}</Typography></Stack><IndependentImprovementHistory reviewId={review.reviewId} isCoach={isCoach} sidecard/></Stack>{planName?<Typography>{planName}</Typography>:null}</Stack></DashboardPanel>
  <DashboardPanel title="Trading-day Review" titleAdornment={<Stack direction="row" sx={{ml:1.5,gap:1,alignItems:'center',whiteSpace:'nowrap'}}><Chip size="small" variant="outlined" label={review.status==='delivered'?'Delivered':'Draft · not delivered'}/></Stack>}><Stack spacing={1}><Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><Typography variant="body2">{completedDays} of {days.length} day/session assessments complete</Typography><Typography variant="body2">{completedTrades} of {feedback.length} trade evaluations complete</Typography></Stack>{reviewLimits?.map(limit=><Typography key={limit} variant="body2" color="text.secondary">{limit}</Typography>)}{review.dueAtUtc?<Typography variant="body2">Due {new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'}).format(new Date(review.dueAtUtc))} ET</Typography>:null}</Stack></DashboardPanel>
  {moveError?<Alert severity="error">{moveError}</Alert>:null}{loadError?<Alert severity="warning" action={<Button onClick={()=>setRevision(value=>value+1)}>Retry</Button>}>{loadError}</Alert>:null}{loading?<Typography role="status">Loading selected trades…</Typography>:null}
  <Box ref={main} tabIndex={-1} role="region" aria-label="Trading-day review workspace" sx={{'&:focus-visible':{outline:theme=>`3px solid ${theme.palette.primary.main}`,outlineOffset:3}}}>
   <DashboardPanel title={mainTitle} action={editing&&view==='trades'&&tradeView==='review'?<Box ref={setChartTarget}/>:undefined}>
    <Stack spacing={3}>
     {editing?<><Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}>{days.map(date=><Button key={date} variant={date===day?'contained':'outlined'} disabled={moving||deliveryPending} onClick={()=>void move('day',date)}>{date}</Button>)}</Stack><Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><Button variant={view==='day'?'contained':'outlined'} disabled={moving||deliveryPending} onClick={()=>void move('day')}>Day/session</Button><Button variant={view==='trades'?'contained':'outlined'} disabled={moving||deliveryPending} onClick={()=>void move('trades')}>Trades</Button><Button variant={view==='overall'?'contained':'outlined'} disabled={moving||deliveryPending} onClick={()=>void move('overall')}>Overall feedback</Button><Button variant="outlined" disabled={moving||deliveryPending} onClick={()=>{setPreviewKey(null);setPreviewNotice('');void move('preview');}}>Preview review</Button></Stack>{editingPreview&&view!=='preview'?<Box><Button variant="outlined" disabled={moving||deliveryPending} onClick={()=>void returnPreview()}>Back to preview</Button></Box>:null}</>:null}
     {editing&&view==='trades'&&tradeView==='review'?<Box ref={setControlsTarget}/>:null}
     {editing?<IndependentCoachingForm autoSave reviewStatusAtStart guard={false} intent="save_review" label="Save day and overall draft" refreshOnSave={false} disabled={loading||Boolean(loadError)||imageBlocked||!fingerprint||deliveryPending} hidden={{reviewId:review.reviewId,draft:JSON.stringify(draft),expectedFingerprint:fingerprint}} onFeedbackSaved={(ack,submitted)=>{if(ack.kind!=='review')throw new Error(INDEPENDENT_FEEDBACK_ACK_ERROR);setFingerprint(ack.fingerprint);setSaved(parseIndependentReviewDraft(independentFeedbackValue(submitted.draft)));setAcknowledged(true);}}>
      <Box hidden={view!=='day'}>{day?<DaySessionAssessment date={day} config={config} draft={draft} onChange={patch} reviewId={review.reviewId}/>:<Typography>No trading days selected.</Typography>}</Box>
      <Box hidden={view!=='overall'}><Stack spacing={2}>{studentGoals?<Box><Typography sx={{fontWeight:600}}>Student goals at submission</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{studentGoals}</Typography></Box>:null}<TextField label="Overall review (optional)" multiline minRows={4} value={draft.overall??''} onChange={event=>patch({overall:event.target.value})}/>{focus.includes('goals')?<TextField label="Progress toward goals (Required)" multiline minRows={3} value={draft.focusFeedback?.goals??''} onChange={event=>patch({focusFeedback:{...draft.focusFeedback,goals:event.target.value}})}/>:null}<TextField label="Next steps (optional)" multiline minRows={3} value={draft.nextSteps??''} onChange={event=>patch({nextSteps:event.target.value})}/><TextField label="Private coach notes" helperText="Only this private note is hidden from the student. Your delivered review feedback is shared." multiline minRows={3} value={draft.privateNotes??''} onChange={event=>patch({privateNotes:event.target.value})}/><IndependentReviewImages reviewId={review.reviewId} editable onBlocked={setReviewImagesBlocked}/></Stack></Box>
     </IndependentCoachingForm>:null}
     {editing?<Box hidden={view!=='trades'}><IndependentReviewTrades dayFilter={day} controlsTarget={controlsTarget} chartTarget={chartTarget} onWorkspaceViewChange={setTradeView} overallLabel="Day/session assessment" reviewKind="trading_day" reviewId={review.reviewId} trades={trades} feedback={feedback} focus={focus} template={acceptedTemplate} selected={feedback.map(row=>row.roundTripId)} onSelected={()=>{}} onSaved={setFeedback} isCoach editing selecting={false} selectionMode={selectionMode} loading={loading} blocked={loading||Boolean(loadError)||imageBlocked||deliveryPending} onDetails={id=>location.change({trade:id,tradeAnalysis:null})} onChart={setChart} onBlocked={setTradeImagesBlocked} onDirtyChange={()=>{}} focusedWorkspace autoSave periodStart={review.periodStart} periodEnd={review.periodEnd} onSelectionChanged={()=>setRevision(value=>value+1)} editorNavigationRef={navigation} onOverall={()=>void move('day')} overallDraftComplete={daySessionReady(day,draft,config)} tradeCard={id=><ReviewJournalTradeCard reviewId={review.reviewId} tradeId={id}/>}/></Box>:null}
     {view==='preview'&&!loading?<Stack spacing={3}>
      <Stack direction="row" sx={{gap:1,alignItems:'center',flexWrap:'wrap'}}><Button disabled={moving||previewIndex===0} onClick={()=>{setPreviewNotice('');setPreviewKey(previewSteps[previewIndex-1].key);}}>Prev</Button><Typography>Step {previewIndex+1} of {previewSteps.length}</Typography><Button disabled={moving||previewIndex===previewSteps.length-1} onClick={()=>{setPreviewNotice('');setPreviewKey(previewSteps[previewIndex+1].key);}}>Next</Button></Stack>
      {previewNotice?<Alert severity="info">{previewNotice}</Alert>:null}
      {activeStep.kind==='trade'&&previewTrade?<Stack spacing={2}>
       <Typography component="h3" variant="h3">Trade evaluation · {trades.find(trade=>matches(trade,previewTrade.roundTripId))?.symbol??'Reviewed trade'}</Typography><Typography variant="body2" color="text.secondary">{activeStep.date??'Trading date unavailable — saved feedback is retained.'}</Typography>
       {previewTrade.feedback.evaluation?<TradeEvaluationFields focused readOnly template={acceptedTemplate} value={parseTradeEvaluation(previewTrade.feedback.evaluation)}/>:<Typography>Evaluation not recorded.</Typography>}<IndependentReviewImages reviewId={review.reviewId} roundTripId={previewTrade.roundTripId} editable={false}/>
       {editing&&activeStep.date?<Box><Button id={`day-preview-trade-${previewTrade.roundTripId}`} onClick={event=>void editPreview('trades',activeStep.date!,event.currentTarget,previewTrade.roundTripId)}>Edit trade review</Button></Box>:null}
      </Stack>:activeStep.kind==='day'?<Stack spacing={2}>
       <DaySessionAssessment date={activeStep.date} config={config} draft={publicDraft} readOnly/>{editing?<Box><Button id={`day-preview-${activeStep.date}`} onClick={event=>void editPreview('day',activeStep.date,event.currentTarget)}>Edit day/session</Button></Box>:null}
      </Stack>:<>
       <Typography component="h3" variant="h3">Overall review</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{publicDraft.overall||'No optional overall feedback added.'}</Typography>{publicDraft.focusFeedback?.goals?<Box><Typography sx={{fontWeight:600}}>Progress toward goals</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{publicDraft.focusFeedback.goals}</Typography></Box>:null}<Typography sx={{whiteSpace:'pre-wrap'}}>{publicDraft.nextSteps}</Typography><IndependentReviewImages reviewId={review.reviewId} editable={false}/>
       {editing?<><Typography variant="body2">Saving does not send feedback. Sending delivers all selected day/session assessments and trade evaluations together.</Typography>{sendBlocked?<Alert severity="info">Complete the agreed day and trade feedback and confirm all saves before sending.</Alert>:null}<IndependentCoachingForm guard={false} intent="deliver_review" label="Send to student" disabled={sendBlocked} hidden={{reviewId:review.reviewId}} onPendingChange={setDeliveryPending}/></>:null}
      </>}
     </Stack>:null}
    </Stack>
   </DashboardPanel>
  </Box>
  {isCoach?<Box component="details"><Box component="summary" sx={{cursor:'pointer',py:1}}>Review resources</Box><Stack spacing={2} sx={{mt:1}}><IndependentDayJournalResource reviewId={review.reviewId}/><IndependentReviewResources reviewId={review.reviewId} canReadRules={focus.includes('rules')} openTrade={id=>location.change({trade:id,tradeAnalysis:null})}/>{!editing&&review.draft.privateNotes?<Box><Typography sx={{fontWeight:600}}>Private coach notes — only you</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{review.draft.privateNotes}</Typography></Box>:null}</Stack></Box>:null}
  {review.status==='delivered'?<IndependentReviewFollowUp reviewId={review.reviewId} isCoach={isCoach}/>:null}
  <TradeDetailsDrawer open={details!==null} onClose={()=>location.change({trade:null,tradeAnalysis:null},true)} roundTripId={details} analyzer={null} initialTab={analysisLink?.kind==='trade'?'analyzer':'details'} initialAnalyzerInterval={analysisLink?.kind==='trade'?analysisLink.interval:'1m'} selectedAnalyzerEventId={analysisLink?.kind==='trade'?analysisLink.eventId:null} detailsUrl={details?`/api/coaching/review-resource?${new URLSearchParams({reviewId:review.reviewId,resource:'details',roundTripId:details})}`:undefined} loadSavedAnalysis={details?loadAnalysis:undefined}/>
  <Drawer anchor="right" open={chart!==null} onClose={()=>setChart(null)} slotProps={{paper:{sx:{width:'100vw'}}}}><Box sx={{p:2}}><Stack direction="row" sx={{justifyContent:'space-between',alignItems:'center'}}><Typography component="h2" variant="h2">Stock chart · {chart}</Typography><Button onClick={()=>setChart(null)}>Close</Button></Stack>{chart?<TradingViewChart symbol={chart} sx={{height:'calc(100dvh - 120px)',minHeight:400}}/>:null}</Box></Drawer>
 </Stack></CoachingReviewDraftGuard>;
}
