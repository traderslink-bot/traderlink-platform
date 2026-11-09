"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import type { LiveScannerRow, ScannerKind } from "@/src/modules/scanner/live/contracts";

import { ScannerCountryFlag } from "./scanner-country-flag";

type Metric = readonly [label: string, value: string];
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const prices = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const shares = (n: number | null | undefined) => n == null ? "—" : compact.format(n);
const percent = (n: number | null | undefined) => n == null ? "—" : `${whole.format(n)}%`;
const multiple = (n: number | null | undefined) => n == null ? "—" : `${decimal.format(n)}×`;

function Reading({ metric: [label, value] }: { metric: Metric }) {
  return <Box component="div" sx={{ minWidth: 0 }}>
    <Typography component="dt" sx={{ color: "text.secondary", fontSize: "0.5rem", lineHeight: 1.15, whiteSpace: "nowrap" }}>{label}</Typography>
    <Typography component="dd" sx={{ m: 0, fontSize: "0.62rem", fontWeight: 650, lineHeight: 1.3, whiteSpace: "nowrap" }}>{value}</Typography>
  </Box>;
}

/** Alternative composition over the same rows: no new scanner or provider request. */
export function ScannerStockCards({ rows, screen, renderTools, renderHalt }: {
  rows: readonly LiveScannerRow[];
  screen: ScannerKind;
  renderTools: (row: LiveScannerRow, expanded: boolean, toggle: () => void) => ReactNode;
  renderHalt: (symbol: string) => ReactNode;
}) {
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  return <Box role="list" aria-label={`${screen === "gainers" ? "Top Gainers" : "Momentum"} stock cards`}
    sx={{ minWidth: 0, minHeight: 0, maxHeight: 420, overflowY: "auto", overflowX: "hidden", flex: "1 1 auto" }}>
    {rows.map(row => {
      const expanded = expandedSymbol === row.symbol;
      const top: Metric[] = [["Price", `$${prices.format(row.price)}`], [screen === "gainers" ? "Gain %" : "Day %", percent(row.sessionGain)],
        ...(screen === "gainers" ? [["Vol", shares(row.volume)], ["Float", shares(row.float)]] as Metric[]
          : [["Float", shares(row.float)], ["Spread", percent(row.spreadPercent)]] as Metric[])];
      const bottom: Metric[] = screen === "gainers"
        ? [["T/O", row.volume != null && row.float != null && row.float > 0 ? percent(100 * row.volume / row.float) : "—"],
          ["RVOL", multiple(row.relativeVolume)], ["HOD", percent(row.offHighPercent)]]
        : [["1min %", percent(row.activity.oneMinuteGain)], ["5min %", percent(row.activity.fiveMinuteGain)],
          ["1min Vol", shares(row.activity.oneMinuteVolume)], ["5min Vol", shares(row.activity.fiveMinuteVolume)],
          ["1min ↑", multiple(row.activity.volumeAcceleration)], ["5min ↑", multiple(row.activity.fiveMinuteVolumeSpike)]];
      return <Box role="listitem" key={row.symbol} data-scanner-stock-card={row.symbol}
        sx={{ border: 1, borderColor: "divider", borderRadius: 0, mb: 0.5, px: 0.5, py: 0.5, minWidth: 0, bgcolor: "background.paper" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "68px 38px repeat(4,minmax(0,1fr))", gap: 0.25, alignItems: "center", minWidth: 0 }}>
          {renderTools(row, expanded, () => setExpandedSymbol(current => current === row.symbol ? null : row.symbol))}
          <Box sx={{ minWidth: 0 }}><Typography component="span" title={row.symbol} sx={{ color: "warning.main", fontSize: "0.68rem", fontWeight: 800, whiteSpace: "nowrap" }}>{row.symbol}</Typography>{renderHalt(row.symbol)}{screen==="gainers"?<Box sx={{lineHeight:1.1,fontSize:"0.65rem"}}><ScannerCountryFlag country={row.country}/></Box>:null}</Box>
          <Box component="dl" sx={{ display: "contents", m: 0 }}>{top.map(metric => <Reading key={metric[0]} metric={metric}/>)}</Box>
        </Box>
        <Box component="dl" sx={{ m: 0, mt: 0.5, display: "grid", gridTemplateColumns: `repeat(${bottom.length},minmax(0,1fr))`, gap: 0.5 }}>
          {bottom.map(metric => <Reading key={metric[0]} metric={metric}/>)}
        </Box>
        {expanded ? <Box sx={{ borderTop: 1, borderColor: "divider", mt: 0.5, pt: 0.5 }}>
          {screen === "momentum" && row.momentumSignals?.length ? <Typography sx={{ fontSize: "0.6rem", color: "text.secondary" }}>{row.momentumSignals.map(signal => ({volume_ignition:"Volume ignition",building_volume:"Building volume",price_burst:"Price burst",developing_activity:"Developing activity",one_minute_momentum:"1min momentum",five_minute_momentum:"5min momentum"})[signal]).join(" · ")}</Typography> : null}
          <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 0.5, m: 0 }}>
            {([["HOD price", `$${prices.format(row.dayHigh)}`], ["Session low", `$${prices.format(row.dayLow)}`], ["Session Vol", shares(row.volume)]] as Metric[]).map(metric => <Reading key={metric[0]} metric={metric}/>)}
          </Box>
        </Box> : null}
      </Box>;
    })}
  </Box>;
}
