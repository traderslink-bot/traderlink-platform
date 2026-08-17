"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import { HorizontalScrollHint } from "../horizontal-scroll-region";

export type MonthlyPnlChartRow = Readonly<{ key: string; label: string; value: number; display: string }>;

function rangeFor(rows: readonly MonthlyPnlChartRow[]) {
  const min = Math.min(0, ...rows.map((row) => row.value));
  const max = Math.max(0, ...rows.map((row) => row.value));
  const padding = Math.max((max - min) * 0.12, 1);
  return { min: min - padding, max: max + padding };
}

function Graph({ rows }: { rows: readonly MonthlyPnlChartRow[] }) {
  if (rows.length === 0) return <Typography color="text.secondary" sx={{ py: 7 }}>No monthly results are available yet.</Typography>;
  const range = rangeFor(rows);
  const width = Math.max(720, rows.length * 72);
  const height = 184;
  const y = (value: number) => 20 + ((range.max - value) / (range.max - range.min)) * height;
  const baseline = y(0);
  const step = (width - 58) / rows.length;
  const barWidth = Math.min(46, Math.max(26, step - 12));
  return <><HorizontalScrollHint label="Swipe sideways to see the full chart" /><Box sx={{ WebkitOverflowScrolling: "touch", "&::-webkit-scrollbar": { display: "none" }, mt: 0.5, overflowX: "auto", overscrollBehaviorX: "contain", scrollbarWidth: "none" }}><Box component="svg" sx={{ display: "block", height: 264, minWidth: width, width: "100%" }} viewBox={`0 0 ${width} 264`}><line stroke="#d9e1ec" strokeWidth="1" x1="32" x2={width - 18} y1={baseline} y2={baseline} />{rows.map((row, index) => { const barX = 34 + index * step + (step - barWidth) / 2; const valueY = y(row.value); return <g key={row.key}><title>{`${row.label}: ${row.display}`}</title><rect fill={row.value < 0 ? "#c62828" : "#00796b"} height={Math.max(3, Math.abs(valueY - baseline))} rx="4" width={barWidth} x={barX} y={row.value >= 0 ? valueY : baseline} /><text fill="#627083" fontSize="11" textAnchor="middle" x={barX + barWidth / 2} y="238">{row.label}</text><text fill={row.value < 0 ? "#c62828" : "#00796b"} fontSize="11" fontWeight="700" textAnchor="middle" x={barX + barWidth / 2} y={row.value >= 0 ? Math.max(14, valueY - 7) : Math.min(219, valueY + 16)}>{row.display}</text></g>; })}</Box></Box></>;
}

export function MonthlyPnlChart({ rows }: { rows: readonly MonthlyPnlChartRow[] }) {
  const years = useMemo(() => [...new Set(rows.map((row) => row.key.slice(0, 4)))].sort(), [rows]);
  const [year, setYear] = useState("all");
  const displayedRows = year === "all" ? rows : rows.filter((row) => row.key.startsWith(`${year}-`));
  return <Paper sx={{ overflow: "hidden", p: { xs: 1.5, sm: 2.5 } }} variant="outlined"><Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "baseline" }, justifyContent: "space-between" }}><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Monthly P/L</Typography><TextField label="Year" onChange={(event) => setYear(event.target.value)} select size="small" sx={{ minWidth: 130 }} value={year}><MenuItem value="all">All years</MenuItem>{years.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField></Stack><Graph rows={displayedRows} /></Paper>;
}
