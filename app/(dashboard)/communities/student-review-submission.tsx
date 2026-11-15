"use client";
import {CoachingStudentTradeReplacement} from '@/app/coaching-student-trade-replacement';
import {useState,useTransition} from 'react';
import {Alert,Button,Stack,Typography} from '@mui/material';
import {coachingSubmittedReviewDeadlineSentence} from '@/src/modules/communities/contracts/coaching-review-deadline-copy';
import type {TraderLinkCommunityTradeReview} from '@/src/modules/communities/contracts/traderlink-community-platform-contracts';
import {submitCommunityReviewAction} from './community-actions';
export function StudentReviewSubmission({communitySlug,review,disabled}:{communitySlug:string;review:TraderLinkCommunityTradeReview;disabled:boolean}){
 const [result,setResult]=useState<{message:string;ok:boolean}|null>(null),[pending,start]=useTransition();
 if(review.deliveryState!=='draft'||!review.timing)return null;
 if(review.timing.submittedAtUtc)return <Stack><Typography variant="body2">Submitted: {new Date(review.timing.submittedAtUtc).toLocaleString('en',{timeZone:'UTC'})} UTC · Due: {review.dueAtUtc?new Date(review.dueAtUtc).toLocaleString('en',{timeZone:'UTC'})+' UTC':'Deadline missing'}</Typography>{['trade','trading_day'].includes(review.workspaceKind??'')&&['student','coach_or_student'].includes(review.selectionMode??'')?<CoachingStudentTradeReplacement communitySlug={communitySlug} relationshipId={review.relationshipId} reviewId={review.reviewId} disabled={disabled}/>:null}</Stack>;
 if(!review.timing.awaitingSubmission)return null;
 const future=Boolean(review.timing.availableAtUtc&&new Date().toISOString()<review.timing.availableAtUtc);
 return <Stack spacing={1} data-coaching-pending={pending?'true':undefined}>{result?<Alert severity={result.ok?'success':'warning'} role="status">{result.message}</Alert>:null}<Typography variant="body2">Choose and save the work below, then submit it to your coach. <strong>Review deadline:</strong> {review.timing.scheduled?(review.dueAtUtc?new Date(review.dueAtUtc).toLocaleString('en',{timeZone:'America/New_York'})+' ET. Submission does not change this deadline.':'Scheduled deadline missing.'):coachingSubmittedReviewDeadlineSentence(review.timing.turnaroundDays??0,review.timing.deliveryDayCount)}</Typography>{future?<Typography variant="body2">Submission opens {review.timing.availableAtUtc?new Date(review.timing.availableAtUtc).toLocaleString('en',{timeZone:'UTC'}):''} UTC, after the full trading period.</Typography>:null}<Button sx={{alignSelf:'flex-start'}} variant="contained" disabled={disabled||pending||future} onClick={()=>start(async()=>{const data=new FormData();data.set('communitySlug',communitySlug);data.set('relationshipId',review.relationshipId);data.set('reviewId',review.reviewId);try{setResult(await submitCommunityReviewAction(data));}catch{setResult({ok:false,message:'Could not confirm submission. Check the review before trying again.'});}})}>Submit review work</Button></Stack>;
}
