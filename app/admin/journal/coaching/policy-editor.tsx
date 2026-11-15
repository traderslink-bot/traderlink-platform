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
import type {CoachingCommercialPolicy} from '@/src/modules/communities/contracts/coaching-commercial-policy';
import {CoachingReviewDraftGuard} from '@/app/(dashboard)/communities/coaching-review-draft-guard';

export function CoachingCommercialPolicyEditor({initial,revision,communityId}:{initial:CoachingCommercialPolicy;revision:number;communityId?:string}){
 const hydrated=useCoachingFormReady();
 const [commission,setCommission]=useState(initial.commissionEnabled),[subscription,setSubscription]=useState(initial.coachSubscriptionRequired),[rate,setRate]=useState(String(initial.commissionBasisPoints/100)),[currentRevision,setRevision]=useState(revision),[dirty,setDirty]=useState(false),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 return <CoachingReviewDraftGuard title="Unsaved commercial policy" description="Save your policy changes before leaving, or discard them."><Box component="form" method="post" data-coaching-controlled-draft data-coaching-unsaved={dirty?'true':'false'} data-coaching-pending={pending?'true':'false'} onChange={()=>setDirty(true)} onSubmit={async event=>{
  event.preventDefault();if(!hydrated||pending)return;setPending(true);setMessage('');
  try{
   const numeric=Number(rate),basisPoints=Math.round(numeric*100);if(!Number.isFinite(numeric)||Math.abs(numeric*100-basisPoints)>0.000001||basisPoints<0||basisPoints>10000)throw new Error('Choose a commission from 0 to 100 with at most two decimals.');
   const response=await fetch('/api/admin/journal/coaching-policy',{method:'POST',headers:{'content-type':'application/json',[JOURNAL_ADMIN_REQUEST_HEADER]:'1'},body:JSON.stringify({scope:initial.scope,communityId,expectedRevision:currentRevision,commissionEnabled:commission,commissionBasisPoints:basisPoints,coachSubscriptionRequired:subscription})});
   const result=await response.json();if(!response.ok)throw new Error(result.error??'Policy could not be saved. Reload and try again.');
   setRevision(old=>old+1);setDirty(false);setMessage('Saved. Coach signup uses this policy; accepted agreements keep their original terms.');
  }catch(error){setMessage(error instanceof Error?error.message:'Policy could not be saved.');}finally{setPending(false);}
 }}><Stack spacing={2}><Box component="fieldset" disabled={!hydrated||pending} sx={{border:0,m:0,p:0,minWidth:0}}><Stack spacing={2}>
  <Typography>Choose commission, a coach subscription, or both for this scope. Student TraderLink coaching access is a separate Membership setting.</Typography>
  {!commission&&!subscription?<Alert severity="info">Coach tools stay locked without a configured signup method. Free community coaching requires the separate owner-approved community exemption; switching these controls off does not grant that exemption.</Alert>:null}
  {initial.scope==='community'&&commission?<Alert severity="info">Community commission checkout is deferred. This setting does not unlock community coach tools in the initial release. Approved free community work stays outside platform commission checkout; a configured subscription-only community arrangement can use direct service payments.</Alert>:null}
  <FormControlLabel label="Collect commission from coach service revenue through Whop" control={<Checkbox checked={commission} onChange={event=>setCommission(event.target.checked)}/>}/>
  {commission?<TextField label="Commission (%)" type="number" value={rate} onChange={event=>setRate(event.target.value)} sx={{maxWidth:240}} slotProps={{htmlInput:{min:0,max:100,step:'0.01'}}} helperText="Deducted from coach revenue; not added as a student surcharge."/>:null}
  <FormControlLabel label="Require a TraderLink coach subscription" control={<Checkbox checked={subscription} onChange={event=>setSubscription(event.target.checked)}/>}/>
  <Typography variant="body2" color="text.secondary">Coach subscription prices and capacity batches are managed through Membership. Existing accepted agreements retain their original policy.</Typography>
  </Stack></Box>{message?<Alert severity={message.startsWith('Saved.')?'success':'error'}>{message}</Alert>:null}
  <Box><Button type="submit" variant="contained" disabled={!hydrated||pending}>{pending?'Saving…':'Save policy'}</Button></Box>
 </Stack></Box></CoachingReviewDraftGuard>;
}
