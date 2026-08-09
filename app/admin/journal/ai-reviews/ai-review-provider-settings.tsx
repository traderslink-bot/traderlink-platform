"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { saveAiReviewProviderSettings } from "./ai-review-provider-settings-actions";

export function AiReviewProviderSettings({
  initialCachedInputRate,
  initialCacheWriteInputRate,
  initialInputRate,
  initialModelId,
  initialOutputRate,
}: Readonly<{
  initialCachedInputRate: string | null;
  initialCacheWriteInputRate: string | null;
  initialInputRate: string | null;
  initialModelId: string;
  initialOutputRate: string | null;
}>) {
  const [modelId, setModelId] = useState(initialModelId);
  const [inputRate, setInputRate] = useState(initialInputRate ?? "");
  const [cachedInputRate, setCachedInputRate] = useState(initialCachedInputRate ?? "");
  const [cacheWriteInputRate, setCacheWriteInputRate] = useState(
    initialCacheWriteInputRate ?? "",
  );
  const [outputRate, setOutputRate] = useState(initialOutputRate ?? "");
  const [saved, setSaved] = useState(
    `${initialModelId}|${initialInputRate ?? ""}|${initialCachedInputRate ?? ""}|${initialCacheWriteInputRate ?? ""}|${initialOutputRate ?? ""}`,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [working, startTransition] = useTransition();
  const current = `${modelId}|${inputRate}|${cachedInputRate}|${cacheWriteInputRate}|${outputRate}`;

  function save(): void {
    startTransition(async () => {
      const result = await saveAiReviewProviderSettings({
        modelId,
        inputCostUsdPerMillionTokens: inputRate,
        cachedInputCostUsdPerMillionTokens: cachedInputRate,
        cacheWriteInputCostUsdPerMillionTokens: cacheWriteInputRate,
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
        Choose the exact OpenAI model used for future reviews. Enter its current ordinary-input, cache-read, cache-write and output prices per million tokens so every provider receipt uses the correct rate.
      </Typography>
      {message ? <Alert severity={message === "AI Review provider settings saved." ? "success" : "error"}>{message}</Alert> : null}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
        <TextField fullWidth label="OpenAI model ID" onChange={(event) => setModelId(event.target.value.trim())} value={modelId} />
        <TextField fullWidth inputMode="decimal" label="Input price per million tokens (USD)" onChange={(event) => setInputRate(event.target.value.trim())} value={inputRate} />
        <TextField fullWidth inputMode="decimal" label="Cache-read input price per million tokens (USD)" onChange={(event) => setCachedInputRate(event.target.value.trim())} value={cachedInputRate} />
        <TextField fullWidth inputMode="decimal" label="Cache-write input price per million tokens (USD)" onChange={(event) => setCacheWriteInputRate(event.target.value.trim())} value={cacheWriteInputRate} />
        <TextField fullWidth inputMode="decimal" label="Output price per million tokens (USD)" onChange={(event) => setOutputRate(event.target.value.trim())} value={outputRate} />
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { sm: "center" } }}>
        <Button disabled={working || current === saved} onClick={save} variant="contained">{working ? "Saving..." : "Save AI Review settings"}</Button>
        <Typography color="text.secondary" variant="caption">Leave all four prices blank when pricing has not been confirmed.</Typography>
      </Stack>
    </Stack>
  );
}
