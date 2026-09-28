"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";

import type { TraderLinkCommunityDashboardSnapshot } from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import { createCommunityAlertAction } from "./community-actions";

export function CommunityAlertComposer({snapshot,isReview}:{snapshot:TraderLinkCommunityDashboardSnapshot;isReview:boolean}) {
  const [templateId,setTemplateId]=useState("");
  const template=snapshot.alertTemplates.find(item=>item.templateId===templateId);
  const audience=snapshot.audiences.find(item=>item.status==="active");
  return <Box action={isReview?undefined:createCommunityAlertAction} component="form">
    <input name="communitySlug" type="hidden" value={snapshot.community.slug}/>
    <input name="templateId" type="hidden" value={templateId}/>
    <Stack spacing={2}>
      <TextField label="Template" onChange={event=>setTemplateId(event.target.value)} select value={templateId}>
        <MenuItem value="">No template</MenuItem>
        {snapshot.alertTemplates.map(item=><MenuItem key={item.templateId} value={item.templateId}>{item.title}</MenuItem>)}
      </TextField>
      <TextField fullWidth label="Title" name="title" required/>
      {template?template.fields.map(field=><TextField key={field.key} label={field.label} multiline={field.type==="notes"} minRows={field.type==="notes"?3:undefined} name={`template:${field.key}`} placeholder={field.placeholder} required={field.required} type={field.type==="number"||field.type==="price"?"number":field.type==="date"?"date":field.type==="time"?"time":"text"}/>):<><TextField fullWidth label="Ticker" name="symbol"/><TextField fullWidth label="Alert" minRows={4} multiline name="body" required/></>}
      <TextField defaultValue="tracked_page" label="Publishing" name="publishingMode" select>
        <MenuItem value="tracked_page">Tracked TraderLink page</MenuItem>
        <MenuItem value="discord_post">Full Discord post</MenuItem>
      </TextField>
      <TextField defaultValue={audience?.audienceId} label="Audience" name="audienceId" select>
        {snapshot.audiences.filter(item=>item.status==="active").map(item=><MenuItem key={item.audienceId} value={item.audienceId}>{item.name}</MenuItem>)}
      </TextField>
      <Button disabled={isReview} type="submit" variant="contained">Publish alert</Button>
    </Stack>
  </Box>;
}
