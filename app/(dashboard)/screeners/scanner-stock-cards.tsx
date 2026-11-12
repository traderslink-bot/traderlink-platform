"use client";

import { scannerGainColor } from "./scanner-gain-color";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import CloseRounded from "@mui/icons-material/CloseRounded";
import FormControlLabel from "@mui/material/FormControlLabel";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";
import type { LiveScannerRow, ScannerKind } from "@/src/modules/scanner/live/contracts";

import { momentumSignalText } from "./momentum-signal-text";
import { ScannerCountryFlag } from "./scanner-country-flag";
import { scannerCardLabelColor, ScannerIndicatorReads, ScannerIndicatorSettings } from "./scanner-card-indicators";
import { ScannerNewsLink } from "./scanner-news-drawer-context";

const SECTION_LABELS = { stats: "Stats", indicators: "Indicators", catalyst: "Catalyst" } as const;
type Section = keyof typeof SECTION_LABELS;
const SECTIONS: readonly Section[] = ["stats", "indicators", "catalyst"];
const LEGACY_KEY = "traderslink.scanner.ticker-card-sections.v1";
const KEY = "traderslink.scanner.ticker-card-sections.v2";
let storedSections = "stats";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readSections() {
  try { return window.localStorage.getItem(KEY) ?? `stats,${window.localStorage.getItem(LEGACY_KEY) ?? ""}`; }
  catch { return storedSections; }
}

export function useTickerCardSections() {
  const stored = useSyncExternalStore(subscribe, readSections, () => "stats");
  const sections = [...new Set(stored.split(",").filter((value): value is Section => SECTIONS.includes(value as Section)))];
  const update = (next: readonly Section[]) => {
    storedSections = next.join(",");
    try { window.localStorage.setItem(KEY, storedSections); } catch { /* Keep the preference in this tab. */ }
    listeners.forEach(listener => listener());
  };
  return { sections, update };
}

const scannerViews = { table: "Table", cards: "Cards", "two-rows": "Two rows" } as const;
export type ScannerView = keyof typeof scannerViews;

export function ScannerViewSettings({ label, view, onViewChange }: { label: string; view: ScannerView; onViewChange: (view: ScannerView) => void }) {
  const { sections, update } = useTickerCardSections();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  return <>
    <Button size="small" aria-label={`${label} view: ${scannerViews[view]}`} endIcon={<KeyboardArrowDownRounded fontSize="small"/>} aria-haspopup="dialog" aria-expanded={Boolean(anchor)} aria-controls={anchor ? id : undefined}
      onClick={event => setAnchor(event.currentTarget)} sx={{fontSize:"0.68rem",lineHeight:1.2,textTransform:"none",whiteSpace:"nowrap",px:0.5,py:0.25,minHeight:24,minWidth:0,'& .MuiButton-endIcon':{ml:0.25,mr:0}}}>
      {scannerViews[view]}
    </Button>
    <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
      anchorOrigin={{vertical:"bottom",horizontal:"right"}} transformOrigin={{vertical:"top",horizontal:"right"}}
      slotProps={{paper:{id,role:"dialog","aria-label":`${label} view settings`,sx:{p:1.25,minWidth:228}}}}>
      <IconButton aria-label="Close view settings" size="small" onClick={() => setAnchor(null)}
        sx={{position:"absolute",top:10,right:10,width:32,height:32}}>
        <CloseRounded fontSize="small"/>
      </IconButton>
      <Box role="group" aria-label="Display view" sx={{pr:4.5}}>
        {(Object.entries(scannerViews) as [ScannerView,string][]).map(([value,text])=>
          <Button size="small" key={value} aria-pressed={view===value}
            onClick={()=>{onViewChange(value);if(value!=="cards")setAnchor(null);}} sx={{width:"100%",minHeight:32,justifyContent:"flex-start",textTransform:"none",bgcolor:view===value?"action.selected":undefined}}>
            {text}
          </Button>)}
      </Box>
      {view==="cards"&&<Box role="group" aria-label="Ticker card sections" sx={{borderTop:1,borderColor:"divider",mt:0.75,pt:0.75}}>
      <Typography variant="body2" sx={{fontWeight:700,px:0.5}}>Card sections</Typography>
      {[...sections, ...SECTIONS.filter(section => !sections.includes(section))].map(section => {
        const position = sections.indexOf(section);
        const enabled = position >= 0;
        const move = (offset: number) => {
          const next = [...sections];
          const target = position + offset;
          [next[position], next[target]] = [next[target], next[position]];
          update(next);
        };
        return <Box key={section} sx={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:1}}>
          <FormControlLabel sx={{m:0}} label={SECTION_LABELS[section]} control={
            <Checkbox size="small" checked={enabled} onChange={(_, checked) => update(
              checked ? [...sections, section] : sections.filter(value => value !== section)
            )}/>
          }/>
          {enabled && sections.length > 1 && <Box sx={{display:"flex"}}>
            <Button size="small" aria-label={`Move ${SECTION_LABELS[section]} up`}
              disabled={position===0} onClick={() => move(-1)} sx={{minWidth:30}}>↑</Button>
            <Button size="small" aria-label={`Move ${SECTION_LABELS[section]} down`}
              disabled={position===sections.length-1} onClick={() => move(1)} sx={{minWidth:30}}>↓</Button>
          </Box>}
        </Box>;
      })}
      {sections.includes("indicators") && <ScannerIndicatorSettings/>}
      </Box>}
    </Popover>
  </>;
}

const compact = new Intl.NumberFormat("en-US", { notation:"compact", maximumFractionDigits:1 });
const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits:1 });
const price = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", minimumFractionDigits:2, maximumFractionDigits:4 });
const date = new Intl.DateTimeFormat("en-US", { timeZone:"America/New_York", month:"short", day:"numeric" });
const shares = (n: number | null) => n === null ? "—" : compact.format(n);
const percent = (n: number | null, signed = false) => n === null ? "—" : `${signed && n > 0 ? "+" : ""}${decimal.format(n)}%`;

function Reading({ label, value }: { label: string; value: string }) {
  return <Box sx={{minWidth:0,textAlign:"left"}}>
    <Typography component="dt" sx={{color:scannerCardLabelColor,fontWeight:700,fontSize:"0.62rem",lineHeight:1.15}}>{label}</Typography>
    <Typography component="dd" sx={{m:0,fontWeight:650,fontSize:"0.72rem",lineHeight:1.25,overflowWrap:"anywhere"}}>{value}</Typography>
  </Box>;
}

export function ScannerStockCards({ rows, screen, now, renderTools, renderHalt }: {
  rows: readonly LiveScannerRow[];
  screen: ScannerKind;
  now: number;
  renderTools: (row: LiveScannerRow) => ReactNode;
  renderHalt: (symbol: string) => ReactNode;
}) {
  const { sections } = useTickerCardSections();
  return <Box role="list" aria-label={`${screen === "gainers" ? "Top Gainers" : "Momentum"} stock cards`}
    sx={theme=>({...scannerScrollStyles(theme),minWidth:0,minHeight:0,maxHeight:420,overflowX:"hidden",flex:"1 1 auto"})}>
    {rows.map(row => {
      const turnover = row.volume !== null && row.float !== null && row.float > 0 ? 100 * row.volume / row.float : null;
      const catalyst = row.news.find(item => Number.isFinite(Date.parse(item.createdAt)));
      const post = screen === "gainers" && row.gainBasis === "today_regular_close";
      return <Box role="listitem" key={row.symbol} data-scanner-stock-card={row.symbol}
        sx={{border:1,borderColor:"divider",borderRadius:0,mb:0.55,px:0.7,py:0.55,minWidth:0,bgcolor:"background.paper"}}>
        <Box sx={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",alignItems:"center",columnGap:0.65,minWidth:0}}>
          <Box sx={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:0.4,minWidth:0}}>
            <Typography component="span" sx={{color:"warning.main",fontSize:"0.84rem",fontWeight:850,overflowWrap:"anywhere"}}>{row.symbol}</Typography>
            {renderHalt(row.symbol)}
            {row.country && <ScannerCountryFlag country={row.country}/>}
            {renderTools(row)}
          </Box>
          <Box sx={{display:"flex",alignItems:"center",gap:0.6,ml:"auto",fontSize:"0.76rem",fontVariantNumeric:"tabular-nums"}}>
            <Typography component="span" variant="inherit" sx={{fontWeight:750,color:scannerGainColor(row.sessionGain)}}>{price.format(row.price)}</Typography>
            <Typography component="span" variant="inherit" sx={{fontWeight:800,color:scannerGainColor(row.sessionGain)}}
              aria-label={`${post ? "After-hours" : "Day"} change ${percent(row.sessionGain,true)}`}>
              {percent(row.sessionGain,true)}
            </Typography>
          </Box>
        </Box>
        {screen === "momentum" && <Typography sx={{fontSize:"0.65rem",color:theme=>theme.palette.mode==="dark"?"#c4b5fd":"#7c3aed",mt:0.4,overflowWrap:"anywhere"}}>
          {momentumSignalText(row)}
        </Typography>}
        {sections.map(section => section === "stats" ? <Box key={section} component="dl" aria-label="Stats"
          sx={{m:0,mt:0.65,display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:0.55,fontVariantNumeric:"tabular-nums"}}>
          <Reading label="Vol" value={shares(row.volume)}/>
          <Reading label="Float" value={shares(row.float)}/>
          <Reading label="T/O" value={percent(turnover)}/>
          <Reading label="RVOL" value={row.relativeVolume === null ? "—" : `${decimal.format(row.relativeVolume)}×`}/>
        </Box> : section === "indicators" || catalyst ? <Box component="section" key={section}
          aria-label={SECTION_LABELS[section]} sx={{minWidth:0,mt:0.65}}>
          {section === "indicators" ? <ScannerIndicatorReads row={row} now={now}/> : catalyst && (
            <Box sx={{display:"flex",alignItems:"baseline",gap:0.6,minWidth:0,overflowWrap:"anywhere",fontSize:"0.68rem","& button":{minWidth:0,textAlign:"left",fontWeight:550,lineHeight:1.25}}}>
              <Typography component="time" dateTime={catalyst.createdAt} variant="inherit" color="text.secondary" sx={{flexShrink:0,whiteSpace:"nowrap"}}>
                {date.format(new Date(catalyst.createdAt))}
              </Typography>
              <ScannerNewsLink item={catalyst} label={catalyst.headline}/>
            </Box>
          )}
        </Box> : null)}
      </Box>;
    })}
  </Box>;
}
