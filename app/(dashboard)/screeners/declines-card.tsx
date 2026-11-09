"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
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
import { ScannerChartLaunchControls, useSideCardChartControls } from "./scanner-chart-launch-controls";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Fragment, useState } from "react";
import { DashboardPanel } from "@/app/dashboard-template";
import type { DeclineResults, DeclineRow, ScannerActiveHalt, ScannerSession } from "@/src/modules/scanner/live/contracts";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";
import { ScreenerHaltIndicator } from "./screener-halt-indicator";

const wholePercent=new Intl.NumberFormat("en-US",{maximumFractionDigits:0});
const compact=new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1});
const subDollarPrice=new Intl.NumberFormat("en-US",{minimumFractionDigits:3,maximumFractionDigits:3});
const regularPrice=new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const clock=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit",second:"2-digit"});
const price=(value:number)=>`$${(value<1?subDollarPrice:regularPrice).format(value)}`;
const pct=(value:number|null)=>value===null?"n/a":`${value>0?"+":""}${wholePercent.format(value)}%`;
const shares=(value:number|null)=>value===null?"n/a":compact.format(value);
const floatShares=(value:number|null)=>value===null?"—":compact.format(value);
const stamp=(value:string)=>clock.format(new Date(value));

function ChartButton({row,onOpenChart}:{row:DeclineRow;onOpenChart:(row:DeclineRow)=>void}){
  return <ScannerChartLaunchControls row={row} onOpenChart={onOpenChart}/>;
}

function TopLosersTable({rows,full,onOpenChart,haltByTicker}:{rows:readonly DeclineRow[];full:boolean;onOpenChart:(row:DeclineRow)=>void;haltByTicker:ReadonlyMap<string,ScannerActiveHalt>}){
  const allowAdd=useSideCardChartControls();
  const [expanded,setExpanded]=useState<string|null>(null);
  if(!rows.length)return <Alert severity="info">No stocks currently declining in this comparison.</Alert>;
  return <TableContainer role="region" aria-label="Top Losers list" tabIndex={0}
    sx={theme=>({...scannerScrollStyles(theme),containerType:"inline-size",maxHeight:full?"calc(100dvh - 190px)":420})}>
    <Table size="small" stickyHeader aria-label="Top Losers stocks"
      sx={{tableLayout:"fixed",minWidth:370,'& td, & th':{px:0.2,py:0.34,fontSize:"0.68rem",fontWeight:500},'& th':{color:"text.secondary",fontSize:"0.6rem",fontWeight:750,lineHeight:1,pb:0.7,whiteSpace:"nowrap"}}}>
      <TableHead><TableRow><TableCell sx={{width:allowAdd?50:26}} aria-label={allowAdd?"Open or add chart":"Chart"}/><TableCell sx={{width:24}} aria-label="Expand"/>
        <TableCell sx={{width:48}}>Ticker</TableCell><TableCell sx={{width:54}}>Price</TableCell><TableCell sx={{width:48}}>Change</TableCell>
        <TableCell>Vol</TableCell><TableCell>Float</TableCell><TableCell>Spread</TableCell>
      </TableRow></TableHead>
      <TableBody>{rows.map(row=>{const open=expanded===row.symbol;const toggle=()=>setExpanded(value=>value===row.symbol?null:row.symbol);
        const metrics:[string,string][]=open?[["Session volume",shares(row.volume)],["Float",floatShares(row.float)],["Spread",pct(row.spreadPercent)],
          ["Quote received",`${stamp(row.receivedAtUtc)} ET`],["Comparison price",row.comparisonPrice===null?"n/a":price(row.comparisonPrice)]]:[];
        return <Fragment key={row.symbol}>
          <TableRow hover tabIndex={0} aria-expanded={open} onClick={toggle} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();toggle();}}}
            sx={{cursor:"pointer",'&:focus-visible':{outline:"2px solid",outlineColor:"primary.main",outlineOffset:-2}}}>
            <TableCell sx={{px:"0.125rem !important"}}><ChartButton row={row} onOpenChart={onOpenChart}/></TableCell>
            <TableCell aria-hidden sx={{pr:"0 !important",textAlign:"center"}}><Typography component="span" sx={{color:"text.secondary",fontSize:"0.9rem",fontWeight:700,lineHeight:1}}>{open?"−":"+"}</Typography></TableCell>
            <TableCell><Stack direction="row" sx={{alignItems:"center",gap:0.25}}><Typography component="span" sx={{color:"warning.main",font:"inherit",fontWeight:800}}>{row.symbol}</Typography><ScreenerHaltIndicator halt={haltByTicker.get(row.symbol)}/></Stack></TableCell>
            <TableCell>{price(row.price)}</TableCell><TableCell sx={{color:(row.changePercent??0)<0?"error.main":"success.main",fontWeight:750}}>{pct(row.changePercent)}</TableCell>
            <TableCell>{shares(row.volume)}</TableCell>
            <TableCell>{floatShares(row.float)}</TableCell><TableCell>{pct(row.spreadPercent)}</TableCell>
          </TableRow>
          {open?<TableRow><TableCell colSpan={8} sx={{bgcolor:"action.hover",p:"0 !important"}}><Box sx={{boxSizing:"border-box",left:0,p:1,position:"sticky",width:"100cqw"}}>
            <Box sx={{display:"grid",gridTemplateColumns:{xs:"repeat(2,minmax(0,1fr))",md:full?"repeat(4,minmax(0,1fr))":"repeat(2,minmax(0,1fr))"},gap:1.5,py:1}}>
              {metrics.map(([label,value])=><Box key={label}><Typography color="warning.main" sx={{display:"block",fontSize:"0.68rem",fontWeight:750,lineHeight:1,textTransform:"uppercase"}}>{label}</Typography><Typography variant="body2" sx={{fontWeight:700,mt:0.45}}>{value}</Typography></Box>)}
            </Box>
            <Stack direction="row" sx={{gap:1,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
              <Stack direction="row" spacing={1}>{row.news.slice(0,3).map(item=>item.url?<Link key={item.id} href={item.url} target="_blank" rel="noreferrer" title={item.headline}>{item.typeLabel}</Link>:null)}</Stack>
              <Button size="small" onClick={()=>onOpenChart(row)} aria-label={`Open ${row.symbol} chart`}>View Chart</Button>
            </Stack>
            </Box>
          </TableCell></TableRow>:null}
        </Fragment>;
      })}</TableBody>
    </Table>
  </TableContainer>;
}

export function DeclinesCard({results,notice,session,onOpenChart,haltByTicker=new Map()}:{results:DeclineResults|undefined;notice:string|null;session:ScannerSession|null;onOpenChart:(row:DeclineRow)=>void;haltByTicker?:ReadonlyMap<string,ScannerActiveHalt>}){
  const [full,setFull]=useState(false);
  const losersTitle=session==="after_hours"?"Top Losers Post Market":"Top Losers";
  const title=<Stack direction="row" sx={{alignItems:"flex-start",gap:0.6,minWidth:0}}><Typography component="h2" variant="h2">{losersTitle}</Typography>
    <Tooltip title="Top Losers during premarket and regular hours are calculated from yesterday’s regular-session close. During post-market, they are calculated from today’s regular-session close."><IconButton aria-label="Explain Top Losers" size="small" sx={{p:0.2}}><InfoOutlinedIcon sx={{fontSize:15}}/></IconButton></Tooltip>
  </Stack>;
  const contents=(wide:boolean)=><Stack spacing={1}>
    {results&&!results.controls.enabled?<Alert severity="info">Disabled</Alert>:notice?<Alert severity="info">{notice}</Alert>
      :!results?<Skeleton height={260}/>:<TopLosersTable full={wide} rows={results.losers} haltByTicker={haltByTicker} onOpenChart={onOpenChart}/>}
  </Stack>;
  return <>
    <DashboardPanel hideHeader><Stack direction="row" sx={{alignItems:"flex-start",justifyContent:"space-between",mb:1.25,minHeight:22}}>{title}<IconButton size="small" aria-label="Open Top Losers full view" onClick={()=>setFull(true)}><OpenInFullRoundedIcon sx={{fontSize:18}}/></IconButton></Stack>{contents(false)}</DashboardPanel>
    <Drawer anchor="right" open={full} onClose={()=>setFull(false)} slotProps={{paper:{role:"dialog","aria-label":"Top Losers full view","aria-modal":true,sx:{width:{xs:"100vw",md:"85vw"}}}}}>
      <Stack sx={{p:2,minHeight:0,height:"100dvh"}} spacing={1}>
        <Stack direction="row" sx={{justifyContent:"space-between",alignItems:"center"}}><Typography component="h2" variant="h6">{losersTitle}</Typography><IconButton aria-label="Close Top Losers full view" onClick={()=>setFull(false)}><CloseRoundedIcon/></IconButton></Stack>
        <Box sx={theme=>({...scannerScrollStyles(theme),minHeight:0})}>{contents(true)}</Box>
      </Stack>
    </Drawer>
  </>;
}
