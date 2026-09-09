"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Alert, Box, Button, Chip, Dialog, DialogContent, DialogTitle, LinearProgress, Stack, TextField, Typography } from "@mui/material";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import type { SavedCandle } from "./saved-market-data-chart";
import { DashboardPanel } from "@/app/dashboard-template";
const SavedMarketDataChart = dynamic(() => import("./saved-market-data-chart").then((module) => module.SavedMarketDataChart), { ssr: false });

type Session = {
  symbol: string; date: string; bars: number; firstTime: number | null; lastTime: number | null;
  coverageEnd: string | null; retrievedAt: string | null; lastAttempt: string | null;
  requestedStart: string | null; requestedEnd: string | null;
  failure: string | null; candles?: SavedCandle[];
  attempts: { at: string; outcome: string; message: string | null }[];
};
const endpoint = "/api/platform/owner-market-data";
const time = (value: number | string | null) => value === null ? "—" : new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false,
}).format(new Date(typeof value === "number" ? value * 1000 : value));
const split = (value: string) => [...new Set(value.trim().split(/[\s,;]+/u).filter(Boolean))];
async function json(response: Response) {
  let result;
  try { result = await response.json(); }
  catch { throw new Error("The application returned an unreadable response. Refresh the inventory to check whether the request was saved."); }
  if (!result || typeof result !== "object") throw new Error("The application returned an unexpected response.");
  if (!response.ok) throw new Error(result.message ?? "The application request failed.");
  return result;
}

export function OwnerMarketDataClient() {
  const [symbols, setSymbols] = useState("");
  const [dates, setDates] = useState("");
  const [filter, setFilter] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const [results, setResults] = useState<{ label: string; ok: boolean; message: string }[]>([]);
  const [chart, setChart] = useState<Session | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const stop = useRef(false);
  const inFlight = useRef(false);
  const inventoryRequest = useRef(0);
  const latestRefresh = useRef<() => Promise<void>>(async () => {});
  const refresh = useCallback(async () => {
    const requestNumber = ++inventoryRequest.current;
    setLoading(true);
    try {
      const query = new URLSearchParams({ offset: String(offset) });
      if (filter.trim()) query.set("symbol", filter.trim().toUpperCase());
      if (filterDate) query.set("date", filterDate);
      const result = await json(await fetch(`${endpoint}?${query}`, { cache: "no-store" }));
      if (requestNumber === inventoryRequest.current) setSessions(result.sessions);
    } catch (failure) { if (requestNumber === inventoryRequest.current) setError(failure instanceof Error ? failure.message : "Could not read saved sessions."); }
    finally { if (requestNumber === inventoryRequest.current) setLoading(false); }
  }, [filter, filterDate, offset]);
  useEffect(() => {
    latestRefresh.current = refresh;
    const timer = setTimeout(() => { void refresh(); }, 350);
    return () => { clearTimeout(timer); inventoryRequest.current += 1; };
  }, [refresh]);
  useEffect(() => () => { stop.current = true; }, []);

  async function run() {
    if (inFlight.current) return;
    const tickers = split(symbols.toUpperCase());
    const days = split(dates);
    if (!tickers.length || !days.length || tickers.some((symbol) => !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol)) ||
      days.some((date) => !/^\d{4}-\d{2}-\d{2}$/u.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date)) {
      setError("Enter ticker symbols and valid dates in YYYY-MM-DD format."); return;
    }
    inFlight.current = true; stop.current = false; setRunning(true); setError(""); setResults([]);
    let done = 0;
    const total = tickers.length * days.length;
    try {
      for (const date of days) for (const symbol of tickers) {
        if (stop.current) return;
        const label = `${symbol} · ${date}`;
        setProgress({ done, total, current: label });
        try {
          const result = await json(await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" }, body: JSON.stringify({ symbol, date }) }));
          setResults((prior) => [...prior, { label, ok: result.ok, message: result.message }]);
        } catch (failure) {
          setResults((prior) => [...prior, { label, ok: false, message: failure instanceof Error ? failure.message : "The application could not reach the server. Refresh inventory to check whether this request was saved." }]);
        }
        done += 1; setProgress({ done, total, current: "" });
        await latestRefresh.current();
      }
    } finally { inFlight.current = false; setRunning(false); }
  }
  async function openChart(session: Session) {
    setChartLoading(true); setError("");
    try {
      const result = await json(await fetch(`${endpoint}?${new URLSearchParams({ symbol: session.symbol, date: session.date })}`, { cache: "no-store" }));
      const saved = result.sessions[0] as Session | undefined;
      if (!saved?.candles?.length) throw new Error("No saved candles are available for this session.");
      setChart(saved);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not open saved chart."); }
    finally { setChartLoading(false); }
  }
  return <Stack spacing={3}>
    <Typography variant="h4" component="h1">Market Data</Typography>
    <DashboardPanel><Box component="form" onSubmit={(event) => { event.preventDefault(); void run(); }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h6">Request candles</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="Ticker symbols" placeholder="SCKT, JWEL" value={symbols} disabled={running} onChange={(event) => setSymbols(event.target.value)} />
          <TextField fullWidth multiline minRows={2} label="Dates" placeholder="2026-08-10" helperText="YYYY-MM-DD. Separate multiple dates with commas or new lines." value={dates} disabled={running} onChange={(event) => setDates(event.target.value)} />
        </Stack>
        <Typography color="text.secondary" variant="body2">Each ticker is requested for every date: 1-minute candles, 04:00–20:00 New York, including extended hours. Inactive minutes remain gaps.</Typography>
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={running}>Request candles</Button>
          {running && <Button onClick={() => { stop.current = true; }}>Stop after current request</Button>}
        </Stack>
        {running && <Box role="status"><Typography>{progress.done} of {progress.total} finished · {progress.current}</Typography><LinearProgress variant="determinate" value={progress.total ? progress.done / progress.total * 100 : 0} /></Box>}
      </Stack>
    </Box></DashboardPanel>
    {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
    {!!results.length && <Stack spacing={1} aria-live="polite">{results.map((result) => <Alert key={result.label} severity={result.ok ? "success" : "error"}>{result.label}: {result.message}</Alert>)}</Stack>}
    <Stack spacing={2}>
      <Typography component="h2" variant="h6">Saved sessions</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField size="small" label="Filter ticker" value={filter} onChange={(event) => { setOffset(0); setFilter(event.target.value); }} />
        <TextField size="small" type="date" label="Filter date" slotProps={{ inputLabel: { shrink: true } }} value={filterDate} onChange={(event) => { setOffset(0); setFilterDate(event.target.value); }} />
        <Button onClick={() => void refresh()} disabled={loading}>Refresh inventory</Button>
      </Stack>
      {loading && <LinearProgress aria-label="Loading inventory" />}
      {!loading && !sessions.length && <Typography color="text.secondary">No saved sessions match these filters.</Typography>}
      {sessions.map((session) => <Box key={`${session.symbol}-${session.date}`} sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
          <Stack spacing={1}>
            <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>{session.symbol} · {session.date}</Typography>
            <Stack direction="row" spacing={1}><Chip size="small" label={`${session.bars} candles`} /><Chip size="small" label="1 minute" /></Stack>
            <Typography variant="body2">Saved candles: {time(session.firstTime)}–{time(session.lastTime)} New York</Typography>
            <Typography variant="body2" color="text.secondary">Request window: {time(session.requestedStart)}–{time(session.requestedEnd)} · Coverage through {time(session.coverageEnd)}</Typography>
            {session.lastAttempt && <Typography variant="body2" color="text.secondary">Last attempt: {new Date(session.lastAttempt).toLocaleString()}</Typography>}
          </Stack>
          <Button variant="outlined" disabled={!session.bars || chartLoading} onClick={() => void openChart(session)}>Open chart</Button>
        </Stack>
        {session.failure && <Alert severity="warning" sx={{ mt: 2 }}>{session.failure}{session.bars > 0 ? " Saved candles remain available." : ""}</Alert>}
        <Box component="details" sx={{ mt: 2 }}><Typography component="summary" sx={{ cursor: "pointer" }}>Request history (latest 20)</Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>{session.attempts.map((attempt, index) => <Typography variant="body2" key={`${attempt.at}-${index}`}>{new Date(attempt.at).toLocaleString()}: {attempt.message ?? (attempt.outcome === "ready" ? "Candles saved." : "Request unavailable.")}</Typography>)}</Stack>
        </Box>
      </Box>)}
      <Stack direction="row" spacing={1}><Button disabled={!offset || loading} onClick={() => setOffset(Math.max(0, offset - 100))}>Previous</Button><Button disabled={sessions.length < 100 || loading} onClick={() => setOffset(offset + 100)}>Next</Button></Stack>
    </Stack>
    <Dialog open={chart !== null} onClose={() => setChart(null)} maxWidth="lg" fullWidth>
      <DialogTitle>{chart?.symbol} · {chart?.date}<Button sx={{ float: "right" }} onClick={() => setChart(null)}>Close</Button></DialogTitle>
      <DialogContent><Typography variant="body2" sx={{ mb: 2 }}>{chart?.bars} saved candles · New York time · Stock price per share</Typography>{chart?.candles && <SavedMarketDataChart candles={chart.candles} />}</DialogContent>
    </Dialog>
  </Stack>;
}
