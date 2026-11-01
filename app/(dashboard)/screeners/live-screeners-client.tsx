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
import Typography from "@mui/material/Typography";
import CandlestickChartRoundedIcon from "@mui/icons-material/CandlestickChartRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Fragment, useEffect, useRef, useState } from "react";

import { TradingViewChart } from "@/app/(dashboard)/charts/trading-view-chart";
import { DashboardPanel, DashboardPrimaryAction } from "@/app/dashboard-template";
import { ScreenerPressReleaseBoard } from "./screener-press-release-board";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import type { LiveScannerRow, LiveScreenResults, ScannerConfiguration, ScannerKind, ScannerReadModel,
  ScannerSession, ScreenFilters } from "@/src/modules/scanner/live/contracts";

const SCREEN_LABELS: Record<ScannerKind,string> = { gainers: "Top Gainers", momentum: "Momentum" };
const SESSION_LABELS: Record<ScannerSession,string> = { premarket: "Premarket", regular: "Regular hours", after_hours: "After hours" };
const number = new Intl.NumberFormat("en-US",{ maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-US",{ notation: "compact",maximumFractionDigits: 1 });
function value(input: number | null | undefined, suffix = ""): string { return input == null ? "n/a" : `${number.format(input)}${suffix}`; }
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
  return `${number.format(100 * row.volume / row.float)}%`;
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
function movementRowSx(direction:"up"|"down"|undefined) {
  return { animation:direction?`scanner-price-${direction} 900ms ease-out`:"none",'@media (prefers-reduced-motion: reduce)':{ animation:"none" } };
}

function CompactStockTable({ rows,screen,onOpenChart }: { rows: readonly LiveScannerRow[]; screen: ScannerKind; onOpenChart:(row:LiveScannerRow)=>void }) {
  const [expandedSymbol,setExpandedSymbol]=useState<string|null>(null);
  const movement=usePriceMovement(rows);
  const toggle=(symbol:string)=>setExpandedSymbol(current=>current===symbol?null:symbol);
  const metric=(label:string,content:string)=><Box sx={{ minWidth:0 }}><Typography sx={{ color:"warning.main",fontSize:"0.68rem",fontWeight:750,lineHeight:1,textTransform:"uppercase" }}>{label}</Typography><Typography sx={{ fontSize:"0.9rem",fontWeight:750,lineHeight:1.3,mt:0.45 }}>{content}</Typography></Box>;
  const headers=screen==="gainers"
    ? [{ label:"",width:"7%" },{ label:"Ticker",width:"17%" },{ label:"Price",width:"14%" },{ label:"Gain",width:"14%" },{ label:"Volume",width:"17%" },{ label:"Float",width:"15%" },{ label:"PR/SEC",width:"16%",right:true }]
    : [{ label:"",width:"7%" },{ label:"Ticker",width:"17%" },{ label:"Price",width:"13%" },{ label:"1m %",width:"12%" },{ label:"5m %",width:"12%" },{ label:"1m Vol",width:"15%" },{ label:"Float",width:"11%" },{ label:"News",width:"13%",right:true }];
  return <TableContainer sx={{ border:1,borderColor:"divider",borderRadius:1.5 }}>
    <Table aria-label="Screener stocks" size="small" sx={{ ...movementTableSx,tableLayout:"fixed",'& .MuiTableCell-root':{ px:0.65,py:0.38 },'& .MuiTableCell-head':{ color:"text.secondary",fontSize:"0.68rem",fontWeight:750,lineHeight:1,pb:0.75,whiteSpace:"nowrap" } }}>
      <TableHead><TableRow>{headers.map((header,index)=><TableCell align={header.right?"right":"left"} aria-label={header.label||"Expand"} key={header.label||index} sx={{ width:header.width }}>{header.label}</TableCell>)}</TableRow></TableHead>
      <TableBody>{rows.map(row=>{const expanded=expandedSymbol===row.symbol;const traded=floatTraded(row);const expandedMetrics=(screen==="gainers"?[
        metric("HOD price",`$${value(row.dayHigh)}`),
        metric("Below HOD",value(row.offHighPercent,"%")),
        metric("Session low",`$${value(row.dayLow)}`),
        row.relativeVolume==null?null:metric("RVOL",`${number.format(row.relativeVolume)}×`),
        traded==null?null:metric("Turnover",traded),
      ]:[
        row.sessionGain===null?null:metric("Day gain",value(row.sessionGain,"%")),
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
        <TableRow aria-expanded={expanded} hover onClick={()=>toggle(row.symbol)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle(row.symbol);}}} sx={{ ...movementRowSx(movement[row.symbol]),cursor:"pointer",'&:focus-visible':{ outline:"2px solid",outlineColor:"primary.main",outlineOffset:-2 } }} tabIndex={0}>
          <TableCell aria-hidden sx={{ pr:"0 !important",textAlign:"center" }}><Typography component="span" sx={{ color:"text.secondary",fontSize:"1.4rem",fontWeight:800,lineHeight:1 }}>{expanded?"−":"+"}</Typography></TableCell>
          <TableCell sx={{ pl:"0.7rem !important" }}><Typography noWrap component="span" sx={{ color:"warning.main",fontSize:"0.86rem",fontWeight:900,letterSpacing:"0.015em" }}>{row.symbol}</Typography></TableCell>
          <TableCell><Typography noWrap sx={{ fontSize:"0.79rem",fontWeight:700 }}>${value(row.price)}</Typography></TableCell>
          {screen==="gainers"?<>
            <TableCell><Typography noWrap sx={{ color:(row.sessionGain??0)>=0?"success.main":"error.main",fontSize:"0.79rem",fontWeight:750 }}>{value(row.sessionGain,"%")}</Typography></TableCell>
            <TableCell><Typography noWrap sx={{ fontSize:"0.77rem",fontWeight:650 }}>{row.volume===null?"n/a":compact.format(row.volume)}</Typography></TableCell>
            <TableCell><Typography noWrap sx={{ fontSize:"0.77rem",fontWeight:650 }}>{floatValue(row.float)}</Typography></TableCell>
            <TableCell align="right"><CompactNewsLink row={row}/></TableCell>
          </>:<>
            <TableCell><Typography noWrap sx={{ color:(row.activity.oneMinuteGain??0)>=0?"success.main":"error.main",fontSize:"0.79rem",fontWeight:750 }}>{value(row.activity.oneMinuteGain,"%")}</Typography></TableCell>
            <TableCell><Typography noWrap sx={{ color:(row.activity.fiveMinuteGain??0)>=0?"success.main":"error.main",fontSize:"0.79rem",fontWeight:750 }}>{value(row.activity.fiveMinuteGain,"%")}</Typography></TableCell>
            <TableCell><Typography noWrap sx={{ fontSize:"0.77rem",fontWeight:650 }}>{row.activity.oneMinuteVolume==null?"n/a":compact.format(row.activity.oneMinuteVolume)}</Typography></TableCell>
            <TableCell><Typography noWrap sx={{ fontSize:"0.77rem",fontWeight:650 }}>{floatValue(row.float)}</Typography></TableCell>
            <TableCell align="right"><CompactNewsLink row={row}/></TableCell>
          </>}
        </TableRow>
        {expanded?<TableRow><TableCell colSpan={screen==="momentum"?8:7} sx={{ bgcolor:"action.hover",position:"relative",py:"8px !important" }}>
          {expandedMetrics.length?<Box sx={{ display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",columnGap:1.25,pr:16,rowGap:1.6,py:0.6 }}>
            {expandedMetrics.map((item,index)=><Fragment key={index}>{item}</Fragment>)}
          </Box>:null}
          <Box sx={{ bottom:8,display:"flex",position:"absolute",right:5 }}><ChartButton expanded onOpenChart={onOpenChart} row={row}/></Box>
        </TableCell></TableRow>:null}
      </Fragment>})}</TableBody>
    </Table>
  </TableContainer>;
}

function Results({ results,screen,onOpenChart }: { results: LiveScreenResults; screen: ScannerKind; onOpenChart:(row:LiveScannerRow)=>void }) {
  const [expandedDesktopSymbol,setExpandedDesktopSymbol]=useState<string|null>(null);
  const movement=usePriceMovement(results.rows);
  if (!results.rows.length) return <Alert severity="info">No stocks currently qualify for this list.</Alert>;
  const desktopTableSx={
    ...movementTableSx,tableLayout:"fixed",
    width:"100%",
    '& .MuiTableCell-root':{ overflow:"hidden",px:0.25,py:0.42,fontSize:"0.68rem",textOverflow:"ellipsis",whiteSpace:"nowrap" },
    '& .MuiTableCell-head':{ color:"text.secondary",fontSize:"0.6rem",fontWeight:750,lineHeight:1,pb:0.85 },
  };
  return <>
    <TableContainer sx={{ display:{ xs:"none",md:"block" },overflowX:"auto" }}>
      {screen==="gainers"?<Table size="small" sx={desktopTableSx}><TableHead><TableRow>
        <TableCell aria-label="Chart" sx={{ px:"0 !important",width:24 }}/>
        {['Ticker','Price','Gain%','Volume','$ × Vol','Float','Turnover','RVOL','Below HOD','News'].map(label => <TableCell key={label}>{label}</TableCell>)}
      </TableRow></TableHead><TableBody>{results.rows.map(row=><TableRow hover key={row.symbol} sx={movementRowSx(movement[row.symbol])}>
        <TableCell sx={{ px:"0 !important",width:24 }}><ChartButton onOpenChart={onOpenChart} row={row}/></TableCell>
        <TableCell sx={{ fontWeight:800,pl:"0.5rem !important" }}><Typography component="span" sx={{ color:"warning.main",font:"inherit",fontWeight:800 }}>{row.symbol}</Typography></TableCell>
        <TableCell>${value(row.price)}</TableCell><TableCell sx={{ color:(row.sessionGain??0)>=0?"success.main":"error.main",fontWeight:750 }}>{value(row.sessionGain,"%")}</TableCell>
        <TableCell>{row.volume===null?"n/a":compact.format(row.volume)}</TableCell><TableCell>{row.dollarVolume===null?"n/a":`$${compact.format(row.dollarVolume)}`}</TableCell>
        <TableCell>{floatValue(row.float)}</TableCell><TableCell>{floatTraded(row)??"n/a"}</TableCell><TableCell>{row.relativeVolume==null?"n/a":`${number.format(row.relativeVolume)}×`}</TableCell>
        <TableCell>{value(row.offHighPercent,"%")}</TableCell><TableCell><NewsLinks row={row} /></TableCell>
      </TableRow>)}</TableBody></Table>:<Table size="small" sx={desktopTableSx}><TableHead><TableRow>
        <TableCell aria-label="Details" sx={{ px:"0 !important",width:22 }}/>
        <TableCell aria-label="Chart" sx={{ px:"0.125rem !important",width:26 }}/>
        {['Ticker','Price','Gain%','1min','5min','1min Vol','5min Vol','1min ↑','5min ↑','Float','Spread','News'].map(label => <TableCell key={label}>{label}</TableCell>)}
      </TableRow></TableHead><TableBody>{results.rows.map(row=>{const expanded=expandedDesktopSymbol===row.symbol;return <Fragment key={row.symbol}>
        <TableRow aria-expanded={expanded} hover onClick={()=>setExpandedDesktopSymbol(current=>current===row.symbol?null:row.symbol)}
          onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setExpandedDesktopSymbol(current=>current===row.symbol?null:row.symbol);}}}
          sx={{ ...movementRowSx(movement[row.symbol]),cursor:"pointer",'&:focus-visible':{ outline:"2px solid",outlineColor:"primary.main",outlineOffset:-2 } }} tabIndex={0}>
          <TableCell sx={{ px:"0 !important",width:22 }}><ButtonBase aria-label={`${expanded?"Collapse":"Expand"} ${row.symbol} details`} onClick={event=>{event.stopPropagation();setExpandedDesktopSymbol(current=>current===row.symbol?null:row.symbol);}} sx={{ bgcolor:"rgba(255,193,7,0.14)",borderRadius:0.75,color:"warning.main",fontSize:"0.75rem",fontWeight:800,height:20,minWidth:20,'&:hover':{ bgcolor:"rgba(255,193,7,0.24)" },'&:focus-visible':{ outline:"2px solid",outlineColor:"warning.main",outlineOffset:1 } }}>{expanded?"−":"+"}</ButtonBase></TableCell>
          <TableCell sx={{ px:"0.125rem !important",width:26 }}><ChartButton onOpenChart={onOpenChart} row={row}/></TableCell>
          <TableCell sx={{ fontWeight:800,pl:"0.3rem !important" }}><Typography component="span" sx={{ color:"warning.main",font:"inherit",fontWeight:800 }}>{row.symbol}</Typography></TableCell>
          <TableCell>${value(row.price)}</TableCell><TableCell sx={{ color:(row.sessionGain??0)>=0?"success.main":"error.main",fontWeight:750 }}>{value(row.sessionGain,"%")}</TableCell>
          <TableCell>{value(row.activity.oneMinuteGain,"%")}</TableCell><TableCell>{value(row.activity.fiveMinuteGain,"%")}</TableCell>
          <TableCell>{row.activity.oneMinuteVolume==null?"n/a":compact.format(row.activity.oneMinuteVolume)}</TableCell><TableCell>{row.activity.fiveMinuteVolume==null?"n/a":compact.format(row.activity.fiveMinuteVolume)}</TableCell>
          <TableCell>{row.activity.volumeAcceleration==null?"n/a":`${number.format(row.activity.volumeAcceleration)}×`}</TableCell><TableCell>{row.activity.fiveMinuteVolumeSpike==null?"n/a":`${number.format(row.activity.fiveMinuteVolumeSpike)}×`}</TableCell>
          <TableCell>{floatValue(row.float)}</TableCell><TableCell>{value(row.spreadPercent,"%")}</TableCell><TableCell onClick={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}><NewsLinks row={row} /></TableCell>
        </TableRow>
        {expanded?<TableRow><TableCell colSpan={14} sx={{ bgcolor:"action.hover",py:"10px !important" }}>
          <Box sx={{ display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:2 }}>
            {[
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
    <Box sx={{ display:{ xs:"block",md:"none" },mb:-2,mx:-2 }}><CompactStockTable onOpenChart={onOpenChart} rows={results.rows} screen={screen}/></Box>
  </>;
}

function ScannerContents({ results,screen,onOpenChart }: { results: LiveScreenResults | undefined; screen: ScannerKind; onOpenChart:(row:LiveScannerRow)=>void }) {
  if (!results) return <Skeleton height={440} variant="rounded"/>;
  return <Results onOpenChart={onOpenChart} results={results} screen={screen}/>;
}

function ScannerChartDrawer({ row,onClose }: { row:LiveScannerRow|null; onClose:()=>void }) {
  return <Drawer anchor="right" onClose={onClose} open={row!==null} slotProps={{ paper:{ sx:{ maxWidth:"100vw",width:{ xs:"100vw",md:"78vw",xl:1180 } } } }}>
    <Stack sx={{ height:"100dvh",minHeight:0 }}>
      <Stack direction="row" sx={{ alignItems:"center",borderBottom:1,borderColor:"divider",justifyContent:"space-between",px:{ xs:1.5,md:2 },py:1.25 }}>
        <Box><Typography component="h2" sx={{ fontWeight:850 }} variant="h6">{row?.symbol} chart</Typography><Typography color="text.secondary" variant="body2">{row?.exchange} · TradingView</Typography></Box>
        <IconButton aria-label="Close chart" onClick={onClose}><CloseRoundedIcon/></IconButton>
      </Stack>
      <Box sx={{ flex:1,minHeight:0,p:{ xs:0,md:1.5 } }}>{row?<TradingViewChart symbol={`${row.exchange}:${row.symbol}`} sx={{ border:{ xs:0,md:1 },borderRadius:{ xs:0,md:2 },height:"100%",minHeight:0 }}/>:null}</Box>
    </Stack>
  </Drawer>;
}

function AdminControls({ configuration,onSaved }: { configuration: ScannerConfiguration; onSaved:(next:ScannerConfiguration)=>void }) {
  const [draft,setDraft]=useState(configuration), [screen,setScreen]=useState<ScannerKind>("gainers"), [session,setSession]=useState<ScannerSession>("premarket");
  const [saving,setSaving]=useState(false), [message,setMessage]=useState<string|null>(null);
  useEffect(()=>setDraft(configuration),[configuration]);
  const controls=draft[screen], filters=controls.filters[session];
  const updateControls=(next:Partial<typeof controls>)=>setDraft(current=>({ ...current,[screen]:{ ...current[screen],...next } }));
  const updateFilter=(next:Partial<ScreenFilters>)=>updateControls({ filters:{ ...controls.filters,[session]:{ ...filters,...next } } });
  const save=async()=>{ setSaving(true);setMessage(null);try{
    const response=await fetch('/api/admin/screeners/settings',{ method:'POST',credentials:'same-origin',headers:{ 'content-type':'application/json',[PLATFORM_MUTATION_REQUEST_HEADER]:'1' },body:JSON.stringify({ expectedRevision:configuration.revision,configuration:draft }) });
    const payload=await response.json(); if(!response.ok) throw Error(payload.code||'save_failed'); onSaved(payload.configuration);setMessage('Scanner settings saved.');
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
    </Stack>
  </DashboardPanel>;
}

export function LiveScreenersClient({ admin=false }: { admin?: boolean }) {
  const [screen,setScreen]=useState<ScannerKind>("gainers"), [model,setModel]=useState<ScannerReadModel|null>(null), [configuration,setConfiguration]=useState<ScannerConfiguration|null>(null);
  const [chartRow,setChartRow]=useState<LiveScannerRow|null>(null);
  const [loadError,setLoadError]=useState(false), [settingsError,setSettingsError]=useState(false);
  useEffect(()=>{let timer:ReturnType<typeof setTimeout>|undefined;const controller=new AbortController();const load=async()=>{try{const response=await fetch('/api/screeners/live',{ cache:'no-store',credentials:'same-origin',signal:controller.signal });if(!response.ok)throw Error();setModel(await response.json());setLoadError(false);}catch{if(!controller.signal.aborted)setLoadError(true);}finally{if(!controller.signal.aborted)timer=setTimeout(()=>void load(),5000);}};void load();return()=>{controller.abort();if(timer)clearTimeout(timer);};},[]);
  useEffect(()=>{if(!admin)return;const controller=new AbortController();void fetch('/api/admin/screeners/settings',{ cache:'no-store',credentials:'same-origin',signal:controller.signal }).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(payload=>{setConfiguration(payload.configuration);setSettingsError(false);}).catch(()=>{if(!controller.signal.aborted)setSettingsError(true);});return()=>controller.abort();},[admin]);
  const scannerTabs=<Tabs aria-label="Live screener" onChange={(_,next:ScannerKind)=>setScreen(next)} value={screen} variant="scrollable">{Object.entries(SCREEN_LABELS).map(([key,label])=><Tab key={key} label={label} value={key}/>)}</Tabs>;
  return <Stack spacing={2.5} sx={{ mt:{ xs:-1,sm:-2 } }}>
    {admin&&settingsError?<Alert severity="error">Scanner settings could not be loaded.</Alert>:null}
    {admin&&configuration?<AdminControls configuration={configuration} onSaved={setConfiguration}/>:admin&&!settingsError?<Skeleton height={220} variant="rounded"/>:null}
    {admin?<DashboardPanel action={model?<Stack direction="row" spacing={1} sx={{ alignItems:"center",flexWrap:"wrap" }}><Chip label={model.session?SESSION_LABELS[model.session]:"Session closed"} size="small"/><Typography color="text.secondary" variant="caption">Updated {time(model.updatedAtUtc)}</Typography></Stack>:null} title="Live market activity">
      <Stack spacing={2}>
        <Box sx={{ display:{ xs:"block",md:"none" } }}>{scannerTabs}</Box>
        {loadError?<Alert severity="error">The latest scanner update could not be loaded.</Alert>:null}
        {!model?<Skeleton height={180} variant="rounded"/>:statusMessage(model)?<Alert severity={model.status==='unavailable'?'error':'info'}>{statusMessage(model)}</Alert>:null}
        {model?.universeSourceDate&&model.universeSourceDate!==model.tradingDate?<Alert severity="warning">Today’s universe refresh is missing. Scanning continues with the {model.universeSourceDate} list.</Alert>:null}
        {model&&model.status!=='disabled'?<Stack direction="row" sx={{ flexWrap:"wrap",gap:1 }}><Chip label={`${model.receivedCount}/${model.universeCount} quotes`} size="small"/><Chip label={`${model.missingFloatCount} missing float`} size="small"/>{model.missingSymbols.length?<Chip color="warning" label={`${model.missingSymbols.length} missing quotes`} size="small"/>:null}</Stack>:null}
      </Stack>
    </DashboardPanel>:<><Box sx={{ display:{ xs:"block",md:"none" } }}>{scannerTabs}</Box>{loadError?<Alert severity="error">The latest scanner update could not be loaded.</Alert>:null}{model&&statusMessage(model)?<Alert severity={model.status==='unavailable'?'error':'info'}>{statusMessage(model)}</Alert>:null}</>}
    <Box sx={{ display:{ xs:"none",md:"grid" },gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:2,alignItems:"start",'& .MuiTypography-h2':{ color:"text.primary",fontSize:"0.9rem",fontWeight:850,lineHeight:1.2 } }}>
      {(["gainers","momentum"] as const).map(kind=><DashboardPanel action={admin&&model?.[kind]?<Chip label={`${model[kind].total} qualifying`} size="small"/>:undefined} key={kind} title={SCREEN_LABELS[kind]}>
        <ScannerContents onOpenChart={setChartRow} results={model?.[kind]} screen={kind}/>
      </DashboardPanel>)}
    </Box>
    <Box sx={{ display:{ xs:"block",md:"none" },'& .MuiTypography-h2':{ color:"text.primary",fontSize:"0.9rem",fontWeight:850,lineHeight:1.2 } }}>
      <DashboardPanel action={admin&&model?.[screen]?<Chip label={`${model[screen].total} qualifying`} size="small"/>:undefined} title={SCREEN_LABELS[screen]}>
        <ScannerContents onOpenChart={setChartRow} results={model?.[screen]} screen={screen}/>
      </DashboardPanel>
    </Box>
    <ScreenerPressReleaseBoard/>
    <ScannerChartDrawer onClose={()=>setChartRow(null)} row={chartRow}/>
  </Stack>;
}
