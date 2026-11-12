"use client";

import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import type { Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { memo, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { SCANNER_INDICATOR_FRAMES as FRAMES, SCANNER_INDICATORS as INDICATORS,
  type ScannerIndicatorFrame as Frame, type ScannerIndicatorRead, type DisplaySignal, type IndicatorRow } from "@/src/modules/scanner/live/scanner-indicator-read";
import type { IndicatorSignalKind } from "@/src/lib/live-watchlist/indicators/indicator-signals";
import type { LiveScannerRow } from "@/src/modules/scanner/live/contracts";

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
      onChange={event=>save({frame:event.target.value as Frame,selected})}
      sx={{width:144,maxWidth:"100%"}}>
      {FRAMES.map(value=><MenuItem key={value} value={value}>{value}</MenuItem>)}
    </TextField>
    <Box sx={{display:"flex",gap:0.5,flexWrap:"wrap",mt:0.25}}>
      {INDICATORS.map(value=><FormControlLabel key={value} sx={{m:0}} label={value}
        control={<Checkbox size="small" checked={selected.includes(value)}
          onChange={(_,checked)=>save({frame,selected:checked ? [...selected,value] : selected.filter(item=>item!==value)})}/>}/>)}
    </Box>
  </Box>;
}

type History = { minute:number; promise:Promise<ScannerIndicatorRead | null> };
const histories = new Map<string,History>();
const queue: Array<()=>void> = [];
let active = 0;
function pump() {
  while (active<3 && queue.length) queue.shift()?.();
}
function readsFor(symbol: string, frame: Frame, minute: number): Promise<ScannerIndicatorRead | null> {
  const key = `${symbol}:${frame}`;
  const existing=histories.get(key);
  if(existing?.minute===minute) return existing.promise;
  const promise=new Promise<ScannerIndicatorRead | null>(resolve=>{
    queue.push(()=>{
      active++;
      void fetch(`/api/screeners/charts/bars?symbol=${encodeURIComponent(symbol)}&scannerIndicators=1&frame=${frame}`,{cache:"no-store",signal:AbortSignal.timeout(15000)})
        .then(async response=>{
          if(!response.ok) return null;
          const value=await response.json() as ScannerIndicatorRead;
          return value.symbol===symbol&&value.frame===frame&&Array.isArray(value.rows) ? value : null;
        }).then(resolve,()=>resolve(null)).finally(()=>{active--;pump();});
    });
    pump();
  });
  histories.delete(key);
  histories.set(key,{minute,promise});
  if(histories.size>100) histories.delete(histories.keys().next().value!);
  return promise;
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
const SIGNAL_WINDOW_MS = 15 * 60_000;
export function isRecentScannerSignal(at: number, now: number): boolean {
  const age = now - at;
  return age >= 0 && age < SIGNAL_WINDOW_MS;
}

function RecentSignal({ signal, compact = false }: { signal: DisplaySignal; compact?: boolean }) {
  const color = tones[signalDirections[signal.kind]??"neutral"];
  if (compact) return <Typography component="span" variant="inherit" sx={{color,ml:0.5,whiteSpace:"nowrap"}}>
    {signal.kind==="emaBullishCross"?"Crossed above":"Crossed below"}
  </Typography>;
  return <Typography component="p" variant="inherit" sx={{m:0}}>
    <Box component="span" sx={{color}}>{signal.text}</Box>
  </Typography>;
}

export function ScannerIndicatorReads({ row,now }: { row:Pick<LiveScannerRow,"symbol"|"price">; now:number }) {
  const { frame,selected }=useSettings();
  const ref=useRef<HTMLDivElement|null>(null);
  const [visible,setVisible]=useState(false);
  const [history,setHistory]=useState<ScannerIndicatorRead|null>(null);
  const enabled = selected.length > 0;
  const frameMs = Number.parseInt(frame, 10) * 60_000;
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
    void readsFor(row.symbol,frame,historyWindow).then(value=>{
      if(current && value) setHistory(value);
    });
    return ()=>{current=false;};
  },[row.symbol,frame,historyWindow,visible,enabled]);
  const chosen = history?.symbol===row.symbol && history.frame===frame ? history.rows.flatMap(reading => {
    if (!selected.includes(reading.name)) return [];
    const signals = reading.signals.filter(signal=>isRecentScannerSignal(signal.at,now));
    if (reading.name !== "VWAP" || history.vwap === null) return [{...reading, signals}];
    const position = row.price > history.vwap ? "above" : row.price < history.vwap ? "below" : "at";
    const direction = position === "above" ? "bullish" : position === "below" ? "bearish" : "neutral";
    const label = position === "above" ? "Bullish" : position === "below" ? "Bearish" : "Neutral";
    return [{...reading, signals, direction, text:`${reading.text} · ${position}`,
      details:`${reading.text} · ${label} · Price ${position} VWAP`} satisfies IndicatorRow];
  }) : [];
  if (!enabled) return null;
  return <Box ref={ref} data-scanner-indicator-frame={frame} sx={{minHeight:1}}>
    {chosen.length>0&&<IndicatorRows rows={chosen}/>}
  </Box>;
}


const IndicatorRows = memo(function IndicatorRows({ rows }: { rows: readonly IndicatorRow[] }) {
  const [detailsOpen,setDetailsOpen]=useState(false);
  return <Box component="details" onToggle={event=>setDetailsOpen(event.currentTarget.open)}
      sx={{fontSize:"0.66rem",color:"text.secondary","&[open] > summary > svg":{transform:"rotate(180deg)"}}}>
      <Box component="summary" aria-label="Indicator details"
        sx={{display:"flex",alignItems:"flex-start",cursor:"pointer",listStyle:"none","&::-webkit-details-marker":{display:"none"}}}>
        <KeyboardArrowDownRounded aria-hidden="true" sx={{fontSize:"1rem",flexShrink:0,mr:0.25}}/>
        <Box component="span" sx={{display:"flex",gap:0.65,flexWrap:"wrap",minWidth:0}}>
          {rows.map(({name,direction,text,signals})=>{
            return <Box component="span" key={name} data-scanner-indicator={name}>
              <Typography component="span" variant="inherit" sx={{color:scannerCardLabelColor,fontWeight:700}}>{name} </Typography>
              <Typography component="span" variant="inherit" sx={{fontWeight:700,color:tones[direction]}}>
                {text}
              </Typography>
              {name==="EMA"&&signals.map(event=><RecentSignal key={event.at} signal={event} compact/>)}
            </Box>;
          })}
        </Box>
      </Box>
      {detailsOpen&&rows.map(({name,direction,signals,details})=><Box key={name} sx={{my:0.45}}>
        <Typography component="p" variant="inherit" sx={{m:0}}>
          <strong>{name}</strong>{" "}
          <Box component="span" sx={{color:tones[direction]}}>
            {details}
          </Box>
        </Typography>
        {signals.map(signal=><RecentSignal key={`${signal.kind}-${signal.at}`} signal={signal}/>)}
      </Box>)}
    </Box>;
}, (previous, next) => previous.rows.length === next.rows.length && previous.rows.every((row, index) => {
  const other = next.rows[index];
  return row.name === other.name && row.text === other.text && row.details === other.details &&
    row.direction === other.direction && row.signals.length === other.signals.length &&
    row.signals.every((signal, signalIndex) => {
      const nextSignal = other.signals[signalIndex];
      return signal.kind === nextSignal.kind && signal.text === nextSignal.text && signal.at === nextSignal.at;
    });
}));
