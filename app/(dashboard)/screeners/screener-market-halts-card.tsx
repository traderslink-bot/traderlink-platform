"use client";

import ButtonBase from "@mui/material/ButtonBase";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import CandlestickChartRoundedIcon from "@mui/icons-material/CandlestickChartRounded";
import { useEffect, useState } from "react";

import { DashboardPanel } from "@/app/dashboard-template";
import type { MarketHaltDashboardReadModel } from "@/src/modules/news/contracts/market-halt-dashboard-contracts";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";

const REFRESH_MS = 60_000;

function shortTime(value: string | null): string {
  if (!value) return "—";
  const [hour = "", minute = ""] = value.split(":");
  return hour && minute ? `${hour}:${minute}` : value;
}

export function ScreenerMarketHaltsCard({ onOpenChart }: { onOpenChart: (row: { symbol: string; exchange: string | null }) => void }) {
  const [model, setModel] = useState<MarketHaltDashboardReadModel | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/market-halts/current", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw Error("market_halts_unavailable");
        setModel(await response.json() as MarketHaltDashboardReadModel);
        setUnavailable(false);
      } catch {
        if (!controller.signal.aborted) setUnavailable(true);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(() => void load(), REFRESH_MS);
      }
    };
    void load();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return <DashboardPanel title="Halts">
    {!model && !unavailable ? <Skeleton height={120} variant="rounded" /> : null}
    {unavailable && !model ? <Typography color="text.secondary" variant="body2">Halt data is temporarily unavailable.</Typography> : null}
    {model && !model.rows.length ? <Typography color="text.secondary" variant="body2">No qualifying Nasdaq or NYSE halts today.</Typography> : null}
    {model?.rows.length ? <TableContainer aria-label="Halt alerts list" role="region" tabIndex={0}
      sx={theme=>({...scannerScrollStyles(theme),height:420,maxHeight:420,overflow:"auto"})}>
      <Table aria-label="Market halt events" size="small" stickyHeader sx={{tableLayout:"fixed",width:"100%",
        '& .MuiTableCell-root':{fontSize:"0.68rem",fontWeight:500,px:0.45,py:0.45},
        '& .MuiTableCell-head':{color:"text.secondary",fontSize:"0.6rem",fontWeight:750,lineHeight:1,pb:0.7,whiteSpace:"nowrap"}}}>
        <TableHead><TableRow><TableCell aria-label="Chart" sx={{width:26}}/><TableCell sx={{width:"20%"}}>Ticker</TableCell><TableCell sx={{width:"17%"}}>Reason</TableCell>
          <TableCell sx={{width:"25%"}}>Quote</TableCell><TableCell sx={{width:"30%"}}>Trade Resume</TableCell></TableRow></TableHead>
        <TableBody>{model.rows.map((halt) => <TableRow hover key={halt.id}>
          <TableCell sx={{px:"0.125rem !important"}}><ButtonBase aria-label={`Open ${halt.ticker} chart`} onClick={()=>onOpenChart({symbol:halt.ticker,exchange:halt.market})}
            sx={{alignItems:"center",bgcolor:"rgba(46,125,50,0.13)",borderRadius:0.75,color:"success.main",height:20,justifyContent:"center",minWidth:20,
              '&:hover':{bgcolor:"rgba(46,125,50,0.23)"},'&:focus-visible':{outline:"2px solid",outlineColor:"success.main",outlineOffset:1}}}>
            <CandlestickChartRoundedIcon sx={{fontSize:"0.9rem"}}/>
          </ButtonBase></TableCell>
          <TableCell><Link href={halt.sourceUrl} rel="noreferrer" target="_blank" sx={{color:"warning.main",fontSize:"0.68rem",fontWeight:850,textDecoration:"none"}}>{halt.ticker}</Link>
            <Typography color="text.secondary" sx={{fontSize:"0.6rem",lineHeight:1.2}}>{shortTime(halt.haltTimeEt)} ET</Typography></TableCell>
          <TableCell title={halt.reason}>{halt.reasonCode}</TableCell>
          <TableCell>{halt.quoteTimeEt ? `${shortTime(halt.quoteTimeEt)} ET` : "—"}</TableCell>
          <TableCell sx={{color:halt.tradeTimeEt?"success.main":"text.secondary",fontWeight:halt.tradeTimeEt?750:500}}>{halt.tradeTimeEt ? `${shortTime(halt.tradeTimeEt)} ET` : "—"}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </TableContainer> : null}
  </DashboardPanel>;
}
