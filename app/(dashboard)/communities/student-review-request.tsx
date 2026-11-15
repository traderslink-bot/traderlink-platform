"use client";
import {submissionAllowanceLabel} from '@/src/modules/communities/contracts/coaching-request-submission-limits';
import {StudentReviewTradeChoices} from "./student-review-trade-choices";
import type {CoachingAgreementTerms} from "@/src/modules/communities/contracts/coaching-agreements";
import {useState,useTransition} from "react";
import {Alert,Box,Button,Checkbox,FormControlLabel,MenuItem,Stack,TextField} from "@mui/material";
import type {CoachStudentJournalTrade} from "@/src/modules/communities/server/traderlink-community-coach-journal-read-service";
import type {TraderLinkCommunityCoachingPlanItem} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {COACHING_REVIEW_TYPES,reviewKindForPlanItem} from "@/src/modules/communities/contracts/coaching-review-workspace";
import {requestCommunityReviewWithFeedbackAction,loadStudentReviewTradesAction,loadStudentReviewDaysAction} from "./community-actions";
import {CommunityTypography as Typography} from "./community-typography";
import {coachingSubmittedReviewDeadlineSentence} from "@/src/modules/communities/contracts/coaching-review-deadline-copy";
export function StudentReviewRequest({communitySlug,relationshipId,disabled,items=[],builderConfig}:{communitySlug:string;relationshipId:string;disabled:boolean;items?:readonly TraderLinkCommunityCoachingPlanItem[];builderConfig?:CoachingAgreementTerms["builderConfig"]}){
 const services=items.filter(item=>!item.timelineEnabled&&reviewKindForPlanItem(item.itemType)&&reviewKindForPlanItem(item.itemType)!=='custom');
 const [serviceId,setServiceId]=useState(''),[days,setDays]=useState<string[]>([]),[pending,startTransition]=useTransition(),[trades,setTrades]=useState<readonly CoachStudentJournalTrade[]>([]),[selected,setSelected]=useState<string[]>([]),[error,setError]=useState('');
 const [dayChoices,setDayChoices]=useState<readonly {date:string;tradeCount:number}[]>([]),[periodStart,setPeriodStart]=useState(''),[periodEnd,setPeriodEnd]=useState('');
 const clearChoices=()=>{setDays([]);setSelected([]);setTrades([]);setDayChoices([]);};
 const service=services.find(item=>item.planItemId===serviceId),kind=service?reviewKindForPlanItem(service.itemType):null;
 const datedTrade=kind==='trade'&&service?.coveragePeriod!=='single_item';
 const cap=service?builderConfig?.offers[service.itemType]?.tradeCap:null;
 const studentChooses=service?.selectionMode==='student'||service?.selectionMode==='coach_or_student';
 const load=()=>startTransition(async()=>{
  const form=new FormData();form.set('communitySlug',communitySlug);form.set('relationshipId',relationshipId);form.set('planItemId',serviceId);if(datedTrade){form.set('periodStart',periodStart);form.set('periodEnd',periodEnd);}
  try{
   if(kind==='trading_day'){
    form.set('periodStart',periodStart);form.set('periodEnd',periodEnd);
    const choices=await loadStudentReviewDaysAction(form);setTrades(choices.trades);setDayChoices(choices.days);
    setDays(current=>current.filter(date=>choices.days.some(day=>day.date===date)));
    setSelected(current=>current.filter(id=>choices.trades.some(trade=>trade.roundTripId===id)));
   }else setTrades(await loadStudentReviewTradesAction(form));
   setError('');
  }catch{setError('Shared data is unavailable. Check the review dates, Journal sharing and coaching access.');}
 });
 if(!services.length)return <Typography variant="body2">Submit work through the reviews already scheduled in your plan.</Typography>;
 return <Box component="form" onSubmit={event=>{
  event.preventDefault();if(disabled||pending)return;
  const data=new FormData(event.currentTarget);setError('');
  startTransition(async()=>{const result=await requestCommunityReviewWithFeedbackAction(data);if(result.message)setError(result.message);});
 }} sx={{mt:2}}><input name="communitySlug" type="hidden" value={communitySlug}/><input name="relationshipId" type="hidden" value={relationshipId}/><input name="workspaceKind" type="hidden" value={kind??''}/><input name="reviewType" type="hidden" value={kind==='trading_day'?'session':kind==='trade'?'multiple_trades':'custom'}/><input name="returnTo" type="hidden" value="student"/><Stack spacing={1}>
 <TextField disabled={disabled||pending} name="planItemId" label="Accepted plan service" select required value={serviceId} onChange={event=>{setServiceId(event.target.value);clearChoices();}}><MenuItem value="">Choose service</MenuItem>{services.map(item=><MenuItem key={item.planItemId} value={item.planItemId}>{COACHING_REVIEW_TYPES[reviewKindForPlanItem(item.itemType)!]} · {item.quantity} {item.measurementKind.replaceAll('_',' ')}</MenuItem>)}</TextField>
 {service?<Typography variant="body2"><strong>Review deadline:</strong> {coachingSubmittedReviewDeadlineSentence(service.dueOffsetDays,builderConfig?.offers[service.itemType]?.deliveryDayCount)} Use the existing review if this service is already scheduled.</Typography>:null}
 {service&&builderConfig?.offers[service.itemType]?.submissionLimits?<Typography variant="body2">Trade allowance: {submissionAllowanceLabel(builderConfig.offers[service.itemType]!.submissionLimits!.perPeriod,service.frequency)}.{builderConfig.offers[service.itemType]!.submissionLimits!.perDay===undefined?' No daily submission cap.':` Maximum ${builderConfig.offers[service.itemType]!.submissionLimits!.perDay} trades submitted per day.`} Each submitted batch has its own review deadline.</Typography>:null}
 <TextField label="Review title" name="title" required/><TextField label="What you want reviewed" multiline minRows={2} name="context"/>
 {datedTrade?<><TextField label="Review from" name="periodStart" type="date" required disabled={disabled||pending} value={periodStart} onChange={event=>{setPeriodStart(event.target.value);clearChoices();}} slotProps={{inputLabel:{shrink:true}}}/><TextField label="Review through" name="periodEnd" type="date" required disabled={disabled||pending} value={periodEnd} onChange={event=>{setPeriodEnd(event.target.value);clearChoices();}} slotProps={{inputLabel:{shrink:true}}}/></>:null}
 {kind==='performance'||kind==='strategy'?<><TextField label="Review from" name="periodStart" type="date" required slotProps={{inputLabel:{shrink:true}}}/><TextField label="Review through" name="periodEnd" type="date" required slotProps={{inputLabel:{shrink:true}}}/></>:null}
 {kind==='trading_day'&&studentChooses?<><TextField label="Review from" name="periodStart" type="date" required disabled={disabled||pending} value={periodStart} onChange={event=>{setPeriodStart(event.target.value);clearChoices();}} slotProps={{inputLabel:{shrink:true}}}/><TextField label="Review through" name="periodEnd" type="date" required disabled={disabled||pending} value={periodEnd} onChange={event=>{setPeriodEnd(event.target.value);clearChoices();}} slotProps={{inputLabel:{shrink:true}}}/></>:null}
 {studentChooses&&['trade','trading_day'].includes(kind??'')?<><Button disabled={disabled||pending||((kind==='trading_day'||datedTrade)&&(!periodStart||!periodEnd||periodStart>periodEnd))} onClick={load} variant="outlined">{kind==='trading_day'?'Choose trading days and trades':'Choose trades'}</Button>{kind==='trading_day'?<><Stack sx={{maxHeight:240,overflowY:'auto'}}>{dayChoices.map(({date,tradeCount})=><FormControlLabel key={date} label={`${date} · ${tradeCount} trades · ${trades.filter(trade=>trade.tradingDate===date).length} available for individual review`} control={<Checkbox checked={days.includes(date)} disabled={disabled||pending||(!days.includes(date)&&days.length>=(service?.quantity??1))} name="requestedDay" value={date} onChange={(_,on)=>{setDays(current=>on?[...current,date]:current.filter(day=>day!==date));if(!on)setSelected(current=>current.filter(id=>trades.find(trade=>trade.roundTripId===id)?.tradingDate!==date));}}/>}/>)}</Stack>{!cap?<Typography>Request the days first. The coach must propose a trade limit for you to accept before selecting individual trades.</Typography>:<StudentReviewTradeChoices trades={trades.filter(trade=>trade.tradingDate&&days.includes(trade.tradingDate))} selected={selected} onSelected={setSelected} cap={cap} disabled={disabled||pending}/>}</>:<StudentReviewTradeChoices trades={trades} selected={selected} onSelected={setSelected} quantity={service?.quantity} disabled={disabled||pending}/>}</>:kind==='trading_day'?<><TextField label="Review from" name="periodStart" type="date" required slotProps={{inputLabel:{shrink:true}}}/><TextField label="Review through" name="periodEnd" type="date" required slotProps={{inputLabel:{shrink:true}}}/></>:null}

 {error?<Alert severity="warning" role="alert">{error}</Alert>:null}
 <Button disabled={disabled||pending||!service||(kind==='trading_day'&&studentChooses&&!days.length)} type="submit" variant="contained">Request review</Button>
 </Stack></Box>;
}
