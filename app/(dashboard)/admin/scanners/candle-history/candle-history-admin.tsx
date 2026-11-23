"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { DashboardPanel, DashboardPrimaryAction } from "@/app/dashboard-template";
import {
  CANDLE_HISTORY_FRAMES, parseCandleHistorySettings, type CandleHistorySettings, type HistoryLimit,
} from "@/src/modules/market-data/candle-history/settings";
import type { CandleArchiveAdmin, CandleHistoryProjection } from "@/src/modules/market-data/candle-history/transport";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

const route = "/api/admin/scanners/candle-history";
const frameLabels = { "1m": "1 minute", "5m": "5 minutes", "15m": "15 minutes", "30m": "30 minutes",
  "1h": "1 hour", "4h": "4 hours", "1D": "Daily" };
const units: [HistoryLimit["unit"], string][] = [["sessions", "Trading sessions"], ["days", "Calendar days"], ["months", "Months"]];
const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const bytes = (value: number) => (value >= 1e9 ? numberFormat.format(value / 1e9) + " GB" : numberFormat.format(value / 1e6) + " MB");

function RetentionLimit({ label, value, change }: { label: string; value: HistoryLimit; change: (value: HistoryLimit) => void }) {
  return <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
    <TextField size="small" type="number" label={label} value={value.amount || ""} sx={{ width: 114 }}
      slotProps={{ htmlInput: { min: 1, step: 1 } }}
      onChange={event => change({ ...value, amount: Number(event.target.value) })} />
    <TextField select size="small" label={label + " unit"} value={value.unit} sx={{ width: 148 }}
      onChange={event => change({ ...value, unit: event.target.value as HistoryLimit["unit"] })}>
      {units.map(([unit, label]) => <MenuItem key={unit} value={unit}>{label}</MenuItem>)}
    </TextField>
  </Stack>;
}

export function CandleHistoryAdmin() {
  const [stored, setStored] = useState<CandleArchiveAdmin>();
  const [draft, setDraft] = useState<CandleHistorySettings>();
  const [all, setAll] = useState<HistoryLimit>({ amount: 12, unit: "months" });
  const [ticker, setTicker] = useState("");
  const [projection, setProjection] = useState<CandleHistoryProjection>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    void fetch(route, { signal: abort.signal, cache: "no-store" }).then(async response => {
      if (!response.ok) throw Error();
      const next = await response.json() as CandleArchiveAdmin;
      if (abort.signal.aborted) return;
      setStored(next);
      setDraft(next.settings);
    }).catch(() => {
      if (!abort.signal.aborted) setError("Candle history is unavailable.");
    });
    const interval = setInterval(() => {
      void fetch(route, { signal: abort.signal, cache: "no-store" }).then(async response => {
        if (!response.ok) return;
        const next = await response.json() as CandleArchiveAdmin;
        if (!abort.signal.aborted) setStored(current => current && current.settings.revision > next.settings.revision ? current : next);
      }).catch(() => {});
    }, 15_000);
    return () => { clearInterval(interval); abort.abort(); };
  }, []);

  function change(next: CandleHistorySettings) {
    setDraft(next);
    setProjection(undefined);
    setError("");
    setNotice("");
  }

  async function submit(method: "POST" | "PUT") {
    if (!draft || pending) return;
    setError("");
    setNotice("");
    setPending(true);
    try {
      const settings = parseCandleHistorySettings(draft);
      const response = await fetch(route, { method, headers: {
        "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1",
      }, body: JSON.stringify(settings) });
      if (response.status === 409) {
        const { error } = await response.json() as { error?: string };
        setError(error === "universe_unavailable" ? "The latest market-cap roster is unavailable."
          : "The settings changed. Reopen this page before saving.");
        return;
      }
      if (!response.ok) throw Error();
      if (method === "POST") setProjection(await response.json() as CandleHistoryProjection);
      else {
        const next = await response.json() as CandleArchiveAdmin;
        setStored(next);
        change(next.settings);
        setNotice("Candle history settings saved.");
      }
    } catch {
      setError("Check the limits or try again when candle history is available.");
    } finally { setPending(false); }
  }

  if (!stored || !draft) return <DashboardPanel title="Candle history">
    <Alert severity={error ? "warning" : "info"}>{error || "Loading candle history…"}</Alert>
  </DashboardPanel>;

  const groups = [
    ["Market-cap history", stored.storage.marketCap], ["Popular ticker history", stored.storage.popular],
    ["Combined history", stored.storage.combined], ["In both groups", stored.storage.overlap],
  ] as const;
  const dirty = JSON.stringify(draft) !== JSON.stringify(stored.settings);
  const addTicker = () => {
    const symbol = ticker.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.-]{0,14}$/u.test(symbol)) {
      setError("Enter one valid ticker symbol.");
      return;
    }
    change({ ...draft, popularTickers: [...new Set([...draft.popularTickers, symbol])] });
    setTicker("");
  };
  return <DashboardPanel title="Candle history">
    <Stack spacing={2.5}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {notice ? <Alert severity="success">{notice}</Alert> : null}
      {stored.backfill && <Typography variant="body2" role="status">
        {numberFormat.format(stored.backfill.complete)} of {numberFormat.format(stored.backfill.total)} tickers have complete history.
        {stored.backfill.retrying > 0 && " Retrying " + numberFormat.format(stored.backfill.retrying) + " tickers."}
      </Typography>}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, 1fr)" } }}>
        {groups.map(([label, totals]) => <Box key={label}>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography>{bytes(totals.estimatedBytes)} estimated</Typography>
          <Typography variant="body2" color="text.secondary">{numberFormat.format(totals.symbols)} tickers</Typography>
        </Box>)}
      </Box>
      <Typography variant="body2">Database on disk {bytes(stored.storage.physicalBytes)} · Measured {new Date(stored.storage.measuredAt).toLocaleString()}</Typography>
      <TextField size="small" type="number" label="Backfill market cap ceiling ($)" value={draft.marketCapCeiling}
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
        onChange={event => change({ ...draft, marketCapCeiling: Number(event.target.value) })} sx={{ maxWidth: 290 }} />
      <Stack spacing={1}>
        <Typography variant="h6">History limits</Typography>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <RetentionLimit label="All timeframes" value={all} change={setAll} />
          <Button variant="outlined" onClick={() => change({ ...draft, retention: Object.fromEntries(
            CANDLE_HISTORY_FRAMES.map(frame => [frame, { ...all }]),
          ) as CandleHistorySettings["retention"] })}>Apply to all</Button>
        </Stack>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
          {CANDLE_HISTORY_FRAMES.map(frame => <RetentionLimit key={frame} label={frameLabels[frame]} value={draft.retention[frame]}
            change={value => change({ ...draft, retention: { ...draft.retention, [frame]: value } })} />)}
        </Box>
      </Stack>
      <Stack spacing={1}>
        <Typography variant="h6">Popular tickers</Typography>
        <FormControlLabel label="Update popular tickers every minute" control={<Switch checked={draft.popularMinuteUpdates}
          onChange={(_, enabled) => change({ ...draft, popularMinuteUpdates: enabled })} />} />
        <Typography variant="body2" color="text.secondary">
          Background updates {stored.minuteState}. One-time history and open charts work with the switch off.
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField label="Ticker symbol" size="small" value={ticker} onChange={event => setTicker(event.target.value)}
            onKeyDown={event => { if (event.key === "Enter") addTicker(); }} sx={{ width: 180 }} />
          <Button variant="outlined" disabled={!ticker.trim()} onClick={addTicker}>Add ticker</Button>
        </Stack>
        <Box sx={{ display: "flex", maxHeight: 180, overflowY: "auto", gap: 0.75, flexWrap: "wrap" }}>
          {draft.popularTickers.map(symbol => <Chip key={symbol} label={symbol} size="small"
            onDelete={() => change({ ...draft, popularTickers: draft.popularTickers.filter(value => value !== symbol) })} />)}
        </Box>
      </Stack>
      {projection ? <Alert severity="info">
        {numberFormat.format(projection.combined)} tickers · {numberFormat.format(projection.overlap)} in both groups ·
        {" "}{bytes(projection.estimatedBytes)} estimated at full coverage
      </Alert> : null}
      <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={() => void submit("POST")} disabled={pending || !dirty}>Preview storage</Button>
        <DashboardPrimaryAction onClick={() => void submit("PUT")} disabled={pending || !dirty}>Save settings</DashboardPrimaryAction>
      </Stack>
    </Stack>
  </DashboardPanel>;
}
