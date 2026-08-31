"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, IconButton, MenuItem, Stack, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { TradeExplorerReviewEditor } from "../analytics/trade-explorer/trade-review-editor";
import { financialOutcomeColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import { formatJournalAnalyticsDecimal, formatJournalAnalyticsMoney } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import type { JournalManualTradeEntry } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import { queueManualTradeSubmission, submitManualTradeOnline } from "@/src/modules/platform/client/pwa/manual-trade-outbox";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

import { loadWorkspaceTradeLibraryPage } from "./workspace-trade-library-actions";
import type { WorkspaceTradeLibraryModel, WorkspaceTradeLibraryRow } from "./workspace-trade-library";

type TradeStateFilter = "all" | "open" | "swing" | "closed";
type TradeSort = "newest" | "oldest" | "position" | "buy_quantity" | "entry" | "exit" | "entry_value" | "pnl_high" | "pnl_low";
type TradeGroup = "none" | "day" | "ticker";
function tradeMoney(row: WorkspaceTradeLibraryRow): string {
  return row.gainLossDecimal === null ? "—" : formatJournalAnalyticsMoney(row.gainLossDecimal, row.tradeCurrency, { showPositiveSign: true });
}

function shortDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "—";
}

function positiveDecimalInput(value: string): boolean {
  return /^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(value) && /[1-9]/u.test(value);
}

function ActionButton({ children, desktopOnly = false, label, onClick }: Readonly<{ children: ReactNode; desktopOnly?: boolean; label: string; onClick: () => void }>) {
  return <Tooltip title={label}><IconButton aria-label={label} onClick={(event) => { event.stopPropagation(); onClick(); }} size="small" sx={{ color: "text.primary", display: desktopOnly ? { xs: "none", md: "inline-flex" } : "inline-flex" }}>{children}</IconButton></Tooltip>;
}

function AddTradeDrawer({ accountCurrency, accountTimezone, expectedAccountSelectionRef, offlineScopeRef, onClose, open }: Readonly<{ accountCurrency: string; accountTimezone: string; expectedAccountSelectionRef: string; offlineScopeRef: string; onClose: () => void; open: boolean }>) {
  const today = new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", timeZone: accountTimezone, year: "numeric" }).format(new Date()).replace(/\//gu, "-");
  const makeRow = (id: number) => ({ date: today, fees: "", id, price: "", quantity: "", side: "buy" as const, time: "" });
  const [symbol, setSymbol] = useState("");
  const [tracker, setTracker] = useState<"day" | "swing">("day");
  const [rows, setRows] = useState(() => [makeRow(1)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (id: number, key: "date" | "fees" | "price" | "quantity" | "side" | "time", value: string) => setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } as typeof row : row));
  const save = async () => {
    if (!symbol.trim() || rows.some((row) => !row.date || !row.time || !positiveDecimalInput(row.quantity) || !positiveDecimalInput(row.price))) { setError("Enter ticker, date, time, side, shares, and price for every execution."); return; }
    const entries = rows.map((row): JournalManualTradeEntry => Object.freeze({ clientRowRef: `workspace-${row.id}`, feesDecimal: row.fees.trim() || null, localDate: row.date, localTime: `${row.time}:00`, normalizedSymbol: symbol.trim().toUpperCase(), priceDecimal: row.price, quantityDecimal: row.quantity, side: row.side, sourceTimezone: "America/New_York", tradeCurrency: accountCurrency }));
    setSaving(true); setError(null);
    try {
      const submission = Object.freeze({ entries, expectedAccountSelectionRef, idempotencyKey: crypto.randomUUID(), tracker });
      if (!navigator.onLine) await queueManualTradeSubmission({ offlineScopeRef, submission }); else await submitManualTradeOnline(submission);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The trade could not be saved. Your entries are still here."); } finally { setSaving(false); }
  };
  return <Drawer anchor="right" onClose={onClose} open={open} slotProps={{ paper: { sx: { width: { xs: "100vw", md: 880 } } } }}>
    <Stack sx={{ height: "100dvh" }}>
      <Stack direction="row" sx={{ borderBottom: 1, borderColor: "divider", justifyContent: "space-between", p: 2 }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Add trade</Typography>
        <Button onClick={onClose}>Close</Button>
      </Stack>
      <Stack spacing={1.25} sx={{ overflowY: "auto", p: 2 }}>
        <Stack direction="row" spacing={1}><TextField label="Ticker" onChange={(event) => setSymbol(event.target.value.toUpperCase())} size="small" sx={{ width: { xs: 150, sm: 180 } }} value={symbol} /><TextField label="Day/Swing" onChange={(event) => setTracker(event.target.value as "day" | "swing")} select size="small" sx={{ width: 130 }} value={tracker}><MenuItem value="day">Day</MenuItem><MenuItem value="swing">Swing</MenuItem></TextField></Stack>
        <Typography color="text.secondary" variant="body2">Times use Eastern Time.</Typography>
        <Typography color="text.secondary" variant="body2">Entering the correct execution time keeps your trades in order. Trade Analyzer uses 1-minute candles, so you can enter the time from the matching chart candle when you do not have the broker timestamp.</Typography>
        {rows.map((row, index) => <Box key={row.id} sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2, p: 1.25 }}>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontWeight: 750 }} variant="body2">Execution {index + 1}</Typography>
            {rows.length > 1 ? <Button color="inherit" onClick={() => setRows((current) => current.filter((entry) => entry.id !== row.id))} size="small">Remove</Button> : null}
          </Box>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "132px 112px 110px 96px 104px 88px" } }}>
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
        <Button disabled={saving} onClick={() => void save()} sx={{ alignSelf: "flex-end", bottom: 0, position: "sticky" }} variant="contained">{saving ? "Saving…" : "Save"}</Button>
      </Stack>
    </Stack>
  </Drawer>;
}

function WorkspaceExecutionEditForm({
  execution,
  expectedAccountSelectionRef,
  symbol,
}: Readonly<{
  execution: WorkspaceTradeLibraryRow["editableExecutions"][number];
  expectedAccountSelectionRef: string;
  symbol: string;
}>) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => ({
    date: execution.localDate,
    fees: execution.fees ?? "",
    price: execution.price ?? "",
    quantity: execution.quantity,
    side: execution.side,
    time: execution.localTime,
  }));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = <Field extends keyof typeof draft>(field: Field, value: (typeof draft)[Field]) => setDraft((current) => ({ ...current, [field]: value }));

  async function save(): Promise<void> {
    setSaving(true); setError(null);
    try {
      const response = await fetch(`/api/platform/journal/manual-executions/${execution.editRef}`, {
        body: JSON.stringify({
          expectedAccountSelectionRef,
          feesDecimal: draft.fees.trim() || null,
          idempotencyKey: crypto.randomUUID(),
          localDate: draft.date,
          localTime: draft.time,
          normalizedSymbol: symbol,
          priceDecimal: draft.price,
          quantityDecimal: draft.quantity,
          side: draft.side,
          sourceTimezone: execution.sourceTimezone,
          tradeCurrency: execution.tradeCurrency,
        }),
        headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        method: "POST",
      });
      if (!response.ok) throw new Error("Check the execution details and try again.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The execution could not be updated.");
    } finally { setSaving(false); }
  }

  async function deleteExecution(): Promise<void> {
    if (!execution.deleteRef) return;
    setDeleting(true); setError(null);
    try {
      const response = await fetch(`/api/platform/journal/manual-executions/${execution.deleteRef}`, {
        body: JSON.stringify({ expectedAccountSelectionRef, idempotencyKey: crypto.randomUUID() }),
        headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        method: "DELETE",
      });
      if (!response.ok) throw new Error("The execution could not be deleted. Refresh the page and try again.");
      setDeleteOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The execution could not be deleted. Refresh the page and try again.");
    } finally { setDeleting(false); }
  }

  return <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.25 }}>
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "132px 112px 110px 96px 104px 88px" } }}>
      <TextField label="Date" onChange={(event) => update("date", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={draft.date} />
      <TextField label="Time" onChange={(event) => update("time", event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="time" value={draft.time} />
      <TextField label="Buy/Sell" onChange={(event) => update("side", event.target.value as "buy" | "sell")} select size="small" value={draft.side}><MenuItem value="buy">Buy</MenuItem><MenuItem value="sell">Sell</MenuItem></TextField>
      <TextField label="Shares" onChange={(event) => update("quantity", event.target.value)} size="small" value={draft.quantity} />
      <TextField label="Price" onChange={(event) => update("price", event.target.value)} size="small" value={draft.price} />
      <TextField label="Fee" onChange={(event) => update("fees", event.target.value)} size="small" value={draft.fees} />
    </Box>
    {error ? <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert> : null}
    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 1 }}>
      {execution.deleteRef ? <Button color="error" onClick={() => setDeleteOpen(true)} variant="outlined">Delete execution</Button> : null}
      <Button disabled={saving} onClick={() => void save()} variant="contained">{saving ? "Saving..." : "Save changes"}</Button>
    </Stack>
    <Dialog fullWidth maxWidth="sm" onClose={() => { if (!deleting) setDeleteOpen(false); }} open={deleteOpen}>
      <DialogTitle>Delete this execution?</DialogTitle>
      <DialogContent><Typography>This may change whether the position is open or closed.</Typography></DialogContent>
      <DialogActions><Button disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button color="error" disabled={deleting} onClick={() => void deleteExecution()} variant="contained">{deleting ? "Deleting..." : "Delete execution"}</Button></DialogActions>
    </Dialog>
  </Box>;
}

function SavedTradeDrawer({ expectedAccountSelectionRef, onClose, open, row, startingTab, rows }: Readonly<{ expectedAccountSelectionRef: string; onClose: () => void; open: boolean; row: WorkspaceTradeLibraryRow | null; startingTab: number; rows: readonly WorkspaceTradeLibraryRow[] }>) {
  const router = useRouter(); const [tab, setTab] = useState(startingTab);
  useEffect(() => setTab(startingTab), [row?.roundTripId, startingTab]);
  if (!row) return null;
  const targets = rows.map((trade) => ({ closeLocalDate: trade.date, closedAtUtc: `${trade.date}T00:00:00.000Z`, direction: trade.direction, displayedSymbol: trade.symbol, roundTripId: trade.roundTripId }));
  return <Drawer anchor="right" onClose={onClose} open={open} slotProps={{ paper: { sx: { width: { xs: "100vw", md: 880 } } } }}><Stack sx={{ height: "100dvh" }}><Box sx={{ borderBottom: 1, borderColor: "divider", p: 2 }}><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography component="h2" variant="h6">{row.symbol}</Typography><Button onClick={onClose}>Close</Button></Stack><Tabs onChange={(_event, next) => setTab(next)} value={tab} variant="fullWidth"><Tab label="Trade" /><Tab label="Journal" /><Tab label="Analyzer" /></Tabs></Box><Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: tab === 1 ? 0 : 2 }}>{tab === 0 ? <Stack spacing={1}><Typography color={financialOutcomeColor(row.gainLossDecimal)} variant="h5">{tradeMoney(row)}</Typography>{row.editableExecutions.map((execution) => <WorkspaceExecutionEditForm execution={execution} expectedAccountSelectionRef={expectedAccountSelectionRef} key={execution.editRef} symbol={row.symbol} />)}</Stack> : null}{tab === 1 ? <TradeExplorerReviewEditor embedded expectedAccountSelectionRef={expectedAccountSelectionRef} onClose={() => setTab(0)} onSelectTrade={() => undefined} open selectedRoundTripId={row.roundTripId} showTagSelectionCount={false} showTradeNavigation={false} trades={targets} /> : null}{tab === 2 ? <Button onClick={() => router.push("/analytics/trade-analyzer/day/trades")} variant="outlined">Open Trade Analyzer</Button> : null}</Box></Stack></Drawer>;
}

export function WorkspaceTradeLibrary({ accountCurrency, accountTimezone, addTradeOpen, expectedAccountSelectionRef, offlineScopeRef, onAddTradeClose, trades }: Readonly<{ accountCurrency: string; accountTimezone: string; addTradeOpen: boolean; expectedAccountSelectionRef: string; offlineScopeRef: string; onAddTradeClose: () => void; trades: WorkspaceTradeLibraryModel }>) {
  const [model, setModel] = useState(trades); const [detail, setDetail] = useState<WorkspaceTradeLibraryRow | null>(null); const [detailTab, setDetailTab] = useState(0); const [ticker, setTicker] = useState(trades.query.searchTicker); const [filter, setFilter] = useState<TradeStateFilter>(trades.query.filter); const [startDate, setStartDate] = useState(trades.query.startDate ?? ""); const [endDate, setEndDate] = useState(trades.query.endDate ?? ""); const [sort, setSort] = useState<TradeSort>(trades.query.sort); const [group, setGroup] = useState<TradeGroup>(trades.query.group); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { setModel(trades); setTicker(trades.query.searchTicker); setFilter(trades.query.filter); setStartDate(trades.query.startDate ?? ""); setEndDate(trades.query.endDate ?? ""); setSort(trades.query.sort); setGroup(trades.query.group); }, [trades]);
  const query = (afterCursor: string | null) => ({ afterCursor, endDate: endDate || null, filter, followDashboardPeriod: false, group, searchTicker: ticker, sort, startDate: startDate || null }) as const;
  const load = async (afterCursor: string | null, append: boolean) => { setLoading(true); const result = await loadWorkspaceTradeLibraryPage(query(afterCursor)); if (result.ok) { setModel((current) => append ? { ...result.model, rows: [...current.rows, ...result.model.rows] } : result.model); setError(null); } else setError(result.message); setLoading(false); };
  useEffect(() => { const handle = window.setTimeout(() => { void load(null, false); }, 180); return () => window.clearTimeout(handle); }, [ticker, filter, startDate, endDate, sort, group]);
  const grouped = useMemo(() => model.rows.map((row, index) => ({ row, heading: group === "none" ? null : index === 0 || (group === "day" ? model.rows[index - 1]?.date !== row.date : model.rows[index - 1]?.symbol !== row.symbol) ? group === "day" ? shortDate(row.date) : row.symbol : null })), [group, model.rows]);
  const activeFilterCount = Number(Boolean(ticker.trim())) + Number(filter !== "all") + Number(Boolean(startDate)) + Number(Boolean(endDate)) + Number(sort !== "newest") + Number(group !== "none");
  const actionButtons = (row: WorkspaceTradeLibraryRow) => <Stack direction="row" spacing={0.25}><ActionButton label="Review trade" onClick={() => { setDetail(row); setDetailTab(1); }}><FactCheckOutlinedIcon fontSize="small" /></ActionButton><ActionButton label="Edit trade" onClick={() => { setDetail(row); setDetailTab(0); }}><EditRoundedIcon fontSize="small" /></ActionButton>{row.editableExecutions.some((execution) => execution.deleteRef !== null) ? <ActionButton desktopOnly label="Delete execution" onClick={() => { setDetail(row); setDetailTab(0); }}><DeleteOutlineRoundedIcon fontSize="small" /></ActionButton> : null}<ActionButton label="Open Trade Analyzer" onClick={() => { setDetail(row); setDetailTab(2); }}><InsightsRoundedIcon fontSize="small" /></ActionButton></Stack>;
  const emptyState = model.projectionState === "unavailable"
    ? "Your existing trades are not available in Workspace yet."
    : activeFilterCount > 0 ? "No trades match these filters."
      : "No trades recorded yet.";
  const desktopColumns = "112px 64px 48px 92px 72px 72px 72px 72px 92px 96px 132px";
  return <><Typography component="h2" sx={{ fontWeight: 850 }} variant="h5">Trades</Typography>{error ? <Typography color="error.main" variant="body2">{error}</Typography> : null}<Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">{model.totalRowCount} trade{model.totalRowCount === 1 ? "" : "s"}</Typography><Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, mt: 1, overflow: "hidden" }}><Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: desktopColumns, gap: 0.75, px: 1, py: 0.75, bgcolor: "action.hover" }}>{["Date", "Ticker", "Side", "Status", "Buy QTY", "Position", "Entry", "Exit", "Entry value", "Gain/Loss", "Actions"].map((label) => <Typography key={label} variant="caption">{label}</Typography>)}</Box>{model.projectionState !== "ready" || model.rows.length === 0 ? <Typography color="text.secondary" sx={{ p: 2 }} variant="body2">{emptyState}</Typography> : grouped.map(({ row, heading }) => <Box key={row.roundTripId}>{heading ? <Typography sx={{ bgcolor: "action.hover", fontWeight: 800, px: 1.5, py: 0.5 }} variant="caption">{heading}</Typography> : null}<Box sx={{ borderTop: 1, borderColor: "divider" }}><Box sx={{ alignItems: "center", display: { xs: "none", md: "grid" }, gap: 0.75, gridTemplateColumns: desktopColumns, minHeight: 44, px: 1, py: 0.25 }}><Typography variant="body2">{shortDate(row.date)}</Typography><Typography sx={{ fontWeight: 800 }} variant="body2">{row.symbol}</Typography><Typography variant="body2">{row.direction === "long" ? "Long" : "Short"}</Typography><Typography variant="body2">{row.status}</Typography><Typography variant="body2">{formatJournalAnalyticsDecimal(row.buyQuantityDecimal)}</Typography><Typography variant="body2">{formatJournalAnalyticsDecimal(row.positionDecimal)}</Typography><Typography variant="body2">{row.entryPriceDecimal ? formatJournalAnalyticsDecimal(row.entryPriceDecimal) : "—"}</Typography><Typography variant="body2">{row.exitPriceDecimal ? formatJournalAnalyticsDecimal(row.exitPriceDecimal) : "—"}</Typography><Typography variant="body2">{row.entryValueDecimal ? formatJournalAnalyticsMoney(row.entryValueDecimal, row.tradeCurrency) : "—"}</Typography><Typography color={financialOutcomeColor(row.gainLossDecimal)} sx={{ fontWeight: 800 }} variant="body2">{tradeMoney(row)}</Typography>{actionButtons(row)}</Box><Box sx={{ display: { md: "none" }, p: 1.25 }}><Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}><Box><Typography sx={{ fontWeight: 800 }}>{row.symbol}</Typography><Typography variant="caption">{shortDate(row.date)} · {row.direction === "long" ? "Long" : "Short"} · {row.status}</Typography></Box><Typography color={financialOutcomeColor(row.gainLossDecimal)} sx={{ fontWeight: 800 }}>{tradeMoney(row)}</Typography></Stack><Typography variant="caption">{formatJournalAnalyticsDecimal(row.buyQuantityDecimal)} · {formatJournalAnalyticsDecimal(row.positionDecimal)} · {row.entryPriceDecimal ? formatJournalAnalyticsDecimal(row.entryPriceDecimal) : "—"} · {row.exitPriceDecimal ? formatJournalAnalyticsDecimal(row.exitPriceDecimal) : "—"}</Typography>{actionButtons(row)}</Box></Box></Box>)}</Box>{model.continuationCursor ? <Stack sx={{ alignItems: "center", mt: 1 }}><Button disabled={loading} onClick={() => void load(model.continuationCursor, true)} variant="outlined">{loading ? "Loading…" : "Load more"}</Button></Stack> : null}<AddTradeDrawer accountCurrency={accountCurrency} accountTimezone={accountTimezone} expectedAccountSelectionRef={expectedAccountSelectionRef} offlineScopeRef={offlineScopeRef} onClose={() => { onAddTradeClose(); window.location.reload(); }} open={addTradeOpen} /><SavedTradeDrawer expectedAccountSelectionRef={expectedAccountSelectionRef} onClose={() => setDetail(null)} open={detail !== null} row={detail} rows={model.rows} startingTab={detailTab} /></>;
}
