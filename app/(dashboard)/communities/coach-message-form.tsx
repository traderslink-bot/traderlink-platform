"use client";

import {useActionState} from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import {sendCoachMessageWithFeedbackAction} from "./community-actions";

export function CoachMessageForm({communitySlug,relationshipId,paused,disabled}:{communitySlug:string;relationshipId:string;paused:boolean;disabled:boolean}) {
 const [state,action,pending]=useActionState(sendCoachMessageWithFeedbackAction,{message:""});
 return <Box action={disabled?undefined:action} component="form" data-coaching-pending={pending?'true':undefined} sx={{mt:2}}>
  <input name="communitySlug" type="hidden" value={communitySlug}/>
  <input name="relationshipId" type="hidden" value={relationshipId}/>
  {paused||state.message?<Alert severity="warning" sx={{mb:1}}>{paused?"Coaching access is paused.":state.message}</Alert>:null}
  <Stack direction="column" spacing={1}>
   <TextField fullWidth label="Message" name="body" required placeholder="Write your message…" multiline minRows={10} maxRows={24} slotProps={{htmlInput:{maxLength:8000}}} disabled={disabled||paused||pending}/>
   <Button disabled={disabled||paused||pending} type="submit" variant="contained" sx={{alignSelf:'flex-start'}}>Send message</Button>
  </Stack>
 </Box>;
}
