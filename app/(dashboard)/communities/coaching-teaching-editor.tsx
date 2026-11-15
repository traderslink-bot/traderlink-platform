"use client";
import {useEffect,useState} from "react";
import {Box,Button,Grid,MenuItem,TextField} from "@mui/material";
import type {TraderLinkCommunityTeachingItem} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {saveCoachingTeachingWithFeedbackAction} from "./community-actions";
import {CommunityCoachingFeedbackForm as CommunityPublicationForm} from "./community-coaching-feedback-form";

export function CoachingTeachingEditor({item,communitySlug,disabled}:{item:TraderLinkCommunityTeachingItem;communitySlug:string;disabled:boolean}){
 const initial={title:item.title,body:item.body,deliveryKind:item.deliveryKind??"live",status:item.status,deliveryUrl:item.deliveryUrl,recordingUrl:item.recordingUrl??"",scheduledAt:item.scheduledAtUtc?.slice(0,16)??"",availableAt:item.availableAtUtc?.slice(0,16)??"",dueAt:item.dueAtUtc?.slice(0,16)??""};
 const [values,setValues]=useState(initial),[saved,setSaved]=useState(initial);
 const dirty=JSON.stringify(values)!==JSON.stringify(saved);
 const change=(name:keyof typeof initial,value:string)=>setValues(current=>({...current,[name]:value}));
 useEffect(()=>{const discard=()=>setValues(saved);document.addEventListener("coaching:review-discard",discard);return()=>document.removeEventListener("coaching:review-discard",discard);},[saved]);
 return <Box data-coaching-controlled-draft data-coaching-unsaved={dirty?"true":"false"} component="details" sx={{mt:2}}><Box component="summary" sx={{cursor:"pointer",fontWeight:700}}>Edit lesson</Box><Box sx={{mt:2}}><CommunityPublicationForm action={saveCoachingTeachingWithFeedbackAction} disabled={disabled} onSaved={()=>setSaved(values)}>{locked => <>
  <input type="hidden" name="communitySlug" value={communitySlug}/><input type="hidden" name="teachingId" value={item.teachingId}/>
  <Grid container spacing={1.5}>
   <Grid size={12}><TextField disabled={locked} label="Title" name="title" fullWidth required value={values.title} onChange={event=>change("title",event.target.value)}/></Grid>
   <Grid size={12}><TextField disabled={locked} label="Content" name="body" fullWidth multiline minRows={3} value={values.body} onChange={event=>change("body",event.target.value)}/></Grid>
   <Grid size={{xs:12,sm:6}}><TextField disabled={locked} label="Delivery" name="deliveryKind" fullWidth select value={values.deliveryKind} onChange={event=>change("deliveryKind",event.target.value)}><MenuItem value="live">Live</MenuItem><MenuItem value="recorded">Recorded</MenuItem><MenuItem value="resource">Resource</MenuItem></TextField></Grid>
   <Grid size={{xs:12,sm:6}}><TextField disabled={locked} label="Status" name="status" fullWidth select value={values.status} onChange={event=>change("status",event.target.value)}>{Object.entries({draft:"Draft",published:"Published",completed:"Completed",cancelled:"Cancelled"}).map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField></Grid>
   <Grid size={12}><TextField disabled={locked} label="Meeting or resource link" name="deliveryUrl" fullWidth type="url" value={values.deliveryUrl} onChange={event=>change("deliveryUrl",event.target.value)}/></Grid>
   <Grid size={12}><TextField disabled={locked} label="Recording link" name="recordingUrl" fullWidth type="url" value={values.recordingUrl} onChange={event=>change("recordingUrl",event.target.value)}/></Grid>
   {([{name:"scheduledAt",label:"Scheduled time (UTC)",value:item.scheduledAtUtc},{name:"availableAt",label:"Available from (UTC)",value:item.availableAtUtc},{name:"dueAt",label:"Due (UTC)",value:item.dueAtUtc}] as const).map(field=><Grid key={field.name} size={{xs:12,sm:6}}><TextField disabled={locked} label={field.label} name={field.name} fullWidth type="datetime-local" value={values[field.name]} onChange={event=>change(field.name,event.target.value)} slotProps={{inputLabel:{shrink:true}}}/></Grid>)}
   <Grid size={12}><Button disabled={locked} type="submit" variant="outlined">Save lesson</Button></Grid>
  </Grid>
 </>}</CommunityPublicationForm></Box></Box>;
}
