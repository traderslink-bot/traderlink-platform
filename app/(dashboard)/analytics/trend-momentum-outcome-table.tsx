"use client";

import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { ReactNode } from "react";
import type { summarizeIndicatorRecords } from "@/src/lib/trade-candle-analysis/trend-momentum-analytics";
import { AnalyzerHelpTooltip } from "./analyzer-help-tooltip";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";

export function TrendMomentumOutcomeTable({ rows, money, basisLabel }: {
  rows: readonly { key: string; label: ReactNode; summary: ReturnType<typeof summarizeIndicatorRecords> }[];
  money: (value: string | null) => string; basisLabel: "Gross" | "Net";
}) {
  const percent = (value: number | null) => value === null ? "Unavailable" : `${value.toFixed(1)}%`;
  const columns = [
    ["Indicator condition", "Conditions known at the selected execution type. A trade can appear in several descriptive groups when its executions differ; do not add groups together."],
    ["Trades", "Distinct user-defined trades, counted once within this group."],
    ["Executions", "Executions in this group. Several may belong to one trade."],
    ["Known P/L", `Trades with known completed ${basisLabel} P/L. Unavailable P/L is not treated as zero.`],
    ["Wins / losses / breakeven", `Completed ${basisLabel} trade outcomes above, below or equal to zero.`],
    ["Win rate", "Winning trades divided by all trades with known P/L, including breakeven trades."],
    [`Total ${basisLabel} P/L`, "Completed whole-trade P/L summed once per trade within this group."],
    [`Average ${basisLabel} P/L`, "Mean completed whole-trade P/L among the known outcomes."],
    [`Median ${basisLabel} P/L`, "The middle known outcome, or average of the middle two. It is less affected by an unusually large result than the mean."],
    [`Average ${basisLabel} return`, "Mean of each trade's P/L divided by its total entry value. Each trade has equal weight. The count shows trades with a known return."],
  ];
  return <HorizontalScrollRegion label="Scroll to compare indicator outcomes" minTableWidth={1250}><Table size="small"><TableHead><TableRow>
    {columns.map(([label, help]) => <TableCell key={label}><Stack component="span" direction="row" sx={{ alignItems: "center" }}>{label}<AnalyzerHelpTooltip label={label} text={help} /></Stack></TableCell>)}
  </TableRow></TableHead><TableBody>{rows.map(({ key, label, summary: result }) => <TableRow key={key}>
    <TableCell>{label}</TableCell><TableCell>{result.tradeCount}</TableCell><TableCell>{result.occurrenceCount}</TableCell><TableCell>{result.pnlTradeCount}</TableCell>
    <TableCell>{result.wins} / {result.losses} / {result.breakevens}</TableCell><TableCell>{percent(result.winRatePercent)}</TableCell>
    <TableCell>{money(result.totalPnlDecimal)}</TableCell><TableCell>{money(result.averagePnlDecimal)}</TableCell><TableCell>{money(result.medianPnlDecimal)}</TableCell>
    <TableCell>{percent(result.averageReturnPercent)} ({result.returnTradeCount} trades)</TableCell>
  </TableRow>)}</TableBody></Table></HorizontalScrollRegion>;
}
