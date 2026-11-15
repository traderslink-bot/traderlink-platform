'use client';
import {useState} from 'react';
import {Box,Typography} from '@mui/material';
import type {OfferSettings} from '@/app/(dashboard)/communities/coaching-plan-offers';
import {coachingPeriod,type CoachingAgreementTerms} from '@/src/modules/communities/contracts/coaching-agreements';
import {nextReviewMonday} from '@/src/modules/communities/contracts/coaching-delivery-calendar';
import {submissionDate} from '@/src/modules/communities/contracts/coaching-request-submission-limits';

export function reviewScheduleExample(value:OfferSettings,type:'trade_review'|'trading_day_review',startDate:string){
 const days=Number(value.dueDays);if(!Number.isInteger(days)||days<1||days>366||value.frequency==='custom')return null;
 const item={planItemId:'example',itemType:type,frequency:value.frequency,coveragePeriod:'single_item' as const,quantity:Number(value.quantity)||1,dueOffsetDays:days,selectionMode:value.selection,followUpDays:0,measurementKind:type==='trade_review'?'trades' as const:'trading_days' as const,plannedMinutes:null,timelineEnabled:true,reviewDepth:'standard' as const,ordinal:0};
 const terms:CoachingAgreementTerms={planId:'example',planRevision:1,planName:'',description:'',priceAmountMinor:0,currency:'USD',billingCadence:'weekly',paymentInstructions:'',requiredDiscordRoleId:null,autoArchiveAfterDays:null,startDate,customIntervalDays:null,dueTimeUtc:'18:00',items:[item],builderConfig:{about:'',offers:{[type]:{details:'',resources:[],weeklySchedule:'monday',submissionSchedule:'weekend_choice',deliveryDayCount:value.deliveryDayCount??'calendar'}}}};
 return coachingPeriod(terms,item,0);
}
export function CoachingReviewScheduleSummary({value,type}:{value:OfferSettings;type:'trade_review'|'trading_day_review'}){
 const [exampleStart]=useState(()=>nextReviewMonday(submissionDate(new Date().toISOString())));
 const request=value.tradeReviewFormat==='pack'||!value.timeline,choice=type==='trade_review'&&value.reviewSchedule==='student_choice';
 const example=reviewScheduleExample(value,type,exampleStart),count=value.deliveryDayCount==='weekdays'?'weekdays':'calendar days',days=Number(value.dueDays),unit=type==='trade_review'?'trades':'trading days';
 const date=(day:string)=>new Intl.DateTimeFormat('en-US',{weekday:'long',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(day+'T00:00:00Z'));
 return <Box role="status" aria-live="polite" data-review-schedule-summary sx={{border:1,borderColor:'divider',borderRadius:2,p:2,bgcolor:'background.paper'}}><Typography sx={{fontWeight:700,mb:1}}>Your review schedule</Typography>{request?<Typography>The student sends their {unit} when ready. Your delivery commitment is {Number.isInteger(days)&&days>0?days:'the selected number of'} {count} after submission.</Typography>:example?<>
 <Typography variant="body2" color="text.secondary" sx={{mb:1}}>Example {value.frequency==='every_two_weeks'?'for a two-week selection window':value.frequency==='monthly'?'for a monthly selection window':'schedule'}. Actual dates will be shown in the agreement.{choice?' This applies if the student chooses scheduled reviews.':''}</Typography>
 <Typography>Trading dates to select from: {date(example.start)} – {date(example.end)}.</Typography>
 <Typography>{value.selection==='coach'?'Choose the trades':'Your student submits their '+unit} by the end of {date(example.submissionDate??example.end)} (Eastern Time).</Typography>
 <Typography>You may start reviewing as soon as {value.selection==='coach'?'the selected trades are ready':'the student sends their '+unit}.</Typography>
 <Typography>Your delivery commitment is {days} {count} after {date(example.submissionDate??example.end)}.</Typography>
 <Typography sx={{fontWeight:700,mt:1}}>Complete the review by {date(example.dueAtUtc.slice(0,10))}.</Typography>
 <Typography variant="body2" color="text.secondary" sx={{mt:1}}>Early submission does not bring the deadline forward or extend it.{choice?' If the student chooses reviews on request, delivery days count from submission instead.':''}</Typography>
 </>:<Typography>Set your delivery days to see the calculated schedule. Custom review dates are confirmed in the agreement.</Typography>}</Box>;
}
