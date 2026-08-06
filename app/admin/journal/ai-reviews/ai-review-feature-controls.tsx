"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import type { CoachAiFeatureControl } from "@/src/modules/coach/contracts/ai-provider-controls-contracts";

import { saveAiReviewFeatureControl } from "./ai-review-feature-control-actions";

function keyFor(control: CoachAiFeatureControl): string {
  return `${control.enabled}|${control.caps.dailyRequestCap ?? ""}|${control.caps.dailyTokenCap ?? ""}|${control.caps.dailyEstimatedSpendCapUsd ?? ""}`;
}

export function AiReviewFeatureControl({
  initialControl,
  label,
}: Readonly<{
  initialControl: CoachAiFeatureControl;
  label: "Weekly Reviews" | "Monthly Reviews";
}>) {
  const [enabled, setEnabled] = useState(initialControl.enabled);
  const [requestCap, setRequestCap] = useState(initialControl.caps.dailyRequestCap?.toString() ?? "");
  const [tokenCap, setTokenCap] = useState(initialControl.caps.dailyTokenCap?.toString() ?? "");
  const [spendCap, setSpendCap] = useState(initialControl.caps.dailyEstimatedSpendCapUsd ?? "");
  const [saved, setSaved] = useState(keyFor(initialControl));
  const [message, setMessage] = useState<string | null>(null);
  const [working, startTransition] = useTransition();
  const current = `${enabled}|${requestCap}|${tokenCap}|${spendCap}`;
  const featureKey = initialControl.featureKey as "weekly_reviews" | "monthly_reviews";

  function save(): void {
    startTransition(async () => {
      const result = await saveAiReviewFeatureControl({
        featureKey,
        enabled,
        dailyRequestCap: requestCap,
        dailyTokenCap: tokenCap,
        dailyEstimatedSpendCapUsd: spendCap,
      });
      if (result.ok) {
        setSaved(current);
        setMessage(`${label} control saved.`);
      } else setMessage(result.message);
    });
  }

  return (
    <Stack spacing={1.5}>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />}
        label={enabled ? `${label} enabled` : `${label} disabled`}
      />
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
        <TextField fullWidth inputMode="numeric" label="Daily request limit" onChange={(event) => setRequestCap(event.target.value.trim())} value={requestCap} />
        <TextField fullWidth inputMode="numeric" label="Daily token limit" onChange={(event) => setTokenCap(event.target.value.trim())} value={tokenCap} />
        <TextField fullWidth inputMode="decimal" label="Daily estimated spend limit (USD)" onChange={(event) => setSpendCap(event.target.value.trim())} value={spendCap} />
      </Stack>
      {message ? <Alert severity={message === `${label} control saved.` ? "success" : "error"}>{message}</Alert> : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { sm: "center" } }}>
        <Button disabled={working || current === saved} onClick={save} variant="contained">
          {working ? "Saving..." : `Save ${label}`}
        </Button>
        <Typography color="text.secondary" variant="caption">
          Turning this off pauses new automatic reviews. Existing delivery choices stay exactly as the trader saved them.
        </Typography>
      </Stack>
    </Stack>
  );
}
