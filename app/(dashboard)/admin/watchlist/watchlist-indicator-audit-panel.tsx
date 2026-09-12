"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { DashboardPanel } from "@/app/dashboard-template";
import type { IndicatorAuditCoverage, IndicatorRefreshAudit } from "@/src/modules/watchlist/server/indicators/indicator-audit-store";

type History = { records: readonly IndicatorRefreshAudit[]; nextCursor: string | null; coverage: IndicatorAuditCoverage };
const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: "America/New_York" });
const time = (value: number | null | undefined) => value && Number.isFinite(value) ? `${formatter.format(value)} ET` : "—";
const label = (value: string | null | undefined) => value ? value.replaceAll("_", " ") : "—";
const endpoint = "/api/admin/watchlist/indicator-audit";

export default function WatchlistIndicatorAuditPanel() {
  const [history, setHistory] = useState<History | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, "loading" | "available" | "expired" | "unavailable">>({});
  const pending = useRef<AbortController | null>(null);
  const inputRequests = useRef(new Map<string, AbortController>());
  const load = useCallback(async (before?: string) => {
    if (pending.current) return;
    const controller = new AbortController(); pending.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15_000);
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${endpoint}?limit=50${before ? `&before=${encodeURIComponent(before)}` : ""}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) {
        if ([401, 403, 404].includes(response.status)) setHistory(null);
        throw Error("unavailable");
      }
      const next: History = await response.json();
      if (!Array.isArray(next.records) || !next.coverage || next.records.length > 50) throw Error("invalid");
      if (!controller.signal.aborted) { setHistory(next); setInputs({}); setExpandedRecord(null); }
    } catch { if (pending.current === controller) setError("Indicator audit could not be loaded. Try again."); }
    finally { clearTimeout(timeout); if (pending.current === controller) { pending.current = null; setLoading(false); } }
  }, []);
  useEffect(() => {
    void load();
    const requests = inputRequests.current;
    return () => { const request = pending.current; pending.current = null; request?.abort(); requests.forEach(request => request.abort()); requests.clear(); };
  }, [load]);
  const checkInputs = async (id: string) => {
    if (inputRequests.current.size > 0) return;
    const controller = new AbortController(); inputRequests.current.set(id, controller);
    const timeout = setTimeout(() => controller.abort(), 15_000);
    setInputs(current => ({ ...current, [id]: "loading" }));
    try {
      const response = await fetch(`${endpoint}?calculation=${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal });
      // Do not render thousands of raw candles into the admin page. The owner can export exact inputs.
      await response.body?.cancel();
      if (!controller.signal.aborted) setInputs(current => ({ ...current, [id]: response.status === 410 ? "expired" : response.ok ? "available" : "unavailable" }));
    } catch { if (inputRequests.current.get(id) === controller) setInputs(current => ({ ...current, [id]: "unavailable" })); }
    finally { clearTimeout(timeout); inputRequests.current.delete(id); }
  };
  const attempts = new Map(history?.records.flatMap(record => record.attempts.filter(event => event.transportId && event.kind !== "deferred").map(event => [event.transportId!, event] as const)) ?? []);
  return <section id="watchlist-indicator-audit" tabIndex={-1}>
    <DashboardPanel title="Indicator Audit">
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Button variant="outlined" disabled={loading} onClick={() => void load()}>Refresh</Button>
        <Button variant="outlined" disabled={loading || !history?.nextCursor} onClick={() => void load(history?.nextCursor ?? undefined)}>Older refreshes</Button>
      </Box>
      {loading && <Typography role="status">Loading audit…</Typography>}
      {error && <Typography role="alert">{error}</Typography>}
      {history && <>
        <Typography>{attempts.size} distinct provider requests in these {history.records.length} refresh records.</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>Indicators and shared candle consumers only; not account-wide provider usage.</Typography>
        <details><summary>Audit coverage</summary>
          <Typography variant="body2">Oldest retained record: {time(history.coverage.oldestRetainedAt)}. Up to {history.coverage.retentionDays} days, {history.coverage.metadataCapBytes / 1_000_000} MB of metadata and {history.coverage.snapshotCapBytes / 1_000_000} MB of calculation inputs, with {history.coverage.maxFilesPerCategory.toLocaleString()} files per category.</Typography>
          <Typography variant="body2">Dropped writes: {history.coverage.droppedWrites}. Expired records: {history.coverage.expiredMetadata}. Expired calculations: {history.coverage.expiredSnapshots}. Buffered events can be missing after a restart; filesystem overhead is not measured.</Typography>
        </details>
        {history.records.length === 0 && <Typography sx={{ mt: 2 }}>No indicator refresh records are retained yet.</Typography>}
        {history.records.map(record => <Box component="details" key={record.id} open={expandedRecord === record.id}
          onToggle={event => { const open = (event.currentTarget as HTMLDetailsElement).open; setExpandedRecord(current => open ? record.id : current === record.id ? null : current); }}
          sx={{ borderTop: "1px solid", borderColor: "divider", py: 1.5, mt: 1 }}>
          <summary>{record.symbol} · {time(record.queuedAt)} · {label(record.outcome)}</summary>
          {expandedRecord === record.id && <>
          <Typography variant="body2">Started: {time(record.startedAt)}. Finished: {time(record.finishedAt)}.</Typography>
          <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>Refresh: {record.id}. Runtime instance: {record.instanceId}. Activation: {record.activationId}.</Typography>
          {record.timeframes.map(frame => <Typography variant="body2" key={frame.timeframe} sx={{ my: 1 }}>
            {frame.timeframe === "1d" ? "Daily" : frame.timeframe}: {label(frame.provider)} · Moomoo: {label(frame.primaryOutcome)} · Yahoo fallback: {label(frame.fallbackOutcome)} · {frame.acceptedBars} accepted bars · Through {time(frame.through)} · {frame.missingMinutes} unknown missing minutes · Missing volume: {frame.missingVolumeBars ?? "not recorded"} · {frame.excludedBars} excluded bars · Revision {frame.calculationRevision ?? "—"}
            {frame.rebuildReason ? ` · Rebuild: ${label(frame.rebuildReason)}` : ""}{frame.correctedBars !== undefined ? ` · Corrected: ${frame.correctedBars}` : ""}{frame.gapReset ? " · Restarted warm-up after an unknown gap" : ""}
          </Typography>)}
          <details><summary>Provider requests and retries</summary>
            {record.attempts.length === 0 ? <Typography variant="body2">No provider transport events recorded for this refresh.</Typography> : record.attempts.map((event, index) => <Typography variant="body2" key={`${event.transportId}:${event.kind}:${index}`} sx={{ my: 1, overflowWrap: "anywhere" }}>
              {time(event.at)} · {label(event.provider)} · {label(event.kind)} · {label(event.outcome)}{event.httpStatus ? ` · HTTP ${event.httpStatus}` : ""}{event.elapsedMs !== undefined ? ` · ${event.elapsedMs} ms` : ""}{event.retryAt ? ` · Retry at ${time(event.retryAt)}` : ""}{event.retryAfterMs !== undefined ? ` · Provider Retry-After ${event.retryAfterMs} ms` : ""} · Request {event.transportId ?? "not sent"}
            </Typography>)}
          </details>
          {record.calculationId ? <Box sx={{ mt: 1 }}>
            <Button disabled={Object.values(inputs).includes("loading")} onClick={() => void checkInputs(record.calculationId!)}>Check calculation inputs</Button>
            {inputs[record.calculationId] === "available" && <Button component="a" href={`${endpoint}?calculation=${encodeURIComponent(record.calculationId)}`} download>Export calculation JSON</Button>}
            {inputs[record.calculationId] === "expired" && <Typography>Calculation inputs no longer retained.</Typography>}
            {inputs[record.calculationId] === "unavailable" && <Typography>Calculation inputs could not be checked. Try again.</Typography>}
          </Box> : <Typography variant="body2">No calculation was produced by this refresh.</Typography>}
          </>}
        </Box>)}
      </>}
    </DashboardPanel>
  </section>;
}
