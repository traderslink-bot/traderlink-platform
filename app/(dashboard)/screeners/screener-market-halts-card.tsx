"use client";

import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
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

export function ScreenerMarketHaltsCard() {
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

  return <DashboardPanel title="Halt Alerts">
    {!model && !unavailable ? <Skeleton height={120} variant="rounded" /> : null}
    {unavailable && !model ? <Typography color="text.secondary" variant="body2">Halt data is temporarily unavailable.</Typography> : null}
    {model && !model.rows.length ? <Typography color="text.secondary" variant="body2">No qualifying Nasdaq or NYSE halts today.</Typography> : null}
    {model?.rows.length ? <TableContainer aria-label="Halt alerts list" role="region" tabIndex={0}
      sx={theme=>({...scannerScrollStyles(theme),height:420,maxHeight:420,overflow:"auto"})}>
      <Table aria-label="Market halt events" size="small" stickyHeader sx={{tableLayout:"fixed",minWidth:430,
        '& .MuiTableCell-root':{fontSize:"0.68rem",fontWeight:500,px:0.45,py:0.45},
        '& .MuiTableCell-head':{color:"text.secondary",fontSize:"0.6rem",fontWeight:750,lineHeight:1,pb:0.7,whiteSpace:"nowrap"}}}>
        <TableHead><TableRow><TableCell sx={{width:82}}>Ticker</TableCell><TableCell sx={{width:70}}>Reason</TableCell>
          <TableCell sx={{width:120}}>Quote Resume</TableCell><TableCell sx={{width:120}}>Trade Resume</TableCell></TableRow></TableHead>
        <TableBody>{model.rows.map((halt) => <TableRow hover key={halt.id}>
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
