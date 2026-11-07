"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme, type SxProps, type Theme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import type { Time } from "lightweight-charts";
import { aggregateCandles, CHART_TIMEFRAMES, type Candle, type ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";

const easternTime = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const easternTick = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });

export function AlpacaLightweightChart({ symbol, sx }: { symbol: string; sx?: SxProps<Theme> }) {
  const ticker = symbol.split(":").at(-1)!;
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const container = useRef<HTMLDivElement>(null);
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1m");
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Loading candles…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let disposed = false, source: EventSource | undefined, removeChart: (() => void) | undefined;
    const abort = new AbortController();
    setStatus("Loading candles…"); setError(null);
    async function start() {
      const { createChart, CandlestickSeries, HistogramSeries, ColorType } = await import("lightweight-charts");
      if (disposed) return;
      const chart = createChart(element!, {
        autoSize: true,
        layout: { background: { type: ColorType.Solid, color: dark ? "#101722" : "#ffffff" }, textColor: dark ? "#c7d2df" : "#354358", fontSize: 11, attributionLogo: true },
        grid: { vertLines: { color: dark ? "#1d2939" : "#eef1f5" }, horzLines: { color: dark ? "#1d2939" : "#eef1f5" } },
        timeScale: { timeVisible: timeframe !== "1D", secondsVisible: false, rightOffset: 4, tickMarkFormatter: (time: Time) => typeof time === "number" ? (timeframe === "1D" ? new Date(time * 1000).toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" }) : easternTick.format(new Date(time * 1000))) : String(time) },
        localization: { timeFormatter: (time: Time) => typeof time === "number" ? easternTime.format(new Date(time * 1000)) + " ET" : String(time) },
      });
      removeChart = () => chart.remove();
      const candles = chart.addSeries(CandlestickSeries, { upColor: "#16a085", downColor: "#e45757", borderVisible: false, wickUpColor: "#16a085", wickDownColor: "#e45757", priceFormat: { type: "price", precision: 4, minMove: 0.0001 } });
      const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false }, 1);
      chart.panes()[0].setStretchFactor(4); chart.panes()[1].setStretchFactor(1);
      const bars = new Map<number, Candle>();
      const queued = new Map<number, Candle>();
      let loaded = false, loading = false, reloadAfter = false, connected = false;
      type Stamp = import("lightweight-charts").UTCTimestamp;
      const point = (bar: Candle) => ({ ...bar, time: bar.time as Stamp });
      const volumePoint = (bar: Candle) => ({ time: bar.time as Stamp, value: bar.volume, color: bar.close >= bar.open ? "#16a08580" : "#e4575780" });
      const writeAll = (initial: boolean) => {
        const data = aggregateCandles(bars.values(), timeframe);
        const range = chart.timeScale().getVisibleLogicalRange();
        candles.setData(data.map(point)); volume.setData(data.map(volumePoint));
        if (initial) chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, data.length - 100), to: data.length + 4 });
        else if (range) chart.timeScale().setVisibleLogicalRange(range);
      };
      const loadHistory = async () => {
        if (loading) { reloadAfter = true; return; }
        loading = true;
        try {
          const response = await fetch(`/api/screeners/charts/bars?symbol=${encodeURIComponent(ticker)}&daily=${timeframe === "1D" ? "1" : "0"}`, { signal: abort.signal, credentials: "same-origin" });
          if (!response.ok) throw Error(response.status === 429 ? "Chart requests are busy. Try again shortly." : "Candles unavailable. Try again.");
          const data = await response.json();
          if (disposed) return;
          const initial = !loaded;
          bars.clear();
          for (const bar of data.bars as Candle[]) bars.set(bar.time, bar);
          for (const bar of queued.values()) bars.set(bar.time, bar);
          queued.clear(); loaded = true;
          const latest = [...bars.values()].at(-1);
          candles.applyOptions({ priceFormat: { type: "price", precision: latest && latest.close < 1 ? 4 : 2, minMove: latest && latest.close < 1 ? 0.0001 : 0.01 } });
          writeAll(initial); setError(null);
          setStatus(bars.size ? connected ? "Alpaca SIP · Connected · ET" : "Alpaca SIP · ET" : "No candles for this symbol.");
        } catch (failure) { if (!disposed) setError(failure instanceof Error ? failure.message : "Candles unavailable."); }
        finally { loading = false; if (reloadAfter && !disposed) { reloadAfter = false; void loadHistory(); } }
      };
      source = new EventSource(`/api/screeners/charts/stream?symbol=${encodeURIComponent(ticker)}`);
      source.addEventListener("status", event => {
        if (disposed) return;
        const state = JSON.parse((event as MessageEvent).data).state;
        const wasConnected = connected; connected = state === "connected";
        if (connected && !wasConnected && loaded) void loadHistory();
        if (loaded) setStatus(`Alpaca SIP · ${connected ? "Connected" : state === "unavailable" ? "Feed unavailable" : "Connecting"} · ET`);
      });
      source.addEventListener("bar", event => {
        if (disposed) return;
        const message = JSON.parse((event as MessageEvent).data) as { bar: Candle; daily: boolean };
        if (message.daily !== (timeframe === "1D")) return;
        const bar = message.bar;
        if (!loaded || loading) queued.set(bar.time, bar);
        if (!loaded) return;
        bars.set(bar.time, bar);
        while (bars.size > 12000) bars.delete(Math.min(...bars.keys()));
        const data = aggregateCandles(bars.values(), timeframe);
        const bucket = timeframe === "1D" ? bar.time : Math.floor(bar.time / ({ "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400 }[timeframe])) * ({ "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400 }[timeframe]);
        const update = data.find(item => item.time === bucket);
        if (!update) return;
        // Corrected old bars may insert a missing bucket: replace only then.
        const last = candles.data().at(-1);
        if (last && bucket < Number(last.time) && !candles.data().some(item => Number(item.time) === bucket)) writeAll(false);
        else { candles.update(point(update), last ? bucket < Number(last.time) : false); volume.update(volumePoint(update), last ? bucket < Number(last.time) : false); }
      });
      source.onerror = () => { if (!disposed && loaded) setStatus("Alpaca SIP · Reconnecting · ET"); };
      await loadHistory();
    }
    void start().catch(() => { if (!disposed) setError("Chart could not load. Try again."); });
    return () => { disposed = true; abort.abort(); source?.close(); removeChart?.(); };
  }, [ticker, timeframe, attempt, dark]);

  return <Box data-alpaca-chart={ticker} sx={[{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }, ...(Array.isArray(sx) ? sx : [sx])]}>
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.25, px: 0.5, minHeight: 27, flexWrap: "wrap" }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, mr: 0.5 }}>{ticker}</Typography>
      {CHART_TIMEFRAMES.map(value => <Button key={value} size="small" aria-label={`${ticker} ${value} candles`} aria-pressed={timeframe === value} onClick={() => setTimeframe(value)} sx={{ minWidth: 26, p: "2px 4px", fontSize: 10, bgcolor: timeframe === value ? "action.selected" : undefined }}>{value}</Button>)}
      <Typography role="status" sx={{ ml: "auto", fontSize: 10, color: "text.secondary" }}>{status}</Typography>
    </Stack>
    {error ? <Stack role="alert" direction="row" sx={{ alignItems: "center", px: 1, gap: 1 }}><Typography sx={{ fontSize: 12 }}>{error}</Typography><Button size="small" onClick={() => setAttempt(value => value + 1)}>Retry</Button></Stack> : null}
    <Box ref={container} sx={{ flex: 1, minHeight: 0, minWidth: 0 }} />
  </Box>;
}
