"use client";
import {Box,Button,Grid,MenuItem,TextField} from "@mui/material";
import type {TraderLinkCommunityCoachingSession} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {saveCoachingSessionAction} from "./community-actions";

export function CoachingSessionEditor({session,communitySlug,disabled=false}:{session:TraderLinkCommunityCoachingSession;communitySlug:string;disabled?:boolean}){
 return <Box component="details" sx={{mt:1}}><Box component="summary" sx={{fontWeight:700,cursor:"pointer"}}>Session details</Box><Box component="form" action={disabled?undefined:saveCoachingSessionAction} sx={{mt:2}}>
  <input type="hidden" name="communitySlug" value={communitySlug}/><input type="hidden" name="relationshipId" value={session.relationshipId}/><input type="hidden" name="sessionId" value={session.sessionId}/>
  <Grid container spacing={1.5}>
   <Grid size={12}><TextField fullWidth label="Title" name="title" defaultValue={session.title} required/></Grid>
   <Grid size={{xs:12,sm:8}}><TextField fullWidth label="Scheduled time (UTC)" type="datetime-local" name="scheduledAt" defaultValue={session.scheduledAtUtc?.slice(0,16)??""} slotProps={{inputLabel:{shrink:true}}}/></Grid>
   <Grid size={{xs:12,sm:4}}><TextField fullWidth label="Minutes" name="durationMinutes" type="number" defaultValue={session.durationMinutes??""} slotProps={{htmlInput:{min:1,max:1440}}}/></Grid>
   <Grid size={12}><TextField fullWidth label="Meeting link" type="url" name="meetingUrl" defaultValue={session.meetingUrl??""}/></Grid>
   <Grid size={12}><TextField fullWidth label="Agenda" name="agenda" multiline minRows={2} defaultValue={session.agenda}/></Grid>
   <Grid size={12}><TextField fullWidth label="Shared notes" name="notes" multiline minRows={3} defaultValue={session.notes}/></Grid>
   <Grid size={12}><TextField fullWidth label="Private coach notes" name="privateNotes" multiline minRows={3} defaultValue={session.coachPrivateNotes??""}/></Grid>
   <Grid size={{xs:12,sm:6}}><TextField fullWidth select label="Attendance" name="attendance" defaultValue={session.attendance??"not_recorded"}>{Object.entries({not_recorded:"Not recorded",attended:"Attended",missed:"Missed",excused:"Excused"}).map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField></Grid>
   <Grid size={{xs:12,sm:6}}><TextField fullWidth select label="Status" name="status" defaultValue={session.status}>{Object.entries({scheduled:"Scheduled",completed:"Completed",cancelled:"Cancelled"}).map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField></Grid>
   <Grid size={12}><Button type="submit" variant="outlined" disabled={disabled}>Save session</Button></Grid>
  </Grid>
 </Box></Box>;
}
