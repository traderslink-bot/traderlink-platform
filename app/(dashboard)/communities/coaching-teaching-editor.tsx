"use client";
import {Box,Button,Grid,MenuItem,TextField} from "@mui/material";
import type {TraderLinkCommunityTeachingItem} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {saveCoachingTeachingDetailsAction} from "./community-actions";

export function CoachingTeachingEditor({item,communitySlug,disabled}:{item:TraderLinkCommunityTeachingItem;communitySlug:string;disabled:boolean}){
 return <Box component="details" sx={{mt:2}}><Box component="summary" sx={{cursor:"pointer",fontWeight:700}}>Edit lesson</Box><Box component="form" action={disabled?undefined:saveCoachingTeachingDetailsAction} sx={{mt:2}}>
  <input type="hidden" name="communitySlug" value={communitySlug}/><input type="hidden" name="teachingId" value={item.teachingId}/>
  <Grid container spacing={1.5}>
   <Grid size={12}><TextField label="Title" name="title" fullWidth required defaultValue={item.title}/></Grid>
   <Grid size={12}><TextField label="Content" name="body" fullWidth multiline minRows={3} defaultValue={item.body}/></Grid>
   <Grid size={{xs:12,sm:6}}><TextField label="Delivery" name="deliveryKind" fullWidth select defaultValue={item.deliveryKind??"live"}><MenuItem value="live">Live</MenuItem><MenuItem value="recorded">Recorded</MenuItem><MenuItem value="resource">Resource</MenuItem></TextField></Grid>
   <Grid size={{xs:12,sm:6}}><TextField label="Status" name="status" fullWidth select defaultValue={item.status}>{Object.entries({draft:"Draft",published:"Published",completed:"Completed",cancelled:"Cancelled"}).map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField></Grid>
   <Grid size={12}><TextField label="Meeting or resource link" name="deliveryUrl" fullWidth type="url" defaultValue={item.deliveryUrl}/></Grid>
   <Grid size={12}><TextField label="Recording link" name="recordingUrl" fullWidth type="url" defaultValue={item.recordingUrl??""}/></Grid>
   {([{name:"scheduledAt",label:"Scheduled time (UTC)",value:item.scheduledAtUtc},{name:"availableAt",label:"Available from (UTC)",value:item.availableAtUtc},{name:"dueAt",label:"Due (UTC)",value:item.dueAtUtc}] as const).map(field=><Grid key={field.name} size={{xs:12,sm:6}}><TextField label={field.label} name={field.name} fullWidth type="datetime-local" defaultValue={field.value?.slice(0,16)??""} slotProps={{inputLabel:{shrink:true}}}/></Grid>)}
   <Grid size={12}><Button disabled={disabled} type="submit" variant="outlined">Save lesson</Button></Grid>
  </Grid>
 </Box></Box>;
}
