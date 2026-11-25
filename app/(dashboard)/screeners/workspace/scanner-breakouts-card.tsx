"use client";

import { type WorkspaceBreakout, workspacePrice as price } from "./broker-workspace-data";
import { WorkspaceScannerCardHeader, workspaceScannerTableHeaderSx, WorkspaceScannerTitle } from "./workspace-scanner-title";

import { ScannerPageTicker } from "./scanner-page-ticker";
import { ScannerRowTools } from "./scanner-row-tools";

import Alert from "@mui/material/Alert";
import { Fragment, useState } from "react";
import { Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { DashboardPanel } from "@/app/dashboard-template";
import type { ScannerActiveHalt } from "@/src/modules/scanner/live/contracts";
import { scannerScrollStyles, scannerStickyTickerSx } from "@/src/modules/scanner/live/scroll-styles";
import { ScannerChartLaunchControls } from "../scanner-chart-launch-controls";
import { ScannerCountryFlag } from "../scanner-country-flag";
import { scannerGainColor } from "../scanner-gain-color";
import { ScannerStockCards, ScannerViewSettings, WorkspaceVolumeHeaders, WorkspaceVolumeCells, useWorkspaceVolumeColumns, type ScannerView } from "./scanner-stock-cards";
import { ScreenerHaltIndicator } from "../screener-halt-indicator";
import type { BreakoutRow } from "@/src/modules/scanner/live/contracts";
import { BreakoutStatus } from "../scanner-breakout-status";

const shares = new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1});

export function ScannerBreakoutsCard({ rows, now, notice, haltByTicker, onOpenChart, view: controlledView, onViewChange }: {
  view?: ScannerView; onViewChange?: (view:ScannerView)=>void;
  rows?: readonly WorkspaceBreakout[]; now:number; notice:string|null;
  haltByTicker:ReadonlyMap<string,ScannerActiveHalt>; onOpenChart:(row:WorkspaceBreakout)=>void;
}) {
  const [localView,setLocalView]=useState<ScannerView>("table");
  const view=controlledView??localView;
  const twoRows=view==="two-rows";
  const volumeColumns=useWorkspaceVolumeColumns();
  const tools=(row:WorkspaceBreakout)=><ScannerRowTools symbol={row.symbol} news={row.news} chart={<ScannerChartLaunchControls row={row} onOpenChart={onOpenChart}/>}/>;
  const halt=(symbol:string)=><ScreenerHaltIndicator halt={haltByTicker.get(symbol)}/>;
  return <DashboardPanel hideHeader>
    <WorkspaceScannerCardHeader>
      <WorkspaceScannerTitle><Typography component="h2" variant="h2">Breakouts</Typography></WorkspaceScannerTitle>
      <ScannerViewSettings label="Breakouts" view={view} onViewChange={onViewChange??setLocalView}/>
    </WorkspaceScannerCardHeader>
    {notice ? <Alert severity="info">{notice}</Alert> :
      !rows ? <Skeleton height={160}/> :
      rows.length===0 ? <Alert severity="info">No stocks currently qualify for this list.</Alert> :
      view==="cards" ? <ScannerStockCards screen="breakouts" rows={rows} now={now} renderHalt={halt} renderTools={tools}
        renderSignal={row=><>PM high {price(row.breakoutLevel)} · {row.breakoutLevel==null?"—":<BreakoutStatus row={row as BreakoutRow} now={now}/>}</>}/> :
      <TableContainer sx={theme=>({...scannerScrollStyles(theme),maxHeight:420})}>
        <Table size="small" stickyHeader aria-label="Breakouts" sx={{
          ...scannerStickyTickerSx,
          "& .MuiTableCell-root":{px:0.5,py:0.5,fontSize:"0.72rem",whiteSpace:"nowrap"},
          "& .MuiTableCell-head":workspaceScannerTableHeaderSx,
        }}>
          <TableHead><TableRow>
            {!twoRows&&<TableCell/>}<TableCell data-scanner-sticky-ticker>Ticker</TableCell><TableCell>Price</TableCell>
            <TableCell>PM high</TableCell><TableCell>Status</TableCell><WorkspaceVolumeHeaders columns={volumeColumns}/><TableCell>Float</TableCell>
            {!twoRows&&<TableCell>Country</TableCell>}
          </TableRow></TableHead>
          <TableBody>{rows.map(row=><Fragment key={row.symbol}>
            <TableRow hover>
              {!twoRows&&<TableCell>{tools(row)}</TableCell>}
              <TableCell data-scanner-sticky-ticker><ScannerPageTicker symbol={row.symbol}/>{halt(row.symbol)}</TableCell>
              <TableCell sx={{color:scannerGainColor(row.sessionGain)}}>{price(row.price)}</TableCell>
              <TableCell>{price(row.breakoutLevel)}</TableCell><TableCell>{row.breakoutLevel==null?"—":<BreakoutStatus row={row as BreakoutRow} now={now}/>}</TableCell>
              <WorkspaceVolumeCells row={row} columns={volumeColumns}/>
              <TableCell>{row.float===null?"—":shares.format(row.float)}</TableCell>
              {!twoRows&&<TableCell><ScannerCountryFlag country={row.country}/></TableCell>}
            </TableRow>
            {twoRows&&<TableRow><TableCell data-scanner-sticky-ticker><ScannerCountryFlag country={row.country}/></TableCell><TableCell colSpan={4+volumeColumns.length}>{tools(row)}</TableCell></TableRow>}
          </Fragment>)}</TableBody>
        </Table>
      </TableContainer>}
  </DashboardPanel>;
}
