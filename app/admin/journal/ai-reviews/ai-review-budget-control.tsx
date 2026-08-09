"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import type { CoachAiReviewBudgetControl } from
  "@/src/modules/coach/server/coach-ai-review-administration-repository";

import { saveAiReviewBudgetControl } from "./ai-review-feature-control-actions";

type BudgetDraft = Readonly<{
  subscriberCap: string;
  globalWarning: string;
  emergencyCap: string;
}>;

export function AiReviewBudgetControl(input: Readonly<{
  initialControl: CoachAiReviewBudgetControl;
}>) {
  const initial = Object.freeze({
    subscriberCap: input.initialControl.perSubscriberPaidCycleEstimatedSpendCapUsd,
    globalWarning: input.initialControl.globalTrailing30DayWarningUsd ?? "",
    emergencyCap:
      input.initialControl.emergencyGlobalTrailing30DayEstimatedSpendCapUsd ?? "",
  });
  const [draft, setDraft] = useState<BudgetDraft>(initial);
  const [saved, setSaved] = useState<BudgetDraft>(initial);
  const [message, setMessage] = useState<Readonly<{
    ok: boolean;
    text: string;
  }> | null>(null);
  const [working, startTransition] = useTransition();

  const changed = draft.subscriberCap !== saved.subscriberCap ||
    draft.globalWarning !== saved.globalWarning ||
    draft.emergencyCap !== saved.emergencyCap;

  function change(field: keyof BudgetDraft, value: string): void {
    setDraft((current) => Object.freeze({ ...current, [field]: value.trim() }));
  }

  function save(): void {
    startTransition(async () => {
      const result = await saveAiReviewBudgetControl({
        globalTrailing30DayWarningUsd: draft.globalWarning,
        perSubscriberPaidCycleEstimatedSpendCapUsd: draft.subscriberCap,
        emergencyGlobalTrailing30DayEstimatedSpendCapUsd: draft.emergencyCap,
      });
      if (result.ok) {
        setSaved(draft);
        setMessage(Object.freeze({
          ok: true,
          text: "The AI Review safeguards were saved.",
        }));
      } else {
        setMessage(Object.freeze({ ok: false, text: result.message }));
      }
    });
  }

  return (
    <Stack spacing={2}>
      <Alert severity={input.initialControl.globalWarningReached ? "warning" : "info"}>
        Estimated AI Review spend during the last 30 days is ${input.initialControl.globalTrailing30DayEstimatedSpendUsd}.
        {input.initialControl.globalWarningReached
          ? " This is at or above the warning amount; subscribers under their own limit remain available."
          : " The warning amount does not interrupt subscriber service."}
      </Alert>

      <Stack spacing={0.75}>
        <TextField
          fullWidth
          inputMode="decimal"
          label="Per-subscriber AI Review limit per paid cycle (USD)"
          onChange={(event) => change("subscriberCap", event.target.value)}
          required
          value={draft.subscriberCap}
        />
        <Typography color="text.secondary" variant="body2">
          Default: $2.00. This covers weekly, two-week and monthly AI Reviews across all of one subscriber&apos;s Trade Tracker accounts. AI Chat usage is separate.
        </Typography>
      </Stack>

      <Stack spacing={0.75}>
        <TextField
          fullWidth
          inputMode="decimal"
          label="Global 30-day warning amount (USD)"
          onChange={(event) => change("globalWarning", event.target.value)}
          value={draft.globalWarning}
        />
        <Typography color="text.secondary" variant="body2">
          Admin monitoring only. Reaching this amount does not stop AI Reviews for subscribers who remain below their own limit.
        </Typography>
      </Stack>

      <Stack spacing={0.75}>
        <TextField
          fullWidth
          inputMode="decimal"
          label="Emergency global 30-day stop (USD, optional)"
          onChange={(event) => change("emergencyCap", event.target.value)}
          value={draft.emergencyCap}
        />
        <Typography color="text.secondary" variant="body2">
          Optional last-resort protection for a provider incident or system-wide loop. Reaching it pauses every new AI Review provider call while preserving frozen work.
        </Typography>
      </Stack>

      {message ? (
        <Alert severity={message.ok ? "success" : "error"}>{message.text}</Alert>
      ) : null}
      <Button disabled={working || !changed} onClick={save} variant="contained">
        {working ? "Saving..." : "Save AI Review safeguards"}
      </Button>
    </Stack>
  );
}
