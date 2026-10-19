"use client";
import {useState} from "react";
import {Box,Button,Stack,TextField,Typography} from "@mui/material";
import type {TraderLinkCommunityTradeReview} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {setCommunitySelectedDayPeriodAction} from "./community-actions";
export function CoachingSelectedDayPeriod({communitySlug,review,disabled=false}:{communitySlug:string;review:TraderLinkCommunityTradeReview;disabled?:boolean}){
 const [start,setStart]=useState(''),[end,setEnd]=useState('');
 if(review.workspaceKind!=="trading_day"||review.periodStart||review.periodEnd||review.deliveryState!=="draft")return null;
 return <Box component="form" action={setCommunitySelectedDayPeriodAction} data-coaching-controlled-draft data-coaching-unsaved={start||end?'true':'false'}><input type="hidden" name="communitySlug" value={communitySlug}/><input type="hidden" name="relationshipId" value={review.relationshipId}/><input type="hidden" name="reviewId" value={review.reviewId}/><Stack spacing={1}><Typography>Choose the date range containing the trading days for this review. This is separate from the due date. The range is fixed once saved.</Typography><TextField name="periodStart" label="Review from" type="date" required disabled={disabled} value={start} onChange={event=>setStart(event.target.value)} slotProps={{inputLabel:{shrink:true}}}/><TextField name="periodEnd" label="Review through" type="date" required disabled={disabled} value={end} onChange={event=>setEnd(event.target.value)} slotProps={{inputLabel:{shrink:true}}}/><Button type="submit" variant="contained" disabled={disabled}>Save review date range</Button></Stack></Box>;
}
