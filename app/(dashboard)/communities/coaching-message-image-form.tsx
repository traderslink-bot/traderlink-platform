"use client";

import {useEffect, useRef, useState} from "react";
import {useFormStatus} from "react-dom";
import {Alert, Box, Button, Stack, Typography} from "@mui/material";
import {uploadCommunityCoachingImageAction} from "./community-actions";

export function CoachingMessageImageForm({communitySlug, relationshipId, disabled}: {
  communitySlug:string; relationshipId:string; disabled:boolean;
}) {
  return <Box component="form" action={disabled ? undefined : uploadCommunityCoachingImageAction} encType="multipart/form-data" sx={{mt:2}}>
    <input type="hidden" name="communitySlug" value={communitySlug}/>
    <input type="hidden" name="relationshipId" value={relationshipId}/>
    <input type="hidden" name="targetType" value="message"/>
    <input type="hidden" name="targetId" value={relationshipId}/>
    <ImageControls disabled={disabled}/>
  </Box>;
}

function ImageControls({disabled}: {disabled:boolean}) {
  const {pending} = useFormStatus();
  const input = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<{file:File; url:string} | null>(null);
  const [error, setError] = useState("");
  useEffect(() => () => {if (selection) URL.revokeObjectURL(selection.url);}, [selection]);
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => {setSelection(null); setError("");};
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);
  function clear() {
    if (input.current) input.current.value = "";
    setSelection(null);
    setError("");
  }
  return <Stack spacing={1}>
      <Stack direction={{xs:"column",sm:"row"}} spacing={1}>
        <Button component="label" variant="outlined" disabled={disabled || pending}>Select chart
          <input ref={input} accept="image/png,image/jpeg,image/webp" hidden name="image" type="file" disabled={disabled || pending} onChange={event => {
            if (pending) return;
            const file = event.target.files?.[0];
            setError("");
            if (!file) {setSelection(null); return;}
            if (!file.size || file.size > 8388608 || !["image/png","image/jpeg","image/webp"].includes(file.type)) {
              setSelection(null);
              setError("Choose a PNG, JPEG or WebP image, 8 MB or smaller.");
              return;
            }
            setSelection({file,url:URL.createObjectURL(file)});
          }}/>
        </Button>
        <Button disabled={disabled || pending || !selection} type="submit" variant="contained">{pending ? "Sending image…" : "Send image"}</Button>
      </Stack>
      <Typography variant="caption">PNG, JPEG or WebP, up to 8 MB.</Typography>
      {selection ? <Stack spacing={1}>
        <Typography sx={{overflowWrap:"anywhere"}}>{selection.file.name}</Typography>
        <Box component="img" src={selection.url} alt="Selected chart preview" sx={{maxWidth:"100%",maxHeight:180,objectFit:"contain",alignSelf:"flex-start"}}/>
        <Button type="button" disabled={disabled || pending} onClick={clear}>Remove selected image</Button>
      </Stack> : null}
      {error ? <Alert severity="error" role="alert">{error}</Alert> : null}
    </Stack>;
}
