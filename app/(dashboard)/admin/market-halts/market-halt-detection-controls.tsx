"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import type { MarketHaltDetectionSettings } from "@/src/modules/news/server/market-halt-detection-settings";

const endpoint = "/api/admin/market-halts/settings";
async function read(response: Response): Promise<MarketHaltDetectionSettings> {
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.settings) throw Error(body?.error || "Halt settings could not be loaded. Try Refresh.");
  return body.settings;
}
export function MarketHaltDetectionControls() {
  const [saved, setSaved] = useState<MarketHaltDetectionSettings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [source, setSource] = useState<MarketHaltDetectionSettings["source"]>("official");
  const [busy, setBusy] = useState(true), [error, setError] = useState(""), [message, setMessage] = useState("");
  const running = useRef(false), alive = useRef(true);
  function accept(settings: MarketHaltDetectionSettings) { setSaved(settings); setEnabled(settings.enabled); setSource(settings.source); }
  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    void fetch(endpoint, { cache: "no-store", signal: controller.signal }).then(read)
      .then(settings => { if (alive.current) accept(settings); })
      .catch(failure => { if (!controller.signal.aborted && alive.current) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted && alive.current) setBusy(false); });
    return () => { alive.current = false; controller.abort(); };
  }, []);
  async function submit(save: boolean) {
    if (running.current) return;
    running.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const settings = await read(await fetch(endpoint, save ? { method: "POST", headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
        body: JSON.stringify({ enabled, source, revision: saved?.revision }), cache: "no-store" } : { cache: "no-store" }));
      if (alive.current) { accept(settings); setMessage(save ? "Halt detection settings saved." : "Saved settings refreshed."); }
    } catch (failure) { if (alive.current) setError(failure instanceof Error ? failure.message : "Settings could not be saved. Try Refresh."); }
    finally { running.current = false; if (alive.current) setBusy(false); }
  }
  return <Box sx={{ maxWidth: 680, p: { xs: 2, sm: 3 }, border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.paper", color: "text.primary" }}>
    <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 1 }}>Halt Detection</Typography>
    <Typography sx={{ mb: 2 }}>Choose how halt alerts are detected. The exchange method stays available when Alpaca is selected. Market Events keeps its existing detection and display rules.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    {busy && !saved && <Typography role="status" sx={{ mb: 2 }}>Loading saved settings…</Typography>}
    <Stack spacing={2}>
      <FormControlLabel label={<Typography>Detection: <Box component="span" sx={{ color: enabled ? "success.main" : "text.secondary", fontWeight: 700 }}>{saved ? enabled ? "On" : "Off" : "Loading"}</Box></Typography>}
        control={<Switch checked={enabled} onChange={event => setEnabled(event.target.checked)} disabled={busy || !saved} slotProps={{ input: { "aria-label": "Halt detection" } }} />} />
      <TextField select label="Detection source" value={source} onChange={event => setSource(event.target.value as MarketHaltDetectionSettings["source"])} disabled={busy || !saved} sx={{ width: 250, maxWidth: "100%" }}>
        <MenuItem value="alpaca">Alpaca</MenuItem><MenuItem value="official">Nasdaq/NYSE</MenuItem>
      </TextField>
      <Typography color="text.secondary" variant="body2">Nasdaq/NYSE quote and trading-resume times enrich matching halts separately. Both detection methods follow the trading calendar and active sessions. Overnight detection is off.</Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={() => void submit(true)} disabled={busy || !saved || saved.enabled === enabled && saved.source === source}>Save settings</Button>
        <Button variant="outlined" onClick={() => void submit(false)} disabled={busy}>Refresh</Button>
      </Stack>
    </Stack>
  </Box>;
}
