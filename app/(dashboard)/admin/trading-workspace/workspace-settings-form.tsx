"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DashboardPanel, DashboardPrimaryAction } from "@/app/dashboard-template";
import { parseWorkspaceMarketSettings, type WorkspaceMarketSettings } from "@/src/modules/market-data/workspace-market-settings";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

const route = "/api/admin/trading-workspace";
const seconds = (milliseconds: number) => String(milliseconds / 1000);
const milliseconds = (value: string) => value.trim() ? Math.round(Number(value) * 1000) : Number.NaN;

export function TradingWorkspaceSettingsForm({ initialSettings }: { initialSettings: WorkspaceMarketSettings }) {
  const router = useRouter();
  const [stored, setStored] = useState(initialSettings);
  const [draft, setDraft] = useState(initialSettings);
  const [timed, setTimed] = useState(initialSettings.cardRefreshMs !== null);
  const [refresh, setRefresh] = useState(seconds(initialSettings.cardRefreshMs ?? 3000));
  const [batchSize, setBatchSize] = useState(String(initialSettings.restBatchSize));
  const [spacing, setSpacing] = useState(seconds(initialSettings.restSpacingMs));
  const [wait, setWait] = useState(seconds(initialSettings.restPassWaitMs));
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function restore(value: WorkspaceMarketSettings) {
    setStored(value);
    setDraft(value);
    setTimed(value.cardRefreshMs !== null);
    setRefresh(seconds(value.cardRefreshMs ?? 3000));
    setBatchSize(String(value.restBatchSize));
    setSpacing(seconds(value.restSpacingMs));
    setWait(seconds(value.restPassWaitMs));
  }

  async function save() {
    if (pending) return;
    setError("");
    setNotice("");
    let requested;
    try {
      requested = parseWorkspaceMarketSettings({ ...draft,
        cardRefreshMs: timed ? milliseconds(refresh) : null,
        restBatchSize: Number(batchSize), restSpacingMs: milliseconds(spacing), restPassWaitMs: milliseconds(wait),
      });
    } catch {
      setError("Enter a valid refresh interval, batch size, and REST timing.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(route, {
        method: "PUT",
        headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
        body: JSON.stringify(requested),
      });
      if (response.status === 409) {
        setError("Settings changed in another tab. Reload this page before saving.");
        return;
      }
      if (!response.ok) throw Error("settings_unavailable");
      restore(parseWorkspaceMarketSettings(await response.json()));
      setNotice("Workspace settings saved.");
      router.refresh();
    } catch {
      setError("Workspace settings could not be saved. Try again.");
    } finally {
      setPending(false);
    }
  }

  return <Box component="form" onSubmit={event => { event.preventDefault(); void save(); }} sx={{ maxWidth: 780 }}>
    <Stack spacing={2}>
      <DashboardPanel title="Workspace access">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField select size="small" label="Current providers" value={draft.currentAudience} disabled={pending} sx={{ width: 206 }}
            onChange={event => setDraft({ ...draft, currentAudience: event.target.value as WorkspaceMarketSettings["currentAudience"] })}>
            <MenuItem value="review">Review accounts</MenuItem>
            <MenuItem value="members">All signed-in users</MenuItem>
          </TextField>
          <TextField select size="small" label="Moomoo Workspace" value={draft.brokerAudience} disabled={pending} sx={{ width: 206 }}
            onChange={event => setDraft({ ...draft, brokerAudience: event.target.value as WorkspaceMarketSettings["brokerAudience"] })}>
            <MenuItem value="off">Off</MenuItem>
            <MenuItem value="review">Review accounts</MenuItem>
            <MenuItem value="members">All signed-in users</MenuItem>
          </TextField>
        </Stack>
      </DashboardPanel>
      <DashboardPanel title="Moomoo Scanner cards">
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField select size="small" label="Card data source" value={draft.cardTransport} disabled={pending} sx={{ width: 175 }}
              onChange={event => setDraft({ ...draft, cardTransport: event.target.value as WorkspaceMarketSettings["cardTransport"] })}>
              <MenuItem value="websocket">WebSocket</MenuItem>
              <MenuItem value="rest">REST polling</MenuItem>
            </TextField>
            <TextField select size="small" label="Card refresh" value={timed ? "interval" : "live"} disabled={pending} sx={{ width: 164 }}
              onChange={event => setTimed(event.target.value === "interval")}>
              <MenuItem value="live">Live</MenuItem>
              <MenuItem value="interval">Custom interval</MenuItem>
            </TextField>
            {timed && <TextField type="number" size="small" label="Refresh seconds" value={refresh} disabled={pending} sx={{ width: 148 }}
              slotProps={{ htmlInput: { min: 1, step: 0.1, required: true } }} onChange={event => setRefresh(event.target.value)} />}
          </Stack>
          {draft.cardTransport === "rest" && <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField type="number" size="small" label="Symbols per batch" value={batchSize} disabled={pending} sx={{ width: 148 }}
              slotProps={{ htmlInput: { min: 1, max: 400, step: 1, required: true } }} onChange={event => setBatchSize(event.target.value)} />
            <TextField type="number" size="small" label="Between batches (seconds)" value={spacing} disabled={pending} sx={{ width: 205 }}
              slotProps={{ htmlInput: { min: 0.5, step: 0.1, required: true } }} onChange={event => setSpacing(event.target.value)} />
            <TextField type="number" size="small" label="After each pass (seconds)" value={wait} disabled={pending} sx={{ width: 205 }}
              slotProps={{ htmlInput: { min: 0, step: 0.1, required: true } }} onChange={event => setWait(event.target.value)} />
          </Stack>}
          <Typography variant="body2" color="text.secondary">Charts stream live with either card data source.</Typography>
        </Stack>
      </DashboardPanel>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="success" role="status">{notice}</Alert>}
      <Stack direction="row" spacing={1}>
        <DashboardPrimaryAction type="submit" disabled={pending}>{pending ? "Saving…" : "Save workspace settings"}</DashboardPrimaryAction>
        <Button disabled={pending} onClick={() => { restore(stored); setNotice(""); setError(""); }}>Cancel</Button>
      </Stack>
    </Stack>
  </Box>;
}
