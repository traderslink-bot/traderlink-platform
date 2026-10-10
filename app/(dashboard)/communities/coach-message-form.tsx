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
 return <Box action={disabled?undefined:action} component="form" sx={{mt:2}}>
  <input name="communitySlug" type="hidden" value={communitySlug}/>
  <input name="relationshipId" type="hidden" value={relationshipId}/>
  {paused||state.message?<Alert severity="warning" sx={{mb:1}}>{paused?"Coaching access is paused.":state.message}</Alert>:null}
  <Stack direction={{xs:"column",sm:"row"}} spacing={1}>
   <TextField fullWidth label="Message" name="body" required/>
   <Button disabled={disabled||paused||pending} type="submit" variant="contained">Send</Button>
  </Stack>
 </Box>;
}
