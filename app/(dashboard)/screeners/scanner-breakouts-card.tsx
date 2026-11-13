"use client";

import { Fragment, useState } from "react";
import { Box, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { DashboardPanel } from "@/app/dashboard-template";
import type { BreakoutRow, ScannerActiveHalt } from "@/src/modules/scanner/live/contracts";
import { scannerScrollStyles, scannerStickyTickerSx } from "@/src/modules/scanner/live/scroll-styles";
import { ScannerChartLaunchControls } from "./scanner-chart-launch-controls";
import { ScannerCountryFlag } from "./scanner-country-flag";
import { scannerGainColor } from "./scanner-gain-color";
import { ScannerRowNews } from "./scanner-news-drawer-context";
import { ScannerStockCards, ScannerViewSettings, type ScannerView } from "./scanner-stock-cards";
import { ScreenerHaltIndicator } from "./screener-halt-indicator";

const price = new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:4});
const shares = new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1});
const stateText = { above:"Above", at:"At level", below:"Back below" };
export function BreakoutStatus({row}:{row:BreakoutRow}) {
  return <Typography component="span" variant="inherit" sx={{color:scannerGainColor(row.price-row.breakoutLevel)}}>
    {stateText[row.breakoutState]}
  </Typography>;
}

export function ScannerBreakoutsCard({ rows, now, notice, haltByTicker, onOpenChart }: {
  rows?: readonly BreakoutRow[]; now:number; notice:string|null;
  haltByTicker:ReadonlyMap<string,ScannerActiveHalt>; onOpenChart:(row:BreakoutRow)=>void;
}) {
  const [view,setView]=useState<ScannerView>("table");
  const twoRows=view==="two-rows";
  const tools=(row:BreakoutRow)=><Stack component="span" direction="row" sx={{alignItems:"center",gap:0.65}}>
    <ScannerChartLaunchControls row={row} onOpenChart={onOpenChart}/><ScannerRowNews news={row.news}/>
  </Stack>;
  const halt=(symbol:string)=><ScreenerHaltIndicator halt={haltByTicker.get(symbol)}/>;
  return <DashboardPanel hideHeader>
    <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",gap:0.5,mb:0.5}}>
      <Typography component="h2" variant="h2">Breakouts</Typography>
      <ScannerViewSettings label="Breakouts" view={view} onViewChange={setView}/>
    </Stack>
    {notice ? <Typography variant="body2" color="text.secondary">{notice}</Typography> :
      !rows ? <Skeleton height={160}/> :
      rows.length===0 ? <Typography variant="body2" color="text.secondary">No premarket high breaks yet.</Typography> :
      view==="cards" ? <ScannerStockCards screen="breakouts" rows={rows} now={now} renderHalt={halt} renderTools={tools}
        renderSignal={row=><>PM high {price.format(row.breakoutLevel)} · <BreakoutStatus row={row}/></>}/> :
      <TableContainer sx={theme=>({...scannerScrollStyles(theme),maxHeight:420})}>
        <Table size="small" stickyHeader aria-label="Breakouts" sx={{
          ...scannerStickyTickerSx,
          "& .MuiTableCell-root":{px:0.5,py:0.5,fontSize:"0.72rem",whiteSpace:"nowrap"},
        }}>
          <TableHead><TableRow>
            {!twoRows&&<TableCell/>}<TableCell data-scanner-sticky-ticker>Ticker</TableCell><TableCell>Price</TableCell>
            <TableCell>PM high</TableCell><TableCell>Status</TableCell><TableCell>Vol</TableCell><TableCell>Float</TableCell>
            {!twoRows&&<TableCell>Country</TableCell>}
          </TableRow></TableHead>
          <TableBody>{rows.map(row=><Fragment key={row.symbol}>
            <TableRow hover>
              {!twoRows&&<TableCell>{tools(row)}</TableCell>}
              <TableCell data-scanner-sticky-ticker><Box component="span" sx={{color:"warning.main",fontWeight:800}}>{row.symbol}</Box>{halt(row.symbol)}</TableCell>
              <TableCell sx={{color:scannerGainColor(row.sessionGain)}}>{price.format(row.price)}</TableCell>
              <TableCell>{price.format(row.breakoutLevel)}</TableCell><TableCell><BreakoutStatus row={row}/></TableCell>
              <TableCell>{row.volume===null?"—":shares.format(row.volume)}</TableCell>
              <TableCell>{row.float===null?"—":shares.format(row.float)}</TableCell>
              {!twoRows&&<TableCell><ScannerCountryFlag country={row.country}/></TableCell>}
            </TableRow>
            {twoRows&&<TableRow><TableCell data-scanner-sticky-ticker><ScannerCountryFlag country={row.country}/></TableCell><TableCell colSpan={5}>{tools(row)}</TableCell></TableRow>}
          </Fragment>)}</TableBody>
        </Table>
      </TableContainer>}
  </DashboardPanel>;
}
