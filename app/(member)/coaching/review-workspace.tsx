"use client";
import {CoachingStudentTradeReplacement} from '@/app/coaching-student-trade-replacement';
import {PerformanceReviewWorkspace} from './performance-review-workspace';
import {TradingDayReviewWorkspace} from './trading-day-review-workspace';
import NextLink from 'next/link';
import {ReviewAutosaveProvider,useReviewAutosaveScope,useReviewSaveState} from './review-autosave';
import {useCallback,useEffect,useId,useRef,useState,type MouseEvent} from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import {TradingViewChart} from '@/app/(dashboard)/charts/trading-view-chart';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {DashboardPanel} from '@/app/dashboard-template';
import {TradeDetailsDrawer} from '@/app/(dashboard)/trades/trade-details-drawer';
import type {IndependentCoachingReview,IndependentCoachingReviewDraft,IndependentCoachingEditorBaselines} from '@/src/modules/communities/contracts/independent-coaching';
import {COACHING_REVIEW_FOCUS,coachingReviewLabel,type CoachingReviewFocus} from '@/src/modules/communities/contracts/coaching-review-workspace';
import type {IndependentCoachingJournalReadService} from '@/src/modules/communities/server/independent-coaching-journal-read';
import {independentFeedbackValue,canonicalIndependentFeedback,INDEPENDENT_FEEDBACK_ACK_ERROR} from '@/src/modules/communities/contracts/independent-coaching-review-baseline';
import {parseIndependentReviewDraft} from '@/src/modules/communities/contracts/independent-coaching-review-input';
import {selectedTradingDayAvailableAt,periodAvailableAt} from '@/src/modules/communities/contracts/coaching-review-timing';
import {IndependentReviewFollowUp} from './review-follow-up';
import {IndependentReviewImages} from './review-images';
import {IndependentCoachingForm} from './coaching-form';
import {CoachingReviewDraftGuard} from '@/app/(dashboard)/communities/coaching-review-draft-guard';
import {IndependentReviewResources} from './review-resources';
import {IndependentDayJournalResource} from './day-journal-resource';
import {IndependentReviewTrades,independentTradeFeedbackReady,type IndependentTradeFeedback as Feedback} from './review-trades';
import type {TradeEvaluationTemplate} from '@/src/modules/communities/contracts/coaching-trade-evaluation';
import {parseTradeEvaluation} from '@/src/modules/communities/contracts/coaching-trade-evaluation';
import {TradeEvaluationFields} from './trade-evaluation-fields';
import {IndependentImprovementHistory} from './improvement-history';

import {useIndependentResourceLocation} from './resource-location';
import {resolveIndependentCoachingAnalysisLink} from './resource-actions';
import {parseCoachingReviewTrackerLink} from '@/src/modules/communities/contracts/coaching-review-trade-links';
import {withWrittenReviewBasis} from '@/app/(dashboard)/trade-tracker/analyzer-written-review-model';
import {matchesIndependentCoachingTrade} from '@/src/modules/communities/contracts/independent-coaching-trade-selection';

type Trade=ReturnType<IndependentCoachingJournalReadService['listTrades']>[number];
function LegacyIndependentReviewWorkspace({review,isCoach,focus,initialFeedback,selectionMode,returnHref,studentGoals,maxQuantity,reviewLimits,editorBaselines,template,studentName,planName}:{performanceTemplate?:import('@/src/modules/communities/contracts/coaching-performance-evaluation').PerformanceTemplate;studentAvatarUrl?:string|null;planName?:string;studentName?:string;template?:TradeEvaluationTemplate;editorBaselines?:IndependentCoachingEditorBaselines;maxQuantity?:number;reviewLimits?:readonly string[];studentGoals:string;returnHref:string;review:IndependentCoachingReview;isCoach:boolean;focus:readonly CoachingReviewFocus[];initialFeedback:readonly Feedback[];selectionMode:string}){
 const workspaceRoot=useRef<HTMLDivElement>(null);
 const [trades,setTrades]=useState<Trade[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[resourceRevision,setResourceRevision]=useState(0),[selected,setSelected]=useState(initialFeedback.map(t=>t.roundTripId));
 const [draft,setDraft]=useState<IndependentCoachingReviewDraft>(review.draft),[savedDraft,setSavedDraft]=useState(review.draft),[fingerprint,setFingerprint]=useState(editorBaselines?.reviewId===review.reviewId?editorBaselines.fingerprint:''),[feedbackState,setFeedback]=useState<readonly Feedback[]>(()=>initialFeedback.map(row=>{const baseline=isCoach&&editorBaselines?.reviewId===review.reviewId?editorBaselines.trades.find(item=>item.roundTripId===row.roundTripId):undefined;return baseline?{...row,fingerprint:baseline.fingerprint}:row;}));
 const feedback=!isCoach&&review.submittedAtUtc?initialFeedback:feedbackState;
 const {parameters:resourceParameters,change:changeResource}=useIndependentResourceLocation();
 const rawFocused=resourceParameters.get('trade'),focused=rawFocused===null?null:`${rawFocused}`;
 const setFocused=(id:string|null)=>changeResource({trade:id,tradeAnalysis:null},id===null);
 const rawAnalysisHref=resourceParameters.get('tradeAnalysis'),analysisHref=rawAnalysisHref===null?null:`${rawAnalysisHref}`;
 const analysisLink=analysisHref?parseCoachingReviewTrackerLink(analysisHref):null;
 const loadSavedAnalysis=useCallback(async()=>{
  if(!focused)throw new Error('Choose a trade.');
  if(analysisHref){
   const parsed=parseCoachingReviewTrackerLink(analysisHref);
   if(!parsed||parsed.kind!=='trade')throw new Error('Choose a valid saved trade link.');
   const resolved=await resolveIndependentCoachingAnalysisLink(review.reviewId,analysisHref,true);
   if(!resolved.analysis||(focused!==resolved.link.tradeId&&focused!==parsed.tradeId))throw new Error('This saved trade is unavailable.');
   return withWrittenReviewBasis(resolved.analysis,resolved.link.basis);
  }
  const response=await fetch(`/api/coaching/review-resource?${new URLSearchParams({reviewId:review.reviewId,resource:'analyzer',roundTripId:focused})}`,{cache:'no-store'});
  if(!response.ok)throw new Error('Saved analysis is unavailable.');
  return response.json();
 },[focused,analysisHref,review.reviewId]);
 const [reviewSection,setReviewSection]=useState<'trades'|'overall'>('trades'),[previewOpen,setPreviewOpen]=useState(false),[draftAcknowledged,setDraftAcknowledged]=useState(review.status==='draft');
 const [imageBlocked,setImageBlocked]=useState(false),[tradeDirty,setTradeDirty]=useState(false),[chartSymbol,setChartSymbol]=useState<string|null>(null);
 const [days,setDays]=useState(review.selectedDays.join(', ')),[periodStart,setPeriodStart]=useState(review.periodStart??''),[periodEnd,setPeriodEnd]=useState(review.periodEnd??'');
 const availableAt=review.earlySubmissionAllowed?selectedTradingDayAvailableAt(review.kind==='trading_day'?days.split(',').map(day=>day.trim()).filter(Boolean).sort().at(-1):null):periodAvailableAt(periodEnd||null),periodBlocked=Boolean(availableAt&&new Date().toISOString()<availableAt),invalidPeriod=Boolean(periodStart&&periodEnd&&periodStart>periodEnd);
 const resource=(kind:string,id?:string)=>`/api/coaching/review-resource?reviewId=${encodeURIComponent(review.reviewId)}&resource=${kind}${id?`&roundTripId=${encodeURIComponent(id)}`:''}`;
 useEffect(()=>{
  const abort=new AbortController();fetch(`/api/coaching/review-resource?reviewId=${encodeURIComponent(review.reviewId)}&resource=trades`,{signal:abort.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error('Trading data is unavailable. Check Journal access.');return response.json();}).then(setTrades).catch(error=>{if(!abort.signal.aborted)setError(error.message);}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});return()=>abort.abort();
 },[review.reviewId,resourceRevision]);
 const individual=['trade','trading_day','strategy'].includes(review.kind);
 const editing=isCoach&&['ready','draft'].includes(review.status),selecting=review.status==='awaiting_submission'&&(selectionMode==='not_applicable'||selectionMode==='coach_or_student'||(isCoach?selectionMode==='coach':selectionMode==='student'));
 const focusedTrade=isCoach&&editing&&review.kind==='trade';
 const openDetails=(id:string)=>{setChartSymbol(null);setFocused(id);};
 const openChart=(symbol:string)=>{if(focused!==null)setFocused(null);setChartSymbol(symbol);};
 const saveDraftsBeforeLeave=async()=>{
  const root=workspaceRoot.current;
  if(!root||!root.isConnected)throw new Error('The review is no longer open.');
  if(imageBlocked||root.querySelector('[data-coaching-pending="true"]'))throw new Error('Finish the current save or image selection before leaving.');
  const forms=[...root.querySelectorAll<HTMLFormElement>('[data-coaching-review-save-form] form[data-coaching-unsaved="true"]')];
  if(!forms.length&&root.querySelector('[data-coaching-unsaved="true"]'))throw new Error('Unsaved changes remain. Save or remove the selected image before leaving.');
  for(const form of forms){
   if(!root.isConnected||!form.isConnected)throw new Error('The review editor changed. Your feedback has not been discarded.');
   if(root.querySelector('[data-coaching-pending="true"]'))throw new Error('Another save is in progress. Wait before leaving.');
   const submit=form.querySelector<HTMLButtonElement>('button[type="submit"]');
   if(!submit||submit.disabled)throw new Error('This draft cannot be saved yet. Check Journal access and the draft fields.');
   await new Promise<void>((resolve,reject)=>{
    let started=false,settled=false;
    const finish=(error?:Error)=>{if(settled)return;settled=true;observer.disconnect();clearTimeout(timer);if(error)reject(error);else resolve();};
    const observer=new MutationObserver(()=>{
     if(!form.isConnected||!root.isConnected){finish(new Error('The review editor changed. Your feedback has not been discarded.'));return;}
     if(form.dataset.coachingPending==='true'){started=true;return;}
     if(started){if(form.dataset.coachingUnsaved==='true')finish(new Error(form.querySelector('[role="status"]')?.textContent||'The draft was not fully saved. Your feedback is retained.'));else finish();}
    });
    const timer=setTimeout(()=>finish(new Error('Saving has not been confirmed. Stay on this review and check the draft before leaving.')),30000);
    observer.observe(form,{subtree:true,attributes:true,attributeFilter:['data-coaching-pending','data-coaching-unsaved'],childList:true,characterData:true});
    form.requestSubmit(submit);
   });
  }
  if(!root.isConnected||root.querySelector('[data-coaching-unsaved="true"], [data-coaching-pending="true"]'))throw new Error('New or unsaved changes remain. Your feedback is retained; review them before leaving.');
 };
 const count=feedback.filter(t=>t.completed&&(!editing||independentTradeFeedbackReady(t.feedback,focus,template))).length;
 const displayedTrades=selecting?trades.filter(trade=>(review.kind==='trade'||!periodStart||trade.tradingDate>=periodStart)&&(!periodEnd||trade.tradingDate<=periodEnd)&&(review.kind!=='trading_day'||!days||days.split(',').map(day=>day.trim()).includes(trade.tradingDate))):trades;
 const [submissionPending,setSubmissionPending]=useState(false),[submissionConfirmed,setSubmissionConfirmed]=useState(false);
 const submissionLocked=submissionPending||submissionConfirmed;
 const tradeList=individual?<IndependentReviewTrades reviewKind={review.kind} periodStart={periodStart} periodEnd={periodEnd} focusedWorkspace={focusedTrade} reviewId={review.reviewId} trades={displayedTrades} feedback={feedback} focus={focus} template={template} selected={selected} onSelected={setSelected} onSaved={setFeedback} isCoach={isCoach} editing={editing} selecting={selecting} selectionMode={selectionMode} loading={loading} blocked={submissionLocked||periodBlocked||invalidPeriod||imageBlocked||loading||Boolean(error)} onDetails={openDetails} onChart={openChart} onBlocked={setImageBlocked} onDirtyChange={setTradeDirty}/>:<Box sx={{overflowX:'auto'}}><Box component="table" sx={{width:'100%',borderCollapse:'collapse','& th,& td':{p:1,textAlign:'left',borderBottom:1,borderColor:'divider'}}}><thead><tr><th>Ticker</th><th>Direction</th><th>Date</th><th>Net P/L</th><th>Actions</th></tr></thead><tbody>{displayedTrades.map(trade=><tr key={trade.roundTripId}><td>{trade.symbol}</td><td>{trade.direction==='long'?'Long':'Short'}</td><td>{trade.tradingDate}</td><td>{trade.netPnlDecimal===null?'Unavailable':new Intl.NumberFormat('en-US',{style:'currency',currency:trade.currency,maximumFractionDigits:2}).format(Number(trade.netPnlDecimal))}</td><td><Button onClick={()=>setFocused(trade.roundTripId)}>Details</Button></td></tr>)}</tbody></Box></Box>;
 const submission=<IndependentCoachingForm guard={false} intent="submit_review" onPendingChange={setSubmissionPending} onSaved={()=>setSubmissionConfirmed(true)} disabled={submissionLocked||periodBlocked||invalidPeriod||loading||Boolean(error)} label="Submit selected work" hidden={{reviewId:review.reviewId}}><input name="roundTripIds" type="hidden" value={JSON.stringify(selected)}/><input name="selectedDays" type="hidden" value={JSON.stringify(days.split(',').map(d=>d.trim()).filter(Boolean))}/>{review.kind==='trading_day'?<Stack spacing={1}><Typography>Choose trading days, then select their trades within the agreed limit.</Typography><Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}>{[...new Set(trades.map(trade=>trade.tradingDate))].sort().map(day=><Button disabled={submissionLocked||periodBlocked||invalidPeriod} key={day} data-coaching-edit variant={days.split(',').map(value=>value.trim()).includes(day)?'contained':'outlined'} onClick={()=>{const selected=days.split(',').map(value=>value.trim()).filter(Boolean);const next=selected.includes(day)?selected.filter(value=>value!==day):[...selected,day].sort();setDays(next.join(', '));setSelected(previous=>previous.filter(id=>trades.some(trade=>matchesIndependentCoachingTrade(trade,id)&&next.includes(trade.tradingDate))));}}>{day} · {trades.filter(trade=>trade.tradingDate===day).length} trades</Button>)}</Stack></Stack>:null}{!review.periodStart?<TextField type="date" label="Trading period from" disabled={submissionLocked} name="periodStart" value={periodStart} onChange={event=>setPeriodStart(event.target.value)} sx={{maxWidth:320}} slotProps={{inputLabel:{shrink:true}}}/>:null}{!review.periodEnd?<TextField type="date" label="Trading period to" disabled={submissionLocked} name="periodEnd" value={periodEnd} onChange={event=>setPeriodEnd(event.target.value)} sx={{maxWidth:320}} slotProps={{inputLabel:{shrink:true}}}/>:null}</IndependentCoachingForm>;
 const content=<Stack spacing={2}><Box><Button component={NextLink} prefetch={false} href={returnHref} variant="outlined">{isCoach?'Back to work':'Back to coaching'}</Button></Box>
  <Box><IndependentImprovementHistory reviewId={review.reviewId} isCoach={isCoach}/></Box>
  {studentGoals?<DashboardPanel title="Student goals at submission"><Typography sx={{whiteSpace:'pre-wrap'}}>{studentGoals}</Typography></DashboardPanel>:null}
  {selecting&&periodBlocked?<Alert severity="info">Start Date: {availableAt?new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'}).format(new Date(availableAt)):'After the final trading date'} ET. {review.earlySubmissionAllowed?'Selected trading days cannot be in the future.':'The full trading period must end before work is submitted.'}</Alert>:null}
  {selecting&&invalidPeriod?<Alert severity="warning">The trading period end must be on or after its start.</Alert>:null}
  {error?<Alert severity="warning" action={<Button onClick={()=>{setError('');setLoading(true);setResourceRevision(value=>value+1);}}>Retry</Button>}>{error}</Alert>:null}{loading?<Typography role="status">Loading shared trades…</Typography>:null}
  <Box hidden={focusedTrade&&reviewSection!=='trades'}>{tradeList}</Box>
  {selecting?submission:null}
  <Box hidden={focusedTrade&&reviewSection!=='overall'}>
  {focusedTrade?<Stack spacing={1.5} sx={{mb:2}}><Typography component="h3" variant="h3">Overall feedback and delivery</Typography><Typography variant="body2" color="text.secondary">{count} of {feedback.length} selected trade drafts complete. Each trade is saved separately.</Typography><Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}>{feedback.map(row=>{const trade=trades.find(trade=>matchesIndependentCoachingTrade(trade,row.roundTripId));return <Chip key={row.roundTripId} variant="outlined" color={row.completed&&independentTradeFeedbackReady(row.feedback,focus,template)?'success':'warning'} label={`${trade?.symbol??'Selected trade'} · ${row.completed&&independentTradeFeedbackReady(row.feedback,focus,template)?'Draft complete':'Needs feedback'}`}/>;})}</Stack></Stack>:null}
  <Box data-coaching-review-save-form>{editing?<IndependentCoachingForm guard={false} intent="save_review" refreshOnSave={!focusedTrade} disabled={imageBlocked||loading||Boolean(error)||!fingerprint} label={focusedTrade?"Save overall draft":"Save draft"} hidden={{reviewId:review.reviewId,draft:JSON.stringify(draft),expectedFingerprint:fingerprint}} onFeedbackSaved={(ack,submitted)=>{
   if(ack.kind!=='review')throw new Error(INDEPENDENT_FEEDBACK_ACK_ERROR);
   setSavedDraft(parseIndependentReviewDraft(independentFeedbackValue(submitted.draft)));setFingerprint(ack.fingerprint);setDraftAcknowledged(true);
  }}>
   <TextField label="Overall review" multiline minRows={5} value={draft.overall??''} onChange={event=>setDraft(old=>({...old,overall:event.target.value}))}/>
   {focus.filter(key=>!['overall','next_steps'].includes(key)&&(review.kind!=='trade'||key==='goals')).map(key=><TextField key={key} label={COACHING_REVIEW_FOCUS[key]} multiline minRows={3} value={draft.focusFeedback?.[key]??''} onChange={event=>setDraft(old=>({...old,focusFeedback:{...old.focusFeedback,[key]:event.target.value}}))}/>)}
   {review.selectedDays.map(day=><TextField key={day} label={`Trading-day assessment · ${day}`} multiline minRows={4} value={draft.dayAssessments?.[day]??''} onChange={event=>setDraft(old=>({...old,dayAssessments:{...old.dayAssessments,[day]:event.target.value}}))}/>)}
   <TextField label="Next steps" multiline minRows={3} value={draft.nextSteps??''} onChange={event=>setDraft(old=>({...old,nextSteps:event.target.value}))}/>
   {!individual?<IndependentReviewImages reviewId={review.reviewId} editable onBlocked={setImageBlocked}/>:null}
   <TextField label="Private coach notes" helperText="Only this private note is hidden from the student. Your delivered review feedback is shared." multiline minRows={3} value={draft.privateNotes??''} onChange={event=>setDraft(old=>({...old,privateNotes:event.target.value}))}/>
  </IndependentCoachingForm>:null}</Box>
  {focusedTrade?<Stack spacing={2} sx={{mt:3,p:2,border:1,borderColor:'divider',borderRadius:2}}>
   <Typography component="h3" variant="h3">Review before sending</Typography>
   <Typography variant="body2" color="text.secondary">Saving does not send feedback. Preview what the student will see, then explicitly send the review.</Typography>
   <Box><Button variant="outlined" disabled={imageBlocked} onClick={()=>setPreviewOpen(true)}>Preview student review</Button></Box>
   {JSON.stringify(draft)!==JSON.stringify(savedDraft)||tradeDirty?<Alert severity="info">Save your latest trade and overall drafts before sending.</Alert>:null}
   {draftAcknowledged?<IndependentCoachingForm guard={false} intent="deliver_review" disabled={imageBlocked||loading||Boolean(error)||tradeDirty||feedback.some(trade=>!trade.completed||!independentTradeFeedbackReady(trade.feedback,focus,template))||JSON.stringify(draft)!==JSON.stringify(savedDraft)} label="Send review to student" hidden={{reviewId:review.reviewId}}/>:<Typography variant="body2" color="text.secondary">Save your review draft to enable delivery.</Typography>}
  </Stack>:null}
  </Box>
  {isCoach&&!editing&&review.draft.privateNotes?<TextField label="Private coach notes" value={review.draft.privateNotes} multiline minRows={3} slotProps={{input:{readOnly:true}}}/>:null}
 </Stack>;
 const selectionDirty=selecting&&(JSON.stringify(selected)!==JSON.stringify(initialFeedback.map(t=>t.roundTripId))||days!==review.selectedDays.join(', ')||periodStart!==(review.periodStart??'')||periodEnd!==(review.periodEnd??''));
 const studentTradeCount=selecting?selected.length:feedback.length;
 const studentDayCount=selecting?days.split(',').map(day=>day.trim()).filter(Boolean).length:review.selectedDays.length;
 const studentCount=review.kind==='trading_day'?`${studentDayCount} trading day${studentDayCount===1?'':'s'} · ${studentTradeCount} trade${studentTradeCount===1?'':'s'}`:`${studentTradeCount} trade${studentTradeCount===1?'':'s'}`;
 const studentProgress=review.status==='cancelled'?'No further work is expected for this review.':individual?`${studentCount} ${review.status==='awaiting_submission'?'selected':review.status==='delivered'?'reviewed':'submitted'}`:review.status==='awaiting_submission'?'Submit your agreed work when you are ready.':review.status==='delivered'?'Your review is available below.':'Your agreed work has been submitted.';
 const studentStatus={awaiting_submission:'Awaiting your submission',ready:'Waiting for your coach',draft:'Your coach is reviewing this',delivered:'Delivered',cancelled:'Cancelled'}[review.status];
 return <CoachingReviewDraftGuard onSaveBeforeLeave={focusedTrade?saveDraftsBeforeLeave:undefined} readOnly={!editing&&!selecting}><Box ref={workspaceRoot} data-coaching-controlled-draft data-coaching-unsaved={selectionDirty?'true':'false'}><Grid container spacing={3}><Grid size={{xs:12,lg:focusedTrade?12:9}}><DashboardPanel title={focusedTrade?"Trade Review workspace":"Review workspace"}>{!isCoach&&review.submittedAtUtc&&['ready','draft'].includes(review.status)&&['trade','trading_day'].includes(review.kind)&&['student','coach_or_student'].includes(selectionMode)?<CoachingStudentTradeReplacement key={review.reviewId} reviewId={review.reviewId} onReplaced={()=>setResourceRevision(value=>value+1)}/>:null}
  {!isCoach?<Box sx={{mb:2}}>{planName?<Typography variant="subtitle1">{planName}</Typography>:null}<Typography variant="body2" color="text.secondary">{coachingReviewLabel(review.kind,'Review')}{review.periodStart&&review.periodEnd?` · Trading period: ${review.periodStart} – ${review.periodEnd}`:''}</Typography></Box>:null}
  {focusedTrade?<Stack spacing={2} sx={{mb:3}}>
   <Stack direction="row" sx={{gap:1,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}><Box>{studentName?<Typography component="h2" variant="h2">{studentName}</Typography>:null}<Typography variant="body2" color="text.secondary">Trade Review{review.periodStart&&review.periodEnd?` · ${review.periodStart} – ${review.periodEnd}`:''}</Typography></Box><Chip variant="outlined" color="info" label={draftAcknowledged||count>0?'Draft · not delivered':'Ready for review'}/></Stack>
   <ToggleButtonGroup exclusive value={reviewSection} aria-label="Review workspace sections" size="small" onChange={(_,next:'trades'|'overall'|null)=>{if(next)setReviewSection(next);}} sx={{alignSelf:'flex-start',flexWrap:'wrap'}}><ToggleButton value="trades">Trade reviews</ToggleButton><ToggleButton value="overall">Overall feedback and delivery</ToggleButton></ToggleButtonGroup>
  </Stack>:null}
  {content}
  {review.delivered?<Stack spacing={3} sx={{mt:2}}><Typography variant="h3">Delivered review</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{review.delivered.overall}</Typography>{Object.entries(review.delivered.focusFeedback??{}).filter(([,value])=>value).map(([key,value])=><Box key={key}><Typography variant="subtitle2">{COACHING_REVIEW_FOCUS[key as CoachingReviewFocus]??key}</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{value}</Typography></Box>)}{Object.entries(review.delivered.dayAssessments??{}).map(([day,value])=><Box key={day}><Typography variant="subtitle2">Trading day · {day}</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{value}</Typography></Box>)}{feedback.map(trade=><Box key={trade.roundTripId} id={`evaluated-trade-${encodeURIComponent(trade.roundTripId)}`}><DashboardPanel title={`Trade feedback · ${trades.find(item=>matchesIndependentCoachingTrade(item,trade.roundTripId))?.symbol??'Reviewed trade'}`}><Stack spacing={2}>{template&&trade.feedback.evaluation?<TradeEvaluationFields readOnly template={template} value={parseTradeEvaluation(trade.feedback.evaluation)}/>:<Typography sx={{whiteSpace:'pre-wrap'}}>{String(trade.feedback.overall??'')}</Typography>}{Object.entries(trade.feedback.focusFeedback as Record<string,string>??{}).map(([key,value])=><Box key={key}><Typography variant="subtitle2">{COACHING_REVIEW_FOCUS[key as CoachingReviewFocus]??key}</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{value}</Typography></Box>)}<IndependentReviewImages reviewId={review.reviewId} roundTripId={trade.roundTripId} editable={false}/></Stack></DashboardPanel></Box>)}<IndependentReviewImages reviewId={review.reviewId} editable={false}/><Typography sx={{whiteSpace:'pre-wrap'}}>{review.delivered.nextSteps}</Typography></Stack>:null}
 </DashboardPanel></Grid><Grid size={{xs:12,lg:focusedTrade?12:3}}><DashboardPanel title="Review progress"><Stack spacing={2}>{reviewLimits?.length?reviewLimits.map(limit=><Typography key={limit}>{limit}</Typography>):maxQuantity?<Typography>{review.kind==='trading_day'?`Up to ${maxQuantity} trading days`:review.kind==='trade'?`${maxQuantity} ${maxQuantity===1?'trade':'trades'} per review`:`Up to ${maxQuantity} period assessments`}</Typography>:null}{focus.length?<Typography variant="body2">Agreed focus: {focus.map(key=>COACHING_REVIEW_FOCUS[key]).join(', ')}</Typography>:null}{isCoach?individual?<Typography>{count} of {selecting?selected.length:feedback.length} selected trade {isCoach&&editing?'review drafts saved':'reviews saved'}</Typography>:<Typography>Review feedback for the agreed period</Typography>:<Typography>{studentProgress}</Typography>}{isCoach&&(review.kind==="trading_day"||focus.includes("journal")||focus.includes("rules"))?<IndependentDayJournalResource reviewId={review.reviewId}/>:null}{isCoach?<IndependentReviewResources reviewId={review.reviewId} canReadRules={focus.includes("rules")} openTrade={openDetails}/>:null}<Typography>{isCoach?review.status.replaceAll('_',' '):studentStatus}</Typography>{review.dueAtUtc?<Typography>Due {new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'}).format(new Date(review.dueAtUtc))} ET</Typography>:null}{isCoach&&!focusedTrade&&review.status==='draft'?<IndependentCoachingForm guard={false} intent="deliver_review" disabled={imageBlocked||loading||Boolean(error)||tradeDirty||individual&&feedback.some(trade=>!trade.completed||!independentTradeFeedbackReady(trade.feedback,focus,template))||JSON.stringify(draft)!==JSON.stringify(savedDraft)} label="Send review to student" hidden={{reviewId:review.reviewId}}><Typography>Save your latest draft before sending.</Typography></IndependentCoachingForm>:null}</Stack></DashboardPanel></Grid>
 {focusedTrade?<Dialog open={previewOpen} onClose={()=>setPreviewOpen(false)} fullWidth maxWidth="lg" aria-labelledby="trade-review-student-preview" slotProps={{paper:{sx:{maxHeight:'calc(100dvh - 32px)'}}}}><DialogTitle id="trade-review-student-preview">Student review preview</DialogTitle><DialogContent dividers><Stack spacing={3}>
  {tradeDirty||JSON.stringify(draft)!==JSON.stringify(savedDraft)?<Alert severity="info">Overall text includes your current edits. Per-trade feedback below uses saved drafts. Save all changes before sending.</Alert>:null}
  <Box><Typography component="h3" variant="h3">Overall review</Typography><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{draft.overall||'Not recorded'}</Typography></Box>
  {Object.entries(draft.focusFeedback??{}).filter(([,value])=>value).map(([key,value])=><Box key={key}><Typography variant="subtitle2">{COACHING_REVIEW_FOCUS[key as CoachingReviewFocus]??key}</Typography><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{value}</Typography></Box>)}
  {feedback.map(row=><DashboardPanel key={row.roundTripId} title={trades.find(trade=>matchesIndependentCoachingTrade(trade,row.roundTripId))?.symbol??'Reviewed trade'}><Stack spacing={2}>{template&&row.feedback.evaluation?<TradeEvaluationFields readOnly template={template} value={parseTradeEvaluation(row.feedback.evaluation)}/>:<Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{String(row.feedback.overall??'Not recorded')}</Typography>}{Object.entries(row.feedback.focusFeedback as Record<string,string>??{}).filter(([,value])=>value).map(([key,value])=><Box key={key}><Typography variant="subtitle2">{COACHING_REVIEW_FOCUS[key as CoachingReviewFocus]??key}</Typography><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{value}</Typography></Box>)}<IndependentReviewImages reviewId={review.reviewId} roundTripId={row.roundTripId} editable={false}/></Stack></DashboardPanel>)}
  <Box><Typography component="h3" variant="h3">Next steps</Typography><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{draft.nextSteps||'Not recorded'}</Typography></Box>
 </Stack></DialogContent><DialogActions><Button onClick={()=>setPreviewOpen(false)}>Back to review</Button></DialogActions></Dialog>:null}
 {review.delivered?<Grid size={12}><IndependentReviewFollowUp reviewId={review.reviewId} isCoach={isCoach}/></Grid>:null}<TradeDetailsDrawer open={focused!==null} onClose={()=>setFocused(null)} roundTripId={focused} analyzer={null} detailsUrl={focused?resource('details',focused):undefined} initialTab={analysisLink?.kind==='trade'?'analyzer':'details'} initialAnalyzerInterval={analysisLink?.kind==='trade'?analysisLink.interval:'1m'} selectedAnalyzerEventId={analysisLink?.kind==='trade'?analysisLink.eventId:null} loadSavedAnalysis={focused?loadSavedAnalysis:undefined}/>
 <Drawer anchor="right" open={chartSymbol!==null} onClose={()=>setChartSymbol(null)} slotProps={{paper:{sx:{width:'100vw'}}}}><Box sx={{p:3}}><Stack direction="row" sx={{alignItems:'center',justifyContent:'space-between'}}><Typography component="h2" variant="h2">Stock chart · {chartSymbol}</Typography><Button onClick={()=>setChartSymbol(null)}>Close</Button></Stack>{chartSymbol?<TradingViewChart symbol={chartSymbol} sx={{height:'calc(100dvh - 140px)',minHeight:400,mt:2}}/>:null}</Box></Drawer>
 </Grid></Box></CoachingReviewDraftGuard>;
}


export type ReviewWorkspaceProps=Parameters<typeof LegacyIndependentReviewWorkspace>[0];
export function IndependentReviewWorkspace(props:ReviewWorkspaceProps){
 if(props.review.kind==='performance'&&props.performanceTemplate&&(props.isCoach&&['ready','draft'].includes(props.review.status)||props.review.status==='delivered'))return <ReviewAutosaveProvider><PerformanceReviewWorkspace {...props}/></ReviewAutosaveProvider>;
 if(props.review.kind==='trading_day'&&props.template?.daySessionReview&&(props.isCoach&&['ready','draft'].includes(props.review.status)||props.review.status==='delivered'))return <ReviewAutosaveProvider><TradingDayReviewWorkspace {...props}/></ReviewAutosaveProvider>;
 return props.isCoach&&props.review.kind==='trade'&&['ready','draft','delivered'].includes(props.review.status)?<ReviewAutosaveProvider><OwnerTradeReviewWorkspace {...props}/></ReviewAutosaveProvider>:<LegacyIndependentReviewWorkspace {...props}/>;
}

/** Owner-approved single-card Trade workspace; other review kinds keep their accepted workflow. */
function OwnerTradeReviewWorkspace({review,isCoach,returnHref,focus,initialFeedback,selectionMode,studentGoals,editorBaselines,template,studentName,studentAvatarUrl,reviewLimits,planName}:ReviewWorkspaceProps){
 const scope=useReviewAutosaveScope(),saveState=useReviewSaveState(),id=useId();
 const [view,setView]=useState<'trades'|'overall'|'preview'>(review.status==='delivered'?'preview':'trades'),[trades,setTrades]=useState<Trade[]>([]),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState(''),[revision,setRevision]=useState(0);
 const [feedback,setFeedback]=useState<readonly Feedback[]>(()=>initialFeedback.map(row=>({...row,fingerprint:editorBaselines?.trades.find(b=>b.roundTripId===row.roundTripId)?.fingerprint??row.fingerprint}))),[draft,setDraft]=useState<IndependentCoachingReviewDraft>(review.draft),[fingerprint,setFingerprint]=useState(editorBaselines?.fingerprint??''),[acknowledged,setAcknowledged]=useState(review.status==='draft');
 const [imageBlocked,setImageBlocked]=useState(false),[moving,setMoving]=useState(false),[deliveryPending,setDeliveryPending]=useState(false),[moveError,setMoveError]=useState(''),[editingPreview,setEditingPreview]=useState(false),[chart,setChart]=useState<string|null>(null);
 const {parameters:resourceParameters,change:changeResource}=useIndependentResourceLocation();
 const details=resourceParameters.get('trade'),analysisHref=resourceParameters.get('tradeAnalysis');
 const analysisLink=analysisHref?parseCoachingReviewTrackerLink(analysisHref):null;
 const setDetails=(tradeId:string|null)=>changeResource({trade:tradeId,tradeAnalysis:null},tradeId===null);
 const latestFeedback=useRef(feedback);latestFeedback.current=feedback;
 const [tradeView,setTradeView]=useState<'selection'|'review'>('selection');
 const [overallSaved,setOverallSaved]=useState(review.draft);
 const [previewStep,setPreviewStep]=useState<string|null>(initialFeedback[0]?.roundTripId??null),[controlsTarget,setControlsTarget]=useState<HTMLElement|null>(null),[chartTarget,setChartTarget]=useState<HTMLElement|null>(null),[overallReviewedKey,setOverallReviewedKey]=useState<string|null>(null);
 const latestDraft=useRef(draft);latestDraft.current=draft;
 const alive=useRef(true),movingNow=useRef(false),navigation=useRef<{open:(id:string)=>Promise<void>;selection:()=>Promise<void>}|null>(null),previewReturn=useRef<{id:string;step:string|null;points:{element:Element;top:number;left:number}[]}|null>(null);
 const editing=review.status!=='delivered';
 const mainCard=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(review.status!=='delivered')return;
  const selectLinkedTrade=()=>{let target=new URLSearchParams(window.location.hash.slice(1)).get('evaluated-trade');if(!target&&window.location.hash.startsWith('#evaluated-trade-')){try{target=decodeURIComponent(window.location.hash.slice('#evaluated-trade-'.length));}catch{return;}}if(!target||!initialFeedback.some(row=>row.roundTripId===target))return;setPreviewStep(target);setView('preview');requestAnimationFrame(()=>mainCard.current?.focus({preventScroll:true}));};
  selectLinkedTrade();window.addEventListener('hashchange',selectLinkedTrade);window.addEventListener('popstate',selectLinkedTrade);return()=>{window.removeEventListener('hashchange',selectLinkedTrade);window.removeEventListener('popstate',selectLinkedTrade);};
 },[review.reviewId,review.status,initialFeedback]);
 const mainTitle=view==='preview'?(editing?'Preview review':'Delivered review'):view==='overall'?'Overall feedback':tradeView==='review'?'Trade Review':'Trade Selection';
 const resource=(kind:string,tradeId?:string)=>`/api/coaching/review-resource?${new URLSearchParams({reviewId:review.reviewId,resource:kind,...(tradeId?{roundTripId:tradeId}:{})})}`;
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{const abort=new AbortController();fetch(`/api/coaching/review-resource?${new URLSearchParams({reviewId:review.reviewId,resource:'trades'})}`,{signal:abort.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error('Trading data is unavailable. Check Journal access.');return response.json();}).then(value=>{if(!abort.signal.aborted)setTrades(value);}).catch(error=>{if(!abort.signal.aborted)setLoadError(error.message);}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});return()=>abort.abort();},[review.reviewId,revision]);
 const focusMainCard=()=>requestAnimationFrame(()=>{mainCard.current?.focus({preventScroll:true});mainCard.current?.scrollIntoView({block:'start',behavior:'instant'});});
 const move=async(next:'trades'|'overall'|'preview',previewTarget?:string|null)=>{
  if(movingNow.current||deliveryPending)return false;
  movingNow.current=true;setMoving(true);setMoveError('');
  try{if(imageBlocked)throw new Error('Finish uploading or remove the selected image before continuing.');if(editing)await scope?.flush();if(editing&&(next==='overall'||next==='preview'&&previewTarget===null)&&(!latestFeedback.current.length||!latestFeedback.current.every(row=>row.completed&&independentTradeFeedbackReady(row.feedback,focus,template))))throw new Error('Complete each selected trade’s feedback before continuing to overall feedback.');if(next==='preview'&&previewTarget!==undefined&&previewTarget!==null&&!latestFeedback.current.some(row=>row.roundTripId===previewTarget))throw new Error('This trade is no longer selected for review.');if(!alive.current)return;if(next==='preview'&&previewTarget!==undefined)setPreviewStep(previewTarget);if(next==='preview'&&view==='overall')setOverallReviewedKey(canonicalIndependentFeedback(latestDraft.current));setView(next);focusMainCard();return true;}
  catch(error){if(alive.current)setMoveError(error instanceof Error?error.message:'Your latest feedback has not been saved.');return false;}
  finally{movingNow.current=false;if(alive.current)setMoving(false);}
 };
 const editFromPreview=async(section:string,event:MouseEvent<HTMLButtonElement>)=>{
  if(movingNow.current||deliveryPending)return;
  const trigger=event.currentTarget,points:{element:Element;top:number;left:number}[]=[];
  for(let element:HTMLElement|null=trigger.parentElement;element;element=element.parentElement)if(/auto|scroll|overlay/.test(getComputedStyle(element).overflowY)&&element.scrollHeight>element.clientHeight)points.push({element,top:element.scrollTop,left:element.scrollLeft});
  const documentScroller=document.scrollingElement;if(documentScroller&&!points.some(p=>p.element===documentScroller))points.push({element:documentScroller,top:documentScroller.scrollTop,left:documentScroller.scrollLeft});
  previewReturn.current={id:trigger.id,step:previewStep,points};
  if(section==='overall'){setEditingPreview(true);await move('overall');return;}
  setMoveError('');movingNow.current=true;setMoving(true);
  try{if(!navigation.current)throw new Error('The trade editor is unavailable.');await navigation.current.open(section);if(alive.current){setView('trades');setEditingPreview(true);}}
  catch(error){if(alive.current)setMoveError(error instanceof Error?error.message:'The trade editor is unavailable.');}
  finally{movingNow.current=false;if(alive.current)setMoving(false);}
 };
 const backToPreview=async()=>{const moved=await move('preview',previewReturn.current?.step);if(!moved||!alive.current)return;requestAnimationFrame(()=>{const origin=previewReturn.current;if(origin){document.getElementById(origin.id)?.focus({preventScroll:true});for(const point of origin.points)if(point.element.isConnected)point.element.scrollTo({top:point.top,left:point.left,behavior:'instant'});}});};
 const loadSelectedAnalysis=useCallback(async()=>{
  if(!details)throw new Error('Choose a trade.');
  if(analysisHref){
   const parsed=parseCoachingReviewTrackerLink(analysisHref);
   if(!parsed||parsed.kind!=='trade')throw new Error('Choose a valid saved trade link.');
   const resolved=await resolveIndependentCoachingAnalysisLink(review.reviewId,analysisHref,true);
   if(!resolved.analysis||(details!==resolved.link.tradeId&&details!==parsed.tradeId))throw new Error('This saved trade is unavailable.');
   return withWrittenReviewBasis(resolved.analysis,resolved.link.basis);
  }
  return loadReviewTradeAnalysis(review.reviewId,details);
 },[review.reviewId,details,analysisHref]);
 const complete=feedback.length>0&&feedback.every(row=>row.completed&&independentTradeFeedbackReady(row.feedback,focus,template));
 const goalsMissing=focus.includes('goals')&&!draft.focusFeedback?.goals?.trim();
 const overallDirty=canonicalIndependentFeedback(draft)!==canonicalIndependentFeedback(overallSaved);
 const sendBlocked=!(review.status==='draft'||feedback.some(row=>row.completed))||overallDirty||imageBlocked||loading||Boolean(loadError)||moving||deliveryPending||saveState.dirty||saveState.pending||Boolean(saveState.error)||!complete||goalsMissing;
 const previewAvailable=complete||acknowledged||feedback.some(row=>Boolean(row.fingerprint)&&Object.keys(row.feedback).length>0);
 const publicReview=review.delivered??draft;
 const previewRow=previewStep===null?undefined:feedback.find(row=>row.roundTripId===previewStep),previewIndex=feedback.findIndex(row=>row.roundTripId===previewStep);
 const overallDraftComplete=!goalsMissing&&!overallDirty&&(Boolean(overallSaved.overall?.trim()||overallSaved.nextSteps?.trim()||overallSaved.focusFeedback?.goals?.trim())||overallReviewedKey===canonicalIndependentFeedback(overallSaved));
 const overallStatus=overallDirty?'Changes not yet saved':saveState.error?'Save needs attention':saveState.pending?'Saving…':!complete?'Available after trade reviews':goalsMissing?'Agreed goals feedback incomplete':overallDraftComplete?'Draft complete · saved':'No optional overall feedback added';
 return <CoachingReviewDraftGuard readOnly={!editing} description="Your latest feedback has not finished saving. Save and continue before leaving this review, or keep editing." onSaveBeforeLeave={editing?async()=>{if(imageBlocked)throw new Error('Finish the selected image before leaving.');await scope?.flush();}:undefined}>
  <Stack spacing={2} sx={{width:{xs:'100%',md:'calc((100% - 24px) / 2)'},mx:'auto',minWidth:0}}>
   <Stack direction="row" sx={{gap:1,justifyContent:'space-between',flexWrap:'wrap'}}><Button component={NextLink} href={returnHref} prefetch={false} variant="outlined">{returnHref.startsWith('/coaching/plans/')?'Back to plan':returnHref.startsWith('/coaching/students')?'Back to student':returnHref.startsWith('/coaching/calendar')?'Back to calendar':'Back to work'}</Button>{editing&&view!=='preview'&&previewAvailable?<Button disabled={moving||deliveryPending} variant="outlined" onClick={()=>void move('preview',feedback[0]?.roundTripId)}>Preview review</Button>:null}{editing&&(tradeView==='review'||view!=='trades')?<Button variant="outlined" disabled={moving||deliveryPending} onClick={()=>{void (async()=>{if(await move('trades'))await navigation.current?.selection();})().catch(error=>setMoveError(error instanceof Error?error.message:'Trade Selection is unavailable.'));}}>Trade Selection</Button>:null}</Stack>
   <DashboardPanel hideHeader><Stack spacing={1}><Stack direction="row" sx={{gap:1.5,alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap'}}><Stack direction="row" spacing={1.5} sx={{alignItems:'center',minWidth:0}}><Avatar src={studentAvatarUrl??undefined} alt={`${studentName??'Student'} profile photo`} sx={{width:40,height:40,flexShrink:0}}>{(studentName??'Student').trim().split(/\s+/).map(part=>part[0]).slice(0,2).join('')}</Avatar><Typography component="h2" variant="h2" sx={{overflowWrap:'anywhere'}}>{studentName??'Student'}</Typography></Stack><IndependentImprovementHistory reviewId={review.reviewId} isCoach={isCoach} sidecard/></Stack>{planName?<Typography>{planName}</Typography>:null}</Stack></DashboardPanel>
   <DashboardPanel title="Trade Review" titleAdornment={<Stack direction="row" sx={{ml:1.5,gap:1,alignItems:'center',whiteSpace:'nowrap'}}><Chip size="small" variant="outlined" label={editing?'Draft · not delivered':'Delivered'}/></Stack>}><Stack spacing={1}>
    {reviewLimits?.map(limit=><Typography variant="body2" key={limit}>{limit}</Typography>)}
    {focus.length?<Typography variant="body2">Focus: {focus.map(key=>COACHING_REVIEW_FOCUS[key]).join(', ')}</Typography>:null}
    <Typography variant="body2">Trading period: {review.periodStart} – {review.periodEnd}</Typography>
    {review.dueAtUtc?<Typography variant="body2">Due {new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'}).format(new Date(review.dueAtUtc))} ET</Typography>:null}
    <Typography variant="body2" role="status">{feedback.filter(row=>row.completed&&independentTradeFeedbackReady(row.feedback,focus,template)).length} of {feedback.length} trade drafts complete</Typography>
    {!editing||complete?<Button variant="text" disabled={moving||deliveryPending} sx={{alignSelf:'flex-start',textAlign:'left',p:0,textDecoration:'underline'}} onClick={()=>void move('preview',null)}>Overall feedback: {overallStatus}</Button>:<Typography variant="body2">Overall feedback: {overallStatus}</Typography>}
   </Stack></DashboardPanel>
   <Box ref={mainCard} style={{scrollMarginTop:96}} role="region" aria-label={mainTitle} tabIndex={-1}><DashboardPanel title={mainTitle} action={editing&&view==='trades'&&tradeView==='review'?<Box ref={setChartTarget}/>:undefined}>
    <Stack spacing={3}>
     {editing&&view==='trades'&&tradeView==='review'?<Box ref={setControlsTarget}/>:null}
     {moveError?<Alert severity="error">{moveError}</Alert>:null}
     {loadError?<Alert severity="error" action={<Button onClick={()=>{setLoading(true);setLoadError('');setRevision(value=>value+1);}}>Retry</Button>}>{loadError}</Alert>:null}
     {loading?<Typography role="status">Loading shared trades…</Typography>:null}
     {editingPreview&&editing&&view!=='preview'?<Box><Button disabled={moving||deliveryPending} variant="outlined" onClick={()=>void backToPreview()}>Back to preview</Button></Box>:null}
     {editing?<Box hidden={view!=='trades'} id={`${id}-trades`} tabIndex={-1}>
      <IndependentReviewTrades reviewKind={review.kind} reviewId={review.reviewId} trades={trades} feedback={feedback} focus={focus} template={template} selected={feedback.map(row=>row.roundTripId)} onSelected={()=>{}} onSaved={update=>{const next=typeof update==='function'?update(latestFeedback.current):update;latestFeedback.current=next;setFeedback(next);}} isCoach editing selecting={false} selectionMode={selectionMode} loading={loading} blocked={imageBlocked||loading||Boolean(loadError)||deliveryPending} onDetails={tradeId=>{setChart(null);setDetails(tradeId);}} onChart={symbol=>{setDetails(null);setChart(symbol);}} onBlocked={setImageBlocked} onDirtyChange={()=>{}} focusedWorkspace autoSave controlsTarget={controlsTarget} chartTarget={chartTarget} overallDraftComplete={overallDraftComplete} periodStart={review.periodStart} periodEnd={review.periodEnd} onWorkspaceViewChange={setTradeView} onFocusWorkspace={focusMainCard} onSelectionChanged={()=>{setLoading(true);setRevision(value=>value+1);}} editorNavigationRef={navigation} onOverall={()=>void move('overall')} tradeCard={tradeId=><ReviewJournalTradeCard reviewId={review.reviewId} tradeId={tradeId}/>}/>
     </Box>:null}
     {editing?<Box hidden={view!=='overall'}>
      {studentGoals?<Box component="details" sx={{mb:2}}><Box component="summary" sx={{cursor:'pointer',py:1}}>Student goals at submission</Box><Typography sx={{whiteSpace:'pre-wrap'}}>{studentGoals}</Typography></Box>:null}
      <IndependentCoachingForm autoSave reviewStatusAtStart guard={false} intent="save_review" label="Save overall draft" refreshOnSave={false} disabled={imageBlocked||loading||Boolean(loadError)||!fingerprint||deliveryPending} hidden={{reviewId:review.reviewId,draft:JSON.stringify(draft),expectedFingerprint:fingerprint}} onFeedbackSaved={(ack,submitted)=>{if(ack.kind!=='review')throw new Error(INDEPENDENT_FEEDBACK_ACK_ERROR);setFingerprint(ack.fingerprint);setOverallSaved(parseIndependentReviewDraft(independentFeedbackValue(submitted.draft)));setAcknowledged(true);}}>
       <TextField label="Overall review" multiline minRows={5} value={draft.overall??''} onChange={event=>setDraft(value=>({...value,overall:event.target.value}))}/>
       {focus.includes('goals')?<TextField label={COACHING_REVIEW_FOCUS.goals} multiline minRows={3} value={draft.focusFeedback?.goals??''} onChange={event=>setDraft(value=>({...value,focusFeedback:{...value.focusFeedback,goals:event.target.value}}))}/>:null}
       <TextField label="Next steps" multiline minRows={3} value={draft.nextSteps??''} onChange={event=>setDraft(value=>({...value,nextSteps:event.target.value}))}/>
       <TextField label="Private coach notes" helperText="Only this private note is hidden from the student. Your delivered review feedback is shared." multiline minRows={3} value={draft.privateNotes??''} onChange={event=>setDraft(value=>({...value,privateNotes:event.target.value}))}/>
      </IndependentCoachingForm>
      <Stack direction="row" sx={{mt:2,gap:1,flexWrap:'wrap'}}><Button disabled={moving||deliveryPending} onClick={()=>void move('trades')}>Back to trade reviews</Button><Button variant="contained" disabled={moving||deliveryPending} onClick={()=>void move('preview',feedback[0]?.roundTripId)}>Preview review</Button></Stack>
     </Box>:null}
     <Box hidden={view!=='preview'}>
      {editing?<Box sx={{mb:2}}><Button variant="outlined" disabled={moving||deliveryPending} onClick={()=>void move(complete?'overall':'trades')}>Back to review</Button></Box>:null}
      <Stack spacing={3}>
       <Stack direction="row" sx={{gap:1,alignItems:'center',flexWrap:'wrap'}}><Button variant="outlined" disabled={moving||deliveryPending||previewIndex<=0&&previewStep!==null||!feedback.length} onClick={()=>void move('preview',previewStep===null?feedback.at(-1)!.roundTripId:feedback[previewIndex-1].roundTripId)}>Prev</Button><Typography role="status">{previewStep===null?'Overall review':`Trade ${previewIndex+1} of ${feedback.length}`}</Typography>{previewStep!==null?<Button variant="outlined" disabled={moving||deliveryPending||previewIndex+1>=feedback.length&&editing&&!complete} onClick={()=>void move('preview',previewIndex+1<feedback.length?feedback[previewIndex+1].roundTripId:null)}>{previewIndex+1<feedback.length?'Next':'Overall review'}</Button>:null}</Stack>
       {previewRow?<Box><Stack direction="row" sx={{justifyContent:'space-between',alignItems:'center',gap:1,mb:2}}><Typography component="h4" variant="h3">{trades.find(trade=>matchesIndependentCoachingTrade(trade,previewRow.roundTripId))?.symbol??'Reviewed trade'}</Typography>{editing?<Button id={`${id}-edit-${encodeURIComponent(previewRow.roundTripId)}`} disabled={moving||deliveryPending} onClick={event=>void editFromPreview(previewRow.roundTripId,event)}>Edit</Button>:null}</Stack>{template&&previewRow.feedback.evaluation?<TradeEvaluationFields focused readOnly template={template} value={parseTradeEvaluation(previewRow.feedback.evaluation)}/>:<Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{String(previewRow.feedback.overall??'Not recorded')}</Typography>}{Object.entries(previewRow.feedback.focusFeedback as Record<string,string>??{}).filter(([,value])=>value).map(([key,value])=><Box key={key}><Typography variant="subtitle2">{COACHING_REVIEW_FOCUS[key as CoachingReviewFocus]??key}</Typography><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{value}</Typography></Box>)}<IndependentReviewImages key={previewRow.roundTripId} reviewId={review.reviewId} roundTripId={previewRow.roundTripId} editable={false}/></Box>:previewStep===null?<>
        <Box><Stack direction="row" sx={{justifyContent:'space-between',alignItems:'center',gap:1}}><Typography component="h4" variant="h3">Overall review</Typography>{editing?<Button id={`${id}-edit-overall`} disabled={moving||deliveryPending} onClick={event=>void editFromPreview('overall',event)}>Edit</Button>:null}</Stack><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{publicReview.overall||'No optional overall feedback added'}</Typography>{Object.entries(publicReview.focusFeedback??{}).filter(([,value])=>value).map(([key,value])=><Box key={key}><Typography variant="subtitle2">{COACHING_REVIEW_FOCUS[key as CoachingReviewFocus]??key}</Typography><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{value}</Typography></Box>)}</Box>
        <IndependentReviewImages reviewId={review.reviewId} editable={false}/>
        <Box><Typography component="h4" variant="h3">Next steps</Typography><Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{publicReview.nextSteps||'No optional next steps added'}</Typography></Box>
        {editing?<Box>{!complete||goalsMissing?<Alert severity="info" sx={{mb:2}}>Complete the agreed trade feedback and focus areas before sending.</Alert>:null}<IndependentCoachingForm guard={false} intent="deliver_review" label="Send to student" disabled={sendBlocked} hidden={{reviewId:review.reviewId}} onPendingChange={setDeliveryPending}/></Box>:null}
       </>:<Alert severity="warning">This preview trade is no longer selected. Open Preview review again to choose current work.</Alert>}
       {previewStep!==null&&!complete?<Typography variant="body2" color="text.secondary">Complete the selected trade feedback before opening the overall review.</Typography>:null}
      </Stack>
     </Box>
    </Stack>
   </DashboardPanel></Box>
   <Box component="details"><Box component="summary" sx={{cursor:'pointer',py:1}}>Review resources</Box><Stack spacing={2} sx={{mt:1}}><IndependentReviewResources reviewId={review.reviewId} canReadRules={focus.includes('rules')} openTrade={tradeId=>{setChart(null);setDetails(tradeId);}}/>{!editing&&review.draft.privateNotes?<Box><Typography variant="subtitle2">Private coach notes — only you</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{review.draft.privateNotes}</Typography></Box>:null}</Stack></Box>
   {!editing?<IndependentReviewFollowUp reviewId={review.reviewId} isCoach/>:null}
  </Stack>
  <TradeDetailsDrawer open={details!==null} onClose={()=>setDetails(null)} roundTripId={details} analyzer={null} detailsUrl={details?resource('details',details):undefined} initialTab={analysisLink?.kind==='trade'?'analyzer':'details'} initialAnalyzerInterval={analysisLink?.kind==='trade'?analysisLink.interval:'1m'} selectedAnalyzerEventId={analysisLink?.kind==='trade'?analysisLink.eventId:null} loadSavedAnalysis={details?loadSelectedAnalysis:undefined}/>
  <Drawer anchor="right" open={chart!==null} onClose={()=>setChart(null)} slotProps={{paper:{sx:{width:'100vw'}}}}><Box sx={{p:2}}><Stack direction="row" sx={{alignItems:'center',justifyContent:'space-between'}}><Typography component="h2" variant="h2">Stock chart · {chart}</Typography><Button onClick={()=>setChart(null)}>Close</Button></Stack>{chart?<TradingViewChart symbol={chart} sx={{height:'calc(100dvh - 120px)',minHeight:400,mt:2}}/>:null}</Box></Drawer>
 </CoachingReviewDraftGuard>;
}

export async function loadReviewTradeAnalysis(reviewId:string,tradeId:string){const response=await fetch(`/api/coaching/review-resource?${new URLSearchParams({reviewId,resource:'analyzer',roundTripId:tradeId})}`,{cache:'no-store'});if(!response.ok)throw new Error('Saved analysis is unavailable.');return response.json();}
export function ReviewJournalTradeCard({reviewId,tradeId}:{reviewId:string;tradeId:string}){const load=useCallback(()=>loadReviewTradeAnalysis(reviewId,tradeId),[reviewId,tradeId]);return <TradeDetailsDrawer presentation="embedded" coachingReadOnly open onClose={()=>{}} roundTripId={tradeId} analyzer={null} detailsUrl={`/api/coaching/review-resource?${new URLSearchParams({reviewId,resource:'details',roundTripId:tradeId})}`} loadSavedAnalysis={load}/>;}
