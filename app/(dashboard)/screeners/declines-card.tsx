"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CandlestickChartRoundedIcon from "@mui/icons-material/CandlestickChartRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Fragment, useState } from "react";
import { DashboardPanel } from "@/app/dashboard-template";
import type { DeclineResults, DeclineRow, ScannerSession } from "@/src/modules/scanner/live/contracts";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";

const numeric=new Intl.NumberFormat("en-US",{maximumFractionDigits:2});
const compact=new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1});
const prices=new Intl.NumberFormat("en-US",{maximumFractionDigits:4});
const clock=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit",second:"2-digit"});
const price=(value:number)=>`$${prices.format(value)}`;
const pct=(value:number|null)=>value===null?"n/a":`${value>0?"+":""}${numeric.format(value)}%`;
const shares=(value:number|null)=>value===null?"n/a":compact.format(value);
const stamp=(value:string)=>clock.format(new Date(value));
const titleTabsSx={minHeight:22,'& .MuiTabs-indicator':{height:2},'& .MuiTab-root':{fontSize:"0.9rem",fontWeight:850,lineHeight:1.2,minHeight:22,minWidth:0,p:0,pb:0.6,px:0,textTransform:"none"},'& .MuiTab-root + .MuiTab-root':{ml:2}};

function ChartButton({row,onOpenChart}:{row:DeclineRow;onOpenChart:(row:DeclineRow)=>void}){
  return <ButtonBase aria-label={`Open ${row.symbol} chart`} onClick={event=>{event.stopPropagation();onOpenChart(row);}}
    onKeyDown={event=>event.stopPropagation()} sx={{alignItems:"center",bgcolor:"rgba(46,125,50,0.13)",borderRadius:0.75,color:"success.main",height:20,justifyContent:"center",minWidth:20,
      '&:hover':{bgcolor:"rgba(46,125,50,0.23)"},'&:focus-visible':{outline:"2px solid",outlineColor:"success.main",outlineOffset:1}}}>
    <CandlestickChartRoundedIcon sx={{fontSize:"0.9rem"}}/>
  </ButtonBase>;
}

function DeclineTable({rows,rapid,full,onOpenChart}:{rows:readonly DeclineRow[];rapid:boolean;full:boolean;onOpenChart:(row:DeclineRow)=>void}){
  const [expanded,setExpanded]=useState<string|null>(null);
  if(!rows.length)return <Alert severity="info">{rapid?"No rapid drops currently detected.":"No stocks currently declining in this comparison."}</Alert>;
  return <TableContainer role="region" aria-label={rapid?"Rapid Drops list":"Top Losers list"} tabIndex={0}
    sx={theme=>({...scannerScrollStyles(theme),maxHeight:full?"calc(100dvh - 190px)":420})}>
    <Table size="small" stickyHeader aria-label={rapid?"Rapid Drops stocks":"Top Losers stocks"}
      sx={{tableLayout:"fixed",minWidth:600,'& td, & th':{px:0.35,py:0.34,fontSize:"0.68rem",fontWeight:500},'& th':{color:"text.secondary",fontSize:"0.6rem",fontWeight:750,lineHeight:1,pb:0.7,whiteSpace:"nowrap"}}}>
      <TableHead><TableRow><TableCell sx={{width:28}} aria-label="Chart"/><TableCell sx={{width:28}} aria-label="Expand"/>
        <TableCell>Ticker</TableCell><TableCell>Price</TableCell><TableCell>{rapid?"From start":"Change"}</TableCell>
        <TableCell>{rapid?"Fall time":"Volume"}</TableCell><TableCell>{rapid?"Rebound":"Float"}</TableCell><TableCell>{rapid?"Back to start":"Spread"}</TableCell>
      </TableRow></TableHead>
      <TableBody>{rows.map(row=>{const open=expanded===row.symbol,d=row.drop;const toggle=()=>setExpanded(value=>value===row.symbol?null:row.symbol);
        const metrics:[string,string][]=open?[["Session volume",shares(row.volume)],["Float",shares(row.float)],["Spread",pct(row.spreadPercent)],
          ["Quote received",`${stamp(row.receivedAtUtc)} ET`],...(d?[
            ["Pre-drop price",price(d.startPrice)],["Detected at",price(d.detectionPrice)],["Lowest since detection",price(d.lowPrice)],
            ["Largest drop",pct(d.maximumDropPercent)],["Rebound from low",pct(d.reboundPercent)],["Back to pre-drop price",pct(Math.max(0,d.backToStartPercent))],
            ["Observed fall",`${Math.floor(d.durationSeconds/60)}m ${d.durationSeconds%60}s`],["Shares during fall",shares(d.sharesDuringDrop)],
            ["First detected",`${stamp(d.detectedAtUtc)} ET`],
          ] as [string,string][]:[["Comparison price",row.comparisonPrice===null?"n/a":price(row.comparisonPrice)]] as [string,string][])]:[];
        return <Fragment key={row.symbol}>
          <TableRow hover tabIndex={0} aria-expanded={open} onClick={toggle} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();toggle();}}}
            sx={{cursor:"pointer",'&:focus-visible':{outline:"2px solid",outlineColor:"primary.main",outlineOffset:-2}}}>
            <TableCell sx={{px:"0.125rem !important"}}><ChartButton row={row} onOpenChart={onOpenChart}/></TableCell>
            <TableCell aria-hidden sx={{pr:"0 !important",textAlign:"center"}}><Typography component="span" sx={{color:"text.secondary",fontSize:"0.9rem",fontWeight:700,lineHeight:1}}>{open?"−":"+"}</Typography></TableCell>
            <TableCell sx={{color:"warning.main",fontWeight:850}}>{row.symbol}</TableCell>
            <TableCell>{price(row.price)}</TableCell><TableCell sx={{color:(d?.dropPercent??row.changePercent??0)<0?"error.main":"success.main",fontWeight:750}}>{pct(d?.dropPercent??row.changePercent)}</TableCell>
            <TableCell>{d?`${Math.floor(d.durationSeconds/60)}m ${d.durationSeconds%60}s`:shares(row.volume)}</TableCell>
            <TableCell>{d?pct(d.reboundPercent):shares(row.float)}</TableCell><TableCell>{d?pct(Math.max(0,d.backToStartPercent)):pct(row.spreadPercent)}</TableCell>
          </TableRow>
          {open?<TableRow><TableCell colSpan={8} sx={{bgcolor:"action.hover"}}>
            <Box sx={{display:"grid",gridTemplateColumns:{xs:"repeat(2,minmax(0,1fr))",md:full?"repeat(4,minmax(0,1fr))":"repeat(2,minmax(0,1fr))"},gap:1.5,py:1}}>
              {metrics.map(([label,value])=><Box key={label}><Typography variant="caption" color="warning.main" sx={{display:"block",fontWeight:750}}>{label}</Typography><Typography variant="body2" sx={{fontWeight:700}}>{value}</Typography></Box>)}
            </Box>
            <Stack direction="row" sx={{gap:1,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
              <Stack direction="row" spacing={1}>{row.news.slice(0,3).map(item=>item.url?<Link key={item.id} href={item.url} target="_blank" rel="noreferrer" title={item.headline}>{item.typeLabel}</Link>:null)}</Stack>
              <Button size="small" onClick={()=>onOpenChart(row)} aria-label={`Open ${row.symbol} chart`}>View Chart</Button>
            </Stack>
          </TableCell></TableRow>:null}
        </Fragment>;
      })}</TableBody>
    </Table>
  </TableContainer>;
}

export function DeclinesCard({results,notice,onOpenChart}:{results:DeclineResults|undefined;notice:string|null;session:ScannerSession|null;onOpenChart:(row:DeclineRow)=>void}){
  const [view,setView]=useState<"rapid"|"losers">("rapid"),[full,setFull]=useState(false);
  const tabs=(wide:boolean)=><Stack direction="row" sx={{alignItems:"flex-start",gap:0.6,minWidth:0}}><Tabs value={view} onChange={(_,next)=>setView(next)} aria-label={wide?"Full decline scanner view":"Decline scanner view"} variant="scrollable" sx={titleTabsSx}><Tab label="Rapid Drops" value="rapid"/><Tab label="Top Losers" value="losers"/></Tabs>
    <Tooltip title="Top Losers during premarket and regular hours are calculated from yesterday’s regular session close. When post-market starts, Top Losers automatically switch to today’s regular session close. Rapid Drops are stocks falling 30% or more within 5 minutes using observed prices."><IconButton aria-label="Explain Rapid Drops and Top Losers" size="small" sx={{p:0.2}}><InfoOutlinedIcon sx={{fontSize:15}}/></IconButton></Tooltip>
  </Stack>;
  const contents=(wide:boolean)=><Stack spacing={1}>
    {results&&!results.controls.enabled?<Alert severity="info">Disabled</Alert>:notice?<Alert severity="info">{notice}</Alert>
      :!results?<Skeleton height={260}/>:<DeclineTable full={wide} rapid={view==="rapid"} rows={view==="rapid"?results.rapid:results.losers} onOpenChart={onOpenChart}/>}
  </Stack>;
  return <>
    <DashboardPanel hideHeader><Stack direction="row" sx={{alignItems:"flex-start",justifyContent:"space-between",mb:1.25,minHeight:22}}>{tabs(false)}<IconButton size="small" aria-label="Open Rapid Drops full view" onClick={()=>setFull(true)}><OpenInFullRoundedIcon sx={{fontSize:18}}/></IconButton></Stack>{contents(false)}</DashboardPanel>
    <Drawer anchor="right" open={full} onClose={()=>setFull(false)} slotProps={{paper:{role:"dialog","aria-label":"Rapid Drops full view","aria-modal":true,sx:{width:{xs:"100vw",md:"85vw"}}}}}>
      <Stack sx={{p:2,minHeight:0,height:"100dvh"}} spacing={1}>
        <Stack direction="row" sx={{justifyContent:"space-between",alignItems:"center"}}><Typography component="h2" variant="h6">Rapid Drops / Top Losers</Typography><IconButton aria-label="Close Rapid Drops full view" onClick={()=>setFull(false)}><CloseRoundedIcon/></IconButton></Stack>
        <Box sx={theme=>({...scannerScrollStyles(theme),minHeight:0})}>{tabs(true)}{contents(true)}</Box>
      </Stack>
    </Drawer>
  </>;
}
