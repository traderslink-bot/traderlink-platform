"use client";

import BarChartRounded from "@mui/icons-material/BarChartRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import NewspaperOutlined from "@mui/icons-material/NewspaperOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useLayoutEffect, useRef } from "react";
import { METRICS, SESSIONS, screenRules, signalChoices, type Candidate, type Definition, type Metric, type RunResult } from "@/src/modules/stock-screeners/contracts";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });
const marketTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
});
const liveTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short",
});

export function displayValue(metric: Metric, value: number | undefined) {
  if (value === undefined) return "—";
  const choices = signalChoices(metric);
  if (choices) return choices[value] ?? "—";
  const { unit } = METRICS[metric];
  if (unit === "price") return "$" + value.toLocaleString("en-US", { minimumFractionDigits: value < 1 ? 4 : 2, maximumFractionDigits: 4 });
  if (unit === "money") return "$" + compact.format(value);
  if (unit === "percent") return (value > 0 ? "+" : "") + number.format(value) + "%";
  if (unit === "bps") return number.format(value) + " bps";
  if (unit === "ratio") return number.format(value) + "×";
  if (unit === "hours") return number.format(value) + " h";
  return Math.abs(value) >= 1_000 ? compact.format(value) : number.format(value);
}

export function exactValue(metric: Metric, value: number) {
  const choices = signalChoices(metric);
  if (choices) return choices[value] ?? "—";
  const { unit } = METRICS[metric];
  return (unit === "price" || unit === "money" ? "$" : "") + String(value)
    + (unit === "percent" ? "%" : unit === "bps" ? " bps" : unit === "ratio" ? "×" : unit === "hours" ? " h" : "");
}

export function displayTime(value: number) {
  return marketTime.format(value);
}

function LiveResultTime({ label, value }: { label: string; value?: number }) {
  return <Typography variant="body2" color="text.secondary" title="Latest update in the selected universe and exchanges">
    {label} · {value === undefined ? "Time unavailable"
      : <time dateTime={new Date(value).toISOString()} title={displayTime(value)}>{liveTime.format(value)}</time>}
  </Typography>;
}

export type Inspect = (row: Candidate, kind: "match" | "chart" | "news") => void;

function Identity({ row, inspect }: { row: Candidate; inspect: Inspect }) {
  return <Box sx={{ minWidth: 75 }}>
    <Button size="small" variant="text" onClick={() => inspect(row, "match")} sx={{
      minWidth: 44, minHeight: 27, px: 0, py: 0, justifyContent: "flex-start", color: theme => theme.palette.mode === "dark" ? "#ffb373" : "#9d4500",
      fontWeight: 750, fontSize: "0.86rem", lineHeight: 1.25,
      "@media (pointer: coarse)": { minHeight: 44 },
    }}>{row.symbol}</Button>
    <Typography variant="caption" component="div" color="text.secondary" noWrap title={row.name ?? row.exchange}
      sx={{ maxWidth: 150, lineHeight: 1.25 }}>{row.name ? row.name + " · " + row.exchange : row.exchange}</Typography>
  </Box>;
}

function Actions({ row, inspect }: { row: Candidate; inspect: Inspect }) {
  const actions = [
    { id: "chart", label: "Chart", icon: <BarChartRounded fontSize="small" /> },
    { id: "news", label: "News", icon: <NewspaperOutlined fontSize="small" /> },
    { id: "match", label: "Why it matched", icon: <InfoOutlined fontSize="small" /> },
  ] as const;
  return <Box sx={{ display: "flex", gap: 0.25, justifyContent: "flex-end" }}>
    {actions.map(action => <Tooltip key={action.id} title={action.label}>
      <IconButton aria-label={action.label + " for " + row.symbol} size="small" onClick={() => inspect(row, action.id)}
        sx={{ width: { xs: 44, sm: 34 }, height: { xs: 44, sm: 34 }, color: action.id === "chart" ? "success.main" : "text.secondary" }}>{action.icon}</IconButton>
    </Tooltip>)}
  </Box>;
}

function Value({ row, metric }: { row: Candidate; metric: Metric }) {
  const value = row.values[metric];
  const direction = signalChoices(metric) !== undefined || ["change", "openGap", "week", "month", "quarter", "halfYear", "year", "ytd", "dist20", "dist50", "dist200", "vwapDistance"].includes(metric);
  const color = !direction || value === undefined || value === 0 ? "text.primary" : value > 0 ? "success.main" : "error.main";
  return <Typography component="span" variant="body2" color={value === undefined ? "text.secondary" : color}
    title={value === undefined ? "Unavailable for this result" : exactValue(metric, value)}
    sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{displayValue(metric, value)}</Typography>;
}

export function StockScreenerResults({ result, definition, busy, inspect, onSort, onPage }: {
  result: RunResult; definition: Definition; busy: boolean; inspect: Inspect;
  onSort: (metric: Metric | "ticker") => void; onPage: (page: number) => void;
}) {
  const scrollRegion = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (scrollRegion.current) scrollRegion.current.scrollTop = 0;
  }, [result.id, result.page, definition.sort.metric, definition.sort.dir, definition.sort.secondary?.metric, definition.sort.secondary?.dir]);

  const metrics = definition.columns, first = metrics.slice(0, 2), next = metrics.slice(2);
  const extendedHours = result.session === "premarket" || result.session === "after_hours";
  const visibleGroups = new Set([...metrics, ...screenRules(definition).map(rule => rule.metric)].map(metric => METRICS[metric].group));
  const regularOnly = [
    ...(visibleGroups.has("Opening range") ? ["opening ranges"] : []),
    ...(visibleGroups.has("Regular session") ? ["gap fills and premarket-high breaks"] : []),
  ];
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const emptyState = result.eligible === 0
    ? { title: "No stocks in this selection", detail: "Check your ticker list or choose a different exchange." }
    : result.evaluated === 0
      ? { title: "No stocks could be evaluated", detail: "Try a different session or remove a filter that requires unavailable data." }
      : { title: "No stocks matched", detail: "Change a filter and run again." };
  function header(metric: Metric | "ticker") {
    const on = definition.sort.metric === metric;
    const secondary = definition.sort.secondary?.metric === metric ? definition.sort.secondary : undefined;
    return <TableCell key={metric} sortDirection={on ? definition.sort.dir : false} align={metric === "ticker" ? "left" : "right"}
      sx={metric === "ticker" ? { position: "sticky", left: 0, zIndex: 3, bgcolor: "background.paper" } : undefined}>
      <TableSortLabel active={on || !!secondary} direction={on ? definition.sort.dir : secondary?.dir ?? "asc"} onClick={() => onSort(metric)}
        disabled={busy || (metric === "pressReleaseAge" && !result.pressReleases?.available)}
        sx={{ whiteSpace: "nowrap" }}>{metric === "ticker" ? "Ticker" : METRICS[metric].label}
        {secondary && <Box component="span" sx={{ ml: 0.5, fontSize: "0.72rem" }} aria-label="Secondary sort">2</Box>}
      </TableSortLabel>
    </TableCell>;
  }
  return <>
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", my: 0.8 }}>
      <Typography variant="body2" role="status" aria-live="polite">
        <strong>{result.total.toLocaleString()} {result.total === 1 ? "match" : "matches"}</strong>
        {" · "}{result.evaluated.toLocaleString()} of {result.eligible.toLocaleString()} evaluated
        {result.unavailable > 0 && " · " + result.unavailable.toLocaleString() + " unavailable"}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2, rowGap: 0.25 }}>
        <Typography variant="body2" color="text.secondary" title={"Listing directory as of " + result.universeDate + " · Snapshot prepared " + displayTime(result.capturedAt)}>
          {SESSIONS[result.session]}{result.closed && result.session === "after_hours" ? " snapshot" : " · Snapshot"}
          {" · "}<time dateTime={new Date(result.asOf).toISOString()}>{displayTime(result.asOf)}</time> · {result.source}
        </Typography>
        {result.live && <>
          <LiveResultTime label="Latest live price" value={result.live.priceAt} />
          <LiveResultTime label="Latest live VWAP" value={result.live.vwapAt} />
        </>}
      </Box>
    </Box>
    {result.partial && <Typography role="status" color="warning.main" variant="body2" sx={{ mb: 0.75 }}>
      {result.snapshotFallback ? "The latest snapshot is unavailable. Showing the last available data."
        : "Some data is missing or older."}
    </Typography>}
    {extendedHours && regularOnly.length > 0 && <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
      Choose Regular or Last completed regular to use {regularOnly.join(", ")}.
    </Typography>}
    {result.pressReleases ? <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
      {result.pressReleases.available
        ? (result.source === "Preview data" ? "Example press releases" : "Confirmed releases in the TraderLink feed") + " · Checked " + displayTime(result.pressReleases.checkedAt)
        : "Recent press releases are unavailable for this run."}
    </Typography> : metrics.includes("pressReleaseAge") && <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
      Refresh results to load press release ages.
    </Typography>}
    {result.missingTickers.length > 0 && <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, overflowWrap: "anywhere" }}>
      Outside the available universe: {result.missingTickers.join(", ")}
    </Typography>}
    {!result.rows.length ? <Box sx={{ p: 2, border: 1, borderColor: "divider" }}>
      <Typography sx={{ fontWeight: 650 }}>{emptyState.title}</Typography>
      <Typography variant="body2" color="text.secondary">{emptyState.detail}</Typography>
    </Box> : definition.view === "table" ? <TableContainer ref={scrollRegion} role="region" aria-label="Stock results" tabIndex={0}
      sx={{ maxHeight: { xs: 565, lg: 655 }, border: 1, borderColor: "divider" }}>
      <Table stickyHeader size="small" aria-label="Stock results table" sx={{ "& td, & th": { px: 1.2 }, minWidth: 535 }}>
        <TableHead><TableRow>{header("ticker")}{metrics.map(header)}<TableCell align="right">Actions</TableCell></TableRow></TableHead>
        <TableBody>{result.rows.map(row => <TableRow hover key={row.symbol}>
          <TableCell component="th" scope="row" sx={{ position: "sticky", left: 0, zIndex: 1, bgcolor: "background.paper" }}><Identity row={row} inspect={inspect} /></TableCell>
          {metrics.map(metric => <TableCell key={metric} align="right"><Value row={row} metric={metric} /></TableCell>)}
          <TableCell align="right"><Actions row={row} inspect={inspect} /></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </TableContainer> : <Box ref={scrollRegion} role="list" aria-label="Stock results" tabIndex={0} sx={{
      display: "grid", gridTemplateColumns: definition.view === "cards" ? "repeat(auto-fit,minmax(min(100%,230px),1fr))" : "1fr",
      gap: definition.view === "cards" ? 1 : 0.5, maxHeight: { xs: 565, lg: 655 }, overflow: "auto",
    }}>{result.rows.map(row => <Box key={row.symbol} role="listitem" sx={{ border: 1, borderColor: "divider", p: 0.8, minWidth: 0 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
        <Identity row={row} inspect={inspect} />
        {definition.view === "two" && <Box sx={{ display: "flex", gap: 1.2 }}>
          {first.map(metric => <Box key={metric}><Typography variant="caption" component="div" color="text.secondary">{METRICS[metric].label}</Typography><Value row={row} metric={metric} /></Box>)}
        </Box>}
        <Actions row={row} inspect={inspect} />
      </Box>
      <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", mt: 0.65 }}>
        {(definition.view === "two" ? next : metrics).map(metric => <Box key={metric}>
          <Typography variant="caption" color="text.secondary" component="div">{METRICS[metric].label}</Typography><Value row={row} metric={metric} />
        </Box>)}
      </Box>
    </Box>)}</Box>}
    {pages > 1 && <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-end" }}>
      <Button variant="outlined" size="small" disabled={busy || result.page <= 1} onClick={() => onPage(result.page - 1)}>Previous</Button>
      <Typography variant="body2" aria-live="polite">Page {result.page} of {pages}</Typography>
      <Button variant="outlined" size="small" disabled={busy || result.page >= pages} onClick={() => onPage(result.page + 1)}>Next</Button>
    </Box>}
  </>;
}
