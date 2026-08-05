"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { saveAiReviewProviderSettings } from "./ai-review-provider-settings-actions";

export function AiReviewProviderSettings({
  initialInputRate,
  initialModelId,
  initialOutputRate,
}: Readonly<{
  initialInputRate: string | null;
  initialModelId: string;
  initialOutputRate: string | null;
}>) {
  const [modelId, setModelId] = useState(initialModelId);
  const [inputRate, setInputRate] = useState(initialInputRate ?? "");
  const [outputRate, setOutputRate] = useState(initialOutputRate ?? "");
  const [saved, setSaved] = useState(`${initialModelId}|${initialInputRate ?? ""}|${initialOutputRate ?? ""}`);
  const [message, setMessage] = useState<string | null>(null);
  const [working, startTransition] = useTransition();
  const current = `${modelId}|${inputRate}|${outputRate}`;

  function save(): void {
    startTransition(async () => {
      const result = await saveAiReviewProviderSettings({
        modelId,
        inputCostUsdPerMillionTokens: inputRate,
        outputCostUsdPerMillionTokens: outputRate,
      });
      if (result.ok) {
        setSaved(current);
        setMessage("AI Review provider settings saved.");
      } else setMessage(result.message);
    });
  }

  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="body2">
        Choose the exact OpenAI model used for future reviews. Enter its current input and output price per million tokens to record an estimate for every completed review.
      </Typography>
      {message ? <Alert severity={message === "AI Review provider settings saved." ? "success" : "error"}>{message}</Alert> : null}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
        <TextField fullWidth label="OpenAI model ID" onChange={(event) => setModelId(event.target.value.trim())} value={modelId} />
        <TextField fullWidth inputMode="decimal" label="Input price per million tokens (USD)" onChange={(event) => setInputRate(event.target.value.trim())} value={inputRate} />
        <TextField fullWidth inputMode="decimal" label="Output price per million tokens (USD)" onChange={(event) => setOutputRate(event.target.value.trim())} value={outputRate} />
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { sm: "center" } }}>
        <Button disabled={working || current === saved} onClick={save} variant="contained">{working ? "Saving..." : "Save AI Review settings"}</Button>
        <Typography color="text.secondary" variant="caption">Leave both prices blank when pricing has not been confirmed.</Typography>
      </Stack>
    </Stack>
  );
}
