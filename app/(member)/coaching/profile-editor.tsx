"use client";
import {useEffect,useRef,useState} from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {PLATFORM_MUTATION_REQUEST_HEADER} from '@/src/modules/platform/contracts/platform-request-security';
import type {IndependentCoachProfile} from '@/src/modules/communities/contracts/independent-coaching';
import {IndependentCoachingForm} from './coaching-form';
import {CoachingReviewDraftGuard} from '@/app/(dashboard)/communities/coaching-review-draft-guard';

export function IndependentCoachProfileEditor({profile,contextId,photoAvailable,photoVersion,photoStorageReady}:{profile?:IndependentCoachProfile;contextId:string|null;photoAvailable:boolean;photoVersion:string|null;photoStorageReady:boolean}){
 return <Grid container spacing={3}><Grid size={{xs:12,md:4}}><CoachProfilePhotoPicker key={contextId??'uncreated'} displayName={profile?.displayName??'Coach'} contextId={contextId} photoAvailable={photoAvailable} photoVersion={photoVersion} photoStorageReady={photoStorageReady}/></Grid><Grid size={{xs:12,md:8}}><IndependentCoachingForm intent="save_profile" label="Save profile"><Grid container spacing={2}><Grid size={{xs:12,md:6}}><TextField name="displayName" label="Coach name" defaultValue={profile?.displayName??''} required fullWidth/></Grid><Grid size={{xs:12,md:6}}><TextField name="headline" label="Headline" defaultValue={profile?.headline??''} fullWidth/></Grid></Grid><TextField name="biography" label="About" defaultValue={profile?.biography??''} multiline minRows={5}/><TextField name="deliverySummary" label="How coaching works" defaultValue={profile?.deliverySummary??''} multiline minRows={3}/><Typography variant="h3">Social links</Typography><TextField name="stocktwitsUrl" label="Stocktwits URL" type="url" defaultValue={profile?.socialLinks?.stocktwits??''}/><TextField name="xUrl" label="X URL" type="url" defaultValue={profile?.socialLinks?.x??''}/><TextField name="youtubeUrl" label="YouTube URL" type="url" defaultValue={profile?.socialLinks?.youtube??''}/></IndependentCoachingForm></Grid></Grid>;
}

/** A photo saves independently from the profile text form. One operation is allowed at a time. */
function CoachProfilePhotoPicker({displayName,contextId,photoAvailable,photoVersion,photoStorageReady}:{displayName:string;contextId:string|null;photoAvailable:boolean;photoVersion:string|null;photoStorageReady:boolean}){
 const [file,setFile]=useState<File|null>(null),[saved,setSaved]=useState(photoAvailable),[version,setVersion]=useState(photoVersion),[pending,setPending]=useState<'upload'|'remove'|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[failed,setFailed]=useState<'upload'|'remove'|null>(null);
 const alive=useRef(false),generation=useRef(0),inFlight=useRef<Promise<void>|null>(null);
 useEffect(()=>{alive.current=true;generation.current++;return()=>{alive.current=false;generation.current++;};},[]);
 const savedUrl=contextId&&saved?`/api/coaching/profile-photo?contextId=${encodeURIComponent(contextId)}&v=${encodeURIComponent(version??'saved')}`:undefined;
 const initials=displayName.trim().split(/\s+/).map(part=>part[0]).join('').slice(0,2).toUpperCase()||'C';
 const mutate=(kind:'upload'|'remove',selected?:File):Promise<void>=>{
  if(inFlight.current)return inFlight.current;
  if(!contextId||!photoStorageReady||kind==='upload'&&!selected)return Promise.reject(new Error('Save your coach profile before choosing a photo.'));
  const token=generation.current;
  setPending(kind);setError('');setNotice('');setFailed(null);
  const current=()=>alive.current&&generation.current===token;
  const operation=(async()=>{
   try{
    const form=kind==='upload'?new FormData():undefined;if(form&&selected)form.set('photo',selected);
    const response=await fetch('/api/coaching/profile-photo',{method:kind==='upload'?'POST':'DELETE',headers:{[PLATFORM_MUTATION_REQUEST_HEADER]:'1'},body:form,credentials:'same-origin'});
    let result:Record<string,unknown>;
    try{const raw:unknown=await response.json();if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error();result=raw as Record<string,unknown>;}catch{throw new Error('The photo confirmation could not be verified. Retry to check your change.');}
    if(!response.ok)throw new Error(typeof result.error==='string'?result.error:'The photo could not be saved.');
    if(kind==='upload'){
     const stamp=result.updatedAtUtc;
     if(result.available!==true||typeof stamp!=='string'||!Number.isFinite(Date.parse(stamp))||new Date(stamp).toISOString()!==stamp)throw new Error('The upload confirmation could not be verified. Retry your photo.');
     if(!current())return;setSaved(true);setVersion(stamp);setFile(null);setNotice('Photo saved.');
    }else{
     if(result.removed!==true)throw new Error('The removal confirmation could not be verified. Retry removing the photo.');
     if(!current())return;setSaved(false);setVersion(null);setFile(null);setNotice('Photo removed.');
    }
   }catch(cause){
    if(current()){setFailed(kind);setError(cause instanceof Error?cause.message:'The photo could not be saved. Your current photo is unchanged.');}
    throw cause;
   }finally{if(current())setPending(null);}
  })();
  const tracked=operation.finally(()=>{if(inFlight.current===tracked)inFlight.current=null;});inFlight.current=tracked;return tracked;
 };
 const retry=()=>mutate(failed==='remove'?'remove':'upload',file??undefined);
 const remove=()=>{if(inFlight.current||!window.confirm('Remove your profile photo?'))return;void mutate('remove').catch(()=>{});};
 return <CoachingReviewDraftGuard title="Photo upload not confirmed" description="Retry your photo change before leaving, or discard the selected file." onSaveBeforeLeave={async()=>{if(inFlight.current){await inFlight.current;return;}if(file||failed)await retry();}}><Box data-coaching-controlled-draft data-coaching-unsaved={file||pending?'true':'false'} data-coaching-pending={pending?'true':'false'}><Stack spacing={2} sx={{alignItems:{xs:'flex-start',md:'center'}}}>
  <Avatar src={savedUrl} alt={`${displayName} profile photo`} sx={{width:144,height:144,fontSize:40}}>{initials}</Avatar>
  <Button component="label" variant="outlined" disabled={!photoStorageReady||!contextId||Boolean(pending)}>{pending==='upload'?'Uploading…':saved?'Change photo':'Choose photo'}<input hidden type="file" disabled={!photoStorageReady||!contextId||Boolean(pending)} accept="image/png,image/jpeg,image/webp" onChange={event=>{
   const selected=event.target.files?.[0]??null;event.currentTarget.value='';if(!selected||inFlight.current)return;
   if(selected.size<1||selected.size>8388608){setError('Select an image of 8 MB or smaller.');setNotice('');return;}
   if(!['image/png','image/jpeg','image/webp'].includes(selected.type)){setError('Use a PNG, JPEG or WebP image.');setNotice('');return;}
   setFile(selected);void mutate('upload',selected).catch(()=>{});
  }}/></Button>
  <Typography variant="body2" color="text.secondary">PNG, JPEG or WebP, up to 8 MB. Choosing a photo saves it automatically.</Typography>
  {pending?<Typography role="status" aria-live="polite">{pending==='upload'?'Uploading your photo…':'Removing your photo…'}</Typography>:null}
  {error?<Alert severity="error" role="status">{error}</Alert>:notice?<Alert severity="success" role="status">{notice}</Alert>:null}
  {!pending&&failed?<Stack spacing={1}>{file?<Typography variant="body2">Selected for retry: {file.name}</Typography>:null}<Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><Button variant="outlined" onClick={()=>void retry().catch(()=>{})}>Retry</Button>{file?<Button onClick={()=>{setFile(null);setFailed(null);setError('');}}>Discard selected file</Button>:null}</Stack></Stack>:null}
  {saved&&!file?<Button color="error" disabled={Boolean(pending)} onClick={remove}>{pending==='remove'?'Removing…':'Remove photo'}</Button>:null}
  {!contextId?<Typography variant="body2" color="text.secondary">Save your coach profile once before choosing a photo.</Typography>:!photoStorageReady?<Alert severity="info">Photo uploads will be available after profile photo storage is enabled.</Alert>:null}
 </Stack></Box></CoachingReviewDraftGuard>;
}
