"use client";

import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { TraderLinkCommunityDashboardSnapshot } from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {sourceAlertDiscordParts} from "@/src/modules/communities/contracts/community-source-alert-parts";
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
  const [title,setTitle]=useState("");
  const [publishingMode,setPublishingMode]=useState<"tracked_page"|"discord_post">("tracked_page");
  const templateValues=template?.fields.map(field=>({field,value:(values[`${templateId}:${field.key}`]??"").trim()}))??[];
  const alertBody=template?templateValues.map(({field,value})=>value?`${field.label}: ${value}`:"").filter(Boolean).join("\n"):body.trim();
  const alertSymbol=(template?templateValues.filter(({field,value})=>field.type==="ticker"&&value).at(-1)?.value??"":symbol).trim().toUpperCase();
  let discordPartCount:number|null=null;
  if(publishingMode==="discord_post")try{discordPartCount=sourceAlertDiscordParts({title:title.trim(),symbol:alertSymbol,body:alertBody}).length;}catch{discordPartCount=null;}
  const discordLength=title.trim()||alertSymbol||alertBody?`**${alertSymbol?`${alertSymbol} - `:""}${title.trim()}**\n${alertBody}`.length:0;
  return <CommunityPublicationForm action={saveCommunityAlertWithFeedback} disabled={isReview}>
    <input name="communitySlug" type="hidden" value={snapshot.community.slug}/>
    <input name="templateId" type="hidden" value={templateId}/>
    <Stack spacing={2}>
      <TextField label="Template" onChange={event=>{const next=retained[event.target.value]??snapshot.alertTemplates.find(item=>item.templateId===event.target.value)??null;setTemplate(next);if(next)setRetained(current=>({...current,[next.templateId]:next}));}} select value={templateId}>
        <MenuItem value="">No template</MenuItem>
        {availableTemplates.map(item=><MenuItem key={item.templateId} value={item.templateId}>{item.title}{snapshot.alertTemplates.some(active=>active.templateId===item.templateId&&active.status==="active")?"":" (retained draft)"}</MenuItem>)}
      </TextField>
      {template&&!snapshot.alertTemplates.some(item=>item.templateId===templateId&&item.status==="active")?<input type="hidden" name="retainedTemplate" value="yes"/>:null}
      <TextField fullWidth label="Title" name="title" value={title} onChange={event=>setTitle(event.target.value)} required/>
      {template?template.fields.map(field=><TextField key={field.key} label={field.label} multiline={field.type==="notes"} minRows={field.type==="notes"?3:undefined} value={values[`${templateId}:${field.key}`]??""} onChange={event=>setValues(current=>({...current,[`${templateId}:${field.key}`]:event.target.value}))} name={`template:${field.key}`} placeholder={field.placeholder} required={field.required} type={field.type==="number"||field.type==="price"?"number":field.type==="date"?"date":field.type==="time"?"time":"text"}/>):<><TextField fullWidth label="Ticker" name="symbol" value={symbol} onChange={event=>setSymbol(event.target.value)}/><TextField fullWidth label="Alert" minRows={4} multiline name="body" value={body} onChange={event=>setBody(event.target.value)} required/></>}
      <Stack direction={{xs:"column",sm:"row"}} spacing={2}><TextField fullWidth label="Price target" name="priceTarget"/><TextField fullWidth label="Stop loss" name="stopLoss"/></Stack><TextField fullWidth helperText="One level per line." label="Support levels" minRows={2} multiline name="supportLevels"/><TextField fullWidth label="Publisher take" minRows={2} multiline name="publisherTake"/>
      {publishingMode==="discord_post"?<Typography aria-live="polite" color={discordPartCount===null?"error.main":discordPartCount>1?"warning.main":"text.secondary"} variant="body2">{discordPartCount===null?"This alert text cannot be split into Discord posts. Simplify the text before publishing.":`${discordLength.toLocaleString()} ${discordPartCount===1?"/ 2,000 characters · 1 Discord post":`characters · ${discordPartCount} Discord posts (2,000 per post)`}`}</Typography>:null}
      <TextField label="Publishing" name="publishingMode" onChange={event=>setPublishingMode(event.target.value as "tracked_page"|"discord_post")} select value={publishingMode}>
        <MenuItem value="tracked_page">Post a tracked-page link to Discord</MenuItem>
        <MenuItem value="discord_post">Full Discord post</MenuItem>
      </TextField>
      <PageDestinations pages={snapshot.contentPages?.filter(page=>page.pageType==="alert"&&page.canPublish)??[]}/>
      <CommunityDestinationPicker publishing={snapshot.publishing} kind="alerts"/><Stack direction="row" spacing={1}><Button disabled={isReview} name="status" value="draft" type="submit" variant="outlined">Save draft</Button><Button disabled={isReview} name="status" value="published" type="submit" variant="contained">Publish alert</Button></Stack>
    </Stack>
  </CommunityPublicationForm>;
}

function PageDestinations({pages}:{pages:NonNullable<TraderLinkCommunityDashboardSnapshot["contentPages"]>}){return <Stack spacing={0.5}><Typography sx={{fontWeight:700}}>Website pages</Typography>{pages.length?pages.map(page=><label key={page.pageId}><input name="contentPageId" type="checkbox" value={page.pageId}/> {page.title}</label>):<Typography color="text.secondary" variant="body2">No Alert page is assigned to you. The alert can still use the existing member page.</Typography>}</Stack>;}
