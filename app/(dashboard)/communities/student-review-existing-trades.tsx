"use client";
import {useState,useTransition} from "react";
import {Alert,Box,Button,Stack} from "@mui/material";
import type {TraderLinkCommunityTradeReview} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import type {CoachStudentJournalTrade} from "@/src/modules/communities/server/traderlink-community-coach-journal-read-service";
import {loadStudentReviewTradesAction,selectCommunityReviewTradesAction} from "./community-actions";
import {StudentReviewTradeChoices} from "./student-review-trade-choices";
export function StudentReviewExistingTrades({communitySlug,review,disabled}:{communitySlug:string;review:TraderLinkCommunityTradeReview;disabled:boolean}){
 const [trades,setTrades]=useState<readonly CoachStudentJournalTrade[]>([]),[selected,setSelected]=useState<string[]>([]),[pending,startTransition]=useTransition(),[problem,setProblem]=useState('');
 if(review.deliveryState!=='draft'||!['student','coach_or_student'].includes(review.selectionMode??'')||!['trade','trading_day','strategy'].includes(review.workspaceKind??''))return null;
 const existing=review.selectedTradeIds??[],additions=selected.filter(id=>!existing.includes(id));
 const selection=[...new Set([...existing,...additions])];
 const unavailableExisting=trades.length>0&&existing.some(id=>!trades.some(trade=>trade.roundTripId===id));
 const form=()=>{const data=new FormData();for(const [key,value] of Object.entries({communitySlug,relationshipId:review.relationshipId,reviewId:review.reviewId}))data.set(key,value);return data;};
 const load=()=>startTransition(async()=>{try{setTrades(await loadStudentReviewTradesAction(form()));setSelected([]);setProblem('');}catch{setProblem('Shared trades are unavailable. Check sharing and review access.');}});
 const add=()=>startTransition(async()=>{const data=form();for(const id of additions)data.append('roundTripId',id);try{await selectCommunityReviewTradesAction(data);setTrades([]);setSelected([]);setProblem('');}catch{setProblem('Could not add these trades. Check the requested days, agreed limit and existing reviews.');}});
 const missingCap=review.workspaceKind==='trading_day'&&(!review.resolvedTradeCap||!review.periodStart||!review.periodEnd);
 return <Stack spacing={1}>{problem?<Alert severity="warning">{problem}</Alert>:null}{unavailableExisting?<Alert severity="warning">An existing selection is unavailable. Restore sharing or ask the coach to remove it before adding trades.</Alert>:null}<Button disabled={disabled||pending||missingCap||additions.length>0} onClick={load}>Choose trades for this review</Button>{trades.length?<Box component="form" onSubmit={event=>{event.preventDefault();if(!unavailableExisting)add();}} data-coaching-unsaved={additions.length?'true':'false'}><StudentReviewTradeChoices trades={trades} selected={selection} onSelected={ids=>setSelected(ids.filter(id=>!existing.includes(id)))} existing={existing} cap={review.resolvedTradeCap} dayLimit={review.agreedTradingDays??undefined} quantity={review.agreedTradeCount??undefined} disabled={disabled||pending||unavailableExisting}/><Button disabled={disabled||pending||unavailableExisting||!additions.length} type="submit" variant="contained">Add selected trades</Button></Box>:null}</Stack>;
}
