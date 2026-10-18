"use client";
import {CoachingSelectedDayPeriod} from "./coaching-selected-day-period";
import {useState,useTransition} from "react";
import {Alert,Box,Button,Checkbox,FormControlLabel,Stack,Typography} from "@mui/material";
import type {TraderLinkCommunityTradeReview} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {addCommunityStudentReviewDaysAction,loadStudentReviewDaysAction} from "./community-actions";
export function StudentReviewExistingDays({communitySlug,review,disabled}:{communitySlug:string;review:TraderLinkCommunityTradeReview;disabled:boolean}){
 const [choices,setChoices]=useState<readonly {date:string;tradeCount:number}[]>([]),[days,setDays]=useState<string[]>([]),[pending,startTransition]=useTransition(),[problem,setProblem]=useState('');
 if(review.deliveryState!=='draft'||review.workspaceKind!=='trading_day'||!['student','coach_or_student'].includes(review.selectionMode??''))return null;
 if(!review.periodStart||!review.periodEnd)return <CoachingSelectedDayPeriod communitySlug={communitySlug} review={review} disabled={disabled}/>;
 const existing=review.requestedDays??[],additions=days.filter(date=>!existing.includes(date));
 const form=()=>{const data=new FormData();for(const [key,value] of Object.entries({communitySlug,relationshipId:review.relationshipId,reviewId:review.reviewId}))data.set(key,value);return data;};
 const load=()=>startTransition(async()=>{try{const result=await loadStudentReviewDaysAction(form());setChoices(result.days);setDays([]);setProblem('');}catch{setProblem('Shared days are unavailable. Check the review period and Journal sharing.');}});
 const save=()=>startTransition(async()=>{const data=form();for(const date of additions)data.append('requestedDay',date);try{await addCommunityStudentReviewDaysAction(data);setChoices([]);setDays([]);setProblem('');}catch{setProblem('Could not add these days. Check sharing and the agreed day count.');}});
 return <Stack spacing={1}>{problem?<Alert severity="warning">{problem}</Alert>:null}<Typography>{existing.length} of {review.agreedTradingDays??'—'} agreed days selected. Fewer choices do not establish a shortage of shared days.</Typography><Button disabled={disabled||pending||additions.length>0} onClick={load}>Choose days for this review</Button>{choices.length?<Box component="form" onSubmit={event=>{event.preventDefault();save();}} data-coaching-unsaved={additions.length?'true':'false'}><Stack sx={{maxHeight:320,overflowY:'auto'}}>{choices.map(choice=>{const checked=existing.includes(choice.date)||additions.includes(choice.date);return <FormControlLabel key={choice.date} label={`${choice.date} · ${choice.tradeCount} trades${existing.includes(choice.date)?' · already added':''}`} control={<Checkbox checked={checked} disabled={disabled||pending||existing.includes(choice.date)||(!checked&&existing.length+additions.length>=(review.agreedTradingDays??0))} onChange={(_,on)=>setDays(current=>on?[...current,choice.date]:current.filter(date=>date!==choice.date))}/>}/>;})}</Stack><Button disabled={disabled||pending||!additions.length} type="submit" variant="contained">Add selected days</Button></Box>:null}</Stack>;
}
