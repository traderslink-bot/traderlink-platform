"use client";

import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";

import type { TraderLinkCommunityDashboardSnapshot } from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import { saveCommunityAlertWithFeedback } from "./community-publication-actions";
import {CommunityDestinationPicker} from "./community-destination-picker";
import { CommunityPublicationForm } from "./community-publication-form";

export function CommunityAlertComposer({snapshot,isReview}:{snapshot:TraderLinkCommunityDashboardSnapshot;isReview:boolean}) {
  const [template,setTemplate]=useState<TraderLinkCommunityDashboardSnapshot["alertTemplates"][number]|null>(null);
  const templateId=template?.templateId??"";
  const [retained,setRetained]=useState<Record<string,TraderLinkCommunityDashboardSnapshot["alertTemplates"][number]>>({});
  const availableTemplates=[...snapshot.alertTemplates.filter(item=>item.status==="active"),...Object.values(retained).filter(item=>!snapshot.alertTemplates.some(active=>active.templateId===item.templateId&&active.status==="active"))];
  const [values,setValues]=useState<Record<string,string>>({});
  const [body,setBody]=useState("");const [symbol,setSymbol]=useState("");
  return <CommunityPublicationForm action={saveCommunityAlertWithFeedback} disabled={isReview}>
    <input name="communitySlug" type="hidden" value={snapshot.community.slug}/>
    <input name="templateId" type="hidden" value={templateId}/>
    <Stack spacing={2}>
      <TextField label="Template" onChange={event=>{const next=retained[event.target.value]??snapshot.alertTemplates.find(item=>item.templateId===event.target.value)??null;setTemplate(next);if(next)setRetained(current=>({...current,[next.templateId]:next}));}} select value={templateId}>
        <MenuItem value="">No template</MenuItem>
        {availableTemplates.map(item=><MenuItem key={item.templateId} value={item.templateId}>{item.title}{snapshot.alertTemplates.some(active=>active.templateId===item.templateId&&active.status==="active")?"":" (retained draft)"}</MenuItem>)}
      </TextField>
      {template&&!snapshot.alertTemplates.some(item=>item.templateId===templateId&&item.status==="active")?<input type="hidden" name="retainedTemplate" value="yes"/>:null}
      <TextField fullWidth label="Title" name="title" required/>
      {template?template.fields.map(field=><TextField key={field.key} label={field.label} multiline={field.type==="notes"} minRows={field.type==="notes"?3:undefined} value={values[`${templateId}:${field.key}`]??""} onChange={event=>setValues(current=>({...current,[`${templateId}:${field.key}`]:event.target.value}))} name={`template:${field.key}`} placeholder={field.placeholder} required={field.required} type={field.type==="number"||field.type==="price"?"number":field.type==="date"?"date":field.type==="time"?"time":"text"}/>):<><TextField fullWidth label="Ticker" name="symbol" value={symbol} onChange={event=>setSymbol(event.target.value)}/><TextField fullWidth label="Alert" minRows={4} multiline name="body" value={body} onChange={event=>setBody(event.target.value)} required/></>}
      <TextField defaultValue="tracked_page" label="Publishing" name="publishingMode" select>
        <MenuItem value="tracked_page">Post a tracked-page link to Discord</MenuItem>
        <MenuItem value="discord_post">Full Discord post</MenuItem>
      </TextField>
      <CommunityDestinationPicker publishing={snapshot.publishing} kind="alerts"/><Stack direction="row" spacing={1}><Button disabled={isReview} name="status" value="draft" type="submit" variant="outlined">Save draft</Button><Button disabled={isReview} name="status" value="published" type="submit" variant="contained">Publish alert</Button></Stack>
    </Stack>
  </CommunityPublicationForm>;
}
