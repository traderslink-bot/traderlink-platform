"use client";

import {useEffect, useRef, useState} from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export function focusCoachingEditor(id: string) {
  const editor = document.getElementById(id);
  editor?.focus({preventScroll:true});
  editor?.scrollIntoView({block:"start"});
}

function formContents(id: string): string | null {
  const form = document.getElementById(id);
  if(form instanceof HTMLFormElement)return JSON.stringify([...new FormData(form).entries()].filter(([name])=>!name.startsWith("$ACTION_")));
  // Student sections contain multiple independent forms. Compare their current
  // values in memory without storing private message/Journal drafts elsewhere.
  if(!form)return null;
  return JSON.stringify([...form.querySelectorAll("form")].map(item=>[...new FormData(item).entries()].filter(([name])=>!name.startsWith("$ACTION_")).map(([name,value])=>[name,value instanceof File?[value.name,value.size,value.type,value.lastModified]:value])));
}

/** Protect local editor switches without storing private drafts outside the form. */
export function useCoachingDraftNavigation(formId: string, formKey: string) {
  const baseline = useRef<string | null>(null);
  const focusOnChange = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const afterDialog = useRef<"form" | "trigger">("trigger");
  const [pending, setPending] = useState<(() => void) | null>(null);

  useEffect(() => {
    baseline.current = formContents(formId);
    if (focusOnChange.current) {
      focusOnChange.current = false;
      focusCoachingEditor(formId);
    }
  }, [formId, formKey]);

  function requestChange(change: () => void) {
    const contents = formContents(formId);
    if (baseline.current !== null && contents !== null && contents !== baseline.current) {
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPending(() => change);
    } else {
      focusOnChange.current = true;
      change();
    }
  }

  const confirmation = <Dialog open={pending !== null} disableRestoreFocus
    aria-labelledby={`${formId}-discard-title`}
    aria-describedby={`${formId}-discard-description`}
    onClose={() => {afterDialog.current = "trigger"; setPending(null);}}
    slotProps={{transition:{onExited:() => {
      if (afterDialog.current === "form") focusCoachingEditor(formId);
      else trigger.current?.focus();
    }}}}>
    <DialogTitle id={`${formId}-discard-title`}>Discard unsaved changes?</DialogTitle>
    <DialogContent><DialogContentText id={`${formId}-discard-description`}>
      Your unsaved changes will be lost if you continue.
    </DialogContentText></DialogContent>
    <DialogActions>
      <Button autoFocus onClick={() => {afterDialog.current = "trigger"; setPending(null);}}>Keep editing</Button>
      <Button color="error" onClick={() => {
        afterDialog.current = "form";
        pending?.();
        setPending(null);
      }}>Discard changes</Button>
    </DialogActions>
  </Dialog>;

  return {requestChange, confirmation};
}
