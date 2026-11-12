"use client";

import { scannerGainColor } from "./scanner-gain-color";

import { ChartMultiviewCharts } from "../charts/chart-multiview";
import { ChartMultiviewMenu } from "../charts/chart-multiview-menu";
import { useChartPreferences } from "../charts/use-chart-preferences";
import type { ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { useChartMultiview } from "../charts/use-chart-multiview";
import { chartCount, reconcileChartTickers, selectedChart, singleChart, type ChartMultiview } from "@/src/modules/scanner/alpaca/chart-multiview";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import ViewDayOutlined from "@mui/icons-material/ViewDayOutlined";
import ViewStreamOutlined from "@mui/icons-material/ViewStreamOutlined";
import { ScannerChartLaunchControls, SideCardChartControls, useSideCardChartControls } from "./scanner-chart-launch-controls";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import { Fragment, useEffect, useEffectEvent, useMemo, useRef, useState, useReducer, useId, type ReactNode } from "react";

import { PressReleaseArticleDrawer } from "@/app/(dashboard)/press-releases/press-release-article-drawer";
import { DashboardPanel, DashboardPrimaryAction } from "@/app/dashboard-template";
import { ScreenerPressReleaseBoard, useMarketEventsData } from "./screener-press-release-board";
import { ScannerWorkspaceCard } from "./scanner-workspace-card";
import { DEFAULT_SCANNER_WORKSPACE_LAYOUT, type ScannerWorkspaceWidget } from "./scanner-workspace-layout";
import { DeclinesCard } from "./declines-card";
import { ScannerCountryFlag } from "./scanner-country-flag";
import { ScannerStockCards, ScannerViewSettings, type ScannerView } from "./scanner-stock-cards";
import { ScannerProviderControls } from "./scanner-provider-controls";
import { ScannerTickerDetails } from "./scanner-ticker-details";
import { EMPTY_CHART_WORKSPACE, scannerChartWorkspace,replaceScannerChartPanel, type ScannerChartTarget } from "./scanner-chart-workspace";
import { DEFAULT_DECLINE_CONTROLS, RAPID_DROP_RETENTION_MINUTES } from "@/src/modules/scanner/live/declines";
import { PremarketPullbacksCard } from "./premarket-pullbacks-card";
import { ScreenerHaltIndicator } from "./screener-halt-indicator";
import { ScannerNewsDrawerProvider, ScannerRowNews } from "./scanner-news-drawer-context";
import { DEFAULT_PREMARKET_PULLBACK_CONTROLS } from "@/src/modules/scanner/live/premarket-pullbacks";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import type { LiveScannerRow, LiveScreenResults, ScannerActiveHalt, ScannerConfiguration, ScannerKind, ScannerReadModel,
  ScannerNewsItem, ScannerSession, ScreenFilters } from "@/src/modules/scanner/live/contracts";
import type { PressReleaseArticle } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { DEFAULT_MOMENTUM_DETECTION, DEFAULT_MOMENTUM_LIQUIDITY_BYPASS, marketEventsPressReleaseMaximumMarketCap, momentumDetectionControls, momentumLiquidityBypassControls } from "@/src/modules/scanner/live/settings";
import { gainerViewResults, type GainerView } from "@/src/modules/scanner/live/gainer-view";
import { selectActiveScannerHalts } from "@/src/modules/scanner/live/active-halts";
import { memberScannerStatus, SCANNER_UNAVAILABLE_MESSAGE } from "@/src/modules/scanner/live/member-status";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";
import { applyScannerDisplayContinuity, type ScannerDisplayContinuity } from "@/src/modules/scanner/live/display-continuity";

import { MomentumSections } from "./momentum-sections";
import { momentumSignalText } from "./momentum-signal-text";

const SCREEN_LABELS: Record<ScannerKind,string> = { gainers: "Top Gainers", momentum: "Momentum" };
const MOBILE_SCANNER_LAYOUT_KEY = "traderslink.scanner.mobile-layout.v1";
const MOBILE_SCANNER_TABS = [
  {widget:"gainers", label:"Gainers", accessibleLabel:"Top Gainers"},
  {widget:"momentum", label:"Momentum", accessibleLabel:"Momentum"},
  {widget:"top-losers", label:"Losers", accessibleLabel:"Top Losers"},
  {widget:"high-drops", label:"HOD Drops", accessibleLabel:"HOD Drops"},
  {widget:"market-events", label:"Events", accessibleLabel:"Market Events"},
] as const;
type MobileScannerTab = typeof MOBILE_SCANNER_TABS[number]["widget"];

function readMobileScannerLayout() {
  try { return typeof window !== "undefined" && window.localStorage.getItem(MOBILE_SCANNER_LAYOUT_KEY)==="tabs"; }
  catch { return false; }
}

const SESSION_LABELS: Record<ScannerSession,string> = { premarket: "Premarket", regular: "Regular hours", after_hours: "After hours" };
export const GAINERS_EXPLANATION = "This gainer list is not a standard list where percentage increase determines inclusion. The scanner qualifies candidates according to total vol, dollar vol, min gain and max spread. Day Gainers are ranked by gain from yesterday’s regular session close. Post market Gainers are ranked by gain from today’s regular close.";
const number = new Intl.NumberFormat("en-US",{ maximumFractionDigits: 2 });
const priceNumber = new Intl.NumberFormat("en-US",{ minimumFractionDigits:2,maximumFractionDigits:2 });
const wholePercent = new Intl.NumberFormat("en-US",{ maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US",{ notation: "compact",maximumFractionDigits: 1 });
const MIN_DESKTOP_GRID_HEIGHT=452;
export function availableScannerGridHeight(viewportHeight:number,gridTop:number):number{return Math.max(MIN_DESKTOP_GRID_HEIGHT,Math.floor(viewportHeight-gridTop-8));}
function value(input: number | null | undefined, suffix = ""): string {
  return input == null ? "n/a" : `${suffix==="%"?wholePercent.format(input):number.format(input)}${suffix}`;
}
function priceValue(input:number|null|undefined):string{return input==null?"n/a":priceNumber.format(input);}
function time(input: string | null): string { return input ? new Date(input).toLocaleTimeString([],{ hour: "numeric",minute: "2-digit",second: "2-digit" }) : "n/a"; }
function floatValue(input: number | null): string {
  if (input === null) return "—";
  if (input >= 1_000_000) return `${number.format(input/1_000_000)}M`;
  if (input >= 1_000) return `${number.format(input/1_000)}K`;
  return number.format(input);
}
function statusMessage(model: ScannerReadModel): string {
  if (model.status === "disabled") return "Live scanners are currently disabled.";
  if (model.status === "universe_missing") return "Today’s stock universe has not arrived yet.";
  if (model.status === "closed") return "The extended-hours scanning session is closed.";
  if (model.status === "warming") return "The scanner is collecting enough recent activity to calculate momentum.";
  if (model.status === "unavailable") return "Live scanner data is temporarily unavailable.";
  return model.status === "partial" ? "Some provider data is missing. Available rows are shown below." : "";
}

function NumberField({ label,current,nullable=false,onChange }: { label: string; current: number|null; nullable?: boolean; onChange: (next:number|null)=>void }) {
  return <TextField fullWidth label={label} size="small" type="number" value={current ?? ""}
    onChange={event => { const raw=event.target.value; onChange(raw === "" && nullable ? null : Number(raw)); }} />;
}

function NewsLinks({ row }: { row: LiveScannerRow }) {
  return <ScannerRowNews news={row.news}/>;
}

function floatTraded(row: LiveScannerRow): string | null {
  if (row.volume === null || row.float === null || row.float <= 0) return null;
  return `${wholePercent.format(100 * row.volume / row.float)}%`;
}

function ChartButton({ expanded=false,row,onOpenChart }: { expanded?:boolean; row: LiveScannerRow; onOpenChart: (row:LiveScannerRow)=>void }) {
  return <ScannerChartLaunchControls row={row} onOpenChart={onOpenChart} expanded={expanded}/>;
}

function usePriceMovement(rows: readonly LiveScannerRow[]): Readonly<Record<string,"up"|"down">> {
  const [movement,setMovement]=useState<Record<string,"up"|"down">>({});
  const previousPrices=useRef(new Map<string,number>());
  useEffect(()=>{
    const next=new Map<string,number>(),changed:Record<string,"up"|"down">={};
    for(const row of rows){const previous=previousPrices.current.get(row.symbol);next.set(row.symbol,row.price);if(previous!==undefined&&row.price!==previous)changed[row.symbol]=row.price>previous?"up":"down";}
    previousPrices.current=next;
    if(!Object.keys(changed).length)return;
    let clearTimer:ReturnType<typeof setTimeout>|undefined;
    const startTimer=setTimeout(()=>{setMovement(changed);clearTimer=setTimeout(()=>setMovement({}),900);},0);
    return()=>{clearTimeout(startTimer);if(clearTimer)clearTimeout(clearTimer);};
  },[rows]);
  return movement;
}

const movementTableSx={
  '@keyframes scanner-price-up':{ from:{ backgroundColor:"rgba(46,125,50,0.22)" },to:{ backgroundColor:"transparent" } },
  '@keyframes scanner-price-down':{ from:{ backgroundColor:"rgba(211,47,47,0.18)" },to:{ backgroundColor:"transparent" } },
};
const visibleExpandedPanelSx={boxSizing:"border-box",left:0,position:"sticky",width:"100cqw"} as const;
function movementRowSx(direction:"up"|"down"|undefined) {
  return { animation:direction?`scanner-price-${direction} 900ms ease-out`:"none",'@media (prefers-reduced-motion: reduce)':{ animation:"none" } };
}
function MomentumSignalRow({row,colSpan,leftOffset}:{row:LiveScannerRow;colSpan:number;leftOffset:string}){
  const label=momentumSignalText(row);
  return <TableRow data-momentum-signals={row.symbol}><TableCell colSpan={colSpan} sx={{borderBottom:1,borderColor:"divider",pl:`${leftOffset} !important`,pr:0.5,pt:"0 !important",pb:"0.3rem !important"}}>
    <Typography noWrap title={label} sx={{color:theme=>theme.palette.mode==="dark"?"#c4b5fd":"#7c3aed",fontSize:"0.58rem",fontWeight:400,lineHeight:1.15}}>{label}</Typography>
  </TableCell></TableRow>;
}

function CompactStockTable({ rows,screen,onOpenChart,haltByTicker,compactDesktop=false,twoRows=false }: { rows: readonly LiveScannerRow[]; screen: ScannerKind; onOpenChart:(row:LiveScannerRow)=>void; haltByTicker:ReadonlyMap<string,ScannerActiveHalt>; compactDesktop?:boolean; twoRows?:boolean }) {
  const allowAdd=useSideCardChartControls();
  const [expandedSymbol,setExpandedSymbol]=useState<string|null>(null);
  const movement=usePriceMovement(rows);
  const toggle=(symbol:string)=>setExpandedSymbol(current=>current===symbol?null:symbol);
  const metric=(label:string,content:string,change?:number|null)=><Box sx={{ minWidth:0 }}><Typography sx={{ color:"warning.main",fontSize:"0.68rem",fontWeight:750,lineHeight:1,textTransform:"uppercase" }}>{label}</Typography><Typography sx={{ fontSize:"0.9rem",fontWeight:750,lineHeight:1.3,mt:0.45,color:change===undefined?undefined:scannerGainColor(change) }}>{content}</Typography></Box>;
  const allHeaders=screen==="gainers"
    ? [{label:"",width:allowAdd?96:72},{label:"Ticker",width:48},{label:"Price",width:54},{label:"Gain %",width:48},{label:"Vol",width:50},{label:"Float",width:50},{label:"T/O",width:58},{label:"RVOL",width:44},{label:"HOD",width:62}]
    : [{label:"",width:allowAdd?96:72},{label:"Ticker",width:48},{label:"Price",width:54},{label:"Day %",width:48},{label:"1min %",width:48},{label:"5min %",width:48},{label:"1min Vol",width:58},{label:"5min Vol",width:58},{label:"1min ↑",width:48},{label:"5min ↑",width:48},{label:"Float",width:50},{label:"Spread",width:50}];
  const headers=twoRows?allHeaders.slice(1):[...allHeaders,{label:"Country",width:44}];
  return <TableContainer aria-label={compactDesktop?`${SCREEN_LABELS[screen]} compact list`:undefined}
    role={compactDesktop?"region":undefined} tabIndex={compactDesktop?0:undefined}
    sx={theme=>({ ...scannerScrollStyles(theme),containerType:"inline-size",maxHeight:compactDesktop?420:undefined,overflow:"auto",width:"100%" })}>
    <Table aria-label={twoRows?`${SCREEN_LABELS[screen]} two-row stocks`:compactDesktop?`${SCREEN_LABELS[screen]} compact stocks`:"Screener stocks"} stickyHeader={compactDesktop} size="small" sx={{ ...movementTableSx,tableLayout:"fixed",width:headers.reduce((total,header)=>total+header.width,0),minWidth:headers.reduce((total,header)=>total+header.width,0),'& .MuiTableCell-root':{ fontSize:"0.68rem",px:0.2,py:0.34 },'& .MuiTableCell-head':{ color:"text.secondary",fontSize:"0.6rem",fontWeight:750,lineHeight:1,pb:0.7,whiteSpace:"nowrap" } }}>
      <colgroup>{headers.map((header,index)=><col key={index} style={{width:header.width}}/>)}</colgroup>
      <TableHead><TableRow>{headers.map((header,index)=><TableCell align="left" aria-label={header.label||(index===0?"Chart, news and details":undefined)} key={`${header.label}-${index}`} sx={{ width:header.width }}>{header.label}</TableCell>)}</TableRow></TableHead>
      <TableBody>{rows.map(row=>{const expanded=expandedSymbol===row.symbol;const traded=floatTraded(row);const expandedMetrics=(screen==="gainers"?[
        metric("HOD price",`$${priceValue(row.dayHigh)}`),
        metric("HOD",value(row.offHighPercent,"%"),row.offHighPercent),
        metric("Session low",`$${priceValue(row.dayLow)}`),
        row.relativeVolume==null?null:metric("RVOL",`${number.format(row.relativeVolume)}×`),
        traded==null?null:metric("T/O",traded),
      ]:[
        row.momentumHit || row.momentumSignals?.length ? metric("Detected",momentumSignalText(row)) : null,
        row.activity.episodeShares==null?null:metric("Episode volume",compact.format(row.activity.episodeShares)),
        row.activity.episodeDollarVolume==null?null:metric("Episode $ volume",`$${compact.format(row.activity.episodeDollarVolume)}`),
        row.activity.episodeSeconds==null?null:metric("Episode time",`${number.format(row.activity.episodeSeconds)}s`),
        metric("Day %",value(row.sessionGain,"%"),row.sessionGain),
        row.postMarketGain===undefined?null:metric("Post %",value(row.postMarketGain,"%"),row.postMarketGain),
        row.volume===null?null:metric("Session volume",compact.format(row.volume)),
        row.activity.fiveMinuteVolume==null?null:metric("5m Vol",compact.format(row.activity.fiveMinuteVolume)),
        row.activity.volumeAcceleration===null?null:metric("1m Vol Spike",`${number.format(row.activity.volumeAcceleration)}×`),
        row.activity.fiveMinuteVolumeSpike==null?null:metric("5m Vol Spike",`${number.format(row.activity.fiveMinuteVolumeSpike)}×`),
        row.relativeVolume==null?null:metric("RVOL",`${number.format(row.relativeVolume)}×`),
        metric("HOD price",`$${priceValue(row.dayHigh)}`),
        metric("Below HOD",value(row.offHighPercent,"%"),row.offHighPercent),
        metric("Session low",`$${priceValue(row.dayLow)}`),
        traded==null?null:metric("Turnover",traded),
        row.spreadPercent===null?null:metric("Spread",value(row.spreadPercent,"%")),
      ]).filter(Boolean);const secondRowTools=<Box data-compact-row-controls sx={{display:"grid",gridTemplateColumns:allowAdd?"44px 20px 12px":"20px 20px 12px",alignItems:"center",columnGap:"8px",width:allowAdd?92:68}}><ChartButton row={row} onOpenChart={onOpenChart}/><NewsLinks row={row}/><ButtonBase aria-label={`${expanded?"Collapse":"Expand"} ${row.symbol} two-row details`} aria-expanded={expanded} onClick={()=>toggle(row.symbol)} sx={{color:"text.secondary",fontSize:"0.9rem",height:20,minWidth:12}}>{expanded?"−":"+"}</ButtonBase></Box>;return <Fragment key={row.symbol}>
        <TableRow aria-expanded={expanded} hover onClick={()=>toggle(row.symbol)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle(row.symbol);}}} sx={{ ...movementRowSx(movement[row.symbol]),cursor:"pointer",'& > td':{borderBottom:twoRows||screen==="momentum"?"none":undefined},'&:focus-visible':{ outline:"2px solid",outlineColor:"primary.main",outlineOffset:-2 } }} tabIndex={0}>
          {!twoRows?<TableCell sx={{px:"0.125rem !important"}}><Box data-compact-row-controls sx={{display:"grid",gridTemplateColumns:allowAdd?"44px 20px 12px":"20px 20px 12px",alignItems:"center",columnGap:"8px",width:allowAdd?92:68}}><ChartButton row={row} onOpenChart={onOpenChart}/><NewsLinks row={row}/><Typography aria-hidden component="span" sx={{color:"text.secondary",fontSize:"0.9rem",fontWeight:700,lineHeight:1}}>{expanded?"−":"+"}</Typography></Box></TableCell>:null}
          <TableCell><Stack direction="row" sx={{alignItems:"center",gap:0.25,minWidth:0}}><Typography noWrap component="span" sx={{color:"warning.main",fontSize:"0.68rem",fontWeight:800}}>{row.symbol}</Typography><ScreenerHaltIndicator halt={haltByTicker.get(row.symbol)}/></Stack></TableCell>
          <TableCell><Typography noWrap sx={{fontSize:"0.68rem",fontWeight:500,color:scannerGainColor(row.sessionGain)}}>${priceValue(row.price)}</Typography></TableCell>
          {screen==="gainers"?<>
            <TableCell sx={{color:scannerGainColor(row.sessionGain)}}>{value(row.sessionGain,"%")}</TableCell>
            <TableCell>{row.volume===null?"n/a":compact.format(row.volume)}</TableCell><TableCell>{floatValue(row.float)}</TableCell>
            <TableCell>{traded??"n/a"}</TableCell><TableCell>{row.relativeVolume==null?"n/a":`${number.format(row.relativeVolume)}×`}</TableCell>
            <TableCell sx={{color:scannerGainColor(row.offHighPercent)}}>{value(row.offHighPercent,"%")}</TableCell>
          </>:<>
            <TableCell sx={{color:scannerGainColor(row.sessionGain)}}>{value(row.sessionGain,"%")}</TableCell><TableCell sx={{color:scannerGainColor(row.activity.oneMinuteGain)}}>{value(row.activity.oneMinuteGain,"%")}</TableCell>
            <TableCell sx={{color:scannerGainColor(row.activity.fiveMinuteGain)}}>{value(row.activity.fiveMinuteGain,"%")}</TableCell>
            <TableCell>{row.activity.oneMinuteVolume==null?"n/a":compact.format(row.activity.oneMinuteVolume)}</TableCell><TableCell>{row.activity.fiveMinuteVolume==null?"n/a":compact.format(row.activity.fiveMinuteVolume)}</TableCell>
            <TableCell>{row.activity.volumeAcceleration==null?"n/a":`${number.format(row.activity.volumeAcceleration)}×`}</TableCell><TableCell>{row.activity.fiveMinuteVolumeSpike==null?"n/a":`${number.format(row.activity.fiveMinuteVolumeSpike)}×`}</TableCell>
            <TableCell>{floatValue(row.float)}</TableCell><TableCell>{value(row.spreadPercent,"%")}</TableCell>
          </>}
          {!twoRows?<TableCell><ScannerCountryFlag country={row.country}/></TableCell>:null}
        </TableRow>
        {twoRows?<TableRow data-two-row-tools={row.symbol}><TableCell sx={{py:"0.15rem !important"}}><ScannerCountryFlag country={row.country}/></TableCell><TableCell colSpan={headers.length-1} sx={{py:"0.15rem !important"}}>
          <Box sx={{...visibleExpandedPanelSx,width:"calc(100cqw - 48px)",display:"flex",alignItems:"center",gap:1,pt:0.15,pb:"4px"}}>{secondRowTools}
            {screen==="momentum"?<Typography noWrap title={momentumSignalText(row)} sx={{fontSize:"0.58rem",color:theme=>theme.palette.mode==="dark"?"#c4b5fd":"#7c3aed",minWidth:0}}>{momentumSignalText(row)}</Typography>:null}
          </Box>
        </TableCell></TableRow>:null}
        {!twoRows&&screen==="momentum"?<MomentumSignalRow row={row} colSpan={headers.length} leftOffset="4.5rem"/>:null}
        {expanded?<TableRow><TableCell colSpan={headers.length} sx={{ bgcolor:"action.hover",p:"0 !important" }}>
          <Box sx={{...visibleExpandedPanelSx,px:0.5,py:1}}>{expandedMetrics.length?<Box sx={{ display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",columnGap:1.25,rowGap:1.6,py:0.6 }}>
            {expandedMetrics.map((item,index)=><Fragment key={index}>{item}</Fragment>)}
          </Box>:null}
          <Box sx={{mt:1}}><NewsLinks row={row}/></Box>
          </Box>
        </TableCell></TableRow>:null}
      </Fragment>})}</TableBody>
    </Table>
  </TableContainer>;
}

function Results({ results,screen,onOpenChart,haltByTicker }: { results: LiveScreenResults; screen: ScannerKind; onOpenChart:(row:LiveScannerRow)=>void; haltByTicker:ReadonlyMap<string,ScannerActiveHalt> }) {
  const allowAdd=useSideCardChartControls();
  const [expandedDesktopSymbol,setExpandedDesktopSymbol]=useState<string|null>(null);
  const movement=usePriceMovement(results.rows);
  const showPostGain=screen==="momentum"&&results.rows.some(row=>row.postMarketGain!==undefined);
  if (!results.rows.length) return <Alert severity="info">No stocks currently qualify for this list.</Alert>;
  const desktopTableSx={
    ...movementTableSx,tableLayout:"fixed",
    width:"100%",
    '& .MuiTableCell-root':{ overflow:"hidden",px:0.25,py:0.42,fontSize:"0.68rem",textOverflow:"ellipsis",whiteSpace:"nowrap" },
    '& .MuiTableCell-head':{ color:"text.secondary",fontSize:"0.6rem",fontWeight:750,lineHeight:1,pb:0.85 },
  };
  return <>
    <TableContainer sx={theme=>({ ...scannerScrollStyles(theme),containerType:"inline-size",display:{ xs:"none",md:"block" },maxHeight:"calc(100dvh - 210px)" })}>
      {screen==="gainers"?<Table stickyHeader size="small" sx={desktopTableSx}><TableHead><TableRow>
        <TableCell aria-label="Chart and news" sx={{ px:"0 !important",width:48 }}/>
        {['Ticker','Price','Gain%','Vol','Float','T/O','RVOL','HOD','Country'].map(label => <TableCell key={label}>{label}</TableCell>)}
      </TableRow></TableHead><TableBody>{results.rows.map(row=><TableRow hover key={row.symbol} sx={movementRowSx(movement[row.symbol])}>
        <TableCell sx={{ px:"0 !important",width:allowAdd?72:48 }}><Stack direction="row" sx={{alignItems:"center",gap:0.5}}><ChartButton onOpenChart={onOpenChart} row={row}/><NewsLinks row={row}/></Stack></TableCell>
        <TableCell sx={{ fontWeight:800,pl:"0.5rem !important" }}><Stack direction="row" sx={{alignItems:"center",gap:0.25}}><Typography component="span" sx={{ color:"warning.main",font:"inherit",fontWeight:800 }}>{row.symbol}</Typography><ScreenerHaltIndicator halt={haltByTicker.get(row.symbol)}/></Stack></TableCell>
        <TableCell sx={{color:scannerGainColor(row.sessionGain)}}>${priceValue(row.price)}</TableCell><TableCell sx={{ color:scannerGainColor(row.sessionGain),fontWeight:750 }}>{value(row.sessionGain,"%")}</TableCell>
        <TableCell>{row.volume===null?"n/a":compact.format(row.volume)}</TableCell><TableCell>{floatValue(row.float)}</TableCell>
        <TableCell>{floatTraded(row)??"n/a"}</TableCell><TableCell>{row.relativeVolume==null?"n/a":`${number.format(row.relativeVolume)}×`}</TableCell>
        <TableCell sx={{color:scannerGainColor(row.offHighPercent)}}>{value(row.offHighPercent,"%")}</TableCell><TableCell><ScannerCountryFlag country={row.country}/></TableCell>
      </TableRow>)}</TableBody></Table>:<Table stickyHeader size="small" sx={desktopTableSx}><TableHead><TableRow>
        <TableCell aria-label="Details" sx={{ px:"0 !important",width:22 }}/>
        <TableCell aria-label="Chart and news" sx={{ px:"0.125rem !important",width:48 }}/>
        {['Ticker','Price','Day %',...(showPostGain?['Post %']:[]),'1min','5min','1min Vol','5min Vol','1min ↑','5min ↑','Float','Spread','Country'].map(label => <TableCell key={label} title={label==='Day %'?"Change from the previous trading day's regular close":label==='Post %'?"After-hours change from today's regular close":undefined}>{label}</TableCell>)}
      </TableRow></TableHead><TableBody>{results.rows.map(row=>{const expanded=expandedDesktopSymbol===row.symbol;return <Fragment key={row.symbol}>
        <TableRow aria-expanded={expanded} hover onClick={()=>setExpandedDesktopSymbol(current=>current===row.symbol?null:row.symbol)}
          onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setExpandedDesktopSymbol(current=>current===row.symbol?null:row.symbol);}}}
          sx={{ ...movementRowSx(movement[row.symbol]),cursor:"pointer",'& > td':{borderBottom:"none"},'&:focus-visible':{ outline:"2px solid",outlineColor:"primary.main",outlineOffset:-2 } }} tabIndex={0}>
          <TableCell sx={{ px:"0 !important",width:22 }}><ButtonBase aria-label={`${expanded?"Collapse":"Expand"} ${row.symbol} details`} onClick={event=>{event.stopPropagation();setExpandedDesktopSymbol(current=>current===row.symbol?null:row.symbol);}} sx={{ bgcolor:"rgba(255,193,7,0.14)",borderRadius:0.75,color:"warning.main",fontSize:"0.75rem",fontWeight:800,height:20,minWidth:20,'&:hover':{ bgcolor:"rgba(255,193,7,0.24)" },'&:focus-visible':{ outline:"2px solid",outlineColor:"warning.main",outlineOffset:1 } }}>{expanded?"−":"+"}</ButtonBase></TableCell>
          <TableCell sx={{ px:"0.125rem !important",width:allowAdd?72:48 }}><Stack direction="row" sx={{alignItems:"center",gap:0.5}}><ChartButton onOpenChart={onOpenChart} row={row}/><NewsLinks row={row}/></Stack></TableCell>
          <TableCell sx={{ fontWeight:800,pl:"0.3rem !important" }}><Stack direction="row" sx={{alignItems:"center",gap:0.25}}><Typography component="span" sx={{ color:"warning.main",font:"inherit",fontWeight:800 }}>{row.symbol}</Typography><ScreenerHaltIndicator halt={haltByTicker.get(row.symbol)}/></Stack></TableCell>
          <TableCell sx={{color:scannerGainColor(row.sessionGain)}}>${priceValue(row.price)}</TableCell><TableCell sx={{ color:scannerGainColor(row.sessionGain),fontWeight:750 }}>{value(row.sessionGain,"%")}</TableCell>
          {showPostGain?<TableCell sx={{ color:scannerGainColor(row.postMarketGain),fontWeight:750 }}>{value(row.postMarketGain,"%")}</TableCell>:null}
          <TableCell sx={{color:scannerGainColor(row.activity.oneMinuteGain)}}>{value(row.activity.oneMinuteGain,"%")}</TableCell><TableCell sx={{color:scannerGainColor(row.activity.fiveMinuteGain)}}>{value(row.activity.fiveMinuteGain,"%")}</TableCell>
          <TableCell>{row.activity.oneMinuteVolume==null?"n/a":compact.format(row.activity.oneMinuteVolume)}</TableCell><TableCell>{row.activity.fiveMinuteVolume==null?"n/a":compact.format(row.activity.fiveMinuteVolume)}</TableCell>
          <TableCell>{row.activity.volumeAcceleration==null?"n/a":`${number.format(row.activity.volumeAcceleration)}×`}</TableCell><TableCell>{row.activity.fiveMinuteVolumeSpike==null?"n/a":`${number.format(row.activity.fiveMinuteVolumeSpike)}×`}</TableCell>
          <TableCell>{floatValue(row.float)}</TableCell><TableCell>{value(row.spreadPercent,"%")}</TableCell>
          <TableCell><ScannerCountryFlag country={row.country}/></TableCell>
        </TableRow>
        <MomentumSignalRow row={row} colSpan={showPostGain?15:14} leftOffset="3.4rem"/>
        {expanded?<TableRow><TableCell colSpan={showPostGain?15:14} sx={{ bgcolor:"action.hover",p:"0 !important" }}>
          <Box sx={{...visibleExpandedPanelSx,display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:2,p:1.25}}>
            {[
              ["Detected",momentumSignalText(row)],
              ["Episode volume",row.activity.episodeShares==null?"n/a":compact.format(row.activity.episodeShares)],
              ["Episode $ volume",row.activity.episodeDollarVolume==null?"n/a":`$${compact.format(row.activity.episodeDollarVolume)}`],
              ["Episode time",row.activity.episodeSeconds==null?"n/a":`${number.format(row.activity.episodeSeconds)}s`],
              ["$ × Vol",row.dollarVolume===null?"n/a":`$${compact.format(row.dollarVolume)}`],
              ["RVOL",row.relativeVolume==null?"n/a":`${number.format(row.relativeVolume)}×`],
              ["HOD price",`$${priceValue(row.dayHigh)}`],
              ["Below HOD",value(row.offHighPercent,"%")],
              ["Session low",`$${priceValue(row.dayLow)}`],
              ["Turnover",floatTraded(row)??"n/a"],
            ].map(([label,content])=><Box key={label}><Typography sx={{ color:"warning.main",fontSize:"0.68rem",fontWeight:750,lineHeight:1,textTransform:"uppercase" }}>{label}</Typography><Typography sx={{ fontSize:"0.86rem",fontWeight:750,mt:0.45,color:label==="Below HOD"?scannerGainColor(row.offHighPercent):undefined }}>{content}</Typography></Box>)}
          </Box>
        </TableCell></TableRow>:null}
      </Fragment>})}</TableBody></Table>}
    </TableContainer>
    <Box sx={{ display:{ xs:"block",md:"none" },mb:-2,mx:-2 }}><CompactStockTable haltByTicker={haltByTicker} onOpenChart={onOpenChart} rows={results.rows} screen={screen}/></Box>
  </>;
}

function ScannerResultView({ results,screen,onOpenChart,haltByTicker,now,compactDesktop=false,displayMode="table" }: { results: LiveScreenResults | undefined; screen: ScannerKind; onOpenChart:(row:LiveScannerRow)=>void; haltByTicker:ReadonlyMap<string,ScannerActiveHalt>; now:number; compactDesktop?:boolean; displayMode?:"table"|"cards"|"two-rows" }) {
  if (!results) return <Skeleton height={440} variant="rounded"/>;
  if(displayMode==="cards")return results.rows.length?<ScannerStockCards rows={results.rows} screen={screen} now={now}
    renderHalt={symbol=><ScreenerHaltIndicator halt={haltByTicker.get(symbol)}/>}
    renderTools={row=><Box sx={{display:"flex",alignItems:"center",gap:0.65,flexShrink:0}}>
      <ChartButton row={row} onOpenChart={onOpenChart}/><NewsLinks row={row}/>
    </Box>}/>:<Alert severity="info">No stocks currently qualify for this list.</Alert>;
  if(displayMode==="two-rows")return results.rows.length?<CompactStockTable twoRows compactDesktop haltByTicker={haltByTicker} rows={results.rows} screen={screen} onOpenChart={onOpenChart}/>
    :<Alert severity="info">No stocks currently qualify for this list.</Alert>;
  if(compactDesktop)return results.rows.length?<CompactStockTable compactDesktop haltByTicker={haltByTicker} rows={results.rows} screen={screen} onOpenChart={onOpenChart}/>
    :<Alert severity="info">No stocks currently qualify for this list.</Alert>;
  return <Results haltByTicker={haltByTicker} onOpenChart={onOpenChart} results={results} screen={screen}/>;
}

function ScannerContents(props: Parameters<typeof ScannerResultView>[0]) {
  const sections = props.results?.momentumSections;
  if (props.screen !== "momentum" || !sections) return <ScannerResultView {...props}/>;
  return <MomentumSections sections={sections} compact={props.compactDesktop}
    renderResults={(rows,total) => <ScannerResultView {...props} results={{ rows, total, focus: [] }}/>}/>;
}

/** Compact scanner styling with the table scrolling inside its grid cell. */
function SidebarScreenerCard({children}:{children:ReactNode}) {
  return <Box data-sidebar-screener-card sx={{height:{xs:300,md:"100%"},minHeight:0,minWidth:0,overflow:"hidden",
    '& > [data-traderlink-platform-dashboard-card="panel"]':{height:"100%",minHeight:0},
    '& .MuiCardContent-root':{height:"100%",minHeight:0,display:"flex",flexDirection:"column",overflow:"hidden",p:0.5,'&:last-child':{pb:0.5}},
    '& h2, & .MuiTab-root':{fontSize:"0.9375rem !important",fontWeight:"700 !important",lineHeight:1.2},
    '& .MuiTabs-root, & .MuiTab-root':{minHeight:"18px !important"},
    '& .MuiCardContent-root > .MuiStack-root':{flexShrink:0,mb:0.5,minHeight:0},
    '& .MuiCardContent-root > .MuiBox-root:last-child':{mt:0.5,flex:"1 1 auto",minHeight:0,display:"flex",flexDirection:"column",overflow:"hidden"},
    '& .MuiCardContent-root > .MuiBox-root:last-child > .MuiStack-root':{flex:"1 1 auto",minHeight:0},
    '& .MuiTableContainer-root':{overscrollBehaviorY:"auto",flex:"1 1 auto",minHeight:0,maxHeight:"none !important",overflow:"auto"}}}>{children}</Box>;
}

function ScannerChartDrawer({open,temporary,onBack,onSaveTemporary,charts,row,onClose,onSelect,onRemove,onAdd,screeners,section,onSectionChange,stocks,fallbackQuotes,postMarket,layout,onLayoutChange,layoutReady,layoutMessage,defaultTimeframe}: {
  open:boolean;temporary:boolean;onBack:()=>void;onSaveTemporary:()=>void;
  layout:ChartMultiview;onLayoutChange:(next:ChartMultiview)=>void;layoutReady:boolean;layoutMessage:string;defaultTimeframe:ChartTimeframe;
  charts:readonly ScannerChartTarget[];row:ScannerChartTarget|null;onClose:()=>void;onSelect:(symbol:string)=>void;onRemove:(symbol:string)=>void;onAdd:(symbol:string)=>void;
  screeners:ReactNode;section:"details"|"screeners";onSectionChange:(section:"details"|"screeners")=>void;stocks:readonly LiveScannerRow[];fallbackQuotes:readonly {symbol:string;price:number;changePercent:number|null}[];postMarket:boolean;
}) {
  const tabsId=useId();

  const [newChartSymbol,setNewChartSymbol]=useState("");
  const addChart=()=>{const symbol=newChartSymbol.trim().toUpperCase();if(/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol)){onAdd(symbol);setNewChartSymbol("");}};
  const [levelsActionTarget,setLevelsActionTarget]=useState<HTMLDivElement|null>(null);
  return <Drawer anchor="right" onClose={onClose} open={open&&charts.length>0} slotProps={{paper:{role:"dialog","aria-modal":true,"aria-label":"Chart workspace",sx:{borderRadius:0,'& [data-traderlink-platform-dashboard-card="panel"]':{borderRadius:0},maxWidth:"100vw",width:row?.showDetails?"100vw":{xs:"100vw",md:"78vw",xl:1180}}}}}>
    <Stack sx={{height:"100dvh",minHeight:0}}>
      <Stack direction="row" sx={{alignItems:"center",borderBottom:1,borderColor:"divider",justifyContent:"space-between",flexShrink:0,px:{xs:1.5,md:2},py:0}}>
        <Box sx={{minWidth:0}}>
          <Stack direction="row" data-chart-header-controls sx={{alignItems:"center",flexWrap:"wrap",gap:0.75}}>
            <Typography color="text.secondary" variant="body2">TradersLink + TradingView charts</Typography>
            {temporary?<><Button size="small" onClick={onBack}>Back to saved charts</Button>
              <Button size="small" onClick={onSaveTemporary}>Add to saved charts</Button></>:<>
            <Box component="form" onSubmit={event=>{event.preventDefault();addChart();}} sx={{display:"flex",alignItems:"center",gap:0.5}}>
              <TextField value={newChartSymbol} onChange={event=>setNewChartSymbol(event.target.value)} placeholder="Ticker" slotProps={{htmlInput:{"aria-label":"Add chart ticker",maxLength:15}}} size="small" sx={{width:82,'& input':{py:0.4,px:0.75,fontSize:12}}}/>
              <Button type="submit" size="small" disabled={!/^[A-Z][A-Z0-9.-]{0,14}$/.test(newChartSymbol.trim().toUpperCase())} sx={{minWidth:0,px:0.5,fontSize:11}}>Add chart</Button>
            </Box>
            <ChartMultiviewMenu layout={layout} defaultTimeframe={defaultTimeframe} onChange={onLayoutChange} disabled={!layoutReady}/>{layoutMessage?<Typography role="status" variant="caption">{layoutMessage}</Typography>:null}
            {charts.map(chart=><Box key={chart.symbol} sx={{display:"inline-flex",alignItems:"center",borderRadius:1,bgcolor:row?.symbol===chart.symbol?"action.selected":undefined}}>
              <Button size="small" aria-pressed={row?.symbol===chart.symbol} aria-label={`Show ${chart.symbol} details`} onClick={()=>{onSelect(chart.symbol);onSectionChange("details");}} sx={{px:0.5,py:0,minHeight:24,minWidth:0,color:"warning.main",fontWeight:800,textTransform:"none"}}>{chart.symbol}</Button>
              <IconButton size="small" aria-label={`Close ${chart.symbol} chart`} onClick={()=>onRemove(chart.symbol)} sx={{p:0.5}}><CloseRoundedIcon sx={{fontSize:16}}/></IconButton>
            </Box>)}</>}
          </Stack>
        </Box>
        <IconButton aria-label="Close chart" onClick={onClose} sx={{p:"5px",flexShrink:0}}><CloseRoundedIcon/></IconButton>
      </Stack>
      <Box data-chart-workspace-scroll sx={{flex:1,minHeight:0,display:{xs:"block",md:"grid"},gridTemplateColumns:row?.showDetails?{xs:"1fr",md:"minmax(0,2fr) minmax(380px,1fr)"}:"1fr",overflowY:{xs:"auto",md:"hidden"},overscrollBehaviorY:"auto"}}>
        <Box data-workspace-charts sx={{display:"flex",minWidth:0,minHeight:0,height:{xs:"65dvh",md:"auto"},p:{xs:0,md:0.5}}}>
          <ChartMultiviewCharts key={temporary?"temporary":"saved"} plain={temporary} viewPrefix={temporary?"temporary-":""} workspace="scanner" defaultTimeframe={defaultTimeframe} layout={layout} onChange={onLayoutChange} onSelectTicker={onSelect} activeSymbol={row?.symbol} allowEmpty ready={layoutReady}/>
        </Box>
        {row?.showDetails?<Stack component="aside" aria-label="Chart workspace details" spacing={0.5} sx={{minWidth:0,minHeight:0,pl:2,pr:0.5,py:0.5,borderLeft:{md:1},borderColor:"divider",overflow:{xs:"visible",md:"hidden"}}}>
          <Stack direction="row" sx={{alignItems:"center",gap:0.75,minWidth:0,flexShrink:0,borderBottom:1,borderColor:"divider"}}>
          <Tabs value={section==="screeners"?"screeners":row.symbol} onChange={(_,value:string)=>{if(value==="screeners")onSectionChange("screeners");else{onSelect(value);onSectionChange("details");}}} variant="scrollable" scrollButtons="auto" aria-label="Open stock details" sx={{minHeight:34,flex:1,minWidth:0,'& .MuiTab-root':{minHeight:34,minWidth:0,px:1.25,py:0.5,fontSize:"0.8rem",textTransform:"none"},'& .MuiTab-root.Mui-selected':{color:"warning.main",bgcolor:"action.selected",fontWeight:800},'& .MuiTabs-indicator':{bgcolor:"warning.main",height:3}}}>
            {charts.map(chart=><Tab key={chart.symbol} value={chart.symbol} label={chart.symbol} id={`${tabsId}-${chart.symbol}-tab`} aria-controls={`${tabsId}-${chart.symbol}-panel`}/>)}
            {!temporary&&<Tab value="screeners" label="Scanners" id={`${tabsId}-screeners-tab`} aria-controls={`${tabsId}-screeners-panel`}/>}
          </Tabs>
            <Box data-levels-action-slot ref={setLevelsActionTarget} sx={{flexShrink:0}}/>
          </Stack>
          {charts.map(chart=><Box key={chart.symbol} role="tabpanel" id={`${tabsId}-${chart.symbol}-panel`} aria-labelledby={`${tabsId}-${chart.symbol}-tab`} hidden={section!=="details"||row.symbol!==chart.symbol} sx={{flex:{xs:"0 0 auto",md:1},minHeight:0,overflowY:{xs:"visible",md:"auto"}}}>
            <ScannerTickerDetails symbol={chart.symbol} stock={stocks.find(stock=>stock.symbol===chart.symbol)??chart.stock} quote={fallbackQuotes.find(quote=>quote.symbol===chart.symbol)} postMarket={postMarket} actionTarget={levelsActionTarget} active={row.symbol===chart.symbol} onGenerate={()=>onSectionChange("details")}/>
          </Box>)}
          <Box role="tabpanel" id={`${tabsId}-screeners-panel`} aria-labelledby={`${tabsId}-screeners-tab`} hidden={section!=="screeners"} sx={{flex:{xs:"0 0 auto",md:1},minHeight:0}}>{section==="screeners"?screeners:null}</Box>
        </Stack>:null}
      </Box>
    </Stack>
  </Drawer>;
}

function AdminControls({ configuration,onSaved }: { configuration: ScannerConfiguration; onSaved:(next:ScannerConfiguration)=>void }) {
  const [draft,setDraft]=useState(configuration), [screen,setScreen]=useState<ScannerKind>("gainers"), [session,setSession]=useState<ScannerSession>("premarket");
  const [saving,setSaving]=useState(false), [message,setMessage]=useState<string|null>(null);
  const controls=draft[screen], filters=controls.filters[session];
  const momentumDetection=momentumDetectionControls(draft)[session];
  const allowEarlyLiquidityBypass=momentumLiquidityBypassControls(draft)[session];
  const updateMomentumDetection=(next:Partial<typeof momentumDetection>)=>setDraft(current=>{const all=current.momentumDetection??DEFAULT_MOMENTUM_DETECTION;return {...current,momentumDetection:{...all,[session]:{...all[session],...next}}};});
  const updateMomentumLiquidityBypass=(enabled:boolean)=>setDraft(current=>{const all=current.momentumLiquidityBypass??DEFAULT_MOMENTUM_LIQUIDITY_BYPASS;return {...current,momentumLiquidityBypass:{...all,[session]:enabled}};});
  const declines=draft.declines??DEFAULT_DECLINE_CONTROLS;
  const updateDeclines=(next:Partial<typeof declines>)=>setDraft(current=>({...current,declines:{...(current.declines??DEFAULT_DECLINE_CONTROLS),...next}}));
  const pmPullbacks=draft.premarketPullbacks??DEFAULT_PREMARKET_PULLBACK_CONTROLS;
  const updatePmPullbacks=(next:Partial<typeof pmPullbacks>)=>setDraft(current=>({...current,premarketPullbacks:{...(current.premarketPullbacks??DEFAULT_PREMARKET_PULLBACK_CONTROLS),...next}}));
  const updateControls=(next:Partial<typeof controls>)=>setDraft(current=>({ ...current,[screen]:{ ...current[screen],...next } }));
  const updateFilter=(next:Partial<ScreenFilters>)=>updateControls({ filters:{ ...controls.filters,[session]:{ ...filters,...next } } });
  const save=async()=>{ setSaving(true);setMessage(null);try{
    const response=await fetch('/api/admin/screeners/settings',{ method:'POST',credentials:'same-origin',headers:{ 'content-type':'application/json',[PLATFORM_MUTATION_REQUEST_HEADER]:'1' },body:JSON.stringify({ expectedRevision:configuration.revision,configuration:draft }) });
    const payload=await response.json(); if(!response.ok) throw Error(payload.code||'save_failed'); setDraft(payload.configuration);onSaved(payload.configuration);setMessage('Scanner settings saved.');
  }catch(error){setMessage(error instanceof Error&&error.message==='scanner_settings_conflict'?'Settings changed. Reload the page before saving.':'Scanner settings were not saved.');}finally{setSaving(false);}};
  return <DashboardPanel title="Scanner controls" action={<DashboardPrimaryAction disabled={saving} onClick={()=>void save()}>{saving?'Saving…':'Save settings'}</DashboardPrimaryAction>}>
    <Stack spacing={2}>
      {message?<Alert severity={message.endsWith('saved.')?'success':'error'}>{message}</Alert>:null}
      <ScannerProviderControls/>
      <FormControlLabel control={<Switch checked={draft.enabled} onChange={event=>setDraft(current=>({ ...current,enabled:event.target.checked }))} />} label="Enable live scanners" />
      <Box sx={{maxWidth:{xs:"100%",sm:320}}}><NumberField label="Market Events PR maximum market cap ($)" current={marketEventsPressReleaseMaximumMarketCap(draft)} onChange={next=>next!==null&&setDraft(current=>({...current,marketEventsPressReleaseMaximumMarketCap:next}))}/></Box>
      <Tabs aria-label="Scanner settings" onChange={(_,next:ScannerKind)=>setScreen(next)} value={screen} variant="scrollable"><Tab label="Top Gainers" value="gainers"/><Tab label="Momentum" value="momentum"/></Tabs>
      <Box sx={{ display:"grid",gridTemplateColumns:{ xs:"1fr",sm:"repeat(2,minmax(0,1fr))",lg:"repeat(4,minmax(0,1fr))" },gap:1.5 }}>
        <NumberField label="List stocks" current={controls.displayLimit} onChange={next=>next!==null&&updateControls({ displayLimit:next })}/>
        <NumberField label="Focused stocks" current={controls.focus.maximumStocks} onChange={next=>next!==null&&updateControls({ focus:{ ...controls.focus,maximumStocks:next } })}/>
        <TextField select fullWidth label="Session filters" size="small" value={session} onChange={event=>setSession(event.target.value as ScannerSession)}>{Object.entries(SESSION_LABELS).map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>
        <NumberField label="Maximum market cap ($)" current={filters.maximumMarketCap} onChange={next=>next!==null&&updateFilter({ maximumMarketCap:next })}/>
        <NumberField label="Minimum price" current={filters.minimumPrice} onChange={next=>next!==null&&updateFilter({ minimumPrice:next })}/>
        <NumberField label="Maximum price" current={filters.maximumPrice} nullable onChange={next=>updateFilter({ maximumPrice:next })}/>
        <NumberField label="Maximum float (shares)" current={filters.maximumFloat} nullable onChange={next=>updateFilter({ maximumFloat:next })}/>
        <NumberField label="Minimum volume (shares)" current={filters.minimumVolume} onChange={next=>next!==null&&updateFilter({ minimumVolume:next })}/>
        <NumberField label="Minimum dollar volume ($)" current={filters.minimumDollarVolume} onChange={next=>next!==null&&updateFilter({ minimumDollarVolume:next })}/>
        <NumberField label="Minimum session gain %" current={filters.minimumSessionGain} nullable onChange={next=>updateFilter({ minimumSessionGain:next })}/>
        <NumberField label="Maximum spread %" current={filters.maximumSpreadPercent} nullable onChange={next=>updateFilter({ maximumSpreadPercent:next })}/>
        <NumberField label="Confirmation scans" current={controls.focus.confirmationScans} onChange={next=>next!==null&&updateControls({ focus:{ ...controls.focus,confirmationScans:next } })}/>
        <NumberField label="Replacement improvement %" current={controls.focus.replacementImprovementPercent} onChange={next=>next!==null&&updateControls({ focus:{ ...controls.focus,replacementImprovementPercent:next } })}/>
        <NumberField label="Minimum 1-minute gain %" current={controls.focus.minimumOneMinuteGain} onChange={next=>next!==null&&updateControls({ focus:{ ...controls.focus,minimumOneMinuteGain:next } })}/>
        <NumberField label="Minimum 5-minute gain %" current={controls.focus.minimumFiveMinuteGain} onChange={next=>next!==null&&updateControls({ focus:{ ...controls.focus,minimumFiveMinuteGain:next } })}/>
        <NumberField label="Minimum volume acceleration" current={controls.focus.minimumVolumeAcceleration} onChange={next=>next!==null&&updateControls({ focus:{ ...controls.focus,minimumVolumeAcceleration:next } })}/>
        <NumberField label="Minimum 1-minute dollar volume" current={controls.focus.minimumOneMinuteDollarVolume} onChange={next=>next!==null&&updateControls({ focus:{ ...controls.focus,minimumOneMinuteDollarVolume:next } })}/>
      </Box>
      {screen==="momentum"?<><Typography component="h3" sx={{fontWeight:800}}>Early momentum detection</Typography>
      <FormControlLabel control={<Switch checked={allowEarlyLiquidityBypass} onChange={event=>updateMomentumLiquidityBypass(event.target.checked)}/>} label={`Allow early signals to bypass ${SESSION_LABELS[session].toLowerCase()} cumulative volume minimums`}/>
      <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"repeat(2,minmax(0,1fr))",lg:"repeat(4,minmax(0,1fr))"},gap:1.5}}>
        <NumberField label="Immediate volume rate ×" current={momentumDetection.immediateVolumeRateMultiple} onChange={next=>next!==null&&updateMomentumDetection({immediateVolumeRateMultiple:next})}/>
        <NumberField label="Building volume rate ×" current={momentumDetection.buildingVolumeRateMultiple} onChange={next=>next!==null&&updateMomentumDetection({buildingVolumeRateMultiple:next})}/>
        <NumberField label="Episode minimum shares" current={momentumDetection.minimumEpisodeShares} onChange={next=>next!==null&&updateMomentumDetection({minimumEpisodeShares:next})}/>
        <NumberField label="Episode minimum $ volume" current={momentumDetection.minimumEpisodeDollarVolume} onChange={next=>next!==null&&updateMomentumDetection({minimumEpisodeDollarVolume:next})}/>
        <NumberField label="Episode minimum turnover %" current={momentumDetection.minimumEpisodeFloatTurnoverPercent} onChange={next=>next!==null&&updateMomentumDetection({minimumEpisodeFloatTurnoverPercent:next})}/>
        <NumberField label="Price burst %" current={momentumDetection.priceBurstPercent} onChange={next=>next!==null&&updateMomentumDetection({priceBurstPercent:next})}/>
        <NumberField label="Price burst max seconds" current={momentumDetection.maximumPriceBurstSeconds} onChange={next=>next!==null&&updateMomentumDetection({maximumPriceBurstSeconds:next})}/>
        <NumberField label="Building confirmation scans" current={momentumDetection.buildingConfirmationScans} onChange={next=>next!==null&&updateMomentumDetection({buildingConfirmationScans:next})}/>
        <NumberField label="Quiet scans to close episode" current={momentumDetection.episodeQuietScans} onChange={next=>next!==null&&updateMomentumDetection({episodeQuietScans:next})}/>
        <NumberField label="Episode quiet expiry seconds" current={momentumDetection.episodeQuietSeconds} onChange={next=>next!==null&&updateMomentumDetection({episodeQuietSeconds:next})}/>
      </Box></>:null}
      <Typography component="h3" sx={{fontWeight:800}}>Top Losers and Rapid Drop Detection</Typography>
      <FormControlLabel control={<Switch checked={declines.enabled} onChange={event=>updateDeclines({enabled:event.target.checked})}/>} label="Enable Top Losers and Rapid Drop detection"/>
      <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"repeat(2,minmax(0,1fr))",lg:"repeat(4,minmax(0,1fr))"},gap:1.5}}>
        <NumberField label="List stocks" current={declines.displayLimit} onChange={next=>next!==null&&updateDeclines({displayLimit:next})}/>
        <NumberField label="Minimum rapid drop %" current={declines.minimumDropPercent} onChange={next=>next!==null&&updateDeclines({minimumDropPercent:next})}/>
        <NumberField label="Drop within (minutes)" current={declines.windowMinutes} onChange={next=>next!==null&&updateDeclines({windowMinutes:next})}/>
        <NumberField label="Keep after detection (max 5 min)" current={Math.min(declines.retentionMinutes,RAPID_DROP_RETENTION_MINUTES)} onChange={next=>next!==null&&updateDeclines({retentionMinutes:Math.min(next,RAPID_DROP_RETENTION_MINUTES)})}/>
      </Box>
      <Typography component="h3" sx={{fontWeight:800}}>HOD Drops</Typography>
      <FormControlLabel control={<Switch checked={pmPullbacks.enabled} onChange={event=>updatePmPullbacks({enabled:event.target.checked})}/>} label="Enable HOD Drops"/>
      <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"repeat(2,minmax(0,1fr))",lg:"repeat(3,minmax(0,1fr))"},gap:1.5}}>
        <NumberField label="List stocks" current={pmPullbacks.displayLimit} onChange={next=>next!==null&&updatePmPullbacks({displayLimit:next})}/>
        <NumberField label="Minimum drop from a session high %" current={pmPullbacks.minimumPullbackPercent} onChange={next=>next!==null&&updatePmPullbacks({minimumPullbackPercent:next})}/>
        <NumberField label="Remove when drop is below %" current={pmPullbacks.removeWithinPercent} onChange={next=>next!==null&&updatePmPullbacks({removeWithinPercent:next})}/>
      </Box>
    </Stack>
  </DashboardPanel>;
}

type ManualTicker=Readonly<{symbol:string;exchange:"NASDAQ"|"NYSE"|"AMEX";addedAtUtc:string}>;
function ManualTickersAdmin(){
  const [tickers,setTickers]=useState<readonly ManualTicker[]>([]),[symbol,setSymbol]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState<string|null>(null);
  useEffect(()=>{let active=true;void fetch("/api/admin/screeners/manual-tickers",{cache:"no-store",credentials:"same-origin"}).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(payload=>{if(active)setTickers(payload.tickers??[]);}).catch(()=>{if(active)setMessage("Added tickers could not be loaded.");});return()=>{active=false;};},[]);
  const mutate=async(method:"POST"|"DELETE",ticker:string)=>{setBusy(true);setMessage(null);try{const url=method==="DELETE"?`/api/admin/screeners/manual-tickers?symbol=${encodeURIComponent(ticker)}`:"/api/admin/screeners/manual-tickers";const response=await fetch(url,{method,credentials:"same-origin",headers:{...(method==="POST"?{"content-type":"application/json"}:{}),[PLATFORM_MUTATION_REQUEST_HEADER]:"1"},...(method==="POST"?{body:JSON.stringify({symbol:ticker})}:{})});const payload=await response.json();if(!response.ok)throw Error(payload.code??"save_failed");setTickers(payload.tickers??[]);setSymbol("");}catch(error){setMessage(error instanceof Error&&error.message==="ticker_not_found"?"Ticker was not found on Nasdaq or NYSE.":"Ticker was not changed.");}finally{setBusy(false);}};
  return <DashboardPanel title="Added tickers"><Stack spacing={1.25} sx={{maxWidth:420}}>
    <Stack direction="row" spacing={1}><TextField fullWidth label="Ticker" onChange={event=>setSymbol(event.target.value.toUpperCase())} size="small" slotProps={{htmlInput:{maxLength:16}}} value={symbol}/><Button disabled={busy||!symbol.trim()} onClick={()=>void mutate("POST",symbol)} variant="contained">Add</Button></Stack>
    {message?<Alert severity="error">{message}</Alert>:null}
    {tickers.length?<Stack>{tickers.map(ticker=><Stack direction="row" key={ticker.symbol} sx={{alignItems:"center",borderTop:1,borderColor:"divider",justifyContent:"space-between",minHeight:38}}><Box><Typography sx={{fontWeight:850}}>{ticker.symbol}</Typography><Typography color="text.secondary" variant="caption">{ticker.exchange}</Typography></Box><Button color="error" disabled={busy} onClick={()=>void mutate("DELETE",ticker.symbol)} size="small">Remove</Button></Stack>)}</Stack>:<Typography color="text.secondary" variant="body2">No tickers added.</Typography>}
  </Stack></DashboardPanel>;
}

export function LiveScreenersClient({ admin=false }: { admin?: boolean }) {
  const workspaceLayout=DEFAULT_SCANNER_WORKSPACE_LAYOUT;
  const mobile = useMediaQuery("(max-width:899.95px)") && !admin;
  const [preferTabs,setPreferTabs]=useState(readMobileScannerLayout);
  const [activeScanner,setActiveScanner]=useState<MobileScannerTab>("gainers");
  const mobileTabs = mobile && preferTabs;
  const mobileTabsId = useId();
  const showScanner = (widget: ScannerWorkspaceWidget) => !mobileTabs || widget===activeScanner;
  const toggleMobileLayout = () => {
    const next = !preferTabs;
    setPreferTabs(next);
    try { window.localStorage.setItem(MOBILE_SCANNER_LAYOUT_KEY,next?"tabs":"stacked"); }
    catch { /* Keep this choice for the current page. */ }
  };
  const [model,setModel]=useState<ScannerReadModel|null>(null), [configuration,setConfiguration]=useState<ScannerConfiguration|null>(null);
  const momentumSections = model?.momentum.momentumSections;
  const momentumStocks = momentumSections ? [...momentumSections.confirmed,...momentumSections.early] : model?.momentum.rows ?? [];
  const displayContinuity=useRef<ScannerDisplayContinuity>({emptySince:null});
  const [chartWorkspace,dispatchChart]=useReducer(scannerChartWorkspace,EMPTY_CHART_WORKSPACE);
  const chartView=useChartMultiview("scanner");
  const { preferences:chartPreferences, ready:preferencesReady, message:preferencesMessage }=useChartPreferences();
  const defaultTimeframe=chartPreferences.timeframe;
  const chartOpeningReady=(preferencesReady||Boolean(preferencesMessage))&&(chartView.ready||Boolean(chartView.message));
  const pendingChart=useRef<ScannerChartTarget|null>(null);
  const chartLayout=reconcileChartTickers(chartView.layout,chartWorkspace.charts.map(chart=>chart.symbol),defaultTimeframe);
  const chartRow=chartWorkspace.charts.find(chart=>chart.symbol===chartWorkspace.selectedSymbol)??null;
  const [workspaceSection,setWorkspaceSection]=useState<"details"|"screeners">("details");
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [temporary,setTemporary]=useState<{chart:ScannerChartTarget;layout:ChartMultiview}|null>(null);
  const [replacement,setReplacement]=useState<ScannerChartTarget|null>(null);
  const selectSavedChart=(symbol:string)=>{
    const group=chartLayout.groups.find(item=>item.symbol===symbol);
    if(group&&!group.panels.some(panel=>panel.id===chartLayout.selectedPanel))
      chartView.change({...chartLayout,selectedPanel:group.panels[0].id});
    dispatchChart({type:"select",symbol});
  };
  const saveCharts=(next:ChartMultiview,chart?:ScannerChartTarget)=>{
    chartView.change(next);
    dispatchChart({type:"configure",selectedSymbol:selectedChart(next)?.group.symbol??null,
      charts:next.groups.map(group=>chart?.symbol===group.symbol?chart:
        chartWorkspace.charts.find(item=>item.symbol===group.symbol)??{symbol:group.symbol,exchange:"NASDAQ",showDetails:true})});
  };
  const openChart=(request:ScannerChartTarget)=>{
    const chart={...request,showDetails:true,stock:request.stock??[...(model?.gainers.rows??[]),...(model?.dayGainers?.rows??[]),...(model?.momentum.rows??[])].find(stock=>stock.symbol===request.symbol)};
    if(chartLayout.groups.some(group=>group.symbol===chart.symbol)){
      setTemporary(null);selectSavedChart(chart.symbol);setWorkspaceSection("details");setDrawerOpen(true);return;
    }
    if(!request.addChart&&chartLayout.groups.length){
      setTemporary({chart,layout:singleChart(chart.symbol,defaultTimeframe)});setDrawerOpen(true);return;
    }
    if(chartCount(chartLayout)>=4){setReplacement(chart);return;}
    const next=reconcileChartTickers(chartLayout,[...chartWorkspace.charts.map(item=>item.symbol),chart.symbol],defaultTimeframe);
    saveCharts({...next,selectedPanel:next.groups.find(group=>group.symbol===chart.symbol)?.panels[0].id??next.selectedPanel},chart);
    setTemporary(null);setWorkspaceSection("details");setDrawerOpen(true);
  };
  const replaceChart=(panelId:string)=>{
    if(!replacement)return;
    const next=replaceScannerChartPanel(chartLayout,panelId,replacement.symbol,defaultTimeframe);
    if(next===chartLayout)return;
    saveCharts(next,replacement);
    setReplacement(null);setTemporary(null);setWorkspaceSection("details");setDrawerOpen(true);
  };
  const openPendingChart=useEffectEvent(()=>{
    const chart=pendingChart.current;
    pendingChart.current=null;
    if(chart)openChart(chart);
  });
  useEffect(()=>{
    if(chartOpeningReady)openPendingChart();
  },[chartOpeningReady]);
  const setChartRow=(chart:ScannerChartTarget)=>{
    if(chartOpeningReady)openChart(chart);
    else pendingChart.current=chart;
  };
  const configureCharts=(next:ChartMultiview)=>{
    if(temporary){setTemporary({...temporary,layout:next});return;}
    saveCharts(next);
  };
  const [workspaceScreenersSelected,setWorkspaceScreenersSelected]=useState({gainers:true,momentum:false,declines:false,pullbacks:false,events:false});
  const [newsArticle,setNewsArticle]=useState<PressReleaseArticle|null>(null);
  const [fullScanner,setFullScanner]=useState<ScannerKind|null>(null);
  const [displayModes,setDisplayModes]=useState<Record<ScannerKind|"top-losers"|"high-drops",ScannerView>>({gainers:"table",momentum:"table","top-losers":"table","high-drops":"table"});
  const [loadError,setLoadError]=useState(false), [settingsError,setSettingsError]=useState(false);
  const [checkedAt,setCheckedAt]=useState<number>(()=>Date.now());
  const gridRef=useRef<HTMLDivElement|null>(null);
  const [desktopGridHeight,setDesktopGridHeight]=useState<number|null>(null);
  useEffect(()=>{
    let frame=0;
    const measure=()=>{
      const grid=gridRef.current;
      if(!grid||window.innerWidth<900){setDesktopGridHeight(null);return;}
      setDesktopGridHeight(availableScannerGridHeight(window.innerHeight,grid.getBoundingClientRect().top));
    };
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
    const observer=typeof ResizeObserver==="undefined"?null:new ResizeObserver(schedule);
    if(observer&&gridRef.current?.parentElement)observer.observe(gridRef.current.parentElement);
    window.addEventListener("resize",schedule);
    window.visualViewport?.addEventListener("resize",schedule);
    schedule();
    return()=>{cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener("resize",schedule);window.visualViewport?.removeEventListener("resize",schedule);};
  },[]);
  useEffect(()=>{
    let source:EventSource|undefined;
    const open=()=>{
      source?.close();source=undefined;
      if(document.hidden)return;
      source=new EventSource('/api/screeners/live?stream=1');
      const connection=source;
      source.addEventListener('scanner',event=>{
        if(source!==connection)return;
        try{
          const incoming=JSON.parse((event as MessageEvent).data) as ScannerReadModel;
          setModel(previous=>{const next=applyScannerDisplayContinuity(previous,incoming,displayContinuity.current,Date.now());displayContinuity.current=next.continuity;return next.model;});
          setLoadError(false);setCheckedAt(Date.now());
        }catch{setLoadError(true);}
      });
      source.onerror=()=>{if(source===connection){setLoadError(true);setCheckedAt(Date.now());}};
    };
    document.addEventListener('visibilitychange',open);open();
    return()=>{source?.close();source=undefined;document.removeEventListener('visibilitychange',open);};
  },[]);
  useEffect(()=>{if(!admin)return;const controller=new AbortController();void fetch('/api/admin/screeners/settings',{ cache:'no-store',credentials:'same-origin',signal:controller.signal }).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(payload=>{setConfiguration(payload.configuration);setSettingsError(false);}).catch(()=>{if(!controller.signal.aborted)setSettingsError(true);});return()=>controller.abort();},[admin]);
  const gainerView:GainerView=model?.session==="after_hours"?"post_market":"day";
  const selectedGainers=gainerViewResults(model,gainerView);
  const marketEventsData=useMarketEventsData();
  const activeHalts=selectActiveScannerHalts(model?.activeHalts??[],new Date(checkedAt));
  const haltByTicker=useMemo(()=>new Map(activeHalts.map(halt=>[halt.ticker,halt])),[activeHalts]);
  const resultsFor=(kind:ScannerKind)=>kind==="gainers"?selectedGainers:model?.momentum;
  const memberNotice=admin?null:memberScannerStatus(model,loadError,checkedAt);
  const openNews=async(item:ScannerNewsItem)=>{try{const response=await fetch(`/api/platform/news/workspace-scanner?articleId=${encodeURIComponent(item.id)}`,{cache:"no-store"});if(!response.ok)throw Error();const payload=await response.json() as {article?:PressReleaseArticle};if(payload.article)setNewsArticle(payload.article);}catch{/* Keep the scanner usable when article detail is unavailable. */}};
  const gainerTitle=model?.session==="after_hours"?"Top Gainers Post Market":"Top Gainers";
  const gainerTabs=<Stack direction="row" sx={{alignItems:"center",gap:0.4,minWidth:0}}><Typography component="h2" data-gainer-title sx={{fontSize:"0.9rem",fontWeight:850,lineHeight:1.2}}>{gainerTitle}</Typography><Tooltip title={GAINERS_EXPLANATION}>
    <IconButton aria-label="Explain Top Gainers" size="small" sx={{p:0.2}}><InfoOutlinedIcon sx={{fontSize:15}}/></IconButton>
  </Tooltip></Stack>;
  const viewSettings=(kind:ScannerKind)=><ScannerViewSettings label={SCREEN_LABELS[kind]} view={displayModes[kind]}
    onViewChange={view=>setDisplayModes(previous=>({...previous,[kind]:view}))}/>;
  const contents=(kind:ScannerKind,compactDesktop=false,inWorkspace=false)=><>
    {memberNotice?<Alert severity={memberNotice===SCANNER_UNAVAILABLE_MESSAGE?"warning":"info"}>{memberNotice}</Alert>
      :kind==="gainers"&&gainerView==="post_market"&&model&&model.session!=="after_hours"
      ?<Typography color="text.secondary">{admin?"Post-market readings begin after the regular session closes.":SCANNER_UNAVAILABLE_MESSAGE}</Typography>
      :<>
        <ScannerContents now={checkedAt} displayMode={displayModes[kind]} compactDesktop={compactDesktop} haltByTicker={haltByTicker} onOpenChart={row=>setChartRow({...row,showDetails:inWorkspace||kind==="gainers"})} results={resultsFor(kind)} screen={kind}/></>}
  </>;
  const workspaceScreeners=<SideCardChartControls value={true}><ScannerNewsDrawerProvider onOpen={item=>{
    const stock=[...(selectedGainers?.rows??[]),...momentumStocks,
      ...(model?.declines?.losers??[]),...(model?.declines?.rapid??[]),...(model?.premarketPullbacks?.rows??[])].find(row=>row.news.some(news=>news.id===item.id));
    if(stock){setChartRow({...stock,showDetails:true});setWorkspaceSection("details");}
  }}><Stack spacing={0.5} sx={{height:{md:"100%"},minHeight:0}}>
    <Box role="group" aria-label="Visible scanners" sx={{display:"flex",flexWrap:"wrap",columnGap:0.5,flexShrink:0}}>
      {([['gainers','Top Gainers'],['momentum','Momentum'],['declines','Top Losers'],['pullbacks','HOD Drops'],['events','Market Events']] as const).map(([key,label])=><FormControlLabel key={key} label={label}
        control={<Checkbox size="small" checked={workspaceScreenersSelected[key]} onChange={(_,checked)=>setWorkspaceScreenersSelected(previous=>({...previous,[key]:checked}))}/>}
        sx={{m:0,'& .MuiFormControlLabel-label':{fontSize:"0.75rem"}}}/>)}
    </Box>
    <Box sx={{display:"grid",gridTemplateColumns:{xs:"minmax(0,1fr)",md:"repeat(2,minmax(0,1fr))"},gap:0.5,flex:{md:1},minHeight:0,gridTemplateRows:{md:`repeat(${Math.max(2,Math.ceil(Object.values(workspaceScreenersSelected).filter(Boolean).length/2))},minmax(0,1fr))`},alignItems:"stretch",'& > *':{minWidth:0}}}>
    {(['gainers','momentum'] as const).filter(kind=>workspaceScreenersSelected[kind]).map(kind=><SidebarScreenerCard key={kind}><DashboardPanel title={SCREEN_LABELS[kind]} action={viewSettings(kind)}>{contents(kind,true,true)}</DashboardPanel></SidebarScreenerCard>)}
    {workspaceScreenersSelected.declines?<SidebarScreenerCard><DeclinesCard now={checkedAt} view={displayModes["top-losers"]} onViewChange={view=>setDisplayModes(previous=>({...previous,"top-losers":view}))} results={model?.declines} notice={memberNotice} session={model?.session??null} haltByTicker={haltByTicker} onOpenChart={row=>setChartRow({...row,showDetails:true})}/></SidebarScreenerCard>:null}
    {workspaceScreenersSelected.pullbacks?<SidebarScreenerCard><PremarketPullbacksCard now={checkedAt} view={displayModes["high-drops"]} onViewChange={view=>setDisplayModes(previous=>({...previous,"high-drops":view}))} rapid={model?.declines?.rapid} results={model?.premarketPullbacks} notice={memberNotice} haltByTicker={haltByTicker} onOpenChart={row=>setChartRow({...row,showDetails:true})}/></SidebarScreenerCard>:null}
    {workspaceScreenersSelected.events?<SidebarScreenerCard><ScreenerPressReleaseBoard compact data={marketEventsData} managedActiveHalts={activeHalts} haltSourceUnavailable={model?.activeHaltSourceUnavailable} onOpenChart={row=>setChartRow({...row,showDetails:true})}/></SidebarScreenerCard>:null}
    </Box>
    {Object.values(workspaceScreenersSelected).some(Boolean)?null:<Typography color="text.secondary" sx={{fontSize:"0.75rem"}}>Select scanners to display their cards.</Typography>}
  </Stack></ScannerNewsDrawerProvider></SideCardChartControls>;
  return <Stack spacing={2.5} sx={{ mt:0, '& [data-traderlink-platform-dashboard-card="panel"]':{borderRadius:0} }}>
    {admin&&settingsError?<Alert severity="error">Scanner settings could not be loaded.</Alert>:null}
    {admin?<ManualTickersAdmin/>:null}
    {admin&&configuration?<AdminControls configuration={configuration} onSaved={setConfiguration}/>:admin&&!settingsError?<Skeleton height={220} variant="rounded"/>:null}
    {admin?<DashboardPanel action={model?<Stack direction="row" spacing={1} sx={{ alignItems:"center",flexWrap:"wrap" }}><Chip label={model.session?SESSION_LABELS[model.session]:"Session closed"} size="small"/><Typography color="text.secondary" variant="caption">Updated {time(model.updatedAtUtc)}</Typography></Stack>:null} title="Live market activity">
      <Stack spacing={2}>
        {loadError?<Alert severity="error">The latest scanner update could not be loaded.</Alert>:null}
        {!model?<Skeleton height={180} variant="rounded"/>:statusMessage(model)?<Alert severity={model.status==='unavailable'?'error':'info'}>{statusMessage(model)}</Alert>:null}
        {model?.universeSourceDate&&model.universeSourceDate!==model.tradingDate?<Alert severity="warning">Today’s universe refresh is missing. Scanning continues with the {model.universeSourceDate} list.</Alert>:null}
        {model&&model.status!=='disabled'?<Stack direction="row" sx={{ flexWrap:"wrap",gap:1 }}><Chip label={`${model.receivedCount}/${model.universeCount} quotes`} size="small"/><Chip label={`${model.missingFloatCount} missing float`} size="small"/>{model.missingSymbols.length?<Chip color="warning" label={`${model.missingSymbols.length} missing quotes`} size="small"/>:null}</Stack>:null}
      </Stack>
    </DashboardPanel>:null}
    {!drawerOpen&&chartWorkspace.charts.length>0&&<Box sx={{display:"flex",justifyContent:"flex-end"}}>
      <Button size="small" onClick={()=>{setTemporary(null);setDrawerOpen(true);}}>Reopen chart drawer</Button>
    </Box>}
    <ScannerNewsDrawerProvider onOpen={item=>void openNews(item)}><Box>
      {mobile&&<Stack direction="row" sx={{alignItems:"center",gap:0.4,minWidth:0,mb:0.6}}>
        {mobileTabs?<Tabs value={activeScanner} onChange={(_,value:MobileScannerTab)=>setActiveScanner(value)}
          aria-label="Scanner cards" variant="scrollable" scrollButtons={false}
          sx={{flex:1,minWidth:0,minHeight:36,"& .MuiTab-root":{minWidth:0,minHeight:36,px:0.85,py:0.3,
            textTransform:"none",fontSize:"0.71rem",fontWeight:700,whiteSpace:"nowrap"}}}>
          {MOBILE_SCANNER_TABS.map(({widget,label,accessibleLabel})=><Tab key={widget} value={widget} label={label}
            id={`${mobileTabsId}-${widget}`} aria-label={accessibleLabel} aria-controls={`${mobileTabsId}-panel`}/>)}
        </Tabs>:<Box sx={{flex:1}}/>}
        {mobileTabs?<Tooltip title="Use stacked layout">
          <IconButton size="small" aria-label="Use stacked layout" onClick={toggleMobileLayout}
            sx={{width:36,height:36,flexShrink:0,border:1,borderColor:"divider",borderRadius:1}}>
            <ViewStreamOutlined fontSize="small"/>
          </IconButton>
        </Tooltip>:<Button size="small" variant="outlined" aria-label="Use tabs" onClick={toggleMobileLayout}
          startIcon={<ViewDayOutlined fontSize="small"/>} sx={{height:36,textTransform:"none",fontSize:"0.71rem"}}>
          Tabs
        </Button>}
      </Stack>}
      <Box data-scanner-grid ref={gridRef} role={mobileTabs?"tabpanel":undefined}
        id={mobileTabs?`${mobileTabsId}-panel`:undefined} aria-labelledby={mobileTabs?`${mobileTabsId}-${activeScanner}`:undefined} sx={{
      alignItems:"start",
      display:"grid",
      gap:1.5,
      gridTemplateAreas:{
        xs:mobileTabs?"none":workspaceLayout.mobileAreas,
        md:workspaceLayout.desktopAreas,
      },
      height:{xs:"auto",md:desktopGridHeight?`${desktopGridHeight}px`:"calc(100dvh - 76px)"},
      gridTemplateColumns:{xs:"minmax(0,1fr)",md:"repeat(4,minmax(0,1fr))"},
      gridTemplateRows:{xs:mobileTabs?"auto":"repeat(5,auto)",md:"repeat(2,minmax(0,1fr))"},
      '& .MuiTypography-h2':{ color:"text.primary",fontSize:"0.9rem",fontWeight:850,lineHeight:1.2 },
    }}>
      {(["gainers","momentum"] as const).filter(showScanner).map(kind=><ScannerWorkspaceCard key={kind} slot={workspaceLayout.assignments[kind]} widget={kind}>
        <DashboardPanel hideHeader>
          <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",gap:0.5,mb:0.5,minHeight:22}}>
            {kind==="momentum"?<Box component="h2" sx={{fontSize:"0.9rem",fontWeight:850,lineHeight:1.2,m:0}}>Momentum</Box>:gainerTabs}
            <Stack direction="row" spacing={0.5} sx={{alignItems:"center",flexShrink:0}}>
          {viewSettings(kind)}
          {admin&&resultsFor(kind)?<Chip label={`${resultsFor(kind)!.total}`} size="small" aria-label={`${resultsFor(kind)!.total} qualifying`}/>:null}
          <IconButton size="small" sx={{p:0.25}} aria-label={`Open ${SCREEN_LABELS[kind]} full view`} title={`Open ${SCREEN_LABELS[kind]} full view`} onClick={()=>setFullScanner(kind)}><OpenInFullRoundedIcon sx={{fontSize:18}}/></IconButton>
            </Stack>
          </Stack>
          {contents(kind,true)}
        </DashboardPanel>
      </ScannerWorkspaceCard>)}
      {showScanner("top-losers")&&<ScannerWorkspaceCard slot={workspaceLayout.assignments["top-losers"]} widget="top-losers"><DeclinesCard now={checkedAt} view={displayModes["top-losers"]} onViewChange={view=>setDisplayModes(previous=>({...previous,"top-losers":view}))} results={model?.declines}
        notice={memberNotice??(model&&["disabled","closed","unavailable","universe_missing"].includes(model.status)?statusMessage(model):null)}
        session={model?.session??null} haltByTicker={haltByTicker} onOpenChart={setChartRow}/></ScannerWorkspaceCard>}
      {showScanner("high-drops")&&<ScannerWorkspaceCard slot={workspaceLayout.assignments["high-drops"]} widget="high-drops"><PremarketPullbacksCard now={checkedAt} view={displayModes["high-drops"]} onViewChange={view=>setDisplayModes(previous=>({...previous,"high-drops":view}))} rapid={model?.declines?.rapid} results={model?.premarketPullbacks}
        notice={memberNotice??(model&&["disabled","closed","unavailable","universe_missing"].includes(model.status)?statusMessage(model):null)} haltByTicker={haltByTicker} onOpenChart={setChartRow}/></ScannerWorkspaceCard>}
      {showScanner("market-events")&&<ScannerWorkspaceCard slot={workspaceLayout.assignments["market-events"]} widget="market-events"><ScreenerPressReleaseBoard data={marketEventsData} managedActiveHalts={activeHalts} haltSourceUnavailable={model?.activeHaltSourceUnavailable} onOpenChart={setChartRow}/></ScannerWorkspaceCard>}
    </Box></Box></ScannerNewsDrawerProvider>
    <PressReleaseArticleDrawer article={newsArticle} onClose={()=>setNewsArticle(null)}/>
    <Drawer anchor="right" open={fullScanner!==null} onClose={()=>setFullScanner(null)}
      slotProps={{paper:{role:"dialog","aria-modal":true,"aria-label":fullScanner?`${SCREEN_LABELS[fullScanner]} full view`:undefined,
        sx:{width:{xs:"100vw",md:"90vw",xl:"85vw"},maxWidth:"100vw"}}}}>
      {fullScanner?<Stack sx={{height:"100dvh",minHeight:0}}>
        <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",borderBottom:1,borderColor:"divider",px:2,py:1.25}}>
          <Typography component="h2" variant="h6" sx={{fontWeight:800}}>{SCREEN_LABELS[fullScanner]}</Typography>
          <Stack direction="row" sx={{alignItems:"center"}}>{viewSettings(fullScanner)}<IconButton aria-label="Close full scanner view" onClick={()=>setFullScanner(null)}><CloseRoundedIcon/></IconButton></Stack>
        </Stack>
        <Box sx={theme=>({...scannerScrollStyles(theme),minHeight:0,p:2})}>{fullScanner==="gainers"?gainerTabs:null}{contents(fullScanner)}</Box>
      </Stack>:null}
    </Drawer>
    <ScannerChartDrawer open={drawerOpen} temporary={Boolean(temporary)} defaultTimeframe={defaultTimeframe}
      layout={temporary?.layout??chartLayout} onLayoutChange={configureCharts} layoutReady={chartView.ready}
      layoutMessage={temporary?"":chartView.message}
      onBack={()=>setTemporary(null)} onSaveTemporary={()=>{if(temporary)openChart({...temporary.chart,addChart:true});}}
      onAdd={symbol=>setChartRow({symbol,exchange:"NASDAQ",showDetails:true,addChart:true})}
      charts={temporary?[temporary.chart]:chartWorkspace.charts} onSelect={temporary?()=>{}:selectSavedChart}
      onRemove={symbol=>{
        const groups=chartLayout.groups.filter(group=>group.symbol!==symbol);
        const selectedPanel=groups.some(group=>group.panels.some(panel=>panel.id===chartLayout.selectedPanel))
          ?chartLayout.selectedPanel:groups[0]?.panels[0].id??null;
        saveCharts({...chartLayout,groups,selectedPanel});
        if(!groups.length)setDrawerOpen(false);
      }}
      onClose={()=>{setDrawerOpen(false);}} row={temporary?.chart??chartRow}
      screeners={workspaceScreeners} section={temporary?"details":workspaceSection}
      onSectionChange={temporary?()=>{}:setWorkspaceSection} stocks={[...(model?.dayGainers?.rows??[]),...(model?.momentum.rows??[]),...(selectedGainers?.rows??[])]}
      fallbackQuotes={[...(model?.declines?.losers??[]),...(model?.premarketPullbacks?.rows??[]),...(model?.declines?.rapid??[])]} postMarket={model?.session==="after_hours"}/>
    <Dialog open={Boolean(replacement)} onClose={()=>setReplacement(null)} aria-labelledby="replace-scanner-chart-title">
      <DialogTitle id="replace-scanner-chart-title">Choose a chart to replace</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{mb:1}}>All four chart slots are in use. Choose a slot for {replacement?.symbol}.</Typography>
        <Stack spacing={0.5}>{chartLayout.groups.flatMap(group=>group.panels.map(panel=>
          <Button key={panel.id} onClick={()=>replaceChart(panel.id)} sx={{justifyContent:"flex-start",textTransform:"none"}}>
            Replace {group.symbol} · {panel.timeframe}
          </Button>))}</Stack>
      </DialogContent>
      <DialogActions><Button onClick={()=>setReplacement(null)}>Cancel</Button></DialogActions>
    </Dialog>
  </Stack>;
}
