"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, IconButton, MenuItem, Stack, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { TradeExplorerReviewEditor } from "../analytics/trade-explorer/trade-review-editor";
import { financialOutcomeColor } from "@/src/modules/journal-analytics/presentation/financial-outcome-color";
import { formatJournalAnalyticsDecimal, formatJournalAnalyticsDuration, formatJournalAnalyticsMoney } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import type { JournalManualTradeEntry } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import { ManualTradeNeedsReviewError, queueManualTradeSubmission, submitManualTradeOnline } from "@/src/modules/platform/client/pwa/manual-trade-outbox";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

import { loadWorkspaceTradeLibraryPage } from "./workspace-trade-library-actions";
import type { WorkspaceTradeLibraryModel, WorkspaceTradeLibraryRow } from "./workspace-trade-library";

type TradeStateFilter = "all" | "open" | "swing" | "closed";
type TradeSort = "newest" | "oldest" | "position" | "buy_quantity" | "entry" | "exit" | "entry_value" | "hold" | "pnl_high" | "pnl_low";
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

function normalizeLeadingDecimal(value: string): string {
  return /^\.(\d+)$/u.test(value) ? `0${value}` : value;
}

function workspaceDateInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: timezone, year: "numeric" }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function manualTradePreviewMessage(code: string | undefined): string {
  if (code === "TRADERLINK_MANUAL_TRADE_SINGLE_DAY_REQUIRED") return "Date";
  if (code === "TRADERLINK_MANUAL_TRADE_RECENT_ENTRY_REQUIRED") return "Date";
  if (code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT") return "The selected account changed. Refresh and try again.";
  if (code === "TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT") return "Review the executions and try again.";
  return "The trade could not be saved. Your entries are still here.";
}

function deleteFailureMessage(code: unknown): string {
  if (code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT") {
    return "The selected account changed. Refresh and try again.";
  }
  if (code === "TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION") {
    return "This execution is no longer available for deletion. Refresh to see its current status.";
  }
  if (code === "TRADERLINK_MANUAL_EXECUTION_EDIT_CONFLICT") {
    return "This execution changed before it could be deleted. Refresh to see its current status.";
  }
  if (code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" || code === "TRADERLINK_ACCOUNT_ACCESS_DENIED") {
    return "Your access changed. Refresh and try again.";
  }
  if (code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED") {
    return "The journal could not validate this deletion. Refresh and try again.";
  }
  if (code === "TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID") {
    return "The delete request could not be verified. Refresh and try again.";
  }
  return "The execution could not be deleted. Refresh the page and try again.";
}

function ActionButton({ children, desktopOnly = false, label, onClick }: Readonly<{ children: ReactNode; desktopOnly?: boolean; label: string; onClick: () => void }>) {
  return <Tooltip title={label}><IconButton aria-label={label} onClick={(event) => { event.stopPropagation(); onClick(); }} size="small" sx={{ color: "text.primary", display: desktopOnly ? { xs: "none", md: "inline-flex" } : "inline-flex" }}>{children}</IconButton></Tooltip>;
}

function AddTradePanel({ accountCurrency, accountTimezone, embedded = false, expectedAccountSelectionRef, fixedSymbol, initialWorkspaceStyle = "day_trade", offlineScopeRef, onClose, onSaved }: Readonly<{ accountCurrency: string; accountTimezone: string; embedded?: boolean; expectedAccountSelectionRef: string; fixedSymbol?: string; initialWorkspaceStyle?: "day_trade" | "swing"; offlineScopeRef: string; onClose: () => void; onSaved?: () => void }>) {
  const today = workspaceDateInTimezone(accountTimezone);
  const makeRow = (id: number) => ({ date: today, fees: "", id, price: "", quantity: "", side: "buy" as const, time: "" });
  const [symbol, setSymbol] = useState(fixedSymbol ?? "");
  const [workspaceStyle, setWorkspaceStyle] = useState<"day_trade" | "swing">(initialWorkspaceStyle);
  const [rows, setRows] = useState(() => [makeRow(1)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const update = (id: number, key: "date" | "fees" | "price" | "quantity" | "side" | "time", value: string) => setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } as typeof row : row));
  const save = async () => {
    const missing = new Set<string>(); if (!symbol.trim()) missing.add("Ticker"); for (const row of rows) { if (!row.date) missing.add("Date"); if (!row.time) missing.add("Time"); if (!row.side) missing.add("Buy/Sell"); if (!positiveDecimalInput(row.quantity)) missing.add("Shares"); if (!positiveDecimalInput(row.price)) missing.add("Price"); } if (missing.size > 0) { setError([...missing].join(", ")); return; }
    const entries = rows.map((row): JournalManualTradeEntry => Object.freeze({ clientRowRef: `workspace-${row.id}`, feesDecimal: row.fees.trim() || null, localDate: row.date, localTime: `${row.time}:00`, normalizedSymbol: symbol.trim().toUpperCase(), priceDecimal: row.price, quantityDecimal: row.quantity, side: row.side, sourceTimezone: accountTimezone, tradeCurrency: accountCurrency }));
    setSaving(true); setError(null);
    try {
      const submission = Object.freeze({ entries, expectedAccountSelectionRef, idempotencyKey: idempotencyKey.current ?? crypto.randomUUID(), tracker: "workspace" as const, workspaceStyle }); idempotencyKey.current = submission.idempotencyKey;
      if (!navigator.onLine) await queueManualTradeSubmission({ offlineScopeRef, submission }); else await submitManualTradeOnline(submission);
      onSaved?.();
      onClose();
    } catch (cause) { setError(cause instanceof ManualTradeNeedsReviewError ? manualTradePreviewMessage(cause.code) : cause instanceof Error ? cause.message : "The trade could not be saved. Your entries are still here."); } finally { setSaving(false); }
  };
  return <Stack sx={{ height: "100%" }}>
      {embedded ? null : <Stack direction="row" sx={{ borderBottom: 1, borderColor: "divider", justifyContent: "space-between", p: 2 }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Add trade</Typography>
        <Button onClick={onClose}>Close</Button>
      </Stack>}
      <Stack spacing={1.25} sx={{ p: embedded ? 0 : 2 }}>
        <Stack direction="row" spacing={1}>{fixedSymbol ? <TextField disabled label="Ticker" size="small" sx={{ width: { xs: 150, sm: 180 } }} value={symbol} /> : <TextField label="Ticker" onChange={(event) => setSymbol(event.target.value.toUpperCase())} size="small" sx={{ width: { xs: 150, sm: 180 } }} value={symbol} />}<TextField label="Day Trade/Swing" onChange={(event) => setWorkspaceStyle(event.target.value as "day_trade" | "swing")} select size="small" sx={{ width: 154 }} value={workspaceStyle}><MenuItem value="day_trade">Day Trade</MenuItem><MenuItem value="swing">Swing</MenuItem></TextField></Stack>
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
            <TextField label="Price" onChange={(event) => update(row.id, "price", normalizeLeadingDecimal(event.target.value))} size="small" value={row.price} />
            <TextField label="Fee" onChange={(event) => update(row.id, "fees", normalizeLeadingDecimal(event.target.value))} size="small" value={row.fees} />
          </Box>
        </Box>)}
        <Button onClick={() => setRows((current) => [...current, makeRow(Math.max(...current.map((row) => row.id)) + 1)])} sx={{ alignSelf: "flex-start" }}>Add execution</Button>
        {error ? <Typography color="error.main" variant="body2">{error}</Typography> : null}
        <Stack direction="row" spacing={1} sx={{ alignSelf: "flex-end" }}><Button disabled={saving} onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={() => void save()} variant="contained">{saving ? "Saving…" : "Save"}</Button></Stack>
      </Stack>
  </Stack>;
}

function WorkspaceExecutionEditForm({
  currentAccountStillMatches,
  execution,
  expectedAccountSelectionRef,
  symbol,
}: Readonly<{
  currentAccountStillMatches: () => Promise<boolean>;
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
    if (!execution.deleteRef || !(await currentAccountStillMatches())) return;
    setDeleting(true); setError(null);
    try {
      const response = await fetch(`/api/platform/journal/manual-executions/${execution.deleteRef}`, {
        body: JSON.stringify({ expectedAccountSelectionRef, idempotencyKey: crypto.randomUUID() }),
        headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        method: "DELETE",
      });
      const result = await response.json().catch(() => null) as Readonly<{ code?: unknown }> | null;
      if (!response.ok) { setError(deleteFailureMessage(result?.code)); return; }
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
      <TextField label="Price" onChange={(event) => update("price", normalizeLeadingDecimal(event.target.value))} size="small" value={draft.price} />
      <TextField label="Fee" onChange={(event) => update("fees", normalizeLeadingDecimal(event.target.value))} size="small" value={draft.fees} />
    </Box>
    {error ? <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert> : null}
    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 1 }}>
      {execution.deleteRef ? <Button color="error" onClick={() => void currentAccountStillMatches().then((matches) => { if (matches) setDeleteOpen(true); })} variant="outlined">Delete execution</Button> : null}
      <Button disabled={saving} onClick={() => void save()} variant="contained">{saving ? "Saving..." : "Save changes"}</Button>
    </Stack>
    <Dialog fullWidth maxWidth="sm" onClose={() => { if (!deleting) setDeleteOpen(false); }} open={deleteOpen}>
      <DialogTitle>Delete this execution?</DialogTitle>
      <DialogContent><Typography>This may change whether the position is open or closed.</Typography></DialogContent>
      <DialogActions><Button disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button color="error" disabled={deleting} onClick={() => void deleteExecution()} variant="contained">{deleting ? "Deleting..." : "Delete execution"}</Button></DialogActions>
    </Dialog>
  </Box>;
}

function SavedTradePanel({ accountCurrency, accountTimezone, currentAccountStillMatches, expectedAccountSelectionRef, offlineScopeRef, onClose, row, startingTab }: Readonly<{ accountCurrency: string; accountTimezone: string; currentAccountStillMatches: () => Promise<boolean>; expectedAccountSelectionRef: string; offlineScopeRef: string; onClose: () => void; row: WorkspaceTradeLibraryRow | null; startingTab: number }>) {
  const router = useRouter(); const [tab, setTab] = useState(startingTab); const [addingExecution, setAddingExecution] = useState(false);
  useEffect(() => setTab(startingTab), [row?.roundTripId, startingTab]);
  if (!row) return null;
  const targets = [{ closeLocalDate: row.exitDate, closedAtUtc: null, direction: row.direction, displayedSymbol: row.symbol, roundTripId: row.roundTripId }];
  return <Stack sx={{ height: "100%" }}><Box sx={{ borderBottom: 1, borderColor: "divider", p: 2 }}><Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography component="h2" variant="h6">{row.symbol}</Typography><Button onClick={onClose}>Close</Button></Stack><Tabs onChange={(_event, next) => setTab(next)} value={tab} variant="fullWidth"><Tab label="Trade" /><Tab label="Journal" /><Tab label="Analyzer" /></Tabs></Box><Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: tab === 1 ? 0 : 2 }}>{tab === 0 ? <Stack spacing={1}><Typography color={financialOutcomeColor(row.gainLossDecimal)} variant="h5">{tradeMoney(row)}</Typography>{row.editableExecutions.map((execution) => <WorkspaceExecutionEditForm currentAccountStillMatches={currentAccountStillMatches} execution={execution} expectedAccountSelectionRef={expectedAccountSelectionRef} key={execution.editRef} symbol={row.symbol} />)}{addingExecution ? <AddTradePanel accountCurrency={accountCurrency} accountTimezone={accountTimezone} embedded expectedAccountSelectionRef={expectedAccountSelectionRef} fixedSymbol={row.symbol} initialWorkspaceStyle={row.tradeStyle === "swing" ? "swing" : "day_trade"} offlineScopeRef={offlineScopeRef} onClose={() => setAddingExecution(false)} onSaved={() => { router.refresh(); onClose(); }} /> : <Button onClick={() => setAddingExecution(true)} sx={{ alignSelf: "flex-start" }}>Add execution</Button>}</Stack> : null}{tab === 1 ? <TradeExplorerReviewEditor embedded expectedAccountSelectionRef={expectedAccountSelectionRef} onClose={() => setTab(0)} onSelectTrade={() => undefined} open selectedRoundTripId={row.roundTripId} showTagSelectionCount={false} showTradeNavigation={false} trades={targets} /> : null}{tab === 2 ? <Button onClick={() => router.push("/analytics/trade-analyzer/day/trades")} variant="outlined">Open Trade Analyzer</Button> : null}</Box></Stack>;
}

export function WorkspaceTradeDrawer({ accountCurrency, accountTimezone, addOpen, currentAccountStillMatches, detail, expectedAccountSelectionRef, offlineScopeRef, onAddTradeSaved, onClose, startingTab }: Readonly<{ accountCurrency: string; accountTimezone: string; addOpen: boolean; currentAccountStillMatches: () => Promise<boolean>; detail: WorkspaceTradeLibraryRow | null; expectedAccountSelectionRef: string; offlineScopeRef: string; onAddTradeSaved?: () => void; onClose: () => void; startingTab: number }>) {
  const open = addOpen || detail !== null;
  if (!open) return null;
  return <Drawer anchor="right" onClose={onClose} open={open} slotProps={{ paper: { sx: { width: { xs: "100vw", md: 880 } } } }}>{addOpen ? <AddTradePanel accountCurrency={accountCurrency} accountTimezone={accountTimezone} expectedAccountSelectionRef={expectedAccountSelectionRef} offlineScopeRef={offlineScopeRef} onClose={onClose} onSaved={onAddTradeSaved} /> : <SavedTradePanel accountCurrency={accountCurrency} accountTimezone={accountTimezone} currentAccountStillMatches={currentAccountStillMatches} expectedAccountSelectionRef={expectedAccountSelectionRef} offlineScopeRef={offlineScopeRef} onClose={onClose} row={detail} startingTab={startingTab} />}</Drawer>;
}

export function WorkspaceTradeLibrary({ accountCurrency, accountTimezone, addTradeOpen, customEndDate, customStartDate, expectedAccountSelectionRef, offlineScopeRef, onAddTradeClose, periodEndDate, periodStartDate, trades }: Readonly<{ accountCurrency: string; accountTimezone: string; addTradeOpen: boolean; customEndDate: string | null; customStartDate: string | null; expectedAccountSelectionRef: string; offlineScopeRef: string; onAddTradeClose: () => void; periodEndDate: string | null; periodStartDate: string | null; trades: WorkspaceTradeLibraryModel }>) {
  const router = useRouter(); const [model, setModel] = useState(trades); const [detail, setDetail] = useState<WorkspaceTradeLibraryRow | null>(null); const [detailTab, setDetailTab] = useState(0); const [ticker, setTicker] = useState(trades.query.searchTicker); const [filter, setFilter] = useState<TradeStateFilter>(trades.query.filter); const [startDate, setStartDate] = useState(customStartDate ?? ""); const [endDate, setEndDate] = useState(customEndDate ?? ""); const [sort, setSort] = useState<TradeSort>(trades.query.sort); const [group, setGroup] = useState<TradeGroup>(trades.query.group); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [tableDelete, setTableDelete] = useState<Readonly<{ deleteRef: string; symbol: string }> | null>(null); const [deletingTableExecution, setDeletingTableExecution] = useState(false); const [tableDeleteError, setTableDeleteError] = useState<string | null>(null);
  useEffect(() => { setModel(trades); setTicker(trades.query.searchTicker); setFilter(trades.query.filter); setStartDate(customStartDate ?? ""); setEndDate(customEndDate ?? ""); setSort(trades.query.sort); setGroup(trades.query.group); }, [customEndDate, customStartDate, trades]);
  const query = (afterCursor: string | null) => { const dates = startDate && endDate ? { endDate, startDate } : { endDate: periodEndDate, startDate: periodStartDate }; return { afterCursor, ...dates, filter, followDashboardPeriod: false, group, searchTicker: ticker, sort } as const; };
  const currentAccountStillMatches = async () => { const result = await loadWorkspaceTradeLibraryPage(query(null)); if (!result.ok || result.accountSelectionRef !== expectedAccountSelectionRef) { setDetail(null); setTableDelete(null); router.refresh(); return false; } return true; };
  const load = async (afterCursor: string | null, append: boolean) => { setLoading(true); const result = await loadWorkspaceTradeLibraryPage(query(afterCursor)); if (result.ok) { if (result.accountSelectionRef !== expectedAccountSelectionRef) { setDetail(null); setTableDelete(null); router.refresh(); } else { setModel((current) => append ? { ...result.model, rows: [...current.rows, ...result.model.rows] } : result.model); setError(null); } } else setError(result.message); setLoading(false); };
  useEffect(() => { const handle = window.setTimeout(() => { void load(null, false); }, 180); return () => window.clearTimeout(handle); }, [ticker, filter, startDate, endDate, sort, group, periodEndDate, periodStartDate]);
  const grouped = useMemo(() => model.rows.map((row, index) => ({ row, heading: group === "none" ? null : index === 0 || (group === "day" ? model.rows[index - 1]?.date !== row.date : model.rows[index - 1]?.symbol !== row.symbol) ? group === "day" ? shortDate(row.date) : row.symbol : null })), [group, model.rows]);
  const activeFilterCount = Number(Boolean(ticker.trim())) + Number(filter !== "all") + Number(Boolean(startDate)) + Number(Boolean(endDate)) + Number(sort !== "newest") + Number(group !== "none");
  const prepareTableDelete = async (row: WorkspaceTradeLibraryRow, deleteRef: string) => { if (!(await currentAccountStillMatches())) return; setTableDelete({ deleteRef, symbol: row.symbol }); setTableDeleteError(null); };
  const actionButtons = (row: WorkspaceTradeLibraryRow) => { const deletable = row.editableExecutions.filter((execution) => execution.deleteRef !== null); const deletion = deletable.length === 1 ? deletable[0]! : null; const deleteRef = deletion?.deleteRef; return <Stack direction="row" spacing={0.25}><ActionButton label="Review trade" onClick={() => { setDetail(row); setDetailTab(1); }}><FactCheckOutlinedIcon fontSize="small" /></ActionButton><ActionButton label="Edit trade" onClick={() => { setDetail(row); setDetailTab(0); }}><EditRoundedIcon fontSize="small" /></ActionButton>{deleteRef ? <ActionButton desktopOnly label="Delete execution" onClick={() => void prepareTableDelete(row, deleteRef)}><DeleteOutlineRoundedIcon fontSize="small" /></ActionButton> : null}<ActionButton label="Open Trade Analyzer" onClick={() => { setDetail(row); setDetailTab(2); }}><InsightsRoundedIcon fontSize="small" /></ActionButton></Stack>; };
  const deleteFromTable = async () => { if (!tableDelete || !(await currentAccountStillMatches())) return; setDeletingTableExecution(true); setTableDeleteError(null); try { const response = await fetch(`/api/platform/journal/manual-executions/${tableDelete.deleteRef}`, { body: JSON.stringify({ expectedAccountSelectionRef, idempotencyKey: crypto.randomUUID() }), headers: { "Content-Type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" }, method: "DELETE" }); const result = await response.json().catch(() => null) as Readonly<{ code?: unknown }> | null; if (!response.ok) { setTableDeleteError(deleteFailureMessage(result?.code)); return; } setTableDelete(null); window.location.reload(); } catch { setTableDeleteError("The execution could not be deleted. Refresh the page and try again."); } finally { setDeletingTableExecution(false); } };
  const emptyState = model.projectionState === "unavailable"
    ? "Your existing trades are not available in Workspace yet."
    : activeFilterCount > 0 ? "No trades match these filters."
      : "No trades recorded yet.";
  const desktopColumns = "minmax(96px, 1fr) minmax(64px, .75fr) minmax(52px, .6fr) minmax(82px, .8fr) minmax(58px, .65fr) minmax(62px, .7fr) minmax(76px, .8fr) minmax(76px, .8fr) minmax(92px, 1fr) minmax(64px, .7fr) minmax(88px, .9fr) 132px";
  return <>{error ? <Typography color="error.main" variant="body2">{error}</Typography> : null}<Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, mt: 1, overflow: "hidden" }}><Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: desktopColumns, gap: 1, px: 1, py: 0.75, bgcolor: "action.hover" }}>{["Date", "Ticker", "Side", "Status", "Shares", "POS", "Entry", "Exit", "Entry value", "Hold", "Gain/Loss", "Actions"].map((label) => <Typography key={label} variant="caption">{label}</Typography>)}</Box>{model.projectionState !== "ready" || model.rows.length === 0 ? <Typography color="text.secondary" sx={{ p: 2 }} variant="body2">{emptyState}</Typography> : grouped.map(({ row, heading }) => <Box key={row.roundTripId}>{heading ? <Typography sx={{ bgcolor: "action.hover", fontWeight: 800, px: 1.5, py: 0.5 }} variant="caption">{heading}</Typography> : null}<Box sx={{ borderTop: 1, borderColor: "divider" }}><Box sx={{ alignItems: "center", display: { xs: "none", md: "grid" }, gap: 1, gridTemplateColumns: desktopColumns, minHeight: 46, px: 1, py: 0.25 }}><Typography variant="body2">{shortDate(row.date)}</Typography><Typography sx={{ fontWeight: 800 }} variant="body2">{row.symbol}</Typography><Typography variant="body2">{row.direction === "long" ? "Long" : "Short"}</Typography><Typography variant="body2">{row.status}</Typography><Typography variant="body2">{formatJournalAnalyticsDecimal(row.buyQuantityDecimal)}</Typography><Typography variant="body2">{formatJournalAnalyticsDecimal(row.positionDecimal)}</Typography><Typography variant="body2">{row.entryPriceDecimal ? formatJournalAnalyticsMoney(row.entryPriceDecimal, row.tradeCurrency) : "—"}</Typography><Typography variant="body2">{row.exitPriceDecimal ? formatJournalAnalyticsMoney(row.exitPriceDecimal, row.tradeCurrency) : "—"}</Typography><Typography variant="body2">{row.entryValueDecimal ? formatJournalAnalyticsMoney(row.entryValueDecimal, row.tradeCurrency) : "—"}</Typography><Typography variant="body2">{row.holdDurationSeconds === null ? "N/A" : formatJournalAnalyticsDuration(row.holdDurationSeconds * 1000)}</Typography><Typography color={financialOutcomeColor(row.gainLossDecimal)} sx={{ fontWeight: 800 }} variant="body2">{tradeMoney(row)}</Typography>{actionButtons(row)}</Box><Box sx={{ display: { md: "none" }, p: 1.25 }}><Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}><Box><Typography sx={{ fontWeight: 800 }}>{row.symbol}</Typography><Typography variant="caption">{shortDate(row.date)} · {row.direction === "long" ? "Long" : "Short"} · {row.status}</Typography></Box><Typography color={financialOutcomeColor(row.gainLossDecimal)} sx={{ fontWeight: 800 }}>{tradeMoney(row)}</Typography></Stack><Stack spacing={0.25}><Typography variant="caption">Shares {formatJournalAnalyticsDecimal(row.buyQuantityDecimal)} · POS {formatJournalAnalyticsDecimal(row.positionDecimal)}</Typography><Typography variant="caption">Entry {row.entryPriceDecimal ? formatJournalAnalyticsMoney(row.entryPriceDecimal, row.tradeCurrency) : "—"} · Exit {row.exitPriceDecimal ? formatJournalAnalyticsMoney(row.exitPriceDecimal, row.tradeCurrency) : "—"}</Typography></Stack>{actionButtons(row)}</Box></Box></Box>)}</Box>{model.continuationCursor ? <Stack sx={{ alignItems: "center", mt: 1 }}><Button disabled={loading} onClick={() => void load(model.continuationCursor, true)} variant="outlined">{loading ? "Loading…" : "Load more"}</Button></Stack> : null}<WorkspaceTradeDrawer accountCurrency={accountCurrency} accountTimezone={accountTimezone} addOpen={addTradeOpen} currentAccountStillMatches={currentAccountStillMatches} detail={detail} expectedAccountSelectionRef={expectedAccountSelectionRef} offlineScopeRef={offlineScopeRef} onClose={() => { if (addTradeOpen) { onAddTradeClose(); window.location.reload(); } else setDetail(null); }} startingTab={detailTab} /><Dialog fullWidth maxWidth="xs" onClose={() => { if (!deletingTableExecution) setTableDelete(null); }} open={tableDelete !== null}><DialogTitle>Delete this execution?</DialogTitle><DialogContent><Typography>This may change whether the position is open or closed.</Typography>{tableDeleteError ? <Alert severity="error" sx={{ mt: 1 }}>{tableDeleteError}</Alert> : null}</DialogContent><DialogActions><Button disabled={deletingTableExecution} onClick={() => setTableDelete(null)}>Cancel</Button><Button color="error" disabled={deletingTableExecution} onClick={() => void deleteFromTable()} variant="contained">{deletingTableExecution ? "Deleting…" : "Delete execution"}</Button></DialogActions></Dialog></>;
}
