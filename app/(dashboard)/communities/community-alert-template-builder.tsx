"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";

import {saveCommunityTemplateWithFeedback} from "./community-template-actions";
import {CommunityPublicationForm} from "./community-publication-form";
import type {TraderLinkCommunityAlertTemplate} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";

type TemplateField = { id: number; label: string; type: string; required: boolean; placeholder: string };

export function CommunityAlertTemplateBuilder({ communitySlug, disabled, template, scope="personal" }: { communitySlug: string; canShare: boolean; disabled: boolean; template?:TraderLinkCommunityAlertTemplate;scope?:"personal"|"community" }) {
  const [nextId, setNextId] = useState((template?.fields.length??1)+1);
  const [fields, setFields] = useState<TemplateField[]>(template?.fields.map((field,index)=>({...field,id:index+1}))??[{ id: 1, label: "", type: "text", required: true, placeholder: "" }]);
  const update = (id: number, values: Partial<TemplateField>) => setFields(current => current.map(field => field.id === id ? { ...field, ...values } : field));
  return <CommunityPublicationForm action={saveCommunityTemplateWithFeedback} disabled={disabled}>
    <input name="communitySlug" type="hidden" value={communitySlug}/><input name="templateId" type="hidden" value={template?.templateId??""}/><input name="scope" type="hidden" value={template?.scope??scope}/><input name="fieldCount" type="hidden" value={fields.length}/>
    <Stack spacing={2}>
      <TextField label="Template name" name="title" defaultValue={template?.title??""} required/>

      {fields.map((field, index) => <Stack direction={{ xs: "column", sm: "row" }} key={field.id} spacing={1} sx={{ alignItems: { sm: "center" } }}>
        <TextField fullWidth label="Field name" name={`fieldLabel:${index}`} onChange={event => update(field.id, { label: event.target.value })} required value={field.label}/>
        <TextField label="Type" name={`fieldType:${index}`} onChange={event => update(field.id, { type: event.target.value })} select sx={{ minWidth: 130 }} value={field.type}><MenuItem value="choice">Choice</MenuItem><MenuItem value="text">Text</MenuItem><MenuItem value="ticker">Ticker</MenuItem><MenuItem value="price">Price</MenuItem><MenuItem value="number">Number</MenuItem><MenuItem value="date">Date</MenuItem><MenuItem value="time">Time</MenuItem><MenuItem value="notes">Notes</MenuItem></TextField>
        <TextField fullWidth label="Placeholder" name={`fieldPlaceholder:${index}`} onChange={event => update(field.id, { placeholder: event.target.value })} value={field.placeholder}/>
        <FormControlLabel control={<Checkbox checked={field.required} name={`fieldRequired:${index}`} onChange={event => update(field.id, { required: event.target.checked })}/>} label="Required"/>
        <IconButton aria-label="Remove field" disabled={fields.length === 1} onClick={() => setFields(current => current.filter(item => item.id !== field.id))}><DeleteOutlineRoundedIcon/></IconButton>
      </Stack>)}
      <Stack direction="row" spacing={1}><Button disabled={fields.length >= 20} onClick={() => { setFields(current => [...current, { id: nextId, label: "", type: "text", required: true, placeholder: "" }]); setNextId(value => value + 1); }} startIcon={<AddRoundedIcon/>}>Add field</Button><Button disabled={disabled} type="submit" variant="contained">Save template</Button></Stack>
    </Stack>
  </CommunityPublicationForm>;
}
