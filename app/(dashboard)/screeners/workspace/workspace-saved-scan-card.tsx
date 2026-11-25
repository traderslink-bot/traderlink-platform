"use client";

import { type WorkspaceSavedRow, type WorkspaceSavedEntry, workspacePrice } from "./broker-workspace-data";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import { DashboardPanel } from "@/app/dashboard-template";
import { CLOSED_SCAN_MESSAGE, isEventScanMetric, isSignedScanMetric, SCAN_METRICS,
  type ScanResultColumn } from "@/src/modules/scanner/custom/definition";
import { scannerScrollStyles, scannerStickyTickerSx } from "@/src/modules/scanner/live/scroll-styles";
import { ScannerChartLaunchControls } from "../scanner-chart-launch-controls";
import type { ScannerChartTarget } from "../scanner-chart-workspace";
import { ScannerCountryFlag } from "../scanner-country-flag";
import { scannerGainColor } from "../scanner-gain-color";
import { scannerPrice } from "../scanner-price";
import { ScannerPageTicker } from "./scanner-page-ticker";
import { ScannerRowTools } from "./scanner-row-tools";
import { savedScanRowNews, ScannerStockCards, ScannerViewSettings, WorkspaceVolumeHeaders, WorkspaceVolumeCells, useWorkspaceVolumeColumns, type ScannerView } from "./scanner-stock-cards";
import { WorkspaceScannerCardHeader, workspaceScannerTableHeaderSx, WorkspaceScannerTitle } from "./workspace-scanner-title";

const compact = new Intl.NumberFormat("en-US", {notation: "compact", maximumFractionDigits: 1});
const decimal = new Intl.NumberFormat("en-US", {maximumFractionDigits: 1, signDisplay: "exceptZero"});
const shares = (value: number | null) => value === null ? "—" : compact.format(value);
const compactDollars = (value: number | null) => value === null ? "—" : "$" + compact.format(value);
const columnNumber = new Intl.NumberFormat("en-US", {notation:"compact", maximumFractionDigits:2});
const multiple = new Intl.NumberFormat("en-US", {maximumFractionDigits:2});
const signedPercent = new Intl.NumberFormat("en-US", {style:"percent", maximumFractionDigits:2, signDisplay:"exceptZero"});
const unsignedPercent = new Intl.NumberFormat("en-US", {style:"percent", maximumFractionDigits:2});
const eventTime = new Intl.DateTimeFormat("en-US", {
  timeZone:"America/New_York", month:"short", day:"numeric", hour:"numeric", minute:"2-digit",
});
const columnKey = ({metric,index}: ScanResultColumn) => `${metric}:${index ?? "sort"}`;

function savedScanColumnValue({metric,index,cross}: ScanResultColumn, row: WorkspaceSavedRow) {
  const value = index === undefined ? row.sortValue : row.matches[index];
  if (value == null || !Number.isFinite(value)) return "—";
  if (cross || isEventScanMetric(metric)) return Number.isFinite(new Date(value).getTime()) ? eventTime.format(value) : "—";

  const signed = isSignedScanMetric(metric) || metric === "rollingMove";
  const unit = SCAN_METRICS[metric].unit;
  const direction = metric === "belowHigh" ? -value
    : (metric === "customEma" || (signed && metric !== "bollingerPercentB")) ? value : null;
  const text = metric === "customEma" ? signedPercent.format(value/100)
    : unit === "percent" ? (signed ? signedPercent : unsignedPercent).format(value/100)
    : unit === "multiple" ? multiple.format(value) + "×"
    : unit === "money" ? (metric === "rollingDollarVolume" ? "$" + columnNumber.format(value) : scannerPrice(value))
    : columnNumber.format(value);
  return direction === null ? text : <Box component="span" sx={{color:scannerGainColor(direction)}}>{text}</Box>;
}
const dayChange = (value: number | null) => value === null ? "—" : `${decimal.format(value)}%`;
const halted = <PauseRoundedIcon role="img" aria-label="Trading halted" color="error" sx={{fontSize: 14}}/>;

export function WorkspaceSavedScanCard({ label, entry, unavailable, retrying, view, onViewChange, now, onOpenChart }: {
  label: string;
  entry?: WorkspaceSavedEntry;
  unavailable: boolean;
  retrying: boolean;
  view: ScannerView;
  onViewChange: (view: ScannerView) => void;
  now: number;
  onOpenChart: (target: ScannerChartTarget) => void;
}) {
  const result = entry?.state === "ready" ? entry.result : undefined;
  const columns = entry?.state === "ready" ? entry.columns : undefined;
  const message = unavailable || entry?.state === "unavailable" ? "Choose another scan for this card."
    : retrying ? "Reconnecting to saved scans…"
    : result?.status === "closed" ? CLOSED_SCAN_MESSAGE
    : result?.status === "unavailable" ? "Scanner data is temporarily unavailable."
    : !result || result.status === "waiting" ? "Waiting for scanner data…"
    : result.rows.length ? null
    : result.incomplete > 0 ? "Some stocks need more data before this scan can check them."
    : "No stocks currently qualify for this scan.";
  const tools = (row: WorkspaceSavedRow) => <ScannerRowTools symbol={row.symbol} news={savedScanRowNews(row)} showPageChartOnMobile
    chart={<ScannerChartLaunchControls row={{symbol:row.symbol, exchange:row.exchange}} onOpenChart={onOpenChart}/>}/>;
  const twoRows = view === "two-rows";
  const volumeColumns = useWorkspaceVolumeColumns();
  return <DashboardPanel hideHeader>
    <WorkspaceScannerCardHeader>
      <WorkspaceScannerTitle/>
      <ScannerViewSettings label={label} view={view} onViewChange={onViewChange}/>
    </WorkspaceScannerCardHeader>
    {message || !result ? <Alert severity={retrying ? "warning" : "info"}>{message}</Alert> :
      view === "cards" ? <ScannerStockCards rows={result.rows} screen="saved" now={now} renderTools={tools}
        additionalStats={columns?.length ? row => columns.map(column => [column.label,savedScanColumnValue(column,row)]) : undefined}
        renderHalt={symbol=>result.rows.some(row=>row.symbol===symbol && row.halted)?halted:null}/>
      : <TableContainer tabIndex={0} role="region" aria-label="Saved scan results"
        sx={theme=>({...scannerScrollStyles(theme), flex:1, minHeight:0, maxHeight:420})}>
        <Table size="small" stickyHeader sx={{...scannerStickyTickerSx,
          "& .MuiTableCell-root":{px:0.5, py:0.3, whiteSpace:"nowrap", fontSize:"0.68rem", fontVariantNumeric:"tabular-nums"},
          "& .MuiTableCell-head":workspaceScannerTableHeaderSx,
        }}>
          <TableHead><TableRow>
            <TableCell data-scanner-sticky-ticker scope="col">Ticker</TableCell>
            <TableCell scope="col" aria-label="Chart and news"/>
            {!twoRows && <><TableCell scope="col" align="right">Price</TableCell><TableCell scope="col" align="right">Day %</TableCell></>}
            <WorkspaceVolumeHeaders columns={volumeColumns}/>
            <TableCell scope="col" align="right">Dollar vol</TableCell>
            <TableCell scope="col" align="right">Float</TableCell>
            <TableCell scope="col" align="right">Market cap</TableCell>
            {columns?.map(column=><TableCell key={columnKey(column)} scope="col" align="right">{column.label}</TableCell>)}
          </TableRow></TableHead>
          <TableBody>{result.rows.map(row=>{
            const change = scannerGainColor(row.dayChange);
            return <TableRow key={row.symbol}>
              <TableCell data-scanner-sticky-ticker>
                <Stack direction={twoRows ? "column" : "row"} sx={{alignItems:twoRows ? "flex-start" : "center", gap:0.4}}>
                  <Stack direction="row" sx={{alignItems:"center", gap:0.4}}>
                    <ScannerPageTicker symbol={row.symbol}/>
                    {row.halted && halted}
                  </Stack>
                  <ScannerCountryFlag country={row.country}/>
                </Stack>
              </TableCell>
              <TableCell>{tools(row)}{twoRows && <Stack direction="row" spacing={0.5} sx={{color:change}}>
                <span>{workspacePrice(row.price)}</span><span>{dayChange(row.dayChange)}</span>
              </Stack>}</TableCell>
              {!twoRows && <><TableCell align="right" sx={{color:change}}>{workspacePrice(row.price)}</TableCell>
                <TableCell align="right" sx={{color:change}}>{dayChange(row.dayChange)}</TableCell></>}
              <WorkspaceVolumeCells row={row} columns={volumeColumns}/>
              <TableCell align="right">{compactDollars(row.dollarVolume)}</TableCell>
              <TableCell align="right">{shares(row.float)}</TableCell>
              <TableCell align="right">{compactDollars(row.marketCap)}</TableCell>
              {columns?.map(column=><TableCell key={columnKey(column)} align="right">{savedScanColumnValue(column,row)}</TableCell>)}
            </TableRow>;
          })}</TableBody>
        </Table>
      </TableContainer>}
  </DashboardPanel>;
}
