"use client";

import { scannerPrice as price } from "./scanner-price";

import { ScannerPageTicker } from "./scanner-page-ticker";

import Alert from "@mui/material/Alert";
import { Fragment, useState } from "react";
import { Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { DashboardPanel } from "@/app/dashboard-template";
import type { BreakoutRow, ScannerActiveHalt } from "@/src/modules/scanner/live/contracts";
import { scannerScrollStyles, scannerStickyTickerSx } from "@/src/modules/scanner/live/scroll-styles";
import { ScannerChartLaunchControls } from "./scanner-chart-launch-controls";
import { ScannerCountryFlag } from "./scanner-country-flag";
import { scannerGainColor } from "./scanner-gain-color";
import { ScannerRowNews } from "./scanner-news-drawer-context";
import { SCANNER_VOLUME_LABELS } from "@/src/modules/scanner/live/volume";
import { ScannerStockCards, ScannerViewSettings, useScannerVolumeColumns, type ScannerView } from "./scanner-stock-cards";
import { ScreenerHaltIndicator } from "./screener-halt-indicator";
import { BreakoutStatus } from "./scanner-breakout-status";

const shares = new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1});

export function ScannerBreakoutsCard({ rows, now, notice, haltByTicker, onOpenChart }: {
  rows?: readonly BreakoutRow[]; now:number; notice:string|null;
  haltByTicker:ReadonlyMap<string,ScannerActiveHalt>; onOpenChart:(row:BreakoutRow)=>void;
}) {
  const { selected } = useScannerVolumeColumns("breakouts");
  const volumes = ["dayVolume", ...selected] as const;
  const [view,setView]=useState<ScannerView>("table");
  const twoRows=view==="two-rows";
  const tools=(row:BreakoutRow)=><Stack component="span" direction="row" sx={{alignItems:"center",gap:0.65}}>
    <ScannerChartLaunchControls row={row} onOpenChart={onOpenChart}/><ScannerRowNews news={row.news}/>
  </Stack>;
  const halt=(symbol:string)=><ScreenerHaltIndicator halt={haltByTicker.get(symbol)}/>;
  return <DashboardPanel hideHeader>
    <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",gap:0.5,mb:0.5}}>
      <Typography component="h2" variant="h2">Breakouts</Typography>
      <ScannerViewSettings volumeCard="breakouts" label="Breakouts" view={view} onViewChange={setView}/>
    </Stack>
    {notice ? <Alert severity="info">{notice}</Alert> :
      !rows ? <Skeleton height={160}/> :
      rows.length===0 ? <Alert severity="info">No stocks currently qualify for this list.</Alert> :
      view==="cards" ? <ScannerStockCards screen="breakouts" rows={rows} now={now} renderHalt={halt} renderTools={tools}
        renderSignal={row=><>PM high {price(row.breakoutLevel)} · <BreakoutStatus row={row} now={now}/></>}/> :
      <TableContainer sx={theme=>({...scannerScrollStyles(theme),maxHeight:420})}>
        <Table size="small" stickyHeader aria-label="Breakouts" sx={{
          ...scannerStickyTickerSx,
          "& .MuiTableCell-root":{px:0.5,py:0.5,fontSize:"0.72rem",whiteSpace:"nowrap"},
        }}>
          <TableHead><TableRow>
            {!twoRows&&<TableCell/>}<TableCell data-scanner-sticky-ticker>Ticker</TableCell><TableCell>Price</TableCell>
            <TableCell>PM high</TableCell><TableCell>Status</TableCell>{volumes.map(metric => <TableCell key={metric} sx={{minWidth:metric === "postMarketVolume" ? 82 : 54}}>{SCANNER_VOLUME_LABELS[metric]}</TableCell>)}<TableCell>Float</TableCell>
            {!twoRows&&<TableCell>Country</TableCell>}
          </TableRow></TableHead>
          <TableBody>{rows.map(row=><Fragment key={row.symbol}>
            <TableRow hover>
              {!twoRows&&<TableCell>{tools(row)}</TableCell>}
              <TableCell data-scanner-sticky-ticker><ScannerPageTicker symbol={row.symbol}/>{halt(row.symbol)}</TableCell>
              <TableCell sx={{color:scannerGainColor(row.sessionGain)}}>{price(row.price)}</TableCell>
              <TableCell>{price(row.breakoutLevel)}</TableCell><TableCell><BreakoutStatus row={row} now={now}/></TableCell>
              {volumes.map(metric => <TableCell key={metric}>{row[metric] == null ? "—" : shares.format(row[metric])}</TableCell>)}
              <TableCell>{row.float===null?"—":shares.format(row.float)}</TableCell>
              {!twoRows&&<TableCell><ScannerCountryFlag country={row.country}/></TableCell>}
            </TableRow>
            {twoRows&&<TableRow><TableCell data-scanner-sticky-ticker><ScannerCountryFlag country={row.country}/></TableCell><TableCell colSpan={5 + selected.length}>{tools(row)}</TableCell></TableRow>}
          </Fragment>)}</TableBody>
        </Table>
      </TableContainer>}
  </DashboardPanel>;
}
