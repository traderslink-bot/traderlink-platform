"use client";

import { type WorkspaceStock, type WorkspaceDecline, type WorkspacePullback, type WorkspaceSavedRow, workspacePrice as price } from "./broker-workspace-data";
import { scannerPercent, scannerRelativeVolume } from "../scanner-number-format";

import { ScannerPageTicker } from "./scanner-page-ticker";

import { scannerGainColor } from "../scanner-gain-color";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import CloseRounded from "@mui/icons-material/CloseRounded";
import FormControlLabel from "@mui/material/FormControlLabel";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import TableCell from "@mui/material/TableCell";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { createContext, startTransition, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";
import type { LiveScannerRow, ScannerKind, ScannerNewsItem } from "@/src/modules/scanner/live/contracts";

import { formatScannerFloatTurnover, scannerFloatTurnoverTitle, scannerVolumeLabel } from "@/src/modules/scanner/live/volume";
import { momentumSignalText } from "../momentum-signal-text";
import { useSideCardChartControls } from "../scanner-chart-launch-controls";
import { ScannerCountryFlag } from "../scanner-country-flag";
import { scannerCardLabelColor, ScannerIndicatorReads, ScannerIndicatorSettings } from "../scanner-card-indicators";
import { ScannerNewsLink } from "../scanner-news-drawer-context";

import { CARD_SECTION_LABELS as SECTION_LABELS, CARD_SECTIONS as SECTIONS, readCardSections, type CardSection } from "./scanner-card-sections";

import { optionalVolumeColumns, volumeColumnWidth, volumeLabels, workspaceVolumeColumns, workspaceVolumeValue,
  type OptionalVolumeColumn, type VolumeColumn, type VolumeRow } from "./workspace-volume";

export const WorkspaceCardSections = createContext<{
  sections?: readonly CardSection[];
  update: (sections: readonly CardSection[]) => void;
  afterHoursVolume?: boolean;
  volumeColumns?: readonly OptionalVolumeColumn[];
  updateVolumeColumns?: (columns: readonly OptionalVolumeColumn[]) => void;
} | null>(null);
export function useWorkspaceVolumeColumns(afterHours = false) {
  const workspace = useContext(WorkspaceCardSections);
  return workspaceVolumeColumns(workspace?.afterHoursVolume ?? afterHours, workspace?.volumeColumns);
}

export function WorkspaceVolumeHeaders({ columns }: { columns: readonly VolumeColumn[] }) {
  return columns.map(column => <TableCell key={column} scope="col" align={column === "dayVolume" ? "left" : "right"}
    sx={{ minWidth: volumeColumnWidth(column), whiteSpace: "nowrap" }}>
    {scannerVolumeLabel(column)}
  </TableCell>);
}

export function WorkspaceVolumeCells({ row, columns }: {
  row: VolumeRow; columns: readonly VolumeColumn[];
}) {
  return columns.map(column => <TableCell key={column} align={column === "dayVolume" ? "left" : "right"}>
    {workspaceVolumeValue(row, column)}
  </TableCell>);
}

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
  const workspace = useContext(WorkspaceCardSections);
  const stored = useSyncExternalStore(subscribe, readSections, () => "stats");
  const sections = workspace?.sections ?? readCardSections(stored.split(","));
  const update = (next: readonly CardSection[]) => {
    if (workspace) {
      workspace.update(next);
      return;
    }
    storedSections = next.join(",");
    try { window.localStorage.setItem(KEY, storedSections); } catch { /* Keep the preference in this tab. */ }
    listeners.forEach(listener => listener());
  };
  return { sections, update };
}

const scannerViews = { table: "Table", cards: "Cards", "two-rows": "Two rows" } as const;
export type ScannerView = keyof typeof scannerViews;

export function ScannerViewSettings({ label, view, onViewChange, children }: { label: string; view: ScannerView; onViewChange: (view: ScannerView) => void; children?: ReactNode }) {
  const { sections, update } = useTickerCardSections();
  const workspace = useContext(WorkspaceCardSections);
  const volumeColumns = workspace?.volumeColumns ?? [];
  const selectableVolumes = optionalVolumeColumns.filter(column => column !== "postMarketVolume" || !workspace?.afterHoursVolume);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const id = useId();
  return <>
    <Button size="small" variant="outlined" aria-label={`${label} view: ${scannerViews[view]}`} endIcon={<KeyboardArrowDownRounded fontSize="small"/>} aria-haspopup="dialog" aria-expanded={Boolean(anchor)} aria-controls={anchor ? id : undefined}
      onClick={event => setAnchor(event.currentTarget)} sx={{
        color:"text.primary",borderColor:"divider",bgcolor:"background.paper",
        fontSize:"0.68rem",lineHeight:1.2,textTransform:"none",whiteSpace:"nowrap",
        px:0.65,py:0.25,minHeight:24,minWidth:0,
        "&:hover":{borderColor:"text.secondary",bgcolor:"action.hover"},
        "& .MuiButton-endIcon":{ml:0.4,mr:0},
      }}>
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
          <Button size="small" color="inherit" key={value} aria-pressed={view===value}
            onClick={()=>{onViewChange(value);if(value!=="cards")setAnchor(null);}} sx={{width:"100%",minHeight:32,justifyContent:"flex-start",textTransform:"none",bgcolor:view===value?"action.selected":undefined}}>
            {text}
          </Button>)}
      </Box>
      {children}
      {workspace?.updateVolumeColumns && <Box role="group" aria-label="Volume columns"
        sx={{borderTop:1,borderColor:"divider",mt:0.75,pt:0.75}}>
        <Typography variant="body2" sx={{fontWeight:700,px:0.5}}>Volume columns</Typography>
        {selectableVolumes.map(column => <FormControlLabel key={column} sx={{m:0,display:"flex"}}
          label={volumeLabels[column]} control={<Checkbox size="small" checked={volumeColumns.includes(column)}
            onChange={(_, checked) => workspace.updateVolumeColumns?.(checked
              ? [...volumeColumns, column] : volumeColumns.filter(key => key !== column))}/>}/>)}
      </Box>}
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
const date = new Intl.DateTimeFormat("en-US", { timeZone:"America/New_York", month:"short", day:"numeric" });
const shares = (n: number | null) => n === null ? "—" : compact.format(n);
const percent = (n: number | null, signed = false) => n === null ? "—" : `${signed && n > 0 ? "+" : ""}${decimal.format(n)}%`;

function Reading({ label, value, title }: { label: string; value: ReactNode; title?: string }) {
  return <Box sx={{minWidth:0,textAlign:"left"}}>
    <Typography component="dt" title={title} sx={{color:scannerCardLabelColor,fontWeight:700,fontSize:"0.62rem",lineHeight:1.15}}>{label}</Typography>
    <Typography component="dd" sx={{m:0,fontWeight:650,fontSize:"0.72rem",lineHeight:1.25,overflowWrap:"anywhere"}}>{value}</Typography>
  </Box>;
}

type ScannerCardRow = WorkspaceStock | WorkspaceDecline | WorkspacePullback | WorkspaceSavedRow;
export function savedScanRowNews(row: WorkspaceSavedRow): ScannerNewsItem[] {
  const article = row.pressRelease;
  if (!article || !Number.isFinite(new Date(article.at).getTime())) return [];
  const publishedAt = new Date(article.at).toISOString();
  return [{ id: article.id, headline: article.title, createdAt: publishedAt, publishedAt,
    url: article.url, typeLabel: "Press Release" }];
}
const isLiveRow = (row: ScannerCardRow): row is WorkspaceStock => "sessionGain" in row;
const isHodRow = (row: ScannerCardRow): row is WorkspacePullback => "referenceHigh" in row;
type ScannerCardScreen = ScannerKind | "top-losers" | "high-drops" | "breakouts" | "saved";
const stockCardLabels: Record<ScannerCardScreen,string> = {
  gainers:"Top Gainers", momentum:"Momentum", "top-losers":"Top Losers", "high-drops":"HOD Drops", breakouts:"Breakouts", saved:"Saved scan",
};

export function ScannerStockCards<Row extends ScannerCardRow>({ rows, screen, now, renderTools, renderHalt, renderSignal, additionalStats }: {
  rows: readonly Row[];
  screen: ScannerCardScreen;
  now: number;
  renderSignal?: (row: Row) => ReactNode;
  additionalStats?: (row: Row) => readonly (readonly [label: string, value: ReactNode])[];
  renderTools: (row: Row) => ReactNode;
  renderHalt: (symbol: string) => ReactNode;
}) {
  const { sections } = useTickerCardSections();
  const inDrawer = useSideCardChartControls();
  const batchSize = 6;
  const [limit,setLimit]=useState(batchSize);
  const sentinel=useRef<HTMLDivElement>(null);
  const hasMore=inDrawer&&rows.length>limit;
  useEffect(()=>{
    const node=sentinel.current;
    if (!hasMore || !node) return;
    if (typeof IntersectionObserver==="undefined"){
      startTransition(()=>setLimit(rows.length));
      return;
    }
    const observer=new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting){
        observer.disconnect();
        startTransition(()=>setLimit(current=>current+batchSize));
      }
    },{root:node.parentElement,rootMargin:"0px 0px 24px"});
    observer.observe(node);
    return ()=>observer.disconnect();
  },[hasMore,limit,rows.length]);
  const firstRow = rows[0];
  const volumeColumns = useWorkspaceVolumeColumns(screen === "gainers" && firstRow !== undefined &&
    isLiveRow(firstRow) && firstRow.gainBasis === "today_regular_close");
  const [mainVolume] = volumeColumns;
  return <Box role="list" aria-label={`${stockCardLabels[screen]} stock cards`}
    sx={theme=>({...scannerScrollStyles(theme),minWidth:0,minHeight:0,maxHeight:420,overflowX:"hidden",flex:"1 1 auto"})}>
    {(inDrawer?rows.slice(0,limit):rows).map(row => {
      const live = isLiveRow(row) ? row : null;
      const hod = isHodRow(row) ? row : null;
      const saved = "dayChange" in row;
      const change = saved ? row.dayChange : isLiveRow(row) ? row.sessionGain : row.changePercent;
      const movement = hod ? (hod.belowHighPercent==null?null:-hod.belowHighPercent) : change;
      const turnover = formatScannerFloatTurnover(row,mainVolume);
      const volumes = volumeColumns.map(column => [scannerVolumeLabel(column), workspaceVolumeValue(row, column)]);
      const catalyst = (saved ? savedScanRowNews(row) : row.news).find(item => Number.isFinite(Date.parse(item.createdAt)));
      const post = screen === "gainers" && live?.gainBasis === "today_regular_close";
      const stats = saved ? [
        ...volumes,["Dollar vol",row.dollarVolume === null ? "—" : "$" + compact.format(row.dollarVolume)],
        ["Float",shares(row.float)],["Market cap",row.marketCap === null ? "—" : "$" + compact.format(row.marketCap)],
        ["T/O",turnover],
      ] : hod ? [
        ...volumes,["Float",shares(row.float)],["High",price(hod.referenceHigh)],["Spread",scannerPercent(row.spreadPercent, "—")],
      ] : [
        ...volumes,["Float",shares(row.float)],["T/O",turnover],
        live ? ["RVOL",scannerRelativeVolume(live.relativeVolume, "—")] : ["Spread",scannerPercent(row.spreadPercent, "—")],
      ];
      return <Box role="listitem" key={row.symbol} data-scanner-stock-card={row.symbol}
        sx={{border:1,borderColor:"divider",borderRadius:0,mb:0.55,px:0.7,py:0.55,minWidth:0,bgcolor:"background.paper"}}>
        <Box sx={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",alignItems:"center",columnGap:0.65,minWidth:0}}>
          <Box sx={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:0.4,minWidth:0}}>
            <ScannerPageTicker symbol={row.symbol}/>
            {renderHalt(row.symbol)}
            <ScannerCountryFlag country={row.country}/>
            <Box sx={{display:"inline-flex",alignItems:"center",gap:0.5,ml:0.5}}>{renderTools(row)}</Box>
          </Box>
          <Box sx={{display:"flex",alignItems:"center",gap:0.6,ml:"auto",fontSize:"0.76rem",fontVariantNumeric:"tabular-nums"}}>
            <Typography component="span" variant="inherit" sx={{fontWeight:750,color:scannerGainColor(change)}}>{price(row.price)}</Typography>
            <Typography component="span" variant="inherit" sx={{fontWeight:800,color:scannerGainColor(movement)}}
              aria-label={`${hod ? "Below session high" : post ? "After-hours change" : "Day change"} ${percent(movement,true)}`}>
              {percent(movement,true)}
            </Typography>
          </Box>
        </Box>
        {screen === "momentum" && live && <Typography sx={{fontSize:"0.65rem",color:theme=>theme.palette.mode==="dark"?"#c4b5fd":"#7c3aed",mt:0.4,overflowWrap:"anywhere"}}>
          {momentumSignalText(live as LiveScannerRow)}
        </Typography>}
        {renderSignal&&<Typography sx={{fontSize:"0.7rem",mt:0.4}}>{renderSignal(row)}</Typography>}
        {sections.map(section => section === "stats" ? <Box key={section} component="dl" aria-label="Stats"
          sx={{m:0,mt:0.65,display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:0.55,fontVariantNumeric:"tabular-nums"}}>
          {stats.map(([label,value]) => <Reading key={label} label={label} value={value}
            title={label==="T/O"?scannerFloatTurnoverTitle(mainVolume):undefined}/>)}
          {additionalStats?.(row).map(([label,value],index) =>
            <Reading key={`${index}:${label}`} label={label} value={value}/>)}
        </Box> : section === "indicators" || catalyst ? <Box component="section" key={section}
          aria-label={SECTION_LABELS[section]} sx={{minWidth:0,mt:0.65}}>
          {section === "indicators" ? row.price == null ? <Typography variant="caption" color="text.secondary">Indicators unavailable.</Typography> : <ScannerIndicatorReads row={{symbol:row.symbol,price:row.price}} now={now}/> : catalyst && (
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
    {hasMore&&<Box ref={sentinel} aria-hidden="true" sx={{height:1}}/>}
  </Box>;
}
