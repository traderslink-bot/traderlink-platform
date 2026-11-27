"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseRounded from "@mui/icons-material/CloseRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";
import SkipNextRounded from "@mui/icons-material/SkipNextRounded";
import SkipPreviousRounded from "@mui/icons-material/SkipPreviousRounded";
import type { Time, UTCTimestamp } from "lightweight-charts";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import { REPLAY_TIMEFRAMES, replayCandles, replayDateWindow } from "@/src/modules/scanner/alpaca/chart-bar-replay";
import { ChartSessionCalendar } from "@/src/modules/scanner/alpaca/chart-calendar";
import { easternDayStart, type Candle, type ChartTimeframe, type DisplayCandle } from "@/src/modules/scanner/alpaca/candles";
import { resolveChartTimeZone } from "@/src/modules/scanner/alpaca/chart-time-zone";
import { chartLogarithmic, type ChartPreferences } from "@/src/modules/scanner/alpaca/chart-preferences";
import { readChartCandleHistory } from "./shared-chart-data";
import { createChartPriceStyle } from "./chart-price-style";

const iconSx = { width: 30, height: 30, p: 0.5 };
type LoadedReplay = { date: string; timeframe: ChartTimeframe; bars: Candle[] };

export default function BarReplayChart({ symbol, generation, initialTimeframe, preferences, dark, barsEndpoint, onClose }: {
  symbol: string;
  generation: string;
  initialTimeframe: ChartTimeframe;
  preferences: ChartPreferences;
  dark: boolean;
  barsEndpoint: string;
  onClose: () => void;
}) {
  const maxDate = easternClock(easternDayStart(Date.now() / 1_000) * 1_000 - 1).date;
  const [date, setDate] = useState(maxDate);
  const [timeframe, setTimeframe] = useState<ChartTimeframe>(() =>
    REPLAY_TIMEFRAMES.some(frame => frame === initialTimeframe) ? initialTimeframe : "5m");
  const [loaded, setLoaded] = useState<LoadedReplay | null>(null);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState("");
  const request = useRef<AbortController | undefined>(undefined);
  const container = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLDivElement>(null);
  const write = useRef<((value: readonly DisplayCandle[]) => void) | undefined>(undefined);
  const visible = useMemo(() => (loaded?.bars.slice(0, position) ?? []).map(bar => ({ ...bar, carried: false })), [loaded, position]);
  const latestVisible = useRef<readonly DisplayCandle[]>(visible);
  const timestamp = useMemo(() => new Intl.DateTimeFormat("en-US", {
    timeZone: resolveChartTimeZone(preferences.timezone), hour: "numeric", minute: "2-digit",
  }), [preferences.timezone]);
  const latest = visible.at(-1);
  const logarithmic = chartLogarithmic(preferences, loaded?.timeframe ?? timeframe);
  const canAdvance = Boolean(loaded && position < loaded.bars.length);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!playing || !canAdvance) return;
    const frame = setTimeout(() => setPosition(value => value + 1), 650);
    return () => clearTimeout(frame);
  }, [playing, canAdvance, position]);

  useEffect(() => {
    let disposed = false;
    let remove: (() => void) | undefined;
    const mount = async () => {
      const library = await import("lightweight-charts");
      if (disposed || !container.current) return;
      const { createChart, ColorType, HistogramSeries, PriceScaleMode } = library;
      const gridColor = dark ? "#1d2939" : "#eef1f5";
      const chart = createChart(container.current, {
        autoSize: true,
        layout: { background: { type: ColorType.Solid, color: dark ? "#101722" : "#ffffff" }, textColor: dark ? "#c7d2df" : "#354358", fontSize: 11, attributionLogo: false },
        rightPriceScale: { entireTextOnly: true, mode: logarithmic ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal },
        grid: { vertLines: { visible: preferences.grid, color: gridColor }, horzLines: { visible: preferences.grid, color: gridColor } },
        localization: { timeFormatter: (time: Time) => typeof time === "number" ? timestamp.format(time * 1_000) : String(time) },
        timeScale: { timeVisible: true, rightOffset: 3,
          tickMarkFormatter: (time: Time) => typeof time === "number" ? timestamp.format(time * 1_000) : String(time),
        },
      });
      remove = () => chart.remove();
      const price = createChartPriceStyle(chart, library, preferences, () => latestVisible.current, logarithmic);
      const volume = preferences.volume ? chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, lastValueVisible: false, priceLineVisible: false }, 1) : undefined;
      if (volume) {
        chart.panes()[0].setStretchFactor(100 - preferences.volumeHeight);
        chart.panes()[1].setStretchFactor(preferences.volumeHeight);
      }
      chart.subscribeCrosshairMove(({ time, logical, point }) => {
        if (!readout.current) return;
        const bar = point && typeof logical === "number" ? latestVisible.current[logical] : undefined;
        if (!bar || bar.time !== time) { readout.current.textContent = ""; return; }
        const formatPrice = price.series.priceFormatter();
        const { open, high, low, close, volume } = bar;
        readout.current.textContent = `O ${formatPrice.format(open)} H ${formatPrice.format(high)} L ${formatPrice.format(low)} C ${formatPrice.format(close)} · Vol ${volume.toLocaleString()}`;
      });
      const writeData = (bars: readonly DisplayCandle[]) => {
        if (readout.current) readout.current.textContent = "";
        price.set(bars);
        volume?.setData(bars.map(bar => ({ time: bar.time as UTCTimestamp, value: bar.volume,
          color: (bar.close >= bar.open ? preferences.upColor : preferences.downColor) + "80",
        })));
        if (bars.length) chart.timeScale().setVisibleLogicalRange({ from: Math.max(-6, bars.length - 86), to: Math.max(14, bars.length + 3) });
      };
      write.current = writeData;
      remove = () => { write.current = undefined; price.dispose(); chart.remove(); };
      writeData(latestVisible.current);
    };
    void mount().catch(() => { if (!disposed) setStatus("Replay chart could not load."); });
    return () => { disposed = true; remove?.(); };
  }, [dark, logarithmic, preferences, timestamp]);

  useEffect(() => {
    latestVisible.current = visible;
    write.current?.(visible);
  }, [visible]);

  function begin(event: FormEvent) {
    event.preventDefault();
    request.current?.abort();
    const abort = new AbortController();
    request.current = abort;
    setPlaying(false);
    setPosition(0);
    setLoaded(null);
    setStatus("Loading replay…");
    void (async () => {
      try {
        const { end } = replayDateWindow(date);
        const basis = easternClock(Date.now()).date;
        if (date > maxDate) throw Error("invalid_replay_date");
        const query = new URLSearchParams({ symbol, generation, daily: "0", history: "1", before: String(end * 1_000 - 1) });
        if (preferences.priceAdjustment === "raw") query.set("adjustment", "raw");
        const page = await readChartCandleHistory(`${barsEndpoint}?${query}`, abort.signal);
        if (abort.signal.aborted) return;
        if (page.basisDate !== basis || easternClock(Date.now()).date !== basis) throw Error("replay_basis_changed");
        const calendar = new ChartSessionCalendar();
        calendar.merge(page.calendar);
        for (const year of page.calendars ?? []) calendar.merge(year);
        const bars = replayCandles(page.bars, date, timeframe, preferences, calendar);
        setLoaded({ date, timeframe, bars });
        setPosition(bars.length ? 1 : 0);
        setStatus(bars.length ? "" : "No candles for the selected date and sessions.");
      } catch {
        if (!abort.signal.aborted) setStatus("Replay history could not load for that date.");
      }
    })();
  }

  return <Box data-chart-replay sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", bgcolor: "background.paper", color: "text.primary" }}>
    <Box component="form" onSubmit={begin} sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center", px: 0.5, pt: 0.65, "& .MuiInputBase-root": { height: 32 } }}>
      <TextField label="Replay date" value={date} type="date" size="small" onChange={event => setDate(event.target.value)}
        slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: maxDate, required: true, style: { colorScheme: dark ? "dark" : "light" } } }} sx={{ width: 145 }} />
      <TextField select size="small" label="Interval" value={timeframe} onChange={event => setTimeframe(event.target.value as ChartTimeframe)} sx={{ width: 85 }}>
        {REPLAY_TIMEFRAMES.map(frame => <MenuItem value={frame} key={frame}>{frame}</MenuItem>)}
      </TextField>
      <Button type="submit" size="small" variant="outlined" sx={{ textTransform: "none" }}>Load</Button>
      <IconButton aria-label="Exit Bar Replay" title="Exit Bar Replay" onClick={onClose} sx={{ ...iconSx, ml: "auto" }}><CloseRounded fontSize="small" /></IconButton>
    </Box>
    <Box sx={{ display: "flex", alignItems: "center", px: 0.5, minHeight: 30 }}>
      <IconButton aria-label="Previous bar" disabled={position <= 1} onClick={() => { setPlaying(false); setPosition(value => value - 1); }} sx={iconSx}><SkipPreviousRounded fontSize="small" /></IconButton>
      <IconButton aria-label={playing && canAdvance ? "Pause replay" : "Play replay"} disabled={!canAdvance} onClick={() => setPlaying(value => !value)} sx={iconSx}>
        {playing && canAdvance ? <PauseRounded fontSize="small" /> : <PlayArrowRounded fontSize="small" />}
      </IconButton>
      <IconButton aria-label="Next bar" disabled={!canAdvance} onClick={() => { setPlaying(false); setPosition(value => value + 1); }} sx={iconSx}><SkipNextRounded fontSize="small" /></IconButton>
      <Typography role="status" variant="caption" noWrap>
        {status || (latest ? `${loaded?.date} · ${loaded?.timeframe} · ${timestamp.format(latest.time * 1_000)}` : "Choose a date to start Bar Replay")}
      </Typography>
    </Box>
    <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
      <Box ref={container} data-replay-visible-bars={position} sx={{ position: "absolute", inset: 0 }} />
      <Box ref={readout} data-replay-ohlcv sx={{
        position: "absolute", left: 6, right: 60, top: 2, fontSize: 10, color: dark ? "#c7d2df" : "#354358",
        pointerEvents: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }} />
    </Box>
  </Box>;
}
