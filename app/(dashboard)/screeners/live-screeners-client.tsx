"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
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
import CandlestickChartRoundedIcon from "@mui/icons-material/CandlestickChartRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { TradingViewChart } from "@/app/(dashboard)/charts/trading-view-chart";
import { DashboardPanel, DashboardPrimaryAction } from "@/app/dashboard-template";
import { ScreenerPressReleaseBoard } from "./screener-press-release-board";
import { DeclinesCard } from "./declines-card";
import { DEFAULT_DECLINE_CONTROLS } from "@/src/modules/scanner/live/declines";
import { PremarketPullbacksCard } from "./premarket-pullbacks-card";
import { ScreenerHaltIndicator } from "./screener-halt-indicator";
import { DEFAULT_PREMARKET_PULLBACK_CONTROLS } from "@/src/modules/scanner/live/premarket-pullbacks";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import type { LiveScannerRow, LiveScreenResults, ScannerActiveHalt, ScannerConfiguration, ScannerKind, ScannerReadModel,
  ScannerSession, ScreenFilters } from "@/src/modules/scanner/live/contracts";
import { DEFAULT_MOMENTUM_DETECTION, DEFAULT_MOMENTUM_LIQUIDITY_BYPASS, momentumDetectionControls, momentumLiquidityBypassControls } from "@/src/modules/scanner/live/settings";
import { gainerViewResults, selectedGainerView, type GainerView, type GainerViewChoice } from "@/src/modules/scanner/live/gainer-view";
import { memberScannerStatus, SCANNER_UNAVAILABLE_MESSAGE } from "@/src/modules/scanner/live/member-status";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";
import { applyScannerDisplayContinuity, type ScannerDisplayContinuity } from "@/src/modules/scanner/live/display-continuity";

const SCREEN_LABELS: Record<ScannerKind,string> = { gainers: "Top Gainers", momentum: "Momentum" };
const SESSION_LABELS: Record<ScannerSession,string> = { premarket: "Premarket", regular: "Regular hours", after_hours: "After hours" };
const MOMENTUM_SIGNAL_LABELS={volume_ignition:"Volume ignition",building_volume:"Building volume",price_burst:"Price burst",
  developing_activity:"Developing activity",one_minute_momentum:"1min momentum",five_minute_momentum:"5min momentum"} as const;
const number = new Intl.NumberFormat("en-US",{ maximumFractionDigits: 2 });
const wholePercent = new Intl.NumberFormat("en-US",{ maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US",{ notation: "compact",maximumFractionDigits: 1 });
const cardTitleTabsSx={minHeight:22,'& .MuiTabs-indicator':{height:2},'& .MuiTab-root':{fontSize:"0.9rem",fontWeight:850,lineHeight:1.2,minHeight:22,minWidth:0,p:0,pb:0.6,px:0,textTransform:"none"},'& .MuiTab-root + .MuiTab-root':{ml:2}};
function value(input: number | null | undefined, suffix = ""): string {
  return input == null ? "n/a" : `${suffix==="%"?wholePercent.format(input):number.format(input)}${suffix}`;
}
function time(input: string | null): string { return input ? new Date(input).toLocaleTimeString([],{ hour: "numeric",minute: "2-digit",second: "2-digit" }) : "n/a"; }
function floatValue(input: number | null): string {
  if (input === null) return "n/a";
  if (input >= 1_000_000) return `${number.format(input/1_000_000)}M`;
  if (input >= 1_000) return `${number.format(input/1_000)}K`;
  return number.format(input);
}
function statusMessage(model: ScannerReadModel): string {
  if (model.status === "disabled") return "Live screeners are currently disabled.";
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
  if (!row.news.length) return null;
  return <Stack direction="row" sx={{ flexWrap:"wrap",gap:0.65 }}>
    {row.news.slice(0,3).map(item => item.url
      ? <Link aria-label={`${item.typeLabel}: ${item.headline}`} href={item.url} key={item.id} rel="noreferrer" sx={{ fontSize:"0.68rem",fontWeight:800,lineHeight:1.2 }} target="_blank" title={item.headline}>{compactNewsType(item.typeLabel)}</Link>
      : <Typography aria-label={`${item.typeLabel}: ${item.headline}`} color="text.secondary" key={item.id} sx={{ fontSize:"0.68rem",fontWeight:800,lineHeight:1.2 }} title={item.headline}>{compactNewsType(item.typeLabel)}</Typography>)}
  </Stack>;
}

function compactNewsType(typeLabel: string): string {
  const label = typeLabel.toLowerCase();
  if (label.includes("sec")) return "SEC";
  if (label.includes("press")) return "PR";
  return "News";
}

function compactNewsLabel(row: LiveScannerRow): string {
  return row.news[0] ? compactNewsType(row.news[0].typeLabel) : "—";
}

function CompactNewsLink({ row }: { row: LiveScannerRow }) {
  const item = row.news[0];
  if (!item?.url) return <Typography noWrap sx={{ color:"text.secondary",fontSize:"0.68rem",fontWeight:750 }}>—</Typography>;
  return <Link aria-label={`Open ${item.typeLabel}: ${item.headline}`} href={item.url} onClick={event=>event.stopPropagation()}
    onKeyDown={event=>event.stopPropagation()} rel="noreferrer" sx={{ fontSize:"0.68rem",fontWeight:800 }} target="_blank" title={item.headline}>
    {compactNewsLabel(row)}
  </Link>;
}

function floatTraded(row: LiveScannerRow): string | null {
  if (row.volume === null || row.float <= 0) return null;
  return `${wholePercent.format(100 * row.volume / row.float)}%`;
}

function ChartButton({ expanded=false,row,onOpenChart }: { expanded?:boolean; row: LiveScannerRow; onOpenChart: (row:LiveScannerRow)=>void }) {
  return <ButtonBase aria-label={`Open ${row.symbol} chart`} onClick={event=>{event.stopPropagation();onOpenChart(row);}}
    onKeyDown={event=>event.stopPropagation()} sx={{ alignItems:"center",bgcolor:"rgba(46,125,50,0.13)",borderRadius:0.75,color:"success.main",gap:expanded?0.6:0,height:expanded?38:20,justifyContent:"center",minWidth:expanded?0:20,px:expanded?0.85:0,'&:hover':{ bgcolor:"rgba(46,125,50,0.23)" },'&:focus-visible':{ outline:"2px solid",outlineColor:"success.main",outlineOffset:1 } }}>
    <CandlestickChartRoundedIcon sx={{ fontSize:expanded?"1.8rem":"0.9rem" }}/>
    {expanded?<Typography component="span" sx={{ color:"inherit",fontSize:"0.78rem",fontWeight:800 }}>View Chart</Typography>:null}
  </ButtonBase>;
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
function momentumSignalText(row:LiveScannerRow){
  if(row.momentumSignals?.length)return row.momentumSignals.map(signal=>MOMENTUM_SIGNAL_LABELS[signal]).join(" · ");
  return row.momentumState==="cooling"?"Cooling · watching for renewed activity":"Detected activity";
}
function MomentumSignalRow({row,colSpan,leftOffset}:{row:LiveScannerRow;colSpan:number;leftOffset:string}){
  const label=momentumSignalText(row);
  return <TableRow data-momentum-signals={row.symbol}><TableCell colSpan={colSpan} sx={{borderBottom:1,borderColor:"divider",pl:`${leftOffset} !important`,pr:0.5,pt:"0 !important",pb:"0.3rem !important"}}>
    <Typography noWrap title={label} sx={{color:"text.secondary",fontSize:"0.58rem",fontWeight:400,lineHeight:1.15}}>{label}</Typography>
  </TableCell></TableRow>;
}

function CompactStockTable({ rows,screen,onOpenChart,haltByTicker,compactDesktop=false }: { rows: readonly LiveScannerRow[]; screen: ScannerKind; onOpenChart:(row:LiveScannerRow)=>void; haltByTicker:ReadonlyMap<string,ScannerActiveHalt>; compactDesktop?:boolean }) {
  const [expandedSymbol,setExpandedSymbol]=useState<string|null>(null);
  const movement=usePriceMovement(rows);
  const toggle=(symbol:string)=>setExpandedSymbol(current=>current===symbol?null:symbol);
  const metric=(label:string,content:string)=><Box sx={{ minWidth:0 }}><Typography sx={{ color:"warning.main",fontSize:"0.68rem",fontWeight:750,lineHeight:1,textTransform:"uppercase" }}>{label}</Typography><Typography sx={{ fontSize:"0.9rem",fontWeight:750,lineHeight:1.3,mt:0.45 }}>{content}</Typography></Box>;
  const headers=screen==="gainers"
    ? [{label:"",width:28},{label:"",width:28},{label:"Ticker",width:64},{label:"News",width:52},{label:"Price",width:66},{label:"Gain %",width:66},{label:"Volume",width:72},{label:"$ × Vol",width:76},{label:"Float",width:66},{label:"Turnover",width:72},{label:"RVOL",width:58},{label:"Below HOD",width:76}]
    : [{label:"",width:28},{label:"",width:28},{label:"Ticker",width:64},{label:"News",width:52},{label:"Price",width:66},{label:"Day %",width:62},{label:"1min %",width:62},{label:"5min %",width:62},{label:"1min Vol",width:72},{label:"5min Vol",width:72},{label:"1min ↑",width:62},{label:"5min ↑",width:62},{label:"Float",width:66},{label:"Spread",width:60}];
  return <TableContainer aria-label={compactDesktop?`${SCREEN_LABELS[screen]} compact list`:undefined}
    role={compactDesktop?"region":undefined} tabIndex={compactDesktop?0:undefined}
    sx={theme=>({ ...scannerScrollStyles(theme),containerType:"inline-size",maxHeight:compactDesktop?420:undefined,overflow:"auto",width:"100%" })}>
    <Table aria-label={compactDesktop?`${SCREEN_LABELS[screen]} compact stocks`:"Screener stocks"} stickyHeader={compactDesktop} size="small" sx={{ ...movementTableSx,tableLayout:"fixed",minWidth:screen==="gainers"?788:884,'& .MuiTableCell-root':{ fontSize:"0.68rem",px:0.35,py:0.34 },'& .MuiTableCell-head':{ color:"text.secondary",fontSize:"0.6rem",fontWeight:750,lineHeight:1,pb:0.7,whiteSpace:"nowrap" } }}>
      <TableHead><TableRow>{headers.map((header,index)=><TableCell align={header.right?"right":"left"} aria-label={header.label||(index===0?"Chart":"Expand")} key={`${header.label}-${index}`} sx={{ width:header.width }}>{header.label}</TableCell>)}</TableRow></TableHead>
      <TableBody>{rows.map(row=>{const expanded=expandedSymbol===row.symbol;const traded=floatTraded(row);const expandedMetrics=(screen==="gainers"?[
        metric("HOD price",`$${value(row.dayHigh)}`),
        metric("Below HOD",value(row.offHighPercent,"%")),
        metric("Session low",`$${value(row.dayLow)}`),
        row.relativeVolume==null?null:metric("RVOL",`${number.format(row.relativeVolume)}×`),
        traded==null?null:metric("Turnover",traded),
      ]:[
        row.momentumState==="cooling"?metric("Detected","Cooling · watching for renewed activity"):
          row.momentumSignals?.length?metric("Detected",row.momentumSignals.map(signal=>MOMENTUM_SIGNAL_LABELS[signal]).join(" · ")):null,
        row.activity.episodeShares==null?null:metric("Episode volume",compact.format(row.activity.episodeShares)),
        row.activity.episodeDollarVolume==null?null:metric("Episode $ volume",`$${compact.format(row.activity.episodeDollarVolume)}`),
        row.activity.episodeSeconds==null?null:metric("Episode time",`${number.format(row.activity.episodeSeconds)}s`),
        metric("Day %",value(row.sessionGain,"%")),
        row.postMarketGain===undefined?null:metric("Post %",value(row.postMarketGain,"%")),
        row.volume===null?null:metric("Session volume",compact.format(row.volume)),
        row.activity.fiveMinuteVolume==null?null:metric("5m Vol",compact.format(row.activity.fiveMinuteVolume)),
        row.activity.volumeAcceleration===null?null:metric("1m Vol Spike",`${number.format(row.activity.volumeAcceleration)}×`),
        row.activity.fiveMinuteVolumeSpike==null?null:metric("5m Vol Spike",`${number.format(row.activity.fiveMinuteVolumeSpike)}×`),
        row.relativeVolume==null?null:metric("RVOL",`${number.format(row.relativeVolume)}×`),
        metric("HOD price",`$${value(row.dayHigh)}`),
        metric("Below HOD",value(row.offHighPercent,"%")),
        metric("Session low",`$${value(row.dayLow)}`),
        traded==null?null:metric("Turnover",traded),
        row.spreadPercent===null?null:metric("Spread",value(row.spreadPercent,"%")),
      ]).filter(Boolean);return <Fragment key={row.symbol}>
        <TableRow aria-expanded={expanded} hover onClick={()=>toggle(row.symbol)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle(row.symbol);}}} sx={{ ...movementRowSx(movement[row.symbol]),cursor:"pointer",'& > td':{borderBottom:screen==="momentum"?"none":undefined},'&:focus-visible':{ outline:"2px solid",outlineColor:"primary.main",outlineOffset:-2 } }} tabIndex={0}>
          <TableCell sx={{px:"0.125rem !important"}}><ChartButton row={row} onOpenChart={onOpenChart}/></TableCell>
          <TableCell aria-hidden sx={{pr:"0 !important",textAlign:"center"}}><Typography component="span" sx={{color:"text.secondary",fontSize:"0.9rem",fontWeight:700,lineHeight:1}}>{expanded?"−":"+"}</Typography></TableCell>
          <TableCell><Stack direction="row" sx={{alignItems:"center",gap:0.25,minWidth:0}}><Typography noWrap component="span" sx={{color:"warning.main",fontSize:"0.68rem",fontWeight:800}}>{row.symbol}</Typography><ScreenerHaltIndicator halt={haltByTicker.get(row.symbol)}/></Stack></TableCell>
          <TableCell><CompactNewsLink row={row}/></TableCell>
          <TableCell><Typography noWrap sx={{fontSize:"0.68rem",fontWeight:500}}>${value(row.price)}</Typography></TableCell>
          {screen==="gainers"?<>
            <TableCell sx={{color:(row.sessionGain??0)>=0?"success.main":"error.main"}}>{value(row.sessionGain,"%")}</TableCell>
            <TableCell>{row.volume===null?"n/a":compact.format(row.volume)}</TableCell><TableCell>{row.dollarVolume===null?"n/a":`$${compact.format(row.dollarVolume)}`}</TableCell>
            <TableCell>{floatValue(row.float)}</TableCell><TableCell>{traded??"n/a"}</TableCell><TableCell>{row.relativeVolume==null?"n/a":`${number.format(row.relativeVolume)}×`}</TableCell>
            <TableCell>{value(row.offHighPercent,"%")}</TableCell>
          </>:<>
            <TableCell>{value(row.sessionGain,"%")}</TableCell><TableCell sx={{color:(row.activity.oneMinuteGain??0)>=0?"success.main":"error.main"}}>{value(row.activity.oneMinuteGain,"%")}</TableCell>
            <TableCell sx={{color:(row.activity.fiveMinuteGain??0)>=0?"success.main":"error.main"}}>{value(row.activity.fiveMinuteGain,"%")}</TableCell>
            <TableCell>{row.activity.oneMinuteVolume==null?"n/a":compact.format(row.activity.oneMinuteVolume)}</TableCell><TableCell>{row.activity.fiveMinuteVolume==null?"n/a":compact.format(row.activity.fiveMinuteVolume)}</TableCell>
            <TableCell>{row.activity.volumeAcceleration==null?"n/a":`${number.format(row.activity.volumeAcceleration)}×`}</TableCell><TableCell>{row.activity.fiveMinuteVolumeSpike==null?"n/a":`${number.format(row.activity.fiveMinuteVolumeSpike)}×`}</TableCell>
            <TableCell>{floatValue(row.float)}</TableCell><TableCell>{value(row.spreadPercent,"%")}</TableCell>
          </>}
        </TableRow>
        {screen==="momentum"?<MomentumSignalRow row={row} colSpan={14} leftOffset="3.8rem"/>:null}
        {expanded?<TableRow><TableCell colSpan={screen==="momentum"?14:12} sx={{ bgcolor:"action.hover",p:"0 !important" }}>
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
        <TableCell aria-label="Chart" sx={{ px:"0 !important",width:24 }}/>
        {['Ticker','Price','Gain%','Volume','$ × Vol','Float','Turnover','RVOL','Below HOD','News'].map(label => <TableCell key={label}>{label}</TableCell>)}
      </TableRow></TableHead><TableBody>{results.rows.map(row=><TableRow hover key={row.symbol} sx={movementRowSx(movement[row.symbol])}>
        <TableCell sx={{ px:"0 !important",width:24 }}><ChartButton onOpenChart={onOpenChart} row={row}/></TableCell>
        <TableCell sx={{ fontWeight:800,pl:"0.5rem !important" }}><Stack direction="row" sx={{alignItems:"center",gap:0.25}}><Typography component="span" sx={{ color:"warning.main",font:"inherit",fontWeight:800 }}>{row.symbol}</Typography><ScreenerHaltIndicator halt={haltByTicker.get(row.symbol)}/></Stack></TableCell>
        <TableCell>${value(row.price)}</TableCell><TableCell sx={{ color:(row.sessionGain??0)>=0?"success.main":"error.main",fontWeight:750 }}>{value(row.sessionGain,"%")}</TableCell>
        <TableCell>{row.volume===null?"n/a":compact.format(row.volume)}</TableCell><TableCell>{row.dollarVolume===null?"n/a":`$${compact.format(row.dollarVolume)}`}</TableCell>
        <TableCell>{floatValue(row.float)}</TableCell><TableCell>{floatTraded(row)??"n/a"}</TableCell><TableCell>{row.relativeVolume==null?"n/a":`${number.format(row.relativeVolume)}×`}</TableCell>
        <TableCell>{value(row.offHighPercent,"%")}</TableCell><TableCell><NewsLinks row={row} /></TableCell>
      </TableRow>)}</TableBody></Table>:<Table stickyHeader size="small" sx={desktopTableSx}><TableHead><TableRow>
        <TableCell aria-label="Details" sx={{ px:"0 !important",width:22 }}/>
        <TableCell aria-label="Chart" sx={{ px:"0.125rem !important",width:26 }}/>
        {['Ticker','Price','Day %',...(showPostGain?['Post %']:[]),'1min','5min','1min Vol','5min Vol','1min ↑','5min ↑','Float','Spread','News'].map(label => <TableCell key={label} title={label==='Day %'?"Change from the previous trading day's regular close":label==='Post %'?"After-hours change from today's regular close":undefined}>{label}</TableCell>)}
      </TableRow></TableHead><TableBody>{results.rows.map(row=>{const expanded=expandedDesktopSymbol===row.symbol;return <Fragment key={row.symbol}>
        <TableRow aria-expanded={expanded} hover onClick={()=>setExpandedDesktopSymbol(current=>current===row.symbol?null:row.symbol)}
          onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setExpandedDesktopSymbol(current=>current===row.symbol?null:row.symbol);}}}
          sx={{ ...movementRowSx(movement[row.symbol]),cursor:"pointer",'& > td':{borderBottom:"none"},'&:focus-visible':{ outline:"2px solid",outlineColor:"primary.main",outlineOffset:-2 } }} tabIndex={0}>
          <TableCell sx={{ px:"0 !important",width:22 }}><ButtonBase aria-label={`${expanded?"Collapse":"Expand"} ${row.symbol} details`} onClick={event=>{event.stopPropagation();setExpandedDesktopSymbol(current=>current===row.symbol?null:row.symbol);}} sx={{ bgcolor:"rgba(255,193,7,0.14)",borderRadius:0.75,color:"warning.main",fontSize:"0.75rem",fontWeight:800,height:20,minWidth:20,'&:hover':{ bgcolor:"rgba(255,193,7,0.24)" },'&:focus-visible':{ outline:"2px solid",outlineColor:"warning.main",outlineOffset:1 } }}>{expanded?"−":"+"}</ButtonBase></TableCell>
          <TableCell sx={{ px:"0.125rem !important",width:26 }}><ChartButton onOpenChart={onOpenChart} row={row}/></TableCell>
          <TableCell sx={{ fontWeight:800,pl:"0.3rem !important" }}><Stack direction="row" sx={{alignItems:"center",gap:0.25}}><Typography component="span" sx={{ color:"warning.main",font:"inherit",fontWeight:800 }}>{row.symbol}</Typography><ScreenerHaltIndicator halt={haltByTicker.get(row.symbol)}/></Stack></TableCell>
          <TableCell>${value(row.price)}</TableCell><TableCell sx={{ color:(row.sessionGain??0)>=0?"success.main":"error.main",fontWeight:750 }}>{value(row.sessionGain,"%")}</TableCell>
          {showPostGain?<TableCell sx={{ color:row.postMarketGain==null?"text.secondary":row.postMarketGain>=0?"success.main":"error.main",fontWeight:750 }}>{value(row.postMarketGain,"%")}</TableCell>:null}
          <TableCell>{value(row.activity.oneMinuteGain,"%")}</TableCell><TableCell>{value(row.activity.fiveMinuteGain,"%")}</TableCell>
          <TableCell>{row.activity.oneMinuteVolume==null?"n/a":compact.format(row.activity.oneMinuteVolume)}</TableCell><TableCell>{row.activity.fiveMinuteVolume==null?"n/a":compact.format(row.activity.fiveMinuteVolume)}</TableCell>
          <TableCell>{row.activity.volumeAcceleration==null?"n/a":`${number.format(row.activity.volumeAcceleration)}×`}</TableCell><TableCell>{row.activity.fiveMinuteVolumeSpike==null?"n/a":`${number.format(row.activity.fiveMinuteVolumeSpike)}×`}</TableCell>
          <TableCell>{floatValue(row.float)}</TableCell><TableCell>{value(row.spreadPercent,"%")}</TableCell><TableCell onClick={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}><NewsLinks row={row} /></TableCell>
        </TableRow>
        <MomentumSignalRow row={row} colSpan={showPostGain?15:14} leftOffset="3.4rem"/>
        {expanded?<TableRow><TableCell colSpan={showPostGain?15:14} sx={{ bgcolor:"action.hover",p:"0 !important" }}>
          <Box sx={{...visibleExpandedPanelSx,display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:2,p:1.25}}>
            {[
              ["Detected",row.momentumState==="cooling"?"Cooling · watching for renewed activity":row.momentumSignals?.length?row.momentumSignals.map(signal=>MOMENTUM_SIGNAL_LABELS[signal]).join(" · "):"n/a"],
              ["Episode volume",row.activity.episodeShares==null?"n/a":compact.format(row.activity.episodeShares)],
              ["Episode $ volume",row.activity.episodeDollarVolume==null?"n/a":`$${compact.format(row.activity.episodeDollarVolume)}`],
              ["Episode time",row.activity.episodeSeconds==null?"n/a":`${number.format(row.activity.episodeSeconds)}s`],
              ["$ × Vol",row.dollarVolume===null?"n/a":`$${compact.format(row.dollarVolume)}`],
              ["RVOL",row.relativeVolume==null?"n/a":`${number.format(row.relativeVolume)}×`],
              ["HOD price",`$${value(row.dayHigh)}`],
              ["Below HOD",value(row.offHighPercent,"%")],
              ["Session low",`$${value(row.dayLow)}`],
              ["Turnover",floatTraded(row)??"n/a"],
            ].map(([label,content])=><Box key={label}><Typography sx={{ color:"warning.main",fontSize:"0.68rem",fontWeight:750,lineHeight:1,textTransform:"uppercase" }}>{label}</Typography><Typography sx={{ fontSize:"0.86rem",fontWeight:750,mt:0.45 }}>{content}</Typography></Box>)}
          </Box>
        </TableCell></TableRow>:null}
      </Fragment>})}</TableBody></Table>}
    </TableContainer>
    <Box sx={{ display:{ xs:"block",md:"none" },mb:-2,mx:-2 }}><CompactStockTable haltByTicker={haltByTicker} onOpenChart={onOpenChart} rows={results.rows} screen={screen}/></Box>
  </>;
}

function ScannerContents({ results,screen,onOpenChart,haltByTicker,compactDesktop=false }: { results: LiveScreenResults | undefined; screen: ScannerKind; onOpenChart:(row:LiveScannerRow)=>void; haltByTicker:ReadonlyMap<string,ScannerActiveHalt>; compactDesktop?:boolean }) {
  if (!results) return <Skeleton height={440} variant="rounded"/>;
  if(compactDesktop)return results.rows.length?<CompactStockTable compactDesktop haltByTicker={haltByTicker} rows={results.rows} screen={screen} onOpenChart={onOpenChart}/>
    :<Alert severity="info">No stocks currently qualify for this list.</Alert>;
  return <Results haltByTicker={haltByTicker} onOpenChart={onOpenChart} results={results} screen={screen}/>;
}

type ScannerChartTarget=Readonly<{symbol:string;exchange:"NASDAQ"|"NYSE"}>;
function ScannerChartDrawer({ row,onClose }: { row:ScannerChartTarget|null; onClose:()=>void }) {
  return <Drawer anchor="right" onClose={onClose} open={row!==null} slotProps={{ paper:{ sx:{ maxWidth:"100vw",width:{ xs:"100vw",md:"78vw",xl:1180 } } } }}>
    <Stack sx={{ height:"100dvh",minHeight:0 }}>
      <Stack direction="row" sx={{ alignItems:"center",borderBottom:1,borderColor:"divider",justifyContent:"space-between",px:{ xs:1.5,md:2 },py:1.25 }}>
        <Box><Typography component="h2" sx={{ fontWeight:850 }} variant="h6">{row?.symbol} chart</Typography><Typography color="text.secondary" variant="body2">TradersLink + TradingView charts</Typography></Box>
        <IconButton aria-label="Close chart" onClick={onClose}><CloseRoundedIcon/></IconButton>
      </Stack>
      <Box sx={{ flex:1,minHeight:0,p:{ xs:0,md:1.5 } }}>{row?<TradingViewChart symbol={`${row.exchange}:${row.symbol}`} sx={{ border:{ xs:0,md:1 },borderRadius:{ xs:0,md:2 },height:"100%",minHeight:0 }}/>:null}</Box>
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
      <FormControlLabel control={<Switch checked={draft.enabled} onChange={event=>setDraft(current=>({ ...current,enabled:event.target.checked }))} />} label="Enable live screeners" />
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
      <Typography component="h3" sx={{fontWeight:800}}>Rapid Drops / Top Losers</Typography>
      <FormControlLabel control={<Switch checked={declines.enabled} onChange={event=>updateDeclines({enabled:event.target.checked})}/>} label="Enable Rapid Drops and Top Losers"/>
      <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"repeat(2,minmax(0,1fr))",lg:"repeat(4,minmax(0,1fr))"},gap:1.5}}>
        <NumberField label="List stocks per tab" current={declines.displayLimit} onChange={next=>next!==null&&updateDeclines({displayLimit:next})}/>
        <NumberField label="Minimum rapid drop %" current={declines.minimumDropPercent} onChange={next=>next!==null&&updateDeclines({minimumDropPercent:next})}/>
        <NumberField label="Drop within (minutes)" current={declines.windowMinutes} onChange={next=>next!==null&&updateDeclines({windowMinutes:next})}/>
        <NumberField label="Keep after new low (minutes)" current={declines.retentionMinutes} onChange={next=>next!==null&&updateDeclines({retentionMinutes:next})}/>
      </Box>
      <Typography component="h3" sx={{fontWeight:800}}>Premarket High Pullbacks</Typography>
      <FormControlLabel control={<Switch checked={pmPullbacks.enabled} onChange={event=>updatePmPullbacks({enabled:event.target.checked})}/>} label="Enable Premarket High Pullbacks"/>
      <Box sx={{display:"grid",gridTemplateColumns:{xs:"1fr",sm:"repeat(2,minmax(0,1fr))",lg:"repeat(3,minmax(0,1fr))"},gap:1.5}}>
        <NumberField label="List stocks" current={pmPullbacks.displayLimit} onChange={next=>next!==null&&updatePmPullbacks({displayLimit:next})}/>
        <NumberField label="Minimum pullback from PM high %" current={pmPullbacks.minimumPullbackPercent} onChange={next=>next!==null&&updatePmPullbacks({minimumPullbackPercent:next})}/>
        <NumberField label="Remove when within % of PM high" current={pmPullbacks.removeWithinPercent} onChange={next=>next!==null&&updatePmPullbacks({removeWithinPercent:next})}/>
      </Box>
    </Stack>
  </DashboardPanel>;
}

export function LiveScreenersClient({ admin=false }: { admin?: boolean }) {
  const [model,setModel]=useState<ScannerReadModel|null>(null), [configuration,setConfiguration]=useState<ScannerConfiguration|null>(null);
  const displayContinuity=useRef<ScannerDisplayContinuity>({emptySince:null});
  const [chartRow,setChartRow]=useState<ScannerChartTarget|null>(null);
  const [fullScanner,setFullScanner]=useState<ScannerKind|null>(null);
  const [gainerChoice,setGainerChoice]=useState<GainerViewChoice|null>(null);
  const [loadError,setLoadError]=useState(false), [settingsError,setSettingsError]=useState(false);
  const [checkedAt,setCheckedAt]=useState<number|null>(null);
  useEffect(()=>{let timer:ReturnType<typeof setTimeout>|undefined;const controller=new AbortController();const load=async()=>{try{const response=await fetch('/api/screeners/live',{ cache:'no-store',credentials:'same-origin',signal:controller.signal });if(!response.ok)throw Error();const incoming:ScannerReadModel=await response.json();setModel(previous=>{const haltSafeIncoming=incoming.activeHalts===undefined&&previous?.activeHalts?{...incoming,activeHalts:previous.activeHalts}:incoming;const next=applyScannerDisplayContinuity(previous,haltSafeIncoming,displayContinuity.current,Date.now());displayContinuity.current=next.continuity;return next.model;});setLoadError(false);}catch{if(!controller.signal.aborted)setLoadError(true);}finally{if(!controller.signal.aborted){setCheckedAt(Date.now());timer=setTimeout(()=>void load(),5000);}}};void load();return()=>{controller.abort();if(timer)clearTimeout(timer);};},[]);
  useEffect(()=>{if(!admin)return;const controller=new AbortController();void fetch('/api/admin/screeners/settings',{ cache:'no-store',credentials:'same-origin',signal:controller.signal }).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(payload=>{setConfiguration(payload.configuration);setSettingsError(false);}).catch(()=>{if(!controller.signal.aborted)setSettingsError(true);});return()=>controller.abort();},[admin]);
  const gainerView=selectedGainerView(model,gainerChoice);
  const selectedGainers=gainerViewResults(model,gainerView);
  const haltByTicker=useMemo(()=>new Map((model?.activeHalts??[]).map(halt=>[halt.ticker,halt])),[model?.activeHalts]);
  const resultsFor=(kind:ScannerKind)=>kind==="gainers"?selectedGainers:model?.momentum;
  const memberNotice=admin?null:memberScannerStatus(model,loadError,checkedAt);
  const gainerTabs=<Stack direction="row" sx={{alignItems:"flex-start",gap:0.6,minWidth:0}}><Tabs aria-label="Top Gainers comparison" value={gainerView} variant="scrollable" scrollButtons={false} sx={cardTitleTabsSx}
    onChange={(_,view:GainerView)=>{if(model)setGainerChoice({tradingDate:model.tradingDate,view});}}>
    <Tab label="Day Gainers" value="day" disabled={!model}/><Tab label="Post-Market Gainers" value="post_market" disabled={!model}/>
  </Tabs><Tooltip title="Day Gainers gains are calculated from yesterday’s regular session close price. Post-market Gainers are calculated from today’s regular close.">
    <IconButton aria-label="Explain Day and Post-market Gainers" size="small" sx={{p:0.2}}><InfoOutlinedIcon sx={{fontSize:15}}/></IconButton>
  </Tooltip></Stack>;
  const contents=(kind:ScannerKind,compactDesktop=false)=><>
    {memberNotice?<Alert severity={memberNotice===SCANNER_UNAVAILABLE_MESSAGE?"warning":"info"}>{memberNotice}</Alert>
      :kind==="gainers"&&gainerView==="post_market"&&model&&model.session!=="after_hours"
      ?<Typography color="text.secondary">{admin?"Post-market readings begin after the regular session closes.":SCANNER_UNAVAILABLE_MESSAGE}</Typography>
      :<ScannerContents compactDesktop={compactDesktop} haltByTicker={haltByTicker} onOpenChart={setChartRow} results={resultsFor(kind)} screen={kind}/>}
  </>;
  return <Stack spacing={2.5} sx={{ mt:{ xs:-1,sm:-2 } }}>
    {admin&&settingsError?<Alert severity="error">Scanner settings could not be loaded.</Alert>:null}
    {admin&&configuration?<AdminControls configuration={configuration} onSaved={setConfiguration}/>:admin&&!settingsError?<Skeleton height={220} variant="rounded"/>:null}
    {admin?<DashboardPanel action={model?<Stack direction="row" spacing={1} sx={{ alignItems:"center",flexWrap:"wrap" }}><Chip label={model.session?SESSION_LABELS[model.session]:"Session closed"} size="small"/><Typography color="text.secondary" variant="caption">Updated {time(model.updatedAtUtc)}</Typography></Stack>:null} title="Live market activity">
      <Stack spacing={2}>
        {loadError?<Alert severity="error">The latest scanner update could not be loaded.</Alert>:null}
        {!model?<Skeleton height={180} variant="rounded"/>:statusMessage(model)?<Alert severity={model.status==='unavailable'?'error':'info'}>{statusMessage(model)}</Alert>:null}
        {model?.universeSourceDate&&model.universeSourceDate!==model.tradingDate?<Alert severity="warning">Today’s universe refresh is missing. Scanning continues with the {model.universeSourceDate} list.</Alert>:null}
        {model&&model.status!=='disabled'?<Stack direction="row" sx={{ flexWrap:"wrap",gap:1 }}><Chip label={`${model.receivedCount}/${model.universeCount} quotes`} size="small"/><Chip label={`${model.missingFloatCount} missing float`} size="small"/>{model.missingSymbols.length?<Chip color="warning" label={`${model.missingSymbols.length} missing quotes`} size="small"/>:null}</Stack>:null}
      </Stack>
    </DashboardPanel>:null}
    <Box data-scanner-grid sx={{ display:"grid",gridTemplateColumns:{xs:"minmax(0,1fr)",md:"repeat(4,minmax(0,1fr))"},gap:1.5,alignItems:"start",'& .MuiTypography-h2':{ color:"text.primary",fontSize:"0.9rem",fontWeight:850,lineHeight:1.2 } }}>
      {(["gainers","momentum"] as const).map(kind=><Box key={kind} data-scanner-card={kind} sx={{minWidth:0,'& .MuiCardContent-root':{p:1.25,'&:last-child':{pb:1.25}}}}>
        <DashboardPanel hideHeader>
          <Stack direction="row" sx={{alignItems:"flex-start",justifyContent:"space-between",mb:1.25,minHeight:22}}>
            {kind==="momentum"?<Box component="h2" sx={{fontSize:"0.9rem",fontWeight:850,lineHeight:1.2,m:0}}>Momentum</Box>:gainerTabs}
            <Stack direction="row" spacing={0.5} sx={{alignItems:"center"}}>
          {admin&&resultsFor(kind)?<Chip label={`${resultsFor(kind)!.total}`} size="small" aria-label={`${resultsFor(kind)!.total} qualifying`}/>:null}
          <IconButton size="small" aria-label={`Open ${SCREEN_LABELS[kind]} full view`} title={`Open ${SCREEN_LABELS[kind]} full view`} onClick={()=>setFullScanner(kind)}><OpenInFullRoundedIcon sx={{fontSize:18}}/></IconButton>
            </Stack>
          </Stack>
          {contents(kind,true)}
        </DashboardPanel>
      </Box>)}
      <Box data-scanner-declines-card sx={{minWidth:0,'& .MuiCardContent-root':{p:1.25,'&:last-child':{pb:1.25}}}}><DeclinesCard results={model?.declines}
        notice={memberNotice??(model&&["disabled","closed","unavailable","universe_missing"].includes(model.status)?statusMessage(model):null)}
        session={model?.session??null} haltByTicker={haltByTicker} onOpenChart={setChartRow}/></Box>
      <Box data-scanner-premarket-pullbacks-card sx={{minWidth:0,'& .MuiCardContent-root':{p:1.25,'&:last-child':{pb:1.25}}}}><PremarketPullbacksCard results={model?.premarketPullbacks}
        notice={memberNotice??(model&&["disabled","closed","unavailable","universe_missing"].includes(model.status)?statusMessage(model):null)} haltByTicker={haltByTicker} onOpenChart={setChartRow}/></Box>
      <Box data-scanner-market-events-card sx={{minWidth:0}}><ScreenerPressReleaseBoard managedActiveHalts={model?.activeHalts??[]} onOpenChart={setChartRow}/></Box>
    </Box>
    <Drawer anchor="right" open={fullScanner!==null} onClose={()=>setFullScanner(null)}
      slotProps={{paper:{role:"dialog","aria-modal":true,"aria-label":fullScanner?`${SCREEN_LABELS[fullScanner]} full view`:undefined,
        sx:{width:{xs:"100vw",md:"90vw",xl:"85vw"},maxWidth:"100vw"}}}}>
      {fullScanner?<Stack sx={{height:"100dvh",minHeight:0}}>
        <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",borderBottom:1,borderColor:"divider",px:2,py:1.25}}>
          <Typography component="h2" variant="h6" sx={{fontWeight:800}}>{SCREEN_LABELS[fullScanner]}</Typography>
          <IconButton aria-label="Close full scanner view" onClick={()=>setFullScanner(null)}><CloseRoundedIcon/></IconButton>
        </Stack>
        <Box sx={theme=>({...scannerScrollStyles(theme),minHeight:0,p:2})}>{fullScanner==="gainers"?gainerTabs:null}{contents(fullScanner)}</Box>
      </Stack>:null}
    </Drawer>
    <ScannerChartDrawer onClose={()=>setChartRow(null)} row={chartRow}/>
  </Stack>;
}
