"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import type {
  CoachAiChatAdminAccount,
  CoachAiChatAdminFeatureControl,
} from "@/src/modules/coach/server/coach-ai-chat-administration-repository";
import {
  saveAiChatAccountControl,
  saveAiChatPlatformControl,
  saveAiChatProviderSettings,
} from "./ai-chat-admin-actions";

function controlKey(control: CoachAiChatAdminFeatureControl | null): string {
  return control
    ? `${control.enabled}|${control.dailyRequestCap ?? ""}|${control.dailyTokenCap ?? ""}|${control.dailyEstimatedSpendCapUsd ?? ""}`
    : "false|||";
}

function CapFields({
  requestCap,
  setRequestCap,
  setSpendCap,
  setTokenCap,
  spendCap,
  tokenCap,
}: Readonly<{
  requestCap: string;
  setRequestCap: (value: string) => void;
  setSpendCap: (value: string) => void;
  setTokenCap: (value: string) => void;
  spendCap: string;
  tokenCap: string;
}>) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
      <TextField fullWidth inputMode="numeric" label="Daily request cap" onChange={(event) => setRequestCap(event.target.value.trim())} value={requestCap} />
      <TextField fullWidth inputMode="numeric" label="Daily token cap" onChange={(event) => setTokenCap(event.target.value.trim())} value={tokenCap} />
      <TextField fullWidth inputMode="decimal" label="Daily estimated spend cap (USD)" onChange={(event) => setSpendCap(event.target.value.trim())} value={spendCap} />
    </Stack>
  );
}

function ControlEditor({
  initialControl,
  onSave,
  saveLabel,
}: Readonly<{
  initialControl: CoachAiChatAdminFeatureControl | null;
  onSave: (input: Readonly<{ enabled: boolean; dailyRequestCap: string; dailyTokenCap: string; dailyEstimatedSpendCapUsd: string }>) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>>;
  saveLabel: string;
}>) {
  const [enabled, setEnabled] = useState(initialControl?.enabled ?? false);
  const [requestCap, setRequestCap] = useState(initialControl?.dailyRequestCap?.toString() ?? "");
  const [tokenCap, setTokenCap] = useState(initialControl?.dailyTokenCap?.toString() ?? "");
  const [spendCap, setSpendCap] = useState(initialControl?.dailyEstimatedSpendCapUsd ?? "");
  const [saved, setSaved] = useState(controlKey(initialControl));
  const [message, setMessage] = useState<string | null>(null);
  const [working, startTransition] = useTransition();
  const current = `${enabled}|${requestCap}|${tokenCap}|${spendCap}`;

  function save(): void {
    startTransition(async () => {
      const result = await onSave({ enabled, dailyRequestCap: requestCap, dailyTokenCap: tokenCap, dailyEstimatedSpendCapUsd: spendCap });
      if (result.ok) {
        setSaved(current);
        setMessage("AI Chat control saved.");
      } else setMessage(result.message);
    });
  }

  return (
    <Stack spacing={1.5}>
      <FormControlLabel control={<Switch checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />} label={enabled ? "AI Chat enabled" : "AI Chat disabled"} />
      <CapFields requestCap={requestCap} setRequestCap={setRequestCap} setSpendCap={setSpendCap} setTokenCap={setTokenCap} spendCap={spendCap} tokenCap={tokenCap} />
      {message ? <Alert severity={message === "AI Chat control saved." ? "success" : "error"}>{message}</Alert> : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { sm: "center" } }}>
        <Button disabled={working || current === saved} onClick={save} variant="contained">{working ? "Saving..." : saveLabel}</Button>
        <Typography color="text.secondary" variant="caption">Enabled controls require all three caps. The platform and account limits are both enforced.</Typography>
      </Stack>
    </Stack>
  );
}

export function AiChatProviderSettings({
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
  const [cacheWriteInputRate, setCacheWriteInputRate] = useState(initialCacheWriteInputRate ?? "");
  const [outputRate, setOutputRate] = useState(initialOutputRate ?? "");
  const [saved, setSaved] = useState(`${initialModelId}|${initialInputRate ?? ""}|${initialCachedInputRate ?? ""}|${initialCacheWriteInputRate ?? ""}|${initialOutputRate ?? ""}`);
  const [message, setMessage] = useState<string | null>(null);
  const [working, startTransition] = useTransition();
  const current = `${modelId}|${inputRate}|${cachedInputRate}|${cacheWriteInputRate}|${outputRate}`;

  function save(): void {
    startTransition(async () => {
      const result = await saveAiChatProviderSettings({
        modelId,
        inputCostUsdPerMillionTokens: inputRate,
        cachedInputCostUsdPerMillionTokens: cachedInputRate,
        cacheWriteInputCostUsdPerMillionTokens: cacheWriteInputRate,
        outputCostUsdPerMillionTokens: outputRate,
      });
      if (result.ok) {
        setSaved(current);
        setMessage("AI Chat provider settings saved.");
      } else setMessage(result.message);
    });
  }

  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="body2">Choose the separate model used for future AI Chat requests. Prices are saved with each request reservation and must be verified before Chat can be enabled.</Typography>
      {message ? <Alert severity={message === "AI Chat provider settings saved." ? "success" : "error"}>{message}</Alert> : null}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(5, minmax(0, 1fr))" } }}>
        <TextField fullWidth label="OpenAI Chat model ID" onChange={(event) => setModelId(event.target.value.trim())} value={modelId} />
        <TextField fullWidth inputMode="decimal" label="Uncached input price per million (USD)" onChange={(event) => setInputRate(event.target.value.trim())} value={inputRate} />
        <TextField fullWidth inputMode="decimal" label="Cached input price per million (USD)" onChange={(event) => setCachedInputRate(event.target.value.trim())} value={cachedInputRate} />
        <TextField fullWidth inputMode="decimal" label="Cache write price per million (USD)" onChange={(event) => setCacheWriteInputRate(event.target.value.trim())} value={cacheWriteInputRate} />
        <TextField fullWidth inputMode="decimal" label="Output price per million (USD)" onChange={(event) => setOutputRate(event.target.value.trim())} value={outputRate} />
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { sm: "center" } }}>
        <Button disabled={working || current === saved} onClick={save} variant="contained">{working ? "Saving..." : "Save AI Chat settings"}</Button>
        <Typography color="text.secondary" variant="caption">Leave all four prices blank until the model&apos;s uncached input, cached input, cache write and output prices are confirmed.</Typography>
      </Stack>
    </Stack>
  );
}

export function AiChatPlatformControl({ initialControl }: { initialControl: CoachAiChatAdminFeatureControl }) {
  return <ControlEditor initialControl={initialControl} onSave={saveAiChatPlatformControl} saveLabel="Save platform Chat control" />;
}

export function AiChatAccountControl({ accounts }: { accounts: readonly CoachAiChatAdminAccount[] }) {
  const [accountRef, setAccountRef] = useState(accounts[0]?.accountRef ?? "");
  const account = accounts.find((item) => item.accountRef === accountRef) ?? null;

  if (accounts.length === 0) return <Typography color="text.secondary" variant="body2">No active Journal accounts are available for account-specific Chat controls.</Typography>;
  return (
    <Stack spacing={1.5}>
      <FormControl fullWidth>
        <InputLabel id="ai-chat-account-label">Journal account</InputLabel>
        <Select label="Journal account" labelId="ai-chat-account-label" onChange={(event) => setAccountRef(event.target.value)} value={accountRef}>
          {accounts.map((item) => <MenuItem key={item.accountRef} value={item.accountRef}>{item.displayName}</MenuItem>)}
        </Select>
      </FormControl>
      {account ? <Typography color="text.secondary" variant="caption">Controls for {account.displayName} are stored on the Journal account and apply across its authorized workspace members.</Typography> : null}
      <ControlEditor
        key={accountRef}
        initialControl={account?.control ?? null}
        onSave={(input) => saveAiChatAccountControl({ accountRef, ...input })}
        saveLabel="Save account Chat control"
      />
    </Stack>
  );
}
