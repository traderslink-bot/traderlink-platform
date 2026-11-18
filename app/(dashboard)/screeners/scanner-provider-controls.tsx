"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import { MARKET_DATA_FEATURE_LABELS, type MarketDataControl } from "@/src/modules/market-data/provider-contract";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

export function ScannerProviderControls() {
  const [selections, setSelections] = useState<MarketDataControl[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const update = (next: MarketDataControl[]) => {
    setSelections(next);
  };
  useEffect(() => {
    const request = new AbortController();
    void fetch("/api/admin/market-data", { cache: "no-store", credentials: "same-origin", signal: request.signal })
      .then(async response => { if (!response.ok) throw Error(); return response.json() as Promise<{ selections: MarketDataControl[] }>; })
      .then(value => update(value.selections))
      .catch(() => { if (!request.signal.aborted) { setFailed(true); setMessage("Market data settings could not load. Reload to try again."); } });
    return () => request.abort();
  }, []);
  const apply = async (row: MarketDataControl, provider: "alpaca" | "moomoo") => {
    setBusy(row.feature); setMessage(null); setFailed(false);
    try {
      const response = await fetch("/api/admin/market-data", { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
        body: JSON.stringify({ feature: row.feature, provider, revision: row.revision }) });
      if (!response.ok) throw Error(response.status === 409 ? "changed" : "unavailable");
      const value = await response.json() as { selections: MarketDataControl[] };
      update(value.selections);
      try { localStorage.setItem("traderslink.market-data.updated", JSON.stringify(value.selections)); } catch { /* Other tabs also check selection. */ }
      setMessage(MARKET_DATA_FEATURE_LABELS[row.feature] + " data connection updated.");
    } catch (error) {
      // A lost acknowledgement can still leave a successful Runtime transition.
      // Read the authoritative state before offering another switch or repair.
      try {
        const current = await fetch("/api/admin/market-data", { cache: "no-store", credentials: "same-origin" });
        if (current.ok) update((await current.json() as { selections: MarketDataControl[] }).selections);
      } catch { /* Preserve the last acknowledged selection if settings are unreachable. */ }
      setFailed(true);
      setMessage(error instanceof Error && error.message === "changed"
        ? "The selection changed in another session. Reload these settings before trying again."
        : "The connection could not be switched. Check the Moomoo connection or Watchlist runtime and try again.");
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
              {busy===row.feature?"Switching…":row.provider==="alpaca"?"Alpaca":row.provider==="custom"?"Custom setup":row.feature==="watchlist"?"Previous setup":"Moomoo"}
            </Typography>
          </Box>
          <FormControlLabel sx={{m:0}} label={row.feature==="watchlist"?"Use previous setup":"Use Moomoo"} control={
            <Switch checked={row.provider==="moomoo"} disabled={busy!==null||!row.available}
              slotProps={{input:{"aria-label":row.feature==="watchlist"?"Use previous Watchlist setup":"Use Moomoo for "+MARKET_DATA_FEATURE_LABELS[row.feature]}}}
              onChange={(_,checked)=>void apply(row,checked?"moomoo":"alpaca")}/>
          }/>
          {(row.provider==="custom"||row.synchronized===false)&&<Button size="small" variant="outlined" color="inherit"
            disabled={busy!==null||!row.available} onClick={()=>void apply(row,row.provider==="moomoo"?"moomoo":"alpaca")}>
            {row.synchronized===false?"Complete switch":"Use Alpaca"}
          </Button>}
        </Stack>
        {row.feature === "watchlist" && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {row.available ? "Previous setup uses EODHD history and live prices, with Moomoo same-day candles." : "Watchlist runtime settings are currently unavailable."}
        </Typography>}
      </Box>)}
    </Box>
    {message && <Alert severity={failed ? "warning" : "success"}>{message}</Alert>}
  </Stack>;
}
