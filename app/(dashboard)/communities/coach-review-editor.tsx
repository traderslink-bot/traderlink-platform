"use client";
import {CommunityTradeEvaluationFeedback} from './community-trade-evaluation-feedback';
import {performancePrimitive,type PerformanceTemplate} from '@/src/modules/communities/contracts/coaching-performance-evaluation';
import {useEffect,useRef,useState,useSyncExternalStore} from "react";
import {coachingReviewLabel} from "@/src/modules/communities/contracts/coaching-review-workspace";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type {TraderLinkCommunityTradeReview} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {CommunityTypography as Typography} from "./community-typography";
import {updateCommunityTradeReviewAction} from "./community-actions";

const noStorageSubscription=()=>()=>{};
function savedRecovery(key:string):string|null{try{return sessionStorage.getItem(key);}catch{return null;}}
function recoveredPerformance(raw:string|null,baseline:string):string|null{
 try{const recovery=raw?JSON.parse(raw):null;if(recovery?.baseline!==baseline||!Array.isArray(recovery.values))return null;const field=recovery.values.find((entry:unknown)=>Array.isArray(entry)&&entry[0]==='coachFeedback'&&typeof entry[1]==='string');return field?.[1]??null;}catch{return null;}
}
const statusLabel=(value:string)=>value==="in_review"?"In progress":value==="requested"?"Not started":value.replaceAll("_"," ").replace(/^./,letter=>letter.toUpperCase());

export function CoachReviewEditor({performanceTemplate,communitySlug,relationshipId,review,previousFocus,isReview,paused=false}:{performanceTemplate?:PerformanceTemplate;communitySlug:string;relationshipId:string;review:TraderLinkCommunityTradeReview;previousFocus:string|null;isReview:boolean;paused?:boolean}){
 const disabled=isReview||paused||review.acceptanceState==="pending"||review.deliveryState!=="draft";
 const editableNames=["previousFocusStatus","previousFocusAssessment","coachFeedback","wentWell","needsWork","nextFocus","coachPrivateNotes"];
 const serverBaseline=JSON.stringify(editableNames.map(name=>[name,String((review as unknown as Record<string,unknown>)[name]??(name==="previousFocusStatus"?"not_evaluated":""))]));
 const saved=useRef(serverBaseline);
 const formRef=useRef<HTMLFormElement|null>(null);
 const recoveryKey=`coaching-review-draft:${communitySlug}:${relationshipId}:${review.reviewId}`;
 const [dirty,setDirty]=useState(false);
 const recoveryRaw=useSyncExternalStore(noStorageSubscription,()=>savedRecovery(recoveryKey),()=>null);
 const [editedPerformanceFeedback,setPerformanceFeedback]=useState<string|null>(null);
 const performanceFeedback=editedPerformanceFeedback??recoveredPerformance(recoveryRaw,serverBaseline)??review.coachFeedback;
 const performanceDraft=useRef(review.coachFeedback);
 const contents=(data:FormData)=>JSON.stringify(editableNames.map(name=>[name,String(data.get(name)??(name==="previousFocusStatus"?"not_evaluated":""))]));
 useEffect(()=>{
  if(disabled)return;
  const form=formRef.current;if(!form)return;
  try{
   const raw=sessionStorage.getItem(recoveryKey);
   if(raw){
    const recovery=JSON.parse(raw) as {baseline?:string;values?:[string,string][]};
    if(recovery.baseline===saved.current&&Array.isArray(recovery.values)){
     for(const [name,value] of recovery.values){
      if(!editableNames.includes(name)||typeof value!=="string")continue;
      const field=form.elements.namedItem(name);
      if(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement||field instanceof HTMLSelectElement)field.value=value;
      if(performanceTemplate&&name==="coachFeedback"){performanceDraft.current=value;}
     }
     setDirty(contents(new FormData(form))!==saved.current);
    }else sessionStorage.removeItem(recoveryKey);
   }
  }catch{/* Browser storage may be unavailable. */}
  const discard=()=>{try{sessionStorage.removeItem(recoveryKey);}catch{/* No browser storage. */}};
  document.addEventListener("coaching:review-discard",discard);
  return()=>document.removeEventListener("coaching:review-discard",discard);
 },[disabled,recoveryKey,performanceTemplate]);
 const track=(form:HTMLFormElement,feedback?:string)=>{
  const data=new FormData(form);if(performanceTemplate)data.set("coachFeedback",feedback??performanceDraft.current);const changed=contents(data)!==saved.current;
  setDirty(changed);
  try{
   if(changed)sessionStorage.setItem(recoveryKey,JSON.stringify({baseline:saved.current,values:editableNames.map(name=>[name,String(data.get(name)??"")])}));
   else sessionStorage.removeItem(recoveryKey);
  }catch{/* Browser storage may be unavailable; the existing navigation warning still applies. */}
 };
 const overall=true;
 const nextSteps=true;
 return <Box ref={formRef} action={disabled?undefined:async(data:FormData)=>{await updateCommunityTradeReviewAction(data);saved.current=contents(data);try{sessionStorage.removeItem(recoveryKey);}catch{/* No browser storage. */}setDirty(false);}} component="form" data-coaching-controlled-draft data-coaching-unsaved={dirty?"true":"false"} onInput={event=>{if(!disabled&&event.currentTarget instanceof HTMLFormElement)track(event.currentTarget);}} onChange={event=>{if(!disabled&&event.currentTarget instanceof HTMLFormElement)track(event.currentTarget);}}>
  <input name="communitySlug" type="hidden" value={communitySlug}/>
  <input name="relationshipId" type="hidden" value={relationshipId}/>
  <input name="stayInReview" type="hidden" value="yes"/>
  <input name="reviewId" type="hidden" value={review.reviewId}/>
  <Stack spacing={2}>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{alignItems:{sm:"center"},justifyContent:"space-between"}}>
    <Box><Typography sx={{ fontWeight: 800 }}>{review.title}</Typography><Typography color="text.secondary" variant="caption">{coachingReviewLabel(review.workspaceKind,review.reviewType)}{review.periodStart?` · ${review.periodStart} – ${review.periodEnd}`:""}</Typography></Box>
    <Chip color={review.deliveryState==="draft"?"warning":review.deliveryState==="cancelled"?"default":"success"} label={review.deliveryState==="draft"?(review.acceptanceState==="pending"?"Pending acceptance":statusLabel(review.status)):review.deliveryState==="follow_up"?"Follow-up required":statusLabel(review.deliveryState)}/>
   </Stack>
   {review.studentContext?<Typography variant="body2">{review.studentContext}</Typography>:null}
   {previousFocus?<Box sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}><Typography sx={{ fontWeight: 800 }}>Previous focus</Typography><Typography sx={{mt:.5}} variant="body2">{previousFocus}</Typography><Grid container spacing={1} sx={{mt:.5}}><Grid size={{xs:12,md:4}}><TextField disabled={disabled} defaultValue={review.previousFocusStatus??"not_evaluated"} fullWidth label="Progress" name="previousFocusStatus" select slotProps={{select:{native:true}}}><option value="not_evaluated">Not evaluated</option><option value="improving">Improving</option><option value="still_struggling">Still struggling</option><option value="achieved">Achieved</option><option value="replaced">Replaced</option></TextField></Grid><Grid size={{xs:12,md:8}}><TextField disabled={disabled} defaultValue={review.previousFocusAssessment} fullWidth label="Progress notes" name="previousFocusAssessment"/></Grid></Grid></Box>:null}
   {performanceTemplate?<><input type="hidden" name="coachFeedback" value={performanceFeedback}/><CommunityTradeEvaluationFeedback subject="performance" template={performancePrimitive(performanceTemplate)} value={performanceFeedback} readOnly={disabled} onChange={value=>{performanceDraft.current=value;setPerformanceFeedback(value);if(formRef.current)track(formRef.current,value);}}/></>:<TextField disabled={disabled} defaultValue={review.coachFeedback} fullWidth label={review.workspaceKind==="strategy"?"Strategy assessment":"Review summary"} minRows={5} multiline name="coachFeedback"/>}
   {performanceTemplate?<><input type="hidden" name="wentWell" value={review.wentWell}/><input type="hidden" name="needsWork" value={review.needsWork}/><input type="hidden" name="nextFocus" value={review.nextFocus}/></>:null}
   <Grid container spacing={1.5}>
    {!performanceTemplate&&(overall||review.wentWell)?<Grid size={{xs:12,md:6}}><TextField disabled={disabled} defaultValue={review.wentWell} fullWidth label="What went well" minRows={3} multiline name="wentWell"/></Grid>:null}
    {!performanceTemplate&&(overall||review.needsWork)?<Grid size={{xs:12,md:6}}><TextField disabled={disabled} defaultValue={review.needsWork} fullWidth label="What needs work" minRows={3} multiline name="needsWork"/></Grid>:null}
    {!performanceTemplate&&(nextSteps||review.nextFocus)?<Grid size={{xs:12,md:6}}><TextField disabled={disabled} defaultValue={review.nextFocus} fullWidth label="Next focus" minRows={3} multiline name="nextFocus"/></Grid>:null}
    <Grid size={{xs:12,md:6}}><TextField disabled={disabled} defaultValue={review.coachPrivateNotes} fullWidth label="Private coach notes" minRows={3} multiline name="coachPrivateNotes"/></Grid>
   </Grid>
   <Stack direction={{xs:"column",sm:"row"}} spacing={1} sx={{justifyContent:"flex-end"}}><Button disabled={disabled} name="status" type="submit" value="in_review" variant="contained">Save draft</Button></Stack>
  </Stack>
 </Box>;
}
