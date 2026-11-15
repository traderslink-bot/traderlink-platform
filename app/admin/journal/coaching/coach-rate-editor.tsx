"use client";
import {useCoachingFormReady} from '@/app/coaching-form-readiness';
import {JOURNAL_ADMIN_REQUEST_HEADER} from '@/src/modules/platform/contracts/journal-admin-request';
import {useState} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {CoachingReviewDraftGuard} from '@/app/(dashboard)/communities/coaching-review-draft-guard';
export function CoachRateEditor({coachUserId,revision,basisPoints,defaultBasisPoints}:{coachUserId:string;revision:number;basisPoints:number|null;defaultBasisPoints:number}){
 const hydrated=useCoachingFormReady();
 const [useDefault,setDefault]=useState(basisPoints===null),[rate,setRate]=useState(String((basisPoints??defaultBasisPoints)/100)),[current,setRevision]=useState(revision),[dirty,setDirty]=useState(false),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 return <CoachingReviewDraftGuard title="Unsaved coach commission" description="Save the negotiated rate or discard your changes."><Box component="form" method="post" data-coaching-controlled-draft data-coaching-unsaved={dirty?'true':'false'} data-coaching-pending={pending?'true':'false'} onChange={()=>setDirty(true)} onSubmit={async event=>{event.preventDefault();if(!hydrated||pending)return;setPending(true);setMessage('');try{
  const percent=Number(rate),value=Math.round(percent*100);if(!useDefault&&(!Number.isFinite(percent)||Math.abs(percent*100-value)>0.000001||value<0||value>10000))throw Error('Enter a rate from 0 to 100 with at most two decimal places.');
  const response=await fetch('/api/admin/journal/coaching-policy',{method:'POST',headers:{'content-type':'application/json',[JOURNAL_ADMIN_REQUEST_HEADER]:'1'},body:JSON.stringify({action:'coach_rate',coachUserId,expectedRevision:current,basisPoints:useDefault?null:value})});if(!response.ok)throw Error('The rate could not be saved. Reload and try again.');setRevision(value=>value+1);setDirty(false);setMessage('Saved. New signup terms and agreements use this rate; existing accepted terms are preserved.');
 }catch(error){setMessage(error instanceof Error?error.message:'The rate could not be saved.');}finally{setPending(false);}}}><Stack spacing={2}><FormControlLabel label="Use the platform default commission" control={<Checkbox disabled={!hydrated||pending} checked={useDefault} onChange={event=>setDefault(event.target.checked)}/>}/>{!useDefault?<TextField disabled={!hydrated||pending} label="Negotiated commission (%)" type="number" value={rate} onChange={event=>setRate(event.target.value)} sx={{maxWidth:260}} slotProps={{htmlInput:{min:0,max:100,step:'0.01'}}}/>:null}<Typography variant="body2">One rate applies to this coach wherever commission applies. Approved free community work stays exempt. No Discord server is required. Saving here does not change Whop account fees or reprice existing subscriptions.</Typography>{message?<Alert severity={message.startsWith('Saved.')?'success':'error'}>{message}</Alert>:null}<Box><Button variant="contained" type="submit" disabled={!hydrated||pending}>{pending?'Saving…':'Save coach rate'}</Button></Box></Stack></Box></CoachingReviewDraftGuard>;
}
