"use client";
import {useState} from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {CommunityPublicationForm} from "./community-publication-form";
import {changeCommunityLifecycleWithFeedback} from "./community-lifecycle-actions";
export function CommunityLifecycleControls({slug,removed=false,recoverable=false,disabled=false}:{slug:string;removed?:boolean;recoverable?:boolean;disabled?:boolean}){
 const [confirm,setConfirm]=useState(false);
 return <Stack spacing={2}>{!removed||recoverable?<CommunityPublicationForm action={changeCommunityLifecycleWithFeedback} disabled={disabled}><input name="communitySlug" type="hidden" value={slug}/><input name="operation" type="hidden" value={removed?"recover":"reconnect"}/><Typography color="text.secondary">{removed?"Recover settings into a paused community. This does not resend old deliveries.":"After installing the Discord bot again, reconnect to verify ownership and restore the existing connection. Old deliveries will not be resent."}</Typography><Button type="submit" variant="outlined">{removed?"Recover community":"Reconnect Discord"}</Button></CommunityPublicationForm>:null}{!removed?<><Button color="error" disabled={disabled} onClick={()=>setConfirm(true)}>Remove community</Button>{confirm?<CommunityPublicationForm action={changeCommunityLifecycleWithFeedback} disabled={disabled}><input name="communitySlug" type="hidden" value={slug}/><input name="operation" type="hidden" value="remove"/><Typography>Remove this community from active use? Publishing stops. Settings have a 30-day recovery window. Personal Journals remain untouched and original participants retain read-only coaching history.</Typography><FormControlLabel label="I understand and want to remove this community" control={<Checkbox required name="confirmRemoval"/>}/><Button type="submit" color="error" variant="contained">Confirm removal</Button><Button onClick={()=>setConfirm(false)}>Cancel</Button></CommunityPublicationForm>:null}</>:null}</Stack>;
}
