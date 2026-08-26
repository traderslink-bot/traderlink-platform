"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  DashboardMetricCard,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "@/app/dashboard-template";

type RecordValue = Record<string, unknown>;
type Section = "watchlist" | "providers" | "ai" | "website" | "status";

const SECTIONS: readonly Readonly<{ id: Section; label: string }>[] = Object.freeze([
  { id: "watchlist", label: "Watchlist" },
  { id: "providers", label: "Market Data Providers" },
  { id: "ai", label: "AI Controls" },
  { id: "website", label: "Live Website Controls" },
  { id: "status", label: "Runtime Status" },
]);

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown): RecordValue {
  return isRecord(value) ? value : {};
}

function list(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown, fallback = "Unavailable"): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function boolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function usd(value: unknown): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(number(value));
}

function timestamp(value: unknown): string {
  const milliseconds = number(value, Number.NaN);
  return Number.isFinite(milliseconds)
    ? new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(new Date(milliseconds))
    : "No market-data timestamp yet";
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return <Box><Typography color="text.secondary" variant="caption">{label}</Typography><Typography sx={{ fontWeight: 750 }} variant="body2">{value}</Typography></Box>;
}

export function WatchlistRuntimeAdminClient() {
  const [section, setSection] = useState<Section>("watchlist");
  const [snapshot, setSnapshot] = useState<RecordValue | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("");
  const [note, setNote] = useState("");
  const [watchlistGroup, setWatchlistGroup] = useState("main");
  const [historicalProvider, setHistoricalProvider] = useState("");
  const [liveProvider, setLiveProvider] = useState("");
  const [model, setModel] = useState("gpt-5.6-terra");
  const [reasoningEffort, setReasoningEffort] = useState("medium");
  const [budget, setBudget] = useState("1.00");
  const [budgetEnabled, setBudgetEnabled] = useState(false);
  const [externalResearch, setExternalResearch] = useState(false);
  const [boundaryRefreshes, setBoundaryRefreshes] = useState({ enabled: false, maxPerTickerPerNewYorkDate: 2 });
  const [generation, setGeneration] = useState({ enabled: false, premarketEnabled: false, regularEnabled: false, postmarketEnabled: false, topRegularActivationEnabled: false });

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/admin/watchlist/runtime", { cache: "no-store" });
      const payload = await response.json() as unknown;
      if (!isRecord(payload)) throw new Error("The Watchlist runtime response was invalid.");
      setSnapshot(payload);
      if (!response.ok) {
        const runtimeFailure = record(record(record(payload).snapshot).runtime);
        setError(text(record(runtimeFailure.body).error, "The private Watchlist runtime is unavailable."));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The Watchlist runtime is unavailable.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const runAction = useCallback(async (action: string, payload: RecordValue, success: string) => {
    setPending(action); setNotice(null); setError(null);
    try {
      const response = await fetch("/api/admin/watchlist/runtime", {
        body: JSON.stringify({ action, payload }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const result = await response.json() as unknown;
      if (!response.ok) throw new Error(text(record(result).error, "The Watchlist runtime could not apply that change."));
      setNotice(success);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The Watchlist runtime could not apply that change.");
    } finally { setPending(null); }
  }, [refresh]);

  const source = record(snapshot?.snapshot);
  const runtimeResponse = record(source.runtime);
  const watchlistResponse = record(source.watchlist);
  const auditResponse = record(source.audit);
  const runtime = record(runtimeResponse.body);
  const watchlist = record(watchlistResponse.body);
  const audit = record(auditResponse.body);
  const health = record(runtime.runtimeHealth);
  const cost = record(runtime.aiReadCostSummary);
  const today = record(cost.windows).today ? record(record(cost.windows).today) : {};
  const allTime = record(cost.windows).allTime ? record(record(cost.windows).allTime) : {};
  const auditSummary = record(audit.summary);
  const auditByOutcome = record(auditSummary.byOutcome);
  const runtimeConfig = record(runtime.runtimeConfig);
  const activeEntries = list(watchlist.activeEntries).map(record);
  const available = boolean(snapshot?.available);

  useEffect(() => {
    if (!snapshot) return;
    setHistoricalProvider(text(runtimeConfig.historicalProvider, ""));
    setLiveProvider(text(runtimeConfig.liveProvider, ""));
    setModel(text(runtime.aiReadModel, "gpt-5.6-terra"));
    setReasoningEffort(text(runtime.aiReadReasoningEffort, "medium"));
    const currentBudget = record(runtime.aiReadDailyCostBudget);
    setBudgetEnabled(boolean(currentBudget.enabled));
    setBudget(String(number(currentBudget.dailyLimitUsd, 1)));
    setExternalResearch(boolean(runtime.aiReadExternalResearchEnabled));
    const currentBoundaryRefreshes = record(health.tradersLinkAiReadBoundaryRefreshSettings);
    setBoundaryRefreshes({
      enabled: boolean(currentBoundaryRefreshes.enabled),
      maxPerTickerPerNewYorkDate: number(currentBoundaryRefreshes.maxPerTickerPerNewYorkDate, 2),
    });
    const currentGeneration = record(health.tradersLinkAiReadGenerationSettings);
    setGeneration({
      enabled: boolean(currentGeneration.enabled), premarketEnabled: boolean(currentGeneration.premarketEnabled), regularEnabled: boolean(currentGeneration.regularEnabled), postmarketEnabled: boolean(currentGeneration.postmarketEnabled), topRegularActivationEnabled: boolean(currentGeneration.topRegularActivationEnabled),
    });
  }, [
    health.tradersLinkAiReadBoundaryRefreshSettings,
    health.tradersLinkAiReadGenerationSettings,
    runtime.aiReadDailyCostBudget,
    runtime.aiReadExternalResearchEnabled,
    runtime.aiReadModel,
    runtime.aiReadReasoningEffort,
    runtimeConfig.historicalProvider,
    runtimeConfig.liveProvider,
    snapshot,
  ]);

  const providerChoices = useMemo(() => list(runtimeConfig.availableHistoricalProviders).map((entry) => text(entry, "")).filter(Boolean), [runtimeConfig.availableHistoricalProviders]);
  const liveProviderChoices = useMemo(() => list(runtimeConfig.availableLiveProviders).map((entry) => text(entry, "")).filter(Boolean), [runtimeConfig.availableLiveProviders]);
  const publishingActive = text(runtime.startupState, "") === "ready" && boolean(health.isStarted);

  return (
    <Stack spacing={2.5}>
      <Box><Typography component="h1" variant="h1">Watchlist Admin</Typography></Box>
      {error ? <Alert severity="warning">{error}</Alert> : null}
      {notice ? <Alert severity="success">{notice}</Alert> : null}
      <Grid container spacing={1.5}>
        {[
          ["Today spend", usd(today.estimatedTotalCostUsd)], ["API requests", String(number(today.requestCount))], ["Tickers", String(number(today.tickerCount))], ["Average / request", usd(number(today.requestCount) ? number(today.estimatedTotalCostUsd) / number(today.requestCount) : 0)], ["Web searches", String(number(today.webSearchCallCount))], ["Unpriced requests", String(number(today.unpricedRequestCount))], ["All-time spend", usd(allTime.estimatedTotalCostUsd)], ["Accounting", boolean(record(cost.accountingHealth).healthy, true) ? "Healthy" : "Needs attention"],
        ].map(([label, value]) => <Grid key={label} size={{ xs: 6, sm: 4, md: 3 }}><DashboardMetricCard caption="AI Read API costs" label={label} value={value} /></Grid>)}
      </Grid>
      <Grid container spacing={1.5}>
        {[["Showing", auditSummary.eventCount], ["Published", auditByOutcome.published], ["Needs attention", number(auditByOutcome.failed) + number(auditByOutcome.missing) + number(auditByOutcome.deferred)], ["Failed", auditByOutcome.failed], ["Missing", auditByOutcome.missing], ["Requests", auditByOutcome.request_started]].map(([label, value]) => <Grid key={String(label)} size={{ xs: 6, sm: 4, md: 2 }}><DashboardMetricCard caption="AI Read operations" label={String(label)} value={String(number(value))} /></Grid>)}
      </Grid>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexWrap: "wrap" }}>
        {SECTIONS.map((item) => <Button key={item.id} onClick={() => setSection(item.id)} variant={section === item.id ? "contained" : "outlined"}>{item.label}</Button>)}
        <DashboardSecondaryAction disabled={pending !== null} onClick={() => void refresh()}>Refresh</DashboardSecondaryAction>
      </Stack>
      {!available ? <Alert severity="info">Controls will become available after the private Railway runtime URL and access token are configured for this Dashboard environment.</Alert> : null}
      {section === "watchlist" ? <Stack spacing={2.5}>
        <DashboardPanel title="Add a ticker">
          <Stack component="form" direction={{ xs: "column", md: "row" }} spacing={1.25} onSubmit={(event) => { event.preventDefault(); if (symbol.trim()) void runAction("activate", { symbol: symbol.trim().toUpperCase(), note, watchlistGroup }, `Added ${symbol.trim().toUpperCase()} to the Watchlist.`).then(() => { setSymbol(""); setNote(""); }); }}>
            <TextField label="Ticker" onChange={(event) => setSymbol(event.target.value.toUpperCase())} required value={symbol} />
            <TextField label="Notes" onChange={(event) => setNote(event.target.value)} value={note} sx={{ flex: 1 }} />
            <Select aria-label="Watchlist group" onChange={(event) => setWatchlistGroup(event.target.value)} value={watchlistGroup}><MenuItem value="top_regular">Top Regular Hour</MenuItem><MenuItem value="main">Main Session</MenuItem><MenuItem value="postmarket">Post-Market</MenuItem></Select>
            <DashboardPrimaryAction disabled={!available || pending !== null} type="submit">Add ticker</DashboardPrimaryAction>
          </Stack>
        </DashboardPanel>
        <DashboardPanel title="Active tickers">
          {activeEntries.length ? <Stack divider={<Divider flexItem />} spacing={0}>{activeEntries.map((entry) => <Stack key={text(entry.symbol)} direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ alignItems: { md: "center" }, justifyContent: "space-between", py: 1.5 }}><Box><Typography sx={{ fontWeight: 800 }}>{text(entry.symbol)}</Typography><Typography color="text.secondary" variant="body2">{text(entry.note, "No notes")} · {text(entry.watchlistGroup, "Main Session")}</Typography></Box><Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}><DashboardSecondaryAction disabled={!available || pending !== null} onClick={() => void runAction("refreshLevels", { symbol: text(entry.symbol, "") }, `Refreshing levels for ${text(entry.symbol)}.`)}>Refresh levels</DashboardSecondaryAction><DashboardSecondaryAction disabled={!available || pending !== null} onClick={() => void runAction("repostSnapshot", { symbol: text(entry.symbol, "") }, `Reposting the latest snapshot for ${text(entry.symbol)}.`)}>Repost</DashboardSecondaryAction><Button color="error" disabled={!available || pending !== null} onClick={() => void runAction("deactivate", { symbol: text(entry.symbol, "") }, `${text(entry.symbol)} was removed from active monitoring.`)} variant="outlined">Deactivate</Button></Stack></Stack>)}</Stack> : <Typography color="text.secondary">No active tickers are currently being monitored.</Typography>}
        </DashboardPanel>
      </Stack> : null}
      {section === "providers" ? <DashboardPanel title="Market Data Providers"><Stack spacing={2}><Typography color="text.secondary" variant="body2">Moomoo is used separately for the Dashboard AI Read same-session candle path. The controls below show only providers this runtime can actually switch.</Typography><Stack direction={{ xs: "column", md: "row" }} spacing={1.25}><Box sx={{ minWidth: 240 }}><InputLabel id="historical-provider-label">Historical candles</InputLabel><Select fullWidth labelId="historical-provider-label" onChange={(event) => setHistoricalProvider(event.target.value)} value={historicalProvider}>{providerChoices.map((choice) => <MenuItem key={choice} value={choice}>{choice.toUpperCase()}</MenuItem>)}</Select></Box><DashboardPrimaryAction disabled={!available || pending !== null || !historicalProvider} onClick={() => void runAction("historicalProvider", { historicalProvider }, "Historical candle provider saved.")}>Apply</DashboardPrimaryAction><Box sx={{ minWidth: 240 }}><InputLabel id="live-provider-label">Live price</InputLabel><Select fullWidth labelId="live-provider-label" onChange={(event) => setLiveProvider(event.target.value)} value={liveProvider}>{liveProviderChoices.map((choice) => <MenuItem key={choice} value={choice}>{choice.toUpperCase()}</MenuItem>)}</Select></Box><DashboardPrimaryAction disabled={!available || pending !== null || !liveProvider} onClick={() => void runAction("liveProvider", { liveProvider }, "Live-price provider saved.")}>Apply</DashboardPrimaryAction></Stack><Card variant="outlined"><CardContent><LabelValue label="Market-data freshness" value={timestamp(health.lastPriceUpdateAt)} /><Typography color="text.secondary" variant="body2">{text(health.lastPriceUpdateSymbol, "No ticker has reported a price update yet.")}</Typography></CardContent></Card></Stack></DashboardPanel> : null}
      {section === "ai" ? <Stack spacing={2.5}><DashboardPanel title="TradersLink AI Read"><Stack spacing={2}><Stack direction={{ xs: "column", md: "row" }} spacing={1.25}><Select aria-label="AI Read model" onChange={(event) => setModel(event.target.value)} value={model}><MenuItem value="gpt-5.6-luna">Luna</MenuItem><MenuItem value="gpt-5.6-terra">Terra</MenuItem></Select><Select aria-label="Reasoning effort" onChange={(event) => setReasoningEffort(event.target.value)} value={reasoningEffort}>{["low", "medium", "high", "xhigh"].map((effort) => <MenuItem key={effort} value={effort}>{effort}</MenuItem>)}</Select><DashboardPrimaryAction disabled={!available || pending !== null} onClick={() => void runAction("aiReadModel", { model, reasoningEffort }, "AI Read model saved.")}>Apply model</DashboardPrimaryAction></Stack><FormControlLabel control={<Switch checked={generation.enabled} onChange={(event) => setGeneration({ ...generation, enabled: event.target.checked })} />} label="AI Read generation" /><Stack direction={{ xs: "column", sm: "row" }}><FormControlLabel control={<Switch checked={generation.premarketEnabled} disabled={!generation.enabled} onChange={(event) => setGeneration({ ...generation, premarketEnabled: event.target.checked })} />} label="Premarket" /><FormControlLabel control={<Switch checked={generation.regularEnabled} disabled={!generation.enabled} onChange={(event) => setGeneration({ ...generation, regularEnabled: event.target.checked })} />} label="Regular Hours" /><FormControlLabel control={<Switch checked={generation.postmarketEnabled} disabled={!generation.enabled} onChange={(event) => setGeneration({ ...generation, postmarketEnabled: event.target.checked })} />} label="Post-Market" /></Stack><DashboardPrimaryAction disabled={!available || pending !== null} onClick={() => void runAction("aiReadGeneration", generation, "AI Read session controls saved.")}>Save AI Read sessions</DashboardPrimaryAction><FormControlLabel control={<Switch checked={externalResearch} onChange={(event) => setExternalResearch(event.target.checked)} />} label="External catalyst, SEC, and web research" /><DashboardPrimaryAction disabled={!available || pending !== null} onClick={() => void runAction("aiReadExternalResearch", { enabled: externalResearch }, "External AI research saved.")}>Save research setting</DashboardPrimaryAction><Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ alignItems: { md: "center" } }}><FormControlLabel control={<Switch checked={budgetEnabled} onChange={(event) => setBudgetEnabled(event.target.checked)} />} label="Daily AI spend guard" /><TextField label="Daily budget (USD)" onChange={(event) => setBudget(event.target.value)} slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }} type="number" value={budget} /><DashboardPrimaryAction disabled={!available || pending !== null} onClick={() => void runAction("aiReadCostBudget", { enabled: budgetEnabled, dailyLimitUsd: Number(budget) }, "AI Read daily spend guard saved.")}>Apply budget</DashboardPrimaryAction></Stack><Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ alignItems: { md: "center" } }}><FormControlLabel control={<Switch checked={boundaryRefreshes.enabled} onChange={(event) => setBoundaryRefreshes({ ...boundaryRefreshes, enabled: event.target.checked })} />} label="Automatic boundary refreshes" /><TextField label="Per ticker per NY date" onChange={(event) => setBoundaryRefreshes({ ...boundaryRefreshes, maxPerTickerPerNewYorkDate: Number(event.target.value) })} slotProps={{ htmlInput: { min: 0, max: 1000, step: 1 } }} type="number" value={boundaryRefreshes.maxPerTickerPerNewYorkDate} /><DashboardPrimaryAction disabled={!available || pending !== null} onClick={() => void runAction("aiReadBoundaryRefreshes", boundaryRefreshes, "Automatic boundary refreshes saved.")}>Apply refresh limit</DashboardPrimaryAction></Stack></Stack></DashboardPanel></Stack> : null}
      {section === "website" ? <Stack spacing={2.5}><DashboardPanel title="Live website controls"><Stack spacing={1.5}>{[["liveTraderReadCard", "Show Trader Read card", health.liveTraderReadCardVisible], ["potentialGainCard", "Show Potential Gain card", health.potentialGainCardVisible], ["lifecycleLabels", "Show Watchlist lifecycle labels", health.watchlistLifecycleLabelsVisible], ["reversalWatchlist", "Show Reversal Watchlist", health.reversalWatchlistVisible], ["topRegularWatchlist", "Show Top Regular Hour Watchlist", health.topRegularWatchlistVisible]].map(([action, label, visible]) => <FormControlLabel key={String(action)} control={<Switch checked={boolean(visible, action !== "lifecycleLabels")} disabled={!available || pending !== null} onChange={(event) => void runAction(String(action), { visible: event.target.checked }, `${String(label)} updated.`)} />} label={String(label)} />)}</Stack></DashboardPanel><DashboardPanel title="Deterministic Day Trade Adapter"><FormControlLabel control={<Switch checked={boolean(record(health.dayTradeAdapter).enabled)} disabled={!available || pending !== null} onChange={(event) => void runAction("dayTradeAdapter", { enabled: event.target.checked }, "Day Trade Adapter updated.")} />} label="Enable deterministic Day Trade Adapter" /></DashboardPanel></Stack> : null}
      {section === "status" ? <Stack spacing={2.5}><DashboardPanel title="Runtime status"><Grid container spacing={1.5}>{[["Runtime", text(runtime.startupState)], ["Publishing", publishingActive ? "Active" : "Paused"], ["Active tickers", String(number(runtime.activeSymbolCount))], ["Historical candles", text(runtime.providerName)], ["Live price", text(runtimeConfig.liveProvider)], ["Market-data freshness", timestamp(health.lastPriceUpdateAt)]].map(([label, value]) => <Grid key={label} size={{ xs: 6, md: 4 }}><LabelValue label={label} value={value} /></Grid>)}</Grid></DashboardPanel><DashboardPanel title="Provider health"><Stack spacing={1}>{Object.entries(record(health.providerHealth)).map(([key, value]) => <LabelValue key={key} label={key} value={typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "Available"} />)}{Object.keys(record(health.providerHealth)).length === 0 ? <Typography color="text.secondary">Provider-health details will appear when the runtime reports them.</Typography> : null}</Stack></DashboardPanel></Stack> : null}
    </Stack>
  );
}
