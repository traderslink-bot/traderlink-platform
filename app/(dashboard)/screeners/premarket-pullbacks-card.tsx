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
import Typography from "@mui/material/Typography";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Fragment, useState } from "react";
import { DashboardPanel } from "@/app/dashboard-template";
import type { PremarketPullbackResults, PremarketPullbackRow } from "@/src/modules/scanner/live/contracts";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";

const money=new Intl.NumberFormat("en-US",{maximumFractionDigits:4});
const number=new Intl.NumberFormat("en-US",{maximumFractionDigits:2});
const compact=new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1});
const clock=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit",second:"2-digit"});
const price=(value:number)=>`$${money.format(value)}`;
const shares=(value:number|null)=>value===null?"n/a":compact.format(value);

function PullbackTable({rows,full,onOpenChart}:{rows:readonly PremarketPullbackRow[];full:boolean;onOpenChart:(row:PremarketPullbackRow)=>void}){
  const [expanded,setExpanded]=useState<string|null>(null);
  return <TableContainer role="region" aria-label="Premarket high pullback list" tabIndex={0} sx={theme=>({...scannerScrollStyles(theme),maxHeight:full?"calc(100dvh - 150px)":420})}>
    <Table size="small" stickyHeader aria-label="Premarket high pullback stocks" sx={{tableLayout:"fixed",minWidth:570,'& td, & th':{px:0.45,py:0.45,fontSize:"0.68rem",fontWeight:500},'& th':{fontWeight:650}}}>
      <TableHead><TableRow><TableCell sx={{width:20}} aria-label="Expand"/><TableCell>Ticker</TableCell><TableCell>Price</TableCell><TableCell>Back to PM high</TableCell>
        <TableCell>PM high</TableCell><TableCell>Below PM high</TableCell><TableCell>PM volume</TableCell>
      </TableRow></TableHead>
      <TableBody>{rows.map(row=>{const open=expanded===row.symbol,toggle=()=>setExpanded(value=>value===row.symbol?null:row.symbol);
        const metrics:[string,string][]=open?[["Premarket high",price(row.premarketHigh)],["Below PM high",`${number.format(row.belowHighPercent)}%`],
          ["Back to PM high",`+${number.format(row.backToHighPercent)}%`],["Premarket volume",shares(row.premarketVolume)],
          ["Session volume",shares(row.sessionVolume)],["1min volume",shares(row.oneMinuteVolume)],["5min volume",shares(row.fiveMinuteVolume)],
          ["Float",shares(row.float)],["Spread",row.spreadPercent===null?"n/a":`${number.format(row.spreadPercent)}%`],
          ["Quote received",`${clock.format(new Date(row.receivedAtUtc))} ET`]]:[];
        return <Fragment key={row.symbol}><TableRow hover tabIndex={0} aria-expanded={open} onClick={toggle}
          onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();toggle();}}}
          sx={{cursor:"pointer",'&:focus-visible':{outline:"2px solid",outlineColor:"primary.main",outlineOffset:-2}}}>
          <TableCell aria-hidden>{open?"−":"+"}</TableCell><TableCell sx={{color:"warning.main",fontWeight:850}}>{row.symbol}</TableCell>
          <TableCell>{price(row.price)}</TableCell><TableCell sx={{fontWeight:750}}>+{number.format(row.backToHighPercent)}%</TableCell>
          <TableCell>{price(row.premarketHigh)}</TableCell><TableCell>{number.format(row.belowHighPercent)}%</TableCell><TableCell>{shares(row.premarketVolume)}</TableCell>
        </TableRow>{open?<TableRow><TableCell colSpan={7} sx={{bgcolor:"action.hover"}}>
          <Box sx={{display:"grid",gridTemplateColumns:{xs:"repeat(2,minmax(0,1fr))",md:full?"repeat(4,minmax(0,1fr))":"repeat(2,minmax(0,1fr))"},gap:1.5,py:1}}>
            {metrics.map(([label,value])=><Box key={label}><Typography variant="caption" color="warning.main" sx={{display:"block",fontWeight:750}}>{label}</Typography><Typography variant="body2" sx={{fontWeight:700}}>{value}</Typography></Box>)}
          </Box><Stack direction="row" sx={{gap:1,flexWrap:"wrap",justifyContent:"space-between",alignItems:"center"}}>
            <Stack direction="row" spacing={1}>{row.news.slice(0,3).map(item=>item.url?<Link key={item.id} href={item.url} target="_blank" rel="noreferrer" title={item.headline}>{item.typeLabel}</Link>:null)}</Stack>
            <Button size="small" aria-label={`Open ${row.symbol} chart`} onClick={()=>onOpenChart(row)}>View Chart</Button>
          </Stack>
        </TableCell></TableRow>:null}</Fragment>;
      })}</TableBody>
    </Table>
  </TableContainer>;
}

export function PremarketPullbacksCard({results,notice,onOpenChart}:{results:PremarketPullbackResults|undefined;notice:string|null;onOpenChart:(row:PremarketPullbackRow)=>void}){
  const [full,setFull]=useState(false);
  const contents=(wide:boolean)=><Stack spacing={1}>
    <Typography variant="caption" color="text.secondary">Sorted by percentage back to the premarket high</Typography>
    {results&&!results.controls.enabled?<Alert severity="info">Disabled</Alert>:notice?<Alert severity="info">{notice}</Alert>:!results?<Skeleton height={260}/>
      :results.rows.length?<PullbackTable rows={results.rows} full={wide} onOpenChart={onOpenChart}/>:<Alert severity="info">No stocks currently qualify for this list.</Alert>}
  </Stack>;
  return <><DashboardPanel hideHeader><Stack direction="row" sx={{alignItems:"flex-start",justifyContent:"space-between",mb:1.25,minHeight:22}}><Typography component="h2" variant="h2">Premarket High Pullbacks</Typography><IconButton size="small" aria-label="Open Premarket High Pullbacks full view" title="Open full view" onClick={()=>setFull(true)}><OpenInFullRoundedIcon sx={{fontSize:18}}/></IconButton></Stack>{contents(false)}</DashboardPanel>
    <Drawer anchor="right" open={full} onClose={()=>setFull(false)} slotProps={{paper:{role:"dialog","aria-label":"Premarket High Pullbacks full view","aria-modal":true,sx:{width:{xs:"100vw",md:"85vw"}}}}}>
      <Stack spacing={1} sx={{p:2,height:"100dvh",minHeight:0}}><Stack direction="row" sx={{justifyContent:"space-between",alignItems:"center"}}><Typography component="h2" variant="h6">Premarket High Pullbacks</Typography><IconButton aria-label="Close Premarket High Pullbacks full view" onClick={()=>setFull(false)}><CloseRoundedIcon/></IconButton></Stack>
        <Box sx={theme=>({...scannerScrollStyles(theme),minHeight:0})}>{contents(true)}</Box></Stack>
    </Drawer></>;
}
