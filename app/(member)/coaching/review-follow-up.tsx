"use client";
import {useEffect,useState} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import {easternLocalValue,easternTimeCandidates,restoredEasternTime} from './student-sidecard-model';
import Typography from '@mui/material/Typography';
import {DashboardPanel} from '@/app/dashboard-template';
import type {IndependentCoachingReviewFollowUp} from '@/src/modules/communities/server/independent-coaching-review-follow-up';
import {IndependentCoachingForm} from './coaching-form';
type State=ReturnType<IndependentCoachingReviewFollowUp['read']>;
export function IndependentReviewFollowUp({reviewId,isCoach}:{reviewId:string;isCoach:boolean}){
 const [revision,setRevision]=useState(0),[state,setState]=useState<State|null>(null),[error,setError]=useState('');
 useEffect(()=>{const saved=(event:Event)=>{if(['mark_review_read','reply_review','schedule_review_follow_up','complete_review_follow_up'].includes((event as CustomEvent<{intent:string}>).detail?.intent))setRevision(value=>value+1);};window.addEventListener('coaching-saved',saved);return()=>window.removeEventListener('coaching-saved',saved);},[]);
 useEffect(()=>{const controller=new AbortController();fetch(`/api/coaching/review-follow-up?reviewId=${encodeURIComponent(reviewId)}`,{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(value=>{setState(value);setError('');}).catch(()=>{if(!controller.signal.aborted)setError('Follow-up could not be loaded.');});return()=>controller.abort();},[reviewId,revision]);
 if(error)return <Alert severity="warning" action={<Button onClick={()=>setRevision(value=>value+1)}>Retry</Button>}>{error}</Alert>;
 if(!state)return <Typography role="status">Loading follow-up…</Typography>;
 return <Box id="follow-up"><DashboardPanel title="Follow-up"><Stack spacing={2}>
  {!isCoach&&!state.viewedAtUtc?<IndependentCoachingForm intent="mark_review_read" label="I've read this review" hidden={{reviewId}}/>:null}
  {state.windowEndsAtUtc?<Typography variant="body2">Student follow-up window ends {new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'}).format(new Date(state.windowEndsAtUtc))} ET.</Typography>:null}
  {state.problem?<Typography color="text.secondary">{state.problem}</Typography>:null}
  {state.replies.map(reply=><Box key={reply.replyId}><Typography variant="subtitle2">{reply.author}</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{reply.body}</Typography></Box>)}
  {state.canReply?<IndependentCoachingForm intent="reply_review" label="Send follow-up message" hidden={{reviewId}}><TextField name="body" label="Follow-up message" required multiline minRows={5}/></IndependentCoachingForm>:null}
  {isCoach&&state.included&&state.viewedAtUtc&&!state.completedAtUtc?<Stack spacing={2}><FollowUpSchedule key={state.dueAtUtc??'unset'} reviewId={reviewId} originalUtc={state.dueAtUtc}/><IndependentCoachingForm intent="complete_review_follow_up" label="Complete follow-up" hidden={{reviewId}}/></Stack>:null}
 </Stack></DashboardPanel></Box>;
}

function FollowUpSchedule({reviewId,originalUtc}:{reviewId:string;originalUtc:string|null}){
 const originalLocal=easternLocalValue(originalUtc),[local,setLocal]=useState(originalLocal),[chosen,setChosen]=useState(originalUtc??'');
 const candidates=easternTimeCandidates(local);let utc:string|null=null,error='';
 try{utc=restoredEasternTime(local,chosen,originalUtc);}catch(cause){error=cause instanceof Error?cause.message:'Check the Eastern deadline.';}
 return <IndependentCoachingForm intent="schedule_review_follow_up" label="Set follow-up deadline" hidden={{reviewId,dueAtUtc:utc??''}} disabled={!utc||Boolean(error)} unsavedChanges={local!==originalLocal||chosen!==(originalUtc??'')}>
  <TextField label="Follow-up due (Eastern)" type="datetime-local" required value={local} onChange={event=>{setLocal(event.target.value);setChosen(event.target.value===originalLocal?originalUtc??'':'');}} sx={{maxWidth:320}} slotProps={{inputLabel:{shrink:true}}} error={Boolean(error)} helperText={error||'Eastern Time (New York)'}/>
  {candidates.length>1?<TextField select label="Which Eastern time?" value={candidates.find(candidate=>Date.parse(candidate.atUtc)===Math.floor(Date.parse(chosen)/60000)*60000)?.atUtc??''} onChange={event=>setChosen(event.target.value)} sx={{maxWidth:320}}><MenuItem value="">Choose EDT or EST</MenuItem>{candidates.map(candidate=><MenuItem key={candidate.atUtc} value={candidate.atUtc}>{candidate.label}</MenuItem>)}</TextField>:null}
 </IndependentCoachingForm>;
}
