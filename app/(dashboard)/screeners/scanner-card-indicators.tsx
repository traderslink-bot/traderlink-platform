"use client";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import type { Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { calculateIndicatorHistory, calculateSessionVwap } from "@/src/lib/live-watchlist/indicators/indicator-engine";
import { indicatorDisplayRows, type IndicatorDisplayRow } from "@/src/lib/live-watchlist/indicators/indicator-presentation";
import { aggregateCandles, type Candle } from "@/src/modules/scanner/alpaca/candles";
import { indicatorMarketDate, indicatorSessionWindow, indicatorTradingDay, normalizeIndicatorSessions, type IndicatorCalendar } from "@/src/lib/live-watchlist/indicators/indicator-sessions";
import exchangeCalendar from "@/src/modules/coach/server/market-calendar/us-equities-review-calendar.v1.json";
import { calendarDate, parseCalendarSessions, type ChartCalendar } from "@/src/modules/scanner/alpaca/chart-calendar";
import type { IndicatorSignalKind } from "@/src/lib/live-watchlist/indicators/indicator-signals";
import type { LiveScannerRow } from "@/src/modules/scanner/live/contracts";

const FRAMES = ["1m", "5m", "15m"] as const;
const INDICATORS = ["EMA", "VWAP", "RSI", "Trend", "RSI momentum", "Volume", "ATR"] as const;
type Frame = typeof FRAMES[number];
type Indicator = typeof INDICATORS[number];
const KEY = "traderslink.scanner.card-indicators.v1";
const defaults = { frame:"5m" as Frame, selected:["EMA", "VWAP", "RSI"] as Indicator[] };
const listeners = new Set<() => void>();
let fallback = "";
function read() {
  try { return localStorage.getItem(KEY) ?? fallback; } catch { return fallback; }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage",listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage",listener); };
}
function useSettings() {
  const saved = useSyncExternalStore(subscribe,read,()=>"");
  const settings = useMemo(() => {
    try {
      const value = JSON.parse(saved);
      return { frame:FRAMES.includes(value.frame) ? value.frame as Frame : defaults.frame,
        selected:Array.isArray(value.selected) ? INDICATORS.filter(item => value.selected.includes(item)) : defaults.selected };
    } catch { return defaults; }
  },[saved]);
  const save = (next: typeof settings) => {
    fallback=JSON.stringify(next);
    try { localStorage.setItem(KEY,fallback); } catch { /* Keep this tab usable. */ }
    listeners.forEach(listener=>listener());
  };
  return { ...settings, save };
}

export function ScannerIndicatorSettings() {
  const { frame,selected,save } = useSettings();
  return <Box sx={{borderTop:1,borderColor:"divider",pt:1,mt:0.6}}>
    <TextField select size="small" label="Indicator timeframe" value={frame}
      onChange={event=>save({frame:event.target.value as Frame,selected})} fullWidth>
      {FRAMES.map(value=><MenuItem key={value} value={value}>{value}</MenuItem>)}
    </TextField>
    <Box sx={{display:"flex",gap:0.5,flexWrap:"wrap",mt:0.25}}>
      {INDICATORS.map(value=><FormControlLabel key={value} sx={{m:0}} label={value}
        control={<Checkbox size="small" checked={selected.includes(value)}
          onChange={(_,checked)=>save({frame,selected:checked ? [...selected,value] : selected.filter(item=>item!==value)})}/>}/>)}
    </Box>
  </Box>;
}

type CandleHistory = { bars: readonly Candle[]; calendar: IndicatorCalendar };
type History = { minute:number; promise:Promise<CandleHistory | null> };
const histories = new Map<string,History>();
const queue: Array<()=>void> = [];
let active = 0;
function pump() {
  while (active<3 && queue.length) queue.shift()?.();
}
function candlesFor(symbol: string, minute: number): Promise<CandleHistory | null> {
  const existing=histories.get(symbol);
  if(existing?.minute===minute) return existing.promise;
  const promise=new Promise<CandleHistory | null>(resolve=>{
    queue.push(()=>{
      active++;
      void fetch(`/api/screeners/charts/bars?symbol=${encodeURIComponent(symbol)}&scannerIndicators=1`,{cache:"no-store",signal:AbortSignal.timeout(15000)})
        .then(async response=>{
          if(!response.ok) return null;
          const value=await response.json() as {bars?:Candle[];symbol?:string;feed?:string;adjustment?:string;calendar?:ChartCalendar};
          return value.symbol===symbol&&value.feed==="sip"&&value.adjustment==="split"&&Array.isArray(value.bars)
            ? { bars:value.bars, calendar:historyCalendar(value.calendar) } : null;
        }).then(resolve,()=>resolve(null)).finally(()=>{active--;pump();});
    });
    pump();
  });
  histories.delete(symbol);
  histories.set(symbol,{minute,promise});
  if(histories.size>100) histories.delete(histories.keys().next().value!);
  return promise;
}

const fallbackCalendar = exchangeCalendar as IndicatorCalendar;

function historyCalendar(payload: ChartCalendar | undefined): IndicatorCalendar {
  if (!payload?.available || !calendarDate(payload.start) || !calendarDate(payload.end)) return fallbackCalendar;
  const start = Date.parse(payload.start), end = Date.parse(payload.end);
  if (end < start || end - start > 31 * 86_400_000) return fallbackCalendar;
  try {
    const sessions = parseCalendarSessions(payload.sessions, payload.start, payload.end);
    const active = new Set(sessions.map(session => session.date));
    const closedDates: string[] = [];
    for (let day = start; day <= end; day += 86_400_000) {
      const date = new Date(day).toISOString().slice(0, 10);
      if (!active.has(date)) closedDates.push(date);
    }
    return { ...fallbackCalendar, calendarId:"alpaca-chart-calendar", closedDates,
      coverage: { ...fallbackCalendar.coverage, startDate:payload.start, endDate:payload.end },
      earlyCloseSessions:sessions.filter(session=>session.close==="13:00")
        .map(session=>({date:session.date,postMarketEndEastern:"17:00"})) };
  } catch { return fallbackCalendar; }
}
const asHistoryBar = (bar: Candle) => ({ ...bar, start: bar.time * 1000 });

export function scannerIndicatorResults(bars: readonly Candle[], frame: Frame, through: number, calendar = fallbackCalendar) {
  const duration = Number.parseInt(frame, 10) * 60_000;
  const complete = bars.filter(bar => bar.time * 1000 + 60_000 <= through);
  const frameBars = aggregateCandles(complete, frame)
    .filter(bar => bar.time * 1000 + duration <= through).slice(-250);
  const { candles } = normalizeIndicatorSessions({ bars: frameBars.map(asHistoryBar), timeframe: frame, calendar, completedThrough: through });
  const result = calculateIndicatorHistory(candles, frame, `scanner-${frame}`, through).results.at(-1);

  let day;
  for (let i = complete.length - 1; i >= 0; i--) {
    const time = complete[i].time * 1000;
    const candidate = indicatorTradingDay(calendar, indicatorMarketDate(time));
    if (candidate && indicatorSessionWindow(candidate, time)) { day = candidate; break; }
  }
  if (!day) return { result, vwap: null };
  const minuteBars = complete.filter(bar => bar.time * 1000 >= day.preOpen && bar.time * 1000 < day.postClose);
  const minutes = normalizeIndicatorSessions({ bars: minuteBars.map(asHistoryBar), timeframe: "1m", calendar, completedThrough: through });
  const vwap = calculateSessionVwap({ candles: minutes.candles, sessionStart: day.preOpen, sessionEnd: day.postClose,
    completedThrough: through, coverageComplete: true });
  return { result, vwap };
}

export const scannerCardLabelColor = (theme: Theme) =>
  theme.palette.mode === "dark" ? "#929CAA" : "#4F5D6D";

const tones = { bullish:"success.main", bearish:"error.main", neutral:"warning.main" } as const;
const signalDirections: Partial<Record<IndicatorSignalKind, "bullish" | "bearish">> = {
  emaBullishCross:"bullish", emaBearishCross:"bearish",
  uptrendEstablished:"bullish", uptrendRealigned:"bullish", uptrendPriceWeakening:"bearish", uptrendLost:"bearish",
  downtrendEstablished:"bearish", downtrendRealigned:"bearish", downtrendPriceWeakening:"bullish", downtrendLost:"bullish",
  rsiAboveMidpoint:"bullish", rsiBelowMidpoint:"bearish", rsiRecovered:"bullish",
  momentumTurningHigher:"bullish", momentumTurningLower:"bearish",
  vwapReclaimed:"bullish", vwapLost:"bearish",
};
const readingDirection = (reading: IndicatorDisplayRow) =>
  reading.tone === "bullish" || reading.tone === "bearish" ? reading.tone : "neutral";
const readingNames: Record<Indicator, string> = {
  EMA: "Moving averages", VWAP: "VWAP", RSI: "RSI", Trend: "Trend", "RSI momentum": "Momentum", Volume: "Volume", ATR: "ATR",
};
const SIGNAL_WINDOW_MS = 15 * 60_000;
export function isRecentScannerSignal(at: number, now: number): boolean {
  const age = now - at;
  return age >= 0 && age < SIGNAL_WINDOW_MS;
}

type DisplaySignal = NonNullable<IndicatorDisplayRow["signals"]>[number];

function RecentSignal({ signal, compact = false }: { signal: DisplaySignal; compact?: boolean }) {
  const color = tones[signalDirections[signal.kind]??"neutral"];
  if (compact) return <Typography component="span" variant="inherit" sx={{color,ml:0.5,whiteSpace:"nowrap"}}>
    {signal.kind==="emaBullishCross"?"Crossed above":"Crossed below"}
  </Typography>;
  return <Typography component="p" variant="inherit" sx={{m:0}}>
    <Box component="span" sx={{color}}>{signal.text}</Box>
  </Typography>;
}

function compactRead(name: Indicator, reading: IndicatorDisplayRow, result?: ReturnType<typeof scannerIndicatorResults>["result"]) {
  const state = reading.state;
  if (name === "VWAP" && state) return [reading.value, state.split(" · ").at(-1)?.replace(" VWAP", "")].join(" · ");
  if (name === "EMA" && result?.ema9 != null && result.ema20 != null) {
    return result.ema9 === result.ema20 ? "9 at 20" : result.ema9 > result.ema20 ? "9 above 20" : "9 below 20";
  }
  if (name === "RSI") return [reading.value, reading.conditionState].filter(Boolean).join(" · ");
  if (name === "ATR") return [reading.value, state].filter(Boolean).join(" · ");
  return state ?? reading.value;
}

export function ScannerIndicatorReads({ row,now }: { row:LiveScannerRow; now:number }) {
  const { frame,selected }=useSettings();
  const ref=useRef<HTMLDivElement|null>(null);
  const [visible,setVisible]=useState(false);
  const [history,setHistory]=useState<(CandleHistory & {symbol:string})|null>(null);
  const enabled = selected.length > 0;
  const [detailsOpen,setDetailsOpen]=useState(false);
  const frameMs = Number.parseInt(frame, 10) * 60_000;
  // Keep completed minute bars for VWAP, even when the selected study timeframe is larger.
  const minute = Math.floor(now / 60_000);
  const historyWindow = Math.floor(now / frameMs) * frameMs / 60_000;
  useEffect(()=>{
    if(!ref.current || !enabled || typeof IntersectionObserver==="undefined") return;
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));
    observer.observe(ref.current);
    return ()=>observer.disconnect();
  },[enabled]);
  useEffect(()=>{
    if(!visible||!enabled) return;
    let current=true;
    void candlesFor(row.symbol,historyWindow).then(value=>{
      if(current && value?.bars.length) setHistory({symbol:row.symbol,...value});
    });
    return ()=>{current=false;};
  },[row.symbol,historyWindow,visible,enabled]);
  const computed=useMemo(()=>{
    if(history?.symbol!==row.symbol) return null;
    try {return scannerIndicatorResults(history.bars,frame,minute*60_000,history.calendar);}
    catch {return null;}
  },[history,frame,minute,row.symbol]);
  const result=computed?.result, vwap=computed?.vwap;
  const readings=useMemo(()=>indicatorDisplayRows({result,timeframe:frame,livePrice:row.price,
    vwap:vwap?.value??null,vwapSignals:vwap?.signals}),[result,frame,row.price,vwap]);
  const chosen = selected.flatMap(name => {
    const reading = readings.find(item => item.label === readingNames[name]);
    return reading && (reading.state || !["—", "Unavailable"].includes(reading.value)) &&
      (name !== "EMA" || result?.ema9 != null || result?.ema20 != null)
      ? [{name, reading, text:compactRead(name,reading,result)}] : [];
  });
  if (!enabled) return null;
  return <Box ref={ref} data-scanner-indicator-frame={frame} sx={{minHeight:1}}>
    <Box sx={{display:"flex",gap:0.65,flexWrap:"wrap",fontSize:"0.66rem"}}>
      {chosen.map(({name,reading,text})=>{
        const direction = readingDirection(reading);
        return <Box key={name} data-scanner-indicator={name}>
          <Typography component="span" variant="inherit" sx={{color:scannerCardLabelColor,fontWeight:700}}>{name} </Typography>
          <Typography component="span" variant="inherit" sx={{fontWeight:700,color:tones[direction]}}>
            {text}
          </Typography>
          {name==="EMA"&&reading.signals?.filter(event=>isRecentScannerSignal(event.at,now)).map(event=><RecentSignal key={event.at} signal={event} compact/>)}
        </Box>;
      })}
    </Box>
    {chosen.length>0&&<Box component="details" onToggle={event=>setDetailsOpen(event.currentTarget.open)} sx={{mt:0.25,fontSize:"0.66rem",color:"text.secondary","& summary":{cursor:"pointer"}}}>
      <summary>Details</summary>
      {detailsOpen&&chosen.map(({name,reading,text})=><Box key={name} sx={{my:0.45}}>
        <Typography component="p" variant="inherit" sx={{m:0}}>
          <strong>{name}</strong>{" "}
          <Box component="span" sx={{color:tones[readingDirection(reading)]}}>
            {[reading.value && reading.value !== text ? reading.value : null, name==="EMA"?text:reading.state ?? text].filter(Boolean).join(" · ")}
          </Box>
        </Typography>
        {reading.signals?.filter(signal=>isRecentScannerSignal(signal.at,now)).map(signal=><RecentSignal key={`${signal.kind}-${signal.at}`} signal={signal}/>)}
      </Box>)}
    </Box>}
  </Box>;
}
