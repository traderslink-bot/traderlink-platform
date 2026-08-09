"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { saveAiReviewMasterControl } from "./ai-review-feature-control-actions";

export function AiReviewMasterControl({
  initialState,
}: Readonly<{
  initialState: "enabled" | "disabled" | "mixed";
}>) {
  const initiallyEnabled = initialState === "enabled";
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [saved, setSaved] = useState(initiallyEnabled);
  const [needsReconciliation, setNeedsReconciliation] = useState(
    initialState === "mixed",
  );
  const [message, setMessage] = useState<Readonly<{
    state: "success" | "error";
    text: string;
  }> | null>(initialState === "mixed" ? Object.freeze({
    state: "error",
    text: "Weekly and monthly controls are inconsistent. Save this control to put both into one state.",
  }) : null);
  const [working, startTransition] = useTransition();

  function save(): void {
    startTransition(async () => {
      const result = await saveAiReviewMasterControl({ enabled });
      if (!result.ok) {
        setMessage(Object.freeze({ state: "error", text: result.message }));
        return;
      }
      setSaved(enabled);
      setNeedsReconciliation(false);
      setMessage(Object.freeze({
        state: "success",
        text: enabled
          ? "AI Reviews are available at the platform level."
          : "New AI Review requests and not-started pending work are paused.",
      }));
    });
  }

  return (
    <Stack spacing={1.5}>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />}
        label={enabled ? "AI Reviews available" : "AI Reviews unavailable"}
      />
      <Typography color="text.secondary" variant="body2">
        This is the platform-wide safety switch. Turning it off pauses new requests and pending work that has not started. Reviews already issued remain readable, and an attempt already sent to the provider may finish safely.
      </Typography>
      {message ? <Alert severity={message.state}>{message.text}</Alert> : null}
      <Button disabled={working || (enabled === saved && !needsReconciliation)} onClick={save} variant="contained">
        {working ? "Saving..." : "Save platform availability"}
      </Button>
    </Stack>
  );
}
