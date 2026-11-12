"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import type { LiveScannerRow, ScannerKind } from "@/src/modules/scanner/live/contracts";

import { momentumSignalText } from "./momentum-signal-text";
import { ScannerCountryFlag } from "./scanner-country-flag";
import { ScannerIndicatorReads, ScannerIndicatorSettings } from "./scanner-card-indicators";
import { ScannerNewsLink } from "./scanner-news-drawer-context";

const SECTION_LABELS = { indicators: "Indicators", catalyst: "Catalyst" } as const;
type Section = keyof typeof SECTION_LABELS;
const SECTIONS: readonly Section[] = ["indicators", "catalyst"];
const KEY = "traderslink.scanner.ticker-card-sections.v1";
let storedSections = "";
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
  try { return window.localStorage.getItem(KEY) ?? ""; }
  catch { return storedSections; }
}

export function useTickerCardSections() {
  const stored = useSyncExternalStore(subscribe, readSections, () => "");
  const sections = [...new Set(stored.split(",").filter((value): value is Section => SECTIONS.includes(value as Section)))];
  const update = (next: readonly Section[]) => {
    storedSections = next.join(",");
    try { window.localStorage.setItem(KEY, storedSections); } catch { /* Keep the preference in this tab. */ }
    listeners.forEach(listener => listener());
  };
  return { sections, update };
}

export function TickerCardSectionSettings() {
  const { sections, update } = useTickerCardSections();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  return <>
    <Button size="small" aria-expanded={Boolean(anchor)} aria-controls={anchor ? id : undefined}
      onClick={event => setAnchor(event.currentTarget)} sx={{fontSize:"0.68rem",textTransform:"none",px:0.5,minWidth:0}}>
      Card sections
    </Button>
    <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
      anchorOrigin={{vertical:"bottom",horizontal:"left"}}
      slotProps={{paper:{id,role:"group","aria-label":"Ticker card sections",sx:{p:1.25,minWidth:228}}}}>
      <Typography variant="body2" sx={{fontWeight:700,px:0.5}}>Basic Stats</Typography>
      {[...sections, ...SECTIONS.filter(section => !sections.includes(section))].map(section => {
        const enabled = sections.includes(section);
        return <Box key={section} sx={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:1}}>
          <FormControlLabel sx={{m:0}} label={SECTION_LABELS[section]} control={
            <Checkbox size="small" checked={enabled} onChange={(_, checked) => update(
              checked ? [...sections, section] : sections.filter(value => value !== section)
            )}/>
          }/>
          {enabled && sections.length === 2 && <Button size="small"
            aria-label={`Move ${SECTION_LABELS[section]} ${sections[0] === section ? "down" : "up"}`}
            onClick={() => update([...sections].reverse())} sx={{minWidth:30}}>
            {sections[0] === section ? "↓" : "↑"}
          </Button>}
        </Box>;
      })}
      {sections.includes("indicators") && <ScannerIndicatorSettings/>}
    </Popover>
  </>;
}

const compact = new Intl.NumberFormat("en-US", { notation:"compact", maximumFractionDigits:1 });
const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits:1 });
const price = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", minimumFractionDigits:2, maximumFractionDigits:4 });
const date = new Intl.DateTimeFormat("en-US", { timeZone:"America/New_York", month:"short", day:"numeric" });
const shares = (n: number | null) => n === null ? "—" : compact.format(n);
const percent = (n: number | null, signed = false) => n === null ? "—" : `${signed && n > 0 ? "+" : ""}${decimal.format(n)}%`;
const changeColor = (n: number | null) => n === null || n === 0 ? "text.secondary" : n > 0 ? "success.main" : "error.main";

function Reading({ label, value }: { label: string; value: string }) {
  return <Box sx={{minWidth:0,textAlign:"left"}}>
    <Typography component="dt" sx={{color:"text.secondary",fontSize:"0.62rem",lineHeight:1.15}}>{label}</Typography>
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
    sx={{minWidth:0,minHeight:0,maxHeight:420,overflowY:"auto",overflowX:"hidden",flex:"1 1 auto"}}>
    {rows.map(row => {
      const turnover = row.volume !== null && row.float !== null && row.float > 0 ? 100 * row.volume / row.float : null;
      const catalyst = row.news.find(item => Number.isFinite(Date.parse(item.createdAt)));
      const post = screen === "gainers" && row.gainBasis === "today_regular_close";
      return <Box role="listitem" key={row.symbol} data-scanner-stock-card={row.symbol}
        sx={{border:1,borderColor:"divider",borderRadius:0,mb:0.55,px:0.7,py:0.55,minWidth:0,bgcolor:"background.paper"}}>
        <Box sx={{display:"grid",gridTemplateColumns:"minmax(0,auto) minmax(0,1fr)",alignItems:"center",columnGap:0.65,rowGap:0.3,minWidth:0}}>
          <Box sx={{display:"flex",alignItems:"center",gap:0.4,minWidth:0}}>
            <Typography component="span" sx={{color:"warning.main",fontSize:"0.84rem",fontWeight:850,overflowWrap:"anywhere"}}>{row.symbol}</Typography>
            {renderHalt(row.symbol)}
            {row.country && <ScannerCountryFlag country={row.country}/>}
          </Box>
          <Box sx={{display:"flex",alignItems:"center",gap:0.6,ml:"auto",fontSize:"0.76rem",fontVariantNumeric:"tabular-nums"}}>
            <Typography component="span" variant="inherit" sx={{fontWeight:750,color:changeColor(row.sessionGain)}}>{price.format(row.price)}</Typography>
            <Typography component="span" variant="inherit" sx={{fontWeight:800,color:changeColor(row.sessionGain)}}
              aria-label={`${post ? "After-hours" : "Day"} change ${percent(row.sessionGain,true)}`}>
              {percent(row.sessionGain,true)}
            </Typography>
          </Box>
          <Box sx={{alignSelf:"center"}}>{renderTools(row)}</Box>
          <Box component="dl" aria-label="Basic stats"
          sx={{m:0,mt:0.15,display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:0.55,fontVariantNumeric:"tabular-nums"}}>
          <Reading label="Vol" value={shares(row.volume)}/>
          <Reading label="Float" value={shares(row.float)}/>
          <Reading label="T/O" value={percent(turnover)}/>
          <Reading label="RVOL" value={row.relativeVolume === null ? "—" : `${decimal.format(row.relativeVolume)}×`}/>
          </Box>
        </Box>
        {screen === "momentum" && <Typography sx={{fontSize:"0.65rem",color:"text.secondary",mt:0.4,overflowWrap:"anywhere"}}>
          {momentumSignalText(row)}
        </Typography>}
        {sections.map(section => section === "indicators" || catalyst ? <Box component="section" key={section}
          aria-label={SECTION_LABELS[section]} sx={{minWidth:0,borderTop:1,borderColor:"divider",mt:0.45,pt:0.35}}>
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
