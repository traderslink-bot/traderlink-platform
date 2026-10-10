"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useState } from "react";

import { createCommunityAlertTemplateAction } from "./community-actions";

type TemplateField = { id: number; label: string; type: string; required: boolean; placeholder: string };

export function CommunityAlertTemplateBuilder({ communitySlug, canShare, disabled }: { communitySlug: string; canShare: boolean; disabled: boolean }) {
  const [nextId, setNextId] = useState(2);
  const [fields, setFields] = useState<TemplateField[]>([{ id: 1, label: "", type: "text", required: true, placeholder: "" }]);
  const update = (id: number, values: Partial<TemplateField>) => setFields(current => current.map(field => field.id === id ? { ...field, ...values } : field));
  return <Box action={disabled ? undefined : createCommunityAlertTemplateAction} component="form">
    <input name="communitySlug" type="hidden" value={communitySlug}/><input name="fieldCount" type="hidden" value={fields.length}/>
    <Stack spacing={2}>
      <TextField label="Template name" name="title" required/>
      <TextField defaultValue="personal" label="Template access" name="scope" select><MenuItem value="personal">Only me</MenuItem>{canShare ? <MenuItem value="community">All alert publishers</MenuItem> : null}</TextField>
      {fields.map((field, index) => <Stack direction={{ xs: "column", sm: "row" }} key={field.id} spacing={1} sx={{ alignItems: { sm: "center" } }}>
        <TextField fullWidth label="Field name" name={`fieldLabel:${index}`} onChange={event => update(field.id, { label: event.target.value })} required value={field.label}/>
        <TextField label="Type" name={`fieldType:${index}`} onChange={event => update(field.id, { type: event.target.value })} select sx={{ minWidth: 130 }} value={field.type}><MenuItem value="text">Text</MenuItem><MenuItem value="ticker">Ticker</MenuItem><MenuItem value="price">Price</MenuItem><MenuItem value="number">Number</MenuItem><MenuItem value="date">Date</MenuItem><MenuItem value="time">Time</MenuItem><MenuItem value="notes">Notes</MenuItem></TextField>
        <TextField fullWidth label="Placeholder" name={`fieldPlaceholder:${index}`} onChange={event => update(field.id, { placeholder: event.target.value })} value={field.placeholder}/>
        <FormControlLabel control={<Checkbox checked={field.required} name={`fieldRequired:${index}`} onChange={event => update(field.id, { required: event.target.checked })}/>} label="Required"/>
        <IconButton aria-label="Remove field" disabled={fields.length === 1} onClick={() => setFields(current => current.filter(item => item.id !== field.id))}><DeleteOutlineRoundedIcon/></IconButton>
      </Stack>)}
      <Stack direction="row" spacing={1}><Button disabled={fields.length >= 20} onClick={() => { setFields(current => [...current, { id: nextId, label: "", type: "text", required: true, placeholder: "" }]); setNextId(value => value + 1); }} startIcon={<AddRoundedIcon/>}>Add field</Button><Button disabled={disabled} type="submit" variant="contained">Save template</Button></Stack>
    </Stack>
  </Box>;
}
