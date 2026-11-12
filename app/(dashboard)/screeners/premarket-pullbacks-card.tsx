"use client";

import { scannerGainColor } from "./scanner-gain-color";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CandlestickChartRoundedIcon from "@mui/icons-material/CandlestickChartRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Fragment, useState } from "react";
import { DashboardPanel } from "@/app/dashboard-template";
import type { DeclineRow, PremarketPullbackResults, PremarketPullbackRow, ScannerActiveHalt } from "@/src/modules/scanner/live/contracts";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";
import { ScreenerHaltIndicator } from "./screener-halt-indicator";
import { ScannerNewsLink } from "./scanner-news-drawer-context";

const subDollarPrice=new Intl.NumberFormat("en-US",{minimumFractionDigits:3,maximumFractionDigits:3});
const regularPrice=new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const wholePercent=new Intl.NumberFormat("en-US",{maximumFractionDigits:0});
const compact=new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1});
const clock=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit",second:"2-digit"});
const price=(value:number)=>`$${(value<1?subDollarPrice:regularPrice).format(value)}`;
const optionalPrice=(value:number|null)=>value===null?"n/a":price(value);
const shares=(value:number|null)=>value===null?"n/a":compact.format(value);
const floatShares=(value:number|null)=>value===null?"—":compact.format(value);

type DropChartTarget = Pick<DeclineRow, "symbol" | "exchange" | "price">;

function ChartButton<T extends DropChartTarget>({row,onOpenChart}:{row:T;onOpenChart:(row:T)=>void}){
  return <ButtonBase aria-label={`Open ${row.symbol} chart`} onClick={event=>{event.stopPropagation();onOpenChart(row);}}
    onKeyDown={event=>event.stopPropagation()} sx={{alignItems:"center",bgcolor:"rgba(46,125,50,0.13)",borderRadius:0.75,color:"success.main",height:20,justifyContent:"center",minWidth:20,
      '&:hover':{bgcolor:"rgba(46,125,50,0.23)"},'&:focus-visible':{outline:"2px solid",outlineColor:"success.main",outlineOffset:1}}}>
    <CandlestickChartRoundedIcon sx={{fontSize:"0.9rem"}}/>
  </ButtonBase>;
}

const RAPID_DROP_HELP = "By default, a stock qualifies when it falls 30% or more from a recent peak within 5 minutes. The flag clears at 75% recovery of that drop or after 5 minutes, whichever comes first.";

function rapidFallTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

function RapidMarker() {
  return <Tooltip describeChild title={RAPID_DROP_HELP}>
    <BoltRoundedIcon role="img" aria-label="Recent rapid drop"
      sx={{color:"warning.main",fontSize:"0.8rem",flexShrink:0}}/>
  </Tooltip>;
}

function HighDropsTable({rows,full,onOpenChart,haltByTicker}:{rows:readonly PremarketPullbackRow[];full:boolean;onOpenChart:(row:PremarketPullbackRow)=>void;haltByTicker:ReadonlyMap<string,ScannerActiveHalt>}){
  const [expanded,setExpanded]=useState<string|null>(null);
  return <TableContainer role="region" aria-label="HOD Drops list" tabIndex={0} sx={theme=>({...scannerScrollStyles(theme),containerType:"inline-size",maxHeight:full?"calc(100dvh - 150px)":420})}>
    <Table size="small" stickyHeader aria-label="HOD Drops stocks" sx={{tableLayout:"fixed",minWidth:350,'& td, & th':{px:0.2,py:0.34,fontSize:"0.68rem",fontWeight:500},'& th':{color:"text.secondary",fontSize:"0.6rem",fontWeight:750,lineHeight:1,pb:0.7,whiteSpace:"nowrap"}}}>
      <TableHead><TableRow><TableCell sx={{width:26}} aria-label="Chart"/><TableCell sx={{width:24}} aria-label="Expand"/><TableCell sx={{width:48}}>Ticker</TableCell><TableCell sx={{width:54}}>Price</TableCell>
        <TableCell sx={{width:48}}>Drop</TableCell><TableCell sx={{width:62}}>High</TableCell><TableCell sx={{width:58}}>Vol</TableCell>
      </TableRow></TableHead>
      <TableBody>{rows.map(row=>{const open=expanded===row.symbol,toggle=()=>setExpanded(value=>value===row.symbol?null:row.symbol);
        const source=row.referenceSession==="premarket"?"PRE":row.referenceSession==="regular"?"REG":"POST";
        const rapidMetrics:[string,string][]=row.rapidDrop?[["Rapid start",price(row.rapidDrop.startPrice)],["Rapid low",price(row.rapidDrop.lowPrice)],["Rapid fall time",rapidFallTime(row.rapidDrop.durationSeconds)]]:[];
        const metrics:[string,string][]=open?[["Premarket high",optionalPrice(row.premarketHigh)],["Regular high",optionalPrice(row.regularHigh)],["Post-market high",optionalPrice(row.postMarketHigh)],
          ["Reference high",price(row.referenceHigh)],["Below reference high",`${wholePercent.format(row.belowHighPercent)}%`],["Back to reference high",`+${wholePercent.format(row.backToHighPercent)}%`],["Premarket volume",shares(row.premarketVolume)],
          ["Session volume",shares(row.sessionVolume)],["1min volume",shares(row.oneMinuteVolume)],["5min volume",shares(row.fiveMinuteVolume)],
          ["Float",floatShares(row.float)],["Spread",row.spreadPercent===null?"n/a":`${wholePercent.format(row.spreadPercent)}%`],
          ...rapidMetrics,
          ["Quote received",`${clock.format(new Date(row.receivedAtUtc))} ET`]]:[];
        return <Fragment key={row.symbol}><TableRow hover tabIndex={0} aria-expanded={open} onClick={toggle}
          onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();toggle();}}}
          sx={{cursor:"pointer",'&:focus-visible':{outline:"2px solid",outlineColor:"primary.main",outlineOffset:-2}}}>
          <TableCell sx={{px:"0.125rem !important"}}><ChartButton row={row} onOpenChart={onOpenChart}/></TableCell>
          <TableCell aria-hidden sx={{pr:"0 !important",textAlign:"center"}}><Typography component="span" sx={{color:"text.secondary",fontSize:"0.9rem",fontWeight:700,lineHeight:1}}>{open?"−":"+"}</Typography></TableCell>
          <TableCell><Stack direction="row" sx={{alignItems:"center",gap:0.25,flexWrap:"wrap"}}><Typography component="span" sx={{color:"warning.main",font:"inherit",fontWeight:800}}>{row.symbol}</Typography><ScreenerHaltIndicator halt={haltByTicker.get(row.symbol)}/>{row.rapidDrop?<RapidMarker/>:null}</Stack></TableCell>
          <TableCell sx={{color:scannerGainColor(row.changePercent)}}>{price(row.price)}</TableCell><TableCell sx={{color:scannerGainColor(-row.belowHighPercent),fontWeight:750}}>{wholePercent.format(row.belowHighPercent)}%</TableCell><TableCell><Typography component="span" sx={{font:"inherit"}}>{price(row.referenceHigh)}</Typography><Typography component="span" sx={{color:"warning.main",fontSize:"0.55rem",fontWeight:800,ml:0.4}}>{source}</Typography></TableCell><TableCell>{shares(row.sessionVolume)}</TableCell>
        </TableRow>{open?<TableRow><TableCell colSpan={7} sx={{bgcolor:"action.hover",p:"0 !important"}}><Box sx={{boxSizing:"border-box",left:0,p:1,position:"sticky",width:"100cqw"}}>
          <Box sx={{display:"grid",gridTemplateColumns:{xs:"repeat(2,minmax(0,1fr))",md:full?"repeat(4,minmax(0,1fr))":"repeat(2,minmax(0,1fr))"},gap:1.5,py:1}}>
            {metrics.map(([label,value])=><Box key={label}><Typography color="warning.main" sx={{display:"block",fontSize:"0.68rem",fontWeight:750,lineHeight:1,textTransform:"uppercase"}}>{label}</Typography><Typography variant="body2" sx={{fontWeight:700,mt:0.45,color:label==="Below reference high"?scannerGainColor(-row.belowHighPercent):undefined}}>{value}</Typography></Box>)}
          </Box><Stack direction="row" sx={{gap:1,flexWrap:"wrap",justifyContent:"space-between",alignItems:"center"}}>
            <Stack direction="row" spacing={1}>{row.news.slice(0,3).map(item=><ScannerNewsLink item={item} key={item.id} label={item.typeLabel}/>)}</Stack>
            <Button size="small" aria-label={`Open ${row.symbol} chart`} onClick={()=>onOpenChart(row)}>View Chart</Button>
          </Stack>
          </Box>
        </TableCell></TableRow>:null}</Fragment>;
      })}</TableBody>
    </Table>
  </TableContainer>;
}

function RecentRapidDrops({ rows, onOpenChart, haltByTicker }: {
  rows: readonly DeclineRow[]; onOpenChart: (row: DropChartTarget) => void;
  haltByTicker: ReadonlyMap<string,ScannerActiveHalt>;
}) {
  if (rows.length===0) return null;
  return <Box component="section" aria-label="Recent Rapid Drops" sx={{minWidth:0}}>
      <Box role="list" sx={theme=>({...scannerScrollStyles(theme),overflowX:"hidden",maxHeight:110})}>
        {rows.map(row=>row.drop&&<Stack key={row.symbol} role="listitem" direction="row"
          sx={{alignItems:"center",gap:0.6,minHeight:25,fontSize:"0.68rem"}}>
          <ChartButton row={row} onOpenChart={onOpenChart}/>
          <Typography variant="inherit" color="warning.main" sx={{fontWeight:800}}>{row.symbol}</Typography>
          <RapidMarker/>
          <ScreenerHaltIndicator halt={haltByTicker.get(row.symbol)}/>
          <Typography variant="inherit" sx={{fontWeight:750,color:scannerGainColor(row.drop.maximumDropPercent)}}>{wholePercent.format(row.drop.maximumDropPercent)}%</Typography>
          <Typography variant="inherit" color="text.secondary">in {rapidFallTime(row.drop.durationSeconds)}</Typography>
        </Stack>)}
      </Box>
  </Box>;
}

export function PremarketPullbacksCard({results,rapid=[],notice,onOpenChart,haltByTicker=new Map()}:{results:PremarketPullbackResults|undefined;rapid?:readonly DeclineRow[];notice:string|null;onOpenChart:(row:DropChartTarget)=>void;haltByTicker?:ReadonlyMap<string,ScannerActiveHalt>}){
  const [full,setFull]=useState(false);
  const contents=(wide:boolean)=><Stack spacing={1}>
    {!notice&&results?.controls.enabled&&<RecentRapidDrops rows={rapid} onOpenChart={onOpenChart} haltByTicker={haltByTicker}/>}
    {results&&!results.controls.enabled?<Alert severity="info">Disabled</Alert>:notice?<Alert severity="info">{notice}</Alert>:!results?<Skeleton height={260}/>
      :results.rows.length?<HighDropsTable rows={results.rows} full={wide} haltByTicker={haltByTicker} onOpenChart={onOpenChart}/>:<Alert severity="info">No stocks currently qualify for this list.</Alert>}
  </Stack>;
  return <><DashboardPanel hideHeader><Stack direction="row" sx={{alignItems:"flex-start",justifyContent:"space-between",mb:1.25,minHeight:22}}><Stack direction="row" sx={{alignItems:"flex-start",gap:0.6}}><Typography component="h2" variant="h2">HOD Drops</Typography><Tooltip title={`HOD Drops ranks stocks by how far they are below the session high. The bolt marks a rapid drop. ${RAPID_DROP_HELP}`}><IconButton aria-label="Explain HOD Drops" size="small" sx={{p:0.2}}><InfoOutlinedIcon sx={{fontSize:15}}/></IconButton></Tooltip></Stack><IconButton size="small" aria-label="Open HOD Drops full view" title="Open full view" onClick={()=>setFull(true)}><OpenInFullRoundedIcon sx={{fontSize:18}}/></IconButton></Stack>{contents(false)}</DashboardPanel>
    <Drawer anchor="right" open={full} onClose={()=>setFull(false)} slotProps={{paper:{role:"dialog","aria-label":"HOD Drops full view","aria-modal":true,sx:{width:{xs:"100vw",md:"85vw"}}}}}>
      <Stack spacing={1} sx={{p:2,height:"100dvh",minHeight:0}}><Stack direction="row" sx={{justifyContent:"space-between",alignItems:"center"}}><Typography component="h2" variant="h6">HOD Drops</Typography><IconButton aria-label="Close HOD Drops full view" onClick={()=>setFull(false)}><CloseRoundedIcon/></IconButton></Stack>
        <Box sx={theme=>({...scannerScrollStyles(theme),minHeight:0})}>{contents(true)}</Box></Stack>
    </Drawer></>;
}
