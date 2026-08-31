"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { Box, Button, CircularProgress, Drawer, IconButton, MenuItem, Stack, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { TradeExplorerReviewEditor } from "../analytics/trade-explorer/trade-review-editor";
import { ManualExecutionEditDialog } from "../trade-tracker/manual-execution-edit-dialog";
import { financialOutcomeColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import { formatJournalAnalyticsDecimal, formatJournalAnalyticsMoney } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import type { JournalManualTradeEntry } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import { queueManualTradeSubmission, submitManualTradeOnline } from "@/src/modules/platform/client/pwa/manual-trade-outbox";

import { loadWorkspaceTradeLibraryPage } from "./workspace-trade-library-actions";
import type { WorkspaceTradeLibraryModel, WorkspaceTradeLibraryRow } from "./workspace-trade-library";

type TradeStateFilter = "all" | "open" | "swing" | "closed";
type TradeSort = "newest" | "oldest" | "pnl_high" | "pnl_low";
type TradeGroup = "none" | "day" | "ticker";
type ExecutionDetail = Readonly<{ executed_at_utc: string; price_decimal: string | null; quantity_decimal: string; side: "buy" | "sell" }>;

function tradeMoney(row: WorkspaceTradeLibraryRow): string {
  return row.netPnlDecimal === null ? "—" : formatJournalAnalyticsMoney(row.netPnlDecimal, row.tradeCurrency, { showPositiveSign: true });
}

function shortDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`)) : "—";
}

function time(value: string | null): string {
  if (!value) return "—";
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function positiveDecimalInput(value: string): boolean {
  return /^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(value) && /[1-9]/u.test(value);
}

function ActionButton({ children, label, onClick }: Readonly<{ children: ReactNode; label: string; onClick: () => void }>) {
  return <Tooltip title={label}><IconButton aria-label={label} onClick={(event) => { event.stopPropagation(); onClick(); }} size="small" sx={{ color: "text.primary" }}>{children}</IconButton></Tooltip>;
}

function ExecutionDisclosure({ row }: Readonly<{ row: WorkspaceTradeLibraryRow }>) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [executions, setExecutions] = useState<readonly ExecutionDetail[]>([]);
  useEffect(() => {
    let active = true;
    void fetch(`/api/platform/journal/calendar/ticker-details?roundTripIds=${encodeURIComponent(row.roundTripId)}`, { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<Readonly<{ trades?: readonly Readonly<{ executions?: readonly ExecutionDetail[] }>[] }>> : Promise.reject())
      .then((payload) => { if (active) { setExecutions(payload.trades?.[0]?.executions ?? []); setState("ready"); } })
      .catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [row.roundTripId]);
  if (state === "loading") return <Box sx={{ borderTop: 1, borderColor: "divider", px: 2, py: 1 }}><CircularProgress size={18} /></Box>;
  if (state === "error") return <Typography color="error.main" sx={{ borderTop: 1, borderColor: "divider", px: 2, py: 1 }} variant="body2">Executions could not be loaded.</Typography>;
  return <Box sx={{ borderTop: 1, borderColor: "divider", px: 2, py: 1 }}>{executions.map((entry, index) => <Typography key={`${entry.executed_at_utc}:${index}`} variant="body2">{entry.side === "buy" ? "Buy" : "Sell"} {formatJournalAnalyticsDecimal(entry.quantity_decimal)} @ {entry.price_decimal ?? "Not recorded"}</Typography>)}</Box>;
}

function AddTradeDrawer({ accountCurrency, accountTimezone, expectedAccountSelectionRef, offlineScopeRef, onClose, open }: Readonly<{ accountCurrency: string; accountTimezone: string; expectedAccountSelectionRef: string; offlineScopeRef: string; onClose: () => void; open: boolean }>) {
  const today = new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", timeZone: accountTimezone, year: "numeric" }).format(new Date()).replace(/\//gu, "-");
  const makeRow = (id: number) => ({ date: today, fees: "", id, price: "", quantity: "", side: "buy" as const, time: "" });
  const [classification, setClassification] = useState<"day" | "swing">("day");
  const [symbol, setSymbol] = useState("");
  const [rows, setRows] = useState(() => [makeRow(1)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (id: number, key: "date" | "fees" | "price" | "quantity" | "side" | "time", value: string) => setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } as typeof row : row));
  const save = async () => {
    if (!symbol.trim() || rows.some((row) => !row.date || !row.time || !positiveDecimalInput(row.quantity) || !positiveDecimalInput(row.price))) { setError("Enter ticker, date, time, side, shares, and price for every execution."); return; }
    const entries = rows.map((row): JournalManualTradeEntry => Object.freeze({ clientRowRef: `workspace-${row.id}`, feesDecimal: row.fees.trim() || null, localDate: row.date, localTime: `${row.time}:00`, normalizedSymbol: symbol.trim().toUpperCase(), priceDecimal: row.price, quantityDecimal: row.quantity, side: row.side, sourceTimezone: "America/New_York", tradeCurrency: accountCurrency }));
    setSaving(true); setError(null);
    try {
      const submission = Object.freeze({ entries, expectedAccountSelectionRef, idempotencyKey: crypto.randomUUID(), tracker: classification });
      if (!navigator.onLine) await queueManualTradeSubmission({ offlineScopeRef, submission }); else await submitManualTradeOnline(submission);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The trade could not be saved. Your entries are still here."); } finally { setSaving(false); }
  };
  return <Drawer anchor="right" onClose={onClose} open={open} slotProps={{ paper: { sx: { width: { xs: "100vw", md: 580 } } } }}>
    <Stack sx={{ height: "100dvh" }}>
      <Stack direction="row" sx={{ borderBottom: 1, borderColor: "divider", justifyContent: "space-between", p: 2 }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Add trade</Typography>
        <Button onClick={onClose}>Close</Button>
      </Stack>
      <Stack spacing={1.25} sx={{ overflowY: "auto", p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField label="Ticker" onChange={(event) => setSymbol(event.target.value.toUpperCase())} size="small" value={symbol} />
          <TextField label="Trade classification" onChange={(event) => setClassification(event.target.value as "day" | "swing")} select size="small" value={classification}>
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="swing">Swing</MenuItem>
          </TextField>
        </Stack>
        <Typography color="text.secondary" variant="body2">Times use Eastern Time.</Typography>
        <Typography color="text.secondary" variant="body2">Entering the correct execution time keeps your trades in order. Trade Analyzer uses 1-minute candles, so you can enter the time from the matching chart candle when you do not have the broker timestamp.</Typography>
        {rows.map((row, index) => <Box key={row.id} sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, p: 1.25 }}>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontWeight: 750 }} variant="body2">Execution {index + 1}</Typography>
            {rows.length > 1 ? <Button color="inherit" onClick={() => setRows((current) => current.filter((entry) => entry.id !== row.id))} size="small">Remove</Button> : null}
          </Box>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "132px 112px 110px" } }}>
            <TextField label="Date" onChange={(event) => update(row.id, "date", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={row.date} />
            <TextField label="Time" onChange={(event) => update(row.id, "time", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="time" value={row.time} />
            <TextField label="Buy/Sell" onChange={(event) => update(row.id, "side", event.target.value)} select size="small" value={row.side}><MenuItem value="buy">Buy</MenuItem><MenuItem value="sell">Sell</MenuItem></TextField>
            <TextField label="Shares" onChange={(event) => update(row.id, "quantity", event.target.value)} size="small" value={row.quantity} />
            <TextField label="Price" onChange={(event) => update(row.id, "price", event.target.value)} size="small" value={row.price} />
            <TextField label="Fee" onChange={(event) => update(row.id, "fees", event.target.value)} size="small" value={row.fees} />
          </Box>
        </Box>)}
        <Button onClick={() => setRows((current) => [...current, makeRow(Math.max(...current.map((row) => row.id)) + 1)])} sx={{ alignSelf: "flex-start" }}>Add execution</Button>
        {error ? <Typography color="error.main" variant="body2">{error}</Typography> : null}
        <Button disabled={saving} onClick={() => void save()} sx={{ alignSelf: "flex-end" }} variant="contained">{saving ? "Saving…" : "Save"}</Button>
      </Stack>
    </Stack>
  </Drawer>;
}

function SavedTradeDrawer({ expectedAccountSelectionRef, onClose, open, row, startingTab, rows }: Readonly<{ expectedAccountSelectionRef: string; onClose: () => void; open: boolean; row: WorkspaceTradeLibraryRow | null; startingTab: number; rows: readonly WorkspaceTradeLibraryRow[] }>) {
  const router = useRouter(); const [tab, setTab] = useState(startingTab);
  useEffect(() => setTab(startingTab), [row?.roundTripId, startingTab]);
  if (!row) return null;
  const targets = rows.map((trade) => ({ closeLocalDate: trade.date, closedAtUtc: `${trade.date}T00:00:00.000Z`, direction: trade.direction, displayedSymbol: trade.symbol, roundTripId: trade.roundTripId }));
  return <><Drawer anchor="right" onClose={onClose} open={open && tab !== 1} slotProps={{ paper: { sx: { width: { xs: "100vw", md: 620 } } } }}><Stack sx={{ height: "100dvh" }}><Box sx={{ borderBottom: 1, borderColor: "divider", p: 2 }}><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography component="h2" variant="h6">{row.symbol}</Typography><Button onClick={onClose}>Close</Button></Stack><Tabs onChange={(_event, next) => setTab(next)} value={tab} variant="fullWidth"><Tab label="Trade" /><Tab label="Journal" /><Tab label="Analyzer" /></Tabs></Box><Box sx={{ overflowY: "auto", p: 2 }}>{tab === 0 ? <Stack spacing={1}><Typography color={financialOutcomeColor(row.netPnlDecimal)} variant="h5">{tradeMoney(row)}</Typography><ExecutionDisclosure row={row} />{row.editableExecutions.map((execution) => <Stack direction="row" key={execution.editRef} sx={{ justifyContent: "space-between" }}><Typography variant="body2">{execution.localDate} · {execution.side === "buy" ? "Buy" : "Sell"} {execution.quantity}</Typography><ManualExecutionEditDialog execution={{ manualEdit: { deleteRef: execution.deleteRef, editRef: execution.editRef, fees: execution.fees, localDate: execution.localDate, localTime: execution.localTime, sourcePrice: execution.price, sourceTimezone: execution.sourceTimezone, tradeCurrency: execution.tradeCurrency }, price: execution.price, quantity: execution.quantity, side: execution.side, symbol: row.symbol }} expectedAccountSelectionRef={expectedAccountSelectionRef} /></Stack>)}</Stack> : null}{tab === 2 ? <Button onClick={() => router.push("/analytics/trade-analyzer/day/trades")} variant="outlined">Open Trade Analyzer</Button> : null}</Box></Stack></Drawer><TradeExplorerReviewEditor expectedAccountSelectionRef={expectedAccountSelectionRef} onClose={() => setTab(0)} onSelectTrade={() => undefined} open={open && tab === 1} selectedRoundTripId={row.roundTripId} showTagSelectionCount={false} showTradeNavigation={false} trades={targets} /></>;
}

export function WorkspaceTradeLibrary({ accountCurrency, accountTimezone, expectedAccountSelectionRef, offlineScopeRef, trades }: Readonly<{ accountCurrency: string; accountTimezone: string; expectedAccountSelectionRef: string; offlineScopeRef: string; trades: WorkspaceTradeLibraryModel }>) {
  const router = useRouter(); const [model, setModel] = useState(trades); const [addOpen, setAddOpen] = useState(false); const [expanded, setExpanded] = useState<string | null>(null); const [detail, setDetail] = useState<WorkspaceTradeLibraryRow | null>(null); const [detailTab, setDetailTab] = useState(0); const [ticker, setTicker] = useState(""); const [filter, setFilter] = useState<TradeStateFilter>("all"); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [sort, setSort] = useState<TradeSort>("newest"); const [group, setGroup] = useState<TradeGroup>("none"); const [followDashboardPeriod, setFollowDashboardPeriod] = useState(true); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const query = (afterCursor: string | null) => ({ afterCursor, endDate: endDate || null, filter, followDashboardPeriod, group, searchTicker: ticker, sort, startDate: startDate || null }) as const;
  const load = async (afterCursor: string | null, append: boolean) => { setLoading(true); const result = await loadWorkspaceTradeLibraryPage(query(afterCursor)); if (result.ok) { setModel((current) => append ? { ...result.model, rows: [...current.rows, ...result.model.rows] } : result.model); setError(null); } else setError(result.message); setLoading(false); };
  useEffect(() => { const handle = window.setTimeout(() => { void load(null, false); }, 180); return () => window.clearTimeout(handle); }, [ticker, filter, startDate, endDate, sort, group, followDashboardPeriod]);
  const grouped = useMemo(() => model.rows.map((row, index) => ({ row, heading: group === "none" ? null : index === 0 || (group === "day" ? model.rows[index - 1]?.date !== row.date : model.rows[index - 1]?.symbol !== row.symbol) ? group === "day" ? shortDate(row.date) : row.symbol : null })), [group, model.rows]);
  const activeFilterCount = Number(Boolean(ticker.trim())) + Number(filter !== "all") + Number(Boolean(startDate)) + Number(Boolean(endDate)) + Number(sort !== "newest") + Number(group !== "none") + Number(!followDashboardPeriod);
  const clear = () => { setTicker(""); setFilter("all"); setStartDate(""); setEndDate(""); setSort("newest"); setGroup("none"); setFollowDashboardPeriod(true); };
  const actionButtons = (row: WorkspaceTradeLibraryRow) => <Stack direction="row" spacing={0.25}><ActionButton label="Review trade" onClick={() => { setDetail(row); setDetailTab(1); }}><FactCheckOutlinedIcon fontSize="small" /></ActionButton><ActionButton label="Edit trade" onClick={() => router.push(`/trade-tracker/${encodeURIComponent(row.date)}`)}><EditRoundedIcon fontSize="small" /></ActionButton>{row.editableExecutions.some((execution) => execution.deleteRef !== null) ? <ActionButton label="Delete execution" onClick={() => { setDetail(row); setDetailTab(0); }}><DeleteOutlineRoundedIcon fontSize="small" /></ActionButton> : null}<ActionButton label="Open Trade Analyzer" onClick={() => { setDetail(row); setDetailTab(2); }}><InsightsRoundedIcon fontSize="small" /></ActionButton></Stack>;
  return <><Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between" }}><Typography component="h2" sx={{ fontWeight: 850 }} variant="h5">Trades</Typography><Button onClick={() => setAddOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Add trade</Button></Stack><Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mt: 1 }}><TextField label="Search ticker" onChange={(event) => setTicker(event.target.value)} size="small" value={ticker} /><TextField label="Filter" onChange={(event) => setFilter(event.target.value as TradeStateFilter)} select size="small" value={filter}><MenuItem value="all">All</MenuItem><MenuItem value="open">Open</MenuItem><MenuItem value="swing">Swing</MenuItem><MenuItem value="closed">Closed</MenuItem></TextField><TextField label="From" onChange={(event) => setStartDate(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={startDate} /><TextField label="To" onChange={(event) => setEndDate(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={endDate} /><TextField label="Sort" onChange={(event) => setSort(event.target.value as TradeSort)} select size="small" value={sort}><MenuItem value="newest">Newest</MenuItem><MenuItem value="oldest">Oldest</MenuItem><MenuItem value="pnl_high">P/L high</MenuItem><MenuItem value="pnl_low">P/L low</MenuItem></TextField><TextField label="Group" onChange={(event) => setGroup(event.target.value as TradeGroup)} select size="small" value={group}><MenuItem value="none">None</MenuItem><MenuItem value="day">Day</MenuItem><MenuItem value="ticker">Ticker</MenuItem></TextField><Typography color="text.secondary" variant="body2">{activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}</Typography><Button onClick={clear}>Clear filters</Button><Button disabled={sort === "newest"} onClick={() => setSort("newest")}>Return to newest</Button><Button onClick={() => setFollowDashboardPeriod((value) => !value)} variant={followDashboardPeriod ? "outlined" : "text"}>Follow dashboard period</Button></Stack>{error ? <Typography color="error.main" variant="body2">{error}</Typography> : null}<Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">{model.totalRowCount} trade{model.totalRowCount === 1 ? "" : "s"}</Typography><Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, mt: 1, overflow: "hidden" }}><Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "86px 68px 52px 88px 70px minmax(260px, 1fr) 92px 136px", gap: 0.75, p: 1, bgcolor: "action.hover" }}>{["Date", "Ticker", "Side", "State", "Shares", "Entry / exit", "P/L", "Actions"].map((label) => <Typography key={label} variant="caption">{label}</Typography>)}</Box>{!model.projectionReady ? <Typography color="text.secondary" sx={{ p: 2 }} variant="body2">Trade list preparation is pending.</Typography> : grouped.map(({ row, heading }) => <Box key={row.roundTripId}>{heading ? <Typography sx={{ bgcolor: "action.hover", fontWeight: 800, px: 1.5, py: 0.5 }} variant="caption">{heading}</Typography> : null}<Box sx={{ borderTop: 1, borderColor: "divider" }}><Box aria-expanded={expanded === row.roundTripId} onClick={() => setExpanded((current) => current === row.roundTripId ? null : row.roundTripId)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setExpanded((current) => current === row.roundTripId ? null : row.roundTripId); } }} role="button" sx={{ alignItems: "center", cursor: "pointer", display: { xs: "none", md: "grid" }, gap: 0.75, gridTemplateColumns: "86px 68px 52px 88px 70px minmax(260px, 1fr) 92px 136px", minHeight: 46, px: 1, py: 0.5 }} tabIndex={0}><Typography variant="body2">{shortDate(row.date)}</Typography><Typography variant="body2">{row.symbol}</Typography><Typography variant="body2">{row.direction === "long" ? "Long" : "Short"}</Typography><Typography variant="body2">{row.status}</Typography><Typography variant="body2">{formatJournalAnalyticsDecimal(row.sharesDecimal)}</Typography><Typography noWrap variant="caption">In {shortDate(row.entryDate)} {time(row.entryTime)} @ {row.entryPriceDecimal ? formatJournalAnalyticsDecimal(row.entryPriceDecimal) : "—"} · Out {shortDate(row.exitDate)} {time(row.exitTime)} @ {row.exitPriceDecimal ? formatJournalAnalyticsDecimal(row.exitPriceDecimal) : "—"} · {row.executionCount} execution{row.executionCount === 1 ? "" : "s"}</Typography><Typography color={financialOutcomeColor(row.netPnlDecimal)} sx={{ fontWeight: 800 }} variant="body2">{tradeMoney(row)}</Typography>{actionButtons(row)}</Box><Box aria-expanded={expanded === row.roundTripId} onClick={() => setExpanded((current) => current === row.roundTripId ? null : row.roundTripId)} role="button" sx={{ cursor: "pointer", display: { md: "none" }, p: 1.25 }} tabIndex={0}><Stack direction="row" sx={{ justifyContent: "space-between" }}><Box><Typography sx={{ fontWeight: 800 }}>{row.symbol}</Typography><Typography variant="caption">{shortDate(row.date)} · {row.status} · {formatJournalAnalyticsDecimal(row.sharesDecimal)} shares</Typography></Box><Typography color={financialOutcomeColor(row.netPnlDecimal)}>{tradeMoney(row)}</Typography></Stack><Box onClick={(event) => event.stopPropagation()}>{actionButtons(row)}</Box></Box>{expanded === row.roundTripId ? <ExecutionDisclosure row={row} /> : null}</Box></Box>)}</Box>{model.continuationCursor ? <Stack sx={{ alignItems: "center", mt: 1 }}><Button disabled={loading} onClick={() => void load(model.continuationCursor, true)} variant="outlined">{loading ? "Loading…" : "Load more"}</Button></Stack> : null}<AddTradeDrawer accountCurrency={accountCurrency} accountTimezone={accountTimezone} expectedAccountSelectionRef={expectedAccountSelectionRef} offlineScopeRef={offlineScopeRef} onClose={() => { setAddOpen(false); router.refresh(); }} open={addOpen} /><SavedTradeDrawer expectedAccountSelectionRef={expectedAccountSelectionRef} onClose={() => setDetail(null)} open={detail !== null} row={detail} rows={model.rows} startingTab={detailTab} /></>;
}
