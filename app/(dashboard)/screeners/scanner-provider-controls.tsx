"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import { MARKET_DATA_FEATURE_LABELS, type MarketDataAdminControl, type MarketDataProvider } from "@/src/modules/market-data/provider-contract";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

export function ScannerProviderControls() {
  const [selections, setSelections] = useState<MarketDataAdminControl[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const update = (next: MarketDataAdminControl[]) => {
    setSelections(next);
  };
  useEffect(() => {
    const request = new AbortController();
    void fetch("/api/admin/market-data", { cache: "no-store", credentials: "same-origin", signal: request.signal })
      .then(async response => { if (!response.ok) throw Error(); return response.json() as Promise<{ selections: MarketDataAdminControl[] }>; })
      .then(value => update(value.selections))
      .catch(() => { if (!request.signal.aborted) { setFailed(true); setMessage("Market data settings could not load. Reload to try again."); } });
    return () => request.abort();
  }, []);
  const apply = async (row: MarketDataAdminControl, provider: MarketDataProvider) => {
    setBusy(row.feature); setMessage(null); setFailed(false);
    try {
      const response = await fetch("/api/admin/market-data", { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
        body: JSON.stringify({ feature: row.feature, provider, revision: row.revision }) });
      if (!response.ok) throw Error(response.status === 409 ? "changed" : "unavailable");
      const value = await response.json() as { selections: MarketDataAdminControl[] };
      update(value.selections);
      try { localStorage.setItem("traderslink.market-data.updated", String(Date.now())); } catch { /* Other tabs also check selection. */ }
      setMessage(MARKET_DATA_FEATURE_LABELS[row.feature] + " data connection updated.");
    } catch (error) {
      // A lost acknowledgement can still leave a successful Runtime transition.
      // Read the authoritative state before offering another switch or repair.
      try {
        const current = await fetch("/api/admin/market-data", { cache: "no-store", credentials: "same-origin" });
        if (current.ok) update((await current.json() as { selections: MarketDataAdminControl[] }).selections);
      } catch { /* Preserve the last acknowledged selection if settings are unreachable. */ }
      setFailed(true);
      setMessage(error instanceof Error && error.message === "changed"
        ? "The selection changed in another session. Reload these settings before trying again."
        : "The connection could not be switched. Check the selected connection or Watchlist runtime and try again.");
    } finally { setBusy(null); }
  };
  return <Stack spacing={1.25}>
    <Typography component="h3" variant="subtitle2">Market data connections</Typography>
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", lg: "repeat(2,minmax(0,1fr))" } }}>
      {selections.map(row => <Box key={row.feature}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent:"space-between", gap: 1, flexWrap:"wrap" }}>
          <Box>
            <Typography variant="body2" sx={{fontWeight:700}}>{MARKET_DATA_FEATURE_LABELS[row.feature]}</Typography>
            <Typography variant="caption" color="text.secondary">
              {busy===row.feature?"Switching…":row.controls.selectedLabel}
            </Typography>
          </Box>
          <FormControlLabel sx={{m:0}} label={row.controls.alternate.label} control={
            <Switch checked={row.controls.alternate.checked} disabled={busy!==null||!row.available}
              slotProps={{input:{"aria-label":row.controls.alternate.ariaLabel}}}
              onChange={(_,checked)=>void apply(row,checked?row.controls.alternate.provider:row.controls.primary.provider)}/>
          }/>
          {row.controls.repair&&<Button size="small" variant="outlined" color="inherit"
            disabled={busy!==null||!row.available} onClick={()=>void apply(row,row.controls.repair!.provider)}>
            {row.controls.repair.label}
          </Button>}
        </Stack>
        {row.controls.description && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {row.controls.description}
        </Typography>}
      </Box>)}
    </Box>
    {message && <Alert severity={failed ? "warning" : "success"}>{message}</Alert>}
  </Stack>;
}
